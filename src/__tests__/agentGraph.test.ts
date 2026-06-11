import { describe, it, expect, vi, beforeEach } from 'vitest'
import { AgentGraph, getAgent, resetAgent, type AgentState } from '../services/agent/agentGraph'

const mockSetOnChunk = vi.fn()
const mockLLM = {
  setOnChunk: mockSetOnChunk,
  invoke: vi.fn(),
}

vi.mock('../services/agent/llmAdapter', () => ({
  getNovelEditorLLM: () => mockLLM,
}))

const mockToolInvoke = vi.fn().mockResolvedValue('tool result')
const mockGetToolByName = vi.fn((name?: string) => {
  if (name === 'insert_text' || name === 'replace_text' || name === 'read_document') {
    return { name, invoke: mockToolInvoke }
  }
  return undefined
})

vi.mock('../services/agent/langchainTools', () => ({
  setToolContext: vi.fn(),
  getToolByName: (...args: any[]) => mockGetToolByName(...args as []),
}))

vi.mock('../services/agent/agentMemory', () => ({
  saveAgentMemory: vi.fn().mockResolvedValue(undefined),
  loadAgentMemory: vi.fn().mockResolvedValue(''),
  saveConversation: vi.fn().mockResolvedValue('conv-1'),
  updateConversation: vi.fn().mockResolvedValue(undefined),
  loadConversations: vi.fn().mockResolvedValue([]),
  loadConversation: vi.fn().mockResolvedValue(null),
  deleteConversation: vi.fn().mockResolvedValue(undefined),
}))

const mockGraphInvoke = vi.fn()

vi.mock('../services/agent/graph', () => ({
  compiledGraph: {
    invoke: (...args: any[]) => mockGraphInvoke(...args as []),
  },
}))

beforeEach(() => {
  vi.clearAllMocks()
  resetAgent()
  mockSetOnChunk.mockClear()
  mockLLM.invoke.mockReset()
  mockToolInvoke.mockReset()
  mockToolInvoke.mockResolvedValue('tool result')
  mockGetToolByName.mockImplementation((name?: string) => {
    if (name === 'insert_text' || name === 'replace_text' || name === 'read_document') {
      return { name, invoke: mockToolInvoke }
    }
    return undefined
  })
  mockGraphInvoke.mockReset()
})

function createAgent(config?: Partial<AgentState['context']>): AgentGraph {
  const agent = new AgentGraph()
  if (config) {
    agent.updateContext(config)
  }
  return agent
}

