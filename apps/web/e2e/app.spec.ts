import { test, expect } from '@playwright/test'

test('basic navigation and volume creation', async ({ page }) => {
  await page.goto('/')
  await expect(page.getByText('资源管理器')).toBeVisible()

  // Create a new volume
  await page.getByRole('button', { name: '+ 新卷' }).click()

  // Verify a volume exists (use first() to handle multiple volumes)
  await expect(page.locator('.tree-group-title button').first()).toBeVisible()
})

test('chapter creation via context menu', async ({ page }) => {
  await page.goto('/')
  await expect(page.getByText('资源管理器')).toBeVisible()

  // Create a volume first
  await page.getByRole('button', { name: '+ 新卷' }).click()

  // Wait for new volume to appear - use first() since there might be existing data
  await expect(page.locator('.tree-group-title button').first()).toBeVisible()

  // Right-click on the first volume to open context menu
  await page.locator('.tree-group-title button').first().click({ button: 'right' })

  // Click "新建章节" in the context menu
  await page.getByText('新建章节').click()

  // Verify chapter is created - look for it in the tree sidebar
  await expect(page.locator('.tree-item').first()).toBeVisible()
})

test('theme toggle works', async ({ page }) => {
  await page.goto('/')
  await expect(page.getByText('资源管理器')).toBeVisible()

  // Check initial theme is light
  const html = page.locator('html')
  await expect(html).toHaveAttribute('data-theme', 'light')

  // Click theme toggle button (Moon icon for switching to dark)
  await page.getByTitle('深色模式').click()

  // Verify theme changed to dark
  await expect(html).toHaveAttribute('data-theme', 'dark')

  // Click again to switch back to light
  await page.getByTitle('浅色模式').click()
  await expect(html).toHaveAttribute('data-theme', 'light')
})

test('settings panel opens and closes', async ({ page }) => {
  await page.goto('/')

  // Click settings button
  await page.getByTitle('设置').click()

  // Verify settings panel is visible - use heading role
  await expect(page.getByRole('heading', { name: '设置' })).toBeVisible()
  await expect(page.getByRole('button', { name: '个人资料' })).toBeVisible()

  // Close the settings panel
  await page.getByRole('button', { name: '取消' }).click()
})

test('knowledge base drawer opens and closes', async ({ page }) => {
  await page.goto('/')

  // Click knowledge base button
  await page.getByTitle('资料库').click()

  // Verify drawer is visible
  await expect(page.getByText('📚 资料库')).toBeVisible()
  // Use role button for the tab
  await expect(page.getByRole('button', { name: '角色' })).toBeVisible()

  // Close by clicking the X button
  await page.locator('.knowledge-drawer-header button').click()

  // Verify drawer is closed
  await expect(page.locator('.knowledge-drawer')).not.toBeVisible()
})

test('right panel AI actions are available', async ({ page }) => {
  // Set larger viewport for right panel to be visible
  await page.setViewportSize({ width: 1400, height: 800 })

  await page.goto('/')

  // Create a volume and chapter first
  await page.getByRole('button', { name: '+ 新卷' }).click()
  await expect(page.locator('.tree-group-title button').first()).toBeVisible()

  // Right-click on first volume
  await page.locator('.tree-group-title button').first().click({ button: 'right' })
  await page.getByText('新建章节').click()

  // Wait for the chapter to be created
  await expect(page.locator('.tree-item').first()).toBeVisible()

  // Click on the chapter to select it
  await page.locator('.tree-item').first().click()

  // Check right panel is visible and has AI actions
  // The Accordion title is "AI 执行器"
  await expect(page.getByText('AI 执行器')).toBeVisible()

  // Check AI action buttons
  await expect(page.locator('.ai-action-button').filter({ hasText: '续写' })).toBeVisible()
  await expect(page.locator('.ai-action-button').filter({ hasText: '改写' })).toBeVisible()
  await expect(page.locator('.ai-action-button').filter({ hasText: '扩写' })).toBeVisible()
  await expect(page.locator('.ai-action-button').filter({ hasText: '缩写' })).toBeVisible()
})

test('AI agent selection is available', async ({ page }) => {
  await page.goto('/')

  // Open settings
  await page.getByTitle('设置').click()

  // Navigate to AI settings
  await page.getByRole('button', { name: 'AI 设置' }).click()

  // Verify built-in agents are visible in agent configuration section
  await expect(page.getByText('Agent 配置')).toBeVisible()

  // Look for agent-related UI elements (Input with agent name or Agent section)
  await expect(page.getByPlaceholder('Agent 名称').first()).toBeVisible()

  // Close settings
  await page.getByRole('button', { name: '取消' }).click()
})
