let monacoPromise: Promise<typeof import('monaco-editor')> | null = null

export async function loadMonaco() {
  if (!monacoPromise) {
    monacoPromise = import('monaco-editor')
  }
  return monacoPromise
}

const loadedLanguages = new Set<string>()

export async function loadLanguage(langId: string): Promise<void> {
  if (loadedLanguages.has(langId)) return

  await loadMonaco()
  loadedLanguages.add(langId)
}
