import { PolygonLayer } from '@deck.gl/layers';
import { EdgeMutationSettings } from '../SpatialArg3D/SpatialArg3DVisualization.types';
import { MutationMarker3D } from './SpatialArg.types';
import { GraphEdge } from '../ForceDirectedGraph/ForceDirectedGraph.types';

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
export function createMutationMarkers<T extends { id: number; position: [number, number, number] }>(
  edges: GraphEdge[],
  nodeMap: Map<number, T>,
  edgeMutationSettings: EdgeMutationSettings | undefined
): MutationMarker3D[] {
  if (!edgeMutationSettings?.showMutationMarkers) {
    return [];
  }

  const markers: MutationMarker3D[] = [];
  
  // Filter edges that have mutations
  const mutationEdges = edges.filter(edge => edge.has_mutations);
  
  mutationEdges.forEach(graphEdge => {
    const { sourceId, targetId } = getEdgeNodeIds(graphEdge);
    
    const sourceNode = nodeMap.get(sourceId);
    const targetNode = nodeMap.get(targetId);
    
    if (sourceNode && targetNode) {
      // Calculate midpoint position for marker
      const position = calculateMidpoint(sourceNode.position, targetNode.position);
      
      markers.push({
        position,
        text: "×", // Use multiplication sign for clean "x" appearance
        color: [220, 38, 38, 255], // Red color (#dc2626)
        size: edgeMutationSettings.markerSize || 14,
        sourceId: sourceId,
        targetId: targetId
      });
    }
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

