import { useMemo } from 'react'
import VirtualList from '../VirtualList/VirtualList'

interface LongTextViewerProps {
  content: object
}

interface TextBlock {
  id: number
  text: string
  type: 'paragraph' | 'heading' | 'list-item'
}

function extractTextBlocks(content: object): TextBlock[] {
  const str = JSON.stringify(content)
  const blocks: TextBlock[] = []
  let id = 0

  const textRegex = /"text":"([^"]+)"/g
  let match
  while ((match = textRegex.exec(str)) !== null) {
    blocks.push({
      id: id++,
      text: match[1],
      type: 'paragraph',
    })
  }

  if (blocks.length === 0) {
    blocks.push({
      id: 0,
      text: '暂无内容',
      type: 'paragraph',
    })
  }

  return blocks
}

export default function LongTextViewer({ content }: LongTextViewerProps) {
  const blocks = useMemo(() => extractTextBlocks(content), [content])

  const renderItem = (block: TextBlock) => (
    <div className="px-4 py-2 border-b border-editor-border hover:bg-editor-surface/50">
      <p className="text-sm text-editor-text whitespace-pre-wrap break-words">
        {block.text}
      </p>
    </div>
  )

  return (
    <div className="h-full flex flex-col">
      <div className="px-4 py-2 border-b border-editor-border bg-editor-sidebar">
        <span className="text-xs text-editor-muted">
          共 {blocks.length} 个段落（虚拟滚动优化）
        </span>
      </div>
      <VirtualList
        items={blocks}
        itemHeight={40}
        renderItem={renderItem}
        className="flex-1"
      />
    </div>
  )
}
