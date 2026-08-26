/**
 * Multiscale Pathway Viewer — expand and fold Reactome pathway hierarchies.
 *
 * The app's work happens in three node context menu items registered in
 * mount(); see src/contextMenus.ts. They hide and show subpathways by setting
 * a `nodeVisibility` bypass, using the parent/child map that
 * src/pathwayHierarchy.ts derives from `abstraction:IsAComponentOf` edges.
 */
import { lazy } from 'react'

import { AppContext, CyAppWithLifecycle } from 'cyweb/ApiTypes'
// This app's identity, from the `cyweb` block and the standard fields in
// package.json — the one place it is written. The build supplies it here.
//
// Do NOT `import packageJson from '../package.json'`: that pulls the whole
// file, devDependencies and all, into your browser bundle to read one string.
import { description, displayName, id, version } from 'virtual:cyweb-app-meta'

import {
  registerCollapseAllSubpathways,
  registerExpandAllSubpathways,
  registerExpandDirectSubpathways,
} from './contextMenus'

export const MultiscalePathwayViewerApp: CyAppWithLifecycle = {
  // Change these in package.json, not here.
  id,
  name: displayName,
  description,
  version,
  apiVersion: '1.0',

  // Panels and menu items are declared, not registered: the host renders them
  // for you, and cleans them up when the app is disabled.
  resources: [
    {
      slot: 'apps-menu',
      id: 'PathwayMenuItem',
      title: 'My Action',
      component: lazy(() => import('./components/PathwayMenuItem')),
      closeOnAction: true, // Auto-close the dropdown after the click.
    },
  ],

  mount(context: AppContext): void {
    // Context menu items are registered here because their handlers need
    // context.apis. The host auto-cleans them when the app is disabled, so
    // unmount() does not have to.
    registerCollapseAllSubpathways(context)
    registerExpandAllSubpathways(context)
    registerExpandDirectSubpathways(context)
  },

  unmount(): void {
    // Only manual cleanup belongs here. Resources and context menu items are
    // cleaned up by the host.
  },
}
