import React, { useState, useRef } from 'react';
import { useColorTheme } from '../../context/ColorThemeContext';
import { useDraggable } from '../../hooks/useDraggable';
import { GeographicShape, NodeSizeSettings } from '../ForceDirectedGraph/ForceDirectedGraph.types';
import { TemporalSpacingMode, NodeIdSettings, EdgeLabelSettings, EdgeMutationSettings } from './SpatialArg3DVisualization.types';
import { Tooltip } from '../ui/tooltip';

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
  
  // Visual settings - temporal grid opacity moved here
  temporalGridOpacity: number;
  onTemporalGridOpacityChange: (value: number) => void;
  
  // Geographic settings - geographic shape opacity moved here
  geographicShapeOpacity: number;
  onGeographicShapeOpacityChange: (value: number) => void;
  
  // Node size settings
  nodeSizes: NodeSizeSettings;
  onNodeSizeChange: (sizes: NodeSizeSettings) => void;
  
  // Node ID settings
  nodeIdSettings: NodeIdSettings;
  onNodeIdSettingsChange: (settings: NodeIdSettings) => void;
  
  // Edge settings
  edgeThickness: number;
  onEdgeThicknessChange: (value: number) => void;
  edgeOpacity: number;
  onEdgeOpacityChange: (value: number) => void;
  
  // Edge label settings
  edgeLabelSettings: EdgeLabelSettings;
  onEdgeLabelSettingsChange: (settings: EdgeLabelSettings) => void;
  
  // Edge mutation settings
  edgeMutationSettings: EdgeMutationSettings;
  onEdgeMutationSettingsChange: (settings: EdgeMutationSettings) => void;
  
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
  nodeSizes,
  onNodeSizeChange,
  nodeIdSettings,
  onNodeIdSettingsChange,
  edgeThickness,
  onEdgeThicknessChange,
  edgeOpacity,
  onEdgeOpacityChange,
  edgeLabelSettings,
  onEdgeLabelSettingsChange,
  edgeMutationSettings,
  onEdgeMutationSettingsChange,
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
        <h3 className="text-sm font-bold flex items-center gap-2" style={{ color: colors.accentPrimary }}>
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
        <div className="p-4 pt-0 space-y-5 max-h-96 overflow-y-auto">
          {/* Geographic Settings */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 pb-1" style={{ borderBottom: `1px solid ${colors.border}40` }}>
              <h4 className="text-base font-bold" style={{ color: colors.accentPrimary }}>Geographic</h4>
            </div>
            
            <div className="space-y-2">
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
                <label className="text-sm font-semibold" style={{ color: colors.text }}>
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

            {/* Geographic Shape Opacity */}
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <label className="text-sm font-semibold" style={{ color: colors.text }}>
                  Shape Opacity
                </label>
                <span className="text-xs font-mono px-2 py-0.5 rounded" style={{ 
                  color: `${colors.text}CC`, 
                  backgroundColor: `${colors.containerBackground}80` 
                }}>
                  {geographicShapeOpacity}%
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                step="5"
                value={geographicShapeOpacity}
                onChange={(e) => onGeographicShapeOpacityChange(Number(e.target.value))}
                className="w-full h-1 rounded-lg cursor-pointer"
                style={{
                  background: `linear-gradient(to right, ${colors.accentPrimary} 0%, ${colors.accentPrimary} ${geographicShapeOpacity}%, ${colors.border} ${geographicShapeOpacity}%, ${colors.border} 100%)`,
                  accentColor: colors.accentPrimary
                }}
              />
            </div>

            {isLoadingGeographic && (
              <div className="flex items-center gap-2">
                <div 
                  className="animate-spin rounded-full h-3 w-3 border border-t-transparent"
                  style={{ borderColor: colors.accentPrimary }}
                ></div>
                <span className="text-xs" style={{ color: `${colors.text}CC` }}>Loading geographic data...</span>
              </div>
            )}

            {currentShape && (
              <div className="text-xs space-y-1 p-2 rounded" style={{ 
                color: `${colors.text}B3`,
                backgroundColor: `${colors.containerBackground}40`
              }}>
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

          {/* Spacing Settings */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 pb-1" style={{ borderBottom: `1px solid ${colors.border}40` }}>
              <h4 className="text-base font-bold" style={{ color: colors.accentPrimary }}>Spacing</h4>
            </div>
            
            {/* Temporal Sub-section */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <h5 className="text-sm font-semibold" style={{ color: `${colors.accentPrimary}CC` }}>Temporal</h5>
                <Tooltip content="Controls how time layers are positioned in the visualization. Equal spacing ignores actual time values, logarithmic compresses recent time and expands ancient time, while linear spacing is proportional to actual time values." />
              </div>
              
              <div className="flex gap-2">
                <button
                  onClick={() => onTemporalSpacingModeChange('equal')}
                  className={`px-3 py-1 text-xs rounded-md transition-colors ${
                    temporalSpacingMode === 'equal' 
                      ? 'bg-blue-500 text-white' 
                      : 'bg-gray-200 hover:bg-gray-300 text-gray-700'
                  }`}
                  style={{
                    backgroundColor: temporalSpacingMode === 'equal' 
                      ? colors.accentPrimary 
                      : `${colors.border}40`,
                    color: temporalSpacingMode === 'equal' 
                      ? colors.background 
                      : colors.text
                  }}
                  title="All time layers spaced equally regardless of actual time values"
                >
                  Equal
                </button>
                <button
                  onClick={() => onTemporalSpacingModeChange('log')}
                  className={`px-3 py-1 text-xs rounded-md transition-colors ${
                    temporalSpacingMode === 'log' 
                      ? 'bg-blue-500 text-white' 
                      : 'bg-gray-200 hover:bg-gray-300 text-gray-700'
                  }`}
                  style={{
                    backgroundColor: temporalSpacingMode === 'log' 
                      ? colors.accentPrimary 
                      : `${colors.border}40`,
                    color: temporalSpacingMode === 'log' 
                      ? colors.background 
                      : colors.text
                  }}
                  title="Logarithmic spacing - compresses recent time, expands ancient time"
                >
                  Log
                </button>
                <button
                  onClick={() => onTemporalSpacingModeChange('linear')}
                  className={`px-3 py-1 text-xs rounded-md transition-colors ${
                    temporalSpacingMode === 'linear' 
                      ? 'bg-blue-500 text-white' 
                      : 'bg-gray-200 hover:bg-gray-300 text-gray-700'
                  }`}
                  style={{
                    backgroundColor: temporalSpacingMode === 'linear' 
                      ? colors.accentPrimary 
                      : `${colors.border}40`,
                    color: temporalSpacingMode === 'linear' 
                      ? colors.background 
                      : colors.text
                  }}
                  title="Linear spacing - proportional to actual time values"
                >
                  Linear
                </button>
              </div>

              {/* Temporal Spacing Slider */}
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold" style={{ color: colors.text }}>
                    Multiplier
                  </span>
                  <span className="text-xs font-mono px-2 py-0.5 rounded" style={{ 
                    color: `${colors.text}CC`, 
                    backgroundColor: `${colors.containerBackground}80` 
                  }}>
                    {temporalSpacing}x
                  </span>
                </div>
                <input
                  type="range"
                  min="5"
                  max="50"
                  step="1"
                  value={temporalSpacing}
                  onChange={(e) => onTemporalSpacingChange(Number(e.target.value))}
                  className="w-full h-1 rounded-lg cursor-pointer"
                  style={{
                    background: `linear-gradient(to right, ${colors.accentPrimary} 0%, ${colors.accentPrimary} ${((temporalSpacing - 5) / 45) * 100}%, ${colors.border} ${((temporalSpacing - 5) / 45) * 100}%, ${colors.border} 100%)`,
                    accentColor: colors.accentPrimary
                  }}
                />
              </div>

              {/* Grid Opacity */}
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-semibold" style={{ color: colors.text }}>
                    Grid Opacity
                  </label>
                  <span className="text-xs font-mono px-2 py-0.5 rounded" style={{ 
                    color: `${colors.text}CC`, 
                    backgroundColor: `${colors.containerBackground}80` 
                  }}>
                    {temporalGridOpacity}%
                  </span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  step="5"
                  value={temporalGridOpacity}
                  onChange={(e) => onTemporalGridOpacityChange(Number(e.target.value))}
                  className="w-full h-1 rounded-lg cursor-pointer"
                  style={{
                    background: `linear-gradient(to right, ${colors.accentPrimary} 0%, ${colors.accentPrimary} ${temporalGridOpacity}%, ${colors.border} ${temporalGridOpacity}%, ${colors.border} 100%)`,
                    accentColor: colors.accentPrimary
                  }}
                />
              </div>
            </div>

            {/* Geographic Sub-section */}
            <div className="space-y-2">
              <h5 className="text-sm font-semibold" style={{ color: `${colors.accentPrimary}CC` }}>Geographic</h5>
              
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold" style={{ color: colors.text }}>
                    Multiplier
                  </span>
                  <span className="text-xs font-mono px-2 py-0.5 rounded" style={{ 
                    color: `${colors.text}CC`, 
                    backgroundColor: `${colors.containerBackground}80` 
                  }}>
                    {spatialSpacing}x
                  </span>
                </div>
                <input
                  type="range"
                  min="50"
                  max="500"
                  step="10"
                  value={spatialSpacing}
                  onChange={(e) => onSpatialSpacingChange(Number(e.target.value))}
                  className="w-full h-1 rounded-lg cursor-pointer"
                  style={{
                    background: `linear-gradient(to right, ${colors.accentPrimary} 0%, ${colors.accentPrimary} ${((spatialSpacing - 50) / 450) * 100}%, ${colors.border} ${((spatialSpacing - 50) / 450) * 100}%, ${colors.border} 100%)`,
                    accentColor: colors.accentPrimary
                  }}
                />
              </div>
            </div>
          </div>

          {/* Nodes */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 pb-1" style={{ borderBottom: `1px solid ${colors.border}40` }}>
              <h4 className="text-base font-bold" style={{ color: colors.accentPrimary }}>Nodes</h4>
            </div>
            
            <div className="space-y-3">
              {/* Sample Node Size */}
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-semibold" style={{ color: colors.text }}>
                    Sample Size
                  </label>
                  <span className="text-xs font-mono px-2 py-0.5 rounded" style={{ 
                    color: `${colors.text}CC`, 
                    backgroundColor: `${colors.containerBackground}80` 
                  }}>
                    {nodeSizes.sample}x
                  </span>
                </div>
                <input
                  type="range"
                  min="2"
                  max="50"
                  step="1"
                  value={nodeSizes.sample}
                  onChange={(e) => onNodeSizeChange({
                    ...nodeSizes,
                    sample: parseInt(e.target.value)
                  })}
                  className="w-full h-1 rounded-lg cursor-pointer"
                  style={{
                    background: `linear-gradient(to right, ${colors.accentPrimary} 0%, ${colors.accentPrimary} ${((nodeSizes.sample - 2) / 48) * 100}%, ${colors.border} ${((nodeSizes.sample - 2) / 48) * 100}%, ${colors.border} 100%)`,
                    accentColor: colors.accentPrimary
                  }}
                />
              </div>

              {/* Root Node Size */}
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-semibold" style={{ color: colors.text }}>
                    Root Size
                  </label>
                  <span className="text-xs font-mono px-2 py-0.5 rounded" style={{ 
                    color: `${colors.text}CC`, 
                    backgroundColor: `${colors.containerBackground}80` 
                  }}>
                    {nodeSizes.root}x
                  </span>
                </div>
                <input
                  type="range"
                  min="2"
                  max="40"
                  step="1"
                  value={nodeSizes.root}
                  onChange={(e) => onNodeSizeChange({
                    ...nodeSizes,
                    root: parseInt(e.target.value)
                  })}
                  className="w-full h-1 rounded-lg cursor-pointer"
                  style={{
                    background: `linear-gradient(to right, ${colors.accentPrimary} 0%, ${colors.accentPrimary} ${((nodeSizes.root - 2) / 38) * 100}%, ${colors.border} ${((nodeSizes.root - 2) / 38) * 100}%, ${colors.border} 100%)`,
                    accentColor: colors.accentPrimary
                  }}
                />
              </div>

              {/* Internal Node Size */}
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-semibold" style={{ color: colors.text }}>
                    Internal Size
                  </label>
                  <span className="text-xs font-mono px-2 py-0.5 rounded" style={{ 
                    color: `${colors.text}CC`, 
                    backgroundColor: `${colors.containerBackground}80` 
                  }}>
                    {nodeSizes.other}x
                  </span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="30"
                  step="1"
                  value={nodeSizes.other}
                  onChange={(e) => onNodeSizeChange({
                    ...nodeSizes,
                    other: parseInt(e.target.value)
                  })}
                  className="w-full h-1 rounded-lg cursor-pointer"
                  style={{
                    background: `linear-gradient(to right, ${colors.accentPrimary} 0%, ${colors.accentPrimary} ${((nodeSizes.other - 1) / 29) * 100}%, ${colors.border} ${((nodeSizes.other - 1) / 29) * 100}%, ${colors.border} 100%)`,
                    accentColor: colors.accentPrimary
                  }}
                />
              </div>
            </div>
          </div>

          {/* Node ID Settings */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <h5 className="text-sm font-semibold" style={{ color: colors.text }}>Node IDs</h5>
            </div>
            
            <div className="space-y-2">
              <label className="flex items-center justify-between">
                <span className="text-xs font-medium" style={{ color: colors.text }}>
                  Sample IDs
                </span>
                <input
                  type="checkbox"
                  checked={nodeIdSettings.showSampleIds}
                  onChange={(e) => onNodeIdSettingsChange({
                    ...nodeIdSettings,
                    showSampleIds: e.target.checked
                  })}
                  className="w-4 h-4 rounded focus:ring-2"
                  style={{
                    accentColor: colors.accentPrimary
                  }}
                />
              </label>
              
              <label className="flex items-center justify-between">
                <span className="text-xs font-medium" style={{ color: colors.text }}>
                  Root IDs
                </span>
                <input
                  type="checkbox"
                  checked={nodeIdSettings.showRootIds}
                  onChange={(e) => onNodeIdSettingsChange({
                    ...nodeIdSettings,
                    showRootIds: e.target.checked
                  })}
                  className="w-4 h-4 rounded focus:ring-2"
                  style={{
                    accentColor: colors.accentPrimary
                  }}
                />
              </label>
              
              <label className="flex items-center justify-between">
                <span className="text-xs font-medium" style={{ color: colors.text }}>
                  Internal IDs
                </span>
                <input
                  type="checkbox"
                  checked={nodeIdSettings.showInternalIds}
                  onChange={(e) => onNodeIdSettingsChange({
                    ...nodeIdSettings,
                    showInternalIds: e.target.checked
                  })}
                  className="w-4 h-4 rounded focus:ring-2"
                  style={{
                    accentColor: colors.accentPrimary
                  }}
                />
              </label>
            </div>
          </div>

          {/* Edges */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 pb-1" style={{ borderBottom: `1px solid ${colors.border}40` }}>
              <h4 className="text-base font-bold" style={{ color: colors.accentPrimary }}>Edges</h4>
            </div>
            
            <div className="space-y-3">
              {/* Edge Width */}
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-semibold" style={{ color: colors.text }}>
                    Width
                  </label>
                  <span className="text-xs font-mono px-2 py-0.5 rounded" style={{ 
                    color: `${colors.text}CC`, 
                    backgroundColor: `${colors.containerBackground}80` 
                  }}>
                    {edgeThickness}x
                  </span>
                </div>
                <input
                  type="range"
                  min="0.5"
                  max="8"
                  step="0.5"
                  value={edgeThickness}
                  onChange={(e) => onEdgeThicknessChange(parseFloat(e.target.value))}
                  className="w-full h-1 rounded-lg cursor-pointer"
                  style={{
                    background: `linear-gradient(to right, ${colors.accentPrimary} 0%, ${colors.accentPrimary} ${((edgeThickness - 0.5) / 7.5) * 100}%, ${colors.border} ${((edgeThickness - 0.5) / 7.5) * 100}%, ${colors.border} 100%)`,
                    accentColor: colors.accentPrimary
                  }}
                />
              </div>

              {/* Edge Opacity */}
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-semibold" style={{ color: colors.text }}>
                    Opacity
                  </label>
                  <span className="text-xs font-mono px-2 py-0.5 rounded" style={{ 
                    color: `${colors.text}CC`, 
                    backgroundColor: `${colors.containerBackground}80` 
                  }}>
                    {edgeOpacity}%
                  </span>
                </div>
                <input
                  type="range"
                  min="10"
                  max="100"
                  step="5"
                  value={edgeOpacity}
                  onChange={(e) => onEdgeOpacityChange(parseInt(e.target.value))}
                  className="w-full h-1 rounded-lg cursor-pointer"
                  style={{
                    background: `linear-gradient(to right, ${colors.accentPrimary} 0%, ${colors.accentPrimary} ${((edgeOpacity - 10) / 90) * 100}%, ${colors.border} ${((edgeOpacity - 10) / 90) * 100}%, ${colors.border} 100%)`,
                    accentColor: colors.accentPrimary
                  }}
                />
              </div>

              {/* Edge Labels */}
              <div className="space-y-1">
                <label className="flex items-center justify-between">
                  <span className="text-xs font-medium" style={{ color: colors.text }}>
                    Show Edge Labels
                  </span>
                  <input
                    type="checkbox"
                    checked={edgeLabelSettings.showEdgeLabels}
                    onChange={(e) => onEdgeLabelSettingsChange({
                      ...edgeLabelSettings,
                      showEdgeLabels: e.target.checked
                    })}
                    className="w-4 h-4 rounded focus:ring-2"
                    style={{
                      accentColor: colors.accentPrimary
                    }}
                  />
                </label>

                {edgeLabelSettings.showEdgeLabels && (
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <label className="text-sm font-semibold" style={{ color: colors.text }}>
                        Label Font Size
                      </label>
                      <span className="text-xs font-mono px-2 py-0.5 rounded" style={{ 
                        color: `${colors.text}CC`, 
                        backgroundColor: `${colors.containerBackground}80` 
                      }}>
                        {edgeLabelSettings.labelFontSize}px
                      </span>
                    </div>
                    <input
                      type="range"
                      min="1"
                      max="20"
                      value={edgeLabelSettings.labelFontSize}
                      onChange={(e) => onEdgeLabelSettingsChange({
                        ...edgeLabelSettings,
                        labelFontSize: parseInt(e.target.value)
                      })}
                      className="w-full h-1 rounded-lg cursor-pointer"
                      style={{
                        background: `linear-gradient(to right, ${colors.accentPrimary} 0%, ${colors.accentPrimary} ${((edgeLabelSettings.labelFontSize - 1) / 19) * 100}%, ${colors.border} ${((edgeLabelSettings.labelFontSize - 1) / 19) * 100}%, ${colors.border} 100%)`,
                        accentColor: colors.accentPrimary
                      }}
                    />
                  </div>
                )}
              </div>

              {/* Mutation Markers */}
              <div className="space-y-1">
                <label className="flex items-center justify-between">
                  <span className="text-xs font-medium" style={{ color: colors.text }}>
                    Show Mutation Markers
                  </span>
                  <input
                    type="checkbox"
                    checked={edgeMutationSettings.showMutationMarkers}
                    onChange={(e) => onEdgeMutationSettingsChange({
                      ...edgeMutationSettings,
                      showMutationMarkers: e.target.checked
                    })}
                    className="w-4 h-4 rounded focus:ring-2"
                    style={{
                      accentColor: colors.accentPrimary
                    }}
                  />
                </label>

                {edgeMutationSettings.showMutationMarkers && (
                  <div className="space-y-1">
                    <label className="flex items-center justify-between text-xs">
                      <span style={{ color: colors.textSecondary }}>Marker Size</span>
                      <span style={{ color: colors.text }}>{edgeMutationSettings.markerSize}</span>
                    </label>
                    <input
                      type="range"
                      min="8"
                      max="30"
                      step="1"
                      value={edgeMutationSettings.markerSize}
                      onChange={(e) => onEdgeMutationSettingsChange({
                        ...edgeMutationSettings,
                        markerSize: Number(e.target.value)
                      })}
                      className="w-full h-1 rounded-lg appearance-none cursor-pointer"
                      style={{
                        background: `linear-gradient(to right, ${colors.accentPrimary} 0%, ${colors.accentPrimary} ${((edgeMutationSettings.markerSize - 8) / (30 - 8)) * 100}%, ${colors.sliderTrack} ${((edgeMutationSettings.markerSize - 8) / (30 - 8)) * 100}%, ${colors.sliderTrack} 100%)`
                      }}
                    />
                  </div>
                )}
              </div>
            </div>
          </div>


        </div>
      )}
    </div>
  );
};

export default SpatialArg3DControlPanel; 