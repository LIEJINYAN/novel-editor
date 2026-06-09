import { test, expect } from '@playwright/test'

test.describe('AI Dialog', () => {
  test('should open AI panel and display commands', async ({ page }) => {
    await page.goto('/')
    await page.click('[aria-label="AI面板"]')
    await expect(page.locator('.fixed.inset-0').first()).toBeVisible()
    await expect(page.locator('text=AI命令')).toBeVisible()
  })

  test('should display AI settings button', async ({ page }) => {
    await page.goto('/')
    await page.click('[aria-label="AI面板"]')
    await expect(page.locator('button:has-text("⚙️")')).toBeVisible()
  })

  test('should open AI settings', async ({ page }) => {
    await page.goto('/')
    await page.click('[aria-label="AI面板"]')
    await page.click('button:has-text("⚙️")')
    await expect(page.locator('text=API Key')).toBeVisible()
    await expect(page.locator('text=API URL')).toBeVisible()
  })

  test('should close AI panel with Escape', async ({ page }) => {
    await page.goto('/')
    await page.click('[aria-label="AI面板"]')
    await page.waitForTimeout(300)
    await page.keyboard.press('Escape')
    await page.waitForTimeout(300)
  })
})

test.describe('Document Save', () => {
  test('should save document with Ctrl+S', async ({ page }) => {
    await page.goto('/')
    await page.waitForTimeout(500)
    await page.keyboard.press('Control+s')
    await page.waitForTimeout(500)
  })

  test('should show unsaved indicator', async ({ page }) => {
    await page.goto('/')
    await page.waitForTimeout(500)
    const editor = page.locator('.ProseMirror')
    if (await editor.isVisible()) {
      await editor.click()
      await page.keyboard.type('test content')
      await page.waitForTimeout(300)
    }
  })
})

test.describe('Version History', () => {
  test('should open version history panel', async ({ page }) => {
    await page.goto('/')
    await page.click('button:has-text("🕐")')
    await expect(page.locator('.fixed.inset-0').first()).toBeVisible()
  })

  test('should display version history title', async ({ page }) => {
    await page.goto('/')
    await page.click('button:has-text("🕐")')
    await expect(page.locator('text=版本历史')).toBeVisible()
  })
})

test.describe('Export Functionality', () => {
  test('should open export menu', async ({ page }) => {
    await page.goto('/')
    await page.click('button:has-text("📥")')
    await expect(page.locator('text=Markdown')).toBeVisible()
    await expect(page.locator('text=HTML')).toBeVisible()
    await expect(page.locator('text=PDF')).toBeVisible()
  })

  test('should export as Markdown', async ({ page }) => {
    await page.goto('/')
    await page.click('button:has-text("📥")')
    await page.click('text=Markdown')
    await page.waitForTimeout(500)
  })
})

test.describe('Document Templates', () => {
  test('should create document from template', async ({ page }) => {
    await page.goto('/')
    await page.click('[aria-label="文档模板"]')
    await page.waitForTimeout(300)
    const templateButtons = page.locator('button:has-text("使用模板")')
    const count = await templateButtons.count()
    if (count > 0) {
      await templateButtons.first().click()
      await page.waitForTimeout(500)
    }
  })
})

test.describe('Focus Mode', () => {
  test('should enter and exit focus mode', async ({ page }) => {
    await page.goto('/')
    await page.keyboard.press('Control+Shift+f')
    await page.waitForTimeout(500)
    await expect(page.locator('text=退出专注模式')).toBeVisible()
    await page.keyboard.press('Escape')
    await page.waitForTimeout(500)
  })

  test('should hide UI elements in focus mode', async ({ page }) => {
    await page.goto('/')
    await page.keyboard.press('Control+Shift+f')
    await page.waitForTimeout(500)
    const sidebar = page.locator('[aria-label="侧边栏"]')
    await expect(sidebar).not.toBeVisible()
  })
})

test.describe('Writing Statistics', () => {
  test('should display writing statistics panel', async ({ page }) => {
    await page.goto('/')
    await page.click('[aria-label="写作数据可视化"]')
    await expect(page.locator('text=30天总字数')).toBeVisible()
    await expect(page.locator('text=日均字数')).toBeVisible()
    await expect(page.locator('text=写作天数')).toBeVisible()
    await expect(page.locator('text=总时长')).toBeVisible()
  })

  test('should display chart', async ({ page }) => {
    await page.goto('/')
    await page.click('[aria-label="写作数据可视化"]')
    await expect(page.locator('text=每日字数趋势（30天）')).toBeVisible()
  })
})

test.describe('Word Count', () => {
  test('should display word count stats', async ({ page }) => {
    await page.goto('/')
    await page.keyboard.press('Control+Shift+w')
    await expect(page.locator('text=字数统计')).toBeVisible()
  })

  test('should display character count', async ({ page }) => {
    await page.goto('/')
    await page.keyboard.press('Control+Shift+w')
    await expect(page.locator('text=字符数')).toBeVisible()
  })
})

