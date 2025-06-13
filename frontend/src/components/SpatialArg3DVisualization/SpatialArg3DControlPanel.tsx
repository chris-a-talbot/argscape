import React, { useState, useRef } from 'react';
import { useColorTheme } from '../../context/ColorThemeContext';
import { useDraggable } from '../../hooks/useDraggable';
import { GeographicShape } from '../ForceDirectedGraph/ForceDirectedGraph.types';
import { TemporalSpacingMode } from './SpatialArg3DVisualization.types';

type GeographicMode = 'unit_grid' | 'eastern_hemisphere' | 'custom';

interface SpatialArg3DControlPanelProps {
  // Temporal settings
  temporalSpacing: number;
  onTemporalSpacingChange: (value: number) => void;
  temporalSpacingMode: TemporalSpacingMode;
  onTemporalSpacingModeChange: (mode: TemporalSpacingMode) => void;
  
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
  temporalSpacingMode,
  onTemporalSpacingModeChange,
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
  const dragHandleRef = useRef<HTMLDivElement>(null);

  const { elementRef, dragProps, hasMoved, isRepositioned } = useDraggable({
    initialPosition: { x: 0, y: 0 },
    dragHandleRef: dragHandleRef as React.RefObject<HTMLElement>
  });

  const handleGeographicModeChange = (mode: GeographicMode) => {
    onGeographicModeChange(mode);
  };

