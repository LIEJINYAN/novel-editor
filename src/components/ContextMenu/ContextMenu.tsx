import { useState, useEffect, useRef, useCallback } from 'react'
import { t } from '../../i18n'

interface MenuItem {
  label: string
  icon?: string
  action: () => void
  divider?: boolean
  disabled?: boolean
}

interface Props {
  x: number
  y: number
  items: MenuItem[]
  onClose: () => void
}

export default function ContextMenu({ x, y, items, onClose }: Props) {
  const menuRef = useRef<HTMLDivElement>(null)

  const handleClickOutside = useCallback(
    (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose()
      }
    },
    [onClose]
  )

  useEffect(() => {
    document.addEventListener('mousedown', handleClickOutside)
    document.addEventListener('contextmenu', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('contextmenu', handleClickOutside)
    }
  }, [handleClickOutside])

  useEffect(() => {
    if (!menuRef.current) return
    const rect = menuRef.current.getBoundingClientRect()
    const vw = window.innerWidth
    const vh = window.innerHeight

    if (rect.right > vw) {
      menuRef.current.style.left = `${x - rect.width}px`
    }
    if (rect.bottom > vh) {
      menuRef.current.style.top = `${y - rect.height}px`
    }
  }, [x, y])

  return (
    <div
      ref={menuRef}
      className="fixed z-[100] bg-editor-surface border border-editor-border rounded-lg shadow-2xl py-1 min-w-[180px] animate-fade-in"
      style={{ left: x, top: y }}
    >
      {items.map((item, i) =>
        item.divider ? (
          <div key={i} className="border-t border-editor-border my-1" />
        ) : (
          <button
            key={i}
            className={`w-full flex items-center gap-2 px-3 py-1.5 text-xs transition-colors ${
              item.disabled
                ? 'text-editor-muted/50 cursor-not-allowed'
                : 'text-editor-text hover:bg-editor-bg'
            }`}
            onClick={() => {
              if (!item.disabled) {
                item.action()
                onClose()
              }
            }}
            disabled={item.disabled}
          >
            {item.icon && <span className="w-4 text-center">{item.icon}</span>}
            <span>{item.label}</span>
          </button>
        )
      )}
    </div>
  )
}

export function useContextMenu() {
  const [state, setState] = useState<{ visible: boolean; x: number; y: number; items: MenuItem[] }>({
    visible: false,
    x: 0,
    y: 0,
    items: [],
  })

  const show = useCallback((e: React.MouseEvent, items: MenuItem[]) => {
    e.preventDefault()
    e.stopPropagation()

    setState({ visible: true, x: e.clientX, y: e.clientY, items })
  }, [])

  const hide = useCallback(() => {
    setState((prev) => ({ ...prev, visible: false }))
  }, [])

  return { contextMenu: state, showContextMenu: show, hideContextMenu: hide }
}
