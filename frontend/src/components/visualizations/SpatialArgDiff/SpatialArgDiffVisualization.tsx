import React, { useMemo, useState, useRef, useEffect } from 'react';
import DeckGL from '@deck.gl/react';
import { ScatterplotLayer, LineLayer, TextLayer } from '@deck.gl/layers';
import { OrbitView } from '@deck.gl/core';
import { GraphData, GraphNode, GeographicShape } from '../ForceDirectedGraph/ForceDirectedGraph.types';
import { useColorTheme } from '../../../context/ColorThemeContext';
import { convertShapeToLines, createShapeLines, GeographicLine3D } from '../SpatialArgUtils/GeographicUtils';
import { isRootNode } from '../../../utils/graphTraversal';
import { TemporalSpacingMode, NodeIdSettings, EdgeLabelSettings, 
  EdgeMutationSettings, AncestryHeatmapSettings } from '../SpatialArg3D/SpatialArg3DVisualization.types';
import {
  calculateAncestryDensity,
  generateHeatmapGrid,
  heatmapGridToPolygons
} from '../SpatialArgUtils/AncestryHeatmap';
import { determineGeographicShape, shouldHideNodeByHeatmap, filterDataByHeatmap, 
  filterNodeLabelsByHeatmap, calculateNodeBaseRadius, calculateZPosition } from '../SpatialArgUtils/SpatialArg.utils';
import { createMutationMarkers as createMutationMarkersUtil, createHeatmapPolygonLayer } from '../SpatialArgUtils/LayerHelpers';
import {
  calculateCoordinateTransform,
  transformNodesToThreeD,
  transformEdgesToThreeD,
  calculateNodeColor,
  calculateNodeOutlineColor,
  createTooltipContent,
  createNodeLabels,
  createEdgeLabels
} from './SpatialArgDiff.utils';
import { VISUALIZATION_CONSTANTS_DIFF } from '../SpatialArgUtils/SpatialArg.constants';
import { EdgeLabel3D, MutationMarker3D } from '../SpatialArgUtils/SpatialArg.types';
import { DiffViewMode, NodeDiff3D, EdgeDiff3D, TransformResult, NodeLabel3D } from './SpatialArgDiff.types';
import { LINE_WIDTHS } from './SpatialArgDiff.constants';

interface SpatialArgDiffProps {
  firstData: GraphData;
  secondData: GraphData;
  originalFirstData?: GraphData; // Original unfiltered data for coordinate transform in unit grid mode
  originalSecondData?: GraphData; // Original unfiltered data for coordinate transform in unit grid mode
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
    markerSize: 18
  },
  diffEdgeWidth: 3,
  temporalSpacingMode: 'equal' as TemporalSpacingMode
};

