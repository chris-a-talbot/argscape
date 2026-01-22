import { useCallback, useRef, useState, useEffect, useMemo } from 'react'
import { ChevronRight } from 'lucide-react'
import { useFilterStore, useUIStore, useDataStore } from '@/stores'

export function TemporalFilter() {
  const theme = useUIStore((state) => state.theme)
  const { displayedNodes } = useDataStore()
  const {
    temporalRange,
    temporalExpanded,
    temporalFilterMode,
    setTemporalRange,
    setTemporalExpanded,
    setTemporalFilterMode,
  } = useFilterStore()

  const sliderRef = useRef<HTMLDivElement>(null)
  const [isDragging, setIsDragging] = useState<'top' | 'bottom' | 'range' | null>(null)
  const [dragStart, setDragStart] = useState({ y: 0, startIndices: [0, 0] as [number, number] })
  const [isShiftPressed, setIsShiftPressed] = useState(false)

  // Get unique timepoints from the data, sorted ascending
  const uniqueTimepoints = useMemo(() => {
    const times = [...new Set(displayedNodes.map(n => n.time))].sort((a, b) => a - b)
    return times
  }, [displayedNodes])

  const numTimepoints = uniqueTimepoints.length

  // Convert time value to index (find closest timepoint)
  const timeToIndex = useCallback((time: number): number => {
    if (numTimepoints === 0) return 0
    let closestIdx = 0
    let closestDist = Math.abs(uniqueTimepoints[0] - time)
    for (let i = 1; i < numTimepoints; i++) {
      const dist = Math.abs(uniqueTimepoints[i] - time)
      if (dist < closestDist) {
        closestDist = dist
        closestIdx = i
      }
    }
    return closestIdx
  }, [uniqueTimepoints, numTimepoints])

  // Convert index to time value
  const indexToTime = useCallback((index: number): number => {
    if (numTimepoints === 0) return 0
    const clampedIdx = Math.max(0, Math.min(numTimepoints - 1, Math.round(index)))
    return uniqueTimepoints[clampedIdx]
  }, [uniqueTimepoints, numTimepoints])

  // Current range as indices
  const currentIndices: [number, number] = useMemo(() => {
    if (!temporalRange || numTimepoints === 0) return [0, numTimepoints - 1]
    return [timeToIndex(temporalRange[0]), timeToIndex(temporalRange[1])]
  }, [temporalRange, timeToIndex, numTimepoints])

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

  // Get index from Y position (equally spaced)
  const getIndexFromPosition = useCallback(
    (clientY: number): number => {
      if (!sliderRef.current || numTimepoints <= 1) return 0
      const rect = sliderRef.current.getBoundingClientRect()
      // Inverted: top = max index, bottom = 0
      const percentage = Math.max(0, Math.min(1, (rect.bottom - clientY) / rect.height))
      return percentage * (numTimepoints - 1)
    },
    [numTimepoints]
  )

  // Get position (0-100%) from index (equally spaced)
  const getPositionFromIndex = useCallback(
    (index: number): number => {
      if (numTimepoints <= 1) return 50
      // Inverted: higher indices at top
      return ((numTimepoints - 1 - index) / (numTimepoints - 1)) * 100
    },
    [numTimepoints]
  )

  const handleMouseDown = useCallback(
    (e: React.MouseEvent, type: 'top' | 'bottom' | 'range') => {
      e.preventDefault()
      e.stopPropagation()
      setIsDragging(type)
      setDragStart({ y: e.clientY, startIndices: currentIndices })
    },
    [currentIndices]
  )

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!isDragging || !sliderRef.current || numTimepoints <= 1) return

      const newIndex = getIndexFromPosition(e.clientY)
      const [currentMinIdx, currentMaxIdx] = currentIndices
      const rangeSize = currentMaxIdx - currentMinIdx

      if (isShiftPressed && (isDragging === 'top' || isDragging === 'bottom')) {
        // Shift-drag: move entire range
        const rect = sliderRef.current.getBoundingClientRect()
        const deltaY = e.clientY - dragStart.y
        const deltaIndex = -(deltaY / rect.height) * (numTimepoints - 1)
        let newMinIdx = dragStart.startIndices[0] + deltaIndex
        let newMaxIdx = dragStart.startIndices[1] + deltaIndex

        if (newMinIdx < 0) {
          newMinIdx = 0
          newMaxIdx = rangeSize
        }
        if (newMaxIdx > numTimepoints - 1) {
          newMaxIdx = numTimepoints - 1
          newMinIdx = newMaxIdx - rangeSize
        }

        const snappedMin = Math.round(newMinIdx)
        const snappedMax = Math.round(newMaxIdx)
        setTemporalRange([indexToTime(snappedMin), indexToTime(snappedMax)])
      } else if (isDragging === 'top') {
        // Dragging top handle (max)
        const snappedIdx = Math.round(Math.max(currentMinIdx, Math.min(numTimepoints - 1, newIndex)))
        setTemporalRange([indexToTime(currentMinIdx), indexToTime(snappedIdx)])
      } else if (isDragging === 'bottom') {
        // Dragging bottom handle (min)
        const snappedIdx = Math.round(Math.max(0, Math.min(currentMaxIdx, newIndex)))
        setTemporalRange([indexToTime(snappedIdx), indexToTime(currentMaxIdx)])
      } else if (isDragging === 'range') {
        // Dragging the range itself
        const rect = sliderRef.current.getBoundingClientRect()
        const deltaY = e.clientY - dragStart.y
        const deltaIndex = -(deltaY / rect.height) * (numTimepoints - 1)
        let newMinIdx = dragStart.startIndices[0] + deltaIndex
        let newMaxIdx = dragStart.startIndices[1] + deltaIndex

        if (newMinIdx < 0) {
          newMinIdx = 0
          newMaxIdx = rangeSize
        }
        if (newMaxIdx > numTimepoints - 1) {
          newMaxIdx = numTimepoints - 1
          newMinIdx = newMaxIdx - rangeSize
        }

        const snappedMin = Math.round(newMinIdx)
        const snappedMax = Math.round(newMaxIdx)
        setTemporalRange([indexToTime(snappedMin), indexToTime(snappedMax)])
      }
    },
    [isDragging, currentIndices, getIndexFromPosition, numTimepoints, dragStart, isShiftPressed, setTemporalRange, indexToTime]
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

  // Positions for rendering (equally spaced based on index)
  const topPos = Math.max(0, Math.min(100, getPositionFromIndex(currentIndices[1])))
  const bottomPos = Math.max(0, Math.min(100, getPositionFromIndex(currentIndices[0])))

  const formatValue = (v: number) => {
    if (v >= 1000) return v.toFixed(0)
    if (v >= 1) return v.toFixed(1)
    return v.toFixed(3)
  }

  if (!theme || numTimepoints === 0) return null

  // Get actual time values for display
  const minTime = uniqueTimepoints[0]
  const maxTime = uniqueTimepoints[numTimepoints - 1]
  const currentMinTime = indexToTime(currentIndices[0])
  const currentMaxTime = indexToTime(currentIndices[1])

  // Collapsed view: minimal vertical indicator bar with hover expand hint
  if (!temporalExpanded) {
    return (
      <div
        className="absolute left-0 top-0 bottom-0 w-5 cursor-pointer group"
        style={{ background: theme.background }}
        onClick={() => setTemporalExpanded(true)}
      >
        <div
          className="absolute left-2 rounded-full"
          style={{
            width: '6px',
            top: '10%',
            bottom: '10%',
            background: `${theme.text}20`,
          }}
        >
          <div
            className="absolute w-full rounded-full"
            style={{
              top: `${topPos}%`,
              height: `${bottomPos - topPos}%`,
              background: theme.nodes.sample,
            }}
          />
          {/* Subtle expand indicator on hover */}
          <div
            className="absolute top-1/2 -translate-y-1/2 -right-2 opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <ChevronRight size={14} style={{ color: theme.nodes.sample }} />
          </div>
        </div>
      </div>
    )
  }

  // Expanded view
  return (
    <div
      className="absolute left-0 top-0 bottom-0 w-16 p-2 flex flex-col"
      style={{
        background: `${theme.background}f0`,
        backdropFilter: 'blur(8px)',
        borderRight: `1px solid ${theme.text}20`,
      }}
    >
      {/* Collapse button */}
      <button
        onClick={() => setTemporalExpanded(false)}
        className="text-xs mb-1 px-1 py-0.5 rounded self-center"
        style={{ color: theme.text_secondary }}
      >
        &lt;
      </button>

      {/* Mode toggle: Dim vs Subset */}
      <div className="flex justify-center mb-2">
        <button
          onClick={() => setTemporalFilterMode(temporalFilterMode === 'dim' ? 'subset' : 'dim')}
          className="text-xs px-1.5 py-0.5 rounded"
          style={{
            background: temporalFilterMode === 'subset' ? theme.nodes.sample : `${theme.text}20`,
            color: temporalFilterMode === 'subset' ? theme.background : theme.text_secondary,
          }}
          title={temporalFilterMode === 'dim' ? 'Dim mode: fades nodes outside range' : 'Subset mode: hides nodes outside range'}
        >
          {temporalFilterMode === 'dim' ? 'Dim' : 'Sub'}
        </button>
      </div>

      {/* Value: max time */}
      <div className="text-xs font-mono text-center" style={{ color: theme.text_secondary }}>
        {formatValue(maxTime)}
      </div>

      {/* Slider */}
      <div className="flex-1 flex justify-center py-2">
        <div
          ref={sliderRef}
          className="relative w-1.5 h-full rounded-full cursor-pointer"
          style={{ background: `${theme.text}20` }}
          onMouseDown={(e) => {
            const newIndex = getIndexFromPosition(e.clientY)
            const [minIdx, maxIdx] = currentIndices
            const minDist = Math.abs(newIndex - minIdx)
            const maxDist = Math.abs(newIndex - maxIdx)
            if (isShiftPressed) {
              handleMouseDown(e, 'range')
            } else if (minDist < maxDist) {
              handleMouseDown(e, 'bottom')
            } else {
              handleMouseDown(e, 'top')
            }
          }}
        >
          {/* Tick marks - show only ~5 evenly spaced ticks */}
          {[0, 0.25, 0.5, 0.75, 1].map((fraction, i) => {
            const idx = Math.round(fraction * (numTimepoints - 1))
            return (
              <div
                key={i}
                className="absolute w-2 h-0.5 -left-0.5"
                style={{
                  top: `${getPositionFromIndex(idx)}%`,
                  background: `${theme.text}30`,
                }}
              />
            )
          })}

          {/* Selected range */}
          <div
            className="absolute w-full rounded-full cursor-grab active:cursor-grabbing"
            style={{
              top: `${topPos}%`,
              height: `${Math.max(0, bottomPos - topPos)}%`,
              background: theme.nodes.sample,
              opacity: 0.7,
            }}
            onMouseDown={(e) => {
              e.stopPropagation()
              handleMouseDown(e, 'range')
            }}
          />

          {/* Top handle (max) */}
          <div
            className="absolute w-4 h-4 border-2 rounded-full -translate-x-1/4 -translate-y-1/2 cursor-grab hover:scale-110 transition-transform"
            style={{
              top: `${topPos}%`,
              background: theme.background,
              borderColor: theme.nodes.sample,
            }}
            onMouseDown={(e) => {
              e.stopPropagation()
              handleMouseDown(e, 'top')
            }}
          />

          {/* Bottom handle (min) */}
          <div
            className="absolute w-4 h-4 border-2 rounded-full -translate-x-1/4 -translate-y-1/2 cursor-grab hover:scale-110 transition-transform"
            style={{
              top: `${bottomPos}%`,
              background: theme.background,
              borderColor: theme.nodes.sample,
            }}
            onMouseDown={(e) => {
              e.stopPropagation()
              handleMouseDown(e, 'bottom')
            }}
          />
        </div>
      </div>

      {/* Value: min time */}
      <div className="text-xs font-mono text-center" style={{ color: theme.text_secondary }}>
        {formatValue(minTime)}
      </div>

      {/* Current range display */}
      <div className="text-xs font-mono text-center mt-1" style={{ color: theme.nodes.sample }}>
        {formatValue(currentMinTime)}
        <br />-<br />
        {formatValue(currentMaxTime)}
      </div>
    </div>
  )
}
