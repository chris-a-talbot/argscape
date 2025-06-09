import React, { useState, useEffect } from 'react';
import { useColorTheme, rgbaArrayToHex, colorStringToRgbaArray, VisualizationType, getPrimaryColors, getOtherColors } from '../../context/ColorThemeContext';

interface ColorScheme {
  background: string;
  containerBackground: string;
  nodeDefault: [number, number, number, number];
  nodeRoot: [number, number, number, number];
  nodeSample: [number, number, number, number];
  nodeCombined: [number, number, number, number];
  nodeSelected: [number, number, number, number];
  edgeDefault: [number, number, number, number];
  edgeHighlight: [number, number, number, number];
  text: string;
  textSecondary: string;
  border: string;
  exportBackground: string;
  accentPrimary: string;
  accentSecondary: string;
  geographicGrid: [number, number, number, number];
  temporalGrid: [number, number, number, number];
  tooltipBackground: string;
  tooltipText: string;
  // Additional UI text colors
  headerText: string;
  controlPanelText: string;
  buttonText: string;
}

interface CustomColorThemeModalProps {
  isOpen: boolean;
  onClose: () => void;
  editingTheme?: { id: string; name: string; colors: ColorScheme } | null;
}

interface ColorPickerProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: 'color' | 'background';
}

const ColorPicker: React.FC<ColorPickerProps> = ({ label, value, onChange, type = 'color' }) => {
  return (
    <div className="flex items-center gap-3 min-h-[40px]">
      <label className="text-sm font-medium text-sp-white flex-1 min-w-0">{label}</label>
      <div className="flex items-center gap-2 flex-shrink-0">
        <div 
          className="w-8 h-8 rounded border-2 border-sp-pale-green/20 cursor-pointer flex-shrink-0"
          style={{ backgroundColor: value }}
          onClick={() => document.getElementById(`color-${label.replace(/\s+/g, '-').toLowerCase()}`)?.click()}
        />
        <input
          id={`color-${label.replace(/\s+/g, '-').toLowerCase()}`}
          type="color"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-0 h-0 opacity-0 pointer-events-none"
        />
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-24 px-2 py-1 text-xs rounded border bg-sp-very-dark-blue text-sp-white border-sp-pale-green/20 focus:border-sp-pale-green focus:outline-none"
          placeholder="#000000"
        />
      </div>
    </div>
  );
};

interface NodeColorPickerProps {
  label: string;
  value: [number, number, number, number];
  onChange: (value: [number, number, number, number]) => void;
}

// Function to calculate contrast ratio between two colors
const checkColorContrast = (color1: string, color2: string): number => {
  const getLuminance = (color: string): number => {
    // Handle both #RRGGBB and #RGB formats
    let hex = color.replace('#', '');
    if (hex.length === 3) {
      hex = hex.split('').map(char => char + char).join('');
    }
    
    if (hex.length !== 6) {
      console.warn('Invalid hex color:', color);
      return 0;
    }
    
    const r = parseInt(hex.substr(0, 2), 16) / 255;
    const g = parseInt(hex.substr(2, 2), 16) / 255;
    const b = parseInt(hex.substr(4, 2), 16) / 255;
    
    const toLinear = (c: number) => c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
    
    return 0.2126 * toLinear(r) + 0.7152 * toLinear(g) + 0.0722 * toLinear(b);
  };

  if (!color1 || !color2) {
    console.warn('Missing colors for contrast check:', { color1, color2 });
    return 21; // Max contrast if invalid
  }

  const lum1 = getLuminance(color1);
  const lum2 = getLuminance(color2);
  const brightest = Math.max(lum1, lum2);
  const darkest = Math.min(lum1, lum2);
  
  const ratio = (brightest + 0.05) / (darkest + 0.05);
  
  // Debug logging for white/white comparison
  if (color1.toLowerCase() === '#ffffff' && color2.toLowerCase() === '#ffffff') {
    console.log('White/white contrast check:', { color1, color2, lum1, lum2, ratio });
  }
  
  return ratio;
};

// Compact color picker for "Other Colors" section
interface CompactColorPickerProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  backgroundColor?: string; // For contrast checking
}

