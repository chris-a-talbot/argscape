import type { Theme } from './theme'

export type SampleOrderType =
  | 'numeric'
  | 'first_minlex'
  | 'center_minlex'
  | 'consensus_minlex'
  | 'ancestral_path'
  | 'coalescence'
  | 'dagre'

export type TemporalSpacingMode = 'equal' | 'linear' | 'log'

export type ViewMode = 'full' | 'subarg' | 'ancestors'

export type VizMode = 'force_graph' | 'spatial_3d'

export interface NodesState {
  sampleSize: number
  internalSize: number
  rootSize: number
  showSampleIds: boolean
  showInternalIds: boolean
  showRootIds: boolean
  colorByPopulation: boolean
}

export interface EdgesState {
  width: number
  opacity: number
  showLabels: boolean
}

export interface MutationsState {
  show: boolean
  size: number
}

export interface LayoutState {
  sampleOrder: SampleOrderType
  temporalSpacing: TemporalSpacingMode
  verticalSpacing: number
  horizontalSpacing: number
}

export interface FilterState {
  genomicRange: [number, number] | null
  temporalRange: [number, number] | null
  treeRange: [number, number] | null
  mode: 'subset' | 'highlight'
  dimmedOpacity: number
}

export interface SpatialState {
  geoBase: 'unit_grid' | 'eastern_hemisphere'
  temporalMultiplier: number
  spatialMultiplier: number
  showHeatmap: boolean
  heatmapOpacity: number
  showAxisLines: boolean
  gridOpacity: number      // Opacity for temporal grid lines (0-1)
  shapeOpacity: number     // Opacity for geographic shape/shapefile (0-1)
}

export interface InitialState {
  nodes: NodesState
  edges: EdgesState
  mutations: MutationsState
  layout: LayoutState
  filter?: FilterState
  spatial?: SpatialState
}

export interface VizOptions {
  mode: VizMode
  theme: Theme
  width: number
  height: number
  initialState: InitialState
}
