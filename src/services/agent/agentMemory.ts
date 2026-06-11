import { saveToIndexedDB, getAllFromIndexedDB, deleteFromIndexedDB } from '../../utils/idb'

const AGENT_MEMORY_KEY = 'agent-memory'
const AGENT_HISTORY_KEY = 'agent-history'
const MAX_HISTORY = 50

export interface AgentMemory {
  id: string
  summary: string
  updatedAt: number
}

export interface AgentConversation {
  id: string
  title: string
  messages: Array<{
    role: 'user' | 'assistant' | 'tool' | 'system'
    content: string
    timestamp: number
    toolCalls?: Array<{ id: string; name: string; args: Record<string, any> }>
  }>
  memory: string
  createdAt: number
  updatedAt: number
}

export async function saveAgentMemory(memory: string): Promise<void> {
  const data: AgentMemory = {
    id: 'default',
    summary: memory,
    updatedAt: Date.now(),
  }
  await saveToIndexedDB(AGENT_MEMORY_KEY, data)
}

export async function loadAgentMemory(): Promise<string> {
  try {
    const items = await getAllFromIndexedDB<AgentMemory>(AGENT_MEMORY_KEY)
    if (items.length > 0) {
      return items[0].summary
    }
  } catch {
    // ignore
  }
  return ''
}

export async function saveConversation(conversation: Omit<AgentConversation, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
  const id = `conv_${Date.now()}`
  const data: AgentConversation = {
    ...conversation,
    id,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  }
  await saveToIndexedDB(AGENT_HISTORY_KEY, data)
  await trimHistory()
  return id
}

export async function updateConversation(id: string, updates: Partial<Pick<AgentConversation, 'messages' | 'memory' | 'title'>>): Promise<void> {
  const conversations = await getAllFromIndexedDB<AgentConversation>(AGENT_HISTORY_KEY)
  const existing = conversations.find((c) => c.id === id)
  if (existing) {
    const updated = { ...existing, ...updates, updatedAt: Date.now() }
    await saveToIndexedDB(AGENT_HISTORY_KEY, updated)
  }
}

export async function loadConversations(): Promise<AgentConversation[]> {
  try {
    const items = await getAllFromIndexedDB<AgentConversation>(AGENT_HISTORY_KEY)
    return items.sort((a, b) => b.updatedAt - a.updatedAt)
  } catch {
    return []
  }
}

export async function loadConversation(id: string): Promise<AgentConversation | null> {
  try {
    const items = await getAllFromIndexedDB<AgentConversation>(AGENT_HISTORY_KEY)
    return items.find((c) => c.id === id) || null
  } catch {
    return null
  }
}

export async function deleteConversation(id: string): Promise<void> {
  await deleteFromIndexedDB(AGENT_HISTORY_KEY, id)
}

async function trimHistory(): Promise<void> {
  try {
    const items = await getAllFromIndexedDB<AgentConversation>(AGENT_HISTORY_KEY)
    if (items.length > MAX_HISTORY) {
      const sorted = items.sort((a, b) => b.updatedAt - a.updatedAt)
      const toDelete = sorted.slice(MAX_HISTORY)
      for (const item of toDelete) {
        await deleteFromIndexedDB(AGENT_HISTORY_KEY, item.id)
      }
    }
  } catch {
    // ignore
  }
}
