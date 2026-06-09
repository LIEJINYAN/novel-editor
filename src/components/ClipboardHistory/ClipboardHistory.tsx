import { useState, useEffect, useCallback } from 'react'

interface Props {
  onClose: () => void
  onInsert: (text: string) => void
}

interface ClipboardItem {
  id: string
  text: string
  timestamp: number
}

const STORAGE_KEY = 'novel-engine-clipboard'
const MAX_ITEMS = 50

function loadHistory(): ClipboardItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

function saveHistory(items: ClipboardItem[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items.slice(-MAX_ITEMS)))
}

export default function ClipboardHistory({ onClose, onInsert }: Props) {
  const [items, setItems] = useState<ClipboardItem[]>(loadHistory)
  const [search, setSearch] = useState('')

  useEffect(() => {
    saveHistory(items)
  }, [items])

  useEffect(() => {
    const handleCopy = async () => {
      try {
        const text = await navigator.clipboard.readText()
        if (text && text.trim()) {
          setItems((prev) => {
            const exists = prev.find((i) => i.text === text)
            if (exists) return prev
            return [...prev, { id: Date.now().toString(), text: text.trim(), timestamp: Date.now() }]
          })
        }
      } catch {}
    }
    document.addEventListener('copy', handleCopy)
    return () => document.removeEventListener('copy', handleCopy)
  }, [])

  const filtered = items.filter((i) => i.text.toLowerCase().includes(search.toLowerCase()))

  const handleInsert = (text: string) => {
    onInsert(text)
    onClose()
  }

  const handleDelete = (id: string) => {
    setItems((prev) => prev.filter((i) => i.id !== id))
  }

  const handleClear = () => {
    setItems([])
  }

  const formatTime = (ts: number) => {
    const d = new Date(ts)
    return d.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-editor-surface border border-editor-border rounded-lg shadow-2xl w-[450px] max-h-[70vh] flex flex-col">
        <div className="flex items-center justify-between px-4 py-3 border-b border-editor-border">
          <h2 className="text-sm font-semibold text-editor-text">📋 剪贴板历史</h2>
          <div className="flex items-center gap-2">
            <button onClick={handleClear} className="text-[10px] text-red-500 hover:text-red-600">清空</button>
            <button onClick={onClose} className="text-editor-muted hover:text-editor-text">✕</button>
          </div>
        </div>

        <div className="px-4 py-2 border-b border-editor-border">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="搜索..."
            className="w-full px-2 py-1.5 text-xs bg-editor-bg border border-editor-border rounded text-editor-text"
          />
        </div>

        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {filtered.length === 0 ? (
            <p className="text-center text-editor-muted text-xs py-8">暂无记录</p>
          ) : (
            filtered.reverse().map((item) => (
              <div
                key={item.id}
                className="group p-2 bg-editor-bg rounded border border-editor-border hover:border-editor-accent transition-colors animate-slide-in"
              >
                <div className="flex items-start justify-between gap-2">
                  <p className="text-xs text-editor-text flex-1 line-clamp-3 whitespace-pre-wrap">{item.text}</p>
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                    <button
                      onClick={() => handleInsert(item.text)}
                      className="text-[10px] px-1.5 py-0.5 bg-editor-accent text-editor-bg rounded hover:opacity-90"
                    >
                      插入
                    </button>
                    <button
                      onClick={() => handleDelete(item.id)}
                      className="text-[10px] px-1.5 py-0.5 text-red-500 hover:bg-red-500/10 rounded"
                    >
                      ✕
                    </button>
                  </div>
                </div>
                <div className="text-[9px] text-editor-muted mt-1">{formatTime(item.timestamp)}</div>
              </div>
            ))
          )}
        </div>

        <div className="p-3 border-t border-editor-border text-center">
          <span className="text-[10px] text-editor-muted">共 {items.length} 条记录</span>
        </div>
      </div>
    </div>
  )
}
