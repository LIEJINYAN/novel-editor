import { useState, useRef, useCallback, useEffect } from 'react'
import { useMobile } from '../../hooks/useMobile'

interface Props {
  onToggleSidebar: () => void
  onToggleAI: () => void
  onToggleTheme: () => void
  onSave: () => void
  onSearch: () => void
  onUndo: () => void
  onRedo: () => void
}

export default function MobileToolbar({
  onToggleSidebar,
  onToggleAI,
  onToggleTheme,
  onSave,
  onSearch,
  onUndo,
  onRedo,
}: Props) {
  const { isMobile, isTablet } = useMobile()
  const [showMore, setShowMore] = useState(false)
  const toolbarRef = useRef<HTMLDivElement>(null)

  const handleSwipeLeft = useCallback(() => {
    onToggleAI()
  }, [onToggleAI])

  const handleSwipeRight = useCallback(() => {
    onToggleSidebar()
  }, [onToggleSidebar])

  const bind = useCallback(
    (element: HTMLDivElement | null) => {
      if (!element) return

      let startX = 0
      let startY = 0

      const onTouchStart = (e: TouchEvent) => {
        startX = e.touches[0].clientX
        startY = e.touches[0].clientY
      }

      const onTouchEnd = (e: TouchEvent) => {
        const deltaX = e.changedTouches[0].clientX - startX
        const deltaY = e.changedTouches[0].clientY - startY

        if (Math.abs(deltaX) > 80 && Math.abs(deltaX) > Math.abs(deltaY) * 2) {
          if (deltaX > 0) {
            handleSwipeRight()
          } else {
            handleSwipeLeft()
          }
        }
      }

      element.addEventListener('touchstart', onTouchStart, { passive: true })
      element.addEventListener('touchend', onTouchEnd, { passive: true })

      return () => {
        element.removeEventListener('touchstart', onTouchStart)
        element.removeEventListener('touchend', onTouchEnd)
      }
    },
    [handleSwipeLeft, handleSwipeRight]
  )

  useEffect(() => {
    return bind(toolbarRef.current)
  }, [bind])

  if (!isMobile && !isTablet) return null

  return (
    <div
      ref={toolbarRef}
      className="fixed bottom-0 left-0 right-0 bg-editor-surface border-t border-editor-border z-40 safe-area-bottom"
    >
      <div className="flex items-center justify-around h-12 px-2">
        <button
          onClick={onToggleSidebar}
          className="w-10 h-10 flex items-center justify-center rounded-lg text-lg hover:bg-editor-bg active:scale-95 transition-transform"
          aria-label="侧边栏"
        >
          ☰
        </button>
        <button
          onClick={onUndo}
          className="w-10 h-10 flex items-center justify-center rounded-lg text-lg hover:bg-editor-bg active:scale-95 transition-transform"
          aria-label="撤销"
        >
          ↩
        </button>
        <button
          onClick={onRedo}
          className="w-10 h-10 flex items-center justify-center rounded-lg text-lg hover:bg-editor-bg active:scale-95 transition-transform"
          aria-label="重做"
        >
          ↪
        </button>
        <button
          onClick={onSave}
          className="w-10 h-10 flex items-center justify-center rounded-lg text-lg hover:bg-editor-bg active:scale-95 transition-transform"
          aria-label="保存"
        >
          💾
        </button>
        <button
          onClick={onSearch}
          className="w-10 h-10 flex items-center justify-center rounded-lg text-lg hover:bg-editor-bg active:scale-95 transition-transform"
          aria-label="搜索"
        >
          🔍
        </button>
        <button
          onClick={onToggleAI}
          className="w-10 h-10 flex items-center justify-center rounded-lg text-lg hover:bg-editor-bg active:scale-95 transition-transform"
          aria-label="AI助手"
        >
          🤖
        </button>
        <button
          onClick={() => setShowMore(!showMore)}
          className="w-10 h-10 flex items-center justify-center rounded-lg text-lg hover:bg-editor-bg active:scale-95 transition-transform"
          aria-label="更多"
        >
          ⋯
        </button>
      </div>

      {showMore && (
        <div className="border-t border-editor-border bg-editor-surface px-2 py-2">
          <div className="flex items-center justify-around">
            <button
              onClick={() => { onToggleTheme(); setShowMore(false) }}
              className="flex flex-col items-center gap-1 p-2 rounded-lg hover:bg-editor-bg"
            >
              <span className="text-lg">☀️</span>
              <span className="text-[10px] text-editor-muted">主题</span>
            </button>
            <button
              onClick={() => { onSave(); setShowMore(false) }}
              className="flex flex-col items-center gap-1 p-2 rounded-lg hover:bg-editor-bg"
            >
              <span className="text-lg">📋</span>
              <span className="text-[10px] text-editor-muted">模板</span>
            </button>
            <button
              onClick={() => { setShowMore(false) }}
              className="flex flex-col items-center gap-1 p-2 rounded-lg hover:bg-editor-bg"
            >
              <span className="text-lg">📊</span>
              <span className="text-[10px] text-editor-muted">统计</span>
            </button>
            <button
              onClick={() => { setShowMore(false) }}
              className="flex flex-col items-center gap-1 p-2 rounded-lg hover:bg-editor-bg"
            >
              <span className="text-lg">⚙️</span>
              <span className="text-[10px] text-editor-muted">设置</span>
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
