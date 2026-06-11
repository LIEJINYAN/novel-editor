// Local dictionary for offline spell checking
// Provides basic pattern matching without external API

export interface SpellError {
  offset: number
  length: number
  message: string
  suggestions: string[]
  ruleId: string
}

// Common Chinese typos and homophones
const CHINESE_TYPO_RULES: Array<{ pattern: RegExp; message: string; suggestions: string[] }> = [
  { pattern: /的得地/g, message: '可能混用', suggestions: ['的', '得', '地'] },
  { pattern: /在再/g, message: '可能混用', suggestions: ['在', '再'] },
  { pattern: /做作/g, message: '可能混用', suggestions: ['做', '作'] },
  { pattern: /他她它/g, message: '可能混用', suggestions: ['他', '她', '它'] },
  { pattern: /己已/g, message: '可能混用', suggestions: ['己', '已'] },
  { pattern: /未末/g, message: '可能混用', suggestions: ['未', '末'] },
  { pattern: /壁璧/g, message: '可能混用', suggestions: ['壁', '璧'] },
  { pattern: /拔拨/g, message: '可能混用', suggestions: ['拔', '拨'] },
  { pattern: /赌堵/g, message: '可能混用', suggestions: ['赌', '堵'] },
  { pattern: /副幅/g, message: '可能混用', suggestions: ['副', '幅'] },
]

// Common English misspellings
const ENGLISH_COMMON_MISSPELLINGS: Record<string, string[]> = {
  'teh': ['the'],
  'recieve': ['receive'],
  'seperate': ['separate'],
  'definately': ['definitely'],
  'occured': ['occurred'],
  'untill': ['until'],
  'accomodate': ['accommodate'],
  'embarass': ['embarrass'],
  'goverment': ['government'],
  'independant': ['independent'],
  'arguement': ['argument'],
  'begining': ['beginning'],
  'beleive': ['believe'],
  'calender': ['calendar'],
  'commited': ['committed'],
  'comparision': ['comparison'],
  'completly': ['completely'],
  'concious': ['conscious'],
  'decison': ['decision'],
  'dissapear': ['disappear'],
  'enviroment': ['environment'],
  'existance': ['existence'],
  'finaly': ['finally'],
  'foriegn': ['foreign'],
  'grammer': ['grammar'],
  'happend': ['happened'],
  'immediatly': ['immediately'],
  'independance': ['independence'],
  'knowlege': ['knowledge'],
  'libary': ['library'],
  'liason': ['liaison'],
  'maintainance': ['maintenance'],
  'milieu': ['milieu'],
  'neccessary': ['necessary'],
  'occassion': ['occasion'],
  'occurence': ['occurrence'],
  'persue': ['pursue'],
  'posession': ['possession'],
  'prefered': ['preferred'],
  'privelege': ['privilege'],
  'probaly': ['probably'],
  'publically': ['publicly'],
  'realy': ['really'],
  'refered': ['referred'],
  'relevent': ['relevant'],
  'repitition': ['repetition'],
  'restaraunt': ['restaurant'],
  'sence': ['sense'],
  'similiar': ['similar'],
  'succesful': ['successful'],
  'suprise': ['surprise'],
  'tommorow': ['tomorrow'],
  'tounge': ['tongue'],
  'truely': ['truly'],
  'unforseen': ['unforeseen'],
  'unfortunatly': ['unfortunately'],
  'wierd': ['weird'],
}

// Pattern-based English typo detection
const ENGLISH_TYPO_PATTERNS: Array<{ pattern: RegExp; message: string; suggestionFn: (match: string) => string[] }> = [
  { pattern: /\b(\w+)ing\b/g, message: '-ing 形式拼写错误', suggestionFn: (m) => [m.replace(/(\w+)ing/, '$1')] },
  { pattern: /\b(\w+)tion\b/g, message: '-tion 拼写错误', suggestionFn: (m) => [m.replace(/(\w+)tion/, '$1sion')] },
]

export function checkLocalSpelling(text: string, language: string = 'zh'): SpellError[] {
  const errors: SpellError[] = []

  if (language.startsWith('zh')) {
    // Chinese pattern checks
    for (const rule of CHINESE_TYPO_RULES) {
      let match: RegExpExecArray | null
      while ((match = rule.pattern.exec(text)) !== null) {
        errors.push({
          offset: match.index,
          length: match[0].length,
          message: rule.message,
          suggestions: rule.suggestions,
          ruleId: 'CHINESE_TYPO',
        })
      }
    }
  } else {
    // English checks
    const words = text.split(/\s+/)
    let offset = 0

    for (const word of words) {
      const lower = word.toLowerCase()
      if (ENGLISH_COMMON_MISSPELLINGS[lower]) {
        errors.push({
          offset,
          length: word.length,
          message: `可能拼写错误: "${word}"`,
          suggestions: ENGLISH_COMMON_MISSPELLINGS[lower],
          ruleId: 'ENGLISH_MISSPELLING',
        })
      }
      offset += word.length + 1
    }
  }

  // Check for repeated words (both languages)
  const repeatedPattern = /(\S+)\s+\1/g
  let match: RegExpExecArray | null
  while ((match = repeatedPattern.exec(text)) !== null) {
    const word = match[1]
    // Skip common intentional repetitions
    if (!['的', '了', '是', '在', 'a', 'the', 'and', 'or'].includes(word.toLowerCase())) {
      errors.push({
        offset: match.index,
        length: match[0].length,
        message: `重复词语: "${word}"`,
        suggestions: [word],
        ruleId: 'REPEATED_WORD',
      })
    }
  }

  return errors
}

// Combined check: try LanguageTool first, fallback to local
export async function spellCheck(
  text: string,
  language: string = 'zh'
): Promise<{ errors: SpellError[]; source: 'languagetool' | 'local' }> {
  try {
    const response = await fetch('https://api.languagetool.org/v2/check', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: `text=${encodeURIComponent(text)}&language=${language === 'zh' ? 'zh' : language}`,
      signal: AbortSignal.timeout(10000),
    })

    if (response.ok) {
      const data = await response.json()
      const errors: SpellError[] = data.matches.map((m: any) => ({
        offset: m.offset,
        length: m.length,
        message: m.message,
        suggestions: m.replacements?.slice(0, 5).map((r: any) => r.value) || [],
        ruleId: m.rule?.id || 'UNKNOWN',
      }))
      return { errors, source: 'languagetool' }
    }
  } catch {
    // API failed, use local
  }

  const localErrors = checkLocalSpelling(text, language)
  return { errors: localErrors, source: 'local' }
}
