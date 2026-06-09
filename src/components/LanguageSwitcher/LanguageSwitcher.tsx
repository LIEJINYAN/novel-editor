import { useState } from 'react'
import { getLocale, setLocale, localesList, Locale } from '../../i18n'

export default function LanguageSwitcher() {
  const [locale, setLocaleState] = useState<Locale>(getLocale())
  const [open, setOpen] = useState(false)

  const handleSelect = (value: Locale) => {
    setLocale(value)
    setLocaleState(value)
    setOpen(false)
    window.location.reload()
  }

  const currentLabel = localesList.find((l) => l.value === locale)?.label

  return (
    <div className="relative">
      <button
        className="text-editor-muted hover:text-editor-text ml-3 text-sm"
        onClick={() => setOpen(!open)}
        title="切换语言"
      >
        🌐
      </button>
      {open && (
        <div className="absolute top-full right-0 mt-1 bg-editor-surface border border-editor-border rounded shadow-lg z-50 min-w-[100px]">
          {localesList.map((item) => (
            <button
              key={item.value}
              className={`w-full text-left px-3 py-2 text-xs hover:bg-editor-bg ${
                item.value === locale ? 'text-editor-accent' : 'text-editor-text'
              }`}
              onClick={() => handleSelect(item.value)}
            >
              {item.label}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