const CompactColorPicker: React.FC<CompactColorPickerProps> = ({ label, value, onChange, backgroundColor }) => {
  // Check contrast if backgroundColor is provided
  const hasContrastIssue = backgroundColor && checkColorContrast(value, backgroundColor) < 3;

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <label className="text-xs font-medium text-sp-white">{label}</label>
        {hasContrastIssue && (
          <div className="relative group">
            <svg className="w-3 h-3 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            <div className="absolute bottom-full left-0 mb-2 w-48 p-2 text-xs bg-yellow-100 text-yellow-800 rounded shadow-lg opacity-0 group-hover:opacity-100 transition-opacity z-10 pointer-events-none">
              Low contrast with background. Consider choosing a different color for better readability.
            </div>
          </div>
        )}
      </div>
      <div className="flex items-center gap-2">
        <div 
          className="w-6 h-6 rounded border border-sp-pale-green/20 cursor-pointer flex-shrink-0"
          style={{ backgroundColor: value }}
          onClick={() => document.getElementById(`compact-string-${label.replace(/\s+/g, '-').toLowerCase()}`)?.click()}
        />
        <input
          id={`compact-string-${label.replace(/\s+/g, '-').toLowerCase()}`}
          type="color"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-0 h-0 opacity-0 pointer-events-none"
        />
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="flex-1 px-2 py-1 text-xs rounded border bg-sp-very-dark-blue text-sp-white border-sp-pale-green/20 focus:border-sp-pale-green focus:outline-none min-w-0"
          placeholder="#000000"
        />
      </div>
    </div>
  );
};

// Compact node color picker for "Other Colors" section
interface CompactNodeColorPickerProps {
  label: string;
  value: [number, number, number, number];
  onChange: (value: [number, number, number, number]) => void;
  backgroundColor?: string; // For contrast checking
}

const CompactNodeColorPicker: React.FC<CompactNodeColorPickerProps> = ({ label, value, onChange, backgroundColor }) => {
  const hexValue = rgbaArrayToHex(value);
  const alpha = value[3];

  const handleColorChange = (color: string) => {
    const rgb = colorStringToRgbaArray(color);
    onChange([rgb[0], rgb[1], rgb[2], alpha]);
  };

  const handleAlphaChange = (newAlpha: number) => {
    onChange([value[0], value[1], value[2], newAlpha]);
  };

  // Check contrast if backgroundColor is provided - convert RGBA to hex for comparison
  const hasContrastIssue = backgroundColor && alpha > 128 && checkColorContrast(hexValue, backgroundColor) < 3;

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <label className="text-xs font-medium text-sp-white">{label}</label>
        {hasContrastIssue && (
          <div className="relative group">
            <svg className="w-3 h-3 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            <div className="absolute bottom-full left-0 mb-2 w-48 p-2 text-xs bg-yellow-100 text-yellow-800 rounded shadow-lg opacity-0 group-hover:opacity-100 transition-opacity z-10 pointer-events-none">
              Low contrast with background. Consider choosing a different color for better readability.
            </div>
          </div>
        )}
      </div>
      <div className="flex items-center gap-2">
        <div 
          className="w-6 h-6 rounded border border-sp-pale-green/20 cursor-pointer flex-shrink-0"
          style={{ backgroundColor: `rgba(${value[0]}, ${value[1]}, ${value[2]}, ${value[3] / 255})` }}
          onClick={() => document.getElementById(`compact-node-${label.replace(/\s+/g, '-').toLowerCase()}`)?.click()}
        />
        <input
          id={`compact-node-${label.replace(/\s+/g, '-').toLowerCase()}`}
          type="color"
          value={hexValue}
          onChange={(e) => handleColorChange(e.target.value)}
          className="w-0 h-0 opacity-0 pointer-events-none"
        />
        <input
          type="text"
          value={hexValue}
          onChange={(e) => handleColorChange(e.target.value)}
          className="flex-1 px-2 py-1 text-xs rounded border bg-sp-very-dark-blue text-sp-white border-sp-pale-green/20 focus:border-sp-pale-green focus:outline-none min-w-0"
          placeholder="#000000"
        />
      </div>
      <div className="flex items-center gap-2">
        <span className="text-xs text-sp-white/70 flex-shrink-0">Opacity:</span>
        <input
          type="range"
          min="0"
          max="255"
          value={alpha}
          onChange={(e) => handleAlphaChange(parseInt(e.target.value))}
          className="flex-1 min-w-0"
        />
        <span className="text-xs text-sp-white/70 w-10 text-right flex-shrink-0">{Math.round((alpha / 255) * 100)}%</span>
      </div>
    </div>
  );
};

