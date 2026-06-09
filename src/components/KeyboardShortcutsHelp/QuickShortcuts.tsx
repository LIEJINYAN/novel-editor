import { useShortcutStore } from '../../store/shortcutStore'
import Modal from '../common/Modal'

interface Props {
  onClose: () => void
}

const SHORTCUT_GROUPS = [
  { title: '文件操作', shortcuts: ['save'] },
  { title: '编辑操作', shortcuts: ['undo', 'redo', 'bold', 'italic', 'underline'] },
  { title: '搜索', shortcuts: ['search', 'findReplace'] },
  { title: '视图', shortcuts: ['focusMode', 'typewriter', 'outline', 'wordCount', 'stats', 'fullscreen'] },
  { title: '标签页', shortcuts: ['tab1', 'tab2', 'tab3', 'tab4', 'tab5', 'tab6', 'tab7', 'tab8', 'tab9', 'nextTab', 'prevTab'] },
  { title: '其他', shortcuts: ['help', 'exitFocus'] },
]

export default function QuickShortcuts({ onClose }: Props) {
  const shortcuts = useShortcutStore((s) => s.shortcuts)

  return (
    <Modal open={true} onClose={onClose} title="⌨️ 快捷键速查" size="md">
      <div className="overflow-y-auto max-h-[60vh] p-4 space-y-4">
        {SHORTCUT_GROUPS.map((group) => (
          <div key={group.title}>
            <h3 className="text-xs font-medium text-editor-muted mb-2">{group.title}</h3>
            <div className="space-y-1">
              {group.shortcuts.map((id) => {
                const shortcut = shortcuts.find((s) => s.id === id)
                if (!shortcut) return null
                return (
                  <div key={id} className="flex items-center justify-between py-1">
                    <span className="text-xs text-editor-text">{shortcut.label}</span>
                    <kbd className="px-2 py-0.5 text-[10px] bg-editor-bg border border-editor-border rounded text-editor-muted font-mono">
                      {shortcut.code}
                    </kbd>
                  </div>
                )
              })}
            </div>
          </div>
        ))}
      </div>
    </Modal>
  )
}
