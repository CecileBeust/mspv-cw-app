# AGENTS.md

Context for coding agents working in this app.

## What this is

A Cytoscape Web app that expands and folds Reactome pathway hierarchies. It is
loaded into the host at runtime through Module Federation, not a standalone
page: `index.html` exists only because a Vite build needs an HTML entry, and the
host never loads it.

The app is three node context menu items. Everything else is scaffolding.

| File | Role |
|---|---|
| `src/MultiscalePathwayViewerApp.tsx` | The `CyApp` — identity, resources, `mount()` |
| `src/contextMenus.ts` | The three context menu items |
| `src/pathwayHierarchy.ts` | Parent/child map; pure functions, fully tested |
| `src/components/PathwayMenuItem.tsx` | Apps-dropdown entry — still template boilerplate |

## App-specific rules

- **Only `abstraction:IsAComponentOf` edges build the hierarchy.** Edge direction
  is source = child, target = parent. Every other edge type is ignored on
  purpose — the same network carries reactions and regulation.
- **Fold by bypass, never by delete.** The menu items set `nodeVisibility` to
  `none` / `visible` through the Visual Style API, so a fold is reversible.
- **`pathwayHierarchy.ts` stays pure.** It takes an `AppContext` and returns
  Maps. That is what lets `test/pathwayHierarchy.test.ts` run without a host —
  anything calling a `cyweb/*` hook cannot be imported outside a browser.
- Read `MIGRATION.md` before changing the build. This repo was ported off
  Webpack, and the outstanding items are listed there.

## Trust boundary — say this out loud before you publish

This app runs in the HOST's browser context: same origin, DOM, storage and
network identity. There is no sandbox, no capability restriction and no
signature verification. An app can read the user's credentials.

That cuts both ways. Install only apps you trust — and understand that asking
someone to install YOURS asks the same of them.

## Rules that are not obvious

- **Every `cyweb/*` API returns `ApiResult<T>`.** Check `result.success` before
  reading `result.data`; the API never throws across the boundary.
- **Identity lives in `package.json`**, in the `cyweb` block, and reaches the code
  through `virtual:cyweb-app-meta`. Never `import packageJson from
  '../package.json'` — that bundles the whole file into the browser.
- **Do not edit `vite.config.ts` beyond the options `defineCyWebApp` takes.** The
  federation wiring it sets up fails in ways that are hard to read, and the
  config owns those fields; touching one fails the build with the path named.
- **Import MUI from the root barrel** — `import { Box } from '@mui/material'`,
  never `'@mui/material/Box'`. The subpath form bundles a second copy of MUI
  instead of using the host's, and the build gate will stop you.
- **Panels and menu items are declared** in `resources`, not registered by hand.
  Use `lazy(() => import(...))` so they load on demand.
- **`unmount()` cleans up only what you added manually** — event listeners,
  timers. Resources and context menu items are the host's to clean up.

## Checks

```bash
npm run typecheck
npm test
npm run build && npx cyweb-app verify
```
