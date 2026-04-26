# Contributing

English | [日本語](./CONTRIBUTING.ja.md)

Thanks for taking the time to improve this project.

This is an unofficial VRChat-related tool for showing current world credits in an OBS browser source. Contributions should preserve that scope: no VRChat login flow, no credential handling, no private account data access, and no behavior that conflicts with VRChat's Terms of Service or Creator Guidelines.

## Development Setup

Install dependencies:

```bash
bun install
```

Run the app in development mode:

```bash
VRCHAT_API_CONTACT=you@example.com bun run dev
```

Build the client:

```bash
bun run build
```

Type-check the server and client:

```bash
bunx tsc -p src/server/tsconfig.json --noEmit
bunx tsc -p src/client/tsconfig.json --noEmit
```

## Before Opening a Pull Request

Please check the following:

- The app still starts with `bun run start` after `bun run build`.
- Server and client type checks pass.
- README behavior remains accurate.
- Any user-facing change is reflected in documentation.
- New API behavior avoids unnecessary requests and handles VRChat API rate limits carefully.

## Code Guidelines

- Keep changes small and focused.
- Prefer existing project patterns over new abstractions.
- Keep shared data contracts in `src/schema.ts`.
- Keep the browser-source UI simple and OBS-friendly.
- Avoid adding dependencies unless they remove meaningful complexity.
- Do not commit personal files such as `.env` or `start.cmd`.

## Style Presets

New bundled style presets are welcome. A good preset should be useful as-is in OBS, easy to override with Custom CSS, and visually distinct from the existing presets.

When proposing a style preset, please include screenshots or short captures that show how it looks in a realistic browser-source size. If the preset is meant for a specific layout, such as a top bar, lower third, compact badge, or large credit card, mention that intended use in the pull request.

## Issues

When filing a bug, include:

- What you expected to happen.
- What actually happened.
- Your OS and Bun version.
- Relevant environment variables, with private values removed.
- Logs or screenshots when useful.

For feature requests, describe the streaming workflow you are trying to support. That context is more useful than only describing a preferred implementation.

## Security and Privacy

Do not post secrets, VRChat credentials, session tokens, private logs, or private user data in issues or pull requests.

If you find a security or privacy problem, report it privately to the maintainer when possible. If no private contact is available, open a minimal issue that describes the affected area without exposing sensitive details.
