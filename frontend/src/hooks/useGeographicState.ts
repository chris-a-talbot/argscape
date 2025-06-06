import { useState, useEffect } from 'react';
import { GeographicShape } from '../components/ForceDirectedGraph/ForceDirectedGraph.types';
import { api } from '../lib/api';

export type GeographicMode = 'unit_grid' | 'eastern_hemisphere' | 'custom';

interface CrsDetection {
  likely_crs: string;
  confidence: number;
  land_percentage: number;
  reasoning: string;
}

interface GeographicState {
  mode: GeographicMode;
  currentShape: GeographicShape | null;
  customShapeFile: File | null;
  isLoading: boolean;
  showCrsWarning: boolean;
  isManuallySet: boolean;
}

interface UseGeographicStateReturn extends GeographicState {
  setMode: (mode: GeographicMode) => void;
  setCustomShapeFile: (file: File | null) => void;
  dismissCrsWarning: () => void;
  updateFromCrsDetection: (crsDetection?: CrsDetection, suggestedMode?: GeographicMode) => void;
}

export const useGeographicState = (): UseGeographicStateReturn => {
  const [state, setState] = useState<GeographicState>({
    mode: 'unit_grid',
    currentShape: null,
    customShapeFile: null,
    isLoading: false,
    showCrsWarning: false,
    isManuallySet: false,
  });

  // Load geographic data on mount
  useEffect(() => {
    const loadInitialData = async () => {
      try {
        setState(prev => ({ ...prev, isLoading: true }));
        
        // Load default shape (unit grid)
        const defaultShapeResponse = await api.getShapeData('unit_grid');
        setState(prev => ({ 
          ...prev, 
          currentShape: defaultShapeResponse.data as GeographicShape,
          isLoading: false 
        }));
      } catch (error) {
        console.error('Error loading initial geographic data:', error);
        setState(prev => ({ ...prev, isLoading: false }));
      }
    };
    
    loadInitialData();
  }, []);

  // Handle mode changes
  useEffect(() => {
    const loadShapeForMode = async () => {
      if (state.mode === 'custom' && !state.customShapeFile) {
        return;
      }
      
      try {
        setState(prev => ({ ...prev, isLoading: true }));
        
        if (state.mode === 'custom' && state.customShapeFile) {
          // Upload and process custom shapefile
          const response = await api.uploadShapefile(state.customShapeFile);
          console.log('Custom shapefile uploaded:', response.data);
        } else if (state.mode === 'unit_grid') {
          // Create unit grid shape locally
          const { createUnitGridShape } = await import('../components/SpatialArg3DVisualization/GeographicUtils');
          const gridShape = createUnitGridShape(10);
          setState(prev => ({ ...prev, currentShape: gridShape, isLoading: false }));
        } else {
          try {
            // Try to load built-in shape from API
            const response = await api.getShapeData(state.mode);
            setState(prev => ({ 
              ...prev, 
              currentShape: response.data as GeographicShape,
              isLoading: false 
            }));
          } catch (error) {
            console.warn(`Failed to load ${state.mode} from API, creating fallback`);
            
            // Fallback: create default shape
            const { createUnitGridShape } = await import('../components/SpatialArg3DVisualization/GeographicUtils');
            const gridShape = createUnitGridShape(10);
            setState(prev => ({ ...prev, currentShape: gridShape, isLoading: false }));
          }
        }
      } catch (error) {
        console.error('Error loading shape for mode:', state.mode, error);
        setState(prev => ({ ...prev, isLoading: false }));
      }
    };
    
    loadShapeForMode();
  }, [state.mode, state.customShapeFile]);

  const setMode = (mode: GeographicMode) => {
    setState(prev => ({ 
      ...prev, 
      mode, 
      isManuallySet: true,
      currentShape: null // Reset shape when mode changes
    }));
  };

  const setCustomShapeFile = (file: File | null) => {
    setState(prev => ({ ...prev, customShapeFile: file }));
  };

  const dismissCrsWarning = () => {
    setState(prev => ({ ...prev, showCrsWarning: false }));
  };

  const updateFromCrsDetection = (crsDetection?: CrsDetection, suggestedMode?: GeographicMode) => {
    if (!crsDetection || !suggestedMode || state.isManuallySet) {
      return;
    }

    // Check if current mode is appropriate for detected CRS
    if (suggestedMode !== state.mode && crsDetection.confidence > 0.7) {
      setState(prev => ({ 
        ...prev, 
        showCrsWarning: true,
        mode: suggestedMode 
      }));
      console.log(`Setting geographic mode to: ${suggestedMode} based on CRS detection`);
    } else {
      setState(prev => ({ ...prev, showCrsWarning: false }));
    }
  };

  return {
    ...state,
    setMode,
    setCustomShapeFile,
    dismissCrsWarning,
    updateFromCrsDetection,
  };
}; 