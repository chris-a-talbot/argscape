import { useEffect, useRef, useCallback } from 'react'
import type { GraphNode, GraphEdge, MutationData } from '@/types'

export interface SimulationNode extends GraphNode {
  x: number
  y: number
  fx: number | null
  fy: number | null
}

export interface SimulationEdge {
  source: SimulationNode
  target: SimulationNode
  left: number
  right: number
  has_mutations: boolean
  mutations: MutationData[] | null
}

interface UseForceSimulationProps {
  nodes: GraphNode[]
  edges: GraphEdge[]
  width: number
  height: number
  verticalSpacing: number
  horizontalSpacing: number
}

export function useForceSimulation({
  nodes,
  edges,
  width,
  height,
  verticalSpacing,
  horizontalSpacing,
}: UseForceSimulationProps) {
  const nodesRef = useRef<SimulationNode[]>([])
  const edgesRef = useRef<SimulationEdge[]>([])

  useEffect(() => {
    if (nodes.length === 0) return

    // Get unique times sorted (samples at 0, roots at max)
    const uniqueTimes = [...new Set(nodes.map(n => n.time))].sort((a, b) => a - b)
    const timeToLayer = new Map(uniqueTimes.map((t, i) => [t, i]))
    const numLayers = uniqueTimes.length

    // Count samples for spacing
    const samples = nodes.filter(n => n.is_sample)
    const numSamples = samples.length

    // Margin
    const marginX = 60
    const marginY = 60

    // Available space
    const availableWidth = width - marginX * 2
    const availableHeight = height - marginY * 2

    // Calculate positions for each node
    const simNodes: SimulationNode[] = nodes.map(node => {
      const layer = timeToLayer.get(node.time) || 0

      // Y position: samples at bottom (layer 0), roots at top (max layer)
      // Invert so time 0 is at bottom
      const y = marginY + availableHeight - (layer / Math.max(numLayers - 1, 1)) * availableHeight * verticalSpacing

      // X position: use order_position for samples, center for others initially
      let x: number
      if (node.is_sample && node.order_position !== null) {
        x = marginX + (node.order_position / Math.max(numSamples - 1, 1)) * availableWidth
      } else {
        // For non-samples, will be positioned based on children/parents
        x = marginX + availableWidth / 2
      }

      return {
        ...node,
        x,
        y,
        fx: node.is_sample ? x : null, // Fix sample x positions
        fy: y, // Fix all y positions based on time
      }
    })

    // Build adjacency for positioning internal nodes
    const nodeMap = new Map(simNodes.map(n => [n.id, n]))
    const childrenMap = new Map<number, number[]>()

    edges.forEach(e => {
      if (!childrenMap.has(e.source)) {
        childrenMap.set(e.source, [])
      }
      childrenMap.get(e.source)!.push(e.target)
    })

    // Position internal nodes based on average of children positions
    // Process from bottom to top (samples first, then internal, then roots)
    const sortedByTime = [...simNodes].sort((a, b) => a.time - b.time)

    for (const node of sortedByTime) {
      if (!node.is_sample) {
        const childIds = childrenMap.get(node.id) || []
        const children = childIds.map(id => nodeMap.get(id)).filter(Boolean) as SimulationNode[]

        if (children.length > 0) {
          // Position at average of children
          const avgX = children.reduce((sum, c) => sum + c.x, 0) / children.length
          node.x = avgX
        }
      }
    }

    // Convert edges
    const simEdges: SimulationEdge[] = edges
      .filter(e => nodeMap.has(e.source) && nodeMap.has(e.target))
      .map(edge => ({
        source: nodeMap.get(edge.source)!,
        target: nodeMap.get(edge.target)!,
        left: edge.left,
        right: edge.right,
        has_mutations: edge.has_mutations,
        mutations: edge.mutations,
      }))

    nodesRef.current = simNodes
    edgesRef.current = simEdges

  }, [nodes, edges, width, height, verticalSpacing, horizontalSpacing])

  const getNodes = useCallback(() => nodesRef.current, [])
  const getEdges = useCallback(() => edgesRef.current, [])

  return { getNodes, getEdges }
}
