import { useState, useCallback, useRef, useEffect, lazy, Suspense, useMemo } from 'react'
import { useDocumentStore } from './store/documentStore'
import { useThemeStore } from './store/themeStore'
import { useUIStore } from './store/uiStore'
import { useTabStore } from './store/tabStore'
import { useWritingStatsStore } from './store/writingStatsStore'
import { useDocumentCacheStore } from './store/documentCacheStore'
import { useWordGoalStore } from './store/wordGoalStore'
import { useAutoSaveStore } from './store/autoSaveStore'
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts'
import { useAutoSave } from './hooks/useAutoSave'
import { useClickOutside } from './hooks/useClickOutside'
import { exportToMarkdown, exportToHTML, exportToPDF, exportToText, exportToDOCX, exportToEPUB } from './utils/export'
import { t } from './i18n'
import { ToastProvider } from './components/common/Toast'
import LanguageSwitcher from './components/LanguageSwitcher/LanguageSwitcher'
import { WordCountFooter, WordCountPanel } from './components/WordCount/WordCount'
import DocumentOutline, { DocumentOutlinePanel } from './components/DocumentOutline/DocumentOutline'
import TabBar from './components/TabBar/TabBar'
import WritingStatsPanel from './components/WritingStats/WritingStatsPanel'
import WordGoalFooter from './components/WordGoal/WordGoalFooter'

const EditorComponent = lazy(() => import('./components/Editor/Editor'))
const DocumentTree = lazy(() => import('./components/Sidebar/DocumentTree'))
const AIPanel = lazy(() => import('./components/AIPanel/AIPanel'))
const VersionHistory = lazy(() => import('./components/VersionHistory/VersionHistory'))
const SearchPanel = lazy(() => import('./components/Search/SearchPanel'))
const KeyboardShortcutsHelp = lazy(() => import('./components/KeyboardShortcutsHelp/KeyboardShortcutsHelp'))
const FindReplace = lazy(() => import('./components/FindReplace/FindReplace'))
const FocusModeToolbar = lazy(() => import('./components/FocusMode/FocusModeToolbar'))
const FocusContextMenu = lazy(() => import('./components/FocusMode/FocusContextMenu'))
const WordGoalPanel = lazy(() => import('./components/WordGoal/WordGoalPanel'))
const SettingsPanel = lazy(() => import('./components/Settings/SettingsPanel'))
const WritingModes = lazy(() => import('./components/WritingModes/WritingModes'))
const PluginMarket = lazy(() => import('./components/PluginMarket/PluginMarket'))
const WritingChart = lazy(() => import('./components/WritingChart/WritingChart'))
const DocumentTemplates = lazy(() => import('./components/DocumentTemplates/DocumentTemplates'))
const WritingReminder = lazy(() => import('./components/WritingReminder/WritingReminder'))
const DocumentShare = lazy(() => import('./components/DocumentShare/DocumentShare'))
const ClipboardHistory = lazy(() => import('./components/ClipboardHistory/ClipboardHistory'))
const QuickShortcuts = lazy(() => import('./components/KeyboardShortcutsHelp/QuickShortcuts'))
const MobileToolbar = lazy(() => import('./components/MobileToolbar/MobileToolbar'))
const CommandPalette = lazy(() => import('./components/CommandPalette/CommandPalette'))

import { ErrorBoundary } from './components/ErrorBoundary/ErrorBoundary'
import { useMobile } from './hooks/useMobile'

import type { EditorRef } from './components/Editor/Editor'
import type { Command } from './components/CommandPalette/CommandPalette'

