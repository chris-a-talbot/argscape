import { create } from 'zustand'
import type { GraphData, GraphNode, GraphEdge } from '@/types'
import type { ViewMode, FilterState } from '@/types'

// Helper function to get all descendants of a node
function getDescendants(nodeId: number, edges: GraphEdge[]): Set<number> {
  const descendants = new Set<number>()
  const visited = new Set<number>()
  const queue = [nodeId]

  while (queue.length > 0) {
    const currentId = queue.shift()!
    if (visited.has(currentId)) continue
    visited.add(currentId)

    // Find all edges where current node is the source (parent)
    edges.forEach(edge => {
      const sourceId = typeof edge.source === 'number' ? edge.source : (edge.source as any).id
      const targetId = typeof edge.target === 'number' ? edge.target : (edge.target as any).id

      if (sourceId === currentId && !visited.has(targetId)) {
        descendants.add(targetId)
        queue.push(targetId)
      }
    })
  }

  return descendants
}

// Helper function to get all ancestors of a node
function getAncestors(nodeId: number, edges: GraphEdge[]): Set<number> {
  const ancestors = new Set<number>()
  const visited = new Set<number>()
  const queue = [nodeId]

  while (queue.length > 0) {
    const currentId = queue.shift()!
    if (visited.has(currentId)) continue
    visited.add(currentId)

    // Find all edges where current node is the target (child)
    edges.forEach(edge => {
      const sourceId = typeof edge.source === 'number' ? edge.source : (edge.source as any).id
      const targetId = typeof edge.target === 'number' ? edge.target : (edge.target as any).id

      if (targetId === currentId && !visited.has(sourceId)) {
        ancestors.add(sourceId)
        queue.push(sourceId)
      }
    })
  }

  return ancestors
}

interface DataState {
  // Raw data from Python
  rawData: GraphData | null

  // Computed/filtered data
  displayedNodes: GraphNode[]
  displayedEdges: GraphEdge[]

  // View mode
  viewMode: ViewMode
  selectedNodeId: number | null

  // Filter state
  filter: FilterState

  // Actions
  setRawData: (data: GraphData) => void
  setViewMode: (mode: ViewMode, nodeId?: number) => void
  setFilter: (filter: Partial<FilterState>) => void
  resetView: () => void
}

const defaultFilter: FilterState = {
  genomicRange: null,
  temporalRange: null,
  treeRange: null,
  mode: 'subset',
  dimmedOpacity: 0.2,
}

export const useDataStore = create<DataState>((set, get) => ({
  rawData: null,
  displayedNodes: [],
  displayedEdges: [],
  viewMode: 'full',
  selectedNodeId: null,
  filter: defaultFilter,

  setRawData: (data) => {
    set({
      rawData: data,
      displayedNodes: data.nodes,
      displayedEdges: data.edges,
    })
  },

  setViewMode: (mode, nodeId) => {
    const { rawData } = get()
    if (!rawData || nodeId === undefined) {
      set({ viewMode: mode, selectedNodeId: nodeId ?? null })
      return
    }

    let relevantNodeIds: Set<number>

    if (mode === 'subarg') {
      // SubARG: selected node + all descendants
      relevantNodeIds = getDescendants(nodeId, rawData.edges)
      relevantNodeIds.add(nodeId)
    } else if (mode === 'ancestors') {
      // Ancestors: selected node + all ancestors
      relevantNodeIds = getAncestors(nodeId, rawData.edges)
      relevantNodeIds.add(nodeId)
    } else {
      // Full view
      set({
        viewMode: mode,
        selectedNodeId: null,
        displayedNodes: rawData.nodes,
        displayedEdges: rawData.edges,
      })
      return
    }

    // Filter nodes and edges
    const filteredNodes = rawData.nodes.filter(n => relevantNodeIds.has(n.id))
    const filteredEdges = rawData.edges.filter(e => {
      const sourceId = typeof e.source === 'number' ? e.source : (e.source as any).id
      const targetId = typeof e.target === 'number' ? e.target : (e.target as any).id
      return relevantNodeIds.has(sourceId) && relevantNodeIds.has(targetId)
    })

    set({
      viewMode: mode,
      selectedNodeId: nodeId,
      displayedNodes: filteredNodes,
      displayedEdges: filteredEdges,
    })
  },

  setFilter: (filterUpdate) => {
    set((state) => ({
      filter: { ...state.filter, ...filterUpdate },
    }))
  },

  resetView: () => {
    const { rawData } = get()
    set({
      viewMode: 'full',
      selectedNodeId: null,
      displayedNodes: rawData?.nodes ?? [],
      displayedEdges: rawData?.edges ?? [],
    })
  },
}))
