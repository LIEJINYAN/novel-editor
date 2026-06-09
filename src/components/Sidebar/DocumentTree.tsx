import { useState, useRef, useMemo, useCallback } from 'react'
import { useDocumentStore, type Document } from '../../store/documentStore'
import ConfirmDialog from '../common/ConfirmDialog'

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
  onRename: (id: string, newTitle: string) => void
  onDelete: (id: string) => void
  dragOverId: string | null
}

function TreeNode({ doc, isActive, onSelect, onDragStart, onDragOver, onDrop, onRename, onDelete, dragOverId }: TreeNodeProps) {
  const [showMenu, setShowMenu] = useState(false)
  const [isRenaming, setIsRenaming] = useState(false)
  const [renameValue, setRenameValue] = useState(doc.title)
  const inputRef = useRef<HTMLInputElement>(null)
  const isDragOver = dragOverId === doc.id

  const handleRename = () => {
    if (renameValue.trim() && renameValue !== doc.title) {
      onRename(doc.id, renameValue.trim())
    }
    setIsRenaming(false)
  }

  return (
    <div className="relative">
      <div
        className={`flex items-center gap-2 px-3 py-1.5 rounded cursor-pointer text-sm group ${
          isActive ? 'bg-editor-surface text-editor-text' : 'text-editor-muted hover:text-editor-text hover:bg-editor-surface/50'
        } ${isDragOver ? 'border-t-2 border-editor-accent' : ''}`}
        onClick={() => onSelect(doc.id)}
        onDoubleClick={() => { setIsRenaming(true); setRenameValue(doc.title); setTimeout(() => inputRef.current?.focus(), 50) }}
        onContextMenu={(e) => { e.preventDefault(); setShowMenu(!showMenu) }}
        draggable={!isRenaming}
        onDragStart={(e) => onDragStart(e, doc.id)}
        onDragOver={onDragOver}
        onDrop={(e) => onDrop(e, doc.id)}
      >
        <span className="text-xs">{TYPE_ICONS[doc.type] || '📄'}</span>
        {isRenaming ? (
          <input
            ref={inputRef}
            className="flex-1 bg-editor-bg border border-editor-accent rounded px-1 py-0.5 text-sm text-editor-text outline-none"
            value={renameValue}
            onChange={(e) => setRenameValue(e.target.value)}
            onBlur={handleRename}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleRename()
              if (e.key === 'Escape') setIsRenaming(false)
            }}
            onClick={(e) => e.stopPropagation()}
            autoFocus
          />
        ) : (
          <span className="truncate flex-1">{doc.title}</span>
        )}
        <span className="text-xs text-editor-muted opacity-0 group-hover:opacity-100">
          {new Date(doc.updatedAt).toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' })}
        </span>
      </div>

      {showMenu && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setShowMenu(false)} />
          <div className="absolute left-4 top-full mt-1 z-20 bg-editor-surface border border-editor-border rounded-lg shadow-lg py-1 min-w-32">
            <button className="w-full text-left px-3 py-1.5 text-sm text-editor-text hover:bg-editor-border" onClick={() => { setShowMenu(false); onSelect(doc.id) }}>
              打开
            </button>
            <button className="w-full text-left px-3 py-1.5 text-sm text-editor-text hover:bg-editor-border" onClick={() => {
              setShowMenu(false)
              setIsRenaming(true)
              setRenameValue(doc.title)
              setTimeout(() => inputRef.current?.focus(), 50)
            }}>
              重命名
            </button>
            <button className="w-full text-left px-3 py-1.5 text-sm text-editor-red hover:bg-editor-border" onClick={() => { setShowMenu(false); onDelete(doc.id) }}>
              删除
            </button>
          </div>
        </>
      )}
    </div>
  )
}

function debounce<T extends (...args: any[]) => void>(fn: T, ms: number): T {
  let timer: ReturnType<typeof setTimeout>
  return ((...args: any[]) => {
    clearTimeout(timer)
    timer = setTimeout(() => fn(...args), ms)
  }) as T
}

