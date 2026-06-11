import { create } from 'zustand'
import { saveToIndexedDB, getAllFromIndexedDB, deleteFromIndexedDB } from '../utils/idb'
import { throttle } from '../utils/throttle'
import { showError } from '../utils/toast'

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
  folderId?: string | null
  versions?: DocumentVersion[]
}

export interface Folder {
  id: string
  name: string
  parentId: string | null
  createdAt: number
  updatedAt: number
}

interface DocumentState {
  documents: Document[]
  folders: Folder[]
  currentDocId: string | null
  isLoaded: boolean
  isDirty: boolean
  addDoc: (doc: Omit<Document, 'id' | 'updatedAt'>) => Promise<string>
  removeDoc: (id: string) => Promise<void>
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
  moveDocToFolder: (docId: string, folderId: string | null) => void
  addFolder: (name: string, parentId?: string | null) => string
  removeFolder: (id: string) => void
  renameFolder: (id: string, name: string) => void
  getDocumentsInFolder: (folderId: string | null) => Document[]
  getSubFolders: (parentId: string | null) => Folder[]
}

let docCounter = 0
let saveTimeout: ReturnType<typeof setTimeout> | null = null

const throttledSave = throttle(async (getState: () => DocumentState) => {
  const state = getState()
  try {
    for (const doc of state.documents) {
      await saveToIndexedDB('documents', doc)
    }
    for (const folder of state.folders) {
      await saveToIndexedDB('folders', folder)
    }
  } catch (err) {
    showError('自动保存失败')
    console.error('Auto-save failed:', err)
  }
}, 2000)

function debounceSave(getState: () => DocumentState) {
  if (saveTimeout) {
    clearTimeout(saveTimeout)
  }
  saveTimeout = setTimeout(() => {
    throttledSave(getState)
  }, 500)
}

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

export const useDocumentStore = create<DocumentState>((set, get) => ({
  documents: [],
  folders: [],
  currentDocId: null,
  isLoaded: false,
  isDirty: false,

  loadFromDB: async () => {
    try {
      const docs = await getAllFromIndexedDB<Document>('documents')
      const folders = await getAllFromIndexedDB<Folder>('folders')
      if (docs.length > 0) {
        set({ documents: docs, folders: folders || [], isLoaded: true })
      } else {
        set({ documents: [WELCOME_DOC], folders: [], currentDocId: 'welcome', isLoaded: true })
        await saveToIndexedDB('documents', WELCOME_DOC)
      }
    } catch (err) {
      console.error('Failed to load from DB:', err)
      set({ documents: [WELCOME_DOC], folders: [], currentDocId: 'welcome', isLoaded: true })
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

  addDoc: async (doc) => {
    const id = `doc_${++docCounter}_${Date.now()}`
    const newDoc = { ...doc, id, updatedAt: Date.now() }
    set((state) => ({
      documents: [...state.documents, newDoc],
    }))
    try {
      await saveToIndexedDB('documents', newDoc)
    } catch (err) {
      showError('保存文档失败')
      console.error('Failed to save new doc to DB:', err)
    }
    return id
  },

  moveDocToFolder: (docId, folderId) => {
    set((state) => ({
      documents: state.documents.map((d) =>
        d.id === docId ? { ...d, folderId, updatedAt: Date.now() } : d
      ),
    }))
  },

  removeDoc: async (id) => {
    set((state) => ({
      documents: state.documents.filter((d) => d.id !== id),
      currentDocId: state.currentDocId === id ? null : state.currentDocId,
    }))
    try {
      await deleteFromIndexedDB('documents', id)
    } catch (err) {
      showError('删除文档失败')
      console.error('Failed to delete from DB:', err)
    }
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

  addFolder: (name, parentId = null) => {
    const id = `folder_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
    const newFolder: Folder = {
      id,
      name,
      parentId,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    }
    set((state) => ({
      folders: [...state.folders, newFolder],
    }))
    saveToIndexedDB('folders', newFolder).catch(console.error)
    return id
  },

  removeFolder: (id) => {
    set((state) => ({
      folders: state.folders.filter((f) => f.id !== id),
      documents: state.documents.map((d) =>
        d.folderId === id ? { ...d, folderId: null } : d
      ),
    }))
    deleteFromIndexedDB('folders', id).catch(console.error)
  },

  renameFolder: (id, name) => {
    set((state) => ({
      folders: state.folders.map((f) =>
        f.id === id ? { ...f, name, updatedAt: Date.now() } : f
      ),
    }))
  },

  getDocumentsInFolder: (folderId) => {
    const state = get()
    return state.documents.filter((d) => d.folderId === folderId)
  },

  getSubFolders: (parentId) => {
    const state = get()
    return state.folders.filter((f) => f.parentId === parentId)
  },
}))
