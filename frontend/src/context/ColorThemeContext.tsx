import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';

/**
 * Convert hex color to HSL format for CSS variables.
 * @param hex - Hex color string (e.g., "#14E2A8")
 * @returns HSL string in format "210 40% 98%" (without hsl() wrapper)
 */
function hexToHsl(hex: string): string {
  // Remove # if present
  const cleanHex = hex.replace('#', '');
  
  // Parse hex to RGB
  const r = parseInt(cleanHex.substr(0, 2), 16) / 255;
  const g = parseInt(cleanHex.substr(2, 2), 16) / 255;
  const b = parseInt(cleanHex.substr(4, 2), 16) / 255;
  
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0, s = 0, l = (max + min) / 2;
  
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    
    switch (max) {
      case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
      case g: h = ((b - r) / d + 2) / 6; break;
      case b: h = ((r - g) / d + 4) / 6; break;
    }
  }
  
  // Return in format: "210 40% 98%"
  return `${Math.round(h * 360)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`;
}

export type ColorTheme = 'tskit' | 'grayscale' | 'grayscaleInverted' | 'liquid' | 'custom';

export interface CustomColorScheme {
  name: string;
  id: string;
  colors: ColorScheme;
}

export interface ColorScheme {
  // Background colors
  background: string;
  containerBackground: string;
  
  // Node colors
  nodeDefault: [number, number, number, number];
  nodeRoot: [number, number, number, number];
  nodeSample: [number, number, number, number];
  nodeCombined: [number, number, number, number];
  nodeSelected: [number, number, number, number];
  nodeClusterSample: [number, number, number, number]; // Sample cluster nodes
  nodeClusterRegular: [number, number, number, number]; // Regular cluster nodes
  
  // Edge colors
  edgeDefault: [number, number, number, number];
  edgeHighlight: [number, number, number, number];
  edgeClusterSample: [number, number, number, number]; // Sample cluster edges
  
  // Mutation marker color
  mutationMarker: [number, number, number, number];
  
  // UI colors
  text: string;
  textSecondary: string;
  border: string;
  
  // Export background
  exportBackground: string;
  
  // Accent colors for special elements
  accentPrimary: string;   // For "ARGscape" brand text
  accentSecondary: string; // For footer links and secondary accents
  
  // Geographic/temporal visualization colors
  geographicGrid: [number, number, number, number];
  temporalGrid: [number, number, number, number];
  
  // Tooltip colors
  tooltipBackground: string;
  tooltipText: string;
  
  // Additional UI text colors for better contrast control
  headerText: string;
  controlPanelText: string;
  buttonText: string;
  
  // Semantic UI colors for interactive states
  /** Success states, checkmarks, confirmations */
  success: string;
  /** Success button hover state */
  successHover: string;
  /** Warning states, caution indicators */
  warning: string;
  /** Warning button hover state */
  warningHover: string;
  /** Error states, delete actions, destructive operations */
  error: string;
  /** Error button hover state */
  errorHover: string;
  /** Info states, help indicators */
  info: string;
  /** Info button hover state */
  infoHover: string;
  
  // Interactive state colors
  /** Active nav items, selected states, current selections */
  activeHighlight: string;
  /** Hover state overlay (typically rgba for transparency) */
  hoverOverlay: string;
  /** Focus rings for keyboard navigation accessibility */
  focusRing: string;

  // Glass effect colors (for Liquid Glass UI)
  /** Primary glass shadow color - used in box-shadow for glass panels */
  glassShadowPrimary: string;
  /** Secondary glass shadow color - softer shadow for tooltips/dropdowns */
  glassShadowSecondary: string;
  /** Glass panel background - translucent background for glass effect */
  glassBackground: string;
  /** Glass border color - subtle border for glass panels */
  glassBorder: string;
  /** Glass shimmer/highlight color - for hover effects and highlights */
  glassShimmer: string;
}

