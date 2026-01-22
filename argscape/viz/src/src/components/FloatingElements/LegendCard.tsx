import { useState, useRef, useEffect, useCallback } from 'react'
import { ChevronDown, ChevronUp, GripVertical } from 'lucide-react'
import { useUIStore, useFilterStore } from '@/stores'

export function LegendCard() {
  const [minimized, setMinimized] = useState(false)
  const { theme, mutations, showLegend } = useUIStore()
  const { genomicExpanded } = useFilterStore()

  // Drag state
  const [position, setPosition] = useState<{ x: number; y: number } | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const dragStartRef = useRef({ x: 0, y: 0, startX: 0, startY: 0 })
  const cardRef = useRef<HTMLDivElement>(null)

  // Calculate default bottom offset to avoid genomic filter
  const bottomOffset = genomicExpanded ? 96 : 32

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    setIsDragging(true)
    const rect = cardRef.current?.getBoundingClientRect()
    if (rect) {
      dragStartRef.current = {
        x: e.clientX,
        y: e.clientY,
        startX: position?.x ?? rect.left,
        startY: position?.y ?? rect.top,
      }
    }
  }, [position])

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isDragging) return
    const deltaX = e.clientX - dragStartRef.current.x
    const deltaY = e.clientY - dragStartRef.current.y
    setPosition({
      x: dragStartRef.current.startX + deltaX,
      y: dragStartRef.current.startY + deltaY,
    })
  }, [isDragging])

  const handleMouseUp = useCallback(() => {
    setIsDragging(false)
  }, [])

  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove)
      document.addEventListener('mouseup', handleMouseUp)
      return () => {
        document.removeEventListener('mousemove', handleMouseMove)
        document.removeEventListener('mouseup', handleMouseUp)
      }
    }
  }, [isDragging, handleMouseMove, handleMouseUp])

  if (!showLegend || !theme) return null

  // Use custom position if set, otherwise use default
  const positionStyle = position
    ? { left: position.x, top: position.y, bottom: 'auto', right: 'auto' }
    : { bottom: bottomOffset, right: 16 }

  return (
    <div
      ref={cardRef}
      id="legend-card"
      className="absolute z-40"
      style={positionStyle}
    >
      <div className="bg-black/40 backdrop-blur-xl border border-white/10 rounded-lg overflow-hidden">
        {/* Header */}
        <div className="flex items-center">
          <div
            onMouseDown={handleMouseDown}
            className="px-1.5 py-2 cursor-grab active:cursor-grabbing hover:bg-white/10"
            title="Drag to move"
          >
            <GripVertical size={12} className="text-white/50" />
          </div>
          <button
            onClick={() => setMinimized(!minimized)}
            className="flex-1 flex items-center justify-between px-2 py-2 text-white text-xs hover:bg-white/5"
          >
            <span className="font-medium">Legend</span>
            {minimized ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>
        </div>

        {/* Content */}
        {!minimized && (
          <div className="px-3 pb-3 space-y-2">
            <div className="flex items-center gap-2">
              <div
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: theme.nodes.sample }}
              />
              <span className="text-xs text-white/70">Sample</span>
            </div>
            <div className="flex items-center gap-2">
              <div
                className="w-2 h-2 rounded-full"
                style={{ backgroundColor: theme.nodes.internal }}
              />
              <span className="text-xs text-white/70">Internal</span>
            </div>
            <div className="flex items-center gap-2">
              <div
                className="w-2.5 h-2.5 rounded-full"
                style={{ backgroundColor: theme.nodes.root }}
              />
              <span className="text-xs text-white/70">Root</span>
            </div>
            {mutations.show && (
              <div className="flex items-center gap-2">
                <div
                  className="w-2 h-2 rounded-full"
                  style={{ backgroundColor: theme.mutation }}
                />
                <span className="text-xs text-white/70">Mutation</span>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
