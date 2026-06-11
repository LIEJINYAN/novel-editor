import { useState, useCallback, useRef, useEffect, lazy, Suspense, useMemo } from 'react'
import { useDocumentStore } from './store/documentStore'
import { useThemeStore } from './store/themeStore'
import { useUIStore } from './store/uiStore'
import { useTabStore } from './store/tabStore'
import { useWritingStatsStore } from './store/writingStatsStore'
import { useDocumentCacheStore } from './store/documentCacheStore'
import { useWordGoalStore } from './store/wordGoalStore'
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts'
import { useAutoSave } from './hooks/useAutoSave'
import { useDragAndDrop } from './hooks/useDragAndDrop'
import { t, initLocale } from './i18n'
import { ToastProvider, useToast } from './components/common/Toast'
import { setToastCallback } from './utils/toast'
import TabBar from './components/TabBar/TabBar'
import ContextMenu, { useContextMenu } from './components/ContextMenu/ContextMenu'
import { EditorSkeleton } from './components/common/Skeleton'
import AppHeader from './components/AppHeader/AppHeader'
import AppSidebar from './components/AppSidebar/AppSidebar'
import AIPanelWrapper from './components/AIPanelWrapper/AIPanelWrapper'
import AppFooter from './components/AppFooter/AppFooter'
import ModalPanels from './components/ModalPanels/ModalPanels'
import { ErrorBoundary } from './components/ErrorBoundary/ErrorBoundary'
import { useMobile } from './hooks/useMobile'
import { useMultiWindow } from './hooks/useMultiWindow'

import type { EditorRef } from './components/Editor/Editor'
import type { Command } from './components/CommandPalette/CommandPalette'

interface TiptapContent {
  content?: Array<{
    content?: Array<{ text?: string }>
  }>
}

const EditorComponent = lazy(() => import('./components/Editor/Editor'))
const FocusModeToolbar = lazy(() => import('./components/FocusMode/FocusModeToolbar'))
const FocusContextMenu = lazy(() => import('./components/FocusMode/FocusContextMenu'))
const MobileToolbar = lazy(() => import('./components/MobileToolbar/MobileToolbar'))
const CommandPalette = lazy(() => import('./components/CommandPalette/CommandPalette'))

function ToastSetup() {
  const { showToast } = useToast()

  useEffect(() => {
    setToastCallback(({ message, type, duration }) => {
      showToast(message, type, duration)
    })
  }, [showToast])

  return null
}

