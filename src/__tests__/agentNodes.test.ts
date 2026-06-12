import { describe, it, expect, vi } from 'vitest'
import { shouldContinue } from '../services/agent/nodes'
import { AIMessage } from '@langchain/core/messages'
import { END } from '@langchain/langgraph'

vi.mock('../services/agent/llmAdapter', () => ({
  getNovelEditorLLM: vi.fn(),
}))

vi.mock('../services/agent/langchainTools', () => ({
  getToolByName: vi.fn(),
  setToolContext: vi.fn(),
  needsReview: vi.fn((name: string) => name === 'suggest_edit' || name === 'delete_document'),
}))

describe('nodes shouldContinue', () => {
  it('should return END when no messages', () => {
    const state = { messages: [], pendingReview: false, pendingToolCalls: [] } as any
    expect(shouldContinue(state)).toBe(END)
  })

  it('should return END when last message has no tool_calls', () => {
    const state = {
      messages: [{ content: 'hello', _getType: () => 'ai' }],
      pendingReview: false,
      pendingToolCalls: [],
    } as any
    expect(shouldContinue(state)).toBe(END)
  })

  it('should return END when tool_calls is empty', () => {
    const msg = new AIMessage({ content: 'hi', tool_calls: [] })
    const state = { messages: [msg], pendingReview: false, pendingToolCalls: [] } as any
    expect(shouldContinue(state)).toBe(END)
  })

  it('should return review when needs review tools present', () => {
    const msg = new AIMessage({
      content: 'hi',
      tool_calls: [{ id: 'c1', name: 'suggest_edit', args: {} }],
    })
    const state = { messages: [msg], pendingReview: false, pendingToolCalls: [] } as any
    expect(shouldContinue(state)).toBe('review')
  })

  it('should return tools when non-review tools present', () => {
    const msg = new AIMessage({
      content: 'hi',
      tool_calls: [{ id: 'c1', name: 'read_document', args: {} }],
    })
    const state = { messages: [msg], pendingReview: false, pendingToolCalls: [] } as any
    expect(shouldContinue(state)).toBe('tools')
  })
})
