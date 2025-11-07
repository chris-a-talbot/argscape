import { GeographicMode, Node3D } from "./SpatialArg.types";
import { VISUALIZATION_CONSTANTS } from "./SpatialArg.constants";
import { GeographicShape, GraphNode, GraphEdge } from "../ForceDirectedGraph/ForceDirectedGraph.types";
import { createUnitGridShape } from "./GeographicUtils";

// Helper function to calculate z position based on temporal spacing mode
export function calculateZPosition(
    time: number,
    uniqueTimes: number[],
    temporalSpacing: number,
    temporalSpacingMode: 'equal' | 'log' | 'linear'
  ): number {
    if (uniqueTimes.length <= 1) return 0;
  
    switch (temporalSpacingMode) {
      case 'equal':
        // Find the closest time index, or exact match if found
        let timeIndex = uniqueTimes.indexOf(time);
        if (timeIndex === -1) {
          // Find the closest time by finding where this time would fit
          // Find the first time that is >= targetTime
          timeIndex = uniqueTimes.findIndex(t => t >= time);
          if (timeIndex === -1) {
            // All times are less than targetTime, use the last index
            timeIndex = uniqueTimes.length - 1;
          } else if (timeIndex > 0) {
            // Check if previous time is closer
            const prevTime = uniqueTimes[timeIndex - 1];
            const nextTime = uniqueTimes[timeIndex];
            const distToPrev = Math.abs(time - prevTime);
            const distToNext = Math.abs(time - nextTime);
            if (distToPrev < distToNext) {
              timeIndex = timeIndex - 1;
            }
          }
        }
        return timeIndex * temporalSpacing;
      
      case 'log':
        const minTime = Math.max(0.0001, uniqueTimes[0]); // Avoid log(0)
        const maxTime = uniqueTimes[uniqueTimes.length - 1];
        const logMin = Math.log(minTime);
        const logMax = Math.log(maxTime);
        const logTime = Math.log(Math.max(0.0001, time));
        const normalizedLog = (logTime - logMin) / (logMax - logMin);
        return normalizedLog * (uniqueTimes.length - 1) * temporalSpacing;
      
      case 'linear':
        const minTimeLinear = uniqueTimes[0];
        const maxTimeLinear = uniqueTimes[uniqueTimes.length - 1];
        const normalizedTime = (time - minTimeLinear) / (maxTimeLinear - minTimeLinear);
        return normalizedTime * (uniqueTimes.length - 1) * temporalSpacing;
      
      default:
        return time * temporalSpacing;
    }
  }

export function createNodeJitter(nodeId: number, jitterScale: number, jitterRange: number, jitterOffset: number): number {
    return (nodeId * jitterScale) % jitterRange - jitterOffset;
}

export function calculateTemporalOpacity(
  nodeTime: number, 
  temporalRange: [number, number] | null, 
  temporalFilterMode: string | null,
  baseOpacity: number
): number {
  if ((temporalFilterMode !== 'planes' && temporalFilterMode !== 'hybrid') || !temporalRange) return baseOpacity;
  
  const [minTime, maxTime] = temporalRange;
  
  // For 'hybrid' mode: dim nodes below the max time (nodes above are filtered out)
  // For 'planes' mode: dim nodes outside the range
  if (temporalFilterMode === 'hybrid') {
    // In hybrid mode, nodes are already filtered to [minTime, maxTime]
    // We dim those below maxTime (older layers)
    return nodeTime < maxTime ? baseOpacity * VISUALIZATION_CONSTANTS.TEMPORAL_FADE_OPACITY : baseOpacity;
  } else {
    // 'planes' mode: dim nodes outside the range
    const isInRange = nodeTime >= minTime && nodeTime <= maxTime;
    return isInRange ? baseOpacity : baseOpacity * VISUALIZATION_CONSTANTS.TEMPORAL_FADE_OPACITY;
  }
}

export function calculateEdgeOpacity(
  sourceNode: Node3D,
  targetNode: Node3D,
  temporalRange: [number, number] | null,
  temporalFilterMode: string | null,
  baseOpacity: number
): number {
  if ((temporalFilterMode !== 'planes' && temporalFilterMode !== 'hybrid') || !temporalRange) return baseOpacity;
  
  const [minTime, maxTime] = temporalRange;
  
  if (temporalFilterMode === 'hybrid') {
    // In hybrid mode, edges are already filtered to [minTime, maxTime]
    // Dim edges that connect to nodes below maxTime
    const sourceBelowMax = sourceNode.time < maxTime;
    const targetBelowMax = targetNode.time < maxTime;
    
    if (sourceBelowMax && targetBelowMax) return baseOpacity * VISUALIZATION_CONSTANTS.EDGE_FADE_OPACITY;
    if (sourceBelowMax || targetBelowMax) return baseOpacity * VISUALIZATION_CONSTANTS.EDGE_PARTIAL_FADE_OPACITY;
    return baseOpacity;
  } else {
    // 'planes' mode: dim edges based on whether nodes are in range
    const sourceInRange = sourceNode.time >= minTime && sourceNode.time <= maxTime;
    const targetInRange = targetNode.time >= minTime && targetNode.time <= maxTime;
    
    if (!sourceInRange && !targetInRange) return baseOpacity * VISUALIZATION_CONSTANTS.EDGE_FADE_OPACITY;
    if (!sourceInRange || !targetInRange) return baseOpacity * VISUALIZATION_CONSTANTS.EDGE_PARTIAL_FADE_OPACITY;
    return baseOpacity;
  }
}

