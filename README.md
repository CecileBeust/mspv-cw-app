# Multiscale Pathway Viewer — Cytoscape Web

Expand and fold Reactome pathway hierarchies inside [Cytoscape Web](https://web.cytoscape.org).

Reactome networks carry containment alongside everything else: a pathway node is
connected to its subpathways by `abstraction:IsAComponentOf` edges. This app
reads those edges and gives you three right-click actions on a node — collapse
everything beneath it, expand one level, or expand the whole hierarchy. Nodes
are hidden with a `nodeVisibility` bypass rather than deleted, so every fold is
reversible.

| Field | Value |
|---|---|
| Federation name | `multiscalePathwayViewer` (from `cyweb.id` in `package.json`) |
| Dev server port | `6601` (from `cyweb.port` in `package.json`) |
| Dev entry point | `http://localhost:6601/remoteEntry.js` |

The build is **Vite + [`@cytoscape-web/app-runtime`](https://www.npmjs.com/package/@cytoscape-web/app-runtime)**
(`defineCyWebApp` in [vite.config.ts](vite.config.ts)). The app's identity — id,
display name, dev port — lives in the `cyweb` block in `package.json` and is
read everywhere else from there: the federation container, the `CyApp` config
via `virtual:cyweb-app-meta`, and the dev install manifest.

---

## Quick start

```bash
# 1. Install dependencies (Node >= 24)
npm install

# 2. Start the dev server
npm run dev
```

The dev server prints the link that installs the app into a running local host
— **nothing in the host repository is edited**:

```
  Cytoscape Web app multiscalePathwayViewer — http://localhost:6601

  Install it into a local host:
  http://localhost:5500/?installApp=http%3A%2F%2Flocalhost%3A6601%2Fcyweb-app.json
```

Start the host (`npm run dev` in a
[cytoscape-web](https://github.com/cytoscape/cytoscape-web) checkout, on :5500),
open that link (or paste `http://localhost:6601/cyweb-app.json` into
**Apps → Manage Apps… → Install from URL**), confirm the install, and enable the
app. The manifest at `/cyweb-app.json` is generated from `package.json` on every
request, so it cannot go stale.

Changes rebuild immediately, but Vite HMR does not cross the federation
boundary — reload the host page to pick them up.

## Other commands

```bash
npm run build       # production build into dist/
npm run build:zip   # the same, plus an App Store zip
npm run verify      # cyweb-app verify — asserts the federation shape of dist/
npm run typecheck   # tsc over app sources, vite.config.ts and tests
npm test            # hierarchy unit tests + app config smoke test
```

---

## What the app does

| Right-click a node → | Effect |
|---|---|
| Collapse all subpathways | Hides every descendant, at any depth |
| Expand direct subpathways | Shows one level of children |
| Expand all subpathways | Shows every descendant of every root pathway |

All three set a `nodeVisibility` bypass (`none` / `visible`) through the Visual
Style API. Nothing is deleted, so the network survives a fold intact.

### Source layout

| File | Role |
|---|---|
| [src/MultiscalePathwayViewerApp.tsx](src/MultiscalePathwayViewerApp.tsx) | The `CyApp` the host loads — identity, resources, `mount()` |
| [src/contextMenus.ts](src/contextMenus.ts) | The three node context menu items |
| [src/pathwayHierarchy.ts](src/pathwayHierarchy.ts) | Builds the parent/child map; pure functions over a `Map` |
| [src/components/PathwayMenuItem.tsx](src/components/PathwayMenuItem.tsx) | The Apps-dropdown entry |
| [src/index.ts](src/index.ts) | The `./AppConfig` module the host imports |

### Hierarchy model

`buildPathwayHierarchy` reads edge direction as **source = child, target =
parent**, and keeps only edges whose `interaction` attribute is
`abstraction:IsAComponentOf`. If your data reverses that direction, swap
`sourceId`/`targetId` in [src/pathwayHierarchy.ts](src/pathwayHierarchy.ts).

A "root" is a node that has children and no parent. Nodes outside the
containment hierarchy are not roots, so expanding never touches them.

---

## The production bundle

`npm run build` produces the deployable **Module Federation remote** in
`dist/`. There are **no hardcoded host URLs** in the artifact:

- The compiled-in entry for the `cyweb` remote is a **sentinel, not a URL**. At
  load time the host publishes its own `remoteEntry.js` location on
  `window.__CYWEB_HOST__`, and the app-runtime's runtime plugin swaps it in — so
  one artifact works against `localhost`, `web.cytoscape.org`, or any other
  deployment.
- Chunk URLs resolve relative to wherever `remoteEntry.js` is served (Module
  Federation `publicPath: 'auto'`), so the app can live at any origin and any
  base path.

`dist/` **is** the bundle: serve the whole folder side by side at one base URL.
`remoteEntry.js` is the ESM container entry the host `import()`s; the exposed
module is `./AppConfig`; `mf-manifest.json` carries the federation metadata that
`npm run verify` checks against.

### Deployment gotchas

- **Shared deps are not bundled.** `react`, `react-dom`, `@mui/material`,
  `@emotion/react` and `@emotion/styled` are shared singletons with
  `import: false`: the remote consumes the **host's** copies. Sources must
  import only the package roots (`'@mui/material'`, never `'@mui/material/Box'`),
  and `@mui/icons-material` is off-limits — inline an SVG instead. The
  `noSharedPayload` build gate fails the build if any of these leak into the
  chunks.
- **Cross-origin serving needs CORS.** The host imports `remoteEntry.js` and its
  chunks cross-origin, so the files must be served with
  `Access-Control-Allow-Origin` (the dev server already sends `*`).
- **The remote type must stay ESM** to match the host's federation runtime.
  `cyweb-app verify` asserts this, along with the sentinel entry and the shared
  singleton records.

---

## Provenance

Ported from the `multiscale-pathway-viewer` workspace in
[CecileBeust/cytoscape-web-app-examples-cb](https://github.com/CecileBeust/cytoscape-web-app-examples-cb),
which built with Webpack Module Federation and hardcoded host URLs. This repo is
the same app on the current toolchain — see [MIGRATION.md](MIGRATION.md) for what
changed and what is still outstanding.

## Trust boundary

An app runs in the **host's** browser context: same origin, DOM, storage and
network identity. There is no sandbox and no signature verification. Install only
apps you trust — and understand that asking someone to install this one asks the
same of them.
