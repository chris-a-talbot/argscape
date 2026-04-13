import React, { useMemo, useState, useRef, useCallback, useEffect } from 'react';
import DeckGL from '@deck.gl/react';
import { ScatterplotLayer, LineLayer, TextLayer } from '@deck.gl/layers';
import { OrbitView } from '@deck.gl/core';
import { GraphData, GraphNode, GeographicShape, NodeSizeSettings, TreeInterval } from '../ForceDirectedGraph/ForceDirectedGraph.types';
import { useColorTheme } from '../../../context/ColorThemeContext';
import { generatePopulationColors } from '../../../utils/colorUtils';
import { convertShapeToLines, createShapeLines, GeographicLine3D } from '../SpatialArgUtils/GeographicUtils';
import { combineSpatiallyColocatedNodes } from '../../../utils/nodeCombining';
import { TemporalSpacingMode, NodeIdSettings, EdgeLabelSettings, 
  EdgeMutationSettings, LabelConnectingLine3D, AncestryHeatmapSettings } from './SpatialArg3DVisualization.types';
import { 
  groupEdgesByPairs, 
  expandEdgeSpansForCombinedNodes, 
} from '../../../utils/genomicSpanUtils';
import {
  calculateAncestryDensity,
  generateHeatmapGrid,
  heatmapGridToPolygons
} from '../SpatialArgUtils/AncestryHeatmap';
import { determineGeographicShape, shouldHideNodeByHeatmap, filterDataByHeatmap, 
  filterNodeLabelsByHeatmap, calculateNodeBaseRadius, calculateZPosition } from '../SpatialArgUtils/SpatialArg.utils';
import { createMutationMarkers as createMutationMarkersUtil, 
  createHeatmapPolygonLayer } from '../SpatialArgUtils/LayerHelpers';
import {
  calculateCoordinateTransform,
  transformNodesToThreeD,
  transformEdgesToThreeD,
  calculateNodeColor,
  calculateNodeOutlineColor,
  calculateNodeOutlineWidth,
  createTooltipContent,
  createNodeLabels,
  createEdgeLabels,
  SpatialFilterConfig
} from './SpatialArg3D.utils';
import { VISUALIZATION_CONSTANTS_REG } from '../SpatialArgUtils/SpatialArg.constants';
import { GeographicMode, EdgeLabel3D, MutationMarker3D } from '../SpatialArgUtils/SpatialArg.types';
import { Node3D, Edge3D, NodeLabel3D } from './SpatialArg3D.types';
import { LINE_WIDTHS } from './SpatialArg3D.constants';
import { APP_SANS_FONT_FAMILY } from '../../../lib/fonts';

interface SpatialArg3DProps {
  data: GraphData | null;
  originalData?: GraphData | null; // Original unfiltered data for coordinate transform in unit grid mode
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
  colorByPopulation?: boolean;
  onRenderComplete?: () => void;
  // Spatial filter props for dim mode
  genomicRange?: [number, number] | null;
  genomicDimOpacity?: number;
  treeRange?: [number, number] | null;
  treeIntervals?: TreeInterval[];
  treeDimOpacity?: number;
  temporalDimOpacity?: number;
}


