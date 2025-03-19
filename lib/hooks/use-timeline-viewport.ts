import { useState, useEffect, useRef, useCallback } from "react";
import { throttle } from "lodash";

export interface ViewportState {
  visibleStart: number;
  visibleEnd: number;
  containerWidth: number;
  isScrolling: boolean;
  scrollPosition: number;
}

export interface ViewportOptions {
  buffer?: number; // Additional items to render outside viewport (percentage)
  throttleTime?: number; // Time in ms to throttle scroll updates
}

export function useTimelineViewport(
  containerRef: React.RefObject<HTMLDivElement | null>,
  options: ViewportOptions = {}
) {
  const {
    buffer = 50, // Default 50% buffer
    throttleTime = 16 // Default to ~60fps
  } = options;

  // Viewport state
  const [viewport, setViewport] = useState<ViewportState>({
    visibleStart: 0,
    visibleEnd: 0,
    containerWidth: 0,
    isScrolling: false,
    scrollPosition: 0
  });

  // Scroll timeout ref for tracking scroll state
  const scrollTimeoutRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  // Calculate viewport boundaries with buffer
  const calculateViewport = useCallback((scrollLeft: number, containerWidth: number) => {
    const bufferWidth = (containerWidth * buffer) / 100;
    
    return {
      visibleStart: Math.max(0, scrollLeft - bufferWidth),
      visibleEnd: scrollLeft + containerWidth + bufferWidth,
      containerWidth,
      isScrolling: true,
      scrollPosition: scrollLeft
    };
  }, [buffer]);

  // Throttled viewport update
  const updateViewport = useCallback(
    throttle((scrollLeft: number, containerWidth: number) => {
      setViewport(calculateViewport(scrollLeft, containerWidth));
      
      // Clear previous timeout
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
      
      // Set new timeout to mark scrolling as finished
      scrollTimeoutRef.current = setTimeout(() => {
        setViewport(prev => ({ ...prev, isScrolling: false }));
      }, 150); // Wait 150ms after last scroll to mark as done
    }, throttleTime),
    [calculateViewport, throttleTime]
  );

  // Set up scroll and resize listeners
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleScroll = () => {
      updateViewport(container.scrollLeft, container.clientWidth);
    };

    const handleResize = () => {
      updateViewport(container.scrollLeft, container.clientWidth);
    };

    // Initial calculation
    updateViewport(container.scrollLeft, container.clientWidth);

    // Add event listeners
    container.addEventListener("scroll", handleScroll);
    window.addEventListener("resize", handleResize);

    // Cleanup
    return () => {
      container.removeEventListener("scroll", handleScroll);
      window.removeEventListener("resize", handleResize);
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
    };
  }, [containerRef, updateViewport]);

  // Helper to check if an item should be rendered
  const isItemInViewport = useCallback(
    (itemLeft: number, itemWidth: number) => {
      const itemRight = itemLeft + itemWidth;
      return (
        (itemLeft >= viewport.visibleStart && itemLeft <= viewport.visibleEnd) ||
        (itemRight >= viewport.visibleStart && itemRight <= viewport.visibleEnd) ||
        (itemLeft <= viewport.visibleStart && itemRight >= viewport.visibleEnd)
      );
    },
    [viewport]
  );

  return {
    viewport,
    isItemInViewport
  };
} 