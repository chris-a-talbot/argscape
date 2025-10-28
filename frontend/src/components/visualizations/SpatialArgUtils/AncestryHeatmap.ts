/**
 * Ancestry Heatmap Utilities
 * 
 * Provides functions for:
 * - Tracing ancestors backward through ARG edges
 * - Building spatial density maps from ancestor locations
 * - Generating heatmap grids with kernel density estimation
 * - Creating heatmap visualization layers
 */

import { GraphNode, GraphEdge } from '../ForceDirectedGraph/ForceDirectedGraph.types';

export interface Node3D extends GraphNode {
  position: [number, number, number];
  color: [number, number, number, number];
  size: number;
  is_combined?: boolean;
  combined_nodes?: number[];
}

export interface AncestorLocation {
  x: number;
  y: number;
  generation: number; // How many generations back
}

export interface HeatmapCell {
  x: number;
  y: number;
  density: number;
  normalizedDensity: number; // 0 to 1
}

export interface HeatmapGrid {
  cells: HeatmapCell[];
  gridSize: number;
  bounds: {
    minX: number;
    maxX: number;
    minY: number;
    maxY: number;
  };
}

/**
 * Trace ancestors backward from a given node within a time window
 * @param nodeId - Starting node ID
 * @param startTime - Time of the starting node
 * @param minTime - Minimum time to trace back to (older than this will be excluded)
 * @param nodes - All nodes in the graph
 * @param edges - All edges in the graph
 * @param nodeMap - Map for quick node lookup
 * @returns Array of ancestor locations with their time distance
 */
export function traceAncestors(
  nodeId: number,
  startTime: number,
  minTime: number,
  nodes: GraphNode[],
  edges: GraphEdge[],
  nodeMap: Map<number, GraphNode>
): AncestorLocation[] {
  const ancestorLocations: AncestorLocation[] = [];
  const visited = new Set<number>();
  
  // BFS to trace ancestors within time window
  const queue: Array<{ nodeId: number; nodeTime: number }> = [{ nodeId, nodeTime: startTime }];
  visited.add(nodeId);
  
  let iterationCount = 0;
  const maxIterations = 10000; // Safety limit
  
  while (queue.length > 0 && iterationCount < maxIterations) {
    iterationCount++;
    const { nodeId: currentId, nodeTime: currentTime } = queue.shift()!;
    
    const currentNode = nodeMap.get(currentId);
    if (!currentNode) {
      console.warn(`Node ${currentId} not found in nodeMap`);
      continue;
    }
    
    // Find all parent edges (edges where current node is the target)
    const parentEdges = edges.filter(edge => {
      const targetId = typeof edge.target === 'object' ? edge.target.id : edge.target;
      return targetId === currentId;
    });
    
    if (iterationCount <= 3) {
      console.log(`Iteration ${iterationCount}: Node ${currentId} has ${parentEdges.length} parent edges`);
    }
    
    // Process each parent
    for (const edge of parentEdges) {
      const parentId = typeof edge.source === 'object' ? edge.source.id : edge.source;
      
      if (visited.has(parentId)) continue;
      
      const parentNode = nodeMap.get(parentId);
      if (!parentNode) {
        console.warn(`Parent node ${parentId} not found`);
        continue;
      }
      
      if (!parentNode.location) {
        console.warn(`Parent node ${parentId} has no location`);
        continue;
      }
      
      // Only include parents within the time window
      if (parentNode.time < minTime) {
        if (iterationCount <= 3) {
          console.log(`Parent ${parentId} (t=${parentNode.time}) is too old (minTime=${minTime})`);
        }
        continue;
      }
      
      visited.add(parentId);
      
      // Add ancestor location with temporal distance for weighting
      const timeDist = startTime - parentNode.time;
      ancestorLocations.push({
        x: parentNode.location.x,
        y: parentNode.location.y,
        generation: timeDist // Using time distance instead of generation count
      });
      
      if (iterationCount <= 3) {
        console.log(`Added ancestor ${parentId} (t=${parentNode.time}) at (${parentNode.location.x}, ${parentNode.location.y})`);
      }
      
      // Continue tracing if parent is within time window
      queue.push({ nodeId: parentId, nodeTime: parentNode.time });
    }
  }
  
  if (iterationCount >= maxIterations) {
    console.warn('Max iterations reached in ancestor tracing');
  }
  
  return ancestorLocations;
}

