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
 * Convert geographic shape coordinates to 3D lines for rendering
 * @param shape - Geographic shape data
 * @param zPosition - Z position for the lines (time slice)
 * @param spatialSpacing - Scaling factor for spatial coordinates
 * @param color - Color for the lines [r, g, b, a]
 * @param width - Line width (minimum width for visibility)
 * @returns Array of 3D lines representing the shape
 */
export function convertShapeToLines3D(
  shape: GeographicShape | any,
  zPosition: number,
  spatialSpacing: number = 160,
  color: [number, number, number, number] = [100, 100, 100, 255],
  width: number = 2  // Increased default width for better visibility
): GeographicLine3D[] {
  const lines: GeographicLine3D[] = [];

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
      
      lines.push({
        source: [x1, y1, zPosition],
        target: [x2, y2, zPosition],
        color,
        width
      });
    }
  };

  // Handle different geometry types
  switch (shape.type) {
    case 'Polygon':
      // shape.coordinates is number[][][]
      const polygonCoords = shape.coordinates as number[][][];
      if (polygonCoords.length > 0) {
        // Process exterior ring
        coordinateArrayToLines(polygonCoords[0]);
        
        // Process holes (interior rings)
        for (let i = 1; i < polygonCoords.length; i++) {
          coordinateArrayToLines(polygonCoords[i]);
        }
      }
      break;

    case 'MultiPolygon':
      // shape.coordinates is number[][][][]
      const multiPolygonCoords = shape.coordinates as number[][][][];
      for (const polygon of multiPolygonCoords) {
        if (polygon.length > 0) {
          // Process exterior ring
          coordinateArrayToLines(polygon[0]);
          
          // Process holes (interior rings)
          for (let i = 1; i < polygon.length; i++) {
            coordinateArrayToLines(polygon[i]);
          }
        }
      }
      break;

    case 'LineString':
      // shape.coordinates is number[][]
      if (Array.isArray(shape.coordinates) && shape.coordinates.length > 0 && Array.isArray(shape.coordinates[0]) && typeof shape.coordinates[0][0] === 'number') {
        coordinateArrayToLines(shape.coordinates as number[][]);
      }
      break;

    case 'MultiLineString':
      // shape.coordinates is number[][][]
      const multiLineCoords = shape.coordinates as number[][][];
      for (const line of multiLineCoords) {
        coordinateArrayToLines(line);
      }
      break;

    case 'GeometryCollection':
      // Handle geometry collection (like grid outlines)
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
 * Calculate bounding box for a geographic shape
 * @param shape - Geographic shape data
 * @returns Bounds [minX, minY, maxX, maxY]
 */
export function calculateShapeBounds(shape: GeographicShape): [number, number, number, number] {
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;

  const processCoordinates = (coords: number[] | number[][] | number[][][] | number[][][][]) => {
    if (typeof coords[0] === 'number') {
      // Single coordinate [x, y]
      const [x, y] = coords as number[];
      minX = Math.min(minX, x);
      minY = Math.min(minY, y);
      maxX = Math.max(maxX, x);
      maxY = Math.max(maxY, y);
    } else {
      // Nested array
      for (const coord of coords as any[]) {
        processCoordinates(coord);
      }
    }
  };

  if (shape.coordinates) {
    processCoordinates(shape.coordinates);
  }

  // Handle geometry collections
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

  const planeLines = convertShapeToLines3D(shape, zPosition, spatialSpacing, color, width);
  lines.push(...planeLines);

  return lines;
}

/**
 * Create a simple unit grid for comparison
 * @param size - Grid size (size x size)
 * @returns Grid shape data
 */
export function createUnitGridShape(size: number = 10): GeographicShape {
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