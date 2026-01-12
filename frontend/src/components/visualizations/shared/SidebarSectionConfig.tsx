/**
 * Centralized sidebar section configuration for all visualizers
 * Ensures uniform section structure, icons, and ordering across:
 * - ForceDirectedGraph (2D)
 * - SpatialArg3D (3D)
 * - SpatialArgDiff (Diff)
 */

import React from 'react';

export interface SectionIcon {
  svg: React.ReactNode;
}

/**
 * Standard section IDs used across visualizers
 */
export const SECTION_IDS = {
  // Diff-specific
  DIFF_CONTROLS: 'diff-controls',
  DIFF_STATISTICS: 'diff-statistics',
  POPULATION_STATISTICS: 'population-statistics',
  
  // Visualization & Layout
  VISUALIZATION: 'visualization',
  LAYOUT: 'layout',
  
  // View & Camera
  VIEW_CONTROLS: 'view-controls',
  
  // Elements
  ELEMENTS: 'elements',
  NODES: 'nodes',
  EDGES: 'edges',
  
  // Performance
  PERFORMANCE: 'performance',
  
  // Info & Stats
  INFORMATION: 'information',
  STATISTICS: 'statistics',
} as const;

/**
 * Standard section icons
 */
export const SECTION_ICONS = {
  DIFF_CONTROLS: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
    </svg>
  ),
  
  STATISTICS: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
    </svg>
  ),
  
  VISUALIZATION: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  
  LAYOUT: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5a1 1 0 011-1h4a1 1 0 011 1v7a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM14 5a1 1 0 011-1h4a1 1 0 011 1v7a1 1 0 01-1 1h-4a1 1 0 01-1-1V5zM4 16a1 1 0 011-1h4a1 1 0 011 1v3a1 1 0 01-1 1H5a1 1 0 01-1-1v-3zM14 16a1 1 0 011-1h4a1 1 0 011 1v3a1 1 0 01-1 1h-4a1 1 0 01-1-1v-3z" />
    </svg>
  ),
  
  VIEW_CONTROLS: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
    </svg>
  ),
  
  ELEMENTS: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
    </svg>
  ),
  
  NODES: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
    </svg>
  ),
  
  EDGES: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
    </svg>
  ),
  
  PERFORMANCE: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
    </svg>
  ),
  
  INFORMATION: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
} as const;

/**
 * Standard section titles
 */
export const SECTION_TITLES = {
  DIFF_CONTROLS: 'Diff Controls',
  DIFF_STATISTICS: 'Diff Statistics',
  POPULATION_STATISTICS: 'Population Genetics',
  VISUALIZATION: 'Visualization',
  LAYOUT: 'Layout & Spacing',
  VIEW_CONTROLS: 'View Controls',
  ELEMENTS: 'Elements',
  NODES: 'Nodes',
  EDGES: 'Edges',
  PERFORMANCE: 'Performance',
  INFORMATION: 'Information',
  STATISTICS: 'Statistics',
} as const;

/**
 * Default section states
 */
export const SECTION_DEFAULTS = {
  // Diff sections - open by default for quick access
  DIFF_CONTROLS: true,
  DIFF_STATISTICS: true,
  POPULATION_STATISTICS: false,
  
  // Primary controls - typically closed to reduce clutter
  VISUALIZATION: false,
  LAYOUT: false,
  VIEW_CONTROLS: false,
  
  // Element controls - closed by default
  ELEMENTS: false,
  NODES: false,
  EDGES: false,
  
  // Performance - depends on context (auto-enabled state)
  PERFORMANCE: false,
  
  // Information - closed by default
  INFORMATION: false,
  STATISTICS: false,
} as const;

/**
 * Recommended section ordering for each visualizer type
 */
export const SECTION_ORDER = {
  // 2D Force-Directed Graph
  FORCE_DIRECTED: [
    SECTION_IDS.LAYOUT,
    SECTION_IDS.NODES,
    SECTION_IDS.EDGES,
    SECTION_IDS.VIEW_CONTROLS,
    SECTION_IDS.PERFORMANCE,
    SECTION_IDS.INFORMATION,
  ],
  
  // 3D Spatial ARG
  SPATIAL_3D: [
    SECTION_IDS.VISUALIZATION,
    SECTION_IDS.VIEW_CONTROLS,
    SECTION_IDS.ELEMENTS,
    SECTION_IDS.STATISTICS,
    SECTION_IDS.INFORMATION,
  ],
  
  // Diff Visualization
  DIFF: [
    SECTION_IDS.DIFF_CONTROLS,
    SECTION_IDS.DIFF_STATISTICS,
    SECTION_IDS.POPULATION_STATISTICS,
    SECTION_IDS.VISUALIZATION,
    SECTION_IDS.VIEW_CONTROLS,
    SECTION_IDS.ELEMENTS,
    SECTION_IDS.INFORMATION,
  ],
} as const;

/**
 * Helper function to create a section configuration
 */
export function createSectionConfig(
  id: string,
  title: string,
  icon: React.ReactNode,
  content: React.ReactNode,
  defaultOpen: boolean = false
) {
  return {
    id,
    title,
    icon,
    content,
    defaultOpen,
  };
}

