import { useState, useRef, useEffect, useCallback } from 'react'
import { aiCompleteStream, cancelAllRequests, getAIConfig, saveAIConfig, clearAIConfig, cleanAIResponse, getQueueStatus, queueEvents, AI_COMMANDS } from '../../services/aiService'
import type { AIProvider } from '../../services/aiService'
import { showToast } from '../../utils/toast'

interface Message {
  role: 'user' | 'assistant'
  content: string
}

const MESSAGES_KEY = 'novel-engine-ai-messages'

function loadMessages(): Message[] {
  try {
    const raw = localStorage.getItem(MESSAGES_KEY)
    return raw ? JSON.parse(raw) : []
  } catch { return [] }
}

function saveMessagesToStorage(messages: Message[]) {
  try {
    const toSave = messages.slice(-50)
    localStorage.setItem(MESSAGES_KEY, JSON.stringify(toSave))
  } catch {}
}

interface AIPanelProps {
  editorContent?: string
  onInsertContent?: (text: string) => void
}

export default function AIPanel({ editorContent, onInsertContent }: AIPanelProps) {
  const [messages, setMessages] = useState<Message[]>(loadMessages)
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const [apiKey, setApiKey] = useState(getAIConfig()?.apiKey || '')
  const [baseUrl, setBaseUrl] = useState(getAIConfig()?.baseUrl || 'https://api.openai.com')
  const [model, setModel] = useState(getAIConfig()?.model || 'gpt-3.5-turbo')
  const [queueStatus, setQueueStatus] = useState({ pending: 0, active: 0 })
  const [testStatus, setTestStatus] = useState<'idle' | 'testing' | 'success' | 'error'>('idle')
  const [confirmClear, setConfirmClear] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const abortRef = useRef<AbortController | null>(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  useEffect(() => {
    saveMessagesToStorage(messages)
  }, [messages])

  useEffect(() => {
    setQueueStatus(getQueueStatus())

    const unsubscribe = queueEvents.on('status-change', (status) => {
      setQueueStatus(status)
    })

    return unsubscribe
  }, [])

  const handleSend = async (prompt?: string) => {
    const text = (prompt || input).trim()
    if (!text) return

    setMessages((prev) => [...prev, { role: 'user', content: text }])
    setInput('')
    setLoading(true)

    const config = getAIConfig()
    if (!config) {
      setMessages((prev) => [...prev, { role: 'assistant', content: '⚠️ 请先在设置中配置 AI API 密钥' }])
      setLoading(false)
      return
    }

    abortRef.current = new AbortController()
    let fullResponse = ''

    setMessages((prev) => [...prev, { role: 'assistant', content: '' }])

    try {
      await aiCompleteStream(
        text,
        editorContent || '',
        (chunk) => {
          fullResponse += chunk
          setMessages((prev) => {
            const updated = [...prev]
            updated[updated.length - 1] = { role: 'assistant', content: fullResponse }
            return updated
          })
        },
        abortRef.current.signal
      )
    } catch (err: any) {
      if (err.name !== 'AbortError') {
        setMessages((prev) => {
          const updated = [...prev]
          updated[updated.length - 1] = { role: 'assistant', content: `❌ ${err.message}` }
          return updated
        })
      }
    }

    setLoading(false)
    abortRef.current = null
  }

  const handleCommand = (cmd: keyof typeof AI_COMMANDS) => {
    const maxLen = 2000
    const context = (editorContent || '').length > maxLen
      ? (editorContent || '').slice(0, maxLen) + '\n...(内容已截断)'
      : editorContent || ''
    const command = AI_COMMANDS[cmd]
    handleSend(command.buildPrompt(context))
  }

  const handleSaveSettings = () => {
    const provider: AIProvider = baseUrl.includes('anthropic') ? 'anthropic' : baseUrl.includes('api.openai') ? 'openai' : 'custom'
    saveAIConfig({ provider, apiKey, baseUrl: baseUrl.replace(/\/+$/, ''), model })
    showToast('设置已保存', 'success')
    setShowSettings(false)
  }

  const handleTestConnection = async () => {
    if (!apiKey) {
      showToast('请先输入API Key', 'warning')
      return
    }
    setTestStatus('testing')
    try {
      const provider: AIProvider = baseUrl.includes('anthropic') ? 'anthropic' : baseUrl.includes('api.openai') ? 'openai' : 'custom'
      const url = baseUrl.replace(/\/+$/, '')
      const endpoint = provider === 'anthropic' ? `${url}/v1/messages` : `${url}/v1/chat/completions`

      const headers: Record<string, string> = { 'Content-Type': 'application/json' }
      if (provider === 'anthropic') {
        headers['x-api-key'] = apiKey
        headers['anthropic-version'] = '2023-06-01'
      } else {
        headers['Authorization'] = `Bearer ${apiKey}`
      }

      const body = provider === 'anthropic'
        ? { model, max_tokens: 10, messages: [{ role: 'user', content: 'hi' }] }
        : { model, messages: [{ role: 'user', content: 'hi' }], max_tokens: 10 }

      const resp = await fetch(endpoint, {
        method: 'POST',
        headers,
        body: JSON.stringify(body),
        signal: AbortSignal.timeout(15000),
      })

      if (resp.ok) {
        setTestStatus('success')
        showToast('连接成功', 'success')
      } else {
        const errText = await resp.text().catch(() => resp.statusText)
        setTestStatus('error')
        showToast(`连接失败: ${resp.status} ${errText.slice(0, 100)}`, 'error')
      }
    } catch (err) {
      setTestStatus('error')
      showToast(`连接失败: ${(err as Error).message}`, 'error')
    } finally {
      setTimeout(() => setTestStatus('idle'), 2000)
    }
  }

  const handleInsert = (text: string) => {
    onInsertContent?.(cleanAIResponse(text))
  }

  const handleStop = () => {
    abortRef.current?.abort()
    setLoading(false)
  }

  const handleCancelAll = () => {
    cancelAllRequests()
    setLoading(false)
    setQueueStatus({ pending: 0, active: 0 })
  }

  const handleClearMessages = () => {
    if (confirmClear) {
      setMessages([])
      localStorage.removeItem(MESSAGES_KEY)
      setConfirmClear(false)
    } else {
      setConfirmClear(true)
      setTimeout(() => setConfirmClear(false), 3000)
    }
  }

  return (
    <div className="flex-1 flex flex-col min-h-0" role="complementary" aria-label="AI 助手">
      {/* Header with settings */}
      <div className="p-3 border-b border-editor-border flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h2 className="text-xs font-semibold text-editor-muted uppercase tracking-wider">AI 助手</h2>
          {(queueStatus.pending > 0 || queueStatus.active > 0) && (
            <span className="text-xs text-editor-muted" aria-live="polite">
              队列: {queueStatus.pending} | 活跃: {queueStatus.active}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {messages.length > 0 && (
            <button
              className={`text-xs ${confirmClear ? 'text-red-500' : 'text-editor-muted hover:text-editor-text'}`}
              onClick={handleClearMessages}
              aria-label={confirmClear ? '确认清空' : '清空对话'}
              title={confirmClear ? '再次点击确认清空' : '清空对话'}
            >
              🗑️{confirmClear && ' 确认?'}
            </button>
          )}
          {(queueStatus.pending > 0 || queueStatus.active > 0) && (
            <button
              className="text-xs text-editor-red hover:text-editor-text"
              onClick={handleCancelAll}
              title="取消所有请求"
              aria-label="取消所有请求"
            >
              ■
            </button>
          )}
          <button
            className="text-xs text-editor-muted hover:text-editor-text"
            onClick={() => setShowSettings(!showSettings)}
            aria-label="设置"
          >
            ⚙️
          </button>
        </div>
      </div>

      {/* Settings panel */}
      {showSettings && (
        <div className="p-3 border-b border-editor-border bg-editor-surface/30 space-y-2" role="region" aria-label="AI设置">
          <input
            className="w-full bg-editor-surface text-editor-text text-xs px-2 py-1.5 rounded border border-editor-border outline-none placeholder:text-editor-muted"
            placeholder="API Key (sk-...)"
            type="password"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            aria-label="API密钥"
          />
          <input
            className="w-full bg-editor-surface text-editor-text text-xs px-2 py-1.5 rounded border border-editor-border outline-none placeholder:text-editor-muted"
            placeholder="Base URL (e.g. https://api.openai.com)"
            value={baseUrl}
            onChange={(e) => setBaseUrl(e.target.value)}
            aria-label="Base URL"
          />
          <input
            className="w-full bg-editor-surface text-editor-text text-xs px-2 py-1.5 rounded border border-editor-border outline-none placeholder:text-editor-muted"
            placeholder="Model (e.g. gpt-3.5-turbo)"
            value={model}
            onChange={(e) => setModel(e.target.value)}
            aria-label="模型名称"
          />
          <div className="flex gap-2">
            <button
              className="flex-1 text-xs bg-editor-accent text-editor-bg px-3 py-1.5 rounded hover:opacity-90"
              onClick={handleSaveSettings}
            >
              保存
            </button>
            <button
              className={`text-xs px-3 py-1.5 rounded hover:bg-editor-surface ${
                testStatus === 'success' ? 'text-green-500' : testStatus === 'error' ? 'text-red-500' : 'text-editor-muted'
              }`}
              onClick={handleTestConnection}
              disabled={testStatus === 'testing'}
            >
              {testStatus === 'testing' ? '测试中...' : testStatus === 'success' ? '✓ 成功' : testStatus === 'error' ? '✗ 失败' : '测试连接'}
            </button>
            <button
              className="text-xs text-editor-muted px-3 py-1.5 rounded hover:bg-editor-surface"
              onClick={() => { clearAIConfig(); setApiKey(''); showToast('设置已清除', 'success') }}
            >
              清除
            </button>
          </div>
        </div>
      )}

      {/* Quick action buttons */}
      <div className="p-2 border-b border-editor-border flex flex-wrap gap-1">
        {(Object.keys(AI_COMMANDS) as Array<keyof typeof AI_COMMANDS>).map((key) => (
          <button
            key={key}
            className="text-xs text-editor-muted hover:text-editor-text hover:bg-editor-surface px-2 py-1 rounded flex items-center gap-1"
            onClick={() => handleCommand(key)}
            disabled={loading}
          >
            <span>{AI_COMMANDS[key].icon}</span>
            <span>{AI_COMMANDS[key].label}</span>
          </button>
        ))}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3" role="log" aria-live="polite" aria-label="AI对话消息">
        {messages.length === 0 && (
          <p className="text-center text-editor-muted text-xs mt-4">
            使用快速命令或输入提示词与 AI 对话
            <br />
            <span className="text-xs opacity-60">需先配置 API 密钥</span>
          </p>
        )}
        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div
              className={`max-w-[85%] rounded-lg px-3 py-2 text-sm ${
                msg.role === 'user'
                  ? 'bg-editor-accent text-editor-bg'
                  : 'bg-editor-surface text-editor-text'
              }`}
            >
              <p className="whitespace-pre-wrap break-words">
                {msg.content || (loading && i === messages.length - 1 ? (
                  <span className="inline-flex gap-1">
                    <span className="animate-bounce" style={{ animationDelay: '0ms' }}>●</span>
                    <span className="animate-bounce" style={{ animationDelay: '150ms' }}>●</span>
                    <span className="animate-bounce" style={{ animationDelay: '300ms' }}>●</span>
                  </span>
                ) : '')}
              </p>
              {msg.role === 'assistant' && msg.content && !msg.content.startsWith('❌') && !msg.content.startsWith('⚠️') && (
                <button
                  className="text-xs text-editor-muted mt-1 hover:text-editor-accent"
                  onClick={() => handleInsert(msg.content)}
                  aria-label="插入到文档"
                >
                  插入到文档
                </button>
              )}
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-3 border-t border-editor-border">
        <div className="flex gap-2">
          <input
            className="flex-1 bg-editor-surface text-editor-text text-sm px-3 py-2 rounded border border-editor-border outline-none placeholder:text-editor-muted"
            placeholder={loading ? 'AI 生成中...' : '输入提示词...'}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend() } }}
            disabled={loading}
            aria-label="输入提示词"
          />
          {loading ? (
            <button
              className="text-editor-red px-3 py-2 rounded hover:bg-editor-surface text-sm"
              onClick={handleStop}
              aria-label="停止生成"
            >
              ■
            </button>
          ) : (
            <button
              className="bg-editor-accent text-editor-bg px-3 py-2 rounded hover:opacity-90 text-sm"
              onClick={() => handleSend()}
              disabled={!input.trim()}
              aria-label="发送"
            >
              发送
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
