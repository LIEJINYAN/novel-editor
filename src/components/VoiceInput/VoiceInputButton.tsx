import { useVoiceInput } from '../../hooks/useVoiceInput'
import type { Editor } from '@tiptap/core'

interface Props {
  editor: Editor | null
}

export default function VoiceInputButton({ editor }: Props) {
  const { isListening, transcript, isSupported, startListening, stopListening, resetTranscript } = useVoiceInput()

  const handleToggle = () => {
    if (isListening) {
      stopListening()
      if (transcript && editor) {
        editor.chain().focus().insertContent(transcript).run()
        resetTranscript()
      }
    } else {
      startListening('zh-CN')
    }
  }

  if (!isSupported) {
    return null
  }

  return (
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
  )
}
