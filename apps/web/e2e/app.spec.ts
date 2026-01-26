import { test, expect } from '@playwright/test'
import { withRealFeedback } from './realFeedback'

const getVolumeCount = async (page: import('@playwright/test').Page) =>
  page.locator('[data-testid^="explorer-volume-"]').count()

const getChapterCount = async (page: import('@playwright/test').Page) =>
  page.locator('[data-testid^="explorer-chapter-"]').count()

const waitForExplorer = async (page: import('@playwright/test').Page) => {
  await expect(page.getByText('资源管理器')).toBeVisible()
}

const createVolumeWithFeedback = async (page: import('@playwright/test').Page) => {
  const before = await getVolumeCount(page)
  await withRealFeedback(page, {
    api: { url: '/api/volumes', method: 'POST' },
    action: async () => {
      await page.getByTestId('explorer-new-volume').click()
    },
    ui: async () => {
      await expect.poll(async () => getVolumeCount(page)).toBeGreaterThanOrEqual(before + 1)
    },
    persist: async () => {
      await waitForExplorer(page)
      await expect.poll(async () => getVolumeCount(page)).toBeGreaterThanOrEqual(before + 1)
    }
  })
}

test('basic navigation and volume creation', async ({ page }) => {
  await page.goto('/')
  await waitForExplorer(page)

  await createVolumeWithFeedback(page)
})

test('chapter creation via context menu', async ({ page }) => {
  await page.goto('/')
  await waitForExplorer(page)

  await createVolumeWithFeedback(page)

  const before = await getChapterCount(page)
  const firstVolume = page.locator('[data-testid^="explorer-volume-"]').first()

  await withRealFeedback(page, {
    api: { url: '/api/chapters', method: 'POST' },
    action: async () => {
      await firstVolume.click({ button: 'right' })
      await page.getByTestId('context-volume-add-chapter').click()
    },
    ui: async () => {
      await expect.poll(async () => getChapterCount(page)).toBeGreaterThanOrEqual(before + 1)
    },
    persist: async () => {
      await waitForExplorer(page)
      await expect.poll(async () => getChapterCount(page)).toBeGreaterThanOrEqual(before + 1)
    }
  })
})

test('theme toggle works', async ({ page }) => {
  await page.goto('/')
  await waitForExplorer(page)

  const html = page.locator('html')
  const initialTheme = (await html.getAttribute('data-theme')) ?? 'light'
  const expectedTheme = initialTheme === 'dark' ? 'light' : 'dark'

  await withRealFeedback(page, {
    api: { url: '/api/settings', method: 'PUT' },
    action: async () => {
      await page.getByTestId('topbar-theme-toggle').click()
    },
    ui: async () => {
      await expect(html).toHaveAttribute('data-theme', expectedTheme)
    },
    persist: async () => {
      await waitForExplorer(page)
      await expect(page.locator('html')).toHaveAttribute('data-theme', expectedTheme)
    }
  })
})

test('settings panel saves and persists', async ({ page }) => {
  await page.goto('/')
  await waitForExplorer(page)

  await page.getByTestId('topbar-settings').click()
  await expect(page.getByRole('heading', { name: '设置' })).toBeVisible()

  const newAuthorName = `测试作者-${Date.now()}`
  await page.getByTestId('settings-author-name').fill(newAuthorName)

  await withRealFeedback(page, {
    api: { url: '/api/settings', method: 'PUT' },
    action: async () => {
      await page.getByTestId('settings-save').click()
    },
    ui: async () => {
      await expect(page.locator('[data-testid="settings-save"]')).toHaveCount(0)
      await expect(page.getByText(`作者：${newAuthorName}`)).toBeVisible()
    },
    persist: async () => {
      await waitForExplorer(page)
      await expect(page.getByText(`作者：${newAuthorName}`)).toBeVisible()
    }
  })
})

test('knowledge base drawer create note persists', async ({ page }) => {
  await page.goto('/')
  await waitForExplorer(page)

  const noteTitle = `测试角色-${Date.now()}`

  await withRealFeedback(page, {
    api: { url: '/api/notes', method: 'POST' },
    action: async () => {
      await page.getByTestId('topbar-knowledge-base').click()
      await page.getByTestId('knowledge-new-title').fill(noteTitle)
      await page.getByTestId('knowledge-add').click()
    },
    ui: async () => {
      await expect(page.getByText(noteTitle)).toBeVisible()
    },
    persist: async () => {
      await waitForExplorer(page)
      await page.getByTestId('topbar-knowledge-base').click()
      await expect(page.getByText(noteTitle)).toBeVisible()
    }
  })
})

test('right panel AI action returns feedback', async ({ page }) => {
  await page.setViewportSize({ width: 1400, height: 800 })
  await page.goto('/')
  await waitForExplorer(page)

  await createVolumeWithFeedback(page)

  const firstVolume = page.locator('[data-testid^="explorer-volume-"]').first()
  await firstVolume.click({ button: 'right' })
  await page.getByTestId('context-volume-add-chapter').click()

  const firstChapter = page.locator('[data-testid^="explorer-chapter-"]').first()
  await firstChapter.click()

  await page.getByTestId('editor-content').click()
  await page.keyboard.type('用于 AI 回归的测试内容。')

  await page.route('**/api/ai/complete', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ content: 'AI 模拟内容' })
    })
  })

  await withRealFeedback(page, {
    api: { url: '/api/ai/complete', method: 'POST' },
    action: async () => {
      await page.getByTestId('ai-block-continue').click()
    },
    ui: async () => {
      await expect(page.getByText('续写 完成')).toBeVisible()
    },
    persist: async () => {
      await waitForExplorer(page)
      await expect(page.getByText('续写 完成')).toHaveCount(0)
    }
  })
})

test('AI settings persist after save', async ({ page }) => {
  await page.goto('/')
  await waitForExplorer(page)

  await page.getByTestId('topbar-settings').click()
  await expect(page.getByRole('heading', { name: '设置' })).toBeVisible()

  await page.getByTestId('settings-nav-ai').click()

  const temperatureInput = page.getByTestId('settings-ai-temperature')
  const currentValue = await temperatureInput.inputValue()
  const nextValue = (Number(currentValue || '0') + 0.1).toFixed(1)
  await temperatureInput.fill(nextValue)

  await withRealFeedback(page, {
    api: { url: '/api/settings', method: 'PUT' },
    action: async () => {
      await page.getByTestId('settings-save').click()
    },
    ui: async () => {
      await expect(page.locator('[data-testid="settings-save"]')).toHaveCount(0)
    },
    persist: async () => {
      await waitForExplorer(page)
      await page.getByTestId('topbar-settings').click()
      await page.getByTestId('settings-nav-ai').click()
      await expect(page.getByTestId('settings-ai-temperature')).toHaveValue(nextValue)
    }
  })
})
