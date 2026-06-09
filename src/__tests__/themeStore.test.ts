import { describe, it, expect, beforeEach } from 'vitest'
import { useThemeStore } from '../store/themeStore'

describe('themeStore', () => {
  beforeEach(() => {
    localStorage.clear()
    useThemeStore.setState({ theme: 'dark' })
  })

  it('should have default theme as dark', () => {
    const { theme } = useThemeStore.getState()
    expect(theme).toBe('dark')
  })

  it('should toggle theme', () => {
    const { toggleTheme } = useThemeStore.getState()
    toggleTheme()
    expect(useThemeStore.getState().theme).toBe('light')

    toggleTheme()
    expect(useThemeStore.getState().theme).toBe('dark')
  })

  it('should set theme', () => {
    const { setTheme } = useThemeStore.getState()
    setTheme('light')
    expect(useThemeStore.getState().theme).toBe('light')

    setTheme('dark')
    expect(useThemeStore.getState().theme).toBe('dark')
  })
})
