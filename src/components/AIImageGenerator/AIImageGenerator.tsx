import { useState } from 'react'
import {
  useAIImageGeneration,
  IMAGE_SIZE_OPTIONS,
  IMAGE_STYLE_OPTIONS,
  IMAGE_PROMPT_PRESETS,
  type ImageSize,
  type ImageStyle,
} from '../../hooks/useAIImageGeneration'
import Modal from '../common/Modal'

interface Props {
  onClose: () => void
  onInsert: (url: string) => void
}

export default function AIImageGenerator({ onClose, onInsert }: Props) {
  const [prompt, setPrompt] = useState('')
  const [size, setSize] = useState<ImageSize>('1024x1024')
  const [style, setStyle] = useState<ImageStyle>('vivid')
  const [showHistory, setShowHistory] = useState(false)
  const { generateImage, generating, error, history, deleteFromHistory, clearHistory } = useAIImageGeneration()
  const [result, setResult] = useState<{ url: string; revisedPrompt?: string } | null>(null)

  const handleGenerate = async () => {
    if (!prompt.trim()) return
    const imageResult = await generateImage(prompt, { size, style })
    if (imageResult) {
      setResult({
        url: imageResult.url,
        revisedPrompt: imageResult.revisedPrompt,
      })
    }
  }

  const handleInsert = (url: string) => {
    onInsert(url)
    onClose()
  }

  const handlePresetClick = (presetPrompt: string) => {
    setPrompt(presetPrompt)
  }

  return (
    <Modal open={true} onClose={onClose} title="🎨 AI图片生成" size="lg">
      <div className="p-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-4">
            <div>
              <label className="block text-xs text-editor-muted mb-1">图片描述</label>
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="描述你想要生成的图片..."
                className="w-full h-24 bg-editor-bg text-editor-text text-sm px-3 py-2 rounded border border-editor-border outline-none resize-none"
              />
            </div>

            <div>
              <label className="block text-xs text-editor-muted mb-2">快速预设</label>
              <div className="grid grid-cols-3 gap-1">
                {IMAGE_PROMPT_PRESETS.map((preset) => (
                  <button
                    key={preset.label}
                    onClick={() => handlePresetClick(preset.prompt)}
                    className="flex items-center gap-1 px-2 py-1.5 text-[10px] text-editor-muted hover:text-editor-text hover:bg-editor-surface rounded"
                    title={preset.prompt}
                  >
                    <span>{preset.icon}</span>
                    <span className="truncate">{preset.label}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-editor-muted mb-1">尺寸</label>
                <div className="flex gap-1">
                  {IMAGE_SIZE_OPTIONS.map((opt) => (
                    <button
                      key={opt.value}
                      onClick={() => setSize(opt.value)}
                      className={`flex-1 px-2 py-1.5 text-[10px] rounded ${
                        size === opt.value
                          ? 'bg-editor-accent text-editor-bg'
                          : 'text-editor-muted hover:text-editor-text hover:bg-editor-surface'
                      }`}
                    >
                      {opt.icon} {opt.label}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-xs text-editor-muted mb-1">风格</label>
                <div className="flex gap-1">
                  {IMAGE_STYLE_OPTIONS.map((opt) => (
                    <button
                      key={opt.value}
                      onClick={() => setStyle(opt.value)}
                      className={`flex-1 px-2 py-1.5 text-[10px] rounded ${
                        style === opt.value
                          ? 'bg-editor-accent text-editor-bg'
                          : 'text-editor-muted hover:text-editor-text hover:bg-editor-surface'
                      }`}
                    >
                      {opt.icon} {opt.label}
                    </button>
                  ))}
                </div>
              </div>
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
                  onClick={() => handleInsert(result.url)}
                  className="w-full px-4 py-2 bg-green-500 text-white text-sm rounded hover:bg-green-600"
                >
                  插入图片
                </button>
              </div>
            )}
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs text-editor-muted">历史记录 ({history.length})</span>
              {history.length > 0 && (
                <button
                  onClick={clearHistory}
                  className="text-[10px] text-red-500 hover:text-red-400"
                >
                  清空
                </button>
              )}
            </div>

            <div className="max-h-[400px] overflow-y-auto space-y-2">
              {history.length === 0 ? (
                <p className="text-xs text-editor-muted text-center py-4">暂无历史记录</p>
              ) : (
                history.map((item) => (
                  <div key={item.id} className="relative group">
                    <img
                      src={item.result.url}
                      alt={item.result.prompt}
                      className="w-full rounded border border-editor-border cursor-pointer hover:border-editor-accent"
                      onClick={() => handleInsert(item.result.url)}
                    />
                    <div className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={(e) => { e.stopPropagation(); deleteFromHistory(item.id) }}
                        className="w-5 h-5 bg-red-500 text-white rounded text-[10px] hover:bg-red-600"
                      >
                        ×
                      </button>
                    </div>
                    <p className="text-[9px] text-editor-muted mt-1 line-clamp-1">{item.result.prompt}</p>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </Modal>
  )
}
