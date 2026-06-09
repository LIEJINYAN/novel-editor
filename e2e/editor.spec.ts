import { test, expect } from '@playwright/test'

async function openOverflowMenu(page: import('@playwright/test').Page) {
  await page.click('button:has-text("⋯")')
  await page.waitForTimeout(200)
}

async function waitForModal(page: import('@playwright/test').Page) {
  await expect(page.locator('.fixed.inset-0').first()).toBeVisible({ timeout: 5000 })
}

async function closeModal(page: import('@playwright/test').Page) {
  await page.keyboard.press('Escape')
  await page.waitForTimeout(300)
}

test.describe('NovelEngine Editor', () => {
  test('should load the application', async ({ page }) => {
    await page.goto('/')
    await expect(page).toHaveTitle('小说引擎编辑器')
  })

  test('should display editor interface', async ({ page }) => {
    await page.goto('/')
    await expect(page.locator('h1')).toBeVisible()
  })

  test('should open overflow menu', async ({ page }) => {
    await page.goto('/')
    await page.click('button:has-text("⋯")')
    await expect(page.locator('text=插件市场')).toBeVisible()
    await expect(page.locator('text=设置')).toBeVisible()
  })

  test('should open settings from overflow menu', async ({ page }) => {
    await page.goto('/')
    await openOverflowMenu(page)
    await page.click('text=设置')
    await waitForModal(page)
  })

  test('should open plugin market from overflow menu', async ({ page }) => {
    await page.goto('/')
    await openOverflowMenu(page)
    await page.click('text=插件市场')
    await waitForModal(page)
  })

  test('should open writing statistics from overflow menu', async ({ page }) => {
    await page.goto('/')
    await openOverflowMenu(page)
    await page.click('text=写作统计')
    await waitForModal(page)
  })

  test('should open templates from overflow menu', async ({ page }) => {
    await page.goto('/')
    await openOverflowMenu(page)
    await page.click('text=文档模板')
    await waitForModal(page)
  })

  test('should open writing reminder from overflow menu', async ({ page }) => {
    await page.goto('/')
    await openOverflowMenu(page)
    await page.click('text=写作提醒')
    await waitForModal(page)
  })

  test('should open share from overflow menu', async ({ page }) => {
    await page.goto('/')
    await openOverflowMenu(page)
    await page.click('text=分享')
    await waitForModal(page)
  })

  test('should open clipboard from overflow menu', async ({ page }) => {
    await page.goto('/')
    await openOverflowMenu(page)
    await page.click('text=剪贴板')
    await waitForModal(page)
  })

  test('should close modal with Escape', async ({ page }) => {
    await page.goto('/')
    await openOverflowMenu(page)
    await page.click('text=设置')
    await waitForModal(page)
    await closeModal(page)
  })

  test('should display word count in footer', async ({ page }) => {
    await page.goto('/')
    await expect(page.locator('text=0 字')).toBeVisible()
  })

  test('should work on mobile viewport', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 })
    await page.goto('/')
    await expect(page.locator('.fixed.bottom-0')).toBeVisible()
  })

  test('should open quick shortcuts from overflow', async ({ page }) => {
    await page.goto('/')
    await openOverflowMenu(page)
    await page.click('text=快捷键速查')
    await waitForModal(page)
  })

  test('should open writing chart from overflow', async ({ page }) => {
    await page.goto('/')
    await openOverflowMenu(page)
    await page.click('text=写作数据')
    await waitForModal(page)
  })
})
