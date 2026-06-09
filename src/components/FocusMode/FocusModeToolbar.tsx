import { useState, useEffect, useCallback, useRef } from 'react'
import { useThemeStore } from '../../store/themeStore'
import { useUIStore } from '../../store/uiStore'
import { useDocumentSessionStore } from '../../store/documentSessionStore'

interface Props {
  docId: string
  onSave?: () => void
  onExit?: () => void
  onToggleWordWrap?: () => void
}

type ToolbarMode = 'auto' | 'always' | 'never'

const MODE_LABELS: Record<ToolbarMode, string> = {
  auto: '悬停显示',
  always: '始终显示',
  never: '从不显示',
}

const MODE_CYCLE: ToolbarMode[] = ['auto', 'always', 'never']

export default function FocusModeToolbar({ docId, onSave, onExit, onToggleWordWrap }: Props) {
  const [isVisible, setIsVisible] = useState(false)
  const [isPinned, setIsPinned] = useState(false)
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const toolbarRef = useRef<HTMLDivElement>(null)

  const { wordWrap, toggleTheme, theme } = useThemeStore()
  const { focusToolbarMode, setFocusToolbarMode } = useUIStore()
  const { canUndo, canRedo, undo, redo } = useDocumentSessionStore()

  const isNeverVisible = focusToolbarMode === 'never'

  const showToolbar = useCallback(() => {
    if (isNeverVisible) return
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }
    setIsVisible(true)
  }, [isNeverVisible])

  const hideToolbar = useCallback(() => {
    if (isPinned || focusToolbarMode === 'always') return
    timeoutRef.current = setTimeout(() => {
      setIsVisible(false)
    }, 800)
  }, [isPinned, focusToolbarMode])

  useEffect(() => {
    if (focusToolbarMode === 'always') {
      setIsVisible(true)
      return
    }

    if (focusToolbarMode === 'never') {
      setIsVisible(false)
      return
    }

    const handleMouseMove = (e: MouseEvent) => {
      if (e.clientY < 60) {
        showToolbar()
      } else if (e.clientY > 100 && !isPinned) {
        hideToolbar()
      }
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isPinned) {
        setIsPinned(false)
      }
    }

    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('keydown', handleKeyDown)

    return () => {
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('keydown', handleKeyDown)
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [showToolbar, hideToolbar, isPinned, focusToolbarMode])

  const handlePin = () => {
    setIsPinned(!isPinned)
  }

  const cycleMode = () => {
    const currentIndex = MODE_CYCLE.indexOf(focusToolbarMode)
    const nextMode = MODE_CYCLE[(currentIndex + 1) % MODE_CYCLE.length]
    setFocusToolbarMode(nextMode)
  }

  const btnClass = (active: boolean = false) =>
    `p-1.5 rounded transition-all duration-200 ${
      active
        ? 'bg-white/20 text-white'
        : 'text-white/60 hover:text-white hover:bg-white/10'
    }`

  if (focusToolbarMode === 'never') {
    return null
  }

  const shouldShow = isVisible || isPinned || focusToolbarMode === 'always'

  return (
    <>
      <div
        ref={toolbarRef}
        className={`fixed top-0 left-1/2 -translate-x-1/2 z-50 transition-all duration-300 ${
          shouldShow
            ? 'opacity-100 translate-y-0'
            : 'opacity-0 -translate-y-full pointer-events-none'
        }`}
        onMouseEnter={showToolbar}
        onMouseLeave={() => !isPinned && hideToolbar()}
      >
        <div className="flex items-center gap-1 px-3 py-1.5 bg-black/80 backdrop-blur-sm rounded-b-lg shadow-lg border border-white/10 border-t-0">
          <button
            onClick={() => {
              document.execCommand('undo')
            }}
            disabled={!canUndo(docId)}
            className={btnClass(canUndo(docId))}
            title="撤销"
          >
            ↩
          </button>
          <button
            onClick={() => {
              document.execCommand('redo')
            }}
            disabled={!canRedo(docId)}
            className={btnClass(canRedo(docId))}
            title="重做"
          >
            ↪
          </button>

          <div className="w-px h-4 bg-white/20 mx-1" />

          <button
            onClick={() => document.execCommand('bold')}
            className={btnClass()}
            title="加粗"
          >
            <strong>B</strong>
          </button>
          <button
            onClick={() => document.execCommand('italic')}
            className={btnClass()}
            title="斜体"
          >
            <em>I</em>
          </button>
          <button
            onClick={() => document.execCommand('underline')}
            className={btnClass()}
            title="下划线"
          >
            <span className="underline">U</span>
          </button>

          <div className="w-px h-4 bg-white/20 mx-1" />

          <button
            onClick={onSave}
            className={btnClass()}
            title="保存"
          >
            💾
          </button>
          <button
            onClick={toggleTheme}
            className={btnClass()}
            title="切换主题"
          >
            {theme === 'dark' ? '☀️' : '🌙'}
          </button>
          <button
            onClick={onToggleWordWrap}
            className={btnClass(wordWrap)}
            title={wordWrap ? '关闭自动换行' : '开启自动换行'}
          >
            ↵
          </button>

          <div className="w-px h-4 bg-white/20 mx-1" />

          <button
            onClick={cycleMode}
            className={btnClass(true)}
            title={`工具栏模式: ${MODE_LABELS[focusToolbarMode]}`}
          >
            {focusToolbarMode === 'auto' && '🔄'}
            {focusToolbarMode === 'always' && '👁️'}
          </button>
          <button
            onClick={handlePin}
            className={btnClass(isPinned)}
            title={isPinned ? '取消固定' : '固定工具栏'}
          >
            {isPinned ? '📌' : '📍'}
          </button>
          <button
            onClick={onExit}
            className={btnClass()}
            title="退出专注模式 (ESC)"
          >
            ✕
          </button>
        </div>
      </div>

      {isVisible && !isPinned && focusToolbarMode !== 'always' && (
        <div
          className="fixed top-0 left-0 w-full h-60 z-40"
          style={{ pointerEvents: 'none' }}
        />
      )}
    </>
  )
}
