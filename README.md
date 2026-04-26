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
src/
  schema.ts            サーバ／クライアント共有のスキーマ・定数
  server/              サーバ実装
    index.ts           Hono アプリ
    sse.ts             SSE ブロードキャスタ
    vrchat-api.ts      VRChat API クライアント
    log-watcher.ts     ログ監視（未実装）
  client/              ブラウザソース用 UI
    index.html
    main.ts
styles/                同梱スタイル（?style=<name> で切替）
  card.css
  topbar.css
dist/client/           ビルド出力（gitignore）
```

## スタイル

ブラウザソース URL の `?style=<name>` で見た目を切り替える。未指定時は CSS 無しの素の HTML:

- `?style=card` — 大きめのクレジットカード
- `?style=topbar` — 画面上部中央の通知風ピル

さらに調整したい場合は OBS の Custom CSS 欄で個別ルールを上書きする。

## 開発

`.env.example` を `.env` にコピーして、`VRCHAT_API_CONTACT` に連絡先メールアドレスを設定する。VRChat [Creator Guidelines](https://hello.vrchat.com/creator-guidelines#api-usage) により、API 利用アプリケーションは User-Agent ヘッダに連絡先を含めることが必須。

```bash
cp .env.example .env
# .env を編集
bun install
bun run dev
```

起動後にコンソールへ表示されるブラウザソース URL（`http://localhost:3000`）を、ブラウザまたは配信ソフトのブラウザソースで開く。開発用ポートは `package.json` の `dev:server` スクリプトで `PORT=3000` を指定している。

開発用に手動でワールド情報を流して表示確認するには:

```bash
curl -X POST http://localhost:3000/api/dev/set-world/<world_id>
```

## ビルド・実行

```bash
bun run build
PORT=3000 bun run start
```

`PORT` は必須。空き番号を指定する。

## ライセンス

未定。
