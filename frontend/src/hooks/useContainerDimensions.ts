import { useState, useEffect, useRef } from 'react';

interface Dimensions {
  width: number;
  height: number;
}

export function useContainerDimensions() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState<Dimensions>({ width: 0, height: 0 });
  const [isMeasured, setIsMeasured] = useState(false);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect;
        setDimensions({ width, height });
        setIsMeasured(true);
      }
    });

    const { width, height } = container.getBoundingClientRect();
    setDimensions({ width, height });
    setIsMeasured(width > 0 && height > 0);

    resizeObserver.observe(container);

    return () => {
      resizeObserver.disconnect();
    };
  }, []);

  return { containerRef, dimensions, isMeasured };
}
