/**
 * Geographic utilities for 3D spatial visualization
 * Handles creation and conversion of geographic shapes to 3D lines for rendering
 */

export interface GeographicLine3D {
  source: [number, number, number]
  target: [number, number, number]
  color: [number, number, number, number]
  width: number
}

export interface GeographicShape {
  type: string
  name?: string
  bounds: [number, number, number, number]  // [minX, minY, maxX, maxY]
  crs?: string | null
  coordinates?: number[][] | number[][][] | number[][][][]
  geometries?: Array<{
    type: string
    coordinates: number[][] | number[][][] | number[][][][]
  }>
}

/**
 * Create a simple unit grid for spatial reference
 */
export function createUnitGridShape(size: number = 10, _spatialSpacing: number = 160): GeographicShape {
  const coordinates: number[][][] = []

  // Create horizontal lines
  for (let i = 0; i <= size; i++) {
    coordinates.push([
      [0, i],
      [size, i]
    ])
  }

  // Create vertical lines
  for (let i = 0; i <= size; i++) {
    coordinates.push([
      [i, 0],
      [i, size]
    ])
  }

  return {
    type: 'GeometryCollection',
    name: 'Unit Grid',
    bounds: [0, 0, size, size],
    coordinates: coordinates.flat(),
    geometries: coordinates.map(coords => ({
      type: 'LineString',
      coordinates: coords
    }))
  }
}

/**
 * Calculate bounding box for a geographic shape
 */
export function calculateShapeBounds(shape: GeographicShape): [number, number, number, number] {
  let minX = Infinity
  let minY = Infinity
  let maxX = -Infinity
  let maxY = -Infinity

  const processCoordinates = (coords: number[] | number[][] | number[][][] | number[][][][]) => {
    if (typeof coords[0] === 'number') {
      const [x, y] = coords as number[]
      minX = Math.min(minX, x)
      minY = Math.min(minY, y)
      maxX = Math.max(maxX, x)
      maxY = Math.max(maxY, y)
    } else {
      for (const coord of coords as (number[] | number[][] | number[][][] | number[][][][])[]) {
        processCoordinates(coord as number[] | number[][] | number[][][] | number[][][][])
      }
    }
  }

  if (shape.coordinates) {
    processCoordinates(shape.coordinates)
  }

  if (shape.geometries) {
    for (const geometry of shape.geometries) {
      if (geometry.coordinates) {
        processCoordinates(geometry.coordinates)
      }
    }
  }

  return [minX, minY, maxX, maxY]
}

/**
 * Convert geographic shape to a set of 2D lines that can be rendered at any z-height
 */
export function convertShapeToLines(
  shape: GeographicShape,
  spatialSpacing: number = 160,
): [number, number, number, number][] {
  const lines: [number, number, number, number][] = []

  if (!shape) {
    return lines
  }

  // Get shape bounds for normalization
  const bounds = shape.bounds || calculateShapeBounds(shape)
  const [minX, minY, maxX, maxY] = bounds
  const centerX = (minX + maxX) / 2
  const centerY = (minY + maxY) / 2
  const maxScale = Math.max(maxX - minX, maxY - minY) || 1

  // Helper function to normalize and scale coordinates
  const normalizeCoordinate = (x: number, y: number): [number, number] => {
    const normalizedX = ((x - centerX) / maxScale) * spatialSpacing
    const normalizedY = ((y - centerY) / maxScale) * spatialSpacing
    return [normalizedX, normalizedY]
  }

  // Helper function to convert coordinate array to lines
  const coordinateArrayToLines = (coords: number[][]): void => {
    for (let i = 0; i < coords.length - 1; i++) {
      const [x1, y1] = normalizeCoordinate(coords[i][0], coords[i][1])
      const [x2, y2] = normalizeCoordinate(coords[i + 1][0], coords[i + 1][1])
      lines.push([x1, y1, x2, y2])
    }
  }

  // Handle different geometry types
  switch (shape.type) {
    case 'Polygon': {
      const polygonCoords = shape.coordinates as number[][][]
      if (polygonCoords && polygonCoords.length > 0) {
        coordinateArrayToLines(polygonCoords[0])
        for (let i = 1; i < polygonCoords.length; i++) {
          coordinateArrayToLines(polygonCoords[i])
        }
      }
      break
    }

    case 'MultiPolygon': {
      const multiPolygonCoords = shape.coordinates as number[][][][]
      if (multiPolygonCoords) {
        for (const polygon of multiPolygonCoords) {
          if (polygon.length > 0) {
            coordinateArrayToLines(polygon[0])
            for (let i = 1; i < polygon.length; i++) {
              coordinateArrayToLines(polygon[i])
            }
          }
        }
      }
      break
    }

    case 'LineString': {
      if (Array.isArray(shape.coordinates) && shape.coordinates.length > 0) {
        coordinateArrayToLines(shape.coordinates as number[][])
      }
      break
    }

    case 'MultiLineString': {
      const multiLineCoords = shape.coordinates as number[][][]
      if (multiLineCoords) {
        for (const line of multiLineCoords) {
          coordinateArrayToLines(line)
        }
      }
      break
    }

    case 'GeometryCollection': {
      if (shape.geometries) {
        for (const geometry of shape.geometries) {
          if (geometry.coordinates) {
            if (geometry.type === 'LineString') {
              // LineString coordinates are number[][]
              coordinateArrayToLines(geometry.coordinates as number[][])
            } else if (geometry.type === 'Polygon') {
              // Polygon coordinates are number[][][]
              const polygonCoords = geometry.coordinates as number[][][]
              if (polygonCoords.length > 0) {
                coordinateArrayToLines(polygonCoords[0])
              }
            } else if (geometry.type === 'MultiLineString') {
              const multiLineCoords = geometry.coordinates as number[][][]
              for (const line of multiLineCoords) {
                coordinateArrayToLines(line)
              }
            }
          }
        }
      }
      break
    }

    default:
      console.warn(`Unsupported geometry type: ${shape.type}`)
  }

  return lines
}

