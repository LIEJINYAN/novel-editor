import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NovelEditorLLM, getNovelEditorLLM } from '../services/agent/llmAdapter'

vi.mock('../services/aiService', () => ({
  aiCompleteStream: vi.fn(),
}))

describe('llmAdapter', () => {
  it('should create LLM instance', () => {
    const llm = new NovelEditorLLM()
    expect(llm).toBeTruthy()
  })

  it('should set temperature', () => {
    const llm = new NovelEditorLLM({ temperature: 0.5 })
    expect((llm as any).temperature).toBe(0.5)
  })

  it('should default temperature to 0.7', () => {
    const llm = new NovelEditorLLM()
    expect((llm as any).temperature).toBe(0.7)
  })

  it('should return llm type', () => {
    const llm = new NovelEditorLLM()
    expect(llm._llmType()).toBe('novel-editor-llm')
  })

  it('should cache LLM instance', () => {
    const llm1 = getNovelEditorLLM()
    const llm2 = getNovelEditorLLM()
    expect(llm1).toBe(llm2)
  })

  it('should set onChunk callback', () => {
    const llm = new NovelEditorLLM()
    const callback = vi.fn()
    llm.setOnChunk(callback)
    expect((llm as any).onChunk).toBe(callback)
  })

  it('should clear onChunk callback', () => {
    const llm = new NovelEditorLLM()
    llm.setOnChunk(vi.fn())
    llm.setOnChunk(undefined)
    expect((llm as any).onChunk).toBeUndefined()
  })

  it('should have lc_secrets', () => {
    const llm = new NovelEditorLLM()
    expect(llm.lc_secrets).toEqual({ apiKey: 'apiKey' })
  })

  // BUG: parseToolCalls may fail with malformed JSON in tool call
  it('should parse tool calls from text', () => {
    const llm = new NovelEditorLLM()
    const text = 'Hello\n```tool-call\n{"id":"c1","name":"test","args":{"key":"val"}}\n```\nDone'
    const result = (llm as any).parseToolCalls(text)
    expect(result.toolCalls.length).toBe(1)
    expect(result.toolCalls[0].name).toBe('test')
    expect(result.text).toContain('Hello')
    expect(result.text).toContain('Done')
    expect(result.text).not.toContain('tool-call')
  })

  it('should handle multiple tool calls', () => {
    const llm = new NovelEditorLLM()
    const text = '```tool-call\n{"id":"c1","name":"t1","args":{}}\n```\n\n```tool-call\n{"id":"c2","name":"t2","args":{}}\n```'
    const result = (llm as any).parseToolCalls(text)
    expect(result.toolCalls.length).toBe(2)
  })

  it('should handle tool call with missing id', () => {
    const llm = new NovelEditorLLM()
    const text = '```tool-call\n{"name":"t1","args":{}}\n```'
    const result = (llm as any).parseToolCalls(text)
    expect(result.toolCalls[0].id).toContain('call_')
  })

  it('should handle tool call with missing args', () => {
    const llm = new NovelEditorLLM()
    const text = '```tool-call\n{"id":"c1","name":"t1"}\n```'
    const result = (llm as any).parseToolCalls(text)
    expect(result.toolCalls[0].args).toEqual({})
  })

  it('should handle malformed tool call JSON', () => {
    const llm = new NovelEditorLLM()
    const text = '```tool-call\nnot valid json\n```'
    const result = (llm as any).parseToolCalls(text)
    expect(result.toolCalls.length).toBe(0)
  })

  it('should handle text with no tool calls', () => {
    const llm = new NovelEditorLLM()
    const result = (llm as any).parseToolCalls('just plain text')
    expect(result.toolCalls.length).toBe(0)
    expect(result.text).toBe('just plain text')
  })
})
