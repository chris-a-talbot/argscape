import React, { useState, useRef, useEffect, useCallback } from 'react';

interface UseResizableOptions {
  initialWidth?: number;
  initialHeight?: number;
  minWidth?: number;
  minHeight?: number;
  maxWidth?: number;
  maxHeight?: number;
  onResize?: (width: number, height: number) => void;
}

interface ResizeState {
  width: number;
  height: number;
  isResizing: boolean;
  resizeDirection: string | null;
}

export const useResizable = ({
  initialWidth = 320,
  initialHeight = 400,
  minWidth = 200,
  minHeight = 150,
  maxWidth = 800,
  maxHeight = 600,
  onResize
}: UseResizableOptions = {}) => {
  const [state, setState] = useState<ResizeState>({
    width: initialWidth,
    height: initialHeight,
    isResizing: false,
    resizeDirection: null
  });

  const resizeRef = useRef<HTMLDivElement>(null);
  const startPosRef = useRef({ x: 0, y: 0, width: 0, height: 0 });

  const handleMouseDown = useCallback((direction: string) => (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    setState(prev => ({ ...prev, isResizing: true, resizeDirection: direction }));
    startPosRef.current = {
      x: e.clientX,
      y: e.clientY,
      width: state.width,
      height: state.height
    };
  }, [state.width, state.height]);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!state.isResizing || !state.resizeDirection) return;

      const deltaX = e.clientX - startPosRef.current.x;
      const deltaY = e.clientY - startPosRef.current.y;
      
      let newWidth = startPosRef.current.width;
      let newHeight = startPosRef.current.height;

      // Calculate new dimensions based on resize direction
      if (state.resizeDirection.includes('e')) {
        newWidth = startPosRef.current.width + deltaX;
      }
      if (state.resizeDirection.includes('w')) {
        newWidth = startPosRef.current.width - deltaX;
      }
      if (state.resizeDirection.includes('s')) {
        newHeight = startPosRef.current.height + deltaY;
      }
      if (state.resizeDirection.includes('n')) {
        newHeight = startPosRef.current.height - deltaY;
      }

      // Apply constraints
      newWidth = Math.max(minWidth, Math.min(maxWidth, newWidth));
      newHeight = Math.max(minHeight, Math.min(maxHeight, newHeight));

      setState(prev => ({ ...prev, width: newWidth, height: newHeight }));
      onResize?.(newWidth, newHeight);
    };

    const handleMouseUp = () => {
      setState(prev => ({ ...prev, isResizing: false, resizeDirection: null }));
    };

    if (state.isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [state.isResizing, state.resizeDirection, minWidth, minHeight, maxWidth, maxHeight, onResize]);

  const ResizeHandles = () => {
    return (
      <>
        {/* Corner handles */}
        <div
          className="absolute top-0 left-0 w-2 h-2 cursor-nw-resize opacity-0 hover:opacity-100 transition-opacity"
          style={{ background: 'rgba(59, 130, 246, 0.5)' }}
          onMouseDown={handleMouseDown('nw')}
        />
        <div
          className="absolute top-0 right-0 w-2 h-2 cursor-ne-resize opacity-0 hover:opacity-100 transition-opacity"
          style={{ background: 'rgba(59, 130, 246, 0.5)' }}
          onMouseDown={handleMouseDown('ne')}
        />
        <div
          className="absolute bottom-0 left-0 w-2 h-2 cursor-sw-resize opacity-0 hover:opacity-100 transition-opacity"
          style={{ background: 'rgba(59, 130, 246, 0.5)' }}
          onMouseDown={handleMouseDown('sw')}
        />
        <div
          className="absolute bottom-0 right-0 w-2 h-2 cursor-se-resize opacity-0 hover:opacity-100 transition-opacity"
          style={{ background: 'rgba(59, 130, 246, 0.5)' }}
          onMouseDown={handleMouseDown('se')}
        />
        
        {/* Edge handles */}
        <div
          className="absolute top-0 left-2 right-2 h-1 cursor-n-resize opacity-0 hover:opacity-100 transition-opacity"
          style={{ background: 'rgba(59, 130, 246, 0.3)' }}
          onMouseDown={handleMouseDown('n')}
        />
        <div
          className="absolute bottom-0 left-2 right-2 h-1 cursor-s-resize opacity-0 hover:opacity-100 transition-opacity"
          style={{ background: 'rgba(59, 130, 246, 0.3)' }}
          onMouseDown={handleMouseDown('s')}
        />
        <div
          className="absolute left-0 top-2 bottom-2 w-1 cursor-w-resize opacity-0 hover:opacity-100 transition-opacity"
          style={{ background: 'rgba(59, 130, 246, 0.3)' }}
          onMouseDown={handleMouseDown('w')}
        />
        <div
          className="absolute right-0 top-2 bottom-2 w-1 cursor-e-resize opacity-0 hover:opacity-100 transition-opacity"
          style={{ background: 'rgba(59, 130, 246, 0.3)' }}
          onMouseDown={handleMouseDown('e')}
        />
      </>
    );
  };

  return {
    width: state.width,
    height: state.height,
    isResizing: state.isResizing,
    resizeRef,
    ResizeHandles,
    setSize: (width: number, height: number) => setState(prev => ({ ...prev, width, height }))
  };
}; 