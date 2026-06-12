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

export interface PDFStyleOptions {
  fontSize?: number
  fontFamily?: string
  lineHeight?: number
  marginTop?: number
  marginBottom?: number
  marginLeft?: number
  marginRight?: number
  pageBreakBefore?: boolean
  coverTitle?: string
  coverAuthor?: string
  coverImage?: string
  showCover?: boolean
}

export function exportToPDFWithStyle(
  title: string,
  content: object,
  options: PDFStyleOptions = {}
) {
  const {
    fontSize = 12,
    fontFamily = '-apple-system, BlinkMacSystemFont, "Segoe UI", "Noto Sans SC", sans-serif',
    lineHeight = 1.8,
    marginTop = 40,
    marginBottom = 40,
    marginLeft = 20,
    marginRight = 20,
    pageBreakBefore = false,
    coverTitle,
    coverAuthor,
    coverImage,
    showCover = false,
  } = options

  const html = tiptapToHTML(content)

  const printWindow = window.open('', '_blank')
  if (!printWindow) {
    alert('请允许弹出窗口以导出PDF')
    return
  }

  const coverHTML = showCover ? `
    <div class="cover-page">
      ${coverImage ? `<img src="${coverImage}" class="cover-image" alt="封面" />` : ''}
      <h1 class="cover-title">${coverTitle || title}</h1>
      ${coverAuthor ? `<p class="cover-author">${coverAuthor}</p>` : ''}
      <p class="cover-date">${new Date().toLocaleDateString('zh-CN')}</p>
    </div>
    <div class="page-break"></div>
  ` : ''

  printWindow.document.write(`<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <title>${title}</title>
  <style>
    @page {
      size: A4;
      margin: ${marginTop}pt ${marginRight}pt ${marginBottom}pt ${marginLeft}pt;
    }
    body {
      font-family: ${fontFamily};
      font-size: ${fontSize}pt;
      line-height: ${lineHeight};
      color: #333;
    }
    .cover-page {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      min-height: 80vh;
      text-align: center;
    }
    .cover-image {
      max-width: 300px;
      max-height: 400px;
      object-fit: contain;
      margin-bottom: 40px;
    }
    .cover-title {
      font-size: ${fontSize * 3}pt;
      font-weight: bold;
      margin-bottom: 20px;
    }
    .cover-author {
      font-size: ${fontSize * 1.5}pt;
      color: #666;
      margin-bottom: 10px;
    }
    .cover-date {
      font-size: ${fontSize}pt;
      color: #999;
    }
    .page-break {
      page-break-after: always;
    }
    h1 { font-size: ${fontSize * 2}pt; border-bottom: 2px solid #333; padding-bottom: 8px; ${pageBreakBefore ? 'page-break-before: always;' : ''} }
    h2 { font-size: ${fontSize * 1.5}pt; margin-top: ${fontSize * 2}pt; }
    h3 { font-size: ${fontSize * 1.2}pt; margin-top: ${fontSize * 1.5}pt; }
    p { margin: ${fontSize * 0.5}pt 0; }
    code { background: #f0f0f0; padding: 2px 4px; border-radius: 3px; font-size: ${fontSize * 0.9}pt; }
    pre { background: #f5f5f5; padding: ${fontSize}pt; border-radius: 6px; overflow-x: auto; }
    blockquote { border-left: 4px solid #ddd; margin: ${fontSize}pt 0; padding-left: ${fontSize}pt; color: #666; }
    mark { background: #fff3cd; }
    @media print {
      body { margin: 0; }
      .cover-page { page-break-after: always; }
      h1 { page-break-after: avoid; }
      h2 { page-break-after: avoid; }
      h3 { page-break-after: avoid; }
    }
  </style>
</head>
<body>
  ${coverHTML}
  <h1>${title}</h1>
  ${html}
</body>
</html>`)

  printWindow.document.close()

  setTimeout(() => {
    printWindow.print()
  }, 500)
}