const NodeColorPicker: React.FC<NodeColorPickerProps> = ({ label, value, onChange }) => {
  const hexValue = rgbaArrayToHex(value);
  const alpha = value[3];

  const handleColorChange = (color: string) => {
    const rgb = colorStringToRgbaArray(color);
    onChange([rgb[0], rgb[1], rgb[2], alpha]);
  };

  const handleAlphaChange = (newAlpha: number) => {
    onChange([value[0], value[1], value[2], newAlpha]);
  };

  return (
    <div className="flex items-center gap-3 min-h-[40px]">
      <label className="text-sm font-medium text-sp-white flex-1 min-w-0">{label}</label>
      <div className="flex items-center gap-2 flex-shrink-0">
        <div 
          className="w-8 h-8 rounded border-2 border-sp-pale-green/20 cursor-pointer flex-shrink-0"
          style={{ backgroundColor: `rgba(${value[0]}, ${value[1]}, ${value[2]}, ${value[3] / 255})` }}
          onClick={() => document.getElementById(`color-${label.replace(/\s+/g, '-').toLowerCase()}`)?.click()}
        />
        <input
          id={`color-${label.replace(/\s+/g, '-').toLowerCase()}`}
          type="color"
          value={hexValue}
          onChange={(e) => handleColorChange(e.target.value)}
          className="w-0 h-0 opacity-0 pointer-events-none"
        />
        <input
          type="text"
          value={hexValue}
          onChange={(e) => handleColorChange(e.target.value)}
          className="w-20 px-2 py-1 text-xs rounded border bg-sp-very-dark-blue text-sp-white border-sp-pale-green/20 focus:border-sp-pale-green focus:outline-none flex-shrink-0"
          placeholder="#000000"
        />
        <input
          type="range"
          min="0"
          max="255"
          value={alpha}
          onChange={(e) => handleAlphaChange(parseInt(e.target.value))}
          className="w-16 flex-shrink-0"
        />
        <span className="text-xs text-sp-white/70 w-8 flex-shrink-0 text-center">{Math.round((alpha / 255) * 100)}%</span>
      </div>
    </div>
  );
};

interface FullWidthColorPickerProps {
  label: string;
  value: [number, number, number, number];
  onChange: (value: [number, number, number, number]) => void;
  backgroundColor?: string; // For contrast checking
}

