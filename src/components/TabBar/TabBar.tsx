import { useState } from 'react'
import { useTabStore } from '../../store/tabStore'
import { useDocumentStore } from '../../store/documentStore'

interface Props {
  onTabSelect: (docId: string | null) => void
}

type DocIcon = '📝' | '📖' | '📄' | '🎭' | '📋' | '📊' | '🗂️'

const ICON_OPTIONS: DocIcon[] = ['📝', '📖', '📄', '🎭', '📋', '📊', '🗂️']

function getDocIcon(docId: string): DocIcon {
  try {
    const stored = localStorage.getItem(`novel-engine-doc-icon-${docId}`)
    return (stored as DocIcon) || '📝'
  } catch {
    return '📝'
  }
}

function setDocIcon(docId: string, icon: DocIcon) {
  try {
    localStorage.setItem(`novel-engine-doc-icon-${docId}`, icon)
  } catch {}
}

export default function TabBar({ onTabSelect }: Props) {
  const { openTabs, activeTabId, closeTab, setActiveTab, recentlyClosed, reopenTab, clearRecentlyClosed } = useTabStore()
  const documents = useDocumentStore((s) => s.documents)
  const [showRecentlyClosed, setShowRecentlyClosed] = useState(false)

  if (openTabs.length === 0) return null

  const handleTabClick = (docId: string) => {
    setActiveTab(docId)
    onTabSelect(docId)
  }

  const handleClose = (e: React.MouseEvent, docId: string) => {
    e.stopPropagation()
    closeTab(docId)

    const newActiveId = useTabStore.getState().activeTabId
    if (newActiveId) {
      onTabSelect(newActiveId)
    } else {
      onTabSelect(null)
    }
  }

  const handleReopen = (docId: string) => {
    reopenTab(docId)
    setShowRecentlyClosed(false)
    const newActiveId = useTabStore.getState().activeTabId
    if (newActiveId) {
      onTabSelect(newActiveId)
    }
  }

  const handleIconClick = (e: React.MouseEvent, docId: string) => {
    e.stopPropagation()
    const currentIcon = getDocIcon(docId)
    const currentIndex = ICON_OPTIONS.indexOf(currentIcon)
    const nextIcon = ICON_OPTIONS[(currentIndex + 1) % ICON_OPTIONS.length]
    setDocIcon(docId, nextIcon)
    window.dispatchEvent(new CustomEvent('tabIconChanged', { detail: { docId } }))
  }

  return (
    <div className="flex items-center bg-editor-sidebar border-b border-editor-border overflow-x-auto shrink-0">
      {openTabs.map((tab) => {
        const doc = documents.find((d) => d.id === tab.docId)
        const isActive = tab.docId === activeTabId
        const icon = getDocIcon(tab.docId)

        return (
          <div
            key={tab.docId}
            className={`flex items-center gap-1.5 px-2 py-2 cursor-pointer border-r border-editor-border min-w-0 max-w-[160px] group ${
              isActive
                ? 'bg-editor-bg text-editor-text'
                : 'text-editor-muted hover:bg-editor-surface/50 hover:text-editor-text'
            }`}
            onClick={() => handleTabClick(tab.docId)}
          >
            <button
              className="text-xs hover:scale-110 transition-transform shrink-0"
              onClick={(e) => handleIconClick(e, tab.docId)}
              title="点击切换图标"
            >
              {icon}
            </button>
            <span className="text-xs truncate flex-1">
              {doc?.title || tab.title}
            </span>
            <button
              className="text-xs opacity-40 hover:opacity-100 hover:text-editor-red shrink-0 px-1.5 py-0.5 rounded hover:bg-red-500/10 transition-all"
              onClick={(e) => handleClose(e, tab.docId)}
              title="关闭"
            >
              ✕
            </button>
          </div>
        )
      })}

      {recentlyClosed.length > 0 && (
        <div className="relative ml-auto">
          <button
            className="text-xs text-editor-muted hover:text-editor-text px-2 py-2"
            onClick={() => setShowRecentlyClosed(!showRecentlyClosed)}
            title="最近关闭"
          >
            🕐
          </button>
          {showRecentlyClosed && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setShowRecentlyClosed(false)} />
              <div className="absolute top-full right-0 mt-1 z-20 bg-editor-surface border border-editor-border rounded-lg shadow-lg py-1 min-w-[200px] max-h-[300px] overflow-y-auto">
                <div className="px-3 py-1 text-[10px] text-editor-muted border-b border-editor-border flex items-center justify-between">
                  <span>最近关闭</span>
                  <button
                    className="text-editor-muted hover:text-editor-text"
                    onClick={() => { clearRecentlyClosed(); setShowRecentlyClosed(false) }}
                  >
                    清空
                  </button>
                </div>
                {recentlyClosed.map((tab) => (
                  <button
                    key={tab.docId}
                    className="w-full text-left px-3 py-1.5 text-xs text-editor-text hover:bg-editor-bg flex items-center gap-2"
                    onClick={() => handleReopen(tab.docId)}
                  >
                    <span>📄</span>
                    <span className="truncate">{tab.title}</span>
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  )
}
