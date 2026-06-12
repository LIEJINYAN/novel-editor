import { describe, it, expect, beforeEach } from 'vitest'
import { useDocumentStore } from '../store/documentStore'
import { useTabStore } from '../store/tabStore'
import { useTagStore } from '../store/tagStore'
import { useCommentStore } from '../store/commentStore'
import {
  createDocumentTool,
  readDocumentTool,
  searchAllDocumentsTool,
  deleteDocumentTool,
  getDocumentTreeTool,
  addCommentTool,
  listCommentsTool,
  setToolContext,
} from '../services/agent/langchainTools'

describe('AI Agent 工具执行集成测试', () => {
  beforeEach(() => {
    useDocumentStore.setState({ documents: [], currentDocId: null, isLoaded: true })
    useTabStore.setState({ openTabs: [], activeTabId: null, recentlyClosed: [] })
    useTagStore.setState({ tags: [], documentTags: {}, isLoaded: true })
    useCommentStore.setState({ comments: [] })
    setToolContext({
      documentContent: '',
      documentTitle: '',
      documentId: '',
      selection: '',
      cursorPosition: 0,
    })
  })

  it('createDocumentTool 返回正确 action', async () => {
    const result = await createDocumentTool.invoke(JSON.stringify({ title: 'AI创建文档', content: 'AI创建的内容' }))
    const parsed = JSON.parse(result)
    expect(parsed.action).toBe('create')
    expect(parsed.title).toBe('AI创建文档')
    expect(parsed.message).toContain('AI创建文档')
  })

  it('readDocumentTool 返回文档内容', async () => {
    const id = await useDocumentStore.getState().addDoc({
      title: '读取测试',
      type: 'chapter',
      content: {
        type: 'doc',
        content: [{ type: 'paragraph', content: [{ type: 'text', text: '测试内容' }] }],
      },
      parentId: null,
    })

    setToolContext({
      documentId: id,
      documentTitle: '读取测试',
      documentContent: JSON.stringify({
        type: 'doc',
        content: [{ type: 'paragraph', content: [{ type: 'text', text: '测试内容' }] }],
      }),
    })

    const result = await readDocumentTool.invoke('')
    const parsed = JSON.parse(result)
    expect(parsed.title).toBe('读取测试')
    expect(parsed.length).toBeGreaterThan(0)
  })

  it('deleteDocumentTool 返回删除 action', async () => {
    const id = await useDocumentStore.getState().addDoc({
      title: '删除测试',
      type: 'chapter',
      content: { type: 'doc', content: [] },
      parentId: null,
    })

    const result = await deleteDocumentTool.invoke(JSON.stringify({ docId: id, confirm: true }))
    const parsed = JSON.parse(result)
    expect(parsed.action).toBe('delete')
    expect(parsed.requireReview).toBeTruthy()
  })

  it('searchAllDocumentsTool 返回搜索结果', async () => {
    await useDocumentStore.getState().addDoc({
      title: '搜索测试A',
      type: 'chapter',
      content: { type: 'doc', content: [{ type: 'paragraph', content: [{ type: 'text', text: '内容A' }] }] },
      parentId: null,
    })

    const result = await searchAllDocumentsTool.invoke(JSON.stringify({ query: '搜索' }))
    const parsed = JSON.parse(result)
    expect(parsed.results).toBeTruthy()
    expect(Array.isArray(parsed.results)).toBeTruthy()
  })

  it('getDocumentTreeTool 返回文档树', async () => {
    await useDocumentStore.getState().addDoc({
      title: '树测试',
      type: 'chapter',
      content: { type: 'doc', content: [] },
      parentId: null,
    })

    const result = await getDocumentTreeTool.invoke('')
    const parsed = JSON.parse(result)
    expect(parsed.tree || parsed.result).toBeTruthy()
  })

  it('addCommentTool 返回评论 action', async () => {
    const docId = await useDocumentStore.getState().addDoc({
      title: '评论测试',
      type: 'chapter',
      content: { type: 'doc', content: [] },
      parentId: null,
    })

    setToolContext({
      documentId: docId,
      selection: '选中文本',
    })

    const result = await addCommentTool.invoke(JSON.stringify({ content: 'AI评论内容' }))
    const parsed = JSON.parse(result)
    expect(parsed.action).toBe('addComment')
    expect(parsed.commentId).toBeTruthy()
  })

  it('listCommentsTool 返回评论列表', async () => {
    const docId = await useDocumentStore.getState().addDoc({
      title: '评论列表测试',
      type: 'chapter',
      content: { type: 'doc', content: [] },
      parentId: null,
    })

    useCommentStore.getState().addComment({
      documentId: docId,
      content: '测试评论',
      position: 0,
      author: 'Test',
    })

    setToolContext({ documentId: docId })

    const result = await listCommentsTool.invoke('')
    const parsed = JSON.parse(result)
    expect(parsed.comments).toBeTruthy()
    expect(Array.isArray(parsed.comments)).toBeTruthy()
  })

  it('完整工作流: store 操作 + 标签关联', async () => {
    const id = await useDocumentStore.getState().addDoc({
      title: '完整工作流测试',
      type: 'chapter',
      content: { type: 'doc', content: [{ type: 'paragraph', content: [{ type: 'text', text: '工作流内容' }] }] },
      parentId: null,
    })

    const tagId = await useTagStore.getState().addTag('工作流标签', '#8b5cf6')
    useTagStore.getState().addTagToDocument(id, tagId)

    const docTags = useTagStore.getState().documentTags[id]
    expect(docTags).toContain(tagId)

    useDocumentStore.getState().setCurrentDoc(id)
    expect(useDocumentStore.getState().currentDocId).toBe(id)
  })
})
