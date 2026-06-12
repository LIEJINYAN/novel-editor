import { describe, it, expect } from 'vitest'

function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

function buildRegex(query: string, options: { caseSensitive: boolean; wholeWord: boolean; useRegex: boolean }): RegExp | null {
  let pattern = query

  if (options.useRegex) {
    try {
      return new RegExp(query, options.caseSensitive ? 'g' : 'gi')
    } catch {
      return null
    }
  }

  pattern = escapeRegex(query)

  if (options.wholeWord) {
    pattern = `\\b${pattern}\\b`
  }

  try {
    return new RegExp(pattern, options.caseSensitive ? 'g' : 'gi')
  } catch {
    return null
  }
}

describe('SearchPanel regex logic', () => {
  it('should escape regex special characters', () => {
    expect(escapeRegex('hello.world')).toBe('hello\\.world')
    expect(escapeRegex('test+plus')).toBe('test\\+plus')
    expect(escapeRegex('a*b*c')).toBe('a\\*b\\*c')
  })

  it('should build simple regex', () => {
    const regex = buildRegex('hello', { caseSensitive: false, wholeWord: false, useRegex: false })
    expect(regex).toBeTruthy()
    expect('hello world'.search(regex!)).toBe(0)
  })

  it('should build case-insensitive regex', () => {
    const regex = buildRegex('hello', { caseSensitive: false, wholeWord: false, useRegex: false })
    expect('Hello World'.search(regex!)).toBe(0)
  })

  it('should build case-sensitive regex', () => {
    const regex = buildRegex('hello', { caseSensitive: true, wholeWord: false, useRegex: false })
    expect('Hello World'.search(regex!)).toBe(-1)
    expect('hello world'.search(regex!)).toBe(0)
  })

  it('should build whole word regex', () => {
    const regex = buildRegex('cat', { caseSensitive: false, wholeWord: true, useRegex: false })
    expect('the cat sat'.search(regex!)).toBe(4)
    expect('category'.search(regex!)).toBe(-1)
  })

  it('should build user regex', () => {
    const regex = buildRegex('\\d+', { caseSensitive: false, wholeWord: false, useRegex: true })
    expect('abc123def'.search(regex!)).toBe(3)
  })

  it('should return null for invalid regex', () => {
    const regex = buildRegex('[invalid', { caseSensitive: false, wholeWord: false, useRegex: true })
    expect(regex).toBeNull()
  })

  it('should match multiple occurrences', () => {
    const regex = buildRegex('test', { caseSensitive: false, wholeWord: false, useRegex: false })
    const matches = 'test test test'.match(regex!)
    expect(matches?.length).toBe(3)
  })
})
