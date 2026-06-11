export type Locale = 'zh-CN' | 'en-US' | 'ja-JP' | 'ko-KR' | 'fr-FR' | 'de-DE' | 'es-ES'

const STORAGE_KEY = 'novel-engine-locale'

const localeLoaders: Record<Locale, () => Promise<any>> = {
  'zh-CN': () => import('./zh-CN'),
  'en-US': () => import('./en-US'),
  'ja-JP': () => import('./ja-JP'),
  'ko-KR': () => import('./ko-KR'),
  'fr-FR': () => import('./fr-FR'),
  'de-DE': () => import('./de-DE'),
  'es-ES': () => import('./es-ES'),
}

const loadedLocales = new Map<Locale, any>()

async function loadLocale(locale: Locale): Promise<any> {
  if (loadedLocales.has(locale)) {
    return loadedLocales.get(locale)
  }

  const loader = localeLoaders[locale]
  if (!loader) return null

  try {
    const module = await loader()
    loadedLocales.set(locale, module.default)
    return module.default
  } catch {
    return null
  }
}

let currentLocaleData: any = null

export function getLocale(): Locale {
  const stored = localStorage.getItem(STORAGE_KEY) as Locale
  if (stored && localeLoaders[stored]) return stored
  const browserLang = navigator.language
  if (browserLang.startsWith('zh')) return 'zh-CN'
  if (browserLang.startsWith('ja')) return 'ja-JP'
  if (browserLang.startsWith('ko')) return 'ko-KR'
  if (browserLang.startsWith('fr')) return 'fr-FR'
  if (browserLang.startsWith('de')) return 'de-DE'
  if (browserLang.startsWith('es')) return 'es-ES'
  return 'en-US'
}

export function setLocale(locale: Locale) {
  localStorage.setItem(STORAGE_KEY, locale)
  currentLocaleData = null
}

export async function initLocale(): Promise<void> {
  const locale = getLocale()
  currentLocaleData = await loadLocale(locale)
}

export function t(path: string, params?: Record<string, string | number>): string {
  const locale = getLocale()
  const localeData = currentLocaleData || loadedLocales.get(locale)

  if (!localeData) return path

  const keys = path.split('.')
  let result: any = localeData

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
  { value: 'fr-FR', label: 'Français' },
  { value: 'de-DE', label: 'Deutsch' },
  { value: 'es-ES', label: 'Español' },
]
