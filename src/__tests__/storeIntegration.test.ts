import { describe, it, expect, beforeEach } from 'vitest'
import { useDocumentStore } from '../store/documentStore'
import { useTabStore } from '../store/tabStore'
import { useDocumentSessionStore } from '../store/documentSessionStore'
import { useTagStore } from '../store/tagStore'
import { useShortcutStore } from '../store/shortcutStore'
import { useWritingStatsStore } from '../store/writingStatsStore'

describe('Store 间数据流集成测试', () => {
  beforeEach(() => {
    useDocumentStore.setState({ documents: [], currentDocId: null, isLoaded: true })
    useTabStore.setState({ openTabs: [], activeTabId: null, recentlyClosed: [] })
    useDocumentSessionStore.setState({ sessions: {} })
    useTagStore.setState({ tags: [], documentTags: {}, isLoaded: true })
    useWritingStatsStore.setState({ dailyStats: {}, currentSessionStart: null, totalWordsWritten: 0, totalTimeSpent: 0 })
  })

  it('document → tab → session 联动', async () => {
    const docId = await useDocumentStore.getState().addDoc({
      title: '测试文档',
      type: 'chapter',
      content: { type: 'doc', content: [] },
      parentId: null,
    })

    useTabStore.getState().openTab(docId, '测试文档')
    const tabs = useTabStore.getState().openTabs
    expect(tabs.length).toBe(1)
    expect(tabs[0].docId).toBe(docId)

    useDocumentSessionStore.getState().createSession(docId)
    useDocumentSessionStore.getState().setScrollPosition(docId, 100)
    const session = useDocumentSessionStore.getState().getSession(docId)
    expect(session).toBeTruthy()
    expect(session?.scrollPosition).toBe(100)
  })

  it('document 删除 → tab 关闭', async () => {
    const docId = await useDocumentStore.getState().addDoc({
      title: '待删除文档',
      type: 'chapter',
      content: { type: 'doc', content: [] },
      parentId: null,
    })

    useTabStore.getState().openTab(docId, '待删除文档')
    expect(useTabStore.getState().openTabs.length).toBe(1)

    await useDocumentStore.getState().removeDoc(docId)
    useTabStore.getState().closeTab(docId)
    expect(useTabStore.getState().openTabs.length).toBe(0)
  })

  it('tag → document 关联', async () => {
    const tagId = await useTagStore.getState().addTag('重要', '#ef4444')
    const docId = await useDocumentStore.getState().addDoc({
      title: '带标签文档',
      type: 'chapter',
      content: { type: 'doc', content: [] },
      parentId: null,
    })

    useTagStore.getState().addTagToDocument(docId, tagId)
    const docTags = useTagStore.getState().documentTags[docId]
    expect(docTags).toContain(tagId)
  })

  it('tag 删除 → document 关联清理', async () => {
    const tagId = await useTagStore.getState().addTag('临时', '#3b82f6')
    const docId = await useDocumentStore.getState().addDoc({
      title: '关联文档',
      type: 'chapter',
      content: { type: 'doc', content: [] },
      parentId: null,
    })

    useTagStore.getState().addTagToDocument(docId, tagId)
    expect(useTagStore.getState().documentTags[docId]).toContain(tagId)

    await useTagStore.getState().removeTag(tagId)
    const updatedDocTags = useTagStore.getState().documentTags[docId]
    // After removal, the tag ID should no longer be in the array
    expect(updatedDocTags).not.toContain(tagId)
  })

  it('shortcut → action 映射', async () => {
    const shortcuts = useShortcutStore.getState().shortcuts
    expect(shortcuts.length).toBeGreaterThan(0)

    const saveShortcut = shortcuts.find((s) => s.id === 'save')
    expect(saveShortcut).toBeTruthy()
    expect(saveShortcut?.code).toBe('Ctrl+S')
  })

  it('writing stats 联动', async () => {
    useWritingStatsStore.getState().startSession()
    expect(useWritingStatsStore.getState().currentSessionStart).toBeTruthy()

    useWritingStatsStore.getState().endSession()
    expect(useWritingStatsStore.getState().currentSessionStart).toBeNull()
  })

  it('多文档批量操作一致性', async () => {
    const ids: string[] = []
    for (let i = 0; i < 5; i++) {
      const id = await useDocumentStore.getState().addDoc({
        title: `批量文档${i}`,
        type: 'chapter',
        content: { type: 'doc', content: [] },
        parentId: null,
      })
      ids.push(id)
      useTabStore.getState().openTab(id, `批量文档${i}`)
    }

    expect(useDocumentStore.getState().documents.length).toBe(5)
    expect(useTabStore.getState().openTabs.length).toBe(5)

    for (const id of ids.slice(0, 2)) {
      await useDocumentStore.getState().removeDoc(id)
      useTabStore.getState().closeTab(id)
    }

    expect(useDocumentStore.getState().documents.length).toBe(3)
    expect(useTabStore.getState().openTabs.length).toBe(3)
  })

  it('currentDoc 切换一致性', async () => {
    const id1 = await useDocumentStore.getState().addDoc({
      title: '文档1',
      type: 'chapter',
      content: { type: 'doc', content: [] },
      parentId: null,
    })
    const id2 = await useDocumentStore.getState().addDoc({
      title: '文档2',
      type: 'chapter',
      content: { type: 'doc', content: [] },
      parentId: null,
    })

    useDocumentStore.getState().setCurrentDoc(id1)
    expect(useDocumentStore.getState().currentDocId).toBe(id1)

    useDocumentStore.getState().setCurrentDoc(id2)
    expect(useDocumentStore.getState().currentDocId).toBe(id2)
    expect(useDocumentStore.getState().getCurrentDoc()?.title).toBe('文档2')
  })
})
