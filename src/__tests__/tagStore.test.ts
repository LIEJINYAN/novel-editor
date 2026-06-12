import { describe, it, expect, beforeEach } from 'vitest'
import { useTagStore } from '../store/tagStore'

describe('tagStore', () => {
  beforeEach(() => {
    useTagStore.setState({ tags: [], documentTags: {}, isLoaded: true })
  })

  it('should add a tag', async () => {
    const id = await useTagStore.getState().addTag('test-tag', '#ff0000')
    expect(id).toBeTruthy()
    expect(useTagStore.getState().tags.length).toBe(1)
    expect(useTagStore.getState().tags[0].name).toBe('test-tag')
    expect(useTagStore.getState().tags[0].color).toBe('#ff0000')
  })

  it('should add tag with default color', async () => {
    const id = await useTagStore.getState().addTag('default-color-tag')
    const tag = useTagStore.getState().tags.find((t) => t.id === id)
    expect(tag).toBeTruthy()
    expect(tag?.color).toBeTruthy()
  })

  it('should remove a tag', async () => {
    const id = await useTagStore.getState().addTag('to-delete')
    expect(useTagStore.getState().tags.length).toBe(1)
    await useTagStore.getState().removeTag(id)
    expect(useTagStore.getState().tags.length).toBe(0)
  })

  it('should update a tag', async () => {
    const id = await useTagStore.getState().addTag('original')
    useTagStore.getState().updateTag(id, { name: 'updated' })
    const tag = useTagStore.getState().tags.find((t) => t.id === id)
    expect(tag?.name).toBe('updated')
  })

  it('should add tag to document', () => {
    const docId = 'doc1'
    const tagId = 'tag1'
    useTagStore.setState({
      tags: [{ id: tagId, name: 'test', color: '#000', createdAt: Date.now() }],
      documentTags: {},
    })
    useTagStore.getState().addTagToDocument(docId, tagId)
    expect(useTagStore.getState().documentTags[docId]).toContain(tagId)
  })

  it('should not add duplicate tag to document', () => {
    const docId = 'doc1'
    const tagId = 'tag1'
    useTagStore.setState({
      tags: [{ id: tagId, name: 'test', color: '#000', createdAt: Date.now() }],
      documentTags: { [docId]: [tagId] },
    })
    useTagStore.getState().addTagToDocument(docId, tagId)
    expect(useTagStore.getState().documentTags[docId].length).toBe(1)
  })

  it('should remove tag from document', () => {
    const docId = 'doc1'
    const tagId = 'tag1'
    useTagStore.setState({
      tags: [{ id: tagId, name: 'test', color: '#000', createdAt: Date.now() }],
      documentTags: { [docId]: [tagId] },
    })
    useTagStore.getState().removeTagFromDocument(docId, tagId)
    expect(useTagStore.getState().documentTags[docId]).not.toContain(tagId)
  })

  it('should get tags for document', () => {
    const docId = 'doc1'
    const tag1 = { id: 'tag1', name: 'tag1', color: '#000', createdAt: Date.now() }
    const tag2 = { id: 'tag2', name: 'tag2', color: '#111', createdAt: Date.now() }
    useTagStore.setState({
      tags: [tag1, tag2],
      documentTags: { [docId]: ['tag1', 'tag2'] },
    })
    const result = useTagStore.getState().getTagsForDocument(docId)
    expect(result.length).toBe(2)
  })

  it('should get documents with tag', () => {
    const tagId = 'tag1'
    useTagStore.setState({
      tags: [{ id: tagId, name: 'test', color: '#000', createdAt: Date.now() }],
      documentTags: { doc1: [tagId], doc2: [tagId], doc3: [] },
    })
    const result = useTagStore.getState().getDocumentsWithTag(tagId)
    expect(result).toContain('doc1')
    expect(result).toContain('doc2')
    expect(result).not.toContain('doc3')
  })

  it('should handle removeTag cascading to documentTags', async () => {
    const tagId = 'tag1'
    useTagStore.setState({
      tags: [{ id: tagId, name: 'test', color: '#000', createdAt: Date.now() }],
      documentTags: { doc1: [tagId], doc2: [tagId] },
    })
    await useTagStore.getState().removeTag(tagId)
    expect(useTagStore.getState().documentTags['doc1']).not.toContain(tagId)
    expect(useTagStore.getState().documentTags['doc2']).not.toContain(tagId)
  })
})
