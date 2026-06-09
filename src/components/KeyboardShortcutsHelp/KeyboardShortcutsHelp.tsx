import { useShortcutStore, DEFAULT_SHORTCUTS } from '../../store/shortcutStore'
import Modal from '../common/Modal'

interface Props {
  onClose: () => void
}

const CATEGORIES = [
  { name: '文件操作', ids: ['save', 'undo', 'redo'] },
  { name: '格式化', ids: ['bold', 'italic', 'underline'] },
  { name: '搜索', ids: ['search', 'findReplace'] },
  { name: '视图', ids: ['focusMode', 'typewriter', 'fullscreen', 'outline', 'wordCount', 'stats'] },
  { name: '标签切换', ids: ['tab1', 'tab2', 'tab3', 'tab4', 'tab5', 'tab6', 'tab7', 'tab8', 'tab9', 'nextTab', 'prevTab'] },
  { name: '其他', ids: ['help', 'exitFocus'] },
]

export default function KeyboardShortcutsHelp({ onClose }: Props) {
  const shortcuts = useShortcutStore((s) => s.shortcuts)

  const getShortcut = (id: string) => shortcuts.find((s) => s.id === id)

  return (
    <Modal open={true} onClose={onClose} title="快捷键帮助" size="sm">
      <div className="p-4 max-h-[60vh] overflow-y-auto">
        <div className="space-y-4">
          {CATEGORIES.map((cat) => (
            <div key={cat.name}>
              <h3 className="text-xs font-semibold text-editor-muted uppercase tracking-wider mb-2">{cat.name}</h3>
              <div className="space-y-1">
                {cat.ids.map((id) => {
                  const s = getShortcut(id)
                  if (!s) return null
                  return (
                    <div key={id} className="flex items-center justify-between py-1">
                      <span className="text-xs text-editor-text">{s.label}</span>
                      <kbd className="px-2 py-0.5 bg-editor-bg border border-editor-border rounded text-[10px] text-editor-muted font-mono">
                        {s.code}
                      </kbd>
                    </div>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
      <div className="px-4 py-3 border-t border-editor-border flex justify-end">
        <button className="px-3 py-1.5 bg-editor-accent text-white text-xs rounded hover:opacity-90" onClick={onClose}>
          关闭
        </button>
      </div>
    </Modal>
  )
}
