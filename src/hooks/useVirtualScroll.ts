import { useState, useCallback, useRef, useEffect } from 'react'

interface VirtualScrollOptions {
  itemHeight: number
  overscan?: number
}

interface VirtualScrollResult {
  containerRef: React.RefObject<HTMLDivElement>
  visibleItems: number[]
  totalHeight: number
  offsetY: number
  handleScroll: () => void
  scrollToIndex: (index: number) => void
}

export function useVirtualScroll(
  itemCount: number,
  options: VirtualScrollOptions
): VirtualScrollResult {
  const { itemHeight, overscan = 5 } = options
  const containerRef = useRef<HTMLDivElement>(null)
  const [scrollTop, setScrollTop] = useState(0)

  const totalHeight = itemCount * itemHeight

  const getVisibleRange = useCallback(() => {
    if (!containerRef.current) {
      return { start: 0, end: Math.min(itemCount, overscan * 2) }
    }

    const containerHeight = containerRef.current.clientHeight
    const start = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan)
    const end = Math.min(itemCount, Math.ceil((scrollTop + containerHeight) / itemHeight) + overscan)

    return { start, end }
  }, [scrollTop, itemHeight, itemCount, overscan])

  const { start, end } = getVisibleRange()
  const visibleItems = Array.from({ length: end - start }, (_, i) => start + i)

  const handleScroll = useCallback(() => {
    if (containerRef.current) {
      setScrollTop(containerRef.current.scrollTop)
    }
  }, [])

  const scrollToIndex = useCallback((index: number) => {
    if (containerRef.current) {
      const scrollTop = index * itemHeight
      containerRef.current.scrollTop = scrollTop
      setScrollTop(scrollTop)
    }
  }, [itemHeight])

  useEffect(() => {
    const container = containerRef.current
    if (container) {
      container.addEventListener('scroll', handleScroll)
      return () => container.removeEventListener('scroll', handleScroll)
    }
  }, [handleScroll])

  return {
    containerRef,
    visibleItems,
    totalHeight,
    offsetY: start * itemHeight,
    handleScroll,
    scrollToIndex,
  }
}