describe('AgentGraph', () => {
  let agent: AgentGraph

  beforeEach(() => {
    agent = new AgentGraph()
  })

  describe('constructor', () => {
    it('should have default config', () => {
      const state = agent.getState()
      expect(state.messages).toHaveLength(0)
      expect(state.currentStep).toBe('idle')
      expect(state.pendingToolCalls).toHaveLength(0)
      expect(state.humanReviewRequired).toBe(false)
    })

    it('should accept custom config', () => {
      const customAgent = new AgentGraph({
        maxIterations: 5,
        requireReviewForInsert: false,
        memoryEnabled: false,
      })
      expect(customAgent).toBeDefined()
    })
  })

  describe('updateContext', () => {
    it('should merge context', () => {
      agent.updateContext({ documentContent: 'content' })
      agent.updateContext({ documentTitle: 'title' })
      const state = agent.getState()
      expect(state.context.documentContent).toBe('content')
      expect(state.context.documentTitle).toBe('title')
    })

    it('should preserve existing context fields', () => {
      agent.updateContext({ documentContent: 'content', documentTitle: 'title' })
      agent.updateContext({ selection: 'selected text' })
      const state = agent.getState()
      expect(state.context.documentContent).toBe('content')
      expect(state.context.documentTitle).toBe('title')
      expect(state.context.selection).toBe('selected text')
    })

    it('should update cursorPosition', () => {
      agent.updateContext({ cursorPosition: 42 })
      expect(agent.getState().context.cursorPosition).toBe(42)
    })
  })

  describe('getState', () => {
    it('should return a copy of state', () => {
      const state1 = agent.getState()
      const state2 = agent.getState()
      expect(state1).not.toBe(state2)
      expect(state1).toEqual(state2)
    })

    it('should return different object on each call', () => {
      const state = agent.getState()
      ;(state as any).currentStep = 'tampered'
      expect(agent.getState().currentStep).toBe('idle')
    })
  })

  describe('setCallbacks', () => {
    it('should set callbacks without error', () => {
      agent.setCallbacks({
        onStateChange: vi.fn(),
        onToolExecuted: vi.fn(),
        onStreamChunk: vi.fn(),
      })
    })

    it('should accept partial callbacks', () => {
      agent.setCallbacks({})
      agent.setCallbacks({ onStreamChunk: vi.fn() })
    })
  })

  describe('clearHistory', () => {
    it('should clear all state', () => {
      agent.clearHistory()
      const state = agent.getState()
      expect(state.messages).toHaveLength(0)
      expect(state.memory.summary).toBe('')
      expect(state.memory.entities).toHaveLength(0)
      expect(state.memory.facts).toHaveLength(0)
    })

    it('should reset toolHistory', () => {
      agent.clearHistory()
      expect(agent.getToolHistory()).toHaveLength(0)
    })
  })

  describe('canUndo', () => {
    it('should return false when no history', () => {
      expect(agent.canUndo()).toBe(false)
    })
  })

  describe('rejectPendingTools', () => {
    it('should clear review state and add message', () => {
      agent.rejectPendingTools('取消操作')
      const state = agent.getState()
      expect(state.humanReviewRequired).toBe(false)
      expect(state.messages).toHaveLength(1)
      expect(state.messages[0].content).toBe('取消操作')
    })

    it('should use default message', () => {
      agent.rejectPendingTools()
      const state = agent.getState()
      expect(state.messages[0].content).toBe('操作已取消。')
    })

    it('should also reset graphState if present', () => {
      agent.rejectPendingTools('cancel')
      const state = agent.getState()
      expect(state.humanReviewRequired).toBe(false)
      expect(state.pendingToolCalls).toHaveLength(0)
    })
  })

  describe('getToolHistory', () => {
    it('should return empty array initially', () => {
      expect(agent.getToolHistory()).toHaveLength(0)
    })

    it('should return a copy', () => {
      const h1 = agent.getToolHistory()
      const h2 = agent.getToolHistory()
      expect(h1).not.toBe(h2)
    })
  })

  describe('undoLastTool', () => {
    it('should return failure when no history', async () => {
      const result = await agent.undoLastTool()
      expect(result.success).toBe(false)
    })
  })

  describe('loadConversationsList', () => {
    it('should return empty array', async () => {
      const list = await agent.loadConversationsList()
      expect(list).toHaveLength(0)
    })
  })

  describe('getAgent / resetAgent', () => {
    it('should return singleton', () => {
      const a1 = getAgent()
      const a2 = getAgent()
      expect(a1).toBe(a2)
    })

    it('should reset singleton', () => {
      const a1 = getAgent()
      resetAgent()
      const a2 = getAgent()
      expect(a1).not.toBe(a2)
    })

    it('should accept config on first call', () => {
      resetAgent()
      const a = getAgent({ maxIterations: 3 })
      expect(a).toBeDefined()
    })
  })

  describe('processMessage', () => {
    it('should handle empty messages with simple response', async () => {
      mockGraphInvoke.mockResolvedValue({
        messages: [
          { _getType: () => 'ai', content: 'Hello!', tool_calls: [] },
        ],
        pendingReview: false,
        pendingToolCalls: [],
      })

      const result = await agent.processMessage('hi')
      expect(result).toBe('Hello!')
    })

    it('should add user message to state', async () => {
      mockGraphInvoke.mockResolvedValue({
        messages: [
          { _getType: () => 'human', content: 'test message' },
          { _getType: () => 'ai', content: 'ok', tool_calls: [] },
        ],
        pendingReview: false,
      })

      await agent.processMessage('test message')
      const state = agent.getState()
      const userMsgs = state.messages.filter((m) => m.role === 'user')
      expect(userMsgs).toHaveLength(1)
      expect(userMsgs[0].content).toBe('test message')
    })

    it('should set currentStep to idle after completion', async () => {
      mockGraphInvoke.mockResolvedValue({
        messages: [
          { _getType: () => 'ai', content: 'done', tool_calls: [] },
        ],
        pendingReview: false,
      })

      await agent.processMessage('test')
      expect(agent.getState().currentStep).toBe('idle')
    })

    it('should handle LLM error gracefully', async () => {
      mockGraphInvoke.mockRejectedValue(new Error('LLM connection failed'))

      const result = await agent.processMessage('trigger error')
      expect(result).toContain('AI调用失败')
      expect(result).toContain('LLM connection failed')
      expect(agent.getState().currentStep).toBe('idle')
    })

    it('should add error message to state on LLM failure', async () => {
      mockGraphInvoke.mockRejectedValue(new Error('timeout'))

      await agent.processMessage('fail')
      const state = agent.getState()
      const errorMsgs = state.messages.filter((m) => m.content.includes('AI调用失败'))
      expect(errorMsgs.length).toBeGreaterThan(0)
    })

    it('should handle pendingReview response', async () => {
      mockGraphInvoke.mockResolvedValue({
        messages: [
          { _getType: () => 'ai', content: 'Need confirmation', tool_calls: [{ id: 'c1', name: 'insert_text', args: { text: 'hi' } }] },
        ],
        pendingReview: true,
        pendingToolCalls: [{ id: 'c1', name: 'insert_text', args: { text: 'hi' } }],
      })

      const result = await agent.processMessage('insert something')
      expect(agent.getState().humanReviewRequired).toBe(true)
      expect(agent.getState().pendingToolCalls).toHaveLength(1)
    })

    it('should return default message when pendingReview has no text', async () => {
      mockGraphInvoke.mockResolvedValue({
        messages: [
          { _getType: () => 'ai', content: '', tool_calls: [] },
        ],
        pendingReview: true,
        pendingToolCalls: [],
      })

      const result = await agent.processMessage('test')
      expect(result).toBe('需要您的确认才能执行此操作。')
    })

    it('should call onToolExecuted callback for tool messages', async () => {
      const onToolExecuted = vi.fn()
      agent.setCallbacks({ onToolExecuted })

      mockGraphInvoke.mockResolvedValue({
        messages: [
          { _getType: () => 'ai', content: '', tool_calls: [{ id: 'c1', name: 'insert_text', args: { text: 'hi' } }] },
          { _getType: () => 'tool', content: 'inserted', tool_call_id: 'c1' },
          { _getType: () => 'ai', content: 'Done', tool_calls: [] },
        ],
        pendingReview: false,
      })

      await agent.processMessage('insert text')
      expect(onToolExecuted).toHaveBeenCalledWith('insert_text', 'inserted')
    })

    it('should call onStreamChunk callback', async () => {
      const onStreamChunk = vi.fn()
      agent.setCallbacks({ onStreamChunk })

      mockGraphInvoke.mockResolvedValue({
        messages: [
          { _getType: () => 'ai', content: 'response', tool_calls: [] },
        ],
        pendingReview: false,
      })

      await agent.processMessage('test')
      expect(mockSetOnChunk).toHaveBeenCalled()
    })

    it('should strip JSON action blocks from response', async () => {
      mockGraphInvoke.mockResolvedValue({
        messages: [
          {
            _getType: () => 'ai',
            content: 'Some text {"action": "insert", "text": "content"} more text',
            tool_calls: [],
          },
        ],
        pendingReview: false,
      })

      const result = await agent.processMessage('test')
      expect(result).not.toContain('{"action"')
      expect(result).toContain('Some text')
    })

    it('should strip code blocks from response', async () => {
      mockGraphInvoke.mockResolvedValue({
        messages: [
          {
            _getType: () => 'ai',
            content: 'Before ```json\n{"key": "value"}\n``` After',
            tool_calls: [],
          },
        ],
        pendingReview: false,
      })

      const result = await agent.processMessage('test')
      expect(result).not.toContain('```json')
      expect(result).toContain('Before')
    })

    it('should handle array content in AI message', async () => {
      mockGraphInvoke.mockResolvedValue({
        messages: [
          {
            _getType: () => 'ai',
            content: [{ text: 'part1' }, { text: 'part2' }],
            tool_calls: [],
          },
        ],
        pendingReview: false,
      })

      const result = await agent.processMessage('test')
      expect(result).toContain('part1')
      expect(result).toContain('part2')
    })

    it('should handle non-array non-string content gracefully', async () => {
      mockGraphInvoke.mockResolvedValue({
        messages: [
          {
            _getType: () => 'ai',
            content: 12345,
            tool_calls: [],
          },
        ],
        pendingReview: false,
      })

      const result = await agent.processMessage('test')
      expect(typeof result).toBe('string')
    })

    it('should set onChunk to undefined after processing', async () => {
      mockGraphInvoke.mockResolvedValue({
        messages: [
          { _getType: () => 'ai', content: 'ok', tool_calls: [] },
        ],
        pendingReview: false,
      })

      await agent.processMessage('test')
      expect(mockSetOnChunk).toHaveBeenCalledWith(undefined)
    })

    it('should save conversation after successful processing', async () => {
      const { saveConversation } = await import('../services/agent/agentMemory')

      mockGraphInvoke.mockResolvedValue({
        messages: [
          { _getType: () => 'ai', content: 'done', tool_calls: [] },
        ],
        pendingReview: false,
      })

      await agent.processMessage('test')
      expect(saveConversation).toHaveBeenCalled()
    })

    it('should set onChunk to undefined even on error', async () => {
      mockGraphInvoke.mockRejectedValue(new Error('fail'))

      await agent.processMessage('test')
      expect(mockSetOnChunk).toHaveBeenCalledWith(undefined)
    })
  })

  describe('approvePendingTools', () => {
    it('should return message when no graphState', async () => {
      const result = await agent.approvePendingTools()
      expect(result).toBe('无待确认操作')
    })

    it('should execute tools and return summary', async () => {
      agent.updateContext({ documentContent: 'doc content' })

      mockGraphInvoke.mockResolvedValue({
        messages: [
          { _getType: () => 'ai', content: '', tool_calls: [{ id: 'c1', name: 'insert_text', args: { text: 'hi' } }] },
        ],
        pendingReview: true,
        pendingToolCalls: [{ id: 'c1', name: 'insert_text', args: { text: 'hi' } }],
      })

      await agent.processMessage('insert something')
      const result = await agent.approvePendingTools()

      expect(result).toContain('insert_text')
      expect(agent.getState().humanReviewRequired).toBe(false)
      expect(agent.getState().pendingToolCalls).toHaveLength(0)
    })

    it('should handle unknown tool name', async () => {
      mockGetToolByName.mockImplementation(() => undefined)

      mockGraphInvoke.mockResolvedValue({
        messages: [
          { _getType: () => 'ai', content: '', tool_calls: [{ id: 'c1', name: 'unknown_tool', args: {} }] },
        ],
        pendingReview: true,
        pendingToolCalls: [{ id: 'c1', name: 'unknown_tool', args: {} }],
      })

      await agent.processMessage('test')
      const result = await agent.approvePendingTools()

      expect(result).toContain('unknown_tool')
    })

    it('should handle tool execution error', async () => {
      mockToolInvoke.mockRejectedValue(new Error('tool failed'))

      mockGraphInvoke.mockResolvedValue({
        messages: [
          { _getType: () => 'ai', content: '', tool_calls: [{ id: 'c1', name: 'insert_text', args: { text: 'hi' } }] },
        ],
        pendingReview: true,
        pendingToolCalls: [{ id: 'c1', name: 'insert_text', args: { text: 'hi' } }],
      })

      await agent.processMessage('test')
      const result = await agent.approvePendingTools()

      expect(result).toContain('insert_text')
    })

    it('should call onToolExecuted callback', async () => {
      const onToolExecuted = vi.fn()
      agent.setCallbacks({ onToolExecuted })

      mockGraphInvoke.mockResolvedValue({
        messages: [
          { _getType: () => 'ai', content: '', tool_calls: [{ id: 'c1', name: 'insert_text', args: { text: 'hi' } }] },
        ],
        pendingReview: true,
        pendingToolCalls: [{ id: 'c1', name: 'insert_text', args: { text: 'hi' } }],
      })

      await agent.processMessage('test')
      await agent.approvePendingTools()

      expect(onToolExecuted).toHaveBeenCalledWith('insert_text', 'tool result')
    })

    it('should add summary message to state', async () => {
      mockGraphInvoke.mockResolvedValue({
        messages: [
          { _getType: () => 'ai', content: '', tool_calls: [{ id: 'c1', name: 'insert_text', args: { text: 'hi' } }] },
        ],
        pendingReview: true,
        pendingToolCalls: [{ id: 'c1', name: 'insert_text', args: { text: 'hi' } }],
      })

      await agent.processMessage('test')
      await agent.approvePendingTools()

      const state = agent.getState()
      const assistantMsgs = state.messages.filter((m) => m.role === 'assistant' && m.content.includes('insert_text'))
      expect(assistantMsgs.length).toBeGreaterThan(0)
    })

    it('should save conversation after approving', async () => {
      const { saveConversation, updateConversation } = await import('../services/agent/agentMemory')

      mockGraphInvoke.mockResolvedValue({
        messages: [
          { _getType: () => 'ai', content: '', tool_calls: [{ id: 'c1', name: 'insert_text', args: { text: 'hi' } }] },
        ],
        pendingReview: true,
        pendingToolCalls: [{ id: 'c1', name: 'insert_text', args: { text: 'hi' } }],
      })

      await agent.processMessage('test')
      await agent.approvePendingTools()

      expect(saveConversation).toHaveBeenCalled()
    })

    it('should handle multiple tool calls', async () => {
      mockGraphInvoke.mockResolvedValue({
        messages: [
          {
            _getType: () => 'ai',
            content: '',
            tool_calls: [
              { id: 'c1', name: 'insert_text', args: { text: 'a' } },
              { id: 'c2', name: 'read_document', args: {} },
            ],
          },
        ],
        pendingReview: true,
        pendingToolCalls: [
          { id: 'c1', name: 'insert_text', args: { text: 'a' } },
          { id: 'c2', name: 'read_document', args: {} },
        ],
      })

      await agent.processMessage('do multiple things')
      const result = await agent.approvePendingTools()

      expect(result).toContain('insert_text')
      expect(result).toContain('read_document')
    })

    it('should handle JSON tool result with message field', async () => {
      mockToolInvoke.mockResolvedValue(JSON.stringify({ message: '已插入 5 个字符' }))

      mockGraphInvoke.mockResolvedValue({
        messages: [
          { _getType: () => 'ai', content: '', tool_calls: [{ id: 'c1', name: 'insert_text', args: { text: 'hello' } }] },
        ],
        pendingReview: true,
        pendingToolCalls: [{ id: 'c1', name: 'insert_text', args: { text: 'hello' } }],
      })

      await agent.processMessage('insert')
      const result = await agent.approvePendingTools()

      expect(result).toContain('已插入 5 个字符')
    })
  })

  describe('deleteConversation', () => {
    it('should delete conversation', async () => {
      const { deleteConversation } = await import('../services/agent/agentMemory')
      await agent.deleteConversation('conv-1')
      expect(deleteConversation).toHaveBeenCalledWith('conv-1')
    })
  })

  describe('buildLangchainMessages (indirect testing)', () => {
    it('should convert user messages', async () => {
      mockGraphInvoke.mockResolvedValue({
        messages: [
          { _getType: () => 'ai', content: 'ok', tool_calls: [] },
        ],
        pendingReview: false,
      })

      await agent.processMessage('hello')
      const graphCallArgs = mockGraphInvoke.mock.calls[0]
      const graphState = graphCallArgs[0]
      expect(graphState.messages).toBeDefined()
      expect(graphState.messages.length).toBeGreaterThanOrEqual(1)
    })
  })

  describe('syncMessagesFromGraph (indirect testing)', () => {
    it('should handle invalid messages gracefully via error path', async () => {
      mockGraphInvoke.mockResolvedValue({
        messages: [
          'not-a-message',
          { _getType: () => 'ai', content: 'ok', tool_calls: [] },
        ],
        pendingReview: false,
      })

      const result = await agent.processMessage('test')
      expect(result).toContain('AI调用失败')
      expect(agent.getState().currentStep).toBe('idle')
    })

    it('should skip system messages', async () => {
      mockGraphInvoke.mockResolvedValue({
        messages: [
          { _getType: () => 'system', content: 'system prompt' },
          { _getType: () => 'ai', content: 'response', tool_calls: [] },
        ],
        pendingReview: false,
      })

      await agent.processMessage('test')
      const state = agent.getState()
      const systemMsgs = state.messages.filter((m) => m.role === 'system')
      expect(systemMsgs).toHaveLength(0)
    })

    it('should track tool calls in history', async () => {
      mockGraphInvoke.mockResolvedValue({
        messages: [
          { _getType: () => 'ai', content: '', tool_calls: [{ id: 'c1', name: 'insert_text', args: { text: 'hi' } }] },
          { _getType: () => 'tool', content: 'done', tool_call_id: 'c1' },
          { _getType: () => 'ai', content: 'finished', tool_calls: [] },
        ],
        pendingReview: false,
      })

      await agent.processMessage('insert')
      expect(agent.getToolHistory()).toHaveLength(1)
      expect(agent.getToolHistory()[0].name).toBe('insert_text')
      expect(agent.getToolHistory()[0].result).toBe('done')
    })

    it('should handle tool message without matching history entry', async () => {
      mockGraphInvoke.mockResolvedValue({
        messages: [
          { _getType: () => 'tool', content: 'orphan result', tool_call_id: 'c_unknown' },
          { _getType: () => 'ai', content: 'ok', tool_calls: [] },
        ],
        pendingReview: false,
      })

      const result = await agent.processMessage('test')
      expect(result).toBe('ok')
    })
  })

  describe('undoLastTool (with history)', () => {
    it('should return success with undo action for insert_text', async () => {
      mockGraphInvoke.mockResolvedValue({
        messages: [
          { _getType: () => 'ai', content: '', tool_calls: [{ id: 'c1', name: 'insert_text', args: { text: 'hello' } }] },
          { _getType: () => 'tool', content: 'done', tool_call_id: 'c1' },
          { _getType: () => 'ai', content: 'ok', tool_calls: [] },
        ],
        pendingReview: false,
      })

      await agent.processMessage('insert')
      const result = await agent.undoLastTool()

      expect(result.success).toBe(true)
      expect(result.undoAction?.type).toBe('delete')
      expect(result.undoAction?.data.text).toBe('hello')
    })

    it('should return success with undo action for replace_text', async () => {
      mockGraphInvoke.mockResolvedValue({
        messages: [
          { _getType: () => 'ai', content: '', tool_calls: [{ id: 'c1', name: 'replace_text', args: { original: 'old', text: 'new' } }] },
          { _getType: () => 'tool', content: 'done', tool_call_id: 'c1' },
          { _getType: () => 'ai', content: 'ok', tool_calls: [] },
        ],
        pendingReview: false,
      })

      await agent.processMessage('replace')
      const result = await agent.undoLastTool()

      expect(result.success).toBe(true)
      expect(result.undoAction?.type).toBe('replace')
      expect(result.undoAction?.data.text).toBe('old')
    })

    it('should return success with undo action for create_document', async () => {
      mockGraphInvoke.mockResolvedValue({
        messages: [
          { _getType: () => 'ai', content: '', tool_calls: [{ id: 'c1', name: 'create_document', args: { title: 'New Doc' } }] },
          { _getType: () => 'tool', content: 'done', tool_call_id: 'c1' },
          { _getType: () => 'ai', content: 'ok', tool_calls: [] },
        ],
        pendingReview: false,
      })

      await agent.processMessage('create')
      const result = await agent.undoLastTool()

      expect(result.success).toBe(true)
      expect(result.undoAction?.type).toBe('delete_document')
    })

    it('should return success without undoAction for unknown tool', async () => {
      mockGraphInvoke.mockResolvedValue({
        messages: [
          { _getType: () => 'ai', content: '', tool_calls: [{ id: 'c1', name: 'read_document', args: {} }] },
          { _getType: () => 'tool', content: 'doc content', tool_call_id: 'c1' },
          { _getType: () => 'ai', content: 'ok', tool_calls: [] },
        ],
        pendingReview: false,
      })

      await agent.processMessage('read')
      const result = await agent.undoLastTool()

      expect(result.success).toBe(true)
      expect(result.undoAction).toBeUndefined()
    })

    it('should return failure when all items are already undone', async () => {
      mockGraphInvoke.mockResolvedValue({
        messages: [
          { _getType: () => 'ai', content: '', tool_calls: [{ id: 'c1', name: 'insert_text', args: { text: 'hi' } }] },
          { _getType: () => 'tool', content: 'done', tool_call_id: 'c1' },
          { _getType: () => 'ai', content: 'ok', tool_calls: [] },
        ],
        pendingReview: false,
      })

      await agent.processMessage('insert')
      await agent.undoLastTool()
      const result = await agent.undoLastTool()

      expect(result.success).toBe(false)
    })

    it('should allow undo after canUndo returns true', async () => {
      mockGraphInvoke.mockResolvedValue({
        messages: [
          { _getType: () => 'ai', content: '', tool_calls: [{ id: 'c1', name: 'insert_text', args: { text: 'hi' } }] },
          { _getType: () => 'tool', content: 'done', tool_call_id: 'c1' },
          { _getType: () => 'ai', content: 'ok', tool_calls: [] },
        ],
        pendingReview: false,
      })

      await agent.processMessage('insert')
      expect(agent.canUndo()).toBe(true)
      await agent.undoLastTool()
      expect(agent.canUndo()).toBe(false)
    })
  })

  describe('updateMemory (indirect via processMessage)', () => {
    it('should not update memory when memoryEnabled is false', async () => {
      const noMemoryAgent = new AgentGraph({ memoryEnabled: false })

      mockGraphInvoke.mockResolvedValue({
        messages: [
          { _getType: () => 'ai', content: 'response', tool_calls: [] },
        ],
        pendingReview: false,
      })

      await noMemoryAgent.processMessage('test')
      expect(noMemoryAgent.getState().memory.summary).toBe('')
    })
  })

  describe('rejectPendingTools with graphState', () => {
    it('should reset graphState pendingReview', async () => {
      mockGraphInvoke.mockResolvedValue({
        messages: [
          { _getType: () => 'ai', content: '', tool_calls: [{ id: 'c1', name: 'insert_text', args: { text: 'hi' } }] },
        ],
        pendingReview: true,
        pendingToolCalls: [{ id: 'c1', name: 'insert_text', args: { text: 'hi' } }],
      })

      await agent.processMessage('test')
      agent.rejectPendingTools('nope')

      const state = agent.getState()
      expect(state.humanReviewRequired).toBe(false)
      expect(state.messages.some((m) => m.content === 'nope')).toBe(true)
    })
  })
})
