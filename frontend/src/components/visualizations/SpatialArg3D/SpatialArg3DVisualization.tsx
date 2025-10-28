/*
 * 3D Spatial ARG Visualization - World-Space Consistency System
 * 
 * SOLUTION FOR TRUE 3D NAVIGATION WITH CONSTANT RELATIVE SIZES:
 * - All elements (nodes, edges, geographic shapes) use world-space 'meters' units
 * - Dynamic zoom limits scale with Z-axis height: maxZoom = baseMax * (zHeight * scaleFactor)  
 * - Node sizes controlled by control panel maintain constant relative size to 3D space
 * - Geographic features scale consistently with nodes at all zoom levels
 * - Seamless navigation from top temporal layers to Z=0 without size distortion
 * - Camera can approach any layer from any angle while maintaining proportions
 * 
 * This creates a true 3D environment where all elements maintain their spatial
 * relationships regardless of camera position, zoom level, or viewing angle.
 */

import React, { useMemo, useState, useRef, useCallback, useEffect, forwardRef, ForwardedRef } from 'react';
import DeckGL from '@deck.gl/react';
import { ScatterplotLayer, LineLayer, TextLayer, PolygonLayer } from '@deck.gl/layers';
import { OrbitView } from '@deck.gl/core';
import { GraphData, GraphNode, GraphEdge, GeographicShape, NodeSizeSettings } from '../ForceDirectedGraph/ForceDirectedGraph.types';
import { useColorTheme } from '../../../context/ColorThemeContext';
import { convertShapeToLines, createShapeLines, GeographicLine3D, createUnitGridShape } from '../SpatialArgUtils/GeographicUtils';
import { combineSpatiallyColocatedNodes, analyzeNodeCombining } from '../../../utils/nodeCombining';
import { isRootNode } from '../../../utils/graphTraversal';
import { formatCoordinates } from '../../../utils/colorUtils';
import { TemporalSpacingMode, NodeIdSettings, EdgeLabelSettings, EdgeMutationSettings, LabelConnectingLine3D, LabelPositionResult, AncestryHeatmapSettings } from './SpatialArg3DVisualization.types';
import { 
  groupEdgesByPairs, 
  expandEdgeSpansForCombinedNodes,
  EdgeGroupWithSpans 
} from '../../../utils/genomicSpanUtils';
import {
  calculateAncestryDensity,
  generateHeatmapGrid,
  heatmapGridToPolygons
} from '../SpatialArgUtils/AncestryHeatmap';

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
  temporalFilterMode?: 'hide' | 'planes' | 'hybrid' | null;
  temporalSpacing?: number;
  spatialSpacing?: number;
  geographicShape?: GeographicShape | null;
  geographicMode?: GeographicMode;
  temporalGridOpacity?: number;
  geographicShapeOpacity?: number;
  nodeSizes?: NodeSizeSettings;
  nodeIdSettings?: NodeIdSettings;
  edgeThickness?: number;
  edgeOpacity?: number;
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
  edgeLabelSettings?: EdgeLabelSettings;
  edgeMutationSettings?: EdgeMutationSettings;
  heatmapSettings?: AncestryHeatmapSettings;
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

