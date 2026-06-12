import { create } from 'zustand'
import { saveToIndexedDB, getAllFromIndexedDB, deleteFromIndexedDB } from '../utils/idb'

export interface Tag {
  id: string
  name: string
  color: string
  createdAt: number
}

interface TagState {
  tags: Tag[]
  documentTags: Record<string, string[]>
  isLoaded: boolean
  addTag: (name: string, color?: string) => Promise<string>
  removeTag: (id: string) => Promise<void>
  updateTag: (id: string, updates: Partial<Tag>) => void
  addTagToDocument: (docId: string, tagId: string) => void
  removeTagFromDocument: (docId: string, tagId: string) => void
  getTagsForDocument: (docId: string) => Tag[]
  getDocumentsWithTag: (tagId: string) => string[]
  loadFromDB: () => Promise<void>
  saveToDB: () => Promise<void>
}

const DEFAULT_COLORS = [
  '#ef4444', // red
  '#f97316', // orange
  '#eab308', // yellow
  '#22c55e', // green
  '#3b82f6', // blue
  '#8b5cf6', // purple
  '#ec4899', // pink
  '#06b6d4', // cyan
]

export const useTagStore = create<TagState>((set, get) => ({
  tags: [],
  documentTags: {},
  isLoaded: false,

  loadFromDB: async () => {
    try {
      const tags = await getAllFromIndexedDB<Tag>('tags')
      const docTags = await getAllFromIndexedDB<{ docId: string; tagIds: string[] }>('documentTags')
      
      const documentTags: Record<string, string[]> = {}
      docTags.forEach((item) => {
        documentTags[item.docId] = item.tagIds
      })
      
      set({ 
        tags: tags || [], 
        documentTags: docTags ? documentTags : {}, 
        isLoaded: true 
      })
    } catch (err) {
      console.error('Failed to load tags from DB:', err)
      set({ tags: [], documentTags: {}, isLoaded: true })
    }
  },

  saveToDB: async () => {
    const state = get()
    try {
      for (const tag of state.tags) {
        await saveToIndexedDB('tags', tag)
      }
    } catch (err) {
      console.error('Save tags to DB failed:', err)
    }
  },

  addTag: async (name, color) => {
    const id = `tag_${Date.now()}`
    const newTag: Tag = {
      id,
      name,
      color: color || DEFAULT_COLORS[get().tags.length % DEFAULT_COLORS.length],
      createdAt: Date.now(),
    }
    
    set((state) => ({
      tags: [...state.tags, newTag],
    }))
    
    await saveToIndexedDB('tags', newTag).catch(console.error)
    return id
  },

  removeTag: async (id) => {
    set((state) => ({
      tags: state.tags.filter((t) => t.id !== id),
      documentTags: Object.fromEntries(
        Object.entries(state.documentTags).map(([docId, tagIds]) => [
          docId,
          tagIds.filter((tid) => tid !== id),
        ])
      ),
    }))
    await deleteFromIndexedDB('tags', id).catch(console.error)
  },

  updateTag: (id, updates) => {
    set((state) => ({
      tags: state.tags.map((t) => (t.id === id ? { ...t, ...updates } : t)),
    }))
  },

  addTagToDocument: (docId, tagId) => {
    set((state) => {
      const currentTags = state.documentTags[docId] || []
      if (currentTags.includes(tagId)) return state
      
      const newDocTags = { ...state.documentTags, [docId]: [...currentTags, tagId] }
      return { documentTags: newDocTags }
    })
  },

  removeTagFromDocument: (docId, tagId) => {
    set((state) => {
      const currentTags = state.documentTags[docId] || []
      const newDocTags = { ...state.documentTags, [docId]: currentTags.filter((id) => id !== tagId) }
      return { documentTags: newDocTags }
    })
  },

  getTagsForDocument: (docId) => {
    const state = get()
    const tagIds = state.documentTags[docId] || []
    return state.tags.filter((t) => tagIds.includes(t.id))
  },

  getDocumentsWithTag: (tagId) => {
    const state = get()
    return Object.entries(state.documentTags)
      .filter(([_, tagIds]) => tagIds.includes(tagId))
      .map(([docId]) => docId)
  },
}))
