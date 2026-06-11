import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
  saveAgentMemory,
  loadAgentMemory,
  saveConversation,
  updateConversation,
  loadConversations,
  loadConversation,
  deleteConversation,
  type AgentConversation,
} from '../services/agent/agentMemory'

const mockSaveToIndexedDB = vi.fn().mockResolvedValue(undefined)
const mockGetAllFromIndexedDB = vi.fn().mockResolvedValue([])
const mockDeleteFromIndexedDB = vi.fn().mockResolvedValue(undefined)

vi.mock('../utils/idb', () => ({
  saveToIndexedDB: (...args: any[]) => mockSaveToIndexedDB(...args),
  getAllFromIndexedDB: (...args: any[]) => mockGetAllFromIndexedDB(...args),
  deleteFromIndexedDB: (...args: any[]) => mockDeleteFromIndexedDB(...args),
}))

beforeEach(() => {
  vi.clearAllMocks()
  mockSaveToIndexedDB.mockResolvedValue(undefined)
  mockGetAllFromIndexedDB.mockResolvedValue([])
  mockDeleteFromIndexedDB.mockResolvedValue(undefined)
})

describe('agentMemory', () => {
  describe('saveAgentMemory', () => {
    it('should save memory with correct structure', async () => {
      await saveAgentMemory('test memory summary')
      expect(mockSaveToIndexedDB).toHaveBeenCalledTimes(1)
      const [key, data] = mockSaveToIndexedDB.mock.calls[0]
      expect(key).toBe('agent-memory')
      expect(data.summary).toBe('test memory summary')
      expect(data.id).toBe('default')
      expect(data.updatedAt).toBeTypeOf('number')
    })

    it('should overwrite previous memory', async () => {
      await saveAgentMemory('first memory')
      await saveAgentMemory('second memory')
      expect(mockSaveToIndexedDB).toHaveBeenCalledTimes(2)
      const secondCall = mockSaveToIndexedDB.mock.calls[1]
      expect(secondCall[1].summary).toBe('second memory')
    })
  })

  describe('loadAgentMemory', () => {
    it('should return empty string when no memory exists', async () => {
      mockGetAllFromIndexedDB.mockResolvedValue([])
      const result = await loadAgentMemory()
      expect(result).toBe('')
    })

    it('should return memory summary when exists', async () => {
      mockGetAllFromIndexedDB.mockResolvedValue([
        { id: 'default', summary: 'saved memory', updatedAt: Date.now() },
      ])
      const result = await loadAgentMemory()
      expect(result).toBe('saved memory')
    })

    it('should return empty string on IndexedDB error', async () => {
      mockGetAllFromIndexedDB.mockRejectedValue(new Error('DB error'))
      const result = await loadAgentMemory()
      expect(result).toBe('')
    })

    it('should return first item if multiple exist', async () => {
      mockGetAllFromIndexedDB.mockResolvedValue([
        { id: 'default', summary: 'first', updatedAt: Date.now() },
        { id: 'extra', summary: 'second', updatedAt: Date.now() },
      ])
      const result = await loadAgentMemory()
      expect(result).toBe('first')
    })
  })

  describe('saveConversation', () => {
    it('should save a conversation and return id', async () => {
      const id = await saveConversation({
        title: 'Test Conversation',
        messages: [{ role: 'user', content: 'hello', timestamp: Date.now() }],
        memory: 'test memory',
      })
      expect(id).toBeDefined()
      expect(typeof id).toBe('string')
      expect(id).toMatch(/^conv_/)
    })

    it('should include correct fields in saved data', async () => {
      const messages = [
        { role: 'user' as const, content: 'hello', timestamp: 100 },
        { role: 'assistant' as const, content: 'hi', timestamp: 200 },
      ]
      await saveConversation({
        title: 'My Conv',
        messages,
        memory: 'some memory',
      })
      expect(mockSaveToIndexedDB).toHaveBeenCalledTimes(1)
      const [key, data] = mockSaveToIndexedDB.mock.calls[0]
      expect(key).toBe('agent-history')
      expect(data.title).toBe('My Conv')
      expect(data.messages).toEqual(messages)
      expect(data.memory).toBe('some memory')
      expect(data.id).toMatch(/^conv_/)
      expect(data.createdAt).toBeTypeOf('number')
      expect(data.updatedAt).toBeTypeOf('number')
    })

    it('should call trimHistory after saving', async () => {
      mockGetAllFromIndexedDB.mockResolvedValue([])
      await saveConversation({
        title: 'Test',
        messages: [],
        memory: '',
      })
      expect(mockGetAllFromIndexedDB).toHaveBeenCalled()
    })

    it('should trim history when exceeding MAX_HISTORY (50)', async () => {
      const manyConversations = Array.from({ length: 55 }, (_, i) => ({
        id: `conv_${i}`,
        title: `Conv ${i}`,
        messages: [],
        memory: '',
        createdAt: Date.now() - i * 1000,
        updatedAt: Date.now() - i * 1000,
      }))
      const afterSave = Array.from({ length: 56 }, (_, i) => ({
        id: `conv_${i}`,
        title: `Conv ${i}`,
        messages: [],
        memory: '',
        createdAt: Date.now() - i * 1000,
        updatedAt: Date.now() - i * 1000,
      }))
      mockGetAllFromIndexedDB
        .mockResolvedValueOnce(manyConversations)
        .mockResolvedValueOnce(afterSave)

      await saveConversation({
        title: 'New',
        messages: [],
        memory: '',
      })

      expect(mockDeleteFromIndexedDB).toHaveBeenCalled()
      const deleteCalls = mockDeleteFromIndexedDB.mock.calls
      expect(deleteCalls.length).toBeGreaterThan(0)
    })

    it('should not trim when at or below MAX_HISTORY', async () => {
      mockGetAllFromIndexedDB.mockReset()
      mockGetAllFromIndexedDB.mockResolvedValue(
        Array.from({ length: 30 }, (_, i) => ({
          id: `conv_${i}`,
          title: `Conv ${i}`,
          messages: [],
          memory: '',
          createdAt: Date.now(),
          updatedAt: Date.now(),
        }))
      )

      await saveConversation({
        title: 'New',
        messages: [],
        memory: '',
      })

      expect(mockDeleteFromIndexedDB).not.toHaveBeenCalled()
    })

    it('should handle messages with toolCalls', async () => {
      const messages = [
        {
          role: 'assistant' as const,
          content: 'executed tool',
          timestamp: Date.now(),
          toolCalls: [{ id: 'call_1', name: 'insert_text', args: { text: 'hello' } }],
        },
      ]
      await saveConversation({
        title: 'Tool conversation',
        messages,
        memory: '',
      })
      const savedData = mockSaveToIndexedDB.mock.calls[0][1]
      expect(savedData.messages[0].toolCalls).toHaveLength(1)
      expect(savedData.messages[0].toolCalls![0].name).toBe('insert_text')
    })
  })

  describe('updateConversation', () => {
    it('should update without error', async () => {
      await expect(
        updateConversation('conv-1', { memory: 'updated memory' })
      ).resolves.toBeUndefined()
    })

    it('should merge updates with existing conversation', async () => {
      const existing = {
        id: 'conv-1',
        title: 'Original Title',
        messages: [{ role: 'user', content: 'hello', timestamp: Date.now() }],
        memory: 'old memory',
        createdAt: Date.now(),
        updatedAt: Date.now(),
      }
      mockGetAllFromIndexedDB.mockResolvedValue([existing])

      await updateConversation('conv-1', { memory: 'new memory' })

      const savedData = mockSaveToIndexedDB.mock.calls[0][1]
      expect(savedData.memory).toBe('new memory')
      expect(savedData.title).toBe('Original Title')
      expect(savedData.messages).toEqual(existing.messages)
    })

    it('should update title', async () => {
      const existing = {
        id: 'conv-1',
        title: 'Old Title',
        messages: [],
        memory: '',
        createdAt: Date.now(),
        updatedAt: Date.now(),
      }
      mockGetAllFromIndexedDB.mockResolvedValue([existing])

      await updateConversation('conv-1', { title: 'New Title' })

      const savedData = mockSaveToIndexedDB.mock.calls[0][1]
      expect(savedData.title).toBe('New Title')
    })

    it('should update messages', async () => {
      const existing = {
        id: 'conv-1',
        title: 'Conv',
        messages: [],
        memory: '',
        createdAt: Date.now(),
        updatedAt: Date.now(),
      }
      mockGetAllFromIndexedDB.mockResolvedValue([existing])

      const newMessages = [{ role: 'user', content: 'hi', timestamp: Date.now() }]
      await updateConversation('conv-1', { messages: newMessages as any })

      const savedData = mockSaveToIndexedDB.mock.calls[0][1]
      expect(savedData.messages).toEqual(newMessages)
    })

    it('should not save if conversation not found', async () => {
      mockGetAllFromIndexedDB.mockResolvedValue([])
      await updateConversation('non-existent', { memory: 'new' })
      expect(mockSaveToIndexedDB).not.toHaveBeenCalled()
    })

    it('should update the updatedAt timestamp', async () => {
      const before = Date.now()
      const existing = {
        id: 'conv-1',
        title: 'Conv',
        messages: [],
        memory: '',
        createdAt: before - 10000,
        updatedAt: before - 10000,
      }
      mockGetAllFromIndexedDB.mockResolvedValue([existing])

      await updateConversation('conv-1', { memory: 'updated' })

      const savedData = mockSaveToIndexedDB.mock.calls[0][1]
      expect(savedData.updatedAt).toBeGreaterThanOrEqual(before)
    })

    it('should handle IndexedDB errors during read', async () => {
      mockGetAllFromIndexedDB.mockRejectedValue(new Error('DB read error'))
      await expect(
        updateConversation('conv-1', { memory: 'new' })
      ).rejects.toThrow('DB read error')
    })
  })

  describe('loadConversations', () => {
    it('should return array', async () => {
      const convs = await loadConversations()
      expect(Array.isArray(convs)).toBe(true)
    })

    it('should return conversations sorted by updatedAt descending', async () => {
      mockGetAllFromIndexedDB.mockResolvedValue([
        { id: 'c1', updatedAt: 100 },
        { id: 'c2', updatedAt: 300 },
        { id: 'c3', updatedAt: 200 },
      ])
      const convs = await loadConversations()
      expect(convs[0].id).toBe('c2')
      expect(convs[1].id).toBe('c3')
      expect(convs[2].id).toBe('c1')
    })

    it('should return empty array on IndexedDB error', async () => {
      mockGetAllFromIndexedDB.mockRejectedValue(new Error('DB error'))
      const result = await loadConversations()
      expect(result).toEqual([])
    })

    it('should return empty array when no conversations', async () => {
      mockGetAllFromIndexedDB.mockResolvedValue([])
      const result = await loadConversations()
      expect(result).toEqual([])
    })
  })

  describe('loadConversation', () => {
    it('should return null for non-existent', async () => {
      const conv = await loadConversation('non-existent')
      expect(conv).toBeNull()
    })

    it('should return conversation when found', async () => {
      const mockConv = {
        id: 'conv-1',
        title: 'Found Conv',
        messages: [],
        memory: 'test',
        createdAt: Date.now(),
        updatedAt: Date.now(),
      }
      mockGetAllFromIndexedDB.mockResolvedValue([mockConv])
      const conv = await loadConversation('conv-1')
      expect(conv).toEqual(mockConv)
    })

    it('should return null on IndexedDB error', async () => {
      mockGetAllFromIndexedDB.mockRejectedValue(new Error('DB error'))
      const conv = await loadConversation('conv-1')
      expect(conv).toBeNull()
    })

    it('should return null when id does not match any', async () => {
      mockGetAllFromIndexedDB.mockResolvedValue([
        { id: 'conv-a' },
        { id: 'conv-b' },
      ])
      const conv = await loadConversation('conv-c')
      expect(conv).toBeNull()
    })
  })

  describe('deleteConversation', () => {
    it('should delete without error', async () => {
      await expect(deleteConversation('conv-1')).resolves.toBeUndefined()
      expect(mockDeleteFromIndexedDB).toHaveBeenCalledWith('agent-history', 'conv-1')
    })

    it('should pass correct key to deleteFromIndexedDB', async () => {
      await deleteConversation('my-conv-id')
      expect(mockDeleteFromIndexedDB).toHaveBeenCalledTimes(1)
      expect(mockDeleteFromIndexedDB).toHaveBeenCalledWith('agent-history', 'my-conv-id')
    })

    it('should propagate errors from IndexedDB', async () => {
      mockDeleteFromIndexedDB.mockRejectedValue(new Error('Delete failed'))
      await expect(deleteConversation('conv-1')).rejects.toThrow('Delete failed')
    })
  })

  describe('trimHistory (indirect testing via saveConversation)', () => {
    it('should delete oldest items when history exceeds 50', async () => {
      const conversations = Array.from({ length: 52 }, (_, i) => ({
        id: `conv_${i}`,
        title: `Conv ${i}`,
        messages: [],
        memory: '',
        createdAt: Date.now() - (52 - i) * 1000,
        updatedAt: Date.now() - (52 - i) * 1000,
      }))
      const afterSave = Array.from({ length: 53 }, (_, i) => ({
        id: `conv_${i}`,
        title: `Conv ${i}`,
        messages: [],
        memory: '',
        createdAt: Date.now() - (53 - i) * 1000,
        updatedAt: Date.now() - (53 - i) * 1000,
      }))
      mockGetAllFromIndexedDB
        .mockResolvedValueOnce(conversations)
        .mockResolvedValueOnce(afterSave)

      await saveConversation({
        title: 'New',
        messages: [],
        memory: '',
      })

      const deleteCalls = mockDeleteFromIndexedDB.mock.calls
      expect(deleteCalls.length).toBeGreaterThan(0)
    })

    it('should handle IndexedDB error during trim gracefully', async () => {
      mockGetAllFromIndexedDB.mockRejectedValue(new Error('DB error'))

      await expect(
        saveConversation({
          title: 'Test',
          messages: [],
          memory: '',
        })
      ).resolves.toBeDefined()
    })
  })

  describe('interface compliance', () => {
    it('saveConversation should produce valid AgentConversation shape', async () => {
      const id = await saveConversation({
        title: 'Shape Test',
        messages: [
          {
            role: 'user',
            content: 'test',
            timestamp: Date.now(),
            toolCalls: [{ id: 'c1', name: 'tool', args: {} }],
          },
        ],
        memory: 'mem',
      })

      const savedData = mockSaveToIndexedDB.mock.calls[0][1]
      expect(savedData).toHaveProperty('id')
      expect(savedData).toHaveProperty('title')
      expect(savedData).toHaveProperty('messages')
      expect(savedData).toHaveProperty('memory')
      expect(savedData).toHaveProperty('createdAt')
      expect(savedData).toHaveProperty('updatedAt')
    })
  })
})
