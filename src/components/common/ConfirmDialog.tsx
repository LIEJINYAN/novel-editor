import { useEffect, useRef } from 'react'
import Modal from './Modal'

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

export default function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = '确认',
  cancelLabel = '取消',
  danger = false,
  onConfirm,
  onCancel,
}: Props) {
  const confirmRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    if (open) {
      setTimeout(() => confirmRef.current?.focus(), 50)
    }
  }, [open])

  return (
    <Modal open={open} onClose={onCancel} title={title} size="sm">
      <div className="p-4">
        <p className="text-sm text-editor-text">{message}</p>
      </div>
      <div className="px-4 py-3 border-t border-editor-border flex justify-end gap-2">
        <button
          onClick={onCancel}
          className="px-3 py-1.5 text-xs text-editor-muted hover:text-editor-text hover:bg-editor-bg rounded transition-colors"
        >
          {cancelLabel}
        </button>
        <button
          ref={confirmRef}
          onClick={onConfirm}
          className={`px-3 py-1.5 text-xs rounded transition-colors ${
            danger
              ? 'bg-red-500 text-white hover:bg-red-600'
              : 'bg-editor-accent text-editor-bg hover:opacity-90'
          }`}
        >
          {confirmLabel}
        </button>
      </div>
    </Modal>
  )
}
