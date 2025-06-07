import React, { useState } from 'react';
import { useColorTheme } from '../../context/ColorThemeContext';

interface ForceDirectedGraphInfoPanelProps {
  // ARG Statistics
  originalNodeCount?: number;
  originalEdgeCount?: number;
  subargNodeCount?: number;
  subargEdgeCount?: number;
  displayedNodeCount?: number;
  displayedEdgeCount?: number;
  
  // Filter information
  genomicRange?: [number, number];
  sequenceLength?: number;
  isFiltered?: boolean;
  
  // Layout awareness
  isFilterSectionCollapsed?: boolean;
}

export const ForceDirectedGraphInfoPanel: React.FC<ForceDirectedGraphInfoPanelProps> = ({
  originalNodeCount,
  originalEdgeCount,
  subargNodeCount,
  subargEdgeCount,
  displayedNodeCount,
  displayedEdgeCount,
  genomicRange,
  sequenceLength,
  isFiltered = false,
  isFilterSectionCollapsed = true
}) => {
  const { colors } = useColorTheme();
  const [isExpanded, setIsExpanded] = useState(true);

  // Calculate percentage if we have both original and subarg data
  const nodePercentage = originalNodeCount && subargNodeCount 
    ? ((subargNodeCount / originalNodeCount) * 100).toFixed(1)
    : null;

  const edgePercentage = originalEdgeCount && subargEdgeCount 
    ? ((subargEdgeCount / originalEdgeCount) * 100).toFixed(1)
    : null;

  // Don't render if there's no meaningful data to show
  const hasData = originalNodeCount || subargNodeCount || displayedNodeCount;
  
  if (!hasData) {
    return null;
  }

  const formatGenomicPosition = (value: number): string => {
    if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`;
    if (value >= 1000) return `${(value / 1000).toFixed(1)}K`;
    return value.toString();
  };

  return (
    <div 
      className="absolute top-4 right-4 border rounded-lg shadow-lg z-20"
      style={{ 
        backgroundColor: `${colors.background}F0`, // 94% opacity
        borderColor: colors.border,
        color: colors.text
      }}
    >
      {/* Info Panel Header */}
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
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          ARG Information
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

      {/* Info Panel Content */}
      {isExpanded && (
        <div className="p-4 pt-0 space-y-4 max-h-96 overflow-y-auto">
          {/* ARG Statistics */}
          <div className="space-y-3">
            <h4 className="text-sm font-bold" style={{ color: colors.text }}>Graph Statistics</h4>
            
            <div className="space-y-2 text-xs">
              {originalNodeCount && originalEdgeCount && (
                <div className="flex justify-between">
                  <span style={{ color: colors.accentPrimary }}>Original ARG:</span>
                  <span style={{ color: colors.text }}>
                    {originalNodeCount.toLocaleString()} nodes, {originalEdgeCount.toLocaleString()} edges
                  </span>
                </div>
              )}
              
              {subargNodeCount && subargEdgeCount && (
                <div className="flex justify-between">
                  <span style={{ color: colors.accentPrimary }}>SubARG:</span>
                  <span style={{ color: colors.text }}>
                    {subargNodeCount.toLocaleString()} nodes ({nodePercentage}%), {subargEdgeCount.toLocaleString()} edges ({edgePercentage}%)
                  </span>
                </div>
              )}
              
              {displayedNodeCount && displayedEdgeCount && (displayedNodeCount !== subargNodeCount || displayedEdgeCount !== subargEdgeCount) && (
                <div className="flex justify-between">
                  <span style={{ color: colors.accentPrimary }}>Displayed:</span>
                  <span style={{ color: colors.text }}>
                    {displayedNodeCount.toLocaleString()} nodes, {displayedEdgeCount.toLocaleString()} edges
                  </span>
                </div>
              )}

              {displayedNodeCount && originalNodeCount && displayedNodeCount !== originalNodeCount && (
                <div className="flex justify-between">
                  <span style={{ color: colors.accentPrimary }}>Reduction:</span>
                  <span style={{ color: colors.text }}>
                    {((1 - displayedNodeCount / originalNodeCount) * 100).toFixed(1)}% fewer nodes
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Filter Information */}
          {isFiltered && genomicRange && sequenceLength && (
            <div className="space-y-3">
              <h4 className="text-sm font-bold" style={{ color: colors.text }}>Filter Information</h4>
              
              <div className="space-y-2 text-xs">
                <div className="flex justify-between">
                  <span style={{ color: colors.accentPrimary }}>Range:</span>
                  <span style={{ color: colors.text }}>
                    {formatGenomicPosition(genomicRange[0])} - {formatGenomicPosition(genomicRange[1])}
                  </span>
                </div>
                
                <div className="flex justify-between">
                  <span style={{ color: colors.accentPrimary }}>Length:</span>
                  <span style={{ color: colors.text }}>
                    {formatGenomicPosition(genomicRange[1] - genomicRange[0])} bp
                  </span>
                </div>
                
                <div className="flex justify-between">
                  <span style={{ color: colors.accentPrimary }}>Coverage:</span>
                  <span style={{ color: colors.text }}>
                    {((genomicRange[1] - genomicRange[0]) / sequenceLength * 100).toFixed(1)}% of sequence
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* View Instructions */}
          <div className="space-y-3">
            <h4 className="text-sm font-bold" style={{ color: colors.text }}>View Controls</h4>
            <div className="space-y-1 text-xs" style={{ color: `${colors.text}CC` }}>
              <div>• Drag: Pan view</div>
              <div>• Scroll: Zoom in/out</div>
              <div>• Left click: Select node</div>
              <div>• Right click: Show ancestors</div>
              <div>• Drag nodes to reposition</div>
            </div>
          </div>

          {/* Node Types Legend */}
          <div className="space-y-3">
            <h4 className="text-sm font-bold" style={{ color: colors.text }}>Node Types</h4>
            <div className="space-y-2 text-xs">
              <div className="flex items-center gap-2">
                <div 
                  className="w-3 h-3 rounded-full border"
                  style={{
                    backgroundColor: `rgb(${colors.nodeSample[0]}, ${colors.nodeSample[1]}, ${colors.nodeSample[2]})`,
                    borderColor: colors.background,
                    borderWidth: '0.5px'
                  }}
                ></div>
                <span style={{ color: colors.text }}>Sample Nodes</span>
              </div>
              <div className="flex items-center gap-2">
                <div 
                  className="w-3 h-3 rounded-full" 
                  style={{backgroundColor: `rgb(${colors.nodeDefault[0]}, ${colors.nodeDefault[1]}, ${colors.nodeDefault[2]})`}}
                ></div>
                <span style={{ color: colors.text }}>Internal Nodes</span>
              </div>
              <div className="flex items-center gap-2">
                <div 
                  className="w-3 h-3 rounded-full" 
                  style={{backgroundColor: `rgb(${colors.nodeCombined[0]}, ${colors.nodeCombined[1]}, ${colors.nodeCombined[2]})`}}
                ></div>
                <span style={{ color: colors.text }}>Combined Nodes</span>
              </div>
              <div className="flex items-center gap-2">
                <div 
                  className="w-3 h-3 rounded-full border-2" 
                  style={{
                    backgroundColor: `rgb(${colors.nodeRoot[0]}, ${colors.nodeRoot[1]}, ${colors.nodeRoot[2]})`,
                    borderColor: `rgb(${colors.nodeSelected[0]}, ${colors.nodeSelected[1]}, ${colors.nodeSelected[2]})`
                  }}
                ></div>
                <span style={{ color: colors.text }}>Root Nodes</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}; 