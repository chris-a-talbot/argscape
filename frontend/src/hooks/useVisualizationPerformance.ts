import { useCallback, useEffect, useRef, useState } from 'react';
import type { PerformanceStats } from '@/components/ui/QuickActionsBar/panels/StatsPanel.types';

interface UseVisualizationPerformanceResult {
  performanceStats?: PerformanceStats;
  markRenderComplete: () => void;
}

interface MemoryAwarePerformance extends Performance {
  memory?: {
    usedJSHeapSize: number;
  };
}

const MAX_FRAME_SAMPLES = 60;
const STATS_UPDATE_INTERVAL_MS = 1000; // Only push state updates once per second

export function useVisualizationPerformance(benchmarkKey: string): UseVisualizationPerformanceResult {
  const [performanceStats, setPerformanceStats] = useState<PerformanceStats>();
  const benchmarkKeyRef = useRef(benchmarkKey);
  const renderStartRef = useRef<number>(0);
  const completedBenchmarkKeyRef = useRef<string | null>(null);

  useEffect(() => {
    benchmarkKeyRef.current = benchmarkKey;
    renderStartRef.current = performance.now();
    completedBenchmarkKeyRef.current = null;
  }, [benchmarkKey]);

  const markRenderComplete = useCallback(() => {
    if (completedBenchmarkKeyRef.current === benchmarkKeyRef.current) {
      return;
    }

    completedBenchmarkKeyRef.current = benchmarkKeyRef.current;
    const renderTimeMs = Math.max(0, performance.now() - renderStartRef.current);

    setPerformanceStats((previous) => ({
      fps: previous?.fps ?? 0,
      lastFrameTime: previous?.lastFrameTime,
      avgFrameTime: previous?.avgFrameTime,
      memoryMB: previous?.memoryMB,
      renderTimeMs,
    }));
  }, []);

  useEffect(() => {
    let animationFrameId = 0;
    let previousFrameTime: number | null = null;
    let lastStateUpdateTime = 0;
    const frameSamples: number[] = [];

    const updateStats = (timestamp: number) => {
      if (previousFrameTime !== null) {
        const delta = timestamp - previousFrameTime;

        if (delta > 0 && Number.isFinite(delta) && delta < 1000) {
          frameSamples.push(delta);
          if (frameSamples.length > MAX_FRAME_SAMPLES) {
            frameSamples.shift();
          }

          // Only push a React state update at most once per second to avoid
          // re-rendering the parent component on every animation frame.
          if (timestamp - lastStateUpdateTime >= STATS_UPDATE_INTERVAL_MS) {
            lastStateUpdateTime = timestamp;

            const avgFrameTime =
              frameSamples.reduce((sum, frameTime) => sum + frameTime, 0) / frameSamples.length;
            const fps = avgFrameTime > 0 ? 1000 / avgFrameTime : 0;
            const browserPerformance = performance as MemoryAwarePerformance;
            const memoryMB =
              browserPerformance.memory?.usedJSHeapSize !== undefined
                ? browserPerformance.memory.usedJSHeapSize / (1024 * 1024)
                : undefined;

            setPerformanceStats((previous) => ({
              fps,
              lastFrameTime: delta,
              avgFrameTime,
              memoryMB,
              renderTimeMs: previous?.renderTimeMs,
            }));
          }
        }
      }

      previousFrameTime = timestamp;
      animationFrameId = requestAnimationFrame(updateStats);
    };

    animationFrameId = requestAnimationFrame(updateStats);

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return {
    performanceStats,
    markRenderComplete,
  };
}
