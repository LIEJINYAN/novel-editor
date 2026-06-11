import { useState } from 'react'
import { useAIImageGeneration } from '../../hooks/useAIImageGeneration'
import Modal from '../common/Modal'

interface Props {
  onClose: () => void
  onInsert: (url: string) => void
}

export default function AIImageGenerator({ onClose, onInsert }: Props) {
  const [prompt, setPrompt] = useState('')
  const [result, setResult] = useState<{ url: string; revisedPrompt?: string } | null>(null)
  const { generateImage, generating, error } = useAIImageGeneration()

  const handleGenerate = async () => {
    if (!prompt.trim()) return
    const imageResult = await generateImage(prompt)
    if (imageResult) {
      setResult(imageResult)
    }
  }

  const handleInsert = () => {
    if (result) {
      onInsert(result.url)
      onClose()
    }
  }

  return (
    <Modal open={true} onClose={onClose} title="🎨 AI图片生成" size="md">
      <div className="p-4 space-y-4">
        <div>
          <label className="block text-xs text-editor-muted mb-1">图片描述</label>
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="描述你想要生成的图片..."
            className="w-full h-24 bg-editor-bg text-editor-text text-sm px-3 py-2 rounded border border-editor-border outline-none resize-none"
          />
        </div>

        <button
          onClick={handleGenerate}
          disabled={!prompt.trim() || generating}
          className="w-full px-4 py-2 bg-editor-accent text-editor-bg text-sm rounded hover:opacity-90 disabled:opacity-50"
        >
          {generating ? '生成中...' : '✨ 生成图片'}
        </button>

        {error && (
          <p className="text-xs text-red-500">{error}</p>
        )}

        {result && (
          <div className="space-y-2">
            <img
              src={result.url}
              alt="AI生成"
              className="w-full rounded border border-editor-border"
            />
            {result.revisedPrompt && (
              <p className="text-[10px] text-editor-muted">
                优化后的描述: {result.revisedPrompt}
              </p>
            )}
            <button
              onClick={handleInsert}
              className="w-full px-4 py-2 bg-green-500 text-white text-sm rounded hover:bg-green-600"
            >
              插入图片
            </button>
          </div>
        )}
      </div>
    </Modal>
  )
}
