import type { AppContext, IdType } from '@cytoscape-web/api-types'

const EDGE_TYPE_COLUMN = 'interaction'
const IS_A_COMPONENT_OF = 'abstraction:IsAComponentOf'

export interface PathwayHierarchy {
  childrenOf: Map<IdType, IdType[]>   // parent -> direct children (components)
  parentOf: Map<IdType, IdType>       // child -> its parent
}

/**
 * Builds a parent/child map using ONLY abstraction:IsAComponentOf edges.
 * Assumes edge direction is source = component (child), target = container (parent).
 * If your data is the reverse, swap sourceId/targetId below.
 */
export function buildPathwayHierarchy(
    context: AppContext,
    networkId: IdType,
    ): PathwayHierarchy {
    const childrenOf = new Map<IdType, IdType[]>()
    const parentOf = new Map<IdType, IdType>()

    const edgeIdsResult = context.apis.element.getEdgeIds(networkId)
    if (!edgeIdsResult.success) return { childrenOf, parentOf }

    for (const edgeId of edgeIdsResult.data.edgeIds) {
        const edgeResult = context.apis.element.getEdge(networkId, edgeId)
        if (!edgeResult.success) continue
        const { sourceId, targetId, attributes } = edgeResult.data
        if (attributes[EDGE_TYPE_COLUMN] !== IS_A_COMPONENT_OF) continue

        const child = sourceId
        const parent = targetId

        parentOf.set(child, parent)
        if (!childrenOf.has(parent)) childrenOf.set(parent, [])
        childrenOf.get(parent)!.push(child)
    }

    return { childrenOf, parentOf }
    }

    /** All descendants (any depth) of nodeId, following only IsAComponentOf edges. */
    export function getAllDescendants(hierarchy: PathwayHierarchy, nodeId: IdType): IdType[] {
    const result: IdType[] = []
    const queue = [...(hierarchy.childrenOf.get(nodeId) ?? [])]
    while (queue.length > 0) {
        const current = queue.shift()!
        result.push(current)
        const kids = hierarchy.childrenOf.get(current)
        if (kids) queue.push(...kids)
    }
    return result
    }

    /** Direct children only (one level), following only IsAComponentOf edges. */
    export function getDirectChildren(hierarchy: PathwayHierarchy, nodeId: IdType): IdType[] {
    return hierarchy.childrenOf.get(nodeId) ?? []
    }

    /** Nodes with no parent under IsAComponentOf — the top-level pathway(s). */
    export function getHierarchyRoots(hierarchy: PathwayHierarchy, allNodeIds: IdType[]): IdType[] {
    return allNodeIds.filter((id) => !hierarchy.parentOf.has(id) && hierarchy.childrenOf.has(id))
}