import { useState, useCallback, useEffect } from 'react'

interface FileImport {
  name: string
  content: string
  type: string
}

interface Options {
  accept?: string[]
  onImport: (files: FileImport[]) => void
}

async function isTauri(): Promise<boolean> {
  return typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window
}

async function readFileAsText(file: File): Promise<FileImport> {
  return new Promise((resolve) => {
    const reader = new FileReader()
    reader.onload = () =>
      resolve({
        name: file.name,
        content: reader.result as string,
        type: file.type,
      })
    reader.readAsText(file)
  })
}

export function useDragAndDrop({ accept = ['.txt', '.md', '.json'], onImport }: Options) {
  const [isDragging, setIsDragging] = useState(false)

  const handleBrowserDrop = useCallback(
    async (e: DragEvent) => {
      e.preventDefault()
      e.stopPropagation()
      setIsDragging(false)

      const files = Array.from(e.dataTransfer?.files || [])
      const validFiles = files.filter((f) =>
        accept.some((ext) => f.name.endsWith(ext))
      )

      if (validFiles.length === 0) return
      const imports = await Promise.all(validFiles.map(readFileAsText))
      onImport(imports)
    },
    [accept, onImport]
  )

  // Tauri native file drop
  useEffect(() => {
    let unlistenFn: (() => void) | null = null

    async function setupTauriDrop() {
      if (await isTauri()) {
        try {
          const { onFileDrop } = await import('../services/tauriService')
          unlistenFn = await onFileDrop(async (paths: string[]) => {
            const { readTextFile } = await import('@tauri-apps/plugin-fs')
            const imports: FileImport[] = []
            for (const path of paths) {
              const ext = path.split('.').pop()?.toLowerCase()
              if (accept.some((a) => a.endsWith(ext || ''))) {
                try {
                  const content = await readTextFile(path)
                  const name = path.split(/[/\\]/).pop() || 'unknown'
                  imports.push({ name, content, type: 'text/plain' })
                } catch { /* skip unreadable files */ }
              }
            }
            if (imports.length > 0) onImport(imports)
          })
        } catch { /* not in Tauri */ }
      }
    }

    setupTauriDrop()

    return () => {
      unlistenFn?.()
    }
  }, [accept, onImport])

  // Browser drag & drop
  useEffect(() => {
    const el = document.body

    const handleDragOver = (e: DragEvent) => {
      e.preventDefault()
      e.stopPropagation()
      setIsDragging(true)
    }

    const handleDragLeave = (e: DragEvent) => {
      e.preventDefault()
      e.stopPropagation()
      if (e.currentTarget === e.target) {
        setIsDragging(false)
      }
    }

    const handleDrop = (e: DragEvent) => {
      handleBrowserDrop(e)
    }

    el.addEventListener('dragover', handleDragOver)
    el.addEventListener('dragleave', handleDragLeave)
    el.addEventListener('drop', handleDrop)
    return () => {
      el.removeEventListener('dragover', handleDragOver)
      el.removeEventListener('dragleave', handleDragLeave)
      el.removeEventListener('drop', handleDrop)
    }
  }, [handleBrowserDrop])

  return { isDragging }
}
