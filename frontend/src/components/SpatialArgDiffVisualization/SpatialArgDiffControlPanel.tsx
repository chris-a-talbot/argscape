import React, { useState, useRef } from 'react';
import { useColorTheme } from '../../context/ColorThemeContext';
import { useDraggable } from '../../hooks/useDraggable';
import { GeographicShape } from '../ForceDirectedGraph/ForceDirectedGraph.types';

type GeographicMode = 'unit_grid' | 'eastern_hemisphere' | 'custom';
type TemporalSpacingMode = 'equal' | 'log' | 'linear';

interface CrsDetection {
  likely_crs: string;
  confidence: number;
  land_percentage: number;
  reasoning: string;
}

interface SpatialArgDiffControlPanelProps {
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
  
  diffEdgeWidth: number;
  onDiffEdgeWidthChange: (value: number) => void;
  
  // Geographic settings
  geographicMode: GeographicMode;
  onGeographicModeChange: (mode: GeographicMode) => void;
  
  customShapeFile?: File | null;
  onCustomShapeFileChange: (file: File | null) => void;
  
  isLoadingGeographic: boolean;
  currentShape?: GeographicShape | null;
  
  // CRS warning
  showCrsWarning?: boolean;
  firstCrsDetection?: CrsDetection;
  secondCrsDetection?: CrsDetection;
  onDismissCrsWarning?: () => void;
}

