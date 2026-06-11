import { useCallback, useRef } from 'react'
import type { Editor } from '@tiptap/core'

interface SwipeHandlers {
  onTouchStart: (e: React.TouchEvent) => void
  onTouchMove: (e: React.TouchEvent) => void
  onTouchEnd: (e: React.TouchEvent) => void
}

interface SwipeCallbacks {
  onSwipeLeft?: () => void
  onSwipeRight?: () => void
  onSwipeUp?: () => void
  onSwipeDown?: () => void
}

export function useTouchGestures(
  editor: Editor | null,
  callbacks: SwipeCallbacks = {}
): SwipeHandlers {
  const touchStartRef = useRef<{ x: number; y: number } | null>(null)

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    const touch = e.touches[0]
    touchStartRef.current = { x: touch.clientX, y: touch.clientY }
  }, [])

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    // 可以在这里添加手势预览
  }, [])

  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    if (!touchStartRef.current || !editor) return

    const touch = e.changedTouches[0]
    const deltaX = touch.clientX - touchStartRef.current.x
    const deltaY = touch.clientY - touchStartRef.current.y
    const threshold = 50

    if (Math.abs(deltaX) > Math.abs(deltaY)) {
      if (deltaX > threshold) {
        callbacks.onSwipeRight?.()
        // 右滑：撤销
        editor.chain().focus().undo().run()
      } else if (deltaX < -threshold) {
        callbacks.onSwipeLeft?.()
        // 左滑：重做
        editor.chain().focus().redo().run()
      }
    } else {
      if (deltaY > threshold) {
        callbacks.onSwipeDown?.()
      } else if (deltaY < -threshold) {
        callbacks.onSwipeUp?.()
      }
    }

    touchStartRef.current = null
  }, [editor, callbacks])

  return {
    onTouchStart: handleTouchStart,
    onTouchMove: handleTouchMove,
    onTouchEnd: handleTouchEnd,
  }
}
