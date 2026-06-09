import { create } from 'zustand'
import {
  createCollaborationService,
  getCollaborationService,
  type CollaborationService,
  type Collaborator,
  type Operation,
} from '../services/collaboration'

interface CollaborationState {
  isConnected: boolean
  documentId: string | null
  collaborators: Collaborator[]
  pendingOperations: number
  syncVersion: number

  connect: (serverUrl: string, documentId: string) => Promise<void>
  disconnect: () => void
  sendOperation: (operation: Omit<Operation, 'id' | 'userId' | 'timestamp' | 'version'>) => void
  sendCursorUpdate: (cursor: { position: number; selection?: { from: number; to: number } }) => void
  requestSync: () => void
}

export const useCollaborationStore = create<CollaborationState>((set, get) => ({
  isConnected: false,
  documentId: null,
  collaborators: [],
  pendingOperations: 0,
  syncVersion: 0,

  connect: async (serverUrl: string, documentId: string) => {
    const service = createCollaborationService({ serverUrl, documentId })

    service.on('connected', ({ userId, color }) => {
      console.log('Connected as', userId, color)
    })

    service.on('document-joined', ({ content, version, collaborators }) => {
      set({
        isConnected: true,
        documentId,
        collaborators,
        syncVersion: version,
      })
    })

    service.on('operation', ({ operation }) => {
      const event = new CustomEvent('collaboration-operation', { detail: operation })
      window.dispatchEvent(event)
    })

    service.on('cursor-update', ({ userId, cursor }) => {
      set((state) => ({
        collaborators: state.collaborators.map((c) =>
          c.id === userId ? { ...c, cursor } : c
        ),
      }))
    })

    service.on('user-joined', ({ userId }) => {
      set((state) => ({
        collaborators: [
          ...state.collaborators,
          {
            id: userId,
            name: `User ${userId.slice(0, 8)}`,
            color: '#999',
          },
        ],
      }))
    })

    service.on('user-left', ({ userId }) => {
      set((state) => ({
        collaborators: state.collaborators.filter((c) => c.id !== userId),
      }))
    })

    service.on('synced', ({ version }) => {
      set({ syncVersion: version, pendingOperations: 0 })
    })

    service.on('disconnected', () => {
      set({ isConnected: false })
    })

    try {
      await service.connect()
    } catch (error) {
      console.error('Failed to connect:', error)
    }
  },

  disconnect: () => {
    const service = getCollaborationService()
    if (service) {
      service.disconnect()
    }
    set({
      isConnected: false,
      documentId: null,
      collaborators: [],
      pendingOperations: 0,
    })
  },

  sendOperation: (operation) => {
    const service = getCollaborationService()
    if (service) {
      service.sendOperation(operation)
      set((state) => ({ pendingOperations: state.pendingOperations + 1 }))
    }
  },

  sendCursorUpdate: (cursor) => {
    const service = getCollaborationService()
    if (service) {
      service.sendCursorUpdate(cursor)
    }
  },

  requestSync: () => {
    const service = getCollaborationService()
    if (service) {
      service.requestSync()
    }
  },
}))
