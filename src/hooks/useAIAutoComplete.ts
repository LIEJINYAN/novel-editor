import { useState, useCallback, useRef, useEffect } from 'react'
import { getAIConfig } from '../services/aiService'

interface Suggestion {
  text: string
  confidence: number
}

export function useAIAutoComplete() {
  const [suggestions, setSuggestions] = useState<Suggestion[]>([])
  const [loading, setLoading] = useState(false)
  const [enabled, setEnabled] = useState(true)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const abortRef = useRef<AbortController | null>(null)

  const getSuggestions = useCallback(async (context: string, cursorPosition: number) => {
    if (!enabled || !getAIConfig()) {
      setSuggestions([])
      return
    }

    if (debounceRef.current) {
      clearTimeout(debounceRef.current)
    }

    if (abortRef.current) {
      abortRef.current.abort()
    }

    debounceRef.current = setTimeout(async () => {
      setLoading(true)
      const controller = new AbortController()
      abortRef.current = controller

      try {
        const config = getAIConfig()
        if (!config) return

        const recentText = context.slice(Math.max(0, cursorPosition - 500), cursorPosition)
        const prompt = `根据以下文本，提供3个可能的续写建议（每个建议不超过20字）。只返回建议，不要解释。

文本：
${recentText}

续写建议：`

        const response = await fetch(`${config.baseUrl}/v1/chat/completions`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${config.apiKey}`,
          },
          body: JSON.stringify({
            model: config.model,
            messages: [{ role: 'user', content: prompt }],
            temperature: 0.7,
            max_tokens: 100,
          }),
          signal: controller.signal,
        })

        if (!response.ok) return

        const data = await response.json()
        const content = data.choices?.[0]?.message?.content || ''

        const lines = content.split('\n').filter((l: string) => l.trim())
        const newSuggestions = lines.slice(0, 3).map((line: string, i: number) => ({
          text: line.replace(/^\d+[\.\)、]\s*/, '').trim(),
          confidence: 0.9 - i * 0.1,
        }))

        setSuggestions(newSuggestions)
      } catch (err) {
        if ((err as Error).name !== 'AbortError') {
          console.error('Auto-complete error:', err)
        }
      } finally {
        setLoading(false)
      }
    }, 500)
  }, [enabled])

  const clearSuggestions = useCallback(() => {
    setSuggestions([])
  }, [])

  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
      if (abortRef.current) abortRef.current.abort()
    }
  }, [])

  return {
    suggestions,
    loading,
    enabled,
    setEnabled,
    getSuggestions,
    clearSuggestions,
  }
}