function nodeToLaTeX(node: TiptapNode): string {
  if (node.type === 'text' && node.text) {
    let text = node.text.replace(/\\/g, '\\textbackslash{}')
      .replace(/[&%$#_{}]/g, '\\$&')
      .replace(/~/g, '\\textasciitilde{}')
      .replace(/\^/g, '\\textasciicircum{}')

    if (node.marks) {
      for (const mark of node.marks) {
        switch (mark.type) {
          case 'bold':
            text = `\\textbf{${text}}`
            break
          case 'italic':
            text = `\\textit{${text}}`
            break
          case 'strike':
            text = `\\sout{${text}}`
            break
          case 'code':
            text = `\\texttt{${text}}`
            break
        }
      }
    }
    return text
  }

  if (!node.content) return ''

  const children = node.content.map(nodeToLaTeX).join('')

  switch (node.type) {
    case 'doc':
      return `\\documentclass[12pt]{article}
\\usepackage[UTF8]{ctex}
\\usepackage{ulem}
\\usepackage{hyperref}
\\begin{document}
${children}
\\end{document}`

    case 'paragraph':
      return `${children}\n\n`

    case 'heading': {
      const level = (node.attrs?.level as number) || 1
      const env = ['section', 'subsection', 'subsubsection'][level - 1] || 'subsubsection'
      return `\\${env}{${children}}\n\n`
    }

    case 'bulletList':
      return `\\begin{itemize}\n${children}\\end{itemize}\n\n`

    case 'orderedList':
      return `\\begin{enumerate}\n${children}\\end{enumerate}\n\n`

    case 'listItem':
      return `\\item ${children}\n`

    case 'blockquote':
      return `\\begin{quote}\n${children}\\end{quote}\n\n`

    case 'codeBlock': {
      const lang = node.attrs?.language || ''
      return `\\begin{verbatim}\n${node.content?.map((c) => c.text || '').join('') || ''}\\end{verbatim}\n\n`
    }

    case 'horizontalRule':
      return `\\hrulefill\n\n`

    case 'hardBreak':
      return `\\\\\n`

    default:
      return children
  }
}

export function exportToLaTeX(title: string, content: object) {
  const latex = nodeToLaTeX(content as TiptapNode)
  const titleLatex = `\\title{${title}}\n\\maketitle\n\n`
  downloadFile(titleLatex + latex, `${title}.tex`, 'application/x-latex')
}

function nodeToRTF(node: TiptapNode): string {
  if (node.type === 'text' && node.text) {
    let text = node.text
      .replace(/\\/g, '\\\\')
      .replace(/\{/g, '\\{')
      .replace(/\}/g, '\\}')

    if (node.marks) {
      for (const mark of node.marks) {
        switch (mark.type) {
          case 'bold':
            text = `{\\b ${text}}`
            break
          case 'italic':
            text = `{\\i ${text}}`
            break
          case 'strike':
            text = `{\\strike ${text}}`
            break
        }
      }
    }
    return text
  }

  if (!node.content) return ''

  const children = node.content.map(nodeToRTF).join('')

  switch (node.type) {
    case 'doc':
      return `{\\rtf1\\ansi\\deff0
{\\fonttbl{\\f0 Times New Roman;}{\\f1 宋体;}}
\\f0\\fs24
${children}
}`

    case 'paragraph':
      return `${children}\\par\n`

    case 'heading': {
      const level = (node.attrs?.level as number) || 1
      const size = 24 + (6 - level) * 4
      return `{\\fs${size} \\b ${children}}\\par\n`
    }

    case 'bulletList':
      return `{\\pard\\fi-360\\li360\\fs24\n${children}\\par}`

    case 'orderedList':
      return `{\\pard\\fi-360\\li360\\fs24\n${children}\\par}`

    case 'listItem':
      return `{\\bullet\\tab ${children}\\par}`

    case 'blockquote':
      return `{\\pard\\li720\\fs24\\i ${children}\\par}`

    case 'codeBlock':
      return `{\\pard\\f1\\fs20 ${node.content?.map((c) => c.text || '').join('\\par\n') || ''}\\par}`

    case 'horizontalRule':
      return `{\\pard\\brdrb\\brdrs\\brdrw10\\brsp20 \\par}\n`

    case 'hardBreak':
      return `\\line\n`

    default:
      return children
  }
}

export function exportToRTF(title: string, content: object) {
  const rtf = nodeToRTF(content as TiptapNode)
  downloadFile(rtf, `${title}.rtf`, 'application/rtf')
}

export async function batchExport(
  documents: Array<{ title: string; content: object }>,
  format: 'markdown' | 'html' | 'txt' | 'pdf' | 'latex' | 'rtf' | 'json' | 'opml'
) {
  const exporters = {
    markdown: exportToMarkdown,
    html: exportToHTML,
    txt: exportToTXT,
    pdf: exportToPDF,
    latex: exportToLaTeX,
    rtf: exportToRTF,
    json: exportToJSON,
    opml: exportToOPML,
  }

  const exporter = exporters[format]
  if (!exporter) return

  for (const doc of documents) {
    exporter(doc.title, doc.content)
    await new Promise((resolve) => setTimeout(resolve, 300))
  }
}

export function exportToJSON(title: string, content: object) {
  const jsonData = {
    title,
    content,
    exportedAt: new Date().toISOString(),
    version: '1.0',
  }
  downloadFile(JSON.stringify(jsonData, null, 2), `${title}.json`, 'application/json')
}

function nodeToOPML(node: TiptapNode, indent: number = 0): string {
  const pad = '  '.repeat(indent)

  if (node.type === 'text' && node.text) {
    return node.text
  }

  if (!node.content) return ''

  switch (node.type) {
    case 'doc': {
      const items = node.content.map((child) => nodeToOPML(child, indent + 1)).filter(Boolean)
      return items.join('\n')
    }

    case 'heading': {
      const level = (node.attrs?.level as number) || 1
      const text = extractPlainText(node)
      return `${pad}<outline text="${escapeXML(text)}" _note="heading level ${level}">`
    }

    case 'paragraph': {
      const text = extractPlainText(node)
      if (!text) return ''
      return `${pad}<outline text="${escapeXML(text)}"/>`
    }

    case 'bulletList':
    case 'orderedList': {
      const items = node.content?.map((child) => nodeToOPML(child, indent)).filter(Boolean)
      return items?.join('\n') || ''
    }

    case 'listItem': {
      const text = extractPlainText(node)
      const children = node.content?.filter((c) => c.type === 'bulletList' || c.type === 'orderedList')
        .map((child) => nodeToOPML(child, indent + 1)).filter(Boolean)
      
      if (children && children.length > 0) {
        return `${pad}<outline text="${escapeXML(text)}">\n${children.join('\n')}\n${pad}</outline>`
      }
      return `${pad}<outline text="${escapeXML(text)}"/>`
    }

    case 'blockquote': {
      const text = extractPlainText(node)
      return `${pad}<outline text="${escapeXML(text)}" _note="blockquote"/>`
    }

    case 'codeBlock': {
      const lang = node.attrs?.language || 'text'
      const code = node.content?.map((c) => c.text || '').join('') || ''
      return `${pad}<outline text="${escapeXML(code)}" _note="code block: ${lang}"/>`
    }

    default: {
      const items = node.content?.map((child) => nodeToOPML(child, indent + 1)).filter(Boolean)
      return items?.join('\n') || ''
    }
  }
}

function extractPlainText(node: TiptapNode): string {
  if (node.type === 'text' && node.text) {
    return node.text
  }
  if (!node.content) return ''
  return node.content.map(extractPlainText).join('')
}

function escapeXML(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}

export function exportToOPML(title: string, content: object) {
  const body = nodeToOPML(content as TiptapNode)
  const opml = `<?xml version="1.0" encoding="UTF-8"?>
<opml version="2.0">
  <head>
    <title>${escapeXML(title)}</title>
    <dateCreated>${new Date().toUTCString()}</dateCreated>
  </head>
  <body>
${body}
  </body>
</opml>`
  downloadFile(opml, `${title}.opml`, 'application/xml')
}
