import React, { useState, useCallback, useRef, useEffect } from 'react';
import { useColorTheme } from '../../context/ColorThemeContext';

interface RangeSliderProps {
  min: number;
  max: number;
  step?: number;
  value: [number, number];
  onChange: (value: [number, number]) => void;
  formatValue?: (value: number) => string;
  className?: string;
  label?: string;
}

export const RangeSlider: React.FC<RangeSliderProps> = ({
  min,
  max,
  step = 1,
  value,
  onChange,
  formatValue = (v) => v.toString(),
  className = "",
  label
}) => {
  const { colors } = useColorTheme();
  const [isDragging, setIsDragging] = useState<'left' | 'right' | 'range' | null>(null);
  const [dragStart, setDragStart] = useState<{ x: number; startValue: [number, number] }>({ x: 0, startValue: [0, 0] });
  const [isShiftPressed, setIsShiftPressed] = useState(false);
  const [fixedRangeSize, setFixedRangeSize] = useState<number | null>(null);
  const sliderRef = useRef<HTMLDivElement>(null);
  const [editingLeft, setEditingLeft] = useState(false);
  const [editingRight, setEditingRight] = useState(false);
  const [leftInputValue, setLeftInputValue] = useState('');
  const [rightInputValue, setRightInputValue] = useState('');
  const leftInputRef = useRef<HTMLInputElement>(null);
  const rightInputRef = useRef<HTMLInputElement>(null);

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

  const getValueFromPosition = useCallback((clientX: number): number => {
    if (!sliderRef.current) return min;
    
    const rect = sliderRef.current.getBoundingClientRect();
    const percentage = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
    const rawValue = min + percentage * (max - min);
    return Math.round(rawValue / step) * step;
  }, [min, max, step]);

  const getPositionFromValue = useCallback((val: number): number => {
    return ((val - min) / (max - min)) * 100;
  }, [min, max]);

  const handleMouseDown = useCallback((e: React.MouseEvent, type: 'left' | 'right' | 'range') => {
    e.preventDefault();
    e.stopPropagation();
    
    // Prevent text selection during drag
    document.body.style.userSelect = 'none';
    (document.body.style as any).webkitUserSelect = 'none';
    (document.body.style as any).msUserSelect = 'none';
    
    setIsDragging(type);
    setDragStart({ x: e.clientX, startValue: value });
  }, [value]);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isDragging || !sliderRef.current) return;

    const newValue = getValueFromPosition(e.clientX);
    const [currentLeft, currentRight] = value;

    // If Shift is pressed, maintain range size and move the window
    if (isShiftPressed && (isDragging === 'left' || isDragging === 'right')) {
      const rangeSize = currentRight - currentLeft;
      const deltaX = e.clientX - dragStart.x;
      const rect = sliderRef.current.getBoundingClientRect();
      const deltaValue = (deltaX / rect.width) * (max - min);
      const [startLeft, startRight] = dragStart.startValue;
      
      let newLeft = startLeft + deltaValue;
      let newRight = startRight + deltaValue;
      
      // Constrain to bounds
      if (newLeft < min) {
        newLeft = min;
        newRight = min + rangeSize;
      }
      if (newRight > max) {
        newRight = max;
        newLeft = max - rangeSize;
      }
      
      onChange([Math.round(newLeft / step) * step, Math.round(newRight / step) * step]);
    } else if (isDragging === 'left') {
      // Normal mode: expand/contract by moving left handle
      const newLeft = Math.min(newValue, currentRight);
      onChange([Math.max(min, newLeft), currentRight]);
    } else if (isDragging === 'right') {
      // Normal mode: expand/contract by moving right handle
      const newRight = Math.max(newValue, currentLeft);
      onChange([currentLeft, Math.min(max, newRight)]);
    } else if (isDragging === 'range') {
      const deltaX = e.clientX - dragStart.x;
      const rect = sliderRef.current.getBoundingClientRect();
      const deltaValue = (deltaX / rect.width) * (max - min);
      const [startLeft, startRight] = dragStart.startValue;
      
      let rangeSize = Math.abs(startRight - startLeft);
      
      // Use fixed range size if shift is pressed
      if (isShiftPressed && fixedRangeSize !== null) {
        rangeSize = fixedRangeSize;
      }
      
      // Calculate the center point of the original range
      const originalCenter = (startLeft + startRight) / 2;
      const newCenter = originalCenter + deltaValue;
      
      let newLeft, newRight;
      
      if (isShiftPressed && fixedRangeSize !== null) {
        // Maintain fixed range size and move both handles together
        newLeft = newCenter - rangeSize / 2;
        newRight = newCenter + rangeSize / 2;
      } else {
        // Normal range dragging - maintain the original range size
        newLeft = startLeft + deltaValue;
        newRight = startRight + deltaValue;
      }
      
      // Constrain to bounds
      if (newLeft < min) {
        newLeft = min;
        newRight = min + rangeSize;
      }
      if (newRight > max) {
        newRight = max;
        newLeft = max - rangeSize;
      }
      
      onChange([Math.round(newLeft / step) * step, Math.round(newRight / step) * step]);
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

  const leftPosition = getPositionFromValue(value[0]);
  const rightPosition = getPositionFromValue(value[1]);

  // Focus input when editing starts
  useEffect(() => {
    if (editingLeft && leftInputRef.current) {
      leftInputRef.current.focus();
      leftInputRef.current.select();
    }
  }, [editingLeft]);

  useEffect(() => {
    if (editingRight && rightInputRef.current) {
      rightInputRef.current.focus();
      rightInputRef.current.select();
    }
  }, [editingRight]);

  const handleLeftClick = () => {
    setEditingLeft(true);
    setLeftInputValue(value[0].toString());
  };

  const handleRightClick = () => {
    setEditingRight(true);
    setRightInputValue(value[1].toString());
  };

  const handleLeftInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setLeftInputValue(e.target.value);
  };

  const handleRightInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setRightInputValue(e.target.value);
  };

  const handleLeftInputBlur = () => {
    const parsed = parseInt(leftInputValue);
    if (!isNaN(parsed)) {
      const clamped = Math.max(min, Math.min(parsed, value[1]));
      const stepped = Math.round(clamped / step) * step;
      onChange([stepped, value[1]]);
    }
    setEditingLeft(false);
  };

  const handleRightInputBlur = () => {
    const parsed = parseInt(rightInputValue);
    if (!isNaN(parsed)) {
      const clamped = Math.max(value[0], Math.min(parsed, max));
      const stepped = Math.round(clamped / step) * step;
      onChange([value[0], stepped]);
    }
    setEditingRight(false);
  };

  const handleLeftInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleLeftInputBlur();
    } else if (e.key === 'Escape') {
      setEditingLeft(false);
    }
  };

  const handleRightInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleRightInputBlur();
    } else if (e.key === 'Escape') {
      setEditingRight(false);
    }
  };

  return (
    <div className={`relative w-full ${className}`} style={{ userSelect: 'none' }}>
      {/* Label */}
      {label && (
        <div className="mb-2 text-xs font-medium" style={{ color: colors.text }}>
          {label}
        </div>
      )}
      
      {/* Value display */}
      <div className="flex justify-between mb-2 text-sm font-mono" style={{ color: colors.accentPrimary }}>
        {editingLeft ? (
          <input
            ref={leftInputRef}
            type="number"
            value={leftInputValue}
            onChange={handleLeftInputChange}
            onBlur={handleLeftInputBlur}
            onKeyDown={handleLeftInputKeyDown}
            className="w-20 px-2 py-1 rounded border focus:outline-none focus:ring-2"
            style={{
              backgroundColor: colors.background,
              borderColor: colors.accentPrimary,
              color: colors.accentPrimary,
              fontFamily: 'monospace'
            }}
            min={min}
            max={value[1]}
            step={step}
          />
        ) : (
          <span 
            onClick={handleLeftClick}
            className="cursor-pointer px-2 py-1 rounded hover:bg-opacity-10 hover:bg-white transition-colors"
            title="Click to edit"
          >
            {formatValue(value[0])}
          </span>
        )}
        {editingRight ? (
          <input
            ref={rightInputRef}
            type="number"
            value={rightInputValue}
            onChange={handleRightInputChange}
            onBlur={handleRightInputBlur}
            onKeyDown={handleRightInputKeyDown}
            className="w-20 px-2 py-1 rounded border focus:outline-none focus:ring-2"
            style={{
              backgroundColor: colors.background,
              borderColor: colors.accentPrimary,
              color: colors.accentPrimary,
              fontFamily: 'monospace',
              textAlign: 'right'
            }}
            min={value[0]}
            max={max}
            step={step}
          />
        ) : (
          <span 
            onClick={handleRightClick}
            className="cursor-pointer px-2 py-1 rounded hover:bg-opacity-10 hover:bg-white transition-colors"
            title="Click to edit"
          >
            {formatValue(value[1])}
          </span>
        )}
      </div>
      
      {/* Slider track */}
      <div 
        ref={sliderRef}
        className="relative h-3 rounded-lg cursor-pointer"
        style={{ backgroundColor: colors.border }}
        onMouseDown={(e) => {
          const newValue = getValueFromPosition(e.clientX);
          const [left, right] = value;
          const leftDistance = Math.abs(newValue - left);
          const rightDistance = Math.abs(newValue - right);
          
          // If shift is pressed or handles are very close, prefer range dragging
          if (isShiftPressed || Math.abs(right - left) < step * 2) {
            handleMouseDown(e, 'range');
          } else if (leftDistance < rightDistance) {
            handleMouseDown(e, 'left');
          } else {
            handleMouseDown(e, 'right');
          }
        }}
      >
        {/* Selected range */}
        <div 
          className={`absolute h-full rounded-lg transition-all ${
            isShiftPressed ? 'cursor-grabbing' : 'cursor-grab'
          } active:cursor-grabbing`}
          style={{
            left: `${leftPosition}%`,
            width: `${rightPosition - leftPosition}%`,
            backgroundColor: isShiftPressed ? colors.accentPrimary : colors.textSecondary,
            opacity: isShiftPressed ? 0.9 : 0.7,
            userSelect: 'none'
          }}
          onMouseDown={(e) => {
            e.preventDefault();
            e.stopPropagation();
            handleMouseDown(e, 'range');
          }}
        />
        
        {/* Left handle */}
        <div 
          className={`absolute w-5 h-5 border-2 rounded-full transform -translate-x-1/2 -translate-y-1/2 transition-all hover:scale-110 ${
            isShiftPressed ? 'cursor-move' : 'cursor-grab active:cursor-grabbing'
          }`}
          style={{ 
            left: `${leftPosition}%`, 
            top: '50%',
            backgroundColor: colors.background,
            borderColor: isShiftPressed ? colors.accentPrimary : colors.accentPrimary,
            boxShadow: `0 2px 4px ${colors.background}40`,
            userSelect: 'none'
          }}
          onMouseDown={(e) => {
            e.preventDefault();
            e.stopPropagation();
            handleMouseDown(e, 'left');
          }}
        />
        
        {/* Right handle */}
        <div 
          className={`absolute w-5 h-5 border-2 rounded-full transform -translate-x-1/2 -translate-y-1/2 transition-all hover:scale-110 ${
            isShiftPressed ? 'cursor-move' : 'cursor-grab active:cursor-grabbing'
          }`}
          style={{ 
            left: `${rightPosition}%`, 
            top: '50%',
            backgroundColor: colors.background,
            borderColor: isShiftPressed ? colors.accentPrimary : colors.accentPrimary,
            boxShadow: `0 2px 4px ${colors.background}40`,
            userSelect: 'none'
          }}
          onMouseDown={(e) => {
            e.preventDefault();
            e.stopPropagation();
            handleMouseDown(e, 'right');
          }}
        />
      </div>
      
      {/* Min/Max labels and shift indicator */}
      <div className="flex justify-between items-center mt-2 text-xs" style={{ color: colors.textSecondary }}>
        <span>{formatValue(min)}</span>
        <div className="flex items-center justify-center min-h-[18px]">
          {isShiftPressed && (
            <div className="px-2 py-1 rounded text-xs font-medium flex items-center gap-1" style={{ 
              backgroundColor: colors.accentPrimary, 
              color: colors.background,
              fontSize: '10px'
            }}>
              <span>⇄</span>
              <span>Move Range</span>
            </div>
          )}
        </div>
        <span>{formatValue(max)}</span>
      </div>
    </div>
  );
}; 