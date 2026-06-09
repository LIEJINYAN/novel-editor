import { useRef, useCallback, useEffect } from 'react'

interface TouchGestureOptions {
  onSwipeLeft?: () => void
  onSwipeRight?: () => void
  onSwipeUp?: () => void
  onSwipeDown?: () => void
  onPinch?: (scale: number) => void
  onDoubleTap?: () => void
  onLongPress?: () => void
  swipeThreshold?: number
  longPressDelay?: number
}

export function useTouchGesture(options: TouchGestureOptions) {
  const {
    onSwipeLeft,
    onSwipeRight,
    onSwipeUp,
    onSwipeDown,
    onPinch,
    onDoubleTap,
    onLongPress,
    swipeThreshold = 50,
    longPressDelay = 500,
  } = options

  const touchStart = useRef<{ x: number; y: number; time: number } | null>(null)
  const lastTap = useRef<number>(0)
  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const initialPinchDistance = useRef<number | null>(null)

  const getDistance = (t1: Touch, t2: Touch) => {
    return Math.sqrt((t2.clientX - t1.clientX) ** 2 + (t2.clientY - t1.clientY) ** 2)
  }

  const handleTouchStart = useCallback(
    (e: TouchEvent) => {
      if (e.touches.length === 2 && onPinch) {
        initialPinchDistance.current = getDistance(e.touches[0], e.touches[1])
        return
      }

      const touch = e.touches[0]
      touchStart.current = {
        x: touch.clientX,
        y: touch.clientY,
        time: Date.now(),
      }

      if (onLongPress) {
        longPressTimer.current = setTimeout(() => {
          onLongPress()
          touchStart.current = null
        }, longPressDelay)
      }
    },
    [onLongPress, onPinch, longPressDelay]
  )

  const handleTouchMove = useCallback(
    (e: TouchEvent) => {
      if (longPressTimer.current) {
        clearTimeout(longPressTimer.current)
        longPressTimer.current = null
      }

      if (e.touches.length === 2 && onPinch && initialPinchDistance.current) {
        const currentDistance = getDistance(e.touches[0], e.touches[1])
        const scale = currentDistance / initialPinchDistance.current
        onPinch(scale)
        return
      }

      if (!touchStart.current) return

      const touch = e.touches[0]
      const deltaX = touch.clientX - touchStart.current.x
      const deltaY = touch.clientY - touchStart.current.y

      if (Math.abs(deltaX) > 10 || Math.abs(deltaY) > 10) {
        if (longPressTimer.current) {
          clearTimeout(longPressTimer.current)
          longPressTimer.current = null
        }
      }
    },
    [onPinch]
  )

  const handleTouchEnd = useCallback(
    (e: TouchEvent) => {
      if (longPressTimer.current) {
        clearTimeout(longPressTimer.current)
        longPressTimer.current = null
      }

      initialPinchDistance.current = null

      if (!touchStart.current) return

      const endTouch = e.changedTouches[0]
      const deltaX = endTouch.clientX - touchStart.current.x
      const deltaY = endTouch.clientY - touchStart.current.y
      const deltaTime = Date.now() - touchStart.current.time

      if (deltaTime < 300 && Math.abs(deltaX) < 10 && Math.abs(deltaY) < 10) {
        const now = Date.now()
        if (now - lastTap.current < 300) {
          onDoubleTap?.()
          lastTap.current = 0
        } else {
          lastTap.current = now
        }
      }

      if (Math.abs(deltaX) > swipeThreshold || Math.abs(deltaY) > swipeThreshold) {
        if (Math.abs(deltaX) > Math.abs(deltaY)) {
          if (deltaX > 0) onSwipeRight?.()
          else onSwipeLeft?.()
        } else {
          if (deltaY > 0) onSwipeDown?.()
          else onSwipeUp?.()
        }
      }

      touchStart.current = null
    },
    [onSwipeLeft, onSwipeRight, onSwipeUp, onSwipeDown, onDoubleTap, swipeThreshold]
  )

  const bind = useCallback(
    (element: HTMLElement | null) => {
      if (!element) return

      element.addEventListener('touchstart', handleTouchStart, { passive: true })
      element.addEventListener('touchmove', handleTouchMove, { passive: true })
      element.addEventListener('touchend', handleTouchEnd, { passive: true })

      return () => {
        element.removeEventListener('touchstart', handleTouchStart)
        element.removeEventListener('touchmove', handleTouchMove)
        element.removeEventListener('touchend', handleTouchEnd)
      }
    },
    [handleTouchStart, handleTouchMove, handleTouchEnd]
  )

  return { bind }
}
