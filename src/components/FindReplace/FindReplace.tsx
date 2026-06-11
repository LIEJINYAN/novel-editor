import { useState, useCallback, useEffect, useRef } from 'react'
import type { Editor } from '@tiptap/core'

interface Props {
  editor: Editor | null
  onClose: () => void
}

export default function FindReplace({ editor, onClose }: Props) {
  const [searchQuery, setSearchQuery] = useState('')
  const [replaceQuery, setReplaceQuery] = useState('')
  const [showReplace, setShowReplace] = useState(false)
  const [matchCount, setMatchCount] = useState(0)
  const [currentMatch, setCurrentMatch] = useState(0)
  const [caseSensitive, setCaseSensitive] = useState(false)
  const [useRegex, setUseRegex] = useState(false)
  const [previewMatches, setPreviewMatches] = useState<string[]>([])
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  const highlightMatches = useCallback(() => {
    if (!editor || !searchQuery) {
      setMatchCount(0)
      setCurrentMatch(0)
      setPreviewMatches([])
      return
    }

    const { state } = editor
    const { doc } = state
    let count = 0
    const previews: string[] = []

    let regex: RegExp | null = null
    if (useRegex) {
      try {
        regex = new RegExp(searchQuery, caseSensitive ? 'g' : 'gi')
      } catch {
        setMatchCount(0)
        setCurrentMatch(0)
        setPreviewMatches([])
        return
      }
    }

    doc.descendants((node) => {
      if (node.isText) {
        const text = node.text || ''

        if (regex) {
          let match
          while ((match = regex.exec(text)) !== null) {
            count++
            if (previews.length < 3) {
              const start = Math.max(0, match.index - 10)
              const end = Math.min(text.length, match.index + match[0].length + 10)
              previews.push(`...${text.slice(start, end)}...`)
            }
          }
          regex.lastIndex = 0
        } else {
          const searchLower = caseSensitive ? searchQuery : searchQuery.toLowerCase()
          const textLower = caseSensitive ? text : text.toLowerCase()

          let startPos = 0
          while (startPos < text.length) {
            const found = textLower.indexOf(searchLower, startPos)
            if (found === -1) break
            count++
            if (previews.length < 3) {
              const start = Math.max(0, found - 10)
              const end = Math.min(text.length, found + searchQuery.length + 10)
              previews.push(`...${text.slice(start, end)}...`)
            }
            startPos = found + 1
          }
        }
      }
    })

    setMatchCount(count)
    setPreviewMatches(previews)
    if (count > 0 && currentMatch === 0) {
      setCurrentMatch(1)
    } else if (count === 0) {
      setCurrentMatch(0)
    }
  }, [editor, searchQuery, caseSensitive, useRegex, currentMatch])

  useEffect(() => {
    highlightMatches()
  }, [highlightMatches])

  const findNext = useCallback(() => {
    if (!editor || !searchQuery) return

    const { state } = editor
    const { doc, selection } = state
    const { from } = selection
    let found = false

    doc.descendants((node, pos) => {
      if (found || !node.isText) return

      const text = node.text || ''
      const searchLower = caseSensitive ? searchQuery : searchQuery.toLowerCase()
      const textLower = caseSensitive ? text : text.toLowerCase()

      const startSearch = Math.max(0, from - pos)
      const foundPos = textLower.indexOf(searchLower, startSearch)

      if (foundPos !== -1) {
        const absoluteFrom = pos + foundPos
        const absoluteTo = absoluteFrom + searchQuery.length

        editor.chain()
          .focus()
          .setTextSelection({ from: absoluteFrom, to: absoluteTo })
          .run()

        found = true
        setCurrentMatch((prev) => (prev >= matchCount ? 1 : prev + 1))
      }
    })

    if (!found) {
      editor.chain()
        .focus()
        .setTextSelection(0)
        .run()

      setTimeout(() => {
        doc.descendants((node, pos) => {
          if (found || !node.isText) return

          const text = node.text || ''
          const searchLower = caseSensitive ? searchQuery : searchQuery.toLowerCase()
          const textLower = caseSensitive ? text : text.toLowerCase()

          const foundPos = textLower.indexOf(searchLower)

          if (foundPos !== -1) {
            const absoluteFrom = pos + foundPos
            const absoluteTo = absoluteFrom + searchQuery.length

            editor.chain()
              .focus()
              .setTextSelection({ from: absoluteFrom, to: absoluteTo })
              .run()

            found = true
            setCurrentMatch(1)
          }
        })
      }, 10)
    }
  }, [editor, searchQuery, caseSensitive, matchCount])

  const findPrev = useCallback(() => {
    if (!editor || !searchQuery) return

    const { state } = editor
    const { doc, selection } = state
    const currentFrom = selection.from
    let lastFound = { pos: -1, from: -1, to: -1 }

    doc.descendants((node, pos) => {
      if (!node.isText) return

      const text = node.text || ''
      const searchLower = caseSensitive ? searchQuery : searchQuery.toLowerCase()
      const textLower = caseSensitive ? text : text.toLowerCase()

      let startPos = 0
      while (startPos < text.length) {
        const foundPos = textLower.indexOf(searchLower, startPos)
        if (foundPos === -1) break

        const absoluteFrom = pos + foundPos
        const absoluteTo = absoluteFrom + searchQuery.length

        if (absoluteFrom < currentFrom) {
          lastFound = { pos: absoluteFrom, from: absoluteFrom, to: absoluteTo }
        }

        startPos = foundPos + 1
      }
    })

    if (lastFound.pos !== -1) {
      editor.chain()
        .focus()
        .setTextSelection({ from: lastFound.from, to: lastFound.to })
        .run()

      setCurrentMatch((prev) => (prev <= 1 ? matchCount : prev - 1))
    } else {
      let lastOverall = { pos: -1, from: -1, to: -1 }

      doc.descendants((node, pos) => {
        if (!node.isText) return

        const text = node.text || ''
        const searchLower = caseSensitive ? searchQuery : searchQuery.toLowerCase()
        const textLower = caseSensitive ? text : text.toLowerCase()

        let startPos = 0
        while (startPos < text.length) {
          const foundPos = textLower.indexOf(searchLower, startPos)
          if (foundPos === -1) break

          const absoluteFrom = pos + foundPos
          const absoluteTo = absoluteFrom + searchQuery.length

          lastOverall = { pos: absoluteFrom, from: absoluteFrom, to: absoluteTo }

          startPos = foundPos + 1
        }
      })

      if (lastOverall.pos !== -1) {
        editor.chain()
          .focus()
          .setTextSelection({ from: lastOverall.from, to: lastOverall.to })
          .run()

        setCurrentMatch(matchCount)
      }
    }
  }, [editor, searchQuery, caseSensitive, matchCount])

  const replace = useCallback(() => {
    if (!editor || !searchQuery) return

    const { state } = editor
    const { selection } = state
    const { from, to } = selection
    const selectedText = state.doc.textBetween(from, to, '')

    const matchesSearch = caseSensitive
      ? selectedText === searchQuery
      : selectedText.toLowerCase() === searchQuery.toLowerCase()

    if (matchesSearch) {
      editor.chain()
        .focus()
        .deleteSelection()
        .insertContent(replaceQuery)
        .run()

      setTimeout(() => highlightMatches(), 10)
    } else {
      findNext()
    }
  }, [editor, searchQuery, replaceQuery, caseSensitive, highlightMatches, findNext])

  const replaceAll = useCallback(() => {
    if (!editor || !searchQuery) return

    const { state } = editor
    const { doc } = state
    const replacements: { from: number; to: number }[] = []

    doc.descendants((node, pos) => {
      if (!node.isText) return

      const text = node.text || ''
      const searchLower = caseSensitive ? searchQuery : searchQuery.toLowerCase()
      const textLower = caseSensitive ? text : text.toLowerCase()

      let startPos = 0
      while (startPos < text.length) {
        const foundPos = textLower.indexOf(searchLower, startPos)
        if (foundPos === -1) break

        const absoluteFrom = pos + foundPos
        const absoluteTo = absoluteFrom + searchQuery.length

        replacements.push({ from: absoluteFrom, to: absoluteTo })

        startPos = foundPos + 1
      }
    })

    if (replacements.length > 0) {
      const tr = editor.chain()
      replacements.sort((a, b) => b.from - a.from)

      for (const { from, to } of replacements) {
        editor.chain()
          .focus()
          .setTextSelection({ from, to })
          .deleteSelection()
          .insertContent(replaceQuery)
          .run()
      }

      setTimeout(() => highlightMatches(), 10)
    }
  }, [editor, searchQuery, replaceQuery, caseSensitive, highlightMatches])

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose()
    } else if (e.key === 'Enter') {
      if (e.shiftKey) {
        findPrev()
      } else {
        findNext()
      }
    }
  }, [onClose, findNext, findPrev])

  return (
    <div className="fixed top-16 right-4 z-50 bg-editor-surface border border-editor-border rounded-lg shadow-xl w-[400px] overflow-hidden">
      <div className="flex items-center justify-between px-3 py-2 border-b border-editor-border">
        <h3 className="text-xs font-semibold text-editor-text">查找替换</h3>
        <button
          className="text-editor-muted hover:text-editor-text text-xs"
          onClick={onClose}
        >
          ✕
        </button>
      </div>

      <div className="p-3 space-y-2">
        <div className="flex items-center gap-2">
          <input
            ref={inputRef}
            className="flex-1 bg-editor-bg text-editor-text text-xs px-2 py-1.5 rounded border border-editor-border outline-none placeholder:text-editor-muted"
            placeholder={useRegex ? '正则表达式...' : '查找...'}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={handleKeyDown}
          />
          <button
            className={`text-xs px-2 py-1.5 rounded ${
              caseSensitive
                ? 'bg-editor-accent text-editor-bg'
                : 'text-editor-muted hover:text-editor-text hover:bg-editor-bg'
            }`}
            onClick={() => setCaseSensitive(!caseSensitive)}
            title="区分大小写"
          >
            Aa
          </button>
          <button
            className={`text-xs px-2 py-1.5 rounded ${
              useRegex
                ? 'bg-editor-accent text-editor-bg'
                : 'text-editor-muted hover:text-editor-text hover:bg-editor-bg'
            }`}
            onClick={() => setUseRegex(!useRegex)}
            title="正则表达式"
          >
            .*
          </button>
        </div>

        {searchQuery && (
          <div className="text-xs text-editor-muted">
            {matchCount > 0 ? `${currentMatch} / ${matchCount}` : '无匹配'}
          </div>
        )}

        {previewMatches.length > 0 && (
          <div className="bg-editor-bg rounded p-2 max-h-20 overflow-y-auto">
            <p className="text-[10px] text-editor-muted mb-1">预览:</p>
            {previewMatches.map((preview, i) => (
              <p key={i} className="text-[10px] text-editor-text font-mono truncate">
                {preview}
              </p>
            ))}
          </div>
        )}

        <div className="flex items-center gap-2">
          <button
            className="text-xs text-editor-muted hover:text-editor-text px-2 py-1 rounded hover:bg-editor-bg"
            onClick={findPrev}
            disabled={!searchQuery}
            title="上一个 (Shift+Enter)"
          >
            ↑
          </button>
          <button
            className="text-xs text-editor-muted hover:text-editor-text px-2 py-1 rounded hover:bg-editor-bg"
            onClick={findNext}
            disabled={!searchQuery}
            title="下一个 (Enter)"
          >
            ↓
          </button>
          <button
            className="text-xs text-editor-muted hover:text-editor-text px-2 py-1 rounded hover:bg-editor-bg ml-auto"
            onClick={() => setShowReplace(!showReplace)}
          >
            {showReplace ? '收起替换' : '展开替换'}
          </button>
        </div>

        {showReplace && (
          <>
            <input
              className="w-full bg-editor-bg text-editor-text text-xs px-2 py-1.5 rounded border border-editor-border outline-none placeholder:text-editor-muted"
              placeholder="替换为..."
              value={replaceQuery}
              onChange={(e) => setReplaceQuery(e.target.value)}
              onKeyDown={handleKeyDown}
            />
            <div className="flex items-center gap-2">
              <button
                className="text-xs bg-editor-accent text-editor-bg px-3 py-1.5 rounded hover:opacity-90"
                onClick={replace}
                disabled={!searchQuery}
              >
                替换
              </button>
              <button
                className="text-xs text-editor-muted hover:text-editor-text px-3 py-1.5 rounded hover:bg-editor-bg"
                onClick={replaceAll}
                disabled={!searchQuery}
              >
                全部替换
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
