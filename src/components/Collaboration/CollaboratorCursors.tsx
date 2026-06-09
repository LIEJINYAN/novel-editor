import { useEffect, useState } from 'react'
import { useCollaborationStore } from '../../store/collaborationStore'

interface Cursor {
  position: number
  selection?: { from: number; to: number }
  color: string
  name: string
}

export default function CollaboratorCursors() {
  const { collaborators, isConnected } = useCollaborationStore()
  const [cursors, setCursors] = useState<Cursor[]>([])

  useEffect(() => {
    const handleCursorUpdate = (e: CustomEvent) => {
      const { userId, cursor, color, name } = e.detail
      setCursors((prev) => {
        const existing = prev.findIndex((c) => c.name === name)
        if (existing >= 0) {
          const updated = [...prev]
          updated[existing] = { ...cursor, color, name }
          return updated
        }
        return [...prev, { ...cursor, color, name }]
      })
    }

    const handleUserLeft = (e: CustomEvent) => {
      const { name } = e.detail
      setCursors((prev) => prev.filter((c) => c.name !== name))
    }

    window.addEventListener('collaboration-cursor', handleCursorUpdate as EventListener)
    window.addEventListener('collaboration-user-left', handleUserLeft as EventListener)

    return () => {
      window.removeEventListener('collaboration-cursor', handleCursorUpdate as EventListener)
      window.removeEventListener('collaboration-user-left', handleUserLeft as EventListener)
    }
  }, [])

  if (!isConnected || cursors.length === 0) return null

  return (
    <div className="absolute top-2 right-2 z-10">
      <div className="flex items-center gap-2 bg-editor-surface border border-editor-border rounded-lg px-3 py-2 shadow-sm">
        <span className="text-xs text-editor-muted">在线:</span>
        {cursors.map((cursor, index) => (
          <div
            key={index}
            className="flex items-center gap-1"
          >
            <div
              className="w-2 h-2 rounded-full"
              style={{ backgroundColor: cursor.color }}
            />
            <span className="text-xs text-editor-text">{cursor.name}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
