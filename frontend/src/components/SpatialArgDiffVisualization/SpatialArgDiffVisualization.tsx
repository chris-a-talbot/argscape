import React, { useMemo, useState, useRef } from 'react';
import DeckGL from '@deck.gl/react';
import { ScatterplotLayer, LineLayer } from '@deck.gl/layers';
import { OrbitView } from '@deck.gl/core';
import { GraphData, GraphNode, GraphEdge, GeographicShape } from '../ForceDirectedGraph/ForceDirectedGraph.types';
import { useColorTheme } from '../../context/ColorThemeContext';
import { convertShapeToLines, createShapeLines, GeographicLine3D, createUnitGridShape } from '../SpatialArg3DVisualization/GeographicUtils';
import { combineIdenticalNodes } from '../../utils/nodeCombining';
import { isRootNode } from '../../utils/graphTraversal';
import { formatCoordinates } from '../../utils/colorUtils';

interface SpatialArgDiffProps {
  firstData: GraphData;
  secondData: GraphData;
  temporalSpacing?: number;
  temporalSpacingMode?: 'equal' | 'log' | 'linear';
  spatialSpacing?: number;
  temporalGridOpacity?: number;
  geographicShapeOpacity?: number;
  maxNodeRadius?: number;
  diffEdgeWidth?: number;
  geographicMode?: 'unit_grid' | 'eastern_hemisphere' | 'custom';
  geographicShape?: GeographicShape | null;
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

interface TransformNodesResult {
  nodes: NodeDiff3D[];
  diffEdges: DiffEdge[];
}

interface EdgeTransformResult {
  source: [number, number, number];
  target: [number, number, number];
  color: [number, number, number, number];
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
  TEMPORAL_FADE_OPACITY: 0.5,
  EDGE_FADE_OPACITY: 0.2,
  EDGE_PARTIAL_FADE_OPACITY: 0.5,
  REDUCED_OPACITY_MULTIPLIER: 0.3,
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

const NODE_SIZES = {
  SAMPLE: 4,
  COMBINED: 3,
  ROOT: 4,
  DEFAULT: 3
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

const calculateNodeSize = (node: GraphNode, combinedNodes: GraphNode[], combinedEdges: GraphEdge[]): number => {
  if (node.is_sample) return NODE_SIZES.SAMPLE;
  if (node.is_combined) return NODE_SIZES.COMBINED;
  if (isRootNode(node, combinedNodes, combinedEdges)) return NODE_SIZES.ROOT;
  return NODE_SIZES.DEFAULT;
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
  diffEdgeWidth: number
): { nodes: NodeDiff3D[], diffEdges: DiffEdge[] } => {
  const { centerX, centerY, maxScale } = coordinateTransform;
  const secondNodesMap = new Map(secondNodes.map(node => [node.id, node]));

  // Get unique times for z-position calculation
  const uniqueTimes = Array.from(new Set([...nodes.map(n => n.time), ...secondNodes.map(n => n.time)])).sort((a, b) => a - b);

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

    // For sample nodes, use the same position (they shouldn't move)
    const isSample = node.is_sample;
    const finalX = isSample ? normalizedX : (normalizedX + normalizedSecondX) / 2;
    const finalY = isSample ? normalizedY : (normalizedY + normalizedSecondY) / 2;
    
    // Add jittering to z position
    const jitter = createNodeJitter(node.id);
    const finalZ = calculateZPosition(node.time, uniqueTimes, temporalSpacing, temporalSpacingMode) + VISUALIZATION_CONSTANTS.BASE_ELEVATION + jitter;

    // Calculate Euclidean distance between positions (0 for samples)
    const dx = normalizedSecondX - normalizedX;
    const dy = normalizedSecondY - normalizedY;
    const distance = isSample ? 0 : Math.sqrt(dx * dx + dy * dy);

    // Calculate node size using the same logic as the original visualization
    const size = calculateNodeSize(node, combinedNodes, combinedEdges);

    // Calculate color based on node type
    let color: [number, number, number, number];
    if (isSample) {
      color = colors.nodeSample;
    } else if (node.is_combined) {
      color = colors.nodeCombined;
    } else if (isRootNode(node, combinedNodes, combinedEdges)) {
      color = colors.nodeRoot;
    } else {
      color = colors.nodeDefault;
    }

    // Add diff edges for non-sample nodes
    if (!isSample) {
      // Edge from first position to centroid
      diffEdges.push({
        source: [normalizedX, normalizedY, finalZ],
        target: [finalX, finalY, finalZ],
        color: [255, 0, 0, 180] as [number, number, number, number], // Semi-transparent red
        width: diffEdgeWidth
      });
      // Edge from centroid to second position
      diffEdges.push({
        source: [finalX, finalY, finalZ],
        target: [normalizedSecondX, normalizedSecondY, finalZ],
        color: [255, 0, 0, 180] as [number, number, number, number], // Semi-transparent red
        width: diffEdgeWidth
      });
    }

    return {
      ...node,
      position: [finalX, finalY, finalZ] as [number, number, number],
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
  colors: any
): [number, number, number, number] => {
  const isSelected = selectedNode && node.id === selectedNode.id;
  const isRoot = isRootNode(node, data?.nodes || [], data?.edges || []);
  
  let opacityMultiplier = 1;
  if (temporalFilterMode === 'planes' && temporalRange) {
    const [minTime, maxTime] = temporalRange;
    const isInTemporalRange = node.time >= minTime && node.time <= maxTime;
    if (!isInTemporalRange) {
      opacityMultiplier = VISUALIZATION_CONSTANTS.REDUCED_OPACITY_MULTIPLIER;
    }
  }
  
  if (isSelected) return colors.nodeSelected;
  
  if (isRoot) {
    return [colors.nodeSelected[0], colors.nodeSelected[1], colors.nodeSelected[2], colors.nodeSelected[3] * opacityMultiplier] as [number, number, number, number];
  }
  
  if (node.is_sample) {
    const outlineColor = colors.background === '#ffffff' ? 0 : 255;
    return [outlineColor, outlineColor, outlineColor, 255 * opacityMultiplier] as [number, number, number, number];
  }
  
  return [colors.nodeSelected[0], colors.nodeSelected[1], colors.nodeSelected[2], 0] as [number, number, number, number];
};

const calculateNodeOutlineWidth = (
  node: NodeDiff3D,
  selectedNode: GraphNode | null,
  data: GraphData | null
): number => {
  const isSelected = selectedNode && node.id === selectedNode.id;
  const isRoot = isRootNode(node, data?.nodes || [], data?.edges || []);
  const baseSize = isSelected ? node.size * VISUALIZATION_CONSTANTS.SELECTED_NODE_SCALE : node.size;
  
  const sizeFactor = baseSize / NODE_SIZES.DEFAULT;
  
  if (isSelected) return Math.max(1, LINE_WIDTHS.NODE_OUTLINE_SELECTED * sizeFactor);
  if (isRoot) return Math.max(0.8, LINE_WIDTHS.NODE_OUTLINE_ROOT * sizeFactor);
  if (node.is_sample) return Math.max(0.5, LINE_WIDTHS.NODE_OUTLINE_SAMPLE * sizeFactor);
  return 0;
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
  spatialSpacing: number
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
  temporalSpacing: 12,
  spatialSpacing: 160,
  temporalGridOpacity: 30,
  geographicShapeOpacity: 70,
  maxNodeRadius: 25,
  diffEdgeWidth: 3,
  temporalSpacingMode: 'equal' as const
};

export const SpatialArgDiffVisualization: React.FC<SpatialArgDiffProps> = ({
  firstData,
  secondData,
  temporalSpacing = DEFAULT_VISUAL_SETTINGS.temporalSpacing,
  temporalSpacingMode = DEFAULT_VISUAL_SETTINGS.temporalSpacingMode,
  spatialSpacing = DEFAULT_VISUAL_SETTINGS.spatialSpacing,
  temporalGridOpacity = DEFAULT_VISUAL_SETTINGS.temporalGridOpacity,
  geographicShapeOpacity = DEFAULT_VISUAL_SETTINGS.geographicShapeOpacity,
  maxNodeRadius = DEFAULT_VISUAL_SETTINGS.maxNodeRadius,
  diffEdgeWidth = DEFAULT_VISUAL_SETTINGS.diffEdgeWidth,
  geographicMode = 'unit_grid',
  geographicShape = null
}) => {
  const { colors } = useColorTheme();

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
      diffEdgeWidth
    );

    return {
      nodes3D: result.nodes,
      diffEdges: result.diffEdges
    };
  }, [firstData, secondData, temporalSpacing, temporalSpacingMode, spatialSpacing, colors, geographicMode, geographicShape, diffEdgeWidth]);

