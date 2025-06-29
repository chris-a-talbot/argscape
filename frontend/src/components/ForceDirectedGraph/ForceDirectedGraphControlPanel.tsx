import React, { useState } from 'react';
import { useColorTheme } from '../../context/ColorThemeContext';
import { SampleOrderControl, SampleOrderType } from '../ui/sample-order-control';
import { NodeSizeSettings, TemporalSpacingMode } from './ForceDirectedGraph.types';

interface ForceDirectedGraphControlPanelProps {
  // Sample order settings
  sampleOrder: SampleOrderType;
  onSampleOrderChange: (order: SampleOrderType) => void;
  
  // Node size settings
  nodeSizes: NodeSizeSettings;
  onNodeSizeChange: (sizes: NodeSizeSettings) => void;
  
  // Edge thickness setting
  edgeThickness: number;
  onEdgeThicknessChange: (thickness: number) => void;

  // Temporal spacing settings
  temporalSpacing: number;
  onTemporalSpacingChange: (value: number) => void;
  temporalSpacingMode: TemporalSpacingMode;
  onTemporalSpacingModeChange: (mode: TemporalSpacingMode) => void;
  
  // Additional controls can be added here in the future
  isLoading?: boolean;
}

export const ForceDirectedGraphControlPanel: React.FC<ForceDirectedGraphControlPanelProps> = ({
  sampleOrder,
  onSampleOrderChange,
  nodeSizes,
  onNodeSizeChange,
  edgeThickness,
  onEdgeThicknessChange,
  temporalSpacing,
  onTemporalSpacingChange,
  temporalSpacingMode,
  onTemporalSpacingModeChange,
  isLoading = false
}) => {
  const { colors } = useColorTheme();
  const [isExpanded, setIsExpanded] = useState(true);

  return (
    <div 
      className="absolute top-4 left-4 border rounded-lg shadow-lg z-20"
      style={{ 
        backgroundColor: `${colors.background}F0`, // 94% opacity
        borderColor: colors.border,
        color: colors.text
      }}
    >
      {/* Control Panel Header */}
      <div 
        onClick={() => setIsExpanded(!isExpanded)}
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
        <div className="p-4 pt-0 space-y-4 max-h-96 overflow-y-auto">
          {/* Temporal Spacing Settings */}
          <div className="space-y-3">
            <h4 className="text-sm font-bold" style={{ color: colors.text }}>Temporal Spacing</h4>
            
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
              >
                Linear
              </button>
            </div>

            <div className="space-y-2">
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

          {/* Sample Order Settings */}
          <div className="space-y-3">
            <h4 className="text-sm font-bold" style={{ color: colors.text }}>Sample Order</h4>
            
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
                  <span className="text-xs" style={{ color: colors.text }}>
                    Updating sample order...
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Node Size Settings */}
          <div className="space-y-3">
            <h4 className="text-sm font-bold" style={{ color: colors.text }}>Node Sizes</h4>
            
            <div className="space-y-3">
              {/* Sample Node Size */}
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-medium" style={{ color: colors.text }}>
                    Sample Nodes
                  </label>
                  <span className="text-xs" style={{ color: colors.text }}>
                    {nodeSizes.sample}px
                  </span>
                </div>
                <input
                  type="range"
                  min="3"
                  max="15"
                  step="1"
                  value={nodeSizes.sample}
                  onChange={(e) => onNodeSizeChange({
                    ...nodeSizes,
                    sample: parseInt(e.target.value)
                  })}
                  className="w-full h-1 rounded-lg cursor-pointer"
                  style={{
                    background: `linear-gradient(to right, ${colors.accentPrimary} 0%, ${colors.accentPrimary} ${((nodeSizes.sample - 3) / 12) * 100}%, ${colors.border} ${((nodeSizes.sample - 3) / 12) * 100}%, ${colors.border} 100%)`,
                    accentColor: colors.accentPrimary
                  }}
                />
              </div>

              {/* Root Node Size */}
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-medium" style={{ color: colors.text }}>
                    Root Nodes
                  </label>
                  <span className="text-xs" style={{ color: colors.text }}>
                    {nodeSizes.root}px
                  </span>
                </div>
                <input
                  type="range"
                  min="3"
                  max="15"
                  step="1"
                  value={nodeSizes.root}
                  onChange={(e) => onNodeSizeChange({
                    ...nodeSizes,
                    root: parseInt(e.target.value)
                  })}
                  className="w-full h-1 rounded-lg cursor-pointer"
                  style={{
                    background: `linear-gradient(to right, ${colors.accentPrimary} 0%, ${colors.accentPrimary} ${((nodeSizes.root - 3) / 12) * 100}%, ${colors.border} ${((nodeSizes.root - 3) / 12) * 100}%, ${colors.border} 100%)`,
                    accentColor: colors.accentPrimary
                  }}
                />
              </div>

              {/* Other Node Size */}
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-medium" style={{ color: colors.text }}>
                    Internal & Combined
                  </label>
                  <span className="text-xs" style={{ color: colors.text }}>
                    {nodeSizes.other}px
                  </span>
                </div>
                <input
                  type="range"
                  min="2"
                  max="10"
                  step="1"
                  value={nodeSizes.other}
                  onChange={(e) => onNodeSizeChange({
                    ...nodeSizes,
                    other: parseInt(e.target.value)
                  })}
                  className="w-full h-1 rounded-lg cursor-pointer"
                  style={{
                    background: `linear-gradient(to right, ${colors.accentPrimary} 0%, ${colors.accentPrimary} ${((nodeSizes.other - 2) / 8) * 100}%, ${colors.border} ${((nodeSizes.other - 2) / 8) * 100}%, ${colors.border} 100%)`,
                    accentColor: colors.accentPrimary
                  }}
                />
              </div>
            </div>
          </div>

          {/* Edge Thickness Setting */}
          <div className="space-y-3">
            <h4 className="text-sm font-bold" style={{ color: colors.text }}>Edge Thickness</h4>
            
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <label className="text-xs font-medium" style={{ color: colors.text }}>
                  Edge Width
                </label>
                <span className="text-xs" style={{ color: colors.text }}>
                  {edgeThickness}px
                </span>
              </div>
              <input
                type="range"
                min="0.5"
                max="3"
                step="0.5"
                value={edgeThickness}
                onChange={(e) => onEdgeThicknessChange(parseFloat(e.target.value))}
                className="w-full h-1 rounded-lg cursor-pointer"
                style={{
                  background: `linear-gradient(to right, ${colors.accentPrimary} 0%, ${colors.accentPrimary} ${((edgeThickness - 0.5) / 2.5) * 100}%, ${colors.border} ${((edgeThickness - 0.5) / 2.5) * 100}%, ${colors.border} 100%)`,
                  accentColor: colors.accentPrimary
                }}
              />
            </div>
          </div>

          {/* Instructions */}
          <div className="space-y-3">
            <h4 className="text-sm font-bold" style={{ color: colors.text }}>Graph Layout</h4>
            <div className="space-y-1 text-xs" style={{ color: `${colors.text}CC` }}>
              <div>• Sample nodes are positioned based on the selected order</div>
              <div>• Internal nodes position themselves relative to descendants</div>
              <div>• Drag nodes to manually adjust positions</div>
              <div>• Use zoom and pan to navigate the graph</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}; 