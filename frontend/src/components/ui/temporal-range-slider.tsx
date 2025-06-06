import React, { useState, useCallback, useRef, useEffect } from 'react';
import { useColorTheme } from '../../context/ColorThemeContext';

interface TemporalRangeSliderProps {
  min: number;
  max: number;
  step?: number;
  value: [number, number];
  onChange: (value: [number, number]) => void;
  formatValue?: (value: number) => string;
  className?: string;
  height?: number;
}

export const TemporalRangeSlider: React.FC<TemporalRangeSliderProps> = ({
  min,
  max,
  step = 0.001,
  value,
  onChange,
  formatValue = (v) => v.toFixed(3),
  className = "",
  height = 400
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

    if (isDragging === 'top') {
      // Top handle controls the maximum value - allow it to pass the bottom handle
      const newMax = Math.max(min, Math.min(max, newValue));
      // If handles would cross, swap them
      if (newMax < currentMin) {
        onChange([newMax, currentMin]); // Swap: new value becomes min, old min becomes max
      } else {
        onChange([currentMin, newMax]);
      }
    } else if (isDragging === 'bottom') {
      // Bottom handle controls the minimum value - allow it to pass the top handle
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

  return (
    <div className={`flex items-center gap-3 ${className}`} style={{ height, userSelect: 'none' }}>
      {/* Value labels */}
      <div className="flex flex-col justify-between text-xs" style={{ color: colors.text, height }}>
        <span>{formatValue(max)}</span>
        <span>{formatValue(value[1])}</span>
        <span className="flex-1"></span>
        <span>{formatValue(value[0])}</span>
        <span>{formatValue(min)}</span>
      </div>
      
      {/* Vertical slider track */}
      <div className="flex flex-col items-center">
        <div 
          ref={sliderRef}
          className="relative w-4 rounded-full cursor-pointer"
          style={{ 
            height: height - 40,
            backgroundColor: colors.containerBackground 
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
            className={`absolute w-full rounded-full transition-opacity ${
              isShiftPressed ? 'cursor-grabbing' : 'cursor-grab'
            } active:cursor-grabbing`}
            style={{
              top: `${topPosition}%`,
              height: `${bottomPosition - topPosition}%`,
              backgroundColor: isShiftPressed ? colors.text : colors.textSecondary,
              opacity: isShiftPressed ? 0.8 : 1,
              userSelect: 'none'
            }}
            onMouseDown={(e) => {
              e.preventDefault();
              e.stopPropagation();
              handleMouseDown(e, 'range');
            }}
          />
          
          {/* Top handle (max value) */}
          <div 
            className="absolute w-6 h-6 border-2 rounded-full transform -translate-x-1/2 -translate-y-1/2 cursor-grab active:cursor-grabbing shadow-md"
            style={{ 
              top: `${topPosition}%`, 
              left: '50%',
              backgroundColor: colors.background,
              borderColor: colors.textSecondary,
              userSelect: 'none'
            }}
            onMouseDown={(e) => {
              e.preventDefault();
              e.stopPropagation();
              handleMouseDown(e, 'top');
            }}
          />
          
          {/* Bottom handle (min value) */}
          <div 
            className="absolute w-6 h-6 border-2 rounded-full transform -translate-x-1/2 -translate-y-1/2 cursor-grab active:cursor-grabbing shadow-md"
            style={{ 
              top: `${bottomPosition}%`, 
              left: '50%',
              backgroundColor: colors.background,
              borderColor: colors.textSecondary,
              userSelect: 'none'
            }}
            onMouseDown={(e) => {
              e.preventDefault();
              e.stopPropagation();
              handleMouseDown(e, 'bottom');
            }}
          />
        </div>
        
        {/* Instructions */}
        <div className="mt-2 text-xs text-center" style={{ color: colors.text }}>
          <div>Temporal</div>
          <div>Filter</div>
          {/* Reserve space for the Fixed Size indicator */}
          <div className="mt-1 h-4 flex items-center justify-center">
            {isShiftPressed ? (
              <div className="px-1 py-0.5 rounded text-xs opacity-80" style={{ 
                backgroundColor: colors.textSecondary, 
                color: colors.background,
                fontSize: '10px'
              }}>
                Fixed
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}; 