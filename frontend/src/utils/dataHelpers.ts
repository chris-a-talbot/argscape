import { GraphNode, GraphData, TreeInterval } from '../components/visualizations/ForceDirectedGraph/ForceDirectedGraph.types';

/**
 * Calculate percentage as a formatted string
 */
export const calculatePercentage = (value: number, total: number, decimals: number = 1): string => {
  return ((value / total) * 100).toFixed(decimals);
};

/**
 * Convert tree intervals from backend format to frontend format
 */
export const convertTreeIntervals = (backendIntervals: [number, number, number][]): TreeInterval[] => {
  return backendIntervals.map(([index, left, right]) => ({
    index,
    left,
    right
  }));
};

/**
 * Validate that graph data has spatial information
 */
export const validateSpatialData = (graphData: GraphData): boolean => {
  const nodesWithSpatial = graphData.nodes.filter((node: GraphNode) => 
    node.location?.x !== undefined && node.location?.y !== undefined
  );
  return nodesWithSpatial.length > 0;
};

/**
 * Initialize temporal state from nodes
 */
export const initializeTemporalState = (nodes: GraphNode[]) => {
  if (!nodes?.length) return { minTime: 0, maxTime: 1, range: [0, 1] as [number, number] };
  
  const times = nodes.map(node => node.time);
  const minTime = Math.min(...times);
  const maxTime = Math.max(...times);
  
  return {
    minTime,
    maxTime,
    range: [minTime, minTime] as [number, number]
  };
};

