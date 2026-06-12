import { create } from 'zustand'

export interface ShortcutDef {
  id: string
  label: string
  key: string
  ctrl?: boolean
  shift?: boolean
  alt?: boolean
  code: string
}

const STORAGE_KEY = 'novel-engine-shortcuts'

const DEFAULT_SHORTCUTS: ShortcutDef[] = [
  { id: 'save', label: '保存文档', key: 's', ctrl: true, code: 'Ctrl+S' },
  { id: 'undo', label: '撤销', key: 'z', ctrl: true, code: 'Ctrl+Z' },
  { id: 'redo', label: '重做', key: 'y', ctrl: true, code: 'Ctrl+Y' },
  { id: 'bold', label: '加粗', key: 'b', ctrl: true, code: 'Ctrl+B' },
  { id: 'italic', label: '斜体', key: 'i', ctrl: true, code: 'Ctrl+I' },
  { id: 'underline', label: '下划线', key: 'u', ctrl: true, code: 'Ctrl+U' },
  { id: 'strikethrough', label: '删除线', key: 'x', ctrl: true, shift: true, code: 'Ctrl+Shift+X' },
  { id: 'highlight', label: '高亮', key: 'h', ctrl: true, shift: true, code: 'Ctrl+Shift+H' },
  { id: 'code', label: '行内代码', key: 'e', ctrl: true, code: 'Ctrl+E' },
  { id: 'link', label: '插入链接', key: 'k', ctrl: true, code: 'Ctrl+K' },
  { id: 'blockquote', label: '引用块', key: 'q', ctrl: true, shift: true, code: 'Ctrl+Shift+Q' },
  { id: 'bulletList', label: '无序列表', key: 'l', ctrl: true, shift: true, code: 'Ctrl+Shift+L' },
  { id: 'orderedList', label: '有序列表', key: 'o', ctrl: true, shift: true, code: 'Ctrl+Shift+O' },
  { id: 'heading1', label: '一级标题', key: '1', ctrl: true, shift: true, code: 'Ctrl+Shift+1' },
  { id: 'heading2', label: '二级标题', key: '2', ctrl: true, shift: true, code: 'Ctrl+Shift+2' },
  { id: 'heading3', label: '三级标题', key: '3', ctrl: true, shift: true, code: 'Ctrl+Shift+3' },
  { id: 'horizontalRule', label: '分割线', key: '-', ctrl: true, shift: true, code: 'Ctrl+Shift+-' },
  { id: 'findReplace', label: '查找替换', key: 'h', ctrl: true, code: 'Ctrl+H' },
  { id: 'search', label: '搜索', key: 'f', ctrl: true, code: 'Ctrl+F' },
  { id: 'focusMode', label: '专注模式', key: 'F', ctrl: true, shift: true, code: 'Ctrl+Shift+F' },
  { id: 'typewriter', label: '打字机模式', key: 'T', ctrl: true, shift: true, code: 'Ctrl+Shift+T' },
  { id: 'outline', label: '文档大纲', key: 'O', ctrl: true, shift: true, code: 'Ctrl+Shift+O' },
  { id: 'wordCount', label: '字数统计', key: 'W', ctrl: true, shift: true, code: 'Ctrl+Shift+W' },
  { id: 'stats', label: '写作统计', key: 'P', ctrl: true, shift: true, code: 'Ctrl+Shift+P' },
  { id: 'help', label: '快捷键帮助', key: 'F1', code: 'F1' },
  { id: 'fullscreen', label: '全屏', key: 'F11', code: 'F11' },
  { id: 'exitFocus', label: '退出专注模式', key: 'Escape', code: 'ESC' },
  { id: 'toggleAIPanel', label: '切换AI面板', key: 'A', ctrl: true, shift: true, code: 'Ctrl+Shift+A' },
  { id: 'tab1', label: '切换标签1', key: '1', alt: true, code: 'Alt+1' },
  { id: 'tab2', label: '切换标签2', key: '2', alt: true, code: 'Alt+2' },
  { id: 'tab3', label: '切换标签3', key: '3', alt: true, code: 'Alt+3' },
  { id: 'tab4', label: '切换标签4', key: '4', alt: true, code: 'Alt+4' },
  { id: 'tab5', label: '切换标签5', key: '5', alt: true, code: 'Alt+5' },
  { id: 'tab6', label: '切换标签6', key: '6', alt: true, code: 'Alt+6' },
  { id: 'tab7', label: '切换标签7', key: '7', alt: true, code: 'Alt+7' },
  { id: 'tab8', label: '切换标签8', key: '8', alt: true, code: 'Alt+8' },
  { id: 'tab9', label: '切换标签9', key: '9', alt: true, code: 'Alt+9' },
  { id: 'nextTab', label: '下一个标签', key: 'Tab', ctrl: true, code: 'Ctrl+Tab' },
  { id: 'prevTab', label: '上一个标签', key: 'Tab', ctrl: true, shift: true, code: 'Ctrl+Shift+Tab' },
  { id: 'closeTab', label: '关闭标签', key: 'w', ctrl: true, code: 'Ctrl+W' },
  { id: 'newDocument', label: '新建文档', key: 'n', ctrl: true, code: 'Ctrl+N' },
  { id: 'commandPalette', label: '命令面板', key: 'k', ctrl: true, shift: true, code: 'Ctrl+Shift+K' },
  { id: 'toggleSidebar', label: '切换侧边栏', key: '\\', ctrl: true, code: 'Ctrl+\\' },
  { id: 'toggleTheme', label: '切换主题', key: 'd', ctrl: true, shift: true, code: 'Ctrl+Shift+D' },
]

