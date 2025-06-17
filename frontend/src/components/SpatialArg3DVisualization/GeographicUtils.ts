/**
 * Geographic utilities for 3D spatial visualization
 * Handles conversion of geographic shapes to 3D lines for rendering
 */

import { GeographicShape } from '../ForceDirectedGraph/ForceDirectedGraph.types';

export interface GeographicLine3D {
  source: [number, number, number];
  target: [number, number, number];
  color: [number, number, number, number];
  width: number;
}

/**
 * Convert geographic shape to a set of 2D lines that can be rendered at any z-height
 */
export function convertShapeToLines(
  shape: GeographicShape | any,
  spatialSpacing: number = 160,
): [number, number, number, number][] {
  const lines: [number, number, number, number][] = [];

  if (!shape || !shape.coordinates) {
    return lines;
  }

  // Get shape bounds for normalization
  const bounds = shape.bounds || calculateShapeBounds(shape);
  const [minX, minY, maxX, maxY] = bounds;
  const centerX = (minX + maxX) / 2;
  const centerY = (minY + maxY) / 2;
  const maxScale = Math.max(maxX - minX, maxY - minY) || 1;

  // Helper function to normalize and scale coordinates
  const normalizeCoordinate = (x: number, y: number): [number, number] => {
    const normalizedX = ((x - centerX) / maxScale) * spatialSpacing;
    const normalizedY = ((y - centerY) / maxScale) * spatialSpacing;
    return [normalizedX, normalizedY];
  };

  // Helper function to convert coordinate array to lines
  const coordinateArrayToLines = (coords: number[][]): void => {
    for (let i = 0; i < coords.length - 1; i++) {
      const [x1, y1] = normalizeCoordinate(coords[i][0], coords[i][1]);
      const [x2, y2] = normalizeCoordinate(coords[i + 1][0], coords[i + 1][1]);
      lines.push([x1, y1, x2, y2]);
    }
  };

  // Handle different geometry types
  switch (shape.type) {
    case 'Polygon':
      const polygonCoords = shape.coordinates as number[][][];
      if (polygonCoords.length > 0) {
        coordinateArrayToLines(polygonCoords[0]);
        for (let i = 1; i < polygonCoords.length; i++) {
          coordinateArrayToLines(polygonCoords[i]);
        }
      }
      break;

    case 'MultiPolygon':
      const multiPolygonCoords = shape.coordinates as number[][][][];
      for (const polygon of multiPolygonCoords) {
        if (polygon.length > 0) {
          coordinateArrayToLines(polygon[0]);
          for (let i = 1; i < polygon.length; i++) {
            coordinateArrayToLines(polygon[i]);
          }
        }
      }
      break;

    case 'LineString':
      if (Array.isArray(shape.coordinates) && shape.coordinates.length > 0) {
        coordinateArrayToLines(shape.coordinates as number[][]);
      }
      break;

    case 'MultiLineString':
      const multiLineCoords = shape.coordinates as number[][][];
      for (const line of multiLineCoords) {
        coordinateArrayToLines(line);
      }
      break;

    case 'GeometryCollection':
      if ('geometries' in shape) {
        const geometries = (shape as any).geometries;
        for (const geometry of geometries) {
          if (geometry.type === 'LineString' && geometry.coordinates) {
            coordinateArrayToLines(geometry.coordinates);
          }
        }
      }
      break;

    default:
      console.warn(`Unsupported geometry type: ${shape.type}`);
  }

  return lines;
}

/**
 * Create lines for rendering a shape at a specific z-height
 */
export function createShapeLines(
  shapeLines: [number, number, number, number][],
  zHeight: number,
  color: [number, number, number, number],
  width: number
): GeographicLine3D[] {
  return shapeLines.map(([x1, y1, x2, y2]) => ({
    source: [x1, y1, zHeight] as [number, number, number],
    target: [x2, y2, zHeight] as [number, number, number],
    color,
    width
  }));
}

/**
 * Calculate bounding box for a geographic shape
 */
