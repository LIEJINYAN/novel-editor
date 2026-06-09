import { useTabStore } from '../../store/tabStore'
import { useDocumentStore } from '../../store/documentStore'

interface Props {
  onTabSelect: (docId: string) => void
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
  const { openTabs, activeTabId, closeTab, setActiveTab } = useTabStore()
  const documents = useDocumentStore((s) => s.documents)

  if (openTabs.length === 0) return null

  const handleTabClick = (docId: string) => {
    setActiveTab(docId)
    onTabSelect(docId)
  }

  const handleClose = (e: React.MouseEvent, docId: string) => {
    e.stopPropagation()
    closeTab(docId)
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
              className="text-xs opacity-0 group-hover:opacity-100 hover:text-editor-red shrink-0"
              onClick={(e) => handleClose(e, tab.docId)}
            >
              ✕
            </button>
          </div>
        )
      })}
    </div>
  )
}
