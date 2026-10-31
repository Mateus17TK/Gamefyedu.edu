import React, { useRef, useState, useEffect, useCallback, useMemo } from 'react';

export interface VirtualListProps<T> {
  items: T[];
  itemHeight: number;
  height: number | string;
  renderItem: (item: T, index: number) => React.ReactNode;
  getItemKey?: (item: T, index: number) => string | number;
  overscan?: number;
  className?: string;
  emptyMessage?: React.ReactNode;
}

function VirtualListInner<T>({
  items,
  itemHeight,
  height,
  renderItem,
  getItemKey,
  overscan = 4,
  className = '',
  emptyMessage = 'Nenhum item encontrado.',
}: VirtualListProps<T>) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scrollTop, setScrollTop] = useState(0);
  const [containerHeight, setContainerHeight] = useState(typeof height === 'number' ? height : 400);

  // ResizeObserver to track dynamic container heights
  useEffect(() => {
    if (!containerRef.current) return;
    const el = containerRef.current;
    
    // Initial measurement
    if (el.clientHeight > 0) {
      setContainerHeight(el.clientHeight);
    }

    const observer = new ResizeObserver(entries => {
      for (const entry of entries) {
        if (entry.contentRect.height > 0) {
          setContainerHeight(entry.contentRect.height);
        }
      }
    });

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    setScrollTop(e.currentTarget.scrollTop);
  }, []);

  const totalCount = items.length;
  const totalHeight = totalCount * itemHeight;

  // Memoized virtual window calculation
  const { startIndex, endIndex, offsetY } = useMemo(() => {
    const start = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan);
    const visibleCount = Math.ceil(containerHeight / itemHeight);
    const end = Math.min(totalCount, start + visibleCount + overscan * 2);
    const offset = start * itemHeight;
    return { startIndex: start, endIndex: end, offsetY: offset };
  }, [scrollTop, itemHeight, overscan, containerHeight, totalCount]);

  const visibleItems = useMemo(() => {
    return items.slice(startIndex, endIndex);
  }, [items, startIndex, endIndex]);

  if (totalCount === 0) {
    return (
      <div
        className={`flex items-center justify-center p-8 text-slate-500 dark:text-slate-400 ${className}`}
        style={{ height }}
      >
        {emptyMessage}
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      onScroll={handleScroll}
      className={`overflow-y-auto relative scrollbar-thin ${className}`}
      style={{ height }}
    >
      <div style={{ height: totalHeight, width: '100%', position: 'relative' }}>
        <div
          style={{
            transform: `translateY(${offsetY}px)`,
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
          }}
        >
          {visibleItems.map((item, localIndex) => {
            const actualIndex = startIndex + localIndex;
            const key = getItemKey ? getItemKey(item, actualIndex) : actualIndex;
            return (
              <div
                key={key}
                style={{ height: itemHeight }}
                className="box-border"
              >
                {renderItem(item, actualIndex)}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// React.memo wrapper to prevent re-renders when parent renders unrelated state
export const VirtualList = React.memo(VirtualListInner) as typeof VirtualListInner;
