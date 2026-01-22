import type { GraphNode, GraphEdge, TreeInterval } from '@/types'

export interface OpacityParams {
  genomicRange: [number, number] | null
  genomicDimOpacity: number
  temporalRange: [number, number] | null
  temporalDimOpacity: number
  nodes: GraphNode[]
  edges: GraphEdge[]
  treeIntervals?: TreeInterval[]
  genomicMode: 'position' | 'tree'
}

// Check if edge overlaps genomic range (position mode)
export function edgeOverlapsGenomicRange(
  edge: GraphEdge,
  genomicRange: [number, number] | null
): boolean {
  if (!genomicRange) return true
  const [left, right] = genomicRange
  return edge.left < right && edge.right > left
}

// Check if edge overlaps tree range (tree mode)
export function edgeOverlapsTreeRange(
  edge: GraphEdge,
  treeRange: [number, number] | null,
  treeIntervals?: TreeInterval[]
): boolean {
  if (!treeRange || !treeIntervals) return true
  const [startIdx, endIdx] = treeRange

  const selectedIntervals = treeIntervals.filter(
    (interval) => interval.index >= startIdx && interval.index <= endIdx
  )

  return selectedIntervals.some(
    (interval) => edge.left < interval.right && edge.right > interval.left
  )
}

// Check if node has edges in genomic range
export function nodeHasEdgesInGenomicRange(
  node: GraphNode,
  edges: GraphEdge[],
  genomicRange: [number, number] | null,
  genomicMode: 'position' | 'tree',
  treeIntervals?: TreeInterval[]
): boolean {
  if (!genomicRange) return true

  return edges.some((edge) => {
    const sourceId = typeof edge.source === 'number' ? edge.source : (edge.source as any).id
    const targetId = typeof edge.target === 'number' ? edge.target : (edge.target as any).id

    if (sourceId !== node.id && targetId !== node.id) return false

    if (genomicMode === 'tree') {
      return edgeOverlapsTreeRange(edge, genomicRange, treeIntervals)
    }
    return edgeOverlapsGenomicRange(edge, genomicRange)
  })
}

// Get temporal opacity for a node
export function getTemporalNodeOpacity(
  node: GraphNode,
  temporalRange: [number, number] | null,
  temporalDimOpacity: number
): number {
  if (!temporalRange) return 1
  const [minTime, maxTime] = temporalRange
  if (node.time >= minTime && node.time <= maxTime) return 1
  return Math.max(0, Math.min(0.99, temporalDimOpacity))
}

// Get genomic opacity for a node
export function getGenomicNodeOpacity(
  node: GraphNode,
  edges: GraphEdge[],
  genomicRange: [number, number] | null,
  genomicDimOpacity: number,
  genomicMode: 'position' | 'tree',
  treeIntervals?: TreeInterval[]
): number {
  if (!genomicRange) return 1
  if (nodeHasEdgesInGenomicRange(node, edges, genomicRange, genomicMode, treeIntervals)) {
    return 1
  }
  return Math.max(0, Math.min(0.99, genomicDimOpacity))
}

// Combined node opacity
export function getNodeOpacity(node: GraphNode, params: OpacityParams): number {
  const temporal = getTemporalNodeOpacity(node, params.temporalRange, params.temporalDimOpacity)
  const genomic = getGenomicNodeOpacity(
    node,
    params.edges,
    params.genomicRange,
    params.genomicDimOpacity,
    params.genomicMode,
    params.treeIntervals
  )
  return Math.min(temporal, genomic)
}

// Get temporal opacity for an edge
export function getTemporalEdgeOpacity(
  edge: GraphEdge,
  nodes: GraphNode[],
  temporalRange: [number, number] | null,
  temporalDimOpacity: number
): number {
  if (!temporalRange) return 1

  const sourceNode = nodes.find(
    (n) => n.id === (typeof edge.source === 'number' ? edge.source : (edge.source as any).id)
  )
  const targetNode = nodes.find(
    (n) => n.id === (typeof edge.target === 'number' ? edge.target : (edge.target as any).id)
  )

  if (sourceNode && targetNode) {
    const sourceVisible = getTemporalNodeOpacity(sourceNode, temporalRange, temporalDimOpacity) > 0.5
    const targetVisible = getTemporalNodeOpacity(targetNode, temporalRange, temporalDimOpacity) > 0.5
    if (sourceVisible && targetVisible) return 1
  }

  return Math.max(0, Math.min(0.99, temporalDimOpacity))
}

// Get genomic opacity for an edge
export function getGenomicEdgeOpacity(
  edge: GraphEdge,
  genomicRange: [number, number] | null,
  genomicDimOpacity: number,
  genomicMode: 'position' | 'tree',
  treeIntervals?: TreeInterval[]
): number {
  if (!genomicRange) return 1

  const overlaps =
    genomicMode === 'tree'
      ? edgeOverlapsTreeRange(edge, genomicRange, treeIntervals)
      : edgeOverlapsGenomicRange(edge, genomicRange)

  return overlaps ? 1 : Math.max(0, Math.min(0.99, genomicDimOpacity))
}

// Combined edge opacity
export function getEdgeOpacity(edge: GraphEdge, nodes: GraphNode[], params: OpacityParams): number {
  const temporal = getTemporalEdgeOpacity(edge, nodes, params.temporalRange, params.temporalDimOpacity)
  const genomic = getGenomicEdgeOpacity(
    edge,
    params.genomicRange,
    params.genomicDimOpacity,
    params.genomicMode,
    params.treeIntervals
  )
  return Math.min(temporal, genomic)
}
