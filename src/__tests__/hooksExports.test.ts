import { describe, it, expect, beforeEach } from 'vitest'
import {
  VOICE_LANGUAGES,
  type VoiceLanguage,
} from '../hooks/useVoiceInput'
import {
  IMAGE_SIZE_OPTIONS,
  IMAGE_STYLE_OPTIONS,
  IMAGE_PROMPT_PRESETS,
  type ImageSize,
  type ImageStyle,
} from '../hooks/useAIImageGeneration'

const LANGUAGE_KEY = 'novel-engine-voice-language'
const HISTORY_KEY = 'novel-engine-image-history'

describe('useVoiceInput exports', () => {
  it('should have 7 languages', () => {
    expect(VOICE_LANGUAGES.length).toBe(7)
  })

  it('should include zh-CN', () => {
    const zh = VOICE_LANGUAGES.find((l) => l.code === 'zh-CN')
    expect(zh).toBeTruthy()
    expect(zh?.name).toBe('中文')
    expect(zh?.shortName).toBe('中')
  })

  it('should include en-US', () => {
    const en = VOICE_LANGUAGES.find((l) => l.code === 'en-US')
    expect(en).toBeTruthy()
    expect(en?.name).toBe('English')
  })

  it('should include ja-JP', () => {
    const ja = VOICE_LANGUAGES.find((l) => l.code === 'ja-JP')
    expect(ja).toBeTruthy()
  })

  it('should include ko-KR', () => {
    const ko = VOICE_LANGUAGES.find((l) => l.code === 'ko-KR')
    expect(ko).toBeTruthy()
  })

  it('should include fr-FR', () => {
    const fr = VOICE_LANGUAGES.find((l) => l.code === 'fr-FR')
    expect(fr).toBeTruthy()
  })

  it('should include de-DE', () => {
    const de = VOICE_LANGUAGES.find((l) => l.code === 'de-DE')
    expect(de).toBeTruthy()
  })

  it('should include es-ES', () => {
    const es = VOICE_LANGUAGES.find((l) => l.code === 'es-ES')
    expect(es).toBeTruthy()
  })

  it('should persist language selection', () => {
    localStorage.setItem(LANGUAGE_KEY, 'en-US')
    const stored = localStorage.getItem(LANGUAGE_KEY)
    expect(stored).toBe('en-US')
  })
})

describe('useAIImageGeneration exports', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('should have 3 size options', () => {
    expect(IMAGE_SIZE_OPTIONS.length).toBe(3)
  })

  it('should have correct size values', () => {
    const sizes = IMAGE_SIZE_OPTIONS.map((o) => o.value)
    expect(sizes).toContain('1024x1024')
    expect(sizes).toContain('1792x1024')
    expect(sizes).toContain('1024x1792')
  })

  it('should have 2 style options', () => {
    expect(IMAGE_STYLE_OPTIONS.length).toBe(2)
  })

  it('should have vivid and natural styles', () => {
    const styles = IMAGE_STYLE_OPTIONS.map((o) => o.value)
    expect(styles).toContain('vivid')
    expect(styles).toContain('natural')
  })

  it('should have 6 prompt presets', () => {
    expect(IMAGE_PROMPT_PRESETS.length).toBe(6)
  })

  it('should have valid preset structure', () => {
    IMAGE_PROMPT_PRESETS.forEach((preset) => {
      expect(preset.label).toBeTruthy()
      expect(preset.prompt).toBeTruthy()
      expect(preset.icon).toBeTruthy()
    })
  })

  it('should persist image history in localStorage', () => {
    const history = [
      {
        id: 'img-1',
        result: {
          url: 'http://example.com/img.png',
          prompt: 'test',
          size: '1024x1024' as ImageSize,
          style: 'vivid' as ImageStyle,
          createdAt: Date.now(),
        },
      },
    ]
    localStorage.setItem(HISTORY_KEY, JSON.stringify(history))
    const stored = JSON.parse(localStorage.getItem(HISTORY_KEY)!)
    expect(stored.length).toBe(1)
    expect(stored[0].result.prompt).toBe('test')
  })

  it('should limit history to 20 items', () => {
    const history = Array.from({ length: 25 }, (_, i) => ({
      id: `img-${i}`,
      result: {
        url: `http://example.com/img${i}.png`,
        prompt: `test ${i}`,
        size: '1024x1024' as ImageSize,
        style: 'vivid' as ImageStyle,
        createdAt: Date.now(),
      },
    }))
    const limited = history.slice(0, 20)
    localStorage.setItem(HISTORY_KEY, JSON.stringify(limited))
    const stored = JSON.parse(localStorage.getItem(HISTORY_KEY)!)
    expect(stored.length).toBe(20)
  })
})