function loadShortcuts(): ShortcutDef[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return DEFAULT_SHORTCUTS
    const saved = JSON.parse(raw) as ShortcutDef[]
    const merged = DEFAULT_SHORTCUTS.map((def) => {
      const custom = saved.find((s) => s.id === def.id)
      return custom ? { ...def, key: custom.key, ctrl: custom.ctrl, shift: custom.shift, alt: custom.alt, code: custom.code } : def
    })
    return merged
  } catch {
    return DEFAULT_SHORTCUTS
  }
}

function saveShortcutsToStorage(shortcuts: ShortcutDef[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(shortcuts))
  } catch {}
}

function buildCode(s: ShortcutDef): string {
  const parts: string[] = []
  if (s.ctrl) parts.push('Ctrl')
  if (s.shift) parts.push('Shift')
  if (s.alt) parts.push('Alt')
  const keyName = s.key.length === 1 ? s.key.toUpperCase() : s.key
  parts.push(keyName)
  return parts.join('+')
}

interface ShortcutStore {
  shortcuts: ShortcutDef[]
  editingId: string | null

  setEditing: (id: string | null) => void
  updateShortcut: (id: string, updates: Partial<Pick<ShortcutDef, 'key' | 'ctrl' | 'shift' | 'alt'>>) => void
  resetShortcut: (id: string) => void
  resetAll: () => void
  getShortcut: (id: string) => ShortcutDef | undefined
  matchShortcut: (e: KeyboardEvent) => ShortcutDef | undefined
  findConflicts: (id: string, key: string, ctrl?: boolean, shift?: boolean, alt?: boolean) => ShortcutDef[]
}

export const useShortcutStore = create<ShortcutStore>((set, get) => ({
  shortcuts: loadShortcuts(),
  editingId: null,

  setEditing: (id) => set({ editingId: id }),

  updateShortcut: (id, updates) => {
    set((state) => {
      const shortcuts = state.shortcuts.map((s) => {
        if (s.id !== id) return s
        const updated = { ...s, ...updates }
        updated.code = buildCode(updated)
        return updated
      })
      saveShortcutsToStorage(shortcuts)
      return { shortcuts }
    })
  },

  resetShortcut: (id) => {
    set((state) => {
      const def = DEFAULT_SHORTCUTS.find((s) => s.id === id)
      if (!def) return state
      const shortcuts = state.shortcuts.map((s) => (s.id === id ? { ...def } : s))
      saveShortcutsToStorage(shortcuts)
      return { shortcuts }
    })
  },

  resetAll: () => {
    const shortcuts = DEFAULT_SHORTCUTS.map((s) => ({ ...s }))
    saveShortcutsToStorage(shortcuts)
    set({ shortcuts })
  },

  getShortcut: (id) => get().shortcuts.find((s) => s.id === id),

  matchShortcut: (e) => {
    const isCtrl = e.ctrlKey || e.metaKey
    const key = e.key.length === 1 ? e.key.toUpperCase() : e.key
    return get().shortcuts.find((s) => {
      const keyMatch = s.key.length === 1 ? s.key.toUpperCase() === key : s.key === e.key
      return keyMatch && !!s.ctrl === isCtrl && !!s.shift === e.shiftKey && !!s.alt === e.altKey
    })
  },

  findConflicts: (id, key, ctrl, shift, alt) => {
    const shortcuts = get().shortcuts
    return shortcuts.filter((s) => {
      if (s.id === id) return false
      const keyMatch = s.key.length === 1 ? s.key.toUpperCase() === key.toUpperCase() : s.key === key
      return keyMatch && !!s.ctrl === !!ctrl && !!s.shift === !!shift && !!s.alt === !!alt
    })
  },
}))

export { DEFAULT_SHORTCUTS }
