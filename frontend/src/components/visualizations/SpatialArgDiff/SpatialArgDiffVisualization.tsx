import React, { useMemo, useState, useRef, useEffect } from 'react';
import DeckGL from '@deck.gl/react';
import { ScatterplotLayer, LineLayer, TextLayer, PolygonLayer } from '@deck.gl/layers';
import { OrbitView } from '@deck.gl/core';
import { GraphData, GraphNode, GraphEdge, GeographicShape } from '../ForceDirectedGraph/ForceDirectedGraph.types';
import { useColorTheme } from '../../../context/ColorThemeContext';
import { convertShapeToLines, createShapeLines, createUnitGridShape } from '../SpatialArgUtils/GeographicUtils';
import { isRootNode } from '../../../utils/graphTraversal';
import { TemporalSpacingMode, NodeIdSettings, EdgeLabelSettings, EdgeMutationSettings, AncestryHeatmapSettings } from '../SpatialArg3D/SpatialArg3DVisualization.types';
import { groupEdgesByPairs, expandEdgeSpansForCombinedNodes } from '../../../utils/genomicSpanUtils';
import {
  calculateAncestryDensity,
  generateHeatmapGrid,
  heatmapGridToPolygons
} from '../SpatialArgUtils/AncestryHeatmap';

export type DiffViewMode = 'diff' | 'first' | 'second';

interface SpatialArgDiffProps {
  firstData: GraphData;
  secondData: GraphData;
  temporalSpacing?: number;
  temporalSpacingMode?: TemporalSpacingMode;
  spatialSpacing?: number;
  temporalGridOpacity?: number;
  geographicShapeOpacity?: number;
  diffEdgeWidth?: number;
  geographicMode?: 'unit_grid' | 'eastern_hemisphere' | 'custom';
  geographicShape?: GeographicShape | null;
  // Diff view mode
  viewMode?: DiffViewMode;
  showErrorBars?: boolean;
  // Node settings
  nodeSizes?: { sample: number; root: number; other: number };
  nodeIdSettings?: NodeIdSettings;
  // Edge settings
  edgeThickness?: number;
  edgeOpacity?: number;
  edgeLabelSettings?: EdgeLabelSettings;
  edgeMutationSettings?: EdgeMutationSettings;
  // Temporal filtering
  temporalRange?: [number, number] | null;
  temporalFilterMode?: 'hide' | 'planes' | 'hybrid' | null;
  showTemporalPlanes?: boolean;
  // Heatmap
  heatmapSettings?: AncestryHeatmapSettings;
  // Node click handlers
  onNodeClick?: (node: GraphNode) => void;
  onNodeRightClick?: (node: GraphNode) => void;
  selectedNode?: GraphNode | null;
  // View state
  onViewStateChange?: (viewState: Partial<{
    target: [number, number, number];
    zoom: number;
    rotationX: number;
    rotationOrbit: number;
    orbitAxis: 'Y';
  }>) => void;
  externalViewState?: Partial<{
    target: [number, number, number];
    zoom: number;
    rotationX: number;
    rotationOrbit: number;
    orbitAxis: 'Y';
  }>;
}

interface NodeDiff3D extends GraphNode {
  position: [number, number, number];  // Centroid position
  firstPosition: [number, number, number];  // Original position in first tree sequence
  secondPosition: [number, number, number];  // Position in second tree sequence
  color: [number, number, number, number];
  size: number;
  distance: number;  // Euclidean distance between positions
}

interface EdgeDiff3D {
  source: [number, number, number];
  target: [number, number, number];
  color: [number, number, number, number];
  width: number;
}

interface DiffEdge {
  source: [number, number, number];
  target: [number, number, number];
  color: [number, number, number, number];
  width: number;
}


interface TransformResult {
  nodes3D: NodeDiff3D[];
  diffEdges: DiffEdge[];
}

interface EdgeTransformResult {
  source: [number, number, number];
  target: [number, number, number];
  color: [number, number, number, number];
}

interface NodeLabel3D {
  position: [number, number, number];
  text: string;
  color: [number, number, number, number];
  size: number;
  labelId: string;
}

interface EdgeLabel3D {
  position: [number, number, number];
  text: string;
  color: [number, number, number, number];
  size: number;
  sourceId: number;
  targetId: number;
}

interface MutationMarker3D {
  position: [number, number, number];
  text: string;
  color: [number, number, number, number];
  size: number;
  sourceId: number;
  targetId: number;
}

type GeographicMode = 'unit_grid' | 'eastern_hemisphere' | 'custom';

// Constants
const VISUALIZATION_CONSTANTS = {
  DEFAULT_ZOOM: 2.5,
  AUTO_FIT_ZOOM: 1.8,
  MIN_ZOOM: 0.01,
  MAX_ZOOM: 50,
  NODE_OPACITY: 0.85,
  NODE_RADIUS_SCALE: 6,
  MIN_NODE_RADIUS: 1,
  EDGE_WIDTH: 2,
  BASE_ELEVATION: 0.1,
  SELECTED_NODE_SCALE: 1.5,
  TEMPORAL_FADE_OPACITY: 0.3,
  EDGE_FADE_OPACITY: 0.15,
  EDGE_PARTIAL_FADE_OPACITY: 0.35,
  REDUCED_OPACITY_MULTIPLIER: 0.2,
  BUFFER_RADIUS: 0.1,  // Minimum distance to ensure visibility
  UNIT_GRID_SIZE: 10,  // Added for geographic shape generation
  JITTER_SCALE: 0.001,  // Added for node jittering
  JITTER_RANGE: 0.02,   // Added for node jittering
  JITTER_OFFSET: 0.01,  // Added for node jittering
  GEOGRAPHIC_OPACITY_SCALE: 2.5,  // Added to match 3D visualizer
  GEOGRAPHIC_REDUCED_OPACITY: 0.3, // Added to match 3D visualizer
  TEMPORAL_OPACITY_SCALE: 0.3,    // Added to match 3D visualizer
  GRID_EXTENSION: 2               // Added to match 3D visualizer
} as const;

const LINE_WIDTHS = {
  NODE_OUTLINE_SELECTED: 2,
  NODE_OUTLINE_ROOT: 1.5,
  NODE_OUTLINE_SAMPLE: 0.8,
  MIN_NODE_OUTLINE: 0.3,
  MAX_NODE_OUTLINE: 4,
  GEOGRAPHIC_ACTIVE: 2,
  GEOGRAPHIC_NORMAL: 1,
  TIME_SLICE_ACTIVE: 2,
  TIME_SLICE_NORMAL: 1
} as const;

const calculateNodeSize = (
  node: GraphNode, 
  combinedNodes: GraphNode[], 
  combinedEdges: GraphEdge[],
  nodeSizes: { sample: number; root: number; other: number },
  minTime: number
): number => {
  // Samples are nodes at the minimum time (present day)
  if (node.time === minTime) return nodeSizes.sample;
  if (isRootNode(node, combinedNodes, combinedEdges)) return nodeSizes.root;
  return nodeSizes.other;
};

const calculateTemporalOpacity = (
  nodeTime: number, 
  temporalRange: [number, number] | null, 
  temporalFilterMode: string | null,
  baseOpacity: number
): number => {
  if (temporalFilterMode !== 'planes' || !temporalRange) return baseOpacity;
  
  const [minTime, maxTime] = temporalRange;
  const isInRange = nodeTime >= minTime && nodeTime <= maxTime;
  return isInRange ? baseOpacity : baseOpacity * VISUALIZATION_CONSTANTS.TEMPORAL_FADE_OPACITY;
};

