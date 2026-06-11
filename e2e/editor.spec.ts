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

test.describe('NovelEngine Editor', () => {
  test('should open overflow menu', async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle')
    await openOverflowMenu(page)
    await expect(page.locator('.absolute.top-full.right-0').first()).toBeVisible()
  })

  test('should open settings from overflow menu', async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle')
    await openOverflowMenu(page)
    const menu = page.locator('.absolute.top-full.right-0')
    await menu.locator('button', { hasText: /Settings|设置/ }).click()
    await page.waitForTimeout(1000)
    const dialogOrPanel = page.locator('[role="dialog"], .fixed.inset-0').first()
    await expect(dialogOrPanel).toBeVisible({ timeout: 5000 })
  })

  test('should open plugin market from overflow menu', async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle')
    await openOverflowMenu(page)
    const menu = page.locator('.absolute.top-full.right-0')
    await menu.locator('button', { hasText: /Plugin Market|插件市场/ }).click()
    await page.waitForTimeout(1000)
    const dialogOrPanel = page.locator('[role="dialog"], .fixed.inset-0').first()
    await expect(dialogOrPanel).toBeVisible({ timeout: 5000 })
  })

  test('should open writing statistics from overflow menu', async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle')
    await openOverflowMenu(page)
    const menu = page.locator('.absolute.top-full.right-0')
    await menu.locator('button', { hasText: /Writing Stats|写作统计/ }).click()
    await page.waitForTimeout(1000)
    const dialogOrPanel = page.locator('[role="dialog"], .fixed.inset-0').first()
    await expect(dialogOrPanel).toBeVisible({ timeout: 5000 })
  })

  test('should open templates from overflow menu', async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle')
    await openOverflowMenu(page)
    const menu = page.locator('.absolute.top-full.right-0')
    await menu.locator('button', { hasText: /Document Templates|文档模板/ }).click()
    await page.waitForTimeout(1000)
    const dialogOrPanel = page.locator('[role="dialog"], .fixed.inset-0').first()
    await expect(dialogOrPanel).toBeVisible({ timeout: 5000 })
  })

  test('should open writing reminder from overflow menu', async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle')
    await openOverflowMenu(page)
    const menu = page.locator('.absolute.top-full.right-0')
    await menu.locator('button', { hasText: /Writing Reminder|写作提醒/ }).click()
    await page.waitForTimeout(1000)
    const dialogOrPanel = page.locator('[role="dialog"], .fixed.inset-0').first()
    await expect(dialogOrPanel).toBeVisible({ timeout: 5000 })
  })

  test('should open share from overflow menu', async ({ page }) => {
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

  test('should open clipboard from overflow menu', async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle')
    await openOverflowMenu(page)
    const menu = page.locator('.absolute.top-full.right-0')
    await menu.locator('button', { hasText: /Clipboard History|剪贴板/ }).click()
    await page.waitForTimeout(1000)
    const dialogOrPanel = page.locator('[role="dialog"], .fixed.inset-0').first()
    await expect(dialogOrPanel).toBeVisible({ timeout: 5000 })
  })

  test('should close modal with Escape', async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle')
    await openOverflowMenu(page)
    const menu = page.locator('.absolute.top-full.right-0')
    await menu.locator('button', { hasText: /Settings|设置/ }).click()
    await page.waitForTimeout(1000)
    const dialogOrPanel = page.locator('[role="dialog"], .fixed.inset-0').first()
    await expect(dialogOrPanel).toBeVisible({ timeout: 5000 })
    await page.keyboard.press('Escape')
    await page.waitForTimeout(500)
  })

  test('should display word count in footer', async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle')
    await createNewDoc(page)
    await page.waitForTimeout(500)
    const footer = page.locator('[role="contentinfo"]')
    await expect(footer).toBeVisible({ timeout: 3000 })
  })

  test('should open writing chart from overflow', async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle')
    await openOverflowMenu(page)
    const menu = page.locator('.absolute.top-full.right-0')
    await menu.locator('button', { hasText: /Writing Chart|写作数据/ }).click()
    await page.waitForTimeout(1000)
    const dialogOrPanel = page.locator('[role="dialog"], .fixed.inset-0').first()
    await expect(dialogOrPanel).toBeVisible({ timeout: 5000 })
  })
})
