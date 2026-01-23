import { create } from 'zustand'

export type TemporalAnimationMode = 'hide' | 'glide' | 'root-to-samples'

export interface TemporalAnimationConfig {
  type: 'temporal'
  mode: TemporalAnimationMode
  rate: number
}

export interface GenomicAnimationConfig {
  type: 'genomic'
  window: number | null
  window_trees: number | null
  step: number | null
  overlap: number | null
  rate: number
}

export interface AnimationConfig {
  temporal?: TemporalAnimationConfig
  genomic?: GenomicAnimationConfig
}

export interface AnimationState {
  // Configuration (from Python)
  config: AnimationConfig | null

  // Active animation type
  activeType: 'temporal' | 'genomic' | null

  // Playback state
  isPlaying: boolean
  isPaused: boolean
  progress: number  // 0 to 1

  // Temporal animation state
  temporalMode: TemporalAnimationMode
  temporalRate: number

  // Genomic animation state
  genomicRate: number
  currentGenomicPosition: number

  // UI state
  isExpanded: boolean

  // Actions
  setConfig: (config: AnimationConfig | null) => void
  setActiveType: (type: 'temporal' | 'genomic' | null) => void
  start: () => void
  pause: () => void
  resume: () => void
  reset: () => void
  setProgress: (progress: number) => void
  setTemporalMode: (mode: TemporalAnimationMode) => void
  setTemporalRate: (rate: number) => void
  setGenomicRate: (rate: number) => void
  setCurrentGenomicPosition: (position: number) => void
  setExpanded: (expanded: boolean) => void
}

export const useAnimationStore = create<AnimationState>((set) => ({
  // Initial state
  config: null,
  activeType: null,
  isPlaying: false,
  isPaused: false,
  progress: 0,
  temporalMode: 'glide',
  temporalRate: 1.0,
  genomicRate: 1.0,
  currentGenomicPosition: 0,
  isExpanded: false,

  // Actions
  setConfig: (config) => {
    // Initialize from config
    const temporal = config?.temporal
    const genomic = config?.genomic

    set({
      config,
      activeType: temporal ? 'temporal' : genomic ? 'genomic' : null,
      temporalMode: temporal?.mode ?? 'glide',
      temporalRate: temporal?.rate ?? 1.0,
      genomicRate: genomic?.rate ?? 1.0,
    })
  },

  setActiveType: (type) => set({ activeType: type }),

  start: () => set({
    isPlaying: true,
    isPaused: false,
    progress: 0,
  }),

  pause: () => set({
    isPlaying: false,
    isPaused: true,
  }),

  resume: () => set({
    isPlaying: true,
    isPaused: false,
  }),

  reset: () => set({
    isPlaying: false,
    isPaused: false,
    progress: 0,
    currentGenomicPosition: 0,
  }),

  setProgress: (progress) => set({ progress }),
  setTemporalMode: (mode) => set({ temporalMode: mode }),
  setTemporalRate: (rate) => set({ temporalRate: rate }),
  setGenomicRate: (rate) => set({ genomicRate: rate }),
  setCurrentGenomicPosition: (position) => set({ currentGenomicPosition: position }),
  setExpanded: (expanded) => set({ isExpanded: expanded }),
}))
