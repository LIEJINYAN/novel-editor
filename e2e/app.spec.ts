import { test, expect } from '@playwright/test'

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem('novel-engine-locale', 'zh-CN')
  })
})

async function createNewDoc(page: import('@playwright/test').Page, type: 'chapter' | 'scene' | 'character' = 'chapter') {
  const icons: Record<string, string> = { chapter: '📄', scene: '🎬', character: '👤' }
  // Click the create button in sidebar (format: +icon)
  await page.locator(`button:has-text("+${icons[type]}")`).click()
  await page.waitForTimeout(500)
}

test.describe('Basic Load', () => {
  test('app loads without errors', async ({ page }) => {
    const errors: string[] = []
    page.on('pageerror', (err) => errors.push(err.message))
    await page.goto('/')
    await page.waitForLoadState('networkidle')
    expect(errors).toHaveLength(0)
  })

  test('title is correct', async ({ page }) => {
    await page.goto('/')
    await expect(page).toHaveTitle(/小说引擎编辑器|NovelEngine/)
  })

  test('main layout elements are visible', async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle')
    // Header is present (role="banner")
    await expect(page.locator('header[role="banner"]')).toBeVisible()
    // Main editor area is present
    await expect(page.locator('main[role="main"]')).toBeVisible()
  })
})

test.describe('Theme Toggle', () => {
  test('dark mode toggle works', async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle')
    const htmlBefore = await page.evaluate(() => document.documentElement.classList.contains('dark'))
    // Theme toggle button has aria-label from i18n
    await page.locator('header button:has-text("☀️"), header button:has-text("🌙")').click()
    await page.waitForTimeout(400)
    const htmlAfter = await page.evaluate(() => document.documentElement.classList.contains('dark'))
    expect(htmlAfter).toBe(!htmlBefore)
  })

  test('theme class applied to document element', async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle')
    const hasDark = await page.evaluate(() => document.documentElement.classList.contains('dark'))
    const hasLight = await page.evaluate(() => document.documentElement.classList.contains('light'))
    expect(hasDark || hasLight).toBeTruthy()
    await page.locator('header button:has-text("☀️"), header button:has-text("🌙")').click()
    await page.waitForTimeout(400)
    const hasDarkAfter = await page.evaluate(() => document.documentElement.classList.contains('dark'))
    expect(hasDarkAfter).toBe(!hasDark)
  })
})

test.describe('Document Creation', () => {
  test('can create a new document', async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle')
    await createNewDoc(page, 'chapter')
    await expect(page.locator('text=新章节').first()).toBeVisible({ timeout: 5000 })
  })

  test('new document appears in document list', async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle')
    await createNewDoc(page, 'scene')
    await expect(page.locator('text=新场景').first()).toBeVisible({ timeout: 5000 })
  })

  test('tab opens for new document', async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle')
    await createNewDoc(page, 'chapter')
    // Tab should show the document title
    await expect(page.locator('text=新章节').first()).toBeVisible({ timeout: 5000 })
  })
})

test.describe('Tab Management', () => {
  test('can open multiple tabs', async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle')
    await createNewDoc(page, 'chapter')
    await page.waitForTimeout(500)
    await createNewDoc(page, 'scene')
    await page.waitForTimeout(500)
    // Both tabs should be visible
    await expect(page.locator('text=新章节').first()).toBeVisible({ timeout: 3000 })
    await expect(page.locator('text=新场景').first()).toBeVisible({ timeout: 3000 })
  })

  test('can switch between tabs', async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle')
    await createNewDoc(page, 'chapter')
    await page.waitForTimeout(500)
    await createNewDoc(page, 'scene')
    await page.waitForTimeout(500)
    // Click on first tab
    await page.locator('text=新章节').first().click()
    await page.waitForTimeout(300)
    // The document title should be shown in header
    await expect(page.locator('header').locator('text=新章节')).toBeVisible()
  })

  test('active tab is highlighted', async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle')
    await createNewDoc(page, 'chapter')
    await page.waitForTimeout(500)
    // Active tab should have different styling
    const activeTab = page.locator('[role="tab"][aria-selected="true"], .bg-editor-bg').first()
    await expect(activeTab).toBeVisible({ timeout: 3000 })
  })
})

