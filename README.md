# vrc-world-credit-streaming-overlay

VRChat 配信時に、訪問中ワールドのクレジット（ワールド名・作者名・サムネイル等）を OBS にオーバーレイ表示するツール。

## ステータス

開発初期。サーバ・表示部の雛形を構築済み。VRChat ログ監視は未実装。

## 技術スタック

- ランタイム: Bun
- 言語: TypeScript
- サーバ: Hono
- 通信: Server-Sent Events (SSE)

## ディレクトリ構成

```
src/                サーバ実装
  server.ts         Hono アプリ
  sse.ts            SSE ブロードキャスタ
  vrchat-api.ts     VRChat API クライアント
  log-watcher.ts    ログ監視（未実装）
client/             OBS Browser Source 用 UI
  index.html
  main.ts
  style.css
dist/client/        ビルド出力（gitignore）
```

## 開発

```bash
bun install
bun run dev
```

`http://localhost:3000` をブラウザ or OBS Browser Source で開く。

開発用に手動でワールド情報を流して表示確認するには:

```bash
curl -X POST http://localhost:3000/api/dev/set-world/<world_id>
```

## ビルド

```bash
bun run build
bun run start
```

## ライセンス

未定。
