import { useState, useCallback } from 'react'
import { useDocumentStore } from '../../store/documentStore'
import Modal from '../common/Modal'

interface SearchResult {
  docId: string
  docTitle: string
  matchCount: number
  preview: string
  matches: string[]
}

interface SearchOptions {
  caseSensitive: boolean
  wholeWord: boolean
  useRegex: boolean
}

interface SearchPanelProps {
  onNavigate: (docId: string) => void
  onClose: () => void
}

function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

function buildRegex(query: string, options: SearchOptions): RegExp | null {
  let pattern = query

  if (options.useRegex) {
    try {
      return new RegExp(query, options.caseSensitive ? 'g' : 'gi')
    } catch {
      return null
    }
  }

  pattern = escapeRegex(query)

  if (options.wholeWord) {
    pattern = `\\b${pattern}\\b`
  }

  try {
    return new RegExp(pattern, options.caseSensitive ? 'g' : 'gi')
  } catch {
    return null
  }
}

export default function SearchPanel({ onNavigate, onClose }: SearchPanelProps) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchResult[]>([])
  const [options, setOptions] = useState<SearchOptions>({
    caseSensitive: false,
    wholeWord: false,
    useRegex: false,
  })
  const [regexError, setRegexError] = useState(false)
  const documents = useDocumentStore((s) => s.documents)

  const extractText = (content: object): string => {
    const str = JSON.stringify(content)
    const texts: string[] = []
    const textRegex = /"text":"([^"]+)"/g
    let match
    while ((match = textRegex.exec(str)) !== null) texts.push(match[1])
    return texts.join(' ')
  }

  const highlightMatches = (text: string, regex: RegExp): string[] => {
    const matches: string[] = []
    let match
    const lastIndex = 0

    regex.lastIndex = 0
    while ((match = regex.exec(text)) !== null) {
      matches.push(match[0])
      if (match.index === regex.lastIndex) {
        regex.lastIndex++
      }
    }

    return matches
  }

  const handleSearch = useCallback(() => {
    if (!query.trim()) {
      setResults([])
      setRegexError(false)
      return
    }

    const regex = buildRegex(query, options)
    if (!regex) {
      setRegexError(true)
      setResults([])
      return
    }

    setRegexError(false)
    const searchResults: SearchResult[] = []

    for (const doc of documents) {
      const plainText = extractText(doc.content)
      const title = options.caseSensitive ? doc.title : doc.title.toLowerCase()
      const content = options.caseSensitive ? plainText : plainText.toLowerCase()

      const matches = highlightMatches(plainText, regex)
      const titleMatches = highlightMatches(doc.title, regex)

      if (matches.length > 0 || titleMatches.length > 0) {
        const matchCount = matches.length + titleMatches.length

        let preview = ''
        const regexForPreview = new RegExp(regex.source, regex.flags.replace('g', ''))
        const contentForPreview = options.caseSensitive ? plainText : plainText.toLowerCase()
        const queryForPreview = options.caseSensitive ? query : query.toLowerCase()
        const index = options.useRegex
          ? contentForPreview.search(regexForPreview)
          : contentForPreview.indexOf(queryForPreview)

        if (index !== -1) {
          const start = Math.max(0, index - 30)
          const end = Math.min(plainText.length, index + query.length + 40)
          preview = (start > 0 ? '...' : '') + plainText.slice(start, end) + (end < plainText.length ? '...' : '')
        }

        searchResults.push({
          docId: doc.id,
          docTitle: doc.title,
          matchCount,
          preview,
          matches: matches.slice(0, 5),
        })
      }
    }

    setResults(searchResults)
  }, [query, documents, options])

  const toggleOption = (key: keyof SearchOptions) => {
    setOptions((prev) => ({ ...prev, [key]: !prev[key] }))
  }

  return (
    <Modal open={true} onClose={onClose} title="搜索文档" size="md">
      <div className="p-3 border-b border-editor-border">
        <div className="flex gap-2 mb-2">
          <input
            className={`flex-1 bg-editor-bg text-editor-text text-sm px-3 py-2 rounded border ${
              regexError ? 'border-red-500' : 'border-editor-border'
            } outline-none placeholder:text-editor-muted`}
            placeholder={options.useRegex ? '输入正则表达式...' : '输入搜索关键词...'}
            value={query}
            onChange={(e) => {
              setQuery(e.target.value)
              if (!e.target.value) {
                setResults([])
                setRegexError(false)
              }
            }}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            autoFocus
            aria-label="搜索关键词"
            type="search"
          />
          <button
            className="bg-editor-accent text-editor-bg px-4 py-2 rounded hover:opacity-90 text-sm"
            onClick={handleSearch}
            aria-label="搜索"
          >
            搜索
          </button>
        </div>

        {regexError && (
          <p className="text-xs text-red-500 mb-2">正则表达式语法错误</p>
        )}

        <div className="flex gap-3">
          <label className="flex items-center gap-1.5 cursor-pointer">
            <input
              type="checkbox"
              checked={options.caseSensitive}
              onChange={() => toggleOption('caseSensitive')}
              className="rounded"
            />
            <span className="text-[10px] text-editor-muted">区分大小写</span>
          </label>
          <label className="flex items-center gap-1.5 cursor-pointer">
            <input
              type="checkbox"
              checked={options.wholeWord}
              onChange={() => toggleOption('wholeWord')}
              className="rounded"
            />
            <span className="text-[10px] text-editor-muted">全词匹配</span>
          </label>
          <label className="flex items-center gap-1.5 cursor-pointer">
            <input
              type="checkbox"
              checked={options.useRegex}
              onChange={() => toggleOption('useRegex')}
              className="rounded"
            />
            <span className="text-[10px] text-editor-muted">正则表达式</span>
          </label>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-3 max-h-[50vh]" role="region" aria-label="搜索结果" aria-live="polite">
        {results.length === 0 ? (
          <p className="text-center text-editor-muted text-xs py-4">
            {query ? '未找到匹配结果' : '输入关键词开始搜索'}
          </p>
        ) : (
          <div className="space-y-2">
            <p className="text-xs text-editor-muted mb-2">找到 {results.length} 个结果</p>
            {results.map((result) => (
              <div
                key={result.docId}
                className="p-3 bg-editor-bg rounded border border-editor-border hover:border-editor-accent cursor-pointer transition-colors"
                onClick={() => { onNavigate(result.docId); onClose() }}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault()
                    onNavigate(result.docId)
                    onClose()
                  }
                }}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium text-editor-text">{result.docTitle}</span>
                  <span className="text-xs text-editor-muted">{result.matchCount} 处匹配</span>
                </div>
                {result.preview && (
                  <p className="text-xs text-editor-muted line-clamp-2">{result.preview}</p>
                )}
                {result.matches.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-1">
                    {result.matches.map((match, i) => (
                      <span
                        key={i}
                        className="px-1.5 py-0.5 text-[9px] bg-editor-accent/20 text-editor-accent rounded"
                      >
                        {match}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </Modal>
  )
}
