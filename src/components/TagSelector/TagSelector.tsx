import { useState, useRef, useEffect } from 'react'
import { useTagStore } from '../../store/tagStore'
import { useClickOutside } from '../../hooks/useClickOutside'

interface TagSelectorProps {
  docId: string
}

export default function TagSelector({ docId }: TagSelectorProps) {
  const { tags, addTagToDocument, removeTagFromDocument, getTagsForDocument } = useTagStore()
  const [isOpen, setIsOpen] = useState(false)
  const [newTagName, setNewTagName] = useState('')
  const { addTag } = useTagStore()
  const ref = useRef<HTMLDivElement>(null)

  useClickOutside(ref, () => setIsOpen(false))

  const docTags = getTagsForDocument(docId)
  const docTagIds = docTags.map((t) => t.id)

  const handleToggleTag = (tagId: string) => {
    if (docTagIds.includes(tagId)) {
      removeTagFromDocument(docId, tagId)
    } else {
      addTagToDocument(docId, tagId)
    }
  }

  const handleAddNewTag = async () => {
    if (!newTagName.trim()) return
    const tagId = await addTag(newTagName.trim())
    addTagToDocument(docId, tagId)
    setNewTagName('')
  }

  useEffect(() => {
    if (isOpen) {
      setNewTagName('')
    }
  }, [isOpen])

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="text-editor-muted hover:text-editor-text text-[10px]"
        title="管理标签"
      >
        {docTags.length > 0 ? (
          <span className="flex items-center gap-0.5">
            {docTags.slice(0, 3).map((tag) => (
              <span
                key={tag.id}
                className="w-1.5 h-1.5 rounded-full"
                style={{ backgroundColor: tag.color }}
              />
            ))}
            {docTags.length > 3 && <span>+{docTags.length - 3}</span>}
          </span>
        ) : (
          <span>🏷️</span>
        )}
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 mt-1 bg-editor-surface border border-editor-border rounded shadow-lg z-50 w-40">
          <div className="p-2 border-b border-editor-border">
            <div className="flex gap-1">
              <input
                type="text"
                value={newTagName}
                onChange={(e) => setNewTagName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAddNewTag()}
                placeholder="新标签..."
                className="flex-1 bg-editor-bg text-editor-text text-[10px] px-2 py-1 rounded border border-editor-border outline-none"
              />
              <button
                onClick={handleAddNewTag}
                disabled={!newTagName.trim()}
                className="px-2 py-1 bg-editor-accent text-editor-bg text-[10px] rounded hover:opacity-90 disabled:opacity-50"
              >
                +
              </button>
            </div>
          </div>
          <div className="max-h-32 overflow-y-auto">
            {tags.length === 0 ? (
              <p className="text-[10px] text-editor-muted text-center py-2">暂无标签</p>
            ) : (
              tags.map((tag) => (
                <button
                  key={tag.id}
                  onClick={() => handleToggleTag(tag.id)}
                  className={`w-full flex items-center gap-2 px-2 py-1 text-[10px] hover:bg-editor-bg ${
                    docTagIds.includes(tag.id) ? 'text-editor-text' : 'text-editor-muted'
                  }`}
                >
                  <span
                    className={`w-2 h-2 rounded-full ${
                      docTagIds.includes(tag.id) ? 'ring-1 ring-offset-1 ring-editor-accent' : ''
                    }`}
                    style={{ backgroundColor: tag.color }}
                  />
                  {tag.name}
                  {docTagIds.includes(tag.id) && <span className="ml-auto">✓</span>}
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )
}
