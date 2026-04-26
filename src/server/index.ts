import { Hono } from "hono";
import { streamSSE } from "hono/streaming";
import { serveStatic } from "hono/bun";
import { broadcast, subscribe } from "./sse";
import { createVrchatApi, loadContact, VrchatApiError } from "./vrchat-api";
import { loadLogDir, loadPollIntervalMs, startLogWatcher } from "./log-watcher";
import { WORLD_CHANGED_EVENT } from "@/schema";

const vrchat = createVrchatApi(loadContact());

await startLogWatcher(
  loadLogDir(),
  async (worldId) => {
    try {
      const world = await vrchat.fetchWorldInfo(worldId);
      broadcast(WORLD_CHANGED_EVENT, world);
    } catch (error) {
      console.warn(`failed to fetch world ${worldId}:`, error);
    }
  },
  loadPollIntervalMs(),
);

const app = new Hono();

app.get("/events", (context) =>
  streamSSE(context, async (stream) => {
    const unsubscribe = subscribe((event, data) => {
      stream.writeSSE({ event, data: JSON.stringify(data) }).catch((error) => {
        console.warn("failed to write SSE, unsubscribing:", error);
        unsubscribe();
      });
    });

    await new Promise<void>((resolve) =>
      stream.onAbort(() => {
        unsubscribe();
        resolve();
      }),
    );
  }),
);

// 開発用: 任意の world ID を手動で配信して表示部の動作確認に使う
app.post("/api/dev/set-world/:id", async (context) => {
  const id = context.req.param("id");
  try {
    const world = await vrchat.fetchWorldInfo(id);
    broadcast(WORLD_CHANGED_EVENT, world);
    return context.json({ ok: true });
  } catch (error) {
    if (error instanceof VrchatApiError) {
      return context.json({ error: error.message }, error.status === 404 ? 404 : 502);
    }
    throw error;
  }
});

app.use("/styles/*", serveStatic({ root: "./" }));
app.use("/*", serveStatic({ root: "./dist/client" }));

class InvalidPortError extends Error {
  constructor(value: string | undefined) {
    super(
      `PORT environment variable must be an integer between 1 and 65535. ` +
        `Got: ${JSON.stringify(value)}. ` +
        `Set it via .env, the shell (e.g. \`PORT=3000 bun start\`), or the dev script.`,
    );
    this.name = "InvalidPortError";
  }
}

function loadPort(): number {
  const value = process.env.PORT;
  const port = Number(value);
  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    throw new InvalidPortError(value);
  }
  return port;
}

const port = loadPort();
console.log(`VRChat World Credit Overlay`);
console.log(`Browser source URL: http://localhost:${port}`);

export default { port, fetch: app.fetch };
