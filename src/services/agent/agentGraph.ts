import { HumanMessage, AIMessage, SystemMessage, ToolMessage } from '@langchain/core/messages'
import { compiledGraph, type CompiledGraph } from './graph'
import { setToolContext, getToolByName } from './langchainTools'
import { getNovelEditorLLM } from './llmAdapter'
import { saveAgentMemory, loadAgentMemory, saveConversation, updateConversation, loadConversations, deleteConversation } from './agentMemory'

type ToolHistoryItem = { id: string; name: string; args: any; result?: string; timestamp: number; undone?: boolean }

export interface AgentMessage {
  role: 'user' | 'assistant' | 'tool' | 'system'
  content: string
  toolCalls?: Array<{ id: string; name: string; args: Record<string, any> }>
  toolCallId?: string
  timestamp: number
}

export interface AgentConfig {
  maxIterations: number
  requireReviewForInsert: boolean
  memoryEnabled: boolean
  model: string
  temperature: number
}

export interface AgentState {
  messages: AgentMessage[]
  currentStep: string
  pendingToolCalls: Array<{ id: string; name: string; args: Record<string, any> }>
  humanReviewRequired: boolean
  humanReviewData?: any
  context: {
    documentContent: string
    documentTitle: string
    documentId: string
    selection: string
    cursorPosition: number
  }
  memory: {
    summary: string
    entities: string[]
    facts: string[]
  }
}

export class AgentGraph {
  private state: AgentState
  private config: AgentConfig
  private graph: CompiledGraph
  private onStateChange?: (state: AgentState) => void
  private onToolExecuted?: (toolName: string, result: string) => void
  private onStreamChunk?: (chunk: string) => void
  private currentConversationId?: string
  private toolHistory: ToolHistoryItem[] = []
  private graphState: any = null

  constructor(config?: Partial<AgentConfig>) {
    this.config = {
      maxIterations: 10,
      requireReviewForInsert: true,
      memoryEnabled: true,
      model: 'gpt-3.5-turbo',
      temperature: 0.7,
      ...config,
    }

    this.graph = compiledGraph

    this.state = {
      messages: [],
      currentStep: 'idle',
      pendingToolCalls: [],
      humanReviewRequired: false,
      context: {
        documentContent: '',
        documentTitle: '',
        documentId: '',
        selection: '',
        cursorPosition: 0,
      },
      memory: {
        summary: '',
        entities: [],
        facts: [],
      },
    }
  }

  updateContext(context: Partial<AgentState['context']>) {
    this.state.context = { ...this.state.context, ...context }
    setToolContext(this.state.context)
  }

  async init(): Promise<void> {
    try {
      const savedMemory = await loadAgentMemory()
      if (savedMemory) {
        this.state.memory.summary = savedMemory
      }
    } catch (err) {
      console.error('Failed to load agent memory:', err)
    }
  }

  getState(): AgentState {
    return { ...this.state }
  }

  setCallbacks(callbacks: {
    onStateChange?: (state: AgentState) => void
    onToolExecuted?: (toolName: string, result: string) => void
    onStreamChunk?: (chunk: string) => void
  }) {
    this.onStateChange = callbacks.onStateChange
    this.onToolExecuted = callbacks.onToolExecuted
    this.onStreamChunk = callbacks.onStreamChunk
  }

