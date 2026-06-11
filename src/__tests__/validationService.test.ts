import { describe, it, expect } from 'vitest'
import {
  validateDocument,
  validateTiptapContent,
  repairDocument,
} from '../services/validationService'

describe('validateDocument', () => {
  it('returns valid=false with error about empty for null', () => {
    const result = validateDocument(null)
    expect(result.valid).toBe(false)
    expect(result.errors[0]).toContain('空')
  })

  it('returns errors for missing id, title, content', () => {
    const result = validateDocument({})
    expect(result.valid).toBe(false)
    expect(result.errors).toContain('缺少有效的文档ID')
    expect(result.errors).toContain('缺少文档标题')
    expect(result.errors).toContain('缺少文档内容')
  })

  it('returns valid=true for a valid document', () => {
    const doc = {
      id: 'd1',
      title: 'Title',
      content: { type: 'doc', content: [] },
    }
    const result = validateDocument(doc)
    expect(result.valid).toBe(true)
    expect(result.errors).toHaveLength(0)
  })

  it('returns error for invalid content.type', () => {
    const doc = {
      id: 'd1',
      title: 'Title',
      content: { type: 'invalid', content: [] },
    }
    const result = validateDocument(doc)
    expect(result.valid).toBe(false)
    expect(result.errors).toContain('文档类型无效')
  })

  it('returns warning for unknown doc type', () => {
    const doc = {
      id: 'd1',
      title: 'Title',
      type: 'unknown_type',
      content: { type: 'doc', content: [] },
    }
    const result = validateDocument(doc)
    expect(result.valid).toBe(true)
    expect(result.warnings).toContain('未知的文档类型')
  })
})

describe('validateTiptapContent', () => {
  it('returns false for null', () => {
    expect(validateTiptapContent(null)).toBe(false)
  })

  it('returns true for valid doc with empty content array', () => {
    expect(validateTiptapContent({ type: 'doc', content: [] })).toBe(true)
  })

  it('returns false for non-doc type', () => {
    expect(validateTiptapContent({ type: 'paragraph' })).toBe(false)
  })
})

describe('repairDocument', () => {
  it('returns null for null input', () => {
    expect(repairDocument(null)).toBeNull()
  })

  it('fills id, title, type, content for empty object', () => {
    const result = repairDocument({})
    expect(result).not.toBeNull()
    expect(result!.id).toMatch(/^doc_repaired_/)
    expect(result!.title).toBe('未命名文档')
    expect(result!.type).toBe('chapter')
    expect(result!.content).toEqual({
      type: 'doc',
      content: [{ type: 'paragraph', content: [{ type: 'text', text: '' }] }],
    })
  })

  it('returns valid doc as-is', () => {
    const doc = {
      id: 'd1',
      title: 'T',
      type: 'scene' as const,
      content: { type: 'doc', content: [] },
      updatedAt: 123,
    }
    const result = repairDocument(doc)
    expect(result!.id).toBe('d1')
    expect(result!.title).toBe('T')
  })
})
