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
}

export const RangeSlider: React.FC<RangeSliderProps> = ({
  min,
  max,
  step = 1,
  value,
  onChange,
  formatValue = (v) => v.toString(),
  className = ""
}) => {
  const { colors } = useColorTheme();
  const [isDragging, setIsDragging] = useState<'left' | 'right' | 'range' | null>(null);
  const [dragStart, setDragStart] = useState<{ x: number; startValue: [number, number] }>({ x: 0, startValue: [0, 0] });
  const sliderRef = useRef<HTMLDivElement>(null);

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
    setIsDragging(type);
    setDragStart({ x: e.clientX, startValue: value });
  }, [value]);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isDragging || !sliderRef.current) return;

    const newValue = getValueFromPosition(e.clientX);
    const [currentLeft, currentRight] = value;

    if (isDragging === 'left') {
      const newLeft = Math.min(newValue, currentRight - step);
      onChange([Math.max(min, newLeft), currentRight]);
    } else if (isDragging === 'right') {
      const newRight = Math.max(newValue, currentLeft + step);
      onChange([currentLeft, Math.min(max, newRight)]);
    } else if (isDragging === 'range') {
      const deltaX = e.clientX - dragStart.x;
      const rect = sliderRef.current.getBoundingClientRect();
      const deltaValue = (deltaX / rect.width) * (max - min);
      const [startLeft, startRight] = dragStart.startValue;
      const rangeSize = startRight - startLeft;
      
      let newLeft = startLeft + deltaValue;
      let newRight = startRight + deltaValue;
      
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
  }, [isDragging, value, onChange, getValueFromPosition, min, max, step, dragStart]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(null);
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

  return (
    <div className={`relative w-full ${className}`}>
      {/* Value display */}
      <div className="flex justify-between mb-2 text-sm" style={{ color: colors.text }}>
        <span>{formatValue(value[0])}</span>
        <span>{formatValue(value[1])}</span>
      </div>
      
      {/* Slider track */}
      <div 
        ref={sliderRef}
        className="relative h-2 rounded-full cursor-pointer"
        style={{ backgroundColor: colors.containerBackground }}
        onMouseDown={(e) => {
          const newValue = getValueFromPosition(e.clientX);
          const [left, right] = value;
          const leftDistance = Math.abs(newValue - left);
          const rightDistance = Math.abs(newValue - right);
          
          if (leftDistance < rightDistance) {
            handleMouseDown(e, 'left');
          } else {
            handleMouseDown(e, 'right');
          }
        }}
      >
        {/* Selected range */}
        <div 
          className="absolute h-full rounded-full cursor-grab active:cursor-grabbing"
          style={{
            left: `${leftPosition}%`,
            width: `${rightPosition - leftPosition}%`,
            backgroundColor: colors.textSecondary
          }}
          onMouseDown={(e) => handleMouseDown(e, 'range')}
        />
        
        {/* Left handle */}
        <div 
          className="absolute w-4 h-4 border-2 rounded-full transform -translate-x-1/2 -translate-y-1/2 cursor-grab active:cursor-grabbing shadow-md"
          style={{ 
            left: `${leftPosition}%`, 
            top: '50%',
            backgroundColor: colors.background,
            borderColor: colors.textSecondary
          }}
          onMouseDown={(e) => handleMouseDown(e, 'left')}
        />
        
        {/* Right handle */}
        <div 
          className="absolute w-4 h-4 border-2 rounded-full transform -translate-x-1/2 -translate-y-1/2 cursor-grab active:cursor-grabbing shadow-md"
          style={{ 
            left: `${rightPosition}%`, 
            top: '50%',
            backgroundColor: colors.background,
            borderColor: colors.textSecondary
          }}
          onMouseDown={(e) => handleMouseDown(e, 'right')}
        />
      </div>
      
      {/* Min/Max labels */}
      <div className="flex justify-between mt-1 text-xs" style={{ color: colors.text }}>
        <span>{formatValue(min)}</span>
        <span>{formatValue(max)}</span>
      </div>
    </div>
  );
}; 