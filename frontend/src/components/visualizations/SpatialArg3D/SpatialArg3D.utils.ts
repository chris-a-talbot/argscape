import { GraphNode, GraphEdge, GraphData, GeographicShape, NodeSizeSettings } from '../ForceDirectedGraph/ForceDirectedGraph.types';
import { isRootNode } from '../../../utils/graphTraversal';
import { formatCoordinates } from '../../../utils/colorUtils';
import { GeographicMode } from '../SpatialArgUtils/SpatialArg.types';
import { Node3D, Edge3D, NodeLabel3D } from './SpatialArg3D.types';
import { TemporalSpacingMode, NodeIdSettings, EdgeLabelSettings, LabelConnectingLine3D, LabelPositionResult } from './SpatialArg3DVisualization.types';
import { EdgeGroupWithSpans } from '../../../utils/genomicSpanUtils';
import { EdgeLabel3D } from '../SpatialArgUtils/SpatialArg.types';
import { NODE_SIZES, LINE_WIDTHS } from './SpatialArg3D.constants';
import { VISUALIZATION_CONSTANTS_REG } from '../SpatialArgUtils/SpatialArg.constants';
import { calculateZPosition, createNodeJitter, calculateTemporalOpacity, calculateEdgeOpacity, getContrastColor, calculateNodeColorByType } from '../SpatialArgUtils/SpatialArg.utils';
import { parseTextColor, calculateMidpoint } from '../SpatialArgUtils/LayerHelpers';

/**
 * Calculate node size based on node type (using 3D constants)
 */
export function calculateNodeSize(node: GraphNode, combinedNodes: GraphNode[], combinedEdges: GraphEdge[]): number {
  if (node.is_sample) return NODE_SIZES.SAMPLE;
  if (node.is_combined) return NODE_SIZES.COMBINED;
  if (isRootNode(node, combinedNodes, combinedEdges)) return NODE_SIZES.ROOT;
  return NODE_SIZES.DEFAULT;
}

/**
 * Calculate coordinate transform for 3D visualization (single dataset)
 */
export function calculateCoordinateTransform(
  combinedNodes: GraphNode[],
  geographicMode: GeographicMode,
  geographicShape: GeographicShape | null
) {
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
}

/**
 * Transform nodes to 3D coordinates
 */
export function transformNodesToThreeD(
  spatialNodes: GraphNode[],
  coordinateTransform: ReturnType<typeof calculateCoordinateTransform>,
  temporalSpacing: number,
  spatialSpacing: number,
  colors: any,
  combinedNodes: GraphNode[],
  combinedEdges: GraphEdge[],
  uniqueTimes: number[],
  temporalSpacingMode: TemporalSpacingMode
): Node3D[] {
  if (!coordinateTransform) return [];
  
  const { centerX, centerY, maxScale } = coordinateTransform;

  return spatialNodes.map(node => {
    const normalizedX = ((node.location!.x - centerX) / maxScale) * spatialSpacing;
    const normalizedY = ((node.location!.y - centerY) / maxScale) * spatialSpacing;
    
    const jitter = createNodeJitter(node.id, VISUALIZATION_CONSTANTS_REG.JITTER_SCALE, VISUALIZATION_CONSTANTS_REG.JITTER_RANGE, VISUALIZATION_CONSTANTS_REG.JITTER_OFFSET);
    const normalizedZ = calculateZPosition(node.time, uniqueTimes, temporalSpacing, temporalSpacingMode) + VISUALIZATION_CONSTANTS_REG.BASE_ELEVATION + jitter;

    const size = calculateNodeSize(node, combinedNodes, combinedEdges);
    const color = calculateNodeColorByType(node, combinedNodes, combinedEdges, colors, isRootNode);

    return {
      ...node,
      position: [normalizedX, normalizedY, normalizedZ] as [number, number, number],
      color,
      size
    };
  });
}

/**
 * Transform edges to 3D coordinates
 */
