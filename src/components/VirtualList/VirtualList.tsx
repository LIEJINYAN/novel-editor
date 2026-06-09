import { useRef, useCallback } from 'react'
import { useVirtualScroll } from '../../hooks/useVirtualScroll'

interface VirtualListProps<T> {
  items: T[]
  itemHeight: number
  renderItem: (item: T, index: number) => React.ReactNode
  className?: string
  onScroll?: (scrollTop: number) => void
}

export default function VirtualList<T>({
  items,
  itemHeight,
  renderItem,
  className = '',
  onScroll,
}: VirtualListProps<T>) {
  const { containerRef, visibleItems, totalHeight, offsetY, handleScroll: baseHandleScroll } = useVirtualScroll(items.length, { itemHeight, overscan: 5 })

  const handleScroll = useCallback(() => {
    baseHandleScroll()
    if (onScroll && containerRef.current) {
      onScroll(containerRef.current.scrollTop)
    }
  }, [baseHandleScroll, onScroll, containerRef])

  return (
    <div
      ref={containerRef}
      className={`overflow-auto ${className}`}
      onScroll={handleScroll}
    >
      <div style={{ height: totalHeight, position: 'relative' }}>
        <div style={{ transform: `translateY(${offsetY}px)` }}>
          {visibleItems.map((index) => (
            <div key={index} style={{ height: itemHeight }}>
              {renderItem(items[index], index)}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
