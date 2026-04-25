// 実装は後で追加する。

export type WorldChangeHandler = (worldId: string) => void;

export function startLogWatcher(_logPath: string, _onWorldChange: WorldChangeHandler): () => void {
  throw new Error("log-watcher not implemented yet");
}
