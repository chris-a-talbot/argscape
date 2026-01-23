import type { GraphNode, GraphEdge, Theme } from '@/types'
import type { Node3D, Edge3D, CoordinateTransform } from './Spatial3D.types'
import { NODE_SIZES, BASE_ELEVATION, JITTER_SCALE, Z_JITTER_SCALE } from './Spatial3D.types'

/**
 * Calculate coordinate transform for centering and scaling spatial data
 */
export function calculateCoordinateTransform(
  nodes: GraphNode[]
): CoordinateTransform {
  const nodesWithLocation = nodes.filter(n => n.location)

  if (nodesWithLocation.length === 0) {
    return {
      centerX: 0,
      centerY: 0,
      maxScale: 1,
      dataBounds: { minX: 0, maxX: 1, minY: 0, maxY: 1 },
    }
  }

  let minX = Infinity, maxX = -Infinity
  let minY = Infinity, maxY = -Infinity

  for (const node of nodesWithLocation) {
    const [x, y] = node.location!
    minX = Math.min(minX, x)
    maxX = Math.max(maxX, x)
    minY = Math.min(minY, y)
    maxY = Math.max(maxY, y)
  }

  const centerX = (minX + maxX) / 2
  const centerY = (minY + maxY) / 2
  const rangeX = maxX - minX || 1
  const rangeY = maxY - minY || 1
  const maxScale = Math.max(rangeX, rangeY) || 1

  return {
    centerX,
    centerY,
    maxScale,
    dataBounds: { minX, maxX, minY, maxY },
  }
}

/**
 * Calculate Z position based on time and temporal spacing mode
 */
function calculateZPosition(
  time: number,
  uniqueTimes: number[],
  temporalSpacing: number,
  mode: 'equal' | 'linear' | 'log'
): number {
  if (uniqueTimes.length <= 1) return 0

  const minTime = uniqueTimes[0]
  const maxTime = uniqueTimes[uniqueTimes.length - 1]
  const timeRange = maxTime - minTime || 1

  switch (mode) {
    case 'equal': {
      const index = uniqueTimes.indexOf(time)
      const normalizedIndex = index >= 0 ? index : 0
      return normalizedIndex * temporalSpacing
    }
    case 'log': {
      const normalizedTime = (time - minTime) / timeRange
      const logValue = normalizedTime > 0 ? Math.log10(1 + normalizedTime * 9) : 0
      return logValue * uniqueTimes.length * temporalSpacing
    }
    case 'linear':
    default: {
      const normalizedTime = (time - minTime) / timeRange
      return normalizedTime * uniqueTimes.length * temporalSpacing
    }
  }
}

/**
 * Add small random jitter to prevent overlapping nodes (X/Y)
 */
function addJitter(): number {
  return (Math.random() - 0.5) * JITTER_SCALE
}

/**
 * Add tiny random Z jitter to prevent clipping when nodes overlap
 */
function addZJitter(): number {
  return (Math.random() - 0.5) * Z_JITTER_SCALE
}

/**
 * Parse hex color to RGBA array
 */
function hexToRgba(hex: string, alpha: number = 255): [number, number, number, number] {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
  if (result) {
    return [
      parseInt(result[1], 16),
      parseInt(result[2], 16),
      parseInt(result[3], 16),
      alpha,
    ]
  }
  return [128, 128, 128, alpha]
}

/**
 * Calculate a contrasting color (black or white) based on background luminance
 */
export function getContrastColor(bgColor: [number, number, number, number]): [number, number, number, number] {
  // Calculate relative luminance using sRGB formula
  const [r, g, b] = bgColor
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255
  // Use white for dark backgrounds, black for light backgrounds
  return luminance > 0.5 ? [0, 0, 0, 255] : [255, 255, 255, 255]
}

/**
 * Transform nodes to 3D positions
 * Coordinate system with orbitAxis='Y': deck.gl [X, Y, Z] = [spatialX, spatialY, temporal]
 * - X axis: spatial X (side to side)
 * - Y axis: spatial Y (front to back)
 * - Z axis: temporal/time (vertical, with Z=0 at present/samples, higher Z = older/roots)
 */