interface NodeLabel3D {
  position: [number, number, number];
  text: string;
  color: [number, number, number, number];
  size: number;
  nodeIds: number[];
  needsLine: boolean;
  nodePosition?: [number, number, number]; // Position of the representative node for line connection
  labelId: string; // Unique identifier for this label
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

// Constants - World-space 3D system with dynamic zoom calculation
const VISUALIZATION_CONSTANTS = {
  DEFAULT_ZOOM: 2.5,
  AUTO_FIT_ZOOM: 1.8,
  BASE_MIN_ZOOM: 0.001, // Much lower minimum for extreme deep z-axis navigation
  BASE_MAX_ZOOM: 500, // Much higher base maximum for better z-axis reach
  ZOOM_SCALE_FACTOR: 1.0, // Significantly increased factor for aggressive z-axis navigation
  NODE_OPACITY: 0.85,
  NODE_RADIUS_SCALE: 8, // For compatibility (not used in world-space mode)
  MIN_NODE_RADIUS: 2, // For compatibility (not used in world-space mode)  
  MAX_NODE_RADIUS: 50, // Default control panel maximum
  EDGE_WIDTH: 1, // World-space width for edges
  JITTER_SCALE: 0.001,
  JITTER_RANGE: 0.02,
  JITTER_OFFSET: 0.01,
  BASE_ELEVATION: 0.1,
  SELECTED_NODE_SCALE: 1.5,
  TEMPORAL_FADE_OPACITY: 0.3,
  EDGE_FADE_OPACITY: 0.15,
  EDGE_PARTIAL_FADE_OPACITY: 0.35,
  REDUCED_OPACITY_MULTIPLIER: 0.2,
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
  GEOGRAPHIC_ACTIVE: 0.8, // Reduced for cleaner appearance
  GEOGRAPHIC_NORMAL: 1.5, // Reduced for cleaner appearance
  TIME_SLICE_ACTIVE: 0.5, // Reduced thickness
  TIME_SLICE_NORMAL: 0.8, // Reduced thickness
  NODE_OUTLINE_SELECTED: 2,
  NODE_OUTLINE_ROOT: 1.5,
  NODE_OUTLINE_SAMPLE: 0.8,
  MIN_NODE_OUTLINE: 0.3,
  MAX_NODE_OUTLINE: 4
} as const;

const createNodeJitter = (nodeId: number): number => {
  return (nodeId * VISUALIZATION_CONSTANTS.JITTER_SCALE) % VISUALIZATION_CONSTANTS.JITTER_RANGE - VISUALIZATION_CONSTANTS.JITTER_OFFSET;
};

// Helper function to calculate label bounding box
const getLabelBoundingBox = (
  labelPosition: [number, number, number],
  textSize: number
): {
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
  minZ: number;
  maxZ: number;
} => {
  // Approximate text dimensions based on size
  const textWidth = textSize * 2.0; // Rough estimate for text width
  const textHeight = textSize * 1.2; // Rough estimate for text height
  const textDepth = textSize * 0.1; // Small depth for 3D text
  
  return {
    minX: labelPosition[0] - textWidth / 2,
    maxX: labelPosition[0] + textWidth / 2,
    minY: labelPosition[1] - textHeight / 2,
    maxY: labelPosition[1] + textHeight / 2,
    minZ: labelPosition[2] - textDepth / 2,
    maxZ: labelPosition[2] + textDepth / 2
  };
};

// Helper function to find the edge point of a label bounding box closest to a target
const findLabelEdgePoint = (
  labelPosition: [number, number, number],
  textSize: number,
  targetPosition: [number, number, number]
): [number, number, number] => {
  const bbox = getLabelBoundingBox(labelPosition, textSize);
  
  // Find the closest point on the bounding box edge to the target
  const clampedX = Math.max(bbox.minX, Math.min(bbox.maxX, targetPosition[0]));
  const clampedY = Math.max(bbox.minY, Math.min(bbox.maxY, targetPosition[1]));
  const clampedZ = Math.max(bbox.minZ, Math.min(bbox.maxZ, targetPosition[2]));
  
  return [clampedX, clampedY, clampedZ];
};

// Helper function to find visible connection point on node (not overshadowed by other samples)
const findVisibleNodeConnectionPoint = (
  targetNode: Node3D,
  allSampleNodes: Node3D[],
  labelPosition: [number, number, number],
  baseNodeSize: number
): [number, number, number] => {
  const nodePos = targetNode.position;
  const nodeRadius = baseNodeSize * 0.5;
  
  // Try different points around the node's perimeter
  const connectionAttempts = [
    [1, 0],     // Right
    [-1, 0],    // Left
    [0, -1],    // Down (better for 3D top-down view)
    [0, 1],     // Up
    [0.7, -0.7], // Lower right
    [-0.7, -0.7], // Lower left
    [0.7, 0.7],  // Upper right
    [-0.7, 0.7]  // Upper left
  ];
  
  for (const [dx, dy] of connectionAttempts) {
    const connectionPoint: [number, number, number] = [
      nodePos[0] + dx * nodeRadius * 0.9, // Slightly inside node edge
      nodePos[1] + dy * nodeRadius * 0.9,
      nodePos[2] // Same Z level as node
    ];
    
    // Check if this point is visible from above (not overshadowed by other samples)
    let isVisible = true;
    for (const otherSample of allSampleNodes) {
      if (otherSample.id === targetNode.id) continue;
      
      const otherPos = otherSample.position;
      const otherRadius = baseNodeSize * 0.5;
      
      // Check if other sample overshadows this connection point when viewed from above
      const xyDistance = Math.sqrt(
        Math.pow(connectionPoint[0] - otherPos[0], 2) +
        Math.pow(connectionPoint[1] - otherPos[1], 2)
      );
      
      // If another sample is above or at same level and close in XY, it overshadows
      if (otherPos[2] >= connectionPoint[2] && xyDistance < otherRadius * 1.2) {
        isVisible = false;
        break;
      }
    }
    
    if (isVisible) {
      return connectionPoint;
    }
  }
  
  // Fallback: use the node center if no visible edge point found
  return nodePos;
};

// Helper function to check if a line intersects with any nodes
const lineIntersectsNodes = (
  start: [number, number, number],
  end: [number, number, number],
  allNodes: Node3D[],
  baseNodeSize: number,
  excludeNodeId?: number
): boolean => {
  for (const node of allNodes) {
    if (excludeNodeId && node.id === excludeNodeId) continue;
    
    const nodeRadius = node.is_sample ? baseNodeSize * 0.5 : baseNodeSize * 0.4;
    const nodePos = node.position;
    
    // Calculate distance from line segment to node center
    const distance = distanceFromPointToLineSegment3D(
      nodePos[0], nodePos[1], nodePos[2],
      start[0], start[1], start[2],
      end[0], end[1], end[2]
    );
    
    // Add buffer for clearance
    if (distance < nodeRadius + 1.0) {
      return true;
    }
  }
  
  return false;
};

// Helper function to calculate 3D distance from point to line segment
const distanceFromPointToLineSegment3D = (
  px: number, py: number, pz: number,
  x1: number, y1: number, z1: number,
  x2: number, y2: number, z2: number
): number => {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const dz = z2 - z1;
  
  const length = Math.sqrt(dx * dx + dy * dy + dz * dz);
  if (length === 0) return Math.sqrt((px - x1) ** 2 + (py - y1) ** 2 + (pz - z1) ** 2);
  
  const t = Math.max(0, Math.min(1, ((px - x1) * dx + (py - y1) * dy + (pz - z1) * dz) / (length * length)));
  
  const closestX = x1 + t * dx;
  const closestY = y1 + t * dy;
  const closestZ = z1 + t * dz;
  
  return Math.sqrt((px - closestX) ** 2 + (py - closestY) ** 2 + (pz - closestZ) ** 2);
};

// Helper function to check if two line segments intersect in 3D space
const linesIntersect3D = (
  line1Start: [number, number, number],
  line1End: [number, number, number],
  line2Start: [number, number, number],
  line2End: [number, number, number],
  threshold: number = 1.0
): boolean => {
  // Find closest points between two 3D line segments
  const d1 = [line1End[0] - line1Start[0], line1End[1] - line1Start[1], line1End[2] - line1Start[2]];
  const d2 = [line2End[0] - line2Start[0], line2End[1] - line2Start[1], line2End[2] - line2Start[2]];
  const r = [line1Start[0] - line2Start[0], line1Start[1] - line2Start[1], line1Start[2] - line2Start[2]];
  
  const a = d1[0] * d1[0] + d1[1] * d1[1] + d1[2] * d1[2];
  const e = d2[0] * d2[0] + d2[1] * d2[1] + d2[2] * d2[2];
  const f = d2[0] * r[0] + d2[1] * r[1] + d2[2] * r[2];
  const c = d1[0] * r[0] + d1[1] * r[1] + d1[2] * r[2];
  const b = d1[0] * d2[0] + d1[1] * d2[1] + d1[2] * d2[2];
  
  const denom = a * e - b * b;
  if (Math.abs(denom) < 1e-6) return false; // Parallel lines
  
  const s = (b * f - c * e) / denom;
  const t = (a * f - b * c) / denom;
  
  // Check if intersection points are within line segments
  if (s >= 0 && s <= 1 && t >= 0 && t <= 1) {
    const closest1 = [
      line1Start[0] + s * d1[0],
      line1Start[1] + s * d1[1],
      line1Start[2] + s * d1[2]
    ];
    const closest2 = [
      line2Start[0] + t * d2[0],
      line2Start[1] + t * d2[1],
      line2Start[2] + t * d2[2]
    ];
    
    const distance = Math.sqrt(
      (closest1[0] - closest2[0]) ** 2 +
      (closest1[1] - closest2[1]) ** 2 +
      (closest1[2] - closest2[2]) ** 2
    );
    
    return distance < threshold;
  }
  
  return false;
};

// Helper function to find route around obstacles using waypoints
const findRouteAroundObstacles = (
  start: [number, number, number],
  end: [number, number, number],
  allNodes: Node3D[],
  existingLines: LabelConnectingLine3D[],
  baseNodeSize: number,
  excludeNodeId: number
): [number, number, number][] => {
  // Simple waypoint strategy: try going around obstacles in XY plane
  const midpoint: [number, number, number] = [
    (start[0] + end[0]) / 2,
    (start[1] + end[1]) / 2,
    (start[2] + end[2]) / 2
  ];
  
  // Try different waypoint offsets in XY plane
  const waypointAttempts = [
    [baseNodeSize * 3, 0, 0],        // Right
    [-baseNodeSize * 3, 0, 0],       // Left
    [0, baseNodeSize * 3, 0],        // Up
    [0, -baseNodeSize * 3, 0],       // Down
    [baseNodeSize * 2, baseNodeSize * 2, 0],   // Upper right
    [-baseNodeSize * 2, baseNodeSize * 2, 0],  // Upper left
    [baseNodeSize * 2, -baseNodeSize * 2, 0],  // Lower right
    [-baseNodeSize * 2, -baseNodeSize * 2, 0]  // Lower left
  ];
  
  for (const [dx, dy, dz] of waypointAttempts) {
    const waypoint: [number, number, number] = [
      midpoint[0] + dx,
      midpoint[1] + dy,
      midpoint[2] + dz
    ];
    
    // Check if both segments avoid obstacles and intersections
    const segment1Clear = !lineIntersectsNodes(start, waypoint, allNodes, baseNodeSize, excludeNodeId);
    const segment2Clear = !lineIntersectsNodes(waypoint, end, allNodes, baseNodeSize, excludeNodeId);
    
    // Check against existing lines
    let intersectsExistingLines = false;
    for (const existingLine of existingLines) {
      if (linesIntersect3D(start, waypoint, existingLine.source, existingLine.target, 0.5) ||
          linesIntersect3D(waypoint, end, existingLine.source, existingLine.target, 0.5)) {
        intersectsExistingLines = true;
        break;
      }
    }
    
    if (segment1Clear && segment2Clear && !intersectsExistingLines) {
      return [waypoint];
    }
  }
  
  // If no single waypoint works, return empty array (use direct line as fallback)
  return [];
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
};

const calculateEdgeOpacity = (
  sourceNode: Node3D,
  targetNode: Node3D,
  temporalRange: [number, number] | null,
  temporalFilterMode: string | null,
  baseOpacity: number
): number => {
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
  combinedNodes: GraphNode[], // Accept already-combined nodes
  geographicMode: GeographicMode,
  geographicShape: GeographicShape | null
) => {
  // Use the already-combined nodes directly instead of doing our own combining
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
      // Find the two closest time values and interpolate between them
      let lowerIndex = 0;
      for (let i = 0; i < uniqueTimes.length; i++) {
        if (uniqueTimes[i] > time) break;
        lowerIndex = i;
      }
      
      // If we're at the last index or exact match, just return that position
      if (lowerIndex === uniqueTimes.length - 1 || uniqueTimes[lowerIndex] === time) {
        return lowerIndex * temporalSpacing;
      }
      
      // Interpolate between the two closest positions
      const lowerTime = uniqueTimes[lowerIndex];
      const upperTime = uniqueTimes[lowerIndex + 1];
      const fraction = (time - lowerTime) / (upperTime - lowerTime);
      return (lowerIndex + fraction) * temporalSpacing;
    
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
  colors: any,
  edgeOpacity: number = 85
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

      // Convert percentage to 0-255 range for alpha channel
      const baseOpacity = (edgeOpacity / 100) * 255;
      const finalOpacity = calculateEdgeOpacity(
        sourceNode, 
        targetNode, 
        temporalRange, 
        temporalFilterMode, 
        baseOpacity
      );

      return {
        source: sourceNode.position,
        target: targetNode.position,
        color: [colors.edgeDefault[0], colors.edgeDefault[1], colors.edgeDefault[2], finalOpacity] as [number, number, number, number]
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
  if ((temporalFilterMode === 'planes' || temporalFilterMode === 'hybrid') && temporalRange) {
    const [minTime, maxTime] = temporalRange;
    
    if (temporalFilterMode === 'hybrid') {
      // In hybrid mode, dim nodes below maxTime
      if (node.time < maxTime) {
        opacityMultiplier = VISUALIZATION_CONSTANTS.REDUCED_OPACITY_MULTIPLIER;
      }
    } else {
      // In planes mode, dim nodes outside range
      const isInTemporalRange = node.time >= minTime && node.time <= maxTime;
      if (!isInTemporalRange) {
        opacityMultiplier = VISUALIZATION_CONSTANTS.REDUCED_OPACITY_MULTIPLIER;
      }
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

// Helper function to create contrast color for text
const getContrastColor = (backgroundColor: [number, number, number, number], colors: any): [number, number, number, number] => {
  // Calculate brightness of background color
  const brightness = (backgroundColor[0] * 299 + backgroundColor[1] * 587 + backgroundColor[2] * 114) / 1000;
  
  // Use white text on dark backgrounds, dark text on light backgrounds
  if (brightness < 128) {
    return [255, 255, 255, 255]; // White
  } else {
    return [0, 0, 0, 255]; // Black
  }
};

// Helper function to find optimal position for a sample label
const findOptimalLabelPosition = (
  nodeGroup: Node3D[],
  allNodes: Node3D[],
  existingLabels: NodeLabel3D[],
  baseNodeSize: number
): LabelPositionResult => {
  // Calculate the representative position and z-level
  const representativeNode = nodeGroup[0];
  const nodeX = representativeNode.position[0];
  const nodeY = representativeNode.position[1];
  const nodeZ = representativeNode.position[2];
  
  // Define potential positions to try (in order of preference)
  const nodeRadius = baseNodeSize;
  const minDistance = nodeRadius * 2.0;
  const maxDistance = nodeRadius * 12.0;
  const stepSize = nodeRadius * 0.3;
  
  // Small z-offset to ensure sample labels appear above geographic shapes
  const labelZOffset = baseNodeSize * 0.3;
  
  // Enhanced directions with more options and better preference order
  const directions = [
    [1, 0],     // Right (preferred for readability)
    [-1, 0],    // Left  
    [0, -1],    // Down (better than up for 3D view)
    [0, 1],     // Up
    [1, -1],    // Lower right (good secondary choice)
    [-1, -1],   // Lower left
    [1, 1],     // Upper right
    [-1, 1],    // Upper left
    [0.7, -0.7], // Diagonal variations for better placement
    [-0.7, -0.7],
    [0.7, 0.7],
    [-0.7, 0.7]
  ];
  
  // Try positions at increasing distances
  for (let distance = minDistance; distance <= maxDistance; distance += stepSize) {
    for (const [dx, dy] of directions) {
      const candidatePos: [number, number, number] = [
        nodeX + dx * distance,
        nodeY + dy * distance,
        nodeZ + labelZOffset // Slightly above node's z-level to clear geographic shapes
      ];
      
      // Enhanced collision detection with nodes
      let hasNodeCollision = false;
      const labelRadius = baseNodeSize * 0.9;
      
      for (const node of allNodes) {
        const nodeSize = node.is_sample ? baseNodeSize : baseNodeSize * 0.8;
        
        // Enhanced collision detection considering XY plane and Z-axis separately
        const xyDistance = Math.sqrt(
          Math.pow(candidatePos[0] - node.position[0], 2) +
          Math.pow(candidatePos[1] - node.position[1], 2)
        );
        const zDistance = Math.abs(candidatePos[2] - node.position[2]);
        
        // Check XY proximity first (critical for visibility)
        const xyRequiredClearance = nodeSize + labelRadius + 2.0;
        
        // Check Z proximity (avoid placing labels above/below nodes)
        const zRequiredClearance = Math.max(nodeSize, labelRadius) + 1.0;
        
        // Collision if too close in XY plane OR directly above/below in Z
        const hasXYCollision = xyDistance < xyRequiredClearance;
        const hasZCollision = zDistance < zRequiredClearance && xyDistance < nodeSize * 2;
        
        if (hasXYCollision || hasZCollision) {
          hasNodeCollision = true;
          break;
        }
      }
      
      if (hasNodeCollision) continue;
      
      // Enhanced label-to-label collision detection
      let tooCloseToOtherLabel = false;
      const minLabelDistance = baseNodeSize * 2.5;
      
      for (const existingLabel of existingLabels) {
        const xyLabelDistance = Math.sqrt(
          Math.pow(candidatePos[0] - existingLabel.position[0], 2) +
          Math.pow(candidatePos[1] - existingLabel.position[1], 2)
        );
        const zLabelDistance = Math.abs(candidatePos[2] - existingLabel.position[2]);
        
        // Labels on different Z levels can be closer in XY plane
        const zFactor = zLabelDistance < baseNodeSize ? 1.0 : 0.6;
        const effectiveMinDistance = minLabelDistance * zFactor;
        
        if (xyLabelDistance < effectiveMinDistance) {
          tooCloseToOtherLabel = true;
          break;
        }
      }
      
      // If not too close to other labels, this is a good position
      if (!tooCloseToOtherLabel) {
        return {
          position: candidatePos,
          needsLine: distance > nodeRadius * 4.0, // Need line if placed far away
          connectionDistance: distance
        };
      }
    }
  }
  
  // Fallback: use original offset method if no valid position found
  const fallbackDistance = nodeRadius * 2.5;
  return {
    position: [nodeX + fallbackDistance, nodeY, nodeZ + labelZOffset],
    needsLine: true,
    connectionDistance: fallbackDistance
  };
};

// Helper function to create node labels directly from combined nodes (no additional grouping needed)
const createNodeLabels = (
  nodes3D: Node3D[],
  nodeIdSettings: NodeIdSettings | undefined,
  combinedNodes: GraphNode[],
  combinedEdges: GraphEdge[],
  nodeSizes: NodeSizeSettings,
  colors: any,
  customLabelPositions?: Map<string, [number, number, number]>,
  temporalRange?: [number, number] | null,
  temporalFilterMode?: string | null
): { labels: NodeLabel3D[], connectingLines: LabelConnectingLine3D[] } => {
  if (!nodeIdSettings) return { labels: [], connectingLines: [] };
  
  const labels: NodeLabel3D[] = [];
  const connectingLines: LabelConnectingLine3D[] = [];
  
  // Filter nodes for labeling based on settings
  const sampleNodes = nodes3D.filter(node => 
    node.is_sample && nodeIdSettings.showSampleIds
  );
  
  const rootNodes = nodes3D.filter(node => 
    !node.is_sample && isRootNode(node, combinedNodes, combinedEdges) && nodeIdSettings.showRootIds
  );
  
  const internalNodes = nodes3D.filter(node => 
    !node.is_sample && !isRootNode(node, combinedNodes, combinedEdges) && nodeIdSettings.showInternalIds
  );
  
  // Process sample nodes with smart positioning and connecting lines
  sampleNodes.forEach(node => {
    const baseNodeSize = nodeSizes.sample * 0.5;
    const textSize = baseNodeSize * 1.0;
    
    // Use theme text color for samples
    let labelOpacity = 255;
    
    // Apply temporal dimming in hybrid mode
    if (temporalFilterMode === 'hybrid' && temporalRange) {
      const maxTime = temporalRange[1];
      if (node.time < maxTime) {
        // Dim labels for nodes below the current layer (use same multiplier as nodes)
        labelOpacity = 255 * VISUALIZATION_CONSTANTS.REDUCED_OPACITY_MULTIPLIER;
      }
    }
    
    const textColor: [number, number, number, number] = [
      parseInt(colors.text.slice(1, 3), 16),
      parseInt(colors.text.slice(3, 5), 16), 
      parseInt(colors.text.slice(5, 7), 16),
      labelOpacity
    ];
    
    // Use the label from combined node (e.g., "4/5" for combined nodes)
    const labelText = node.label || node.id.toString();
    
    // Create unique label ID
    const labelId = `sample-label-${node.id}`;
    
    // Use custom position if available, otherwise find optimal position
    let labelPosition: [number, number, number];
    let needsLine: boolean;
    let connectionDistance: number;
    
    if (customLabelPositions?.has(labelId)) {
      labelPosition = customLabelPositions.get(labelId)!;
      // Calculate distance from custom position to node
      connectionDistance = Math.sqrt(
        Math.pow(labelPosition[0] - node.position[0], 2) +
        Math.pow(labelPosition[1] - node.position[1], 2) +
        Math.pow(labelPosition[2] - node.position[2], 2)
      );
      // Dynamic connecting line logic based on distance
      needsLine = connectionDistance > baseNodeSize * 3.0;
    } else {
      // Find optimal position for sample labels (smart positioning)
      const { position: optimalPosition, needsLine: optimalNeedsLine, connectionDistance: optimalDistance } = findOptimalLabelPosition(
        [node], // Single node since combining already happened
        nodes3D, // All nodes for collision detection
        labels, // Existing labels to avoid conflicts
        baseNodeSize
      );
      labelPosition = optimalPosition;
      needsLine = optimalNeedsLine;
      connectionDistance = optimalDistance;
    }
    
    labels.push({
      position: labelPosition,
      text: labelText,
      color: textColor,
      size: textSize,
      nodeIds: node.combined_nodes || [node.id], // Use combined_nodes if available
      needsLine,
      nodePosition: node.position,
      labelId
    });
      
    // Create connecting line if needed
    if (needsLine || connectionDistance > baseNodeSize * 3.0) {
      // Find visible connection point on the node
      const visibleConnectionPoint = findVisibleNodeConnectionPoint(
        node,
        nodes3D.filter(n => n.is_sample),
        labelPosition,
        baseNodeSize
      );
      
      // Find the edge point of the label closest to the node
      const labelEdgePoint = findLabelEdgePoint(labelPosition, textSize, visibleConnectionPoint);
      
      // Base line opacity calculation
      let lineOpacity = Math.min(255, Math.max(140, 255 - connectionDistance * 6));
      
      // Apply temporal dimming to line opacity (use same dimming as label)
      if (temporalFilterMode === 'hybrid' && temporalRange) {
        const maxTime = temporalRange[1];
        if (node.time < maxTime) {
          lineOpacity = lineOpacity * VISUALIZATION_CONSTANTS.REDUCED_OPACITY_MULTIPLIER;
        }
      }
      
      const lineWidth = Math.max(0.2, Math.min(1.0, baseNodeSize * 0.12));
      
      connectingLines.push({
        source: labelEdgePoint,
        target: visibleConnectionPoint,
        color: [textColor[0], textColor[1], textColor[2], lineOpacity] as [number, number, number, number],
        width: lineWidth,
        labelId: `${labelId}-line`,
        nodeId: node.id
      });
    }
  });
  
  // Process root nodes (positioned directly on nodes)
  rootNodes.forEach(node => {
    const baseNodeSize = nodeSizes.root * 0.5;
    const textSize = baseNodeSize * 1.2;
    
    // Get contrast color for root nodes
    const nodeColor = calculateNodeColor(node, null, null, null, colors);
    let textColor = getContrastColor(nodeColor, colors);
    
    // Apply temporal dimming in hybrid mode
    if (temporalFilterMode === 'hybrid' && temporalRange) {
      const maxTime = temporalRange[1];
      if (node.time < maxTime) {
        // Dim labels for nodes below the current layer
        textColor = [
          textColor[0],
          textColor[1],
          textColor[2],
          textColor[3] * VISUALIZATION_CONSTANTS.REDUCED_OPACITY_MULTIPLIER
        ] as [number, number, number, number];
      }
    }
    
    // Use the label from combined node (e.g., "10/11" for combined nodes)
    const labelText = node.label || node.id.toString();
    
    labels.push({
      position: node.position, // Position directly on node
      text: labelText,
      color: textColor,
      size: textSize,
      nodeIds: node.combined_nodes || [node.id], // Use combined_nodes if available
      needsLine: false, // Root nodes don't need connecting lines
      nodePosition: node.position,
      labelId: `root-label-${node.id}`
    });
  });
  
  // Process internal nodes (positioned directly on nodes)
  internalNodes.forEach(node => {
    const baseNodeSize = nodeSizes.other * 0.5;
    const textSize = baseNodeSize * 1.2;
    
    // Get contrast color for internal nodes
    const nodeColor = calculateNodeColor(node, null, null, null, colors);
    const textColor = getContrastColor(nodeColor, colors);
    
    // Use the label from combined node (e.g., "8/9" for combined nodes)
    const labelText = node.label || node.id.toString();
    
    labels.push({
      position: node.position, // Position directly on node
      text: labelText,
      color: textColor,
      size: textSize,
      nodeIds: node.combined_nodes || [node.id], // Use combined_nodes if available
      needsLine: false, // Internal nodes don't need connecting lines
      nodePosition: node.position,
      labelId: `internal-label-${node.id}`
    });
  });
  
  return { labels, connectingLines };
};

const createEdgeLabels = (
  edges3D: Edge3D[],
  edgeGroups: EdgeGroupWithSpans[],
  edgeLabelSettings: EdgeLabelSettings | undefined,
  colors: any,
  nodes3D: Node3D[]
): EdgeLabel3D[] => {
  if (!edgeLabelSettings?.showEdgeLabels || !edgeGroups.length) {
    return [];
  }

  const labels: EdgeLabel3D[] = [];
  const nodeMap = new Map<number, Node3D>();
  nodes3D.forEach(node => nodeMap.set(node.id, node));

  edgeGroups.forEach(edgeGroup => {
    // Find the actual 3D nodes for this edge group
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
      const textColorMatch = colors.text.match(/\d+/g);
      const textColor: [number, number, number, number] = textColorMatch ? 
        [parseInt(textColorMatch[0]), parseInt(textColorMatch[1]), parseInt(textColorMatch[2]), 255] :
        [255, 255, 255, 255]; // fallback to white

      labels.push({
        position: [midX, midY, offsetZ],
        text: edgeGroup.formattedSpans,
        color: textColor,
        size: edgeLabelSettings.labelFontSize * 0.8, // Slightly smaller for 3D space
        sourceId: edgeGroup.sourceId,
        targetId: edgeGroup.targetId
      });
    }
  });

  return labels;
};

const createMutationMarkers = (
  edges3D: Edge3D[],
  combinedEdges: GraphEdge[],
  nodeMap: Map<number, Node3D>,
  edgeMutationSettings: EdgeMutationSettings | undefined,
  colors: any
): MutationMarker3D[] => {
  if (!edgeMutationSettings?.showMutationMarkers) {
    return [];
  }

  const markers: MutationMarker3D[] = [];
  
  // Filter edges that have mutations
  const mutationEdges = combinedEdges.filter(edge => edge.has_mutations);
  
  console.log('Spatial 3D mutation markers debug:', {
    totalEdges: combinedEdges.length,
    edgesWithMutations: mutationEdges.length,
    firstFewMutationEdges: mutationEdges.slice(0, 5).map(edge => ({
      source: typeof edge.source === 'number' ? edge.source : (edge.source as any).id,
      target: typeof edge.target === 'number' ? edge.target : (edge.target as any).id,
      has_mutations: edge.has_mutations,
      left: edge.left,
      right: edge.right
    })),
    sampleEdgesMutationStatus: combinedEdges.slice(0, 10).map(edge => ({
      source: typeof edge.source === 'number' ? edge.source : (edge.source as any).id,
      target: typeof edge.target === 'number' ? edge.target : (edge.target as any).id,
      has_mutations: edge.has_mutations,
      left: edge.left,
      right: edge.right
    }))
  });
  
  mutationEdges.forEach(graphEdge => {
    const sourceId = typeof graphEdge.source === 'number' ? graphEdge.source : (graphEdge.source as any).id;
    const targetId = typeof graphEdge.target === 'number' ? graphEdge.target : (graphEdge.target as any).id;
    
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

  console.log('Created mutation markers:', {
    totalMarkers: markers.length,
    percentageOfEdgesWithMutations: `${Math.round((mutationEdges.length / combinedEdges.length) * 100)}%`,
    note: 'High percentage is normal - most edges span large genomic regions containing mutations'
  });
  return markers;
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
  nodeSizes = { sample: 15, root: 12, other: 8 },
  nodeIdSettings,
  edgeThickness = 1.0,
  edgeOpacity = 85,
  onViewStateChange,
  externalViewState,
  temporalSpacingMode = 'equal',
  edgeLabelSettings,
  edgeMutationSettings,
  heatmapSettings
}, ref) => {
  // OrbitView zoom behavior: Higher zoom = closer to object, Lower zoom = farther away
  // With maxZoom: 1000, users can now zoom very close to objects for detailed inspection
  // Physical units (meters) ensure consistent object sizes regardless of zoom level
  const deckRef = useRef<any>(null);
  const { colors } = useColorTheme();
  
  // State for draggable label positions
  const [customLabelPositions, setCustomLabelPositions] = useState<Map<string, [number, number, number]>>(new Map());
  const [isDragging, setIsDragging] = useState<string | null>(null);
  
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
  // Calculate dynamic zoom limits based on Z-axis height
  const calculateZoomLimits = useCallback((bounds: any) => {
    if (!bounds) {
      return {
        minZoom: VISUALIZATION_CONSTANTS.BASE_MIN_ZOOM,
        maxZoom: VISUALIZATION_CONSTANTS.BASE_MAX_ZOOM
      };
    }
    
    const zHeight = bounds.maxZ - bounds.minZ;
    // Scale zoom limits based on Z-axis height - more layers need higher zoom capability
    const scaleFactor = Math.max(1, zHeight * VISUALIZATION_CONSTANTS.ZOOM_SCALE_FACTOR);
    
    return {
      minZoom: VISUALIZATION_CONSTANTS.BASE_MIN_ZOOM / scaleFactor,
      maxZoom: VISUALIZATION_CONSTANTS.BASE_MAX_ZOOM * scaleFactor
    };
  }, []);

  const [viewState, setViewState] = useState({
    target: [0, 0, 0] as [number, number, number],
    zoom: VISUALIZATION_CONSTANTS.AUTO_FIT_ZOOM as number, // Use fit all zoom instead of default
    minZoom: VISUALIZATION_CONSTANTS.BASE_MIN_ZOOM as number,
    maxZoom: VISUALIZATION_CONSTANTS.BASE_MAX_ZOOM as number,
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

  // First do spatial combining, then calculate coordinate transform using combined nodes
  const { combinedNodesForTransform, combinedEdgesForTransform } = useMemo(() => {
    if (!data || !data.nodes.length) return { combinedNodesForTransform: [], combinedEdgesForTransform: [] };
    
    // Apply spatial combining once at the top level
    const { nodes: combinedNodes, edges: combinedEdges } = combineSpatiallyColocatedNodes(data.nodes, data.edges);
    return { combinedNodesForTransform: combinedNodes, combinedEdgesForTransform: combinedEdges };
  }, [data]);

  const coordinateTransform = useMemo(() => {
    if (!combinedNodesForTransform.length) return null;
    return calculateCoordinateTransform(combinedNodesForTransform, geographicMode, geographicShape);
  }, [combinedNodesForTransform, geographicMode, geographicShape?.bounds]);

  const { nodes3D: allNodes3D, edges3D, bounds } = useMemo(() => {
    if (!coordinateTransform || !combinedNodesForTransform.length) {
      return { nodes3D: [], edges3D: [], bounds: null };
    }

    // Debug: Analyze node combining patterns
    analyzeNodeCombining(data!.nodes, data!.edges);
    
    // Use the already-combined nodes and edges from the top level
    const combinedNodes = combinedNodesForTransform;
    const combinedEdges = combinedEdgesForTransform;
    
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
      colors,
      edgeOpacity
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
  }, [coordinateTransform, combinedNodesForTransform, combinedEdgesForTransform, temporalSpacing, spatialSpacing, temporalSpacingMode, temporalFilterMode, temporalRange, colors, edgeOpacity]);

  // Keep all nodes for calculations, but we'll control visibility in the layer
  const nodes3D = allNodes3D;

  // Update view state with dynamic zoom limits when bounds change
  React.useEffect(() => {
    if (bounds) {
      const zoomLimits = calculateZoomLimits(bounds);
      const zHeight = bounds.maxZ - bounds.minZ;
      
      console.log('World-Space 3D Navigation Calculation:', {
        zHeight,
        temporalLayers: Math.round(zHeight / 12), // Approximate layer count
        minZ: bounds.minZ,
        maxZ: bounds.maxZ,
        baseMinZoom: VISUALIZATION_CONSTANTS.BASE_MIN_ZOOM,
        baseMaxZoom: VISUALIZATION_CONSTANTS.BASE_MAX_ZOOM,
        dynamicMinZoom: zoomLimits.minZoom,
        dynamicMaxZoom: zoomLimits.maxZoom,
        scaleFactor: zHeight * VISUALIZATION_CONSTANTS.ZOOM_SCALE_FACTOR,
        zoomMultiplier: Math.max(1, zHeight * VISUALIZATION_CONSTANTS.ZOOM_SCALE_FACTOR),
        worldSpaceUnits: 'meters'
      });
      
      setViewState(prev => ({
        ...prev,
        minZoom: zoomLimits.minZoom,
        maxZoom: zoomLimits.maxZoom
      }));
    }
  }, [bounds, calculateZoomLimits]);

  // No auto-center logic here - the container handles it

  const geographicLines = useMemo(() => {
    if (!bounds || !nodes3D.length) return [];

    const shapeToRender = determineGeographicShape(geographicShape, geographicMode, spatialSpacing);
    if (!shapeToRender) return [];

    // Convert shape to 2D lines once
    const baseLines = convertShapeToLines(shapeToRender, spatialSpacing);
    const isTemporalPlanesActive = showTemporalPlanes && (temporalFilterMode === 'planes' || temporalFilterMode === 'hybrid');
    
    console.log('Temporal Filter State:', {
      showTemporalPlanes,
      temporalFilterMode,
      isTemporalPlanesActive,
      temporalRange,
      temporalSpacing,
      temporalSpacingMode
    });

    const baseGeographicOpacity = geographicShapeOpacity ?? 70;
    
    // Create ground shape (dimmed when temporal planes are active)
    const groundOpacity = baseGeographicOpacity > 0 ? 
      (isTemporalPlanesActive ? Math.max(baseGeographicOpacity * 0.15, 8) : baseGeographicOpacity) : 0;
    const groundColor = [colors.geographicGrid[0], colors.geographicGrid[1], colors.geographicGrid[2], groundOpacity] as [number, number, number, number];
    const groundShapeLines = createShapeLines(baseLines, 0, groundColor, LINE_WIDTHS.GEOGRAPHIC_NORMAL);

    // Create elevated shape if temporal filtering is active
    let elevatedShapeLines: GeographicLine3D[] = [];
    if (isTemporalPlanesActive && temporalRange) {
      const allUniqueTimes = Array.from(new Set(nodes3D.map(node => node.time))).sort((a, b) => a - b);
      
      // For hybrid mode: use max time (top of range)
      // For planes mode: use center time (middle of range)
      const targetTime = temporalFilterMode === 'hybrid' ? temporalRange[1] : (temporalRange[0] + temporalRange[1]) / 2;
      let z = calculateZPosition(targetTime, allUniqueTimes, temporalSpacing, temporalSpacingMode);
      
      // In hybrid mode, place shapefile slightly below the nodes so nodes appear on top
      // Nodes are at z + BASE_ELEVATION (0.1), so subtract 0.08 to place shapefile below
      if (temporalFilterMode === 'hybrid') {
        z -= 0.6;
      }
      
      console.log('Elevated Shape Position:', {
        targetTime,
        temporalFilterMode,
        allUniqueTimes,
        z,
        temporalRange,
        temporalSpacing
      });

      const elevatedOpacity = baseGeographicOpacity * 2.5;
      const elevatedColor = [colors.geographicGrid[0], colors.geographicGrid[1], colors.geographicGrid[2], elevatedOpacity] as [number, number, number, number];
      elevatedShapeLines = createShapeLines(baseLines, z, elevatedColor, LINE_WIDTHS.GEOGRAPHIC_NORMAL);
      
      console.log('Created Elevated Shape:', {
        numLines: elevatedShapeLines.length,
        firstLine: elevatedShapeLines[0],
        opacity: elevatedOpacity,
        color: elevatedColor
      });
    }

    // Combine ground and elevated shapes
    const lines = [...groundShapeLines, ...elevatedShapeLines];
    
    console.log('Final Lines:', {
      totalLines: lines.length,
      groundLines: groundShapeLines.length,
      elevatedLines: elevatedShapeLines.length,
      sampleGroundZ: groundShapeLines[0]?.source[2],
      sampleElevatedZ: elevatedShapeLines[0]?.source[2]
    });

    // Add temporal grid lines
    if (temporalGridOpacity > 0) {
      const uniqueTimes = Array.from(new Set(nodes3D.map(node => node.time))).sort((a, b) => a - b);
      const timeToZIndex = new Map(uniqueTimes.map((time, index) => [time, index]));
      
      const baseOpacity = temporalGridOpacity;
      const timeSliceOpacity = isTemporalPlanesActive ? Math.min(baseOpacity * 0.3, 8) : baseOpacity;
      const timeSliceColor = [colors.temporalGrid[0], colors.temporalGrid[1], colors.temporalGrid[2], timeSliceOpacity] as [number, number, number, number];

      uniqueTimes.forEach(time => {
        const zIndex = timeToZIndex.get(time) || 0;
        const z = zIndex * temporalSpacing;
        
        if (z !== 0) {
          lines.push({
            source: [bounds.minX - VISUALIZATION_CONSTANTS.GRID_EXTENSION, 0, z],
            target: [bounds.maxX + VISUALIZATION_CONSTANTS.GRID_EXTENSION, 0, z],
            color: timeSliceColor,
            width: LINE_WIDTHS.TIME_SLICE_NORMAL
          });
          lines.push({
            source: [0, bounds.minY - VISUALIZATION_CONSTANTS.GRID_EXTENSION, z],
            target: [0, bounds.maxY + VISUALIZATION_CONSTANTS.GRID_EXTENSION, z],
            color: timeSliceColor,
            width: LINE_WIDTHS.TIME_SLICE_NORMAL
          });
        }
      });
    }

    return lines;
  }, [bounds, colors.geographicGrid, colors.temporalGrid, nodes3D, temporalSpacing, temporalSpacingMode, spatialSpacing, showTemporalPlanes, temporalFilterMode, temporalGridOpacity, geographicShapeOpacity, geographicShape, geographicMode, temporalRange]);

  // Create node labels and connecting lines
  const { nodeLabels, labelConnectingLines } = useMemo(() => {
    if (!nodes3D.length || !combinedNodesForTransform.length) return { nodeLabels: [], labelConnectingLines: [] };
    
    // Use the same combined nodes that were used for 3D transformation
    const combinedNodes = combinedNodesForTransform;
    const combinedEdges = combinedEdgesForTransform;
    
    const result = createNodeLabels(
      nodes3D,
      nodeIdSettings,
      combinedNodes,
      combinedEdges,
      nodeSizes,
      colors,
      customLabelPositions,
      temporalRange,
      temporalFilterMode
    );
    
    return { nodeLabels: result.labels, labelConnectingLines: result.connectingLines };
  }, [nodes3D, nodeIdSettings, combinedNodesForTransform, combinedEdgesForTransform, nodeSizes, colors, customLabelPositions, temporalRange, temporalFilterMode]);

  // Create edge labels with genomic spans
  const edgeLabels = useMemo(() => {
    if (!data || !edgeLabelSettings?.showEdgeLabels || !edges3D.length) return [];
    
    // Calculate edge groups for labels
    const edgeGroups = groupEdgesByPairs(combinedEdgesForTransform, combinedNodesForTransform, data.metadata.sequence_length);
    
    // Handle combined nodes by expanding their genomic spans
    const expandedEdgeGroups = expandEdgeSpansForCombinedNodes(
      edgeGroups, 
      combinedNodesForTransform, 
      data.edges, // Use original edges for combined node expansion
      data.metadata.sequence_length
    );

    return createEdgeLabels(edges3D, expandedEdgeGroups, edgeLabelSettings, colors, nodes3D);
  }, [data, edgeLabelSettings, edges3D, combinedEdgesForTransform, combinedNodesForTransform, colors, nodes3D]);

  // Create mutation markers (red "x"s) on edges that have mutations
  const mutationMarkers = useMemo(() => {
    if (!edges3D.length || !combinedEdgesForTransform.length || !nodes3D.length) return [];
    
    // Create node map for mutation marker positioning
    const nodeMap = new Map<number, Node3D>();
    nodes3D.forEach(node => nodeMap.set(node.id, node));
    
    return createMutationMarkers(edges3D, combinedEdgesForTransform, nodeMap, edgeMutationSettings, colors);
  }, [edges3D, combinedEdgesForTransform, nodes3D, edgeMutationSettings, colors]);

  // Create ancestry density heatmap
  const ancestryHeatmap = useMemo(() => {
    // Show heatmap when enabled, regardless of temporal filter
    if (!heatmapSettings?.enabled || 
        !allNodes3D.length ||
        !coordinateTransform) {
      return [];
    }

    // Calculate time range based on mode
    const minTimeInData = Math.min(...combinedNodesForTransform.map(n => n.time));
    const maxTimeInData = Math.max(...combinedNodesForTransform.map(n => n.time));
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

    console.log('Ancestry Heatmap Calculation:', {
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
    const nodesInTimeWindow = combinedNodesForTransform.filter(node => 
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
      combinedNodesForTransform,
      combinedEdgesForTransform
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
    const allUniqueTimes = Array.from(new Set(allNodes3D.map(node => node.time))).sort((a, b) => a - b);
    let heatmapZ: number;
    
    if (temporalFilterMode === 'hybrid' || temporalFilterMode === 'planes') {
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
    allNodes3D,
    coordinateTransform,
    combinedNodesForTransform,
    combinedEdgesForTransform,
    temporalSpacing,
    temporalSpacingMode,
    spatialSpacing
  ]);

  const layers = [
    // Ancestry heatmap layer (rendered first, below everything else)
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
    }),

    new LineLayer({
      id: 'geographic-lines',
      data: geographicLines,
      pickable: false,
      widthUnits: 'meters', // World-space units for consistent 3D scaling
      widthScale: 1,
      widthMinPixels: 1, // Improved pixel fallback for better rendering quality
      getSourcePosition: (d: any) => d.source,
      getTargetPosition: (d: any) => d.target,
      getColor: (d: any) => d.color,
      getWidth: (d: any) => d.width || 1.5 // Use direct width without additional scaling
    }),

    new LineLayer<LabelConnectingLine3D>({
      id: 'label-connecting-lines',
      data: (heatmapSettings?.enabled && heatmapSettings.nodeVisibility === 'none') ||
            (heatmapSettings?.enabled && heatmapSettings.nodeVisibility === 'samples') ? [] : labelConnectingLines,
      pickable: false,
      widthUnits: 'meters', // World-space units for consistent 3D scaling
      widthScale: 1,
      widthMinPixels: 0.8, // Slightly thicker minimum for better visibility
      widthMaxPixels: 4, // Cap maximum pixel width for extreme zoom
      getSourcePosition: (d: LabelConnectingLine3D) => d.source,
      getTargetPosition: (d: LabelConnectingLine3D) => d.target,
      getColor: (d: LabelConnectingLine3D) => d.color,
      getWidth: (d: LabelConnectingLine3D) => d.width,
      updateTriggers: {
        getData: [labelConnectingLines, heatmapSettings],
        getColor: [nodeIdSettings, colors],
        getWidth: [nodeSizes, nodeIdSettings]
      }
    }),

    new LineLayer<Edge3D>({
      id: 'edges',
      data: (heatmapSettings?.enabled && heatmapSettings.nodeVisibility === 'none') ||
            (heatmapSettings?.enabled && heatmapSettings.nodeVisibility === 'samples') ? [] : edges3D,
      pickable: false,
      widthUnits: 'meters', // World-space units for consistent 3D scaling
      widthScale: 1,
      widthMinPixels: 1, // Improved pixel fallback for better rendering quality
      getSourcePosition: (d: Edge3D) => d.source,
      getTargetPosition: (d: Edge3D) => d.target,
      getColor: (d: Edge3D) => d.color,
      getWidth: edgeThickness * 0.5, // Use control panel edge thickness
      updateTriggers: {
        getData: [heatmapSettings],
        getColor: [edgeOpacity],
        getWidth: [edgeThickness]
      }
    }),
    
    new ScatterplotLayer<Node3D>({
      id: 'nodes',
      data: nodes3D,
      pickable: true,
      opacity: VISUALIZATION_CONSTANTS.NODE_OPACITY,
      stroked: true,
      filled: true,
      radiusUnits: 'meters', // World-space units for consistent 3D scaling
      radiusScale: 1, // Direct world-space scaling
      radiusMinPixels: 1, // Minimal pixel fallback for extreme zoom-out
      lineWidthUnits: 'meters', // World-space units for outlines
      lineWidthScale: 1,
      lineWidthMinPixels: 1, // Improved pixel fallback for better rendering quality
      getPosition: (d: Node3D) => d.position,
      getRadius: (d: Node3D) => {
        // Hide nodes based on heatmap visibility settings
        if (heatmapSettings?.enabled) {
          if (heatmapSettings.nodeVisibility === 'none') {
            return 0;
          } else if (heatmapSettings.nodeVisibility === 'samples' && !d.is_sample) {
            return 0;
          }
        }
        
        const isSelected = selectedNode && d.id === selectedNode.id;
        
        // Get node-type-specific size from control panel
        let baseRadius: number;
        if (d.is_sample) {
          baseRadius = nodeSizes.sample * 0.5;
        } else if (d.is_combined) {
          baseRadius = nodeSizes.other * 0.5; // Use internal size for combined nodes
        } else if (isRootNode(d, data?.nodes || [], data?.edges || [])) {
          baseRadius = nodeSizes.root * 0.5;
        } else {
          baseRadius = nodeSizes.other * 0.5;
        }
        
        return isSelected ? baseRadius * VISUALIZATION_CONSTANTS.SELECTED_NODE_SCALE : baseRadius;
      },
      getFillColor: (d: Node3D) => {
        // Hide nodes based on heatmap visibility settings
        if (heatmapSettings?.enabled) {
          if (heatmapSettings.nodeVisibility === 'none') {
            return [0, 0, 0, 0];
          } else if (heatmapSettings.nodeVisibility === 'samples' && !d.is_sample) {
            return [0, 0, 0, 0];
          }
        }
        return calculateNodeColor(d, selectedNode || null, temporalRange || null, temporalFilterMode, colors);
      },
      getLineColor: (d: Node3D) => {
        // Hide nodes based on heatmap visibility settings
        if (heatmapSettings?.enabled) {
          if (heatmapSettings.nodeVisibility === 'none') {
            return [0, 0, 0, 0];
          } else if (heatmapSettings.nodeVisibility === 'samples' && !d.is_sample) {
            return [0, 0, 0, 0];
          }
        }
        return calculateNodeOutlineColor(d, selectedNode || null, data, temporalRange || null, temporalFilterMode, colors);
      },
      getLineWidth: (d: Node3D) => {
        // Hide nodes based on heatmap visibility settings
        if (heatmapSettings?.enabled) {
          if (heatmapSettings.nodeVisibility === 'none') {
            return 0;
          } else if (heatmapSettings.nodeVisibility === 'samples' && !d.is_sample) {
            return 0;
          }
        }
        
        const outlineWidth = calculateNodeOutlineWidth(d, selectedNode || null, data);
        
        // Get node-type-specific size for outline scaling
        let baseRadius: number;
        if (d.is_sample) {
          baseRadius = nodeSizes.sample * 0.5;
        } else if (d.is_combined) {
          baseRadius = nodeSizes.other * 0.5;
        } else if (isRootNode(d, data?.nodes || [], data?.edges || [])) {
          baseRadius = nodeSizes.root * 0.5;
        } else {
          baseRadius = nodeSizes.other * 0.5;
        }
        
        // Make outline width a fraction of the node's radius
        const scaleFactor = baseRadius * 0.1;
        
        return outlineWidth * scaleFactor;
      },
      updateTriggers: {
        getRadius: [nodeSizes, heatmapSettings],
        getFillColor: [heatmapSettings],
        getLineColor: [heatmapSettings],
        getLineWidth: [nodeSizes, heatmapSettings]
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
      }
    }),

    new TextLayer<NodeLabel3D>({
      id: 'node-labels',
      data: (heatmapSettings?.enabled && heatmapSettings.nodeVisibility === 'none') ? [] :
            (heatmapSettings?.enabled && heatmapSettings.nodeVisibility === 'samples') ? 
              nodeLabels.filter(label => label.labelId?.startsWith('sample-label-')) : nodeLabels,
      pickable: true, // Enable picking for sample label dragging
      sizeUnits: 'meters', // Use same world-space units as nodes
      sizeScale: 1, // Direct scaling 
      getPosition: (d: NodeLabel3D) => d.position,
      getText: (d: NodeLabel3D) => d.text,
      getColor: (d: NodeLabel3D) => {
        // Highlight label if being dragged
        if (isDragging === d.labelId) {
          return [d.color[0], d.color[1], d.color[2], Math.min(255, d.color[3] * 1.3)] as [number, number, number, number];
        }
        return d.color;
      },
      getSize: (d: NodeLabel3D) => {
        // Slightly larger size when being dragged
        return isDragging === d.labelId ? d.size * 1.1 : d.size;
      },
      getTextAnchor: 'middle' as const,
      getAlignmentBaseline: 'center' as const,
      fontFamily: 'Arial, sans-serif',
      fontWeight: 'bold',
      billboard: false, // Text lays flat, not facing camera
      // Drag functionality for sample labels only
             onDragStart: (info: any, event: any) => {
         // Only allow dragging of sample labels and prevent event bubbling
         if (info.object && info.object.labelId && info.object.labelId.startsWith('sample-label-')) {
           event.stopPropagation();
           setIsDragging(info.object.labelId);
           
           // Store the initial position and screen coordinates for view-relative dragging
           const startWorldPos = info.object.position;
           const startScreenPos = event.srcEvent ? [event.srcEvent.clientX, event.srcEvent.clientY] : [0, 0];
           
           // Store initial state for this drag operation
           (info.object as any)._dragStartWorld = startWorldPos;
           (info.object as any)._dragStartScreen = startScreenPos;
           
           return true; // Indicate drag was handled
         }
         return false; // Allow event to bubble up to main controller
       },
             onDrag: (info: any, event: any) => {
         if (isDragging && info.object && event.srcEvent) {
           event.stopPropagation();
           const labelId = info.object.labelId;
           
           // Get stored drag start information
           const dragStartWorld = (info.object as any)._dragStartWorld;
           const dragStartScreen = (info.object as any)._dragStartScreen;
           
           if (dragStartWorld && dragStartScreen && info.viewport) {
             // Calculate screen-space movement
             const currentScreenPos = [event.srcEvent.clientX, event.srcEvent.clientY];
             const screenDeltaX = currentScreenPos[0] - dragStartScreen[0];
             const screenDeltaY = currentScreenPos[1] - dragStartScreen[1];
             
             // Project the start position to screen space
             const startScreenProjected = info.viewport.project(dragStartWorld);
             
             // Calculate new screen position
             const newScreenPos = [
               startScreenProjected[0] + screenDeltaX,
               startScreenProjected[1] + screenDeltaY,
               startScreenProjected[2] // Keep same depth for unprojection
             ];
             
             // Unproject back to world coordinates
             const newWorldPos = info.viewport.unproject(newScreenPos);
             
             // Constrain to original temporal layer (Z position)
             const newPosition: [number, number, number] = [
               newWorldPos[0],
               newWorldPos[1],
               dragStartWorld[2]  // Lock to original Z position (temporal layer)
             ];
             
             setCustomLabelPositions(prev => {
               const newMap = new Map(prev);
               newMap.set(labelId, newPosition);
               return newMap;
             });
           }
         }
       },
             onDragEnd: (info: any, event: any) => {
         if (isDragging) {
           event.stopPropagation();
           setIsDragging(null);
           
           // Clean up stored drag information
           if (info.object) {
             delete (info.object as any)._dragStartWorld;
             delete (info.object as any)._dragStartScreen;
           }
         }
       },
             onClick: (info: any, event: any) => {
         // Right-click to reset label position to optimal
         if (info.object && info.object.labelId && info.object.labelId.startsWith('sample-label-') && event.rightButton) {
           event.stopPropagation();
           const labelId = info.object.labelId;
           setCustomLabelPositions(prev => {
             const newMap = new Map(prev);
             newMap.delete(labelId); // Remove custom position to revert to optimal
             return newMap;
           });
         }
       },
      updateTriggers: {
        getData: [heatmapSettings],
        getPosition: [nodeIdSettings, nodeSizes, customLabelPositions],
        getText: [nodeIdSettings],
        getColor: [nodeIdSettings, colors, isDragging],
        getSize: [nodeIdSettings, nodeSizes, isDragging]
      }
    }),

    new TextLayer<EdgeLabel3D>({
      id: 'edge-labels',
      data: (heatmapSettings?.enabled && heatmapSettings.nodeVisibility === 'none') ||
            (heatmapSettings?.enabled && heatmapSettings.nodeVisibility === 'samples') ? [] : edgeLabels,
      pickable: false,
      sizeUnits: 'meters', // Use same world-space units as other elements
      sizeScale: 1, // Direct scaling 
      getPosition: (d: EdgeLabel3D) => d.position,
      getText: (d: EdgeLabel3D) => d.text,
      getColor: (d: EdgeLabel3D) => d.color,
      getSize: (d: EdgeLabel3D) => d.size,
      getTextAnchor: 'middle' as const,
      getAlignmentBaseline: 'center' as const,
      fontFamily: 'monospace, "Courier New", monospace', // Use monospace for genomic spans
      fontWeight: '500', // Slightly bold for better visibility
      billboard: true, // Face camera for better readability in 3D
      updateTriggers: {
        getData: [heatmapSettings],
        getPosition: [edgeLabelSettings],
        getText: [edgeLabelSettings, data?.metadata.sequence_length],
        getColor: [colors],
        getSize: [edgeLabelSettings]
      }
    }),

    new TextLayer<MutationMarker3D>({
      id: 'mutation-markers',
      data: (heatmapSettings?.enabled && heatmapSettings.nodeVisibility === 'none') ||
            (heatmapSettings?.enabled && heatmapSettings.nodeVisibility === 'samples') ? [] : mutationMarkers,
      pickable: false,
      sizeUnits: 'meters', // Use same world-space units as other elements
      sizeScale: 1, // Direct scaling 
      getPosition: (d: MutationMarker3D) => d.position,
      getText: (d: MutationMarker3D) => d.text,
      getColor: (d: MutationMarker3D) => d.color,
      getSize: (d: MutationMarker3D) => d.size * 0.9, // Adjusted for more compact appearance
      getTextAnchor: 'middle' as const,
      getAlignmentBaseline: 'center' as const,
      fontFamily: 'monospace, Arial, sans-serif', // Monospace for better symbol rendering
      fontWeight: 'bold', // Bold for better visibility
      billboard: true, // Face camera for better readability in 3D
      background: true, // Add background for better contrast
      backgroundColor: [255, 255, 255, 220], // More opaque white background for better contrast
      backgroundPadding: [2, 1.5, 2, 1.5], // Halved for more compact appearance
      updateTriggers: {
        getData: [heatmapSettings],
        getPosition: [edgeMutationSettings, mutationMarkers],
        getText: [edgeMutationSettings],
        getColor: [edgeMutationSettings],
        getSize: [edgeMutationSettings]
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
      onContextMenu={(event) => event.preventDefault()}
    >
      <DeckGL
        ref={deckRef}
        width={width}
        height={height}
        views={new OrbitView({ id: 'orbit' })}
        viewState={viewState}
        onViewStateChange={({ viewState: newViewState }: any) => {
          // Clamp zoom to prevent precision issues and ensure smooth zooming using dynamic limits
          const clampedViewState = {
            ...newViewState,
            zoom: Math.min(Math.max(newViewState.zoom, viewState.minZoom), viewState.maxZoom)
          };
          setViewState(clampedViewState);
          onViewStateChange?.(clampedViewState);
        }}
        controller={true}
        layers={layers}
        getCursor={({ isDragging: deckIsDragging, isHovering, pickedInfos }: any) => {
          // Show grabbing cursor when dragging sample labels
          if (isDragging !== null) return 'grabbing';
          
          // Show grab cursor when hovering over draggable sample labels
          if (isHovering && pickedInfos) {
            for (const info of pickedInfos) {
              if (info.layer?.id === 'node-labels' && 
                  info.object?.labelId?.startsWith('sample-label-')) {
                return 'grab';
              }
            }
          }
          
          // Default cursor for 3D navigation
          return 'crosshair';
        }}
        style={{ backgroundColor: colors.background }}
        getTooltip={({ object, layer }: any) => {
          if (!object) return null;
          
          // Only show tooltips for nodes, not labels
          if (layer?.id === 'nodes') {
            return createTooltipContent(object as Node3D, data, geographicMode, colors);
          }
          
                     // For sample labels, show a simple tooltip
           if (layer?.id === 'node-labels' && object.labelId?.startsWith('sample-label-')) {
             return {
               html: `
                 <div style="background: ${colors.tooltipBackground}; color: ${colors.tooltipText}; padding: 8px; border-radius: 4px; font-size: 12px;">
                   <strong>Sample Label: ${object.text}</strong><br/>
                   Drag to reposition • Right-click to reset
                 </div>
               `,
               style: {
                 backgroundColor: 'transparent',
                 color: colors.tooltipText
               }
             };
           }
          
          return null;
        }}
      />
    </div>
  );
});

SpatialArg3DVisualization.displayName = 'SpatialArg3DVisualization';

export default SpatialArg3DVisualization; 