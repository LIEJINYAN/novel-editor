import { useEffect, useRef } from 'react'

interface Suggestion {
  text: string
  confidence: number
}

interface Props {
  suggestions: Suggestion[]
  position: { top: number; left: number }
  onSelect: (text: string) => void
  onClose: () => void
}

export default function AutoCompletePopup({ suggestions, position, onSelect, onClose }: Props) {
  const popupRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (popupRef.current && !popupRef.current.contains(e.target as Node)) {
        onClose()
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [onClose])

  if (suggestions.length === 0) return null

  return (
    <div
      ref={popupRef}
      className="fixed z-[150] bg-editor-surface border border-editor-border rounded-lg shadow-2xl py-1 min-w-[200px] max-w-[300px]"
      style={{ top: position.top, left: position.left }}
    >
      <div className="px-2 py-1 text-[10px] text-editor-muted border-b border-editor-border">
        AI 建议 (Tab 接受)
      </div>
      {suggestions.map((s, i) => (
        <button
          key={i}
          className="w-full text-left px-3 py-1.5 text-xs text-editor-text hover:bg-editor-bg flex items-center gap-2"
          onClick={() => onSelect(s.text)}
        >
          <span className="text-editor-muted">{i + 1}.</span>
          <span className="flex-1 truncate">{s.text}</span>
          <span className="text-[10px] text-editor-muted">
            {Math.round(s.confidence * 100)}%
          </span>
        </button>
      ))}
    </div>
  )
}
