import { useState, useRef, useEffect } from 'react'
import { aiCompleteStream, AI_COMMANDS, getAIConfig, saveAIConfig, clearAIConfig, getQueueStatus, cancelAllRequests } from '../../services/aiService'
import type { AIProvider } from '../../services/aiService'

interface Message {
  role: 'user' | 'assistant'
  content: string
}

interface AIPanelProps {
  editorContent?: string
  onInsertContent?: (text: string) => void
}

export default function AIPanel({ editorContent, onInsertContent }: AIPanelProps) {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const [apiKey, setApiKey] = useState(getAIConfig()?.apiKey || '')
  const [baseUrl, setBaseUrl] = useState(getAIConfig()?.baseUrl || 'https://api.openai.com')
  const [model, setModel] = useState(getAIConfig()?.model || 'gpt-3.5-turbo')
  const [queueStatus, setQueueStatus] = useState({ pending: 0, active: 0 })
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const abortRef = useRef<AbortController | null>(null)
  const statusIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  useEffect(() => {
    statusIntervalRef.current = setInterval(() => {
      setQueueStatus(getQueueStatus())
    }, 1000)

    return () => {
      if (statusIntervalRef.current) {
        clearInterval(statusIntervalRef.current)
      }
    }
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
    const selectedText = editorContent || ''
    const command = AI_COMMANDS[cmd]
    handleSend(command.buildPrompt(selectedText))
  }

  const handleSaveSettings = () => {
    const provider: AIProvider = baseUrl.includes('anthropic') ? 'anthropic' : baseUrl.includes('api.openai') ? 'openai' : 'custom'
    saveAIConfig({ provider, apiKey, baseUrl: baseUrl.replace(/\/+$/, ''), model })
    setShowSettings(false)
  }

  const handleInsert = (text: string) => {
    onInsertContent?.(text)
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

  return (
    <div className="flex-1 flex flex-col min-h-0">
      {/* Header with settings */}
      <div className="p-3 border-b border-editor-border flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h2 className="text-xs font-semibold text-editor-muted uppercase tracking-wider">AI 助手</h2>
          {(queueStatus.pending > 0 || queueStatus.active > 0) && (
            <span className="text-xs text-editor-muted">
              队列: {queueStatus.pending} | 活跃: {queueStatus.active}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {(queueStatus.pending > 0 || queueStatus.active > 0) && (
            <button
              className="text-xs text-editor-red hover:text-editor-text"
              onClick={handleCancelAll}
              title="取消所有请求"
            >
              ■
            </button>
          )}
          <button
            className="text-xs text-editor-muted hover:text-editor-text"
            onClick={() => setShowSettings(!showSettings)}
          >
            ⚙️
          </button>
        </div>
      </div>

      {/* Settings panel */}
      {showSettings && (
        <div className="p-3 border-b border-editor-border bg-editor-surface/30 space-y-2">
          <input
            className="w-full bg-editor-surface text-editor-text text-xs px-2 py-1.5 rounded border border-editor-border outline-none placeholder:text-editor-muted"
            placeholder="API Key (sk-...)"
            type="password"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
          />
          <input
            className="w-full bg-editor-surface text-editor-text text-xs px-2 py-1.5 rounded border border-editor-border outline-none placeholder:text-editor-muted"
            placeholder="Base URL (e.g. https://api.openai.com)"
            value={baseUrl}
            onChange={(e) => setBaseUrl(e.target.value)}
          />
          <input
            className="w-full bg-editor-surface text-editor-text text-xs px-2 py-1.5 rounded border border-editor-border outline-none placeholder:text-editor-muted"
            placeholder="Model (e.g. gpt-3.5-turbo)"
            value={model}
            onChange={(e) => setModel(e.target.value)}
          />
          <div className="flex gap-2">
            <button
              className="flex-1 text-xs bg-editor-accent text-editor-bg px-3 py-1.5 rounded hover:opacity-90"
              onClick={handleSaveSettings}
            >
              保存
            </button>
            <button
              className="text-xs text-editor-muted px-3 py-1.5 rounded hover:bg-editor-surface"
              onClick={() => { clearAIConfig(); setApiKey('') }}
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
      <div className="flex-1 overflow-y-auto p-3 space-y-3">
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
              <p className="whitespace-pre-wrap break-words">{msg.content || (loading && i === messages.length - 1 ? '...' : '')}</p>
              {msg.role === 'assistant' && msg.content && (
                <button
                  className="text-xs text-editor-muted mt-1 hover:text-editor-accent"
                  onClick={() => handleInsert(msg.content)}
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
          />
          {loading ? (
            <button
              className="text-editor-red px-3 py-2 rounded hover:bg-editor-surface text-sm"
              onClick={handleStop}
            >
              ■
            </button>
          ) : (
            <button
              className="bg-editor-accent text-editor-bg px-3 py-2 rounded hover:opacity-90 text-sm"
              onClick={() => handleSend()}
              disabled={!input.trim()}
            >
              发送
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