export function transformEdgesToThreeD(
  edges: GraphEdge[],
  nodeMap: Map<number, Node3D>,
  temporalRange: [number, number] | null,
  temporalFilterMode: string | null,
  colors: any,
  edgeOpacity: number = 85
): Edge3D[] {
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
}

/**
 * Calculate node color with selection and temporal filtering
 */
export function calculateNodeColor(
  node: Node3D,
  selectedNode: GraphNode | null,
  temporalRange: [number, number] | null,
  temporalFilterMode: string | null,
  colors: any
): [number, number, number, number] {
  const isSelected = selectedNode && node.id === selectedNode.id;
  if (isSelected) return colors.nodeSelected;
  
  const opacity = calculateTemporalOpacity(node.time, temporalRange, temporalFilterMode, node.color[3]);
  return [node.color[0], node.color[1], node.color[2], opacity];
}

/**
 * Calculate node outline color
 */
export function calculateNodeOutlineColor(
  node: Node3D,
  selectedNode: GraphNode | null,
  data: GraphData | null,
  temporalRange: [number, number] | null,
  temporalFilterMode: string | null,
  colors: any
): [number, number, number, number] {
  const isSelected = selectedNode && node.id === selectedNode.id;
  const isRoot = isRootNode(node, data?.nodes || [], data?.edges || []);
  
  let opacityMultiplier = 1;
  if ((temporalFilterMode === 'planes' || temporalFilterMode === 'hybrid') && temporalRange) {
    const [minTime, maxTime] = temporalRange;
    
    if (temporalFilterMode === 'hybrid') {
      if (node.time < maxTime) {
        opacityMultiplier = VISUALIZATION_CONSTANTS_REG.REDUCED_OPACITY_MULTIPLIER;
      }
    } else {
      const isInTemporalRange = node.time >= minTime && node.time <= maxTime;
      if (!isInTemporalRange) {
        opacityMultiplier = VISUALIZATION_CONSTANTS_REG.REDUCED_OPACITY_MULTIPLIER;
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
}

/**
 * Calculate node outline width
 */
export function calculateNodeOutlineWidth(
  node: Node3D,
  selectedNode: GraphNode | null,
  data: GraphData | null
): number {
  const isSelected = selectedNode && node.id === selectedNode.id;
  const isRoot = isRootNode(node, data?.nodes || [], data?.edges || []);
  const baseSize = isSelected ? node.size * VISUALIZATION_CONSTANTS_REG.SELECTED_NODE_SCALE : node.size;
  
  const sizeFactor = baseSize / NODE_SIZES.DEFAULT;
  
  if (isSelected) return Math.max(1, LINE_WIDTHS.NODE_OUTLINE_SELECTED * sizeFactor);
  if (isRoot) return Math.max(0.8, LINE_WIDTHS.NODE_OUTLINE_ROOT * sizeFactor);
  if (node.is_sample) return Math.max(0.5, LINE_WIDTHS.NODE_OUTLINE_SAMPLE * sizeFactor);
  return 0;
}

/**
 * Create tooltip content for a node
 */
export function createTooltipContent(
  node: Node3D,
  data: GraphData | null,
  geographicMode: GeographicMode,
  colors: any
) {
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
}

/**
 * Helper function to calculate label bounding box
 */
export function getLabelBoundingBox(
  labelPosition: [number, number, number],
  textSize: number
): {
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
  minZ: number;
  maxZ: number;
} {
  const textWidth = textSize * 2.0;
  const textHeight = textSize * 1.2;
  const textDepth = textSize * 0.1;
  
  return {
    minX: labelPosition[0] - textWidth / 2,
    maxX: labelPosition[0] + textWidth / 2,
    minY: labelPosition[1] - textHeight / 2,
    maxY: labelPosition[1] + textHeight / 2,
    minZ: labelPosition[2] - textDepth / 2,
    maxZ: labelPosition[2] + textDepth / 2
  };
}

/**
 * Helper function to find the edge point of a label bounding box closest to a target
 */
export function findLabelEdgePoint(
  labelPosition: [number, number, number],
  textSize: number,
  targetPosition: [number, number, number]
): [number, number, number] {
  const bbox = getLabelBoundingBox(labelPosition, textSize);
  
  const clampedX = Math.max(bbox.minX, Math.min(bbox.maxX, targetPosition[0]));
  const clampedY = Math.max(bbox.minY, Math.min(bbox.maxY, targetPosition[1]));
  const clampedZ = Math.max(bbox.minZ, Math.min(bbox.maxZ, targetPosition[2]));
  
  return [clampedX, clampedY, clampedZ];
}

/**
 * Helper function to find visible connection point on node
 */
export function findVisibleNodeConnectionPoint(
  targetNode: Node3D,
  allSampleNodes: Node3D[],
  labelPosition: [number, number, number],
  baseNodeSize: number
): [number, number, number] {
  const nodePos = targetNode.position;
  const nodeRadius = baseNodeSize * 0.5;
  
  const connectionAttempts = [
    [1, 0], [-1, 0], [0, -1], [0, 1],
    [0.7, -0.7], [-0.7, -0.7], [0.7, 0.7], [-0.7, 0.7]
  ];
  
  for (const [dx, dy] of connectionAttempts) {
    const connectionPoint: [number, number, number] = [
      nodePos[0] + dx * nodeRadius * 0.9,
      nodePos[1] + dy * nodeRadius * 0.9,
      nodePos[2]
    ];
    
    let isVisible = true;
    for (const otherSample of allSampleNodes) {
      if (otherSample.id === targetNode.id) continue;
      
      const otherPos = otherSample.position;
      const otherRadius = baseNodeSize * 0.5;
      
      const xyDistance = Math.sqrt(
        Math.pow(connectionPoint[0] - otherPos[0], 2) +
        Math.pow(connectionPoint[1] - otherPos[1], 2)
      );
      
      if (otherPos[2] >= connectionPoint[2] && xyDistance < otherRadius * 1.2) {
        isVisible = false;
        break;
      }
    }
    
    if (isVisible) {
      return connectionPoint;
    }
  }
  
  return nodePos;
}

/**
 * Helper function to find optimal position for a sample label
 */
export function findOptimalLabelPosition(
  nodeGroup: Node3D[],
  allNodes: Node3D[],
  existingLabels: NodeLabel3D[],
  baseNodeSize: number
): LabelPositionResult {
  const representativeNode = nodeGroup[0];
  const nodeX = representativeNode.position[0];
  const nodeY = representativeNode.position[1];
  const nodeZ = representativeNode.position[2];
  
  const nodeRadius = baseNodeSize;
  const minDistance = nodeRadius * 2.0;
  const maxDistance = nodeRadius * 12.0;
  const stepSize = nodeRadius * 0.3;
  const labelZOffset = baseNodeSize * 0.3;
  
  const directions = [
    [1, 0], [-1, 0], [0, -1], [0, 1],
    [1, -1], [-1, -1], [1, 1], [-1, 1],
    [0.7, -0.7], [-0.7, -0.7], [0.7, 0.7], [-0.7, 0.7]
  ];
  
  for (let distance = minDistance; distance <= maxDistance; distance += stepSize) {
    for (const [dx, dy] of directions) {
      const candidatePos: [number, number, number] = [
        nodeX + dx * distance,
        nodeY + dy * distance,
        nodeZ + labelZOffset
      ];
      
      let hasNodeCollision = false;
      const labelRadius = baseNodeSize * 0.9;
      
      for (const node of allNodes) {
        const nodeSize = node.is_sample ? baseNodeSize : baseNodeSize * 0.8;
        
        const xyDistance = Math.sqrt(
          Math.pow(candidatePos[0] - node.position[0], 2) +
          Math.pow(candidatePos[1] - node.position[1], 2)
        );
        const zDistance = Math.abs(candidatePos[2] - node.position[2]);
        
        const xyRequiredClearance = nodeSize + labelRadius + 2.0;
        const zRequiredClearance = Math.max(nodeSize, labelRadius) + 1.0;
        
        const hasXYCollision = xyDistance < xyRequiredClearance;
        const hasZCollision = zDistance < zRequiredClearance && xyDistance < nodeSize * 2;
        
        if (hasXYCollision || hasZCollision) {
          hasNodeCollision = true;
          break;
        }
      }
      
      if (hasNodeCollision) continue;
      
      let tooCloseToOtherLabel = false;
      const minLabelDistance = baseNodeSize * 2.5;
      
      for (const existingLabel of existingLabels) {
        const xyLabelDistance = Math.sqrt(
          Math.pow(candidatePos[0] - existingLabel.position[0], 2) +
          Math.pow(candidatePos[1] - existingLabel.position[1], 2)
        );
        const zLabelDistance = Math.abs(candidatePos[2] - existingLabel.position[2]);
        
        const zFactor = zLabelDistance < baseNodeSize ? 1.0 : 0.6;
        const effectiveMinDistance = minLabelDistance * zFactor;
        
        if (xyLabelDistance < effectiveMinDistance) {
          tooCloseToOtherLabel = true;
          break;
        }
      }
      
      if (!tooCloseToOtherLabel) {
        return {
          position: candidatePos,
          needsLine: distance > nodeRadius * 4.0,
          connectionDistance: distance
        };
      }
    }
  }
  
  const fallbackDistance = nodeRadius * 2.5;
  return {
    position: [nodeX + fallbackDistance, nodeY, nodeZ + labelZOffset],
    needsLine: true,
    connectionDistance: fallbackDistance
  };
}

/**
 * Create node labels with connecting lines
 */
export function createNodeLabels(
  nodes3D: Node3D[],
  nodeIdSettings: NodeIdSettings | undefined,
  combinedNodes: GraphNode[],
  combinedEdges: GraphEdge[],
  nodeSizes: NodeSizeSettings,
  colors: any,
  customLabelPositions?: Map<string, [number, number, number]>,
  temporalRange?: [number, number] | null,
  temporalFilterMode?: string | null
): { labels: NodeLabel3D[], connectingLines: LabelConnectingLine3D[] } {
  if (!nodeIdSettings) return { labels: [], connectingLines: [] };
  
  const labels: NodeLabel3D[] = [];
  const connectingLines: LabelConnectingLine3D[] = [];
  
  const sampleNodes = nodes3D.filter(node => 
    node.is_sample && nodeIdSettings.showSampleIds
  );
  
  const rootNodes = nodes3D.filter(node => 
    !node.is_sample && isRootNode(node, combinedNodes, combinedEdges) && nodeIdSettings.showRootIds
  );
  
  const internalNodes = nodes3D.filter(node => 
    !node.is_sample && !isRootNode(node, combinedNodes, combinedEdges) && nodeIdSettings.showInternalIds
  );
  
  sampleNodes.forEach(node => {
    const baseNodeSize = nodeSizes.sample * 0.5;
    const textSize = baseNodeSize * 1.0;
    
    let labelOpacity = 255;
    
    if (temporalFilterMode === 'hybrid' && temporalRange) {
      const maxTime = temporalRange[1];
      if (node.time < maxTime) {
        labelOpacity = 255 * VISUALIZATION_CONSTANTS_REG.REDUCED_OPACITY_MULTIPLIER;
      }
    }
    
    const textColor = parseTextColor(colors.text, labelOpacity);
    
    const labelText = node.label || node.id.toString();
    const labelId = `sample-label-${node.id}`;
    
    let labelPosition: [number, number, number];
    let needsLine: boolean;
    let connectionDistance: number;
    
    if (customLabelPositions?.has(labelId)) {
      labelPosition = customLabelPositions.get(labelId)!;
      connectionDistance = Math.sqrt(
        Math.pow(labelPosition[0] - node.position[0], 2) +
        Math.pow(labelPosition[1] - node.position[1], 2) +
        Math.pow(labelPosition[2] - node.position[2], 2)
      );
      needsLine = connectionDistance > baseNodeSize * 3.0;
    } else {
      const { position: optimalPosition, needsLine: optimalNeedsLine, connectionDistance: optimalDistance } = findOptimalLabelPosition(
        [node],
        nodes3D,
        labels,
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
      nodeIds: node.combined_nodes || [node.id],
      needsLine,
      nodePosition: node.position,
      labelId
    });
      
    if (needsLine || connectionDistance > baseNodeSize * 3.0) {
      const visibleConnectionPoint = findVisibleNodeConnectionPoint(
        node,
        nodes3D.filter(n => n.is_sample),
        labelPosition,
        baseNodeSize
      );
      
      const labelEdgePoint = findLabelEdgePoint(labelPosition, textSize, visibleConnectionPoint);
      
      let lineOpacity = Math.min(255, Math.max(140, 255 - connectionDistance * 6));
      
      if (temporalFilterMode === 'hybrid' && temporalRange) {
        const maxTime = temporalRange[1];
        if (node.time < maxTime) {
          lineOpacity = lineOpacity * VISUALIZATION_CONSTANTS_REG.REDUCED_OPACITY_MULTIPLIER;
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
  
  rootNodes.forEach(node => {
    const baseNodeSize = nodeSizes.root * 0.5;
    const textSize = baseNodeSize * 1.2;
    
    const nodeColor = calculateNodeColor(node, null, null, null, colors);
    let textColor = getContrastColor(nodeColor, colors);
    
    if (temporalFilterMode === 'hybrid' && temporalRange) {
      const maxTime = temporalRange[1];
      if (node.time < maxTime) {
        textColor = [
          textColor[0],
          textColor[1],
          textColor[2],
          textColor[3] * VISUALIZATION_CONSTANTS_REG.REDUCED_OPACITY_MULTIPLIER
        ] as [number, number, number, number];
      }
    }
    
    const labelText = node.label || node.id.toString();
    
    labels.push({
      position: node.position,
      text: labelText,
      color: textColor,
      size: textSize,
      nodeIds: node.combined_nodes || [node.id],
      needsLine: false,
      nodePosition: node.position,
      labelId: `root-label-${node.id}`
    });
  });
  
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
      nodeIds: node.combined_nodes || [node.id],
      needsLine: false,
      nodePosition: node.position,
      labelId: `internal-label-${node.id}`
    });
  });
  
  return { labels, connectingLines };
}

/**
 * Create edge labels
 */
export function createEdgeLabels(
  edgeGroups: EdgeGroupWithSpans[],
  edgeLabelSettings: EdgeLabelSettings | undefined,
  colors: any,
  nodes3D: Node3D[]
): EdgeLabel3D[] {
  if (!edgeLabelSettings?.showEdgeLabels || !edgeGroups.length) {
    return [];
  }

  const labels: EdgeLabel3D[] = [];
  const nodeMap = new Map<number, Node3D>();
  nodes3D.forEach(node => nodeMap.set(node.id, node));

  edgeGroups.forEach(edgeGroup => {
    const sourceNode = nodeMap.get(edgeGroup.sourceId);
    const targetNode = nodeMap.get(edgeGroup.targetId);
    
    if (sourceNode && targetNode) {
      const position = calculateMidpoint(sourceNode.position, targetNode.position);
      const offsetZ = position[2] + Math.max(2, edgeLabelSettings.labelFontSize * 0.2);
      const textColor = parseTextColor(colors.text, 255);

      labels.push({
        position: [position[0], position[1], offsetZ],
        text: edgeGroup.formattedSpans,
        color: textColor,
        size: edgeLabelSettings.labelFontSize * 0.8,
        sourceId: edgeGroup.sourceId,
        targetId: edgeGroup.targetId
      });
    }
  });

  return labels;
}

