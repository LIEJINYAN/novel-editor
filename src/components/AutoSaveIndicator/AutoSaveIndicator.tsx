import { useAutoSaveStore } from '../../store/autoSaveStore'

export default function AutoSaveIndicator() {
  const { isSaving, lastSaved, hasChanges } = useAutoSaveStore()

  const formatTime = (timestamp: number) => {
    const diff = Date.now() - timestamp
    if (diff < 60000) return '刚刚'
    if (diff < 3600000) return `${Math.floor(diff / 60000)}分钟前`
    return new Date(timestamp).toLocaleTimeString()
  }

  if (isSaving) {
    return (
      <span className="flex items-center gap-1 text-editor-accent" aria-live="polite">
        <span className="w-1.5 h-1.5 bg-editor-accent rounded-full animate-pulse" />
        保存中...
      </span>
    )
  }

  if (hasChanges) {
    return (
      <span className="flex items-center gap-1 text-yellow-500" aria-live="polite">
        <span className="w-1.5 h-1.5 bg-yellow-500 rounded-full" />
        未保存
      </span>
    )
  }

  if (lastSaved) {
    return (
      <span className="text-editor-muted" aria-live="polite">
        已保存 {formatTime(lastSaved)}
      </span>
    )
  }

  return null
}