const FullWidthColorPicker: React.FC<FullWidthColorPickerProps> = ({ label, value, onChange, backgroundColor }) => {
  const hexValue = rgbaArrayToHex(value);
  const alpha = value[3];

  const handleColorChange = (color: string) => {
    const rgb = colorStringToRgbaArray(color);
    onChange([rgb[0], rgb[1], rgb[2], alpha]);
  };

  const handleAlphaChange = (newAlpha: number) => {
    onChange([value[0], value[1], value[2], newAlpha]);
  };

  // Check contrast if backgroundColor is provided
  const hasContrastIssue = backgroundColor && alpha > 128 && checkColorContrast(hexValue, backgroundColor) < 3;

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <label className="text-sm font-medium text-sp-white">{label}</label>
        {hasContrastIssue && (
          <div className="relative group">
            <svg className="w-4 h-4 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            <div className="absolute bottom-full left-0 mb-2 w-48 p-2 text-xs bg-yellow-100 text-yellow-800 rounded shadow-lg opacity-0 group-hover:opacity-100 transition-opacity z-10 pointer-events-none">
              Low contrast with background. Consider choosing a different color for better readability.
            </div>
          </div>
        )}
      </div>
      <div className="flex items-center gap-3">
        <div 
          className="w-10 h-10 rounded border-2 border-sp-pale-green/20 cursor-pointer flex-shrink-0"
          style={{ backgroundColor: `rgba(${value[0]}, ${value[1]}, ${value[2]}, ${value[3] / 255})` }}
          onClick={() => document.getElementById(`color-${label.replace(/\s+/g, '-').toLowerCase()}`)?.click()}
        />
        <input
          id={`color-${label.replace(/\s+/g, '-').toLowerCase()}`}
          type="color"
          value={hexValue}
          onChange={(e) => handleColorChange(e.target.value)}
          className="w-0 h-0 opacity-0 pointer-events-none"
        />
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <input
              type="text"
              value={hexValue}
              onChange={(e) => handleColorChange(e.target.value)}
              className="flex-1 px-2 py-1 text-sm rounded border bg-sp-very-dark-blue text-sp-white border-sp-pale-green/20 focus:border-sp-pale-green focus:outline-none"
              placeholder="#000000"
            />
            <div className="flex items-center gap-2">
              <span className="text-xs text-sp-white/70">Opacity:</span>
              <input
                type="range"
                min="0"
                max="255"
                value={alpha}
                onChange={(e) => handleAlphaChange(parseInt(e.target.value))}
                className="w-20"
              />
              <span className="text-xs text-sp-white/70 w-8 text-right">{Math.round((alpha / 255) * 100)}%</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

interface FullWidthStringColorPickerProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  backgroundColor?: string; // For contrast checking
}

const FullWidthStringColorPicker: React.FC<FullWidthStringColorPickerProps> = ({ label, value, onChange, backgroundColor }) => {
  // Check contrast if backgroundColor is provided
  const hasContrastIssue = backgroundColor && checkColorContrast(value, backgroundColor) < 3;

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <label className="text-sm font-medium text-sp-white">{label}</label>
        {hasContrastIssue && (
          <div className="relative group">
            <svg className="w-4 h-4 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            <div className="absolute bottom-full left-0 mb-2 w-48 p-2 text-xs bg-yellow-100 text-yellow-800 rounded shadow-lg opacity-0 group-hover:opacity-100 transition-opacity z-10 pointer-events-none">
              Low contrast with background. Consider choosing a different color for better readability.
            </div>
          </div>
        )}
      </div>
      <div className="flex items-center gap-3">
        <div 
          className="w-10 h-10 rounded border-2 border-sp-pale-green/20 cursor-pointer flex-shrink-0"
          style={{ backgroundColor: value }}
          onClick={() => document.getElementById(`color-${label.replace(/\s+/g, '-').toLowerCase()}`)?.click()}
        />
        <input
          id={`color-${label.replace(/\s+/g, '-').toLowerCase()}`}
          type="color"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-0 h-0 opacity-0 pointer-events-none"
        />
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="flex-1 px-2 py-1 text-sm rounded border bg-sp-very-dark-blue text-sp-white border-sp-pale-green/20 focus:border-sp-pale-green focus:outline-none"
          placeholder="#000000"
        />
      </div>
    </div>
  );
};