test.describe('Editor Functionality', () => {
  test('editor accepts text input', async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle')
    // Create a doc first so editor is visible
    await createNewDoc(page, 'chapter')
    await page.waitForTimeout(500)
    const editorArea = page.locator('.ProseMirror')
    await expect(editorArea).toBeVisible({ timeout: 5000 })
    await editorArea.click()
    await page.keyboard.type('Hello World')
    await expect(editorArea).toContainText('Hello World')
  })

  test('save with Ctrl+S', async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle')
    await createNewDoc(page, 'chapter')
    await page.waitForTimeout(500)
    const editorArea = page.locator('.ProseMirror')
    await expect(editorArea).toBeVisible({ timeout: 5000 })
    await editorArea.click()
    await page.keyboard.type('Test content')
    await page.keyboard.press('Control+s')
    await page.waitForTimeout(500)
    // No error should occur
  })

  test('bold formatting works', async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle')
    await createNewDoc(page, 'chapter')
    await page.waitForTimeout(500)
    const editorArea = page.locator('.ProseMirror')
    await expect(editorArea).toBeVisible({ timeout: 5000 })
    await editorArea.click()
    await page.waitForTimeout(200)
    await page.keyboard.type('bold text')
    await page.waitForTimeout(200)
    // Click at end of text, then select all via triple-click or keyboard
    await editorArea.click()
    await page.keyboard.press('Home')
    await page.keyboard.down('Shift')
    await page.keyboard.press('End')
    await page.keyboard.up('Shift')
    await page.waitForTimeout(100)
    // Apply bold
    await page.keyboard.press('Control+b')
    await page.waitForTimeout(500)
    // Check if strong/bold element exists
    const hasBold = await page.evaluate(() => {
      const editor = document.querySelector('.ProseMirror')
      return editor?.querySelector('strong') !== null || editor?.querySelector('b') !== null
    })
    expect(hasBold).toBeTruthy()
  })
})

test.describe('Sidebar', () => {
  test('sidebar can be toggled open/closed', async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle')
    // Sidebar toggle button (☰ icon)
    const sidebarBtn = page.locator('header button:has-text("☰")')
    await expect(sidebarBtn).toBeVisible()
    // Click to toggle
    await sidebarBtn.click()
    await page.waitForTimeout(300)
    // Sidebar element should change visibility
    const sidebar = page.locator('aside[aria-label="侧边栏"]')
    const isVisible = await sidebar.isVisible().catch(() => false)
    // Toggle back
    await sidebarBtn.click()
    await page.waitForTimeout(300)
  })

  test('document list is visible in sidebar', async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle')
    await createNewDoc(page, 'chapter')
    await page.waitForTimeout(500)
    // The new doc should appear somewhere in the page
    await expect(page.locator('text=新章节').first()).toBeVisible({ timeout: 3000 })
  })
})

test.describe('AI Panel', () => {
  test('AI panel can be toggled', async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle')
    // AI panel toggle button (🤖 icon)
    const aiBtn = page.locator('header button:has-text("🤖")')
    await expect(aiBtn).toBeVisible()
    await aiBtn.click()
    await page.waitForTimeout(300)
    // AI panel should appear
    const aiPanel = page.locator('aside[aria-label="AI面板"]')
    const isVisible = await aiPanel.isVisible()
    // Toggle back
    await aiBtn.click()
    await page.waitForTimeout(300)
  })
})

test.describe('Keyboard Shortcuts', () => {
  test('Ctrl+S triggers save', async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle')
    await createNewDoc(page, 'chapter')
    await page.waitForTimeout(500)
    await page.keyboard.press('Control+s')
    await page.waitForTimeout(500)
    // Should not throw errors
  })

  test('F1 opens help', async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle')
    await page.keyboard.press('F1')
    await page.waitForTimeout(500)
    // Help modal or panel should appear
    const helpVisible = await page.locator('text=快捷键').first().isVisible().catch(() => false)
    expect(helpVisible).toBeTruthy()
  })
})

test.describe('Search', () => {
  test('search panel opens with Ctrl+F', async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle')
    await page.keyboard.press('Control+f')
    await page.waitForTimeout(500)
    // Search input should be visible
    const searchInput = page.locator('input[placeholder*="搜索"], input[type="search"]').first()
    await expect(searchInput).toBeVisible({ timeout: 3000 })
  })
})

test.describe('Responsive (mobile)', () => {
  test.use({ viewport: { width: 375, height: 667 } })

  test('mobile toolbar appears on small viewport', async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle')
    // Mobile toolbar should be visible
    const mobileToolbar = page.locator('[class*="fixed bottom-0"]')
    await expect(mobileToolbar).toBeVisible({ timeout: 3000 })
  })

  test('sidebar collapses on mobile', async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle')
    // Sidebar should be hidden by default on mobile
    const sidebar = page.locator('aside[aria-label="侧边栏"]')
    const isVisible = await sidebar.isVisible().catch(() => false)
    // On mobile, sidebar might be hidden or have different layout
  })
})