  async processMessage(userMessage: string): Promise<string> {
    this.state.messages.push({
      role: 'user',
      content: userMessage,
      timestamp: Date.now(),
    })

    this.state.currentStep = 'agent'
    this.emitState()

    const langchainMessages = this.buildLangchainMessages()

    this.graphState = {
      messages: langchainMessages,
      documentContent: this.state.context.documentContent,
      documentTitle: this.state.context.documentTitle,
      documentId: this.state.context.documentId,
      selection: this.state.context.selection,
      cursorPosition: this.state.context.cursorPosition,
      memory: this.state.memory.summary,
      pendingReview: false,
      pendingToolCalls: [],
    }

    try {
      const llm = getNovelEditorLLM()
      llm.setOnChunk((chunk) => this.onStreamChunk?.(chunk))

      const result = await this.graph.invoke(this.graphState, {
        recursionLimit: this.config.maxIterations,
      })

      llm.setOnChunk(undefined)

      this.graphState = result

      const lastMsg = result.messages[result.messages.length - 1]
      let responseText = ''

      if (lastMsg && 'content' in lastMsg) {
        responseText = typeof lastMsg.content === 'string'
          ? lastMsg.content
          : Array.isArray(lastMsg.content)
            ? lastMsg.content.map((c: any) => c.text || '').join('')
            : ''
      }

      if (responseText) {
        responseText = responseText
          .replace(/```json\n[\s\S]*?\n```/g, '')
          .replace(/\{"action":\s*"[^"]*",\s*"text":\s*"[\s\S]*?"\}/g, (match) => {
            try {
              const parsed = JSON.parse(match)
              return parsed.text || parsed.message || ''
            } catch {
              return match
            }
          })
          .trim()
      }

      this.syncMessagesFromGraph(result.messages)

      if (result.pendingReview) {
        this.state.humanReviewRequired = true
        this.state.pendingToolCalls = result.pendingToolCalls || []
        this.state.humanReviewData = result.pendingToolCalls
        this.emitState()
        return responseText || '需要您的确认才能执行此操作。'
      }

      if (result.messages && result.messages.length > 0) {
        const aiMsgsWithTools = result.messages
          .filter((m: any) => m._getType?.() === 'ai' && m.tool_calls?.length > 0)

        const toolMsgs = result.messages
          .filter((m: any) => m._getType?.() === 'tool')

        for (const toolMsg of toolMsgs) {
          const toolCallId = toolMsg.tool_call_id
          let toolName = 'unknown'
          for (const aiMsg of aiMsgsWithTools) {
            const tc = aiMsg.tool_calls.find((t: any) => t.id === toolCallId)
            if (tc) {
              toolName = tc.name
              break
            }
          }

          this.onToolExecuted?.(toolName, typeof toolMsg.content === 'string' ? toolMsg.content : '')
        }
      }

      this.updateMemory(responseText)
      this.state.currentStep = 'idle'
      this.emitState()

      await this.saveCurrentConversation()

      return responseText
    } catch (err) {
      const llm = getNovelEditorLLM()
      llm.setOnChunk(undefined)
      const errorMsg = `AI调用失败: ${(err as Error).message}`
      this.state.messages.push({
        role: 'assistant',
        content: errorMsg,
        timestamp: Date.now(),
      })
      this.state.currentStep = 'idle'
      this.emitState()
      return errorMsg
    }
  }

  private buildLangchainMessages(): Array<SystemMessage | AIMessage | HumanMessage | ToolMessage> {
    const messages: Array<SystemMessage | AIMessage | HumanMessage | ToolMessage> = []

    for (const msg of this.state.messages) {
      if (msg.role === 'user') {
        messages.push(new HumanMessage(msg.content))
      } else if (msg.role === 'assistant') {
        const aiMsg = new AIMessage(msg.content)
        if (msg.toolCalls && msg.toolCalls.length > 0) {
          ;(aiMsg as any).tool_calls = msg.toolCalls.map((tc) => ({
            id: tc.id,
            name: tc.name,
            args: tc.args,
            type: 'tool_call' as const,
          }))
        }
        messages.push(aiMsg)
      } else if (msg.role === 'tool') {
        messages.push(new ToolMessage({
          content: msg.content,
          tool_call_id: (msg as any).toolCallId || `call_${Date.now()}`,
        }))
      }
    }

    return messages
  }

  private syncMessagesFromGraph(graphMessages: any[]) {
    this.state.messages = []

    for (const msg of graphMessages) {
      if (!msg || !('_getType' in msg)) continue

      const type = msg._getType()

      if (type === 'system') continue

      if (type === 'human') {
        this.state.messages.push({
          role: 'user',
          content: typeof msg.content === 'string' ? msg.content : '',
          timestamp: Date.now(),
        })
      } else if (type === 'ai') {
        const toolCalls = msg.tool_calls?.map((tc: any) => ({
          id: tc.id || `call_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
          name: tc.name,
          args: tc.args,
        })) || []

        this.state.messages.push({
          role: 'assistant',
          content: typeof msg.content === 'string' ? msg.content : '',
          toolCalls: toolCalls.length > 0 ? toolCalls : undefined,
          timestamp: Date.now(),
        })

        for (const tc of toolCalls) {
          this.toolHistory.push({
            id: tc.id,
            name: tc.name,
            args: tc.args,
            result: undefined,
            timestamp: Date.now(),
            undone: false,
          })
        }
      } else if (type === 'tool') {
        const lastToolCall = this.toolHistory.find((h) => !h.result)
        if (lastToolCall) {
          lastToolCall.result = typeof msg.content === 'string' ? msg.content : ''
        }

        this.state.messages.push({
          role: 'tool',
          content: typeof msg.content === 'string' ? msg.content : '',
          toolCallId: msg.tool_call_id || '',
          timestamp: Date.now(),
        })
      }
    }
  }

  async approvePendingTools(): Promise<string> {
    if (!this.graphState) {
      return '无待确认操作'
    }

    const toolCalls = this.graphState.pendingToolCalls || []
    const toolResultMessages: ToolMessage[] = []

    for (const tc of toolCalls) {
      const tool = getToolByName(tc.name)
      if (!tool) {
        toolResultMessages.push(new ToolMessage({
          content: `未知工具: ${tc.name}`,
          tool_call_id: tc.id || `call_${Date.now()}`,
        }))
        continue
      }

      try {
        const argsStr = JSON.stringify(tc.args)
        const result = await tool.invoke(argsStr)

        this.toolHistory.push({
          id: tc.id,
          name: tc.name,
          args: tc.args,
          result,
          timestamp: Date.now(),
        })

        this.onToolExecuted?.(tc.name, result)

        toolResultMessages.push(new ToolMessage({
          content: result,
          tool_call_id: tc.id || `call_${Date.now()}`,
        }))
      } catch (err) {
        toolResultMessages.push(new ToolMessage({
          content: `执行失败: ${(err as Error).message}`,
          tool_call_id: tc.id || `call_${Date.now()}`,
        }))
      }
    }

    this.state.humanReviewRequired = false
    this.state.humanReviewData = undefined
    this.state.pendingToolCalls = []

    this.graphState = {
      ...this.graphState,
      messages: [...this.graphState.messages, ...toolResultMessages],
      pendingReview: false,
      pendingToolCalls: [],
    }

    try {
      const summary = toolCalls.map((tc: { id: string; name: string; args: Record<string, any> }) => {
        const toolResult = toolResultMessages.find((m) => m.tool_call_id === tc.id)
        const rawContent = toolResult?.content || '已执行'
        const content = typeof rawContent === 'string' ? rawContent : JSON.stringify(rawContent)
        try {
          const parsed = JSON.parse(content)
          return parsed.message || `${tc.name}: 已执行`
        } catch {
          return `${tc.name}: ${content.slice(0, 50)}`
        }
      }).join('\n')

      this.state.messages.push({
        role: 'assistant',
        content: summary,
        timestamp: Date.now(),
      })

      this.emitState()
      await this.saveCurrentConversation()
      return summary
    } catch (err) {
      const summary = toolCalls.map((tc: { id: string; name: string; args: Record<string, any> }) => `${tc.name}: 已执行`).join('\n')
      this.state.messages.push({
        role: 'assistant',
        content: `已执行操作：\n${summary}`,
        timestamp: Date.now(),
      })

      this.emitState()
      return summary
    }
  }

  rejectPendingTools(reason?: string) {
    this.state.humanReviewRequired = false
    this.state.humanReviewData = undefined
    this.state.pendingToolCalls = []

    this.state.messages.push({
      role: 'assistant',
      content: reason || '操作已取消。',
      timestamp: Date.now(),
    })

    if (this.graphState) {
      this.graphState.pendingReview = false
      this.graphState.pendingToolCalls = []
    }

    this.emitState()
  }

  private updateMemory(text: string) {
    if (!this.config.memoryEnabled) return

    const recentMessages = this.state.messages.slice(-10)
    const allText = recentMessages.map((m) => m.content).join(' ')

    if (allText.length > 2000) {
      let truncated = allText.slice(-2000)
      const sentenceEnd = truncated.search(/[。！？.!?\n]/)
      if (sentenceEnd > 0 && sentenceEnd < 200) {
        truncated = truncated.slice(sentenceEnd + 1)
      }
      this.state.memory.summary = truncated
      saveAgentMemory(this.state.memory.summary).catch(() => {})
    }
  }

  async loadConversationsList() {
    return await loadConversations()
  }

  async loadConversation(id: string) {
    const conv = await import('./agentMemory').then((m) => m.loadConversation(id))
    if (conv) {
      this.currentConversationId = conv.id
      this.state.messages = conv.messages.map((m) => ({
        ...m,
        role: m.role as 'user' | 'assistant' | 'tool' | 'system',
        toolCalls: m.toolCalls?.map((tc) => ({
          id: tc.id || `call_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
          name: tc.name,
          args: tc.args,
        })),
      }))
      this.state.memory.summary = conv.memory || ''
      this.emitState()
    }
  }

  private async saveCurrentConversation() {
    try {
      if (this.currentConversationId) {
        await updateConversation(this.currentConversationId, {
          messages: this.state.messages,
          memory: this.state.memory.summary,
        })
      } else {
        const firstUserMsg = this.state.messages.find((m) => m.role === 'user')
        const title = firstUserMsg ? firstUserMsg.content.slice(0, 30) : '新对话'
        this.currentConversationId = await saveConversation({
          title,
          messages: this.state.messages,
          memory: this.state.memory.summary,
        })
      }
    } catch (err) {
      console.error('Failed to save conversation:', err)
    }
  }

  async deleteConversation(id: string) {
    await deleteConversation(id)
    if (this.currentConversationId === id) {
      this.currentConversationId = undefined
    }
  }

  getToolHistory() {
    return [...this.toolHistory]
  }

  async undoLastTool(): Promise<{ success: boolean; undoAction?: { type: string; data: any } }> {
    for (let i = this.toolHistory.length - 1; i >= 0; i--) {
      const item = this.toolHistory[i]
      if (!item.undone) {
        item.undone = true

        let undoAction: { type: string; data: any } | undefined

        if (item.name === 'insert_text' && item.args?.text) {
          undoAction = { type: 'delete', data: { text: item.args.text } }
        } else if (item.name === 'replace_text' && item.args?.original) {
          undoAction = { type: 'replace', data: { text: item.args.original } }
        } else if (item.name === 'create_document' && item.args?.title) {
          undoAction = { type: 'delete_document', data: { title: item.args.title } }
        }

        this.emitState()
        return { success: true, undoAction }
      }
    }
    return { success: false }
  }

  canUndo(): boolean {
    return this.toolHistory.some((h) => !h.undone)
  }

  clearHistory() {
    this.state.messages = []
    this.state.memory = { summary: '', entities: [], facts: [] }
    this.toolHistory = []
    this.currentConversationId = undefined
    this.graphState = null
    this.emitState()
  }

  private emitState() {
    this.onStateChange?.({ ...this.state })
  }
}

let globalAgent: AgentGraph | null = null

export function getAgent(config?: Partial<AgentConfig>): AgentGraph {
  if (!globalAgent) {
    globalAgent = new AgentGraph(config)
  }
  return globalAgent
}

export function resetAgent() {
  globalAgent = null
}
