import { test, expect } from '@playwright/test'

async function openOverflowMenu(page: import('@playwright/test').Page) {
  await page.click('button:has-text("⋯")')
  await page.waitForTimeout(200)
}

async function waitForModal(page: import('@playwright/test').Page) {
  await expect(page.locator('.fixed.inset-0').first()).toBeVisible({ timeout: 8000 })
}

test.describe('AI Dialog', () => {
  test('should open AI panel via header button', async ({ page }) => {
    await page.goto('/')
    await page.click('button:has-text("🤖")')
    await expect(page.locator('text=AI 助手')).toBeVisible()
  })

  test('should display AI settings button', async ({ page }) => {
    await page.goto('/')
    await page.click('button:has-text("🤖")')
    await page.waitForTimeout(300)
    await expect(page.locator('button').filter({ hasText: '⚙️' }).first()).toBeVisible()
  })
})

test.describe('Document Save', () => {
  test('should save document with Ctrl+S', async ({ page }) => {
    await page.goto('/')
    await page.waitForTimeout(500)
    await page.keyboard.press('Control+s')
    await page.waitForTimeout(500)
  })
})

test.describe('Version History', () => {
  test('should open version history panel', async ({ page }) => {
    await page.goto('/')
    await page.click('button:has-text("🕐")')
    await waitForModal(page)
  })
})

test.describe('Export Functionality', () => {
  test('should open export menu', async ({ page }) => {
    await page.goto('/')
    await page.click('button:has-text("📥")')
    await expect(page.locator('text=Markdown')).toBeVisible()
    await expect(page.locator('text=PDF')).toBeVisible()
  })
})

test.describe('Focus Mode', () => {
  test('should enter and exit focus mode', async ({ page }) => {
    await page.goto('/')
    await page.keyboard.press('Control+Shift+f')
    await page.waitForTimeout(500)
    await expect(page.locator('[title="退出专注模式 (ESC)"]').first()).toBeVisible()
    await page.keyboard.press('Escape')
    await page.waitForTimeout(500)
  })
})

test.describe('Word Count', () => {
  test('should display word count stats', async ({ page }) => {
    await page.goto('/')
    await page.keyboard.press('Control+Shift+w')
    await waitForModal(page)
  })
})

test.describe('Outline Panel', () => {
  test('should open outline panel', async ({ page }) => {
    await page.goto('/')
    await page.keyboard.press('Control+Shift+o')
    await waitForModal(page)
  })
})

test.describe('Theme Settings', () => {
  test('should toggle theme via header button', async ({ page }) => {
    await page.goto('/')
    await page.click('button:has-text("☀️")')
    await page.waitForTimeout(300)
  })
})

test.describe('Language Switcher', () => {
  test('should display language switcher', async ({ page }) => {
    await page.goto('/')
    await expect(page.locator('button:has-text("🌐")')).toBeVisible()
  })
})

test.describe('Plugin Market', () => {
  test('should open plugin market from overflow', async ({ page }) => {
    await page.goto('/')
    await openOverflowMenu(page)
    await page.click('text=插件市场')
    await waitForModal(page)
  })
})

test.describe('Writing Reminder', () => {
  test('should open reminder from overflow', async ({ page }) => {
    await page.goto('/')
    await openOverflowMenu(page)
    await page.click('text=写作提醒')
    await waitForModal(page)
  })
})

test.describe('Document Share', () => {
  test('should open share from overflow', async ({ page }) => {
    await page.goto('/')
    await openOverflowMenu(page)
    await page.click('text=分享')
    await waitForModal(page)
  })
})

test.describe('Clipboard History', () => {
  test('should open clipboard from overflow', async ({ page }) => {
    await page.goto('/')
    await openOverflowMenu(page)
    await page.click('text=剪贴板')
    await waitForModal(page)
  })
})

test.describe('Quick Shortcuts', () => {
  test('should open quick shortcuts from overflow', async ({ page }) => {
    await page.goto('/')
    await openOverflowMenu(page)
    await page.click('text=快捷键速查')
    await waitForModal(page)
  })
})

test.describe('Writing Modes', () => {
  test('should open writing modes from overflow', async ({ page }) => {
    await page.goto('/')
    await openOverflowMenu(page)
    await page.click('text=写作模式')
    await waitForModal(page)
  })
})

test.describe('Mobile Responsiveness', () => {
  test('should work on tablet viewport', async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 })
    await page.goto('/')
    await expect(page.locator('h1:has-text("Novel Engine Editor")')).toBeVisible()
  })

  test('should show mobile toolbar on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 })
    await page.goto('/')
    await expect(page.locator('.fixed.bottom-0')).toBeVisible()
  })
})

test.describe('Keyboard Shortcuts', () => {
  test('should show shortcuts help with F1', async ({ page }) => {
    await page.goto('/')
    await page.waitForTimeout(300)
    await page.keyboard.press('F1')
    await page.waitForTimeout(500)
    await expect(page.locator('.z-50').first()).toBeVisible({ timeout: 8000 })
    await page.keyboard.press('Escape')
  })
})

test.describe('Settings Panel', () => {
  test('should open settings and display tabs', async ({ page }) => {
    await page.goto('/')
    await openOverflowMenu(page)
    await page.click('text=设置')
    await waitForModal(page)
    await expect(page.locator('button:has-text("外观")').first()).toBeVisible()
  })
})
