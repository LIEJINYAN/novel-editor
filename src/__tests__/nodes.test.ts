import { describe, it, expect, vi, beforeEach } from 'vitest'
import { END } from '@langchain/langgraph'
import { shouldContinue } from '../services/agent/nodes'
import * as langchainTools from '../services/agent/langchainTools'

vi.mock('../services/agent/langchainTools', () => ({
  getToolByName: vi.fn(),
  setToolContext: vi.fn(),
  needsReview: vi.fn(),
}))

vi.mock('../services/agent/llmAdapter', () => ({
  getNovelEditorLLM: vi.fn(),
}))

beforeEach(() => {
  vi.clearAllMocks()
})

const makeState = (lastMsg: any) => ({
  messages: [lastMsg],
  documentContent: '',
  documentTitle: '',
  selection: '',
  cursorPosition: 0,
  memory: '',
  pendingReview: false,
  pendingToolCalls: [],
})

describe('shouldContinue', () => {
  it('returns END when no tool_calls on last message', () => {
    const state = makeState({ role: 'assistant', content: 'hello' })
    expect(shouldContinue(state)).toBe(END)
  })

  it('returns review when needsReview is true', () => {
    vi.mocked(langchainTools.needsReview).mockReturnValue(true)
    const state = makeState({
      role: 'assistant',
      content: '',
      tool_calls: [{ id: 'c1', name: 'suggest_edit', args: {} }],
    })
    expect(shouldContinue(state)).toBe('review')
  })

  it('returns tools when needsReview is false', () => {
    vi.mocked(langchainTools.needsReview).mockReturnValue(false)
    const state = makeState({
      role: 'assistant',
      content: '',
      tool_calls: [{ id: 'c1', name: 'insert_text', args: {} }],
    })
    expect(shouldContinue(state)).toBe('tools')
  })

  it('returns END when tool_calls is empty array', () => {
    const state = makeState({
      role: 'assistant',
      content: '',
      tool_calls: [],
    })
    expect(shouldContinue(state)).toBe(END)
  })
})
