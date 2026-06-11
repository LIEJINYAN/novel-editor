import { Suspense, lazy } from 'react'
import { ErrorBoundary } from '../ErrorBoundary/ErrorBoundary'

const VersionHistory = lazy(() => import('../VersionHistory/VersionHistory'))
const SearchPanel = lazy(() => import('../Search/SearchPanel'))
const KeyboardShortcutsHelp = lazy(() => import('../KeyboardShortcutsHelp/KeyboardShortcutsHelp'))
const FindReplace = lazy(() => import('../FindReplace/FindReplace'))
const WordCountPanel = lazy(() => import('../WordCount/WordCount'))
const DocumentOutlinePanel = lazy(() => import('../DocumentOutline/DocumentOutline').then(m => ({ default: m.DocumentOutlinePanel })))
const WritingStatsPanel = lazy(() => import('../WritingStats/WritingStatsPanel'))
const WordGoalPanel = lazy(() => import('../WordGoal/WordGoalPanel'))
const SettingsPanel = lazy(() => import('../Settings/SettingsPanel'))
const WritingModes = lazy(() => import('../WritingModes/WritingModes'))
const PluginMarket = lazy(() => import('../PluginMarket/PluginMarket'))
const WritingChart = lazy(() => import('../WritingChart/WritingChart'))
const DocumentTemplates = lazy(() => import('../DocumentTemplates/DocumentTemplates'))
const WritingReminder = lazy(() => import('../WritingReminder/WritingReminder'))
const DocumentShare = lazy(() => import('../DocumentShare/DocumentShare'))
const ClipboardHistory = lazy(() => import('../ClipboardHistory/ClipboardHistory'))
const QuickShortcuts = lazy(() => import('../KeyboardShortcutsHelp/QuickShortcuts'))

interface ModalPanelsProps {
  versionHistoryOpen: boolean
  setVersionHistoryOpen: (open: boolean) => void
  searchOpen: boolean
  setSearchOpen: (open: boolean) => void
  shortcutsHelpOpen: boolean
  setShortcutsHelpOpen: (open: boolean) => void
  findReplaceOpen: boolean
  setFindReplaceOpen: (open: boolean) => void
  wordCountOpen: boolean
  setWordCountOpen: (open: boolean) => void
  outlinePanelOpen: boolean
  setOutlinePanelOpen: (open: boolean) => void
  writingStatsOpen: boolean
  setWritingStatsOpen: (open: boolean) => void
  wordGoalOpen: boolean
  setWordGoalOpen: (open: boolean) => void
  settingsOpen: boolean
  setSettingsOpen: (open: boolean) => void
  writingModesOpen: boolean
  setWritingModesOpen: (open: boolean) => void
  pluginMarketOpen: boolean
  setPluginMarketOpen: (open: boolean) => void
  writingChartOpen: boolean
  setWritingChartOpen: (open: boolean) => void
  templatesOpen: boolean
  setTemplatesOpen: (open: boolean) => void
  reminderOpen: boolean
  setReminderOpen: (open: boolean) => void
  shareOpen: boolean
  setShareOpen: (open: boolean) => void
  clipboardOpen: boolean
  setClipboardOpen: (open: boolean) => void
  quickShortcutsOpen: boolean
  setQuickShortcutsOpen: (open: boolean) => void
  currentDocId: string | undefined
  currentDocTitle: string | undefined
  currentDocContent: object | undefined
  editor: any
  setCurrentDoc: (id: string) => void
  openTab: (id: string, title: string) => void
  onClipboardInsert: (text: string) => void
}

export default function ModalPanels({
  versionHistoryOpen,
  setVersionHistoryOpen,
  searchOpen,
  setSearchOpen,
  shortcutsHelpOpen,
  setShortcutsHelpOpen,
  findReplaceOpen,
  setFindReplaceOpen,
  wordCountOpen,
  setWordCountOpen,
  outlinePanelOpen,
  setOutlinePanelOpen,
  writingStatsOpen,
  setWritingStatsOpen,
  wordGoalOpen,
  setWordGoalOpen,
  settingsOpen,
  setSettingsOpen,
  writingModesOpen,
  setWritingModesOpen,
  pluginMarketOpen,
  setPluginMarketOpen,
  writingChartOpen,
  setWritingChartOpen,
  templatesOpen,
  setTemplatesOpen,
  reminderOpen,
  setReminderOpen,
  shareOpen,
  setShareOpen,
  clipboardOpen,
  setClipboardOpen,
  quickShortcutsOpen,
  setQuickShortcutsOpen,
  currentDocId,
  currentDocTitle,
  currentDocContent,
  editor,
  setCurrentDoc,
  openTab,
  onClipboardInsert,
}: ModalPanelsProps) {
  const LoadingFallback = () => (
    <div className="flex-1 flex items-center justify-center text-editor-muted">
      <div className="text-center animate-pulse">
        <div className="w-12 h-12 mx-auto mb-4 bg-editor-surface rounded-full" />
      </div>
    </div>
  )

  return (
    <>
      {versionHistoryOpen && currentDocId && (
        <ErrorBoundary>
          <Suspense fallback={<LoadingFallback />}>
            <VersionHistory
              docId={currentDocId}
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
              editor={editor}
              onClose={() => setFindReplaceOpen(false)}
            />
          </Suspense>
        </ErrorBoundary>
      )}

      {wordCountOpen && (
        <ErrorBoundary>
          <Suspense fallback={<LoadingFallback />}>
            <WordCountPanel
              editor={editor}
              onClose={() => setWordCountOpen(false)}
            />
          </Suspense>
        </ErrorBoundary>
      )}

      {outlinePanelOpen && (
        <ErrorBoundary>
          <Suspense fallback={<LoadingFallback />}>
            <DocumentOutlinePanel
              editor={editor}
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
              onSelect={async (title, content) => {
                const { useDocumentStore } = await import('../../store/documentStore')
                const id = await useDocumentStore.getState().addDoc({ title, content, type: 'chapter', parentId: null })
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

      {shareOpen && currentDocId && (
        <ErrorBoundary>
          <Suspense fallback={<LoadingFallback />}>
            <DocumentShare docId={currentDocId} onClose={() => setShareOpen(false)} />
          </Suspense>
        </ErrorBoundary>
      )}

      {clipboardOpen && (
        <ErrorBoundary>
          <Suspense fallback={<LoadingFallback />}>
            <ClipboardHistory
              onClose={() => setClipboardOpen(false)}
              onInsert={onClipboardInsert}
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
    </>
  )
}
