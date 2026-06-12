import { describe, it, expect, beforeEach, vi } from 'vitest'
import {
  getAIConfig,
  saveAIConfig,
  clearAIConfig,
  cleanAIResponse,
  cancelAllRequests,
  getQueueStatus,
  queueEvents,
  AI_COMMANDS,
  AI_TEMPLATES,
} from '../services/aiService'

describe('aiService 扩展测试', () => {
  beforeEach(() => {
    localStorage.clear()
    cancelAllRequests()
  })

  describe('AIConfig 持久化', () => {
    it('should return null when no config', () => {
      expect(getAIConfig()).toBeNull()
    })

    it('should save and load config', () => {
      const config = {
        provider: 'openai' as const,
        apiKey: 'test-key',
        baseUrl: 'https://api.openai.com',
        model: 'gpt-4',
      }
      saveAIConfig(config)
      expect(getAIConfig()).toEqual(config)
    })

    it('should clear config', () => {
      saveAIConfig({ provider: 'openai', apiKey: 'key', baseUrl: 'url', model: 'm' })
      clearAIConfig()
      expect(getAIConfig()).toBeNull()
    })

    it('should handle corrupted localStorage', () => {
      localStorage.setItem('novel-engine-ai-config', '{invalid json')
      expect(getAIConfig()).toBeNull()
    })
  })

  describe('cleanAIResponse', () => {
    it('should remove markdown code blocks', () => {
      expect(cleanAIResponse('```json\nhello\n```')).toBe('hello')
    })

    it('should remove plain code blocks', () => {
      expect(cleanAIResponse('```\nhello\n```')).toBe('hello')
    })

    it('should extract string from JSON', () => {
      expect(cleanAIResponse('"hello world"')).toBe('hello world')
    })

    it('should extract content from JSON object', () => {
      expect(cleanAIResponse('{"content": "hello"}')).toBe('hello')
    })

    it('should extract text from JSON object', () => {
      expect(cleanAIResponse('{"text": "hello"}')).toBe('hello')
    })

    it('should remove surrounding quotes', () => {
      expect(cleanAIResponse("'hello'")).toBe('hello')
    })

    it('should unescape newlines', () => {
      expect(cleanAIResponse('hello\\nworld')).toBe('hello\nworld')
    })

    it('should unescape tabs', () => {
      expect(cleanAIResponse('hello\\tworld')).toBe('hello\tworld')
    })

    it('should handle empty string', () => {
      expect(cleanAIResponse('')).toBe('')
    })

    it('should handle plain text', () => {
      expect(cleanAIResponse('just text')).toBe('just text')
    })

    it('should handle multi-line text', () => {
      const input = 'line1\nline2\nline3'
      expect(cleanAIResponse(input)).toBe(input)
    })
  })

  describe('Queue 管理', () => {
    it('should return empty queue status', () => {
      const status = getQueueStatus()
      expect(status.pending).toBe(0)
      expect(status.active).toBe(0)
    })

    it('should cancel all requests', () => {
      cancelAllRequests()
      const status = getQueueStatus()
      expect(status.pending).toBe(0)
      expect(status.active).toBe(0)
    })
  })

  describe('Queue Events', () => {
    it('should register and emit events', () => {
      const handler = vi.fn()
      const unsub = queueEvents.on('status-change', handler)
      queueEvents.emit('status-change', { pending: 0, active: 0 })
      expect(handler).toHaveBeenCalledWith({ pending: 0, active: 0 })
      unsub()
    })

    it('should unregister event handler', () => {
      const handler = vi.fn()
      queueEvents.on('status-change', handler)
      queueEvents.off('status-change', handler)
      queueEvents.emit('status-change', { pending: 0, active: 0 })
      expect(handler).not.toHaveBeenCalled()
    })
  })

  describe('AI_COMMANDS', () => {
    it('should have all commands', () => {
      const commands = Object.keys(AI_COMMANDS)
      expect(commands.length).toBeGreaterThan(15)
    })

    it('should build prompts correctly', () => {
      const prompt = AI_COMMANDS.continueWriting.buildPrompt('test text')
      expect(prompt).toContain('test text')
      expect(prompt).toContain('续写')
    })

    it('should have label and icon for each command', () => {
      for (const [key, cmd] of Object.entries(AI_COMMANDS)) {
        expect(cmd.label).toBeTruthy()
        expect(cmd.icon).toBeTruthy()
        expect(typeof cmd.buildPrompt).toBe('function')
      }
    })
  })

  describe('AI_TEMPLATES', () => {
    it('should have all templates', () => {
      const templates = Object.keys(AI_TEMPLATES)
      expect(templates.length).toBeGreaterThanOrEqual(6)
    })

    it('should have label, icon, and prompt for each template', () => {
      for (const [key, tpl] of Object.entries(AI_TEMPLATES)) {
        expect(tpl.label).toBeTruthy()
        expect(tpl.icon).toBeTruthy()
        expect(tpl.prompt).toBeTruthy()
      }
    })
  })
})