// Helper function to create contrast color for text
export const getContrastColor = (nodeColor: [number, number, number, number], _colors: any): [number, number, number, number] => {
  // Calculate luminance
  const luminance = (0.299 * nodeColor[0] + 0.587 * nodeColor[1] + 0.114 * nodeColor[2]) / 255;
  // Return white for dark colors, dark for light colors
  if (luminance > 0.5) {
    return [0, 0, 0, 255];
  } else {
    return [255, 255, 255, 255];
  }
};

export function determineGeographicShape(
  geographicShape: GeographicShape | null,
  geographicMode: GeographicMode,
  spatialSpacing: number
): GeographicShape | null {
  if (geographicShape) return geographicShape;
  if (geographicMode === 'unit_grid') return createUnitGridShape(VISUALIZATION_CONSTANTS.UNIT_GRID_SIZE, spatialSpacing);
  if (geographicMode === 'eastern_hemisphere') {
    console.warn('Eastern hemisphere mode selected but no geographic shape provided');
    return null;
  }
  return createUnitGridShape(VISUALIZATION_CONSTANTS.UNIT_GRID_SIZE, spatialSpacing);
};

// Heatmap visibility filtering utilities
/**
 * Check if data should be filtered based on heatmap visibility settings
 */
export function shouldFilterDataByHeatmap(
  heatmapSettings: { enabled?: boolean; nodeVisibility?: 'all' | 'samples' | 'none' } | undefined
): boolean {
  return !!(heatmapSettings?.enabled && (
    heatmapSettings.nodeVisibility === 'none' || 
    heatmapSettings.nodeVisibility === 'samples'
  ));
}

/**
 * Filter data based on heatmap visibility settings
 */
export function filterDataByHeatmap<T>(
  data: T[],
  heatmapSettings: { enabled?: boolean; nodeVisibility?: 'all' | 'samples' | 'none' } | undefined
): T[] {
  return shouldFilterDataByHeatmap(heatmapSettings) ? [] : data;
}

/**
 * Check if node should be hidden based on heatmap visibility settings
 */
export function shouldHideNodeByHeatmap(
  node: { is_sample?: boolean },
  heatmapSettings: { enabled?: boolean; nodeVisibility?: 'all' | 'samples' | 'none' } | undefined
): boolean {
  if (!heatmapSettings?.enabled) return false;
  if (heatmapSettings.nodeVisibility === 'none') return true;
  if (heatmapSettings.nodeVisibility === 'samples' && !node.is_sample) return true;
  return false;
}

/**
 * Check if label should be filtered (for node labels that need sample filtering)
 */
export function shouldFilterNodeLabelByHeatmap(
  labelId: string | undefined,
  heatmapSettings: { enabled?: boolean; nodeVisibility?: 'all' | 'samples' | 'none' } | undefined
): boolean {
  if (!heatmapSettings?.enabled) return false;
  if (heatmapSettings.nodeVisibility === 'none') return true;
  if (heatmapSettings.nodeVisibility === 'samples' && !labelId?.startsWith('sample-label-')) return true;
  return false;
}

/**
 * Filter node labels based on heatmap visibility settings
 */
export function filterNodeLabelsByHeatmap<T extends { labelId?: string }>(
  labels: T[],
  heatmapSettings: { enabled?: boolean; nodeVisibility?: 'all' | 'samples' | 'none' } | undefined
): T[] {
  if (!heatmapSettings?.enabled) return labels;
  if (heatmapSettings.nodeVisibility === 'none') return [];
  if (heatmapSettings.nodeVisibility === 'samples') {
    return labels.filter(label => label.labelId?.startsWith('sample-label-'));
  }
  return labels;
}

/**
 * Calculate base radius for a node based on its type and node size settings
 */
export function calculateNodeBaseRadius(
  node: { is_sample?: boolean; is_combined?: boolean },
  nodeSizes: { sample: number; root: number; other: number },
  isRoot: boolean
): number {
  if (node.is_sample) {
    return nodeSizes.sample * 0.5;
  } else if (node.is_combined) {
    return nodeSizes.other * 0.5;
  } else if (isRoot) {
    return nodeSizes.root * 0.5;
  } else {
    return nodeSizes.other * 0.5;
  }
}

/**
 * Calculate node color based on node type
 */
export function calculateNodeColorByType(
  node: { is_sample?: boolean; is_combined?: boolean },
  combinedNodes: GraphNode[],
  combinedEdges: GraphEdge[],
  colors: any,
  isRootFn: (node: any, nodes: GraphNode[], edges: GraphEdge[]) => boolean
): [number, number, number, number] {
  if (node.is_sample) {
    return colors.nodeSample;
  } else if (node.is_combined) {
    return colors.nodeCombined;
  } else if (isRootFn(node, combinedNodes, combinedEdges)) {
    return colors.nodeRoot;
  } else {
    return colors.nodeDefault;
  }
}