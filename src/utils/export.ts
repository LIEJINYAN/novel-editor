interface TiptapNode {
  type: string
  content?: TiptapNode[]
  attrs?: Record<string, unknown>
  text?: string
  marks?: Array<{ type: string; attrs?: Record<string, unknown> }>
}

function escapeMarkdown(text: string): string {
  return text.replace(/([_*~`])/g, '\\$1')
}

function nodeToMarkdown(node: TiptapNode): string {
  if (node.type === 'text' && node.text) {
    let text = escapeMarkdown(node.text)
    if (node.marks) {
      for (const mark of node.marks) {
        switch (mark.type) {
          case 'bold':
            text = `**${text}**`
            break
          case 'italic':
            text = `*${text}*`
            break
          case 'strike':
            text = `~~${text}~~`
            break
          case 'code':
            text = `\`${text}\``
            break
          case 'highlight':
            text = `==${text}==`
            break
        }
      }
    }
    return text
  }

  if (!node.content) return ''

  const children = node.content.map(nodeToMarkdown).join('')

  switch (node.type) {
    case 'doc':
      return children

    case 'paragraph':
      return `${children}\n\n`

    case 'heading': {
      const level = (node.attrs?.level as number) || 1
      return `${'#'.repeat(level)} ${children}\n\n`
    }

    case 'bulletList':
      return children

    case 'orderedList':
      return children

    case 'listItem':
      return `- ${children}`

    case 'blockquote':
      return `> ${children}\n`

    case 'codeBlock': {
      const lang = (node.attrs?.language as string) || ''
      return `\`\`\`${lang}\n${children}\`\`\`\n\n`
    }

    case 'horizontalRule':
      return `---\n\n`

    case 'hardBreak':
      return '\n'

    case 'image':
      return `![${node.attrs?.alt || ''}](${node.attrs?.src || ''})\n\n`

    default:
      return children
  }
}

function nodeToText(node: TiptapNode): string {
  if (node.type === 'text' && node.text) {
    return node.text
  }

  if (!node.content) return ''

  const children = node.content.map(nodeToText).join('')

  switch (node.type) {
    case 'doc':
      return children

    case 'paragraph':
      return `${children}\n\n`

    case 'heading': {
      return `${children}\n\n`
    }

    case 'bulletList':
    case 'orderedList':
      return children

    case 'listItem':
      return `• ${children}`

    case 'blockquote':
      return `${children}\n`

    case 'codeBlock':
      return `${children}\n\n`

    case 'horizontalRule':
      return `\n${'─'.repeat(40)}\n\n`

    case 'hardBreak':
      return '\n'

    case 'image':
      return `[图片: ${node.attrs?.alt || ''}]`

    default:
      return children
  }
}

function nodeToHTML(node: TiptapNode): string {
  if (node.type === 'text' && node.text) {
    let text = node.text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')

    if (node.marks) {
      for (const mark of node.marks) {
        switch (mark.type) {
          case 'bold':
            text = `<strong>${text}</strong>`
            break
          case 'italic':
            text = `<em>${text}</em>`
            break
          case 'strike':
            text = `<s>${text}</s>`
            break
          case 'code':
            text = `<code>${text}</code>`
            break
          case 'highlight':
            text = `<mark>${text}</mark>`
            break
        }
      }
    }
    return text
  }

  if (!node.content) return ''

  const children = node.content.map(nodeToHTML).join('')

  switch (node.type) {
    case 'doc':
      return children

    case 'paragraph':
      return `<p>${children}</p>`

    case 'heading': {
      const level = (node.attrs?.level as number) || 1
      return `<h${level}>${children}</h${level}>`
    }

    case 'bulletList':
      return `<ul>${children}</ul>`

    case 'orderedList':
      return `<ol>${children}</ol>`

    case 'listItem':
      return `<li>${children}</li>`

    case 'blockquote':
      return `<blockquote>${children}</blockquote>`

    case 'codeBlock': {
      const lang = (node.attrs?.language as string) || ''
      return `<pre><code class="language-${lang}">${children}</code></pre>`
    }

    case 'horizontalRule':
      return `<hr>`

    case 'hardBreak':
      return `<br>`

    case 'image':
      return `<img src="${node.attrs?.src || ''}" alt="${node.attrs?.alt || ''}">`

    default:
      return children
  }
}

export function tiptapToMarkdown(content: object): string {
  const result = nodeToMarkdown(content as TiptapNode)
  return result.replace(/\n{3,}/g, '\n\n').trim()
}

export function tiptapToText(content: object): string {
  const result = nodeToText(content as TiptapNode)
  return result.replace(/\n{3,}/g, '\n\n').trim()
}

