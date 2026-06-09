import zhCN from './zh-CN'
import enUS from './en-US'
import jaJP from './ja-JP'
import koKR from './ko-KR'

export type Locale = 'zh-CN' | 'en-US' | 'ja-JP' | 'ko-KR'

const locales = {
  'zh-CN': zhCN,
  'en-US': enUS,
  'ja-JP': jaJP,
  'ko-KR': koKR,
}

const STORAGE_KEY = 'novel-engine-locale'

export function getLocale(): Locale {
  const stored = localStorage.getItem(STORAGE_KEY) as Locale
  if (stored && locales[stored]) return stored
  const browserLang = navigator.language
  if (browserLang.startsWith('zh')) return 'zh-CN'
  if (browserLang.startsWith('ja')) return 'ja-JP'
  if (browserLang.startsWith('ko')) return 'ko-KR'
  return 'en-US'
}

export function setLocale(locale: Locale) {
  localStorage.setItem(STORAGE_KEY, locale)
}

export function t(path: string, params?: Record<string, string | number>): string {
  const locale = getLocale()
  const keys = path.split('.')
  let result: any = locales[locale]

  for (const key of keys) {
    result = result?.[key]
    if (result === undefined) return path
  }

  let str = result as string
  if (params) {
    for (const [k, v] of Object.entries(params)) {
      str = str.replace(new RegExp(`\\{${k}\\}`, 'g'), String(v))
    }
  }
  return str
}

export const localesList: { value: Locale; label: string }[] = [
  { value: 'zh-CN', label: '简体中文' },
  { value: 'en-US', label: 'English' },
  { value: 'ja-JP', label: '日本語' },
  { value: 'ko-KR', label: '한국어' },
]
