import { open, readdir, watch } from "node:fs/promises";
import { join } from "node:path";

const JOIN_PATTERN =
  /\[Behaviour\] Joining (wrld_[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})/;
const LOG_FILE_PATTERN = /^output_log_.*\.txt$/;
const DEBOUNCE_MS = 300;
const MAX_WAIT_MS = 1000;
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
        "Set VRCHAT_LOG_DIR to your VRChat log directory in .env.",
    );
  }
  return join(userProfile, ...WINDOWS_LOG_SUBPATH);
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
): Promise<() => void> {
  let current: { name: string; offset: number } | null = null;
  // チャンクが行途中で切れたときの持ち越し。次回テキストの先頭に連結する。
  let leftover = "";
  let lastEmitted: string | null = null;
  let debounceTimer: ReturnType<typeof setTimeout> | null = null;
  let firstEventAt: number | null = null;
  const abort = new AbortController();

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

  // 書き込みが止んだら DEBOUNCE_MS 後、止まなくても初回から MAX_WAIT_MS で強制発火。
  function scheduleRead(): void {
    const now = Date.now();
    if (firstEventAt === null) firstEventAt = now;
    if (debounceTimer) clearTimeout(debounceTimer);
    const delay = Math.max(0, Math.min(DEBOUNCE_MS, MAX_WAIT_MS - (now - firstEventAt)));
    debounceTimer = setTimeout(() => {
      debounceTimer = null;
      firstEventAt = null;
      readDiff().catch((error) => console.warn("log watcher read error:", error));
    }, delay);
  }

  async function handleEvent(filename: string | null | undefined): Promise<void> {
    if (filename && !LOG_FILE_PATTERN.test(filename)) return;
    const target = filename ?? (await findLatestLog(logDir));
    if (!target) return;

    if (!current || target > current.name) {
      await switchTo(target);
    } else if (target === current.name) {
      scheduleRead();
    }
  }

  const initial = await findLatestLog(logDir);
  if (initial) await switchTo(initial);

  void (async () => {
    try {
      for await (const event of watch(logDir, { signal: abort.signal })) {
        await handleEvent(event.filename);
      }
    } catch (error) {
      if ((error as { name?: string }).name === "AbortError") return;
      console.error("log watcher fatal:", error);
    }
  })();

  return () => {
    abort.abort();
    if (debounceTimer) clearTimeout(debounceTimer);
  };
}