const colorSchemes: Record<Exclude<ColorTheme, 'custom'>, ColorScheme> = {
  tskit: {
    background: '#03303E',
    containerBackground: '#0f1419',
    nodeDefault: [96, 160, 183, 255], // Original light blue for regular internal nodes
    nodeRoot: [56, 189, 248, 255], // Cyan for root nodes (matches cluster color scheme)
    nodeSample: [20, 226, 168, 255], // Original #14E2A8 pale green for samples
    nodeCombined: [80, 160, 175, 255], // Original light blue-green for combined nodes
    nodeSelected: [255, 255, 255, 255], // White for selected
    nodeClusterSample: [56, 189, 248, 179], // Cyan with transparency for sample clusters
    nodeClusterRegular: [147, 51, 234, 179], // Purple with transparency for regular clusters
    edgeDefault: [153, 153, 153, 102], // Original #999 with 0.4 opacity
    edgeHighlight: [255, 255, 255, 200],
    edgeClusterSample: [56, 189, 248, 255], // Cyan for sample cluster edges
    mutationMarker: [79, 70, 229, 255], // Indigo for mutation markers
    text: '#ffffff',
    textSecondary: '#14E2A8', // Classic sp-pale-green
    border: '#5a7a8a', // Lighter border for 3:1 contrast
    exportBackground: '#03303E',
    accentPrimary: '#14E2A8', // Same as textSecondary for consistency
    accentSecondary: '#14E2A8', // Same as textSecondary for consistency
    geographicGrid: [20, 226, 168, 102], // Pale green with transparency
    temporalGrid: [20, 226, 168, 77], // Pale green with less transparency
    tooltipBackground: 'rgba(5, 62, 78, 0.95)',
    tooltipText: '#ffffff',
    headerText: '#ffffff',
    controlPanelText: '#ffffff',
    buttonText: '#ffffff',
    
    // Semantic colors - maintaining tskit aesthetic
    success: '#14E2A8',        // Classic pale green
    successHover: '#1EEBB1',   // Lighter green hover
    warning: '#f59e0b',        // Amber 500
    warningHover: '#d97706',   // Amber 600
    error: '#ef4444',          // Red 500
    errorHover: '#dc2626',     // Red 600
    info: '#3b82f6',           // Blue 500
    infoHover: '#2563eb',      // Blue 600
    
    // Interactive states
    activeHighlight: '#14E2A8',           // Pale green
    hoverOverlay: 'rgba(255, 255, 255, 0.05)', // Light white overlay
    focusRing: '#14E2A8',                  // Pale green focus

    // Glass effect colors (dark theme - uses pale green accents)
    glassShadowPrimary: 'rgba(20, 226, 168, 0.15)',    // Green-tinted shadow
    glassShadowSecondary: 'rgba(20, 226, 168, 0.08)', // Softer green shadow
    glassBackground: 'rgba(3, 48, 62, 0.85)',         // Dark translucent
    glassBorder: 'rgba(20, 226, 168, 0.2)',           // Green-tinted border
    glassShimmer: 'rgba(20, 226, 168, 0.1)'           // Green shimmer
  },
  liquid: {
    background: '#f5f5f7', // Apple's light gray (not pure white)
    containerBackground: 'rgba(255, 255, 255, 0.8)', // More translucent glass
    nodeDefault: [148, 163, 184, 255], // Slate 400
    nodeRoot: [20, 226, 168, 255], // ARGscape Green
    nodeSample: [20, 226, 168, 255], // Classic ARGscape Green (#14E2A8)
    nodeCombined: [100, 116, 139, 255], // Slate 500
    nodeSelected: [20, 226, 168, 255], // Green for selected
    nodeClusterSample: [20, 226, 168, 150],
    nodeClusterRegular: [148, 163, 184, 150],
    edgeDefault: [148, 163, 184, 80], // Slate 400 with opacity
    edgeHighlight: [20, 226, 168, 200], // Green highlight
    edgeClusterSample: [20, 226, 168, 200],
    mutationMarker: [79, 70, 229, 255], // Indigo - visible on light bg, won't conflict with red diff bars
    text: '#1d1d1f', // Apple's near-black
    textSecondary: '#6e6e73', // Apple's gray
    border: 'rgba(20, 226, 168, 0.15)', // Lighter green-tinted border
    exportBackground: '#f5f5f7', // Match background
    accentPrimary: '#0a9d7e', // Darker green for contrast (3.01:1 on light bg)
    accentSecondary: '#087a62', // Even darker green for hover
    geographicGrid: [20, 226, 168, 50],
    temporalGrid: [20, 226, 168, 30],
    tooltipBackground: 'rgba(255, 255, 255, 0.95)', // White opaque
    tooltipText: '#1d1d1f', // Match text
    headerText: '#1d1d1f', // Match text
    controlPanelText: '#1d1d1f', // Match text
    buttonText: '#ffffff', // White text for buttons on green background
    
    // Semantic colors - Apple-inspired with ARGscape green (adjusted for accessibility)
    success: '#0a9d7e',        // Darker green for contrast (3.01:1)
    successHover: '#087a62',   // Even darker green hover
    warning: '#c87005',        // Darker orange for contrast (3.01:1)
    warningHover: '#b45309',   // Even darker orange hover
    error: '#dc2626',          // Darker red (4.55:1)
    errorHover: '#b91c1c',     // Even darker red hover
    info: '#0369a1',           // Darker blue for contrast (3.94:1)
    infoHover: '#075985',      // Even darker blue hover
    
    // Interactive states
    activeHighlight: '#0a9d7e',           // Darker green for active states
    hoverOverlay: 'rgba(10, 157, 126, 0.08)', // Darker green overlay
    focusRing: '#0a9d7e',                  // Darker green focus ring

    // Glass effect colors (light theme - Apple-inspired with green accents)
    glassShadowPrimary: 'rgba(20, 226, 168, 0.12)',    // Green-tinted shadow
    glassShadowSecondary: 'rgba(10, 157, 126, 0.15)', // Darker green for tooltips
    glassBackground: 'rgba(255, 255, 255, 0.8)',      // White translucent
    glassBorder: 'rgba(20, 226, 168, 0.15)',          // Subtle green border
    glassShimmer: 'rgba(255, 255, 255, 0.6)'          // White shimmer
  },
  grayscale: {
    background: '#ffffff',
    containerBackground: '#f8f9fa',
    nodeDefault: [100, 100, 100, 255], // Medium gray for internal nodes
    nodeRoot: [50, 50, 50, 255], // Dark gray for root nodes
    nodeSample: [70, 70, 70, 255], // Darker gray for samples
    nodeCombined: [120, 120, 120, 255], // Light gray for combined nodes
    nodeSelected: [0, 0, 0, 255], // Black for selected
    nodeClusterSample: [80, 80, 80, 179], // Dark gray with transparency for sample clusters
    nodeClusterRegular: [60, 60, 60, 179], // Darker gray with transparency for regular clusters
    edgeDefault: [140, 140, 140, 128], // Light gray edges with transparency
    edgeHighlight: [40, 40, 40, 200], // Dark gray highlighted edges
    edgeClusterSample: [80, 80, 80, 255], // Dark gray for sample cluster edges
    mutationMarker: [79, 70, 229, 255], // Indigo - consistent across all themes
    text: '#212529', // Dark gray text for good contrast on white
    textSecondary: '#6c757d', // Medium gray secondary text
    border: '#8b9299', // Darker gray border for 3:1 contrast
    exportBackground: '#ffffff',
    accentPrimary: '#085167', // Classic dark blue for "ARGscape" and key branding
    accentSecondary: '#085167', // Classic dark blue for footer links and accents
    geographicGrid: [140, 140, 140, 102], // Gray with transparency
    temporalGrid: [140, 140, 140, 77], // Gray with less transparency
    tooltipBackground: 'rgba(33, 37, 41, 0.95)', // Dark gray tooltip background
    tooltipText: '#ffffff',
    headerText: '#212529',
    controlPanelText: '#212529',
    buttonText: '#ffffff', // White text for buttons on dark blue background

    // Semantic colors - grayscale only
    success: '#4a5568',        // Slate 600
    successHover: '#2d3748',   // Slate 800
    warning: '#6b7280',        // Gray 500
    warningHover: '#4b5563',   // Gray 600
    error: '#1f2937',          // Gray 800
    errorHover: '#111827',     // Gray 900
    info: '#6b7280',           // Gray 500
    infoHover: '#4b5563',      // Gray 600

    // Interactive states
    activeHighlight: '#085167',           // Classic dark blue for accents
    hoverOverlay: 'rgba(0, 0, 0, 0.05)',  // Light gray overlay
    focusRing: '#085167',                  // Dark blue focus

    // Glass effect colors (grayscale - no colored shadows)
    glassShadowPrimary: 'rgba(0, 0, 0, 0.08)',        // Gray shadow
    glassShadowSecondary: 'rgba(0, 0, 0, 0.05)',     // Softer gray shadow
    glassBackground: 'rgba(255, 255, 255, 0.9)',     // Near-white translucent
    glassBorder: 'rgba(0, 0, 0, 0.1)',               // Gray border
    glassShimmer: 'rgba(255, 255, 255, 0.8)'         // White shimmer
  },
  grayscaleInverted: {
    background: '#121212', // Near-black background
    containerBackground: '#1e1e1e', // Dark container
    nodeDefault: [180, 180, 180, 255], // Light gray for internal nodes
    nodeRoot: [220, 220, 220, 255], // Near-white for root nodes
    nodeSample: [200, 200, 200, 255], // Light gray for samples
    nodeCombined: [160, 160, 160, 255], // Medium gray for combined nodes
    nodeSelected: [255, 255, 255, 255], // White for selected
    nodeClusterSample: [200, 200, 200, 179], // Light gray with transparency for sample clusters
    nodeClusterRegular: [220, 220, 220, 179], // Near-white with transparency for regular clusters
    edgeDefault: [120, 120, 120, 128], // Medium gray edges with transparency
    edgeHighlight: [230, 230, 230, 200], // Light highlighted edges
    edgeClusterSample: [200, 200, 200, 255], // Light gray for sample cluster edges
    mutationMarker: [79, 70, 229, 255], // Indigo for mutation markers
    text: '#f0f0f0', // Near-white text for good contrast on dark
    textSecondary: '#a0a0a0', // Medium gray secondary text
    border: '#4a4a4a', // Medium gray border for contrast
    exportBackground: '#121212',
    accentPrimary: '#14E2A8', // tskit light green for accents
    accentSecondary: '#14E2A8', // tskit light green for accents
    geographicGrid: [120, 120, 120, 102], // Gray with transparency
    temporalGrid: [120, 120, 120, 77], // Gray with less transparency
    tooltipBackground: 'rgba(240, 240, 240, 0.95)', // Light tooltip background
    tooltipText: '#121212', // Dark text on light tooltip
    headerText: '#f0f0f0',
    controlPanelText: '#f0f0f0',
    buttonText: '#121212', // Dark text for buttons on light green background

    // Semantic colors - inverted grayscale
    success: '#a0a0a0',        // Light gray
    successHover: '#c0c0c0',   // Lighter gray
    warning: '#909090',        // Medium gray
    warningHover: '#a8a8a8',   // Lighter gray
    error: '#d0d0d0',          // Light gray
    errorHover: '#e8e8e8',     // Near-white
    info: '#909090',           // Medium gray
    infoHover: '#a8a8a8',      // Lighter gray

    // Interactive states
    activeHighlight: '#14E2A8',           // tskit light green for accents
    hoverOverlay: 'rgba(255, 255, 255, 0.05)',  // Light white overlay
    focusRing: '#14E2A8',                  // Light green focus

    // Glass effect colors (dark grayscale)
    glassShadowPrimary: 'rgba(255, 255, 255, 0.08)',   // Light shadow
    glassShadowSecondary: 'rgba(255, 255, 255, 0.05)', // Softer light shadow
    glassBackground: 'rgba(30, 30, 30, 0.9)',          // Near-black translucent
    glassBorder: 'rgba(255, 255, 255, 0.1)',           // Light border
    glassShimmer: 'rgba(255, 255, 255, 0.15)'          // Light shimmer
  }
};

