import { useEffect, useCallback } from 'react'
import { useDocumentStore } from '../store/documentStore'
import { useTabStore } from '../store/tabStore'
import { useShortcutStore } from '../store/shortcutStore'

interface KeyboardShortcuts {
  onSave?: () => void
  onNewDoc?: () => void
  onToggleSidebar?: () => void
  onToggleAIPanel?: () => void
  onSearch?: () => void
  onHelp?: () => void
  onFindReplace?: () => void
  onUndo?: () => void
  onRedo?: () => void
  onWordCount?: () => void
  onOutline?: () => void
  onFocusMode?: () => void
  onTypewriter?: () => void
  onFullscreen?: () => void
  onExitFocus?: () => void
  onStats?: () => void
}

export function useKeyboardShortcuts({
  onSave,
  onNewDoc,
  onToggleSidebar,
  onToggleAIPanel,
  onSearch,
  onHelp,
  onFindReplace,
  onUndo,
  onRedo,
  onWordCount,
  onOutline,
  onFocusMode,
  onTypewriter,
  onFullscreen,
  onExitFocus,
  onStats,
}: KeyboardShortcuts = {}) {
  const saveToDB = useDocumentStore((s) => s.saveToDB)
  const { openTabs, setActiveTab } = useTabStore()
  const matchShortcut = useShortcutStore((s) => s.matchShortcut)

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      const isInput = (e.target as HTMLElement)?.tagName === 'INPUT' || (e.target as HTMLElement)?.tagName === 'TEXTAREA'
      const matched = matchShortcut(e)
      if (!matched) return

      if (isInput && matched.id !== 'exitFocus') return

      const actions: Record<string, () => void> = {
        save: () => (onSave ? onSave() : saveToDB()),
        undo: () => onUndo?.(),
        redo: () => onRedo?.(),
        findReplace: () => onFindReplace?.(),
        search: () => onSearch?.(),
        focusMode: () => onFocusMode?.(),
        typewriter: () => onTypewriter?.(),
        outline: () => onOutline?.(),
        wordCount: () => onWordCount?.(),
        stats: () => onStats?.(),
        help: () => onHelp?.(),
        fullscreen: () => onFullscreen?.(),
        exitFocus: () => onExitFocus?.(),
      }

      if (matched.id === 'nextTab' || matched.id === 'prevTab') {
        e.preventDefault()
        if (openTabs.length > 1) {
          const currentIndex = openTabs.findIndex((t) => t.docId === useDocumentStore.getState().currentDocId)
          const nextIndex = matched.id === 'nextTab'
            ? (currentIndex + 1) % openTabs.length
            : (currentIndex - 1 + openTabs.length) % openTabs.length
          setActiveTab(openTabs[nextIndex].docId)
        }
        return
      }

      if (matched.id.startsWith('tab') && matched.id.length === 4) {
        e.preventDefault()
        const num = parseInt(matched.id.charAt(3))
        if (openTabs[num - 1]) {
          setActiveTab(openTabs[num - 1].docId)
        }
        return
      }

      const action = actions[matched.id]
      if (action) {
        e.preventDefault()
        action()
      }
    },
    [saveToDB, onSave, onNewDoc, onToggleSidebar, onToggleAIPanel, onSearch, onHelp, onFindReplace, onUndo, onRedo, onWordCount, onOutline, onFocusMode, onTypewriter, onFullscreen, onExitFocus, onStats, openTabs, setActiveTab, matchShortcut]
  )

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [handleKeyDown])
}
