import { Suspense } from 'react'
import { useUIStore } from '../../store/uiStore'
import { t } from '../../i18n'
import { ErrorBoundary } from '../ErrorBoundary/ErrorBoundary'
import DocumentOutline from '../DocumentOutline/DocumentOutline'
import DocumentTree from '../Sidebar/DocumentTree'
import { useMobile } from '../../hooks/useMobile'

interface AppSidebarProps {
  editor: any
  onOutlinePanelOpen: () => void
}

export default function AppSidebar({ editor, onOutlinePanelOpen }: AppSidebarProps) {
  const { sidebarOpen, setSidebarOpen } = useUIStore()
  const { isMobile } = useMobile()

  const LoadingFallback = () => (
    <div className="flex-1 flex items-center justify-center text-editor-muted">
      <div className="text-center animate-pulse">
        <div className="w-12 h-12 mx-auto mb-4 bg-editor-surface rounded-full" />
        <p className="text-sm text-editor-muted">{t('app.loading')}</p>
      </div>
    </div>
  )

  return (
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
              <button className="text-xs text-editor-muted hover:text-editor-text" onClick={onOutlinePanelOpen} title="展开大纲面板">⛶</button>
            </div>
            <DocumentOutline editor={editor} onNavigate={(_pos: number) => {}} />
          </div>
          <DocumentTree />
        </aside>
      </Suspense>
    </ErrorBoundary>
  )
}
