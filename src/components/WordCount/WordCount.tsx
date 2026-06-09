import type { Editor } from '@tiptap/core'

interface Stats {
  characters: number
  charactersNoSpaces: number
  words: number
  paragraphs: number
  sentences: number
}

export function getEditorStats(editor: Editor | null): Stats {
  if (!editor) {
    return { characters: 0, charactersNoSpaces: 0, words: 0, paragraphs: 0, sentences: 0 }
  }

  const text = editor.state.doc.textContent
  const textNoSpaces = text.replace(/\s/g, '')

  const characters = text.length
  const charactersNoSpaces = textNoSpaces.length

  const words = text.trim() ? text.trim().split(/\s+/).length : 0

  let paragraphs = 0
  let sentences = 0

  editor.state.doc.descendants((node) => {
    if (node.type.name === 'paragraph') {
      paragraphs++
    }
  })

  const sentenceMatches = text.match(/[.!?。！？]+/g)
  sentences = sentenceMatches ? sentenceMatches.length : 0

  return { characters, charactersNoSpaces, words, paragraphs, sentences }
}

interface WordCountFooterProps {
  editor: Editor | null
}

export function WordCountFooter({ editor }: WordCountFooterProps) {
  const stats = getEditorStats(editor)

  return (
    <span className="flex items-center gap-3">
      <span>{stats.words} 词</span>
      <span>{stats.characters} 字符</span>
      <span>{stats.paragraphs} 段</span>
    </span>
  )
}

interface WordCountPanelProps {
  editor: Editor | null
  onClose: () => void
}

export function WordCountPanel({ editor, onClose }: WordCountPanelProps) {
  const stats = getEditorStats(editor)

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-editor-surface border border-editor-border rounded-lg shadow-xl w-[320px] overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b border-editor-border">
          <h2 className="text-sm font-semibold text-editor-text">📊 写作统计</h2>
          <button
            className="text-editor-muted hover:text-editor-text"
            onClick={onClose}
          >
            ✕
          </button>
        </div>

        <div className="p-4 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-editor-bg rounded-lg p-3 text-center">
              <div className="text-2xl font-bold text-editor-accent">{stats.words}</div>
              <div className="text-xs text-editor-muted mt-1">单词数</div>
            </div>
            <div className="bg-editor-bg rounded-lg p-3 text-center">
              <div className="text-2xl font-bold text-editor-accent">{stats.characters}</div>
              <div className="text-xs text-editor-muted mt-1">字符数</div>
            </div>
            <div className="bg-editor-bg rounded-lg p-3 text-center">
              <div className="text-2xl font-bold text-editor-accent">{stats.charactersNoSpaces}</div>
              <div className="text-xs text-editor-muted mt-1">字符数（不含空格）</div>
            </div>
            <div className="bg-editor-bg rounded-lg p-3 text-center">
              <div className="text-2xl font-bold text-editor-accent">{stats.paragraphs}</div>
              <div className="text-xs text-editor-muted mt-1">段落数</div>
            </div>
          </div>

          <div className="bg-editor-bg rounded-lg p-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-editor-muted">句子数</span>
              <span className="text-editor-text font-medium">{stats.sentences}</span>
            </div>
          </div>
        </div>

        <div className="px-4 py-3 border-t border-editor-border flex justify-end">
          <button
            className="px-3 py-1.5 bg-editor-accent text-white text-xs rounded hover:opacity-90"
            onClick={onClose}
          >
            关闭
          </button>
        </div>
      </div>
    </div>
  )
}

export default WordCountPanel
