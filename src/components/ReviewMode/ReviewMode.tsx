import { useState, useCallback } from 'react'
import Modal from '../common/Modal'

interface Change {
  id: string
  type: 'insert' | 'delete' | 'replace'
  content: string
  originalContent?: string
  timestamp: number
  accepted: boolean
}

interface Props {
  onClose: () => void
  changes: Change[]
  onAccept: (id: string) => void
  onReject: (id: string) => void
  onAcceptAll: () => void
  onRejectAll: () => void
}

export default function ReviewMode({ onClose, changes, onAccept, onReject, onAcceptAll, onRejectAll }: Props) {
  const [filter, setFilter] = useState<'all' | 'pending' | 'accepted'>('all')

  const filteredChanges = changes.filter((c) => {
    if (filter === 'pending') return !c.accepted
    if (filter === 'accepted') return c.accepted
    return true
  })

  const pendingCount = changes.filter((c) => !c.accepted).length
  const acceptedCount = changes.filter((c) => c.accepted).length

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString()
  }

  return (
    <Modal open={true} onClose={onClose} title="📝 审阅模式" size="lg">
      <div className="flex flex-col h-[60vh]">
        <div className="p-3 border-b border-editor-border flex items-center justify-between">
          <div className="flex items-center gap-4">
            <span className="text-xs text-editor-muted">
              待审阅: <span className="text-yellow-500">{pendingCount}</span>
            </span>
            <span className="text-xs text-editor-muted">
              已接受: <span className="text-green-500">{acceptedCount}</span>
            </span>
          </div>
          <div className="flex items-center gap-2">
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value as typeof filter)}
              className="bg-editor-bg text-editor-text text-[10px] px-2 py-1 rounded border border-editor-border outline-none"
            >
              <option value="all">全部</option>
              <option value="pending">待审阅</option>
              <option value="accepted">已接受</option>
            </select>
            {pendingCount > 0 && (
              <>
                <button
                  onClick={onAcceptAll}
                  className="px-2 py-1 text-[10px] bg-green-500 text-white rounded hover:bg-green-600"
                >
                  全部接受
                </button>
                <button
                  onClick={onRejectAll}
                  className="px-2 py-1 text-[10px] bg-red-500/20 text-red-500 rounded hover:bg-red-500/30"
                >
                  全部拒绝
                </button>
              </>
            )}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-3 space-y-2">
          {filteredChanges.length === 0 ? (
            <div className="text-center text-editor-muted text-xs py-8">
              {changes.length === 0 ? '暂无修改记录' : '没有匹配的修改'}
            </div>
          ) : (
            filteredChanges.map((change) => (
              <div
                key={change.id}
                className={`p-3 rounded-lg border ${change.accepted ? 'bg-green-500/5 border-green-500/20' : 'bg-editor-bg'}`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`text-[10px] px-1.5 py-0.5 rounded ${
                        change.type === 'insert' ? 'bg-green-500/20 text-green-500' :
                        change.type === 'delete' ? 'bg-red-500/20 text-red-500' :
                        'bg-blue-500/20 text-blue-500'
                      }`}>
                        {change.type === 'insert' ? '新增' : change.type === 'delete' ? '删除' : '修改'}
                      </span>
                      <span className="text-[10px] text-editor-muted">{formatDate(change.timestamp)}</span>
                      {change.accepted && (
                        <span className="text-[10px] text-green-500">✓ 已接受</span>
                      )}
                    </div>

                    {change.type === 'delete' && change.content && (
                      <p className="text-xs text-red-500 line-through mt-1">{change.content}</p>
                    )}
                    {change.type === 'insert' && (
                      <p className="text-xs text-green-500 mt-1">{change.content}</p>
                    )}
                    {change.type === 'replace' && (
                      <div className="mt-1 space-y-1">
                        <p className="text-xs text-red-500 line-through">{change.originalContent}</p>
                        <p className="text-xs text-green-500">{change.content}</p>
                      </div>
                    )}
                  </div>

                  {!change.accepted && (
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => onAccept(change.id)}
                        className="px-2 py-1 text-[10px] bg-green-500 text-white rounded hover:bg-green-600"
                      >
                        接受
                      </button>
                      <button
                        onClick={() => onReject(change.id)}
                        className="px-2 py-1 text-[10px] bg-red-500/20 text-red-500 rounded hover:bg-red-500/30"
                      >
                        拒绝
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </Modal>
  )
}
