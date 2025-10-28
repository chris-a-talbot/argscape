import React, { useState, useRef } from 'react';
import { useColorTheme } from '../../../context/ColorThemeContext';
import { useDraggable } from '../../../hooks/useDraggable';
import { SampleOrderControl, SampleOrderType } from '../../ui/sample-order-control';
import { NodeSizeSettings, TemporalSpacingMode, NodeIdSettings, EdgeLabelSettings, EdgeMutationSettings } from './ForceDirectedGraph.types';
import { Tooltip } from '../../ui/tooltip';

interface ForceDirectedGraphControlPanelProps {
  // Sample order settings
  sampleOrder: SampleOrderType;
  onSampleOrderChange: (order: SampleOrderType) => void;
  
  // Node size settings
  nodeSizes: NodeSizeSettings;
  onNodeSizeChange: (sizes: NodeSizeSettings) => void;
  
  // Node ID settings
  nodeIdSettings: NodeIdSettings;
  onNodeIdSettingsChange: (settings: NodeIdSettings) => void;
  
  // Edge settings
  edgeThickness: number;
  onEdgeThicknessChange: (thickness: number) => void;
  edgeOpacity: number;
  onEdgeOpacityChange: (opacity: number) => void;
  
  // Edge label settings
  edgeLabelSettings: EdgeLabelSettings;
  onEdgeLabelSettingsChange: (settings: EdgeLabelSettings) => void;

  // Edge mutation settings
  edgeMutationSettings: EdgeMutationSettings;
  onEdgeMutationSettingsChange: (settings: EdgeMutationSettings) => void;

  // Temporal spacing settings
  temporalSpacingMode: TemporalSpacingMode;
  onTemporalSpacingModeChange: (mode: TemporalSpacingMode) => void;
  temporalSpacing: number;
  onTemporalSpacingChange: (spacing: number) => void;
  
  // Sample spacing settings
  sampleSpacing: number;
  onSampleSpacingChange: (spacing: number) => void;
  
  // Additional controls can be added here in the future
  isLoading?: boolean;
}

