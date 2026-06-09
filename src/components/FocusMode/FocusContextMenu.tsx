import { useState, useEffect, useRef, useCallback } from 'react'
import { t } from '../../i18n'

interface MenuItem {
  label: string
  action: () => void
  shortcut?: string
  icon?: string
  disabled?: boolean
  divider?: boolean
}

interface Props {
  editor: any
  onSave?: () => void
  onToggleWordWrap?: () => void
  onExitFocusMode?: () => void
}

export default function FocusContextMenu({ editor, onSave, onToggleWordWrap, onExitFocusMode }: Props) {
  const [isOpen, setIsOpen] = useState(false)
  const [position, setPosition] = useState({ x: 0, y: 0 })
  const menuRef = useRef<HTMLDivElement>(null)

  const handleContextMenu = useCallback((e: MouseEvent) => {
    e.preventDefault()

    const x = Math.min(e.clientX, window.innerWidth - 200)
    const y = Math.min(e.clientY, window.innerHeight - 300)

    setPosition({ x, y })
    setIsOpen(true)
  }, [])

  const closeMenu = useCallback(() => {
    setIsOpen(false)
  }, [])

  useEffect(() => {
    document.addEventListener('contextmenu', handleContextMenu)
    document.addEventListener('click', closeMenu)

    return () => {
      document.removeEventListener('contextmenu', handleContextMenu)
      document.removeEventListener('click', closeMenu)
    }
  }, [handleContextMenu, closeMenu])

  const menuItems: MenuItem[] = [
    {
      label: '加粗',
      action: () => editor?.chain().focus().toggleBold().run(),
      shortcut: 'Ctrl+B',
      icon: 'B',
    },
    {
      label: '斜体',
      action: () => editor?.chain().focus().toggleItalic().run(),
      shortcut: 'Ctrl+I',
      icon: 'I',
    },
    {
      label: '下划线',
      action: () => editor?.chain().focus().toggleUnderline().run(),
      shortcut: 'Ctrl+U',
      icon: 'U',
    },
    {
      label: '删除线',
      action: () => editor?.chain().focus().toggleStrike().run(),
      shortcut: 'Alt+Shift+5',
      icon: 'S',
    },
    { label: '', action: () => {}, divider: true },
    {
      label: '标题 1',
      action: () => editor?.chain().focus().toggleHeading({ level: 1 }).run(),
      shortcut: 'Ctrl+1',
    },
    {
      label: '标题 2',
      action: () => editor?.chain().focus().toggleHeading({ level: 2 }).run(),
      shortcut: 'Ctrl+2',
    },
    {
      label: '标题 3',
      action: () => editor?.chain().focus().toggleHeading({ level: 3 }).run(),
      shortcut: 'Ctrl+3',
    },
    { label: '', action: () => {}, divider: true },
    {
      label: '无序列表',
      action: () => editor?.chain().focus().toggleBulletList().run(),
      shortcut: 'Ctrl+Shift+8',
    },
    {
      label: '有序列表',
      action: () => editor?.chain().focus().toggleOrderedList().run(),
      shortcut: 'Ctrl+Shift+7',
    },
    {
      label: '引用',
      action: () => editor?.chain().focus().toggleBlockquote().run(),
      shortcut: 'Ctrl+Shift+B',
    },
    { label: '', action: () => {}, divider: true },
    {
      label: '撤销',
      action: () => editor?.chain().focus().undo().run(),
      shortcut: 'Ctrl+Z',
      icon: '↩',
    },
    {
      label: '重做',
      action: () => editor?.chain().focus().redo().run(),
      shortcut: 'Ctrl+Y',
      icon: '↪',
    },
    { label: '', action: () => {}, divider: true },
    {
      label: '保存',
      action: onSave || (() => {}),
      shortcut: 'Ctrl+S',
      icon: '💾',
    },
    {
      label: '自动换行',
      action: onToggleWordWrap || (() => {}),
      icon: '↵',
    },
    { label: '', action: () => {}, divider: true },
    {
      label: '退出专注模式',
      action: onExitFocusMode || (() => {}),
      shortcut: 'ESC',
      icon: '✕',
    },
  ]

  if (!isOpen) return null

  return (
    <div
      ref={menuRef}
      className="fixed z-[100] bg-black/90 backdrop-blur-sm border border-white/20 rounded-lg shadow-2xl py-1 min-w-[180px]"
      style={{ left: position.x, top: position.y }}
    >
      {menuItems.map((item, index) => {
        if (item.divider) {
          return (
            <div
              key={`divider-${index}`}
              className="my-1 border-t border-white/10"
            />
          )
        }

        return (
          <button
            key={item.label}
            onClick={(e) => {
              e.stopPropagation()
              item.action()
              closeMenu()
            }}
            disabled={item.disabled}
            className={`w-full text-left px-3 py-1.5 text-sm text-white/80 hover:bg-white/10 flex items-center justify-between gap-4 ${
              item.disabled ? 'opacity-40 cursor-not-allowed' : ''
            }`}
          >
            <span className="flex items-center gap-2">
              {item.icon && (
                <span className="w-4 text-center text-xs">{item.icon}</span>
              )}
              {item.label}
            </span>
            {item.shortcut && (
              <span className="text-xs text-white/40">{item.shortcut}</span>
            )}
          </button>
        )
      })}
    </div>
  )
}
