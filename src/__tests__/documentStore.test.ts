import { describe, it, expect, beforeEach } from 'vitest'
import { useDocumentStore } from '../store/documentStore'

describe('documentStore', () => {
  beforeEach(() => {
    useDocumentStore.setState({
      documents: [],
      currentDocId: null,
    })
  })

  it('should add a document', async () => {
    const id = await useDocumentStore.getState().addDoc({
      title: '测试章节',
      type: 'chapter',
      content: { type: 'doc', content: [] },
      parentId: null,
    })

    const state = useDocumentStore.getState()
    expect(state.documents).toHaveLength(1)
    expect(state.documents[0].title).toBe('测试章节')
    expect(state.documents[0].type).toBe('chapter')
    expect(id).toBeTruthy()
  })

  it('should remove a document', async () => {
    const id = await useDocumentStore.getState().addDoc({
      title: '待删除',
      type: 'chapter',
      content: { type: 'doc', content: [] },
      parentId: null,
    })

    await useDocumentStore.getState().removeDoc(id)
    expect(useDocumentStore.getState().documents).toHaveLength(0)
  })

  it('should update a document', async () => {
    const id = await useDocumentStore.getState().addDoc({
      title: '原标题',
      type: 'chapter',
      content: { type: 'doc', content: [] },
      parentId: null,
    })

    useDocumentStore.getState().updateDoc(id, { title: '新标题' })

    const doc = useDocumentStore.getState().documents[0]
    expect(doc.title).toBe('新标题')
  })

  it('should set current document', async () => {
    const id = await useDocumentStore.getState().addDoc({
      title: '当前文档',
      type: 'chapter',
      content: { type: 'doc', content: [] },
      parentId: null,
    })

    useDocumentStore.getState().setCurrentDoc(id)
    expect(useDocumentStore.getState().currentDocId).toBe(id)

    const current = useDocumentStore.getState().getCurrentDoc()
    expect(current?.title).toBe('当前文档')
  })

  it('should return undefined for non-existent current doc', () => {
    useDocumentStore.getState().setCurrentDoc('non-existent')
    const current = useDocumentStore.getState().getCurrentDoc()
    expect(current).toBeUndefined()
  })

  it('should handle multiple documents', async () => {
    await useDocumentStore.getState().addDoc({ title: '文档1', type: 'chapter', content: { type: 'doc', content: [] }, parentId: null })
    await useDocumentStore.getState().addDoc({ title: '文档2', type: 'character', content: { type: 'doc', content: [] }, parentId: null })
    await useDocumentStore.getState().addDoc({ title: '文档3', type: 'scene', content: { type: 'doc', content: [] }, parentId: null })

    expect(useDocumentStore.getState().documents).toHaveLength(3)
  })

  it('should create a version', async () => {
    const id = await useDocumentStore.getState().addDoc({
      title: '版本测试',
      type: 'chapter',
      content: { type: 'doc', content: [{ type: 'text', text: '原始内容' }] },
      parentId: null,
    })

    useDocumentStore.getState().createVersion(id)

    const doc = useDocumentStore.getState().documents[0]
    expect(doc.versions).toHaveLength(1)
    expect(doc.versions![0].title).toBe('版本测试')
  })

  it('should restore a version', async () => {
    const id = await useDocumentStore.getState().addDoc({
      title: '恢复测试',
      type: 'chapter',
      content: { type: 'doc', content: [{ type: 'text', text: '原始内容' }] },
      parentId: null,
    })

    useDocumentStore.getState().createVersion(id)
    useDocumentStore.getState().updateDoc(id, { title: '修改后' })

    const versionId = useDocumentStore.getState().documents[0].versions![0].id
    useDocumentStore.getState().restoreVersion(id, versionId)

    const doc = useDocumentStore.getState().documents[0]
    expect(doc.title).toBe('恢复测试')
  })

  it('should get versions for a document', async () => {
    const id = await useDocumentStore.getState().addDoc({
      title: '获取版本测试',
      type: 'chapter',
      content: { type: 'doc', content: [] },
      parentId: null,
    })

    useDocumentStore.getState().createVersion(id)
    useDocumentStore.getState().createVersion(id)

    const versions = useDocumentStore.getState().getVersions(id)
    expect(versions).toHaveLength(2)
  })
})
