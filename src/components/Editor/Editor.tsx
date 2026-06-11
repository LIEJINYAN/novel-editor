import { useEditor, EditorContent } from '@tiptap/react'
import { forwardRef, useImperativeHandle, useEffect, useRef, memo } from 'react'
import { novelExtensions, getNovelEditorProps } from '../../editor/novelEditor'
import EditorToolbar from './EditorToolbar'
import AIToolbar from '../AIToolbar/AIToolbar'
import { useThemeStore } from '../../store/themeStore'
import { useDocumentSessionStore } from '../../store/documentSessionStore'
import { useCollaborationStore } from '../../store/collaborationStore'
import type { Editor as TiptapEditor } from '@tiptap/core'
import type { Operation } from '../../services/collaboration'

interface ProseMirrorElement extends HTMLElement {
  editor?: TiptapEditor
}

export interface EditorRef {
  getEditor: () => TiptapEditor | null
  insertContent: (text: string) => void
}

interface Props {
  docId: string
  initialContent?: object
  onChange?: (content: object) => void
  onSelectionChange?: (selection: string) => void
  editorContent?: string
}

const MemoizedAIToolbar = memo(AIToolbar)

const Editor = forwardRef<EditorRef, Props>(({ docId, initialContent, onChange, onSelectionChange, editorContent }, ref) => {
  const wordWrap = useThemeStore((s) => s.wordWrap)
  const editorProps = getNovelEditorProps(wordWrap)

  const { createSession, removeSession, pushUndo, setCursorPosition, getCursorPosition, setScrollPosition, getScrollPosition } = useDocumentSessionStore()
  const { isConnected, sendOperation, sendCursorUpdate } = useCollaborationStore()

  const lastContentRef = useRef<string>('')
  const undoTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const isComposingRef = useRef(false)
  const skipRemoteRef = useRef(false)

  useEffect(() => {
    createSession(docId)
    return () => {
      if (undoTimeoutRef.current) {
        clearTimeout(undoTimeoutRef.current)
      }
      removeSession(docId)
    }
  }, [docId, createSession, removeSession])

  useEffect(() => {
    const handleRemoteOperation = (e: CustomEvent<Operation>) => {
      const op = e.detail
      if (op.documentId !== docId) return

      const editor = useDocumentSessionStore.getState()
      skipRemoteRef.current = true

      const editorInstance = document.querySelector('.ProseMirror') as ProseMirrorElement | null
      if (editorInstance?.editor) {
        const tiptapEditor = editorInstance.editor
        switch (op.type) {
          case 'insert':
            tiptapEditor.chain().focus().insertContentAt(op.position, op.content || '').run()
            break
          case 'delete':
            tiptapEditor.chain().focus().deleteRange({ from: op.position, to: op.position + (op.length || 0) }).run()
            break
          case 'replace':
            tiptapEditor.chain().focus()
              .deleteRange({ from: op.position, to: op.position + (op.length || 0) })
              .insertContentAt(op.position, op.content || '')
              .run()
            break
        }
      }

      skipRemoteRef.current = false
    }

    window.addEventListener('collaboration-operation', handleRemoteOperation as EventListener)
    return () => window.removeEventListener('collaboration-operation', handleRemoteOperation as EventListener)
  }, [docId])

  const handleUpdateRef = useRef<(({ editor }: { editor: TiptapEditor }) => void) | null>(null)
  handleUpdateRef.current = ({ editor }: { editor: TiptapEditor }) => {
    if (isComposingRef.current || skipRemoteRef.current) return

    const content = editor.getJSON()
    onChange?.(content)

    const { isConnected: conn, sendOperation: sendOp } = useCollaborationStore.getState()
    if (conn) {
      const contentStr = JSON.stringify(content)
      const lastStr = lastContentRef.current
      if (contentStr !== lastStr) {
        const oldDoc = JSON.parse(lastStr || '{"content":[]}')
        const newDoc = content
        const oldText = extractText(oldDoc)
        const newText = extractText(newDoc)

        if (oldText !== newText) {
          const diff = computeDiff(oldText, newText)
          if (diff) {
            sendOp(diff)
          }
        }
      }
    }

    const contentStr = JSON.stringify(content)
    if (contentStr !== lastContentRef.current) {
      if (undoTimeoutRef.current) {
        clearTimeout(undoTimeoutRef.current)
      }
      const currentDocId = docId
      undoTimeoutRef.current = setTimeout(() => {
        pushUndo(currentDocId, content)
        lastContentRef.current = contentStr
      }, 500)
    }
  }

  const editor = useEditor({
    extensions: novelExtensions,
    editorProps: {
      ...editorProps,
      handleDOMEvents: {
        compositionstart: () => {
          isComposingRef.current = true
          return false
        },
        compositionend: () => {
          isComposingRef.current = false
          return false
        },
      },
    },
    content: initialContent,
    onUpdate: (props) => handleUpdateRef.current?.(props),
    onFocus: ({ editor }) => {
      const cursorPos = getCursorPosition(docId)
      if (cursorPos !== null) {
        try {
          editor.chain().focus().setTextSelection(cursorPos).run()
        } catch {}
      }

      const scrollPos = getScrollPosition(docId)
      if (scrollPos > 0) {
        const editorElement = editor.view.dom.closest('.overflow-y-auto')
        if (editorElement) {
          editorElement.scrollTop = scrollPos
        }
      }
    },
    onBlur: ({ editor }) => {
      const { from } = editor.state.selection
      setCursorPosition(docId, from)

      const editorElement = editor.view.dom.closest('.overflow-y-auto')
      if (editorElement) {
        setScrollPosition(docId, editorElement.scrollTop)
      }
    },
    onSelectionUpdate: ({ editor }) => {
      if (isConnected) {
        const { from, to } = editor.state.selection
        sendCursorUpdate({ position: from, selection: { from, to } })
      }

      if (onSelectionChange) {
        const { from, to } = editor.state.selection
        const selectedText = editor.state.doc.textBetween(from, to, '')
        onSelectionChange(selectedText)
      }
    },
  })

  useEffect(() => {
    if (editor && initialContent) {
      const contentStr = JSON.stringify(initialContent)
      if (contentStr !== lastContentRef.current) {
        editor.commands.setContent(initialContent, false)
        lastContentRef.current = contentStr
      }
    }
  }, [editor, initialContent])

  useImperativeHandle(ref, () => ({
    getEditor: () => editor,
    insertContent: (text: string) => {
      editor?.chain().focus().insertContent(text).run()
    },
  }), [editor])

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-editor-bg">
      <EditorToolbar editor={editor} docId={docId} />
      <div className="px-2 py-1 border-b border-editor-border">
        <MemoizedAIToolbar
          editorContent={editorContent || ''}
          onInsertContent={(text) => editor?.chain().focus().insertContent(text).run()}
        />
      </div>
      <div className="flex-1 overflow-y-auto">
        <EditorContent editor={editor} className="min-h-full" />
      </div>
      {isConnected && <CollaboratorBar />}
    </div>
  )
})

