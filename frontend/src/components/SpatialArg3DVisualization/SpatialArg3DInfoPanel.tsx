import React, { useState, useRef, useEffect } from 'react';
import { useColorTheme } from '../../context/ColorThemeContext';
import { useResizable } from '../../hooks/useResizable';

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
  const [position, setPosition] = useState({ x: -1, y: 16 }); // Initial position (will be calculated)
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [hasDragged, setHasDragged] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  
  // Add resizable functionality
  const { width, height, ResizeHandles } = useResizable({
    initialWidth: 320,
    initialHeight: 350,
    minWidth: 280,
    minHeight: 200,
    maxWidth: 500,
    maxHeight: 600
  });

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

  // Position panel at top right on mount and adjust when temporal slider visibility changes
  useEffect(() => {
    if (position.x === -1) {
      const rightMargin = 32; // Increased margin from edge for more breathing room
      const temporalSliderWidth = isTemporalSliderVisible ? 120 : 0; // Estimate temporal slider width
      const availableWidth = window.innerWidth - temporalSliderWidth;
      const rightPosition = Math.max(16, availableWidth - width - rightMargin);

      setPosition({ x: rightPosition, y: 16 });
    }
  }, [position.x, isTemporalSliderVisible, width]);

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

  // Calculate percentage if we have both original and subarg data
  const nodePercentage = originalNodeCount && subargNodeCount 
    ? ((subargNodeCount / originalNodeCount) * 100).toFixed(1)
    : null;

  return (
    <div 
      ref={panelRef}
      className="absolute rounded-lg shadow-lg border z-30 select-none"
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
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span className="font-medium text-sm">ARG Information</span>
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
      
      {/* Content */}
      {isExpanded && (
        <div className="p-4 space-y-4 overflow-auto" style={{ maxHeight: height - 60 }}>
          {/* ARG Statistics */}
          <div className="space-y-3">
            <h4 className="text-sm font-bold" style={{ color: colors.text }}>Graph Statistics</h4>
            
            <div className="space-y-2 text-xs">
              {originalNodeCount && originalEdgeCount && (
                <div className="flex justify-between">
                  <span style={{ color: colors.textSecondary }}>Original ARG:</span>
                  <span style={{ color: colors.text }}>
                    {originalNodeCount.toLocaleString()} nodes, {originalEdgeCount.toLocaleString()} edges
                  </span>
                </div>
              )}
              
              {subargNodeCount && subargEdgeCount && (
                <div className="flex justify-between">
                  <span style={{ color: colors.textSecondary }}>SubARG:</span>
                  <span style={{ color: colors.text }}>
                    {subargNodeCount.toLocaleString()} nodes, {subargEdgeCount.toLocaleString()} edges
                  </span>
                </div>
              )}
              
              {displayedNodeCount && displayedEdgeCount && (displayedNodeCount !== subargNodeCount || displayedEdgeCount !== subargEdgeCount) && (
                <div className="flex justify-between">
                  <span style={{ color: colors.textSecondary }}>Displayed ARG:</span>
                  <span style={{ color: colors.text }}>
                    {displayedNodeCount.toLocaleString()} nodes, {displayedEdgeCount.toLocaleString()} edges
                  </span>
                </div>
              )}
              
              {nodePercentage && (
                <div className="flex justify-between">
                  <span style={{ color: colors.textSecondary }}>Coverage:</span>
                  <span style={{ color: colors.text }}>
                    ({nodePercentage}% of original)
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* CRS Detection */}
          {crsDetection && (
            <div className="space-y-3">
              <h4 className="text-sm font-bold" style={{ color: colors.text }}>Geographic Projection</h4>
              
              <div className="space-y-2 text-xs">
                <div className="flex justify-between">
                  <span style={{ color: colors.textSecondary }}>Detected CRS:</span>
                  <span style={{ color: colors.text }}>
                    {crsDetection.crs} ({crsDetection.confidence}% confidence)
                  </span>
                </div>
                
                <div className="flex justify-between">
                  <span style={{ color: colors.textSecondary }}>Land Coverage:</span>
                  <span style={{ color: colors.text }}>
                    {crsDetection.landPercentage.toFixed(1)}% on land
                  </span>
                </div>
                
                <div className="mt-2 p-2 rounded text-xs" style={{ 
                  backgroundColor: colors.background,
                  borderLeft: `3px solid ${colors.textSecondary}`
                }}>
                  <span style={{ color: colors.textSecondary }}>
                    {crsDetection.description}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}; 