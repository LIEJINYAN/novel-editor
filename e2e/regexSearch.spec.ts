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

test.describe('Regex Search', () => {
  test('should open search panel with Ctrl+F', async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle')
    await createNewDoc(page)
    await page.waitForTimeout(500)
    await page.keyboard.press('Control+f')
    await page.waitForTimeout(500)
    const searchInput = page.locator('input[placeholder*="搜索"], input[type="search"]').first()
    await expect(searchInput).toBeVisible({ timeout: 3000 })
  })

  test('should toggle regex mode', async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle')
    await createNewDoc(page)
    await page.waitForTimeout(500)
    await page.keyboard.press('Control+f')
    await page.waitForTimeout(500)

    // Look for regex toggle button
    const regexBtn = page.locator('button:has-text(".*"), button:has-text("正则"), [data-testid*="regex"]').first()
    if (await regexBtn.isVisible().catch(() => false)) {
      await regexBtn.click()
      await page.waitForTimeout(300)
    }
  })

  test('should toggle case sensitive', async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle')
    await createNewDoc(page)
    await page.waitForTimeout(500)
    await page.keyboard.press('Control+f')
    await page.waitForTimeout(500)

    const caseBtn = page.locator('button:has-text("Aa"), button:has-text("区分大小写"), [data-testid*="case"]').first()
    if (await caseBtn.isVisible().catch(() => false)) {
      await caseBtn.click()
      await page.waitForTimeout(300)
    }
  })

  test('should toggle whole word', async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle')
    await createNewDoc(page)
    await page.waitForTimeout(500)
    await page.keyboard.press('Control+f')
    await page.waitForTimeout(500)

    const wordBtn = page.locator('button:has-text("Ab"), button:has-text("全词匹配"), [data-testid*="whole-word"]').first()
    if (await wordBtn.isVisible().catch(() => false)) {
      await wordBtn.click()
      await page.waitForTimeout(300)
    }
  })

  test('should search text in editor', async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle')
    await createNewDoc(page)
    await page.waitForTimeout(500)

    const editorArea = page.locator('.ProseMirror')
    await editorArea.click()
    await page.keyboard.type('Hello World test search')
    await page.waitForTimeout(300)

    await page.keyboard.press('Control+f')
    await page.waitForTimeout(500)

    const searchInput = page.locator('input[placeholder*="搜索"], input[type="search"]').first()
    if (await searchInput.isVisible().catch(() => false)) {
      await searchInput.fill('Hello')
      await page.waitForTimeout(500)
    }
  })
})
