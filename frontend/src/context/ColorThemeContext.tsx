import React, { createContext, useContext, useState, useCallback } from 'react';

export type ColorTheme = 'default' | 'grayscale';

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
}

const colorSchemes: Record<ColorTheme, ColorScheme> = {
  default: {
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
    accentSecondary: '#14E2A8' // Same as textSecondary for consistency
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
    accentSecondary: '#085167' // Classic dark blue for footer links and accents
  }
};

interface ColorThemeContextType {
  theme: ColorTheme;
  setTheme: (theme: ColorTheme) => void;
  colors: ColorScheme;
}

const ColorThemeContext = createContext<ColorThemeContextType | undefined>(undefined);

export const ColorThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setTheme] = useState<ColorTheme>('default');
  
  const colors = colorSchemes[theme];
  
  const value = {
    theme,
    setTheme,
    colors
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