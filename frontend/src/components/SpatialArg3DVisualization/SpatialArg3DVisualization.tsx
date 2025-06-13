import React, { useMemo, useState, useRef } from 'react';
import DeckGL from '@deck.gl/react';
import { ScatterplotLayer, LineLayer } from '@deck.gl/layers';
import { OrbitView } from '@deck.gl/core';
import { GraphData, GraphNode, GraphEdge, GeographicShape } from '../ForceDirectedGraph/ForceDirectedGraph.types';
import { useColorTheme } from '../../context/ColorThemeContext';
import { convertShapeToLines3D, createGeographicTemporalPlanes, createUnitGridShape } from './GeographicUtils';
import { combineIdenticalNodes } from '../../utils/nodeCombining';
import { isRootNode } from '../../utils/graphTraversal';
import { formatCoordinates } from '../../utils/colorUtils';
import { TemporalSpacingMode } from './SpatialArg3DVisualization.types';

type GeographicMode = 'unit_grid' | 'eastern_hemisphere' | 'custom';

interface SpatialArg3DProps {
  data: GraphData | null;
  width: number;
  height: number;
  onNodeClick?: (node: GraphNode) => void;
  onNodeRightClick?: (node: GraphNode) => void;
  selectedNode?: GraphNode | null;
  temporalRange?: [number, number] | null;
  showTemporalPlanes?: boolean;
  temporalFilterMode?: 'hide' | 'planes' | null;
  temporalSpacing?: number;
  spatialSpacing?: number;
  geographicShape?: GeographicShape | null;
  geographicMode?: GeographicMode;
  temporalGridOpacity?: number;
  geographicShapeOpacity?: number;
  maxNodeRadius?: number;
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
  temporalSpacingMode?: TemporalSpacingMode;
}

interface Node3D extends GraphNode {
  position: [number, number, number];
  color: [number, number, number, number];
  size: number;
  // Properties for combined nodes
  is_combined?: boolean;
  combined_nodes?: number[];
}

interface Edge3D {
  source: [number, number, number];
  target: [number, number, number];
  color: [number, number, number, number];
}

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
  JITTER_SCALE: 0.001,
  JITTER_RANGE: 0.02,
  JITTER_OFFSET: 0.01,
  BASE_ELEVATION: 0.1,
  SELECTED_NODE_SCALE: 1.5,
  TEMPORAL_FADE_OPACITY: 0.5,
  EDGE_FADE_OPACITY: 0.2,
  EDGE_PARTIAL_FADE_OPACITY: 0.5,
  REDUCED_OPACITY_MULTIPLIER: 0.3,
  GEOGRAPHIC_OPACITY_SCALE: 2.5,
  GEOGRAPHIC_REDUCED_OPACITY: 0.3,
  TEMPORAL_OPACITY_SCALE: 0.3,
  GRID_EXTENSION: 2,
  UNIT_GRID_SIZE: 10
} as const;

const NODE_SIZES = {
  SAMPLE: 4,
  COMBINED: 3,
  ROOT: 4,
  DEFAULT: 3
} as const;

const LINE_WIDTHS = {
  GEOGRAPHIC_ACTIVE: 0.5,
  GEOGRAPHIC_NORMAL: 3,
  TIME_SLICE_ACTIVE: 0.5,
  TIME_SLICE_NORMAL: 1.5,
  NODE_OUTLINE_SELECTED: 2,
  NODE_OUTLINE_ROOT: 1.5,
  NODE_OUTLINE_SAMPLE: 0.8,
  MIN_NODE_OUTLINE: 0.3,
  MAX_NODE_OUTLINE: 4
} as const;

const createNodeJitter = (nodeId: number): number => {
  return (nodeId * VISUALIZATION_CONSTANTS.JITTER_SCALE) % VISUALIZATION_CONSTANTS.JITTER_RANGE - VISUALIZATION_CONSTANTS.JITTER_OFFSET;
};

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
  sourceNode: Node3D,
  targetNode: Node3D,
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

