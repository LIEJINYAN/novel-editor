import { useState, useRef } from 'react'
import { useThemeStore } from '../../store/themeStore'
import { useUIStore } from '../../store/uiStore'
import { exportToMarkdown, exportToHTML, exportToPDF, exportToText, exportToDOCX, exportToEPUB } from '../../utils/export'
import { t } from '../../i18n'
import { useClickOutside } from '../../hooks/useClickOutside'
import LanguageSwitcher from '../LanguageSwitcher/LanguageSwitcher'

interface AppHeaderProps {
  currentDoc: { id: string; title: string; content: object } | undefined
  isDirty: boolean
  onToggleSidebar: () => void
  onToggleTheme: () => void
  onSearch: () => void
  onVersionHistory: () => void
  onWritingStats: () => void
  onShortcutsHelp: () => void
  onWritingModes: () => void
  onPluginMarket: () => void
  onWritingChart: () => void
  onTemplates: () => void
  onReminder: () => void
  onShare: () => void
  onClipboard: () => void
  onQuickShortcuts: () => void
  onSettings: () => void
}

export default function AppHeader({
  currentDoc,
  isDirty,
  onToggleSidebar,
  onToggleTheme,
  onSearch,
  onVersionHistory,
  onWritingStats,
  onShortcutsHelp,
  onWritingModes,
  onPluginMarket,
  onWritingChart,
  onTemplates,
  onReminder,
  onShare,
  onClipboard,
  onQuickShortcuts,
  onSettings,
}: AppHeaderProps) {
  const { theme } = useThemeStore()
  const { sidebarOpen, aiPanelOpen, setAiPanelOpen, focusMode, typewriterMode, fullscreen, toggleFocusMode, toggleTypewriterMode, toggleFullscreen } = useUIStore()

  const [exportMenuOpen, setExportMenuOpen] = useState(false)
  const [moreMenuOpen, setMoreMenuOpen] = useState(false)

  const exportMenuRef = useClickOutside(() => setExportMenuOpen(false), exportMenuOpen)
  const moreMenuRef = useClickOutside(() => setMoreMenuOpen(false), moreMenuOpen)

  return (
    <header className="h-10 bg-editor-sidebar border-b border-editor-border flex items-center px-4 shrink-0" role="banner">
      <button
        className="text-editor-muted hover:text-editor-text mr-3 text-sm"
        onClick={onToggleSidebar}
        title={t('menu.toggleSidebar')}
        aria-label={t('menu.toggleSidebar')}
        aria-expanded={sidebarOpen}
      >
        ☰
      </button>
      <h1 className="text-sm font-semibold text-editor-accent">{t('app.title')}</h1>
      <span className="ml-auto text-xs text-editor-muted" aria-live="polite">
        {currentDoc?.title || t('editor.selectDoc')}
        {isDirty && <span className="ml-1 text-yellow-500" aria-label="未保存">●</span>}
      </span>

      {/* File operations group */}
      {currentDoc && (
        <div className="flex items-center ml-3 border-r border-editor-border pr-3">
          <div className="relative" ref={exportMenuRef}>
            <button
              className="text-editor-muted hover:text-editor-text text-sm"
              onClick={() => setExportMenuOpen(!exportMenuOpen)}
              title={t('menu.export')}
            >
              📥
            </button>
            {exportMenuOpen && (
              <div className="absolute top-full right-0 mt-1 bg-editor-surface border border-editor-border rounded shadow-lg z-50 min-w-[140px]">
                <button className="w-full text-left px-3 py-2 text-xs text-editor-text hover:bg-editor-bg" onClick={() => { if (currentDoc) exportToMarkdown(currentDoc.title, currentDoc.content); setExportMenuOpen(false) }}>
                  📝 {t('export.markdown')}
                </button>
                <button className="w-full text-left px-3 py-2 text-xs text-editor-text hover:bg-editor-bg" onClick={() => { if (currentDoc) exportToText(currentDoc.title, currentDoc.content); setExportMenuOpen(false) }}>
                  📄 {t('export.txt') || '纯文本'}
                </button>
                <button className="w-full text-left px-3 py-2 text-xs text-editor-text hover:bg-editor-bg" onClick={() => { if (currentDoc) exportToDOCX(currentDoc.title, currentDoc.content); setExportMenuOpen(false) }}>
                  📋 Word (.docx)
                </button>
                <button className="w-full text-left px-3 py-2 text-xs text-editor-text hover:bg-editor-bg" onClick={() => { if (currentDoc) exportToHTML(currentDoc.title, currentDoc.content); setExportMenuOpen(false) }}>
                  🌐 {t('export.html')}
                </button>
                <button className="w-full text-left px-3 py-2 text-xs text-editor-text hover:bg-editor-bg" onClick={() => { if (currentDoc) exportToEPUB(currentDoc.title, currentDoc.content); setExportMenuOpen(false) }}>
                  📚 {t('export.epub') || '电子书'}
                </button>
                <div className="border-t border-editor-border" />
                <button className="w-full text-left px-3 py-2 text-xs text-editor-text hover:bg-editor-bg" onClick={() => { if (currentDoc) exportToPDF(currentDoc.title, currentDoc.content); setExportMenuOpen(false) }}>
                  📄 {t('export.pdf')}
                </button>
              </div>
            )}
          </div>
          <button className="text-editor-muted hover:text-editor-text ml-2 text-sm" onClick={onVersionHistory} title={t('version.title')}>
            🕐
          </button>
        </div>
      )}

      {/* View & mode group */}
      <div className="flex items-center ml-2 gap-1">
        <button className="text-editor-muted hover:text-editor-text text-sm" onClick={onSearch} title={t('menu.search')} aria-label={t('menu.search')}>🔍</button>
        <button className="text-editor-muted hover:text-editor-text text-sm" onClick={onToggleTheme} title={t('menu.toggleTheme')} aria-label={t('menu.toggleTheme')}>
          {theme === 'dark' ? '☀️' : '🌙'}
        </button>
        <LanguageSwitcher />
        <button className={`text-editor-muted hover:text-editor-text text-sm ${focusMode ? 'text-editor-accent' : ''}`} onClick={toggleFocusMode} title={t('editor.focusMode')} aria-label={t('editor.focusMode')} aria-pressed={focusMode}>🎯</button>
        <button className={`text-editor-muted hover:text-editor-text text-sm ${typewriterMode ? 'text-editor-accent' : ''}`} onClick={toggleTypewriterMode} title={t('editor.typewriter')} aria-label={t('editor.typewriter')} aria-pressed={typewriterMode}>⌨️</button>
        <button className="text-editor-muted hover:text-editor-text text-sm" onClick={toggleFullscreen} title="全屏" aria-label="全屏模式" aria-expanded={fullscreen}>⛶</button>
      </div>

      {/* AI group */}
      <div className="flex items-center ml-2 gap-1 border-l border-editor-border pl-2">
        <button className={`text-editor-muted hover:text-editor-text text-sm ${aiPanelOpen ? 'text-editor-accent' : ''}`} onClick={() => setAiPanelOpen(!aiPanelOpen)} title={t('menu.toggleAIPanel')} aria-label={t('menu.toggleAIPanel')} aria-expanded={aiPanelOpen}>🤖</button>
      </div>

      {/* Overflow menu */}
      <div className="flex items-center ml-2 relative" ref={moreMenuRef}>
        <button className="text-editor-muted hover:text-editor-text text-sm" onClick={() => setMoreMenuOpen(!moreMenuOpen)} title={t('menu.overflow')} aria-label={t('menu.overflow')}>
          ⋯
        </button>
        {moreMenuOpen && (
          <div className="absolute top-full right-0 mt-1 bg-editor-surface border border-editor-border rounded shadow-lg z-50 min-w-[160px] max-h-[60vh] overflow-y-auto">
            <button className="w-full text-left px-3 py-2 text-xs text-editor-text hover:bg-editor-bg" onClick={() => { onWritingStats(); setMoreMenuOpen(false) }}>📈 {t('editor.writingStats')}</button>
            <button className="w-full text-left px-3 py-2 text-xs text-editor-text hover:bg-editor-bg" onClick={() => { onShortcutsHelp(); setMoreMenuOpen(false) }}>❓ {t('editor.shortcutsHelp')}</button>
            <button className="w-full text-left px-3 py-2 text-xs text-editor-text hover:bg-editor-bg" onClick={() => { onWritingModes(); setMoreMenuOpen(false) }}>✍️ {t('editor.writingModes')}</button>
            <button className="w-full text-left px-3 py-2 text-xs text-editor-text hover:bg-editor-bg" onClick={() => { onPluginMarket(); setMoreMenuOpen(false) }}>🧩 {t('editor.pluginMarket')}</button>
            <button className="w-full text-left px-3 py-2 text-xs text-editor-text hover:bg-editor-bg" onClick={() => { onWritingChart(); setMoreMenuOpen(false) }}>📊 {t('editor.writingChart')}</button>
            <button className="w-full text-left px-3 py-2 text-xs text-editor-text hover:bg-editor-bg" onClick={() => { onTemplates(); setMoreMenuOpen(false) }}>📝 {t('editor.documentTemplates')}</button>
            <button className="w-full text-left px-3 py-2 text-xs text-editor-text hover:bg-editor-bg" onClick={() => { onReminder(); setMoreMenuOpen(false) }}>🔔 {t('editor.writingReminder')}</button>
            <button className="w-full text-left px-3 py-2 text-xs text-editor-text hover:bg-editor-bg" onClick={() => { onShare(); setMoreMenuOpen(false) }}>📤 {t('editor.documentShare')}</button>
            <button className="w-full text-left px-3 py-2 text-xs text-editor-text hover:bg-editor-bg" onClick={() => { onClipboard(); setMoreMenuOpen(false) }}>📋 {t('editor.clipboardHistory')}</button>
            <button className="w-full text-left px-3 py-2 text-xs text-editor-text hover:bg-editor-bg" onClick={() => { onQuickShortcuts(); setMoreMenuOpen(false) }}>⌨️ 快捷键速查</button>
            <div className="border-t border-editor-border" />
            <button className="w-full text-left px-3 py-2 text-xs text-editor-text hover:bg-editor-bg" onClick={() => { onSettings(); setMoreMenuOpen(false) }}>⚙️ {t('settings.title')}</button>
          </div>
        )}
      </div>
    </header>
  )
}
