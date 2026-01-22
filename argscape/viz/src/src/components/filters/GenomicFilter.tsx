import { useCallback, useRef, useState, useEffect } from 'react'
import { ChevronUp } from 'lucide-react'
import { useFilterStore } from '@/stores'
import { useUIStore } from '@/stores'

export function GenomicFilter() {
  const theme = useUIStore((state) => state.theme)
  const {
    genomicMode,
    genomicRange,
    genomicExpanded,
    temporalExpanded,
    sequenceLength,
    numTrees,
    setGenomicMode,
    setGenomicRange,
    setGenomicExpanded,
  } = useFilterStore()

  const sliderRef = useRef<HTMLDivElement>(null)
  const [isDragging, setIsDragging] = useState<'left' | 'right' | 'range' | null>(null)
  const [dragStart, setDragStart] = useState({ x: 0, startValue: [0, 0] as [number, number] })
  const [isShiftPressed, setIsShiftPressed] = useState(false)

  const max = genomicMode === 'position' ? sequenceLength : numTrees - 1
  const min = 0
  const step = 1
  const currentRange = genomicRange || [min, max]

  // Track shift key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Shift') setIsShiftPressed(true)
    }
    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key === 'Shift') setIsShiftPressed(false)
    }
    document.addEventListener('keydown', handleKeyDown)
    document.addEventListener('keyup', handleKeyUp)
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      document.removeEventListener('keyup', handleKeyUp)
    }
  }, [])

  const getValueFromPosition = useCallback(
    (clientX: number): number => {
      if (!sliderRef.current) return min
      const rect = sliderRef.current.getBoundingClientRect()
      const percentage = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width))
      const rawValue = min + percentage * (max - min)
      return Math.round(rawValue / step) * step
    },
    [min, max, step]
  )

  const getPositionFromValue = useCallback(
    (val: number): number => {
      const range = max - min
      return range === 0 ? 0 : ((val - min) / range) * 100
    },
    [min, max]
  )

  const handleMouseDown = useCallback(
    (e: React.MouseEvent, type: 'left' | 'right' | 'range') => {
      e.preventDefault()
      e.stopPropagation()
      setIsDragging(type)
      setDragStart({ x: e.clientX, startValue: currentRange })
    },
    [currentRange]
  )

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!isDragging || !sliderRef.current) return
      const newValue = getValueFromPosition(e.clientX)
      const [currentLeft, currentRight] = currentRange
      const rangeSize = currentRight - currentLeft

      if (isShiftPressed && (isDragging === 'left' || isDragging === 'right')) {
        // Move window with fixed size
        const deltaX = e.clientX - dragStart.x
        const rect = sliderRef.current.getBoundingClientRect()
        const deltaValue = (deltaX / rect.width) * (max - min)
        let newLeft = dragStart.startValue[0] + deltaValue
        let newRight = dragStart.startValue[1] + deltaValue

        if (newLeft < min) {
          newLeft = min
          newRight = min + rangeSize
        }
        if (newRight > max) {
          newRight = max
          newLeft = max - rangeSize
        }
        setGenomicRange([Math.round(newLeft / step) * step, Math.round(newRight / step) * step])
      } else if (isDragging === 'left') {
        const newLeft = Math.min(newValue, currentRight)
        setGenomicRange([Math.max(min, newLeft), currentRight])
      } else if (isDragging === 'right') {
        const newRight = Math.max(newValue, currentLeft)
        setGenomicRange([currentLeft, Math.min(max, newRight)])
      } else if (isDragging === 'range') {
        const deltaX = e.clientX - dragStart.x
        const rect = sliderRef.current.getBoundingClientRect()
        const deltaValue = (deltaX / rect.width) * (max - min)
        let newLeft = dragStart.startValue[0] + deltaValue
        let newRight = dragStart.startValue[1] + deltaValue

        if (newLeft < min) {
          newLeft = min
          newRight = min + rangeSize
        }
        if (newRight > max) {
          newRight = max
          newLeft = max - rangeSize
        }
        setGenomicRange([Math.round(newLeft / step) * step, Math.round(newRight / step) * step])
      }
    },
    [isDragging, currentRange, getValueFromPosition, min, max, step, dragStart, isShiftPressed, setGenomicRange]
  )

  const handleMouseUp = useCallback(() => {
    setIsDragging(null)
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

  // Clamp positions to valid range (0-100)
  const leftPos = Math.max(0, Math.min(100, getPositionFromValue(currentRange[0])))
  const rightPos = Math.max(0, Math.min(100, getPositionFromValue(currentRange[1])))

  const formatValue = (v: number) => {
    if (genomicMode === 'tree') return `Tree ${v}`
    if (v >= 1000000) return `${(v / 1000000).toFixed(1)}Mb`
    if (v >= 1000) return `${(v / 1000).toFixed(1)}kb`
    return `${v}bp`
  }

  if (!theme) return null

  // Calculate left offset to account for temporal filter
  const leftOffset = temporalExpanded ? 64 : 16

  // Collapsed view: minimal indicator bar with hover expand hint
  if (!genomicExpanded) {
    return (
      <div
        className="absolute bottom-0 right-0 h-5 cursor-pointer group"
        style={{ left: leftOffset, background: theme.background }}
        onClick={() => setGenomicExpanded(true)}
      >
        <div className="relative h-1.5 mx-4 mt-2 rounded-full" style={{ background: `${theme.text}20` }}>
          <div
            className="absolute h-full rounded-full"
            style={{
              left: `${leftPos}%`,
              width: `${rightPos - leftPos}%`,
              background: theme.nodes.sample,
            }}
          />
          {/* Subtle expand indicator on hover */}
          <div
            className="absolute left-1/2 -translate-x-1/2 -top-2 opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <ChevronUp size={14} style={{ color: theme.nodes.sample }} />
          </div>
        </div>
      </div>
    )
  }

  // Expanded view
  return (
    <div
      className="absolute bottom-0 right-0 p-3"
      style={{
        left: leftOffset,
        background: `${theme.background}f0`,
        backdropFilter: 'blur(8px)',
        borderTop: `1px solid ${theme.text}20`,
      }}
    >
      {/* Header: Mode toggle + Collapse button */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex gap-1">
          <button
            onClick={() => setGenomicMode('position')}
            className="px-2 py-0.5 text-xs rounded transition-colors"
            style={{
              background: genomicMode === 'position' ? theme.nodes.sample : 'transparent',
              color: genomicMode === 'position' ? theme.background : theme.text_secondary,
              border: `1px solid ${theme.text}30`,
            }}
          >
            Pos
          </button>
          <button
            onClick={() => setGenomicMode('tree')}
            className="px-2 py-0.5 text-xs rounded transition-colors"
            style={{
              background: genomicMode === 'tree' ? theme.nodes.sample : 'transparent',
              color: genomicMode === 'tree' ? theme.background : theme.text_secondary,
              border: `1px solid ${theme.text}30`,
            }}
          >
            Tree
          </button>
        </div>
        <button
          onClick={() => setGenomicExpanded(false)}
          className="text-xs px-2 py-0.5 rounded"
          style={{ color: theme.text_secondary }}
        >
          Collapse
        </button>
      </div>

      {/* Slider */}
      <div
        ref={sliderRef}
        className="relative h-1.5 rounded-full cursor-pointer"
        style={{ background: `${theme.text}20` }}
        onMouseDown={(e) => {
          const newValue = getValueFromPosition(e.clientX)
          const [left, right] = currentRange
          const leftDist = Math.abs(newValue - left)
          const rightDist = Math.abs(newValue - right)
          if (isShiftPressed) {
            handleMouseDown(e, 'range')
          } else if (leftDist < rightDist) {
            handleMouseDown(e, 'left')
          } else {
            handleMouseDown(e, 'right')
          }
        }}
      >
        {/* Selected range */}
        <div
          className="absolute h-full rounded-full cursor-grab active:cursor-grabbing"
          style={{
            left: `${leftPos}%`,
            width: `${rightPos - leftPos}%`,
            background: theme.nodes.sample,
            opacity: 0.7,
          }}
          onMouseDown={(e) => {
            e.stopPropagation()
            handleMouseDown(e, 'range')
          }}
        />

        {/* Left handle */}
        <div
          className="absolute w-4 h-4 border-2 rounded-full -translate-x-1/2 -translate-y-1/4 cursor-grab hover:scale-110 transition-transform"
          style={{
            left: `${leftPos}%`,
            background: theme.background,
            borderColor: theme.nodes.sample,
          }}
          onMouseDown={(e) => {
            e.stopPropagation()
            handleMouseDown(e, 'left')
          }}
        />

        {/* Right handle */}
        <div
          className="absolute w-4 h-4 border-2 rounded-full -translate-x-1/2 -translate-y-1/4 cursor-grab hover:scale-110 transition-transform"
          style={{
            left: `${rightPos}%`,
            background: theme.background,
            borderColor: theme.nodes.sample,
          }}
          onMouseDown={(e) => {
            e.stopPropagation()
            handleMouseDown(e, 'right')
          }}
        />
      </div>

      {/* Value display */}
      <div className="flex justify-between mt-2 text-xs font-mono" style={{ color: theme.text_secondary }}>
        <span>{formatValue(min)}</span>
        <span style={{ color: theme.nodes.sample }}>
          {formatValue(currentRange[0])} - {formatValue(currentRange[1])}
        </span>
        <span>{formatValue(max)}</span>
      </div>
    </div>
  )
}
