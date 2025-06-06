import React, { useMemo, useState, useRef } from 'react';
import DeckGL from '@deck.gl/react';
import { ScatterplotLayer, LineLayer } from '@deck.gl/layers';
import { OrbitView } from '@deck.gl/core';
import { GraphData, GraphNode, GraphEdge, GeographicShape } from '../ForceDirectedGraph/ForceDirectedGraph.types';
import { useColorTheme, getNodeColor, getEdgeColor } from '../../context/ColorThemeContext';
import { convertShapeToLines3D, createGeographicTemporalPlanes, createUnitGridShape, GeographicLine3D } from './GeographicUtils';
import { combineIdenticalNodes } from '../../utils/nodeCombining';
import { isRootNode } from '../../utils/graphTraversal';
import { formatCoordinates } from '../../utils/colorUtils';

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
  maxNodeRadius = 25
}, ref) => {
  const deckRef = useRef<any>(null);
  const { colors } = useColorTheme();
  const [showControls, setShowControls] = useState(true);
  const [viewState, setViewState] = useState({
    target: [0, 0, 0] as [number, number, number],
    zoom: 2.5, // More zoomed in initially
    minZoom: 0.01, // Allow much deeper zoom out
    maxZoom: 50, // Allow much deeper zoom in
    rotationX: 0,
    rotationOrbit: 0,
    orbitAxis: 'Y' as const
  });

  // Stabilize coordinate transformation calculation to prevent unnecessary bounds changes
  const coordinateTransform = useMemo(() => {
    if (!data || !data.nodes.length) {
      return null;
    }

    // Apply node combining before calculating spatial bounds
    const { nodes: combinedNodes } = combineIdenticalNodes(data.nodes, data.edges);
    
    // Filter nodes that have spatial location data  
    const spatialNodes = combinedNodes.filter(node => 
      node.location?.x !== undefined && node.location?.y !== undefined
    );

    if (spatialNodes.length === 0) {
      return null;
    }

    // Calculate bounds for spatial coordinates
    const xCoords = spatialNodes.map(node => node.location!.x);
    const yCoords = spatialNodes.map(node => node.location!.y);
    const minX = Math.min(...xCoords);
    const maxX = Math.max(...xCoords);
    const minY = Math.min(...yCoords);
    const maxY = Math.max(...yCoords);
    
    // Handle coordinate transformation based on geographic mode
    let centerX: number, centerY: number, maxScale: number;
    
    // Always use consistent coordinate transformation logic
    // Check if we have geographic shape with bounds and if mode matches
    if ((geographicMode === 'eastern_hemisphere' || geographicMode === 'custom') && geographicShape?.bounds) {
      // For geographic modes with shape bounds, use the shape bounds as reference
      const [shapeMinX, shapeMinY, shapeMaxX, shapeMaxY] = geographicShape.bounds;
      centerX = (shapeMinX + shapeMaxX) / 2;
      centerY = (shapeMinY + shapeMaxY) / 2;
      maxScale = Math.max(shapeMaxX - shapeMinX, shapeMaxY - shapeMinY) || 1;
      console.log(`Using geographic bounds for ${geographicMode}:`, { centerX, centerY, maxScale });
    } else {
      // For unit grid and other modes, OR when no shape bounds available, use data bounds
      centerX = (minX + maxX) / 2;
      centerY = (minY + maxY) / 2;
      maxScale = Math.max(maxX - minX, maxY - minY) || 1;
      console.log(`Using data bounds for ${geographicMode}:`, { centerX, centerY, maxScale });
    }

    return {
      spatialNodes,
      centerX,
      centerY,
      maxScale,
      dataBounds: { minX, maxX, minY, maxY }
    };
  }, [data, geographicMode, geographicShape?.bounds]); // Removed spatialSpacing from dependencies

  const { nodes3D, edges3D, bounds } = useMemo(() => {
    if (!coordinateTransform) {
      return { nodes3D: [], edges3D: [], bounds: null };
    }

    const { spatialNodes, centerX, centerY, maxScale } = coordinateTransform;

    // Apply node combining for edges (reuse from coordinate transform)
    const { nodes: combinedNodes, edges: combinedEdges } = combineIdenticalNodes(data!.nodes, data!.edges);
    
    // Get unique time values and sort them
    const uniqueTimes = Array.from(new Set(spatialNodes.map(node => node.time))).sort((a, b) => a - b);
    const timeToZIndex = new Map(uniqueTimes.map((time, index) => [time, index]));

    const normalizedNodes: Node3D[] = spatialNodes.map(node => {
      const normalizedX = ((node.location!.x - centerX) / maxScale) * spatialSpacing; // Use dynamic spatial scaling
      const normalizedY = ((node.location!.y - centerY) / maxScale) * spatialSpacing;
      const zIndex = timeToZIndex.get(node.time) || 0;
      
      // Add microscopic jitter to prevent node overlap clipping at same time slice
      // Use node ID for deterministic but pseudo-random jitter
      const jitter = (node.id * 0.001) % 0.02 - 0.01; // Jitter range: -0.01 to +0.01
      const normalizedZ = zIndex * temporalSpacing + 0.1 + jitter; // Base elevation + tiny jitter

      // Enhanced color coding system using theme colors
      let color: [number, number, number, number];
      let size: number;

      if (node.is_sample) {
        color = colors.nodeSample;
        size = 4;
      } else if (node.is_combined) {
        color = colors.nodeCombined;
        size = 3;
      } else if (isRootNode(node, combinedNodes, combinedEdges)) {
        color = colors.nodeRoot;
        size = 4;
      } else {
        color = colors.nodeDefault;
        size = 3;
      }

      return {
        ...node,
        position: [normalizedX, normalizedY, normalizedZ] as [number, number, number],
        color,
        size
      };
    });

    // Create node lookup for edge processing
    const nodeMap = new Map<number, Node3D>();
    normalizedNodes.forEach(node => {
      nodeMap.set(node.id, node);
    });

    // Transform edges to 3D
    const transformedEdges: Edge3D[] = combinedEdges
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

        // Calculate edge opacity based on temporal filtering
        let edgeOpacity = colors.edgeDefault[3];
        if (temporalFilterMode === 'planes' && temporalRange) {
          const [minTime, maxTime] = temporalRange;
          const sourceInRange = sourceNode.time >= minTime && sourceNode.time <= maxTime;
          const targetInRange = targetNode.time >= minTime && targetNode.time <= maxTime;
          
          // If both nodes are outside temporal range, make edge very faint
          if (!sourceInRange && !targetInRange) {
            edgeOpacity = colors.edgeDefault[3] * 0.2;
          }
          // If one node is outside temporal range, make edge somewhat faint
          else if (!sourceInRange || !targetInRange) {
            edgeOpacity = colors.edgeDefault[3] * 0.5;
          }
          // If both nodes are in range, keep full opacity
        }

        return {
          source: [sourceNode.position[0], sourceNode.position[1], sourceNode.position[2]] as [number, number, number], // Use actual node position (includes jitter)
          target: [targetNode.position[0], targetNode.position[1], targetNode.position[2]] as [number, number, number], // Use actual node position (includes jitter)
          color: [colors.edgeDefault[0], colors.edgeDefault[1], colors.edgeDefault[2], edgeOpacity] as [number, number, number, number]
        };
      });

    const bounds = {
      minX: Math.min(...normalizedNodes.map(n => n.position[0])),
      maxX: Math.max(...normalizedNodes.map(n => n.position[0])),
      minY: Math.min(...normalizedNodes.map(n => n.position[1])),
      maxY: Math.max(...normalizedNodes.map(n => n.position[1])),
      minZ: Math.min(...normalizedNodes.map(n => n.position[2])),
      maxZ: Math.max(...normalizedNodes.map(n => n.position[2]))
    };

    return { nodes3D: normalizedNodes, edges3D: transformedEdges, bounds };
  }, [coordinateTransform, temporalSpacing, spatialSpacing, temporalFilterMode, temporalRange, colors.edgeDefault, colors.nodeSample, colors.nodeCombined, colors.nodeRoot, colors.nodeDefault]);

  // More robust auto-fit logic that handles spatial parameter changes
  const lastAutoFitKey = useRef<string>('');
  
  React.useEffect(() => {
    if (!bounds) return;
    
    // Create a key that represents the current configuration
    const currentKey = `${data?.nodes?.length || 0}-${spatialSpacing}-${temporalSpacing}-${geographicMode}-${geographicShape?.name || 'none'}`;
    
    // Only auto-fit if this is a new configuration or if the key has changed significantly
    if (currentKey !== lastAutoFitKey.current) {
      const centerX = (bounds.minX + bounds.maxX) / 2;
      const centerY = (bounds.minY + bounds.maxY) / 2;  
      const centerZ = (bounds.minZ + bounds.maxZ) / 2;
      
      console.log('Auto-fitting view to bounds for key:', currentKey, { centerX, centerY, centerZ });
      
      setViewState(prev => ({
        ...prev,
        target: [centerX, centerY, centerZ],
        zoom: 1.8 // More zoomed in when auto-fitting
      }));
      
      lastAutoFitKey.current = currentKey;
    }
  }, [bounds, spatialSpacing, temporalSpacing, geographicMode, geographicShape?.name, data?.nodes?.length]);

  // Create temporal plane geographic shapes if enabled
  const temporalPlaneLines = useMemo(() => {
    if (!showTemporalPlanes || !temporalRange || !bounds) {
      return [];
    }

    // Determine which shape to use for temporal planes
    let shapeToRender: GeographicShape | null = null;
    
    if (geographicShape) {
      shapeToRender = geographicShape;
    } else if (geographicMode === 'unit_grid') {
      shapeToRender = createUnitGridShape(10, spatialSpacing);
    } else if (geographicMode === 'eastern_hemisphere') {
      // Don't render temporal planes for eastern hemisphere without shape
      console.warn('Eastern hemisphere mode for temporal planes but no geographic shape provided');
      return [];
    } else {
      shapeToRender = createUnitGridShape(10, spatialSpacing);
    }

    if (!shapeToRender) return [];

    // Get all unique times from the dataset for consistent Z mapping
    const allUniqueTimes = Array.from(new Set(nodes3D.map(node => node.time)));
    
    // Use geographic utility to create temporal planes
    const baseColor: [number, number, number] = [Number(colors.textSecondary[0]), Number(colors.textSecondary[1]), Number(colors.textSecondary[2])];
    const lines = createGeographicTemporalPlanes(
      shapeToRender,
      allUniqueTimes,  // Pass ALL times, not filtered times
      temporalSpacing,
      spatialSpacing,
      baseColor,
      temporalRange
    );
    
    return lines;
  }, [showTemporalPlanes, temporalRange, bounds, nodes3D, temporalSpacing, spatialSpacing, colors.textSecondary, geographicShape, geographicMode, createUnitGridShape]);

  // Create geographic shape lines for the base layer (time=0)
  const geographicLines = useMemo(() => {
    if (!bounds || !nodes3D.length) return [];

    // Determine which shape to use - be more careful about fallbacks
    let shapeToRender: GeographicShape | null = null;
    
    if (geographicShape) {
      shapeToRender = geographicShape;
      console.log(`Using provided geographic shape: ${geographicShape.name} (${geographicShape.crs})`);
    } else if (geographicMode === 'unit_grid') {
      // Create a unit grid shape
      shapeToRender = createUnitGridShape(10, spatialSpacing);
      console.log('Creating unit grid shape');
    } else if (geographicMode === 'eastern_hemisphere') {
      // Only fallback to unit grid if we explicitly don't have a shape for eastern hemisphere
      console.warn('Eastern hemisphere mode selected but no geographic shape provided, skipping shape rendering');
      shapeToRender = null;
    } else {
      // For other modes, fallback to unit grid
      shapeToRender = createUnitGridShape(10, spatialSpacing);
      console.log(`Fallback to unit grid for mode: ${geographicMode}`);
    }

    if (!shapeToRender) return [];

    // Geographic shape opacity is controlled by its own setting, independent of temporal grid opacity
    const isTemporalPlanesActive = showTemporalPlanes && temporalFilterMode === 'planes';
    const baseGeographicOpacity = geographicShapeOpacity ?? 70;
    const geographicOpacity = baseGeographicOpacity > 0 ? (isTemporalPlanesActive ? Math.max(baseGeographicOpacity * 0.3, 8) : baseGeographicOpacity * 2.5) : 0;  // Scale and reduce when temporal planes are active
    const geographicLineWidth = isTemporalPlanesActive ? 0.5 : 3;  // Thinner lines when temporal planes are active
    const geographicColor = [Number(colors.textSecondary[0]), Number(colors.textSecondary[1]), Number(colors.textSecondary[2]), geographicOpacity] as [number, number, number, number];

    // Convert shape to 3D lines at Z=0 (time=0) - only if opacity > 0
    const shapeLines = geographicOpacity > 0 ? convertShapeToLines3D(shapeToRender, 0, spatialSpacing, geographicColor, geographicLineWidth) : [];

    // Add temporal slice markers for non-zero time slices
    const lines = [...shapeLines];
    const uniqueTimes = Array.from(new Set(nodes3D.map(node => node.time))).sort((a, b) => a - b);
    const timeToZIndex = new Map(uniqueTimes.map((time, index) => [time, index]));
    // Use the temporalGridOpacity prop, but reduce it when temporal planes are active
    const baseOpacity = temporalGridOpacity ?? 30;
    const timeSliceOpacity = isTemporalPlanesActive ? Math.min(baseOpacity * 0.3, 8) : baseOpacity;  // Much more subtle when temporal planes are active
    const timeSliceLineWidth = isTemporalPlanesActive ? 0.5 : 1.5;  // Thinner when temporal planes are active
    const timeSliceColor = [Number(colors.textSecondary[0]), Number(colors.textSecondary[1]), Number(colors.textSecondary[2]), timeSliceOpacity] as [number, number, number, number];

    // Only add temporal slice markers if opacity > 0
    if (timeSliceOpacity > 0) {
      uniqueTimes.forEach(time => {
        const zIndex = timeToZIndex.get(time) || 0;
        const z = zIndex * temporalSpacing;
        
        if (z !== 0) { // Skip time=0 since we already have the shape there
          // Create subtle markers for each time slice
          // X-axis marker
          lines.push({
            source: [bounds.minX - 2, 0, z],
            target: [bounds.maxX + 2, 0, z],
            color: timeSliceColor,
            width: timeSliceLineWidth
          });
          // Y-axis marker  
          lines.push({
            source: [0, bounds.minY - 2, z],
            target: [0, bounds.maxY + 2, z],
            color: timeSliceColor,
            width: timeSliceLineWidth
          });
        }
      });
    }

    return lines;
  }, [bounds, colors.textSecondary, nodes3D, temporalSpacing, spatialSpacing, geographicShape, geographicMode, createUnitGridShape, showTemporalPlanes, temporalFilterMode, temporalGridOpacity, geographicShapeOpacity]);

  const layers = [
    // Geographic shape layer (rendered first, behind everything else)
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

    // Temporal plane grids layer (rendered after grid)
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

    // Edges layer
    new LineLayer<Edge3D>({
      id: 'edges',
      data: edges3D,
      pickable: false,
      getSourcePosition: (d: Edge3D) => d.source,
      getTargetPosition: (d: Edge3D) => d.target,
      getColor: (d: Edge3D) => d.color,
      getWidth: 2
    }),
    
    // Nodes layer
    new ScatterplotLayer<Node3D>({
      id: 'nodes',
      data: nodes3D,
      pickable: true,
      opacity: 0.85, // Slightly increased from 0.8 to make nodes more prominent over grids
      stroked: true,
      filled: true,
      radiusScale: 6, // Scale nodes more dramatically with zoom
      radiusMinPixels: 1, // Minimum size when zoomed out
      radiusMaxPixels: maxNodeRadius, // Maximum size when zoomed in (prevent them from getting too huge)
      lineWidthMinPixels: 0.3,
      lineWidthMaxPixels: 4, // Prevent outlines from getting too thick
      getPosition: (d: Node3D) => d.position,
      getRadius: (d: Node3D) => {
        // Highlight selected node with larger size
        const isSelected = selectedNode && d.id === selectedNode.id;
        return isSelected ? d.size * 1.5 : d.size;
      },
      getFillColor: (d: Node3D) => {
        // Highlight selected node with different color
        const isSelected = selectedNode && d.id === selectedNode.id;
        if (isSelected) {
          return colors.nodeSelected;
        }
        
        // Check if temporal filtering is active in "planes" mode
        if (temporalFilterMode === 'planes' && temporalRange) {
          const [minTime, maxTime] = temporalRange;
          const isInTemporalRange = d.time >= minTime && d.time <= maxTime;
          
          if (!isInTemporalRange) {
            // Make nodes outside temporal range less prominent (50% opacity)
            return [d.color[0], d.color[1], d.color[2], d.color[3] * 0.5] as [number, number, number, number];
          }
        }
        
        return d.color;
      },
      getLineColor: (d: Node3D) => {
        const isSelected = selectedNode && d.id === selectedNode.id;
        const isRoot = isRootNode(d, data?.nodes || [], data?.edges || []);
        
        // Check temporal filtering for opacity
        let opacityMultiplier = 1;
        if (temporalFilterMode === 'planes' && temporalRange) {
          const [minTime, maxTime] = temporalRange;
          const isInTemporalRange = d.time >= minTime && d.time <= maxTime;
          if (!isInTemporalRange) {
            opacityMultiplier = 0.3;
          }
        }
        
        if (isSelected) {
          return colors.nodeSelected;
        }
        
        // Outline for root nodes
        if (isRoot) {
          return [colors.nodeSelected[0], colors.nodeSelected[1], colors.nodeSelected[2], colors.nodeSelected[3] * opacityMultiplier] as [number, number, number, number];
        }
        // Outline for sample nodes
        if (d.is_sample) {
          const outlineColor = colors.background === '#ffffff' ? 0 : 255;
          return [outlineColor, outlineColor, outlineColor, 255 * opacityMultiplier] as [number, number, number, number];
        }
        // No outline for other nodes
        return [colors.nodeSelected[0], colors.nodeSelected[1], colors.nodeSelected[2], 0] as [number, number, number, number];
      },
      getLineWidth: (d: Node3D) => {
        const isSelected = selectedNode && d.id === selectedNode.id;
        const isRoot = isRootNode(d, data?.nodes || [], data?.edges || []);
        const baseSize = isSelected ? d.size * 1.5 : d.size;
        
        // Scale outline width to be proportional to node size, not just zoom level
        const sizeFactor = baseSize / 3; // Normalize to base size of 3 (current default node size)
        
        if (isSelected) return Math.max(1, 2 * sizeFactor); // Proportional outline for selected
        if (isRoot) return Math.max(0.8, 1.5 * sizeFactor); // Proportional outline for root nodes
        if (d.is_sample) return Math.max(0.5, 0.8 * sizeFactor); // Proportional outline for sample nodes
        return 0; // No outline for other nodes
      },
      onClick: (info: any, event: any) => {
        event.srcEvent.preventDefault();
        if (info.object && onNodeClick) {
          onNodeClick(info.object);
        }
      },
      onHover: (info: any) => {
        // Handle right-click through deck.gl's pick functionality
        if (info.rightButton && info.object && onNodeRightClick) {
          onNodeRightClick(info.object);
        }
      }
    })
  ];

  if (!data || nodes3D.length === 0) {
    return (
      <div 
        style={{ 
          width, 
          height, 
          backgroundColor: colors.containerBackground, 
          color: colors.text,
          borderColor: colors.border 
        }}
        className="flex items-center justify-center border rounded"
      >
        <div className="text-center">
          <p className="text-lg mb-2">No spatial data available</p>
          <p className="text-sm text-sp-white opacity-75">
            This ARG does not contain 2D spatial information required for 3D visualization.
          </p>
        </div>
      </div>
    );
  }

  // Expose data for high-quality export
  const exportData = React.useCallback(() => ({
    nodes: nodes3D,
    edges: edges3D,
    bounds,
    currentViewState: viewState
  }), [nodes3D, edges3D, bounds, viewState]);

  return (
    <div 
      style={{ width, height }} 
      className="relative"
      data-3d-visualization="true"
      ref={(el) => {
        if (el && typeof ref === 'function') {
          ref(el);
        } else if (el && ref && 'current' in ref) {
          ref.current = el;
        }
        // Add export method to the element
        if (el) {
          (el as any).getExportData = () => ({
            nodes: nodes3D,
            edges: edges3D,
            bounds,
            currentViewState: viewState
          });
        }
      }}
      onContextMenu={(event) => {
        // Handle right-click at the container level
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
        onViewStateChange={({ viewState: newViewState }: any) => setViewState(newViewState)}
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
          const node = object as Node3D;
          
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
          
          const tooltipBg = colors.background === '#ffffff' ? 'rgba(0, 0, 0, 0.9)' : 'rgba(5, 62, 78, 0.95)';
            const tooltipColor = colors.background === '#ffffff' ? '#ffffff' : colors.text;
            
            return {
              html: `
                <div style="background: ${tooltipBg}; color: ${tooltipColor}; padding: 8px; border-radius: 4px; font-size: 12px;">
                  <strong>Node ${node.id}</strong><br/>
                  Time: ${node.time.toFixed(3)}<br/>
                  ${nodeTypeInfo}<br/>
                  ${node.location ? `Location: ${formatCoordinates(node.location.x, node.location.y, geographicMode === 'eastern_hemisphere')}` : ''}
                </div>
              `,
              style: {
                backgroundColor: 'transparent',
                color: tooltipColor
              }
            };
        }}
      />
      
      {/* Controls overlay */}
      {showControls && (
        <div 
          className="absolute bottom-24 left-4 p-3 rounded-lg text-xs"
          style={{ 
            backgroundColor: colors.background === '#ffffff' ? 'rgba(0, 0, 0, 0.8)' : 'rgba(5, 62, 78, 0.9)',
            color: colors.background === '#ffffff' ? '#ffffff' : colors.text,
            border: colors.background === '#ffffff' ? '1px solid rgba(0, 0, 0, 0.2)' : 'none'
          }}
        >
          <div className="flex items-start justify-between mb-2">
            <div><strong>3D Controls:</strong></div>
            <button
              onClick={() => setShowControls(false)}
              className="ml-3 text-xs opacity-70 hover:opacity-100 transition-opacity"
              style={{ color: colors.background === '#ffffff' ? '#ffffff' : colors.text }}
            >
              ✕
            </button>
          </div>
          <div className="space-y-1">
            <div>• Drag: Rotate view</div>
            <div>• Shift+drag: Pan view</div>
            <div>• Scroll: Zoom in/out</div>
            <div>• Left click: Select node</div>
            <div>• Right click: Ancestors</div>
          </div>
        </div>
      )}
    </div>
  );
});

SpatialArg3DVisualization.displayName = 'SpatialArg3DVisualization';

export default SpatialArg3DVisualization; 