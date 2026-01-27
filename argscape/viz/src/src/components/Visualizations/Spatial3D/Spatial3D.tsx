import { useEffect, useMemo, useState, useCallback, useRef } from 'react'
import DeckGL from '@deck.gl/react'
import { OrbitView } from '@deck.gl/core'
import { ScatterplotLayer, LineLayer, TextLayer } from '@deck.gl/layers'
import { useDataStore, useUIStore, useFilterStore } from '@/stores'
import {
  calculateCoordinateTransform,
  transformNodesToThreeD,
  transformEdgesToThreeD,
  calculateInitialViewState,
  getContrastColor,
  calculateAutoFitMultipliers,
} from './Spatial3D.utils'
import { generatePopulationColors } from '@/utils/colorUtils'
import type { Node3D, Edge3D, ViewState } from './Spatial3D.types'
import { DEFAULT_VIEW_STATE, SHAPE_Z_OFFSET } from './Spatial3D.types'
import {
  convertShapeToLines,
  createShapeLines,
  getBuiltInShape,
  LINE_WIDTHS,
  type GeographicLine3D,
} from './GeographicUtils'

interface MutationMarker3D {
  id: string
  position: [number, number, number]
  text: string
  color: [number, number, number, number]
  size: number
}

interface Spatial3DProps {
  width: number
  height: number
}

// Global ref for export functionality - allows ExportPanel to trigger capture
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let deckGLRef: any = null
let pendingExportCallback: ((dataUrl: string) => void) | null = null
let currentBackgroundColor: string = '#03303E'  // Store current theme background

export function triggerDeckGLExport(): Promise<string> {
  return new Promise((resolve, reject) => {
    if (!deckGLRef?.deck) {
      reject(new Error('DeckGL not initialized'))
      return
    }

    pendingExportCallback = resolve

    // Force a redraw - onAfterRender will capture and resolve
    deckGLRef.deck.redraw(true)  // true = force synchronous redraw

    // Timeout fallback in case onAfterRender doesn't fire
    setTimeout(() => {
      if (pendingExportCallback === resolve) {
        pendingExportCallback = null
        reject(new Error('Export timed out'))
      }
    }, 2000)
  })
}

/**
 * Composite the WebGL canvas with a background color
 * WebGL canvas is transparent, so we need to add the background
 */
function compositeWithBackground(sourceCanvas: HTMLCanvasElement, backgroundColor: string): string {
  const compositeCanvas = document.createElement('canvas')
  compositeCanvas.width = sourceCanvas.width
  compositeCanvas.height = sourceCanvas.height
  const ctx = compositeCanvas.getContext('2d')

  if (!ctx) {
    return sourceCanvas.toDataURL('image/png')
  }

  // Fill with background color first
  ctx.fillStyle = backgroundColor
  ctx.fillRect(0, 0, compositeCanvas.width, compositeCanvas.height)

  // Draw the WebGL canvas on top
  ctx.drawImage(sourceCanvas, 0, 0)

  return compositeCanvas.toDataURL('image/png')
}

