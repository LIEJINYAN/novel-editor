import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NovelEditorLLM, getNovelEditorLLM } from '../services/agent/llmAdapter'

vi.mock('../services/aiService', () => ({
  aiCompleteStream: vi.fn(),
  getAIConfig: vi.fn().mockReturnValue({
    apiKey: 'test-key',
    baseUrl: 'https://api.openai.com',
    model: 'gpt-3.5-turbo',
  }),
}))

describe('llmAdapter', () => {
  describe('NovelEditorLLM', () => {
    it('should create singleton instance', () => {
      const llm1 = getNovelEditorLLM()
      const llm2 = getNovelEditorLLM()
      expect(llm1).toBe(llm2)
    })

    it('should have temperature', () => {
      const llm = new NovelEditorLLM({ temperature: 0.5 })
      expect(llm.temperature).toBe(0.5)
    })

    it('should default temperature to 0.7', () => {
      const llm = new NovelEditorLLM()
      expect(llm.temperature).toBe(0.7)
    })

    it('should return llm type', () => {
      const llm = new NovelEditorLLM()
      expect(llm._llmType()).toBe('novel-editor-llm')
    })

    it('should have lc_secrets', () => {
      const llm = new NovelEditorLLM()
      expect(llm.lc_secrets).toEqual({ apiKey: 'apiKey' })
    })

    it('should set and unset onChunk callback', () => {
      const llm = new NovelEditorLLM()
      const cb = () => {}
      llm.setOnChunk(cb)
      llm.setOnChunk(undefined)
    })
  })
})