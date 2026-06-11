import { describe, it, expect, beforeEach, vi } from 'vitest'
import { useCommentStore } from '../store/commentStore'

const localStorageMock = (() => {
  let store: Record<string, string> = {}
  return {
    getItem: vi.fn((key: string) => store[key] || null),
    setItem: vi.fn((key: string, value: string) => { store[key] = value }),
    removeItem: vi.fn((key: string) => { delete store[key] }),
    clear: vi.fn(() => { store = {} }),
    get length() { return Object.keys(store).length },
    key: vi.fn((index: number) => Object.keys(store)[index] || null),
  }
})()

Object.defineProperty(globalThis, 'localStorage', { value: localStorageMock })

describe('commentStore', () => {
  beforeEach(() => {
    localStorageMock.clear()
    vi.clearAllMocks()
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2025-01-01T00:00:00Z'))
    useCommentStore.setState({ comments: [] })
  })

  it('should have empty comments by default', () => {
    expect(useCommentStore.getState().comments).toEqual([])
  })

  it('addComment creates comment with correct fields', () => {
    const { addComment } = useCommentStore.getState()
    const id = addComment({
      documentId: 'doc1',
      author: 'User',
      content: 'Nice paragraph',
      selection: 'selected text',
      position: { from: 0, to: 10 },
    })
    const state = useCommentStore.getState()
    expect(state.comments).toHaveLength(1)
    const c = state.comments[0]
    expect(c.id).toBe(id)
    expect(c.documentId).toBe('doc1')
    expect(c.author).toBe('User')
    expect(c.content).toBe('Nice paragraph')
    expect(c.selection).toBe('selected text')
    expect(c.position).toEqual({ from: 0, to: 10 })
    expect(c.resolved).toBe(false)
    expect(c.replies).toEqual([])
    expect(c.createdAt).toBe(Date.now())
    expect(c.updatedAt).toBe(Date.now())
  })

  it('addComment multiple times adds all', () => {
    const { addComment } = useCommentStore.getState()
    addComment({ documentId: 'doc1', author: 'A', content: 'c1' })
    addComment({ documentId: 'doc1', author: 'B', content: 'c2' })
    addComment({ documentId: 'doc2', author: 'A', content: 'c3' })
    expect(useCommentStore.getState().comments).toHaveLength(3)
  })

  it('updateComment updates specific fields and updatedAt', () => {
    const { addComment, updateComment } = useCommentStore.getState()
    const id = addComment({ documentId: 'doc1', author: 'A', content: 'old' })
    vi.setSystemTime(new Date('2025-01-01T00:00:01Z'))
    updateComment(id, { content: 'new' })
    const c = useCommentStore.getState().comments[0]
    expect(c.content).toBe('new')
    expect(c.updatedAt).toBe(Date.now())
  })

  it('deleteComment removes comment', () => {
    const { addComment, deleteComment } = useCommentStore.getState()
    const id = addComment({ documentId: 'doc1', author: 'A', content: 'x' })
    deleteComment(id)
    expect(useCommentStore.getState().comments).toHaveLength(0)
  })

  it('deleteComment with unknown id is a no-op', () => {
    const { addComment, deleteComment } = useCommentStore.getState()
    addComment({ documentId: 'doc1', author: 'A', content: 'x' })
    deleteComment('nonexistent')
    expect(useCommentStore.getState().comments).toHaveLength(1)
  })

  it('resolveComment toggles resolved flag', () => {
    const { addComment, resolveComment } = useCommentStore.getState()
    const id = addComment({ documentId: 'doc1', author: 'A', content: 'x' })
    expect(useCommentStore.getState().comments[0].resolved).toBe(false)
    resolveComment(id)
    expect(useCommentStore.getState().comments[0].resolved).toBe(true)
    resolveComment(id)
    expect(useCommentStore.getState().comments[0].resolved).toBe(false)
  })

  it('addReply adds reply to comment', () => {
    const { addComment, addReply } = useCommentStore.getState()
    const id = addComment({ documentId: 'doc1', author: 'A', content: 'x' })
    addReply(id, { author: 'B', content: 'reply text' })
    const c = useCommentStore.getState().comments[0]
    expect(c.replies).toHaveLength(1)
    expect(c.replies[0].id).toMatch(/^reply_/)
    expect(c.replies[0].author).toBe('B')
    expect(c.replies[0].content).toBe('reply text')
    expect(c.replies[0].createdAt).toBe(Date.now())
  })

  it('addReply to unknown comment is a no-op', () => {
    const { addComment, addReply } = useCommentStore.getState()
    addComment({ documentId: 'doc1', author: 'A', content: 'x' })
    addReply('nonexistent', { author: 'B', content: 'reply' })
    expect(useCommentStore.getState().comments[0].replies).toHaveLength(0)
  })

  it('getDocumentComments filters by documentId', () => {
    const { addComment, getDocumentComments } = useCommentStore.getState()
    addComment({ documentId: 'doc1', author: 'A', content: 'x' })
    addComment({ documentId: 'doc2', author: 'B', content: 'y' })
    addComment({ documentId: 'doc1', author: 'C', content: 'z' })
    expect(getDocumentComments('doc1')).toHaveLength(2)
    expect(getDocumentComments('doc2')).toHaveLength(1)
    expect(getDocumentComments('doc3')).toHaveLength(0)
  })

  it('persists to localStorage', () => {
    const { addComment } = useCommentStore.getState()
    addComment({ documentId: 'doc1', author: 'A', content: 'x' })
    expect(localStorageMock.setItem).toHaveBeenCalledWith(
      'novel-engine-comments',
      expect.any(String)
    )
  })
})
