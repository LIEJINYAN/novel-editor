import { useState, useCallback, useEffect } from 'react'
import { getAIConfig } from '../services/aiService'
import { t } from '../i18n'

export type ImageSize = '1024x1024' | '1792x1024' | '1024x1792'
export type ImageStyle = 'vivid' | 'natural'

interface ImageGenerationOptions {
  size?: ImageSize
  style?: ImageStyle
  quality?: 'standard' | 'hd'
}

interface ImageResult {
  url: string
  revisedPrompt?: string
  prompt: string
  size: ImageSize
  style: ImageStyle
  createdAt: number
}

interface ImageHistoryItem {
  id: string
  result: ImageResult
}

const HISTORY_KEY = 'novel-engine-image-history'
const MAX_HISTORY = 20

function loadHistory(): ImageHistoryItem[] {
  try {
    const stored = localStorage.getItem(HISTORY_KEY)
    return stored ? JSON.parse(stored) : []
  } catch {
    return []
  }
}

function saveHistory(history: ImageHistoryItem[]): void {
  try {
    localStorage.setItem(HISTORY_KEY, JSON.stringify(history.slice(0, MAX_HISTORY)))
  } catch {}
}

export const IMAGE_SIZE_OPTIONS: { value: ImageSize; label: string; icon: string }[] = [
  { value: '1024x1024', label: '正方形', icon: '⬜' },
  { value: '1792x1024', label: '横版', icon: '▬' },
  { value: '1024x1792', label: '竖版', icon: '▮' },
]

export const IMAGE_STYLE_OPTIONS: { value: ImageStyle; label: string; icon: string }[] = [
  { value: 'vivid', label: '生动', icon: '🎨' },
  { value: 'natural', label: '自然', icon: '🌿' },
]

export const IMAGE_PROMPT_PRESETS: { label: string; prompt: string; icon: string }[] = [
  { label: '小说封面', prompt: 'A beautiful novel book cover, fantasy style, detailed illustration, professional art', icon: '📖' },
  { label: '人物肖像', prompt: 'A detailed character portrait, fantasy RPG style, dramatic lighting, professional art', icon: '👤' },
  { label: '风景场景', prompt: 'A stunning landscape scene, cinematic lighting, detailed environment, professional art', icon: '🏔️' },
  { label: '战斗场景', prompt: 'An epic battle scene, dramatic action, fantasy style, professional art', icon: '⚔️' },
  { label: '城市夜景', prompt: 'A futuristic city skyline at night, neon lights, cyberpunk style, professional art', icon: '🌃' },
  { label: '魔法效果', prompt: 'Magical effects and spells, glowing particles, fantasy style, professional art', icon: '✨' },
]

export function useAIImageGeneration() {
  const [generating, setGenerating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [history, setHistory] = useState<ImageHistoryItem[]>([])

  useEffect(() => {
    setHistory(loadHistory())
  }, [])

  const generateImage = useCallback(async (
    prompt: string,
    options: ImageGenerationOptions = {}
  ): Promise<ImageResult | null> => {
    const config = getAIConfig()
    if (!config) {
      setError(t('agent.configureAPIPlaceholder'))
      return null
    }

    setGenerating(true)
    setError(null)

    const size = options.size || '1024x1024'
    const style = options.style || 'vivid'
    const quality = options.quality || 'standard'

    try {
      const response = await fetch(`${config.baseUrl}/v1/images/generations`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${config.apiKey}`,
        },
        body: JSON.stringify({
          model: 'dall-e-3',
          prompt,
          n: 1,
          size,
          style,
          quality,
          response_format: 'url',
        }),
      })

      if (!response.ok) {
        const err = await response.text()
        throw new Error(`${t('image.generationFailed')}: ${err}`)
      }

      const data = await response.json()
      const result: ImageResult = {
        url: data.data[0].url,
        revisedPrompt: data.data[0].revised_prompt,
        prompt,
        size,
        style,
        createdAt: Date.now(),
      }

      const newItem: ImageHistoryItem = {
        id: `img-${Date.now()}`,
        result,
      }

      const newHistory = [newItem, ...history]
      setHistory(newHistory)
      saveHistory(newHistory)

      return result
    } catch (err) {
      setError((err as Error).message)
      return null
    } finally {
      setGenerating(false)
    }
  }, [history])

  const deleteFromHistory = useCallback((id: string) => {
    const newHistory = history.filter((item) => item.id !== id)
    setHistory(newHistory)
    saveHistory(newHistory)
  }, [history])

  const clearHistory = useCallback(() => {
    setHistory([])
    saveHistory([])
  }, [])

  return {
    generateImage,
    generating,
    error,
    history,
    deleteFromHistory,
    clearHistory,
  }
}
