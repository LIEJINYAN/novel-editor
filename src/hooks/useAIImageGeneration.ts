import { useState, useCallback } from 'react'
import { getAIConfig } from '../services/aiService'

interface ImageResult {
  url: string
  revisedPrompt?: string
}

export function useAIImageGeneration() {
  const [generating, setGenerating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const generateImage = useCallback(async (prompt: string): Promise<ImageResult | null> => {
    const config = getAIConfig()
    if (!config) {
      setError('请先配置AI API')
      return null
    }

    setGenerating(true)
    setError(null)

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
          size: '1024x1024',
          response_format: 'url',
        }),
      })

      if (!response.ok) {
        const err = await response.text()
        throw new Error(`图片生成失败: ${err}`)
      }

      const data = await response.json()
      return {
        url: data.data[0].url,
        revisedPrompt: data.data[0].revised_prompt,
      }
    } catch (err) {
      setError((err as Error).message)
      return null
    } finally {
      setGenerating(false)
    }
  }, [])

  return {
    generateImage,
    generating,
    error,
  }
}
