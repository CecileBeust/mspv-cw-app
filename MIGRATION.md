# Port from the webpack fork

This repo is `multiscale-pathway-viewer` from
[CecileBeust/cytoscape-web-app-examples-cb](https://github.com/CecileBeust/cytoscape-web-app-examples-cb)
(commit `a188bc2`), rebuilt on the current Cytoscape Web app toolchain. The fork
branched from `cytoscape/cytoscape-web-app-examples` at `54bb36f` (2026-04-04),
before that repo's Vite migration, so it was still Webpack Module Federation.

## What changed

| Old | New |
|---|---|
| `webpack.config.js`, 79 lines | `vite.config.ts`, one line: `defineCyWebApp(import.meta.url)` |
| `webpack` + `ts-loader` + `webpack-dev-server` | `vite` 8 + `@vitejs/plugin-react` |
| `PROD_CYWEB = 'cyweb@https://web.cytoscape.org/remoteEntry.js'` | sentinel entry; the host publishes its own on `window.__CYWEB_HOST__` |
| `LOCAL_CYWEB` hardcoded to :5500 | `devHostPageUrl` default, overridable with `CYWEB_DEV_HOST` |
| federation `name`, `CyApp.id`, `version`, port: four literals in three files | one `cyweb` block in `package.json`, read via `virtual:cyweb-app-meta` |
| dev port 3333 (collides with network-statistics) | 6601 |
| one loose `tsconfig.json`, `strict` off | `tsconfig.json` / `.node.json` / `.test.json`, `strict` on |
| no HTML entry | `index.html` stub — a Vite build needs one; the host never loads it |
| no dependencies declared; built only by root hoisting | full `peerDependencies` + `devDependencies`; installs standalone |
| no install path | dev server serves `/cyweb-app.json`; no host repo edit |
| no tests, no build verification | `npm test` (11) and `cyweb-app verify` (27 checks) |

## Defects fixed on the way

- **MUI subpath imports.** `@mui/material/Typography` and `@mui/material/Box`
  miss the `@mui/material` share key, which the federation plugin matches
  exactly, and bundle a second copy of MUI and Emotion into the remote — a
  second Emotion cache, duplicated styles, broken theming. Now root-barrel
  imports; the SDK's `noSharedPayload` gate enforces it.
- **Dead imports.** `multiscalePathwayViewer.ts` imported `useTableApi`,
  `useVisualStyleApi` and `VisualPropertyName` and used none of them.
- **Orphaned template files.** `TemplateApp.tsx`, `contextMenus.ts`
  (`registerSelectNeighbors`) and `TemplatePanel.tsx` were copied from the
  project template and never referenced — `src/index.ts` exported a different
  app object. Removed.
- **Context menus inline in the app config.** The three registrations lived in
  `mount()`; they now live in `src/contextMenus.ts`, one function each, which is
  the shape the current template uses and what makes them testable.

## Behavior is unchanged

The three context menu items do exactly what they did: same labels, same edge
filter, same `nodeVisibility` bypass values. `pathwayHierarchy.ts` is the same
algorithm, reformatted, with tests added around it.

## Still outstanding

- **The Apps-menu item is template boilerplate.** `PathwayMenuItem` still
  creates a three-node "Template Network" and is titled "My Action" — carried
  over verbatim from the fork, where it was the untouched scaffold action. It
  has nothing to do with pathway hierarchies. Either give it a real action or
  drop the `apps-menu` resource.
- **`buildPathwayHierarchy` is N+1.** It calls `getEdge()` once per edge to read
  the `interaction` attribute. `elementApi.getEdges()` returns all edges in one
  call but carries no attributes; `tableApi.getTable(networkId, 'edge')` returns
  every row in one call. Combining the two would make it two calls instead of
  2N. Left alone here because it is a behavior change, not a build change.
- **The app has no panel.** The fork's `TemplatePanel` was never registered, so
  nothing was lost by deleting it — but a panel listing the hierarchy roots and
  their collapse state is the obvious next feature.
- **`@emotion/styled` build warning.** `[Module Federation] Shared dependency
  "@emotion/styled" has import: false but is not installed locally.` The package
  *is* in `node_modules`; this is the federation plugin's own check misfiring and
  it comes straight from the scaffold. Harmless — the app imports no named
  exports from it.
