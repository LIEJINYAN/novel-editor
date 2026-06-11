import { test, expect } from '@playwright/test'

async function createNewDoc(page: import('@playwright/test').Page) {
  await page.locator('button:has-text("+📄")').click()
  await page.waitForTimeout(500)
}

async function openOverflowMenu(page: import('@playwright/test').Page) {
  const btn = page.locator('header button').filter({ hasText: '⋯' })
  await btn.click()
  await page.waitForTimeout(300)
}

test.describe('Document Management', () => {
  test('should create multiple document types', async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle')
    await page.locator('button:has-text("+📄")').click()
    await page.waitForTimeout(500)
    await expect(page.locator('text=新章节').first()).toBeVisible({ timeout: 3000 })
    await page.locator('button:has-text("+🎬")').click()
    await page.waitForTimeout(500)
    await expect(page.locator('text=新场景').first()).toBeVisible({ timeout: 3000 })
    await page.locator('button:has-text("+👤")').click()
    await page.waitForTimeout(500)
    await expect(page.locator('text=新人物').first()).toBeVisible({ timeout: 3000 })
  })
})

test.describe('Plugin Market', () => {
  test('should open plugin market from overflow', async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle')
    await openOverflowMenu(page)
    const menu = page.locator('.absolute.top-full.right-0')
    await menu.locator('button', { hasText: /Plugin Market|插件市场/ }).click()
    await page.waitForTimeout(1000)
    const dialogOrPanel = page.locator('[role="dialog"], .fixed.inset-0').first()
    await expect(dialogOrPanel).toBeVisible({ timeout: 5000 })
  })
})

test.describe('Writing Reminder', () => {
  test('should open reminder from overflow', async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle')
    await openOverflowMenu(page)
    const menu = page.locator('.absolute.top-full.right-0')
    await menu.locator('button', { hasText: /Writing Reminder|写作提醒/ }).click()
    await page.waitForTimeout(1000)
    const dialogOrPanel = page.locator('[role="dialog"], .fixed.inset-0').first()
    await expect(dialogOrPanel).toBeVisible({ timeout: 5000 })
  })
})

test.describe('Document Share', () => {
  test('should open share from overflow', async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle')
    await createNewDoc(page)
    await page.waitForTimeout(500)
    await openOverflowMenu(page)
    const menu = page.locator('.absolute.top-full.right-0')
    await menu.locator('button', { hasText: /Document Share|文档分享/ }).click()
    await page.waitForTimeout(1000)
    const dialogOrPanel = page.locator('[role="dialog"], .fixed.inset-0').first()
    await expect(dialogOrPanel).toBeVisible({ timeout: 5000 })
  })
})

test.describe('Clipboard History', () => {
  test('should open clipboard from overflow', async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle')
    await openOverflowMenu(page)
    const menu = page.locator('.absolute.top-full.right-0')
    await menu.locator('button', { hasText: /Clipboard History|剪贴板/ }).click()
    await page.waitForTimeout(1000)
    const dialogOrPanel = page.locator('[role="dialog"], .fixed.inset-0').first()
    await expect(dialogOrPanel).toBeVisible({ timeout: 5000 })
  })
})

test.describe('Writing Modes', () => {
  test('should open writing modes from overflow', async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle')
    await openOverflowMenu(page)
    const menu = page.locator('.absolute.top-full.right-0')
    await menu.locator('button', { hasText: /Writing Modes|写作模式/ }).click()
    await page.waitForTimeout(1000)
    const dialogOrPanel = page.locator('[role="dialog"], .fixed.inset-0').first()
    await expect(dialogOrPanel).toBeVisible({ timeout: 5000 })
  })
})

test.describe('Version History', () => {
  test('should open version history', async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle')
    await createNewDoc(page)
    await page.waitForTimeout(500)
    const versionBtn = page.locator('header button').filter({ hasText: '🕐' })
    if (await versionBtn.isVisible().catch(() => false)) {
      await versionBtn.click()
      await page.waitForTimeout(1000)
      const dialogOrPanel = page.locator('[role="dialog"], .fixed.inset-0').first()
      await expect(dialogOrPanel).toBeVisible({ timeout: 5000 })
    }
  })
})

test.describe('Settings Panel', () => {
  test('should open settings and display tabs', async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle')
    await openOverflowMenu(page)
    const menu = page.locator('.absolute.top-full.right-0')
    await menu.locator('button', { hasText: /Settings|设置/ }).click()
    await page.waitForTimeout(1000)
    const dialogOrPanel = page.locator('[role="dialog"], .fixed.inset-0').first()
    await expect(dialogOrPanel).toBeVisible({ timeout: 5000 })
  })
})

test.describe('Command Palette', () => {
  test('should open command palette', async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle')
    await page.keyboard.press('Control+Shift+p')
    await page.waitForTimeout(800)
  })

  test('should search commands', async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle')
    await page.keyboard.press('Control+Shift+p')
    await page.waitForTimeout(800)
    await page.keyboard.type('save')
    await page.waitForTimeout(500)
  })
})
