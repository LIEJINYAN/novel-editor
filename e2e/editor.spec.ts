import { test, expect } from '@playwright/test'

test.describe('NovelEngine Editor', () => {
  test('should load the application', async ({ page }) => {
    await page.goto('/')
    await expect(page).toHaveTitle('小说引擎编辑器')
  })

  test('should display editor interface', async ({ page }) => {
    await page.goto('/')
    await expect(page.locator('text=小说引擎')).toBeVisible()
    await expect(page.locator('[aria-label="插件市场"]')).toBeVisible()
    await expect(page.locator('[aria-label="设置"]')).toBeVisible()
  })

  test('should open plugin market', async ({ page }) => {
    await page.goto('/')
    await page.click('[aria-label="插件市场"]')
    await expect(page.locator('.fixed.inset-0').first()).toBeVisible()
    await page.keyboard.press('Escape')
  })

  test('should open settings panel', async ({ page }) => {
    await page.goto('/')
    await page.click('[aria-label="设置"]')
    await expect(page.locator('.fixed.inset-0').first()).toBeVisible()
    await page.keyboard.press('Escape')
  })

  test('should open writing statistics', async ({ page }) => {
    await page.goto('/')
    await page.click('[aria-label="写作数据可视化"]')
    await expect(page.locator('.fixed.inset-0').first()).toBeVisible()
    await page.keyboard.press('Escape')
  })

  test('should display stats cards', async ({ page }) => {
    await page.goto('/')
    await page.click('[aria-label="写作数据可视化"]')
    await expect(page.locator('text=30天总字数')).toBeVisible()
    await expect(page.locator('text=日均字数')).toBeVisible()
    await page.keyboard.press('Escape')
  })

  test('should open templates panel', async ({ page }) => {
    await page.goto('/')
    await page.click('[aria-label="文档模板"]')
    await expect(page.locator('.fixed.inset-0').first()).toBeVisible()
    await page.keyboard.press('Escape')
  })

  test('should display plugin categories', async ({ page }) => {
    await page.goto('/')
    await page.click('[aria-label="插件市场"]')
    await expect(page.locator('text=全部')).toBeVisible()
    await expect(page.locator('text=格式化')).toBeVisible()
    await page.keyboard.press('Escape')
  })

  test('should display word count in footer', async ({ page }) => {
    await page.goto('/')
    await expect(page.locator('text=0 字')).toBeVisible()
  })

  test('should work on mobile viewport', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 })
    await page.goto('/')
    await expect(page.locator('h1:has-text("Novel Engine Editor")')).toBeVisible()
  })

  test('should open writing reminder', async ({ page }) => {
    await page.goto('/')
    await page.click('[aria-label="写作提醒"]')
    await expect(page.locator('.fixed.inset-0').first()).toBeVisible()
    await page.keyboard.press('Escape')
  })

  test('should open share panel', async ({ page }) => {
    await page.goto('/')
    await page.click('[aria-label="分享文档"]')
    await expect(page.locator('.fixed.inset-0').first()).toBeVisible()
    await page.keyboard.press('Escape')
  })

  test('should open clipboard history', async ({ page }) => {
    await page.goto('/')
    await page.click('[aria-label="剪贴板历史"]')
    await expect(page.locator('.fixed.inset-0').first()).toBeVisible()
    await page.keyboard.press('Escape')
  })
})