const SpatialArg3DVisualization = React.forwardRef<HTMLDivElement, SpatialArg3DProps>(({
  data,
  originalData,
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
  heatmapSettings,
  colorByPopulation = false,
  onRenderComplete,
  // Spatial filter props for dim mode
  genomicRange,
  genomicDimOpacity = 0.15,
  treeRange,
  treeIntervals,
  treeDimOpacity = 0.15,
  temporalDimOpacity = 0.15
}, ref) => {
  // OrbitView zoom behavior: Higher zoom = closer to object, Lower zoom = farther away
  // With maxZoom: 1000, users can now zoom very close to objects for detailed inspection
  // Physical units (meters) ensure consistent object sizes regardless of zoom level
  const deckRef = useRef<any>(null);
  const { colors } = useColorTheme();
  
  // Generate population colors if enabled
  const populationColors = useMemo(() => {
    if (!colorByPopulation || !data?.metadata?.has_populations || !data?.metadata?.populations) {
      return null;
    }
    const isDarkTheme = colors.background === '#1a1a1a' || colors.background === 'rgb(26, 26, 26)';
    return generatePopulationColors(data.metadata.populations, isDarkTheme);
  }, [colorByPopulation, data?.metadata?.has_populations, data?.metadata?.populations, colors.background]);
  
  // State for draggable label positions
  const [customLabelPositions, setCustomLabelPositions] = useState<Map<string, [number, number, number]>>(new Map());
  const [isDragging, setIsDragging] = useState<string | null>(null);
  
  // Track mouse button for right-click detection (pointerup loses button info)
  const lastPointerButtonRef = useRef<number>(0);
  
  // Memoize OrbitView to prevent recreation on every render
  const orbitView = useMemo(() => new OrbitView({ id: 'orbit' }), []);
  
  // Add global listener to track pointer button - use capture phase to catch it before deck.gl
  useEffect(() => {
    const handlePointerDown = (e: PointerEvent) => {
      lastPointerButtonRef.current = e.button;
    };
    
    // Use capture phase to ensure we catch the event before deck.gl
    window.addEventListener('pointerdown', handlePointerDown, { capture: true });
    return () => window.removeEventListener('pointerdown', handlePointerDown, { capture: true });
  }, []);

  const renderCompleteNotifiedRef = useRef(false);
  useEffect(() => {
    renderCompleteNotifiedRef.current = false;
  }, [
    data,
    width,
    height,
    selectedNode,
    temporalRange,
    showTemporalPlanes,
    temporalFilterMode,
    temporalSpacing,
    spatialSpacing,
    geographicShape,
    geographicMode,
    temporalGridOpacity,
    geographicShapeOpacity,
    nodeSizes,
    nodeIdSettings,
    edgeThickness,
    edgeOpacity,
    edgeLabelSettings,
    edgeMutationSettings,
    heatmapSettings,
    colorByPopulation,
    genomicRange,
    genomicDimOpacity,
    treeRange,
    treeIntervals,
    treeDimOpacity,
    temporalDimOpacity,
    externalViewState,
  ]);

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
  // Calculate dynamic zoom limits based on Z-axis height
  const calculateZoomLimits = useCallback((bounds: any) => {
    if (!bounds) {
      return {
        minZoom: VISUALIZATION_CONSTANTS_REG.BASE_MIN_ZOOM,
        maxZoom: VISUALIZATION_CONSTANTS_REG.BASE_MAX_ZOOM
      };
    }
    
    const zHeight = bounds.maxZ - bounds.minZ;
    // Scale zoom limits based on Z-axis height - more layers need higher zoom capability
    const scaleFactor = Math.max(1, zHeight * VISUALIZATION_CONSTANTS_REG.ZOOM_SCALE_FACTOR);
    
    return {
      minZoom: VISUALIZATION_CONSTANTS_REG.BASE_MIN_ZOOM / scaleFactor,
      maxZoom: VISUALIZATION_CONSTANTS_REG.BASE_MAX_ZOOM * scaleFactor
    };
  }, []);

  const [viewState, setViewState] = useState({
    target: [0, 0, 0] as [number, number, number],
    zoom: VISUALIZATION_CONSTANTS_REG.AUTO_FIT_ZOOM as number, // Use fit all zoom instead of default
    minZoom: VISUALIZATION_CONSTANTS_REG.BASE_MIN_ZOOM as number,
    maxZoom: VISUALIZATION_CONSTANTS_REG.BASE_MAX_ZOOM as number,
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
  // In unit grid mode, use original unfiltered data for coordinate transform to maintain consistent bounds
  const { combinedNodesForTransform, combinedEdgesForTransform, combinedNodesForCoordinateTransform } = useMemo(() => {
    if (!data || !data.nodes.length) return { combinedNodesForTransform: [], combinedEdgesForTransform: [], combinedNodesForCoordinateTransform: [] };
    
    // Apply spatial combining once at the top level
    const { nodes: combinedNodes, edges: combinedEdges } = combineSpatiallyColocatedNodes(data.nodes, data.edges);
    
    // For unit grid mode, use original unfiltered data for coordinate transform
    // Otherwise use the filtered data
    let nodesForCoordinateTransform = combinedNodes;
    if (geographicMode === 'unit_grid' && originalData && originalData.nodes.length > 0) {
      const { nodes: originalCombinedNodes } = combineSpatiallyColocatedNodes(originalData.nodes, originalData.edges);
      nodesForCoordinateTransform = originalCombinedNodes;
    }
    
    return { 
      combinedNodesForTransform: combinedNodes, 
      combinedEdgesForTransform: combinedEdges,
      combinedNodesForCoordinateTransform: nodesForCoordinateTransform
    };
  }, [data, originalData, geographicMode]);

  const coordinateTransform = useMemo(() => {
    if (!combinedNodesForCoordinateTransform.length) return null;
    return calculateCoordinateTransform(combinedNodesForCoordinateTransform, geographicMode, geographicShape);
  }, [combinedNodesForCoordinateTransform, geographicMode, geographicShape?.bounds]);

  const rootNodeIds = useMemo(() => {
    if (!combinedNodesForTransform.length) return new Set<number>();

    const childNodeIds = new Set<number>();
    combinedEdgesForTransform.forEach((edge) => {
      const targetId = typeof edge.target === 'number' ? edge.target : edge.target.id;
      childNodeIds.add(targetId);
    });

    return new Set(
      combinedNodesForTransform
        .filter((node) => !childNodeIds.has(node.id))
        .map((node) => node.id)
    );
  }, [combinedNodesForTransform, combinedEdgesForTransform]);

  const { nodes3D: allNodes3D, edges3D, bounds } = useMemo(() => {
    if (!coordinateTransform || !combinedNodesForTransform.length) {
      return { nodes3D: [], edges3D: [], bounds: null };
    }

    // Use the already-combined nodes and edges from the top level (filtered data)
    const combinedNodes = combinedNodesForTransform;
    const combinedEdges = combinedEdgesForTransform;
    
    // Filter to only spatial nodes from the filtered data
    const spatialNodes = combinedNodes.filter(node => 
      node.location?.x !== undefined && node.location?.y !== undefined
    );
    
    // Get unique times for z-position calculation
    const uniqueTimes = Array.from(new Set(combinedNodes.map(n => n.time))).sort((a, b) => a - b);
    
    const transformedNodes = transformNodesToThreeD(
      spatialNodes, // Use filtered nodes, not coordinateTransform.spatialNodes
      coordinateTransform, // But use coordinate transform from original data for consistent bounds
      temporalSpacing,
      spatialSpacing,
      colors,
      combinedNodes,
      combinedEdges,
      uniqueTimes,
      temporalSpacingMode,
      populationColors,
      rootNodeIds
    );

    const nodeMap = new Map<number, Node3D>();
    transformedNodes.forEach(node => nodeMap.set(node.id, node));

    // Build spatial filter config for dim mode
    const spatialFilter: SpatialFilterConfig | undefined = (genomicRange || treeRange) ? {
      genomicRange,
      genomicDimOpacity,
      treeRange,
      treeIntervals,
      treeDimOpacity
    } : undefined;

    const transformedEdges = transformEdgesToThreeD(
      combinedEdges,
      nodeMap,
      temporalRange || null,
      temporalFilterMode || null,
      colors,
      edgeOpacity,
      spatialFilter
    );

    // Optimize bounds calculation using reduce instead of spread operator for better performance
    const bounds = transformedNodes.reduce((acc, node) => {
      const [x, y, z] = node.position;
      if (acc.minX === null || x < acc.minX) acc.minX = x;
      if (acc.maxX === null || x > acc.maxX) acc.maxX = x;
      if (acc.minY === null || y < acc.minY) acc.minY = y;
      if (acc.maxY === null || y > acc.maxY) acc.maxY = y;
      if (acc.minZ === null || z < acc.minZ) acc.minZ = z;
      if (acc.maxZ === null || z > acc.maxZ) acc.maxZ = z;
      return acc;
    }, { minX: null as number | null, maxX: null as number | null, minY: null as number | null, maxY: null as number | null, minZ: null as number | null, maxZ: null as number | null });
    
    // Convert to final bounds object or null if no nodes
    const finalBounds = (bounds.minX !== null && bounds.maxX !== null && bounds.minY !== null && bounds.maxY !== null && bounds.minZ !== null && bounds.maxZ !== null) ? {
      minX: bounds.minX,
      maxX: bounds.maxX,
      minY: bounds.minY,
      maxY: bounds.maxY,
      minZ: bounds.minZ,
      maxZ: bounds.maxZ
    } : null;

    return { nodes3D: transformedNodes, edges3D: transformedEdges, bounds: finalBounds };
  }, [coordinateTransform, combinedNodesForTransform, combinedEdgesForTransform, temporalSpacing, spatialSpacing, temporalSpacingMode, temporalFilterMode, temporalRange, colors, edgeOpacity, populationColors, genomicRange, genomicDimOpacity, treeRange, treeIntervals, treeDimOpacity, rootNodeIds]);

  // Keep all nodes for calculations, but we'll control visibility in the layer
  const nodes3D = allNodes3D;

  // Memoize unique times from combined nodes (more stable than nodes3D which changes with filtering)
  const allUniqueTimes = useMemo(() => {
    if (!combinedNodesForTransform.length) return [];
    return Array.from(new Set(combinedNodesForTransform.map(n => n.time))).sort((a, b) => a - b);
  }, [combinedNodesForTransform]);

  // Update view state with dynamic zoom limits when bounds change
  React.useEffect(() => {
    if (bounds) {
      const zoomLimits = calculateZoomLimits(bounds);
      
      setViewState(prev => ({
        ...prev,
        minZoom: zoomLimits.minZoom,
        maxZoom: zoomLimits.maxZoom
      }));
    }
  }, [bounds, calculateZoomLimits]);

  useEffect(() => {
    setCustomLabelPositions(new Map());
    setIsDragging(null);
  }, [data, combinedNodesForTransform]);

  // No auto-center logic here - the container handles it

  const geographicLines = useMemo(() => {
    if (!bounds || !nodes3D.length || !allUniqueTimes.length) return [];

    const shapeToRender = determineGeographicShape(geographicShape, geographicMode, spatialSpacing);
    if (!shapeToRender) return [];

    // Convert shape to 2D lines once
    const baseLines = convertShapeToLines(shapeToRender, spatialSpacing);
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
    
    // Add temporal grid lines
    if (temporalGridOpacity > 0 && allUniqueTimes.length > 0) {
      const baseOpacity = temporalGridOpacity;
      const timeSliceOpacity = isTemporalPlanesActive ? Math.min(baseOpacity * 0.3, 8) : baseOpacity;
      const timeSliceColor = [colors.temporalGrid[0], colors.temporalGrid[1], colors.temporalGrid[2], timeSliceOpacity] as [number, number, number, number];

      allUniqueTimes.forEach(time => {
        const z = calculateZPosition(time, allUniqueTimes, temporalSpacing, temporalSpacingMode);
        
        if (z !== 0) {
          lines.push({
            source: [bounds.minX - VISUALIZATION_CONSTANTS_REG.GRID_EXTENSION, 0, z],
            target: [bounds.maxX + VISUALIZATION_CONSTANTS_REG.GRID_EXTENSION, 0, z],
            color: timeSliceColor,
            width: LINE_WIDTHS.TIME_SLICE_NORMAL
          });
          lines.push({
            source: [0, bounds.minY - VISUALIZATION_CONSTANTS_REG.GRID_EXTENSION, z],
            target: [0, bounds.maxY + VISUALIZATION_CONSTANTS_REG.GRID_EXTENSION, z],
            color: timeSliceColor,
            width: LINE_WIDTHS.TIME_SLICE_NORMAL
          });
        }
      });
    }

    return lines;
  }, [bounds, colors.geographicGrid, colors.temporalGrid, nodes3D.length, allUniqueTimes, temporalSpacing, temporalSpacingMode, spatialSpacing, showTemporalPlanes, temporalFilterMode, temporalGridOpacity, geographicShapeOpacity, geographicShape, geographicMode, temporalRange]);

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
      temporalFilterMode,
      rootNodeIds
    );
    
    return { nodeLabels: result.labels, labelConnectingLines: result.connectingLines };
  }, [nodes3D, nodeIdSettings, combinedNodesForTransform, combinedEdgesForTransform, nodeSizes, colors, customLabelPositions, temporalRange, temporalFilterMode, rootNodeIds]);

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

    return createEdgeLabels(expandedEdgeGroups, edgeLabelSettings, colors, nodes3D);
  }, [data, edgeLabelSettings, edges3D, combinedEdgesForTransform, combinedNodesForTransform, colors, nodes3D]);

  // Create mutation markers (red "x"s) on edges that have mutations
  const mutationMarkers = useMemo(() => {
    if (!edges3D.length || !combinedEdgesForTransform.length || !nodes3D.length) return [];
    
    // Create node map for mutation marker positioning
    const nodeMap = new Map<number, Node3D>();
    nodes3D.forEach(node => nodeMap.set(node.id, node));
    
    return createMutationMarkersUtil(combinedEdgesForTransform, nodeMap, edgeMutationSettings, colors);
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
    allNodes3D,
    coordinateTransform,
    combinedNodesForTransform,
    combinedEdgesForTransform,
    temporalSpacing,
    temporalSpacingMode,
    spatialSpacing,
    showTemporalPlanes
  ]);

  // Memoize layers array to prevent unnecessary recreation and memory leaks
  const layers = useMemo(() => {
    const layers = [];
    
    // Ancestry heatmap layer (rendered first, below everything else)
    const heatmapLayer = createHeatmapPolygonLayer(ancestryHeatmap, heatmapSettings, temporalRange, temporalFilterMode);
    if (heatmapLayer) {
      layers.push(heatmapLayer);
    }
    
    return [

    ...layers,
    
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
      data: filterDataByHeatmap(labelConnectingLines, heatmapSettings),
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
      data: filterDataByHeatmap(edges3D, heatmapSettings),
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
      opacity: VISUALIZATION_CONSTANTS_REG.NODE_OPACITY,
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
        if (shouldHideNodeByHeatmap(d, heatmapSettings)) {
          return 0;
        }
        
        const isSelected = selectedNode && d.id === selectedNode.id;
        const isRoot = rootNodeIds.has(d.id);
        const baseRadius = calculateNodeBaseRadius(d, nodeSizes, isRoot);
        
        return isSelected ? baseRadius * VISUALIZATION_CONSTANTS_REG.SELECTED_NODE_SCALE : baseRadius;
      },
      getFillColor: (d: Node3D) => {
        // Hide nodes based on heatmap visibility settings
        if (shouldHideNodeByHeatmap(d, heatmapSettings)) {
          return [0, 0, 0, 0];
        }
        return calculateNodeColor(d, selectedNode || null, temporalRange || null, temporalFilterMode, colors);
      },
      getLineColor: (d: Node3D) => {
        // Hide nodes based on heatmap visibility settings
        if (shouldHideNodeByHeatmap(d, heatmapSettings)) {
          return [0, 0, 0, 0];
        }
        return calculateNodeOutlineColor(d, selectedNode || null, data, temporalRange || null, temporalFilterMode, colors, rootNodeIds);
      },
      getLineWidth: (d: Node3D) => {
        // Hide nodes based on heatmap visibility settings
        if (shouldHideNodeByHeatmap(d, heatmapSettings)) {
          return 0;
        }
        
        const outlineWidth = calculateNodeOutlineWidth(d, selectedNode || null, data, rootNodeIds);
        const isRoot = rootNodeIds.has(d.id);
        const baseRadius = calculateNodeBaseRadius(d, nodeSizes, isRoot);
        
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
      data: filterNodeLabelsByHeatmap(nodeLabels, heatmapSettings),
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
      fontFamily: APP_SANS_FONT_FAMILY,
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
      data: filterDataByHeatmap(edgeLabels, heatmapSettings),
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
      data: filterDataByHeatmap(mutationMarkers, heatmapSettings),
      pickable: true,
      sizeUnits: 'meters', // Use same world-space units as other elements
      sizeScale: 1, // Direct scaling 
      getPosition: (d: MutationMarker3D) => d.position,
      getText: (d: MutationMarker3D) => d.text,
      getColor: (d: MutationMarker3D) => d.color,
      getSize: (d: MutationMarker3D) => d.size * 1.1, // Slightly larger for better visibility
      opacity: 1.0, // Full opacity for mutation markers
      getTextAnchor: 'middle' as const,
      getAlignmentBaseline: 'center' as const,
      fontFamily: 'monospace, Arial, sans-serif', // Monospace for better symbol rendering
      fontWeight: '900', // Extra bold for thicker stroke visibility
      billboard: true, // Face camera for better readability in 3D
      background: true, // Subtle background for 3D visibility
      backgroundColor: [79, 70, 229, 150], // More opaque indigo background for better visibility
      backgroundPadding: [1, 1, 1, 1], // Minimal padding
      updateTriggers: {
        getData: [heatmapSettings],
        getPosition: [edgeMutationSettings, mutationMarkers],
        getText: [edgeMutationSettings],
        getColor: [edgeMutationSettings],
        getSize: [edgeMutationSettings]
      }
    })];
  }, [
    ancestryHeatmap,
    geographicLines,
    labelConnectingLines,
    edges3D,
    nodes3D,
    nodeLabels,
    edgeLabels,
    mutationMarkers,
    heatmapSettings,
    temporalRange?.[0],
    temporalRange?.[1],
    temporalFilterMode,
    nodeIdSettings,
    colors,
    nodeSizes,
    edgeThickness,
    edgeOpacity,
    edgeLabelSettings,
    edgeMutationSettings,
    customLabelPositions,
    isDragging,
    data?.metadata.sequence_length,
    rootNodeIds
  ]);

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
        views={orbitView}
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
        onAfterRender={() => {
          if (renderCompleteNotifiedRef.current) {
            return;
          }
          renderCompleteNotifiedRef.current = true;
          onRenderComplete?.();
        }}
        getCursor={({ isDragging: isHovering, pickedInfos }: any) => {
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
            return createTooltipContent(object as Node3D, data, geographicMode, colors, rootNodeIds);
          }
          
          // For mutation markers, show detailed mutation info
          if (layer?.id === 'mutation-markers' && object.mutation) {
            const mut = object.mutation;
            return {
              html: `
                <div style="background: ${colors.tooltipBackground}; color: ${colors.tooltipText}; padding: 8px; border-radius: 4px; font-size: 12px;">
                  <strong>Mutation ${mut.id}</strong><br/>
                  Position: ${Math.round(mut.position)}<br/>
                  Transition: ${mut.previous_state} → ${mut.derived_state}<br/>
                  Ancestral: ${mut.ancestral_state}
                  ${mut.time !== null && mut.time !== undefined ? `<br/>Time: ${mut.time.toFixed(4)}` : ''}
                  ${mut.parent_mutation !== -1 ? `<br/>Parent mutation: ${mut.parent_mutation}` : ''}
                </div>
              `,
              style: {
                backgroundColor: 'transparent',
                color: colors.tooltipText
              }
            };
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