export function tiptapToHTML(content: object): string {
  const result = nodeToHTML(content as TiptapNode)
  return result
}

export function downloadFile(content: string, filename: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

export function exportToMarkdown(title: string, content: object) {
  const markdown = tiptapToMarkdown(content)
  downloadFile(`# ${title}\n\n${markdown}`, `${title}.md`, 'text/markdown')
}

export function exportToText(title: string, content: object) {
  const text = tiptapToText(content)
  downloadFile(`${title}\n\n${text}`, `${title}.txt`, 'text/plain')
}

export function exportToDOCX(title: string, content: object) {
  const html = tiptapToHTML(content)
  const docxContent = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<!DOCTYPE html>
<html xmlns:o="urn:schemas-microsoft-com:office:office"
      xmlns:w="urn:schemas-microsoft-com:office:word"
      xmlns="http://www.w3.org/TR/REC-html40">
<head>
  <meta charset="UTF-8">
  <title>${title}</title>
  <style>
    body { font-family: 'SimSun', serif; font-size: 12pt; line-height: 1.8; }
    h1 { font-size: 22pt; margin-bottom: 12pt; }
    h2 { font-size: 16pt; margin-top: 18pt; }
    h3 { font-size: 14pt; margin-top: 12pt; }
    p { margin: 6pt 0; }
    blockquote { margin-left: 36pt; border-left: 3pt solid #999; padding-left: 12pt; }
    code { background: #f0f0f0; padding: 2pt 4pt; }
    pre { background: #f5f5f5; padding: 12pt; white-space: pre-wrap; }
  </style>
</head>
<body>
  <h1>${title}</h1>
  ${html}
</body>
</html>`

  const blob = new Blob([docxContent], { type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${title}.docx`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

export function exportToHTML(title: string, content: object) {
  const html = tiptapToHTML(content)
  const fullHTML = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; line-height: 1.6; }
    h1, h2, h3 { margin-top: 1.5em; }
    code { background: #f4f4f4; padding: 2px 4px; border-radius: 3px; }
    pre { background: #f4f4f4; padding: 16px; border-radius: 6px; overflow-x: auto; }
    blockquote { border-left: 4px solid #ddd; margin: 0; padding-left: 16px; color: #666; }
    mark { background: #fff3cd; }
  </style>
</head>
<body>
  <h1>${title}</h1>
  ${html}
</body>
</html>`
  downloadFile(fullHTML, `${title}.html`, 'text/html')
}

export function exportToTXT(title: string, content: object) {
  const text = tiptapToText(content)
  downloadFile(`${title}\n\n${text}`, `${title}.txt`, 'text/plain')
}

export function exportToEPUB(title: string, content: object) {
  const html = tiptapToHTML(content)

  const epubContent = `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE html>
<html xmlns="http://www.w3.org/1999/xhtml" xmlns:epub="http://www.idpf.org/2007/ops">
<head>
  <meta charset="UTF-8">
  <title>${title}</title>
  <style>
    body { font-family: serif; line-height: 1.6; margin: 1em; }
    h1 { text-align: center; margin-top: 2em; }
    p { text-indent: 2em; margin: 0.5em 0; }
    blockquote { margin-left: 2em; font-style: italic; }
  </style>
</head>
<body>
  ${html}
</body>
</html>`

  downloadFile(epubContent, `${title}.xhtml`, 'application/xhtml+xml')
}

export function exportToPDF(title: string, content: object) {
  const html = tiptapToHTML(content)

  const printWindow = window.open('', '_blank')
  if (!printWindow) {
    alert('请允许弹出窗口以导出PDF')
    return
  }

  printWindow.document.write(`<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <title>${title}</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Noto Sans SC', sans-serif;
      max-width: 800px;
      margin: 0 auto;
      padding: 40px 20px;
      line-height: 1.8;
      color: #333;
    }
    h1 { font-size: 24px; border-bottom: 2px solid #333; padding-bottom: 8px; }
    h2 { font-size: 20px; margin-top: 24px; }
    h3 { font-size: 16px; margin-top: 20px; }
    p { margin: 12px 0; }
    code { background: #f0f0f0; padding: 2px 4px; border-radius: 3px; font-size: 14px; }
    pre { background: #f5f5f5; padding: 16px; border-radius: 6px; overflow-x: auto; }
    blockquote { border-left: 4px solid #ddd; margin: 16px 0; padding-left: 16px; color: #666; }
    mark { background: #fff3cd; }
    @media print {
      body { padding: 0; }
      h1 { page-break-after: avoid; }
    }
  </style>
</head>
<body>
  <h1>${title}</h1>
  ${html}
</body>
</html>`)

  printWindow.document.close()

  setTimeout(() => {
    printWindow.print()
  }, 500)
}
