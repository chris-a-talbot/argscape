import React, { useState, useRef } from 'react';
import { useColorTheme } from '../../context/ColorThemeContext';
import { useDraggable } from '../../hooks/useDraggable';

interface SpatialArgDiffSpecificPanelProps {
  diffEdgeWidth: number;
  onDiffEdgeWidthChange: (value: number) => void;
}

export const SpatialArgDiffSpecificPanel: React.FC<SpatialArgDiffSpecificPanelProps> = ({
  diffEdgeWidth,
  onDiffEdgeWidthChange
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
      className={`border rounded-lg shadow-lg z-40 ${
        isRepositioned ? '' : 'absolute top-4 left-[280px]'
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
        <h3 className="text-sm font-bold flex items-center gap-2" style={{ color: colors.accentPrimary }}>
          <svg className="w-3 h-3 opacity-50" fill="currentColor" viewBox="0 0 24 24">
            <path d="M8 6h8v2H8V6zm0 4h8v2H8v-2zm0 4h8v2H8v-2z"/>
          </svg>
          Diff Controls
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
          {/* Diff-Specific Settings */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 pb-1" style={{ borderBottom: `1px solid ${colors.border}40` }}>
              <h4 className="text-base font-bold" style={{ color: colors.accentPrimary }}>Difference Visualization</h4>
            </div>
            
            {/* Error Bar Thickness */}
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <label className="text-sm font-semibold" style={{ color: colors.text }}>
                  Error Bar Thickness
                </label>
                <span className="text-xs font-mono px-2 py-0.5 rounded" style={{ 
                  color: `${colors.text}CC`, 
                  backgroundColor: `${colors.containerBackground}80` 
                }}>
                  {diffEdgeWidth}x
                </span>
              </div>
              <input
                type="range"
                min="1"
                max="10"
                step="0.5"
                value={diffEdgeWidth}
                onChange={(e) => onDiffEdgeWidthChange(parseFloat(e.target.value))}
                className="w-full h-1 rounded-lg cursor-pointer"
                style={{
                  background: `linear-gradient(to right, ${colors.accentPrimary} 0%, ${colors.accentPrimary} ${((diffEdgeWidth - 1) / 9) * 100}%, ${colors.border} ${((diffEdgeWidth - 1) / 9) * 100}%, ${colors.border} 100%)`,
                  accentColor: colors.accentPrimary
                }}
              />
              <div className="flex justify-between text-xs" style={{ color: `${colors.text}99` }}>
                <span>Thin</span>
                <span>Thick</span>
              </div>
            </div>

            {/* Info about diff visualization */}
            <div className="text-xs space-y-1 p-2 rounded" style={{ 
              color: `${colors.text}B3`,
              backgroundColor: `${colors.containerBackground}40`
            }}>
              <div>This panel controls diff-specific visualization features.</div>
              <div>Error bars show the movement of nodes between the two tree sequences.</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SpatialArgDiffSpecificPanel;

