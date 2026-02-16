import { useState, useEffect, useCallback, useRef } from 'react';

interface UseContentAwareHeightOptions {
  minHeight?: number;
  maxHeight?: number;
  offset?: number;
  debounceMs?: number;
}

export function useContentAwareHeight<T extends HTMLElement = HTMLDivElement>({
  minHeight = 400,
  maxHeight = 800,
  offset = 200,
  debounceMs = 100
}: UseContentAwareHeightOptions = {}) {
  const [height, setHeight] = useState(minHeight);
  const [isCalculating, setIsCalculating] = useState(false);
  const containerRef = useRef<T>(null);
  const resizeObserverRef = useRef<ResizeObserver>();
  const timeoutRef = useRef<NodeJS.Timeout>();

  const calculateHeight = useCallback(() => {
    if (!containerRef.current) return;

    setIsCalculating(true);

    const viewportHeight = window.innerHeight;
    const containerRect = containerRef.current.getBoundingClientRect();
    const availableHeight = viewportHeight - containerRect.top - offset;

    const calculatedHeight = Math.max(
      minHeight,
      Math.min(maxHeight, availableHeight)
    );

    setHeight(calculatedHeight);
    setIsCalculating(false);
  }, [minHeight, maxHeight, offset]);

  const debouncedCalculate = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    timeoutRef.current = setTimeout(calculateHeight, debounceMs);
  }, [calculateHeight, debounceMs]);

  useEffect(() => {
    const element = containerRef.current;
    if (!element) return;

    calculateHeight();

    resizeObserverRef.current = new ResizeObserver(debouncedCalculate);
    resizeObserverRef.current.observe(element);

    window.addEventListener('resize', debouncedCalculate);

    return () => {
      if (resizeObserverRef.current) {
        resizeObserverRef.current.disconnect();
      }
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      window.removeEventListener('resize', debouncedCalculate);
    };
  }, [calculateHeight, debouncedCalculate]);

  return {
    height,
    containerRef,
    isCalculating,
    recalculate: calculateHeight
  };
}
