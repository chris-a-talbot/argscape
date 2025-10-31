import { GraphNode, GraphEdge, GraphData, GeographicShape } from '../ForceDirectedGraph/ForceDirectedGraph.types';
import { isRootNode } from '../../../utils/graphTraversal';
import { GeographicMode } from '../SpatialArgUtils/SpatialArg.types';
import { DiffViewMode, NodeDiff3D, EdgeDiff3D, DiffEdge, EdgeTransformResult } from './SpatialArgDiff.types';
import { NodeIdSettings, EdgeLabelSettings } from '../SpatialArg3D/SpatialArg3DVisualization.types';
import { EdgeLabel3D } from '../SpatialArgUtils/SpatialArg.types';
import { NodeLabel3D } from './SpatialArgDiff.types';
import { groupEdgesByPairs, expandEdgeSpansForCombinedNodes } from '../../../utils/genomicSpanUtils';
import { VISUALIZATION_CONSTANTS_DIFF } from '../SpatialArgUtils/SpatialArg.constants';
import { calculateZPosition, createNodeJitter, calculateTemporalOpacity, calculateEdgeOpacity, getContrastColor, calculateNodeColorByType } from '../SpatialArgUtils/SpatialArg.utils';
import { parseTextColor, calculateMidpoint } from '../SpatialArgUtils/LayerHelpers';
import { isRootNode } from '../../../utils/graphTraversal';
import { LINE_WIDTHS } from './SpatialArgDiff.constants';

/**
 * Calculate node size based on node type and time (diff-specific)
 */
export function calculateNodeSize(
  node: GraphNode, 
  combinedNodes: GraphNode[], 
  combinedEdges: GraphEdge[],
  nodeSizes: { sample: number; root: number; other: number },
  minTime: number
): number {
  if (node.time === minTime) return nodeSizes.sample;
  if (isRootNode(node, combinedNodes, combinedEdges)) return nodeSizes.root;
  return nodeSizes.other;
}

/**
 * Calculate coordinate transform for diff visualization (handles two datasets)
 */
export function calculateCoordinateTransform(
  nodes: GraphNode[],
  secondNodes: GraphNode[],
  geographicMode: GeographicMode,
  geographicShape: GeographicShape | null
) {
  const spatialNodes = nodes.filter(node => 
    node.location?.x !== undefined && node.location?.y !== undefined
  );

  if (spatialNodes.length === 0) return null;

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
}

/**
 * Transform nodes to 3D coordinates (diff-specific, handles two datasets)
 */
