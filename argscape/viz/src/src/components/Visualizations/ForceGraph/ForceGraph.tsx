import { useRef, useEffect, useState, useMemo, useCallback } from 'react'
import * as d3 from 'd3'
import * as dagre from 'dagre'
import { useDataStore, useUIStore, useFilterStore } from '@/stores'
import { getNodeOpacity, getEdgeOpacity, type OpacityParams } from '@/utils/opacityCalculations'
import type { GraphNode, GraphEdge, MutationData } from '@/types'

// Dagre layout constants
const DAGRE_NODE_SEPARATION = 80
const DAGRE_RANK_SEPARATION = 100
const DAGRE_MARGIN_X = 60
const DAGRE_MARGIN_Y = 40
const DAGRE_NODE_SIZE_MULTIPLIER = 6

interface ForceGraphProps {
  width: number
  height: number
}

interface SimNode extends GraphNode {
  x: number
  y: number
  fx: number | null
  fy: number | null
  vx?: number
  vy?: number
}

interface SimEdge {
  source: SimNode
  target: SimNode
  left: number
  right: number
  has_mutations: boolean
  mutations: MutationData[] | null
}

interface TooltipData {
  x: number
  y: number
  content: React.ReactNode
}

interface MutationMarkerData {
  edge: SimEdge
  mutation: MutationData
  t: number // position along edge (0-1)
}

// Constants for zoom fit
const ZOOM_FIT_SCALE_MIN = 0.1
const ZOOM_FIT_SCALE_MAX = 3.0
const ZOOM_TRANSITION_DURATION = 750

// Helper function to calculate the bounding box of all nodes
function calculateGraphBounds(nodes: SimNode[]) {
  const positionedNodes = nodes.filter(n => n.x !== undefined && n.y !== undefined)

  if (positionedNodes.length === 0) {
    return {
      minX: 0,
      maxX: 100,
      minY: 0,
      maxY: 100,
      centerX: 50,
      centerY: 50,
      width: 100,
      height: 100,
    }
  }

  const xValues = positionedNodes.map(n => n.x)
  const yValues = positionedNodes.map(n => n.y)

  const minX = Math.min(...xValues)
  const maxX = Math.max(...xValues)
  const minY = Math.min(...yValues)
  const maxY = Math.max(...yValues)

  return {
    minX,
    maxX,
    minY,
    maxY,
    centerX: (minX + maxX) / 2,
    centerY: (minY + maxY) / 2,
    width: maxX - minX,
    height: maxY - minY,
  }
}

// Helper function to calculate transform for fitting and centering the graph
function calculateFitTransform(
  bounds: ReturnType<typeof calculateGraphBounds>,
  screenWidth: number,
  screenHeight: number
) {
  const graphCenterX = bounds.centerX
  const graphCenterY = bounds.centerY

  // Use generous padding to account for sample labels
  const horizontalPadding = 30
  const verticalPadding = 45

  // Handle edge case where all nodes are in same position
  const effectiveGraphWidth = Math.max(bounds.width, 50)
  const effectiveGraphHeight = Math.max(bounds.height, 50)

  // Calculate scale to fit the entire bounding box with padding
  const scaleX = (screenWidth - 2 * horizontalPadding) / effectiveGraphWidth
  const scaleY = (screenHeight - 2 * verticalPadding) / effectiveGraphHeight

  // Use smaller scale to ensure everything fits, clamped to reasonable limits
  const scale = Math.min(
    Math.max(ZOOM_FIT_SCALE_MIN, Math.min(scaleX, scaleY)),
    ZOOM_FIT_SCALE_MAX
  )

  // Create transform that centers the graph
  return d3.zoomIdentity
    .translate(screenWidth / 2, screenHeight / 2)
    .scale(scale)
    .translate(-graphCenterX, -graphCenterY)
}

// Detect if this is a "parent ARG" situation (ancestors view with few samples)
function isLikelyParentARG(nodes: GraphNode[]): boolean {
  const samples = nodes.filter(n => n.is_sample)
  const internalNodes = nodes.filter(n => !n.is_sample)

  // If we have very few samples (1-2) but many internal nodes, likely a parent ARG
  if (samples.length <= 2 && internalNodes.length > 3) {
    return true
  }

  return false
}