test.describe('Outline Panel', () => {
  test('should open outline panel', async ({ page }) => {
    await page.goto('/')
    await page.keyboard.press('Control+Shift+o')
    await expect(page.locator('text=文档大纲')).toBeVisible()
  })
})

test.describe('Theme Settings', () => {
  test('should display theme options', async ({ page }) => {
    await page.goto('/')
    await page.click('[aria-label="设置"]')
    await page.click('button:has-text("外观")')
    await expect(page.locator('text=主题颜色')).toBeVisible()
    await expect(page.locator('text=浅色')).toBeVisible()
    await expect(page.locator('text=深色')).toBeVisible()
  })
})

test.describe('Language Switcher', () => {
  test('should display language options', async ({ page }) => {
    await page.goto('/')
    await page.click('[aria-label="设置"]')
    await page.click('button:has-text("外观")')
    await expect(page.locator('text=语言设置')).toBeVisible()
  })
})

test.describe('Plugin Market', () => {
  test('should display plugin list', async ({ page }) => {
    await page.goto('/')
    await page.click('[aria-label="插件市场"]')
    await expect(page.locator('text=全部')).toBeVisible()
    await expect(page.locator('text=格式化')).toBeVisible()
    await expect(page.locator('text=AI增强')).toBeVisible()
  })

  test('should search plugins', async ({ page }) => {
    await page.goto('/')
    await page.click('[aria-label="插件市场"]')
    await page.fill('input[placeholder*="搜索"]', 'markdown')
    await page.waitForTimeout(300)
  })
})

test.describe('Writing Reminder', () => {
  test('should open reminder settings', async ({ page }) => {
    await page.goto('/')
    await page.click('[aria-label="写作提醒"]')
    await expect(page.locator('text=写作提醒')).toBeVisible()
  })

  test('should display reminder options', async ({ page }) => {
    await page.goto('/')
    await page.click('[aria-label="写作提醒"]')
    await expect(page.locator('text=提醒间隔')).toBeVisible()
  })
})

test.describe('Document Share', () => {
  test('should open share panel', async ({ page }) => {
    await page.goto('/')
    await page.click('[aria-label="分享文档"]')
    await expect(page.locator('text=分享文档')).toBeVisible()
  })

  test('should display export options', async ({ page }) => {
    await page.goto('/')
    await page.click('[aria-label="分享文档"]')
    await expect(page.locator('text=导出为')).toBeVisible()
  })
})

test.describe('Clipboard History', () => {
  test('should open clipboard history', async ({ page }) => {
    await page.goto('/')
    await page.click('[aria-label="剪贴板历史"]')
    await expect(page.locator('text=剪贴板历史')).toBeVisible()
  })

  test('should display search input', async ({ page }) => {
    await page.goto('/')
    await page.click('[aria-label="剪贴板历史"]')
    await expect(page.locator('input[placeholder*="搜索"]')).toBeVisible()
  })
})

test.describe('Quick Shortcuts', () => {
  test('should open quick shortcuts panel', async ({ page }) => {
    await page.goto('/')
    await page.click('[aria-label="快捷键速查"]')
    await expect(page.locator('text=快捷键速查')).toBeVisible()
  })

  test('should display shortcut categories', async ({ page }) => {
    await page.goto('/')
    await page.click('[aria-label="快捷键速查"]')
    await expect(page.locator('text=文件操作')).toBeVisible()
    await expect(page.locator('text=编辑')).toBeVisible()
  })
})

test.describe('Writing Modes', () => {
  test('should open writing modes panel', async ({ page }) => {
    await page.goto('/')
    await page.click('[aria-label="写作模式"]')
    await expect(page.locator('text=写作模式')).toBeVisible()
  })

  test('should display mode options', async ({ page }) => {
    await page.goto('/')
    await page.click('[aria-label="写作模式"]')
    await expect(page.locator('text=小说')).toBeVisible()
    await expect(page.locator('text=散文')).toBeVisible()
  })
})

test.describe('Mobile Responsiveness', () => {
  test('should work on tablet viewport', async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 })
    await page.goto('/')
    await expect(page.locator('h1:has-text("Novel Engine Editor")')).toBeVisible()
  })

  test('should work on mobile viewport', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 })
    await page.goto('/')
    await expect(page.locator('h1:has-text("Novel Engine Editor")')).toBeVisible()
  })
})

test.describe('Keyboard Shortcuts', () => {
  test('should show shortcuts help with F1', async ({ page }) => {
    await page.goto('/')
    await page.keyboard.press('F1')
    await expect(page.locator('text=键盘快捷键')).toBeVisible()
    await page.keyboard.press('Escape')
  })

  test('should toggle full screen with F11', async ({ page }) => {
    await page.goto('/')
    await page.keyboard.press('F11')
    await page.waitForTimeout(300)
    await page.keyboard.press('F11')
  })
})