export const SpatialArgDiffVisualization: React.FC<SpatialArgDiffProps> = ({
  firstData,
  secondData,
  originalFirstData,
  originalSecondData,
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

  // DeckGL ref for cleanup
  const deckRef = useRef<any>(null);

  // Memoize OrbitView to prevent recreation on every render
  const orbitView = useMemo(() => new OrbitView(), []);

  // Track mouse button for right-click detection (pointerup loses button info)
  const lastPointerButtonRef = useRef<number>(0);
  
  // Add global listener to track pointer button - use capture phase to catch it before deck.gl
  useEffect(() => {
    const handlePointerDown = (e: PointerEvent) => {
      lastPointerButtonRef.current = e.button;
    };
    
    // Use capture phase to ensure we catch the event before deck.gl
    window.addEventListener('pointerdown', handlePointerDown, { capture: true });
    return () => window.removeEventListener('pointerdown', handlePointerDown, { capture: true });
  }, []);

  // Cleanup DeckGL instance on unmount to release WebGL resources
  useEffect(() => {
    return () => {
      if (deckRef.current) {
        try {
          // Finalize the DeckGL instance to properly release WebGL contexts and resources
          deckRef.current.finalize?.();
        } catch (error) {
          console.warn('Error finalizing DeckGL instance:', error);
        }
      }
    };
  }, []);

  // Calculate minimum time for sample detection
  const minTime = useMemo(() => {
    if (!firstData || !secondData) return 0;
    // Optimize: use reduce instead of spread operator for better performance
    let min = Infinity;
    for (const node of firstData.nodes) {
      if (node.time < min) min = node.time;
    }
    for (const node of secondData.nodes) {
      if (node.time < min) min = node.time;
    }
    return min === Infinity ? 0 : min;
  }, [firstData, secondData]);

  // Transform nodes to 3D
  // In unit grid mode, use original unfiltered data for coordinate transform to maintain consistent bounds
  const { nodes3D, diffEdges } = useMemo<TransformResult>(() => {
    // For unit grid mode, use original unfiltered data for coordinate transform
    // Otherwise use the filtered data
    const nodesForCoordinateTransform = geographicMode === 'unit_grid' && originalFirstData && originalSecondData
      ? originalFirstData.nodes
      : firstData.nodes;
    const secondNodesForCoordinateTransform = geographicMode === 'unit_grid' && originalFirstData && originalSecondData
      ? originalSecondData.nodes
      : secondData.nodes;
    
    const coordinateTransform = calculateCoordinateTransform(
      nodesForCoordinateTransform, 
      secondNodesForCoordinateTransform, 
      geographicMode, 
      geographicShape
    );
    if (!coordinateTransform) return { nodes3D: [], diffEdges: [] };

    // Filter to only spatial nodes from the filtered data
    const spatialFirstNodes = firstData.nodes.filter(node => 
      node.location?.x !== undefined && node.location?.y !== undefined
    );
    const spatialSecondNodes = secondData.nodes.filter(node => 
      node.location?.x !== undefined && node.location?.y !== undefined
    );

    // Use filtered nodes for transformation, but coordinate transform from original data for consistent bounds
    const result = transformNodesToThreeD(
      spatialFirstNodes, // Use filtered spatial nodes only
      spatialSecondNodes, // Use filtered spatial nodes only
      coordinateTransform, // But use coordinate transform from original data
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
  }, [firstData, secondData, originalFirstData, originalSecondData, geographicMode, geographicShape, temporalSpacing, temporalSpacingMode, spatialSpacing, colors, diffEdgeWidth, nodeSizes, viewMode, showErrorBars]);

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

  // Memoize unique times from firstData nodes (more stable than nodes3D which changes with filtering)
  const allUniqueTimes = useMemo(() => {
    if (!firstData.nodes.length) return [];
    return Array.from(new Set(firstData.nodes.map(n => n.time))).sort((a, b) => a - b);
  }, [firstData.nodes]);

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
    const nodeMap = new Map<number, NodeDiff3D>();
    nodes3D.forEach(node => nodeMap.set(node.id, node));
    return createMutationMarkersUtil(firstData.edges, nodeMap, edgeMutationSettings);
  }, [nodes3D, firstData.edges, edgeMutationSettings]);

  // Calculate coordinate transform for heatmap
  // In unit grid mode, use original unfiltered data for coordinate transform to maintain consistent bounds
  const coordinateTransform = useMemo(() => {
    // For unit grid mode, use original unfiltered data for coordinate transform
    // Otherwise use the filtered data
    const nodesForCoordinateTransform = geographicMode === 'unit_grid' && originalFirstData && originalSecondData
      ? originalFirstData.nodes
      : firstData.nodes;
    const secondNodesForCoordinateTransform = geographicMode === 'unit_grid' && originalFirstData && originalSecondData
      ? originalSecondData.nodes
      : secondData.nodes;
    
    const spatialNodes = nodesForCoordinateTransform.filter(node => 
      node.location?.x !== undefined && node.location?.y !== undefined
    );

    if (spatialNodes.length === 0) return null;

    const allXCoords = [...nodesForCoordinateTransform.map(node => node.location?.x || 0), ...secondNodesForCoordinateTransform.map(node => node.location?.x || 0)];
    const allYCoords = [...nodesForCoordinateTransform.map(node => node.location?.y || 0), ...secondNodesForCoordinateTransform.map(node => node.location?.y || 0)];
    
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
  }, [firstData.nodes, secondData.nodes, originalFirstData, originalSecondData, geographicMode, geographicShape]);

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

    // Convert grid to polygons for rendering
    const polygons = heatmapGridToPolygons(
      grid,
      coordinateTransform,
      spatialSpacing,
      heatmapZ,
      heatmapSettings.opacity
    );

    return polygons;
  }, [
    heatmapSettings,
    temporalRange?.[0],
    temporalRange?.[1],
    temporalFilterMode,
    nodes3D,
    coordinateTransform,
    firstData.nodes,
    firstData.edges,
    temporalSpacing,
    temporalSpacingMode,
    spatialSpacing,
    showTemporalPlanes
  ]);

  // Determine the geographic shape to use
  const shape = useMemo(() => {
    return determineGeographicShape(geographicShape, geographicMode, spatialSpacing);
  }, [geographicShape, geographicMode, spatialSpacing]);

  // Convert geographic shape to lines
  const shapeLines = useMemo(() => {
    if (!shape || !nodes3D.length || !allUniqueTimes.length) return [];

    const baseLines = convertShapeToLines(shape, spatialSpacing);
    const isTemporalPlanesActive = showTemporalPlanes && (temporalFilterMode === 'hide' || temporalFilterMode === 'planes' || temporalFilterMode === 'hybrid');
    
    const baseGeographicOpacity = geographicShapeOpacity ?? 70;
    
    // Create ground shape (dimmed when temporal planes are active)
    const groundOpacity = baseGeographicOpacity > 0 ? 
      (isTemporalPlanesActive ? Math.max(baseGeographicOpacity * 0.15, 8) : baseGeographicOpacity) : 0;
    const groundColor = [colors.geographicGrid[0], colors.geographicGrid[1], colors.geographicGrid[2], groundOpacity] as [number, number, number, number];
    const groundShapeLines = createShapeLines(baseLines, 0, groundColor, LINE_WIDTHS.GEOGRAPHIC_NORMAL);

    // Create elevated shape if temporal filtering is active
    let elevatedShapeLines: GeographicLine3D[] = [];
    if (showTemporalPlanes && temporalRange && (temporalFilterMode === 'hide' || temporalFilterMode === 'planes' || temporalFilterMode === 'hybrid') && allUniqueTimes.length > 0) {
      
      // Determine target time based on filter mode:
      // - hybrid mode: use max time (top of range, highest displayed)
      // - hide mode: use min time (bottom of range, minimum displayed)
      // - planes mode: use center time (middle of range)
      let targetTime: number;
      if (temporalFilterMode === 'hybrid') {
        targetTime = temporalRange[1]; // Max (highest)
      } else if (temporalFilterMode === 'hide') {
        targetTime = temporalRange[0]; // Min (lowest)
      } else {
        // planes mode
        targetTime = (temporalRange[0] + temporalRange[1]) / 2; // Center
      }
      
      // Clamp targetTime to be within the bounds of allUniqueTimes
      const minTime = allUniqueTimes[0];
      const maxTime = allUniqueTimes[allUniqueTimes.length - 1];
      targetTime = Math.max(minTime, Math.min(maxTime, targetTime));
      
      let z = calculateZPosition(targetTime, allUniqueTimes, temporalSpacing, temporalSpacingMode);
      
      // In hybrid mode, place shapefile slightly below the nodes so nodes appear on top
      if (temporalFilterMode === 'hybrid') {
        z -= 0.6;
      }
      
      // Ensure z doesn't go too far below ground level (allow slight negative for hybrid mode offset)
      z = Math.max(-0.5, z);
      
      const elevatedOpacity = baseGeographicOpacity * 2.5;
      const elevatedColor = [colors.geographicGrid[0], colors.geographicGrid[1], colors.geographicGrid[2], elevatedOpacity] as [number, number, number, number];
      elevatedShapeLines = createShapeLines(baseLines, z, elevatedColor, LINE_WIDTHS.GEOGRAPHIC_NORMAL);
    }

    // Combine ground and elevated shapes
    const lines = [...groundShapeLines, ...elevatedShapeLines];
    
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
    if (temporalGridOpacity > 0 && allUniqueTimes.length > 0) {
      const baseOpacity = temporalGridOpacity ?? 30;
      const timeSliceOpacity = isTemporalPlanesActive ? Math.min(baseOpacity * 0.3, 8) : baseOpacity;
      const timeSliceColor = [colors.temporalGrid[0], colors.temporalGrid[1], colors.temporalGrid[2], timeSliceOpacity] as [number, number, number, number];

      allUniqueTimes.forEach(time => {
        const z = calculateZPosition(time, allUniqueTimes, temporalSpacing, temporalSpacingMode);
        
        if (z !== 0) {
          lines.push({
            source: [bounds.minX - VISUALIZATION_CONSTANTS_DIFF.GRID_EXTENSION, 0, z],
            target: [bounds.maxX + VISUALIZATION_CONSTANTS_DIFF.GRID_EXTENSION, 0, z],
            color: timeSliceColor,
            width: LINE_WIDTHS.TIME_SLICE_NORMAL
          });
          lines.push({
            source: [0, bounds.minY - VISUALIZATION_CONSTANTS_DIFF.GRID_EXTENSION, z],
            target: [0, bounds.maxY + VISUALIZATION_CONSTANTS_DIFF.GRID_EXTENSION, z],
            color: timeSliceColor,
            width: LINE_WIDTHS.TIME_SLICE_NORMAL
          });
        }
      });
    }

    return lines;
  }, [shape, spatialSpacing, geographicShapeOpacity, temporalGridOpacity, colors.geographicGrid, colors.temporalGrid, nodes3D.length, allUniqueTimes, temporalSpacing, temporalSpacingMode, showTemporalPlanes, temporalFilterMode, temporalRange]);

  // Create layers
  const layers = useMemo(() => {
    const layers = [];

    // Add ancestry heatmap layer (rendered first, below everything else)
    const heatmapLayer = createHeatmapPolygonLayer(ancestryHeatmap, heatmapSettings, temporalRange, temporalFilterMode);
    if (heatmapLayer) {
      layers.push(heatmapLayer);
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
      data: filterDataByHeatmap(edges3D, heatmapSettings),
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
        data: filterDataByHeatmap(diffEdges, heatmapSettings),
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
        opacity: VISUALIZATION_CONSTANTS_DIFF.NODE_OPACITY,
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
          if (shouldHideNodeByHeatmap(d, heatmapSettings)) {
            return 0;
          }
          
          // Get node-type-specific size from control panel (matching 3D visualizer)
          const isSample = d.time === minTime;
          // Treat nodes at minTime as samples for size calculation
          const nodeForSize = isSample ? { ...d, is_sample: true } : d;
          const isRoot = isRootNode(d, firstData?.nodes || [], firstData?.edges || []);
          const baseRadius = calculateNodeBaseRadius(nodeForSize, nodeSizes, isRoot);
          
          return baseRadius;
        },
        getFillColor: (d: NodeDiff3D) => {
          // Hide nodes based on heatmap visibility settings
          if (shouldHideNodeByHeatmap(d, heatmapSettings)) {
            return [0, 0, 0, 0];
          }
          return calculateNodeColor(d, selectedNode ?? null, temporalRange, temporalFilterMode, colors);
        },
        getLineColor: (d: NodeDiff3D) => {
          // Hide nodes based on heatmap visibility settings
          if (shouldHideNodeByHeatmap(d, heatmapSettings)) {
            return [0, 0, 0, 0];
          }
          return calculateNodeOutlineColor(d, selectedNode ?? null, firstData, temporalRange, temporalFilterMode, colors, minTime);
        },
        getLineWidth: (d: NodeDiff3D) => {
          // Hide nodes based on heatmap visibility settings
          if (shouldHideNodeByHeatmap(d, heatmapSettings)) {
            return 0;
          }
          
          const isSample = d.time === minTime;
          const nodeForSize = isSample ? { ...d, is_sample: true } : d;
          const isRoot = isRootNode(d, firstData?.nodes || [], firstData?.edges || []);
          const baseSize = calculateNodeBaseRadius(nodeForSize, nodeSizes, isRoot);
          
          const sizeFactor = baseSize / (nodeSizes.other * 0.5);
          
          if (isRoot) return Math.max(0.8, LINE_WIDTHS.NODE_OUTLINE_ROOT * sizeFactor);
          if (isSample) return Math.max(0.5, LINE_WIDTHS.NODE_OUTLINE_SAMPLE * sizeFactor);
          return 0;
        },
        onClick: (info: any, event: any) => {
          if (info.object) {
            // Use the button that was pressed during pointerdown (not pointerup which is always 0)
            const isRightClick = lastPointerButtonRef.current === 2;
            
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
        data: filterNodeLabelsByHeatmap(nodeLabels, heatmapSettings),
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
        data: filterDataByHeatmap(edgeLabels, heatmapSettings),
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
        data: filterDataByHeatmap(mutationMarkers, heatmapSettings),
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
  }, [ancestryHeatmap, shapeLines, edges3D, diffEdges, nodes3D, nodeSizes, colors, temporalRange?.[0], temporalRange?.[1], temporalFilterMode, minTime, nodeLabels, edgeLabels, mutationMarkers, nodeIdSettings, edgeLabelSettings, edgeMutationSettings, heatmapSettings]);

  // View state management
  const [viewState, setViewState] = useState({
    target: [0, 0, 0] as [number, number, number],
    zoom: VISUALIZATION_CONSTANTS_DIFF.DEFAULT_ZOOM as number,
    minZoom: VISUALIZATION_CONSTANTS_DIFF.MIN_ZOOM as number,
    maxZoom: VISUALIZATION_CONSTANTS_DIFF.MAX_ZOOM as number,
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
      ref={deckRef}
      layers={layers}
      views={orbitView}
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