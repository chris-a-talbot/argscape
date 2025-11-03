import { useState, useEffect, useRef } from 'react';

/**
 * Hook to track elapsed time for long-running operations
 * Useful for showing users that operations are still processing
 */
export function useElapsedTime(isActive: boolean): number {
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef<number | null>(null);

  useEffect(() => {
    if (isActive) {
      // Reset and start timer
      setElapsedSeconds(0);
      startTimeRef.current = Date.now();
      
      // Update every second
      intervalRef.current = setInterval(() => {
        if (startTimeRef.current) {
          const elapsed = Math.floor((Date.now() - startTimeRef.current) / 1000);
          setElapsedSeconds(elapsed);
        }
      }, 1000);
    } else {
      // Clear timer when inactive
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      startTimeRef.current = null;
      setElapsedSeconds(0);
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isActive]);

  return elapsedSeconds;
}

/**
 * Format elapsed seconds into a human-readable string
 */
export function formatElapsedTime(seconds: number): string {
  if (seconds < 60) {
    return `${seconds}s`;
  }
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes}m ${remainingSeconds}s`;
}

