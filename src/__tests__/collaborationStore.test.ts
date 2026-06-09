import { describe, it, expect, beforeEach, vi } from 'vitest'
import { useCollaborationStore } from '../store/collaborationStore'

describe('collaborationStore', () => {
  beforeEach(() => {
    useCollaborationStore.setState({
      isConnected: false,
      documentId: null,
      collaborators: [],
      pendingOperations: 0,
      syncVersion: 0,
    })
  })

  it('should have default values', () => {
    const state = useCollaborationStore.getState()
    expect(state.isConnected).toBe(false)
    expect(state.documentId).toBeNull()
    expect(state.collaborators).toEqual([])
    expect(state.pendingOperations).toBe(0)
    expect(state.syncVersion).toBe(0)
  })

  it('should disconnect and reset state', () => {
    useCollaborationStore.setState({
      isConnected: true,
      documentId: 'doc-1',
      collaborators: [{ id: 'user-1', name: 'Test', color: '#ff0000' }],
      pendingOperations: 5,
    })

    const { disconnect } = useCollaborationStore.getState()
    disconnect()

    const state = useCollaborationStore.getState()
    expect(state.isConnected).toBe(false)
    expect(state.documentId).toBeNull()
    expect(state.collaborators).toEqual([])
    expect(state.pendingOperations).toBe(0)
  })

  it('should track collaborators', () => {
    const collaborators = [
      { id: 'user-1', name: 'Alice', color: '#ff0000' },
      { id: 'user-2', name: 'Bob', color: '#00ff00' },
    ]
    useCollaborationStore.setState({ collaborators })

    const state = useCollaborationStore.getState()
    expect(state.collaborators.length).toBe(2)
    expect(state.collaborators[0].name).toBe('Alice')
  })

  it('should update collaborator cursor', () => {
    const collaborators = [
      { id: 'user-1', name: 'Alice', color: '#ff0000' },
    ]
    useCollaborationStore.setState({ collaborators })

    useCollaborationStore.setState((state) => ({
      collaborators: state.collaborators.map((c) =>
        c.id === 'user-1' ? { ...c, cursor: { position: 10 } } : c
      ),
    }))

    const updated = useCollaborationStore.getState()
    expect(updated.collaborators[0].cursor?.position).toBe(10)
  })

  it('should increment pending operations', () => {
    useCollaborationStore.setState({ pendingOperations: 0 })
    useCollaborationStore.setState((state) => ({
      pendingOperations: state.pendingOperations + 1,
    }))
    expect(useCollaborationStore.getState().pendingOperations).toBe(1)

    useCollaborationStore.setState((state) => ({
      pendingOperations: state.pendingOperations + 1,
    }))
    expect(useCollaborationStore.getState().pendingOperations).toBe(2)
  })

  it('should update sync version', () => {
    useCollaborationStore.setState({ syncVersion: 0, pendingOperations: 5 })
    useCollaborationStore.setState({ syncVersion: 10, pendingOperations: 0 })
    const state = useCollaborationStore.getState()
    expect(state.syncVersion).toBe(10)
    expect(state.pendingOperations).toBe(0)
  })
})

describe('collaboration service', () => {
  it('should export collaboration service functions', async () => {
    const mod = await import('../services/collaboration')
    expect(typeof mod.createCollaborationService).toBe('function')
    expect(typeof mod.getCollaborationService).toBe('function')
  })
})
