import { useEffect, useCallback, useRef } from 'react'
import { useAutoSaveStore } from '../store/autoSaveStore'
import { useDocumentStore } from '../store/documentStore'

interface UseAutoSaveOptions {
  docId: string | null
  content: object | null
  onSave: () => Promise<void>
}

export function useAutoSave({ docId, content, onSave }: UseAutoSaveOptions) {
  const { strategy, interval, autoSaveEnabled, shouldSave, setSaving, setLastSaved, setLastSavedContent, setHasChanges } = useAutoSaveStore()
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const contentRef = useRef<string | null>(null)

  useEffect(() => {
    if (content) {
      const contentStr = JSON.stringify(content)
      if (contentStr !== contentRef.current) {
        contentRef.current = contentStr
        setHasChanges(true)
      }
    }
  }, [content, setHasChanges])

  const save = useCallback(async () => {
    if (!docId || !content) return

    const contentStr = JSON.stringify(content)
    if (!shouldSave(contentStr)) return

    try {
      setSaving(true)
      await onSave()
      setLastSaved(Date.now())
      setLastSavedContent(contentStr)
      setHasChanges(false)
    } catch (error) {
      console.error('Auto-save failed:', error)
    } finally {
      setSaving(false)
    }
  }, [docId, content, shouldSave, onSave, setSaving, setLastSaved, setLastSavedContent, setHasChanges])

  useEffect(() => {
    if (!autoSaveEnabled || strategy === 'manual') {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
        timeoutRef.current = null
      }
      return
    }

    if (strategy === 'auto' || strategy === 'smart') {
      intervalRef.current = setInterval(() => {
        save()
      }, interval)
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
    }
  }, [autoSaveEnabled, strategy, interval, save])

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [])

  return {
    save,
    isSaving: useAutoSaveStore((s) => s.isSaving),
    lastSaved: useAutoSaveStore((s) => s.lastSaved),
    hasChanges: useAutoSaveStore((s) => s.hasChanges),
  }
}
