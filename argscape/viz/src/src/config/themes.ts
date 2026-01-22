import type { Theme } from '@/types'

// Theme definitions - must match Python themes.py exactly
export const THEMES: Record<string, Theme> = {
  tskit: {
    name: 'tskit',
    background: '#03303E',
    nodes: {
      sample: '#14E2A8',
      internal: '#60A0B7',
      root: '#38BDF8',
      cluster: '#9333EA',
      selected: '#ffffff',
    },
    edges: {
      default: '#999999',
      highlight: '#ffffff',
      dimmed: '#4a5568',
    },
    text: '#ffffff',
    text_secondary: '#14E2A8',
    grid: '#14E2A8',
    mutation: '#4F46E5',
    mutation_unknown: '#6366F1',
  },
  liquid: {
    name: 'liquid',
    background: '#f5f5f7',
    nodes: {
      sample: '#14E2A8',
      internal: '#94A3B8',
      root: '#14E2A8',
      cluster: '#94A3B8',
      selected: '#14E2A8',
    },
    edges: {
      default: '#94A3B8',
      highlight: '#14E2A8',
      dimmed: '#CBD5E1',
    },
    text: '#1d1d1f',
    text_secondary: '#6e6e73',
    grid: '#14E2A8',
    mutation: '#4F46E5',
    mutation_unknown: '#6366F1',
  },
  grayscale: {
    name: 'grayscale',
    background: '#ffffff',
    nodes: {
      sample: '#464646',
      internal: '#646464',
      root: '#323232',
      cluster: '#505050',
      selected: '#000000',
    },
    edges: {
      default: '#8C8C8C',
      highlight: '#282828',
      dimmed: '#cccccc',
    },
    text: '#212529',
    text_secondary: '#6c757d',
    grid: '#8C8C8C',
    mutation: '#4a4a4a',
    mutation_unknown: '#6a6a6a',
  },
  paper: {
    name: 'paper',
    background: '#ffffff',
    nodes: {
      sample: '#2563eb',
      internal: '#6b7280',
      root: '#dc2626',
      cluster: '#9ca3af',
      selected: '#f59e0b',
    },
    edges: {
      default: '#374151',
      highlight: '#2563eb',
      dimmed: '#d1d5db',
    },
    text: '#111827',
    text_secondary: '#4b5563',
    grid: '#e5e7eb',
    mutation: '#ea580c',
    mutation_unknown: '#f97316',
  },
}

export const THEME_OPTIONS = [
  { value: 'tskit', label: 'Tskit (Dark)' },
  { value: 'liquid', label: 'Liquid (Light)' },
  { value: 'grayscale', label: 'Grayscale' },
  { value: 'paper', label: 'Paper' },
]

export function getTheme(name: string): Theme {
  return THEMES[name] || THEMES.tskit
}
