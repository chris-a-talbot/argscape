import React, { useState, useRef } from 'react';
import { useColorTheme } from '../../context/ColorThemeContext';
import { useDraggable } from '../../hooks/useDraggable';

interface SpatialArg3DInfoPanelProps {
  // ARG Statistics
  originalNodeCount?: number;
  originalEdgeCount?: number;
  subargNodeCount?: number;
  subargEdgeCount?: number;
  displayedNodeCount?: number;
  displayedEdgeCount?: number;
  
  // CRS Detection
  crsDetection?: {
    crs: string;
    confidence: number;
    landPercentage: number;
    description: string;
  };
  
  // Layout awareness
  isTemporalSliderVisible?: boolean;
}

export const SpatialArg3DInfoPanel: React.FC<SpatialArg3DInfoPanelProps> = ({
  originalNodeCount,
  originalEdgeCount,
  subargNodeCount,
  subargEdgeCount,
  displayedNodeCount,
  displayedEdgeCount,
  crsDetection,
  isTemporalSliderVisible = false
}) => {
  const { colors } = useColorTheme();
  const [isExpanded, setIsExpanded] = useState(true);
  const dragHandleRef = useRef<HTMLDivElement>(null);

  const { elementRef, dragProps, hasMoved, isRepositioned } = useDraggable({
    initialPosition: { x: 0, y: 0 },
    dragHandleRef: dragHandleRef as React.RefObject<HTMLElement>
  });

  // Calculate percentage if we have both original and subarg data
  const nodePercentage = originalNodeCount && subargNodeCount 
    ? ((subargNodeCount / originalNodeCount) * 100).toFixed(1)
    : null;

  const edgePercentage = originalEdgeCount && subargEdgeCount 
    ? ((subargEdgeCount / originalEdgeCount) * 100).toFixed(1)
    : null;

  // Don't render if there's no meaningful data to show
  const hasData = originalNodeCount || subargNodeCount || displayedNodeCount || crsDetection;
  
  if (!hasData) {
    return null;
  }

  return (
    <div 
      ref={elementRef as React.RefObject<HTMLDivElement>}
      className={`border rounded-lg shadow-lg z-10 ${
        isRepositioned ? '' : 'absolute top-4 right-4'
      }`}
      style={{ 
        backgroundColor: `${colors.background}F0`, // 94% opacity
        borderColor: colors.border,
        color: colors.text,
        maxWidth: '280px', // Make it narrower to leave space for preset panel
        ...dragProps.style
      }}
      onMouseDown={dragProps.onMouseDown}
    >
      {/* Info Panel Header */}
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
          {(originalNodeCount || subargNodeCount || displayedNodeCount) && (
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
          )}

          {/* CRS Detection Information */}
          {crsDetection && (
            <div className="space-y-3">
              <h4 className="text-sm font-bold" style={{ color: colors.text }}>Coordinate System</h4>
              
              <div className="space-y-2 text-xs">
                <div className="flex justify-between">
                  <span style={{ color: colors.accentPrimary }}>Detected CRS:</span>
                  <span style={{ color: colors.text }}>{crsDetection.crs}</span>
                </div>
                
                <div className="flex justify-between">
                  <span style={{ color: colors.accentPrimary }}>Confidence:</span>
                  <span style={{ color: colors.text }}>{(crsDetection.confidence * 100).toFixed(1)}%</span>
                </div>
                
                <div className="flex justify-between">
                  <span style={{ color: colors.accentPrimary }}>Land Coverage:</span>
                  <span style={{ color: colors.text }}>{(crsDetection.landPercentage * 100).toFixed(1)}%</span>
                </div>
                
                {crsDetection.description && (
                  <div className="mt-2">
                    <div className="mb-1" style={{ color: colors.accentPrimary }}>Description:</div>
                    <div className="text-xs italic" style={{ color: `${colors.text}CC` }}>
                      {crsDetection.description}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* View Instructions */}
          <div className="space-y-3">
            <h4 className="text-sm font-bold" style={{ color: colors.text }}>View Controls</h4>
            <div className="space-y-1 text-xs" style={{ color: `${colors.text}CC` }}>
              <div>• Drag: Rotate view</div>
              <div>• Shift+drag: Pan view</div>
              <div>• Scroll: Zoom in/out</div>
              <div>• Left click: Select node</div>
              <div>• Right click: Show ancestors</div>
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