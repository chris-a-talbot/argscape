import React, { useState, useCallback, useRef, useEffect } from 'react';
import { useColorTheme } from '../../context/ColorThemeContext';

type FilterMode = 'subset' | 'highlight';

interface TemporalRangeSliderProps {
  min: number;
  max: number;
  step?: number;
  value: [number, number];
  onChange: (value: [number, number]) => void;
  formatValue?: (value: number) => string;
  className?: string;
  height?: number;
  label?: string;
  filterMode?: FilterMode;
  onFilterModeChange?: (mode: FilterMode) => void;
  dimOpacity?: number;
  onDimOpacityChange?: (opacity: number) => void;
}

export const TemporalRangeSlider: React.FC<TemporalRangeSliderProps> = ({
  min,
  max,
  step = 0.001,
  value,
  onChange,
  formatValue = (v) => v.toFixed(3),
  className = "",
  height = 400,
  label = "Temporal Range",
  filterMode,
  onFilterModeChange,
  dimOpacity,
  onDimOpacityChange,
}) => {
  const { colors } = useColorTheme();
  const [isDragging, setIsDragging] = useState<'top' | 'bottom' | 'range' | null>(null);
  const [dragStart, setDragStart] = useState<{ y: number; startValue: [number, number] }>({ y: 0, startValue: [0, 0] });
  const [isShiftPressed, setIsShiftPressed] = useState(false);
  const [fixedRangeSize, setFixedRangeSize] = useState<number | null>(null);
  const sliderRef = useRef<HTMLDivElement>(null);

  // Track shift key state
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Shift') {
        setIsShiftPressed(true);
        // Set fixed range size when shift is first pressed
        if (fixedRangeSize === null) {
          const currentRangeSize = Math.abs(value[1] - value[0]);
          // For overlapping handles, use a minimum size
          setFixedRangeSize(Math.max(currentRangeSize, step));
        }
        // Prevent text selection when shift is pressed
        document.body.style.userSelect = 'none';
        (document.body.style as any).webkitUserSelect = 'none';
        (document.body.style as any).msUserSelect = 'none';
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key === 'Shift') {
        setIsShiftPressed(false);
        setFixedRangeSize(null);
        // Restore text selection
        document.body.style.userSelect = '';
        (document.body.style as any).webkitUserSelect = '';
        (document.body.style as any).msUserSelect = '';
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('keyup', handleKeyUp);
    
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('keyup', handleKeyUp);
      // Cleanup: restore text selection
      document.body.style.userSelect = '';
      (document.body.style as any).webkitUserSelect = '';
      (document.body.style as any).msUserSelect = '';
    };
  }, [value, fixedRangeSize, step]);

  const getValueFromPosition = useCallback((clientY: number): number => {
    if (!sliderRef.current) return max;
    
    const rect = sliderRef.current.getBoundingClientRect();
    // Inverted: top of slider = max value, bottom = min value
    const percentage = Math.max(0, Math.min(1, (rect.bottom - clientY) / rect.height));
    const rawValue = min + percentage * (max - min);
    return Math.round(rawValue / step) * step;
  }, [min, max, step]);

  const getPositionFromValue = useCallback((val: number): number => {
    // Inverted: higher values appear at top
    return ((max - val) / (max - min)) * 100;
  }, [min, max]);

  const handleMouseDown = useCallback((e: React.MouseEvent, type: 'top' | 'bottom' | 'range') => {
    e.preventDefault();
    e.stopPropagation();
    
    // Prevent text selection during drag
    document.body.style.userSelect = 'none';
    (document.body.style as any).webkitUserSelect = 'none';
    (document.body.style as any).msUserSelect = 'none';
    
    setIsDragging(type);
    setDragStart({ y: e.clientY, startValue: value });
  }, [value]);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isDragging || !sliderRef.current) return;

    const newValue = getValueFromPosition(e.clientY);
    const [currentMin, currentMax] = value;

    // If Shift is pressed, maintain range size and move the window
    if (isShiftPressed && (isDragging === 'top' || isDragging === 'bottom')) {
      const rangeSize = currentMax - currentMin;
      const deltaY = e.clientY - dragStart.y;
      const rect = sliderRef.current.getBoundingClientRect();
      // Inverted delta because we're working with a vertical slider
      const deltaValue = -(deltaY / rect.height) * (max - min);
      const [startMin, startMax] = dragStart.startValue;
      
      let newMin = startMin + deltaValue;
      let newMax = startMax + deltaValue;
      
      // Constrain to bounds
      if (newMin < min) {
        newMin = min;
        newMax = min + rangeSize;
      }
      if (newMax > max) {
        newMax = max;
        newMin = max - rangeSize;
      }
      
      onChange([Math.round(newMin / step) * step, Math.round(newMax / step) * step]);
    } else if (isDragging === 'top') {
      // Normal mode: expand/contract by moving top handle (max value)
      const newMax = Math.max(min, Math.min(max, newValue));
      // If handles would cross, swap them
      if (newMax < currentMin) {
        onChange([newMax, currentMin]); // Swap: new value becomes min, old min becomes max
      } else {
        onChange([currentMin, newMax]);
      }
    } else if (isDragging === 'bottom') {
      // Normal mode: expand/contract by moving bottom handle (min value)
      const newMin = Math.max(min, Math.min(max, newValue));
      // If handles would cross, swap them
      if (newMin > currentMax) {
        onChange([currentMax, newMin]); // Swap: old max becomes min, new value becomes max
      } else {
        onChange([newMin, currentMax]);
      }
    } else if (isDragging === 'range') {
      const deltaY = e.clientY - dragStart.y;
      const rect = sliderRef.current.getBoundingClientRect();
      // Inverted delta because we're working with a vertical slider
      const deltaValue = -(deltaY / rect.height) * (max - min);
      const [startMin, startMax] = dragStart.startValue;
      
      let rangeSize = Math.abs(startMax - startMin);
      
      // Use fixed range size if shift is pressed
      if (isShiftPressed && fixedRangeSize !== null) {
        rangeSize = fixedRangeSize;
      }
      
      // Calculate the center point of the original range
      const originalCenter = (startMin + startMax) / 2;
      const newCenter = originalCenter + deltaValue;
      
      let newMin, newMax;
      
      if (isShiftPressed && fixedRangeSize !== null) {
        // Maintain fixed range size and move both handles together
        newMin = newCenter - rangeSize / 2;
        newMax = newCenter + rangeSize / 2;
      } else {
        // Normal range dragging - maintain the original range size
        newMin = startMin + deltaValue;
        newMax = startMax + deltaValue;
      }
      
      // Constrain to bounds
      if (newMin < min) {
        newMin = min;
        newMax = min + rangeSize;
      }
      if (newMax > max) {
        newMax = max;
        newMin = max - rangeSize;
      }
      
      onChange([Math.round(newMin / step) * step, Math.round(newMax / step) * step]);
    }
  }, [isDragging, value, onChange, getValueFromPosition, min, max, step, dragStart, isShiftPressed, fixedRangeSize]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(null);
    
    // Restore text selection
    document.body.style.userSelect = '';
    (document.body.style as any).webkitUserSelect = '';
    (document.body.style as any).msUserSelect = '';
  }, []);

  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, handleMouseMove, handleMouseUp]);

  const topPosition = getPositionFromValue(value[1]); // Max value at top
  const bottomPosition = getPositionFromValue(value[0]); // Min value position

  // Mode toggle button style
  const modeToggleStyle: React.CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '0.25rem',
    padding: '0.125rem 0.375rem',
    fontSize: '0.625rem',
    fontWeight: 600,
    border: `1px solid ${colors.border}`,
    borderRadius: '0.25rem',
    background: filterMode === 'subset' ? `${colors.accentPrimary}20` : 'transparent',
    color: filterMode === 'subset' ? colors.accentPrimary : colors.textSecondary,
    cursor: 'pointer',
    transition: 'all 0.15s ease',
    textTransform: 'uppercase',
    letterSpacing: '0.02em',
  };

  // Compact opacity slider style
  const opacityContainerStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: '0.25rem',
    fontSize: '0.5625rem',
    color: colors.textSecondary,
  };

  const opacitySliderStyle: React.CSSProperties = {
    width: '2.5rem',
    height: '0.25rem',
    appearance: 'none',
    background: colors.border,
    borderRadius: '0.125rem',
    cursor: 'pointer',
  };

  return (
    <div className={`flex items-stretch gap-2 ${className}`} style={{ height, userSelect: 'none' }}>
      {/* Vertical header column: rotated label + mode toggle + vertical opacity slider */}
      <div className="flex flex-col items-center justify-between py-2" style={{ minWidth: '1.5rem' }}>
        {/* Rotated label at top */}
        <div
          className="text-xs font-medium whitespace-nowrap"
          style={{
            color: colors.text,
            writingMode: 'vertical-rl',
            transform: 'rotate(180deg)',
            letterSpacing: '0.02em',
          }}
        >
          {label}
        </div>

        {/* Mode toggle in middle */}
        {filterMode !== undefined && onFilterModeChange && (
          <button
            type="button"
            onClick={() => onFilterModeChange(filterMode === 'subset' ? 'highlight' : 'subset')}
            style={{
              ...modeToggleStyle,
              writingMode: 'vertical-rl',
              transform: 'rotate(180deg)',
              padding: '0.25rem 0.125rem',
            }}
            title={filterMode === 'subset' ? 'Subset: Hide filtered-out nodes' : 'Highlight: Dim filtered-out nodes'}
          >
            {filterMode === 'subset' ? 'Sub' : 'Dim'}
          </button>
        )}

        {/* Vertical opacity slider at bottom - shown when in highlight mode */}
        {filterMode === 'highlight' && dimOpacity !== undefined && onDimOpacityChange && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.375rem' }}>
            <span style={{ fontSize: '0.625rem', color: colors.textSecondary }}>
              {Math.round(dimOpacity * 100)}%
            </span>
            <div style={{ position: 'relative', width: '1rem', height: '3.5rem' }}>
              <input
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={dimOpacity}
                onChange={(e) => onDimOpacityChange(parseFloat(e.target.value))}
                style={{
                  position: 'absolute',
                  width: '3.5rem',
                  height: '6px',
                  appearance: 'none',
                  WebkitAppearance: 'none',
                  background: colors.border,
                  borderRadius: '3px',
                  cursor: 'pointer',
                  transform: 'rotate(-90deg)',
                  transformOrigin: 'center center',
                  top: 'calc(50% - 3px)',
                  left: 'calc(50% - 1.75rem)',
                }}
                className="vertical-opacity-slider"
              />
            </div>
            <style>{`
              .vertical-opacity-slider::-webkit-slider-thumb {
                -webkit-appearance: none;
                appearance: none;
                width: 12px;
                height: 12px;
                border-radius: 50%;
                background: ${colors.background};
                border: 2px solid ${colors.accentPrimary};
                cursor: pointer;
                box-shadow: 0 1px 3px rgba(0,0,0,0.2);
              }
              .vertical-opacity-slider::-moz-range-thumb {
                width: 12px;
                height: 12px;
                border-radius: 50%;
                background: ${colors.background};
                border: 2px solid ${colors.accentPrimary};
                cursor: pointer;
                box-shadow: 0 1px 3px rgba(0,0,0,0.2);
              }
              .vertical-opacity-slider::-webkit-slider-runnable-track {
                height: 6px;
                border-radius: 3px;
                background: ${colors.border};
              }
              .vertical-opacity-slider::-moz-range-track {
                height: 6px;
                border-radius: 3px;
                background: ${colors.border};
              }
            `}</style>
          </div>
        )}
      </div>

      {/* Main slider area */}
      <div className="flex items-center gap-1 flex-1">
        {/* Value labels - rotated 45 degrees for compactness */}
        <div className="flex flex-col justify-between items-end text-xs font-mono" style={{ height: height - 60, minWidth: '2rem' }}>
          <span
            style={{ color: colors.textSecondary, transform: 'rotate(-45deg)', transformOrigin: 'right center', whiteSpace: 'nowrap' }}
          >
            {formatValue(max)}
          </span>
          <div className="flex-1 flex flex-col justify-center gap-1 items-end">
            <span
              className="font-bold"
              style={{ color: colors.accentPrimary, transform: 'rotate(-45deg)', transformOrigin: 'right center', whiteSpace: 'nowrap' }}
            >
              {formatValue(value[1])}
            </span>
            <span
              className="font-bold"
              style={{ color: colors.accentPrimary, transform: 'rotate(-45deg)', transformOrigin: 'right center', whiteSpace: 'nowrap' }}
            >
              {formatValue(value[0])}
            </span>
          </div>
          <span
            style={{ color: colors.textSecondary, transform: 'rotate(-45deg)', transformOrigin: 'right center', whiteSpace: 'nowrap' }}
          >
            {formatValue(min)}
          </span>
        </div>

        {/* Vertical slider track - 6px design for better usability */}
        <div className="flex flex-col items-center">
          <div
            ref={sliderRef}
            className="relative w-1.5 rounded-full cursor-pointer"
            style={{
              height: height - 60,
              backgroundColor: colors.border
            }}
            onMouseDown={(e) => {
              const newValue = getValueFromPosition(e.clientY);
              const [minVal, maxVal] = value;
              const minDistance = Math.abs(newValue - minVal);
              const maxDistance = Math.abs(newValue - maxVal);
              
              // If shift is pressed or handles are very close (overlapping), prefer range dragging
              if (isShiftPressed || Math.abs(maxVal - minVal) < step * 2) {
                handleMouseDown(e, 'range');
              } else if (minDistance < maxDistance) {
                handleMouseDown(e, 'bottom');
              } else {
                handleMouseDown(e, 'top');
              }
            }}
          >
            {/* Selected range */}
            <div
              className={`absolute w-full rounded-full transition-all ${
                isShiftPressed ? 'cursor-grabbing' : 'cursor-grab'
              } active:cursor-grabbing`}
              style={{
                top: `${topPosition}%`,
                height: `${bottomPosition - topPosition}%`,
                backgroundColor: isShiftPressed ? colors.accentPrimary : colors.textSecondary,
                opacity: isShiftPressed ? 0.9 : 0.7,
                userSelect: 'none'
              }}
              onMouseDown={(e) => {
                e.preventDefault();
                e.stopPropagation();
                handleMouseDown(e, 'range');
              }}
              title="Drag to filter. Shift+Drag to move fixed window."
            />

            {/* Top handle (max value) */}
            <div
              className={`absolute w-4 h-4 border-2 rounded-full transform -translate-x-1/2 -translate-y-1/2 transition-all hover:scale-110 ${
                isShiftPressed ? 'cursor-move' : 'cursor-grab active:cursor-grabbing'
              }`}
              style={{
                top: `${topPosition}%`,
                left: '50%',
                backgroundColor: colors.background,
                borderColor: colors.accentPrimary,
                boxShadow: `0 1px 3px ${colors.background}60`,
                userSelect: 'none',
                zIndex: isDragging === 'top' ? 10 : 5
              }}
              onMouseDown={(e) => {
                e.preventDefault();
                e.stopPropagation();
                handleMouseDown(e, 'top');
              }}
              title="Drag to filter. Shift+Drag to move fixed window."
            />

            {/* Bottom handle (min value) */}
            <div
              className={`absolute w-4 h-4 border-2 rounded-full transform -translate-x-1/2 -translate-y-1/2 transition-all hover:scale-110 ${
                isShiftPressed ? 'cursor-move' : 'cursor-grab active:cursor-grabbing'
              }`}
              style={{
                top: `${bottomPosition}%`,
                left: '50%',
                backgroundColor: colors.background,
                borderColor: colors.accentPrimary,
                boxShadow: `0 1px 3px ${colors.background}60`,
                userSelect: 'none',
                zIndex: isDragging === 'bottom' ? 10 : 5
              }}
              onMouseDown={(e) => {
                e.preventDefault();
                e.stopPropagation();
                handleMouseDown(e, 'bottom');
              }}
              title="Drag to filter. Shift+Drag to move fixed window."
            />
          </div>
        </div>
      </div>
    </div>
  );
};
