# vrc-world-credit-streaming-overlay

English | [日本語](./README.ja.md)

A tool that displays credits (world name, author, thumbnail, etc.) of the VRChat world you are currently visiting as an OBS overlay during streaming.

> **Unofficial tool** — This project is not an official product of VRChat Inc., and has no affiliation, partnership, or endorsement relationship with them. It is an unofficial personal project. "VRChat" is a trademark of VRChat Inc., and this repository references the name solely for identification purposes. Users must comply with the VRChat [Terms of Service](https://hello.vrchat.com/legal) and [Creator Guidelines](https://hello.vrchat.com/creator-guidelines).

## Features

- **Does NOT log in to VRChat** — Never asks for your account email, password, or 2FA code. Your credentials never pass through this tool.
- **Compliant with the official VRChat API guidelines** — Designed in accordance with the API usage rules in the [Creator Guidelines](https://hello.vrchat.com/creator-guidelines#api-usage) (details below).
- **Does NOT depend on VRCX or other external tools** — Works on its own. It reads the log files VRChat itself writes.

## Guideline Compliance

The tool complies with the API usage rules in the VRChat [Creator Guidelines](https://hello.vrchat.com/creator-guidelines#api-usage) as follows:

- **Does not request credentials** — No login UI, no token storage, no session data retrieval.
- **Proper User-Agent** — Identifies itself in the `appName/version contact` format as specified by VRChat (`VRCHAT_API_CONTACT` makes the contact mandatory).
- **Does not hammer after a 429** — The moment a rate limit is hit, the app internally locks itself and never calls the API again until restart.
- **No fixed-interval API polling** — Event-driven: a single call only at the moment a world transition is detected. Does not poll on a per-second/per-minute clock.
- **Appropriate caching** — Revisits to the same world are returned from the in-memory cache, avoiding duplicate API queries.
- **No upload proxying or impersonation** — Does not have any feature to act on behalf of another account. Does not have any avatar/world upload feature.
- **Public world info only** — Calls only `GET /api/1/worlds/{id}`, which is retrievable without authentication. Never accesses private or friend-only information.

## Usage

Intended to run on the same Windows PC as VRChat.

1. Install [Bun](https://bun.sh).
2. Clone this repository.
3. Install dependencies and build the client:

   ```powershell
   bun install
   bun run build
   ```

4. Copy `start.cmd.example` to `start.cmd` and replace `VRCHAT_API_CONTACT` with your own contact email address. The VRChat [Creator Guidelines](https://hello.vrchat.com/creator-guidelines#api-usage) require including a contact in the User-Agent when using the API.
5. Double-click `start.cmd` to launch.
6. In your streaming software, add a Browser Source and open it with the `?style=` parameter:

   ```
   http://localhost:3000/?style=card
   ```

## Styles

Switch the appearance with `?style=<name>` in the browser source URL. If unspecified, the page renders as raw HTML with no CSS.

### `?style=card` — Larger credit-card style

![card style](./assets/screenshots/card.png)

### `?style=topbar` — Notification-style pill at the top center of the screen

![topbar style](./assets/screenshots/topbar.png)

To tweak further, override individual rules in OBS's Custom CSS field. See the next section for details.

## Custom CSS

Anything you write into OBS's Browser Source "Custom CSS" field is layered on top of the bundled style (later wins). If you'd rather build everything from raw HTML yourself, just open the page without `?style=`.

### DOM structure

The overlay is built from the following fixed IDs / classes. Use them as selectors. The actual markup is at [`src/client/index.html`](./src/client/index.html).

```html
<div id="overlay">
  <img id="thumb" />              <!-- World thumbnail. Gets `hidden` attribute when imageUrl is absent -->
  <div id="meta">
    <div id="world-name">…</div>  <!-- World name -->
    <div id="author-name">
      <span class="by">by </span> <!-- Useful when you want to dim only the "by " prefix -->
      …                           <!-- Author name (text node) -->
    </div>
  </div>
</div>
```

If you'd like to read the bundled styles as a starting point for your overrides, see [`styles/card.css`](./styles/card.css) / [`styles/topbar.css`](./styles/topbar.css).

### OBS Custom CSS examples

```css
/* Change text color and font */
#world-name { color: #ffd86b; font-family: "Noto Serif JP", serif; }
#author-name { color: #c8b39a; }

/* Make the thumbnail small and round */
#thumb { width: 64px; height: 64px; border-radius: 50%; }

/* Pin the overlay to the bottom-right corner */
#overlay {
  position: fixed;
  inset: auto 24px 24px auto;  /* top auto / right 24px / bottom 24px / left auto */
}

/* Disable the entry animation */
#overlay { animation: none; }

/* Hide the "by " prefix */
#author-name .by { display: none; }
```

> When overriding a property the bundled style sets, raise selector specificity or add `!important`.

## Environment variables

Set these in `start.cmd`.

- `VRCHAT_API_CONTACT` (required) — Contact email to include in the VRChat API User-Agent. Required by the Creator Guidelines.
- `PORT` — Server port number (default `3000`).
- `VRCHAT_LOG_DIR` — VRChat log directory (default `%USERPROFILE%\AppData\LocalLow\VRChat\VRChat`). Specify only when you want to point at a different location.
- `VRCHAT_LOG_POLL_INTERVAL_MS` — Log polling interval in milliseconds (default `2000`).

---

## Tech stack

- Runtime: Bun
- Language: TypeScript
- Server: Hono
- Transport: Server-Sent Events (SSE)

## Directory layout

```
src/
  schema.ts            Schemas/constants shared between server and client
  server/              Server implementation
    index.ts           Hono app
    sse.ts             SSE broadcaster
    vrchat-api.ts      VRChat API client
    log-watcher.ts     VRChat log watcher
  client/              Browser-source UI
    index.html
    main.ts
styles/                Bundled styles (switched by ?style=<name>)
  card.css
  topbar.css
dist/client/           Build output (gitignored)
```

## Development

```bash
bun install
VRCHAT_API_CONTACT=<your-email> bun run dev
```

`bun run dev` runs the client build watcher and the server concurrently.

To push world info manually for display verification without going through the log:

```bash
curl -X POST http://localhost:3000/api/dev/set-world/<world_id>
```

## License

[MIT License](./LICENSE) + Additional Condition (VRChat Policy Compliance).

The base is MIT, so use, copy, modification, redistribution, and sale are freely permitted. However, as an additional condition, the software may only be used **within the scope permitted by the VRChat Terms of Service and Creator Guidelines ([hello.vrchat.com](https://hello.vrchat.com))**. The moment a user violates the VRChat policies, the rights granted by this license terminate automatically.

The position behind this license is that this tool exists on top of the VRChat ecosystem, and the scope of what's permitted should be defined by VRChat itself. The additional condition does not impose extra independent restrictions beyond the VRChat policies. Conversely, it does not permit usage looser than what the VRChat policies allow.
