import { create } from 'zustand'

export type GenomicMode = 'position' | 'tree'
export type TemporalFilterMode = 'dim' | 'subset'

export interface FilterState {
  // Genomic filter
  genomicMode: GenomicMode
  genomicRange: [number, number] | null
  genomicExpanded: boolean
  genomicDimOpacity: number

  // Temporal filter
  temporalRange: [number, number] | null
  temporalExpanded: boolean
  temporalDimOpacity: number
  temporalFilterMode: TemporalFilterMode  // 'dim' = dim only, 'subset' = hide nodes outside range

  // Bounds (set from metadata)
  sequenceLength: number
  numTrees: number
  minTime: number
  maxTime: number

  // Actions
  setGenomicMode: (mode: GenomicMode) => void
  setGenomicRange: (range: [number, number] | null) => void
  setGenomicExpanded: (expanded: boolean) => void
  setGenomicDimOpacity: (opacity: number) => void

  setTemporalRange: (range: [number, number] | null) => void
  setTemporalExpanded: (expanded: boolean) => void
  setTemporalDimOpacity: (opacity: number) => void
  setTemporalFilterMode: (mode: TemporalFilterMode) => void

  setBounds: (bounds: {
    sequenceLength: number
    numTrees: number
    minTime: number
    maxTime: number
  }) => void

  setFiltersExpanded: (expanded: boolean) => void
  resetFilters: () => void
}

export const useFilterStore = create<FilterState>((set) => ({
  // Initial state
  genomicMode: 'position',
  genomicRange: null,
  genomicExpanded: true,
  genomicDimOpacity: 0.3,

  temporalRange: null,
  temporalExpanded: true,
  temporalDimOpacity: 0.25,  // 25% opacity for dimmed nodes (more visible)
  temporalFilterMode: 'dim',  // Default to dim-only mode

  sequenceLength: 0,
  numTrees: 0,
  minTime: 0,
  maxTime: 0,

  // Actions
  setGenomicMode: (mode) => set({ genomicMode: mode }),
  setGenomicRange: (range) => set({ genomicRange: range }),
  setGenomicExpanded: (expanded) => set({ genomicExpanded: expanded }),
  setGenomicDimOpacity: (opacity) => set({ genomicDimOpacity: opacity }),

  setTemporalRange: (range) => set({ temporalRange: range }),
  setTemporalExpanded: (expanded) => set({ temporalExpanded: expanded }),
  setTemporalDimOpacity: (opacity) => set({ temporalDimOpacity: opacity }),
  setTemporalFilterMode: (mode) => set({ temporalFilterMode: mode }),

  setBounds: (bounds) => set(bounds),

  setFiltersExpanded: (expanded) =>
    set({
      genomicExpanded: expanded,
      temporalExpanded: expanded,
    }),

  resetFilters: () =>
    set({
      genomicRange: null,
      temporalRange: null,
    }),
}))