// Calculate Y position based on temporal spacing mode
function calculateYPosition(
  time: number,
  uniqueTimes: number[],
  availableHeight: number,
  temporalSpacingMode: 'equal' | 'linear' | 'log',
  verticalSpacing: number = 1
): number {
  if (uniqueTimes.length <= 1) return availableHeight / 2

  const minTime = uniqueTimes[0]
  const maxTime = uniqueTimes[uniqueTimes.length - 1]
  const timeRange = maxTime - minTime

  let normalizedTime: number
  switch (temporalSpacingMode) {
    case 'log': {
      const minTimeOffset = minTime === 0 ? 0.1 : minTime
      const timeOffset = time === 0 ? 0.1 : time
      normalizedTime = (Math.log(timeOffset) - Math.log(minTimeOffset)) /
        (Math.log(maxTime) - Math.log(minTimeOffset))
      break
    }
    case 'linear':
      normalizedTime = timeRange > 0 ? (time - minTime) / timeRange : 0
      break
    case 'equal':
    default: {
      const timeIndex = uniqueTimes.indexOf(time)
      normalizedTime = timeIndex / Math.max(uniqueTimes.length - 1, 1)
      break
    }
  }

  // verticalSpacing is now a percentage (0-100) of available height
  const usedHeightFraction = Math.max(0.05, Math.min(1.0, verticalSpacing / 100))
  const effectiveHeight = availableHeight * usedHeightFraction
  const verticalOffset = (availableHeight - effectiveHeight) / 2

  // Return position: time 0 at bottom, max time at top
  return verticalOffset + effectiveHeight - (normalizedTime * effectiveHeight)
}

