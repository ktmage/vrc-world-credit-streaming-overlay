# vrc-world-credit-streaming-overlay

VRChat 配信時に、訪問中ワールドのクレジット（ワールド名・作者名・サムネイル等）を OBS にオーバーレイ表示するツール。

## ステータス

開発初期。サーバ・表示部・VRChat ログ監視まで実装済み。

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
    log-watcher.ts     VRChat ログ監視
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

## 使い方

VRChat と同じ Windows PC で動かす想定。

1. [Bun](https://bun.sh) をインストールする。
2. このリポジトリを clone する。
3. `.env.example` を `.env` にコピーし、`VRCHAT_API_CONTACT` に連絡先メールアドレスを設定する。VRChat [Creator Guidelines](https://hello.vrchat.com/creator-guidelines#api-usage) により、API 利用時は User-Agent に連絡先を含めることが必須。
4. ビルドして起動する:

   ```bash
   bun install
   bun run build
   PORT=3000 bun run start
   ```

   `PORT` は空き番号を指定する。

5. 配信ソフトでブラウザソースを追加し、URL に `?style=` パラメータを付けて開く:

   ```
   http://localhost:3000/?style=card
   ```

ログディレクトリは Windows 既定パス（`%USERPROFILE%\AppData\LocalLow\VRChat\VRChat`）を自動で参照する。別の場所にある場合は `.env` の `VRCHAT_LOG_DIR` で上書きする。

## 開発

```bash
cp .env.example .env
# .env を編集
bun install
bun run dev
```

`bun run dev` はクライアントのビルド監視とサーバ起動（`PORT=3000`）を同時に走らせる。

ログを介さず手動でワールド情報を流して表示確認するには:

```bash
curl -X POST http://localhost:3000/api/dev/set-world/<world_id>
```

## ライセンス

未定。
