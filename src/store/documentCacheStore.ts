import { create } from 'zustand'
import { getFromIndexedDB } from '../utils/idb'

interface DocumentData {
  id: string
  content: object
  [key: string]: unknown
}

interface DocumentCacheEntry {
  docId: string
  content: object | null
  lastAccessed: number
  isLoaded: boolean
}

interface DocumentCacheState {
  cache: Record<string, DocumentCacheEntry>
  maxCacheSize: number
  loadDocument: (docId: string) => Promise<object | null>
  unloadDocument: (docId: string) => void
  preloadDocument: (docId: string) => Promise<void>
  getLoadedContent: (docId: string) => object | null
  clearCache: () => void
  getCacheStats: () => { loaded: number; unloaded: number; total: number }
}

export const useDocumentCacheStore = create<DocumentCacheState>((set, get) => ({
  cache: {},
  maxCacheSize: 5,

  loadDocument: async (docId) => {
    const state = get()
    const entry = state.cache[docId]

    if (entry?.isLoaded && entry.content) {
      set({
        cache: {
          ...state.cache,
          [docId]: { ...entry, lastAccessed: Date.now() },
        },
      })
      return entry.content
    }

    try {
      const doc = await getFromIndexedDB<DocumentData>('documents', docId)
      if (doc && doc.content) {
        const newCache = { ...state.cache }

        const loadedCount = Object.values(newCache).filter((e) => e.isLoaded).length
        if (loadedCount >= state.maxCacheSize) {
          const oldestKey = Object.entries(newCache)
            .filter(([_, e]) => e.isLoaded)
            .sort((a, b) => a[1].lastAccessed - b[1].lastAccessed)[0]?.[0]

          if (oldestKey && oldestKey !== docId) {
            newCache[oldestKey] = {
              ...newCache[oldestKey],
              content: null,
              isLoaded: false,
            }
          }
        }

        newCache[docId] = {
          docId,
          content: doc.content,
          lastAccessed: Date.now(),
          isLoaded: true,
        }

        set({ cache: newCache })
        return doc.content
      }
    } catch (err) {
      console.error('Failed to load document from cache:', err)
    }

    return null
  },

  unloadDocument: (docId) => {
    set((state) => {
      const entry = state.cache[docId]
      if (!entry) return state

      return {
        cache: {
          ...state.cache,
          [docId]: {
            ...entry,
            content: null,
            isLoaded: false,
          },
        },
      }
    })
  },

  preloadDocument: async (docId) => {
    const state = get()
    const entry = state.cache[docId]

    if (entry?.isLoaded) return

    await state.loadDocument(docId)
  },

  getLoadedContent: (docId) => {
    const entry = get().cache[docId]
    return entry?.isLoaded ? entry.content : null
  },

  clearCache: () => {
    set({ cache: {} })
  },

  getCacheStats: () => {
    const cache = get().cache
    const entries = Object.values(cache)
    return {
      loaded: entries.filter((e) => e.isLoaded).length,
      unloaded: entries.filter((e) => !e.isLoaded).length,
      total: entries.length,
    }
  },
}))
