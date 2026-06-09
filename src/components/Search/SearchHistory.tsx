import { useState, useEffect, useCallback } from 'react'

interface SearchHistoryItem {
  query: string
  timestamp: number
}

const STORAGE_KEY = 'novel-engine-search-history'
const MAX_ITEMS = 20

function loadHistory(): SearchHistoryItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

function saveHistory(items: SearchHistoryItem[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items.slice(-MAX_ITEMS)))
}

export function useSearchHistory() {
  const [history, setHistory] = useState<SearchHistoryItem[]>(loadHistory)

  const addQuery = useCallback((query: string) => {
    if (!query.trim()) return
    setHistory((prev) => {
      const exists = prev.find((i) => i.query === query)
      if (exists) return prev
      return [...prev, { query: query.trim(), timestamp: Date.now() }]
    })
  }, [])

  const removeQuery = useCallback((query: string) => {
    setHistory((prev) => prev.filter((i) => i.query !== query))
  }, [])

  const clearHistory = useCallback(() => {
    setHistory([])
  }, [])

  useEffect(() => {
    saveHistory(history)
  }, [history])

  return { history, addQuery, removeQuery, clearHistory }
}

interface SearchHistoryProps {
  history: SearchHistoryItem[]
  onSelect: (query: string) => void
  onRemove: (query: string) => void
  onClear: () => void
}

export function SearchHistory({ history, onSelect, onRemove, onClear }: SearchHistoryProps) {
  if (history.length === 0) return null

  return (
    <div className="border-b border-editor-border px-3 py-2">
      <div className="flex items-center justify-between mb-1">
        <span className="text-[10px] text-editor-muted">搜索历史</span>
        <button onClick={onClear} className="text-[10px] text-editor-muted hover:text-editor-text">清空</button>
      </div>
      <div className="flex flex-wrap gap-1">
        {[...history].reverse().slice(0, 8).map((item) => (
          <span
            key={item.query}
            className="group flex items-center gap-1 text-[10px] px-2 py-0.5 bg-editor-bg rounded cursor-pointer hover:bg-editor-accent/10"
            onClick={() => onSelect(item.query)}
          >
            {item.query}
            <button
              onClick={(e) => { e.stopPropagation(); onRemove(item.query) }}
              className="text-editor-muted hover:text-editor-red opacity-0 group-hover:opacity-100"
            >
              ✕
            </button>
          </span>
        ))}
      </div>
    </div>
  )
}
