import { useEffect, useCallback } from 'react'
import { getCurrentWebviewWindow } from '@tauri-apps/api/webviewWindow'
import { useDocumentStore } from '../store/documentStore'
import { useTabStore } from '../store/tabStore'
import * as tauriService from '../services/tauriService'

export function useMultiWindow() {
  const addDoc = useDocumentStore((s) => s.addDoc)
  const setCurrentDoc = useDocumentStore((s) => s.setCurrentDoc)
  const openTab = useTabStore((s) => s.openTab)

  const handleCreateNewWindow = useCallback(
    async (data: { title: string }) => {
      const id = await addDoc({
        title: data.title || '新文档',
        type: 'chapter',
        content: {
          type: 'doc',
          content: [{ type: 'paragraph', content: [{ type: 'text', text: '' }] }],
        },
        parentId: null,
      })
      setCurrentDoc(id)
      openTab(id, data.title || '新文档')
    },
    [addDoc, setCurrentDoc, openTab]
  )

  useEffect(() => {
    let unlisten: (() => void) | null = null

    async function setup() {
      if (typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window) {
        try {
          unlisten = await tauriService.onCreateNewWindow(handleCreateNewWindow)
        } catch {
          /* not in Tauri */
        }
      }
    }

    setup()

    return () => {
      unlisten?.()
    }
  }, [handleCreateNewWindow])

  const openInNewWindow = useCallback(async (url: string) => {
    const appWindow = getCurrentWebviewWindow()
    await appWindow.emit('create-new-window', { url })
  }, [])

  return { openInNewWindow }
}