export function calculateShapeBounds(shape: GeographicShape): [number, number, number, number] {
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;

  const processCoordinates = (coords: number[] | number[][] | number[][][] | number[][][][]) => {
    if (typeof coords[0] === 'number') {
      const [x, y] = coords as number[];
      minX = Math.min(minX, x);
      minY = Math.min(minY, y);
      maxX = Math.max(maxX, x);
      maxY = Math.max(maxY, y);
    } else {
      for (const coord of coords as any[]) {
        processCoordinates(coord);
      }
    }
  };

  if (shape.coordinates) {
    processCoordinates(shape.coordinates);
  }

  if ('geometries' in shape) {
    const geometries = (shape as any).geometries;
    for (const geometry of geometries) {
      if (geometry.coordinates) {
        processCoordinates(geometry.coordinates);
      }
    }
  }

  return [minX, minY, maxX, maxY];
}

/**
 * Create geographic planes for temporal visualization
 * Creates a single plane at the center of the temporal window, replicating the shape from time=0
 * @param shape - Geographic shape data
 * @param allTimeSlices - Array of ALL time values in the dataset (used to determine z-index mapping)
 * @param temporalSpacing - Spacing between time slices
 * @param spatialSpacing - Scaling factor for spatial coordinates
 * @param baseColor - Base color for the lines [r, g, b]
 * @param temporalRange - Temporal range filter [min, max] - plane will be placed at center of this range
 * @param z - Optional z position for the plane
 * @returns Array of 3D lines for the temporal plane
 */
export function createGeographicTemporalPlanes(
  shape: GeographicShape,
  allTimeSlices: number[],
  temporalSpacing: number = 12,
  spatialSpacing: number = 160,
  baseColor: [number, number, number] = [100, 100, 100],
  temporalRange?: [number, number],
  z?: number
): GeographicLine3D[] {
  const lines: GeographicLine3D[] = [];

  if (!temporalRange || !shape) {
    return lines;
  }

  // Use provided z position if available, otherwise calculate it
  const zPosition = z ?? 0.1; // Default to base elevation if no z provided

  // Create a single plane at the specified z position
  const opacity = 120; // More visible than regular time planes
  const width = 2.0;    // Thicker lines for the temporal reference plane
  const color: [number, number, number, number] = [baseColor[0], baseColor[1], baseColor[2], opacity];

  const planeLines = convertShapeToLines(shape, spatialSpacing);
  lines.push(...planeLines.map(([x1, y1, x2, y2]) => ({
    source: [x1, y1, zPosition],
    target: [x2, y2, zPosition],
    color,
    width
  })));

  return lines;
}

/**
 * Create a simple unit grid
 */
export function createUnitGridShape(size: number = 10, spatialSpacing: number = 160): GeographicShape {
  const coordinates: number[][][] = [];
  
  // Create horizontal lines
  for (let i = 0; i <= size; i++) {
    coordinates.push([
      [0, i],
      [size, i]
    ]);
  }
  
  // Create vertical lines
  for (let i = 0; i <= size; i++) {
    coordinates.push([
      [i, 0],
      [i, size]
    ]);
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
  };
}

/**
 * Validate that node coordinates fit within a geographic shape's bounds
 * @param nodeCoordinates - Array of [x, y] coordinates
 * @param shape - Geographic shape
 * @returns Object with validation results
 */
export function validateNodesInShape(
  nodeCoordinates: [number, number][],
  shape: GeographicShape
): {
  validCount: number;
  totalCount: number;
  validPercentage: number;
  outOfBounds: [number, number][];
} {
  const bounds = shape.bounds || calculateShapeBounds(shape);
  const [minX, minY, maxX, maxY] = bounds;
  
  let validCount = 0;
  const outOfBounds: [number, number][] = [];
  
  nodeCoordinates.forEach(([x, y]) => {
    if (x >= minX && x <= maxX && y >= minY && y <= maxY) {
      validCount++;
    } else {
      outOfBounds.push([x, y]);
    }
  });
  
  return {
    validCount,
    totalCount: nodeCoordinates.length,
    validPercentage: (validCount / nodeCoordinates.length) * 100,
    outOfBounds
  };
} 