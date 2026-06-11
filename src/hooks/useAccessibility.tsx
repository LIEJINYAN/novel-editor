import { useEffect, useRef, useCallback } from 'react'

export function useFocusTrap(enabled: boolean = true) {
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!enabled || !containerRef.current) return

    const container = containerRef.current
    const focusableElements = container.querySelectorAll<HTMLElement>(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    )

    if (focusableElements.length === 0) return

    const firstElement = focusableElements[0]
    const lastElement = focusableElements[focusableElements.length - 1]

    const handleTabKey = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return

      if (e.shiftKey) {
        if (document.activeElement === firstElement) {
          e.preventDefault()
          lastElement.focus()
        }
      } else {
        if (document.activeElement === lastElement) {
          e.preventDefault()
          firstElement.focus()
        }
      }
    }

    container.addEventListener('keydown', handleTabKey)
    firstElement.focus()

    return () => {
      container.removeEventListener('keydown', handleTabKey)
    }
  }, [enabled])

  return containerRef
}

export function useKeyboardNavigation(
  items: any[],
  onSelect: (item: any) => void,
  options: { enabled?: boolean; loop?: boolean } = {}
) {
  const { enabled = true, loop = true } = options
  const indexRef = useRef(0)

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (!enabled) return

      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault()
          indexRef.current = loop
            ? (indexRef.current + 1) % items.length
            : Math.min(indexRef.current + 1, items.length - 1)
          break
        case 'ArrowUp':
          e.preventDefault()
          indexRef.current = loop
            ? (indexRef.current - 1 + items.length) % items.length
            : Math.max(indexRef.current - 1, 0)
          break
        case 'Enter':
        case ' ':
          e.preventDefault()
          onSelect(items[indexRef.current])
          break
        case 'Home':
          e.preventDefault()
          indexRef.current = 0
          break
        case 'End':
          e.preventDefault()
          indexRef.current = items.length - 1
          break
      }
    },
    [items, onSelect, enabled, loop]
  )

  return { handleKeyDown, currentIndex: indexRef.current }
}

export function useLiveRegion() {
  const regionRef = useRef<HTMLDivElement>(null)

  const announce = useCallback((message: string, priority: 'polite' | 'assertive' = 'polite') => {
    if (regionRef.current) {
      regionRef.current.setAttribute('aria-live', priority)
      regionRef.current.textContent = message
    }
  }, [])

  const LiveRegion = () => (
    <div
      ref={regionRef}
      className="sr-only"
      aria-live="polite"
      aria-atomic="true"
    />
  )

  return { announce, LiveRegion }
}
