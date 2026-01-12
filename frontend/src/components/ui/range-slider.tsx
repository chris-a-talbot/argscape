import React, { useState, useCallback, useRef, useEffect } from 'react';
import { useColorTheme } from '../../context/ColorThemeContext';

type FilterMode = 'subset' | 'highlight';

interface RangeSliderProps {
  min: number;
  max: number;
  step?: number;
  value: [number, number];
  onChange: (value: [number, number]) => void;
  formatValue?: (value: number) => string;
  className?: string;
  label?: string;
  filterMode?: FilterMode;
  onFilterModeChange?: (mode: FilterMode) => void;
  dimOpacity?: number;
  onDimOpacityChange?: (opacity: number) => void;
}

export const RangeSlider: React.FC<RangeSliderProps> = ({
  min,
  max,
  step = 1,
  value,
  onChange,
  formatValue = (v) => v.toString(),
  className = "",
  label,
  filterMode,
  onFilterModeChange,
  dimOpacity,
  onDimOpacityChange,
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
    gap: '0.375rem',
    fontSize: '0.625rem',
    color: colors.textSecondary,
  };

  const opacitySliderStyle: React.CSSProperties = {
    width: '3.5rem',
    height: '0.25rem',
    appearance: 'none',
    background: colors.border,
    borderRadius: '0.125rem',
    cursor: 'pointer',
  };

  return (
    <div className={`relative w-full ${className}`} style={{ userSelect: 'none' }}>
      {/* Slider track at top - closest to graph */}
      <div
        ref={sliderRef}
        className="relative h-1.5 rounded-full cursor-pointer"
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
          className={`absolute h-full rounded-full transition-all ${
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
          title="Drag to filter. Shift+Drag to move fixed window."
        />

        {/* Left handle */}
        <div
          className={`absolute w-4 h-4 border-2 rounded-full transform -translate-x-1/2 -translate-y-1/2 transition-all hover:scale-110 ${
            isShiftPressed ? 'cursor-move' : 'cursor-grab active:cursor-grabbing'
          }`}
          style={{
            left: `${leftPosition}%`,
            top: '50%',
            backgroundColor: colors.background,
            borderColor: isShiftPressed ? colors.accentPrimary : colors.accentPrimary,
            boxShadow: `0 1px 3px ${colors.background}60`,
            userSelect: 'none'
          }}
          onMouseDown={(e) => {
            e.preventDefault();
            e.stopPropagation();
            handleMouseDown(e, 'left');
          }}
          title="Drag to filter. Shift+Drag to move fixed window."
        />

        {/* Right handle */}
        <div
          className={`absolute w-4 h-4 border-2 rounded-full transform -translate-x-1/2 -translate-y-1/2 transition-all hover:scale-110 ${
            isShiftPressed ? 'cursor-move' : 'cursor-grab active:cursor-grabbing'
          }`}
          style={{
            left: `${rightPosition}%`,
            top: '50%',
            backgroundColor: colors.background,
            borderColor: isShiftPressed ? colors.accentPrimary : colors.accentPrimary,
            boxShadow: `0 1px 3px ${colors.background}60`,
            userSelect: 'none'
          }}
          onMouseDown={(e) => {
            e.preventDefault();
            e.stopPropagation();
            handleMouseDown(e, 'right');
          }}
          title="Drag to filter. Shift+Drag to move fixed window."
        />
      </div>

      {/* Integrated value display: min | selection | max */}
      <div className="flex items-center justify-center gap-2 mt-1.5 text-xs font-mono">
        <span style={{ color: colors.textSecondary }}>{formatValue(min)}</span>
        <span style={{ color: colors.textSecondary }}>|</span>
        {editingLeft ? (
          <input
            ref={leftInputRef}
            type="number"
            value={leftInputValue}
            onChange={handleLeftInputChange}
            onBlur={handleLeftInputBlur}
            onKeyDown={handleLeftInputKeyDown}
            className="w-16 px-1 py-0.5 rounded border focus:outline-none focus:ring-1 text-xs"
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
            className="cursor-pointer px-1 py-0.5 rounded hover:bg-opacity-10 hover:bg-white transition-colors font-semibold"
            style={{ color: colors.accentPrimary }}
            title="Click to edit"
          >
            {formatValue(value[0])}
          </span>
        )}
        <span style={{ color: colors.accentPrimary }}>-</span>
        {editingRight ? (
          <input
            ref={rightInputRef}
            type="number"
            value={rightInputValue}
            onChange={handleRightInputChange}
            onBlur={handleRightInputBlur}
            onKeyDown={handleRightInputKeyDown}
            className="w-16 px-1 py-0.5 rounded border focus:outline-none focus:ring-1 text-xs"
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
            className="cursor-pointer px-1 py-0.5 rounded hover:bg-opacity-10 hover:bg-white transition-colors font-semibold"
            style={{ color: colors.accentPrimary }}
            title="Click to edit"
          >
            {formatValue(value[1])}
          </span>
        )}
        <span style={{ color: colors.textSecondary }}>|</span>
        <span style={{ color: colors.textSecondary }}>{formatValue(max)}</span>
      </div>

      {/* Footer row: Label + Mode toggle + Opacity */}
      {(label || (filterMode !== undefined && onFilterModeChange)) && (
        <div className="flex items-center justify-between mt-1.5">
          {label && (
            <div className="text-xs font-medium" style={{ color: colors.text }}>
              {label}
            </div>
          )}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            {/* Opacity slider - shown when in highlight mode */}
            {filterMode === 'highlight' && dimOpacity !== undefined && onDimOpacityChange && (
              <div style={opacityContainerStyle}>
                <span style={{ opacity: 0.7 }}>Dim:</span>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.01"
                  value={dimOpacity}
                  onChange={(e) => onDimOpacityChange(parseFloat(e.target.value))}
                  style={opacitySliderStyle}
                  className="opacity-slider"
                />
                <span style={{ minWidth: '1.75rem', textAlign: 'right' }}>{Math.round(dimOpacity * 100)}%</span>
              </div>
            )}
            {filterMode !== undefined && onFilterModeChange && (
              <button
                type="button"
                onClick={() => onFilterModeChange(filterMode === 'subset' ? 'highlight' : 'subset')}
                style={modeToggleStyle}
                title={filterMode === 'subset' ? 'Subset: Hide filtered-out nodes' : 'Highlight: Dim filtered-out nodes'}
              >
                {filterMode === 'subset' ? 'Subset' : 'Dim'}
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}; 