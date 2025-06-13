/**
 * Frontend application constants
 * Centralizes magic numbers and configuration values for better maintainability
 */

// API Configuration
const getApiBaseUrl = () => {
  if (import.meta.env.VITE_API_URL) {
    console.log('Using VITE_API_URL:', import.meta.env.VITE_API_URL);
    return import.meta.env.VITE_API_URL;
  }

  // Always use /api as the base URL - the Vite proxy will handle the rest
  console.log('Using default API base: /api');
  return '/api';
};

export const API_CONFIG = {
  BASE_URL: getApiBaseUrl(),
  ENDPOINTS: {
    CREATE_SESSION: '/create-session',
    GET_SESSION: '/session',
    UPLOAD: '/upload-tree-sequence',
    UPLOADED_FILES: '/uploaded-files/',
    TREE_SEQUENCE_METADATA: '/tree-sequence-metadata',
    DELETE_TREE_SEQUENCE: '/tree-sequence',
    DOWNLOAD_TREE_SEQUENCE: '/download-tree-sequence',
    GRAPH_DATA: '/graph-data',
    INFER_LOCATIONS_FAST: '/infer-locations-fast',
    INFER_LOCATIONS_GAIA_QUADRATIC: '/infer-locations-gaia-quadratic',
    INFER_LOCATIONS_MIDPOINT: '/infer-locations-midpoint',
    INFER_LOCATIONS_SPARG: '/infer-locations-sparg',
    INFER_TIMES_TSDATE: '/infer-times-tsdate',
    SIMULATE_TREE_SEQUENCE: '/simulate-tree-sequence/',
  }
} as const;

// Visualization Defaults
export const VISUALIZATION_DEFAULTS = {
  // Graph dimensions
  DEFAULT_GRAPH_WIDTH: 800,
  DEFAULT_GRAPH_HEIGHT: 600,
  MIN_GRAPH_WIDTH: 800,
  MIN_GRAPH_HEIGHT: 600,
  DECK_GL_WIDTH: 1200,
  DECK_GL_HEIGHT: 800,
  DECK_GL_MIN_WIDTH: 800,
  DECK_GL_MIN_HEIGHT: 600,
  
  // Node styling
  SAMPLE_NODE_SIZE: 200,
  INTERNAL_NODE_SIZE: 150,
  COMBINED_NODE_SIZE: 100,
  
  // Colors (RGBA)
  SAMPLE_NODE_COLOR: [52, 235, 177, 255] as [number, number, number, number], // sp-pale-green
  COMBINED_NODE_COLOR: [80, 160, 175, 255] as [number, number, number, number], // Light blue-green
  INTERNAL_NODE_COLOR: [96, 160, 183, 255] as [number, number, number, number], // Light blue
  SELECTED_NODE_COLOR: [255, 255, 255, 255] as [number, number, number, number], // White
  EDGE_COLOR: [255, 255, 255, 100] as [number, number, number, number], // Semi-transparent white
  OUTLINE_COLOR: [3, 48, 62, 255] as [number, number, number, number], // Very dark blue
  
  // Margins and spacing
  
  // Animation timing
  LOADING_DOTS_INTERVAL: 420,
} as const;

// Sample Management
export const SAMPLE_LIMITS = {
  DEFAULT_MAX_SAMPLES: 25,
  MIN_SAMPLES: 2,
  WARNING_THRESHOLD: 25,
} as const;

// UI Constants
export const UI_CONSTANTS = {
  // Container classes
  MAIN_CONTAINER_CLASS: "max-w-7xl mx-auto h-[calc(100vh-3rem)]",
  GRAPH_CONTAINER_CLASS: "flex-1 relative min-h-[800px]",
  
  // Responsive breakpoints (matching Tailwind)
  BREAKPOINTS: {
    SM: 640,
    MD: 768,
    LG: 1024,
    XL: 1280,
    '2XL': 1536,
  },
  
  // Z-index layers
  Z_INDEX: {
    CONTROLS: 20,
    TOOLTIP: 30,
    MODAL: 40,
  }
} as const;

// Data Formatting
export const DATA_FORMAT = {
  // Number formatting thresholds
  MILLION_THRESHOLD: 1_000_000,
  THOUSAND_THRESHOLD: 1_000,
  SEQUENCE_STEP_DIVISOR: 1_000,
  
  // Precision
  DECIMAL_PLACES: 1,
  PERCENTAGE_PRECISION: 1,
} as const;

// File Types
export const FILE_TYPES = {
  ACCEPTED_FORMATS: {
    'application/octet-stream': ['.trees', '.tsz'],
    'application/x-trees': ['.trees'],
    'application/x-tsz': ['.tsz'],
  },
  CSV_FORMATS: {
    'text/csv': ['.csv'],
    'application/vnd.ms-excel': ['.csv'],
  },
  EXTENSIONS: {
    TREES: '.trees',
    TSZ: '.tsz',
    CSV: '.csv',
  }
} as const;

// Error Messages
export const ERROR_MESSAGES = {
  UPLOAD_FAILED: 'Upload failed',
  DOWNLOAD_FAILED: 'Download failed',
  FETCH_FAILED: 'Failed to fetch data',
  NO_SPATIAL_DATA: 'No spatial data found in this ARG. This visualization requires nodes with 2D spatial coordinates.',
  NO_SPATIAL_RANGE: 'No spatial data found in this genomic range.',
  UNKNOWN_ERROR: 'Unknown error occurred',
} as const; 