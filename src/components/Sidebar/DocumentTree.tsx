import { useState, useRef, useMemo, useCallback } from 'react'
import { useDocumentStore, type Document, type Folder } from '../../store/documentStore'
import { useTabStore } from '../../store/tabStore'
import ConfirmDialog from '../common/ConfirmDialog'

const TYPE_ICONS: Record<string, string> = {
  chapter: '📄',
  scene: '🎬',
  character: '👤',
  code_snippet: '💻',
}

interface FolderNodeProps {
  folder: Folder
  documents: Document[]
  folders: Folder[]
  expandedFolders: Set<string>
  onToggle: (folderId: string) => void
  onSelect: (id: string) => void
  onRename: (id: string, newTitle: string) => void
  onDelete: (id: string) => void
  onMoveToFolder: (docId: string, folderId: string | null) => void
  onRenameFolder: (id: string) => void
  onDeleteFolder: (folder: Folder) => void
  editingFolderId: string | null
  editingFolderName: string
  setEditingFolderName: (name: string) => void
  onSaveFolderName: () => void
  onCancelEditFolder: () => void
  currentDocId: string | null
}

function FolderNode({
  folder,
  documents,
  folders,
  expandedFolders,
  onToggle,
  onSelect,
  onRename,
  onDelete,
  onMoveToFolder,
  onRenameFolder,
  onDeleteFolder,
  editingFolderId,
  editingFolderName,
  setEditingFolderName,
  onSaveFolderName,
  onCancelEditFolder,
  currentDocId,
}: FolderNodeProps) {
  const [showMenu, setShowMenu] = useState(false)
  const [isDragOver, setIsDragOver] = useState(false)
  const isExpanded = expandedFolders.has(folder.id)
  const isEditing = editingFolderId === folder.id
  const inputRef = useRef<HTMLInputElement>(null)

  const subFolders = useMemo(() => folders.filter((f) => f.parentId === folder.id), [folders, folder.id])
  const folderDocs = useMemo(() => documents.filter((d) => d.folderId === folder.id), [documents, folder.id])

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragOver(true)
  }

  const handleDragLeave = () => {
    setIsDragOver(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragOver(false)

    const docId = e.dataTransfer.getData('text/plain')
    if (docId) {
      onMoveToFolder(docId, folder.id)
    }
  }

  return (
    <div>
      <div
        className={`flex items-center gap-1 px-2 py-1.5 rounded cursor-pointer text-sm group ${
          isDragOver ? 'bg-editor-accent/20 border border-dashed border-editor-accent' : 'hover:bg-editor-surface/50'
        }`}
        onClick={() => onToggle(folder.id)}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <span className="text-xs">{isExpanded ? '📂' : '📁'}</span>
        {isEditing ? (
          <input
            ref={inputRef}
            className="flex-1 bg-editor-bg border border-editor-accent rounded px-1 py-0.5 text-sm text-editor-text outline-none"
            value={editingFolderName}
            onChange={(e) => setEditingFolderName(e.target.value)}
            onBlur={onSaveFolderName}
            onKeyDown={(e) => {
              if (e.key === 'Enter') onSaveFolderName()
              if (e.key === 'Escape') onCancelEditFolder()
            }}
            onClick={(e) => e.stopPropagation()}
            autoFocus
          />
        ) : (
          <span className="flex-1 truncate">{folder.name}</span>
        )}
        <button
          className="text-xs opacity-0 group-hover:opacity-100 hover:text-editor-red px-1"
          onClick={(e) => { e.stopPropagation(); onDeleteFolder(folder) }}
          title="删除文件夹"
        >
          ×
        </button>
      </div>
      {isExpanded && (
        <div className="ml-4">
          {subFolders.map((subFolder) => (
            <FolderNode
              key={subFolder.id}
              folder={subFolder}
              documents={documents}
              folders={folders}
              expandedFolders={expandedFolders}
              onToggle={onToggle}
              onSelect={onSelect}
              onRename={onRename}
              onDelete={onDelete}
              onMoveToFolder={onMoveToFolder}
              onRenameFolder={onRenameFolder}
              onDeleteFolder={onDeleteFolder}
              editingFolderId={editingFolderId}
              editingFolderName={editingFolderName}
              setEditingFolderName={setEditingFolderName}
              onSaveFolderName={onSaveFolderName}
              onCancelEditFolder={onCancelEditFolder}
              currentDocId={currentDocId}
            />
          ))}
          {folderDocs.map((doc) => (
            <TreeNode
              key={doc.id}
              doc={doc}
              isActive={doc.id === currentDocId}
              onSelect={onSelect}
              onDragStart={() => {}}
              onDragOver={() => {}}
              onDrop={() => {}}
              onRename={onRename}
              onDelete={onDelete}
              dragOverId={null}
            />
          ))}
        </div>
      )}
    </div>
  )
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
  const folders = useDocumentStore((s) => s.folders)
  const currentDocId = useDocumentStore((s) => s.currentDocId)
  const setCurrentDoc = useDocumentStore((s) => s.setCurrentDoc)
  const addDoc = useDocumentStore((s) => s.addDoc)
  const updateDoc = useDocumentStore((s) => s.updateDoc)
  const addFolder = useDocumentStore((s) => s.addFolder)
  const removeFolder = useDocumentStore((s) => s.removeFolder)
  const renameFolder = useDocumentStore((s) => s.renameFolder)
  const moveDocToFolder = useDocumentStore((s) => s.moveDocToFolder)
  const { openTab } = useTabStore()
  const [filter, setFilter] = useState('')
  const [filterInput, setFilterInput] = useState('')
  const [dragOverId, setDragOverId] = useState<string | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Document | null>(null)
  const [deleteFolderTarget, setDeleteFolderTarget] = useState<Folder | null>(null)
  const [editingFolderId, setEditingFolderId] = useState<string | null>(null)
  const [editingFolderName, setEditingFolderName] = useState('')
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set())
  const draggedIdRef = useRef<string | null>(null)

  const debouncedSetFilter = useMemo(() => debounce((v: string) => setFilter(v), 200), [])

  const chapters = useMemo(() => documents.filter((d) => d.type === 'chapter' && !d.folderId && d.title.toLowerCase().includes(filter.toLowerCase())), [documents, filter])
  const characters = useMemo(() => documents.filter((d) => d.type === 'character' && !d.folderId && d.title.toLowerCase().includes(filter.toLowerCase())), [documents, filter])
  const scenes = useMemo(() => documents.filter((d) => d.type === 'scene' && !d.folderId && d.title.toLowerCase().includes(filter.toLowerCase())), [documents, filter])
  const rootFolders = useMemo(() => folders.filter((f) => !f.parentId), [folders])
  const hasResults = chapters.length > 0 || characters.length > 0 || scenes.length > 0 || rootFolders.length > 0

  const handleCreate = async (type: Document['type']) => {
    const labels: Record<string, string> = { chapter: '新章节', scene: '新场景', character: '新人物', code_snippet: '新代码片段' }
    const id = await addDoc({ title: labels[type], type, content: { type: 'doc', content: [{ type: 'paragraph' }] }, parentId: null, folderId: null })
    setCurrentDoc(id)
    openTab(id, labels[type])
  }

  const handleImport = async () => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = '.txt,.md,.json'
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0]
      if (!file) return

      const { importFile } = await import('../../utils/importFile')
      const doc = await importFile(file)
      if (doc) {
        const id = await addDoc({ ...doc, folderId: null })
        setCurrentDoc(id)
        openTab(id, doc.title)
      }
    }
    input.click()
  }

  const handleSelect = useCallback((docId: string) => {
    setCurrentDoc(docId)
    const doc = documents.find((d) => d.id === docId)
    if (doc) {
      openTab(docId, doc.title)
    }
  }, [setCurrentDoc, documents, openTab])

  const handleCreateFolder = () => {
    const id = addFolder('新文件夹')
    setEditingFolderId(id)
    setEditingFolderName('新文件夹')
  }

  const handleRenameFolder = () => {
    if (editingFolderId && editingFolderName.trim()) {
      renameFolder(editingFolderId, editingFolderName.trim())
    }
    setEditingFolderId(null)
  }

  const handleDeleteFolder = () => {
    if (deleteFolderTarget) {
      removeFolder(deleteFolderTarget.id)
      setDeleteFolderTarget(null)
    }
  }

  const toggleFolder = (folderId: string) => {
    setExpandedFolders((prev) => {
      const next = new Set(prev)
      if (next.has(folderId)) {
        next.delete(folderId)
      } else {
        next.add(folderId)
      }
      return next
    })
  }

  const handleRename = useCallback((id: string, newTitle: string) => {
    updateDoc(id, { title: newTitle })
  }, [updateDoc])

  const handleDelete = useCallback((id: string) => {
    const doc = documents.find((d) => d.id === id)
    if (doc) setDeleteTarget(doc)
  }, [documents])

  const confirmDelete = async () => {
    if (deleteTarget) {
      await useDocumentStore.getState().removeDoc(deleteTarget.id)
      useTabStore.getState().closeTab(deleteTarget.id)
      const newActiveId = useTabStore.getState().activeTabId
      if (newActiveId) {
        useDocumentStore.getState().setCurrentDoc(newActiveId)
      } else {
        useDocumentStore.getState().setCurrentDoc(null)
      }
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
          <button className="text-xs text-editor-muted hover:text-editor-text hover:bg-editor-surface px-2 py-1 rounded" onClick={handleCreateFolder} title="新建文件夹">
            📂
          </button>
          <button className="text-xs text-editor-muted hover:text-editor-text hover:bg-editor-surface px-2 py-1 rounded" onClick={handleImport} title="导入本地文件">
            📁
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-2 space-y-3">
        {filter && !hasResults && (
          <p className="text-center text-editor-muted text-sm mt-4">未找到匹配的文档</p>
        )}

        {rootFolders.map((folder) => (
          <FolderNode
            key={folder.id}
            folder={folder}
            documents={documents}
            folders={folders}
            expandedFolders={expandedFolders}
            onToggle={toggleFolder}
            onSelect={handleSelect}
            onRename={handleRename}
            onDelete={handleDelete}
            onMoveToFolder={moveDocToFolder}
            onRenameFolder={setEditingFolderId}
            onDeleteFolder={setDeleteFolderTarget}
            editingFolderId={editingFolderId}
            editingFolderName={editingFolderName}
            setEditingFolderName={setEditingFolderName}
            onSaveFolderName={handleRenameFolder}
            onCancelEditFolder={() => setEditingFolderId(null)}
            currentDocId={currentDocId}
          />
        ))}

        {chapters.length > 0 && (
          <div>
            <h3 className="text-xs text-editor-muted uppercase tracking-wider px-3 mb-1">章节</h3>
            {chapters.map((doc) => (
              <TreeNode key={doc.id} doc={doc} isActive={doc.id === currentDocId} onSelect={handleSelect} onDragStart={handleDragStart} onDragOver={handleDragOver} onDrop={handleDrop} onRename={handleRename} onDelete={handleDelete} dragOverId={dragOverId} />
            ))}
          </div>
        )}

        {scenes.length > 0 && (
          <div>
            <h3 className="text-xs text-editor-muted uppercase tracking-wider px-3 mb-1">场景</h3>
            {scenes.map((doc) => (
              <TreeNode key={doc.id} doc={doc} isActive={doc.id === currentDocId} onSelect={handleSelect} onDragStart={handleDragStart} onDragOver={handleDragOver} onDrop={handleDrop} onRename={handleRename} onDelete={handleDelete} dragOverId={dragOverId} />
            ))}
          </div>
        )}

        {characters.length > 0 && (
          <div>
            <h3 className="text-xs text-editor-muted uppercase tracking-wider px-3 mb-1">人物</h3>
            {characters.map((doc) => (
              <TreeNode key={doc.id} doc={doc} isActive={doc.id === currentDocId} onSelect={handleSelect} onDragStart={handleDragStart} onDragOver={handleDragOver} onDrop={handleDrop} onRename={handleRename} onDelete={handleDelete} dragOverId={dragOverId} />
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

      <ConfirmDialog
        open={!!deleteFolderTarget}
        title="删除文件夹"
        message={`确定要删除文件夹「${deleteFolderTarget?.name}」吗？文件夹内的文档将被移动到根目录。`}
        confirmLabel="删除"
        danger
        onConfirm={handleDeleteFolder}
        onCancel={() => setDeleteFolderTarget(null)}
      />
    </div>
  )
}
