import { useState, useCallback, useRef, useEffect, lazy, Suspense } from 'react'
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
import { exportToMarkdown, exportToHTML, exportToPDF, exportToText, exportToDOCX, exportToEPUB } from './utils/export'
import { t } from './i18n'
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

import { ErrorBoundary } from './components/ErrorBoundary/ErrorBoundary'

import type { EditorRef } from './components/Editor/Editor'

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
  })

  const handleAiInsert = useCallback((text: string) => {
    editorRef.current?.insertContent(text)
  }, [])

  const LoadingFallback = () => (
    <div className="flex-1 flex items-center justify-center text-editor-muted">
      <div className="text-center">
        <p className="text-lg mb-2">⏳ {t('app.loading')}</p>
      </div>
    </div>
  )

  return (
    <div className={`h-full w-full flex flex-col bg-editor-bg ${focusMode ? 'focus-mode' : ''} ${typewriterMode ? 'typewriter-mode' : ''}`}>
      {!focusMode && (
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
          {currentDoc && (
            <>
              <div className="relative">
                <button
                  className="text-editor-muted hover:text-editor-text ml-3 text-sm"
                  onClick={() => setExportMenuOpen(!exportMenuOpen)}
                  title={t('menu.export')}
                >
                  📥
                </button>
                {exportMenuOpen && (
                  <div className="absolute top-full right-0 mt-1 bg-editor-surface border border-editor-border rounded shadow-lg z-50 min-w-[140px]">
                    <button
                      className="w-full text-left px-3 py-2 text-xs text-editor-text hover:bg-editor-bg"
                      onClick={() => {
                        if (currentDoc) {
                          exportToMarkdown(currentDoc.title, currentDoc.content)
                        }
                        setExportMenuOpen(false)
                      }}
                    >
                      📝 {t('export.markdown')}
                    </button>
                    <button
                      className="w-full text-left px-3 py-2 text-xs text-editor-text hover:bg-editor-bg"
                      onClick={() => {
                        if (currentDoc) {
                          exportToText(currentDoc.title, currentDoc.content)
                        }
                        setExportMenuOpen(false)
                      }}
                    >
                      📄 纯文本 (.txt)
                    </button>
                    <button
                      className="w-full text-left px-3 py-2 text-xs text-editor-text hover:bg-editor-bg"
                      onClick={() => {
                        if (currentDoc) {
                          exportToDOCX(currentDoc.title, currentDoc.content)
                        }
                        setExportMenuOpen(false)
                      }}
                    >
                      📋 Word (.docx)
                    </button>
                    <button
                      className="w-full text-left px-3 py-2 text-xs text-editor-text hover:bg-editor-bg"
                      onClick={() => {
                        if (currentDoc) {
                          exportToHTML(currentDoc.title, currentDoc.content)
                        }
                        setExportMenuOpen(false)
                      }}
                    >
                      🌐 {t('export.html')}
                    </button>
                    <button
                      className="w-full text-left px-3 py-2 text-xs text-editor-text hover:bg-editor-bg"
                      onClick={() => {
                        if (currentDoc) {
                          exportToEPUB(currentDoc.title, currentDoc.content)
                        }
                        setExportMenuOpen(false)
                      }}
                    >
                      📚 电子书 (.epub)
                    </button>
                    <div className="border-t border-editor-border" />
                    <button
                      className="w-full text-left px-3 py-2 text-xs text-editor-text hover:bg-editor-bg"
                      onClick={() => {
                        if (currentDoc) {
                          exportToPDF(currentDoc.title, currentDoc.content)
                        }
                        setExportMenuOpen(false)
                      }}
                    >
                      📄 {t('export.pdf')}
                    </button>
                  </div>
                )}
              </div>
              <button
                className="text-editor-muted hover:text-editor-text ml-3 text-sm"
                onClick={() => setVersionHistoryOpen(true)}
                title={t('version.title')}
              >
                🕐
              </button>
            </>
          )}
          <button
            className="text-editor-muted hover:text-editor-text ml-3 text-sm"
            onClick={() => setSearchOpen(true)}
            title={t('menu.search')}
            aria-label={t('menu.search')}
          >
            🔍
          </button>
          <button
            className="text-editor-muted hover:text-editor-text ml-3 text-sm"
            onClick={toggleTheme}
            title={t('menu.toggleTheme')}
            aria-label={t('menu.toggleTheme')}
          >
            {theme === 'dark' ? '☀️' : '🌙'}
          </button>
          <LanguageSwitcher />
          <button
            className={`text-editor-muted hover:text-editor-text ml-3 text-sm ${focusMode ? 'text-editor-accent' : ''}`}
            onClick={toggleFocusMode}
            title="专注模式 (Ctrl+Shift+F)"
            aria-label="专注模式"
            aria-pressed={focusMode}
          >
            🎯
          </button>
          <button
            className={`text-editor-muted hover:text-editor-text ml-3 text-sm ${typewriterMode ? 'text-editor-accent' : ''}`}
            onClick={toggleTypewriterMode}
            title="打字机模式 (Ctrl+Shift+T)"
            aria-label="打字机模式"
            aria-pressed={typewriterMode}
          >
            ⌨️
          </button>
          <button
            className="text-editor-muted hover:text-editor-text ml-3 text-sm"
            onClick={toggleFullscreen}
            title="全屏 (F11)"
            aria-label="全屏模式"
            aria-expanded={fullscreen}
          >
            ⛶
          </button>
          <button
            className="text-editor-muted hover:text-editor-text ml-3 text-sm"
            onClick={() => setWritingStatsOpen(true)}
            title="写作统计 (Ctrl+Shift+P)"
            aria-label="写作统计"
          >
            📈
          </button>
          <button
            className="text-editor-muted hover:text-editor-text ml-3 text-sm"
            onClick={() => setShortcutsHelpOpen(true)}
            title="快捷键帮助 (F1)"
            aria-label="快捷键帮助"
          >
            ❓
          </button>
          <button
            className="text-editor-muted hover:text-editor-text ml-3 text-sm"
            onClick={() => setAiPanelOpen(!aiPanelOpen)}
            title={t('menu.toggleAIPanel')}
            aria-label={t('menu.toggleAIPanel')}
            aria-expanded={aiPanelOpen}
          >
            🤖
          </button>
          <button
            className="text-editor-muted hover:text-editor-text ml-3 text-sm"
            onClick={() => setWritingModesOpen(true)}
            title="写作模式"
            aria-label="写作模式"
          >
            ✍️
          </button>
          <button
            className="text-editor-muted hover:text-editor-text ml-3 text-sm"
            onClick={() => setPluginMarketOpen(true)}
            title="插件市场"
            aria-label="插件市场"
          >
            🧩
          </button>
          <button
            className="text-editor-muted hover:text-editor-text ml-3 text-sm"
            onClick={() => setWritingChartOpen(true)}
            title="写作数据"
            aria-label="写作数据可视化"
          >
            📊
          </button>
          <button
            className="text-editor-muted hover:text-editor-text ml-3 text-sm"
            onClick={() => setTemplatesOpen(true)}
            title="文档模板"
            aria-label="文档模板"
          >
            📝
          </button>
          <button
            className="text-editor-muted hover:text-editor-text ml-3 text-sm"
            onClick={() => setReminderOpen(true)}
            title="写作提醒"
            aria-label="写作提醒"
          >
            🔔
          </button>
          <button
            className="text-editor-muted hover:text-editor-text ml-3 text-sm"
            onClick={() => setShareOpen(true)}
            title="分享"
            aria-label="分享文档"
          >
            📤
          </button>
          <button
            className="text-editor-muted hover:text-editor-text ml-3 text-sm"
            onClick={() => setClipboardOpen(true)}
            title="剪贴板历史"
            aria-label="剪贴板历史"
          >
            📋
          </button>
          <button
            className="text-editor-muted hover:text-editor-text ml-3 text-sm"
            onClick={() => setQuickShortcutsOpen(true)}
            title="快捷键速查"
            aria-label="快捷键速查"
          >
            ⌨️
          </button>
          <button
            className="text-editor-muted hover:text-editor-text ml-3 text-sm"
            onClick={() => setSettingsOpen(true)}
            title="设置"
            aria-label="设置"
          >
            ⚙️
          </button>
        </header>
      )}

      <TabBar onTabSelect={handleTabSelect} />

      <div className="flex-1 flex overflow-hidden">
        {!focusMode && (
          <ErrorBoundary>
            <Suspense fallback={<LoadingFallback />}>
              <aside
                className={`bg-editor-sidebar border-r border-editor-border flex flex-col transition-all duration-200 ${
                  sidebarOpen ? 'w-60' : 'w-0 overflow-hidden'
                }`}
                role="complementary"
                aria-label="侧边栏"
              >
                <div className="border-b border-editor-border">
                  <div className="flex items-center justify-between px-3 py-2">
                    <span className="text-xs font-semibold text-editor-muted uppercase tracking-wider">文档大纲</span>
                    <button
                      className="text-xs text-editor-muted hover:text-editor-text"
                      onClick={() => setOutlinePanelOpen(true)}
                      title="展开大纲面板"
                    >
                      ⛶
                    </button>
                  </div>
                  <DocumentOutline
                    editor={editorRef.current?.getEditor() || null}
                    onNavigate={(_pos: number) => {}}
                  />
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
              ⏳ 保存中...
            </span>
          )}
          {lastSaved && !isSaving && (
            <span className="ml-4 text-editor-muted" aria-live="polite">
              上次保存: {new Date(lastSaved).toLocaleTimeString()}
            </span>
          )}
          <div className="ml-auto flex items-center gap-2">
            <button
              className="hover:text-editor-text"
              onClick={() => setFindReplaceOpen(true)}
              title="查找替换 (Ctrl+H)"
              aria-label="查找替换"
            >
              🔎
            </button>
            <button
              className="hover:text-editor-text"
              onClick={() => setWordCountOpen(true)}
              title="写作统计 (Ctrl+Shift+W)"
              aria-label="写作统计"
            >
              📊
            </button>
            <button
              className="hover:text-editor-text"
              onClick={() => setWordGoalOpen(true)}
              title="字数目标"
              aria-label="字数目标"
            >
              🎯
            </button>
            <button
              className="hover:text-editor-text"
              onClick={() => setOutlinePanelOpen(true)}
              title="文档大纲 (Ctrl+Shift+O)"
              aria-label="文档大纲"
            >
              📑
            </button>
            <span aria-label={`文档数量: ${useDocumentStore.getState().documents.length}`}>
              文档数: {useDocumentStore.getState().documents.length}
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
    </div>
  )
}

export default App
