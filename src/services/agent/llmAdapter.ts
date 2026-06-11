import { BaseChatModel, type BaseChatModelParams } from '@langchain/core/language_models/chat_models'
import { AIMessage, SystemMessage, ToolMessage, HumanMessage, type BaseMessage } from '@langchain/core/messages'
import { type ChatResult } from '@langchain/core/outputs'
import { aiCompleteStream } from '../aiService'
import { openAITools } from './langchainTools'

interface NovelLLMParams extends BaseChatModelParams {
  temperature?: number
}

export class NovelEditorLLM extends BaseChatModel {
  temperature = 0.7
  private onChunk?: (chunk: string) => void

  constructor(params: NovelLLMParams = {}) {
    super(params)
    this.temperature = params.temperature ?? 0.7
  }

  setOnChunk(callback: ((chunk: string) => void) | undefined) {
    this.onChunk = callback
  }

  get lc_secrets(): Record<string, string> | undefined {
    return { apiKey: 'apiKey' }
  }

  async _generate(
    messages: BaseMessage[],
    _options?: this['ParsedCallOptions'],
    _runManager?: any,
  ): Promise<ChatResult> {
    const apiMessages: Array<{ role: 'system' | 'user' | 'assistant' | 'tool'; content: string; tool_calls?: any[]; tool_call_id?: string }> = []

    for (const msg of messages) {
      if (!('_getType' in msg)) continue
      const type = msg._getType()

      if (type === 'system') {
        apiMessages.push({ role: 'system', content: msg.content as string })
      } else if (type === 'human') {
        apiMessages.push({ role: 'user', content: msg.content as string })
      } else if (type === 'ai') {
        const aiMsg = msg as AIMessage
        const entry: { role: 'assistant'; content: string; tool_calls?: any[] } = {
          role: 'assistant',
          content: typeof aiMsg.content === 'string' ? aiMsg.content : '',
        }
        if (aiMsg.tool_calls && aiMsg.tool_calls.length > 0) {
          entry.tool_calls = aiMsg.tool_calls.map((tc) => ({
            id: tc.id,
            type: 'function' as const,
            function: {
              name: tc.name,
              arguments: typeof tc.args === 'string' ? tc.args : JSON.stringify(tc.args),
            },
          }))
        }
        apiMessages.push(entry)
      } else if (type === 'tool') {
        const toolMsg = msg as ToolMessage
        apiMessages.push({
          role: 'tool',
          content: typeof toolMsg.content === 'string' ? toolMsg.content : JSON.stringify(toolMsg.content),
          tool_call_id: toolMsg.tool_call_id,
        })
      }
    }

    let fullResponse = ''

    try {
      await aiCompleteStream(
        '',
        '',
        (chunk) => {
          fullResponse += chunk
          if (!chunk.includes('```tool-call')) {
            this.onChunk?.(chunk)
          }
        },
        undefined,
        undefined,
        openAITools,
        apiMessages,
        this.temperature,
      )
    } catch (err) {
      const errorMessage = `AI调用失败: ${(err as Error).message}`
      const aiMsg = new AIMessage({ content: errorMessage, tool_calls: [] })
      return {
        generations: [{ text: errorMessage, message: aiMsg, generationInfo: {} }],
      }
    }

    const parsed = this.parseToolCalls(fullResponse)

    const aiMessage = new AIMessage({
      content: parsed.text,
      tool_calls: parsed.toolCalls.map((tc) => ({
        id: tc.id,
        name: tc.name,
        args: tc.args,
        type: 'tool_call' as const,
      })),
    })

    return {
      generations: [{ text: parsed.text, message: aiMessage, generationInfo: {} }],
    }
  }

  private parseToolCalls(text: string): {
    text: string
    toolCalls: Array<{ id: string; name: string; args: Record<string, any> }>
  } {
    const toolCalls: Array<{ id: string; name: string; args: Record<string, any> }> = []
    let cleanText = text

    const toolCallRegex = /```tool-call\n([\s\S]*?)\n```/g
    let match
    while ((match = toolCallRegex.exec(text)) !== null) {
      try {
        const parsed = JSON.parse(match[1])
        toolCalls.push({
          id: parsed.id || `call_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
          name: parsed.name,
          args: parsed.args || {},
        })
        cleanText = cleanText.replace(match[0], '')
      } catch (e) {
        console.warn('Failed to parse tool call:', e)
      }
    }

    return { text: cleanText.trim(), toolCalls }
  }

  _llmType(): string {
    return 'novel-editor-llm'
  }
}

let cachedLLM: NovelEditorLLM | null = null

export function getNovelEditorLLM(): NovelEditorLLM {
  if (!cachedLLM) {
    cachedLLM = new NovelEditorLLM({ temperature: 0.7 })
  }
  return cachedLLM
}