  // Transform edges to 3D
  const edges3D = useMemo(() => {
    const nodeMap = new Map(nodes3D.map((node: NodeDiff3D) => [node.id, node]));
    const edges = transformEdgesToThreeD(
      firstData.edges,
      nodeMap,
      null,
      null,
      colors
    );
    return edges.map(edge => ({
      ...edge,
      width: VISUALIZATION_CONSTANTS.EDGE_WIDTH
    })) as EdgeDiff3D[];
  }, [firstData.edges, nodes3D, colors]);

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
      lines.push(...createShapeLines(
        baseLines,
        0,
        geographicColor,
        geographicLineWidth
      ));
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
      data: edges3D,
        getSourcePosition: d => d.source,
        getTargetPosition: d => d.target,
        getColor: d => d.color,
        getWidth: d => VISUALIZATION_CONSTANTS.EDGE_WIDTH,
        pickable: false
      })
    );

    // Add diff edges layer
    layers.push(
      new LineLayer({
        id: 'diff-edges',
        data: diffEdges,
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
        radiusScale: VISUALIZATION_CONSTANTS.NODE_RADIUS_SCALE,
        radiusMinPixels: VISUALIZATION_CONSTANTS.MIN_NODE_RADIUS,
        radiusMaxPixels: maxNodeRadius,
        lineWidthMinPixels: VISUALIZATION_CONSTANTS.MIN_NODE_RADIUS,
        lineWidthMaxPixels: LINE_WIDTHS.MAX_NODE_OUTLINE,
        getPosition: (d: NodeDiff3D) => d.position,
        getRadius: (d: NodeDiff3D) => d.size,
        getFillColor: (d: NodeDiff3D) => d.color,
        getLineColor: (d: NodeDiff3D) => calculateNodeOutlineColor(d, null, null, null, null, colors),
        getLineWidth: (d: NodeDiff3D) => calculateNodeOutlineWidth(d, null, null),
        onClick: (info: any, event: any) => {
          event.srcEvent.preventDefault();
        },
        onHover: (info: any) => {
          // Hover handling is done by DeckGL's built-in tooltip system
        }
      })
    );

    return layers;
  }, [shapeLines, edges3D, diffEdges, nodes3D, maxNodeRadius, colors]);

  // Initial view state
  const initialViewState = useMemo(() => ({
    target: [0, 0, 0] as [number, number, number],
    rotationX: 0,
    rotationOrbit: 0,
    zoom: VISUALIZATION_CONSTANTS.DEFAULT_ZOOM,
    minZoom: VISUALIZATION_CONSTANTS.MIN_ZOOM,
    maxZoom: VISUALIZATION_CONSTANTS.MAX_ZOOM
  }), []);

  if (!firstData || !secondData || nodes3D.length === 0) {
    return null;
  }

  return (
    <DeckGL
      layers={layers}
      views={new OrbitView()}
      initialViewState={initialViewState}
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