function App() {
  const [versionHistoryOpen, setVersionHistoryOpen] = useState(false)
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
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false)

  const { isMobile } = useMobile()
  const { openInNewWindow } = useMultiWindow()
  const { contextMenu, showContextMenu, hideContextMenu } = useContextMenu()

  const updateDoc = useDocumentStore((s) => s.updateDoc)
  const loadFromDB = useDocumentStore((s) => s.loadFromDB)
  const setCurrentDoc = useDocumentStore((s) => s.setCurrentDoc)
  const isLoaded = useDocumentStore((s) => s.isLoaded)
  const isDirty = useDocumentStore((s) => s.isDirty)
  const markDirty = useDocumentStore((s) => s.markDirty)
  const saveToDB = useDocumentStore((s) => s.saveToDB)

  const { toggleTheme } = useThemeStore()
  const { focusMode, typewriterMode, fullscreen, toggleFocusMode, toggleTypewriterMode, toggleFullscreen, sidebarOpen, setSidebarOpen, aiPanelOpen, setAiPanelOpen } = useUIStore()
  const { openTab, loadSession, saveSession } = useTabStore()
  const { startSession, endSession, updateWordCount } = useWritingStatsStore()
  const { addWordCount } = useWordGoalStore()

  const editorRef = useRef<EditorRef>(null)
  const currentDocId = useDocumentStore((s) => s.currentDocId)
  const documents = useDocumentStore((s) => s.documents)
  const currentDoc = documents.find((d) => d.id === currentDocId)
  const [editorSelection, setEditorSelection] = useState('')

  useEffect(() => {
    initLocale()
    loadFromDB()
    loadSession()
    document.documentElement.classList.toggle('dark', useThemeStore.getState().theme === 'dark')

    // Tauri: auto-update check & deep link listener
    async function setupTauri() {
      if (typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window) {
        try {
          const tauri = await import('./services/tauriService')

          // Check for updates on startup (delayed 5s)
          setTimeout(async () => {
            const result = await tauri.checkForUpdates()
            if (result.available) {
              tauri.notify('NovelEngine Editor', `新版本 ${result.version} 可用`)
            }
          }, 5000)

          // Listen for deep link (novelengine:// protocol)
          await tauri.onDeepLink(async (urls) => {
            for (const url of urls) {
              if (url.startsWith('novelengine://open/')) {
                const filePath = decodeURIComponent(url.replace('novelengine://open/', ''))
                try {
                  const content = await tauri.readFile(filePath)
                  const ext = filePath.split('.').pop()?.toLowerCase()
                  const isMarkdown = ext === 'md' || ext === 'markdown'
                  const title = filePath.split(/[\\/]/).pop()?.replace(/\.[^/.]+$/, '') || 'Deep Link Document'

                  const tiptapContent = isMarkdown
                    ? (() => {
                        const blocks: any[] = []
                        content.split('\n').forEach((line: string) => {
                          if (line.startsWith('# ')) {
                            blocks.push({ type: 'heading', attrs: { level: 1 }, content: [{ type: 'text', text: line.slice(2) }] })
                          } else if (line.startsWith('## ')) {
                            blocks.push({ type: 'heading', attrs: { level: 2 }, content: [{ type: 'text', text: line.slice(3) }] })
                          } else if (line.startsWith('### ')) {
                            blocks.push({ type: 'heading', attrs: { level: 3 }, content: [{ type: 'text', text: line.slice(4) }] })
                          } else if (line.startsWith('> ')) {
                            blocks.push({ type: 'blockquote', content: [{ type: 'paragraph', content: [{ type: 'text', text: line.slice(2) }] }] })
                          } else if (line.trim() !== '') {
                            blocks.push({ type: 'paragraph', content: [{ type: 'text', text: line }] })
                          }
                        })
                        return { type: 'doc', content: blocks.length > 0 ? blocks : [{ type: 'paragraph' }] }
                      })()
                    : {
                        type: 'doc',
                        content: content.split('\n').map((line: string) => ({
                          type: 'paragraph',
                          content: [{ type: 'text', text: line }],
                        })),
                      }

                  const docId = await useDocumentStore.getState().addDoc({
                    title,
                    type: 'chapter',
                    content: tiptapContent,
                    parentId: null,
                  })
                  useDocumentStore.getState().setCurrentDoc(docId)
                  useTabStore.getState().openTab(docId, title)
                } catch (err) {
                  console.error('Failed to open file from deep link:', err)
                }
              }
            }
          })
        } catch { /* not in Tauri */ }
      }
    }
    setupTauri()
  }, [loadFromDB, loadSession])

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
        const tiptapContent = content as TiptapContent
        const text = tiptapContent?.content?.reduce((acc: string, block) => {
          if (block.content) {
            return acc + block.content.map((c) => c.text || '').join('')
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

  const { isSaving, lastSaved } = useAutoSave({
    docId: currentDoc?.id || null,
    content: currentDoc?.content || null,
    onSave: handleSave,
  })

  const docCount = useDocumentStore((s) => s.documents.length)

  const handleTabSelect = useCallback((docId: string | null) => {
    setCurrentDoc(docId)
  }, [setCurrentDoc])

  const handleSidebarSelect = useCallback((docId: string) => {
    setCurrentDoc(docId)
    const doc = documents.find((d) => d.id === docId)
    if (doc) {
      openTab(docId, doc.title)
    }
  }, [setCurrentDoc, documents, openTab])

  useKeyboardShortcuts({
    onSave: handleSave,
    onToggleSidebar: () => setSidebarOpen(!sidebarOpen),
    onToggleAIPanel: () => setAiPanelOpen(!aiPanelOpen),
    onSearch: () => setSearchOpen(true),
    onHelp: () => setShortcutsHelpOpen(true),
    onFindReplace: () => setFindReplaceOpen(true),
    onUndo: () => editorRef.current?.getEditor()?.chain().focus().undo().run(),
    onRedo: () => editorRef.current?.getEditor()?.chain().focus().redo().run(),
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
    { id: 'toggle-sidebar', label: t('menu.toggleSidebar'), icon: '☰', category: '视图', action: () => setSidebarOpen(!sidebarOpen) },
    { id: 'toggle-ai', label: t('menu.toggleAIPanel'), icon: '🤖', category: '视图', shortcut: 'Ctrl+Shift+A', action: () => setAiPanelOpen(!aiPanelOpen) },
    { id: 'toggle-theme', label: t('menu.toggleTheme'), icon: useThemeStore.getState().theme === 'dark' ? '☀️' : '🌙', category: '视图', action: toggleTheme },
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
  ], [handleSave, sidebarOpen, aiPanelOpen, toggleTheme, toggleFocusMode, toggleTypewriterMode, toggleFullscreen, setSidebarOpen, setAiPanelOpen])

  const LoadingFallback = () => (
    <div className="flex-1 flex items-center justify-center text-editor-muted">
      <div className="text-center animate-pulse">
        <div className="w-12 h-12 mx-auto mb-4 bg-editor-surface rounded-full" />
        <p className="text-sm text-editor-muted">{t('app.loading')}</p>
      </div>
    </div>
  )

  const handleFileDrop = useCallback(async (files: Array<{ name: string; content: string; type: string }>) => {
    for (const file of files) {
      const ext = file.name.split('.').pop()?.toLowerCase()
      const title = file.name.replace(/\.[^/.]+$/, '')
      const { importFile } = await import('./utils/importFile')

      if (ext === 'json') {
        try {
          const data = JSON.parse(file.content)
          if (data.content && data.content.type === 'doc') {
            useDocumentStore.getState().addDoc({
              title: data.title || title,
              type: 'chapter',
              content: data.content,
              parentId: null,
            })
            continue
          }
        } catch {
          // not valid JSON, treat as plain text
        }
      }

      const blob = new Blob([file.content], { type: 'text/plain' })
      const fakeFile = new File([blob], file.name, { type: file.type })
      const doc = await importFile(fakeFile)
      if (doc) {
        useDocumentStore.getState().addDoc(doc)
      }
    }
  }, [])

  const { isDragging } = useDragAndDrop({ onImport: handleFileDrop })

  return (
    <ToastProvider>
    <ToastSetup />
    <div
      className={`h-full w-full flex flex-col bg-editor-bg ${focusMode ? 'focus-mode' : ''} ${typewriterMode ? 'typewriter-mode' : ''} ${isDragging ? 'relative' : ''}`}
    >
      {isDragging && (
        <div className="absolute inset-0 z-50 bg-editor-accent/10 border-2 border-dashed border-editor-accent flex items-center justify-center pointer-events-none">
          <div className="text-center">
            <p className="text-lg font-semibold text-editor-accent">📂 拖放文件导入</p>
            <p className="text-sm text-editor-muted mt-1">支持 .txt, .md, .json 格式</p>
          </div>
        </div>
      )}

      {contextMenu.visible && (
        <ContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          items={contextMenu.items}
          onClose={hideContextMenu}
        />
      )}

      {!focusMode && !isMobile && (
        <AppHeader
          currentDoc={currentDoc}
          isDirty={isDirty}
          onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
          onToggleTheme={handleThemeToggle}
          onSearch={() => setSearchOpen(true)}
          onVersionHistory={() => setVersionHistoryOpen(true)}
          onWritingStats={() => setWritingStatsOpen(true)}
          onShortcutsHelp={() => setShortcutsHelpOpen(true)}
          onWritingModes={() => setWritingModesOpen(true)}
          onPluginMarket={() => setPluginMarketOpen(true)}
          onWritingChart={() => setWritingChartOpen(true)}
          onTemplates={() => setTemplatesOpen(true)}
          onReminder={() => setReminderOpen(true)}
          onShare={() => setShareOpen(true)}
          onClipboard={() => setClipboardOpen(true)}
          onQuickShortcuts={() => setQuickShortcutsOpen(true)}
          onSettings={() => setSettingsOpen(true)}
        />
      )}

      <TabBar onTabSelect={handleTabSelect} />

      <div className="flex-1 flex overflow-hidden">
        {!focusMode && (
          <AppSidebar
            editor={editorRef.current?.getEditor() || null}
            onOutlinePanelOpen={() => setOutlinePanelOpen(true)}
          />
        )}

        <main className="flex-1 flex flex-col min-w-0" role="main" aria-label="编辑器">
          {!isLoaded ? (
            <EditorSkeleton />
          ) : currentDoc ? (
            <ErrorBoundary>
              <Suspense fallback={<EditorSkeleton />}>
                <EditorComponent
                  ref={editorRef}
                  key={currentDoc.id}
                  docId={currentDoc.id}
                  initialContent={currentDoc.content}
                  onChange={handleContentChange}
                  onSelectionChange={setEditorSelection}
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
          <AIPanelWrapper
            editorContent={currentDoc ? JSON.stringify(currentDoc.content) : ''}
            editorTitle={currentDoc?.title || ''}
            editorDocId={currentDoc?.id || ''}
            selection={editorSelection}
            onInsertContent={handleAiInsert}
            onReplaceContent={(text) => {
              const editor = editorRef.current?.getEditor()
              if (editor) {
                editor.chain().focus().deleteSelection().insertContent(text).run()
              }
            }}
            onFormatText={(format, value) => {
              const editor = editorRef.current?.getEditor()
              if (!editor) return
              
              switch (format) {
                case 'bold':
                  editor.chain().focus().toggleBold().run()
                  break
                case 'italic':
                  editor.chain().focus().toggleItalic().run()
                  break
                case 'underline':
                  editor.chain().focus().toggleUnderline().run()
                  break
                case 'strike':
                  editor.chain().focus().toggleStrike().run()
                  break
                case 'heading1':
                  editor.chain().focus().toggleHeading({ level: 1 }).run()
                  break
                case 'heading2':
                  editor.chain().focus().toggleHeading({ level: 2 }).run()
                  break
                case 'heading3':
                  editor.chain().focus().toggleHeading({ level: 3 }).run()
                  break
                case 'bulletList':
                  editor.chain().focus().toggleBulletList().run()
                  break
                case 'orderedList':
                  editor.chain().focus().toggleOrderedList().run()
                  break
                case 'blockquote':
                  editor.chain().focus().toggleBlockquote().run()
                  break
                case 'codeBlock':
                  editor.chain().focus().toggleCodeBlock().run()
                  break
                case 'highlight':
                  editor.chain().focus().toggleHighlight().run()
                  break
                case 'clear':
                  editor.chain().focus().clearNodes().unsetAllMarks().run()
                  break
              }
            }}
            onReplaceInDocument={(find, replace, replaceAll) => {
              const editor = editorRef.current?.getEditor()
              if (!editor) return
              
              const content = editor.getText()
              const regex = new RegExp(find.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), replaceAll ? 'gi' : 'i')
              const newContent = content.replace(regex, replace)
              
              editor.commands.setContent({
                type: 'doc',
                content: [{ type: 'paragraph', content: [{ type: 'text', text: newContent }] }],
              })
            }}
            onCreateCodeBlock={(language, code) => {
              const editor = editorRef.current?.getEditor()
              if (!editor) return
              
              editor.chain().focus().setMonacoCodeBlock({ language, code }).run()
            }}
            onUndo={() => {
              const editor = editorRef.current?.getEditor()
              editor?.chain().focus().undo().run()
            }}
            onRedo={() => {
              const editor = editorRef.current?.getEditor()
              editor?.chain().focus().redo().run()
            }}
          />
        )}
      </div>

      {!focusMode && (
        <AppFooter
          isLoaded={isLoaded}
          editor={editorRef.current?.getEditor() || null}
          docCount={docCount}
          onFindReplace={() => setFindReplaceOpen(true)}
          onWordCount={() => setWordCountOpen(true)}
          onWordGoal={() => setWordGoalOpen(true)}
          onOutline={() => setOutlinePanelOpen(true)}
        />
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

      <ModalPanels
        versionHistoryOpen={versionHistoryOpen}
        setVersionHistoryOpen={setVersionHistoryOpen}
        searchOpen={searchOpen}
        setSearchOpen={setSearchOpen}
        shortcutsHelpOpen={shortcutsHelpOpen}
        setShortcutsHelpOpen={setShortcutsHelpOpen}
        findReplaceOpen={findReplaceOpen}
        setFindReplaceOpen={setFindReplaceOpen}
        wordCountOpen={wordCountOpen}
        setWordCountOpen={setWordCountOpen}
        outlinePanelOpen={outlinePanelOpen}
        setOutlinePanelOpen={setOutlinePanelOpen}
        writingStatsOpen={writingStatsOpen}
        setWritingStatsOpen={setWritingStatsOpen}
        wordGoalOpen={wordGoalOpen}
        setWordGoalOpen={setWordGoalOpen}
        settingsOpen={settingsOpen}
        setSettingsOpen={setSettingsOpen}
        writingModesOpen={writingModesOpen}
        setWritingModesOpen={setWritingModesOpen}
        pluginMarketOpen={pluginMarketOpen}
        setPluginMarketOpen={setPluginMarketOpen}
        writingChartOpen={writingChartOpen}
        setWritingChartOpen={setWritingChartOpen}
        templatesOpen={templatesOpen}
        setTemplatesOpen={setTemplatesOpen}
        reminderOpen={reminderOpen}
        setReminderOpen={setReminderOpen}
        shareOpen={shareOpen}
        setShareOpen={setShareOpen}
        clipboardOpen={clipboardOpen}
        setClipboardOpen={setClipboardOpen}
        quickShortcutsOpen={quickShortcutsOpen}
        setQuickShortcutsOpen={setQuickShortcutsOpen}
        currentDocId={currentDoc?.id}
        currentDocTitle={currentDoc?.title}
        currentDocContent={currentDoc?.content}
        editor={editorRef.current?.getEditor() || null}
        setCurrentDoc={setCurrentDoc}
        openTab={openTab}
        onClipboardInsert={(text) => editorRef.current?.insertContent(text)}
      />

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
