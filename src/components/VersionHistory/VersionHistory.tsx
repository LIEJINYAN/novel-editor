import { useState } from 'react'
import { useDocumentStore } from '../../store/documentStore'

interface VersionHistoryProps {
  docId: string
  onClose: () => void
}

export default function VersionHistory({ docId, onClose }: VersionHistoryProps) {
  const getVersions = useDocumentStore((s) => s.getVersions)
  const createVersion = useDocumentStore((s) => s.createVersion)
  const restoreVersion = useDocumentStore((s) => s.restoreVersion)
  const versions = getVersions(docId)

  const handleCreateVersion = () => {
    createVersion(docId)
  }

  const handleRestore = (versionId: string) => {
    if (confirm('确定要恢复到此版本吗？当前内容将被替换。')) {
      restoreVersion(docId, versionId)
      onClose()
    }
  }

  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp)
    return date.toLocaleString('zh-CN', {
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-editor-surface rounded-lg shadow-xl w-96 max-h-[80vh] flex flex-col">
        <div className="p-4 border-b border-editor-border flex items-center justify-between">
          <h3 className="text-sm font-semibold text-editor-text">版本历史</h3>
          <button
            className="text-editor-muted hover:text-editor-text text-sm"
            onClick={onClose}
          >
            ✕
          </button>
        </div>

        <div className="p-3 border-b border-editor-border">
          <button
            className="w-full text-xs bg-editor-accent text-editor-bg px-3 py-2 rounded hover:opacity-90"
            onClick={handleCreateVersion}
          >
            + 保存当前版本
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-3 space-y-2">
          {versions.length === 0 ? (
            <p className="text-center text-editor-muted text-xs py-4">
              暂无历史版本
            </p>
          ) : (
            [...versions].reverse().map((version) => (
              <div
                key={version.id}
                className="p-3 bg-editor-bg rounded border border-editor-border hover:border-editor-accent transition-colors"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-editor-muted">
                    {formatTime(version.createdAt)}
                  </span>
                  <button
                    className="text-xs text-editor-accent hover:underline"
                    onClick={() => handleRestore(version.id)}
                  >
                    恢复
                  </button>
                </div>
                <p className="text-xs text-editor-text line-clamp-2">
                  {version.title}
                </p>
              </div>
            ))
          )}
        </div>

        <div className="p-3 border-t border-editor-border">
          <button
            className="w-full text-xs text-editor-muted px-3 py-2 rounded hover:bg-editor-bg"
            onClick={onClose}
          >
            关闭
          </button>
        </div>
      </div>
    </div>
  )
}