const determineGeographicShape = (
  geographicShape: GeographicShape | null,
  geographicMode: GeographicMode,
  spatialSpacing: number
): GeographicShape | null => {
  if (geographicShape) return geographicShape;
  if (geographicMode === 'unit_grid') return createUnitGridShape(VISUALIZATION_CONSTANTS.UNIT_GRID_SIZE, spatialSpacing);
  if (geographicMode === 'eastern_hemisphere') {
    console.warn('Eastern hemisphere mode selected but no geographic shape provided');
    return null;
  }
  return createUnitGridShape(VISUALIZATION_CONSTANTS.UNIT_GRID_SIZE, spatialSpacing);
};

const calculateCoordinateTransform = (
  nodes: GraphNode[],
  geographicMode: GeographicMode,
  geographicShape: GeographicShape | null
) => {
  const { nodes: combinedNodes } = combineIdenticalNodes(nodes, []);
  const spatialNodes = combinedNodes.filter(node => 
    node.location?.x !== undefined && node.location?.y !== undefined
  );

  if (spatialNodes.length === 0) return null;

  const xCoords = spatialNodes.map(node => node.location!.x);
  const yCoords = spatialNodes.map(node => node.location!.y);
  const minX = Math.min(...xCoords);
  const maxX = Math.max(...xCoords);
  const minY = Math.min(...yCoords);
  const maxY = Math.max(...yCoords);
  
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

const createTimeMapping = (nodes: Node3D[]) => {
  const uniqueTimes = Array.from(new Set(nodes.map(node => node.time))).sort((a, b) => a - b);
  return new Map(uniqueTimes.map((time, index) => [time, index]));
};

// Helper function to calculate z position based on temporal spacing mode
function calculateZPosition(
  time: number,
  uniqueTimes: number[],
  temporalSpacing: number,
  temporalSpacingMode: TemporalSpacingMode
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
  }
}

const transformNodesToThreeD = (
  spatialNodes: GraphNode[],
  coordinateTransform: any,
  temporalSpacing: number,
  spatialSpacing: number,
  colors: any,
  combinedNodes: GraphNode[],
  combinedEdges: GraphEdge[],
  uniqueTimes: number[],
  temporalSpacingMode: TemporalSpacingMode
): Node3D[] => {
  const { centerX, centerY, maxScale } = coordinateTransform;
  const timeToZIndex = createTimeMapping(spatialNodes as Node3D[]);

  return spatialNodes.map(node => {
    const normalizedX = ((node.location!.x - centerX) / maxScale) * spatialSpacing;
    const normalizedY = ((node.location!.y - centerY) / maxScale) * spatialSpacing;
    const zIndex = timeToZIndex.get(node.time) || 0;
    
    const jitter = createNodeJitter(node.id);
    const normalizedZ = calculateZPosition(node.time, uniqueTimes, temporalSpacing, temporalSpacingMode) + VISUALIZATION_CONSTANTS.BASE_ELEVATION + jitter;

    const size = calculateNodeSize(node, combinedNodes, combinedEdges);
    let color: [number, number, number, number];

    if (node.is_sample) {
      color = colors.nodeSample;
    } else if (node.is_combined) {
      color = colors.nodeCombined;
    } else if (isRootNode(node, combinedNodes, combinedEdges)) {
      color = colors.nodeRoot;
    } else {
      color = colors.nodeDefault;
    }

    return {
      ...node,
      position: [normalizedX, normalizedY, normalizedZ] as [number, number, number],
      color,
      size
    };
  });
};

const transformEdgesToThreeD = (
  edges: GraphEdge[],
  nodeMap: Map<number, Node3D>,
  temporalRange: [number, number] | null,
  temporalFilterMode: string | null,
  colors: any
): Edge3D[] => {
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
        source: sourceNode.position,
        target: targetNode.position,
        color: [colors.edgeDefault[0], colors.edgeDefault[1], colors.edgeDefault[2], edgeOpacity] as [number, number, number, number]
      };
    });
};

