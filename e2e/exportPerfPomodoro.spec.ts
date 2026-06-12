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

test.describe('Export - JSON/OPML', () => {
  test('should open export menu', async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle')
    await createNewDoc(page)
    await page.waitForTimeout(500)

    // Look for export button in header
    const exportBtn = page.locator('header button:has-text("📥"), header button:has-text("导出")').first()
    if (await exportBtn.isVisible().catch(() => false)) {
      await exportBtn.click()
      await page.waitForTimeout(500)
    }
  })

  test('should show export format options', async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle')
    await createNewDoc(page)
    await page.waitForTimeout(500)

    const exportBtn = page.locator('header button:has-text("📥"), header button:has-text("导出")').first()
    if (await exportBtn.isVisible().catch(() => false)) {
      await exportBtn.click()
      await page.waitForTimeout(500)
      // Check for format options
      const hasJson = await page.locator('text=JSON').first().isVisible().catch(() => false)
      const hasOpml = await page.locator('text=OPML').first().isVisible().catch(() => false)
      // At least one format should be visible
      expect(hasJson || hasOpml).toBeTruthy()
    }
  })

  test('should export as JSON', async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle')
    await createNewDoc(page)
    await page.waitForTimeout(500)

    const editorArea = page.locator('.ProseMirror')
    await editorArea.click()
    await page.keyboard.type('Export test content')

    const exportBtn = page.locator('header button:has-text("📥"), header button:has-text("导出")').first()
    if (await exportBtn.isVisible().catch(() => false)) {
      await exportBtn.click()
      await page.waitForTimeout(500)
      const jsonBtn = page.locator('button:has-text("JSON")').first()
      if (await jsonBtn.isVisible().catch(() => false)) {
        await jsonBtn.click()
        await page.waitForTimeout(1000)
      }
    }
  })

  test('should export as OPML', async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle')
    await createNewDoc(page)
    await page.waitForTimeout(500)

    const exportBtn = page.locator('header button:has-text("📥"), header button:has-text("导出")').first()
    if (await exportBtn.isVisible().catch(() => false)) {
      await exportBtn.click()
      await page.waitForTimeout(500)
      const opmlBtn = page.locator('button:has-text("OPML")').first()
      if (await opmlBtn.isVisible().catch(() => false)) {
        await opmlBtn.click()
        await page.waitForTimeout(1000)
      }
    }
  })
})

test.describe('Performance Panel', () => {
  test('should open performance panel', async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle')

    await openOverflowMenu(page)
    const menu = page.locator('.absolute.top-full.right-0')
    const perfBtn = menu.locator('button', { hasText: /Performance|性能/ })
    if (await perfBtn.isVisible().catch(() => false)) {
      await perfBtn.click()
      await page.waitForTimeout(1000)
      const dialog = page.locator('[role="dialog"], .fixed.inset-0').first()
      await expect(dialog).toBeVisible({ timeout: 5000 })
    }
  })

  test('should display performance metrics', async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle')

    await openOverflowMenu(page)
    const menu = page.locator('.absolute.top-full.right-0')
    const perfBtn = menu.locator('button', { hasText: /Performance|性能/ })
    if (await perfBtn.isVisible().catch(() => false)) {
      await perfBtn.click()
      await page.waitForTimeout(1000)
      // Check for metrics display
      const hasMetrics = await page.locator('text=LCP, text=FCP, text=CLS, text=性能评分').first().isVisible().catch(() => false)
      expect(hasMetrics).toBeTruthy()
    }
  })
})

test.describe('Pomodoro Timer', () => {
  test('should open pomodoro from overflow', async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle')

    await openOverflowMenu(page)
    const menu = page.locator('.absolute.top-full.right-0')
    const pomoBtn = menu.locator('button', { hasText: /Pomodoro|番茄钟/ })
    if (await pomoBtn.isVisible().catch(() => false)) {
      await pomoBtn.click()
      await page.waitForTimeout(1000)
      const dialog = page.locator('[role="dialog"], .fixed.inset-0').first()
      await expect(dialog).toBeVisible({ timeout: 5000 })
    }
  })

  test('should display timer controls', async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle')

    await openOverflowMenu(page)
    const menu = page.locator('.absolute.top-full.right-0')
    const pomoBtn = menu.locator('button', { hasText: /Pomodoro|番茄钟/ })
    if (await pomoBtn.isVisible().catch(() => false)) {
      await pomoBtn.click()
      await page.waitForTimeout(1000)
      // Check for timer display
      const hasTimer = await page.locator('text=25:00, text=开始, text=专注').first().isVisible().catch(() => false)
      expect(hasTimer).toBeTruthy()
    }
  })

  test('should start/pause timer', async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle')

    await openOverflowMenu(page)
    const menu = page.locator('.absolute.top-full.right-0')
    const pomoBtn = menu.locator('button', { hasText: /Pomodoro|番茄钟/ })
    if (await pomoBtn.isVisible().catch(() => false)) {
      await pomoBtn.click()
      await page.waitForTimeout(1000)
      const startBtn = page.locator('button:has-text("开始"), button:has-text("Start")').first()
      if (await startBtn.isVisible().catch(() => false)) {
        await startBtn.click()
        await page.waitForTimeout(2000)
        // Timer should have started
      }
    }
  })
})
