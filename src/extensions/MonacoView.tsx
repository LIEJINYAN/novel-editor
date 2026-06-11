import { useEffect, useRef, useState, useCallback } from 'react'
import type { NodeViewProps } from '@tiptap/react'
import { loadMonaco, loadLanguage } from '../utils/monacoLoader'

const SUPPORTED_LANGUAGES = [
  { id: 'plaintext', label: '纯文本' },
  { id: 'javascript', label: 'JavaScript' },
  { id: 'typescript', label: 'TypeScript' },
  { id: 'python', label: 'Python' },
  { id: 'html', label: 'HTML' },
  { id: 'css', label: 'CSS' },
  { id: 'json', label: 'JSON' },
  { id: 'markdown', label: 'Markdown' },
  { id: 'xml', label: 'XML' },
  { id: 'yaml', label: 'YAML' },
  { id: 'lua', label: 'Lua' },
]

export default function MonacoView({ node, updateAttributes, editor }: NodeViewProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const editorRef = useRef<any>(null)
  const [loaded, setLoaded] = useState(false)
  const [isFocused, setIsFocused] = useState(false)
  const monacoRef = useRef<any>(null)

  useEffect(() => {
    let cancelled = false

    loadMonaco().then((monaco) => {
      if (cancelled) return
      monacoRef.current = monaco
      setLoaded(true)
    })

    return () => {
      cancelled = true
    }
  }, [])

  const initEditor = useCallback(async () => {
    if (!containerRef.current || !monacoRef.current || editorRef.current) return

    const monaco = monacoRef.current
    const langId = node.attrs.language || 'plaintext'

    await loadLanguage(langId)

    const modelUri = monaco.Uri.parse(`file:///codeblock-${langId}.txt`)

    let model = monaco.editor.getModel(modelUri)
    if (!model) {
      model = monaco.editor.createModel(node.attrs.code || '', node.attrs.language || 'plaintext', modelUri)
    }

    const instance = monaco.editor.create(containerRef.current, {
      model,
      theme: 'vs-dark',
      automaticLayout: true,
      minimap: { enabled: false },
      scrollBeyondLastLine: false,
      fontSize: 13,
      lineNumbers: 'on',
      tabSize: 2,
      wordWrap: 'on',
    })

    instance.onDidChangeModelContent(() => {
      const newCode = instance.getValue()
      if (newCode !== node.attrs.code) {
        updateAttributes({ code: newCode })
      }
    })

    instance.onDidFocusEditorText(() => setIsFocused(true))
    instance.onDidBlurEditorText(() => setIsFocused(false))

    editorRef.current = instance
  }, [node.attrs.language, node.attrs.code, updateAttributes])

  useEffect(() => {
    if (loaded && !editorRef.current) {
      initEditor()
    }
  }, [loaded, initEditor])

  useEffect(() => {
    return () => {
      editorRef.current?.dispose()
      editorRef.current = null
    }
  }, [])

  useEffect(() => {
    if (!editorRef.current || !monacoRef.current) return
    const model = editorRef.current.getModel()
    if (model && model.getLanguageId() !== node.attrs.language) {
      monacoRef.current.editor.setModelLanguage(model, node.attrs.language || 'plaintext')
    }
  }, [node.attrs.language])

  const handleLanguageChange = (lang: string) => {
    updateAttributes({ language: lang })
    editor.commands.focus()
  }

  return (
    <div
      className={`my-4 rounded-lg overflow-hidden border-2 transition-colors ${
        isFocused ? 'border-editor-accent' : 'border-editor-border'
      }`}
      contentEditable={false}
    >
      <div className="flex items-center justify-between px-3 py-1.5 bg-editor-sidebar border-b border-editor-border">
        <select
          className="bg-editor-surface text-editor-text text-xs px-2 py-0.5 rounded border border-editor-border outline-none cursor-pointer"
          value={node.attrs.language || 'plaintext'}
          onChange={(e) => handleLanguageChange(e.target.value)}
        >
          {SUPPORTED_LANGUAGES.map((lang) => (
            <option key={lang.id} value={lang.id}>
              {lang.label}
            </option>
          ))}
        </select>
        <button
          className="text-xs text-editor-muted hover:text-editor-text px-2 py-0.5 rounded hover:bg-editor-surface"
          onClick={() => {
            const code = editorRef.current?.getValue() || ''
            navigator.clipboard.writeText(code)
          }}
        >
          复制
        </button>
      </div>
      <div ref={containerRef} className="h-48" />
    </div>
  )
}