export function transformNodesToThreeD(
  nodes: GraphNode[],
  secondNodes: GraphNode[],
  coordinateTransform: ReturnType<typeof calculateCoordinateTransform>,
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
): { nodes: NodeDiff3D[], diffEdges: DiffEdge[] } {
  if (!coordinateTransform) return { nodes: [], diffEdges: [] };
  
  const { centerX, centerY, maxScale } = coordinateTransform;
  const secondNodesMap = new Map(secondNodes.map(node => [node.id, node]));

  const uniqueTimes = Array.from(new Set([...nodes.map(n => n.time), ...secondNodes.map(n => n.time)])).sort((a, b) => a - b);
  const minTime = uniqueTimes[0];

  const diffEdges: DiffEdge[] = [];
  const transformedNodes = nodes.map(node => {
    const secondNode = secondNodesMap.get(node.id);
    if (!secondNode || !node.location || !secondNode.location) {
      throw new Error(`Missing location data for node ${node.id}`);
    }

    const normalizedX = ((node.location.x - centerX) / maxScale) * spatialSpacing;
    const normalizedY = ((node.location.y - centerY) / maxScale) * spatialSpacing;
    const normalizedSecondX = ((secondNode.location.x - centerX) / maxScale) * spatialSpacing;
    const normalizedSecondY = ((secondNode.location.y - centerY) / maxScale) * spatialSpacing;

    const isSample = node.is_sample;
    
    let displayX: number, displayY: number;
    if (isSample) {
      displayX = normalizedX;
      displayY = normalizedY;
    } else if (viewMode === 'first') {
      displayX = normalizedX;
      displayY = normalizedY;
    } else if (viewMode === 'second') {
      displayX = normalizedSecondX;
      displayY = normalizedSecondY;
    } else {
      displayX = (normalizedX + normalizedSecondX) / 2;
      displayY = (normalizedY + normalizedSecondY) / 2;
    }
    
    const jitter = createNodeJitter(node.id, VISUALIZATION_CONSTANTS_DIFF.JITTER_SCALE, VISUALIZATION_CONSTANTS_DIFF.JITTER_RANGE, VISUALIZATION_CONSTANTS_DIFF.JITTER_OFFSET);
    const finalZ = calculateZPosition(node.time, uniqueTimes, temporalSpacing, temporalSpacingMode) + VISUALIZATION_CONSTANTS_DIFF.BASE_ELEVATION + jitter;

    const dx = normalizedSecondX - normalizedX;
    const dy = normalizedSecondY - normalizedY;
    const distance = isSample ? 0 : Math.sqrt(dx * dx + dy * dy);

    const size = calculateNodeSize(node, combinedNodes, combinedEdges, nodeSizes, minTime);

    const isSampleTime = node.time === minTime;
    const nodeForColor = isSampleTime ? { ...node, is_sample: true } : node;
    const color = calculateNodeColorByType(nodeForColor, combinedNodes, combinedEdges, colors, isRootNode);

    if (showErrorBars && !isSampleTime) {
      if (viewMode === 'diff') {
        diffEdges.push({
          source: [normalizedX, normalizedY, finalZ],
          target: [displayX, displayY, finalZ],
          color: [255, 0, 0, 180] as [number, number, number, number],
          width: diffEdgeWidth
        });
        diffEdges.push({
          source: [displayX, displayY, finalZ],
          target: [normalizedSecondX, normalizedSecondY, finalZ],
          color: [255, 0, 0, 180] as [number, number, number, number],
          width: diffEdgeWidth
        });
      } else if (viewMode === 'first') {
        diffEdges.push({
          source: [displayX, displayY, finalZ],
          target: [normalizedSecondX, normalizedSecondY, finalZ],
          color: [255, 0, 0, 180] as [number, number, number, number],
          width: diffEdgeWidth
        });
      } else if (viewMode === 'second') {
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
}

/**
 * Transform edges to 3D coordinates
 */
export function transformEdgesToThreeD(
  edges: GraphEdge[],
  nodeMap: Map<number, NodeDiff3D>,
  temporalRange: [number, number] | null,
  temporalFilterMode: string | null,
  colors: any
): EdgeTransformResult[] {
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
}

/**
 * Calculate node color with selection and temporal filtering
 */
export function calculateNodeColor(
  node: NodeDiff3D,
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
 * Calculate node outline color (diff-specific)
 */
export function calculateNodeOutlineColor(
  node: NodeDiff3D,
  selectedNode: GraphNode | null,
  data: GraphData | null,
  temporalRange: [number, number] | null,
  temporalFilterMode: string | null,
  colors: any,
  minTime: number
): [number, number, number, number] {
  const isSelected = selectedNode && node.id === selectedNode.id;
  const isRoot = isRootNode(node, data?.nodes || [], data?.edges || []);
  const isSampleTime = node.time === minTime;
  
  let opacityMultiplier = 1;
  if (temporalFilterMode === 'planes' && temporalRange) {
    const [minTimeFilter, maxTimeFilter] = temporalRange;
    const isInTemporalRange = node.time >= minTimeFilter && node.time <= maxTimeFilter;
    if (!isInTemporalRange) {
      opacityMultiplier = VISUALIZATION_CONSTANTS_DIFF.REDUCED_OPACITY_MULTIPLIER;
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
}

/**
 * Create tooltip content for a node (diff-specific)
 */
export function createTooltipContent(
  node: NodeDiff3D,
  data: GraphData,
  transform: { maxScale: number; centerX: number; centerY: number } | null,
  spatialSpacing: number,
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
}

/**
 * Create node labels (diff-specific)
 */
export function createNodeLabels(
  nodes3D: NodeDiff3D[],
  nodeIdSettings: NodeIdSettings | undefined,
  combinedNodes: GraphNode[],
  combinedEdges: GraphEdge[],
  nodeSizes: { sample: number; root: number; other: number },
  colors: any,
  minTime: number
): NodeLabel3D[] {
  if (!nodeIdSettings) return [];
  
  const labels: NodeLabel3D[] = [];
  
  const sampleNodes = nodes3D.filter(node => 
    node.time === minTime && nodeIdSettings.showSampleIds
  );
  
  const rootNodes = nodes3D.filter(node => 
    node.time !== minTime && isRootNode(node, combinedNodes, combinedEdges) && nodeIdSettings.showRootIds
  );
  
  const internalNodes = nodes3D.filter(node => 
    node.time !== minTime && !isRootNode(node, combinedNodes, combinedEdges) && nodeIdSettings.showInternalIds
  );
  
  sampleNodes.forEach(node => {
    const baseNodeSize = nodeSizes.sample * 0.5;
    const textSize = baseNodeSize * 1.0;
    const textColor = parseTextColor(colors.text, 255);
    const labelText = node.label || node.id.toString();
    
    labels.push({
      position: node.position,
      text: labelText,
      color: textColor,
      size: textSize,
      labelId: `sample-label-${node.id}`
    });
  });
  
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
}

/**
 * Create edge labels (diff-specific, does edge grouping internally)
 */
export function createEdgeLabels(
  nodes3D: NodeDiff3D[],
  firstEdges: GraphEdge[],
  firstNodes: GraphNode[],
  edgeLabelSettings: EdgeLabelSettings | undefined,
  colors: any,
  sequenceLength: number | undefined
): EdgeLabel3D[] {
  if (!edgeLabelSettings?.showEdgeLabels || !firstEdges.length || !sequenceLength) {
    return [];
  }

  const labels: EdgeLabel3D[] = [];
  const nodeMap = new Map<number, NodeDiff3D>();
  nodes3D.forEach(node => nodeMap.set(node.id, node));

  const edgeGroups = groupEdgesByPairs(firstEdges, firstNodes, sequenceLength);
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

