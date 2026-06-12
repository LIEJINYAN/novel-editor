import { useState } from 'react'
import { useTagStore, type Tag } from '../../store/tagStore'

interface TagManagerProps {
  docId?: string
  onClose?: () => void
}

const COLORS = [
  '#ef4444', '#f97316', '#eab308', '#22c55e',
  '#3b82f6', '#8b5cf6', '#ec4899', '#06b6d4',
  '#64748b', '#78716c',
]

export default function TagManager({ docId, onClose }: TagManagerProps) {
  const { tags, addTag, removeTag, updateTag, addTagToDocument, removeTagFromDocument, getTagsForDocument } = useTagStore()
  const [newTagName, setNewTagName] = useState('')
  const [newTagColor, setNewTagColor] = useState(COLORS[0])
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editName, setEditName] = useState('')

  const docTags = docId ? getTagsForDocument(docId) : []
  const docTagIds = docTags.map((t) => t.id)

  const handleAddTag = async () => {
    if (!newTagName.trim()) return
    const tagId = await addTag(newTagName.trim(), newTagColor)
    if (docId) {
      addTagToDocument(docId, tagId)
    }
    setNewTagName('')
  }

  const handleRemoveTag = (tagId: string) => {
    removeTag(tagId)
    if (docId) {
      removeTagFromDocument(docId, tagId)
    }
  }

  const handleToggleDocTag = (tagId: string) => {
    if (!docId) return
    if (docTagIds.includes(tagId)) {
      removeTagFromDocument(docId, tagId)
    } else {
      addTagToDocument(docId, tagId)
    }
  }

  const handleStartEdit = (tag: Tag) => {
    setEditingId(tag.id)
    setEditName(tag.name)
  }

  const handleSaveEdit = () => {
    if (!editingId || !editName.trim()) return
    updateTag(editingId, { name: editName.trim() })
    setEditingId(null)
  }

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-editor-text">标签管理</h3>
        {onClose && (
          <button onClick={onClose} className="text-editor-muted hover:text-editor-text text-sm">×</button>
        )}
      </div>

      <div className="flex gap-2">
        <input
          type="text"
          value={newTagName}
          onChange={(e) => setNewTagName(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleAddTag()}
          placeholder="新标签名..."
          className="flex-1 bg-editor-bg text-editor-text text-sm px-3 py-1.5 rounded border border-editor-border outline-none"
        />
        <div className="flex gap-1">
          {COLORS.slice(0, 5).map((color) => (
            <button
              key={color}
              onClick={() => setNewTagColor(color)}
              className={`w-5 h-5 rounded-full border-2 ${newTagColor === color ? 'border-editor-text' : 'border-transparent'}`}
              style={{ backgroundColor: color }}
            />
          ))}
        </div>
        <button
          onClick={handleAddTag}
          disabled={!newTagName.trim()}
          className="px-3 py-1.5 bg-editor-accent text-editor-bg text-xs rounded hover:opacity-90 disabled:opacity-50"
        >
          添加
        </button>
      </div>

      <div className="space-y-1 max-h-48 overflow-y-auto">
        {tags.length === 0 ? (
          <p className="text-xs text-editor-muted text-center py-4">暂无标签</p>
        ) : (
          tags.map((tag) => (
            <div
              key={tag.id}
              className="flex items-center gap-2 px-2 py-1.5 rounded hover:bg-editor-bg group"
            >
              <button
                onClick={() => handleToggleDocTag(tag.id)}
                className={`w-3 h-3 rounded-full border-2 flex-shrink-0 ${
                  docId && docTagIds.includes(tag.id)
                    ? 'border-editor-text'
                    : 'border-editor-border'
                }`}
                style={{ backgroundColor: tag.color }}
              />
              
              {editingId === tag.id ? (
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleSaveEdit()
                    if (e.key === 'Escape') setEditingId(null)
                  }}
                  onBlur={handleSaveEdit}
                  className="flex-1 bg-editor-bg text-editor-text text-xs px-2 py-1 rounded border border-editor-accent outline-none"
                  autoFocus
                />
              ) : (
                <span
                  className={`flex-1 text-xs ${
                    docId && docTagIds.includes(tag.id)
                      ? 'text-editor-text'
                      : 'text-editor-muted'
                  }`}
                  onClick={() => handleStartEdit(tag)}
                >
                  {tag.name}
                </span>
              )}
              
              <button
                onClick={() => handleRemoveTag(tag.id)}
                className="opacity-0 group-hover:opacity-100 text-red-500 hover:text-red-400 text-[10px]"
              >
                ×
              </button>
            </div>
          ))
        )}
      </div>

      {docId && (
        <div className="border-t border-editor-border pt-3">
          <p className="text-[10px] text-editor-muted mb-2">当前文档标签:</p>
          <div className="flex flex-wrap gap-1">
            {docTags.length === 0 ? (
              <span className="text-[10px] text-editor-muted">无标签</span>
            ) : (
              docTags.map((tag) => (
                <span
                  key={tag.id}
                  className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] rounded-full"
                  style={{ backgroundColor: tag.color + '20', color: tag.color }}
                >
                  {tag.name}
                  <button
                    onClick={() => removeTagFromDocument(docId, tag.id)}
                    className="hover:opacity-70"
                  >
                    ×
                  </button>
                </span>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )
}