export const ForceDirectedGraphControlPanel: React.FC<ForceDirectedGraphControlPanelProps> = ({
  sampleOrder,
  onSampleOrderChange,
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
  temporalSpacingMode,
  onTemporalSpacingModeChange,
  temporalSpacing,
  onTemporalSpacingChange,
  sampleSpacing,
  onSampleSpacingChange,
  isLoading = false
}) => {
  const { colors } = useColorTheme();
  const [isExpanded, setIsExpanded] = useState(true);
  const dragHandleRef = useRef<HTMLDivElement>(null);

  const { elementRef, dragProps, hasMoved, isRepositioned } = useDraggable({
    initialPosition: { x: 0, y: 0 },
    dragHandleRef: dragHandleRef as React.RefObject<HTMLElement>
  });

  return (
    <div 
      ref={elementRef as React.RefObject<HTMLDivElement>}
      className={`border rounded-lg shadow-lg z-20 ${
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
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4" />
          </svg>
          Graph Controls
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
                  onChange={(e) => onTemporalSpacingChange(parseInt(e.target.value))}
                  className="w-full h-1 rounded-lg cursor-pointer"
                  style={{
                    background: `linear-gradient(to right, ${colors.accentPrimary} 0%, ${colors.accentPrimary} ${((temporalSpacing - 5) / 45) * 100}%, ${colors.border} ${((temporalSpacing - 5) / 45) * 100}%, ${colors.border} 100%)`,
                    accentColor: colors.accentPrimary
                  }}
                />
              </div>
            </div>

            {/* Sample Sub-section */}
            <div className="space-y-2">
              <h5 className="text-sm font-semibold" style={{ color: `${colors.accentPrimary}CC` }}>Sample</h5>
              
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold" style={{ color: colors.text }}>
                    Multiplier
                  </span>
                  <span className="text-xs font-mono px-2 py-0.5 rounded" style={{ 
                    color: `${colors.text}CC`, 
                    backgroundColor: `${colors.containerBackground}80` 
                  }}>
                    {sampleSpacing}x
                  </span>
                </div>
                <input
                  type="range"
                  min="5"
                  max="50"
                  step="1"
                  value={sampleSpacing}
                  onChange={(e) => onSampleSpacingChange(parseInt(e.target.value))}
                  className="w-full h-1 rounded-lg cursor-pointer"
                  style={{
                    background: `linear-gradient(to right, ${colors.accentPrimary} 0%, ${colors.accentPrimary} ${((sampleSpacing - 5) / 45) * 100}%, ${colors.border} ${((sampleSpacing - 5) / 45) * 100}%, ${colors.border} 100%)`,
                    accentColor: colors.accentPrimary
                  }}
                />
              </div>
            </div>
          </div>

          {/* Sample Order Settings */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 pb-1" style={{ borderBottom: `1px solid ${colors.border}40` }}>
              <h4 className="text-base font-bold" style={{ color: colors.accentPrimary }}>Sample Order</h4>
              <Tooltip content="Different algorithms for arranging samples horizontally. Basic orders use simple rules, Custom orders use tree topology and coalescence patterns, Static orders use graph optimization to minimize visual complexity." />
            </div>
            
            <div className="space-y-2">
              <SampleOrderControl
                value={sampleOrder}
                onChange={onSampleOrderChange}
              />
              
              {isLoading && (
                <div className="flex items-center gap-2">
                  <div 
                    className="animate-spin rounded-full h-3 w-3 border border-t-transparent"
                    style={{ borderColor: colors.accentPrimary }}
                  ></div>
                  <span className="text-xs" style={{ color: `${colors.text}CC` }}>
                    Updating sample order...
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Node Size Settings */}
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
                    {nodeSizes.sample}px
                  </span>
                </div>
                <input
                  type="range"
                  min="2"
                  max="25"
                  step="1"
                  value={nodeSizes.sample}
                  onChange={(e) => onNodeSizeChange({
                    ...nodeSizes,
                    sample: parseInt(e.target.value)
                  })}
                  className="w-full h-1 rounded-lg cursor-pointer"
                  style={{
                    background: `linear-gradient(to right, ${colors.accentPrimary} 0%, ${colors.accentPrimary} ${((nodeSizes.sample - 2) / 23) * 100}%, ${colors.border} ${((nodeSizes.sample - 2) / 23) * 100}%, ${colors.border} 100%)`,
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
                    {nodeSizes.root}px
                  </span>
                </div>
                <input
                  type="range"
                  min="2"
                  max="20"
                  step="1"
                  value={nodeSizes.root}
                  onChange={(e) => onNodeSizeChange({
                    ...nodeSizes,
                    root: parseInt(e.target.value)
                  })}
                  className="w-full h-1 rounded-lg cursor-pointer"
                  style={{
                    background: `linear-gradient(to right, ${colors.accentPrimary} 0%, ${colors.accentPrimary} ${((nodeSizes.root - 2) / 18) * 100}%, ${colors.border} ${((nodeSizes.root - 2) / 18) * 100}%, ${colors.border} 100%)`,
                    accentColor: colors.accentPrimary
                  }}
                />
              </div>

              {/* Other Node Size */}
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-semibold" style={{ color: colors.text }}>
                    Internal Size
                  </label>
                  <span className="text-xs font-mono px-2 py-0.5 rounded" style={{ 
                    color: `${colors.text}CC`, 
                    backgroundColor: `${colors.containerBackground}80` 
                  }}>
                    {nodeSizes.other}px
                  </span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="15"
                  step="1"
                  value={nodeSizes.other}
                  onChange={(e) => onNodeSizeChange({
                    ...nodeSizes,
                    other: parseInt(e.target.value)
                  })}
                  className="w-full h-1 rounded-lg cursor-pointer"
                  style={{
                    background: `linear-gradient(to right, ${colors.accentPrimary} 0%, ${colors.accentPrimary} ${((nodeSizes.other - 1) / 14) * 100}%, ${colors.border} ${((nodeSizes.other - 1) / 14) * 100}%, ${colors.border} 100%)`,
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

          {/* Edge Settings */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 pb-1" style={{ borderBottom: `1px solid ${colors.border}40` }}>
              <h4 className="text-base font-bold" style={{ color: colors.accentPrimary }}>Edges</h4>
            </div>
            
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <label className="text-sm font-semibold" style={{ color: colors.text }}>
                  Width
                </label>
                <span className="text-xs font-mono px-2 py-0.5 rounded" style={{ 
                  color: `${colors.text}CC`, 
                  backgroundColor: `${colors.containerBackground}80` 
                }}>
                  {edgeThickness}px
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
              
              {/* Font Size Control */}
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
                    min="8"
                    max="16"
                    step="1"
                    value={edgeLabelSettings.labelFontSize}
                    onChange={(e) => onEdgeLabelSettingsChange({
                      ...edgeLabelSettings,
                      labelFontSize: parseInt(e.target.value)
                    })}
                    className="w-full h-1 rounded-lg cursor-pointer"
                    style={{
                      background: `linear-gradient(to right, ${colors.accentPrimary} 0%, ${colors.accentPrimary} ${((edgeLabelSettings.labelFontSize - 8) / 8) * 100}%, ${colors.border} ${((edgeLabelSettings.labelFontSize - 8) / 8) * 100}%, ${colors.border} 100%)`,
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
                      background: `linear-gradient(to right, ${colors.accentPrimary} 0%, ${colors.accentPrimary} ${((edgeMutationSettings.markerSize - 8) / (30 - 8)) * 100}%, ${colors.border} ${((edgeMutationSettings.markerSize - 8) / (30 - 8)) * 100}%, ${colors.border} 100%)`
                    }}
                  />
                </div>
              )}
            </div>
          </div>

        </div>
      )}
    </div>
  );
}; 