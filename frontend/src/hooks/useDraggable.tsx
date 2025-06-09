import React, { useState, useRef, useEffect, useCallback } from 'react';

interface UseDraggableOptions {
  initialPosition?: { x: number; y: number };
  onPositionChange?: (position: { x: number; y: number }) => void;
  dragHandleRef?: React.RefObject<HTMLElement>;
}

interface DragState {
  position: { x: number; y: number };
  isDragging: boolean;
  dragOffset: { x: number; y: number };
  hasMoved: boolean;
  startTime: number;
}

export const useDraggable = ({
  initialPosition = { x: 0, y: 0 },
  onPositionChange,
  dragHandleRef
}: UseDraggableOptions = {}) => {
  const [state, setState] = useState<DragState>({
    position: initialPosition,
    isDragging: false,
    dragOffset: { x: 0, y: 0 },
    hasMoved: false,
    startTime: 0
  });

  const elementRef = useRef<HTMLElement>(null);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    // Don't start drag if this isn't the drag handle
    if (dragHandleRef?.current && !dragHandleRef.current.contains(e.target as Node)) {
      return;
    }

    const rect = elementRef.current?.getBoundingClientRect();
    if (!rect) return;

    // If this is the first time dragging, set the initial position to current position
    const currentPosition = state.position.x === 0 && state.position.y === 0 
      ? { x: rect.left, y: rect.top }
      : state.position;

    const dragOffset = {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    };

    setState(prev => ({
      ...prev,
      position: currentPosition,
      isDragging: true,
      dragOffset,
      hasMoved: false,
      startTime: Date.now()
    }));

    // Prevent text selection during drag
    document.body.style.userSelect = 'none';
    (document.body.style as any).webkitUserSelect = 'none';
    (document.body.style as any).msUserSelect = 'none';
  }, [dragHandleRef, state.position]);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!state.isDragging) return;

    const newPosition = {
      x: e.clientX - state.dragOffset.x,
      y: e.clientY - state.dragOffset.y
    };

    // Get viewport bounds
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    const elementRect = elementRef.current?.getBoundingClientRect();

    if (elementRect) {
      // Constrain to viewport bounds
      newPosition.x = Math.max(0, Math.min(viewportWidth - elementRect.width, newPosition.x));
      newPosition.y = Math.max(0, Math.min(viewportHeight - elementRect.height, newPosition.y));
    }

    // Only mark as moved if we've actually moved a significant distance or time has passed
    const timePassed = Date.now() - state.startTime > 150; // 150ms threshold
    const distanceMoved = Math.abs(newPosition.x - state.position.x) > 3 || Math.abs(newPosition.y - state.position.y) > 3;
    
    setState(prev => ({ 
      ...prev, 
      position: newPosition, 
      hasMoved: prev.hasMoved || timePassed || distanceMoved 
    }));
    onPositionChange?.(newPosition);
  }, [state.isDragging, state.dragOffset, state.startTime, state.position, onPositionChange]);

  const handleMouseUp = useCallback(() => {
    setState(prev => ({ ...prev, isDragging: false }));

    // Restore text selection
    document.body.style.userSelect = '';
    (document.body.style as any).webkitUserSelect = '';
    (document.body.style as any).msUserSelect = '';
  }, []);

  useEffect(() => {
    if (state.isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);

      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [state.isDragging, handleMouseMove, handleMouseUp]);

  const isRepositioned = state.position.x !== 0 || state.position.y !== 0;
  
  return {
    position: state.position,
    isDragging: state.isDragging,
    hasMoved: state.hasMoved,
    isRepositioned,
    elementRef,
    dragProps: {
      onMouseDown: handleMouseDown,
      style: isRepositioned ? {
        position: 'fixed' as const,
        left: state.position.x,
        top: state.position.y,
        cursor: state.isDragging ? 'grabbing' : 'grab',
        zIndex: state.isDragging ? 9999 : undefined
      } : {
        cursor: 'grab'
      }
    },
    setPosition: (position: { x: number; y: number }) => {
      setState(prev => ({ ...prev, position }));
      onPositionChange?.(position);
    }
  };
}; 