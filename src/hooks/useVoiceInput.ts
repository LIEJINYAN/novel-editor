import { useState, useCallback, useRef } from 'react'

interface VoiceInputState {
  isListening: boolean
  transcript: string
  error: string | null
  isSupported: boolean
}

export function useVoiceInput() {
  const [state, setState] = useState<VoiceInputState>({
    isListening: false,
    transcript: '',
    error: null,
    isSupported: typeof window !== 'undefined' && ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window),
  })

  const recognitionRef = useRef<any>(null)

  const startListening = useCallback((language = 'zh-CN') => {
    if (!state.isSupported) {
      setState((prev) => ({ ...prev, error: '浏览器不支持语音识别' }))
      return
    }

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    const recognition = new SpeechRecognition()

    recognition.continuous = true
    recognition.interimResults = true
    recognition.lang = language

    recognition.onstart = () => {
      setState((prev) => ({ ...prev, isListening: true, error: null }))
    }

    recognition.onresult = (event: any) => {
      let finalTranscript = ''
      let interimTranscript = ''

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript
        if (event.results[i].isFinal) {
          finalTranscript += transcript
        } else {
          interimTranscript += transcript
        }
      }

      setState((prev) => ({
        ...prev,
        transcript: prev.transcript + finalTranscript + interimTranscript,
      }))
    }

    recognition.onerror = (event: any) => {
      setState((prev) => ({
        ...prev,
        isListening: false,
        error: `语音识别错误: ${event.error}`,
      }))
    }

    recognition.onend = () => {
      setState((prev) => ({ ...prev, isListening: false }))
    }

    recognitionRef.current = recognition
    recognition.start()
  }, [state.isSupported])

  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.stop()
      recognitionRef.current = null
    }
    setState((prev) => ({ ...prev, isListening: false }))
  }, [])

  const resetTranscript = useCallback(() => {
    setState((prev) => ({ ...prev, transcript: '' }))
  }, [])

  const getFinalTranscript = useCallback(() => {
    return state.transcript
  }, [state.transcript])

  return {
    ...state,
    startListening,
    stopListening,
    resetTranscript,
    getFinalTranscript,
  }
}
