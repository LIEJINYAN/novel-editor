import { describe, it, expect, beforeEach, vi } from 'vitest'
import { useDocumentCacheStore } from '../store/documentCacheStore'

vi.mock('../utils/idb', () => ({
  getFromIndexedDB: vi.fn(),
}))

import { getFromIndexedDB } from '../utils/idb'

const mockGetFromIndexedDB = vi.mocked(getFromIndexedDB)

describe('useDocumentCacheStore', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    useDocumentCacheStore.setState({ cache: {}, maxCacheSize: 5 })
  })

  it('should have empty cache and maxCacheSize=5 by default', () => {
    const state = useDocumentCacheStore.getState()
    expect(state.cache).toEqual({})
    expect(state.maxCacheSize).toBe(5)
  })

  describe('loadDocument', () => {
    it('should load from IDB, store in cache, and return content', async () => {
      const content = { text: 'hello' }
      mockGetFromIndexedDB.mockResolvedValue({ id: 'doc1', content })

      const result = await useDocumentCacheStore.getState().loadDocument('doc1')

      expect(result).toEqual(content)
      expect(mockGetFromIndexedDB).toHaveBeenCalledWith('documents', 'doc1')
      const entry = useDocumentCacheStore.getState().cache['doc1']
      expect(entry).toBeDefined()
      expect(entry.content).toEqual(content)
      expect(entry.isLoaded).toBe(true)
    })

    it('should return from cache without IDB call if already loaded', async () => {
      const content = { text: 'hello' }
      mockGetFromIndexedDB.mockResolvedValue({ id: 'doc1', content })

      await useDocumentCacheStore.getState().loadDocument('doc1')
      vi.clearAllMocks()

      const result = await useDocumentCacheStore.getState().loadDocument('doc1')
      expect(result).toEqual(content)
      expect(mockGetFromIndexedDB).not.toHaveBeenCalled()
    })

    it('should evict oldest loaded entry when cache is full', async () => {
      const docs = Array.from({ length: 6 }, (_, i) => ({
        id: `doc${i}`,
        content: { text: `doc${i}` },
      }))

      for (const doc of docs) {
        mockGetFromIndexedDB.mockResolvedValueOnce(doc)
        await useDocumentCacheStore.getState().loadDocument(doc.id)
      }

      const cache = useDocumentCacheStore.getState().cache
      expect(Object.keys(cache)).toHaveLength(6)
      expect(cache['doc0'].isLoaded).toBe(false)
      expect(cache['doc0'].content).toBeNull()
      expect(cache['doc5'].isLoaded).toBe(true)
      expect(cache['doc5'].content).toEqual({ text: 'doc5' })
    })
  })

  describe('unloadDocument', () => {
    it('should set content=null and isLoaded=false', async () => {
      mockGetFromIndexedDB.mockResolvedValue({ id: 'doc1', content: { text: 'x' } })
      await useDocumentCacheStore.getState().loadDocument('doc1')

      useDocumentCacheStore.getState().unloadDocument('doc1')
      const entry = useDocumentCacheStore.getState().cache['doc1']
      expect(entry.content).toBeNull()
      expect(entry.isLoaded).toBe(false)
    })

    it('should be a no-op for unknown docId', () => {
      useDocumentCacheStore.getState().unloadDocument('nonexistent')
      expect(useDocumentCacheStore.getState().cache).toEqual({})
    })
  })

  describe('preloadDocument', () => {
    it('should call loadDocument if not loaded', async () => {
      mockGetFromIndexedDB.mockResolvedValue({ id: 'doc1', content: { text: 'x' } })
      await useDocumentCacheStore.getState().preloadDocument('doc1')
      expect(mockGetFromIndexedDB).toHaveBeenCalledWith('documents', 'doc1')
    })

    it('should be a no-op if already loaded', async () => {
      mockGetFromIndexedDB.mockResolvedValue({ id: 'doc1', content: { text: 'x' } })
      await useDocumentCacheStore.getState().loadDocument('doc1')
      vi.clearAllMocks()

      await useDocumentCacheStore.getState().preloadDocument('doc1')
      expect(mockGetFromIndexedDB).not.toHaveBeenCalled()
    })
  })

  describe('getLoadedContent', () => {
    it('should return content if loaded', async () => {
      const content = { text: 'x' }
      mockGetFromIndexedDB.mockResolvedValue({ id: 'doc1', content })
      await useDocumentCacheStore.getState().loadDocument('doc1')

      expect(useDocumentCacheStore.getState().getLoadedContent('doc1')).toEqual(content)
    })

    it('should return null if not loaded', () => {
      expect(useDocumentCacheStore.getState().getLoadedContent('nonexistent')).toBeNull()
    })
  })

  describe('clearCache', () => {
    it('should empty the cache', async () => {
      mockGetFromIndexedDB.mockResolvedValue({ id: 'doc1', content: { text: 'x' } })
      await useDocumentCacheStore.getState().loadDocument('doc1')
      useDocumentCacheStore.getState().clearCache()
      expect(useDocumentCacheStore.getState().cache).toEqual({})
    })
  })

  describe('getCacheStats', () => {
    it('should return loaded/unloaded/total counts', async () => {
      mockGetFromIndexedDB.mockResolvedValue({ id: 'doc1', content: { text: 'x' } })
      await useDocumentCacheStore.getState().loadDocument('doc1')
      mockGetFromIndexedDB.mockResolvedValue({ id: 'doc2', content: { text: 'y' } })
      await useDocumentCacheStore.getState().loadDocument('doc2')
      useDocumentCacheStore.getState().unloadDocument('doc2')

      const stats = useDocumentCacheStore.getState().getCacheStats()
      expect(stats.loaded).toBe(1)
      expect(stats.unloaded).toBe(1)
      expect(stats.total).toBe(2)
    })
  })
})
