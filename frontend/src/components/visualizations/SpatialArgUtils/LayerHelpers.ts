import { PolygonLayer } from '@deck.gl/layers';
import { EdgeMutationSettings } from '../SpatialArg3D/SpatialArg3DVisualization.types';
import { MutationMarker3D } from './SpatialArg.types';
import { GraphEdge } from '../ForceDirectedGraph/ForceDirectedGraph.types';
import { ColorScheme } from '@/context/ColorThemeContext';

/**
 * Parse hex color string to RGBA array
 */
export function parseTextColor(
  colorString: string,
  alpha: number = 255
): [number, number, number, number] {
  // Try regex match first (for formats like "rgb(255, 255, 255)" or "#ffffff")
  const textColorMatch = colorString.match(/\d+/g);
  if (textColorMatch && textColorMatch.length >= 3) {
    return [
      parseInt(textColorMatch[0], 10),
      parseInt(textColorMatch[1], 10),
      parseInt(textColorMatch[2], 10),
      alpha
    ];
  }
  
  // Try hex parsing (for formats like "#ffffff")
  if (colorString.startsWith('#')) {
    return [
      parseInt(colorString.slice(1, 3), 16),
      parseInt(colorString.slice(3, 5), 16),
      parseInt(colorString.slice(5, 7), 16),
      alpha
    ];
  }
  
  // Fallback to white
  return [255, 255, 255, alpha];
}

/**
 * Extract source and target IDs from an edge (handles both number and object formats)
 */
export function getEdgeNodeIds(edge: GraphEdge): { sourceId: number; targetId: number } {
  const sourceId = typeof edge.source === 'number' ? edge.source : (edge.source as any).id;
  const targetId = typeof edge.target === 'number' ? edge.target : (edge.target as any).id;
  return { sourceId, targetId };
}

/**
 * Calculate midpoint position between two 3D positions
 */
export function calculateMidpoint(
  position1: [number, number, number],
  position2: [number, number, number]
): [number, number, number] {
  return [
    (position1[0] + position2[0]) / 2,
    (position1[1] + position2[1]) / 2,
    (position1[2] + position2[2]) / 2
  ];
}

/**
 * Create mutation markers for edges that have mutations
 */
export function createMutationMarkers<T extends { id: number; time: number; position: [number, number, number] }>(
  edges: GraphEdge[],
  nodeMap: Map<number, T>,
  edgeMutationSettings: EdgeMutationSettings | undefined,
  colors: ColorScheme
): MutationMarker3D[] {
  if (!edgeMutationSettings?.showMutationMarkers) {
    return [];
  }

  const markers: MutationMarker3D[] = [];
  
  // Iterate through all edges and their mutations
  edges.forEach(graphEdge => {
    if (!graphEdge.mutations || graphEdge.mutations.length === 0) {
      return;
    }
    
    const { sourceId, targetId } = getEdgeNodeIds(graphEdge);
    const sourceNode = nodeMap.get(sourceId);
    const targetNode = nodeMap.get(targetId);
    
    if (!sourceNode || !targetNode) {
      return;
    }
    
    // Create a marker for each mutation on this edge
    graphEdge.mutations.forEach((mutation: any) => {
      // Calculate position based on mutation time if available
      let position: [number, number, number];
      
      if (mutation.time !== null && mutation.time !== undefined) {
        const sourceTime = sourceNode.time;
        const targetTime = targetNode.time;
        const mutationTime = mutation.time;
        
        // Interpolate position based on time
        if (mutationTime >= targetTime && mutationTime <= sourceTime && sourceTime !== targetTime) {
          const timeRatio = (mutationTime - targetTime) / (sourceTime - targetTime);
          position = [
            targetNode.position[0] + timeRatio * (sourceNode.position[0] - targetNode.position[0]),
            targetNode.position[1] + timeRatio * (sourceNode.position[1] - targetNode.position[1]),
            targetNode.position[2] + timeRatio * (sourceNode.position[2] - targetNode.position[2])
          ];
        } else {
          // Fallback to midpoint if time is out of range
          position = calculateMidpoint(sourceNode.position, targetNode.position);
        }
      } else {
        // No time info - use midpoint
        position = calculateMidpoint(sourceNode.position, targetNode.position);
      }
      
      markers.push({
        position,
        text: "✕", // Use heavy multiplication sign for thicker appearance
        color: colors.mutationMarker, // Use theme mutation marker color
        size: edgeMutationSettings.markerSize || 18,
        sourceId: sourceId,
        targetId: targetId,
        mutation: mutation
      });
    });
  });

  return markers;
}

/**
 * Create PolygonLayer for ancestry heatmap
 */
export function createHeatmapPolygonLayer(
  ancestryHeatmap: any[],
  heatmapSettings: any,
  temporalRange: [number, number] | null | undefined,
  temporalFilterMode: string | null | undefined
): PolygonLayer | null {
  if (ancestryHeatmap.length === 0) {
    return null;
  }

  return new PolygonLayer({
    id: 'ancestry-heatmap',
    data: ancestryHeatmap,
    pickable: false,
    stroked: false,
    filled: true,
    extruded: false,
    getPolygon: (d: any) => d.polygon,
    getFillColor: (d: any) => d.color,
    getLineColor: [0, 0, 0, 0],
    lineWidthMinPixels: 0,
    updateTriggers: {
      getPolygon: [heatmapSettings, temporalRange, temporalFilterMode],
      getFillColor: [heatmapSettings]
    }
  });
}

