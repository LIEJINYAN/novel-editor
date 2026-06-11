import type { Document } from '../store/documentStore'

export interface ValidationResult {
  valid: boolean
  errors: string[]
  warnings: string[]
}

export function validateDocument(doc: any): ValidationResult {
  const errors: string[] = []
  const warnings: string[] = []

  if (!doc) {
    return { valid: false, errors: ['文档为空'], warnings: [] }
  }

  if (!doc.id || typeof doc.id !== 'string') {
    errors.push('缺少有效的文档ID')
  }

  if (!doc.title || typeof doc.title !== 'string') {
    errors.push('缺少文档标题')
  }

  if (!doc.content) {
    errors.push('缺少文档内容')
  } else if (typeof doc.content === 'object') {
    if (doc.content.type !== 'doc') {
      errors.push('文档类型无效')
    }
    if (!Array.isArray(doc.content.content)) {
      errors.push('文档内容结构损坏')
    }
  } else {
    errors.push('文档内容格式无效')
  }

  if (doc.type && !['chapter', 'scene', 'character', 'code_snippet'].includes(doc.type)) {
    warnings.push('未知的文档类型')
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  }
}

export function validateTiptapContent(content: any): boolean {
  if (!content) return false
  if (typeof content !== 'object') return false
  if (content.type !== 'doc') return false
  if (!Array.isArray(content.content)) return false
  return true
}

export function repairDocument(doc: any): Document | null {
  if (!doc) return null

  const repaired = { ...doc }

  if (!repaired.id) {
    repaired.id = `doc_repaired_${Date.now()}`
  }

  if (!repaired.title) {
    repaired.title = '未命名文档'
  }

  if (!repaired.type) {
    repaired.type = 'chapter'
  }

  if (!validateTiptapContent(repaired.content)) {
    repaired.content = {
      type: 'doc',
      content: [{ type: 'paragraph', content: [{ type: 'text', text: '' }] }],
    }
  }

  if (!repaired.updatedAt) {
    repaired.updatedAt = Date.now()
  }

  return repaired as Document
}
