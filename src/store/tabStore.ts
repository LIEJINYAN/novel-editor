import { create } from 'zustand'

interface Tab {
  docId: string
  title: string
  lastAccessed: number
}

interface TabState {
  openTabs: Tab[]
  activeTabId: string | null
  maxTabs: number
  openTab: (docId: string, title: string) => void
  closeTab: (docId: string) => void
  setActiveTab: (docId: string) => void
  updateTabTitle: (docId: string, title: string) => void
  getOpenTabs: () => Tab[]
  saveSession: () => void
  loadSession: () => void
  clearSession: () => void
}

const SESSION_STORAGE_KEY = 'novel-engine-tab-session'

export const useTabStore = create<TabState>((set, get) => ({
  openTabs: [],
  activeTabId: null,
  maxTabs: 10,

  openTab: (docId, title) => {
    set((state) => {
      const existingTab = state.openTabs.find((t) => t.docId === docId)
      if (existingTab) {
        const newState = {
          openTabs: state.openTabs.map((t) =>
            t.docId === docId ? { ...t, lastAccessed: Date.now() } : t
          ),
          activeTabId: docId,
        }
        setTimeout(() => get().saveSession(), 0)
        return newState
      }

      const newTab: Tab = { docId, title, lastAccessed: Date.now() }
      let newTabs = [...state.openTabs, newTab]

      if (newTabs.length > state.maxTabs) {
        newTabs = newTabs.sort((a, b) => a.lastAccessed - b.lastAccessed).slice(1)
      }

      const newState = {
        openTabs: newTabs,
        activeTabId: docId,
      }
      setTimeout(() => get().saveSession(), 0)
      return newState
    })
  },

  closeTab: (docId) => {
    set((state) => {
      const newTabs = state.openTabs.filter((t) => t.docId !== docId)
      let newActiveId = state.activeTabId

      if (state.activeTabId === docId) {
        if (newTabs.length > 0) {
          const closedIndex = state.openTabs.findIndex((t) => t.docId === docId)
          const newIndex = Math.min(closedIndex, newTabs.length - 1)
          newActiveId = newTabs[newIndex].docId
        } else {
          newActiveId = null
        }
      }

      const newState = {
        openTabs: newTabs,
        activeTabId: newActiveId,
      }
      setTimeout(() => get().saveSession(), 0)
      return newState
    })
  },

  setActiveTab: (docId) => {
    set((state) => {
      const newState = {
        activeTabId: docId,
        openTabs: state.openTabs.map((t) =>
          t.docId === docId ? { ...t, lastAccessed: Date.now() } : t
        ),
      }
      setTimeout(() => get().saveSession(), 0)
      return newState
    })
  },

  updateTabTitle: (docId, title) => {
    set((state) => ({
      openTabs: state.openTabs.map((t) =>
        t.docId === docId ? { ...t, title } : t
      ),
    }))
    setTimeout(() => get().saveSession(), 0)
  },

  getOpenTabs: () => get().openTabs,

  saveSession: () => {
    const state = get()
    const session = {
      openTabs: state.openTabs,
      activeTabId: state.activeTabId,
    }
    try {
      localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(session))
    } catch (err) {
      console.error('Failed to save tab session:', err)
    }
  },

  loadSession: () => {
    try {
      const stored = localStorage.getItem(SESSION_STORAGE_KEY)
      if (stored) {
        const session = JSON.parse(stored)
        set({
          openTabs: session.openTabs || [],
          activeTabId: session.activeTabId || null,
        })
      }
    } catch (err) {
      console.error('Failed to load tab session:', err)
    }
  },

  clearSession: () => {
    try {
      localStorage.removeItem(SESSION_STORAGE_KEY)
      set({
        openTabs: [],
        activeTabId: null,
      })
    } catch (err) {
      console.error('Failed to clear tab session:', err)
    }
  },
}))
