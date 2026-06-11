import { useState, useEffect } from 'react'
import { createBackup, getBackups, restoreBackup, exportBackup, deleteBackup, type Backup } from '../../services/backupService'
import Modal from '../common/Modal'

interface Props {
  onClose: () => void
}

export default function BackupManager({ onClose }: Props) {
  const [backups, setBackups] = useState<Backup[]>([])
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  useEffect(() => {
    loadBackups()
  }, [])

  const loadBackups = async () => {
    const data = await getBackups()
    setBackups(data)
  }

  const handleCreateBackup = async () => {
    setLoading(true)
    try {
      await createBackup()
      await loadBackups()
      setMessage({ type: 'success', text: '备份创建成功' })
    } catch {
      setMessage({ type: 'error', text: '备份创建失败' })
    }
    setLoading(false)
  }

  const handleRestore = async (backupId: string) => {
    setLoading(true)
    try {
      const success = await restoreBackup(backupId)
      if (success) {
        setMessage({ type: 'success', text: '恢复成功，请刷新页面' })
      } else {
        setMessage({ type: 'error', text: '恢复失败' })
      }
    } catch {
      setMessage({ type: 'error', text: '恢复失败' })
    }
    setLoading(false)
  }

  const handleExport = async () => {
    try {
      const data = await exportBackup()
      const blob = new Blob([data], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `novel-engine-backup-${new Date().toISOString().split('T')[0]}.json`
      a.click()
      URL.revokeObjectURL(url)
      setMessage({ type: 'success', text: '导出成功' })
    } catch {
      setMessage({ type: 'error', text: '导出失败' })
    }
  }

  const handleDelete = async (backupId: string) => {
    setLoading(true)
    try {
      await deleteBackup(backupId)
      await loadBackups()
      setMessage({ type: 'success', text: '删除成功' })
    } catch {
      setMessage({ type: 'error', text: '删除失败' })
    }
    setLoading(false)
  }

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleString('zh-CN')
  }

  return (
    <Modal open={true} onClose={onClose} title="💾 备份管理" size="md">
      <div className="p-4 space-y-4">
        {message && (
          <div className={`p-2 rounded text-sm ${message.type === 'success' ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'}`}>
            {message.text}
          </div>
        )}

        <div className="flex gap-2">
          <button
            onClick={handleCreateBackup}
            disabled={loading}
            className="px-4 py-2 bg-editor-accent text-editor-bg text-sm rounded hover:opacity-90 disabled:opacity-50"
          >
            创建备份
          </button>
          <button
            onClick={handleExport}
            disabled={loading}
            className="px-4 py-2 bg-editor-bg border border-editor-border text-editor-text text-sm rounded hover:border-editor-accent disabled:opacity-50"
          >
            导出备份
          </button>
        </div>

        <div className="space-y-2 max-h-60 overflow-y-auto">
          {backups.length === 0 ? (
            <p className="text-sm text-editor-muted text-center py-4">暂无备份</p>
          ) : (
            backups.map((backup) => (
              <div key={backup.id} className="flex items-center justify-between p-3 bg-editor-bg rounded border border-editor-border">
                <div>
                  <p className="text-sm text-editor-text">{formatDate(backup.timestamp)}</p>
                  <p className="text-xs text-editor-muted">
                    {backup.metadata.documentCount} 个文档, {backup.metadata.folderCount} 个文件夹
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleRestore(backup.id)}
                    disabled={loading}
                    className="px-2 py-1 text-xs text-editor-accent hover:bg-editor-surface rounded disabled:opacity-50"
                  >
                    恢复
                  </button>
                  <button
                    onClick={() => handleDelete(backup.id)}
                    disabled={loading}
                    className="px-2 py-1 text-xs text-red-500 hover:bg-red-500/10 rounded disabled:opacity-50"
                  >
                    删除
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </Modal>
  )
}
