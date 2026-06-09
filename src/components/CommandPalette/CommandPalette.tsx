import { useState, useEffect, useRef, useMemo, useCallback } from 'react'
import { t } from '../../i18n'

interface Command {
  id: string
  label: string
  icon: string
  category: string
  shortcut?: string
  action: () => void
}

interface Props {
  open: boolean
  onClose: () => void
  commands: Command[]
}

export default function CommandPalette({ open, onClose, commands }: Props) {
  const [query, setQuery] = useState('')
  const [selectedIndex, setSelectedIndex] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)
  const listRef = useRef<HTMLDivElement>(null)

  const filtered = useMemo(() => {
    if (!query.trim()) return commands
    const q = query.toLowerCase()
    return commands.filter(
      (cmd) =>
        cmd.label.toLowerCase().includes(q) ||
        cmd.category.toLowerCase().includes(q) ||
        cmd.id.toLowerCase().includes(q)
    )
  }, [query, commands])

  useEffect(() => {
    if (open) {
      setQuery('')
      setSelectedIndex(0)
      setTimeout(() => inputRef.current?.focus(), 50)
    }
  }, [open])

  useEffect(() => {
    setSelectedIndex(0)
  }, [query])

  const executeCommand = useCallback(
    (cmd: Command) => {
      cmd.action()
      onClose()
    },
    [onClose]
  )

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'ArrowDown') {
        e.preventDefault()
        setSelectedIndex((i) => Math.min(i + 1, filtered.length - 1))
      } else if (e.key === 'ArrowUp') {
        e.preventDefault()
        setSelectedIndex((i) => Math.max(i - 1, 0))
      } else if (e.key === 'Enter') {
        e.preventDefault()
        if (filtered[selectedIndex]) {
          executeCommand(filtered[selectedIndex])
        }
      } else if (e.key === 'Escape') {
        onClose()
      }
    },
    [filtered, selectedIndex, executeCommand, onClose]
  )

  useEffect(() => {
    const selected = listRef.current?.querySelector(`[data-index="${selectedIndex}"]`)
    selected?.scrollIntoView({ block: 'nearest' })
  }, [selectedIndex])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-[100] flex items-start justify-center pt-[15vh]" onClick={onClose}>
      <div className="absolute inset-0 bg-black/50" />
      <div
        className="relative bg-editor-surface border border-editor-border rounded-xl shadow-2xl w-[520px] max-h-[400px] overflow-hidden animate-fade-in"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-3 px-4 py-3 border-b border-editor-border">
          <span className="text-editor-muted text-sm">⌘K</span>
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="输入命令..."
            className="flex-1 bg-transparent text-sm text-editor-text outline-none placeholder:text-editor-muted"
          />
          <kbd className="px-1.5 py-0.5 text-[10px] bg-editor-bg border border-editor-border rounded text-editor-muted">ESC</kbd>
        </div>

        <div ref={listRef} className="overflow-y-auto max-h-[320px] p-2">
          {filtered.length === 0 ? (
            <p className="text-center text-editor-muted text-xs py-8">没有匹配的命令</p>
          ) : (
            <>
              {(() => {
                const categories = new Map<string, Command[]>()
                for (const cmd of filtered) {
                  if (!categories.has(cmd.category)) categories.set(cmd.category, [])
                  categories.get(cmd.category)!.push(cmd)
                }

                let globalIndex = 0
                return Array.from(categories.entries()).map(([category, cmds]) => (
                  <div key={category} className="mb-2">
                    <div className="px-2 py-1 text-[10px] font-semibold text-editor-muted uppercase tracking-wider">{category}</div>
                    {cmds.map((cmd) => {
                      const idx = globalIndex++
                      const isSelected = idx === selectedIndex
                      return (
                        <button
                          key={cmd.id}
                          data-index={idx}
                          className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
                            isSelected ? 'bg-editor-accent/10 text-editor-accent' : 'text-editor-text hover:bg-editor-bg'
                          }`}
                          onClick={() => executeCommand(cmd)}
                          onMouseEnter={() => setSelectedIndex(idx)}
                        >
                          <span className="text-base w-5 text-center">{cmd.icon}</span>
                          <span className="flex-1 text-left">{cmd.label}</span>
                          {cmd.shortcut && (
                            <kbd className="px-1.5 py-0.5 text-[10px] bg-editor-bg border border-editor-border rounded text-editor-muted font-mono">
                              {cmd.shortcut}
                            </kbd>
                          )}
                        </button>
                      )
                    })}
                  </div>
                ))
              })()}
            </>
          )}
        </div>

        <div className="px-4 py-2 border-t border-editor-border flex items-center gap-4 text-[10px] text-editor-muted">
          <span>↑↓ 导航</span>
          <span>↵ 执行</span>
          <span>ESC 关闭</span>
          <span className="ml-auto">{filtered.length} 个命令</span>
        </div>
      </div>
    </div>
  )
}

export type { Command }
