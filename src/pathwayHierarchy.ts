/**
 * Parent/child map over a Reactome pathway network.
 *
 * Only `abstraction:IsAComponentOf` edges are followed — every other edge type
 * in the network is ignored, so the same network can carry reactions and
 * regulation alongside the containment hierarchy.
 */
import type { AppContext, IdType } from 'cyweb/ApiTypes'

const EDGE_TYPE_COLUMN = 'interaction'
const IS_A_COMPONENT_OF = 'abstraction:IsAComponentOf'

export interface PathwayHierarchy {
  /** parent → its direct children (components) */
  childrenOf: Map<IdType, IdType[]>
  /** child → its parent */
  parentOf: Map<IdType, IdType>
}

/**
 * Builds the parent/child map from the network's IsAComponentOf edges.
 *
 * Edge direction is read as source = component (child), target = container
 * (parent). If your data is the reverse, swap sourceId/targetId below.
 *
 * Cost: one getEdge() call per edge. `elementApi.getEdges()` returns all edges
 * in one call but carries no attributes, so it cannot filter on `interaction`.
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

/** Every descendant of nodeId, at any depth. */
export function getAllDescendants(
  hierarchy: PathwayHierarchy,
  nodeId: IdType,
): IdType[] {
  const result: IdType[] = []
  const queue = [...(hierarchy.childrenOf.get(nodeId) ?? [])]

  while (queue.length > 0) {
    const current = queue.shift()!
    result.push(current)
    const kids = hierarchy.childrenOf.get(current)
    if (kids !== undefined) queue.push(...kids)
  }

  return result
}

/** The direct children of nodeId — one level only. */
export function getDirectChildren(
  hierarchy: PathwayHierarchy,
  nodeId: IdType,
): IdType[] {
  return hierarchy.childrenOf.get(nodeId) ?? []
}

/** Nodes that have children but no parent — the top-level pathways. */
export function getHierarchyRoots(
  hierarchy: PathwayHierarchy,
  allNodeIds: IdType[],
): IdType[] {
  return allNodeIds.filter(
    (nodeId) => !hierarchy.parentOf.has(nodeId) && hierarchy.childrenOf.has(nodeId),
  )
}
