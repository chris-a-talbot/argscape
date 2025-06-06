import { useState, useEffect } from 'react';

/**
 * Custom hook for debouncing values with optional loading state
 */
export function useDebounced<T>(
  value: T, 
  delay: number = 500,
  shouldDebounce: boolean = true
): { debouncedValue: T; isUpdating: boolean } {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    if (!shouldDebounce) {
      setDebouncedValue(value);
      setIsUpdating(false);
      return;
    }

    setIsUpdating(true);
    
    const timer = setTimeout(() => {
      setDebouncedValue(value);
      setIsUpdating(false);
    }, delay);

    return () => clearTimeout(timer);
  }, [value, delay, shouldDebounce]);

  return { debouncedValue, isUpdating };
} 