export type VisualizationType = 'force-directed' | 'spatial-3d' | 'spatial-diff' | 'any';

interface ColorThemeContextType {
  theme: ColorTheme;
  setTheme: (theme: ColorTheme) => void;
  colors: ColorScheme;
  customThemes: CustomColorScheme[];
  selectedCustomTheme: string | null;
  setSelectedCustomTheme: (id: string | null) => void;
  saveCustomTheme: (name: string, colors: ColorScheme) => void;
  deleteCustomTheme: (id: string) => void;
  updateCustomTheme: (id: string, name: string, colors: ColorScheme) => void;
  currentVisualizationType: VisualizationType;
  setCurrentVisualizationType: (type: VisualizationType) => void;
}

const ColorThemeContext = createContext<ColorThemeContextType | undefined>(undefined);

const STORAGE_KEY = 'argscape_custom_themes';
const SELECTED_THEME_KEY = 'argscape_selected_theme';
const SELECTED_CUSTOM_THEME_KEY = 'argscape_selected_custom_theme';

export const ColorThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setThemeState] = useState<ColorTheme>('liquid');
  const [customThemes, setCustomThemes] = useState<CustomColorScheme[]>([]);
  const [selectedCustomTheme, setSelectedCustomTheme] = useState<string | null>(null);
  const [currentVisualizationType, setCurrentVisualizationType] = useState<VisualizationType>('any');

  // Load saved themes and selections from localStorage
  useEffect(() => {
    try {
      const savedThemes = localStorage.getItem(STORAGE_KEY);
      if (savedThemes) {
        setCustomThemes(JSON.parse(savedThemes));
      }

      const savedTheme = localStorage.getItem(SELECTED_THEME_KEY);
      // Prioritize saved user preference, but default to 'liquid' (light theme) for new users
      if (savedTheme && (savedTheme === 'tskit' || savedTheme === 'grayscale' || savedTheme === 'grayscaleInverted' || savedTheme === 'liquid' || savedTheme === 'custom')) {
        setThemeState(savedTheme as ColorTheme);
      } else {
        // No saved preference - set to light theme by default
        setThemeState('liquid');
      }

      const savedCustomTheme = localStorage.getItem(SELECTED_CUSTOM_THEME_KEY);
      if (savedCustomTheme) {
        setSelectedCustomTheme(savedCustomTheme);
      }
    } catch (error) {
      console.warn('Failed to load saved color themes:', error);
      // On error, default to light theme
      setThemeState('liquid');
    }
  }, []);
  
  // Save theme selection to localStorage
  const setTheme = useCallback((newTheme: ColorTheme) => {
    setThemeState(newTheme);
    localStorage.setItem(SELECTED_THEME_KEY, newTheme);
  }, []);
  
  // Save custom theme selection to localStorage
  const setSelectedCustomThemeCallback = useCallback((id: string | null) => {
    setSelectedCustomTheme(id);
    if (id) {
      localStorage.setItem(SELECTED_CUSTOM_THEME_KEY, id);
    } else {
      localStorage.removeItem(SELECTED_CUSTOM_THEME_KEY);
    }
  }, []);
  
  const saveCustomTheme = useCallback((name: string, colors: ColorScheme) => {
    const id = `custom_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const newTheme: CustomColorScheme = { id, name, colors };
    
    setCustomThemes(prev => {
      const updated = [...prev, newTheme];
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      return updated;
    });
    
    // Auto-select the newly created theme
    setThemeState('custom');
    setSelectedCustomTheme(id);
    localStorage.setItem(SELECTED_THEME_KEY, 'custom');
    localStorage.setItem(SELECTED_CUSTOM_THEME_KEY, id);
    
    return id;
  }, []);
  
  const deleteCustomTheme = useCallback((id: string) => {
    setCustomThemes(prev => {
      const updated = prev.filter(theme => theme.id !== id);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      return updated;
    });
    
    // If the deleted theme was selected, clear the selection
    if (selectedCustomTheme === id) {
      setSelectedCustomTheme(null);
      localStorage.removeItem(SELECTED_CUSTOM_THEME_KEY);
    }
  }, [selectedCustomTheme]);
  
  const updateCustomTheme = useCallback((id: string, name: string, colors: ColorScheme) => {
    setCustomThemes(prev => {
      const updated = prev.map(theme => 
        theme.id === id ? { ...theme, name, colors } : theme
      );
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      return updated;
    });
  }, []);
  
  // Get current colors based on theme selection
  const colors = React.useMemo(() => {
    if (theme === 'custom' && selectedCustomTheme) {
      const customTheme = customThemes.find(t => t.id === selectedCustomTheme);
      if (customTheme) {
        return customTheme.colors;
      }
    }
    
    return colorSchemes[theme as Exclude<ColorTheme, 'custom'>] || colorSchemes.tskit;
  }, [theme, selectedCustomTheme, customThemes]);
  
  // Sync theme colors to CSS variables for Tailwind/shadcn components
  useEffect(() => {
    const root = document.documentElement;
    
    // Map theme colors to CSS variables
    try {
      // Core colors
      root.style.setProperty('--background', hexToHsl(colors.background));
      root.style.setProperty('--foreground', hexToHsl(colors.text));
      
      // Primary accent
      root.style.setProperty('--primary', hexToHsl(colors.accentPrimary));
      root.style.setProperty('--primary-foreground', hexToHsl(colors.buttonText));
      
      // Borders and inputs
      root.style.setProperty('--border', hexToHsl(colors.border.includes('rgba') ? colors.textSecondary : colors.border));
      root.style.setProperty('--input', hexToHsl(colors.border.includes('rgba') ? colors.textSecondary : colors.border));
      
      // Ring (focus)
      root.style.setProperty('--ring', hexToHsl(colors.focusRing || colors.accentPrimary));
      
      // Card (container)
      root.style.setProperty('--card', hexToHsl(colors.containerBackground.includes('rgba') ? colors.background : colors.containerBackground));
      root.style.setProperty('--card-foreground', hexToHsl(colors.text));
      
      // Muted
      root.style.setProperty('--muted', hexToHsl(colors.containerBackground.includes('rgba') ? colors.background : colors.containerBackground));
      root.style.setProperty('--muted-foreground', hexToHsl(colors.textSecondary));
      
      // Accent
      root.style.setProperty('--accent', hexToHsl(colors.accentSecondary));
      root.style.setProperty('--accent-foreground', hexToHsl(colors.buttonText));
      
      // Destructive
      root.style.setProperty('--destructive', hexToHsl(colors.error));
      root.style.setProperty('--destructive-foreground', hexToHsl(colors.buttonText));

      // Slider accent colors (used by index.css slider styling)
      root.style.setProperty('--slider-accent', colors.accentPrimary);
      root.style.setProperty('--slider-accent-hover', colors.successHover || colors.accentSecondary);
      // Extract RGB values for slider shadows
      const accentRgb = colorStringToRgbaArray(colors.accentPrimary);
      root.style.setProperty('--slider-accent-rgb', `${accentRgb[0]}, ${accentRgb[1]}, ${accentRgb[2]}`);

    } catch (error) {
      console.warn('Failed to sync CSS variables:', error);
    }
  }, [colors]);
  
  const value = {
    theme,
    setTheme,
    colors,
    customThemes,
    selectedCustomTheme,
    setSelectedCustomTheme: setSelectedCustomThemeCallback,
    saveCustomTheme,
    deleteCustomTheme,
    updateCustomTheme,
    currentVisualizationType,
    setCurrentVisualizationType
  };
  
  return (
    <ColorThemeContext.Provider value={value}>
      {children}
    </ColorThemeContext.Provider>
  );
};

export const useColorTheme = () => {
  const context = useContext(ColorThemeContext);
  if (context === undefined) {
    throw new Error('useColorTheme must be used within a ColorThemeProvider');
  }
  return context;
};

// Utility function to convert CSS color string to RGBA array
export const colorStringToRgbaArray = (color: string): [number, number, number, number] => {
  // Handle hex colors
  if (color.startsWith('#')) {
    const hex = color.slice(1);
    const r = parseInt(hex.substr(0, 2), 16);
    const g = parseInt(hex.substr(2, 2), 16);
    const b = parseInt(hex.substr(4, 2), 16);
    return [r, g, b, 255];
  }
  
  // Handle rgba colors
  const rgbaMatch = color.match(/rgba?\(([^)]+)\)/);
  if (rgbaMatch) {
    const values = rgbaMatch[1].split(',').map(v => parseFloat(v.trim()));
    return [
      Math.round(values[0]),
      Math.round(values[1]),
      Math.round(values[2]),
      Math.round((values[3] ?? 1) * 255)
    ];
  }
  
  // Default fallback
  return [128, 128, 128, 255];
};

// Define which colors are primary for each visualization type
export const getPrimaryColors = (visualizationType: VisualizationType): (keyof ColorScheme)[] => {
  const commonColors = [
    'background',
    'nodeSample',
    'nodeRoot',
    'nodeDefault',
    'edgeDefault'
  ] as (keyof ColorScheme)[];

  switch (visualizationType) {
    case 'force-directed':
      return [
        ...commonColors,
        'nodeClusterSample',
        'nodeClusterRegular',
        'edgeClusterSample',
        'mutationMarker'
      ];
      
    case 'spatial-3d':
      return [
        ...commonColors,
        'geographicGrid',
        'temporalGrid'
      ];
      
    case 'spatial-diff':
      return [
        ...commonColors,
        'geographicGrid',
        'temporalGrid'
      ];
      
    case 'any':
    default:
      return [
        ...commonColors,
        'geographicGrid',
        'temporalGrid'
      ];
  }
};

// Define which colors should be moved to "other colors" for each visualization type
export const getOtherColors = (visualizationType: VisualizationType): (keyof ColorScheme)[] => {
  // All possible color keys
  const allColorKeys: (keyof ColorScheme)[] = [
    'background',
    'containerBackground',
    'nodeDefault',
    'nodeRoot',
    'nodeSample',
    'nodeCombined',
    'nodeSelected',
    'nodeClusterSample',
    'nodeClusterRegular',
    'edgeDefault',
    'edgeHighlight',
    'edgeClusterSample',
    'mutationMarker',
    'text',
    'textSecondary',
    'border',
    'exportBackground',
    'accentPrimary',
    'accentSecondary',
    'geographicGrid',
    'temporalGrid',
    'tooltipBackground',
    'tooltipText',
    'headerText',
    'controlPanelText',
    'buttonText',
    'success',
    'successHover',
    'warning',
    'warningHover',
    'error',
    'errorHover',
    'info',
    'infoHover',
    'activeHighlight',
    'hoverOverlay',
    'focusRing',
    'glassShadowPrimary',
    'glassShadowSecondary',
    'glassBackground',
    'glassBorder',
    'glassShimmer'
  ];

  const primaryColors = getPrimaryColors(visualizationType);
  
  return allColorKeys.filter(color => !primaryColors.includes(color));
};

// Utility function to convert RGBA array to hex string
export const rgbaArrayToHex = (rgba: [number, number, number, number]): string => {
  return `#${rgba[0].toString(16).padStart(2, '0')}${rgba[1].toString(16).padStart(2, '0')}${rgba[2].toString(16).padStart(2, '0')}`;
};

// Calculate contrast ratio between two colors (WCAG standard)
export const calculateContrastRatio = (color1: string, color2: string): number => {
  const getLuminance = (color: string): number => {
    // Handle both #RRGGBB and #RGB formats
    let hex = color.replace('#', '');
    if (hex.length === 3) {
      hex = hex.split('').map(char => char + char).join('');
    }
    
    if (hex.length !== 6) {
      return 0;
    }
    
    const r = parseInt(hex.substr(0, 2), 16) / 255;
    const g = parseInt(hex.substr(2, 2), 16) / 255;
    const b = parseInt(hex.substr(4, 2), 16) / 255;
    
    const toLinear = (c: number) => c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
    
    return 0.2126 * toLinear(r) + 0.7152 * toLinear(g) + 0.0722 * toLinear(b);
  };

  if (!color1 || !color2) {
    return 21; // Max contrast if invalid
  }

  const lum1 = getLuminance(color1);
  const lum2 = getLuminance(color2);
  const brightest = Math.max(lum1, lum2);
  const darkest = Math.min(lum1, lum2);
  
  return (brightest + 0.05) / (darkest + 0.05);
};

// Ensure safe color contrast (minimum 3:1 ratio for UI elements, 4.5:1 for text)
export const ensureSafeContrast = (
  foreground: string | [number, number, number, number],
  background: string,
  minRatio: number = 3.0
): string => {
  const bgHex = background.startsWith('#') ? background : `#${background}`;
  
  // Convert foreground to hex if it's an RGBA array
  let fgHex: string;
  if (Array.isArray(foreground)) {
    fgHex = rgbaArrayToHex(foreground);
  } else {
    fgHex = foreground.startsWith('#') ? foreground : `#${foreground}`;
  }
  
  const contrast = calculateContrastRatio(fgHex, bgHex);
  
  if (contrast >= minRatio) {
    return Array.isArray(foreground) ? rgbaArrayToHex(foreground) : fgHex;
  }
  
  // Need to adjust - try lighter/darker versions
  // For now, return a high-contrast version
  // This is a simplified approach - in production you might want more sophisticated color adjustment
  const bgLum = calculateContrastRatio(bgHex, '#000000') > 10 ? 1 : 0; // Light or dark background
  
  if (bgLum > 0.5) {
    // Light background - return dark color
    return '#000000';
  } else {
    // Dark background - return light color
    return '#ffffff';
  }
}; 