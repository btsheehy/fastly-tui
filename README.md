# fastly-tui

Fastly TUI is a Bun + OpenTUI terminal app that aims to replace common workflows in the Fastly web dashboard with a fast, keyboard-driven interface powered by the Fastly API.

## Purpose

- Provide a snappy, keyboard-first way to explore and manage Fastly services.
- Reduce dependency on the web dashboard by surfacing key resources and actions directly in the terminal.
- Keep API access centralized, typed, and easy to extend as coverage grows.

## What it does today

This project is still early-stage, but already includes:

- Services command palette with filterable selection.
- Service detail view with versions, VCLs, domains, backends, and snippets.
- Version actions:
  - Clone (with confirmation)
  - Activate (with confirmation)
- Detail screens:
  - Snippets: list + metadata + content, create/edit via `$EDITOR`
  - Backends: list + metadata, create/edit form
  - VCLs: list + content viewer
- API error logging to `/tmp/fastly-tui-api.log` (Fastly SDK superagent hook).

## Code structure

- `src/index.tsx` - App entry, renderer setup, global keyboard handlers
- `src/state.tsx` - Global state + reducer for navigation and UI state
- `src/fastly-client.ts` - Fastly API wrappers used by the UI
- `src/api-logger.ts` - SDK-level API error logging
- `src/screens/`
  - `services-palette.tsx` - Service selection screen
  - `service-screen.tsx` - Service detail layout + version actions
  - `snippet-screen.tsx` - Snippet detail + editing via `$EDITOR`
  - `backend-screen.tsx` - Backend detail + editing/creation form
  - `vcl-screen.tsx` - VCL detail + content viewer
- `fastly.d.ts` - Fastly SDK type augmentations used by the app

## Current state

- Status: early-stage MVP
- Focus: service exploration, version actions, and snippet/backend/VCL details
- Editing is currently supported for:
  - Backends (form-based)
  - Snippets (metadata + content via `$EDITOR`)

## Setup

```bash
bun install
```

## Run

```bash
FASTLY_API_TOKEN=... bun run dev
```

## Notes

- `$EDITOR` must be set to edit snippet content.
- Bun automatically loads `.env`, so you can also store `FASTLY_API_TOKEN` there.

## Roadmap ideas

- Domain detail/editing
- Conditions, cache settings, and additional VCL tooling
- Improved status/alerts and diagnostics
- More keyboard shortcuts and command palette actions
