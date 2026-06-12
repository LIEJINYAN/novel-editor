import { useTagStore } from '../../store/tagStore'

interface TagFilterProps {
  selectedTagIds: string[]
  onToggleTag: (tagId: string) => void
  onClear: () => void
}

export default function TagFilter({ selectedTagIds, onToggleTag, onClear }: TagFilterProps) {
  const { tags } = useTagStore()

  if (tags.length === 0) return null

  return (
    <div className="px-2 py-1.5 border-b border-editor-border">
      <div className="flex items-center justify-between mb-1">
        <span className="text-[10px] text-editor-muted">按标签筛选</span>
        {selectedTagIds.length > 0 && (
          <button
            onClick={onClear}
            className="text-[10px] text-editor-accent hover:underline"
          >
            清除
          </button>
        )}
      </div>
      <div className="flex flex-wrap gap-1">
        {tags.map((tag) => {
          const isSelected = selectedTagIds.includes(tag.id)
          return (
            <button
              key={tag.id}
              onClick={() => onToggleTag(tag.id)}
              className={`inline-flex items-center gap-1 px-2 py-0.5 text-[10px] rounded-full border transition-colors ${
                isSelected
                  ? 'border-transparent text-white'
                  : 'border-editor-border text-editor-muted hover:text-editor-text'
              }`}
              style={isSelected ? { backgroundColor: tag.color } : {}}
            >
              <span
                className="w-2 h-2 rounded-full"
                style={{ backgroundColor: tag.color }}
              />
              {tag.name}
            </button>
          )
        })}
      </div>
    </div>
  )
}