export function ForceGraph({ width, height }: ForceGraphProps) {
  const svgRef = useRef<SVGSVGElement>(null)
  const gRef = useRef<SVGGElement>(null)
  const simulationRef = useRef<d3.Simulation<SimNode, SimEdge> | null>(null)
  const zoomRef = useRef<d3.ZoomBehavior<SVGSVGElement, unknown> | null>(null)
  const nodesRef = useRef<SimNode[]>([])
  const edgesRef = useRef<SimEdge[]>([])
  const prevNodeCountRef = useRef<number>(0)
  const initialFitDoneRef = useRef<boolean>(false)
  const [tooltip, setTooltip] = useState<TooltipData | null>(null)

  const { rawData, displayedNodes, displayedEdges, setViewMode, viewMode } = useDataStore()
  const { theme, nodes: nodeSettings, edges: edgeSettings, mutations: mutationSettings, layout } = useUIStore()
  const {
    genomicMode,
    genomicRange,
    genomicDimOpacity,
    temporalRange,
    temporalDimOpacity,
  } = useFilterStore()

  // Get tree intervals from the raw data metadata
  const treeIntervals = rawData?.metadata?.tree_intervals

  // Get sample orderings from metadata
  const sampleOrderings = rawData?.metadata?.sample_orderings

  // Margins
  const marginX = 80
  const marginY = 60
  const availableWidth = width - marginX * 2
  const availableHeight = height - marginY * 2

  // Compute unique times for vertical positioning
  const uniqueTimes = useMemo(() => {
    return [...new Set(displayedNodes.map(n => n.time))].sort((a, b) => a - b)
  }, [displayedNodes])

  // Initialize nodes with positions
  useEffect(() => {
    if (displayedNodes.length === 0) {
      nodesRef.current = []
      edgesRef.current = []
      return
    }

    const isDagreMode = layout.sampleOrder === 'dagre'

    // Count samples for horizontal spacing
    const samples = displayedNodes.filter(n => n.is_sample)
    const numSamples = samples.length

    // Get the current sample ordering (use from metadata if available)
    const currentOrdering = sampleOrderings?.[layout.sampleOrder] ?? null

    // Create a local ordering for displayed samples only (for subARGs)
    // This ensures samples are evenly distributed regardless of their global order_position
    const sortedDisplayedSamples = [...samples].sort((a, b) => {
      const posA = currentOrdering?.[String(a.id)] ?? a.order_position ?? 0
      const posB = currentOrdering?.[String(b.id)] ?? b.order_position ?? 0
      return posA - posB
    })
    const localOrderMap = new Map<number, number>()
    sortedDisplayedSamples.forEach((sample, index) => {
      localOrderMap.set(sample.id, index)
    })

    // Helper to get order position for a sample (uses local ordering for subARGs)
    const getOrderPosition = (node: GraphNode): number | null => {
      if (!node.is_sample) return null
      // Use local ordering to ensure even distribution in subARGs
      return localOrderMap.get(node.id) ?? null
    }

    // Create simulation nodes with initial positions
    const simNodes: SimNode[] = displayedNodes.map(node => {
      // For dagre mode, positions will be set later
      if (isDagreMode) {
        return {
          ...node,
          x: marginX + availableWidth / 2,
          y: marginY + availableHeight / 2,
          fx: null,
          fy: null,
          vx: 0,
          vy: 0,
        }
      }

      // Calculate Y position based on time
      const y = marginY + calculateYPosition(
        node.time,
        uniqueTimes,
        availableHeight,
        layout.temporalSpacing,
        layout.verticalSpacing
      )

      // Calculate X position
      let x: number
      const orderPos = getOrderPosition(node)
      if (node.is_sample && orderPos !== null) {
        // horizontalSpacing is now a percentage (0-100) of available width
        const usedWidthFraction = Math.max(0.05, Math.min(1.0, layout.horizontalSpacing / 100))
        const effectiveWidth = availableWidth * usedWidthFraction
        const centerOffset = marginX + (availableWidth - effectiveWidth) / 2
        x = centerOffset + (orderPos / Math.max(numSamples - 1, 1)) * effectiveWidth
      } else {
        // Non-samples: start at center, will be positioned by forces
        x = marginX + availableWidth / 2
      }

      return {
        ...node,
        x,
        y,
        // CRITICAL: Samples are fully pinned (fx AND fy)
        // Non-samples have only fy pinned (can move horizontally)
        fx: node.is_sample ? x : null,
        fy: y,
        vx: 0,
        vy: 0,
      }
    })

    const nodeMap = new Map(simNodes.map(n => [n.id, n]))

    // Build children map for positioning internal nodes
    const childrenMap = new Map<number, number[]>()
    displayedEdges.forEach(e => {
      if (!childrenMap.has(e.source)) {
        childrenMap.set(e.source, [])
      }
      childrenMap.get(e.source)!.push(e.target)
    })

    // DAGRE MODE: Use dagre library for hierarchical layout
    if (isDagreMode) {
      const g = new dagre.graphlib.Graph()

      // Set graph options
      g.setGraph({
        rankdir: 'TB', // Top to bottom
        nodesep: DAGRE_NODE_SEPARATION,
        ranksep: DAGRE_RANK_SEPARATION,
        marginx: DAGRE_MARGIN_X,
        marginy: DAGRE_MARGIN_Y,
        ranker: 'network-simplex', // Most robust for crossing minimization
      })
      g.setDefaultEdgeLabel(() => ({}))

      // CRITICAL: Assign ranks based on time to ensure proper temporal layering
      // In ARGs: time=0 is usually present (samples), higher time = older (ancestors)
      // We want: samples at BOTTOM (highest rank), ancestors at TOP (lowest rank)
      const sortedTimes = uniqueTimes.slice().sort((a, b) => a - b)
      const maxRank = sortedTimes.length - 1
      const timeToRank = new Map(sortedTimes.map((time, index) => [time, maxRank - index]))

      const nodeRadius = nodeSettings.sampleSize

      // Add nodes to dagre graph with FIXED ranks based on time
      simNodes.forEach(node => {
        const rank = timeToRank.get(node.time)
        g.setNode(node.id.toString(), {
          width: nodeRadius * DAGRE_NODE_SIZE_MULTIPLIER,
          height: nodeRadius * DAGRE_NODE_SIZE_MULTIPLIER,
          label: node.id.toString(),
          rank: rank, // Fix rank to prevent dagre from moving nodes between temporal layers
        })
      })

      // Add edges in CORRECT direction for ARGs
      // Match web app implementation: edges flow based on time comparison
      displayedEdges.forEach(edge => {
        const sourceNode = nodeMap.get(edge.source)
        const targetNode = nodeMap.get(edge.target)

        if (!sourceNode || !targetNode) return

        // CRITICAL: Use same condition as web app for consistent crossing minimization
        if (sourceNode.time <= targetNode.time) {
          g.setEdge(edge.source.toString(), edge.target.toString(), {
            weight: 1,
            minlen: Math.max(1, Math.abs((timeToRank.get(targetNode.time) ?? 0) - (timeToRank.get(sourceNode.time) ?? 0))),
          })
        } else {
          g.setEdge(edge.target.toString(), edge.source.toString(), {
            weight: 1,
            minlen: Math.max(1, Math.abs((timeToRank.get(sourceNode.time) ?? 0) - (timeToRank.get(targetNode.time) ?? 0))),
          })
        }
      })

      // Run dagre layout
      dagre.layout(g)

      // Get bounding box of dagre layout
      const dagreNodes = g.nodes().map(nodeId => g.node(nodeId)).filter(Boolean)
      if (dagreNodes.length > 0) {
        const minX = Math.min(...dagreNodes.map(n => n.x - n.width / 2))
        const maxX = Math.max(...dagreNodes.map(n => n.x + n.width / 2))
        const minY = Math.min(...dagreNodes.map(n => n.y - n.height / 2))
        const maxY = Math.max(...dagreNodes.map(n => n.y + n.height / 2))

        const dagreWidth = maxX - minX
        const dagreHeight = maxY - minY

        // Apply spacing preferences
        const userHorizontalMultiplier = layout.horizontalSpacing / 100
        const userVerticalMultiplier = layout.verticalSpacing / 100

        // Calculate scale to fit available space
        const baseScaleX = Math.min(availableWidth / Math.max(dagreWidth, 1), 3.0) * userHorizontalMultiplier
        const baseScaleY = Math.min(availableHeight / Math.max(dagreHeight, 1), 2.0) * userVerticalMultiplier

        const scaledWidth = dagreWidth * baseScaleX
        const scaledHeight = dagreHeight * baseScaleY
        const offsetX = marginX + (availableWidth - scaledWidth) / 2
        const offsetY = marginY + (availableHeight - scaledHeight) / 2

        // Apply dagre positions with scaling
        simNodes.forEach(node => {
          const dagreNode = g.node(node.id.toString())
          if (dagreNode) {
            // Scale and center the position
            const baseX = (dagreNode.x - minX) * baseScaleX + offsetX
            // Flip Y so time=0 (samples) is at bottom
            const baseY = offsetY + scaledHeight - ((dagreNode.y - minY) * baseScaleY)

            node.x = baseX
            node.y = baseY
            // Fix both positions for dagre mode (no simulation)
            node.fx = baseX
            node.fy = baseY
          }
        })
      }
    } else {
      // NON-DAGRE MODE: Use force-directed layout

      // Check if this is a parent ARG situation
      const isParentARG = isLikelyParentARG(displayedNodes)

      if (isParentARG) {
        // For parent ARGs (ancestors view), distribute nodes horizontally by time level
        // Group nodes by time
        const nodesByTime = new Map<number, SimNode[]>()
        simNodes.forEach(node => {
          if (!node.is_sample) {
            if (!nodesByTime.has(node.time)) {
              nodesByTime.set(node.time, [])
            }
            nodesByTime.get(node.time)!.push(node)
          }
        })

        // Distribute each time level's nodes across the available width
        const xPadding = marginX + 50
        const distributionStart = xPadding
        const distributionEnd = width - xPadding
        const distributionWidth = distributionEnd - distributionStart

        nodesByTime.forEach((nodesAtTime, _time) => {
          const count = nodesAtTime.length
          nodesAtTime.forEach((node, index) => {
            // Distribute nodes evenly across the width
            const positionFactor = count > 1 ? index / (count - 1) : 0.5
            const baseX = distributionStart + positionFactor * distributionWidth
            // Add slight randomness to prevent perfect alignment
            const randomOffset = (Math.random() - 0.5) * Math.min(distributionWidth * 0.1, 25)
            node.x = Math.max(xPadding, Math.min(width - xPadding, baseX + randomOffset))
            // Fix X position to maintain distribution
            node.fx = node.x
          })
        })

        // Position samples at the center of their ancestors (if any)
        simNodes.filter(n => n.is_sample).forEach(sample => {
          const ancestorNodes = simNodes.filter(n => !n.is_sample)
          if (ancestorNodes.length > 0) {
            const ancestorXs = ancestorNodes.map(n => n.x)
            const minX = Math.min(...ancestorXs)
            const maxX = Math.max(...ancestorXs)
            sample.x = (minX + maxX) / 2
            sample.fx = sample.x
          }
        })
      } else {
        // Normal case: Position internal nodes at average of children (bottom-up)
        const sortedByTime = [...simNodes].sort((a, b) => a.time - b.time)
        for (const node of sortedByTime) {
          if (!node.is_sample) {
            const childIds = childrenMap.get(node.id) || []
            const children = childIds.map(id => nodeMap.get(id)).filter(Boolean) as SimNode[]
            if (children.length > 0) {
              node.x = children.reduce((sum, c) => sum + c.x, 0) / children.length
            }
          }
        }
      }
    }

    // Create simulation edges
    const simEdges: SimEdge[] = displayedEdges
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

    // Create force simulation
    // For dagre mode: create a minimal simulation (alpha=0) that doesn't move nodes
    // For other modes: create full simulation with forces
    const simulation = d3.forceSimulation<SimNode>(simNodes)

    if (isDagreMode) {
      // Dagre mode: no forces, completely static positions
      // Stop simulation immediately - dagre positions are fixed
      simulation
        .alpha(0)
        .alphaDecay(1)
        .velocityDecay(1)
        .stop() // Explicitly stop - no need for simulation in dagre mode

      // Signal ready immediately since layout is already computed
      if (typeof window !== 'undefined' && window.argscapeSignalReady) {
        window.argscapeSignalReady()
      }
    } else {
      // Force-directed mode: full simulation with forces
      simulation
        .force('link', d3.forceLink<SimNode, SimEdge>(simEdges)
          .id(d => d.id)
          .strength(d => {
            const source = d.source as SimNode
            const target = d.target as SimNode
            if (!source || !target) return 0.1
            return source.is_sample || target.is_sample ? 0.15 : 0.1
          }))
        .force('charge', d3.forceManyBody().strength(d => {
          const node = d as SimNode
          if (node.is_sample) return -15
          return -30
        }))
        .force('x', d3.forceX<SimNode>(d => {
          if (d.is_sample) return d.x
          const childIds = childrenMap.get(d.id) || []
          const children = childIds.map(id => nodeMap.get(id)).filter(Boolean) as SimNode[]
          if (children.length > 0) {
            return children.reduce((sum, c) => sum + c.x, 0) / children.length
          }
          return d.x
        }).strength(d => {
          if (d.is_sample) return 1.0
          const childIds = childrenMap.get(d.id) || []
          return childIds.length > 0 ? 0.5 : 0.2
        }))
        .force('collision', d3.forceCollide<SimNode>().radius(d => {
          return d.is_sample ? 15 : 10
        }).strength(0.7))
        .alphaDecay(0.02)
        .velocityDecay(0.4)
        .on('end', () => {
          if (typeof window !== 'undefined' && window.argscapeSignalReady) {
            window.argscapeSignalReady()
          }
        })

      // Run simulation for initial settling
      simulation.alpha(0.5).restart()
      setTimeout(() => simulation.alphaTarget(0), 1500)
    }

    simulationRef.current = simulation

    // Fallback: signal ready after 3 seconds even if simulation hasn't fully settled
    const readyTimeout = setTimeout(() => {
      if (typeof window !== 'undefined' && window.argscapeSignalReady) {
        window.argscapeSignalReady()
      }
    }, isDagreMode ? 500 : 3000)

    return () => {
      simulation.stop()
      clearTimeout(readyTimeout)
    }
  // Note: layout settings are NOT in dependencies - position changes are handled by separate effects
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [displayedNodes, displayedEdges, uniqueTimes, availableWidth, availableHeight, marginX, marginY, sampleOrderings, layout.sampleOrder, nodeSettings.sampleSize])

  // Update sample X positions when sample order changes (skip for dagre mode - handled by main effect)
  useEffect(() => {
    // Skip for dagre mode - positions are handled in the main initialization effect
    if (layout.sampleOrder === 'dagre') return

    const nodes = nodesRef.current
    const simulation = simulationRef.current
    if (!nodes.length || !simulation) return

    const samples = nodes.filter(n => n.is_sample)
    const numSamples = samples.length

    // Get the current sample ordering
    const currentOrdering = sampleOrderings?.[layout.sampleOrder] ?? null

    // Sort samples by their order (for proper sequencing)
    const sortedSamples = [...samples].sort((a, b) => {
      const posA = currentOrdering?.[String(a.id)] ?? a.order_position ?? 0
      const posB = currentOrdering?.[String(b.id)] ?? b.order_position ?? 0
      return posA - posB
    })

    // Recalculate horizontal spacing - use full width
    const minTotalWidth = (numSamples - 1) * layout.horizontalSpacing
    const totalWidth = Math.max(minTotalWidth, availableWidth * 0.9)
    const centerOffset = marginX + (availableWidth - Math.min(totalWidth, availableWidth)) / 2
    const effectiveWidth = Math.min(totalWidth, availableWidth)

    // Use index (local position) for even distribution, not global order_position
    sortedSamples.forEach((node, index) => {
      const x = centerOffset + (index / Math.max(numSamples - 1, 1)) * effectiveWidth
      node.x = x
      node.fx = x
      node.vx = 0
    })

    simulation.alpha(0.3).restart()
    setTimeout(() => simulation.alphaTarget(0), 500)
  }, [layout.sampleOrder, sampleOrderings, availableWidth, marginX, layout.horizontalSpacing])

  // Update Y positions when temporal spacing changes (skip for dagre mode - handled by main effect)
  useEffect(() => {
    // Skip for dagre mode - positions are handled in the main initialization effect
    if (layout.sampleOrder === 'dagre') return

    const nodes = nodesRef.current
    const simulation = simulationRef.current
    if (!nodes.length || !simulation) return

    nodes.forEach(node => {
      const y = marginY + calculateYPosition(
        node.time,
        uniqueTimes,
        availableHeight,
        layout.temporalSpacing,
        layout.verticalSpacing
      )
      node.y = y
      node.fy = y
      node.vy = 0
    })

    simulation.alpha(0.3).restart()
    setTimeout(() => simulation.alphaTarget(0), 500)
  }, [layout.temporalSpacing, layout.verticalSpacing, uniqueTimes, availableHeight, marginY, layout.sampleOrder])

  // Update X positions when horizontal spacing changes (skip for dagre mode - handled by main effect)
  useEffect(() => {
    // Skip for dagre mode - positions are handled in the main initialization effect
    if (layout.sampleOrder === 'dagre') return

    const nodes = nodesRef.current
    const simulation = simulationRef.current
    if (!nodes.length || !simulation) return

    const samples = nodes.filter(n => n.is_sample)
    const numSamples = samples.length

    // Get the current sample ordering
    const currentOrdering = sampleOrderings?.[layout.sampleOrder] ?? null

    // Sort samples by order for proper sequencing
    const sortedSamples = [...samples].sort((a, b) => {
      const posA = currentOrdering?.[String(a.id)] ?? a.order_position ?? 0
      const posB = currentOrdering?.[String(b.id)] ?? b.order_position ?? 0
      return posA - posB
    })

    // horizontalSpacing is now a percentage (0-100) of available width
    const usedWidthFraction = Math.max(0.05, Math.min(1.0, layout.horizontalSpacing / 100))
    const effectiveWidth = availableWidth * usedWidthFraction
    const centerOffset = marginX + (availableWidth - effectiveWidth) / 2

    // Use index (local position) for even distribution
    sortedSamples.forEach((node, index) => {
      const x = centerOffset + (index / Math.max(numSamples - 1, 1)) * effectiveWidth
      node.x = x
      node.fx = x
      node.vx = 0
    })

    simulation.alpha(0.3).restart()
    setTimeout(() => simulation.alphaTarget(0), 500)
  }, [layout.horizontalSpacing, availableWidth, marginX, sampleOrderings, layout.sampleOrder])

  // Render function
  const render = useCallback(() => {
    if (!gRef.current || !theme) return

    const nodes = nodesRef.current
    const edges = edgesRef.current
    const simulation = simulationRef.current

    if (nodes.length === 0) return

    const g = d3.select(gRef.current)

    // Create opacity params for filter-based opacity
    const opacityParams: OpacityParams = {
      genomicRange,
      genomicDimOpacity,
      temporalRange,
      temporalDimOpacity,
      nodes: displayedNodes,
      edges: displayedEdges,
      treeIntervals,
      genomicMode,
    }

    // Clear and rebuild
    g.selectAll('*').remove()

    // Draw edges
    const edgeGroup = g.append('g').attr('class', 'edges')
    const edgeSelection = edgeGroup.selectAll('line')
      .data(edges)
      .join('line')
      .attr('class', 'edge-line')
      .attr('stroke', theme.edges.default)
      .attr('stroke-opacity', d => {
        const filterOpacity = getEdgeOpacity(d as unknown as GraphEdge, displayedNodes, opacityParams)
        return edgeSettings.opacity * filterOpacity
      })
      .attr('stroke-width', edgeSettings.width)
      .attr('x1', d => d.source.x)
      .attr('y1', d => d.source.y)
      .attr('x2', d => d.target.x)
      .attr('y2', d => d.target.y)

    // Draw edge labels if enabled
    let edgeLabelSelection: any = null
    if (edgeSettings.showLabels) {
      const edgeLabelGroup = g.append('g').attr('class', 'edge-labels')
      edgeLabelSelection = edgeLabelGroup.selectAll('text')
        .data(edges)
        .join('text')
        .attr('class', 'edge-label')
        .attr('x', d => (d.source.x + d.target.x) / 2)
        .attr('y', d => (d.source.y + d.target.y) / 2 - 4)
        .attr('text-anchor', 'middle')
        .attr('fill', theme.text_secondary)
        .attr('font-size', '9px')
        .attr('font-family', 'monospace')
        .attr('pointer-events', 'none')
        .text(d => `${Math.round(d.left)}-${Math.round(d.right)}`)
    }

    // Draw mutations if enabled - use diamond SVG shapes
    let mutationMarkerSelection: any = null

    if (mutationSettings.show) {
      const mutationGroup = g.append('g').attr('class', 'mutations')
      const mutationMarkerData: MutationMarkerData[] = []

      edges.forEach(edge => {
        if (edge.has_mutations && edge.mutations) {
          const numMuts = edge.mutations.length
          edge.mutations.forEach((mutation, i) => {
            // Distribute mutations along the edge
            const t = numMuts > 1 ? (i + 1) / (numMuts + 1) : 0.5
            mutationMarkerData.push({ edge, mutation, t })
          })
        }
      })

      // Diamond path generator - creates a diamond shape centered at origin
      const diamondSize = mutationSettings.size
      const diamondPath = `M 0 ${-diamondSize} L ${diamondSize} 0 L 0 ${diamondSize} L ${-diamondSize} 0 Z`

      mutationMarkerSelection = mutationGroup.selectAll('path')
        .data(mutationMarkerData)
        .join('path')
        .attr('class', 'mutation-marker')
        .attr('d', diamondPath)
        .attr('fill', theme.mutation)
        .attr('fill-opacity', d => getEdgeOpacity(d.edge as unknown as GraphEdge, displayedNodes, opacityParams))
        .attr('stroke', theme.background)
        .attr('stroke-width', 1.5)
        .attr('stroke-opacity', d => getEdgeOpacity(d.edge as unknown as GraphEdge, displayedNodes, opacityParams))
        .attr('cursor', 'pointer')
        .attr('transform', d => {
          const sx = d.edge.source.x
          const sy = d.edge.source.y
          const tx = d.edge.target.x
          const ty = d.edge.target.y
          const x = sx + (tx - sx) * d.t
          const y = sy + (ty - sy) * d.t
          return `translate(${x}, ${y})`
        })
        .on('mouseenter', function (event, d) {
          d3.select(this).attr('fill', theme.nodes.selected)
          const rect = svgRef.current?.getBoundingClientRect()
          if (rect) {
            setTooltip({
              x: event.clientX - rect.left,
              y: event.clientY - rect.top,
              content: (
                <div>
                  <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>Mutation</div>
                  <div>Position: {d.mutation.position.toLocaleString()}</div>
                  <div>Site: {d.mutation.site}</div>
                  <div>{d.mutation.ancestral_state} → {d.mutation.derived_state}</div>
                  {d.mutation.time !== null && <div>Time: {d.mutation.time.toFixed(4)}</div>}
                </div>
              ),
            })
          }
        })
        .on('mouseleave', function () {
          d3.select(this).attr('fill', theme.mutation)
          setTooltip(null)
        })
    }

    // Draw nodes
    const nodeGroup = g.append('g').attr('class', 'nodes')
    const nodeSelection = nodeGroup.selectAll('circle')
      .data(nodes)
      .join('circle')
      .attr('class', 'node-circle')
      .attr('r', d => {
        if (d.is_sample) return nodeSettings.sampleSize
        if (d.is_root) return nodeSettings.rootSize
        return nodeSettings.internalSize
      })
      .attr('fill', d => {
        if (d.is_sample) return theme.nodes.sample
        if (d.is_root) return theme.nodes.root
        return theme.nodes.internal
      })
      .attr('fill-opacity', d => getNodeOpacity(d as unknown as GraphNode, opacityParams))
      .attr('stroke', theme.background)
      .attr('stroke-width', 1.5)
      .attr('stroke-opacity', d => getNodeOpacity(d as unknown as GraphNode, opacityParams))
      .attr('cx', d => d.x)
      .attr('cy', d => d.y)
      .attr('cursor', d => d.is_sample ? 'default' : 'grab')
      .on('click', (event, d) => {
        if (event.defaultPrevented) return
        event.stopPropagation()
        setTooltip(null) // Clear tooltip on click
        setViewMode('subarg', d.id)
      })
      .on('contextmenu', (event, d) => {
        event.preventDefault()
        setTooltip(null) // Clear tooltip on right-click
        setViewMode('ancestors', d.id)
      })
      .on('mouseenter', function (event, d) {
        d3.select(this).attr('stroke', theme.nodes.selected).attr('stroke-width', 2.5)
        const rect = svgRef.current?.getBoundingClientRect()
        if (rect) {
          setTooltip({
            x: event.clientX - rect.left,
            y: event.clientY - rect.top,
            content: (
              <div>
                <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>Node {d.id}</div>
                <div>Time: {d.time.toFixed(4)}</div>
                <div>Type: {d.is_sample ? 'Sample' : d.is_root ? 'Root' : 'Internal'}</div>
                {d.population !== null && <div>Population: {d.population}</div>}
              </div>
            ),
          })
        }
      })
      .on('mouseleave', function () {
        d3.select(this).attr('stroke', theme.background).attr('stroke-width', 1.5)
        setTooltip(null)
      })

    // Drag behavior for internal/root nodes only (samples stay locked)
    const drag = d3.drag<SVGCircleElement, SimNode>()
      .filter((_event, d) => !d.is_sample)
      .on('start', function (event, d) {
        d3.select(this).attr('cursor', 'grabbing')
        if (!event.active && simulation) simulation.alphaTarget(0.3).restart()
        d.fx = d.x
      })
      .on('drag', function (event, d) {
        d.fx = event.x
        d.x = event.x
        // Don't modify Y - keep fy pinned
      })
      .on('end', function (event, d) {
        d3.select(this).attr('cursor', 'grab')
        if (!event.active && simulation) simulation.alphaTarget(0)
        d.fx = d.x // Keep pinned after drag
      })

    nodeSelection.call(drag as any)

    // Draw labels if enabled
    const labelGroup = g.append('g').attr('class', 'labels')
    const labelNodes = nodes.filter(n => {
      if (n.is_sample && nodeSettings.showSampleIds) return true
      if (n.is_root && nodeSettings.showRootIds) return true
      if (!n.is_sample && !n.is_root && nodeSettings.showInternalIds) return true
      return false
    })

    const labelSelection = labelGroup.selectAll('text')
      .data(labelNodes)
      .join('text')
      .attr('class', 'node-label')
      .attr('x', d => d.x)
      .attr('y', d => {
        const r = d.is_sample ? nodeSettings.sampleSize : d.is_root ? nodeSettings.rootSize : nodeSettings.internalSize
        // Sample labels go below, others go above
        return d.is_sample ? d.y + r + 14 : d.y - r - 4
      })
      .attr('text-anchor', 'middle')
      .attr('fill', theme.text)
      .attr('font-size', '11px')
      .attr('font-family', 'system-ui, -apple-system, sans-serif')
      .attr('pointer-events', 'none')
      .text(d => d.id)

    // Update positions on simulation tick
    if (simulation) {
      simulation.on('tick', () => {
        edgeSelection
          .attr('x1', d => d.source.x)
          .attr('y1', d => d.source.y)
          .attr('x2', d => d.target.x)
          .attr('y2', d => d.target.y)

        nodeSelection
          .attr('cx', d => d.x)
          .attr('cy', d => d.y)

        labelSelection
          .attr('x', d => d.x)
          .attr('y', d => {
            const r = d.is_sample ? nodeSettings.sampleSize : d.is_root ? nodeSettings.rootSize : nodeSettings.internalSize
            return d.is_sample ? d.y + r + 14 : d.y - r - 4
          })

        if (edgeLabelSelection) {
          edgeLabelSelection
            .attr('x', (d: SimEdge) => (d.source.x + d.target.x) / 2)
            .attr('y', (d: SimEdge) => (d.source.y + d.target.y) / 2 - 4)
        }

        if (mutationMarkerSelection) {
          mutationMarkerSelection
            .attr('transform', (d: MutationMarkerData) => {
              const sx = d.edge.source.x
              const sy = d.edge.source.y
              const tx = d.edge.target.x
              const ty = d.edge.target.y
              const x = sx + (tx - sx) * d.t
              const y = sy + (ty - sy) * d.t
              return `translate(${x}, ${y})`
            })
        }
      })
    }
  }, [theme, nodeSettings, edgeSettings, mutationSettings, setViewMode, genomicMode, genomicRange, genomicDimOpacity, temporalRange, temporalDimOpacity, treeIntervals, displayedNodes, displayedEdges])

  // Set up zoom
  useEffect(() => {
    if (!svgRef.current || !gRef.current) return

    const svg = d3.select(svgRef.current)
    const g = d3.select(gRef.current)

    const zoom = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.1, 10])
      .filter((event) => {
        // Don't zoom on node drag
        return !event.target.closest('.node-circle')
      })
      .on('zoom', (event) => {
        g.attr('transform', event.transform)
      })

    svg.call(zoom)
    zoomRef.current = zoom
  }, [])

  // Helper to fit the graph to the view
  const fitToView = useCallback((animated: boolean = true) => {
    const nodes = nodesRef.current
    if (nodes.length === 0 || !svgRef.current || !zoomRef.current) return

    const bounds = calculateGraphBounds(nodes)
    const transform = calculateFitTransform(bounds, width, height)

    const svg = d3.select(svgRef.current)
    if (animated) {
      svg.transition()
        .duration(ZOOM_TRANSITION_DURATION)
        .call(zoomRef.current.transform, transform)
    } else {
      svg.call(zoomRef.current.transform, transform)
    }

    prevNodeCountRef.current = nodes.length
    initialFitDoneRef.current = true
  }, [width, height])

  // Fit to view when view mode changes or nodes change significantly
  useEffect(() => {
    if (!svgRef.current || !zoomRef.current) return

    // For subarg/ancestors views, always fit
    if (viewMode !== 'full') {
      const timeoutId = setTimeout(() => fitToView(true), 300)
      return () => clearTimeout(timeoutId)
    }

    // For full view, fit if returning from a subset or on initial load
    if (!initialFitDoneRef.current || (prevNodeCountRef.current > 0 && prevNodeCountRef.current !== displayedNodes.length)) {
      const timeoutId = setTimeout(() => fitToView(true), 300)
      return () => clearTimeout(timeoutId)
    }
  }, [viewMode, displayedNodes.length, fitToView])

  // Initial render and re-render on changes
  useEffect(() => {
    render()
  }, [render])

  // Re-render when simulation nodes/edges change
  useEffect(() => {
    if (nodesRef.current.length > 0) {
      render()
    }
  }, [displayedNodes, displayedEdges, render])

  // Re-render when layout settings change (sample order, temporal spacing, etc.)
  useEffect(() => {
    if (nodesRef.current.length > 0) {
      render()
    }
  }, [layout.sampleOrder, layout.temporalSpacing, layout.verticalSpacing, layout.horizontalSpacing, render])

  return (
    <div style={{ width: '100%', height: '100%', position: 'relative', overflow: 'hidden' }}>
      <svg
        ref={svgRef}
        width="100%"
        height="100%"
        style={{ background: theme?.background || '#f5f5f7', display: 'block' }}
      >
        <g ref={gRef} />
      </svg>

      {/* Tooltip */}
      {tooltip && (
        <div
          style={{
            position: 'absolute',
            left: Math.min(tooltip.x + 12, width - 180),
            top: Math.max(tooltip.y - 10, 10),
            background: 'rgba(0, 0, 0, 0.9)',
            color: '#fff',
            padding: '10px 14px',
            borderRadius: '8px',
            fontSize: '12px',
            lineHeight: '1.4',
            pointerEvents: 'none',
            zIndex: 1000,
            maxWidth: '200px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.4)',
          }}
        >
          {tooltip.content}
        </div>
      )}
    </div>
  )
}
