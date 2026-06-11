import type { Document } from '../store/documentStore'

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substr(2)
}

function fileToTiptapContent(text: string, isMarkdown: boolean): object {
  if (!isMarkdown) {
    return {
      type: 'doc',
      content: text.split('\n').map((line) => ({
        type: 'paragraph',
        content: [{ type: 'text', text: line }],
      })),
    }
  }

  const blocks: any[] = []
  const lines = text.split('\n')
  let i = 0

  while (i < lines.length) {
    const line = lines[i]

    if (line.startsWith('# ')) {
      blocks.push({
        type: 'heading',
        attrs: { level: 1 },
        content: [{ type: 'text', text: line.slice(2) }],
      })
    } else if (line.startsWith('## ')) {
      blocks.push({
        type: 'heading',
        attrs: { level: 2 },
        content: [{ type: 'text', text: line.slice(3) }],
      })
    } else if (line.startsWith('### ')) {
      blocks.push({
        type: 'heading',
        attrs: { level: 3 },
        content: [{ type: 'text', text: line.slice(4) }],
      })
    } else if (line.startsWith('---')) {
      blocks.push({ type: 'horizontalRule' })
    } else if (line.startsWith('> ')) {
      blocks.push({
        type: 'blockquote',
        content: [{ type: 'paragraph', content: [{ type: 'text', text: line.slice(2) }] }],
      })
    } else if (line.trim() === '') {
      // skip empty lines between blocks
    } else {
      const content: any[] = []
      let remaining = line

      const boldItalic = remaining.match(/\*\*\*(.+?)\*\*\*/)
      if (boldItalic) {
        content.push({ type: 'text', marks: [{ type: 'bold' }, { type: 'italic' }], text: boldItalic[1] })
        remaining = remaining.replace(boldItalic[0], '')
      }

      const bold = remaining.match(/\*\*(.+?)\*\*/)
      if (bold) {
        content.push({ type: 'text', marks: [{ type: 'bold' }], text: bold[1] })
        remaining = remaining.replace(bold[0], '')
      }

      const italic = remaining.match(/\*(.+?)\*/)
      if (italic) {
        content.push({ type: 'text', marks: [{ type: 'italic' }], text: italic[1] })
        remaining = remaining.replace(italic[0], '')
      }

      if (remaining.trim()) {
        content.push({ type: 'text', text: remaining })
      }

      if (content.length > 0) {
        blocks.push({ type: 'paragraph', content })
      }
    }

    i++
  }

  return { type: 'doc', content: blocks.length > 0 ? blocks : [{ type: 'paragraph' }] }
}

export async function importFile(file: File): Promise<Omit<Document, 'id' | 'updatedAt'> | null> {
  const text = await file.text()
  const ext = file.name.split('.').pop()?.toLowerCase()

  const title = file.name.replace(/\.[^/.]+$/, '')

  if (ext === 'json') {
    try {
      const data = JSON.parse(text)
      if (data.content && data.content.type === 'doc') {
        return {
          title: data.title || title,
          type: 'chapter',
          content: data.content,
          parentId: null,
        }
      }
    } catch {
      // not valid JSON document, treat as plain text
    }
  }

  const isMarkdown = ext === 'md' || ext === 'markdown'
  const content = fileToTiptapContent(text, isMarkdown)

  return {
    title,
    type: 'chapter',
    content,
    parentId: null,
  }
}
