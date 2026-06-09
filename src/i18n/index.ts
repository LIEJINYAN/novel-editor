import zhCN from './zh-CN'
import enUS from './en-US'

export type Locale = 'zh-CN' | 'en-US'

const locales = {
  'zh-CN': zhCN,
  'en-US': enUS,
}

const STORAGE_KEY = 'novel-engine-locale'

export function getLocale(): Locale {
  const stored = localStorage.getItem(STORAGE_KEY) as Locale
  if (stored && locales[stored]) {
    return stored
  }
  const browserLang = navigator.language
  if (browserLang.startsWith('zh')) {
    return 'zh-CN'
  }
  return 'en-US'
}

export function setLocale(locale: Locale) {
  localStorage.setItem(STORAGE_KEY, locale)
}

export function t(path: string): string {
  const locale = getLocale()
  const keys = path.split('.')
  let result: any = locales[locale]

  for (const key of keys) {
    result = result?.[key]
    if (result === undefined) {
      return path
    }
  }

  return result as string
}

export const localesList: { value: Locale; label: string }[] = [
  { value: 'zh-CN', label: '简体中文' },
  { value: 'en-US', label: 'English' },
]
