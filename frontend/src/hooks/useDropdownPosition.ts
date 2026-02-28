import { useState, useCallback, useRef, useEffect } from 'react';

interface Position {
  top: number;
  left: number;
  width: number;
  align: 'left' | 'right' | 'center';
}

export function useDropdownPosition(dropdownWidth: number = 320) {
  const [position, setPosition] = useState<Position | null>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const calculatePosition = useCallback(() => {
    if (!buttonRef.current || !containerRef.current) {
      return;
    }

    const buttonRect = buttonRef.current.getBoundingClientRect();
    const containerRect = containerRef.current.getBoundingClientRect();
    const isMobile = window.innerWidth < 640;

    const relativeTop = buttonRect.bottom - containerRect.top;
    const buttonCenter = buttonRect.left + (buttonRect.width / 2) - containerRect.left;

    const containerWidth = containerRect.width;
    const margin = 8;
    const minEdgeDistance = isMobile ? 4 : 8;
    const MIN_WIDTH = isMobile ? Math.min(280, window.innerWidth - 16) : 280;
    const MAX_WIDTH = isMobile ? Math.min(320, window.innerWidth - 16) : 320;

    let left = buttonCenter - (MAX_WIDTH / 2);
    let width = MAX_WIDTH;

    if (isMobile) {
      left = minEdgeDistance;
      width = window.innerWidth - (minEdgeDistance * 2);
    } else {
      if (left < minEdgeDistance) {
        left = minEdgeDistance;
      }

      if (left + MAX_WIDTH > containerWidth - minEdgeDistance) {
        left = containerWidth - MAX_WIDTH - minEdgeDistance;
      }

      if (left < minEdgeDistance || left + MAX_WIDTH > containerWidth - minEdgeDistance) {
        width = Math.max(MIN_WIDTH, containerWidth - (minEdgeDistance * 2));
        left = minEdgeDistance;
      }
    }

    const newPosition = {
      top: relativeTop + margin,
      left,
      width,
      align: 'center' as const
    };

    if (newPosition.top >= 0 && newPosition.left >= 0 && newPosition.width > 0) {
      setPosition(newPosition);
    } else {
      setPosition(null);
    }
  }, [dropdownWidth]);

  return { buttonRef, containerRef, position, calculatePosition };
}
