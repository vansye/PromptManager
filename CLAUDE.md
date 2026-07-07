# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev       # Start Vite dev server (port 5173)
npm run build     # tsc + vite build → outputs to dist/
npm run preview   # Preview production build
npm run package:edge  # Build + zip for Edge store submission
npm run lint      # ESLint check (src/*.ts, src/*.tsx)
npm run lint:fix  # ESLint auto-fix
npm run format    # Prettier check
npm run format:fix # Prettier write
npm test          # Vitest (jsdom environment)
npm run test:watch # Vitest watch mode
```

## Architecture

- **Type**: Single-page React 18 browser extension (Manifest V3), no router, no external API calls
- **Build**: Vite 5 + TypeScript 5, output to `dist/` (load as unpacked extension in Chrome/Edge)
- **UI**: Plain CSS with CSS custom properties (`--bg`, `--accent`, etc.), no Tailwind. `lucide-react` icons. Dark theme only.
- **Data**: All state stored locally in IndexedDB via Dexie. No backend or cloud sync.
- **Extension entry**: `public/manifest.json` (MV3 side_panel + background service worker)

## Data Layer (`src/db.ts`)

- Dexie DB `PromotHeroDB` with a single `prompts` table
- Schema versioning: v1 (`++id,title,updatedAt`), v2 adds `tags` index
- `Prompt` interface: `{ id?: number; title: string; content: string; tags: string[]; updatedAt: Date }`
- Categories stored in `localStorage` under key `promptmanager:categories`, not in IndexedDB

## Key Patterns

- **Reactive queries**: Use `useLiveQuery` from `dexie-react-hooks` for auto-updating list
- **Variable syntax**: `{{variableName}}` in prompt content, extracted via regex `/\{\{(.*?)\}\}/g`
- **Undo**: Delete operations save snapshots in state, Toast shows "撤销" button to restore
- **Clipboard**: Clicking a prompt card copies content and opens it in the editor simultaneously
- **Collapse**: `Ctrl+Shift+P` toggles collapsed mode (minimal launcher button)
- **Error boundary**: `RootErrorBoundary` in `src/main.tsx` catches render errors
- **UI language**: Chinese (all labels, placeholders, toast messages)

## Important Notes

- Categories are plain `string[]` in localStorage, not a DB table. Each prompt's `tags` field references category names.
- No routing library — the entire UI is a single `App` component with conditional rendering for collapsed/expanded state.
- When modifying the Dexie schema, always add a new version number (do not modify existing versions).
- The extension uses `side_panel` API — `dist/index.html` renders inside the browser's side panel, not a popup.
- `public/background.js` is the service worker (copied verbatim to dist, not processed by Vite).
