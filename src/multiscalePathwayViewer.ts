import { lazy } from 'react'
import { useTableApi } from 'cyweb/TableApi';
import { useVisualStyleApi } from 'cyweb/VisualStyleApi'
import { VisualPropertyName } from 'cyweb/ApiTypes'
import {buildPathwayHierarchy, getAllDescendants, getDirectChildren, getHierarchyRoots} from './pathwayHierarchy'
import type {
    CyAppWithLifecycle,
    AppContext,
    ResourceDeclaration,
    } from '@cytoscape-web/api-types'

    const version = '0.1.0'

    export const multiscalePathwayViewer: CyAppWithLifecycle = {
    // Must match the `name` in webpack ModuleFederationPlugin
    id: 'multiscalePathwayViewer',
    name: 'Multiscale Pathway Viewer',
    description: 'App for expanding/folding pathway hierarchies from Reactome in Cytoscape Web',
    version,
    apiVersion: '1.0',

    // ── Declarative resource registration ──────────────────────
    // Panels and menu items are declared here.
    // The host registers them automatically — no mount() needed.
    resources: [
        {
        slot: 'apps-menu',
        id: 'MyMenuItem',
        title: 'My Action',
        component: lazy(() => import('./components/MyMenuItem')),
        closeOnAction: true,  // auto-close the dropdown after click
        },
    ],

    // ── Imperative registration (for context menus, events) ────
    mount(context: AppContext): void {
        // Context menu items need access to `context.apis`, so they
        // are registered here instead of in `resources`.

        // COLLAPSE ALL
        // context.apis.contextMenu.addContextMenuItem({
        // label: 'Collapse all',
        // targetTypes: ['node'],
        //     handler: (ctx) => {
        //         const hierarchy = buildPathwayHierarchy(context, ctx.networkId)
        //         const allNodes = context.apis.element.getNodeIds(ctx.networkId)
        //         if (!allNodes.success) return
        //         const roots = getHierarchyRoots(hierarchy, allNodes.data.nodeIds)
        //         const toHide = roots.flatMap((r) => getAllDescendants(hierarchy, r))
        //         if (toHide.length > 0) {
        //             context.apis.visualStyle.setBypass(ctx.networkId, 'nodeVisibility', toHide, 'none')
        //         }
        //         },
        // })
        context.apis.contextMenu.addContextMenuItem({
        label: 'Collapse all subpathways',
        targetTypes: ['node'],
        handler: (ctx) => {
            const hierarchy = buildPathwayHierarchy(context, ctx.networkId)
            const descendants = getAllDescendants(hierarchy, ctx.id!)
            if (descendants.length > 0) {
            context.apis.visualStyle.setBypass(ctx.networkId, 'nodeVisibility', descendants, 'none')
            }
        },
        })
        
        // EXPAND ALL
        context.apis.contextMenu.addContextMenuItem({
        label: 'Expand all subpathways',
        targetTypes: ['node'],
            handler: (ctx) => {
                const hierarchy = buildPathwayHierarchy(context, ctx.networkId)
                const allNodes = context.apis.element.getNodeIds(ctx.networkId)
                if (!allNodes.success) return
                const roots = getHierarchyRoots(hierarchy, allNodes.data.nodeIds)
                const toShow = roots.flatMap((r) => getAllDescendants(hierarchy, r))
                if (toShow.length > 0) {
                    context.apis.visualStyle.setBypass(ctx.networkId, 'nodeVisibility', toShow, 'visible')
                }
                },
        })

        // EXPAND PATHWAY
        context.apis.contextMenu.addContextMenuItem({
            label: 'Expand direct subpathways',
            targetTypes: ['node'],
                handler: (ctx) => {
                    const hierarchy = buildPathwayHierarchy(context, ctx.networkId)
                    const children = getDirectChildren(hierarchy, ctx.id!)
                    if (children.length > 0) {
                        context.apis.visualStyle.setBypass(ctx.networkId, 'nodeVisibility', children, 'visible')
                    }
            },
        })

        // COLLAPSE PATHWAY
        // context.apis.contextMenu.addContextMenuItem({
        // label: 'Collapse direct subpathways',
        // targetTypes: ['node'],
        // handler: (ctx) => { // right click on a node 
        //     const hierarchy = buildPathwayHierarchy(context, ctx.networkId)
        //     const descendants = getAllDescendants(hierarchy, ctx.id!)
        //     if (descendants.length > 0) {
        //         context.apis.visualStyle.setBypass(ctx.networkId, 'nodeVisibility', descendants, 'none')
        //     }
        //     }
        // },)
    },

    // Only manual cleanup is needed here (e.g. event listeners).
    // Context menu items and resources are auto-cleaned by the host.
    unmount(): void {
        // nothing to clean up in this example
    },
}
