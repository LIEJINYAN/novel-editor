export type AIProvider = 'openai' | 'anthropic' | 'custom'

interface AIConfig {
  provider: AIProvider
  apiKey: string
  baseUrl: string
  model: string
  maxConcurrent?: number
  timeout?: number
  maxRetries?: number
}

interface QueueItem {
  id: string
  prompt: string
  context: string
  onChunk: (text: string) => void
  signal?: AbortSignal
  reject: (error: Error) => void
  resolve: (value: string) => void
}

const STORAGE_KEY = 'novel-engine-ai-config'
const DEFAULT_TIMEOUT = 60000
const DEFAULT_MAX_RETRIES = 3
const DEFAULT_MAX_CONCURRENT = 2

let activeRequests = 0
const requestQueue: QueueItem[] = []
let requestIdCounter = 0

export function getAIConfig(): AIConfig | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

export function saveAIConfig(config: AIConfig) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(config))
}

export function clearAIConfig() {
  localStorage.removeItem(STORAGE_KEY)
}

function generateRequestId(): string {
  return `req_${++requestIdCounter}_${Date.now()}`
}

function buildApiUrl(baseUrl: string): string {
  const trimmed = baseUrl.trim().replace(/\/+$/, '')
  if (trimmed.endsWith('/v1/chat/completions') || trimmed.endsWith('/chat/completions')) {
    return trimmed
  }
  if (trimmed.endsWith('/v1')) {
    return `${trimmed}/chat/completions`
  }
  if (trimmed.endsWith('/v4') || trimmed.endsWith('/v3') || trimmed.endsWith('/v2')) {
    return `${trimmed}/chat/completions`
  }
  return `${trimmed}/v1/chat/completions`
}

function processQueue(): void {
  if (requestQueue.length === 0 || activeRequests >= (getAIConfig()?.maxConcurrent || DEFAULT_MAX_CONCURRENT)) {
    return
  }

  const item = requestQueue.shift()
  if (!item) return

  activeRequests++
  executeRequest(item)
    .finally(() => {
      activeRequests--
      processQueue()
    })
}