  const handleShapefileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      onCustomShapeFileChange(file);
    }
  };

  return (
    <div 
      ref={elementRef as React.RefObject<HTMLDivElement>}
      className={`border rounded-lg shadow-lg z-30 ${
        isRepositioned ? '' : 'absolute top-4 left-4'
      }`}
      style={{ 
        backgroundColor: `${colors.background}F0`, // 94% opacity
        borderColor: colors.border,
        color: colors.text,
        ...dragProps.style
      }}
      onMouseDown={dragProps.onMouseDown}
    >
      {/* Control Panel Header */}
      <div 
        ref={dragHandleRef}
        onClick={() => !hasMoved && setIsExpanded(!isExpanded)}
        className="flex items-center justify-between p-4 cursor-pointer rounded-t-lg transition-colors"
        style={{
          backgroundColor: isExpanded ? 'transparent' : `${colors.containerBackground}80`
        }}
        onMouseEnter={(e) => {
          if (!isExpanded) {
            e.currentTarget.style.backgroundColor = `${colors.border}40`;
          }
        }}
        onMouseLeave={(e) => {
          if (!isExpanded) {
            e.currentTarget.style.backgroundColor = `${colors.containerBackground}80`;
          }
        }}
      >
        <h3 className="text-sm font-bold flex items-center gap-2" style={{ color: colors.text }}>
          <svg className="w-3 h-3 opacity-50" fill="currentColor" viewBox="0 0 24 24">
            <path d="M8 6h8v2H8V6zm0 4h8v2H8v-2zm0 4h8v2H8v-2z"/>
          </svg>
          3D Visualization Controls
        </h3>
        <svg 
          className={`w-4 h-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
          style={{ color: colors.accentPrimary }}
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </div>

      {/* Control Panel Content */}
      {isExpanded && (
        <div className="p-4 pt-0 space-y-4 max-h-96 overflow-y-auto">
          {/* Geographic Settings */}
          <div className="space-y-3">
            <h4 className="text-sm font-bold" style={{ color: colors.text }}>Geographic Settings</h4>
            
            <div className="space-y-2">
              <label className="text-xs" style={{ color: colors.accentPrimary }}>
                Geographic Mode
              </label>
              <div className="flex rounded overflow-hidden" style={{ backgroundColor: colors.containerBackground }}>
                <button
                  onClick={() => handleGeographicModeChange('unit_grid')}
                  className="flex-1 px-3 py-1.5 text-xs font-medium transition-colors"
                  style={{
                    backgroundColor: geographicMode === 'unit_grid' ? colors.accentPrimary : colors.containerBackground,
                    color: geographicMode === 'unit_grid' ? colors.background : colors.text
                  }}
                >
                  Unit Grid
                </button>
                <button
                  onClick={() => handleGeographicModeChange('eastern_hemisphere')}
                  className="flex-1 px-3 py-1.5 text-xs font-medium transition-colors"
                  style={{
                    backgroundColor: geographicMode === 'eastern_hemisphere' ? colors.accentPrimary : colors.containerBackground,
                    color: geographicMode === 'eastern_hemisphere' ? colors.background : colors.text
                  }}
                >
                  Eastern Hemisphere
                </button>
                <button
                  onClick={() => handleGeographicModeChange('custom')}
                  className="flex-1 px-3 py-1.5 text-xs font-medium transition-colors"
                  style={{
                    backgroundColor: geographicMode === 'custom' ? colors.accentPrimary : colors.containerBackground,
                    color: geographicMode === 'custom' ? colors.background : colors.text
                  }}
                >
                  Custom
                </button>
              </div>
            </div>

            {geographicMode === 'custom' && (
              <div className="space-y-2">
                <label className="text-xs" style={{ color: colors.accentPrimary }}>
                  Upload Shapefile (.zip)
                </label>
                <input
                  type="file"
                  accept=".zip"
                  onChange={handleShapefileUpload}
                  className="w-full text-xs border rounded px-2 py-1 transition-colors"
                  style={{
                    color: colors.text,
                    backgroundColor: colors.containerBackground,
                    borderColor: `${colors.accentPrimary}33`,
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = `${colors.accentPrimary}66`;
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = `${colors.accentPrimary}33`;
                  }}
                />
                {customShapeFile && (
                  <p className="text-xs" style={{ color: colors.accentPrimary }}>
                    Selected: {customShapeFile.name}
                  </p>
                )}
              </div>
            )}

            {isLoadingGeographic && (
              <div className="flex items-center gap-2">
                <div 
                  className="animate-spin rounded-full h-3 w-3 border border-t-transparent"
                  style={{ borderColor: colors.accentPrimary }}
                ></div>
                <span className="text-xs" style={{ color: colors.text }}>Loading geographic data...</span>
              </div>
            )}

            {currentShape && (
              <div className="text-xs" style={{ color: `${colors.text}B3` }}>
                <div>Shape: {currentShape.name}</div>
                {currentShape.bounds && (
                  <div>Shape loaded successfully</div>
                )}
              </div>
            )}

            {/* CRS Detection Warning */}
            {showCrsWarning && crsDetection && (
              <div 
                className="border rounded p-3 space-y-2"
                style={{ 
                  backgroundColor: `${colors.background}33`,
                  borderColor: `${colors.accentPrimary}4D`
                }}
              >
                <div className="flex items-center justify-between">
                  <h5 className="text-xs font-bold" style={{ color: colors.accentPrimary }}>Coordinate System Detected</h5>
                  <button
                    onClick={onDismissCrsWarning}
                    className="text-xs"
                    style={{ color: `${colors.accentPrimary}B3` }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.color = colors.accentPrimary;
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.color = `${colors.accentPrimary}B3`;
                    }}
                  >
                    ✕
                  </button>
                </div>
                <div className="text-xs space-y-1" style={{ color: `${colors.accentPrimary}E6` }}>
                  <div>CRS: {crsDetection.crs}</div>
                  <div>Confidence: {(crsDetection.confidence * 100).toFixed(1)}%</div>
                  <div>Land coverage: {(crsDetection.landPercentage * 100).toFixed(1)}%</div>
                  <div className="italic">{crsDetection.description}</div>
                </div>
              </div>
            )}
          </div>

          {/* Temporal Spacing Settings */}
          <div className="space-y-3">
            <h4 className="text-sm font-bold" style={{ color: colors.text }}>Temporal Spacing</h4>
            
            <div className="space-y-2">
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-medium" style={{ color: colors.text }}>
                  Spacing Mode
                </label>
                <div className="flex rounded overflow-hidden" style={{ backgroundColor: colors.containerBackground }}>
                  <button
                    onClick={() => onTemporalSpacingModeChange('equal')}
                    className="px-2 py-1 text-xs font-medium transition-colors"
                    style={{
                      backgroundColor: temporalSpacingMode === 'equal' ? colors.accentPrimary : colors.containerBackground,
                      color: temporalSpacingMode === 'equal' ? colors.background : colors.text
                    }}
                  >
                    Equal
                  </button>
                  <button
                    onClick={() => onTemporalSpacingModeChange('log')}
                    className="px-2 py-1 text-xs font-medium transition-colors"
                    style={{
                      backgroundColor: temporalSpacingMode === 'log' ? colors.accentPrimary : colors.containerBackground,
                      color: temporalSpacingMode === 'log' ? colors.background : colors.text
                    }}
                  >
                    Log
                  </button>
                  <button
                    onClick={() => onTemporalSpacingModeChange('linear')}
                    className="px-2 py-1 text-xs font-medium transition-colors"
                    style={{
                      backgroundColor: temporalSpacingMode === 'linear' ? colors.accentPrimary : colors.containerBackground,
                      color: temporalSpacingMode === 'linear' ? colors.background : colors.text
                    }}
                  >
                    Linear
                  </button>
                </div>
              </div>

              {temporalSpacingMode === 'equal' && (
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-medium" style={{ color: colors.text }}>
                      Spacing: {temporalSpacing}
                    </label>
                  </div>
                  <input
                    type="range"
                    min={5}
                    max={50}
                    step={1}
                    value={temporalSpacing}
                    onChange={(e) => onTemporalSpacingChange(Number(e.target.value))}
                    className="w-full h-1 rounded-lg cursor-pointer"
                    style={{
                      background: `linear-gradient(to right, ${colors.accentPrimary} 0%, ${colors.accentPrimary} ${((temporalSpacing - 5) / 45) * 100}%, ${colors.border} ${((temporalSpacing - 5) / 45) * 100}%, ${colors.border} 100%)`,
                      accentColor: colors.accentPrimary
                    }}
                  />
                </div>
              )}

              {temporalSpacingMode !== 'equal' && (
                <div className="text-xs" style={{ color: `${colors.text}CC` }}>
                  {temporalSpacingMode === 'log' 
                    ? 'Time points are spaced logarithmically based on their actual values'
                    : 'Time points are spaced according to their actual time values'}
                </div>
              )}
            </div>
          </div>

          {/* Spacing Controls */}
          <div className="space-y-3">
            <h4 className="text-sm font-bold" style={{ color: colors.text }}>Spacing</h4>
            
            <div className="space-y-2">
              <label className="text-xs" style={{ color: colors.accentPrimary }}>
                Spatial Spacing: {spatialSpacing}
              </label>
              <input
                type="range"
                min={50}
                max={500}
                step={10}
                value={spatialSpacing}
                onChange={(e) => onSpatialSpacingChange(Number(e.target.value))}
                className="w-full h-2 rounded-lg appearance-none cursor-pointer"
                style={{
                  background: `linear-gradient(to right, ${colors.accentPrimary} 0%, ${colors.accentPrimary} ${((spatialSpacing - 50) / 450) * 100}%, ${colors.border} ${((spatialSpacing - 50) / 450) * 100}%, ${colors.border} 100%)`,
                  accentColor: colors.accentPrimary
                }}
              />
            </div>
          </div>

          {/* Opacity Controls */}
          <div className="space-y-3">
            <h4 className="text-sm font-bold" style={{ color: colors.text }}>Opacity</h4>
            
            <div className="space-y-2">
              <label className="text-xs" style={{ color: colors.accentPrimary }}>
                Temporal Grid: {temporalGridOpacity}%
              </label>
              <input
                type="range"
                min={0}
                max={100}
                step={5}
                value={temporalGridOpacity}
                onChange={(e) => onTemporalGridOpacityChange(Number(e.target.value))}
                className="w-full h-2 rounded-lg appearance-none cursor-pointer"
                style={{
                  background: `linear-gradient(to right, ${colors.accentPrimary} 0%, ${colors.accentPrimary} ${temporalGridOpacity}%, ${colors.border} ${temporalGridOpacity}%, ${colors.border} 100%)`,
                  accentColor: colors.accentPrimary
                }}
              />
            </div>
            
            <div className="space-y-2">
              <label className="text-xs" style={{ color: colors.accentPrimary }}>
                Geographic Shape: {geographicShapeOpacity}%
              </label>
              <input
                type="range"
                min={0}
                max={100}
                step={5}
                value={geographicShapeOpacity}
                onChange={(e) => onGeographicShapeOpacityChange(Number(e.target.value))}
                className="w-full h-2 rounded-lg appearance-none cursor-pointer"
                style={{
                  background: `linear-gradient(to right, ${colors.accentPrimary} 0%, ${colors.accentPrimary} ${geographicShapeOpacity}%, ${colors.border} ${geographicShapeOpacity}%, ${colors.border} 100%)`,
                  accentColor: colors.accentPrimary
                }}
              />
            </div>
          </div>

          {/* Node Settings */}
          <div className="space-y-3">
            <h4 className="text-sm font-bold" style={{ color: colors.text }}>Node Settings</h4>
            
            <div className="space-y-2">
              <label className="text-xs" style={{ color: colors.accentPrimary }}>
                Max Node Radius: {maxNodeRadius}px
              </label>
              <input
                type="range"
                min={10}
                max={50}
                step={1}
                value={maxNodeRadius}
                onChange={(e) => onMaxNodeRadiusChange(Number(e.target.value))}
                className="w-full h-2 rounded-lg appearance-none cursor-pointer"
                style={{
                  background: `linear-gradient(to right, ${colors.accentPrimary} 0%, ${colors.accentPrimary} ${((maxNodeRadius - 10) / 40) * 100}%, ${colors.border} ${((maxNodeRadius - 10) / 40) * 100}%, ${colors.border} 100%)`,
                  accentColor: colors.accentPrimary
                }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SpatialArg3DControlPanel; 