export function transformNodesToThreeD(
  nodes: GraphNode[],
  transform: CoordinateTransform,
  theme: Theme,
  temporalSpacing: number = 12,
  spatialSpacing: number = 160,
  temporalSpacingMode: 'equal' | 'linear' | 'log' = 'linear',
  fullUniqueTimes?: number[],  // Optional: use full dataset times for consistent Z positioning
  populationColors?: Map<number, [number, number, number]> | null  // Optional: population color map
): Node3D[] {
  // Get unique times sorted - use full dataset times if provided for consistent positioning
  const uniqueTimes = fullUniqueTimes ?? [...new Set(nodes.map(n => n.time))].sort((a, b) => a - b)

  return nodes.map(node => {
    // Calculate spatial coordinates
    let spatialX = 0, spatialY = 0
    if (node.location) {
      spatialX = ((node.location[0] - transform.centerX) / transform.maxScale) * spatialSpacing + addJitter()
      spatialY = ((node.location[1] - transform.centerY) / transform.maxScale) * spatialSpacing + addJitter()
    } else {
      // For nodes without location, use random position
      spatialX = (Math.random() - 0.5) * spatialSpacing
      spatialY = (Math.random() - 0.5) * spatialSpacing
    }

    // Calculate temporal coordinate - higher time = further back in time (roots at top)
    // Add tiny Z jitter to prevent clipping when nodes overlap at same time
    const temporal = calculateZPosition(node.time, uniqueTimes, temporalSpacing, temporalSpacingMode) + BASE_ELEVATION + addZJitter()

    // Determine color and size
    let color: [number, number, number, number]
    let size: number

    // Use population colors if available and node has population
    if (populationColors && node.population !== null && node.population !== undefined) {
      const rgb = populationColors.get(node.population)
      if (rgb) {
        color = [rgb[0], rgb[1], rgb[2], 230]
        size = node.is_sample ? NODE_SIZES.SAMPLE : node.is_root ? NODE_SIZES.ROOT : NODE_SIZES.INTERNAL
      } else {
        // Fallback to theme colors
        if (node.is_sample) {
          color = hexToRgba(theme.nodes.sample, 230)
          size = NODE_SIZES.SAMPLE
        } else if (node.is_root) {
          color = hexToRgba(theme.nodes.root, 230)
          size = NODE_SIZES.ROOT
        } else {
          color = hexToRgba(theme.nodes.internal, 200)
          size = NODE_SIZES.INTERNAL
        }
      }
    } else {
      // Use theme colors
      if (node.is_sample) {
        color = hexToRgba(theme.nodes.sample, 230)
        size = NODE_SIZES.SAMPLE
      } else if (node.is_root) {
        color = hexToRgba(theme.nodes.root, 230)
        size = NODE_SIZES.ROOT
      } else {
        color = hexToRgba(theme.nodes.internal, 200)
        size = NODE_SIZES.INTERNAL
      }
    }

    // Position: [X, Y, Z] in deck.gl with orbitAxis='Y' means Y is vertical
    // So we put: [spatialX, spatialY, temporal] to make time vertical
    return {
      ...node,
      position: [spatialX, spatialY, temporal] as [number, number, number],
      color,
      size,
    }
  })
}

/**
 * Transform edges to 3D
 */
export function transformEdgesToThreeD(
  edges: GraphEdge[],
  nodeMap: Map<number, Node3D>,
  theme: Theme,
  edgeOpacity: number = 0.6
): Edge3D[] {
  const opacity = Math.round(edgeOpacity * 255)
  const baseColor = hexToRgba(theme.edges.default, opacity)

  return edges
    .filter(edge => nodeMap.has(edge.source) && nodeMap.has(edge.target))
    .map(edge => {
      const sourceNode = nodeMap.get(edge.source)!
      const targetNode = nodeMap.get(edge.target)!

      return {
        source: sourceNode.position,
        target: targetNode.position,
        color: baseColor,
      }
    })
}

/**
 * Calculate bounds of 3D scene
 */