export const CustomColorThemeModal: React.FC<CustomColorThemeModalProps> = ({
  isOpen,
  onClose,
  editingTheme
}) => {
  const { saveCustomTheme, updateCustomTheme, currentVisualizationType } = useColorTheme();
  const [themeName, setThemeName] = useState('');
  const [showOtherColors, setShowOtherColors] = useState(false);
  const [colors, setColors] = useState<ColorScheme>(() => {
    // Initialize with auto-linked defaults
    const defaultInternalColor: [number, number, number, number] = [96, 160, 183, 255];
    const defaultEdgeColor: [number, number, number, number] = [153, 153, 153, 102];
    const brightEdgeColor: [number, number, number, number] = [
      Math.min(255, Math.round(defaultEdgeColor[0] * 1.5)),
      Math.min(255, Math.round(defaultEdgeColor[1] * 1.5)),
      Math.min(255, Math.round(defaultEdgeColor[2] * 1.5)),
      Math.min(255, Math.round(defaultEdgeColor[3] * 1.3))
    ];
    
    return {
      background: '#03303E',
      containerBackground: '#0f1419',
      nodeDefault: defaultInternalColor,
      nodeRoot: [96, 160, 183, 255],
      nodeSample: [20, 226, 168, 255],
      nodeCombined: defaultInternalColor, // Same as internal by default
      nodeSelected: [255, 255, 255, 255],
      edgeDefault: defaultEdgeColor,
      edgeHighlight: brightEdgeColor, // Auto-brightened
      text: '#ffffff',
      textSecondary: '#14E2A8',
      border: '#2a4a5a',
      exportBackground: '#03303E',
      accentPrimary: '#14E2A8',
      accentSecondary: '#14E2A8',
      geographicGrid: [20, 226, 168, 102],
      temporalGrid: [20, 226, 168, 77],
      tooltipBackground: 'rgba(5, 62, 78, 0.95)',
      tooltipText: '#ffffff',
      headerText: '#ffffff',
      controlPanelText: '#ffffff',
      buttonText: '#ffffff'
    };
  });

  // Initialize form with editing theme data
  useEffect(() => {
    if (editingTheme) {
      setThemeName(editingTheme.name);
      setColors(editingTheme.colors);
    } else {
      setThemeName('');
      // Initialize with auto-linked defaults
      const defaultInternalColor: [number, number, number, number] = [96, 160, 183, 255];
      const defaultEdgeColor: [number, number, number, number] = [153, 153, 153, 102];
      const brightEdgeColor: [number, number, number, number] = [
        Math.min(255, Math.round(defaultEdgeColor[0] * 1.5)),
        Math.min(255, Math.round(defaultEdgeColor[1] * 1.5)),
        Math.min(255, Math.round(defaultEdgeColor[2] * 1.5)),
        Math.min(255, Math.round(defaultEdgeColor[3] * 1.3))
      ];
      
      setColors({
        background: '#03303E',
        containerBackground: '#0f1419',
        nodeDefault: defaultInternalColor,
        nodeRoot: [96, 160, 183, 255],
        nodeSample: [20, 226, 168, 255],
        nodeCombined: defaultInternalColor, // Same as internal by default
        nodeSelected: [255, 255, 255, 255],
        edgeDefault: defaultEdgeColor,
        edgeHighlight: brightEdgeColor, // Auto-brightened
        text: '#ffffff',
        textSecondary: '#14E2A8',
        border: '#2a4a5a',
        exportBackground: '#03303E',
        accentPrimary: '#14E2A8',
        accentSecondary: '#14E2A8',
        geographicGrid: [20, 226, 168, 102],
        temporalGrid: [20, 226, 168, 77],
        tooltipBackground: 'rgba(5, 62, 78, 0.95)',
        tooltipText: '#ffffff',
        headerText: '#ffffff',
        controlPanelText: '#ffffff',
        buttonText: '#ffffff'
      });
    }
  }, [editingTheme, isOpen]);

  // Handle ESC key
  useEffect(() => {
    const handleEsc = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEsc);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEsc);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  const handleSave = () => {
    if (!themeName.trim()) {
      alert('Please enter a theme name');
      return;
    }

    if (editingTheme) {
      updateCustomTheme(editingTheme.id, themeName.trim(), colors);
    } else {
      saveCustomTheme(themeName.trim(), colors);
    }
    
    onClose();
  };

  const updateNodeColor = (key: keyof Pick<ColorScheme, 'nodeDefault' | 'nodeRoot' | 'nodeSample' | 'nodeCombined' | 'nodeSelected' | 'edgeDefault' | 'edgeHighlight' | 'geographicGrid' | 'temporalGrid'>) => 
    (value: [number, number, number, number]) => {
      setColors(prev => ({ ...prev, [key]: value }));
    };

  const updateStringColor = (key: keyof Pick<ColorScheme, 'background' | 'containerBackground' | 'text' | 'textSecondary' | 'border' | 'exportBackground' | 'accentPrimary' | 'accentSecondary' | 'tooltipBackground' | 'tooltipText' | 'headerText' | 'controlPanelText' | 'buttonText'>) => 
    (value: string) => {
      setColors(prev => ({ ...prev, [key]: value }));
    };

  // Utility function to check contrast and suggest readable text color
  const getContrastColor = (backgroundColor: string): string => {
    // Convert hex to RGB
    const hex = backgroundColor.replace('#', '');
    const r = parseInt(hex.substr(0, 2), 16);
    const g = parseInt(hex.substr(2, 2), 16);
    const b = parseInt(hex.substr(4, 2), 16);
    
    // Calculate relative luminance
    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
    
    // Return white for dark backgrounds, dark for light backgrounds
    return luminance > 0.5 ? '#000000' : '#ffffff';
  };



  // Auto-adjust text colors when background changes
  const handleBackgroundChange = (value: string) => {
    const contrastColor = getContrastColor(value);
    setColors(prev => ({ 
      ...prev, 
      background: value,
      headerText: contrastColor,
      controlPanelText: contrastColor,
      buttonText: contrastColor,
      text: contrastColor
    }));
  };

  // Auto-brighten highlighted edges based on default edges
  const handleEdgeDefaultChange = (value: [number, number, number, number]) => {
    // Create a brighter version for highlights
    const brightened: [number, number, number, number] = [
      Math.min(255, Math.round(value[0] * 1.5)),
      Math.min(255, Math.round(value[1] * 1.5)),
      Math.min(255, Math.round(value[2] * 1.5)),
      Math.min(255, Math.round(value[3] * 1.3))
    ];
    
    setColors(prev => ({ 
      ...prev, 
      edgeDefault: value,
      edgeHighlight: brightened
    }));
  };

  // Make combined nodes default to same as internal nodes
  const handleInternalNodeChange = (value: [number, number, number, number]) => {
    setColors(prev => ({ 
      ...prev, 
      nodeDefault: value,
      nodeCombined: value
    }));
  };

  // Organize colors based on current visualization type
  const primaryColors = getPrimaryColors(currentVisualizationType);
  const otherColorKeys = getOtherColors(currentVisualizationType);

  // Helper function to get appropriate change handler for main colors
  const getColorChangeHandler = (colorKey: keyof ColorScheme): ((value: [number, number, number, number]) => void) => {
    if (colorKey === 'nodeDefault') return handleInternalNodeChange;
    if (colorKey === 'edgeDefault') return handleEdgeDefaultChange;
    return updateNodeColor(colorKey as any);
  };

  // Helper function to get user-friendly labels for color properties
  const getColorLabel = (colorKey: keyof ColorScheme): string => {
    const labels: Record<keyof ColorScheme, string> = {
      background: 'Visualization Background',
      containerBackground: 'Container Background',
      nodeDefault: 'Internal Nodes (combined nodes will match)',
      nodeRoot: 'Root Nodes',
      nodeSample: 'Sample Nodes',
      nodeCombined: 'Combined Nodes',
      nodeSelected: 'Selected Nodes',
      edgeDefault: 'Edges (highlighted edges will be auto-brightened)',
      edgeHighlight: 'Highlighted Edges',
      text: 'Primary Text',
      textSecondary: 'Secondary Text',
      border: 'Borders',
      exportBackground: 'Export Background',
      accentPrimary: 'Primary Accent',
      accentSecondary: 'Secondary Accent',
      geographicGrid: 'Geographic Shapes & Grid',
      temporalGrid: 'Temporal Grid Lines',
      tooltipBackground: 'Tooltip Background',
      tooltipText: 'Tooltip Text',
      headerText: 'Header Text',
      controlPanelText: 'Control Panel Text',
      buttonText: 'Button Text'
    };
    return labels[colorKey] || colorKey;
  };

  // Helper function to render color picker based on color key
  const renderMainColorPicker = (colorKey: keyof ColorScheme) => {
    const colorValue = colors[colorKey];
    
    if (typeof colorValue === 'string') {
      return (
        <FullWidthStringColorPicker
          key={colorKey}
          label={getColorLabel(colorKey)}
          value={colorValue}
          onChange={colorKey === 'background' ? handleBackgroundChange : updateStringColor(colorKey as any)}
          backgroundColor={colorKey === 'tooltipText' ? colors.tooltipBackground : undefined}
        />
      );
    } else {
      return (
        <FullWidthColorPicker
          key={colorKey}
          label={getColorLabel(colorKey)}
          value={colorValue}
          onChange={getColorChangeHandler(colorKey)}
          backgroundColor={colors.background}
        />
      );
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm" 
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative bg-sp-very-dark-blue border border-sp-pale-green/20 rounded-2xl shadow-2xl max-w-4xl w-full mx-4 max-h-[85vh] overflow-hidden transform transition-all">
        <div className="p-6 overflow-y-auto max-h-[85vh] overflow-x-hidden">
          {/* Header */}
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-sp-pale-green/10">
              <svg className="w-5 h-5 text-sp-pale-green" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zM21 5a2 2 0 00-2-2h-4a2 2 0 00-2 2v12a4 4 0 004 4h4a2 2 0 002-2V5z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-sp-white">
              {editingTheme ? 'Edit Custom Theme' : 'Create Custom Theme'}
            </h3>
          </div>
          
          {/* Theme Name */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-sp-white mb-2">Theme Name</label>
            <input
              type="text"
              value={themeName}
              onChange={(e) => setThemeName(e.target.value)}
              className="w-full px-3 py-2 rounded border bg-sp-very-dark-blue text-sp-white border-sp-pale-green/20 focus:border-sp-pale-green focus:outline-none"
              placeholder="Enter theme name..."
              maxLength={50}
            />
          </div>

          {/* Main Colors - Full Width */}
          <div className="space-y-4 mb-6">
            <h4 className="text-base font-semibold text-sp-pale-green">Main Colors</h4>
            {primaryColors.map(colorKey => renderMainColorPicker(colorKey))}
          </div>

          {/* Other Colors - Expandable Section */}
          <div className="space-y-4 mb-6">
            <button
              onClick={() => setShowOtherColors(!showOtherColors)}
              className="flex items-center gap-2 text-base font-semibold text-sp-pale-green hover:text-sp-very-pale-green transition-colors"
            >
              <svg 
                className={`w-4 h-4 transition-transform ${showOtherColors ? 'rotate-90' : ''}`}
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
              Other Colors
            </button>
            
            {showOtherColors && (
              <div className="space-y-6 pl-6 border-l-2 border-sp-pale-green/20">
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 min-w-0">
                  {otherColorKeys.map(colorKey => {
                    try {
                      const colorValue = colors[colorKey];
                      if (!colorValue) return null; // Skip if color value doesn't exist
                      
                      if (typeof colorValue === 'string') {
                        return (
                          <CompactColorPicker
                            key={colorKey}
                            label={getColorLabel(colorKey)}
                            value={colorValue}
                            onChange={updateStringColor(colorKey as any)}
                            backgroundColor={colorKey === 'tooltipText' ? colors.tooltipBackground : colors.background}
                          />
                        );
                      } else {
                        return (
                          <CompactNodeColorPicker
                            key={colorKey}
                            label={getColorLabel(colorKey)}
                            value={colorValue}
                            onChange={updateNodeColor(colorKey as any)}
                            backgroundColor={colors.background}
                          />
                        );
                      }
                    } catch (error) {
                      console.warn(`Error rendering color picker for ${colorKey}:`, error);
                      return null;
                    }
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Preview Section */}
          <div className="mt-6 p-4 rounded-lg border border-sp-pale-green/20 bg-sp-dark-blue/20">
            <h4 className="text-sm font-semibold text-sp-pale-green mb-3">Preview</h4>
            <div 
              className="p-4 rounded border text-sm"
              style={{ 
                backgroundColor: colors.background,
                borderColor: `rgba(${colors.geographicGrid[0]}, ${colors.geographicGrid[1]}, ${colors.geographicGrid[2]}, ${colors.geographicGrid[3] / 255})`,
                color: colors.text
              }}
            >
              <div style={{ color: colors.headerText }} className="font-semibold mb-2">3D ARG Visualization</div>
              <div style={{ color: colors.controlPanelText }} className="mb-3">Control panel text sample</div>
              
              {/* Color Legend */}
              <div className="grid grid-cols-2 gap-2 mb-3">
                <div className="flex items-center gap-2">
                  <div 
                    className="w-4 h-4 rounded border"
                    style={{ backgroundColor: colors.background }}
                  ></div>
                  <span className="text-xs">Background</span>
                </div>
                <div className="flex items-center gap-2">
                  <div 
                    className="w-4 h-4 rounded-full border"
                    style={{ 
                      backgroundColor: `rgba(${colors.nodeSample[0]}, ${colors.nodeSample[1]}, ${colors.nodeSample[2]}, ${colors.nodeSample[3] / 255})`,
                      borderColor: colors.background
                    }}
                  ></div>
                  <span className="text-xs">Sample</span>
                </div>
                <div className="flex items-center gap-2">
                  <div 
                    className="w-4 h-4 rounded-full"
                    style={{ backgroundColor: `rgba(${colors.nodeRoot[0]}, ${colors.nodeRoot[1]}, ${colors.nodeRoot[2]}, ${colors.nodeRoot[3] / 255})` }}
                  ></div>
                  <span className="text-xs">Root</span>
                </div>
                <div className="flex items-center gap-2">
                  <div 
                    className="w-4 h-4 rounded-full"
                    style={{ backgroundColor: `rgba(${colors.nodeDefault[0]}, ${colors.nodeDefault[1]}, ${colors.nodeDefault[2]}, ${colors.nodeDefault[3] / 255})` }}
                  ></div>
                  <span className="text-xs">Internal</span>
                </div>
              </div>

              {/* Edge Preview */}
              <div className="flex items-center gap-3 mb-3">
                <div 
                  className="w-8 h-1 rounded"
                  style={{ backgroundColor: `rgba(${colors.edgeDefault[0]}, ${colors.edgeDefault[1]}, ${colors.edgeDefault[2]}, ${colors.edgeDefault[3] / 255})` }}
                ></div>
                <span className="text-xs">Edges</span>
                <div 
                  className="w-8 h-1 rounded"
                  style={{ backgroundColor: `rgba(${colors.edgeHighlight[0]}, ${colors.edgeHighlight[1]}, ${colors.edgeHighlight[2]}, ${colors.edgeHighlight[3] / 255})` }}
                ></div>
                <span className="text-xs">Highlighted</span>
              </div>

              {/* Grid Preview */}
              <div className="flex items-center gap-3 mb-3">
                <div 
                  className="w-6 h-6 border-2 rounded"
                  style={{ borderColor: `rgba(${colors.geographicGrid[0]}, ${colors.geographicGrid[1]}, ${colors.geographicGrid[2]}, ${colors.geographicGrid[3] / 255})` }}
                ></div>
                <span className="text-xs">Geographic Grid</span>
                <div 
                  className="w-6 h-1 rounded"
                  style={{ backgroundColor: `rgba(${colors.temporalGrid[0]}, ${colors.temporalGrid[1]}, ${colors.temporalGrid[2]}, ${colors.temporalGrid[3] / 255})` }}
                ></div>
                <span className="text-xs">Temporal Grid</span>
              </div>

              {/* Tooltip Preview */}
              <div 
                className="text-xs inline-block px-2 py-1 rounded"
                style={{ 
                  color: colors.tooltipText, 
                  backgroundColor: colors.tooltipBackground,
                  border: `1px solid rgba(${colors.geographicGrid[0]}, ${colors.geographicGrid[1]}, ${colors.geographicGrid[2]}, 0.3)`
                }}
              >
                Sample tooltip text
              </div>
            </div>
          </div>
          
          {/* Actions */}
          <div className="flex gap-3 mt-6">
            <button
              onClick={onClose}
              className="flex-1 bg-sp-dark-blue hover:bg-sp-pale-green hover:text-sp-very-dark-blue text-sp-white border border-sp-pale-green/20 font-bold py-3 px-4 rounded-xl transition-all duration-200"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={!themeName.trim()}
              className="flex-1 bg-sp-pale-green hover:bg-sp-very-pale-green text-sp-very-dark-blue font-bold py-3 px-4 rounded-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {editingTheme ? 'Update Theme' : 'Save Theme'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}; 