function CollaboratorBar() {
  const collaborators = useCollaborationStore((s) => s.collaborators)

  return (
    <div className="flex items-center gap-2 px-2 py-1 border-t border-editor-border bg-editor-surface/50">
      <span className="text-[10px] text-editor-muted">协作:</span>
      {collaborators.map((c) => (
        <div key={c.id} className="flex items-center gap-1">
          <div className="w-2 h-2 rounded-full" style={{ backgroundColor: c.color }} />
          <span className="text-[10px] text-editor-muted">{c.name}</span>
        </div>
      ))}
      {collaborators.length === 0 && (
        <span className="text-[10px] text-editor-muted">无其他协作者</span>
      )}
    </div>
  )
}

function extractText(doc: any): string {
  if (!doc?.content) return ''
  let text = ''
  const walk = (node: any) => {
    if (node.type === 'text') {
      text += node.text || ''
    }
    if (node.content) {
      node.content.forEach(walk)
    }
  }
  doc.content.forEach(walk)
  return text
}

function computeDiff(oldText: string, newText: string): Omit<Operation, 'id' | 'userId' | 'timestamp' | 'version'> | null {
  if (oldText === newText) return null

  let start = 0
  while (start < oldText.length && start < newText.length && oldText[start] === newText[start]) {
    start++
  }

  let endOld = oldText.length
  let endNew = newText.length
  while (endOld > start && endNew > start && oldText[endOld - 1] === newText[endNew - 1]) {
    endOld--
    endNew--
  }

  const deletedLength = endOld - start
  const insertedText = newText.slice(start, endNew)

  if (deletedLength > 0 && insertedText.length > 0) {
    return { documentId: '', type: 'replace', position: start, content: insertedText, length: deletedLength }
  } else if (deletedLength > 0) {
    return { documentId: '', type: 'delete', position: start, length: deletedLength }
  } else if (insertedText.length > 0) {
    return { documentId: '', type: 'insert', position: start, content: insertedText }
  }

  return null
}

Editor.displayName = 'Editor'

export default Editor