/**
 * Calculate ancestry density by collecting nodes within a time window
 * @param nodesInWindow - Nodes already filtered to the desired time window
 * @param timeDepth - DEPRECATED - not used anymore
 * @param allNodes - DEPRECATED - not used anymore
 * @param allEdges - DEPRECATED - not used anymore
 * @returns Array of ancestor locations with their time distance
 */
export function calculateAncestryDensity(
  nodesInWindow: GraphNode[],
  timeDepth: number,
  allNodes: GraphNode[],
  allEdges: GraphEdge[]
): AncestorLocation[] {
  const allAncestorLocations: AncestorLocation[] = [];
  
  if (nodesInWindow.length === 0) {
    console.warn('No nodes provided for heatmap calculation');
    return [];
  }
  
  // Get reference time (max time in the window) for temporal weighting
  const referenceTime = Math.max(...nodesInWindow.map(n => n.time));
  
  console.log('Calculating ancestry density:', {
    nodesProvided: nodesInWindow.length,
    nodesWithLocations: nodesInWindow.filter(n => n.location).length,
    timeRange: [Math.min(...nodesInWindow.map(n => n.time)), referenceTime]
  });
  
  // Convert nodes to ancestor locations with temporal weighting
  for (const node of nodesInWindow) {
    if (!node.location) {
      console.warn(`Node ${node.id} has no location, skipping`);
      continue;
    }
    
    const timeDist = referenceTime - node.time; // Distance from reference (0 for newest nodes)
    allAncestorLocations.push({
      x: node.location.x,
      y: node.location.y,
      generation: timeDist // Used for temporal weighting in density calculation
    });
  }
  
  console.log('Total ancestor locations collected:', allAncestorLocations.length);
  
  return allAncestorLocations;
}

/**
 * Gaussian kernel for density estimation
 * @param distance - Distance from point
 * @param bandwidth - Kernel bandwidth (controls smoothness)
 * @returns Kernel weight
 */
function gaussianKernel(distance: number, bandwidth: number): number {
  const u = distance / bandwidth;
  return Math.exp(-0.5 * u * u);
}

/**
 * Generate a 2D grid with kernel density estimation
 * @param ancestorLocations - Array of ancestor locations
 * @param bounds - Spatial bounds for the grid
 * @param resolution - Number of grid cells per axis
 * @param bandwidth - Kernel bandwidth for KDE (optional, auto-calculated if not provided)
 * @param weightByTime - Apply temporal weighting (older nodes = less weight)
 * @returns Heatmap grid with density values
 */
export function generateHeatmapGrid(
  ancestorLocations: AncestorLocation[],
  bounds: { minX: number; maxX: number; minY: number; maxY: number },
  resolution: number,
  bandwidth?: number,
  weightByTime: boolean = false
): HeatmapGrid {
  if (ancestorLocations.length === 0) {
    return {
      cells: [],
      gridSize: resolution,
      bounds
    };
  }
  
  const { minX, maxX, minY, maxY } = bounds;
  const cellWidth = (maxX - minX) / resolution;
  const cellHeight = (maxY - minY) / resolution;
  
  // Auto-calculate bandwidth if not provided (Scott's rule)
  const bw = bandwidth ?? Math.min(cellWidth, cellHeight) * 2.5;
  
  const cells: HeatmapCell[] = [];
  let maxDensity = 0;
  
  // Generate grid cells and calculate density for each
  for (let i = 0; i < resolution; i++) {
    for (let j = 0; j < resolution; j++) {
      const cellX = minX + (i + 0.5) * cellWidth;
      const cellY = minY + (j + 0.5) * cellHeight;
      
      // Calculate kernel density estimate at this cell
      let density = 0;
      for (const ancestor of ancestorLocations) {
        const dx = cellX - ancestor.x;
        const dy = cellY - ancestor.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        // Apply temporal weighting if enabled (older nodes = less weight)
        // ancestor.generation is the time distance from reference point (0 = newest in window)
        const temporalWeight = weightByTime 
          ? 1.0 / (1 + ancestor.generation * 0.1)  // Decay function: older = less weight
          : 1.0;                                    // No weighting
        
        density += gaussianKernel(distance, bw) * temporalWeight;
      }
      
      maxDensity = Math.max(maxDensity, density);
      
      cells.push({
        x: cellX,
        y: cellY,
        density,
        normalizedDensity: 0 // Will be normalized in next step
      });
    }
  }
  
  // Normalize densities to 0-1 range
  if (maxDensity > 0) {
    for (const cell of cells) {
      cell.normalizedDensity = cell.density / maxDensity;
    }
  }
  
  return {
    cells,
    gridSize: resolution,
    bounds
  };
}

