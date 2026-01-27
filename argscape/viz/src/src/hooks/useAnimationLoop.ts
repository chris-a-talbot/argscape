/**
 * useAnimationLoop Hook
 *
 * Manages requestAnimationFrame-based animation for both temporal and genomic animations.
 */

import { useEffect, useRef, useMemo } from 'react'
import { useAnimationStore, useFilterStore, useDataStore } from '@/stores'

export function useAnimationLoop() {
  const animationRef = useRef<number | null>(null)
  const startTimeRef = useRef<number>(0)
  const pausedProgressRef = useRef<number>(0)

  const {
    config,
    activeType,
    isPlaying,
    isPaused,
    progress,
    temporalMode,
    temporalRate,
    genomicRate,
    setProgress,
    setCurrentGenomicPosition,
    reset,
  } = useAnimationStore()

  const {
    setTemporalRange,
    setGenomicRange,
    setGenomicMode,
    genomicMode,
    sequenceLength,
    numTrees,
  } = useFilterStore()

  const rawData = useDataStore(state => state.rawData)

  // Memoize time layers to avoid recalculating on every render
  const timeLayers = useMemo(() => {
    if (!rawData?.nodes) return []
    const times = new Set(rawData.nodes.map(n => n.time))
    return Array.from(times).sort((a, b) => a - b)
  }, [rawData])

  // Temporal animation loop
  useEffect(() => {
    if (!isPlaying || activeType !== 'temporal' || !config?.temporal) return
    const numLayers = timeLayers.length
    if (numLayers === 0) return

    const isRootToSamples = temporalMode === 'root-to-samples'
    const orderedTimes = isRootToSamples ? [...timeLayers].reverse() : timeLayers
    const minT = timeLayers[0]
    const maxT = timeLayers[numLayers - 1]

    // Calculate duration
    const holdDuration = temporalRate <= 1.0 ? Math.max(1.0, 1 / temporalRate) : Math.max(0.5, 1 / temporalRate)
    const totalDuration = (numLayers / temporalRate) + holdDuration

    // Resume from paused progress
    if (pausedProgressRef.current > 0) {
      startTimeRef.current = Date.now() - (pausedProgressRef.current * totalDuration * 1000)
      pausedProgressRef.current = 0
    } else if (progress === 0) {
      startTimeRef.current = Date.now()
    }

    const animate = () => {
      const elapsed = (Date.now() - startTimeRef.current) / 1000
      const effectiveElapsed = Math.max(0, elapsed - holdDuration)
      const animationDuration = totalDuration - holdDuration

      const newProgress = animationDuration > 0
        ? Math.min(effectiveElapsed / animationDuration, 1)
        : 0

      const layerIndex = Math.floor(newProgress * numLayers)
      const currentTime = orderedTimes[Math.min(layerIndex, numLayers - 1)]

      if (isRootToSamples) {
        // Start at root (maxT) and expand down to minT
        setTemporalRange([currentTime, maxT])
      } else {
        // Start at minT and expand up to current layer
        setTemporalRange([minT, currentTime])
      }

      const totalProgress = Math.min(elapsed / totalDuration, 1)
      setProgress(totalProgress)

      if (totalProgress < 1) {
        animationRef.current = requestAnimationFrame(animate)
      } else {
        // Complete - reset temporal range
        setTemporalRange(null)
        reset()
      }
    }

    animationRef.current = requestAnimationFrame(animate)

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
    }
  }, [isPlaying, activeType, temporalMode, temporalRate, config, timeLayers, setTemporalRange, setProgress, reset])

  // Genomic animation loop
  useEffect(() => {
    if (!isPlaying || activeType !== 'genomic' || !config?.genomic) return

    const genomicConfig = config.genomic

    // Determine if using tree units
    const useTreeUnits = genomicConfig.window_trees !== null

    // Switch to tree mode if using tree units
    if (useTreeUnits && genomicMode !== 'tree') {
      setGenomicMode('tree')
    } else if (!useTreeUnits && genomicMode !== 'position') {
      setGenomicMode('position')
    }

    // Calculate window and step sizes in native units (trees or bp)
    let windowSize: number
    let maxValue: number
    let stepSize: number

    if (useTreeUnits) {
      // Work directly in tree indices
      windowSize = genomicConfig.window_trees!
      maxValue = numTrees - 1  // Trees are 0-indexed, so max index is numTrees - 1
    } else {
      // Work in genomic positions (bp)
      windowSize = genomicConfig.window ?? sequenceLength / 10
      maxValue = sequenceLength
    }

    // Determine step size in native units
    if (genomicConfig.step !== null) {
      stepSize = genomicConfig.step
    } else if (genomicConfig.overlap !== null) {
      stepSize = windowSize * (1 - genomicConfig.overlap)
    } else {
      stepSize = windowSize  // No overlap
    }

    // Ensure step size is at least 1
    stepSize = Math.max(1, stepSize)

    const totalSteps = Math.ceil((maxValue - windowSize) / stepSize)
    const totalDuration = totalSteps / genomicRate

    // Resume from paused progress
    if (pausedProgressRef.current > 0) {
      startTimeRef.current = Date.now() - (pausedProgressRef.current * totalDuration * 1000)
      pausedProgressRef.current = 0
    } else if (progress === 0) {
      startTimeRef.current = Date.now()
    }

    const animate = () => {
      const elapsed = (Date.now() - startTimeRef.current) / 1000
      const newProgress = Math.min(elapsed / totalDuration, 1)

      const currentStep = Math.floor(newProgress * totalSteps)
      const position = currentStep * stepSize
      const rangeStart = Math.max(0, position)
      const rangeEnd = Math.min(maxValue, position + windowSize)

      // For tree mode, ensure we're using integer values
      if (useTreeUnits) {
        setGenomicRange([Math.round(rangeStart), Math.round(rangeEnd)])
      } else {
        setGenomicRange([rangeStart, rangeEnd])
      }
      setCurrentGenomicPosition(position)
      setProgress(newProgress)

      if (newProgress < 1) {
        animationRef.current = requestAnimationFrame(animate)
      } else {
        // Complete - reset genomic range
        setGenomicRange(null)
        reset()
      }
    }

    animationRef.current = requestAnimationFrame(animate)

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
    }
  }, [isPlaying, activeType, genomicRate, config, sequenceLength, numTrees, genomicMode, setGenomicMode, setGenomicRange, setCurrentGenomicPosition, setProgress, reset])

  // Handle pause - save progress
  useEffect(() => {
    if (isPaused && animationRef.current) {
      cancelAnimationFrame(animationRef.current)
      pausedProgressRef.current = progress
    }
  }, [isPaused, progress])

  // Handle reset
  useEffect(() => {
    if (!isPlaying && !isPaused && progress === 0) {
      setTemporalRange(null)
      setGenomicRange(null)
    }
  }, [isPlaying, isPaused, progress])
}
