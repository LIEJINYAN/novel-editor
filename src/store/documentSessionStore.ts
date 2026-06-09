import { create } from 'zustand'

interface DocumentSession {
  docId: string
  undoStack: object[]
  redoStack: object[]
  cursorPosition: number | null
  scrollPosition: number
  lastModified: number
}

interface DocumentSessionState {
  sessions: Record<string, DocumentSession>
  createSession: (docId: string) => void
  removeSession: (docId: string) => void
  pushUndo: (docId: string, content: object) => void
  undo: (docId: string) => object | null
  redo: (docId: string) => object | null
  canUndo: (docId: string) => boolean
  canRedo: (docId: string) => boolean
  clearHistory: (docId: string) => void
  setCursorPosition: (docId: string, position: number) => void
  getCursorPosition: (docId: string) => number | null
  setScrollPosition: (docId: string, position: number) => void
  getScrollPosition: (docId: string) => number
  getSession: (docId: string) => DocumentSession | undefined
}

const MAX_UNDO_STACK = 100

export const useDocumentSessionStore = create<DocumentSessionState>((set, get) => ({
  sessions: {},

  createSession: (docId) => {
    set((state) => ({
      sessions: {
        ...state.sessions,
        [docId]: {
          docId,
          undoStack: [],
          redoStack: [],
          cursorPosition: null,
          scrollPosition: 0,
          lastModified: Date.now(),
        },
      },
    }))
  },

  removeSession: (docId) => {
    set((state) => {
      const { [docId]: _, ...rest } = state.sessions
      return { sessions: rest }
    })
  },

  pushUndo: (docId, content) => {
    set((state) => {
      const session = state.sessions[docId] || {
        docId,
        undoStack: [],
        redoStack: [],
        cursorPosition: null,
        scrollPosition: 0,
        lastModified: Date.now(),
      }

      const newUndoStack = [...session.undoStack, JSON.parse(JSON.stringify(content))]
      if (newUndoStack.length > MAX_UNDO_STACK) {
        newUndoStack.shift()
      }

      return {
        sessions: {
          ...state.sessions,
          [docId]: {
            ...session,
            undoStack: newUndoStack,
            redoStack: [],
            lastModified: Date.now(),
          },
        },
      }
    })
  },

  undo: (docId) => {
    const state = get()
    const session = state.sessions[docId]
    if (!session || session.undoStack.length === 0) return null

    const newUndoStack = [...session.undoStack]
    const content = newUndoStack.pop()!

    const newRedoStack = [...session.redoStack, JSON.parse(JSON.stringify(content))]

    set({
      sessions: {
        ...state.sessions,
        [docId]: {
          ...session,
          undoStack: newUndoStack,
          redoStack: newRedoStack,
        },
      },
    })

    return content
  },

  redo: (docId) => {
    const state = get()
    const session = state.sessions[docId]
    if (!session || session.redoStack.length === 0) return null

    const newRedoStack = [...session.redoStack]
    const content = newRedoStack.pop()!

    const newUndoStack = [...session.undoStack, JSON.parse(JSON.stringify(content))]

    set({
      sessions: {
        ...state.sessions,
        [docId]: {
          ...session,
          undoStack: newUndoStack,
          redoStack: newRedoStack,
        },
      },
    })

    return content
  },

  canUndo: (docId) => {
    const session = get().sessions[docId]
    return session ? session.undoStack.length > 0 : false
  },

  canRedo: (docId) => {
    const session = get().sessions[docId]
    return session ? session.redoStack.length > 0 : false
  },

  clearHistory: (docId) => {
    set((state) => {
      const session = state.sessions[docId]
      if (!session) return state

      return {
        sessions: {
          ...state.sessions,
          [docId]: {
            ...session,
            undoStack: [],
            redoStack: [],
          },
        },
      }
    })
  },

  setCursorPosition: (docId, position) => {
    set((state) => {
      const session = state.sessions[docId]
      if (!session) return state

      return {
        sessions: {
          ...state.sessions,
          [docId]: {
            ...session,
            cursorPosition: position,
          },
        },
      }
    })
  },

  getCursorPosition: (docId) => {
    const session = get().sessions[docId]
    return session?.cursorPosition ?? null
  },

  setScrollPosition: (docId, position) => {
    set((state) => {
      const session = state.sessions[docId]
      if (!session) return state

      return {
        sessions: {
          ...state.sessions,
          [docId]: {
            ...session,
            scrollPosition: position,
          },
        },
      }
    })
  },

  getScrollPosition: (docId) => {
    const session = get().sessions[docId]
    return session?.scrollPosition ?? 0
  },

  getSession: (docId) => {
    return get().sessions[docId]
  },
}))
