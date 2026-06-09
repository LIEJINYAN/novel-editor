import { useMemo, useState } from 'react'
import Modal from '../common/Modal'

interface Props {
  content: object
  onClose: () => void
}

interface WordFreq {
  word: string
  count: number
  size: number
}

function extractText(node: any): string {
  if (node.type === 'text' && node.text) return node.text
  if (!node.content) return ''
  return node.content.map(extractText).join(' ')
}

function countWords(text: string): Map<string, number> {
  const words = new Map<string, number>()
  const segments = text.match(/[\u4e00-\u9fa5]|[a-zA-Z]+/g) || []
  for (const seg of segments) {
    if (seg.length < 2) continue
    const lower = seg.toLowerCase()
    words.set(lower, (words.get(lower) || 0) + 1)
  }
  return words
}

export default function WordCloud({ content, onClose }: Props) {
  const [filter, setFilter] = useState<'all' | 'chinese' | 'english'>('all')

  const wordFreqs = useMemo(() => {
    const text = extractText(content)
    const wordMap = countWords(text)
    const sorted = Array.from(wordMap.entries()).sort((a, b) => b[1] - a[1]).slice(0, 50)
    if (sorted.length === 0) return []
    const maxCount = sorted[0][1]
    const minCount = sorted[sorted.length - 1][1]
    return sorted.map(([word, count]) => ({
      word,
      count,
      size: minCount === maxCount ? 1 : (count - minCount) / (maxCount - minCount),
    }))
  }, [content])

  const filteredWords = useMemo(() => {
    return wordFreqs.filter((w) => {
      if (filter === 'chinese') return /[\u4e00-\u9fa5]/.test(w.word)
      if (filter === 'english') return /^[a-zA-Z]+$/.test(w.word)
      return true
    })
  }, [wordFreqs, filter])

  const colors = ['text-blue-500', 'text-green-500', 'text-purple-500', 'text-orange-500', 'text-pink-500', 'text-cyan-500']

  return (
    <Modal open={true} onClose={onClose} title="☁️ 词云分析" size="md">
      <div className="p-4">
        <div className="flex gap-2 mb-4">
          {(['all', 'chinese', 'english'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1 text-xs rounded ${
                filter === f ? 'bg-editor-accent text-editor-bg' : 'bg-editor-bg text-editor-muted hover:text-editor-text'
              }`}
            >
              {f === 'all' ? '全部' : f === 'chinese' ? '中文' : '英文'}
            </button>
          ))}
        </div>

        <div className="bg-editor-bg rounded-lg p-6 min-h-[300px] flex flex-wrap items-center justify-center gap-2">
          {filteredWords.length === 0 ? (
            <span className="text-sm text-editor-muted">暂无词汇数据</span>
          ) : (
            filteredWords.map((w, i) => (
              <span
                key={w.word}
                className={`${colors[i % colors.length]} cursor-default hover:opacity-80 transition-opacity`}
                style={{ fontSize: `${12 + w.size * 24}px`, opacity: 0.5 + w.size * 0.5 }}
                title={`${w.word}: ${w.count}次`}
              >
                {w.word}
              </span>
            ))
          )}
        </div>

        <div className="mt-4 bg-editor-bg rounded-lg p-3">
          <h3 className="text-xs font-medium text-editor-muted mb-2">高频词汇</h3>
          <div className="flex flex-wrap gap-2">
            {filteredWords.slice(0, 10).map((w) => (
              <span key={w.word} className="px-2 py-1 text-xs bg-editor-surface rounded text-editor-text">
                {w.word} ({w.count})
              </span>
            ))}
          </div>
        </div>
      </div>
    </Modal>
  )
}
