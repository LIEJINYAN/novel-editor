import { useState, useRef } from 'react'
import { useDocumentStore, type Document } from '../../store/documentStore'

const TYPE_ICONS: Record<string, string> = {
  chapter: '📄',
  scene: '🎬',
  character: '👤',
  code_snippet: '💻',
}

interface TreeNodeProps {
  doc: Document
  isActive: boolean
  onSelect: (id: string) => void
  onDragStart: (e: React.DragEvent, docId: string) => void
  onDragOver: (e: React.DragEvent) => void
  onDrop: (e: React.DragEvent, docId: string) => void
  dragOverId: string | null
}

function TreeNode({ doc, isActive, onSelect, onDragStart, onDragOver, onDrop, dragOverId }: TreeNodeProps) {
  const [showMenu, setShowMenu] = useState(false)
  const isDragOver = dragOverId === doc.id

  return (
    <div className="relative">
      <div
        className={`flex items-center gap-2 px-3 py-1.5 rounded cursor-pointer text-sm group ${
          isActive ? 'bg-editor-surface text-editor-text' : 'text-editor-muted hover:text-editor-text hover:bg-editor-surface/50'
        } ${isDragOver ? 'border-t-2 border-editor-accent' : ''}`}
        onClick={() => onSelect(doc.id)}
        onContextMenu={(e) => { e.preventDefault(); setShowMenu(!showMenu) }}
        draggable
        onDragStart={(e) => onDragStart(e, doc.id)}
        onDragOver={onDragOver}
        onDrop={(e) => onDrop(e, doc.id)}
      >
        <span className="text-xs">{TYPE_ICONS[doc.type] || '📄'}</span>
        <span className="truncate flex-1">{doc.title}</span>
        <span className="text-xs text-editor-muted opacity-0 group-hover:opacity-100">
          {new Date(doc.updatedAt).toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' })}
        </span>
      </div>

      {showMenu && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setShowMenu(false)} />
          <div className="absolute left-4 top-full mt-1 z-20 bg-editor-surface border border-editor-border rounded-lg shadow-lg py-1 min-w-32">
            <button
              className="w-full text-left px-3 py-1.5 text-sm text-editor-text hover:bg-editor-border"
              onClick={() => { setShowMenu(false); onSelect(doc.id) }}
            >
              打开
            </button>
            <button
              className="w-full text-left px-3 py-1.5 text-sm text-editor-red hover:bg-editor-border"
              onClick={() => { setShowMenu(false); useDocumentStore.getState().removeDoc(doc.id) }}
            >
              删除
            </button>
          </div>
        </>
      )}
    </div>
  )
}

export default function DocumentTree() {
  const documents = useDocumentStore((s) => s.documents)
  const currentDocId = useDocumentStore((s) => s.currentDocId)
  const setCurrentDoc = useDocumentStore((s) => s.setCurrentDoc)
  const addDoc = useDocumentStore((s) => s.addDoc)
  const updateDoc = useDocumentStore((s) => s.updateDoc)
  const [filter, setFilter] = useState('')
  const [dragOverId, setDragOverId] = useState<string | null>(null)
  const draggedIdRef = useRef<string | null>(null)

  const chapters = documents.filter((d) => d.type === 'chapter' && d.title.includes(filter))
  const characters = documents.filter((d) => d.type === 'character' && d.title.includes(filter))
  const scenes = documents.filter((d) => d.type === 'scene' && d.title.includes(filter))

  const handleCreate = (type: Document['type']) => {
    const labels: Record<string, string> = { chapter: '新章节', scene: '新场景', character: '新人物', code_snippet: '新代码片段' }
    addDoc({ title: labels[type], type, content: { type: 'doc', content: [{ type: 'paragraph' }] }, parentId: null })
  }

  const handleDragStart = (e: React.DragEvent, docId: string) => {
    draggedIdRef.current = docId
    e.dataTransfer.effectAllowed = 'move'
    e.dataTransfer.setData('text/plain', docId)
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
  }

  const handleDrop = (e: React.DragEvent, targetId: string) => {
    e.preventDefault()
    const sourceId = draggedIdRef.current
    if (!sourceId || sourceId === targetId) {
      setDragOverId(null)
      return
    }

    const sourceDoc = documents.find((d) => d.id === sourceId)
    const targetDoc = documents.find((d) => d.id === targetId)

    if (sourceDoc && targetDoc && sourceDoc.type === targetDoc.type) {
      const sourceIndex = documents.findIndex((d) => d.id === sourceId)
      const targetIndex = documents.findIndex((d) => d.id === targetId)

      if (sourceIndex !== -1 && targetIndex !== -1) {
        const newDocs = [...documents]
        const [removed] = newDocs.splice(sourceIndex, 1)
        newDocs.splice(targetIndex, 0, removed)
        useDocumentStore.setState({ documents: newDocs })
      }
    }

    draggedIdRef.current = null
    setDragOverId(null)
  }

  const handleDragEnd = () => {
    draggedIdRef.current = null
    setDragOverId(null)
  }

  return (
    <div className="flex-1 flex flex-col min-h-0" onDragEnd={handleDragEnd}>
      <div className="p-3 border-b border-editor-border space-y-2">
        <div className="flex items-center gap-1">
          <input
            className="flex-1 bg-editor-surface text-editor-text text-xs px-2 py-1.5 rounded border border-editor-border outline-none placeholder:text-editor-muted"
            placeholder="搜索文档..."
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
          />
        </div>
        <div className="flex gap-1">
          {(['chapter', 'scene', 'character'] as const).map((type) => (
            <button
              key={type}
              className="text-xs text-editor-muted hover:text-editor-text hover:bg-editor-surface px-2 py-1 rounded"
              onClick={() => handleCreate(type)}
            >
              +{TYPE_ICONS[type]}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-2 space-y-3">
        {chapters.length > 0 && (
          <div>
            <h3 className="text-xs text-editor-muted uppercase tracking-wider px-3 mb-1">章节</h3>
            {chapters.map((doc) => (
              <TreeNode
                key={doc.id}
                doc={doc}
                isActive={doc.id === currentDocId}
                onSelect={setCurrentDoc}
                onDragStart={handleDragStart}
                onDragOver={handleDragOver}
                onDrop={handleDrop}
                dragOverId={dragOverId}
              />
            ))}
          </div>
        )}

        {scenes.length > 0 && (
          <div>
            <h3 className="text-xs text-editor-muted uppercase tracking-wider px-3 mb-1">场景</h3>
            {scenes.map((doc) => (
              <TreeNode
                key={doc.id}
                doc={doc}
                isActive={doc.id === currentDocId}
                onSelect={setCurrentDoc}
                onDragStart={handleDragStart}
                onDragOver={handleDragOver}
                onDrop={handleDrop}
                dragOverId={dragOverId}
              />
            ))}
          </div>
        )}

        {characters.length > 0 && (
          <div>
            <h3 className="text-xs text-editor-muted uppercase tracking-wider px-3 mb-1">人物</h3>
            {characters.map((doc) => (
              <TreeNode
                key={doc.id}
                doc={doc}
                isActive={doc.id === currentDocId}
                onSelect={setCurrentDoc}
                onDragStart={handleDragStart}
                onDragOver={handleDragOver}
                onDrop={handleDrop}
                dragOverId={dragOverId}
              />
            ))}
          </div>
        )}

        {documents.length === 0 && (
          <p className="text-center text-editor-muted text-sm mt-8">暂无文档，点击上方 + 创建</p>
        )}
      </div>
    </div>
  )
}
