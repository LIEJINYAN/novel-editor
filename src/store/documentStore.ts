import { create } from 'zustand'
import { saveToIndexedDB, getAllFromIndexedDB } from '../utils/idb'

export interface DocumentVersion {
  id: string
  content: object
  title: string
  createdAt: number
}

export interface Document {
  id: string
  title: string
  type: 'chapter' | 'scene' | 'character' | 'code_snippet'
  content: object
  updatedAt: number
  parentId: string | null
  versions?: DocumentVersion[]
}

interface DocumentState {
  documents: Document[]
  currentDocId: string | null
  isLoaded: boolean
  isDirty: boolean
  addDoc: (doc: Omit<Document, 'id' | 'updatedAt'>) => string
  removeDoc: (id: string) => void
  updateDoc: (id: string, updates: Partial<Document>) => void
  setCurrentDoc: (id: string | null) => void
  getCurrentDoc: () => Document | undefined
  loadFromDB: () => Promise<void>
  saveToDB: () => Promise<void>
  createVersion: (docId: string) => void
  restoreVersion: (docId: string, versionId: string) => void
  getVersions: (docId: string) => DocumentVersion[]
  markDirty: () => void
  markClean: () => void
}

let docCounter = 0
let saveTimeout: ReturnType<typeof setTimeout> | null = null

const WELCOME_DOC: Document = {
  id: 'welcome',
  title: '欢迎使用',
  type: 'chapter',
  content: {
    type: 'doc',
    content: [
      { type: 'paragraph', content: [{ type: 'text', text: '欢迎使用小说引擎编辑器！这是一个集富文本编辑与代码编辑于一体的现代化创作工具。' }] },
      { type: 'paragraph', content: [{ type: 'text', text: '在左侧大纲树管理你的章节、人物和场景，在右侧AI助手获取智能写作建议。' }] },
    ],
  },
  updatedAt: Date.now(),
  parentId: null,
}

function debounceSave(getState: () => DocumentState) {
  if (saveTimeout) {
    clearTimeout(saveTimeout)
  }
  saveTimeout = setTimeout(async () => {
    const state = getState()
    try {
      for (const doc of state.documents) {
        await saveToIndexedDB('documents', doc)
      }
    } catch (err) {
      console.error('Auto-save failed:', err)
    }
  }, 1000)
}

export const useDocumentStore = create<DocumentState>((set, get) => ({
  documents: [],
  currentDocId: null,
  isLoaded: false,
  isDirty: false,

  loadFromDB: async () => {
    try {
      const docs = await getAllFromIndexedDB<Document>('documents')
      if (docs.length > 0) {
        set({ documents: docs, isLoaded: true })
      } else {
        set({ documents: [WELCOME_DOC], currentDocId: 'welcome', isLoaded: true })
        await saveToIndexedDB('documents', WELCOME_DOC)
      }
    } catch (err) {
      console.error('Failed to load from DB:', err)
      set({ documents: [WELCOME_DOC], currentDocId: 'welcome', isLoaded: true })
    }
  },

  saveToDB: async () => {
    const state = get()
    try {
      for (const doc of state.documents) {
        await saveToIndexedDB('documents', doc)
      }
    } catch (err) {
      console.error('Save to DB failed:', err)
    }
  },

  addDoc: (doc) => {
    const id = `doc_${++docCounter}_${Date.now()}`
    const newDoc = { ...doc, id, updatedAt: Date.now() }
    set((state) => ({
      documents: [...state.documents, newDoc],
    }))
    debounceSave(get)
    return id
  },

  removeDoc: (id) => {
    set((state) => ({
      documents: state.documents.filter((d) => d.id !== id),
      currentDocId: state.currentDocId === id ? null : state.currentDocId,
    }))
    debounceSave(get)
  },

  updateDoc: (id, updates) => {
    set((state) => ({
      documents: state.documents.map((d) =>
        d.id === id ? { ...d, ...updates, updatedAt: Date.now() } : d
      ),
    }))
    debounceSave(get)
  },

  setCurrentDoc: (id) => set({ currentDocId: id }),

  getCurrentDoc: () => {
    const state = get()
    return state.documents.find((d) => d.id === state.currentDocId)
  },

  createVersion: (docId) => {
    const state = get()
    const doc = state.documents.find((d) => d.id === docId)
    if (!doc) return

    const version: DocumentVersion = {
      id: `ver_${Date.now()}`,
      content: JSON.parse(JSON.stringify(doc.content)),
      title: doc.title,
      createdAt: Date.now(),
    }

    set((state) => ({
      documents: state.documents.map((d) =>
        d.id === docId
          ? { ...d, versions: [...(d.versions || []), version].slice(-20) }
          : d
      ),
    }))
    debounceSave(get)
  },

  restoreVersion: (docId, versionId) => {
    const state = get()
    const doc = state.documents.find((d) => d.id === docId)
    if (!doc?.versions) return

    const version = doc.versions.find((v) => v.id === versionId)
    if (!version) return

    set((state) => ({
      documents: state.documents.map((d) =>
        d.id === docId
          ? {
              ...d,
              content: JSON.parse(JSON.stringify(version.content)),
              title: version.title,
              updatedAt: Date.now(),
            }
          : d
      ),
    }))
    debounceSave(get)
  },

  getVersions: (docId) => {
    const state = get()
    const doc = state.documents.find((d) => d.id === docId)
    return doc?.versions || []
  },

  markDirty: () => set({ isDirty: true }),
  markClean: () => set({ isDirty: false }),
}))
