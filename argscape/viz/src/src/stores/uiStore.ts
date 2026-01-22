import { create } from 'zustand'
import type {
  Theme,
  NodesState,
  EdgesState,
  MutationsState,
  LayoutState,
  SpatialState,
  VizMode,
} from '@/types'

type PanelId = 'filter' | 'nodes' | 'edges' | 'mutations' | 'layout' | 'stats' | 'export' | 'camera' | 'spatial' | 'theme'

interface UIState {
  // Visualization mode
  mode: VizMode

  // Theme
  theme: Theme | null

  // Panel visibility
  activePanel: PanelId | null

  // Node settings
  nodes: NodesState

  // Edge settings
  edges: EdgesState

  // Mutation settings
  mutations: MutationsState

  // Layout settings
  layout: LayoutState

  // Spatial settings (3D)
  spatial: SpatialState

  // Legend
  showLegend: boolean

  // Actions
  setMode: (mode: VizMode) => void
  setTheme: (theme: Theme) => void
  setActivePanel: (panel: PanelId | null) => void
  togglePanel: (panel: PanelId) => void
  setNodes: (nodes: Partial<NodesState>) => void
  setEdges: (edges: Partial<EdgesState>) => void
  setMutations: (mutations: Partial<MutationsState>) => void
  setLayout: (layout: Partial<LayoutState>) => void
  setSpatial: (spatial: Partial<SpatialState>) => void
  setShowLegend: (show: boolean) => void
}

const defaultNodes: NodesState = {
  sampleSize: 8,
  internalSize: 4,
  rootSize: 6,
  showSampleIds: false,
  showInternalIds: false,
  showRootIds: false,
  colorByPopulation: false,
}

const defaultEdges: EdgesState = {
  width: 1,
  opacity: 0.6,
  showLabels: false,
}

const defaultMutations: MutationsState = {
  show: false,
  size: 6,
}

const defaultLayout: LayoutState = {
  sampleOrder: 'consensus_minlex',
  temporalSpacing: 'equal',
  verticalSpacing: 100, // Percentage of available height (0-100)
  horizontalSpacing: 100, // Percentage of available width (0-100)
}

const defaultSpatial: SpatialState = {
  geoBase: 'unit_grid',
  temporalMultiplier: 12,  // Match web app default for proper temporal spacing
  spatialMultiplier: 160,  // Match web app default
  showHeatmap: false,
  heatmapOpacity: 0.5,
  showAxisLines: true,  // Show temporal axis lines by default
  gridOpacity: 0.25,    // 25% opacity for temporal grid
  shapeOpacity: 0.6,    // 60% opacity for geographic shape
}

export const useUIStore = create<UIState>((set) => ({
  mode: 'force_graph',
  theme: null,
  activePanel: null,
  nodes: defaultNodes,
  edges: defaultEdges,
  mutations: defaultMutations,
  layout: defaultLayout,
  spatial: defaultSpatial,
  showLegend: true,

  setMode: (mode) => set({ mode }),
  setTheme: (theme) => set({ theme }),
  setActivePanel: (panel) => set({ activePanel: panel }),
  togglePanel: (panel) => set((state) => ({
    activePanel: state.activePanel === panel ? null : panel
  })),
  setNodes: (updates) => set((state) => ({
    nodes: { ...state.nodes, ...updates }
  })),
  setEdges: (updates) => set((state) => ({
    edges: { ...state.edges, ...updates }
  })),
  setMutations: (updates) => set((state) => ({
    mutations: { ...state.mutations, ...updates }
  })),
  setLayout: (updates) => set((state) => ({
    layout: { ...state.layout, ...updates }
  })),
  setSpatial: (updates) => set((state) => ({
    spatial: { ...state.spatial, ...updates }
  })),
  setShowLegend: (show) => set({ showLegend: show }),
}))
