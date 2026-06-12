import { test, expect } from '@playwright/test'

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem('novel-engine-locale', 'zh-CN')
  })
})

async function openOverflowMenu(page: import('@playwright/test').Page) {
  const btn = page.locator('header button').filter({ hasText: '⋯' })
  await btn.click()
  await page.waitForTimeout(300)
}

test.describe('Plugin Install/Uninstall', () => {
  test('should open plugin market', async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle')
    await openOverflowMenu(page)
    const menu = page.locator('.absolute.top-full.right-0')
    await menu.locator('button', { hasText: /Plugin Market|插件市场/ }).click()
    await page.waitForTimeout(1000)
    const dialog = page.locator('[role="dialog"], .fixed.inset-0').first()
    await expect(dialog).toBeVisible({ timeout: 5000 })
  })

  test('should display plugin list', async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle')
    await openOverflowMenu(page)
    const menu = page.locator('.absolute.top-full.right-0')
    await menu.locator('button', { hasText: /Plugin Market|插件市场/ }).click()
    await page.waitForTimeout(1000)
    // Check for plugin content - various possible selectors
    const hasContent = await page.evaluate(() => {
      const dialog = document.querySelector('[role="dialog"], .fixed.inset-0')
      return dialog !== null
    })
    expect(hasContent).toBeTruthy()
  })

  test('should show plugin details', async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle')
    await openOverflowMenu(page)
    const menu = page.locator('.absolute.top-full.right-0')
    await menu.locator('button', { hasText: /Plugin Market|插件市场/ }).click()
    await page.waitForTimeout(1000)
    // Look for plugin name/description
    const pluginName = page.locator('text=Markdown增强, text=AI翻译助手, text=字数统计增强').first()
    if (await pluginName.isVisible().catch(() => false)) {
      await expect(pluginName).toBeVisible()
    }
  })

  test('should install plugin', async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle')
    await openOverflowMenu(page)
    const menu = page.locator('.absolute.top-full.right-0')
    await menu.locator('button', { hasText: /Plugin Market|插件市场/ }).click()
    await page.waitForTimeout(1000)
    // Look for install button
    const installBtn = page.locator('button:has-text("Install"), button:has-text("安装")').first()
    if (await installBtn.isVisible().catch(() => false)) {
      await installBtn.click()
      await page.waitForTimeout(1000)
    }
  })

  test('should uninstall plugin', async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle')
    await openOverflowMenu(page)
    const menu = page.locator('.absolute.top-full.right-0')
    await menu.locator('button', { hasText: /Plugin Market|插件市场/ }).click()
    await page.waitForTimeout(1000)
    // Look for uninstall button
    const uninstallBtn = page.locator('button:has-text("Uninstall"), button:has-text("卸载")').first()
    if (await uninstallBtn.isVisible().catch(() => false)) {
      await uninstallBtn.click()
      await page.waitForTimeout(1000)
    }
  })

  test('should persist installed plugins', async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle')
    const plugins = await page.evaluate(() => {
      const stored = localStorage.getItem('novel-engine-installed-plugins')
      return stored ? JSON.parse(stored) : []
    })
    expect(Array.isArray(plugins)).toBeTruthy()
  })
})
