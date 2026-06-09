import { useState, useCallback } from 'react'
import { useDocumentStore } from '../../store/documentStore'

interface Props {
  docId: string
  onClose: () => void
}

export default function DocumentShare({ docId, onClose }: Props) {
  const getCurrentDoc = useDocumentStore((s) => s.getCurrentDoc)
  const doc = getCurrentDoc()
  const [copied, setCopied] = useState(false)
  const [shareUrl, setShareUrl] = useState('')

  const generateShareUrl = useCallback(() => {
    if (!doc) return
    const content = JSON.stringify(doc.content)
    const encoded = btoa(encodeURIComponent(content))
    const url = `${window.location.origin}${window.location.pathname}#/share/${docId}?data=${encoded.slice(0, 50)}...`
    setShareUrl(url)
    return url
  }, [doc, docId])

  const handleCopy = useCallback(async () => {
    const url = shareUrl || generateShareUrl()
    if (!url) return
    try {
      await navigator.clipboard.writeText(url)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {}
  }, [shareUrl, generateShareUrl])

  const handleExportMd = useCallback(() => {
    if (!doc) return
    const text = extractText(doc.content)
    const blob = new Blob([text], { type: 'text/markdown' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${doc.title}.md`
    a.click()
    URL.revokeObjectURL(url)
  }, [doc])

  const handleExportHtml = useCallback(() => {
    if (!doc) return
    const text = extractText(doc.content)
    const html = `<!DOCTYPE html>
<html><head><meta charset="utf-8"><title>${doc.title}</title>
<style>body{font-family:sans-serif;max-width:800px;margin:0 auto;padding:20px;line-height:1.8}
h1{color:#333}p{margin:1em 0}</style></head>
<body><h1>${doc.title}</h1>${text.split('\n').map(p => `<p>${p}</p>`).join('')}</body></html>`
    const blob = new Blob([html], { type: 'text/html' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${doc.title}.html`
    a.click()
    URL.revokeObjectURL(url)
  }, [doc])

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-editor-surface border border-editor-border rounded-lg shadow-2xl w-[400px]">
        <div className="flex items-center justify-between px-4 py-3 border-b border-editor-border">
          <h2 className="text-sm font-semibold text-editor-text">📤 分享文档</h2>
          <button onClick={onClose} className="text-editor-muted hover:text-editor-text">✕</button>
        </div>

        <div className="p-4 space-y-4">
          <div>
            <label className="text-xs text-editor-muted block mb-2">分享链接</label>
            <div className="flex gap-2">
              <input
                type="text"
                readOnly
                value={shareUrl || '点击生成链接'}
                className="flex-1 px-2 py-1.5 text-xs bg-editor-bg border border-editor-border rounded text-editor-text"
              />
              <button
                onClick={handleCopy}
                className={`px-3 py-1.5 text-xs rounded transition-colors ${copied ? 'bg-green-500 text-white' : 'bg-editor-accent text-editor-bg hover:opacity-90'}`}
              >
                {copied ? '已复制' : '复制'}
              </button>
            </div>
          </div>

          <div>
            <label className="text-xs text-editor-muted block mb-2">导出文件</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={handleExportMd}
                className="px-3 py-2 text-xs bg-editor-bg border border-editor-border rounded hover:border-editor-accent transition-colors"
              >
                📄 导出 Markdown
              </button>
              <button
                onClick={handleExportHtml}
                className="px-3 py-2 text-xs bg-editor-bg border border-editor-border rounded hover:border-editor-accent transition-colors"
              >
                🌐 导出 HTML
              </button>
            </div>
          </div>

          <div className="text-[10px] text-editor-muted">
            💡 提示：链接包含文档内容，可在任何浏览器中打开查看。
          </div>
        </div>

        <div className="p-3 border-t border-editor-border">
          <button className="w-full text-xs text-editor-muted px-3 py-2 rounded hover:bg-editor-bg" onClick={onClose}>关闭</button>
        </div>
      </div>
    </div>
  )
}

function extractText(content: any): string {
  if (!content?.content) return ''
  let text = ''
  const walk = (node: any) => {
    if (node.type === 'text') text += node.text || ''
    if (node.content) node.content.forEach(walk)
  }
  content.content.forEach(walk)
  return text
}
