import { useMemo } from 'react'
import type { Editor } from '@tiptap/core'

interface OutlineItem {
  id: string
  level: number
  text: string
  pos: number
}

interface Props {
  editor: Editor | null
  onNavigate?: (pos: number) => void
}

export default function DocumentOutline({ editor, onNavigate }: Props) {
  const headings = useMemo(() => {
    if (!editor) return []

    const items: OutlineItem[] = []

    editor.state.doc.descendants((node, pos) => {
      if (node.type.name === 'heading') {
        const text = node.textContent
        const level = node.attrs.level as number
        const id = `heading-${pos}`

        items.push({ id, level, text, pos })
      }
    })

    return items
  }, [editor])

  const handleClick = (pos: number) => {
    if (!editor || !onNavigate) return

    editor.chain()
      .focus()
      .setTextSelection(pos)
      .run()

    onNavigate(pos)
  }

  if (headings.length === 0) {
    return (
      <div className="p-4 text-center text-editor-muted text-xs">
        <p>暂无标题</p>
        <p className="mt-1 opacity-60">使用标题格式化文本以生成大纲</p>
      </div>
    )
  }

  return (
    <div className="p-2 space-y-0.5">
      {headings.map((heading) => (
        <button
          key={heading.id}
          className="w-full text-left px-2 py-1.5 rounded text-xs hover:bg-editor-surface transition-colors flex items-center gap-2"
          style={{ paddingLeft: `${(heading.level - 1) * 12 + 8}px` }}
          onClick={() => handleClick(heading.pos)}
        >
          <span className={`font-medium ${
            heading.level === 1 ? 'text-editor-text' :
            heading.level === 2 ? 'text-editor-muted' :
            'text-editor-muted opacity-70'
          }`}>
            {heading.text}
          </span>
        </button>
      ))}
    </div>
  )
}

interface DocumentOutlinePanelProps {
  editor: Editor | null
  onClose: () => void
}

export function DocumentOutlinePanel({ editor, onClose }: DocumentOutlinePanelProps) {
  const headings = useMemo(() => {
    if (!editor) return []

    const items: OutlineItem[] = []

    editor.state.doc.descendants((node, pos) => {
      if (node.type.name === 'heading') {
        const text = node.textContent
        const level = node.attrs.level as number
        const id = `heading-${pos}`

        items.push({ id, level, text, pos })
      }
    })

    return items
  }, [editor])

  const handleClick = (pos: number) => {
    if (!editor) return

    editor.chain()
      .focus()
      .setTextSelection(pos)
      .run()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-editor-surface border border-editor-border rounded-lg shadow-xl w-[400px] max-h-[60vh] overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b border-editor-border">
          <h2 className="text-sm font-semibold text-editor-text">📑 文档大纲</h2>
          <button
            className="text-editor-muted hover:text-editor-text"
            onClick={onClose}
          >
            ✕
          </button>
        </div>

        <div className="overflow-y-auto max-h-[calc(60vh-120px)]">
          {headings.length === 0 ? (
            <div className="p-8 text-center text-editor-muted text-xs">
              <p className="text-lg mb-2">📋</p>
              <p>暂无标题</p>
              <p className="mt-1 opacity-60">使用标题格式化文本以生成大纲</p>
            </div>
          ) : (
            <div className="p-2 space-y-0.5">
              {headings.map((heading) => (
                <button
                  key={heading.id}
                  className="w-full text-left px-3 py-2 rounded text-sm hover:bg-editor-bg transition-colors flex items-center gap-2"
                  style={{ paddingLeft: `${(heading.level - 1) * 16 + 12}px` }}
                  onClick={() => handleClick(heading.pos)}
                >
                  <span className={`font-medium ${
                    heading.level === 1 ? 'text-editor-text text-base' :
                    heading.level === 2 ? 'text-editor-text text-sm' :
                    'text-editor-muted text-xs'
                  }`}>
                    {heading.text}
                  </span>
                  <span className="text-xs text-editor-muted ml-auto">
                    H{heading.level}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="px-4 py-3 border-t border-editor-border flex justify-between items-center">
          <span className="text-xs text-editor-muted">
            共 {headings.length} 个标题
          </span>
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