function App() {
  const [versionHistoryOpen, setVersionHistoryOpen] = useState(false)
  const [exportMenuOpen, setExportMenuOpen] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const [shortcutsHelpOpen, setShortcutsHelpOpen] = useState(false)
  const [findReplaceOpen, setFindReplaceOpen] = useState(false)
  const [wordCountOpen, setWordCountOpen] = useState(false)
  const [outlinePanelOpen, setOutlinePanelOpen] = useState(false)
  const [writingStatsOpen, setWritingStatsOpen] = useState(false)
  const [wordGoalOpen, setWordGoalOpen] = useState(false)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [writingModesOpen, setWritingModesOpen] = useState(false)
  const [pluginMarketOpen, setPluginMarketOpen] = useState(false)
  const [writingChartOpen, setWritingChartOpen] = useState(false)
  const [templatesOpen, setTemplatesOpen] = useState(false)
  const [reminderOpen, setReminderOpen] = useState(false)
  const [shareOpen, setShareOpen] = useState(false)
  const [clipboardOpen, setClipboardOpen] = useState(false)
  const [quickShortcutsOpen, setQuickShortcutsOpen] = useState(false)
  const [moreMenuOpen, setMoreMenuOpen] = useState(false)
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false)

  const { isMobile } = useMobile()
  const exportMenuRef = useClickOutside(() => setExportMenuOpen(false), exportMenuOpen)
  const moreMenuRef = useClickOutside(() => setMoreMenuOpen(false), moreMenuOpen)

  const getCurrentDoc = useDocumentStore((s) => s.getCurrentDoc)
  const updateDoc = useDocumentStore((s) => s.updateDoc)
  const loadFromDB = useDocumentStore((s) => s.loadFromDB)
  const setCurrentDoc = useDocumentStore((s) => s.setCurrentDoc)
  const isLoaded = useDocumentStore((s) => s.isLoaded)
  const isDirty = useDocumentStore((s) => s.isDirty)
  const markDirty = useDocumentStore((s) => s.markDirty)
  const saveToDB = useDocumentStore((s) => s.saveToDB)

  const { theme, toggleTheme } = useThemeStore()
  const { focusMode, typewriterMode, fullscreen, toggleFocusMode, toggleTypewriterMode, toggleFullscreen, sidebarOpen, setSidebarOpen, aiPanelOpen, setAiPanelOpen } = useUIStore()
  const { openTab, setActiveTab, activeTabId, loadSession, saveSession } = useTabStore()
  const { startSession, endSession, updateWordCount } = useWritingStatsStore()
  const { loadDocument, unloadDocument } = useDocumentCacheStore()
  const { addWordCount } = useWordGoalStore()

  const editorRef = useRef<EditorRef>(null)
  const currentDoc = getCurrentDoc()

  useEffect(() => {
    loadFromDB()
    loadSession()
    document.documentElement.classList.toggle('dark', theme === 'dark')
  }, [loadFromDB, loadSession, theme])

  const handleThemeToggle = useCallback(() => {
    document.documentElement.classList.add('theme-transition')
    toggleTheme()
    setTimeout(() => document.documentElement.classList.remove('theme-transition'), 350)
  }, [toggleTheme])

  useEffect(() => {
    return () => {
      saveSession()
    }
  }, [saveSession])

  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isDirty) {
        e.preventDefault()
        e.returnValue = ''
      }
      saveSession()
    }
    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => window.removeEventListener('beforeunload', handleBeforeUnload)
  }, [isDirty, saveSession])

  useEffect(() => {
    startSession()
    return () => endSession()
  }, [startSession, endSession])

  const lastWordCountRef = useRef(0)

  const handleContentChange = useCallback(
    (content: object) => {
      if (currentDoc) {
        updateDoc(currentDoc.id, { content })
        markDirty()
        const text = (content as any)?.content?.reduce((acc: string, block: any) => {
          if (block.content) {
            return acc + block.content.map((c: any) => c.text || '').join('')
          }
          return acc
        }, '') || ''
        const currentLength = text.length
        updateWordCount(currentLength)

        if (lastWordCountRef.current > 0) {
          const diff = currentLength - lastWordCountRef.current
          if (diff > 0) {
            addWordCount(diff)
          }
        }
        lastWordCountRef.current = currentLength
      }
    },
    [currentDoc, updateDoc, markDirty, updateWordCount, addWordCount]
  )

  const handleSave = useCallback(async () => {
    await saveToDB()
    useDocumentStore.getState().markClean()
  }, [saveToDB])

  const { save: autoSave, isSaving, lastSaved } = useAutoSave({
    docId: currentDoc?.id || null,
    content: currentDoc?.content || null,
    onSave: handleSave,
  })

  const docCount = useDocumentStore((s) => s.documents.length)

  const handleTabSelect = useCallback((docId: string) => {
    setCurrentDoc(docId)
  }, [setCurrentDoc])

  useKeyboardShortcuts({
    onSave: handleSave,
    onToggleSidebar: () => setSidebarOpen(!sidebarOpen),
    onToggleAIPanel: () => setAiPanelOpen(!aiPanelOpen),
    onSearch: () => setSearchOpen(true),
    onHelp: () => setShortcutsHelpOpen(true),
    onFindReplace: () => setFindReplaceOpen(true),
    onWordCount: () => setWordCountOpen(true),
    onOutline: () => setOutlinePanelOpen(true),
    onFocusMode: toggleFocusMode,
    onTypewriter: toggleTypewriterMode,
    onFullscreen: toggleFullscreen,
    onExitFocus: () => { if (focusMode) toggleFocusMode() },
    onStats: () => setWritingStatsOpen(true),
    onCommandPalette: () => setCommandPaletteOpen((prev) => !prev),
  })

  const handleAiInsert = useCallback((text: string) => {
    editorRef.current?.insertContent(text)
  }, [])

  const commands: Command[] = useMemo(() => [
    { id: 'save', label: t('menu.save'), icon: '💾', category: '文件', shortcut: 'Ctrl+S', action: handleSave },
    { id: 'new-doc', label: t('menu.newDoc'), icon: '📄', category: '文件', shortcut: 'Ctrl+N', action: () => {} },
    { id: 'search', label: t('menu.search'), icon: '🔍', category: '编辑', shortcut: 'Ctrl+F', action: () => setSearchOpen(true) },
    { id: 'find-replace', label: t('editor.findReplace'), icon: '🔎', category: '编辑', shortcut: 'Ctrl+H', action: () => setFindReplaceOpen(true) },
    { id: 'toggle-sidebar', label: t('menu.toggleSidebar'), icon: '☰', category: '视图', shortcut: 'Ctrl+B', action: () => setSidebarOpen(!sidebarOpen) },
    { id: 'toggle-ai', label: t('menu.toggleAIPanel'), icon: '🤖', category: '视图', shortcut: 'Ctrl+Shift+A', action: () => setAiPanelOpen(!aiPanelOpen) },
    { id: 'toggle-theme', label: t('menu.toggleTheme'), icon: theme === 'dark' ? '☀️' : '🌙', category: '视图', action: toggleTheme },
    { id: 'focus-mode', label: t('editor.focusMode'), icon: '🎯', category: '视图', action: toggleFocusMode },
    { id: 'typewriter', label: t('editor.typewriter'), icon: '⌨️', category: '视图', action: toggleTypewriterMode },
    { id: 'fullscreen', label: '全屏', icon: '⛶', category: '视图', shortcut: 'F11', action: toggleFullscreen },
    { id: 'outline', label: t('editor.outline'), icon: '📑', category: '视图', shortcut: 'Ctrl+Shift+O', action: () => setOutlinePanelOpen(true) },
    { id: 'word-count', label: t('editor.wordCount'), icon: '📊', category: '视图', action: () => setWordCountOpen(true) },
    { id: 'word-goal', label: t('editor.wordGoal'), icon: '🎯', category: '写作', action: () => setWordGoalOpen(true) },
    { id: 'writing-stats', label: t('editor.writingStats'), icon: '📈', category: '写作', action: () => setWritingStatsOpen(true) },
    { id: 'writing-chart', label: t('editor.writingChart'), icon: '📊', category: '写作', action: () => setWritingChartOpen(true) },
    { id: 'writing-modes', label: t('editor.writingModes'), icon: '✍️', category: '写作', action: () => setWritingModesOpen(true) },
    { id: 'templates', label: t('editor.documentTemplates'), icon: '📝', category: '写作', action: () => setTemplatesOpen(true) },
    { id: 'reminder', label: t('editor.writingReminder'), icon: '🔔', category: '写作', action: () => setReminderOpen(true) },
    { id: 'shortcuts', label: t('editor.shortcutsHelp'), icon: '❓', category: '帮助', shortcut: 'F1', action: () => setShortcutsHelpOpen(true) },
    { id: 'settings', label: t('settings.title'), icon: '⚙️', category: '设置', action: () => setSettingsOpen(true) },
    { id: 'plugin-market', label: t('editor.pluginMarket'), icon: '🧩', category: '扩展', action: () => setPluginMarketOpen(true) },
    { id: 'clipboard', label: t('editor.clipboardHistory'), icon: '📋', category: '工具', action: () => setClipboardOpen(true) },
    { id: 'version-history', label: t('editor.versionHistory'), icon: '🕐', category: '工具', action: () => setVersionHistoryOpen(true) },
    { id: 'share', label: t('editor.documentShare'), icon: '📤', category: '工具', action: () => setShareOpen(true) },
  ], [handleSave, sidebarOpen, aiPanelOpen, theme, toggleTheme, toggleFocusMode, toggleTypewriterMode, toggleFullscreen, setSidebarOpen, setAiPanelOpen])

  const LoadingFallback = () => (
    <div className="flex-1 flex items-center justify-center text-editor-muted">
      <div className="text-center">
        <p className="text-lg mb-2">⏳ {t('app.loading')}</p>
      </div>
    </div>
  )

  return (
    <ToastProvider>
    <div className={`h-full w-full flex flex-col bg-editor-bg ${focusMode ? 'focus-mode' : ''} ${typewriterMode ? 'typewriter-mode' : ''}`}>
      {!focusMode && !isMobile && (
        <header className="h-10 bg-editor-sidebar border-b border-editor-border flex items-center px-4 shrink-0" role="banner">
          <button
            className="text-editor-muted hover:text-editor-text mr-3 text-sm"
            onClick={() => setSidebarOpen(!sidebarOpen)}
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
              <button className="text-editor-muted hover:text-editor-text ml-2 text-sm" onClick={() => setVersionHistoryOpen(true)} title={t('version.title')}>
                🕐
              </button>
            </div>
          )}

          {/* View & mode group */}
          <div className="flex items-center ml-2 gap-1">
            <button className="text-editor-muted hover:text-editor-text text-sm" onClick={() => setSearchOpen(true)} title={t('menu.search')} aria-label={t('menu.search')}>🔍</button>
            <button className="text-editor-muted hover:text-editor-text text-sm" onClick={handleThemeToggle} title={t('menu.toggleTheme')} aria-label={t('menu.toggleTheme')}>
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
                <button className="w-full text-left px-3 py-2 text-xs text-editor-text hover:bg-editor-bg" onClick={() => { setWritingStatsOpen(true); setMoreMenuOpen(false) }}>📈 {t('editor.writingStats')}</button>
                <button className="w-full text-left px-3 py-2 text-xs text-editor-text hover:bg-editor-bg" onClick={() => { setShortcutsHelpOpen(true); setMoreMenuOpen(false) }}>❓ {t('editor.shortcutsHelp')}</button>
                <button className="w-full text-left px-3 py-2 text-xs text-editor-text hover:bg-editor-bg" onClick={() => { setWritingModesOpen(true); setMoreMenuOpen(false) }}>✍️ {t('editor.writingModes')}</button>
                <button className="w-full text-left px-3 py-2 text-xs text-editor-text hover:bg-editor-bg" onClick={() => { setPluginMarketOpen(true); setMoreMenuOpen(false) }}>🧩 {t('editor.pluginMarket')}</button>
                <button className="w-full text-left px-3 py-2 text-xs text-editor-text hover:bg-editor-bg" onClick={() => { setWritingChartOpen(true); setMoreMenuOpen(false) }}>📊 {t('editor.writingChart')}</button>
                <button className="w-full text-left px-3 py-2 text-xs text-editor-text hover:bg-editor-bg" onClick={() => { setTemplatesOpen(true); setMoreMenuOpen(false) }}>📝 {t('editor.documentTemplates')}</button>
                <button className="w-full text-left px-3 py-2 text-xs text-editor-text hover:bg-editor-bg" onClick={() => { setReminderOpen(true); setMoreMenuOpen(false) }}>🔔 {t('editor.writingReminder')}</button>
                <button className="w-full text-left px-3 py-2 text-xs text-editor-text hover:bg-editor-bg" onClick={() => { setShareOpen(true); setMoreMenuOpen(false) }}>📤 {t('editor.documentShare')}</button>
                <button className="w-full text-left px-3 py-2 text-xs text-editor-text hover:bg-editor-bg" onClick={() => { setClipboardOpen(true); setMoreMenuOpen(false) }}>📋 {t('editor.clipboardHistory')}</button>
                <button className="w-full text-left px-3 py-2 text-xs text-editor-text hover:bg-editor-bg" onClick={() => { setQuickShortcutsOpen(true); setMoreMenuOpen(false) }}>⌨️ 快捷键速查</button>
                <div className="border-t border-editor-border" />
                <button className="w-full text-left px-3 py-2 text-xs text-editor-text hover:bg-editor-bg" onClick={() => { setSettingsOpen(true); setMoreMenuOpen(false) }}>⚙️ {t('settings.title')}</button>
              </div>
            )}
          </div>
        </header>
      )}

      <TabBar onTabSelect={handleTabSelect} />

      <div className="flex-1 flex overflow-hidden">
        {!focusMode && (
          <ErrorBoundary>
            <Suspense fallback={<LoadingFallback />}>
              <aside
                className={`bg-editor-sidebar border-r border-editor-border flex flex-col transition-all duration-200 ${
                  sidebarOpen ? (isMobile ? 'fixed inset-y-0 left-0 w-60 z-40 shadow-2xl' : 'w-60') : 'w-0 overflow-hidden'
                }`}
                role="complementary"
                aria-label="侧边栏"
              >
                {isMobile && sidebarOpen && (
                  <div className="fixed inset-0 bg-black/30 z-30" onClick={() => setSidebarOpen(false)} />
                )}
                <div className="border-b border-editor-border relative z-10">
                  <div className="flex items-center justify-between px-3 py-2">
                    <span className="text-xs font-semibold text-editor-muted uppercase tracking-wider">{t('sidebar.documentTree')}</span>
                    <button className="text-xs text-editor-muted hover:text-editor-text" onClick={() => setOutlinePanelOpen(true)} title="展开大纲面板">⛶</button>
                  </div>
                  <DocumentOutline editor={editorRef.current?.getEditor() || null} onNavigate={(_pos: number) => {}} />
                </div>
                <DocumentTree />
              </aside>
            </Suspense>
          </ErrorBoundary>
        )}

        <main className="flex-1 flex flex-col min-w-0" role="main" aria-label="编辑器">
          {!isLoaded ? (
            <LoadingFallback />
          ) : currentDoc ? (
            <ErrorBoundary>
              <Suspense fallback={<LoadingFallback />}>
                <EditorComponent
                  ref={editorRef}
                  key={currentDoc.id}
                  docId={currentDoc.id}
                  initialContent={currentDoc.content}
                  onChange={handleContentChange}
                  editorContent={JSON.stringify(currentDoc.content)}
                />
              </Suspense>
            </ErrorBoundary>
          ) : (
            <div className="flex-1 flex items-center justify-center text-editor-muted">
              <div className="text-center">
                <p className="text-lg mb-2">📖 {t('editor.selectDoc')}</p>
                <p className="text-sm">{t('editor.selectDocHint')}</p>
              </div>
            </div>
          )}
        </main>

        {!focusMode && (
          <ErrorBoundary>
            <Suspense fallback={<LoadingFallback />}>
              <aside
                className={`bg-editor-sidebar border-l border-editor-border flex flex-col transition-all duration-200 ${
                  aiPanelOpen ? 'w-72' : 'w-0 overflow-hidden'
                }`}
              >
                <AIPanel
                  editorContent={currentDoc ? JSON.stringify(currentDoc.content) : ''}
                  onInsertContent={handleAiInsert}
                />
              </aside>
            </Suspense>
          </ErrorBoundary>
        )}
      </div>

      {!focusMode && (
        <footer className="h-6 bg-editor-sidebar border-t border-editor-border flex items-center px-3 text-xs text-editor-muted shrink-0" role="contentinfo" aria-label="状态栏">
          <span>{isLoaded ? t('app.ready') : t('app.loading')}</span>
          <span className="ml-4">
            <WordCountFooter editor={editorRef.current?.getEditor() || null} />
          </span>
          <span className="ml-4">
            <WordGoalFooter />
          </span>
          {isSaving && (
            <span className="ml-4 text-yellow-500" aria-live="polite">
              ⏳ {t('app.loading')}
            </span>
          )}
          {lastSaved && !isSaving && (
            <span className="ml-4 text-editor-muted" aria-live="polite">
              {new Date(lastSaved).toLocaleTimeString()}
            </span>
          )}
          <div className="ml-auto flex items-center gap-2">
            <button
              className="hover:text-editor-text"
              onClick={() => setFindReplaceOpen(true)}
              title={t('editor.findReplace')}
              aria-label={t('editor.findReplace')}
            >
              🔎
            </button>
            <button
              className="hover:text-editor-text"
              onClick={() => setWordCountOpen(true)}
              title={t('editor.writingStats')}
              aria-label={t('editor.writingStats')}
            >
              📊
            </button>
            <button
              className="hover:text-editor-text"
              onClick={() => setWordGoalOpen(true)}
              title={t('editor.wordGoal')}
              aria-label={t('editor.wordGoal')}
            >
              🎯
            </button>
            <button
              className="hover:text-editor-text"
              onClick={() => setOutlinePanelOpen(true)}
              title={t('editor.outline')}
              aria-label={t('editor.outline')}
            >
              📑
            </button>
            <span aria-label={`文档数量: ${docCount}`}>
              {docCount}
            </span>
          </div>
        </footer>
      )}

      {versionHistoryOpen && currentDoc && (
        <ErrorBoundary>
          <Suspense fallback={<LoadingFallback />}>
            <VersionHistory
              docId={currentDoc.id}
              onClose={() => setVersionHistoryOpen(false)}
            />
          </Suspense>
        </ErrorBoundary>
      )}

      {searchOpen && (
        <ErrorBoundary>
          <Suspense fallback={<LoadingFallback />}>
            <SearchPanel
              onNavigate={(docId) => setCurrentDoc(docId)}
              onClose={() => setSearchOpen(false)}
            />
          </Suspense>
        </ErrorBoundary>
      )}

      {shortcutsHelpOpen && (
        <ErrorBoundary>
          <Suspense fallback={<LoadingFallback />}>
            <KeyboardShortcutsHelp onClose={() => setShortcutsHelpOpen(false)} />
          </Suspense>
        </ErrorBoundary>
      )}

      {findReplaceOpen && (
        <ErrorBoundary>
          <Suspense fallback={<LoadingFallback />}>
            <FindReplace
              editor={editorRef.current?.getEditor() || null}
              onClose={() => setFindReplaceOpen(false)}
            />
          </Suspense>
        </ErrorBoundary>
      )}

      {wordCountOpen && (
        <ErrorBoundary>
          <Suspense fallback={<LoadingFallback />}>
            <WordCountPanel
              editor={editorRef.current?.getEditor() || null}
              onClose={() => setWordCountOpen(false)}
            />
          </Suspense>
        </ErrorBoundary>
      )}

      {outlinePanelOpen && (
        <ErrorBoundary>
          <Suspense fallback={<LoadingFallback />}>
            <DocumentOutlinePanel
              editor={editorRef.current?.getEditor() || null}
              onClose={() => setOutlinePanelOpen(false)}
            />
          </Suspense>
        </ErrorBoundary>
      )}

      {writingStatsOpen && (
        <ErrorBoundary>
          <Suspense fallback={<LoadingFallback />}>
            <WritingStatsPanel onClose={() => setWritingStatsOpen(false)} />
          </Suspense>
        </ErrorBoundary>
      )}

      {focusMode && currentDoc && (
        <ErrorBoundary>
          <Suspense fallback={<LoadingFallback />}>
            <FocusModeToolbar
              docId={currentDoc.id}
              onSave={handleSave}
              onExit={toggleFocusMode}
              onToggleWordWrap={() => useThemeStore.getState().toggleWordWrap()}
            />
          </Suspense>
        </ErrorBoundary>
      )}

      {focusMode && currentDoc && (
        <ErrorBoundary>
          <Suspense fallback={<LoadingFallback />}>
            <FocusContextMenu
              editor={editorRef.current?.getEditor() || null}
              onSave={handleSave}
              onToggleWordWrap={() => useThemeStore.getState().toggleWordWrap()}
              onExitFocusMode={toggleFocusMode}
            />
          </Suspense>
        </ErrorBoundary>
      )}

      {wordGoalOpen && (
        <ErrorBoundary>
          <Suspense fallback={<LoadingFallback />}>
            <WordGoalPanel onClose={() => setWordGoalOpen(false)} />
          </Suspense>
        </ErrorBoundary>
      )}

      {settingsOpen && (
        <ErrorBoundary>
          <Suspense fallback={<LoadingFallback />}>
            <SettingsPanel onClose={() => setSettingsOpen(false)} />
          </Suspense>
        </ErrorBoundary>
      )}

      {writingModesOpen && (
        <ErrorBoundary>
          <Suspense fallback={<LoadingFallback />}>
            <WritingModes onClose={() => setWritingModesOpen(false)} />
          </Suspense>
        </ErrorBoundary>
      )}

      {pluginMarketOpen && (
        <ErrorBoundary>
          <Suspense fallback={<LoadingFallback />}>
            <PluginMarket onClose={() => setPluginMarketOpen(false)} />
          </Suspense>
        </ErrorBoundary>
      )}

      {writingChartOpen && (
        <ErrorBoundary>
          <Suspense fallback={<LoadingFallback />}>
            <WritingChart onClose={() => setWritingChartOpen(false)} />
          </Suspense>
        </ErrorBoundary>
      )}

      {templatesOpen && (
        <ErrorBoundary>
          <Suspense fallback={<LoadingFallback />}>
            <DocumentTemplates
              onClose={() => setTemplatesOpen(false)}
              onSelect={(title, content) => {
                const id = useDocumentStore.getState().addDoc({ title, content, type: 'chapter', parentId: null })
                useDocumentStore.getState().setCurrentDoc(id)
                openTab(id, title)
              }}
            />
          </Suspense>
        </ErrorBoundary>
      )}

      {reminderOpen && (
        <ErrorBoundary>
          <Suspense fallback={<LoadingFallback />}>
            <WritingReminder onClose={() => setReminderOpen(false)} />
          </Suspense>
        </ErrorBoundary>
      )}

      {shareOpen && currentDoc && (
        <ErrorBoundary>
          <Suspense fallback={<LoadingFallback />}>
            <DocumentShare docId={currentDoc.id} onClose={() => setShareOpen(false)} />
          </Suspense>
        </ErrorBoundary>
      )}

      {clipboardOpen && (
        <ErrorBoundary>
          <Suspense fallback={<LoadingFallback />}>
            <ClipboardHistory
              onClose={() => setClipboardOpen(false)}
              onInsert={(text) => editorRef.current?.insertContent(text)}
            />
          </Suspense>
        </ErrorBoundary>
      )}

      {quickShortcutsOpen && (
        <ErrorBoundary>
          <Suspense fallback={<LoadingFallback />}>
            <QuickShortcuts onClose={() => setQuickShortcutsOpen(false)} />
          </Suspense>
        </ErrorBoundary>
      )}

      {isMobile && !focusMode && (
        <Suspense fallback={null}>
          <MobileToolbar
            onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
            onToggleAI={() => setAiPanelOpen(!aiPanelOpen)}
            onToggleTheme={handleThemeToggle}
            onSave={handleSave}
            onSearch={() => setSearchOpen(true)}
            onUndo={() => editorRef.current?.getEditor()?.chain().focus().undo().run()}
            onRedo={() => editorRef.current?.getEditor()?.chain().focus().redo().run()}
          />
        </Suspense>
      )}

      <Suspense fallback={null}>
        <CommandPalette
          open={commandPaletteOpen}
          onClose={() => setCommandPaletteOpen(false)}
          commands={commands}
        />
      </Suspense>
    </div>
    </ToastProvider>
  )
}

export default App
