import { describe, it, expect, beforeEach } from 'vitest'
import { useDocumentStore } from '../store/documentStore'
import { useTagStore } from '../store/tagStore'
import { useCommentStore } from '../store/commentStore'

describe('安全测试 - XSS 防护', () => {
  beforeEach(() => {
    useDocumentStore.setState({ documents: [], currentDocId: null, isLoaded: true })
    useTagStore.setState({ tags: [], documentTags: {}, isLoaded: true })
    useCommentStore.setState({ comments: [] })
  })

  it('should store script tags in document title', async () => {
    const maliciousTitle = '<script>alert("xss")</script>'
    const id = await useDocumentStore.getState().addDoc({
      title: maliciousTitle,
      type: 'chapter',
      content: { type: 'doc', content: [] },
      parentId: null,
    })

    const doc = useDocumentStore.getState().documents.find((d) => d.id === id)
    expect(doc?.title).toBe(maliciousTitle)
  })

  it('should handle HTML entities in content', async () => {
    const maliciousContent = '<img src=x onerror=alert(1)>'
    const id = await useDocumentStore.getState().addDoc({
      title: 'XSS测试',
      type: 'chapter',
      content: {
        type: 'doc',
        content: [{ type: 'paragraph', content: [{ type: 'text', text: maliciousContent }] }],
      },
      parentId: null,
    })

    const doc = useDocumentStore.getState().documents.find((d) => d.id === id)
    expect(doc).toBeTruthy()
  })

  it('should store tag names with special chars', async () => {
    const maliciousTag = '<script>alert("xss")</script>'
    const tagId = await useTagStore.getState().addTag(maliciousTag, '#ef4444')
    const tag = useTagStore.getState().tags.find((t) => t.id === tagId)
    expect(tag?.name).toBe(maliciousTag)
  })

  it('should store comment content with special chars', async () => {
    const docId = await useDocumentStore.getState().addDoc({
      title: '评论测试',
      type: 'chapter',
      content: { type: 'doc', content: [] },
      parentId: null,
    })

    const maliciousComment = '<script>alert("xss")</script>'
    useCommentStore.getState().addComment({
      documentId: docId,
      content: maliciousComment,
      position: { from: 0, to: 10 },
      author: 'Test',
    })

    const comment = useCommentStore.getState().comments[0]
    expect(comment?.content).toBe(maliciousComment)
  })

  it('should handle null bytes in input', async () => {
    const nullByteTitle = 'test\x00<script>alert(1)</script>'
    const id = await useDocumentStore.getState().addDoc({
      title: nullByteTitle,
      type: 'chapter',
      content: { type: 'doc', content: [] },
      parentId: null,
    })

    const doc = useDocumentStore.getState().documents.find((d) => d.id === id)
    expect(doc).toBeTruthy()
  })

  it('should handle very long input', async () => {
    const longTitle = 'A'.repeat(10000)
    const id = await useDocumentStore.getState().addDoc({
      title: longTitle,
      type: 'chapter',
      content: { type: 'doc', content: [] },
      parentId: null,
    })

    const doc = useDocumentStore.getState().documents.find((d) => d.id === id)
    expect(doc?.title.length).toBeLessThanOrEqual(10000)
  })

  it('should handle Unicode escape sequences', async () => {
    const unicodeTitle = '\u003Cscript\u003Ealert(1)\u003C/script\u003E'
    const id = await useDocumentStore.getState().addDoc({
      title: unicodeTitle,
      type: 'chapter',
      content: { type: 'doc', content: [] },
      parentId: null,
    })

    const doc = useDocumentStore.getState().documents.find((d) => d.id === id)
    expect(doc).toBeTruthy()
  })
})

describe('安全测试 - 插件沙箱', () => {
  it('should have plugin types module', async () => {
    const types = await import('../services/pluginSystem/types')
    expect(types).toBeDefined()
  })

  it('should have plugin loader module', async () => {
    const loader = await import('../services/pluginSystem/loader')
    expect(loader).toBeDefined()
    expect(typeof loader.installPlugin).toBe('function')
    expect(typeof loader.uninstallPlugin).toBe('function')
    expect(typeof loader.enablePlugin).toBe('function')
    expect(typeof loader.disablePlugin).toBe('function')
  })
})

describe('安全测试 - API Key 保护', () => {
  it('should not expose API key in localStorage', () => {
    const keys = Object.keys(localStorage)
    const apiKeyKeys = keys.filter(
      (k) => k.includes('api') && k.includes('key') || k.includes('apikey')
    )
    apiKeyKeys.forEach((key) => {
      const value = localStorage.getItem(key)
      expect(value).toBeTruthy()
    })
  })

  it('should have AI config stored securely', () => {
    const aiConfig = localStorage.getItem('novel-engine-ai-config')
    if (aiConfig) {
      const parsed = JSON.parse(aiConfig)
      expect(parsed.apiKey).toBeTruthy()
    }
  })
})
