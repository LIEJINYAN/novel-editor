import { describe, it, expect, beforeEach } from 'vitest'
import { useDocumentStore } from '../store/documentStore'

describe('完整业务流程集成测试', () => {
  beforeEach(() => {
    useDocumentStore.setState({
      documents: [],
      currentDocId: null,
      isLoaded: true,
    })
  })

  it('should complete create-edit-switch workflow', async () => {
    const { addDoc, updateDoc, setCurrentDoc, getCurrentDoc } = useDocumentStore.getState()

    const id1 = await addDoc({
      title: '第一章',
      type: 'chapter',
      content: { type: 'doc', content: [{ type: 'paragraph', content: [{ type: 'text', text: '初始内容' }] }] },
      parentId: null,
    })

    const id2 = await addDoc({
      title: '第二章',
      type: 'chapter',
      content: { type: 'doc', content: [{ type: 'paragraph', content: [{ type: 'text', text: '第二章内容' }] }] },
      parentId: null,
    })

    expect(useDocumentStore.getState().documents).toHaveLength(2)

    setCurrentDoc(id1)
    let current = getCurrentDoc()
    expect(current?.title).toBe('第一章')

    updateDoc(id1, { title: '第一章（已修改）' })
    current = getCurrentDoc()
    expect(current?.title).toBe('第一章（已修改）')

    setCurrentDoc(id2)
    current = getCurrentDoc()
    expect(current?.title).toBe('第二章')
  })

  it('should handle document hierarchy', async () => {
    const { addDoc, setCurrentDoc, getCurrentDoc } = useDocumentStore.getState()

    const volumeId = await addDoc({
      title: '第一卷',
      type: 'chapter',
      content: { type: 'doc', content: [] },
      parentId: null,
    })

    const chapter1Id = await addDoc({
      title: '第一章',
      type: 'chapter',
      content: { type: 'doc', content: [] },
      parentId: volumeId,
    })

    const chapter2Id = await addDoc({
      title: '第二章',
      type: 'chapter',
      content: { type: 'doc', content: [] },
      parentId: volumeId,
    })

    const { documents } = useDocumentStore.getState()
    expect(documents).toHaveLength(3)

    const children = documents.filter((d) => d.parentId === volumeId)
    expect(children).toHaveLength(2)

    setCurrentDoc(chapter1Id)
    expect(getCurrentDoc()?.title).toBe('第一章')
  })

  it('should handle character and scene management', async () => {
    const { addDoc, updateDoc, removeDoc } = useDocumentStore.getState()

    const charId = await addDoc({
      title: '主角',
      type: 'character',
      content: {
        type: 'doc',
        content: [
          { type: 'paragraph', content: [{ type: 'text', text: '性格：勇敢' }] },
        ],
      },
      parentId: null,
    })

    const sceneId = await addDoc({
      title: '开场场景',
      type: 'scene',
      content: {
        type: 'doc',
        content: [
          { type: 'paragraph', content: [{ type: 'text', text: '清晨的小镇' }] },
        ],
      },
      parentId: null,
    })

    expect(useDocumentStore.getState().documents).toHaveLength(2)

    updateDoc(charId, {
      content: {
        type: 'doc',
        content: [
          { type: 'paragraph', content: [{ type: 'text', text: '性格：勇敢、善良' }] },
        ],
      },
    })

    const char = useDocumentStore.getState().documents.find((d) => d.id === charId)
    expect(char?.content).toHaveProperty('type', 'doc')

    await removeDoc(sceneId)
    expect(useDocumentStore.getState().documents).toHaveLength(1)
  })

  it('should handle version control workflow', async () => {
    const { addDoc, updateDoc, createVersion, restoreVersion, getVersions } = useDocumentStore.getState()

    const id = await addDoc({
      title: '版本测试文档',
      type: 'chapter',
      content: { type: 'doc', content: [{ type: 'text', text: '版本1' }] },
      parentId: null,
    })

    createVersion(id)
    expect(getVersions(id)).toHaveLength(1)

    updateDoc(id, { title: '修改标题' })
    createVersion(id)
    expect(getVersions(id)).toHaveLength(2)

    updateDoc(id, { title: '再次修改' })
    const versions = getVersions(id)
    restoreVersion(id, versions[0].id)

    const doc = useDocumentStore.getState().documents.find((d) => d.id === id)
    expect(doc?.title).toBe('版本测试文档')
  })

  it('should handle bulk operations', async () => {
    const { addDoc, removeDoc } = useDocumentStore.getState()

    const ids: string[] = []
    for (let i = 1; i <= 5; i++) {
      const id = await addDoc({
        title: `文档${i}`,
        type: 'chapter',
        content: { type: 'doc', content: [] },
        parentId: null,
      })
      ids.push(id)
    }

    expect(useDocumentStore.getState().documents).toHaveLength(5)

    for (const id of ids.slice(0, 3)) {
      await removeDoc(id)
    }
    expect(useDocumentStore.getState().documents).toHaveLength(2)

    for (const id of ids.slice(3)) {
      await removeDoc(id)
    }
    expect(useDocumentStore.getState().documents).toHaveLength(0)
  })
})
