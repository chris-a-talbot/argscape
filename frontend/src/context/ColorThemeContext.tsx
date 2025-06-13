import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';

export type ColorTheme = 'tskit' | 'grayscale' | 'custom';

export interface CustomColorScheme {
  name: string;
  id: string;
  colors: ColorScheme;
}

interface ColorScheme {
  // Background colors
  background: string;
  containerBackground: string;
  
  // Node colors
  nodeDefault: [number, number, number, number];
  nodeRoot: [number, number, number, number];
  nodeSample: [number, number, number, number];
  nodeCombined: [number, number, number, number];
  nodeSelected: [number, number, number, number];
  
  // Edge colors
  edgeDefault: [number, number, number, number];
  edgeHighlight: [number, number, number, number];
  
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
}

const colorSchemes: Record<Exclude<ColorTheme, 'custom'>, ColorScheme> = {
  tskit: {
    background: '#03303E',
    containerBackground: '#0f1419',
    nodeDefault: [96, 160, 183, 255], // Original light blue for regular internal nodes
    nodeRoot: [96, 160, 183, 255], // Original light blue for root nodes
    nodeSample: [20, 226, 168, 255], // Original #14E2A8 pale green for samples
    nodeCombined: [80, 160, 175, 255], // Original light blue-green for combined nodes
    nodeSelected: [255, 255, 255, 255], // White for selected
    edgeDefault: [153, 153, 153, 102], // Original #999 with 0.4 opacity
    edgeHighlight: [255, 255, 255, 200],
    text: '#ffffff',
    textSecondary: '#14E2A8', // Classic sp-pale-green
    border: '#2a4a5a',
    exportBackground: '#03303E',
    accentPrimary: '#14E2A8', // Same as textSecondary for consistency
    accentSecondary: '#14E2A8', // Same as textSecondary for consistency
    geographicGrid: [20, 226, 168, 102], // Pale green with transparency
    temporalGrid: [20, 226, 168, 77], // Pale green with less transparency
    tooltipBackground: 'rgba(5, 62, 78, 0.95)',
    tooltipText: '#ffffff',
    headerText: '#ffffff',
    controlPanelText: '#ffffff',
    buttonText: '#ffffff'
  },
  grayscale: {
    background: '#ffffff',
    containerBackground: '#f8f9fa',
    nodeDefault: [100, 100, 100, 255], // Medium gray for internal nodes
    nodeRoot: [50, 50, 50, 255], // Dark gray for root nodes  
    nodeSample: [70, 70, 70, 255], // Darker gray for samples
    nodeCombined: [120, 120, 120, 255], // Light gray for combined nodes
    nodeSelected: [0, 0, 0, 255], // Black for selected
    edgeDefault: [140, 140, 140, 128], // Light gray edges with transparency
    edgeHighlight: [40, 40, 40, 200], // Dark gray highlighted edges
    text: '#212529', // Dark gray text for good contrast on white
    textSecondary: '#6c757d', // Medium gray secondary text
    border: '#dee2e6', // Light gray borders
    exportBackground: '#ffffff',
    accentPrimary: '#085167', // Classic dark blue for "ARGscape" and key branding
    accentSecondary: '#085167', // Classic dark blue for footer links and accents
    geographicGrid: [140, 140, 140, 102], // Gray with transparency
    temporalGrid: [140, 140, 140, 77], // Gray with less transparency
    tooltipBackground: 'rgba(0, 0, 0, 0.9)',
    tooltipText: '#ffffff',
    headerText: '#212529',
    controlPanelText: '#212529',
    buttonText: '#212529'
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
  const [theme, setThemeState] = useState<ColorTheme>('tskit');
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
      if (savedTheme && (savedTheme === 'tskit' || savedTheme === 'grayscale' || savedTheme === 'custom')) {
        setThemeState(savedTheme as ColorTheme);
      }
      
      const savedCustomTheme = localStorage.getItem(SELECTED_CUSTOM_THEME_KEY);
      if (savedCustomTheme) {
        setSelectedCustomTheme(savedCustomTheme);
      }
    } catch (error) {
      console.warn('Failed to load saved color themes:', error);
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

// Utility function to get node color based on type and theme
export const getNodeColor = (
  node: any, 
  nodes: any[], 
  edges: any[], 
  colors: ColorScheme,
  isSelected: boolean = false
): [number, number, number, number] => {
  if (isSelected) return colors.nodeSelected;
  
  // Check if it's a root node (no incoming edges)
  const isRoot = !edges.some(edge => edge.target === node.id);
  if (isRoot) return colors.nodeRoot;
  
  if (node.is_sample) return colors.nodeSample;
  if (node.is_combined) return colors.nodeCombined;
  
  return colors.nodeDefault;
};

// Utility function to get edge color based on theme
export const getEdgeColor = (
  edge: any,
  colors: ColorScheme,
  isHighlighted: boolean = false
): [number, number, number, number] => {
  return isHighlighted ? colors.edgeHighlight : colors.edgeDefault;
};

// Utility function to convert RGBA array to CSS string
export const rgbaArrayToString = (rgba: [number, number, number, number]): string => {
  return `rgba(${rgba[0]}, ${rgba[1]}, ${rgba[2]}, ${rgba[3] / 255})`;
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
      return commonColors;
      
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
    'edgeDefault',
    'edgeHighlight',
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
    'buttonText'
  ];

  const primaryColors = getPrimaryColors(visualizationType);
  
  return allColorKeys.filter(color => !primaryColors.includes(color));
};

// Utility function to convert RGBA array to hex string
export const rgbaArrayToHex = (rgba: [number, number, number, number]): string => {
  return `#${rgba[0].toString(16).padStart(2, '0')}${rgba[1].toString(16).padStart(2, '0')}${rgba[2].toString(16).padStart(2, '0')}`;
}; 