const calculateNodeColor = (
  node: Node3D,
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
  node: Node3D,
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
  node: Node3D,
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
  node: Node3D,
  data: GraphData | null,
  geographicMode: GeographicMode,
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
  
  return {
    html: `
      <div style="background: ${colors.tooltipBackground}; color: ${colors.tooltipText}; padding: 8px; border-radius: 4px; font-size: 12px;">
        <strong>Node ${node.id}</strong><br/>
        Time: ${node.time.toFixed(3)}<br/>
        ${nodeTypeInfo}<br/>
        ${node.location ? `Location: ${formatCoordinates(node.location.x, node.location.y, geographicMode === 'eastern_hemisphere')}` : ''}
      </div>
    `,
    style: {
      backgroundColor: 'transparent',
      color: colors.tooltipText
    }
  };
};

const SpatialArg3DVisualization = React.forwardRef<HTMLDivElement, SpatialArg3DProps>(({
  data,
  width,
  height,
  onNodeClick,
  onNodeRightClick,
  selectedNode,
  temporalRange,
  showTemporalPlanes = false,
  temporalFilterMode = null,
  temporalSpacing = 12,
  spatialSpacing = 160,
  geographicShape = null,
  geographicMode = 'unit_grid',
  temporalGridOpacity = 30,
  geographicShapeOpacity = 70,
  maxNodeRadius = 25,
  onViewStateChange,
  externalViewState,
  temporalSpacingMode = 'equal'
}, ref) => {
  const deckRef = useRef<any>(null);
  const { colors } = useColorTheme();
  const [viewState, setViewState] = useState({
    target: [0, 0, 0] as [number, number, number],
    zoom: VISUALIZATION_CONSTANTS.AUTO_FIT_ZOOM as number, // Use fit all zoom instead of default
    minZoom: VISUALIZATION_CONSTANTS.MIN_ZOOM,
    maxZoom: VISUALIZATION_CONSTANTS.MAX_ZOOM,
    rotationX: 30, // Start with 30 degree angle view
    rotationOrbit: 0, // Head on
    orbitAxis: 'Y' as const
  });

  // Apply external view state changes
  React.useEffect(() => {
    if (externalViewState) {
      setViewState(prev => ({ ...prev, ...externalViewState }));
    }
  }, [externalViewState]);

  const coordinateTransform = useMemo(() => {
    if (!data || !data.nodes.length) return null;
    return calculateCoordinateTransform(data.nodes, geographicMode, geographicShape);
  }, [data, geographicMode, geographicShape?.bounds]);

  const { nodes3D, edges3D, bounds } = useMemo(() => {
    if (!coordinateTransform) {
      return { nodes3D: [], edges3D: [], bounds: null };
    }

    const { nodes: combinedNodes, edges: combinedEdges } = combineIdenticalNodes(data!.nodes, data!.edges);
    
    // Get unique times for z-position calculation
    const uniqueTimes = Array.from(new Set(combinedNodes.map(n => n.time))).sort((a, b) => a - b);
    
    const transformedNodes = transformNodesToThreeD(
      coordinateTransform.spatialNodes,
      coordinateTransform,
      temporalSpacing,
      spatialSpacing,
      colors,
      combinedNodes,
      combinedEdges,
      uniqueTimes,
      temporalSpacingMode
    );

    const nodeMap = new Map<number, Node3D>();
    transformedNodes.forEach(node => nodeMap.set(node.id, node));

    const transformedEdges = transformEdgesToThreeD(
      combinedEdges,
      nodeMap,
      temporalRange || null,
      temporalFilterMode || null,
      colors
    );

    const bounds = {
      minX: Math.min(...transformedNodes.map(n => n.position[0])),
      maxX: Math.max(...transformedNodes.map(n => n.position[0])),
      minY: Math.min(...transformedNodes.map(n => n.position[1])),
      maxY: Math.max(...transformedNodes.map(n => n.position[1])),
      minZ: Math.min(...transformedNodes.map(n => n.position[2])),
      maxZ: Math.max(...transformedNodes.map(n => n.position[2]))
    };

    return { nodes3D: transformedNodes, edges3D: transformedEdges, bounds };
  }, [coordinateTransform, temporalSpacing, spatialSpacing, temporalSpacingMode, temporalFilterMode, temporalRange, colors]);

  // No auto-center logic here - the container handles it

  const temporalPlaneLines = useMemo(() => {
    if (!showTemporalPlanes || !temporalRange || !bounds) return [];

    const shapeToRender = determineGeographicShape(geographicShape, geographicMode, spatialSpacing);
    if (!shapeToRender) return [];

    const allUniqueTimes = Array.from(new Set(nodes3D.map(node => node.time))).sort((a, b) => a - b);
    const baseColor: [number, number, number] = [colors.temporalGrid[0], colors.temporalGrid[1], colors.temporalGrid[2]];
    
    // Calculate z position for the temporal plane using the same spacing mode
    const centerTime = (temporalRange[0] + temporalRange[1]) / 2;
    const z = calculateZPosition(centerTime, allUniqueTimes, temporalSpacing, temporalSpacingMode);
    
    return createGeographicTemporalPlanes(
      shapeToRender,
      allUniqueTimes,
      temporalSpacing,
      spatialSpacing,
      baseColor,
      temporalRange,
      z
    );
  }, [showTemporalPlanes, temporalRange, bounds, nodes3D, temporalSpacing, temporalSpacingMode, spatialSpacing, colors.textSecondary, geographicShape, geographicMode]);

  const geographicLines = useMemo(() => {
    if (!bounds || !nodes3D.length) return [];

    const shapeToRender = determineGeographicShape(geographicShape, geographicMode, spatialSpacing);
    if (!shapeToRender) return [];

    const isTemporalPlanesActive = showTemporalPlanes && temporalFilterMode === 'planes';
    const baseGeographicOpacity = geographicShapeOpacity ?? 70;
    const geographicOpacity = baseGeographicOpacity > 0 ? 
      (isTemporalPlanesActive ? Math.max(baseGeographicOpacity * VISUALIZATION_CONSTANTS.GEOGRAPHIC_REDUCED_OPACITY, 8) : baseGeographicOpacity * VISUALIZATION_CONSTANTS.GEOGRAPHIC_OPACITY_SCALE) : 0;
    const geographicLineWidth = isTemporalPlanesActive ? LINE_WIDTHS.GEOGRAPHIC_ACTIVE : LINE_WIDTHS.GEOGRAPHIC_NORMAL;
    const geographicColor = [colors.geographicGrid[0], colors.geographicGrid[1], colors.geographicGrid[2], geographicOpacity] as [number, number, number, number];

    const shapeLines = geographicOpacity > 0 ? convertShapeToLines3D(shapeToRender, 0, spatialSpacing, geographicColor, geographicLineWidth) : [];

    const lines = [...shapeLines];
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
  }, [bounds, colors.textSecondary, nodes3D, temporalSpacing, spatialSpacing, geographicShape, geographicMode, showTemporalPlanes, temporalFilterMode, temporalGridOpacity, geographicShapeOpacity]);

  const layers = [
    ...(geographicLines.length > 0 ? [
      new LineLayer({
        id: 'geographic-lines',
        data: geographicLines,
        pickable: false,
        getSourcePosition: (d: any) => d.source,
        getTargetPosition: (d: any) => d.target,
        getColor: (d: any) => d.color,
        getWidth: (d: any) => d.width || 0.5
      })
    ] : []),

    ...(showTemporalPlanes && temporalPlaneLines.length > 0 ? [
      new LineLayer({
        id: 'temporal-plane-lines',
        data: temporalPlaneLines,
        pickable: false,
        getSourcePosition: (d: any) => d.source,
        getTargetPosition: (d: any) => d.target,
        getColor: (d: any) => d.color,
        getWidth: (d: any) => d.width
      })
    ] : []),

    new LineLayer<Edge3D>({
      id: 'edges',
      data: edges3D,
      pickable: false,
      getSourcePosition: (d: Edge3D) => d.source,
      getTargetPosition: (d: Edge3D) => d.target,
      getColor: (d: Edge3D) => d.color,
      getWidth: VISUALIZATION_CONSTANTS.EDGE_WIDTH
    }),
    
    new ScatterplotLayer<Node3D>({
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
      getPosition: (d: Node3D) => d.position,
      getRadius: (d: Node3D) => {
        const isSelected = selectedNode && d.id === selectedNode.id;
        return isSelected ? d.size * VISUALIZATION_CONSTANTS.SELECTED_NODE_SCALE : d.size;
      },
      getFillColor: (d: Node3D) => calculateNodeColor(d, selectedNode || null, temporalRange || null, temporalFilterMode || null, colors),
      getLineColor: (d: Node3D) => calculateNodeOutlineColor(d, selectedNode || null, data, temporalRange || null, temporalFilterMode || null, colors),
      getLineWidth: (d: Node3D) => calculateNodeOutlineWidth(d, selectedNode || null, data),
      onClick: (info: any, event: any) => {
        event.srcEvent.preventDefault();
        if (info.object && onNodeClick) {
          onNodeClick(info.object);
        }
      },
      onHover: (info: any) => {
        if (info.rightButton && info.object && onNodeRightClick) {
          onNodeRightClick(info.object);
        }
      }
    })
  ];

  if (!data || nodes3D.length === 0) {
    return (
      <div 
        className="flex items-center justify-center border rounded bg-sp-very-dark-blue text-sp-white border-sp-dark-blue"
        style={{ width, height }}
      >
        <div className="text-center">
          <p className="text-lg mb-2">No spatial data available</p>
          <p className="text-sm text-sp-white/75">
            This ARG does not contain 2D spatial information required for 3D visualization.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div 
      style={{ width, height }} 
      className="relative bg-sp-very-dark-blue"
      data-3d-visualization="true"
      ref={(el) => {
        if (el && typeof ref === 'function') {
          ref(el);
        } else if (el && ref && 'current' in ref) {
          ref.current = el;
        }
        if (el) {
          (el as any).getExportData = () => ({
            nodes: nodes3D,
            edges: edges3D,
            bounds,
            currentViewState: viewState
          });
          (el as any).setViewState = (newViewState: Partial<typeof viewState>) => {
            setViewState(prev => ({ ...prev, ...newViewState }));
          };
        }
      }}
      onContextMenu={(event) => {
        event.preventDefault();
        const rect = event.currentTarget.getBoundingClientRect();
        const x = event.clientX - rect.left;
        const y = event.clientY - rect.top;
        
        if (deckRef.current) {
          const info = deckRef.current.pickObject({
            x: x,
            y: y,
            radius: 10
          });
          if (info?.object && onNodeRightClick) {
            onNodeRightClick(info.object);
          }
        }
      }}
    >
      <DeckGL
        ref={deckRef}
        width={width}
        height={height}
        views={new OrbitView()}
        viewState={viewState}
        onViewStateChange={({ viewState: newViewState }: any) => {
          setViewState(newViewState);
          onViewStateChange?.(newViewState);
        }}
        controller={{
          scrollZoom: true,
          dragPan: true,
          dragRotate: true,
          doubleClickZoom: true,
          touchZoom: true,
          touchRotate: true,
          keyboard: true
        }}
        layers={layers}
        getCursor={() => 'crosshair'}
        style={{ backgroundColor: colors.background }}
        getTooltip={({ object }: any) => {
          if (!object) return null;
          return createTooltipContent(object as Node3D, data, geographicMode, colors);
        }}
      />
    </div>
  );
});

SpatialArg3DVisualization.displayName = 'SpatialArg3DVisualization';

export default SpatialArg3DVisualization; 