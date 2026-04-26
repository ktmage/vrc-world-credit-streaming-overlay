import { open, readdir } from "node:fs/promises";
import { join } from "node:path";

const JOIN_PATTERN =
  /\[Behaviour\] Joining (wrld_[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})/;
const LOG_FILE_PATTERN = /^output_log_.*\.txt$/;
const DEFAULT_POLL_INTERVAL_MS = 2000;
const WINDOWS_LOG_SUBPATH = ["AppData", "LocalLow", "VRChat", "VRChat"] as const;

export class LogWatcherError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "LogWatcherError";
  }
}

export function loadLogDir(): string {
  const override = process.env.VRCHAT_LOG_DIR;
  if (override) return override;
  const userProfile = process.env.USERPROFILE;
  if (!userProfile) {
    throw new LogWatcherError(
      "VRCHAT_LOG_DIR is not set and USERPROFILE is unavailable. " +
        "Set VRCHAT_LOG_DIR to your VRChat log directory.",
    );
  }
  return join(userProfile, ...WINDOWS_LOG_SUBPATH);
}

export function loadPollIntervalMs(): number {
  const value = process.env.VRCHAT_LOG_POLL_INTERVAL_MS;
  if (!value) return DEFAULT_POLL_INTERVAL_MS;
  const n = Number(value);
  if (!Number.isInteger(n) || n < 1) {
    throw new LogWatcherError(
      `VRCHAT_LOG_POLL_INTERVAL_MS must be a positive integer (ms). Got: ${JSON.stringify(value)}`,
    );
  }
  return n;
}

export type WorldChangeHandler = (worldId: string) => void | Promise<void>;

// VRChat のログ名はゼロ埋めタイムスタンプ入りなので、文字列ソートで時刻順になる。
async function findLatestLog(dir: string): Promise<string | null> {
  const entries = await readdir(dir);
  const matched = entries.filter((name) => LOG_FILE_PATTERN.test(name)).sort();
  return matched.at(-1) ?? null;
}

function findLastWorldId(text: string): string | null {
  let found: string | null = null;
  for (const line of text.split("\n")) {
    const id = line.match(JOIN_PATTERN)?.[1];
    if (id) found = id;
  }
  return found;
}

export async function startLogWatcher(
  logDir: string,
  onWorldChange: WorldChangeHandler,
  pollIntervalMs: number = DEFAULT_POLL_INTERVAL_MS,
): Promise<() => void> {
  let current: { name: string; offset: number } | null = null;
  // チャンクが行途中で切れたときの持ち越し。次回テキストの先頭に連結する。
  let leftover = "";
  let lastEmitted: string | null = null;

  async function readDiff(): Promise<void> {
    if (!current) return;
    const handle = await open(join(logDir, current.name), "r");
    try {
      const stat = await handle.stat();
      if (stat.size <= current.offset) return;

      const buffer = Buffer.alloc(stat.size - current.offset);
      await handle.read(buffer, 0, buffer.length, current.offset);
      current.offset = stat.size;

      const combined = leftover + buffer.toString("utf8");
      const lastNewline = combined.lastIndexOf("\n");
      if (lastNewline === -1) {
        leftover = combined;
        return;
      }
      leftover = combined.slice(lastNewline + 1);

      const worldId = findLastWorldId(combined.slice(0, lastNewline));
      if (worldId && worldId !== lastEmitted) {
        lastEmitted = worldId;
        void Promise.resolve(onWorldChange(worldId)).catch((error) => {
          console.warn(`onWorldChange failed for ${worldId}:`, error);
        });
      }
    } finally {
      await handle.close();
    }
  }

  async function switchTo(filename: string): Promise<void> {
    current = { name: filename, offset: 0 };
    leftover = "";
    await readDiff();
  }

  async function tick(): Promise<void> {
    const latest = await findLatestLog(logDir);
    if (!latest) return;
    if (!current || latest > current.name) {
      await switchTo(latest);
    } else if (latest === current.name) {
      await readDiff();
    }
  }

  await tick();

  const timer = setInterval(() => {
    tick().catch((error) => console.warn("log watcher tick error:", error));
  }, pollIntervalMs);

  return () => clearInterval(timer);
}
