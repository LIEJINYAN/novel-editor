import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
  tiptapToMarkdown,
  tiptapToText,
  tiptapToHTML,
  exportToMarkdown,
  exportToText,
  exportToDOCX,
  exportToHTML,
  exportToEPUB,
  exportToPDF,
  exportToJSON,
  exportToOPML,
} from '../utils/export'

const mockContent = {
  type: 'doc',
  content: [
    {
      type: 'heading',
      attrs: { level: 1 },
      content: [{ type: 'text', text: '测试标题' }],
    },
    {
      type: 'paragraph',
      content: [
        { type: 'text', text: '这是一段' },
        { type: 'text', text: '测试内容', marks: [{ type: 'bold' }] },
      ],
    },
    {
      type: 'bulletList',
      content: [
        {
          type: 'listItem',
          content: [{ type: 'paragraph', content: [{ type: 'text', text: '列表项1' }] }],
        },
        {
          type: 'listItem',
          content: [{ type: 'paragraph', content: [{ type: 'text', text: '列表项2' }] }],
        },
      ],
    },
    {
      type: 'blockquote',
      content: [
        {
          type: 'paragraph',
          content: [{ type: 'text', text: '引用内容' }],
        },
      ],
    },
  ],
}

describe('Export Utilities', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('tiptapToMarkdown', () => {
    it('should convert headings', () => {
      const result = tiptapToMarkdown({
        type: 'doc',
        content: [
          {
            type: 'heading',
            attrs: { level: 1 },
            content: [{ type: 'text', text: '标题' }],
          },
        ],
      })
      expect(result).toContain('# 标题')
    })

    it('should convert paragraphs', () => {
      const result = tiptapToMarkdown({
        type: 'doc',
        content: [
          {
            type: 'paragraph',
            content: [{ type: 'text', text: '段落内容' }],
          },
        ],
      })
      expect(result).toContain('段落内容')
    })

    it('should convert bold text', () => {
      const result = tiptapToMarkdown({
        type: 'doc',
        content: [
          {
            type: 'paragraph',
            content: [
              { type: 'text', text: '加粗', marks: [{ type: 'bold' }] },
            ],
          },
        ],
      })
      expect(result).toContain('**加粗**')
    })

    it('should convert italic text', () => {
      const result = tiptapToMarkdown({
        type: 'doc',
        content: [
          {
            type: 'paragraph',
            content: [
              { type: 'text', text: '斜体', marks: [{ type: 'italic' }] },
            ],
          },
        ],
      })
      expect(result).toContain('*斜体*')
    })

    it('should convert bullet lists', () => {
      const result = tiptapToMarkdown(mockContent)
      expect(result).toContain('- 列表项1')
      expect(result).toContain('- 列表项2')
    })

    it('should convert blockquotes', () => {
      const result = tiptapToMarkdown(mockContent)
      expect(result).toContain('> 引用内容')
    })
  })

  describe('tiptapToText', () => {
    it('should extract plain text', () => {
      const result = tiptapToText(mockContent)
      expect(result).toContain('测试标题')
      expect(result).toContain('测试内容')
      expect(result).toContain('列表项1')
      expect(result).toContain('引用内容')
    })

    it('should not contain markdown syntax', () => {
      const result = tiptapToText(mockContent)
      expect(result).not.toContain('#')
      expect(result).not.toContain('**')
      expect(result).not.toContain('- ')
    })
  })

  describe('tiptapToHTML', () => {
    it('should convert to HTML headings', () => {
      const result = tiptapToHTML({
        type: 'doc',
        content: [
          {
            type: 'heading',
            attrs: { level: 2 },
            content: [{ type: 'text', text: '标题' }],
          },
        ],
      })
      expect(result).toContain('<h2>标题</h2>')
    })

    it('should convert to HTML paragraphs', () => {
      const result = tiptapToHTML({
        type: 'doc',
        content: [
          {
            type: 'paragraph',
            content: [{ type: 'text', text: '段落' }],
          },
        ],
      })
      expect(result).toContain('<p>段落</p>')
    })

    it('should convert to HTML bold', () => {
      const result = tiptapToHTML({
        type: 'doc',
        content: [
          {
            type: 'paragraph',
            content: [
              { type: 'text', text: '加粗', marks: [{ type: 'bold' }] },
            ],
          },
        ],
      })
      expect(result).toContain('<strong>加粗</strong>')
    })

    it('should convert to HTML lists', () => {
      const result = tiptapToHTML(mockContent)
      expect(result).toContain('<ul>')
      expect(result).toContain('<li>')
      expect(result).toContain('列表项1')
    })

    it('should convert to HTML blockquotes', () => {
      const result = tiptapToHTML(mockContent)
      expect(result).toContain('<blockquote>')
    })
  })

  describe('Export Functions', () => {
    let downloadSpy: ReturnType<typeof vi.fn>

    beforeEach(() => {
      downloadSpy = vi.fn()
      vi.spyOn(document, 'createElement').mockReturnValue({
        href: '',
        download: '',
        click: downloadSpy,
      } as any)
      vi.spyOn(document.body, 'appendChild').mockImplementation((node) => node)
      vi.spyOn(document.body, 'removeChild').mockImplementation((child) => child)
    })

    it('exportToMarkdown should create download', () => {
      exportToMarkdown('测试', mockContent)
      expect(downloadSpy).toHaveBeenCalled()
    })

    it('exportToText should create download', () => {
      exportToText('测试', mockContent)
      expect(downloadSpy).toHaveBeenCalled()
    })

    it('exportToDOCX should create download', () => {
      exportToDOCX('测试', mockContent)
      expect(downloadSpy).toHaveBeenCalled()
    })

    it('exportToHTML should create download', () => {
      exportToHTML('测试', mockContent)
      expect(downloadSpy).toHaveBeenCalled()
    })

    it('exportToEPUB should create download', () => {
      exportToEPUB('测试', mockContent)
      expect(downloadSpy).toHaveBeenCalled()
    })

    it('exportToJSON should create download', () => {
      exportToJSON('测试', mockContent)
      expect(downloadSpy).toHaveBeenCalled()
    })

    it('exportToOPML should create download', () => {
      exportToOPML('测试', mockContent)
      expect(downloadSpy).toHaveBeenCalled()
    })
  })
})
