/**
 * Node context menu items, registered during mount().
 *
 * Each function receives the AppContext and registers one item. The host
 * auto-cleans all of them when the app is disabled.
 *
 * All three hide or show nodes with a `nodeVisibility` bypass rather than
 * deleting them, so folding a pathway is reversible.
 */
import type { AppContext } from 'cyweb/ApiTypes'

import {
  buildPathwayHierarchy,
  getAllDescendants,
  getDirectChildren,
  getHierarchyRoots,
} from './pathwayHierarchy'

/** Right-click a pathway node → hide every subpathway beneath it, at any depth. */
export function registerCollapseAllSubpathways(context: AppContext): void {
  context.apis.contextMenu.addContextMenuItem({
    label: 'Collapse all subpathways',
    targetTypes: ['node'],
    handler: (ctx) => {
      const hierarchy = buildPathwayHierarchy(context, ctx.networkId)
      const descendants = getAllDescendants(hierarchy, ctx.id!)
      if (descendants.length === 0) return

      context.apis.visualStyle.setBypass(
        ctx.networkId,
        'nodeVisibility',
        descendants,
        'none',
      )
    },
  })
}

/** Right-click anywhere → show every subpathway under every root pathway. */
export function registerExpandAllSubpathways(context: AppContext): void {
  context.apis.contextMenu.addContextMenuItem({
    label: 'Expand all subpathways',
    targetTypes: ['node'],
    handler: (ctx) => {
      const hierarchy = buildPathwayHierarchy(context, ctx.networkId)
      const allNodes = context.apis.element.getNodeIds(ctx.networkId)
      if (!allNodes.success) return

      const roots = getHierarchyRoots(hierarchy, allNodes.data.nodeIds)
      const toShow = roots.flatMap((root) => getAllDescendants(hierarchy, root))
      if (toShow.length === 0) return

      context.apis.visualStyle.setBypass(
        ctx.networkId,
        'nodeVisibility',
        toShow,
        'element',
      )
    },
  })
}

/** Right-click a pathway node → show one level of subpathways. */
export function registerExpandDirectSubpathways(context: AppContext): void {
  context.apis.contextMenu.addContextMenuItem({
    label: 'Expand direct subpathways',
    targetTypes: ['node'],
    handler: (ctx) => {
      const hierarchy = buildPathwayHierarchy(context, ctx.networkId)
      const children = getDirectChildren(hierarchy, ctx.id!)
      if (children.length === 0) return

      context.apis.visualStyle.setBypass(
        ctx.networkId,
        'nodeVisibility',
        children,
        'element',
      )
    },
  })
}
