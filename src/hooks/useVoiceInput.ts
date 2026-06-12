import { useState, useCallback, useRef, useEffect } from 'react'
import { t } from '../i18n'

export type VoiceLanguage = 'zh-CN' | 'en-US' | 'ja-JP' | 'ko-KR' | 'fr-FR' | 'de-DE' | 'es-ES'

interface VoiceLanguageOption {
  code: VoiceLanguage
  name: string
  shortName: string
}

export const VOICE_LANGUAGES: VoiceLanguageOption[] = [
  { code: 'zh-CN', name: '中文', shortName: '中' },
  { code: 'en-US', name: 'English', shortName: 'EN' },
  { code: 'ja-JP', name: '日本語', shortName: '日' },
  { code: 'ko-KR', name: '한국어', shortName: '韩' },
  { code: 'fr-FR', name: 'Français', shortName: 'FR' },
  { code: 'de-DE', name: 'Deutsch', shortName: 'DE' },
  { code: 'es-ES', name: 'Español', shortName: 'ES' },
]

interface VoiceInputState {
  isListening: boolean
  transcript: string
  interimTranscript: string
  error: string | null
  isSupported: boolean
  language: VoiceLanguage
  volume: number
  duration: number
}

const LANGUAGE_KEY = 'novel-engine-voice-language'

function getStoredLanguage(): VoiceLanguage {
  try {
    const stored = localStorage.getItem(LANGUAGE_KEY)
    if (stored && VOICE_LANGUAGES.some((l) => l.code === stored)) {
      return stored as VoiceLanguage
    }
  } catch {}
  return 'zh-CN'
}

export function useVoiceInput() {
  const [state, setState] = useState<VoiceInputState>({
    isListening: false,
    transcript: '',
    interimTranscript: '',
    error: null,
    isSupported: typeof window !== 'undefined' && ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window),
    language: getStoredLanguage(),
    volume: 0,
    duration: 0,
  })

  const recognitionRef = useRef<any>(null)
  const audioContextRef = useRef<AudioContext | null>(null)
  const analyserRef = useRef<AnalyserNode | null>(null)
  const animationFrameRef = useRef<number | null>(null)
  const durationIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const startTimeRef = useRef<number>(0)

  const updateVolume = useCallback(() => {
    if (!analyserRef.current) return
    const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount)
    analyserRef.current.getByteFrequencyData(dataArray)
    const average = dataArray.reduce((a, b) => a + b, 0) / dataArray.length
    setState((prev) => ({ ...prev, volume: average / 255 }))
    animationFrameRef.current = requestAnimationFrame(updateVolume)
  }, [])

  const cleanupAudio = useCallback(() => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current)
      animationFrameRef.current = null
    }
    if (durationIntervalRef.current) {
      clearInterval(durationIntervalRef.current)
      durationIntervalRef.current = null
    }
    if (audioContextRef.current) {
      audioContextRef.current.close()
      audioContextRef.current = null
    }
    analyserRef.current = null
  }, [])

  const setLanguage = useCallback((lang: VoiceLanguage) => {
    try {
      localStorage.setItem(LANGUAGE_KEY, lang)
    } catch {}
    setState((prev) => ({ ...prev, language: lang }))
  }, [])

  const startListening = useCallback((lang?: VoiceLanguage) => {
    if (!state.isSupported) {
      setState((prev) => ({ ...prev, error: t('voice.unsupported') }))
      return
    }

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    const recognition = new SpeechRecognition()

    const useLang = lang || state.language
    recognition.continuous = true
    recognition.interimResults = true
    recognition.lang = useLang
    recognition.maxAlternatives = 1

    recognition.onstart = () => {
      startTimeRef.current = Date.now()
      durationIntervalRef.current = setInterval(() => {
        const elapsed = Math.floor((Date.now() - startTimeRef.current) / 1000)
        setState((prev) => ({ ...prev, duration: elapsed }))
      }, 1000)

      try {
        navigator.mediaDevices.getUserMedia({ audio: true }).then((stream) => {
          const audioContext = new AudioContext()
          const source = audioContext.createMediaStreamSource(stream)
          const analyser = audioContext.createAnalyser()
          analyser.fftSize = 256
          source.connect(analyser)
          audioContextRef.current = audioContext
          analyserRef.current = analyser
          updateVolume()
        }).catch(() => {})
      } catch {}

      setState((prev) => ({ ...prev, isListening: true, error: null, duration: 0 }))
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
        transcript: prev.transcript + finalTranscript,
        interimTranscript,
      }))
    }

    recognition.onerror = (event: any) => {
      cleanupAudio()
      setState((prev) => ({
        ...prev,
        isListening: false,
        error: `${t('voice.error')}: ${event.error}`,
        volume: 0,
      }))
    }

    recognition.onend = () => {
      cleanupAudio()
      setState((prev) => ({
        ...prev,
        isListening: false,
        volume: 0,
        interimTranscript: '',
      }))
    }

    recognitionRef.current = recognition
    recognition.start()
  }, [state.isSupported, state.language, updateVolume, cleanupAudio])

  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.stop()
      recognitionRef.current = null
    }
    cleanupAudio()
    setState((prev) => ({ ...prev, isListening: false, volume: 0 }))
  }, [cleanupAudio])

  const toggleListening = useCallback(() => {
    if (state.isListening) {
      stopListening()
    } else {
      startListening()
    }
  }, [state.isListening, startListening, stopListening])

  const resetTranscript = useCallback(() => {
    setState((prev) => ({ ...prev, transcript: '', interimTranscript: '' }))
  }, [])

  const getFinalTranscript = useCallback(() => {
    return state.transcript
  }, [state.transcript])

  useEffect(() => {
    return () => {
      cleanupAudio()
      if (recognitionRef.current) {
        recognitionRef.current.stop()
      }
    }
  }, [cleanupAudio])

  return {
    ...state,
    startListening,
    stopListening,
    toggleListening,
    resetTranscript,
    getFinalTranscript,
    setLanguage,
  }
}