export function calculate3DBounds(nodes: Node3D[]): {
  minX: number
  maxX: number
  minY: number
  maxY: number
  minZ: number
  maxZ: number
} {
  if (nodes.length === 0) {
    return { minX: 0, maxX: 1, minY: 0, maxY: 1, minZ: 0, maxZ: 1 }
  }

  let minX = Infinity, maxX = -Infinity
  let minY = Infinity, maxY = -Infinity
  let minZ = Infinity, maxZ = -Infinity

  for (const node of nodes) {
    const [x, y, z] = node.position
    minX = Math.min(minX, x)
    maxX = Math.max(maxX, x)
    minY = Math.min(minY, y)
    maxY = Math.max(maxY, y)
    minZ = Math.min(minZ, z)
    maxZ = Math.max(maxZ, z)
  }

  return { minX, maxX, minY, maxY, minZ, maxZ }
}

/**
 * Calculate initial view state to fit all data
 * Matches web app behavior: center on data bounds with AUTO_FIT_ZOOM of 1.8
 */
export function calculateInitialViewState(nodes: Node3D[]): {
  target: [number, number, number]
  zoom: number
} {
  const bounds = calculate3DBounds(nodes)

  // Center on the data bounds (matching web app approach)
  const centerX = (bounds.minX + bounds.maxX) / 2
  const centerY = (bounds.minY + bounds.maxY) / 2
  const centerZ = (bounds.minZ + bounds.maxZ) / 2  // True center, not 30% offset

  // Slightly zoomed out to prevent clipping bottom corner
  const AUTO_FIT_ZOOM = 1.4

  return {
    target: [centerX, centerY, centerZ],
    zoom: AUTO_FIT_ZOOM,
  }
}

/**
 * Auto-fit multiplier bounds
 */
const AUTO_FIT_TEMPORAL_MIN = 1
const AUTO_FIT_TEMPORAL_MAX = 50
const AUTO_FIT_SPATIAL_MIN = 50
const AUTO_FIT_SPATIAL_MAX = 300

/**
 * Calculate auto-fit multipliers based on viewport and data characteristics.
 *
 * The goal is to scale the visualization so it fills ~80% of the viewport
 * while maintaining readable temporal relationships.
 *
 * @param viewportWidth - Width of the viewport in pixels
 * @param viewportHeight - Height of the viewport in pixels
 * @param numTimeLevels - Number of unique time levels in the data
 * @param defaultTemporal - Default temporal multiplier (used as reference)
 * @param defaultSpatial - Default spatial multiplier (used as reference)
 * @returns Object with calculated temporal and spatial multipliers
 */
export function calculateAutoFitMultipliers(
  viewportWidth: number,
  viewportHeight: number,
  numTimeLevels: number,
  defaultTemporal: number = 12
): { temporalMultiplier: number; spatialMultiplier: number } {
  // Target: fill ~80% of viewport dimensions
  // Account for the OrbitView zoom level (default 1.8) and viewing angle
  // The effective visible area is roughly viewport / (zoom * perspective factor)
  const zoomFactor = 1.8
  const perspectiveFactor = 2.5  // Approximate factor for 3D perspective viewing

  // Calculate effective target dimensions
  const effectiveHeight = (viewportHeight * 0.8) / (zoomFactor * perspectiveFactor)
  const effectiveWidth = (viewportWidth * 0.8) / (zoomFactor * perspectiveFactor)

  // Temporal multiplier: controls Z spread
  // Z spread = numTimeLevels * temporalMultiplier (in 'equal' mode)
  // So: temporalMultiplier = targetHeight / numTimeLevels
  let temporalMultiplier: number
  if (numTimeLevels <= 1) {
    temporalMultiplier = defaultTemporal
  } else {
    temporalMultiplier = effectiveHeight / numTimeLevels
    // Clamp to bounds
    temporalMultiplier = Math.max(AUTO_FIT_TEMPORAL_MIN, Math.min(AUTO_FIT_TEMPORAL_MAX, temporalMultiplier))
  }

  // Spatial multiplier: controls XY spread
  // Spatial coordinates are normalized to roughly [-0.5, 0.5] then multiplied
  // So the spread is roughly spatialMultiplier
  let spatialMultiplier = effectiveWidth
  // Clamp to bounds
  spatialMultiplier = Math.max(AUTO_FIT_SPATIAL_MIN, Math.min(AUTO_FIT_SPATIAL_MAX, spatialMultiplier))

  return { temporalMultiplier, spatialMultiplier }
}
