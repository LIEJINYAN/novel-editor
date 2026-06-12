import { useVoiceInput, VOICE_LANGUAGES, type VoiceLanguage } from '../../hooks/useVoiceInput'
import type { Editor } from '@tiptap/core'

interface Props {
  editor: Editor | null
  onClose?: () => void
}

function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
}

export default function VoiceInputPanel({ editor, onClose }: Props) {
  const {
    isListening,
    transcript,
    interimTranscript,
    error,
    isSupported,
    language,
    volume,
    duration,
    startListening,
    stopListening,
    toggleListening,
    resetTranscript,
    setLanguage,
  } = useVoiceInput()

  const handleInsert = () => {
    if (transcript && editor) {
      editor.chain().focus().insertContent(transcript).run()
      resetTranscript()
    }
  }

  const handleInsertAndClose = () => {
    handleInsert()
    onClose?.()
  }

  if (!isSupported) {
    return (
      <div className="p-4 text-center">
        <p className="text-sm text-editor-muted">🎤 浏览器不支持语音输入</p>
        <p className="text-xs text-editor-muted mt-2">请使用 Chrome 或 Edge 浏览器</p>
      </div>
    )
  }

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center gap-2">
        <span className="text-xs text-editor-muted">语言:</span>
        <div className="flex gap-1 flex-wrap">
          {VOICE_LANGUAGES.map((lang) => (
            <button
              key={lang.code}
              onClick={() => setLanguage(lang.code)}
              className={`px-2 py-1 text-[10px] rounded ${
                language === lang.code
                  ? 'bg-editor-accent text-editor-bg'
                  : 'text-editor-muted hover:text-editor-text hover:bg-editor-surface'
              }`}
              title={lang.name}
            >
              {lang.shortName}
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-col items-center gap-4">
        <button
          onClick={toggleListening}
          className={`w-20 h-20 rounded-full flex items-center justify-center transition-all ${
            isListening
              ? 'bg-red-500 text-white shadow-lg shadow-red-500/30 scale-110'
              : 'bg-editor-surface text-editor-muted hover:bg-editor-accent hover:text-editor-bg hover:scale-105'
          }`}
        >
          {isListening ? (
            <div className="flex flex-col items-center">
              <div className="text-2xl">🔴</div>
              <div className="text-[10px] mt-1">录音中</div>
            </div>
          ) : (
            <div className="flex flex-col items-center">
              <div className="text-2xl">🎤</div>
              <div className="text-[10px] mt-1">开始</div>
            </div>
          )}
        </button>

        {isListening && (
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1">
              {[...Array(5)].map((_, i) => (
                <div
                  key={i}
                  className={`w-1 rounded-full transition-all ${
                    volume > (i + 1) * 0.2 ? 'bg-green-500' : 'bg-editor-border'
                  }`}
                  style={{ height: `${12 + i * 4}px` }}
                />
              ))}
            </div>
            <span className="text-xs text-editor-muted font-mono">{formatDuration(duration)}</span>
          </div>
        )}
      </div>

      {(transcript || interimTranscript) && (
        <div className="bg-editor-bg rounded-lg p-3 min-h-[80px] max-h-[200px] overflow-y-auto">
          {transcript && <span className="text-sm text-editor-text">{transcript}</span>}
          {interimTranscript && <span className="text-sm text-editor-muted italic">{interimTranscript}</span>}
        </div>
      )}

      {error && (
        <div className="text-xs text-red-500 bg-red-500/10 rounded p-2">{error}</div>
      )}

      <div className="flex gap-2">
        {transcript && (
          <>
            <button
              onClick={handleInsert}
              className="flex-1 px-3 py-2 text-xs bg-editor-accent text-editor-bg rounded hover:opacity-90"
            >
              插入文本
            </button>
            <button
              onClick={resetTranscript}
              className="px-3 py-2 text-xs text-editor-muted hover:text-editor-text hover:bg-editor-surface rounded"
            >
              清空
            </button>
          </>
        )}
        {isListening && (
          <button
            onClick={stopListening}
            className="px-3 py-2 text-xs text-red-500 hover:bg-red-500/10 rounded"
          >
            停止
          </button>
        )}
      </div>
    </div>
  )
}