const calculateEdgeOpacity = (
  sourceNode: NodeDiff3D,
  targetNode: NodeDiff3D,
  temporalRange: [number, number] | null,
  temporalFilterMode: string | null,
  baseOpacity: number
): number => {
  if (temporalFilterMode !== 'planes' || !temporalRange) return baseOpacity;
  
  const [minTime, maxTime] = temporalRange;
  const sourceInRange = sourceNode.time >= minTime && sourceNode.time <= maxTime;
  const targetInRange = targetNode.time >= minTime && targetNode.time <= maxTime;
  
  if (!sourceInRange && !targetInRange) return baseOpacity * VISUALIZATION_CONSTANTS.EDGE_FADE_OPACITY;
  if (!sourceInRange || !targetInRange) return baseOpacity * VISUALIZATION_CONSTANTS.EDGE_PARTIAL_FADE_OPACITY;
  return baseOpacity;
};

const calculateCoordinateTransform = (
  nodes: GraphNode[],
  secondNodes: GraphNode[],
  geographicMode: GeographicMode,
  geographicShape: GeographicShape | null
) => {
  const spatialNodes = nodes.filter(node => 
    node.location?.x !== undefined && node.location?.y !== undefined
  );

  if (spatialNodes.length === 0) return null;

  // Calculate bounds for both datasets
  const allXCoords = [...spatialNodes.map(node => node.location!.x), ...secondNodes.map(node => node.location!.x)];
  const allYCoords = [...spatialNodes.map(node => node.location!.y), ...secondNodes.map(node => node.location!.y)];
  
  const minX = Math.min(...allXCoords);
  const maxX = Math.max(...allXCoords);
  const minY = Math.min(...allYCoords);
  const maxY = Math.max(...allYCoords);
  
  let centerX: number, centerY: number, maxScale: number;
  
  const hasGeographicBounds = (geographicMode === 'eastern_hemisphere' || geographicMode === 'custom') && geographicShape?.bounds;
  
  if (hasGeographicBounds) {
    const bounds = geographicShape!.bounds!;
    const [shapeMinX, shapeMinY, shapeMaxX, shapeMaxY] = bounds;
    centerX = (shapeMinX + shapeMaxX) / 2;
    centerY = (shapeMinY + shapeMaxY) / 2;
    maxScale = Math.max(shapeMaxX - shapeMinX, shapeMaxY - shapeMinY) || 1;
  } else {
    centerX = (minX + maxX) / 2;
    centerY = (minY + maxY) / 2;
    maxScale = Math.max(maxX - minX, maxY - minY) || 1;
  }

  return {
    spatialNodes,
    centerX,
    centerY,
    maxScale,
    dataBounds: { minX, maxX, minY, maxY }
  };
};

