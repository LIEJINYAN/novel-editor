import { useState, lazy, Suspense } from 'react'
import { useUIStore } from '../../store/uiStore'
import { useMobile } from '../../hooks/useMobile'
import { ErrorBoundary } from '../ErrorBoundary/ErrorBoundary'

const AIPanel = lazy(() => import('../AIPanel/AIPanel'))
const AgentPanel = lazy(() => import('../AgentPanel/AgentPanel'))

interface AIPanelWrapperProps {
  editorContent: string
  editorTitle: string
  editorDocId: string
  selection: string
  onInsertContent: (text: string) => void
  onReplaceContent: (text: string) => void
  onFormatText?: (format: string, value?: string) => void
  onFindInDocument?: (query: string, useRegex?: boolean, caseSensitive?: boolean) => void
  onReplaceInDocument?: (find: string, replace: string, replaceAll?: boolean) => void
  onCreateCodeBlock?: (language: string, code?: string) => void
  onUndo?: () => void
  onRedo?: () => void
}

export default function AIPanelWrapper({
  editorContent,
  editorTitle,
  editorDocId,
  selection,
  onInsertContent,
  onReplaceContent,
  onFormatText,
  onFindInDocument,
  onReplaceInDocument,
  onCreateCodeBlock,
  onUndo,
  onRedo,
}: AIPanelWrapperProps) {
  const { aiPanelOpen } = useUIStore()
  const { isMobile, isTablet } = useMobile()
  const [agentMode, setAgentMode] = useState(false)

  const LoadingFallback = () => (
    <div className="flex-1 flex items-center justify-center text-editor-muted">
      <div className="text-center animate-pulse">
        <div className="w-12 h-12 mx-auto mb-4 bg-editor-surface rounded-full" />
      </div>
    </div>
  )

  const panelWidth = isMobile ? 'w-full' : isTablet ? 'w-64' : 'w-72'

  return (
    <ErrorBoundary>
      <Suspense fallback={<LoadingFallback />}>
        <aside
          className={`bg-editor-sidebar border-l border-editor-border flex flex-col transition-all duration-200 ${
            aiPanelOpen ? panelWidth : 'w-0 overflow-hidden'
          } ${isMobile ? 'absolute inset-y-0 right-0 z-40' : ''}`}
          role="complementary"
          aria-label="AI面板"
        >
          <div className="flex items-center gap-1 px-2 pt-2 pb-1 border-b border-editor-border" role="tablist" aria-label="AI面板标签">
            <button
              onClick={() => setAgentMode(false)}
              className={`flex-1 px-2 py-1 text-[10px] rounded transition-colors ${!agentMode ? 'bg-editor-accent text-editor-bg' : 'text-editor-muted hover:text-editor-text'}`}
              aria-selected={!agentMode}
              role="tab"
              aria-controls="ai-panel-content"
              id="ai-tab"
            >
              AI助手
            </button>
            <button
              onClick={() => setAgentMode(true)}
              className={`flex-1 px-2 py-1 text-[10px] rounded transition-colors ${agentMode ? 'bg-editor-accent text-editor-bg' : 'text-editor-muted hover:text-editor-text'}`}
              aria-selected={agentMode}
              role="tab"
              aria-controls="agent-panel-content"
              id="agent-tab"
            >
              Agent
            </button>
          </div>
          <div role="tabpanel" id={agentMode ? 'agent-panel-content' : 'ai-panel-content'} aria-labelledby={agentMode ? 'agent-tab' : 'ai-tab'}>
            {agentMode ? (
              <AgentPanel
                editorContent={editorContent}
                editorTitle={editorTitle}
                editorDocId={editorDocId}
                selection={selection}
                onInsertContent={onInsertContent}
                onReplaceContent={onReplaceContent}
                onFormatText={onFormatText}
                onFindInDocument={onFindInDocument}
                onReplaceInDocument={onReplaceInDocument}
                onCreateCodeBlock={onCreateCodeBlock}
                onUndo={onUndo}
                onRedo={onRedo}
              />
            ) : (
              <AIPanel
                editorContent={editorContent}
                onInsertContent={onInsertContent}
              />
            )}
          </div>
        </aside>
      </Suspense>
    </ErrorBoundary>
  )
}
