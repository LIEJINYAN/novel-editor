import { AIMessage, SystemMessage, ToolMessage } from '@langchain/core/messages'
import { END } from '@langchain/langgraph'
import { getNovelEditorLLM } from './llmAdapter'
import { getToolByName, setToolContext, needsReview } from './langchainTools'

const SYSTEM_PROMPT = `你是一个专业的AI写作助手，嵌入在小说编辑器中。你可以帮助用户：

1. 写作辅助：续写、润色、扩写、精简、翻译
2. 编辑操作：插入文本、替换文本、读取文档
3. 分析功能：读取大纲、字数统计
4. 创意建议：提供写作建议、角色发展、情节构思

工具使用规则：
- 当用户要求编辑文档时，使用 insert_text 或 replace_text
- 当需要了解文档内容时，使用 read_document 或 read_outline
- 当需要修改建议时，使用 suggest_edit（等待用户确认）
- 每次只执行一个主要操作
- 执行工具后，向用户解释你做了什么

回复格式：
- 使用中文回复
- 保持简洁专业
- 如果执行了工具操作，说明操作结果
- 如果需要用户确认，明确说明`

export interface GraphState {
  messages: Array<AIMessage | SystemMessage | ToolMessage | { role: string; content: string }>
  documentContent: string
  documentTitle: string
  selection: string
  cursorPosition: number
  memory: string
  pendingReview: boolean
  pendingToolCalls: Array<{ id: string; name: string; args: Record<string, any> }>
}

export async function agentNode(state: GraphState): Promise<Partial<GraphState>> {
  setToolContext({
    documentContent: state.documentContent,
    documentTitle: state.documentTitle,
    selection: state.selection,
    cursorPosition: state.cursorPosition,
  })

  const llm = getNovelEditorLLM()

  const messages: Array<SystemMessage | AIMessage | { role: string; content: string }> = [
    new SystemMessage(SYSTEM_PROMPT),
  ]

  if (state.memory) {
    messages.push(new SystemMessage(`对话记忆：${state.memory}`))
  }

  const contextInfo = [
    `文档标题: ${state.documentTitle}`,
    `文档长度: ${state.documentContent?.length || 0} 字符`,
    state.selection ? `选中文本: "${state.selection.slice(0, 100)}"` : '',
  ]
    .filter(Boolean)
    .join('\n')

  if (contextInfo) {
    messages.push(new SystemMessage(`当前上下文:\n${contextInfo}`))
  }

  for (const msg of state.messages) {
    if ('_getType' in msg && typeof msg._getType === 'function') {
      messages.push(msg as SystemMessage | AIMessage)
    } else if ('role' in msg && 'content' in msg) {
      const role = (msg as { role: string }).role
      const content = (msg as { content: string }).content
      if (role === 'user') {
        messages.push({ role: 'user', content })
      } else if (role === 'assistant') {
        messages.push({ role: 'assistant', content })
      }
    }
  }

  const response = await llm.invoke(messages)

  const aiMsg = response as AIMessage
  const toolCalls = aiMsg.tool_calls || []
  const hasToolCalls = toolCalls.length > 0

  if (hasToolCalls) {
    const pendingReview = toolCalls.some((tc) => needsReview(tc.name))

    return {
      messages: [...state.messages, aiMsg],
      pendingReview,
      pendingToolCalls: toolCalls.map((tc) => ({
        id: tc.id || `call_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
        name: tc.name,
        args: tc.args,
      })),
    }
  }

  return {
    messages: [...state.messages, aiMsg],
    pendingReview: false,
    pendingToolCalls: [],
  }
}

export async function toolNode(state: GraphState): Promise<Partial<GraphState>> {
  const lastMsg = state.messages[state.messages.length - 1]
  if (!lastMsg || !('tool_calls' in lastMsg)) {
    return { messages: [...state.messages] }
  }

  const aiMsg = lastMsg as AIMessage
  const toolMessages: ToolMessage[] = []
  const toolCalls = aiMsg.tool_calls || []

  for (const tc of toolCalls) {
    const tool = getToolByName(tc.name)
    if (!tool) {
      toolMessages.push(
        new ToolMessage({
          content: `未知工具: ${tc.name}`,
          tool_call_id: tc.id || `call_${Date.now()}`,
        })
      )
      continue
    }

    try {
      const argsStr = JSON.stringify(tc.args)
      const result = await tool.invoke(argsStr)
      toolMessages.push(
        new ToolMessage({
          content: result,
          tool_call_id: tc.id || `call_${Date.now()}`,
        })
      )
    } catch (err) {
      toolMessages.push(
        new ToolMessage({
          content: `执行失败: ${(err as Error).message}`,
          tool_call_id: tc.id || `call_${Date.now()}`,
        })
      )
    }
  }

  return {
    messages: [...state.messages, ...toolMessages],
    pendingReview: false,
    pendingToolCalls: [],
  }
}

export function shouldContinue(state: GraphState): 'tools' | 'review' | typeof END {
  const lastMsg = state.messages[state.messages.length - 1]

  if (!lastMsg || !('tool_calls' in lastMsg)) {
    return END
  }

  const aiMsg = lastMsg as AIMessage
  if (!aiMsg.tool_calls || aiMsg.tool_calls.length === 0) {
    return END
  }

  if (aiMsg.tool_calls.some((tc) => needsReview(tc.name))) {
    return 'review'
  }

  return 'tools'
}