export function Spatial3D({ width, height }: Spatial3DProps) {
  const { displayedNodes, displayedEdges, setViewMode, rawData } = useDataStore()
  const { theme, nodes: nodeSettings, edges: edgeSettings, mutations, spatial } = useUIStore()
  const { temporalRange, temporalFilterMode, temporalDimOpacity } = useFilterStore()

  // Generate population colors when colorByPopulation is enabled
  const populationColors = useMemo(() => {
    if (!nodeSettings.colorByPopulation || !rawData?.metadata?.has_populations) {
      return null
    }
    const populations = rawData.metadata.populations ?? []
    // Determine if dark theme based on background color
    const isDarkTheme = theme?.background !== '#ffffff' && theme?.background !== '#f5f5f7'
    return generatePopulationColors(populations, isDarkTheme)
  }, [nodeSettings.colorByPopulation, rawData?.metadata?.has_populations, rawData?.metadata?.populations, theme?.background])

  // Get geographic shape from raw data, or use built-in unit grid
  const geographicShape = rawData?.geographic_shape ?? null
  const locationCrs = rawData?.metadata?.location_crs ?? null

  const [viewState, setViewState] = useState<ViewState>(DEFAULT_VIEW_STATE)
  const [initialized, setInitialized] = useState(false)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const deckRef = useRef<any>(null)

  // Store ref and background color globally for export
  useEffect(() => {
    deckGLRef = deckRef.current
    if (theme) {
      currentBackgroundColor = theme.background
    }
    return () => {
      deckGLRef = null
    }
  }, [theme])

  // Calculate coordinate transform based on FULL dataset for consistent dimensions
  // This ensures subARG/ancestors views maintain the same scale as the full view
  const fullTransform = useMemo(() => {
    const fullNodes = rawData?.nodes ?? displayedNodes
    return calculateCoordinateTransform(fullNodes)
  }, [rawData?.nodes, displayedNodes])

  // Get unique times from FULL dataset for consistent Z spacing
  const fullUniqueTimes = useMemo(() => {
    const fullNodes = rawData?.nodes ?? displayedNodes
    return [...new Set(fullNodes.map(n => n.time))].sort((a, b) => a - b)
  }, [rawData?.nodes, displayedNodes])

  // Calculate effective multipliers (auto-fit or user-specified)
  const { effectiveTemporalMultiplier, effectiveSpatialMultiplier } = useMemo(() => {
    // If neither auto-fit is enabled, use the stored values directly
    if (!spatial.autoFitTemporal && !spatial.autoFitSpatial) {
      return {
        effectiveTemporalMultiplier: spatial.temporalMultiplier,
        effectiveSpatialMultiplier: spatial.spatialMultiplier,
      }
    }

    // Calculate auto-fit values
    const autoFit = calculateAutoFitMultipliers(
      width,
      height,
      fullUniqueTimes.length,
      spatial.temporalMultiplier
    )

    return {
      effectiveTemporalMultiplier: spatial.autoFitTemporal ? autoFit.temporalMultiplier : spatial.temporalMultiplier,
      effectiveSpatialMultiplier: spatial.autoFitSpatial ? autoFit.spatialMultiplier : spatial.spatialMultiplier,
    }
  }, [width, height, fullUniqueTimes.length, spatial.temporalMultiplier, spatial.spatialMultiplier, spatial.autoFitTemporal, spatial.autoFitSpatial])

  // Transform data to 3D with temporal filtering
  const { nodes3D, edges3D } = useMemo(() => {
    if (!theme || displayedNodes.length === 0) {
      return { nodes3D: [], edges3D: [] }
    }

    // Apply temporal filter in subset mode: filter nodes before transformation
    let nodesToTransform = displayedNodes
    let edgesToTransform = displayedEdges

    if (temporalRange && temporalFilterMode === 'subset') {
      const [minTime, maxTime] = temporalRange
      // Filter nodes to only those within the temporal range
      nodesToTransform = displayedNodes.filter(n => n.time >= minTime && n.time <= maxTime)

      // Filter edges to only those where both source and target are in the filtered nodes
      const nodeIds = new Set(nodesToTransform.map(n => n.id))
      edgesToTransform = displayedEdges.filter(e =>
        nodeIds.has(e.source) && nodeIds.has(e.target)
      )
    }

    // Use full transform for consistent spatial positioning across subARG/ancestors views
    // Transform nodes using FULL unique times for consistent Z spacing
    const nodes3D = transformNodesToThreeD(
      nodesToTransform,
      fullTransform,
      theme,
      effectiveTemporalMultiplier,
      effectiveSpatialMultiplier,
      'equal',  // Match web app default for discrete temporal layers
      fullUniqueTimes,  // Pass full unique times for consistent Z positioning
      populationColors  // Pass population colors for population-based coloring
    )

    // Apply dim opacity in dim mode
    if (temporalRange && temporalFilterMode === 'dim') {
      const [minTime, maxTime] = temporalRange
      for (const node of nodes3D) {
        if (node.time < minTime || node.time > maxTime) {
          // Dim nodes outside the temporal range
          node.color = [node.color[0], node.color[1], node.color[2], Math.round(node.color[3] * temporalDimOpacity)] as [number, number, number, number]
        }
      }
    }

    const nodeMap = new Map(nodes3D.map(n => [n.id, n]))

    const edges3D = transformEdgesToThreeD(
      edgesToTransform,
      nodeMap,
      theme,
      edgeSettings.opacity
    )

    // Apply dim opacity to edges in dim mode based on connected node times
    if (temporalRange && temporalFilterMode === 'dim') {
      const [minTime, maxTime] = temporalRange
      // Create a map from node ID to time for quick lookup
      const nodeTimeMap = new Map(displayedNodes.map(n => [n.id, n.time]))

      // Match edges3D with edgesToTransform by index (they're in the same order)
      edgesToTransform.forEach((origEdge, i) => {
        if (i < edges3D.length) {
          const sourceTime = nodeTimeMap.get(origEdge.source)
          const targetTime = nodeTimeMap.get(origEdge.target)

          if (sourceTime !== undefined && targetTime !== undefined) {
            const sourceOutside = sourceTime < minTime || sourceTime > maxTime
            const targetOutside = targetTime < minTime || targetTime > maxTime
            if (sourceOutside || targetOutside) {
              edges3D[i].color = [edges3D[i].color[0], edges3D[i].color[1], edges3D[i].color[2], Math.round(edges3D[i].color[3] * temporalDimOpacity)] as [number, number, number, number]
            }
          }
        }
      })
    }

    return { nodes3D, edges3D }
  }, [displayedNodes, displayedEdges, theme, effectiveTemporalMultiplier, effectiveSpatialMultiplier, edgeSettings.opacity, temporalRange, temporalFilterMode, temporalDimOpacity, fullTransform, fullUniqueTimes, populationColors])

  // Calculate geographic grid lines and temporal back-panel grid
  // Coordinate system with orbitAxis='Y': deck.gl [X, Y, Z] = [spatialX, spatialY, temporal]
  const geographicLines = useMemo(() => {
    if (!theme || nodes3D.length === 0) return []

    // Use geographic shape from data if available, otherwise use built-in shape based on geoBase setting
    const shapeToRender = geographicShape ?? getBuiltInShape(spatial.geoBase, effectiveSpatialMultiplier)
    const baseLines = convertShapeToLines(shapeToRender, effectiveSpatialMultiplier)

    // Calculate shapefile bounds from the base lines for perfect alignment
    let shapeMinX = Infinity, shapeMaxX = -Infinity
    let shapeMinY = Infinity, shapeMaxY = -Infinity
    for (const [x1, y1, x2, y2] of baseLines) {
      shapeMinX = Math.min(shapeMinX, x1, x2)
      shapeMaxX = Math.max(shapeMaxX, x1, x2)
      shapeMinY = Math.min(shapeMinY, y1, y2)
      shapeMaxY = Math.max(shapeMaxY, y1, y2)
    }

    // Shape color with configurable opacity
    const shapeAlpha = Math.round(spatial.shapeOpacity * 255)
    const shapeColor: [number, number, number, number] = [150, 150, 150, shapeAlpha]

    // Create ground shape slightly below temporal=0 so nodes sit on top
    const groundShapeLines = createShapeLines(baseLines, SHAPE_Z_OFFSET, shapeColor, LINE_WIDTHS.GEOGRAPHIC_NORMAL)

    // Temporal grid lines on back two panels (dynamic based on camera angle)
    const axisLines: GeographicLine3D[] = []

    if (spatial.showAxisLines) {
      // Grid colors with configurable opacity
      const gridAlpha = Math.round(spatial.gridOpacity * 150)  // Base alpha of 150, scaled by opacity
      const edgeAlpha = Math.round(spatial.gridOpacity * 200)  // Edges slightly more visible
      const gridLineColor: [number, number, number, number] = [120, 120, 120, gridAlpha]
      const edgeColor: [number, number, number, number] = [150, 150, 150, edgeAlpha]

      // Use FULL unique times for consistent temporal grid dimensions across subARG/ancestors views
      const numTimeSteps = fullUniqueTimes.length

      // Determine which back faces to show based on camera rotation
      // rotationOrbit: 0 = looking from +Y, 90 = from +X, 180 = from -Y, 270 = from -X
      const orbitRad = (viewState.rotationOrbit * Math.PI) / 180

      // Camera direction in XY plane (where camera is looking FROM)
      const camFromX = Math.sin(orbitRad)
      const camFromY = Math.cos(orbitRad)

      // Show the two back faces (faces facing away from camera)
      const showXMax = camFromX > 0   // Show +X face when camera is on +X side
      const showXMin = camFromX < 0   // Show -X face when camera is on -X side
      const showYMax = camFromY > 0   // Show +Y face when camera is on +Y side
      const showYMin = camFromY < 0   // Show -Y face when camera is on -Y side

      // Add temporal grid lines on back faces at each time level
      if (numTimeSteps > 1) {
        for (let i = 0; i < numTimeSteps; i++) {
          const z = i * effectiveTemporalMultiplier

          // Horizontal lines on Y faces (lines along X at fixed Y)
          if (showYMax) {
            axisLines.push({
              source: [shapeMinX, shapeMaxY, z],
              target: [shapeMaxX, shapeMaxY, z],
              color: gridLineColor,
              width: LINE_WIDTHS.TIME_SLICE_NORMAL
            })
          }
          if (showYMin) {
            axisLines.push({
              source: [shapeMinX, shapeMinY, z],
              target: [shapeMaxX, shapeMinY, z],
              color: gridLineColor,
              width: LINE_WIDTHS.TIME_SLICE_NORMAL
            })
          }

          // Horizontal lines on X faces (lines along Y at fixed X)
          if (showXMax) {
            axisLines.push({
              source: [shapeMaxX, shapeMinY, z],
              target: [shapeMaxX, shapeMaxY, z],
              color: gridLineColor,
              width: LINE_WIDTHS.TIME_SLICE_NORMAL
            })
          }
          if (showXMin) {
            axisLines.push({
              source: [shapeMinX, shapeMinY, z],
              target: [shapeMinX, shapeMaxY, z],
              color: gridLineColor,
              width: LINE_WIDTHS.TIME_SLICE_NORMAL
            })
          }
        }
      }

      // Vertical edge lines at corners of back faces (Z direction)
      // Start from SHAPE_Z_OFFSET to connect with the ground shape
      const zMax = (numTimeSteps - 1) * effectiveTemporalMultiplier
      if (showYMax) {
        axisLines.push({ source: [shapeMinX, shapeMaxY, SHAPE_Z_OFFSET], target: [shapeMinX, shapeMaxY, zMax], color: edgeColor, width: LINE_WIDTHS.GEOGRAPHIC_NORMAL })
        axisLines.push({ source: [shapeMaxX, shapeMaxY, SHAPE_Z_OFFSET], target: [shapeMaxX, shapeMaxY, zMax], color: edgeColor, width: LINE_WIDTHS.GEOGRAPHIC_NORMAL })
      }
      if (showYMin) {
        axisLines.push({ source: [shapeMinX, shapeMinY, SHAPE_Z_OFFSET], target: [shapeMinX, shapeMinY, zMax], color: edgeColor, width: LINE_WIDTHS.GEOGRAPHIC_NORMAL })
        axisLines.push({ source: [shapeMaxX, shapeMinY, SHAPE_Z_OFFSET], target: [shapeMaxX, shapeMinY, zMax], color: edgeColor, width: LINE_WIDTHS.GEOGRAPHIC_NORMAL })
      }
      if (showXMax) {
        axisLines.push({ source: [shapeMaxX, shapeMinY, SHAPE_Z_OFFSET], target: [shapeMaxX, shapeMinY, zMax], color: edgeColor, width: LINE_WIDTHS.GEOGRAPHIC_NORMAL })
        axisLines.push({ source: [shapeMaxX, shapeMaxY, SHAPE_Z_OFFSET], target: [shapeMaxX, shapeMaxY, zMax], color: edgeColor, width: LINE_WIDTHS.GEOGRAPHIC_NORMAL })
      }
      if (showXMin) {
        axisLines.push({ source: [shapeMinX, shapeMinY, SHAPE_Z_OFFSET], target: [shapeMinX, shapeMinY, zMax], color: edgeColor, width: LINE_WIDTHS.GEOGRAPHIC_NORMAL })
        axisLines.push({ source: [shapeMinX, shapeMaxY, SHAPE_Z_OFFSET], target: [shapeMinX, shapeMaxY, zMax], color: edgeColor, width: LINE_WIDTHS.GEOGRAPHIC_NORMAL })
      }
    }

    return [...groundShapeLines, ...axisLines]
  }, [theme, nodes3D, fullUniqueTimes, effectiveSpatialMultiplier, spatial.showAxisLines, effectiveTemporalMultiplier, spatial.geoBase, spatial.gridOpacity, spatial.shapeOpacity, geographicShape, viewState.rotationOrbit])

  // Initialize view state when data first loads
  useEffect(() => {
    if (nodes3D.length > 0 && !initialized) {
      const initialView = calculateInitialViewState(nodes3D)
      setViewState(prev => ({
        ...prev,
        target: initialView.target,
        zoom: initialView.zoom,
      }))
      setInitialized(true)
    }
  }, [nodes3D, initialized])

  // Handle view state changes
  const onViewStateChange = useCallback(({ viewState: newViewState }: { viewState: ViewState }) => {
    setViewState(prev => ({
      ...newViewState,
      minZoom: prev.minZoom,
      maxZoom: prev.maxZoom,
      orbitAxis: 'Y',  // Y is "up" - we swap coords so time is in Y slot
    }))
  }, [])

  // Handle node click
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const onNodeClick = useCallback((info: any, event: any) => {
    if (!info.object) return

    // Right-click (button === 2)
    if (event?.srcEvent?.button === 2) {
      setViewMode('ancestors', info.object.id)
    } else {
      setViewMode('subarg', info.object.id)
    }
  }, [setViewMode])

  // Create Deck.GL layers
  const layers = useMemo(() => {
    if (!theme) return []

    const layerList = []

    // Geographic grid layer (render first, behind everything else)
    layerList.push(
      new LineLayer<GeographicLine3D>({
        id: 'geographic-lines',
        data: geographicLines,
        getSourcePosition: (d: GeographicLine3D) => d.source,
        getTargetPosition: (d: GeographicLine3D) => d.target,
        getColor: (d: GeographicLine3D) => d.color,
        getWidth: (d: GeographicLine3D) => d.width,
        widthUnits: 'meters',
        widthScale: 1,
        widthMinPixels: 1,
        pickable: false,
      })
    )

    // Edge layer
    layerList.push(
      new LineLayer<Edge3D>({
        id: 'edges',
        data: edges3D,
        getSourcePosition: (d: Edge3D) => d.source,
        getTargetPosition: (d: Edge3D) => d.target,
        getColor: (d: Edge3D) => d.color,
        getWidth: edgeSettings.width * 0.5,
        widthUnits: 'meters',
        widthScale: 1,
        pickable: false,
      })
    )

    // Node layer - matches web app configuration
    layerList.push(
      new ScatterplotLayer<Node3D>({
        id: 'nodes',
        data: nodes3D,
        pickable: true,
        stroked: true,
        filled: true,
        radiusUnits: 'meters',
        radiusScale: 1,
        radiusMinPixels: 1,
        lineWidthUnits: 'meters',
        lineWidthScale: 1,
        lineWidthMinPixels: 1,
        getPosition: (d: Node3D) => d.position,
        getFillColor: (d: Node3D) => d.color,
        getLineColor: (d: Node3D) => {
          // Slightly darker outline
          const [r, g, b, a] = d.color
          return [Math.max(0, r - 40), Math.max(0, g - 40), Math.max(0, b - 40), a]
        },
        getRadius: (d: Node3D) => {
          if (d.is_sample) return nodeSettings.sampleSize * 0.5
          if (d.is_root) return nodeSettings.rootSize * 0.5
          return nodeSettings.internalSize * 0.5
        },
        getLineWidth: 0.3,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        onClick: onNodeClick as any,
        updateTriggers: {
          getRadius: [nodeSettings.sampleSize, nodeSettings.internalSize, nodeSettings.rootSize],
          getFillColor: [nodes3D],
          getLineColor: [nodes3D],
        },
      })
    )

    // Label layer (if any labels enabled) - labels inside nodes with contrasting color
    if (nodeSettings.showSampleIds || nodeSettings.showInternalIds || nodeSettings.showRootIds) {
      const labelNodes = nodes3D.filter(n => {
        if (n.is_sample && nodeSettings.showSampleIds) return true
        if (n.is_root && nodeSettings.showRootIds) return true
        if (!n.is_sample && !n.is_root && nodeSettings.showInternalIds) return true
        return false
      })

      if (labelNodes.length > 0) {
        layerList.push(
          new TextLayer<Node3D>({
            id: 'labels',
            data: labelNodes,
            getPosition: (d: Node3D) => d.position,  // Render at node position
            getText: (d: Node3D) => String(d.original_id),
            // Contrasting color based on node color luminance
            getColor: (d: Node3D) => getContrastColor(d.color),
            // Larger labels for samples, proportional to node size
            getSize: (d: Node3D) => d.is_sample ? 14 : 11,
            sizeUnits: 'pixels',
            billboard: false,  // Labels lay flat on nodes, not facing camera
            fontFamily: 'Arial, sans-serif',
            fontWeight: 'bold',
            getTextAnchor: 'middle',
            getAlignmentBaseline: 'center',
            updateTriggers: {
              getColor: [nodes3D],
            },
          })
        )
      }
    }

    // Mutation markers layer (if mutations enabled and data has mutations)
    if (mutations.show && displayedEdges.some(e => e.mutations && e.mutations.length > 0)) {
      const nodeMap = new Map(nodes3D.map(n => [n.id, n]))
      const mutationMarkers: MutationMarker3D[] = []

      displayedEdges.forEach(edge => {
        if (!edge.mutations || edge.mutations.length === 0) return

        const sourceNode = nodeMap.get(edge.source)
        const targetNode = nodeMap.get(edge.target)
        if (!sourceNode || !targetNode) return

        // Create a marker for each mutation on this edge
        edge.mutations.forEach((mutation, mutIndex) => {
          // Calculate position along the edge based on mutation time or midpoint
          let t = 0.5 // Default to midpoint
          if (mutation.time !== null && mutation.time !== undefined) {
            const sourceTime = sourceNode.time
            const targetTime = targetNode.time
            if (sourceTime !== targetTime) {
              t = (mutation.time - targetTime) / (sourceTime - targetTime)
              t = Math.max(0, Math.min(1, t))
            }
          }

          const position: [number, number, number] = [
            targetNode.position[0] + t * (sourceNode.position[0] - targetNode.position[0]),
            targetNode.position[1] + t * (sourceNode.position[1] - targetNode.position[1]),
            targetNode.position[2] + t * (sourceNode.position[2] - targetNode.position[2]),
          ]

          mutationMarkers.push({
            id: `mutation-${edge.source}-${edge.target}-${mutIndex}`,
            position,
            text: '×',  // X marker for mutations
            color: [255, 80, 80, 255],  // Red color for mutations
            size: mutations.size,
          })
        })
      })

      if (mutationMarkers.length > 0) {
        layerList.push(
          new TextLayer<MutationMarker3D>({
            id: 'mutation-markers',
            data: mutationMarkers,
            getPosition: (d: MutationMarker3D) => d.position,
            getText: (d: MutationMarker3D) => d.text,
            getColor: (d: MutationMarker3D) => d.color,
            getSize: (d: MutationMarker3D) => d.size,
            sizeUnits: 'pixels',
            billboard: true,
            fontFamily: 'Arial, sans-serif',
            fontWeight: 'bold',
            getTextAnchor: 'middle',
            getAlignmentBaseline: 'center',
          })
        )
      }
    }

    return layerList
  }, [nodes3D, edges3D, displayedEdges, geographicLines, theme, nodeSettings, edgeSettings, mutations, onNodeClick])

  // Create view - matches web app configuration
  // Configure clipping planes to prevent node clipping during animations
  // when nodes span a large Z-range (temporal dimension)
  const orbitView = useMemo(() => new OrbitView({
    id: 'orbit',
    near: 0.01,    // Smaller near plane prevents clipping nodes close to camera
    far: 10000,    // Larger far plane prevents clipping distant nodes
  }), [])

  if (!theme) {
    return (
      <div
        style={{
          width,
          height,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#03303E',
          color: '#fff',
        }}
      >
        Loading...
      </div>
    )
  }

  return (
    <div style={{ width, height, position: 'relative' }}>
      <DeckGL
        ref={deckRef}
        width={width}
        height={height}
        views={orbitView}
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        viewState={viewState as any}
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        onViewStateChange={onViewStateChange as any}
        layers={layers}
        controller={true}
        style={{ background: theme.background }}
        // Enable canvas export by preserving the drawing buffer
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        {...{ _glOptions: { preserveDrawingBuffer: true } } as any}
        onAfterRender={() => {
          // Handle pending export request
          if (pendingExportCallback && deckRef.current?.deck?.canvas) {
            try {
              const canvas = deckRef.current.deck.canvas as HTMLCanvasElement
              // Composite with background color (WebGL canvas is transparent)
              const dataUrl = compositeWithBackground(canvas, currentBackgroundColor)
              pendingExportCallback(dataUrl)
            } catch (e) {
              console.error('Export failed:', e)
            }
            pendingExportCallback = null
          }
        }}
        getTooltip={({ object }: { object?: Node3D }) => {
          if (!object) return null

          // Format location for tooltip
          let locationStr = ''
          const origLoc = (object as any).original_location
          if (origLoc) {
            // Show original coordinates with CRS context
            if (locationCrs === 'EPSG:4326') {
              // Format as lat/lon
              const lat = origLoc[1]
              const lon = origLoc[0]
              const latDir = lat >= 0 ? 'N' : 'S'
              const lonDir = lon >= 0 ? 'E' : 'W'
              locationStr = `<br/>Location: ${Math.abs(lat).toFixed(2)}°${latDir}, ${Math.abs(lon).toFixed(2)}°${lonDir}`
            } else if (locationCrs) {
              locationStr = `<br/>Location: (${origLoc[0].toFixed(2)}, ${origLoc[1].toFixed(2)})`
            }
          } else if (object.location) {
            locationStr = `<br/>Location: (${object.location[0].toFixed(2)}, ${object.location[1].toFixed(2)})`
          }

          return {
            html: `<div style="padding: 8px; background: rgba(0,0,0,0.8); border-radius: 4px;">
              <strong>Node ${object.original_id}</strong><br/>
              Time: ${object.time.toFixed(2)}<br/>
              Type: ${object.is_sample ? 'Sample' : object.is_root ? 'Root' : 'Internal'}${locationStr}
            </div>`,
            style: {
              color: '#fff',
              fontSize: '12px',
            },
          }
        }}
      />
    </div>
  )
}
