import type { Editor } from '@tiptap/core'
import { useThemeStore } from '../../store/themeStore'
import { useDocumentSessionStore } from '../../store/documentSessionStore'

interface Props {
  editor: Editor | null
  docId: string
}

export default function EditorToolbar({ editor, docId }: Props) {
  const wordWrap = useThemeStore((s) => s.wordWrap)
  const toggleWordWrap = useThemeStore((s) => s.toggleWordWrap)
  const { canUndo, canRedo, pushUndo, undo, redo } = useDocumentSessionStore()

  if (!editor) return null

  const btnClass = (active: boolean) =>
    `px-2 py-1 text-sm rounded transition-colors ${
      active
        ? 'bg-editor-accent text-editor-bg'
        : 'text-editor-muted hover:text-editor-text hover:bg-editor-surface'
    }`

  const handleUndo = () => {
    if (canUndo(docId)) {
      const content = undo(docId)
      if (content) {
        editor.chain().focus().clearContent().run()
        editor.commands.setContent(content)
      }
    }
  }

  const handleRedo = () => {
    if (canRedo(docId)) {
      const content = redo(docId)
      if (content) {
        editor.chain().focus().clearContent().run()
        editor.commands.setContent(content)
      }
    }
  }

  return (
    <div className="flex items-center gap-1 px-4 py-2 border-b border-editor-border bg-editor-surface/50 flex-wrap shrink-0" role="toolbar" aria-label="编辑器工具栏">
      <button className={btnClass(editor.isActive('bold'))} onClick={() => editor.chain().focus().toggleBold().run()} title="加粗 Ctrl+B" aria-label="加粗" aria-pressed={editor.isActive('bold')}>
        <strong aria-hidden="true">B</strong>
      </button>
      <button className={btnClass(editor.isActive('italic'))} onClick={() => editor.chain().focus().toggleItalic().run()} title="斜体 Ctrl+I" aria-label="斜体" aria-pressed={editor.isActive('italic')}>
        <em aria-hidden="true">I</em>
      </button>
      <button className={btnClass(editor.isActive('underline'))} onClick={() => editor.chain().focus().toggleUnderline().run()} title="下划线" aria-label="下划线" aria-pressed={editor.isActive('underline')}>
        <span className="underline" aria-hidden="true">U</span>
      </button>
      <button className={btnClass(editor.isActive('strike'))} onClick={() => editor.chain().focus().toggleStrike().run()} title="删除线" aria-label="删除线" aria-pressed={editor.isActive('strike')}>
        <span className="line-through" aria-hidden="true">S</span>
      </button>

      <div className="w-px h-5 bg-editor-border mx-1" role="separator" aria-hidden="true" />

      <button className={btnClass(editor.isActive('heading', { level: 1 }))} onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()} title="标题1" aria-label="标题1" aria-pressed={editor.isActive('heading', { level: 1 })}>
        H1
      </button>
      <button className={btnClass(editor.isActive('heading', { level: 2 }))} onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} title="标题2" aria-label="标题2" aria-pressed={editor.isActive('heading', { level: 2 })}>
        H2
      </button>
      <button className={btnClass(editor.isActive('heading', { level: 3 }))} onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} title="标题3" aria-label="标题3" aria-pressed={editor.isActive('heading', { level: 3 })}>
        H3
      </button>

      <div className="w-px h-5 bg-editor-border mx-1" role="separator" aria-hidden="true" />

      <button className={btnClass(editor.isActive('bulletList'))} onClick={() => editor.chain().focus().toggleBulletList().run()} title="无序列表" aria-label="无序列表" aria-pressed={editor.isActive('bulletList')}>
        <span aria-hidden="true">≡</span>
      </button>
      <button className={btnClass(editor.isActive('orderedList'))} onClick={() => editor.chain().focus().toggleOrderedList().run()} title="有序列表" aria-label="有序列表" aria-pressed={editor.isActive('orderedList')}>
        <span aria-hidden="true">#</span>
      </button>
      <button className={btnClass(editor.isActive('blockquote'))} onClick={() => editor.chain().focus().toggleBlockquote().run()} title="引用" aria-label="引用" aria-pressed={editor.isActive('blockquote')}>
        <span aria-hidden="true">"</span>
      </button>
      <button className={btnClass(editor.isActive('monacoCodeBlock'))} onClick={() => editor.chain().focus().setMonacoCodeBlock().run()} title="Monaco代码块" aria-label="代码块" aria-pressed={editor.isActive('monacoCodeBlock')}>
        <span aria-hidden="true">{'</>'}</span>
      </button>

      <div className="w-px h-5 bg-editor-border mx-1" role="separator" aria-hidden="true" />

      <button className={btnClass(editor.isActive('highlight'))} onClick={() => editor.chain().focus().toggleHighlight().run()} title="高亮" aria-label="高亮" aria-pressed={editor.isActive('highlight')}>
        <span className="bg-yellow-500 text-black px-1 text-xs" aria-hidden="true">高亮</span>
      </button>

      <div className="ml-auto flex items-center gap-2">
        <button
          className={`text-xs px-2 py-1 rounded transition-colors ${
            wordWrap
              ? 'bg-editor-accent text-editor-bg'
              : 'text-editor-muted hover:text-editor-text hover:bg-editor-surface'
          }`}
          onClick={toggleWordWrap}
          title={wordWrap ? '关闭自动换行' : '开启自动换行'}
          aria-label={wordWrap ? '关闭自动换行' : '开启自动换行'}
          aria-pressed={wordWrap}
        >
          <span aria-hidden="true">↵</span>
        </button>
        <button
          className={`text-xs px-2 py-1 rounded transition-colors ${
            canUndo(docId)
              ? 'text-editor-muted hover:text-editor-text hover:bg-editor-surface'
              : 'text-editor-muted/50 cursor-not-allowed'
          }`}
          onClick={handleUndo}
          disabled={!canUndo(docId)}
          title="撤销"
          aria-label="撤销"
        >
          <span aria-hidden="true">↩</span>
        </button>
        <button
          className={`text-xs px-2 py-1 rounded transition-colors ${
            canRedo(docId)
              ? 'text-editor-muted hover:text-editor-text hover:bg-editor-surface'
              : 'text-editor-muted/50 cursor-not-allowed'
          }`}
          onClick={handleRedo}
          disabled={!canRedo(docId)}
          title="重做"
          aria-label="重做"
        >
          <span aria-hidden="true">↪</span>
        </button>
      </div>
    </div>
  )
}
