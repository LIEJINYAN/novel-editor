import { useState, useEffect, useRef } from 'react'

interface Props {
  open: boolean
  title: string
  message: string
  confirmLabel?: string
  cancelLabel?: string
  danger?: boolean
  onConfirm: () => void
  onCancel: () => void
}

export default function DeleteConfirmDialog({
  open,
  title,
  message,
  confirmLabel = '确认',
  cancelLabel = '取消',
  danger = false,
  onConfirm,
  onCancel,
}: Props) {
  const [confirmText, setConfirmText] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (open) {
      setConfirmText('')
      setTimeout(() => inputRef.current?.focus(), 100)
    }
  }, [open])

  if (!open) return null

  const isConfirmEnabled = confirmText === '删除' || confirmText === 'delete'

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/50">
      <div className="bg-editor-surface border border-editor-border rounded-xl shadow-2xl p-6 w-96 max-w-[90vw]">
        <h3 className="text-lg font-semibold text-editor-text mb-2">{title}</h3>
        <p className="text-sm text-editor-muted mb-4">{message}</p>

        <div className="mb-4">
          <p className="text-xs text-editor-muted mb-1">
            请输入 <span className="font-mono font-bold text-editor-text">删除</span> 确认：
          </p>
          <input
            ref={inputRef}
            type="text"
            value={confirmText}
            onChange={(e) => setConfirmText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && isConfirmEnabled) {
                onConfirm()
              } else if (e.key === 'Escape') {
                onCancel()
              }
            }}
            placeholder={'输入"删除"确认'}
            className="w-full bg-editor-bg text-editor-text text-sm px-3 py-2 rounded border border-editor-border outline-none placeholder:text-editor-muted"
          />
        </div>

        <div className="flex gap-2 justify-end">
          <button
            onClick={onCancel}
            className="px-4 py-2 text-sm text-editor-muted hover:text-editor-text border border-editor-border rounded hover:bg-editor-bg transition-colors"
          >
            {cancelLabel}
          </button>
          <button
            onClick={onConfirm}
            disabled={!isConfirmEnabled}
            className={`px-4 py-2 text-sm rounded transition-colors ${
              danger
                ? 'bg-red-500 text-white hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed'
                : 'bg-editor-accent text-editor-bg hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed'
            }`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}
