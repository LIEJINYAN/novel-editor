import { describe, it, expect, beforeEach, vi } from 'vitest'
import {
  CollaborationService,
  createCollaborationService,
  getCollaborationService,
} from '../services/collaboration'

describe('collaboration', () => {
  let service: CollaborationService

  beforeEach(() => {
    service = new CollaborationService({
      serverUrl: 'ws://localhost:8080',
      documentId: 'doc1',
    })
  })

  it('should create service with config', () => {
    expect(service).toBeTruthy()
  })

  it('should get user id and color', () => {
    expect(service.getUserId()).toBe('')
    expect(service.getUserColor()).toBe('')
  })

  it('should register and unregister event handlers', () => {
    const handler = vi.fn()
    service.on('test', handler)
    service.off('test', handler)
    // Should not throw
  })

  it('should unregister non-existent handler gracefully', () => {
    const handler = vi.fn()
    service.off('nonexistent', handler)
    // Should not throw
  })

  it('should create singleton via factory', () => {
    const s1 = createCollaborationService({ serverUrl: 'ws://localhost', documentId: 'd1' })
    const s2 = createCollaborationService({ serverUrl: 'ws://localhost', documentId: 'd2' })
    expect(s1).not.toBe(s2) // Should create new instance (disconnects old)
  })

  it('should get collaboration service instance', () => {
    createCollaborationService({ serverUrl: 'ws://localhost', documentId: 'd1' })
    expect(getCollaborationService()).toBeTruthy()
  })

  it('should handle disconnect when not connected', () => {
    service.disconnect()
    // Should not throw
  })

  // BUG: attemptReconnect creates new connection without checking if ws is already open
  // This could lead to multiple WebSocket connections
  it('should handle multiple disconnect calls', () => {
    service.disconnect()
    service.disconnect()
    // Should not throw
  })

  // BUG: sendOperation uses crypto.randomUUID() which may not be available in test env
  it('should send operation when connected', () => {
    // Mock WebSocket
    const mockWs = {
      readyState: 1, // OPEN
      send: vi.fn(),
      close: vi.fn(),
    }
    ;(service as any).ws = mockWs
    ;(service as any).userId = 'user1'

    service.sendOperation({
      documentId: 'doc1',
      type: 'insert',
      position: 0,
      content: 'hello',
    })

    expect(mockWs.send).toHaveBeenCalled()
    const sent = JSON.parse(mockWs.send.mock.calls[0][0])
    expect(sent.type).toBe('operation')
    expect(sent.operation.type).toBe('insert')
  })

  it('should not send when ws is null', () => {
    service.sendOperation({
      documentId: 'doc1',
      type: 'insert',
      position: 0,
    })
    // Should not throw
  })

  it('should send cursor update', () => {
    const mockWs = {
      readyState: 1,
      send: vi.fn(),
      close: vi.fn(),
    }
    ;(service as any).ws = mockWs

    service.sendCursorUpdate({ position: 10 })
    expect(mockWs.send).toHaveBeenCalled()
  })

  it('should request sync', () => {
    const mockWs = {
      readyState: 1,
      send: vi.fn(),
      close: vi.fn(),
    }
    ;(service as any).ws = mockWs

    service.requestSync()
    expect(mockWs.send).toHaveBeenCalled()
  })

  // BUG: handleMessage doesn't handle all message types
  it('should handle connected message', () => {
    const handler = vi.fn()
    service.on('connected', handler)
    ;(service as any).handleMessage({ type: 'connected', userId: 'u1', color: '#ff0000' })
    expect(handler).toHaveBeenCalledWith({ userId: 'u1', color: '#ff0000' })
  })

  it('should handle document-joined message', () => {
    const handler = vi.fn()
    service.on('document-joined', handler)
    ;(service as any).handleMessage({
      type: 'document-joined',
      documentId: 'd1',
      content: 'test',
      version: 1,
      collaborators: [],
    })
    expect(handler).toHaveBeenCalled()
  })

  it('should handle operation message', () => {
    const handler = vi.fn()
    service.on('operation', handler)
    ;(service as any).handleMessage({ type: 'operation', operation: { id: 'op1' } })
    expect(handler).toHaveBeenCalled()
  })

  it('should handle cursor-update message', () => {
    const handler = vi.fn()
    service.on('cursor-update', handler)
    ;(service as any).handleMessage({ type: 'cursor-update', userId: 'u1', cursor: { position: 5 } })
    expect(handler).toHaveBeenCalled()
  })

  it('should handle user-joined message', () => {
    const handler = vi.fn()
    service.on('user-joined', handler)
    ;(service as any).handleMessage({ type: 'user-joined', userId: 'u1' })
    expect(handler).toHaveBeenCalled()
  })

  it('should handle user-left message', () => {
    const handler = vi.fn()
    service.on('user-left', handler)
    ;(service as any).handleMessage({ type: 'user-left', userId: 'u1' })
    expect(handler).toHaveBeenCalled()
  })

  it('should handle sync-data message', () => {
    const handler = vi.fn()
    service.on('sync-data', handler)
    ;(service as any).handleMessage({ type: 'sync-data', documentId: 'd1', content: 'c', version: 1 })
    expect(handler).toHaveBeenCalled()
  })

  it('should handle operation-ack', () => {
    const handler = vi.fn()
    service.on('synced', handler)
    ;(service as any).pendingOperations = [{ id: 'op1' }]
    ;(service as any).handleMessage({ type: 'operation-ack', operationId: 'op1', version: 5 })
    expect(handler).toHaveBeenCalledWith({ version: 5 })
    expect((service as any).pendingOperations.length).toBe(0)
  })

  it('should ignore unknown message types', () => {
    ;(service as any).handleMessage({ type: 'unknown-type' })
    // Should not throw
  })
})
