import { useEffect, useRef, useState } from 'react'
import { useDataStore, useUIStore, useFilterStore, useAnimationStore } from '@/stores'
import { ForceGraph } from '@/components/Visualizations/ForceGraph'
import { Spatial3D } from '@/components/Visualizations/Spatial3D'
import { QuickActionsBar } from '@/components/QuickActionsBar'
import { LegendCard, ViewModeHeader } from '@/components/FloatingElements'
import { GenomicFilter, TemporalFilter } from '@/components/filters'
import { AnimationPopout } from '@/components/AnimationPopout'
import { useAnimationLoop } from '@/hooks/useAnimationLoop'
import type { GraphData, VizOptions } from '@/types'

interface AppProps {
  data: unknown
  options: unknown
}

interface ExtendedVizOptions extends VizOptions {
  minimal?: boolean
  filtersExpanded?: boolean
}

export default function App({ data, options }: AppProps) {
  const graphData = data as GraphData
  const vizOptions = options as ExtendedVizOptions

  const { setRawData, setViewMode } = useDataStore()
  const { setMode, setTheme, setNodes, setEdges, setMutations, setLayout, setSpatial } = useUIStore()
  const theme = useUIStore(state => state.theme)
  const mode = useUIStore(state => state.mode)

  const { setBounds, setFiltersExpanded, setGenomicRange, setTemporalRange, setGenomicExpanded, setTemporalExpanded } = useFilterStore()
  const genomicExpanded = useFilterStore((state) => state.genomicExpanded)
  const temporalExpanded = useFilterStore((state) => state.temporalExpanded)

  // Animation
  useAnimationLoop()
  const animationConfig = useAnimationStore(state => state.config)

  // Minimal mode hides the QuickActionsBar (for notebook display)
  const isMinimal = vizOptions.minimal === true

  // Measure actual container size
  const containerRef = useRef<HTMLDivElement>(null)
  const [containerSize, setContainerSize] = useState({ width: 0, height: 0 })

  useEffect(() => {
    const updateSize = () => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect()
        setContainerSize({ width: rect.width, height: rect.height })
      }
    }

    updateSize()
    window.addEventListener('resize', updateSize)

    // Also observe the container for size changes (for iframe/notebook environments)
    const resizeObserver = new ResizeObserver(updateSize)
    if (containerRef.current) {
      resizeObserver.observe(containerRef.current)
    }

    return () => {
      window.removeEventListener('resize', updateSize)
      resizeObserver.disconnect()
    }
  }, [])

  // Initialize stores from options
  useEffect(() => {
    setRawData(graphData)
    setMode(vizOptions.mode)
    setTheme(vizOptions.theme)

    if (vizOptions.initialState) {
      const { nodes, edges, mutations, layout, spatial, focal, filters } = vizOptions.initialState
      if (nodes) setNodes(nodes)
      if (edges) setEdges(edges)
      if (mutations) setMutations(mutations)
      if (layout) setLayout(layout)
      if (spatial) setSpatial(spatial)

      // Initialize focal node view if specified
      if (focal?.nodeId !== null && focal?.nodeId !== undefined && focal?.mode) {
        setViewMode(focal.mode, focal.nodeId)
      }

      // Initialize active filters if specified
      if (filters) {
        if (filters.activeGenomicFilter && graphData.metadata) {
          // Set genomic range to full sequence and expand the filter
          setGenomicRange([0, graphData.metadata.sequence_length])
          setGenomicExpanded(true)
        }
        if (filters.activeTemporalFilter && graphData.metadata) {
          // Set temporal range to full time range and expand the filter
          const minTime = graphData.metadata.min_time ?? 0
          const maxTime = graphData.metadata.max_time ?? 0
          setTemporalRange([minTime, maxTime])
          setTemporalExpanded(true)
        }
      }
    }

    // Initialize filter bounds from metadata
    if (graphData.metadata) {
      setBounds({
        sequenceLength: graphData.metadata.sequence_length,
        numTrees: graphData.metadata.num_trees,
        minTime: graphData.metadata.min_time ?? 0,
        maxTime: graphData.metadata.max_time ?? 0,
      })
    }

    // Set initial filter expanded state
    if (vizOptions.filtersExpanded !== undefined) {
      setFiltersExpanded(vizOptions.filtersExpanded)
    }

    // Initialize animation if configured
    if ((vizOptions as any).animation) {
      useAnimationStore.getState().setConfig((vizOptions as any).animation)
    }
  }, [graphData, vizOptions, setRawData, setViewMode, setMode, setTheme, setNodes, setEdges, setMutations, setLayout, setSpatial, setBounds, setFiltersExpanded, setGenomicRange, setTemporalRange, setGenomicExpanded, setTemporalExpanded])

  // Use measured container size, falling back to vizOptions or defaults
  const width = containerSize.width || vizOptions.width || 1200
  const height = containerSize.height || vizOptions.height || 800

  // Calculate visualization offsets for filter panels
  const leftOffset = temporalExpanded ? 64 : 16
  const bottomOffset = genomicExpanded ? 80 : 16

  // Effective dimensions for the visualization (accounting for filter panels)
  const vizWidth = Math.max(100, width - leftOffset)
  const vizHeight = Math.max(100, height - bottomOffset)

  if (!theme) {
    return (
      <div
        ref={containerRef}
        style={{
          width: '100%',
          height: '100%',
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
    <div ref={containerRef} style={{ width: '100%', height: '100%', position: 'relative' }}>
      {/* Visualization container with offsets for filter panels */}
      <div
        id="visualization-container"
        style={{
          position: 'absolute',
          top: 0,
          left: leftOffset,
          right: 0,
          bottom: bottomOffset,
        }}
      >
        {containerSize.width > 0 && containerSize.height > 0 && (
          <>
            {mode === 'force_graph' && (
              <ForceGraph width={vizWidth} height={vizHeight} />
            )}
            {mode === 'spatial_3d' && (
              <Spatial3D width={vizWidth} height={vizHeight} />
            )}
          </>
        )}
      </div>

      {/* Filter components - always visible */}
      <TemporalFilter />
      <GenomicFilter />

      {/* Animation controls */}
      {animationConfig && <AnimationPopout minimal={isMinimal} />}

      {!isMinimal && <QuickActionsBar />}
      {!isMinimal && <LegendCard />}
      {/* ViewModeHeader shows in both modes when viewing subARG/ancestors */}
      <ViewModeHeader />
    </div>
  )
}