export const SpatialArgDiffControlPanel: React.FC<SpatialArgDiffControlPanelProps> = ({
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
  diffEdgeWidth,
  onDiffEdgeWidthChange,
  geographicMode,
  onGeographicModeChange,
  customShapeFile,
  onCustomShapeFileChange,
  isLoadingGeographic,
  currentShape,
  showCrsWarning,
  firstCrsDetection,
  secondCrsDetection,
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
        backgroundColor: `${colors.background}F0`,
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
          Diff Visualization Controls
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

            {/* Custom Shape File Upload */}
            {geographicMode === 'custom' && (
              <div className="space-y-2">
                <label className="text-xs" style={{ color: colors.accentPrimary }}>
                  Custom Shape File
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="file"
                    accept=".geojson,.json"
                    onChange={handleShapefileUpload}
                    className="hidden"
                    id="shapefileUpload"
                  />
                  <label
                    htmlFor="shapefileUpload"
                    className="px-3 py-1.5 text-xs font-medium rounded cursor-pointer transition-colors"
                    style={{
                      backgroundColor: colors.accentPrimary,
                      color: colors.background
                    }}
                  >
                    Upload GeoJSON
                  </label>
                  {customShapeFile && (
                    <span className="text-xs" style={{ color: colors.text }}>
                      {customShapeFile.name}
                    </span>
                  )}
                </div>
              </div>
            )}

            {/* Loading State */}
            {isLoadingGeographic && (
              <div className="text-xs" style={{ color: colors.text }}>
                Loading geographic shape...
              </div>
            )}

            {/* Current Shape Info */}
            {currentShape && (
              <div className="text-xs space-y-1" style={{ color: colors.text }}>
                <div>Shape: {currentShape.name}</div>
                {currentShape.bounds && (
                  <div>Shape loaded successfully</div>
                )}
              </div>
            )}

            {/* CRS Warning */}
            {showCrsWarning && (
              <div className="mt-4 p-3 rounded" style={{ backgroundColor: `${colors.accentPrimary}20` }}>
                <div className="space-y-2">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      <svg className="w-4 h-4" style={{ color: colors.accentPrimary }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                      </svg>
                      <h5 className="text-sm font-medium" style={{ color: colors.accentPrimary }}>
                        Coordinate System Detection
                      </h5>
                    </div>
                    {onDismissCrsWarning && (
                      <button
                        onClick={onDismissCrsWarning}
                        className="text-xs opacity-50 hover:opacity-100 transition-opacity"
                        style={{ color: colors.accentPrimary }}
                      >
                        Dismiss
                      </button>
                    )}
                  </div>
                  {firstCrsDetection && (
                    <div className="text-xs space-y-1">
                      <div style={{ color: colors.text }}>First Tree Sequence:</div>
                      <div style={{ color: `${colors.text}B3` }}>
                        Likely CRS: {firstCrsDetection.likely_crs}<br />
                        Confidence: {(firstCrsDetection.confidence * 100).toFixed(1)}%<br />
                        Land Coverage: {(firstCrsDetection.land_percentage * 100).toFixed(1)}%
                      </div>
                    </div>
                  )}
                  {secondCrsDetection && (
                    <div className="text-xs space-y-1">
                      <div style={{ color: colors.text }}>Second Tree Sequence:</div>
                      <div style={{ color: `${colors.text}B3` }}>
                        Likely CRS: {secondCrsDetection.likely_crs}<br />
                        Confidence: {(secondCrsDetection.confidence * 100).toFixed(1)}%<br />
                        Land Coverage: {(secondCrsDetection.land_percentage * 100).toFixed(1)}%
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Geographic Shape Opacity */}
            <div className="space-y-2">
              <label className="text-xs" style={{ color: colors.accentPrimary }}>
                Geographic Shape Opacity: {geographicShapeOpacity}%
              </label>
              <input
                type="range"
                min="0"
                max="100"
                value={geographicShapeOpacity}
                onChange={(e) => onGeographicShapeOpacityChange(parseInt(e.target.value))}
                className="w-full h-2 rounded-lg appearance-none cursor-pointer"
                style={{
                  background: `linear-gradient(to right, ${colors.accentPrimary} 0%, ${colors.accentPrimary} ${geographicShapeOpacity}%, ${colors.border} ${geographicShapeOpacity}%, ${colors.border} 100%)`,
                  accentColor: colors.accentPrimary
                }}
              />
            </div>
          </div>

          {/* Temporal Settings */}
          <div className="space-y-3">
            <h4 className="text-sm font-bold" style={{ color: colors.text }}>Temporal Settings</h4>
            
            {/* Temporal Spacing Mode */}
            <div className="space-y-2">
              <label className="text-xs" style={{ color: colors.accentPrimary }}>
                Temporal Spacing Mode
              </label>
              <div className="flex rounded overflow-hidden" style={{ backgroundColor: colors.containerBackground }}>
                <button
                  onClick={() => onTemporalSpacingModeChange('equal')}
                  className="flex-1 px-3 py-1.5 text-xs font-medium transition-colors"
                  style={{
                    backgroundColor: temporalSpacingMode === 'equal' ? colors.accentPrimary : colors.containerBackground,
                    color: temporalSpacingMode === 'equal' ? colors.background : colors.text
                  }}
                >
                  Equal
                </button>
                <button
                  onClick={() => onTemporalSpacingModeChange('log')}
                  className="flex-1 px-3 py-1.5 text-xs font-medium transition-colors"
                  style={{
                    backgroundColor: temporalSpacingMode === 'log' ? colors.accentPrimary : colors.containerBackground,
                    color: temporalSpacingMode === 'log' ? colors.background : colors.text
                  }}
                >
                  Log
                </button>
                <button
                  onClick={() => onTemporalSpacingModeChange('linear')}
                  className="flex-1 px-3 py-1.5 text-xs font-medium transition-colors"
                  style={{
                    backgroundColor: temporalSpacingMode === 'linear' ? colors.accentPrimary : colors.containerBackground,
                    color: temporalSpacingMode === 'linear' ? colors.background : colors.text
                  }}
                >
                  Linear
                </button>
              </div>
              <div className="text-xs" style={{ color: `${colors.text}CC` }}>
                {temporalSpacingMode === 'equal' && (
                  <div>• Time points are spaced equally</div>
                )}
                {temporalSpacingMode === 'log' && (
                  <div>• Time points are spaced logarithmically based on their actual values</div>
                )}
                {temporalSpacingMode === 'linear' && (
                  <div>• Time points are spaced according to their actual time values</div>
                )}
              </div>
            </div>

            {/* Temporal Spacing */}
            <div className="space-y-2">
              <label className="text-xs" style={{ color: colors.accentPrimary }}>
                Temporal Spacing: {temporalSpacing}
              </label>
              <input
                type="range"
                min="1"
                max="50"
                value={temporalSpacing}
                onChange={(e) => onTemporalSpacingChange(Number(e.target.value))}
                className="w-full h-2 rounded-lg appearance-none cursor-pointer"
                style={{
                  background: `linear-gradient(to right, ${colors.accentPrimary} 0%, ${colors.accentPrimary} ${(temporalSpacing / 50) * 100}%, ${colors.border} ${(temporalSpacing / 50) * 100}%, ${colors.border} 100%)`,
                  accentColor: colors.accentPrimary
                }}
              />
            </div>

            {/* Temporal Grid Opacity */}
            <div className="space-y-2">
              <label className="text-xs" style={{ color: colors.accentPrimary }}>
                Temporal Grid Opacity: {temporalGridOpacity}%
              </label>
              <input
                type="range"
                min="0"
                max="100"
                value={temporalGridOpacity}
                onChange={(e) => onTemporalGridOpacityChange(parseInt(e.target.value))}
                className="w-full h-2 rounded-lg appearance-none cursor-pointer"
                style={{
                  background: `linear-gradient(to right, ${colors.accentPrimary} 0%, ${colors.accentPrimary} ${temporalGridOpacity}%, ${colors.border} ${temporalGridOpacity}%, ${colors.border} 100%)`,
                  accentColor: colors.accentPrimary
                }}
              />
            </div>
          </div>

          {/* Visual Settings */}
          <div className="space-y-3">
            <h4 className="text-sm font-bold" style={{ color: colors.text }}>Visual Settings</h4>

            {/* Spatial Spacing */}
            <div className="space-y-2">
              <label className="text-xs" style={{ color: colors.accentPrimary }}>
                Spatial Spacing: {spatialSpacing}
              </label>
              <input
                type="range"
                min="50"
                max="500"
                value={spatialSpacing}
                onChange={(e) => onSpatialSpacingChange(parseInt(e.target.value))}
                className="w-full h-2 rounded-lg appearance-none cursor-pointer"
                style={{
                  background: `linear-gradient(to right, ${colors.accentPrimary} 0%, ${colors.accentPrimary} ${((spatialSpacing - 50) / 450) * 100}%, ${colors.border} ${((spatialSpacing - 50) / 450) * 100}%, ${colors.border} 100%)`,
                  accentColor: colors.accentPrimary
                }}
              />
            </div>

            {/* Node Size */}
            <div className="space-y-2">
              <label className="text-xs" style={{ color: colors.accentPrimary }}>
                Maximum Node Size: {maxNodeRadius}
              </label>
              <input
                type="range"
                min="5"
                max="50"
                value={maxNodeRadius}
                onChange={(e) => onMaxNodeRadiusChange(parseInt(e.target.value))}
                className="w-full h-2 rounded-lg appearance-none cursor-pointer"
                style={{
                  background: `linear-gradient(to right, ${colors.accentPrimary} 0%, ${colors.accentPrimary} ${((maxNodeRadius - 5) / 45) * 100}%, ${colors.border} ${((maxNodeRadius - 5) / 45) * 100}%, ${colors.border} 100%)`,
                  accentColor: colors.accentPrimary
                }}
              />
            </div>

            {/* Diff Edge Width */}
            <div className="space-y-2">
              <label className="text-xs" style={{ color: colors.accentPrimary }}>
                Diff Edge Width: {diffEdgeWidth}
              </label>
              <input
                type="range"
                min="1"
                max="10"
                value={diffEdgeWidth}
                onChange={(e) => onDiffEdgeWidthChange(parseInt(e.target.value))}
                className="w-full h-2 rounded-lg appearance-none cursor-pointer"
                style={{
                  background: `linear-gradient(to right, ${colors.accentPrimary} 0%, ${colors.accentPrimary} ${((diffEdgeWidth - 1) / 9) * 100}%, ${colors.border} ${((diffEdgeWidth - 1) / 9) * 100}%, ${colors.border} 100%)`,
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

export default SpatialArgDiffControlPanel; 