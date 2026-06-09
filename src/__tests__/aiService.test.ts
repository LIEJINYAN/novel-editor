import { describe, it, expect, beforeEach } from 'vitest'
import { AI_COMMANDS, getAIConfig, saveAIConfig, clearAIConfig, getQueueStatus, cancelAllRequests } from '../services/aiService'

describe('aiService', () => {
  beforeEach(() => {
    clearAIConfig()
    cancelAllRequests()
  })

  it('should return null when no config saved', () => {
    expect(getAIConfig()).toBeNull()
  })

  it('should save and retrieve AI config', () => {
    saveAIConfig({
      provider: 'openai',
      apiKey: 'sk-test-key',
      baseUrl: 'https://api.openai.com',
      model: 'gpt-4',
    })

    const config = getAIConfig()
    expect(config).not.toBeNull()
    expect(config!.provider).toBe('openai')
    expect(config!.apiKey).toBe('sk-test-key')
    expect(config!.model).toBe('gpt-4')
  })

  it('should clear AI config', () => {
    saveAIConfig({
      provider: 'openai',
      apiKey: 'sk-test',
      baseUrl: 'https://api.openai.com',
      model: 'gpt-3.5-turbo',
    })
    clearAIConfig()
    expect(getAIConfig()).toBeNull()
  })

  it('should define AI commands with correct structure', () => {
    const keys = Object.keys(AI_COMMANDS)
    expect(keys.length).toBeGreaterThan(0)

    for (const key of keys) {
      const cmd = AI_COMMANDS[key as keyof typeof AI_COMMANDS]
      expect(cmd).toHaveProperty('label')
      expect(cmd).toHaveProperty('icon')
      expect(cmd).toHaveProperty('buildPrompt')
      expect(typeof cmd.buildPrompt('test')).toBe('string')
    }
  })

  it('continueWriting command should include the input text', () => {
    const prompt = AI_COMMANDS.continueWriting.buildPrompt('测试内容')
    expect(prompt).toContain('测试内容')
    expect(prompt).toContain('续写')
  })

  it('polish command should mention style improvement', () => {
    const prompt = AI_COMMANDS.polish.buildPrompt('需要润色的文本')
    expect(prompt).toContain('需要润色的文本')
    expect(prompt).toMatch(/润色|改进/)
  })

  it('should return queue status', () => {
    const status = getQueueStatus()
    expect(status).toHaveProperty('pending')
    expect(status).toHaveProperty('active')
    expect(typeof status.pending).toBe('number')
    expect(typeof status.active).toBe('number')
  })

  it('should cancel all requests', () => {
    cancelAllRequests()
    const status = getQueueStatus()
    expect(status.pending).toBe(0)
    expect(status.active).toBe(0)
  })
})