/**
 * Create lines for rendering a shape at a specific temporal height (on X-Y plane)
 * With orbitAxis='Y', deck.gl coordinates are: [spatialX, spatialY, temporal]
 * So the shape (spatial X, spatial Y) goes on the X-Y plane at Z=temporalHeight
 */
export function createShapeLines(
  shapeLines: [number, number, number, number][],
  temporalHeight: number,
  color: [number, number, number, number],
  width: number
): GeographicLine3D[] {
  // shapeLines contains [spatialX1, spatialY1, spatialX2, spatialY2]
  // We map these to deck.gl [X, Y, Z] = [spatialX, spatialY, temporal]
  return shapeLines.map(([spatialX1, spatialY1, spatialX2, spatialY2]) => ({
    source: [spatialX1, spatialY1, temporalHeight] as [number, number, number],
    target: [spatialX2, spatialY2, temporalHeight] as [number, number, number],
    color,
    width
  }))
}

// Constants matching the web app
export const UNIT_GRID_SIZE = 10
export const GRID_EXTENSION = 2
export const LINE_WIDTHS = {
  GEOGRAPHIC_NORMAL: 1.5,
  TIME_SLICE_NORMAL: 0.8,
}

/**
 * Create a simple eastern hemisphere shape (simplified world map outline)
 * Covers roughly 0° to 180° longitude, -60° to 80° latitude
 */
export function createEasternHemisphereShape(_spatialSpacing: number = 160): GeographicShape {
  // Simplified outline of the eastern hemisphere landmasses
  // Using approximate coordinates for major continental outlines
  const coordinates: number[][][] = [
    // Africa outline (simplified)
    [
      [0, 35], [10, 37], [35, 32], [43, 12], [51, 12],
      [51, -2], [42, -12], [35, -22], [28, -34], [18, -35],
      [12, -25], [15, -15], [8, 5], [5, 15], [-5, 25], [-10, 35], [0, 35]
    ],
    // Europe outline (simplified)
    [
      [0, 35], [-10, 36], [-10, 44], [0, 48], [5, 50], [10, 55],
      [20, 55], [25, 60], [30, 60], [40, 55], [50, 55], [60, 50],
      [50, 45], [40, 47], [30, 45], [25, 42], [20, 40], [10, 37], [0, 35]
    ],
    // Asia outline (simplified)
    [
      [60, 50], [70, 55], [80, 55], [90, 50], [100, 55], [120, 55],
      [140, 50], [145, 45], [140, 35], [130, 35], [120, 30], [110, 20],
      [100, 15], [95, 10], [100, 5], [105, -5], [120, -8], [130, -5],
      [140, -10], [150, -20], [145, -35], [135, -35], [130, -30],
      [120, -20], [110, -10], [100, 0], [90, 5], [80, 15], [70, 25],
      [60, 35], [50, 45], [60, 50]
    ],
    // Australia outline (simplified)
    [
      [115, -20], [120, -18], [130, -15], [140, -15], [145, -18],
      [150, -25], [153, -30], [150, -35], [140, -38], [130, -35],
      [120, -30], [115, -25], [115, -20]
    ],
    // Grid lines for reference - longitude lines
    [[0, -60], [0, 80]],
    [[30, -60], [30, 80]],
    [[60, -60], [60, 80]],
    [[90, -60], [90, 80]],
    [[120, -60], [120, 80]],
    [[150, -60], [150, 80]],
    [[180, -60], [180, 80]],
    // Grid lines for reference - latitude lines
    [[-10, -60], [180, -60]],
    [[-10, -30], [180, -30]],
    [[-10, 0], [180, 0]],
    [[-10, 30], [180, 30]],
    [[-10, 60], [180, 60]],
  ]

  return {
    type: 'GeometryCollection',
    name: 'Eastern Hemisphere',
    bounds: [-10, -60, 180, 80],
    crs: 'EPSG:4326',
    geometries: coordinates.map(coords => ({
      type: coords.length > 2 ? 'Polygon' : 'LineString',
      coordinates: coords.length > 2 ? [coords] : coords
    }))
  }
}

/**
 * Get a built-in geographic shape by name
 */
export function getBuiltInShape(name: 'unit_grid' | 'eastern_hemisphere', spatialSpacing: number = 160): GeographicShape {
  switch (name) {
    case 'eastern_hemisphere':
      return createEasternHemisphereShape(spatialSpacing)
    case 'unit_grid':
    default:
      return createUnitGridShape(UNIT_GRID_SIZE, spatialSpacing)
  }
}
