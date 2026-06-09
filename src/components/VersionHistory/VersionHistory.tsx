import { useState, useMemo } from 'react'
import { useDocumentStore } from '../../store/documentStore'
import Modal from '../common/Modal'

interface VersionHistoryProps {
  docId: string
  onClose: () => void
  onRestore?: (content: object) => void
}

function extractText(doc: any): string {
  if (!doc?.content) return ''
  let text = ''
  const walk = (node: any) => {
    if (node.type === 'text') text += node.text || ''
    if (node.content) node.content.forEach(walk)
  }
  doc.content.forEach(walk)
  return text
}

function computeDiffStats(oldText: string, newText: string) {
  const added = newText.length - oldText.length
  const words = newText.split(/\s+/).length
  return { added, words }
}

export default function VersionHistory({ docId, onClose, onRestore }: VersionHistoryProps) {
  const getVersions = useDocumentStore((s) => s.getVersions)
  const createVersion = useDocumentStore((s) => s.createVersion)
  const restoreVersion = useDocumentStore((s) => s.restoreVersion)
  const versions = getVersions(docId)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [compareMode, setCompareMode] = useState(false)
  const [compareId, setCompareId] = useState<string | null>(null)

  const selectedVersion = useMemo(() => versions.find((v) => v.id === selectedId), [versions, selectedId])
  const compareVersion = useMemo(() => versions.find((v) => v.id === compareId), [versions, compareId])
  const diffStats = useMemo(() => {
    if (!selectedVersion || !compareVersion) return null
    return computeDiffStats(extractText(compareVersion.content), extractText(selectedVersion.content))
  }, [selectedVersion, compareVersion])

  const handleCreateVersion = () => createVersion(docId)
  const handleRestore = (versionId: string) => {
    const version = versions.find((v) => v.id === versionId)
    if (!version) return
    if (confirm('确定要恢复到此版本吗？当前内容将被替换。')) {
      restoreVersion(docId, versionId)
      onRestore?.(version.content)
      onClose()
    }
  }

  const formatTime = (timestamp: number) => new Date(timestamp).toLocaleString('zh-CN', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })
  const getPreview = (content: any) => extractText(content).slice(0, 100) || '（空内容）'

  return (
    <Modal open={true} onClose={onClose} title="📋 版本历史" size="lg">
      <div className="p-3 border-b border-editor-border">
        <div className="flex items-center gap-2">
          <button onClick={() => { setCompareMode(!compareMode); setCompareId(null) }}
            className={`text-xs px-2 py-1 rounded ${compareMode ? 'bg-editor-accent text-editor-bg' : 'text-editor-muted hover:bg-editor-bg'}`}>
            {compareMode ? '退出对比' : '对比模式'}
          </button>
          <button className="flex-1 text-xs bg-editor-accent text-editor-bg px-3 py-2 rounded hover:opacity-90" onClick={handleCreateVersion}>
            + 保存当前版本
          </button>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden" style={{ minHeight: '400px' }}>
        <div className="w-64 border-r border-editor-border overflow-y-auto">
          {versions.length === 0 ? (
            <p className="text-center text-editor-muted text-xs py-8">暂无历史版本</p>
          ) : (
            [...versions].reverse().map((version) => (
              <div key={version.id}
                className={`p-3 border-b border-editor-border cursor-pointer transition-colors ${
                  selectedId === version.id ? 'bg-editor-accent/10 border-l-2 border-l-editor-accent' : 'hover:bg-editor-bg/50'
                }`}
                onClick={() => { compareMode ? setCompareId(version.id) : setSelectedId(version.id) }}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[10px] text-editor-muted">{formatTime(version.createdAt)}</span>
                  {compareMode && compareId === version.id && (
                    <span className="text-[10px] px-1 bg-editor-accent text-editor-bg rounded">对比</span>
                  )}
                </div>
                <p className="text-xs text-editor-text truncate">{version.title}</p>
                <p className="text-[10px] text-editor-muted mt-1 truncate">{getPreview(version.content)}</p>
              </div>
            ))
          )}
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          {selectedVersion ? (
            <div>
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-xs font-medium text-editor-text">{formatTime(selectedVersion.createdAt)} — {selectedVersion.title}</h4>
                <button className="text-xs px-2 py-1 bg-green-500 text-white rounded hover:bg-green-600" onClick={() => handleRestore(selectedVersion.id)}>恢复此版本</button>
              </div>
              {diffStats && (
                <div className="flex gap-3 mb-3 text-[10px]">
                  <span className={diffStats.added >= 0 ? 'text-green-500' : 'text-red-500'}>{diffStats.added >= 0 ? '+' : ''}{diffStats.added} 字符</span>
                  <span className="text-editor-muted">{diffStats.words} 词</span>
                </div>
              )}
              <div className="bg-editor-bg rounded p-3 text-xs text-editor-text whitespace-pre-wrap max-h-[400px] overflow-y-auto">{getPreview(selectedVersion.content)}</div>
            </div>
          ) : (
            <p className="text-center text-editor-muted text-xs py-8">选择版本查看详情</p>
          )}
        </div>
      </div>

      <div className="p-3 border-t border-editor-border text-center">
        <span className="text-[10px] text-editor-muted">共 {versions.length} 个版本（最多20个）</span>
      </div>
    </Modal>
  )
}
