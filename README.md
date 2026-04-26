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
3. 依存をインストールしてクライアントをビルドする:

   ```powershell
   bun install
   bun run build
   ```

4. `start.cmd.example` を `start.cmd` にコピーし、`VRCHAT_API_CONTACT` を自分の連絡先メールアドレスに書き換える。VRChat [Creator Guidelines](https://hello.vrchat.com/creator-guidelines#api-usage) により、API 利用時は User-Agent に連絡先を含めることが必須。
5. `start.cmd` をダブルクリックして起動する。
6. 配信ソフトでブラウザソースを追加し、URL に `?style=` パラメータを付けて開く:

   ```
   http://localhost:3000/?style=card
   ```

ログ場所は既定で `%USERPROFILE%\AppData\LocalLow\VRChat\VRChat` を参照する。別の場所を見せたい場合は `start.cmd` の `VRCHAT_LOG_DIR` のコメントを外して指定する。

## 開発

```bash
bun install
VRCHAT_API_CONTACT=<your-email> bun run dev
```

`bun run dev` はクライアントのビルド監視とサーバ起動を同時に走らせる。

ログを介さず手動でワールド情報を流して表示確認するには:

```bash
curl -X POST http://localhost:3000/api/dev/set-world/<world_id>
```

## ライセンス

未定。
