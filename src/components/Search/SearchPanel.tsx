import { useState, useCallback } from 'react'
import { useDocumentStore } from '../../store/documentStore'
import Modal from '../common/Modal'

interface SearchResult {
  docId: string
  docTitle: string
  matchCount: number
  preview: string
}

interface SearchPanelProps {
  onNavigate: (docId: string) => void
  onClose: () => void
}

export default function SearchPanel({ onNavigate, onClose }: SearchPanelProps) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchResult[]>([])
  const documents = useDocumentStore((s) => s.documents)

  const extractText = (content: object): string => {
    const str = JSON.stringify(content)
    const texts: string[] = []
    const textRegex = /"text":"([^"]+)"/g
    let match
    while ((match = textRegex.exec(str)) !== null) texts.push(match[1])
    return texts.join(' ')
  }

  const handleSearch = useCallback(() => {
    if (!query.trim()) { setResults([]); return }
    const searchQuery = query.toLowerCase()
    const searchResults: SearchResult[] = []
    for (const doc of documents) {
      const content = JSON.stringify(doc.content).toLowerCase()
      const title = doc.title.toLowerCase()
      if (title.includes(searchQuery) || content.includes(searchQuery)) {
        const matchCount = (content.match(new RegExp(searchQuery, 'g')) || []).length
        let preview = ''
        const plainText = extractText(doc.content)
        const index = plainText.toLowerCase().indexOf(searchQuery)
        if (index !== -1) {
          const start = Math.max(0, index - 20)
          const end = Math.min(plainText.length, index + query.length + 30)
          preview = (start > 0 ? '...' : '') + plainText.slice(start, end) + (end < plainText.length ? '...' : '')
        }
        searchResults.push({ docId: doc.id, docTitle: doc.title, matchCount, preview })
      }
    }
    setResults(searchResults)
  }, [query, documents])

  return (
    <Modal open={true} onClose={onClose} title="搜索文档" size="md">
      <div className="p-3 border-b border-editor-border">
        <div className="flex gap-2">
          <input className="flex-1 bg-editor-bg text-editor-text text-sm px-3 py-2 rounded border border-editor-border outline-none placeholder:text-editor-muted"
            placeholder="输入搜索关键词..." value={query}
            onChange={(e) => { setQuery(e.target.value); if (!e.target.value) setResults([]) }}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()} autoFocus />
          <button className="bg-editor-accent text-editor-bg px-4 py-2 rounded hover:opacity-90 text-sm" onClick={handleSearch}>搜索</button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-3 max-h-[50vh]">
        {results.length === 0 ? (
          <p className="text-center text-editor-muted text-xs py-4">{query ? '未找到匹配结果' : '输入关键词开始搜索'}</p>
        ) : (
          <div className="space-y-2">
            <p className="text-xs text-editor-muted mb-2">找到 {results.length} 个结果</p>
            {results.map((result) => (
              <div key={result.docId} className="p-3 bg-editor-bg rounded border border-editor-border hover:border-editor-accent cursor-pointer transition-colors"
                onClick={() => { onNavigate(result.docId); onClose() }}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium text-editor-text">{result.docTitle}</span>
                  <span className="text-xs text-editor-muted">{result.matchCount} 处匹配</span>
                </div>
                {result.preview && <p className="text-xs text-editor-muted line-clamp-2">{result.preview}</p>}
              </div>
            ))}
          </div>
        )}
      </div>
    </Modal>
  )
}
