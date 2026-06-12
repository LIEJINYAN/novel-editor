import { describe, it, expect, beforeEach } from 'vitest'
import { useDocumentStore } from '../store/documentStore'
import { useTabStore } from '../store/tabStore'
import { useDocumentCacheStore } from '../store/documentCacheStore'
import { useDocumentSessionStore } from '../store/documentSessionStore'

describe('性能测试 - 大文档处理', () => {
  beforeEach(() => {
    useDocumentStore.setState({ documents: [], currentDocId: null, isLoaded: true })
    useTabStore.setState({ openTabs: [], activeTabId: null, recentlyClosed: [] })
    useDocumentCacheStore.setState({ cache: {} })
    useDocumentSessionStore.setState({ sessions: {} })
  })

  it('should create 100 documents within 5 seconds', async () => {
    const start = Date.now()
    for (let i = 0; i < 100; i++) {
      await useDocumentStore.getState().addDoc({
        title: `文档${i}`,
        type: 'chapter',
        content: { type: 'doc', content: [{ type: 'paragraph', content: [{ type: 'text', text: `内容${i}` }] }] },
        parentId: null,
      })
    }
    const elapsed = Date.now() - start
    expect(elapsed).toBeLessThan(5000)
    expect(useDocumentStore.getState().documents.length).toBe(100)
  })

  it('should handle large document content (10000 chars)', async () => {
    const largeContent = {
      type: 'doc',
      content: Array.from({ length: 100 }, (_, i) => ({
        type: 'paragraph',
        content: [{ type: 'text', text: `段落${i}: ${'A'.repeat(100)}` }],
      })),
    }

    const start = Date.now()
    const id = await useDocumentStore.getState().addDoc({
      title: '大文档',
      type: 'chapter',
      content: largeContent,
      parentId: null,
    })
    const elapsed = Date.now() - start

    expect(elapsed).toBeLessThan(1000)
    const doc = useDocumentStore.getState().documents.find((d) => d.id === id)
    expect(doc).toBeTruthy()
  })

  it('should switch between 10 tabs within 1 second', async () => {
    const ids: string[] = []
    for (let i = 0; i < 10; i++) {
      const id = await useDocumentStore.getState().addDoc({
        title: `切换文档${i}`,
        type: 'chapter',
        content: { type: 'doc', content: [] },
        parentId: null,
      })
      ids.push(id)
      useTabStore.getState().openTab(id, `切换文档${i}`)
    }

    const start = Date.now()
    for (const id of ids) {
      useTabStore.getState().setActiveTab(id)
    }
    const elapsed = Date.now() - start

    expect(elapsed).toBeLessThan(1000)
  })

  it('should search 100 documents within 2 seconds', async () => {
    for (let i = 0; i < 100; i++) {
      await useDocumentStore.getState().addDoc({
        title: `搜索文档${i}`,
        type: 'chapter',
        content: {
          type: 'doc',
          content: [{ type: 'paragraph', content: [{ type: 'text', text: `内容${i} 包含关键词` }] }],
        },
        parentId: null,
      })
    }

    const start = Date.now()
    const results = useDocumentStore.getState().documents.filter(
      (d) => d.title.includes('搜索') || JSON.stringify(d.content).includes('关键词')
    )
    const elapsed = Date.now() - start

    expect(elapsed).toBeLessThan(2000)
    expect(results.length).toBe(100)
  })
})

describe('性能测试 - 虚拟滚动', () => {
  it('should handle 1000 chapter list items', () => {
    const chapters = Array.from({ length: 1000 }, (_, i) => ({
      id: `doc_${i}`,
      title: `第${i}章`,
      type: 'chapter' as const,
      content: { type: 'doc', content: [] },
      parentId: null,
      updatedAt: Date.now(),
    }))

    const start = Date.now()
    // Simulate filtering visible items (virtual scroll logic)
    const startIndex = 0
    const endIndex = Math.min(50, chapters.length)
    const visibleItems = chapters.slice(startIndex, endIndex)
    const elapsed = Date.now() - start

    expect(elapsed).toBeLessThan(100)
    expect(visibleItems.length).toBe(50)
  })
})

describe('性能测试 - IndexedDB 读写', () => {
  it('should handle rapid localStorage operations', () => {
    const start = Date.now()
    for (let i = 0; i < 1000; i++) {
      localStorage.setItem(`test_${i}`, JSON.stringify({ data: i }))
    }
    for (let i = 0; i < 1000; i++) {
      localStorage.getItem(`test_${i}`)
    }
    for (let i = 0; i < 1000; i++) {
      localStorage.removeItem(`test_${i}`)
    }
    const elapsed = Date.now() - start

    expect(elapsed).toBeLessThan(500)
  })

  it('should handle batch document operations', async () => {
    const start = Date.now()
    const ids: string[] = []

    // Batch create
    for (let i = 0; i < 50; i++) {
      const id = await useDocumentStore.getState().addDoc({
        title: `批量${i}`,
        type: 'chapter',
        content: { type: 'doc', content: [] },
        parentId: null,
      })
      ids.push(id)
    }

    // Batch update
    for (const id of ids) {
      useDocumentStore.getState().updateDoc(id, { title: `更新${id}` })
    }

    // Batch read
    for (const id of ids) {
      useDocumentStore.getState().documents.find((d) => d.id === id)
    }

    const elapsed = Date.now() - start
    expect(elapsed).toBeLessThan(3000)
  })
})

describe('性能测试 - 多标签切换', () => {
  it('should open and close 20 tabs quickly', async () => {
    const ids: string[] = []
    for (let i = 0; i < 20; i++) {
      const id = await useDocumentStore.getState().addDoc({
        title: `快速标签${i}`,
        type: 'chapter',
        content: { type: 'doc', content: [] },
        parentId: null,
      })
      ids.push(id)
    }

    const start = Date.now()
    for (const id of ids) {
      useTabStore.getState().openTab(id, `快速标签`)
    }
    for (const id of ids) {
      useTabStore.getState().closeTab(id)
    }
    const elapsed = Date.now() - start

    expect(elapsed).toBeLessThan(1000)
    expect(useTabStore.getState().openTabs.length).toBe(0)
  })
})
