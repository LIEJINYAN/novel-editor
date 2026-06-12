import { useVoiceInput } from '../../hooks/useVoiceInput'
import type { Editor } from '@tiptap/core'

interface Props {
  editor: Editor | null
  onTogglePanel?: () => void
}

export default function VoiceInputButton({ editor, onTogglePanel }: Props) {
  const { isListening, transcript, isSupported, toggleListening, resetTranscript } = useVoiceInput()

  const handleToggle = () => {
    if (isListening) {
      toggleListening()
      if (transcript && editor) {
        editor.chain().focus().insertContent(transcript).run()
        resetTranscript()
      }
    } else {
      toggleListening()
    }
  }

  if (!isSupported) {
    return null
  }

  return (
    <div className="flex items-center gap-1">
      <button
        onClick={handleToggle}
        className={`text-xs px-2 py-1.5 rounded ${
          isListening
            ? 'bg-red-500 text-white animate-pulse'
            : 'text-editor-muted hover:text-editor-text hover:bg-editor-bg'
        }`}
        title={isListening ? '停止录音' : '语音输入'}
      >
        {isListening ? '🔴 录音中...' : '🎤 语音'}
      </button>
      {onTogglePanel && (
        <button
          onClick={onTogglePanel}
          className="text-xs px-1.5 py-1.5 text-editor-muted hover:text-editor-text hover:bg-editor-bg rounded"
          title="语音设置"
        >
          ⚙️
        </button>
      )}
    </div>
  )
}
