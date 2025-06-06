import React, { useState, useRef, useEffect } from 'react';
import { useColorTheme } from '../../context/ColorThemeContext';
import { useResizable } from '../../hooks/useResizable';
import { GeographicShape } from '../ForceDirectedGraph/ForceDirectedGraph.types';

type GeographicMode = 'unit_grid' | 'eastern_hemisphere' | 'custom';

interface SpatialArg3DControlPanelProps {
  // Temporal settings
  temporalSpacing: number;
  onTemporalSpacingChange: (value: number) => void;
  
  // Spatial settings
  spatialSpacing: number;
  onSpatialSpacingChange: (value: number) => void;
  
  // Visual settings
  temporalGridOpacity: number;
  onTemporalGridOpacityChange: (value: number) => void;
  
  geographicShapeOpacity: number;
  onGeographicShapeOpacityChange: (value: number) => void;
  
  maxNodeRadius: number;
  onMaxNodeRadiusChange: (value: number) => void;
  
  // Geographic settings
  geographicMode: GeographicMode;
  onGeographicModeChange: (mode: GeographicMode) => void;
  
  customShapeFile?: File | null;
  onCustomShapeFileChange: (file: File | null) => void;
  
  isLoadingGeographic: boolean;
  currentShape?: GeographicShape | null;
  
  // CRS warning
  showCrsWarning?: boolean;
  crsDetection?: any;
  onDismissCrsWarning?: () => void;
}

