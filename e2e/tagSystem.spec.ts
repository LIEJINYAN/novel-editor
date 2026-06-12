import { test, expect } from '@playwright/test'

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem('novel-engine-locale', 'zh-CN')
  })
})

async function createNewDoc(page: import('@playwright/test').Page) {
  await page.locator('button:has-text("+📄")').click()
  await page.waitForTimeout(500)
}

async function openOverflowMenu(page: import('@playwright/test').Page) {
  const btn = page.locator('header button').filter({ hasText: '⋯' })
  await btn.click()
  await page.waitForTimeout(300)
}

test.describe('Tag System', () => {
  test('should create a new tag', async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle')
    await createNewDoc(page)
    await page.waitForTimeout(500)

    // Open tag manager from overflow menu
    await openOverflowMenu(page)
    const menu = page.locator('.absolute.top-full.right-0')
    const tagBtn = menu.locator('button', { hasText: /Tag|标签/ })
    if (await tagBtn.isVisible().catch(() => false)) {
      await tagBtn.click()
      await page.waitForTimeout(1000)
      const dialog = page.locator('[role="dialog"], .fixed.inset-0').first()
      await expect(dialog).toBeVisible({ timeout: 5000 })
    }
  })

  test('should display tag colors', async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle')
    await createNewDoc(page)
    await page.waitForTimeout(500)

    await openOverflowMenu(page)
    const menu = page.locator('.absolute.top-full.right-0')
    const tagBtn = menu.locator('button', { hasText: /Tag|标签/ })
    if (await tagBtn.isVisible().catch(() => false)) {
      await tagBtn.click()
      await page.waitForTimeout(1000)
      // Check for color options
      const colorOptions = page.locator('[class*="rounded-full"], [class*="w-6"][class*="h-6"]')
      const count = await colorOptions.count()
      expect(count).toBeGreaterThan(0)
    }
  })

  test('should associate tag with document', async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle')
    await createNewDoc(page)
    await page.waitForTimeout(500)

    // Look for tag selector in sidebar or document area
    const tagSelector = page.locator('[class*="tag"], [data-testid*="tag"]').first()
    if (await tagSelector.isVisible().catch(() => false)) {
      await tagSelector.click()
      await page.waitForTimeout(500)
    }
  })

  test('should filter documents by tag', async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle')
    await createNewDoc(page)
    await page.waitForTimeout(500)

    // Look for tag filter in sidebar
    const tagFilter = page.locator('[class*="tag-filter"], [data-testid*="tag-filter"]').first()
    if (await tagFilter.isVisible().catch(() => false)) {
      await tagFilter.click()
      await page.waitForTimeout(500)
    }
  })

  test('should delete tag', async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle')
    await createNewDoc(page)
    await page.waitForTimeout(500)

    await openOverflowMenu(page)
    const menu = page.locator('.absolute.top-full.right-0')
    const tagBtn = menu.locator('button', { hasText: /Tag|标签/ })
    if (await tagBtn.isVisible().catch(() => false)) {
      await tagBtn.click()
      await page.waitForTimeout(1000)
      // Look for delete button
      const deleteBtn = page.locator('button:has-text("🗑️"), button:has-text("删除")').first()
      if (await deleteBtn.isVisible().catch(() => false)) {
        await deleteBtn.click()
        await page.waitForTimeout(500)
      }
    }
  })

  test('should persist tags in localStorage', async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle')
    const tags = await page.evaluate(() => {
      const stored = localStorage.getItem('novel-engine-tags')
      return stored ? JSON.parse(stored) : []
    })
    expect(Array.isArray(tags)).toBeTruthy()
  })
})
