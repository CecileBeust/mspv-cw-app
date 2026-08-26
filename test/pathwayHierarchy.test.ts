// Unit tests for the hierarchy walk. These are pure functions over a Map, so
// they run without a host — which is the point: the context menu handlers are
// thin wrappers around them and cannot be tested outside a browser.

import { describe, expect, it } from 'vitest'

import type { AppContext } from 'cyweb/ApiTypes'

import {
  buildPathwayHierarchy,
  getAllDescendants,
  getDirectChildren,
  getHierarchyRoots,
} from '../src/pathwayHierarchy'

type FakeEdge = {
  id: string
  sourceId: string
  targetId: string
  interaction: string
}

/**
 * A network of pathway containment:
 *
 *   root ─ a ─ a1
 *        └ b
 *
 * plus one reaction edge, which must be ignored.
 */
const EDGES: FakeEdge[] = [
  { id: 'e1', sourceId: 'a', targetId: 'root', interaction: 'abstraction:IsAComponentOf' },
  { id: 'e2', sourceId: 'b', targetId: 'root', interaction: 'abstraction:IsAComponentOf' },
  { id: 'e3', sourceId: 'a1', targetId: 'a', interaction: 'abstraction:IsAComponentOf' },
  { id: 'e4', sourceId: 'a', targetId: 'b', interaction: 'reaction:Precedes' },
]

function fakeContext(edges: FakeEdge[] = EDGES): AppContext {
  return {
    apis: {
      element: {
        getEdgeIds: () => ({
          success: true,
          data: { edgeIds: edges.map((e) => e.id) },
        }),
        getEdge: (_networkId: string, edgeId: string) => {
          const edge = edges.find((e) => e.id === edgeId)
          if (edge === undefined) return { success: false }
          return {
            success: true,
            data: {
              sourceId: edge.sourceId,
              targetId: edge.targetId,
              attributes: { interaction: edge.interaction },
            },
          }
        },
      },
    },
  } as unknown as AppContext
}

describe('buildPathwayHierarchy', () => {
  it('follows only IsAComponentOf edges', () => {
    const { childrenOf, parentOf } = buildPathwayHierarchy(fakeContext(), 'n1')

    expect(childrenOf.get('root')).toEqual(['a', 'b'])
    expect(childrenOf.get('a')).toEqual(['a1'])
    expect(parentOf.get('a')).toBe('root')
    // e4 is a reaction edge — it must not make 'b' a parent of 'a'.
    expect(childrenOf.has('b')).toBe(false)
  })

  it('returns an empty hierarchy when the network has no edges', () => {
    const { childrenOf, parentOf } = buildPathwayHierarchy(fakeContext([]), 'n1')

    expect(childrenOf.size).toBe(0)
    expect(parentOf.size).toBe(0)
  })
})

describe('hierarchy queries', () => {
  const hierarchy = buildPathwayHierarchy(fakeContext(), 'n1')

  it('getAllDescendants walks every depth', () => {
    expect(getAllDescendants(hierarchy, 'root').sort()).toEqual(['a', 'a1', 'b'])
  })

  it('getAllDescendants returns nothing for a leaf', () => {
    expect(getAllDescendants(hierarchy, 'a1')).toEqual([])
  })

  it('getDirectChildren stops at one level', () => {
    expect(getDirectChildren(hierarchy, 'root')).toEqual(['a', 'b'])
    expect(getDirectChildren(hierarchy, 'a')).toEqual(['a1'])
  })

  it('getHierarchyRoots finds nodes with children and no parent', () => {
    expect(getHierarchyRoots(hierarchy, ['root', 'a', 'a1', 'b'])).toEqual(['root'])
  })

  it('getHierarchyRoots excludes childless orphans', () => {
    // A node in the network but outside the containment hierarchy is not a
    // root — expanding from it would show nothing.
    expect(getHierarchyRoots(hierarchy, ['orphan'])).toEqual([])
  })
})