async function executeRequest(item: QueueItem): Promise<void> {
  const config = getAIConfig()
  if (!config) {
    item.reject(new Error('请先配置 AI API 密钥'))
    return
  }

  const timeout = config.timeout || DEFAULT_TIMEOUT
  const maxRetries = config.maxRetries || DEFAULT_MAX_RETRIES
  let lastError: Error | null = null

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const fullPrompt = item.context ? `${item.context}\n\n---\n\n${item.prompt}` : item.prompt

      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), timeout)

      if (item.signal) {
        item.signal.addEventListener('abort', () => controller.abort())
      }

      const url = buildApiUrl(config.baseUrl)
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${config.apiKey}`,
        },
        body: JSON.stringify({
          model: config.model || 'gpt-3.5-turbo',
          messages: [{ role: 'user', content: fullPrompt }],
          stream: true,
        }),
        signal: controller.signal,
      })

      clearTimeout(timeoutId)

      if (!response.ok) {
        const err = await response.text()
        throw new Error(`AI 请求失败: ${response.status} ${err}`)
      }

      const reader = response.body!.getReader()
      const decoder = new TextDecoder()
      let fullText = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        const chunk = decoder.decode(value)
        const lines = chunk.split('\n').filter((l) => l.startsWith('data: '))

        for (const line of lines) {
          const data = line.slice(6).trim()
          if (data === '[DONE]') {
            item.resolve(fullText)
            return
          }
          try {
            const parsed = JSON.parse(data)
            const content = parsed.choices?.[0]?.delta?.content || ''
            if (content) {
              fullText += content
              item.onChunk(content)
            }
          } catch {
            // skip malformed chunks
          }
        }
      }

      item.resolve(fullText)
      return
    } catch (error: any) {
      lastError = error
      if (error.name === 'AbortError' && attempt < maxRetries) {
        await new Promise(r => setTimeout(r, 1000 * attempt))
        continue
      }
      break
    }
  }

  item.reject(lastError || new Error('请求失败'))
}

export async function aiCompleteStream(
  prompt: string,
  context: string,
  onChunk: (text: string) => void,
  signal?: AbortSignal
): Promise<string> {
  const config = getAIConfig()
  if (!config) throw new Error('请先配置 AI API 密钥')

  return new Promise((resolve, reject) => {
    const item: QueueItem = {
      id: generateRequestId(),
      prompt,
      context,
      onChunk,
      signal,
      resolve,
      reject,
    }

    requestQueue.push(item)
    processQueue()
  })
}

export function getQueueStatus(): { pending: number; active: number } {
  return {
    pending: requestQueue.length,
    active: activeRequests,
  }
}

export function cancelAllRequests(): void {
  requestQueue.length = 0
  activeRequests = 0
}

export const AI_COMMANDS = {
  continueWriting: {
    label: '续写',
    icon: '✍️',
    buildPrompt: (text: string) => `请根据以下上下文，自然地续写一段小说内容，保持风格一致：\n\n${text}`,
  },
  polish: {
    label: '润色',
    icon: '✨',
    buildPrompt: (text: string) => `请改进以下段落的文风和表达，使其更加流畅优美，保留原意：\n\n${text}`,
  },
  summarize: {
    label: '摘要',
    icon: '📝',
    buildPrompt: (text: string) => `请为以下内容生成一段简短的摘要（3-5句话）：\n\n${text}`,
  },
  expand: {
    label: '扩写',
    icon: '🔍',
    buildPrompt: (text: string) => `请在以下内容的基础上增加更多细节描写、对话或心理活动：\n\n${text}`,
  },
  shorten: {
    label: '精简',
    icon: '✂️',
    buildPrompt: (text: string) => `请精简以下内容，保留核心信息：\n\n${text}`,
  },
  translateToEn: {
    label: '译英',
    icon: '🇺🇸',
    buildPrompt: (text: string) => `请将以下中文内容翻译成英文，保持文学性：\n\n${text}`,
  },
  translateToZh: {
    label: '译中',
    icon: '🇨🇳',
    buildPrompt: (text: string) => `请将以下英文内容翻译成中文，保持文学性：\n\n${text}`,
  },
  correctErrors: {
    label: '纠错',
    icon: '🔧',
    buildPrompt: (text: string) => `请检查并纠正以下内容中的错别字、语法错误和标点符号错误：\n\n${text}`,
  },
  literaryStyle: {
    label: '文艺',
    icon: '🎨',
    buildPrompt: (text: string) => `请将以下内容改写为文艺风格，增加修辞手法和文学性：\n\n${text}`,
  },
  casualStyle: {
    label: '口语',
    icon: '💬',
    buildPrompt: (text: string) => `请将以下内容改写为轻松口语化的风格：\n\n${text}`,
  },
  formalStyle: {
    label: '正式',
    icon: '👔',
    buildPrompt: (text: string) => `请将以下内容改写为正式书面语风格：\n\n${text}`,
  },
  suspenseStyle: {
    label: '悬疑',
    icon: '🕵️',
    buildPrompt: (text: string) => `请将以下内容改写为悬疑风格，增加悬念和紧张感：\n\n${text}`,
  },
  romanceStyle: {
    label: '言情',
    icon: '💕',
    buildPrompt: (text: string) => `请将以下内容改写为言情风格，增加情感描写：\n\n${text}`,
  },
  humorStyle: {
    label: '幽默',
    icon: '😄',
    buildPrompt: (text: string) => `请将以下内容改写为幽默风趣的风格：\n\n${text}`,
  },
  generateDialogue: {
    label: '生成对话',
    icon: '💬',
    buildPrompt: (text: string) => `请根据以下场景描述，生成一段生动的对话：\n\n${text}`,
  },
  generateDescription: {
    label: '场景描写',
    icon: '🌆',
    buildPrompt: (text: string) => `请根据以下内容，生成一段详细的场景环境描写：\n\n${text}`,
  },
  characterAnalysis: {
    label: '人物分析',
    icon: '👤',
    buildPrompt: (text: string) => `请分析以下内容中的人物性格特征和行为动机：\n\n${text}`,
  },
  plotSuggestion: {
    label: '情节建议',
    icon: '💡',
    buildPrompt: (text: string) => `请根据以下内容，提供3个可能的情节发展方向：\n\n${text}`,
  },
  titleSuggestion: {
    label: '标题建议',
    icon: '📖',
    buildPrompt: (text: string) => `请根据以下内容，生成5个合适的章节标题：\n\n${text}`,
  },
  wordChoice: {
    label: '用词优化',
    icon: '🎯',
    buildPrompt: (text: string) => `请优化以下内容的用词，使其更加精准生动：\n\n${text}`,
  },
  pacingAdjust: {
    label: '节奏调整',
    icon: '⏱️',
    buildPrompt: (text: string) => `请调整以下内容的叙事节奏，使其更加紧凑：\n\n${text}`,
  },
  sensoryDetail: {
    label: '感官描写',
    icon: '👁️',
    buildPrompt: (text: string) => `请为以下内容增加视觉、听觉、嗅觉等感官描写：\n\n${text}`,
  },
  emotionDeepen: {
    label: '情感深化',
    icon: '❤️',
    buildPrompt: (text: string) => `请深化以下内容的情感表达，增加内心独白：\n\n${text}`,
  },
}

export const AI_TEMPLATES = {
  novelOpening: {
    label: '小说开头',
    icon: '📖',
    prompt: '请帮我写一个小说开头，要求：\n1. 设定：[在此填写世界观设定]\n2. 主角：[在此描述主角特征]\n3. 风格：[在此选择风格]\n4. 字数：约500字',
  },
  characterDesign: {
    label: '人物设计',
    icon: '👤',
    prompt: '请帮我设计一个小说人物：\n1. 性别：[男/女]\n2. 年龄：[在此填写]\n3. 职业：[在此填写]\n4. 性格特点：[在此填写]\n5. 背景故事：[在此填写]',
  },
  worldBuilding: {
    label: '世界观设定',
    icon: '🌍',
    prompt: '请帮我构建一个小说世界观：\n1. 类型：[奇幻/科幻/现实/历史]\n2. 时代背景：[在此填写]\n3. 核心设定：[在此填写]\n4. 特殊规则：[在此填写]',
  },
  plotOutline: {
    label: '大纲生成',
    icon: '📋',
    prompt: '请帮我生成一个小说大纲：\n1. 主题：[在此填写]\n2. 字数：[短篇/中篇/长篇]\n3. 核心冲突：[在此填写]\n4. 结局走向：[开放/圆满/悲剧]',
  },
  dialogueScene: {
    label: '对话场景',
    icon: '💬',
    prompt: '请帮我写一段对话场景：\n1. 人物A：[姓名和特征]\n2. 人物B：[姓名和特征]\n3. 场景：[在此描述]\n4. 情绪：[在此选择]\n5. 目的：[在此描述]',
  },
  actionScene: {
    label: '动作场景',
    icon: '⚔️',
    prompt: '请帮我写一段动作场景：\n1. 场景类型：[战斗/追逐/逃脱/竞技]\n2. 参与者：[在此描述]\n3. 环境：[在此描述]\n4. 节奏：[快节奏/慢节奏]',
  },
}

export type AICommandKey = keyof typeof AI_COMMANDS
export type AITemplateKey = keyof typeof AI_TEMPLATES