export const SpatialArg3DControlPanel: React.FC<SpatialArg3DControlPanelProps> = ({
  temporalSpacing,
  onTemporalSpacingChange,
  spatialSpacing,
  onSpatialSpacingChange,
  temporalGridOpacity,
  onTemporalGridOpacityChange,
  geographicShapeOpacity,
  onGeographicShapeOpacityChange,
  maxNodeRadius,
  onMaxNodeRadiusChange,
  geographicMode,
  onGeographicModeChange,
  customShapeFile,
  onCustomShapeFileChange,
  isLoadingGeographic,
  currentShape,
  showCrsWarning,
  crsDetection,
  onDismissCrsWarning
}) => {
  const { colors } = useColorTheme();
  const [isExpanded, setIsExpanded] = useState(true);
  const [position, setPosition] = useState({ x: 16, y: 16 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [hasDragged, setHasDragged] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  
  // Add resizable functionality
  const { width, height, ResizeHandles } = useResizable({
    initialWidth: 320,
    initialHeight: 500,
    minWidth: 280,
    minHeight: 200,
    maxWidth: 600,
    maxHeight: 700
  });

  const handleGeographicModeChange = (mode: GeographicMode) => {
    onGeographicModeChange(mode);
    if (mode !== 'custom') {
      onCustomShapeFileChange(null);
    }
  };

  const handleCustomFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    onCustomShapeFileChange(file);
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget || (e.target as HTMLElement).closest('.panel-header')) {
      setIsDragging(true);
      setHasDragged(false);
      setDragStart({
        x: e.clientX - position.x,
        y: e.clientY - position.y
      });
    }
  };

  const handleHeaderClick = (e: React.MouseEvent) => {
    // Only toggle if we haven't dragged
    if (!hasDragged) {
      setIsExpanded(!isExpanded);
    }
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isDragging) {
        const newX = Math.max(0, Math.min(window.innerWidth - 320, e.clientX - dragStart.x));
        const newY = Math.max(0, Math.min(window.innerHeight - 100, e.clientY - dragStart.y));
        
        // Check if we've actually moved a significant distance
        if (Math.abs(newX - position.x) > 3 || Math.abs(newY - position.y) > 3) {
          setHasDragged(true);
        }
        
        setPosition({ x: newX, y: newY });
      }
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, dragStart, position]);

  return (
    <div 
      ref={panelRef}
      className="absolute rounded-lg shadow-lg border z-20 select-none"
      style={{ 
        left: position.x,
        top: position.y,
        width: width,
        height: isExpanded ? height : 'auto',
        backgroundColor: colors.containerBackground,
        borderColor: colors.border,
        color: colors.text,
        cursor: isDragging ? 'grabbing' : 'default'
      }}
    >
      {/* Header */}
      <div 
        className="panel-header flex items-center justify-between p-3 border-b hover:bg-opacity-80 transition-colors"
        style={{ 
          borderBottomColor: colors.border,
          cursor: isDragging ? 'grabbing' : 'grab'
        }}
        onMouseDown={handleMouseDown}
        onClick={handleHeaderClick}
      >
        <div className="flex items-center gap-2">
          <svg 
            className="w-4 h-4" 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          <span className="font-medium text-sm">3D Visualization Settings</span>
        </div>
        <svg 
          className={`w-4 h-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </div>

      {/* Resize handles - only show when expanded */}
      {isExpanded && <ResizeHandles />}
      
      {/* Controls */}
      {isExpanded && (
        <div className="p-4 space-y-4 overflow-auto" style={{ maxHeight: height - 50 }}>
          {/* Temporal Settings */}
          <div className="space-y-3">
            <h4 className="text-sm font-bold" style={{ color: colors.text }}>Temporal Settings</h4>
            
            <div className="flex items-center justify-between">
              <label className="text-xs" style={{ color: colors.textSecondary }}>
                Time Layer Spacing
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="range"
                  min="1"
                  max="30"
                  step="1"
                  value={temporalSpacing}
                  onChange={(e) => onTemporalSpacingChange(Number(e.target.value))}
                  className="w-20 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                />
                <span className="text-xs w-8 text-right" style={{ color: colors.text }}>
                  {temporalSpacing}
                </span>
              </div>
            </div>
          </div>

          {/* Spatial Settings */}
          <div className="space-y-3">
            <h4 className="text-sm font-bold" style={{ color: colors.text }}>Spatial Settings</h4>
            
            <div className="flex items-center justify-between">
              <label className="text-xs" style={{ color: colors.textSecondary }}>
                Spatial Scale Factor
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="range"
                  min="1"
                  max="500"
                  step="5"
                  value={spatialSpacing}
                  onChange={(e) => onSpatialSpacingChange(Number(e.target.value))}
                  className="w-20 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                />
                <span className="text-xs w-8 text-right" style={{ color: colors.text }}>
                  {spatialSpacing}
                </span>
              </div>
            </div>
          </div>

          {/* Visual Settings */}
          <div className="space-y-3">
            <h4 className="text-sm font-bold" style={{ color: colors.text }}>Visual Settings</h4>
            
            <div className="flex items-center justify-between">
              <label className="text-xs" style={{ color: colors.textSecondary }}>
                Grid Line Opacity
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="range"
                  min="0"
                  max="100"
                  step="5"
                  value={temporalGridOpacity}
                  onChange={(e) => onTemporalGridOpacityChange(Number(e.target.value))}
                  className="w-20 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                />
                <span className="text-xs w-8 text-right" style={{ color: colors.text }}>
                  {temporalGridOpacity === 0 ? 'Off' : `${temporalGridOpacity}%`}
                </span>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <label className="text-xs" style={{ color: colors.textSecondary }}>
                Shape Opacity
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="range"
                  min="0"
                  max="100"
                  step="5"
                  value={geographicShapeOpacity}
                  onChange={(e) => onGeographicShapeOpacityChange(Number(e.target.value))}
                  className="w-20 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                />
                <span className="text-xs w-8 text-right" style={{ color: colors.text }}>
                  {geographicShapeOpacity === 0 ? 'Off' : `${geographicShapeOpacity}%`}
                </span>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <label className="text-xs" style={{ color: colors.textSecondary }}>
                Max Node Size
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="range"
                  min="10"
                  max="50"
                  step="5"
                  value={maxNodeRadius}
                  onChange={(e) => onMaxNodeRadiusChange(Number(e.target.value))}
                  className="w-20 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                />
                <span className="text-xs w-8 text-right" style={{ color: colors.text }}>
                  {maxNodeRadius}px
                </span>
              </div>
            </div>
          </div>

          {/* Geographic Settings */}
          <div className="space-y-3">
            <h4 className="text-sm font-bold" style={{ color: colors.text }}>Geographic Settings</h4>
            
            <div className="space-y-2">
              <label className="text-xs" style={{ color: colors.textSecondary }}>
                Geographic Mode
              </label>
              <div className="flex rounded overflow-hidden" style={{ backgroundColor: colors.background }}>
                <button
                  onClick={() => handleGeographicModeChange('unit_grid')}
                  className="flex-1 px-3 py-1.5 text-xs font-medium transition-colors"
                  style={{
                    backgroundColor: geographicMode === 'unit_grid' ? colors.textSecondary : colors.background,
                    color: geographicMode === 'unit_grid' ? colors.background : colors.text
                  }}
                >
                  Unit Grid
                </button>
                <button
                  onClick={() => handleGeographicModeChange('eastern_hemisphere')}
                  className="flex-1 px-3 py-1.5 text-xs font-medium transition-colors"
                  style={{
                    backgroundColor: geographicMode === 'eastern_hemisphere' ? colors.textSecondary : colors.background,
                    color: geographicMode === 'eastern_hemisphere' ? colors.background : colors.text
                  }}
                >
                  Eastern Hemisphere
                </button>
                <button
                  onClick={() => handleGeographicModeChange('custom')}
                  className="flex-1 px-3 py-1.5 text-xs font-medium transition-colors"
                  style={{
                    backgroundColor: geographicMode === 'custom' ? colors.textSecondary : colors.background,
                    color: geographicMode === 'custom' ? colors.background : colors.text
                  }}
                >
                  Custom
                </button>
              </div>
            </div>

            {/* Custom shapefile upload */}
            {geographicMode === 'custom' && (
              <div className="space-y-2">
                <label className="text-xs" style={{ color: colors.textSecondary }}>
                  Upload Shapefile
                </label>
                <label className="block cursor-pointer">
                  <input
                    type="file"
                    accept=".zip,.shp"
                    onChange={handleCustomFileChange}
                    className="hidden"
                  />
                  <div 
                    className="px-3 py-2 rounded text-xs border transition-colors text-center"
                    style={{
                      backgroundColor: colors.background,
                      color: colors.text,
                      borderColor: colors.border
                    }}
                  >
                    {customShapeFile ? customShapeFile.name : 'Choose File (.zip or .shp)'}
                  </div>
                </label>
              </div>
            )}

            {/* Geographic status */}
            <div className="text-xs flex items-center gap-2" style={{ color: colors.textSecondary }}>
              {isLoadingGeographic ? (
                <>
                  <div className="animate-spin rounded-full h-3 w-3 border border-t-transparent" style={{ borderColor: colors.textSecondary }}></div>
                  <span>Loading geographic data...</span>
                </>
              ) : currentShape ? (
                <span>Shape: {currentShape.name}</span>
              ) : (
                <span>No geographic shape loaded</span>
              )}
            </div>

            {/* CRS Warning */}
            {showCrsWarning && crsDetection && (
              <div 
                className="text-xs px-2 py-1 rounded border"
                style={{ 
                  color: '#d97706',
                  backgroundColor: 'rgba(251, 191, 36, 0.1)',
                  borderColor: '#fbbf24'
                }}
              >
                <div className="flex flex-wrap items-center gap-1">
                  <span>⚠️ Consider switching to "{crsDetection.suggested_geographic_mode}" mode for detected {crsDetection.likely_crs} coordinates</span>
                  <button
                    onClick={() => handleGeographicModeChange(crsDetection.suggested_geographic_mode as GeographicMode)}
                    className="underline hover:no-underline"
                  >
                    Switch
                  </button>
                  <button
                    onClick={onDismissCrsWarning}
                    className="hover:opacity-70"
                  >
                    ✕
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default SpatialArg3DControlPanel; 