/**
 * Convert heatmap grid to polygon data for rendering
 * @param grid - Heatmap grid
 * @param coordinateTransform - Transform for converting to 3D space
 * @param spatialSpacing - Spatial spacing factor
 * @param zPosition - Z position for the heatmap layer
 * @param opacity - Base opacity (0-100)
 * @returns Array of polygon data for rendering
 */
export function heatmapGridToPolygons(
  grid: HeatmapGrid,
  coordinateTransform: {
    centerX: number;
    centerY: number;
    maxScale: number;
  },
  spatialSpacing: number,
  zPosition: number,
  opacity: number
): Array<{
  polygon: Array<[number, number, number]>;
  color: [number, number, number, number];
}> {
  const { centerX, centerY, maxScale } = coordinateTransform;
  const { bounds, gridSize } = grid;
  const cellWidth = (bounds.maxX - bounds.minX) / gridSize;
  const cellHeight = (bounds.maxY - bounds.minY) / gridSize;
  
  const polygons = [];
  
  for (const cell of grid.cells) {
    if (cell.normalizedDensity < 0.01) continue; // Skip near-zero density cells
    
    // Calculate cell corners in original space
    const x1 = cell.x - cellWidth / 2;
    const x2 = cell.x + cellWidth / 2;
    const y1 = cell.y - cellHeight / 2;
    const y2 = cell.y + cellHeight / 2;
    
    // Transform to 3D space
    const nx1 = ((x1 - centerX) / maxScale) * spatialSpacing;
    const nx2 = ((x2 - centerX) / maxScale) * spatialSpacing;
    const ny1 = ((y1 - centerY) / maxScale) * spatialSpacing;
    const ny2 = ((y2 - centerY) / maxScale) * spatialSpacing;
    
    // Create polygon (rectangle) for this cell
    const polygon: Array<[number, number, number]> = [
      [nx1, ny1, zPosition],
      [nx2, ny1, zPosition],
      [nx2, ny2, zPosition],
      [nx1, ny2, zPosition]
    ];
    
    // Color mapping: blue (low density) -> yellow -> red (high density)
    const color = densityToColor(cell.normalizedDensity, opacity);
    
    polygons.push({ polygon, color });
  }
  
  return polygons;
}

/**
 * Map density value to a color (heatmap color scale)
 * @param normalizedDensity - Density value from 0 to 1
 * @param baseOpacity - Base opacity (0-100)
 * @returns RGBA color
 */
function densityToColor(
  normalizedDensity: number,
  baseOpacity: number
): [number, number, number, number] {
  // Convert opacity from 0-100 to 0-255
  const alpha = (baseOpacity / 100) * 255;
  
  // Color scale: blue -> cyan -> green -> yellow -> orange -> red
  // This provides good visual distinction for density
  
  if (normalizedDensity < 0.2) {
    // Blue to Cyan
    const t = normalizedDensity / 0.2;
    return [
      Math.round(0 + 0 * t),
      Math.round(0 + 255 * t),
      Math.round(255),
      alpha
    ];
  } else if (normalizedDensity < 0.4) {
    // Cyan to Green
    const t = (normalizedDensity - 0.2) / 0.2;
    return [
      Math.round(0),
      Math.round(255),
      Math.round(255 - 255 * t),
      alpha
    ];
  } else if (normalizedDensity < 0.6) {
    // Green to Yellow
    const t = (normalizedDensity - 0.4) / 0.2;
    return [
      Math.round(0 + 255 * t),
      Math.round(255),
      Math.round(0),
      alpha
    ];
  } else if (normalizedDensity < 0.8) {
    // Yellow to Orange
    const t = (normalizedDensity - 0.6) / 0.2;
    return [
      Math.round(255),
      Math.round(255 - 100 * t),
      Math.round(0),
      alpha
    ];
  } else {
    // Orange to Red
    const t = (normalizedDensity - 0.8) / 0.2;
    return [
      Math.round(255),
      Math.round(155 - 155 * t),
      Math.round(0),
      alpha
    ];
  }
}