export default function DocumentTree() {
  const documents = useDocumentStore((s) => s.documents)
  const currentDocId = useDocumentStore((s) => s.currentDocId)
  const setCurrentDoc = useDocumentStore((s) => s.setCurrentDoc)
  const addDoc = useDocumentStore((s) => s.addDoc)
  const updateDoc = useDocumentStore((s) => s.updateDoc)
  const [filter, setFilter] = useState('')
  const [filterInput, setFilterInput] = useState('')
  const [dragOverId, setDragOverId] = useState<string | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Document | null>(null)
  const draggedIdRef = useRef<string | null>(null)

  const debouncedSetFilter = useMemo(() => debounce((v: string) => setFilter(v), 200), [])

  const chapters = useMemo(() => documents.filter((d) => d.type === 'chapter' && d.title.toLowerCase().includes(filter.toLowerCase())), [documents, filter])
  const characters = useMemo(() => documents.filter((d) => d.type === 'character' && d.title.toLowerCase().includes(filter.toLowerCase())), [documents, filter])
  const scenes = useMemo(() => documents.filter((d) => d.type === 'scene' && d.title.toLowerCase().includes(filter.toLowerCase())), [documents, filter])
  const hasResults = chapters.length > 0 || characters.length > 0 || scenes.length > 0

  const handleCreate = (type: Document['type']) => {
    const labels: Record<string, string> = { chapter: '新章节', scene: '新场景', character: '新人物', code_snippet: '新代码片段' }
    addDoc({ title: labels[type], type, content: { type: 'doc', content: [{ type: 'paragraph' }] }, parentId: null })
  }

  const handleRename = useCallback((id: string, newTitle: string) => {
    updateDoc(id, { title: newTitle })
  }, [updateDoc])

  const handleDelete = useCallback((id: string) => {
    const doc = documents.find((d) => d.id === id)
    if (doc) setDeleteTarget(doc)
  }, [documents])

  const confirmDelete = () => {
    if (deleteTarget) {
      useDocumentStore.getState().removeDoc(deleteTarget.id)
      setDeleteTarget(null)
    }
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
            value={filterInput}
            onChange={(e) => { setFilterInput(e.target.value); debouncedSetFilter(e.target.value) }}
          />
        </div>
        <div className="flex gap-1">
          {(['chapter', 'scene', 'character'] as const).map((type) => (
            <button key={type} className="text-xs text-editor-muted hover:text-editor-text hover:bg-editor-surface px-2 py-1 rounded" onClick={() => handleCreate(type)}>
              +{TYPE_ICONS[type]}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-2 space-y-3">
        {filter && !hasResults && (
          <p className="text-center text-editor-muted text-sm mt-4">未找到匹配的文档</p>
        )}

        {chapters.length > 0 && (
          <div>
            <h3 className="text-xs text-editor-muted uppercase tracking-wider px-3 mb-1">章节</h3>
            {chapters.map((doc) => (
              <TreeNode key={doc.id} doc={doc} isActive={doc.id === currentDocId} onSelect={setCurrentDoc} onDragStart={handleDragStart} onDragOver={handleDragOver} onDrop={handleDrop} onRename={handleRename} onDelete={handleDelete} dragOverId={dragOverId} />
            ))}
          </div>
        )}

        {scenes.length > 0 && (
          <div>
            <h3 className="text-xs text-editor-muted uppercase tracking-wider px-3 mb-1">场景</h3>
            {scenes.map((doc) => (
              <TreeNode key={doc.id} doc={doc} isActive={doc.id === currentDocId} onSelect={setCurrentDoc} onDragStart={handleDragStart} onDragOver={handleDragOver} onDrop={handleDrop} onRename={handleRename} onDelete={handleDelete} dragOverId={dragOverId} />
            ))}
          </div>
        )}

        {characters.length > 0 && (
          <div>
            <h3 className="text-xs text-editor-muted uppercase tracking-wider px-3 mb-1">人物</h3>
            {characters.map((doc) => (
              <TreeNode key={doc.id} doc={doc} isActive={doc.id === currentDocId} onSelect={setCurrentDoc} onDragStart={handleDragStart} onDragOver={handleDragOver} onDrop={handleDrop} onRename={handleRename} onDelete={handleDelete} dragOverId={dragOverId} />
            ))}
          </div>
        )}

        {documents.length === 0 && (
          <p className="text-center text-editor-muted text-sm mt-8">暂无文档，点击上方 + 创建</p>
        )}
      </div>

      <ConfirmDialog
        open={!!deleteTarget}
        title="删除文档"
        message={`确定要删除「${deleteTarget?.title}」吗？此操作不可撤销。`}
        confirmLabel="删除"
        danger
        onConfirm={confirmDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  )
}
