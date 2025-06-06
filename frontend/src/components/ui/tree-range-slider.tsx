import React, { useState, useCallback, useRef, useEffect } from 'react';
import { useColorTheme } from '../../context/ColorThemeContext';

interface TreeInterval {
  index: number;
  left: number;
  right: number;
}

interface TreeRangeSliderProps {
  treeIntervals: TreeInterval[];
  value: [number, number]; // [start_tree_index, end_tree_index]
  onChange: (value: [number, number]) => void;
  className?: string;
}

export const TreeRangeSlider: React.FC<TreeRangeSliderProps> = ({
  treeIntervals,
  value,
  onChange,
  className = ""
}) => {
  const { colors } = useColorTheme();
  const [isDragging, setIsDragging] = useState<'left' | 'right' | 'range' | null>(null);
  const [dragStart, setDragStart] = useState<{ x: number; startValue: [number, number] }>({ x: 0, startValue: [0, 0] });
  const sliderRef = useRef<HTMLDivElement>(null);

  if (!treeIntervals || treeIntervals.length === 0) {
    return null;
  }

  const minTreeIndex = 0;
  const maxTreeIndex = treeIntervals.length - 1;

  const getTreeIndexFromPosition = useCallback((clientX: number): number => {
    if (!sliderRef.current) return minTreeIndex;
    
    const rect = sliderRef.current.getBoundingClientRect();
    const percentage = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
    const rawIndex = minTreeIndex + percentage * (maxTreeIndex - minTreeIndex);
    return Math.round(rawIndex);
  }, [minTreeIndex, maxTreeIndex]);

  const getPositionFromTreeIndex = useCallback((treeIndex: number): number => {
    return ((treeIndex - minTreeIndex) / (maxTreeIndex - minTreeIndex)) * 100;
  }, [minTreeIndex, maxTreeIndex]);

  const formatTreeIndexDisplay = useCallback((treeIndex: number): string => {
    if (treeIndex < 0 || treeIndex >= treeIntervals.length) return "Invalid";
    const interval = treeIntervals[treeIndex];
    return `Tree ${treeIndex} (${interval.left.toFixed(1)}-${interval.right.toFixed(1)})`;
  }, [treeIntervals]);

  const formatGenomicSpan = useCallback((startIdx: number, endIdx: number): string => {
    if (startIdx < 0 || endIdx >= treeIntervals.length || startIdx > endIdx) return "Invalid range";
    
    const startPos = treeIntervals[startIdx].left;
    const endPos = treeIntervals[endIdx].right;
    const spanLength = endPos - startPos;
    
    const formatPosition = (pos: number) => {
      if (pos >= 1000000) {
        return `${(pos / 1000000).toFixed(1)}M`;
      } else if (pos >= 1000) {
        return `${(pos / 1000).toFixed(1)}K`;
      }
      return pos.toFixed(1);
    };
    
    return `${formatPosition(spanLength)} bp (${startPos.toFixed(1)}-${endPos.toFixed(1)})`;
  }, [treeIntervals]);

  const handleMouseDown = useCallback((e: React.MouseEvent, type: 'left' | 'right' | 'range') => {
    e.preventDefault();
    setIsDragging(type);
    setDragStart({ x: e.clientX, startValue: value });
  }, [value]);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isDragging || !sliderRef.current) return;

    const newTreeIndex = getTreeIndexFromPosition(e.clientX);
    const [currentLeft, currentRight] = value;

    if (isDragging === 'left') {
      if (newTreeIndex <= currentRight) {
        onChange([Math.max(minTreeIndex, Math.min(maxTreeIndex, newTreeIndex)), currentRight]);
      } else {
        onChange([currentRight, Math.max(minTreeIndex, Math.min(maxTreeIndex, newTreeIndex))]);
      }
    } else if (isDragging === 'right') {
      if (newTreeIndex >= currentLeft) {
        onChange([currentLeft, Math.max(minTreeIndex, Math.min(maxTreeIndex, newTreeIndex))]);
      } else {
        onChange([Math.max(minTreeIndex, Math.min(maxTreeIndex, newTreeIndex)), currentLeft]);
      }
    } else if (isDragging === 'range') {
      const deltaX = e.clientX - dragStart.x;
      const rect = sliderRef.current.getBoundingClientRect();
      const deltaTreeIndex = Math.round((deltaX / rect.width) * (maxTreeIndex - minTreeIndex));
      const [startLeft, startRight] = dragStart.startValue;
      const rangeSize = startRight - startLeft;
      
      let newLeft = startLeft + deltaTreeIndex;
      let newRight = startRight + deltaTreeIndex;
      
      if (newLeft < minTreeIndex) {
        newLeft = minTreeIndex;
        newRight = minTreeIndex + rangeSize;
      }
      if (newRight > maxTreeIndex) {
        newRight = maxTreeIndex;
        newLeft = maxTreeIndex - rangeSize;
      }
      
      onChange([newLeft, newRight]);
    }
  }, [isDragging, value, onChange, getTreeIndexFromPosition, minTreeIndex, maxTreeIndex, dragStart]);

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

  const leftPosition = getPositionFromTreeIndex(value[0]);
  const rightPosition = getPositionFromTreeIndex(value[1]);

  const numSelectedTrees = value[1] - value[0] + 1;

  return (
    <div className={`relative w-full ${className}`}>
      {/* Value display */}
      <div className="flex justify-between mb-2 text-sm" style={{ color: colors.text }}>
        <span>{formatTreeIndexDisplay(value[0])}</span>
        <span>{formatTreeIndexDisplay(value[1])}</span>
      </div>
      
      {/* Slider track */}
      <div 
        ref={sliderRef}
        className="relative h-2 rounded-full cursor-pointer"
        style={{ backgroundColor: colors.containerBackground }}
        onMouseDown={(e) => {
          const newTreeIndex = getTreeIndexFromPosition(e.clientX);
          const [left, right] = value;
          const leftDistance = Math.abs(newTreeIndex - left);
          const rightDistance = Math.abs(newTreeIndex - right);
          
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
      
      {/* Tree index labels and genomic span info */}
      <div className="flex justify-between mt-1 text-xs" style={{ color: colors.text }}>
        <span>Tree 0</span>
        <div className="text-center">
          <div>{numSelectedTrees} tree{numSelectedTrees !== 1 ? 's' : ''} selected</div>
          <div style={{ color: colors.textSecondary }}>{formatGenomicSpan(value[0], value[1])}</div>
        </div>
        <span>Tree {maxTreeIndex}</span>
      </div>
    </div>
  );
}; 