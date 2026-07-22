// pathwayEdgeRouting.ts
import type { AppContext, IdType } from '@cytoscape-web/api-types'
import { buildPathwayHierarchy, PathwayHierarchy } from './pathwayHierarchy'

const EDGE_TYPE_COLUMN = 'interaction'
const NEXT_STEP = 'abstraction:NextStepPathway'

interface OriginalEdge {
    sourceId: IdType
    targetId: IdType
}

// Per-network caches (module-level state, keyed by networkId)
const originalNextStepEdgesByNetwork = new Map<IdType, Map<IdType, OriginalEdge>>()
const hiddenNodesByNetwork = new Map<IdType, Set<IdType>>()

function getHiddenNodes(networkId: IdType): Set<IdType> {
    let set = hiddenNodesByNetwork.get(networkId)
    if (!set) { set = new Set(); hiddenNodesByNetwork.set(networkId, set) }
    return set
}

/** Captures each NextStepPathway edge's endpoints exactly once, before any moveEdge call ever touches it. */
function captureOriginalNextStepEdges(context: AppContext, networkId: IdType): Map<IdType, OriginalEdge> {
    let cache = originalNextStepEdgesByNetwork.get(networkId)
    if (cache) return cache
    cache = new Map()
    const edgeIdsResult = context.apis.element.getEdgeIds(networkId)
    if (edgeIdsResult.success) {
        for (const edgeId of edgeIdsResult.data.edgeIds) {
        const edgeResult = context.apis.element.getEdge(networkId, edgeId)
        if (edgeResult.success && edgeResult.data.attributes[EDGE_TYPE_COLUMN] === NEXT_STEP) {
            cache.set(edgeId, { sourceId: edgeResult.data.sourceId, targetId: edgeResult.data.targetId })
        }
        }
    }
    originalNextStepEdgesByNetwork.set(networkId, cache)
    return cache
}

/** Walks up IsAComponentOf parents until it finds a node that's currently visible. */
function resolveVisibleAncestor(nodeId: IdType, hierarchy: PathwayHierarchy, hidden: Set<IdType>): IdType {
    let current = nodeId
    while (hidden.has(current)) {
        const parent = hierarchy.parentOf.get(current)
        if (parent === undefined) break // orphaned / malformed data — bail out rather than loop forever
        current = parent
    }
    return current
}

/**
 * Recomputes where every abstraction:NextStepPathway edge should currently point
 * and reconnects it via moveEdge if needed. Call this after every collapse/expand.
 */
export function updateNextStepEdgeRouting(context: AppContext, networkId: IdType): void {
    const hierarchy = buildPathwayHierarchy(context, networkId)
    const hidden = getHiddenNodes(networkId)
    const originals = captureOriginalNextStepEdges(context, networkId)

    for (const [edgeId, orig] of originals) {
        const newSource = resolveVisibleAncestor(orig.sourceId, hierarchy, hidden)
        const newTarget = resolveVisibleAncestor(orig.targetId, hierarchy, hidden)

        if (newSource === newTarget) {
        // Both ends collapsed into the same visible ancestor — hide rather than draw a self-loop.
        context.apis.visualStyle.setBypass(networkId, 'edgeVisibility', [edgeId], 'none')
        continue
        }

        const currentEdge = context.apis.element.getEdge(networkId, edgeId)
        if (!currentEdge.success) continue
        if (currentEdge.data.sourceId !== newSource || currentEdge.data.targetId !== newTarget) {
        context.apis.element.moveEdge(networkId, edgeId, newSource, newTarget)
        }
        context.apis.visualStyle.deleteBypass(networkId, 'edgeVisibility', [edgeId])
    }
    }

    /** Call after hiding nodes, to keep the hidden-node registry in sync. */
    export function markNodesHidden(networkId: IdType, nodeIds: IdType[]): void {
    const set = getHiddenNodes(networkId)
    nodeIds.forEach((id) => set.add(id))
    }

    /** Call after showing nodes, to keep the hidden-node registry in sync. */
    export function markNodesVisible(networkId: IdType, nodeIds: IdType[]): void {
    const set = getHiddenNodes(networkId)
    nodeIds.forEach((id) => set.delete(id))
}