import { useState, useRef, useEffect, useCallback } from 'react'
import { aiCompleteStream, AI_COMMANDS, getAIConfig, cleanAIResponse } from '../../services/aiService'

interface AIToolbarProps {
  editorContent: string
  onInsertContent: (text: string) => void
}

export default function AIToolbar({ editorContent, onInsertContent }: AIToolbarProps) {
  const [loading, setLoading] = useState(false)
  const [activeCommand, setActiveCommand] = useState<string | null>(null)
  const [result, setResult] = useState<string | null>(null)
  const [showResult, setShowResult] = useState(false)
  const [popupPosition, setPopupPosition] = useState<'left' | 'right'>('left')
  const resultRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (showResult && resultRef.current) {
      const rect = resultRef.current.getBoundingClientRect()
      if (rect.right > window.innerWidth) {
        setPopupPosition('right')
      } else {
        setPopupPosition('left')
      }
    }
  }, [showResult, result])

  const handleCommand = async (cmd: keyof typeof AI_COMMANDS) => {
    const config = getAIConfig()
    if (!config) {
      alert('请先在AI面板设置中配置API密钥')
      return
    }

    setLoading(true)
    setActiveCommand(cmd)
    setResult(null)
    setShowResult(false)

    const command = AI_COMMANDS[cmd]
    const prompt = command.buildPrompt(editorContent)

    let fullResponse = ''

    try {
      await aiCompleteStream(
        prompt,
        editorContent,
        (chunk) => {
          fullResponse += chunk
          setResult(fullResponse)
          setShowResult(true)
        }
      )
      setResult(cleanAIResponse(fullResponse))
    } catch (err: any) {
      setResult(`❌ ${err.message}`)
      setShowResult(true)
    }

    setLoading(false)
    setActiveCommand(null)
  }

  const handleInsert = () => {
    if (result) {
      onInsertContent(result)
      setShowResult(false)
      setResult(null)
    }
  }

  const handleCancel = () => {
    setShowResult(false)
    setResult(null)
  }

  return (
    <div className="relative">
      <div className="flex items-center gap-1 p-1 bg-editor-surface border border-editor-border rounded-lg shadow-lg overflow-x-auto max-w-full">
        {(Object.keys(AI_COMMANDS) as Array<keyof typeof AI_COMMANDS>).map((key) => (
          <button
            key={key}
            className={`text-xs px-2 py-1.5 rounded flex items-center gap-1 transition-colors whitespace-nowrap ${
              activeCommand === key
                ? 'bg-editor-accent text-editor-bg'
                : 'text-editor-muted hover:text-editor-text hover:bg-editor-bg'
            }`}
            onClick={() => handleCommand(key)}
            disabled={loading}
            title={AI_COMMANDS[key].label}
          >
            <span>{AI_COMMANDS[key].icon}</span>
            <span className="hidden sm:inline">{AI_COMMANDS[key].label}</span>
          </button>
        ))}
      </div>

      {showResult && result && (
        <div
          ref={resultRef}
          className={`absolute top-full mt-2 w-80 bg-editor-surface border border-editor-border rounded-lg shadow-xl z-50 overflow-hidden ${
            popupPosition === 'right' ? 'right-0' : 'left-0'
          }`}
        >
          <div className="p-2 border-b border-editor-border flex items-center justify-between">
            <span className="text-xs font-medium text-editor-text">
              {activeCommand ? AI_COMMANDS[activeCommand as keyof typeof AI_COMMANDS]?.label : 'AI 结果'}
            </span>
            <div className="flex gap-1">
              <button
                className="text-xs text-editor-muted hover:text-editor-text px-2 py-1 rounded hover:bg-editor-bg disabled:opacity-50 disabled:cursor-not-allowed"
                onClick={handleInsert}
                disabled={loading}
              >
                插入
              </button>
              <button
                className="text-xs text-editor-muted hover:text-editor-text px-2 py-1 rounded hover:bg-editor-bg"
                onClick={handleCancel}
              >
                取消
              </button>
            </div>
          </div>
          <div className="p-3 max-h-60 overflow-y-auto">
            <p className="text-sm text-editor-text whitespace-pre-wrap break-words">{result}</p>
          </div>
        </div>
      )}
    </div>
  )
}
