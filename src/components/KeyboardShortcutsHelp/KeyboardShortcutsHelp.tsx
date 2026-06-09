import { t } from '../../i18n'

interface Props {
  onClose: () => void
}

const shortcuts = [
  { key: 'Ctrl+S', labelKey: 'menu.save' },
  { key: 'Ctrl+N', labelKey: 'menu.newDoc' },
  { key: 'Ctrl+B', labelKey: 'menu.toggleSidebar' },
  { key: 'Ctrl+Shift+A', labelKey: 'menu.toggleAIPanel' },
  { key: 'Ctrl+F', labelKey: 'menu.search' },
]

export default function KeyboardShortcutsHelp({ onClose }: Props) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-editor-surface border border-editor-border rounded-lg shadow-xl w-[400px] max-h-[80vh] overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b border-editor-border">
          <h2 className="text-sm font-semibold text-editor-text">⌨️ 快捷键帮助</h2>
          <button
            className="text-editor-muted hover:text-editor-text"
            onClick={onClose}
          >
            ✕
          </button>
        </div>
        <div className="p-4">
          <div className="space-y-3">
            {shortcuts.map((s) => (
              <div key={s.key} className="flex items-center justify-between">
                <span className="text-xs text-editor-text">{t(s.labelKey)}</span>
                <kbd className="px-2 py-1 bg-editor-bg border border-editor-border rounded text-xs text-editor-muted font-mono">
                  {s.key}
                </kbd>
              </div>
            ))}
          </div>
        </div>
        <div className="px-4 py-3 border-t border-editor-border flex justify-end">
          <button
            className="px-3 py-1.5 bg-editor-accent text-white text-xs rounded hover:opacity-90"
            onClick={onClose}
          >
            关闭
          </button>
        </div>
      </div>
    </div>
  )
}
