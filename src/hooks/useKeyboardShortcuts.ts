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
  onCommandPalette?: () => void
  onToggleTheme?: () => void
  onCloseTab?: () => void
  onBold?: () => void
  onItalic?: () => void
  onUnderline?: () => void
  onStrikethrough?: () => void
  onHighlight?: () => void
  onCode?: () => void
  onLink?: () => void
  onBlockquote?: () => void
  onBulletList?: () => void
  onOrderedList?: () => void
  onHeading1?: () => void
  onHeading2?: () => void
  onHeading3?: () => void
  onHorizontalRule?: () => void
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
  onCommandPalette,
  onToggleTheme,
  onCloseTab,
  onBold,
  onItalic,
  onUnderline,
  onStrikethrough,
  onHighlight,
  onCode,
  onLink,
  onBlockquote,
  onBulletList,
  onOrderedList,
  onHeading1,
  onHeading2,
  onHeading3,
  onHorizontalRule,
}: KeyboardShortcuts = {}) {
  const saveToDB = useDocumentStore((s) => s.saveToDB)
  const { openTabs, setActiveTab, closeTab } = useTabStore()
  const matchShortcut = useShortcutStore((s) => s.matchShortcut)

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        onCommandPalette?.()
        return
      }

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
        toggleAIPanel: () => onToggleAIPanel?.(),
        toggleSidebar: () => onToggleSidebar?.(),
        toggleTheme: () => onToggleTheme?.(),
        closeTab: () => {
          const currentDocId = useDocumentStore.getState().currentDocId
          if (currentDocId) {
            closeTab(currentDocId)
            const newActiveId = useTabStore.getState().activeTabId
            if (newActiveId) {
              useDocumentStore.getState().setCurrentDoc(newActiveId)
            }
          }
        },
        newDocument: () => onNewDoc?.(),
        bold: () => onBold?.(),
        italic: () => onItalic?.(),
        underline: () => onUnderline?.(),
        strikethrough: () => onStrikethrough?.(),
        highlight: () => onHighlight?.(),
        code: () => onCode?.(),
        link: () => onLink?.(),
        blockquote: () => onBlockquote?.(),
        bulletList: () => onBulletList?.(),
        orderedList: () => onOrderedList?.(),
        heading1: () => onHeading1?.(),
        heading2: () => onHeading2?.(),
        heading3: () => onHeading3?.(),
        horizontalRule: () => onHorizontalRule?.(),
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
    [saveToDB, onSave, onNewDoc, onToggleSidebar, onToggleAIPanel, onSearch, onHelp, onFindReplace, onUndo, onRedo, onWordCount, onOutline, onFocusMode, onTypewriter, onFullscreen, onExitFocus, onStats, onCommandPalette, onToggleTheme, onCloseTab, onBold, onItalic, onUnderline, onStrikethrough, onHighlight, onCode, onLink, onBlockquote, onBulletList, onOrderedList, onHeading1, onHeading2, onHeading3, onHorizontalRule, openTabs, setActiveTab, closeTab, matchShortcut]
  )

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [handleKeyDown])
}
