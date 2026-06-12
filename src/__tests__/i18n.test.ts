import { describe, it, expect, beforeEach } from 'vitest'
import { t, getLocale, setLocale, localesList, type Locale } from '../i18n'

describe('i18n 国际化测试', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  describe('翻译完整性', () => {
    it('should have zh-CN translations', async () => {
      setLocale('zh-CN')
      const { initLocale } = await import('../i18n')
      await initLocale()
      expect(t('app.title')).toBeTruthy()
      expect(t('editor.placeholder')).toBeTruthy()
      expect(t('ai.title')).toBeTruthy()
    })

    it('should have en-US translations', async () => {
      setLocale('en-US')
      const { initLocale } = await import('../i18n')
      await initLocale()
      expect(t('app.title')).toBeTruthy()
      expect(t('editor.placeholder')).toBeTruthy()
      expect(t('ai.title')).toBeTruthy()
    })

    it('should have ja-JP translations', async () => {
      setLocale('ja-JP')
      const { initLocale } = await import('../i18n')
      await initLocale()
      expect(t('app.title')).toBeTruthy()
      expect(t('editor.placeholder')).toBeTruthy()
    })

    it('should have ko-KR translations', async () => {
      setLocale('ko-KR')
      const { initLocale } = await import('../i18n')
      await initLocale()
      expect(t('app.title')).toBeTruthy()
      expect(t('editor.placeholder')).toBeTruthy()
    })

    it('should have fr-FR translations', async () => {
      setLocale('fr-FR')
      const { initLocale } = await import('../i18n')
      await initLocale()
      expect(t('app.title')).toBeTruthy()
      expect(t('editor.placeholder')).toBeTruthy()
    })

    it('should have de-DE translations', async () => {
      setLocale('de-DE')
      const { initLocale } = await import('../i18n')
      await initLocale()
      expect(t('app.title')).toBeTruthy()
      expect(t('editor.placeholder')).toBeTruthy()
    })

    it('should have es-ES translations', async () => {
      setLocale('es-ES')
      const { initLocale } = await import('../i18n')
      await initLocale()
      expect(t('app.title')).toBeTruthy()
      expect(t('editor.placeholder')).toBeTruthy()
    })
  })

  describe('翻译键完整性', () => {
    it('should have all required top-level keys', async () => {
      setLocale('zh-CN')
      const { initLocale } = await import('../i18n')
      await initLocale()

      const requiredKeys = ['app', 'menu', 'editor', 'sidebar', 'ai', 'settings', 'export', 'pluginMarket', 'voice', 'image']
      for (const key of requiredKeys) {
        const result = t(key)
        expect(result).not.toBe(key) // Should not return the key itself
      }
    })

    it('should have menu translations', async () => {
      setLocale('zh-CN')
      const { initLocale } = await import('../i18n')
      await initLocale()

      expect(t('menu.save')).toBeTruthy()
      expect(t('menu.newDoc')).toBeTruthy()
      expect(t('menu.search')).toBeTruthy()
    })

    it('should have editor translations', async () => {
      setLocale('zh-CN')
      const { initLocale } = await import('../i18n')
      await initLocale()

      expect(t('editor.placeholder')).toBeTruthy()
      expect(t('editor.wordCount')).toBeTruthy()
      expect(t('editor.focusMode')).toBeTruthy()
    })
  })

  describe('语言切换', () => {
    it('should set and get locale', () => {
      setLocale('en-US')
      expect(getLocale()).toBe('en-US')

      setLocale('zh-CN')
      expect(getLocale()).toBe('zh-CN')
    })

    it('should persist locale in localStorage', () => {
      setLocale('ja-JP')
      const stored = localStorage.getItem('novel-engine-locale')
      expect(stored).toBe('ja-JP')
    })

    it('should have 7 languages in list', () => {
      expect(localesList.length).toBe(7)
    })

    it('should have all language codes', () => {
      const codes = localesList.map((l) => l.value)
      expect(codes).toContain('zh-CN')
      expect(codes).toContain('en-US')
      expect(codes).toContain('ja-JP')
      expect(codes).toContain('ko-KR')
      expect(codes).toContain('fr-FR')
      expect(codes).toContain('de-DE')
      expect(codes).toContain('es-ES')
    })
  })

  describe('参数替换', () => {
    it('should replace params in translation', async () => {
      setLocale('zh-CN')
      const { initLocale } = await import('../i18n')
      await initLocale()

      // Test with a translation that has params
      const result = t('search.results', { count: 100 })
      expect(result).toContain('100')
    })
  })

  describe('缺失翻译回退', () => {
    it('should return path for missing key', async () => {
      setLocale('zh-CN')
      const { initLocale } = await import('../i18n')
      await initLocale()

      const result = t('nonexistent.key')
      expect(result).toBe('nonexistent.key')
    })
  })

  describe('布局溢出测试', () => {
    it('should handle long German translations', async () => {
      setLocale('de-DE')
      const { initLocale } = await import('../i18n')
      await initLocale()

      // German translations tend to be longer
      const title = t('app.title')
      expect(title.length).toBeGreaterThan(0)
    })

    it('should handle long French translations', async () => {
      setLocale('fr-FR')
      const { initLocale } = await import('../i18n')
      await initLocale()

      const title = t('app.title')
      expect(title.length).toBeGreaterThan(0)
    })
  })
})