// Helper function to calculate z position based on temporal spacing mode
function calculateZPosition(
  time: number,
  uniqueTimes: number[],
  temporalSpacing: number,
  temporalSpacingMode: 'equal' | 'log' | 'linear'
): number {
  if (uniqueTimes.length <= 1) return 0;

  switch (temporalSpacingMode) {
    case 'equal':
      const timeIndex = uniqueTimes.indexOf(time);
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

// Add jittering function
const createNodeJitter = (nodeId: number): number => {
  return (nodeId * VISUALIZATION_CONSTANTS.JITTER_SCALE) % VISUALIZATION_CONSTANTS.JITTER_RANGE - VISUALIZATION_CONSTANTS.JITTER_OFFSET;
};

const transformNodesToThreeD = (
  nodes: GraphNode[],
  secondNodes: GraphNode[],
  coordinateTransform: any,
  temporalSpacing: number,
  temporalSpacingMode: 'equal' | 'log' | 'linear',
  spatialSpacing: number,
  colors: any,
  combinedNodes: GraphNode[],
  combinedEdges: GraphEdge[],
  diffEdgeWidth: number,
  nodeSizes: { sample: number; root: number; other: number },
  viewMode: DiffViewMode,
  showErrorBars: boolean
): { nodes: NodeDiff3D[], diffEdges: DiffEdge[] } => {
  const { centerX, centerY, maxScale } = coordinateTransform;
  const secondNodesMap = new Map(secondNodes.map(node => [node.id, node]));

  // Get unique times for z-position calculation
  const uniqueTimes = Array.from(new Set([...nodes.map(n => n.time), ...secondNodes.map(n => n.time)])).sort((a, b) => a - b);
  const minTime = uniqueTimes[0];

  const diffEdges: DiffEdge[] = [];
  const transformedNodes = nodes.map(node => {
    const secondNode = secondNodesMap.get(node.id);
    if (!secondNode || !node.location || !secondNode.location) {
      throw new Error(`Missing location data for node ${node.id}`);
    }

    // Calculate normalized positions for both datasets
    const normalizedX = ((node.location.x - centerX) / maxScale) * spatialSpacing;
    const normalizedY = ((node.location.y - centerY) / maxScale) * spatialSpacing;
    const normalizedSecondX = ((secondNode.location.x - centerX) / maxScale) * spatialSpacing;
    const normalizedSecondY = ((secondNode.location.y - centerY) / maxScale) * spatialSpacing;

    // For sample nodes, use the same position (they shouldn't move between tree sequences)
    const isSample = node.is_sample;
    
    // Determine display position based on view mode
    let displayX: number, displayY: number;
    if (isSample) {
      // Samples always use first position (they shouldn't move)
      displayX = normalizedX;
      displayY = normalizedY;
    } else if (viewMode === 'first') {
      displayX = normalizedX;
      displayY = normalizedY;
    } else if (viewMode === 'second') {
      displayX = normalizedSecondX;
      displayY = normalizedSecondY;
    } else { // 'diff' mode
      displayX = (normalizedX + normalizedSecondX) / 2;
      displayY = (normalizedY + normalizedSecondY) / 2;
    }
    
    // Add jittering to z position
    const jitter = createNodeJitter(node.id);
    const finalZ = calculateZPosition(node.time, uniqueTimes, temporalSpacing, temporalSpacingMode) + VISUALIZATION_CONSTANTS.BASE_ELEVATION + jitter;

    // Calculate Euclidean distance between positions (0 for samples)
    const dx = normalizedSecondX - normalizedX;
    const dy = normalizedSecondY - normalizedY;
    const distance = isSample ? 0 : Math.sqrt(dx * dx + dy * dy);

    // Calculate node size using the same logic as the original visualization
    const size = calculateNodeSize(node, combinedNodes, combinedEdges, nodeSizes, minTime);

    // Calculate color based on node type
    // Sample nodes are those at minimum time (present day)
    const isSampleTime = node.time === minTime;
    let color: [number, number, number, number];
    if (isSampleTime) {
      color = colors.nodeSample;
    } else if (node.is_combined) {
      color = colors.nodeCombined;
    } else if (isRootNode(node, combinedNodes, combinedEdges)) {
      color = colors.nodeRoot;
    } else {
      color = colors.nodeDefault;
    }

    // Add error bars if enabled
    if (showErrorBars && !isSampleTime) {
      if (viewMode === 'diff') {
        // In diff mode: error bars go from first position to centroid to second position
        // Edge from first position to centroid
        diffEdges.push({
          source: [normalizedX, normalizedY, finalZ],
          target: [displayX, displayY, finalZ],
          color: [255, 0, 0, 180] as [number, number, number, number], // Semi-transparent red
          width: diffEdgeWidth
        });
        // Edge from centroid to second position
        diffEdges.push({
          source: [displayX, displayY, finalZ],
          target: [normalizedSecondX, normalizedSecondY, finalZ],
          color: [255, 0, 0, 180] as [number, number, number, number], // Semi-transparent red
          width: diffEdgeWidth
        });
      } else if (viewMode === 'first') {
        // In first mode: error bar goes from first position to second position
        diffEdges.push({
          source: [displayX, displayY, finalZ],
          target: [normalizedSecondX, normalizedSecondY, finalZ],
          color: [255, 0, 0, 180] as [number, number, number, number],
          width: diffEdgeWidth
        });
      } else if (viewMode === 'second') {
        // In second mode: error bar goes from second position to first position
        diffEdges.push({
          source: [displayX, displayY, finalZ],
          target: [normalizedX, normalizedY, finalZ],
          color: [255, 0, 0, 180] as [number, number, number, number],
          width: diffEdgeWidth
        });
      }
    }

    return {
      ...node,
      position: [displayX, displayY, finalZ] as [number, number, number],
      firstPosition: [normalizedX, normalizedY, finalZ] as [number, number, number],
      secondPosition: [normalizedSecondX, normalizedSecondY, finalZ] as [number, number, number],
      color,
      size,
      distance
    };
  });

  return { nodes: transformedNodes, diffEdges };
};

const transformEdgesToThreeD = (
  edges: GraphEdge[],
  nodeMap: Map<number, NodeDiff3D>,
  temporalRange: [number, number] | null,
  temporalFilterMode: string | null,
  colors: any
): EdgeTransformResult[] => {
  return edges
    .filter(edge => {
      const sourceNode = nodeMap.get(typeof edge.source === 'object' ? edge.source.id : edge.source);
      const targetNode = nodeMap.get(typeof edge.target === 'object' ? edge.target.id : edge.target);
      return sourceNode && targetNode;
    })
    .map(edge => {
      const sourceId = typeof edge.source === 'object' ? edge.source.id : edge.source;
      const targetId = typeof edge.target === 'object' ? edge.target.id : edge.target;
      const sourceNode = nodeMap.get(sourceId)!;
      const targetNode = nodeMap.get(targetId)!;

      const edgeOpacity = calculateEdgeOpacity(
        sourceNode, 
        targetNode, 
        temporalRange, 
        temporalFilterMode, 
        colors.edgeDefault[3]
      );

      return {
        source: sourceNode.position,  // Use centroid position
        target: targetNode.position,  // Use centroid position
        color: [colors.edgeDefault[0], colors.edgeDefault[1], colors.edgeDefault[2], edgeOpacity] as [number, number, number, number]
      };
    });
};

const calculateNodeColor = (
  node: NodeDiff3D,
  selectedNode: GraphNode | null,
  temporalRange: [number, number] | null,
  temporalFilterMode: string | null,
  colors: any
): [number, number, number, number] => {
  const isSelected = selectedNode && node.id === selectedNode.id;
  if (isSelected) return colors.nodeSelected;
  
  const opacity = calculateTemporalOpacity(node.time, temporalRange, temporalFilterMode, node.color[3]);
  return [node.color[0], node.color[1], node.color[2], opacity];
};

const calculateNodeOutlineColor = (
  node: NodeDiff3D,
  selectedNode: GraphNode | null,
  data: GraphData | null,
  temporalRange: [number, number] | null,
  temporalFilterMode: string | null,
  colors: any,
  minTime: number
): [number, number, number, number] => {
  const isSelected = selectedNode && node.id === selectedNode.id;
  const isRoot = isRootNode(node, data?.nodes || [], data?.edges || []);
  const isSampleTime = node.time === minTime;
  
  let opacityMultiplier = 1;
  if (temporalFilterMode === 'planes' && temporalRange) {
    const [minTimeFilter, maxTimeFilter] = temporalRange;
    const isInTemporalRange = node.time >= minTimeFilter && node.time <= maxTimeFilter;
    if (!isInTemporalRange) {
      opacityMultiplier = VISUALIZATION_CONSTANTS.REDUCED_OPACITY_MULTIPLIER;
    }
  }
  
  if (isSelected) return colors.nodeSelected;
  
  if (isRoot) {
    return [colors.nodeSelected[0], colors.nodeSelected[1], colors.nodeSelected[2], colors.nodeSelected[3] * opacityMultiplier] as [number, number, number, number];
  }
  
  if (isSampleTime) {
    const outlineColor = colors.background === '#ffffff' ? 0 : 255;
    return [outlineColor, outlineColor, outlineColor, 255 * opacityMultiplier] as [number, number, number, number];
  }
  
  return [colors.nodeSelected[0], colors.nodeSelected[1], colors.nodeSelected[2], 0] as [number, number, number, number];
};

const calculateNodeOutlineWidth = (
  node: NodeDiff3D,
  selectedNode: GraphNode | null,
  data: GraphData | null,
  nodeSizes: { sample: number; root: number; other: number },
  minTime: number
): number => {
  const isSelected = selectedNode && node.id === selectedNode.id;
  const isRoot = isRootNode(node, data?.nodes || [], data?.edges || []);
  const isSampleTime = node.time === minTime;
  const baseSize = isSelected ? node.size * VISUALIZATION_CONSTANTS.SELECTED_NODE_SCALE : node.size;
  
  const sizeFactor = baseSize / nodeSizes.other;
  
  if (isSelected) return Math.max(1, LINE_WIDTHS.NODE_OUTLINE_SELECTED * sizeFactor);
  if (isRoot) return Math.max(0.8, LINE_WIDTHS.NODE_OUTLINE_ROOT * sizeFactor);
  if (isSampleTime) return Math.max(0.5, LINE_WIDTHS.NODE_OUTLINE_SAMPLE * sizeFactor);
  return 0;
};

const getContrastColor = (nodeColor: [number, number, number, number], _colors: any): [number, number, number, number] => {
  // Calculate luminance
  const luminance = (0.299 * nodeColor[0] + 0.587 * nodeColor[1] + 0.114 * nodeColor[2]) / 255;
  // Return white for dark colors, dark for light colors
  if (luminance > 0.5) {
    return [0, 0, 0, 255];
  } else {
    return [255, 255, 255, 255];
  }
};

const createNodeLabels = (
  nodes3D: NodeDiff3D[],
  nodeIdSettings: NodeIdSettings | undefined,
  combinedNodes: GraphNode[],
  combinedEdges: GraphEdge[],
  nodeSizes: { sample: number; root: number; other: number },
  colors: any,
  minTime: number
): NodeLabel3D[] => {
  if (!nodeIdSettings) return [];
  
  const labels: NodeLabel3D[] = [];
  
  // Filter nodes for labeling based on settings
  const sampleNodes = nodes3D.filter(node => 
    node.time === minTime && nodeIdSettings.showSampleIds
  );
  
  const rootNodes = nodes3D.filter(node => 
    node.time !== minTime && isRootNode(node, combinedNodes, combinedEdges) && nodeIdSettings.showRootIds
  );
  
  const internalNodes = nodes3D.filter(node => 
    node.time !== minTime && !isRootNode(node, combinedNodes, combinedEdges) && nodeIdSettings.showInternalIds
  );
  
  // Process sample nodes
  sampleNodes.forEach(node => {
    const baseNodeSize = nodeSizes.sample * 0.5;
    const textSize = baseNodeSize * 1.0;
    
    // Use theme text color for samples
    const textColor: [number, number, number, number] = [
      parseInt(colors.text.slice(1, 3), 16),
      parseInt(colors.text.slice(3, 5), 16), 
      parseInt(colors.text.slice(5, 7), 16),
      255
    ];
    
    const labelText = node.label || node.id.toString();
    
    labels.push({
      position: node.position,
      text: labelText,
      color: textColor,
      size: textSize,
      labelId: `sample-label-${node.id}`
    });
  });
  
  // Process root nodes
  rootNodes.forEach(node => {
    const baseNodeSize = nodeSizes.root * 0.5;
    const textSize = baseNodeSize * 1.2;
    
    const nodeColor = calculateNodeColor(node, null, null, null, colors);
    const textColor = getContrastColor(nodeColor, colors);
    
    const labelText = node.label || node.id.toString();
    
    labels.push({
      position: node.position,
      text: labelText,
      color: textColor,
      size: textSize,
      labelId: `root-label-${node.id}`
    });
  });
  
  // Process internal nodes
  internalNodes.forEach(node => {
    const baseNodeSize = nodeSizes.other * 0.5;
    const textSize = baseNodeSize * 1.2;
    
    const nodeColor = calculateNodeColor(node, null, null, null, colors);
    const textColor = getContrastColor(nodeColor, colors);
    
    const labelText = node.label || node.id.toString();
    
    labels.push({
      position: node.position,
      text: labelText,
      color: textColor,
      size: textSize,
      labelId: `internal-label-${node.id}`
    });
  });
  
  return labels;
};

const createEdgeLabels = (
  nodes3D: NodeDiff3D[],
  firstEdges: GraphEdge[],
  firstNodes: GraphNode[],
  edgeLabelSettings: EdgeLabelSettings | undefined,
  colors: any,
  sequenceLength: number | undefined
): EdgeLabel3D[] => {
  if (!edgeLabelSettings?.showEdgeLabels || !firstEdges.length || !sequenceLength) {
    return [];
  }

  const labels: EdgeLabel3D[] = [];
  const nodeMap = new Map<number, NodeDiff3D>();
  nodes3D.forEach(node => nodeMap.set(node.id, node));

  // Calculate edge groups for labels
  const edgeGroups = groupEdgesByPairs(firstEdges, firstNodes, sequenceLength);
  
  // Handle combined nodes by expanding their genomic spans
  const expandedEdgeGroups = expandEdgeSpansForCombinedNodes(
    edgeGroups, 
    firstNodes, 
    firstEdges,
    sequenceLength
  );

  expandedEdgeGroups.forEach(edgeGroup => {
    const sourceNode = nodeMap.get(edgeGroup.sourceId);
    const targetNode = nodeMap.get(edgeGroup.targetId);
    
    if (sourceNode && targetNode) {
      // Calculate midpoint between the actual 3D node positions
      const midX = (sourceNode.position[0] + targetNode.position[0]) / 2;
      const midY = (sourceNode.position[1] + targetNode.position[1]) / 2;
      const midZ = (sourceNode.position[2] + targetNode.position[2]) / 2;

      // Add small offset to prevent z-fighting with edges and nodes
      const offsetZ = midZ + Math.max(2, edgeLabelSettings.labelFontSize * 0.2);

      // Parse the text color properly (same as sample ID labels)
      const textColor: [number, number, number, number] = [
        parseInt(colors.text.slice(1, 3), 16),
        parseInt(colors.text.slice(3, 5), 16), 
        parseInt(colors.text.slice(5, 7), 16),
        255
      ];

      labels.push({
        position: [midX, midY, offsetZ],
        text: edgeGroup.formattedSpans,
        color: textColor,
        size: edgeLabelSettings.labelFontSize * 0.8,
        sourceId: edgeGroup.sourceId,
        targetId: edgeGroup.targetId
      });
    }
  });

  return labels;
};

const createMutationMarkers = (
  nodes3D: NodeDiff3D[],
  firstEdges: GraphEdge[],
  edgeMutationSettings: EdgeMutationSettings | undefined,
  _colors: any
): MutationMarker3D[] => {
  if (!edgeMutationSettings?.showMutationMarkers) {
    return [];
  }

  const markers: MutationMarker3D[] = [];
  const nodeMap = new Map<number, NodeDiff3D>();
  nodes3D.forEach(node => nodeMap.set(node.id, node));
  
  // Filter edges that have mutations
  const mutationEdges = firstEdges.filter(edge => edge.has_mutations);
  
  mutationEdges.forEach(graphEdge => {
    const sourceId = typeof graphEdge.source === 'number' ? graphEdge.source : graphEdge.source.id;
    const targetId = typeof graphEdge.target === 'number' ? graphEdge.target : graphEdge.target.id;
    
    const sourceNode = nodeMap.get(sourceId);
    const targetNode = nodeMap.get(targetId);
    
    if (sourceNode && targetNode) {
      // Calculate midpoint position for marker
      const midX = (sourceNode.position[0] + targetNode.position[0]) / 2;
      const midY = (sourceNode.position[1] + targetNode.position[1]) / 2;
      const midZ = (sourceNode.position[2] + targetNode.position[2]) / 2;
      
      markers.push({
        position: [midX, midY, midZ],
        text: "×", // Use multiplication sign for clean "x" appearance
        color: [220, 38, 38, 255], // Red color (#dc2626)
        size: edgeMutationSettings.markerSize || 14,
        sourceId: sourceId,
        targetId: targetId
      });
    }
  });

  return markers;
};

const createTooltipContent = (
  node: NodeDiff3D,
  data: GraphData,
  transform: { maxScale: number; centerX: number; centerY: number } | null,
  spatialSpacing: number,
  colors: any
) => {
  let nodeTypeInfo = '';
  if (node.is_sample) {
    nodeTypeInfo = 'Sample Node';
  } else if (node.is_combined) {
    nodeTypeInfo = `Combined Node (contains: ${node.combined_nodes?.join(', ')})`;
  } else if (isRootNode(node, data?.nodes || [], data?.edges || [])) {
    nodeTypeInfo = 'Root Node';
  } else {
    nodeTypeInfo = 'Internal Node';
  }
  
  // Calculate actual coordinates in original space
  const firstX = transform ? node.firstPosition[0] * (transform.maxScale / spatialSpacing) + transform.centerX : node.firstPosition[0];
  const firstY = transform ? node.firstPosition[1] * (transform.maxScale / spatialSpacing) + transform.centerY : node.firstPosition[1];
  const secondX = transform ? node.secondPosition[0] * (transform.maxScale / spatialSpacing) + transform.centerX : node.secondPosition[0];
  const secondY = transform ? node.secondPosition[1] * (transform.maxScale / spatialSpacing) + transform.centerY : node.secondPosition[1];
  
  return {
    html: `
      <div style="background: ${colors.tooltipBackground}; color: ${colors.tooltipText}; padding: 8px; border-radius: 4px; font-size: 12px;">
        <strong>Node ${node.id}</strong><br/>
        Time: ${node.time.toFixed(3)}<br/>
        ${nodeTypeInfo}<br/>
        ${node.is_sample ? 'Sample Node (Fixed Position)' : `
        First Position: (${firstX.toFixed(3)}, ${firstY.toFixed(3)})<br/>
        Second Position: (${secondX.toFixed(3)}, ${secondY.toFixed(3)})<br/>
        Movement Distance: ${node.distance.toFixed(3)}`}
      </div>
    `,
    style: {
      backgroundColor: 'transparent',
      color: colors.tooltipText
    }
  };
};

const determineGeographicShape = (
  geographicShape: GeographicShape | null,
  geographicMode: GeographicMode,
  _spatialSpacing: number
): GeographicShape | null => {
  if (geographicShape) return geographicShape;
  if (geographicMode === 'unit_grid') return createUnitGridShape(VISUALIZATION_CONSTANTS.UNIT_GRID_SIZE);
  if (geographicMode === 'eastern_hemisphere') {
    console.warn('Eastern hemisphere mode selected but no geographic shape provided');
    return null;
  }
  return createUnitGridShape(VISUALIZATION_CONSTANTS.UNIT_GRID_SIZE);
};

const DEFAULT_VISUAL_SETTINGS = {
  temporalSpacing: 10,
  spatialSpacing: 160,
  temporalGridOpacity: 0,
  geographicShapeOpacity: 100,
  nodeSizes: {
    sample: 10,
    root: 12,
    other: 10
  },
  nodeIdSettings: {
    showSampleIds: true,
    showRootIds: true,
    showInternalIds: false
  },
  edgeThickness: 1.0,
  edgeOpacity: 60,
  edgeLabelSettings: {
    showEdgeLabels: false,
    labelFontSize: 3
  },
  edgeMutationSettings: {
    showMutationMarkers: true,
    markerSize: 6
  },
  diffEdgeWidth: 3,
  temporalSpacingMode: 'equal' as TemporalSpacingMode
};

export const SpatialArgDiffVisualization: React.FC<SpatialArgDiffProps> = ({
  firstData,
  secondData,
  temporalSpacing = DEFAULT_VISUAL_SETTINGS.temporalSpacing,
  temporalSpacingMode = DEFAULT_VISUAL_SETTINGS.temporalSpacingMode,
  spatialSpacing = DEFAULT_VISUAL_SETTINGS.spatialSpacing,
  temporalGridOpacity = DEFAULT_VISUAL_SETTINGS.temporalGridOpacity,
  geographicShapeOpacity = DEFAULT_VISUAL_SETTINGS.geographicShapeOpacity,
  diffEdgeWidth = DEFAULT_VISUAL_SETTINGS.diffEdgeWidth,
  geographicMode = 'unit_grid',
  geographicShape = null,
  viewMode = 'diff',
  showErrorBars = true,
  nodeSizes = DEFAULT_VISUAL_SETTINGS.nodeSizes,
  nodeIdSettings = DEFAULT_VISUAL_SETTINGS.nodeIdSettings,
  edgeThickness = DEFAULT_VISUAL_SETTINGS.edgeThickness,
  edgeOpacity = DEFAULT_VISUAL_SETTINGS.edgeOpacity,
  edgeLabelSettings = DEFAULT_VISUAL_SETTINGS.edgeLabelSettings,
  edgeMutationSettings = DEFAULT_VISUAL_SETTINGS.edgeMutationSettings,
  temporalRange = null,
  temporalFilterMode = null,
  showTemporalPlanes = false,
  heatmapSettings,
  onNodeClick,
  onNodeRightClick,
  selectedNode,
  onViewStateChange,
  externalViewState
}) => {
  const { colors } = useColorTheme();

  // Track mouse button for right-click detection (pointerup loses button info)
  const lastPointerButtonRef = useRef<number>(0);
  
  // Add global listener to track pointer button - use capture phase to catch it before deck.gl
  useEffect(() => {
    const handlePointerDown = (e: PointerEvent) => {
      lastPointerButtonRef.current = e.button;
      console.log('Pointer down captured:', { button: e.button, type: e.pointerType });
    };
    
    // Use capture phase to ensure we catch the event before deck.gl
    window.addEventListener('pointerdown', handlePointerDown, { capture: true });
    return () => window.removeEventListener('pointerdown', handlePointerDown, { capture: true });
  }, []);

  // Calculate minimum time for sample detection
  const minTime = useMemo(() => {
    if (!firstData || !secondData) return 0;
    const allTimes = [...firstData.nodes.map(n => n.time), ...secondData.nodes.map(n => n.time)];
    return Math.min(...allTimes);
  }, [firstData, secondData]);

  // Transform nodes to 3D
  const { nodes3D, diffEdges } = useMemo<TransformResult>(() => {
    const coordinateTransform = calculateCoordinateTransform(firstData.nodes, secondData.nodes, geographicMode, geographicShape);
    if (!coordinateTransform) return { nodes3D: [], diffEdges: [] };

    const result = transformNodesToThreeD(
      firstData.nodes,
      secondData.nodes,
      coordinateTransform,
      temporalSpacing,
      temporalSpacingMode,
      spatialSpacing,
      colors,
      firstData.nodes,
      firstData.edges,
      diffEdgeWidth,
      nodeSizes,
      viewMode,
      showErrorBars
    );

    return {
      nodes3D: result.nodes,
      diffEdges: result.diffEdges
    };
  }, [firstData, secondData, temporalSpacing, temporalSpacingMode, spatialSpacing, colors, geographicMode, geographicShape, diffEdgeWidth, nodeSizes, viewMode, showErrorBars]);

  // Transform edges to 3D
  const edges3D = useMemo(() => {
    const nodeMap = new Map<number, NodeDiff3D>(nodes3D.map((node: NodeDiff3D) => [node.id, node]));
    const edges = transformEdgesToThreeD(
      firstData.edges,
      nodeMap,
      temporalRange,
      temporalFilterMode,
      colors
    );
    const opacity = edgeOpacity / 100; // Convert percentage to 0-1 range
    return edges.map(edge => ({
      ...edge,
      color: [edge.color[0], edge.color[1], edge.color[2], Math.floor(edge.color[3] * opacity)] as [number, number, number, number],
      width: edgeThickness
    })) as EdgeDiff3D[];
  }, [firstData.edges, nodes3D, colors, temporalRange, temporalFilterMode, edgeOpacity, edgeThickness]);

  // Create node labels
  const nodeLabels = useMemo(() => {
    return createNodeLabels(nodes3D, nodeIdSettings, firstData.nodes, firstData.edges, nodeSizes, colors, minTime);
  }, [nodes3D, nodeIdSettings, firstData.nodes, firstData.edges, nodeSizes, colors, minTime]);

  // Create edge labels with genomic spans
  const edgeLabels = useMemo(() => {
    return createEdgeLabels(nodes3D, firstData.edges, firstData.nodes, edgeLabelSettings, colors, firstData.metadata.sequence_length);
  }, [nodes3D, firstData.edges, firstData.nodes, edgeLabelSettings, colors, firstData.metadata.sequence_length]);

  // Create mutation markers
  const mutationMarkers = useMemo(() => {
    return createMutationMarkers(nodes3D, firstData.edges, edgeMutationSettings, colors);
  }, [nodes3D, firstData.edges, edgeMutationSettings, colors]);

  // Calculate coordinate transform for heatmap
  const coordinateTransform = useMemo(() => {
    const spatialNodes = firstData.nodes.filter(node => 
      node.location?.x !== undefined && node.location?.y !== undefined
    );

    if (spatialNodes.length === 0) return null;

    const allXCoords = [...firstData.nodes.map(node => node.location?.x || 0), ...secondData.nodes.map(node => node.location?.x || 0)];
    const allYCoords = [...firstData.nodes.map(node => node.location?.y || 0), ...secondData.nodes.map(node => node.location?.y || 0)];
    
    const minX = Math.min(...allXCoords);
    const maxX = Math.max(...allXCoords);
    const minY = Math.min(...allYCoords);
    const maxY = Math.max(...allYCoords);
    
    let centerX: number, centerY: number, maxScale: number;
    
    const hasGeographicBounds = (geographicMode === 'eastern_hemisphere' || geographicMode === 'custom') && geographicShape?.bounds;
    
    if (hasGeographicBounds) {
      const bounds = geographicShape!.bounds!;
      const [shapeMinX, shapeMinY, shapeMaxX, shapeMaxY] = bounds;
      centerX = (shapeMinX + shapeMaxX) / 2;
      centerY = (shapeMinY + shapeMaxY) / 2;
      maxScale = Math.max(shapeMaxX - shapeMinX, shapeMaxY - shapeMinY) || 1;
    } else {
      centerX = (minX + maxX) / 2;
      centerY = (minY + maxY) / 2;
      maxScale = Math.max(maxX - minX, maxY - minY) || 1;
    }

    return {
      centerX,
      centerY,
      maxScale,
      dataBounds: { minX, maxX, minY, maxY }
    };
  }, [firstData.nodes, secondData.nodes, geographicMode, geographicShape]);

  // Create ancestry density heatmap
  const ancestryHeatmap = useMemo(() => {
    // Show heatmap when enabled, regardless of temporal filter
    if (!heatmapSettings?.enabled || 
        !nodes3D.length ||
        !coordinateTransform) {
      return [];
    }

    // Calculate time range based on mode
    const minTimeInData = Math.min(...firstData.nodes.map(n => n.time));
    const maxTimeInData = Math.max(...firstData.nodes.map(n => n.time));
    const totalTimeRange = maxTimeInData - minTimeInData;
    
    let timeWindowMin: number;
    let timeWindowMax: number;
    let referenceTime: number;
    
    if (showTemporalPlanes && (temporalFilterMode === 'hybrid' || temporalFilterMode === 'planes')) {
      // TEMPORAL SLIDER MODE: Calculate from top layer toward present
      // Find the top layer time (at or near the temporal slider position)
      const topLayerTime = temporalRange ? temporalRange[1] : maxTimeInData;
      
      // Calculate time depth as percentage of total time range
      const timeDepthAmount = (heatmapSettings.timeDepth / 100) * totalTimeRange;
      
      // Time window goes from top layer DOWN toward present (decreasing time)
      timeWindowMax = topLayerTime; // Top layer
      timeWindowMin = Math.max(minTimeInData, topLayerTime - timeDepthAmount); // Toward present, but not below samples
      
      referenceTime = topLayerTime; // Use top layer for z-positioning
    } else {
      // GROUND MODE: Use absolute time range
      // 0% = minTimeInData (present/samples), 100% = maxTimeInData (oldest ancestors)
      timeWindowMin = minTimeInData + (heatmapSettings.timeRangeMin / 100) * totalTimeRange;
      timeWindowMax = minTimeInData + (heatmapSettings.timeRangeMax / 100) * totalTimeRange;
      
      // Use center of range for z-positioning
      referenceTime = (timeWindowMin + timeWindowMax) / 2;
    }

    console.log('Ancestry Heatmap Calculation (Diff):', {
      mode: temporalFilterMode || 'ground',
      referenceTime,
      timeDepthPercent: heatmapSettings.timeDepth,
      timeRangeMinPercent: heatmapSettings.timeRangeMin,
      timeRangeMaxPercent: heatmapSettings.timeRangeMax,
      timeWindow: [timeWindowMin, timeWindowMax],
      totalTimeRange,
      minTimeInData,
      maxTimeInData,
      resolution: heatmapSettings.resolution,
      opacity: heatmapSettings.opacity,
      nodeVisibility: heatmapSettings.nodeVisibility
    });

    // Collect all nodes within the time window
    const nodesInTimeWindow = firstData.nodes.filter(node => 
      node.time >= timeWindowMin && node.time <= timeWindowMax
    );
    
    if (nodesInTimeWindow.length === 0) {
      console.warn('No nodes found in time window for heatmap');
      return [];
    }
    
    // Calculate ancestry density using nodes in time window
    const ancestorLocations = calculateAncestryDensity(
      nodesInTimeWindow,
      0, // No additional time depth needed - we already have our window
      firstData.nodes,
      firstData.edges
    );

    if (ancestorLocations.length === 0) {
      console.warn('No ancestor locations found for heatmap');
      return [];
    }

    console.log('Ancestor locations found:', ancestorLocations.length);

    // Generate heatmap grid
    const grid = generateHeatmapGrid(
      ancestorLocations,
      coordinateTransform.dataBounds,
      heatmapSettings.resolution,
      undefined, // Use default bandwidth
      heatmapSettings.weightByTime
    );

    if (grid.cells.length === 0) {
      console.warn('No heatmap cells generated');
      return [];
    }

    // Calculate z position for heatmap based on visualization mode
    const allUniqueTimes = Array.from(new Set(nodes3D.map(node => node.time))).sort((a, b) => a - b);
    let heatmapZ: number;
    
    if (showTemporalPlanes && (temporalFilterMode === 'hybrid' || temporalFilterMode === 'planes')) {
      // Place below elevated shapefile
      heatmapZ = calculateZPosition(referenceTime, allUniqueTimes, temporalSpacing, temporalSpacingMode);
      heatmapZ -= (temporalFilterMode === 'hybrid' ? 0.7 : 0.15);
    } else {
      // Place at ground level (slightly below z=0)
      heatmapZ = -0.1;
    }

    console.log('Heatmap z position:', heatmapZ);

    // Convert grid to polygons for rendering
    const polygons = heatmapGridToPolygons(
      grid,
      coordinateTransform,
      spatialSpacing,
      heatmapZ,
      heatmapSettings.opacity
    );

    console.log('Heatmap polygons generated:', polygons.length);

    return polygons;
  }, [
    heatmapSettings,
    temporalRange,
    temporalFilterMode,
    nodes3D,
    coordinateTransform,
    firstData.nodes,
    firstData.edges,
    temporalSpacing,
    temporalSpacingMode,
    spatialSpacing
  ]);

  // Determine the geographic shape to use
  const shape = useMemo(() => {
    return determineGeographicShape(geographicShape, geographicMode, spatialSpacing);
  }, [geographicShape, geographicMode, spatialSpacing]);

  // Convert geographic shape to lines
  const shapeLines = useMemo(() => {
    if (!shape && !nodes3D.length) return [];
    
    const isTemporalPlanesActive = false; // Since diff visualizer doesn't have temporal planes
    const baseGeographicOpacity = geographicShapeOpacity ?? 70;
    const geographicOpacity = baseGeographicOpacity > 0 ? 
      (isTemporalPlanesActive ? Math.max(baseGeographicOpacity * VISUALIZATION_CONSTANTS.GEOGRAPHIC_REDUCED_OPACITY, 8) : baseGeographicOpacity * VISUALIZATION_CONSTANTS.GEOGRAPHIC_OPACITY_SCALE) : 0;
    const geographicLineWidth = isTemporalPlanesActive ? LINE_WIDTHS.GEOGRAPHIC_ACTIVE : LINE_WIDTHS.GEOGRAPHIC_NORMAL;
    const geographicColor = [colors.geographicGrid[0], colors.geographicGrid[1], colors.geographicGrid[2], geographicOpacity] as [number, number, number, number];

    const lines = [];

    // Add geographic shape lines if shape exists
    if (shape) {
      const baseLines = convertShapeToLines(shape, spatialSpacing);
      
      // Ground shape lines (always present)
      lines.push(...createShapeLines(
        baseLines,
        0,
        geographicColor,
        geographicLineWidth
      ));
      
      // Elevated shape lines (when temporal planes are active and we have a temporal range)
      if (showTemporalPlanes && temporalRange) {
        const allUniqueTimes = Array.from(new Set(nodes3D.map(node => node.time))).sort((a, b) => a - b);
        
        // For hybrid mode: use max time (top of range)
        // For planes mode: use center time (middle of range)
        const targetTime = temporalFilterMode === 'hybrid' ? temporalRange[1] : (temporalRange[0] + temporalRange[1]) / 2;
        
        // Calculate z position based on temporal spacing mode
        let z: number;
        if (temporalSpacingMode === 'equal') {
          const timeToZIndex = new Map(allUniqueTimes.map((time, index) => [time, index]));
          const zIndex = timeToZIndex.get(targetTime) ?? allUniqueTimes.findIndex(t => t >= targetTime);
          z = zIndex * temporalSpacing + 0.1;
        } else {
          const minTime = allUniqueTimes[0];
          const maxTime = allUniqueTimes[allUniqueTimes.length - 1];
          const normalizedTime = (targetTime - minTime) / (maxTime - minTime);
          z = normalizedTime * (allUniqueTimes.length - 1) * temporalSpacing + 0.1;
        }
        
        // In hybrid mode, place shapefile slightly below the nodes so nodes appear on top
        // Nodes are at z + BASE_ELEVATION (0.1), so subtract 0.08 to place shapefile below
        if (temporalFilterMode === 'hybrid') {
          z -= 0.6;
        }
        
        // Create elevated shape with enhanced visibility
        const elevatedOpacity = baseGeographicOpacity * 2.5;
        const elevatedColor = [colors.geographicGrid[0], colors.geographicGrid[1], colors.geographicGrid[2], elevatedOpacity] as [number, number, number, number];
        lines.push(...createShapeLines(baseLines, z, elevatedColor, geographicLineWidth));
      }
    }

    // Calculate bounds for temporal grid lines
    const bounds = {
      minX: Math.min(...nodes3D.map(n => n.position[0])),
      maxX: Math.max(...nodes3D.map(n => n.position[0])),
      minY: Math.min(...nodes3D.map(n => n.position[1])),
      maxY: Math.max(...nodes3D.map(n => n.position[1])),
      minZ: Math.min(...nodes3D.map(n => n.position[2])),
      maxZ: Math.max(...nodes3D.map(n => n.position[2]))
    };

    // Add temporal grid lines
    const uniqueTimes = Array.from(new Set(nodes3D.map(node => node.time))).sort((a, b) => a - b);
    const timeToZIndex = new Map(uniqueTimes.map((time, index) => [time, index]));
    
    const baseOpacity = temporalGridOpacity ?? 30;
    const timeSliceOpacity = isTemporalPlanesActive ? Math.min(baseOpacity * VISUALIZATION_CONSTANTS.TEMPORAL_OPACITY_SCALE, 8) : baseOpacity;
    const timeSliceLineWidth = isTemporalPlanesActive ? LINE_WIDTHS.TIME_SLICE_ACTIVE : LINE_WIDTHS.TIME_SLICE_NORMAL;
    const timeSliceColor = [colors.temporalGrid[0], colors.temporalGrid[1], colors.temporalGrid[2], timeSliceOpacity] as [number, number, number, number];

    if (timeSliceOpacity > 0) {
      uniqueTimes.forEach(time => {
        const zIndex = timeToZIndex.get(time) || 0;
        const z = zIndex * temporalSpacing;
        
        if (z !== 0) {
          lines.push({
            source: [bounds.minX - VISUALIZATION_CONSTANTS.GRID_EXTENSION, 0, z],
            target: [bounds.maxX + VISUALIZATION_CONSTANTS.GRID_EXTENSION, 0, z],
            color: timeSliceColor,
            width: timeSliceLineWidth
          });
          lines.push({
            source: [0, bounds.minY - VISUALIZATION_CONSTANTS.GRID_EXTENSION, z],
            target: [0, bounds.maxY + VISUALIZATION_CONSTANTS.GRID_EXTENSION, z],
            color: timeSliceColor,
            width: timeSliceLineWidth
          });
        }
      });
    }

    return lines;
  }, [shape, spatialSpacing, geographicShapeOpacity, temporalGridOpacity, colors.geographicGrid, colors.temporalGrid, nodes3D, temporalSpacing]);

  // Create layers
  const layers = useMemo(() => {
    const layers = [];

    // Add ancestry heatmap layer (rendered first, below everything else)
    if (ancestryHeatmap.length > 0) {
      layers.push(
        new PolygonLayer({
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
        })
      );
    }

    // Add geographic shape layer
    if (shapeLines.length > 0) {
      layers.push(
        new LineLayer({
          id: 'geographic-shape',
          data: shapeLines,
          getSourcePosition: d => d.source,
          getTargetPosition: d => d.target,
          getColor: d => d.color,
          getWidth: d => d.width,
          pickable: false
        })
      );
    }

    // Add edges layer
    layers.push(
      new LineLayer({
      id: 'edges',
      data: (heatmapSettings?.enabled && heatmapSettings.nodeVisibility === 'none') ||
            (heatmapSettings?.enabled && heatmapSettings.nodeVisibility === 'samples') ? [] : edges3D,
      getSourcePosition: d => d.source,
      getTargetPosition: d => d.target,
      getColor: d => d.color,
      getWidth: d => d.width,
      pickable: false
      })
    );

    // Add diff edges layer
    layers.push(
      new LineLayer({
        id: 'diff-edges',
        data: (heatmapSettings?.enabled && heatmapSettings.nodeVisibility === 'none') ||
              (heatmapSettings?.enabled && heatmapSettings.nodeVisibility === 'samples') ? [] : diffEdges,
        getSourcePosition: d => d.source,
        getTargetPosition: d => d.target,
        getColor: d => d.color,
        getWidth: d => d.width,
        pickable: false
      })
    );

    // Add nodes layer
    layers.push(
      new ScatterplotLayer<NodeDiff3D>({
        id: 'nodes',
        data: nodes3D,
        pickable: true,
        opacity: VISUALIZATION_CONSTANTS.NODE_OPACITY,
        stroked: true,
        filled: true,
        radiusUnits: 'meters',
        radiusScale: 1,
        radiusMinPixels: 1,
        lineWidthUnits: 'meters',
        lineWidthScale: 1,
        lineWidthMinPixels: 1,
        getPosition: (d: NodeDiff3D) => d.position,
        getRadius: (d: NodeDiff3D) => {
          // Hide nodes based on heatmap visibility settings
          const isSample = d.time === minTime;
          if (heatmapSettings?.enabled) {
            if (heatmapSettings.nodeVisibility === 'none') {
              return 0;
            } else if (heatmapSettings.nodeVisibility === 'samples' && !isSample) {
              return 0;
            }
          }
          
          // Get node-type-specific size from control panel (matching 3D visualizer)
          let baseRadius: number;
          if (isSample) {
            // Sample nodes (at minimum time)
            baseRadius = nodeSizes.sample * 0.5;
          } else if (d.is_combined) {
            // Combined nodes use internal size
            baseRadius = nodeSizes.other * 0.5;
          } else if (isRootNode(d, firstData?.nodes || [], firstData?.edges || [])) {
            // Root nodes
            baseRadius = nodeSizes.root * 0.5;
          } else {
            // Internal nodes
            baseRadius = nodeSizes.other * 0.5;
          }
          
          return baseRadius;
        },
        getFillColor: (d: NodeDiff3D) => {
          // Hide nodes based on heatmap visibility settings
          const isSample = d.time === minTime;
          if (heatmapSettings?.enabled) {
            if (heatmapSettings.nodeVisibility === 'none') {
              return [0, 0, 0, 0];
            } else if (heatmapSettings.nodeVisibility === 'samples' && !isSample) {
              return [0, 0, 0, 0];
            }
          }
          return calculateNodeColor(d, selectedNode ?? null, temporalRange, temporalFilterMode, colors);
        },
        getLineColor: (d: NodeDiff3D) => {
          // Hide nodes based on heatmap visibility settings
          const isSample = d.time === minTime;
          if (heatmapSettings?.enabled) {
            if (heatmapSettings.nodeVisibility === 'none') {
              return [0, 0, 0, 0];
            } else if (heatmapSettings.nodeVisibility === 'samples' && !isSample) {
              return [0, 0, 0, 0];
            }
          }
          return calculateNodeOutlineColor(d, selectedNode ?? null, firstData, temporalRange, temporalFilterMode, colors, minTime);
        },
        getLineWidth: (d: NodeDiff3D) => {
          // Hide nodes based on heatmap visibility settings
          const isSample = d.time === minTime;
          if (heatmapSettings?.enabled) {
            if (heatmapSettings.nodeVisibility === 'none') {
              return 0;
            } else if (heatmapSettings.nodeVisibility === 'samples' && !isSample) {
              return 0;
            }
          }
          
          const isRoot = isRootNode(d, firstData?.nodes || [], firstData?.edges || []);
          const baseSize = isSample ? nodeSizes.sample * 0.5 : 
                          isRoot ? nodeSizes.root * 0.5 : nodeSizes.other * 0.5;
          
          const sizeFactor = baseSize / (nodeSizes.other * 0.5);
          
          if (isRoot) return Math.max(0.8, LINE_WIDTHS.NODE_OUTLINE_ROOT * sizeFactor);
          if (isSample) return Math.max(0.5, LINE_WIDTHS.NODE_OUTLINE_SAMPLE * sizeFactor);
          return 0;
        },
        onClick: (info: any, event: any) => {
          if (info.object) {
            // Use the button that was pressed during pointerdown (not pointerup which is always 0)
            const isRightClick = lastPointerButtonRef.current === 2;
            
            // Debug logging
            console.log('Node clicked:', {
              lastPointerButton: lastPointerButtonRef.current,
              eventButton: event.srcEvent?.button,
              type: event.srcEvent?.type,
              isRightClick
            });
            
            if (isRightClick && onNodeRightClick) {
              event.srcEvent?.preventDefault?.();
              onNodeRightClick(info.object);
            } else if (!isRightClick && onNodeClick) {
              // Left click only
              onNodeClick(info.object);
            }
            
            // Reset for next click
            lastPointerButtonRef.current = 0;
          }
        },
        onHover: (_info: any) => {
          // Hover handling is done by DeckGL's built-in tooltip system
        },
        updateTriggers: {
          getRadius: [nodeSizes, minTime, heatmapSettings],
          getLineWidth: [nodeSizes, minTime, heatmapSettings],
          getFillColor: [temporalRange, temporalFilterMode, colors, heatmapSettings, selectedNode],
          getLineColor: [temporalRange, temporalFilterMode, colors, minTime, heatmapSettings, selectedNode]
        }
      })
    );

    // Add node labels layer
    layers.push(
      new TextLayer<NodeLabel3D>({
        id: 'node-labels',
        data: (heatmapSettings?.enabled && heatmapSettings.nodeVisibility === 'none') ? [] :
              (heatmapSettings?.enabled && heatmapSettings.nodeVisibility === 'samples') ? 
                nodeLabels.filter(label => label.labelId?.startsWith('sample-label-')) : nodeLabels,
        pickable: false,
        sizeUnits: 'meters',
        sizeScale: 1,
        getPosition: (d: NodeLabel3D) => d.position,
        getText: (d: NodeLabel3D) => d.text,
        getColor: (d: NodeLabel3D) => d.color,
        getSize: (d: NodeLabel3D) => d.size,
        getTextAnchor: 'middle' as const,
        getAlignmentBaseline: 'center' as const,
        fontFamily: 'Arial, sans-serif',
        fontWeight: 'bold',
        billboard: false,
        updateTriggers: {
          getData: [heatmapSettings],
          getSize: [nodeSizes, nodeIdSettings]
        }
      })
    );

    // Add edge labels layer
    layers.push(
      new TextLayer<EdgeLabel3D>({
        id: 'edge-labels',
        data: (heatmapSettings?.enabled && heatmapSettings.nodeVisibility === 'none') ||
              (heatmapSettings?.enabled && heatmapSettings.nodeVisibility === 'samples') ? [] : edgeLabels,
        pickable: false,
        sizeUnits: 'meters',
        sizeScale: 1,
        getPosition: (d: EdgeLabel3D) => d.position,
        getText: (d: EdgeLabel3D) => d.text,
        getColor: (d: EdgeLabel3D) => d.color,
        getSize: (d: EdgeLabel3D) => d.size,
        getTextAnchor: 'middle' as const,
        getAlignmentBaseline: 'center' as const,
        fontFamily: 'monospace, Arial, sans-serif',
        fontWeight: 'bold',
        billboard: true,
        updateTriggers: {
          getData: [heatmapSettings],
          getColor: [colors],
          getSize: [edgeLabelSettings]
        }
      })
    );

    // Add mutation markers layer
    layers.push(
      new TextLayer<MutationMarker3D>({
        id: 'mutation-markers',
        data: (heatmapSettings?.enabled && heatmapSettings.nodeVisibility === 'none') ||
              (heatmapSettings?.enabled && heatmapSettings.nodeVisibility === 'samples') ? [] : mutationMarkers,
        pickable: false,
        sizeUnits: 'meters',
        sizeScale: 1,
        getPosition: (d: MutationMarker3D) => d.position,
        getText: (d: MutationMarker3D) => d.text,
        getColor: (d: MutationMarker3D) => d.color,
        getSize: (d: MutationMarker3D) => d.size * 0.9,
        getTextAnchor: 'middle' as const,
        getAlignmentBaseline: 'center' as const,
        fontFamily: 'monospace, Arial, sans-serif',
        fontWeight: 'bold',
        billboard: true,
        background: true,
        backgroundColor: [255, 255, 255, 220],
        backgroundPadding: [2, 1.5, 2, 1.5],
        updateTriggers: {
          getData: [heatmapSettings],
          getPosition: [edgeMutationSettings, mutationMarkers],
          getText: [edgeMutationSettings],
          getColor: [edgeMutationSettings],
          getSize: [edgeMutationSettings]
        }
      })
    );

    return layers;
  }, [ancestryHeatmap, shapeLines, edges3D, diffEdges, nodes3D, nodeSizes, colors, temporalRange, temporalFilterMode, minTime, nodeLabels, edgeLabels, mutationMarkers, nodeIdSettings, edgeLabelSettings, edgeMutationSettings, heatmapSettings]);

  // View state management
  const [viewState, setViewState] = useState({
    target: [0, 0, 0] as [number, number, number],
    zoom: VISUALIZATION_CONSTANTS.DEFAULT_ZOOM as number,
    minZoom: VISUALIZATION_CONSTANTS.MIN_ZOOM as number,
    maxZoom: VISUALIZATION_CONSTANTS.MAX_ZOOM as number,
    rotationX: 30 as number,
    rotationOrbit: 0 as number,
    orbitAxis: 'Y' as const
  });

  // Apply external view state changes
  React.useEffect(() => {
    if (externalViewState) {
      setViewState(prev => ({ ...prev, ...externalViewState }));
    }
  }, [externalViewState]);

  if (!firstData || !secondData || nodes3D.length === 0) {
    return null;
  }

  return (
    <DeckGL
      layers={layers}
      views={new OrbitView()}
      viewState={viewState}
      onViewStateChange={({ viewState: newViewState }: any) => {
        const clampedViewState = {
          ...newViewState,
          zoom: Math.min(Math.max(newViewState.zoom, viewState.minZoom), viewState.maxZoom)
        };
        setViewState(clampedViewState);
        onViewStateChange?.(clampedViewState);
      }}
      controller={true}
      parameters={{
        blend: true
      }}
      getTooltip={({ object }: any) => {
        if (!object) return null;
        return createTooltipContent(object as NodeDiff3D, firstData, null, spatialSpacing, colors);
      }}
    />
  );
};

export default SpatialArgDiffVisualization; 