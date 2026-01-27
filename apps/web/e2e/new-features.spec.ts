import { test, expect, type Page } from '@playwright/test'
import { withRealFeedback } from './realFeedback'
import { resetTestData } from './resetTestData'

const waitForExplorer = async (page: Page) => {
  await expect(page.getByText('资源管理器')).toBeVisible()
}

const volumeByName = (page: Page, name: string) =>
  page.locator('[data-testid^="explorer-volume-"]').filter({ hasText: name }).first()

const chapterByName = (page: Page, name: string) =>
  page.locator('[data-testid^="explorer-chapter-"]').filter({ hasText: name }).first()

const chapterInVolume = (page: Page, volumeName: string, chapterName: string) =>
  page.locator('.tree-group', { has: volumeByName(page, volumeName) }).getByText(chapterName)

const focusEditor = async (page: Page) => {
  const editor = page.getByTestId('editor-content')
  const editable = editor.locator('[contenteditable="true"]').first()
  await expect(editor).toBeVisible()
  if (await editable.count()) {
    await editable.scrollIntoViewIfNeeded()
    await expect(editable).toBeVisible()
    await editable.click()
    await expect(editable).toBeFocused()
  } else {
    await editor.scrollIntoViewIfNeeded()
    await editor.click()
  }
}

const ensureAccordionOpen = async (page: Page, title: string) => {
  const button = page.getByRole('button', { name: title })
  const expanded = await button.getAttribute('aria-expanded')
  if (expanded !== 'true') {
    await button.click()
  }
}

const selectBatchTarget = async (page: Page, label: string) => {
  const select = page.getByTestId('explorer-batch-target').getByRole('combobox')
  await select.click()
  await page.getByRole('option', { name: label }).click()
}

test.beforeEach(async ({ request }) => {
  await resetTestData(request)
})

test('version diff mode compares history', async ({ page }) => {
  await page.setViewportSize({ width: 1400, height: 900 })
  await page.goto('/')
  await waitForExplorer(page)

  await chapterByName(page, '第1章 试读开篇').click()
  await ensureAccordionOpen(page, '版本历史')

  const versionItems = page.locator('.version-item')
  const before = await versionItems.count()

  await withRealFeedback(page, {
    api: { url: '/api/chapters/chapter-001/versions', method: 'POST' },
    action: async () => {
      await page.getByTestId('editor-save-version').click()
    },
    ui: async () => {
      await expect(versionItems).toHaveCount(before + 1)
    },
    persist: async () => {
      await waitForExplorer(page)
      await chapterByName(page, '第1章 试读开篇').click()
      await ensureAccordionOpen(page, '版本历史')
      await expect(versionItems).toHaveCount(before + 1)
    }
  })

  await page.getByTestId('editor-content').click()
  await page.keyboard.type('新增差异内容')

  await ensureAccordionOpen(page, '版本历史')
  await page.locator('[data-testid^="version-compare-"]').first().click()
  await expect(page.getByTestId('editor-diff-mode')).toBeVisible()
  await page.getByTestId('editor-diff-exit').click()
  await expect(page.getByTestId('editor-diff-mode')).toHaveCount(0)
})

test('batch copy and move chapters', async ({ page }) => {
  await page.goto('/')
  await waitForExplorer(page)

  await page.getByTestId('explorer-chapter-select-chapter-001').check()
  await page.getByTestId('explorer-chapter-select-chapter-002').check()
  await expect(page.getByTestId('explorer-batch-actions')).toBeVisible()

  await withRealFeedback(page, {
    api: { url: '/api/chapters', method: 'POST' },
    action: async () => {
      await page.getByTestId('explorer-batch-copy').click()
      await selectBatchTarget(page, '第二卷 · 测试')
      await page.getByRole('button', { name: '确认执行' }).click()
    },
    ui: async () => {
      const copied = page
        .locator('.tree-group', { has: volumeByName(page, '第二卷 · 测试') })
        .locator('.tree-item-title')
        .filter({ hasText: '副本' })
      await expect(copied).toHaveCount(2)
    },
    persist: async () => {
      await waitForExplorer(page)
      const copied = page
        .locator('.tree-group', { has: volumeByName(page, '第二卷 · 测试') })
        .locator('.tree-item-title')
        .filter({ hasText: '副本' })
      await expect(copied).toHaveCount(2)
    }
  })

  await page.getByTestId('explorer-chapter-select-chapter-003').check()
  await expect(page.getByTestId('explorer-batch-actions')).toBeVisible()

  await withRealFeedback(page, {
    api: { url: '/api/chapters/', method: 'PUT' },
    action: async () => {
      await page.getByTestId('explorer-batch-move').click()
      await selectBatchTarget(page, '第一卷 · 试读')
      await page.getByRole('button', { name: '确认执行' }).click()
    },
    ui: async () => {
      await expect(chapterInVolume(page, '第一卷 · 试读', '第3章 测试章节')).toBeVisible()
    },
    persist: async () => {
      await waitForExplorer(page)
      await expect(chapterInVolume(page, '第一卷 · 试读', '第3章 测试章节')).toBeVisible()
    }
  })
})

test('batch merge chapters', async ({ page }) => {
  await page.goto('/')
  await waitForExplorer(page)

  await page.getByTestId('explorer-chapter-select-chapter-001').check()
  await page.getByTestId('explorer-chapter-select-chapter-002').check()
  await expect(page.getByTestId('explorer-batch-actions')).toBeVisible()

  const mergedTitle = `合并章节-${Date.now()}`

  await withRealFeedback(page, {
    api: { url: '/api/chapters', method: 'POST' },
    action: async () => {
      await page.getByTestId('explorer-batch-merge').click()
      await selectBatchTarget(page, '第二卷 · 测试')
      await page.getByTestId('explorer-batch-merge-title').fill(mergedTitle)
      await page.getByRole('button', { name: '确认执行' }).click()
    },
    ui: async () => {
      await expect(page.getByText(mergedTitle)).toBeVisible()
    },
    persist: async () => {
      await waitForExplorer(page)
      await expect(page.getByText(mergedTitle)).toBeVisible()
      await expect(page.getByText('第1章 试读开篇')).toHaveCount(0)
    }
  })
})

test('knowledge base references can insert and refresh', async ({ page }) => {
  await page.setViewportSize({ width: 1400, height: 900 })
  await page.goto('/')
  await waitForExplorer(page)

  await chapterByName(page, '第1章 试读开篇').click()
  await page.getByTestId('topbar-knowledge-base').click()
  await expect(page.getByTestId('knowledge-page')).toBeVisible()
  await page.getByTestId('knowledge-page-tab-location').click()
  await expect(page.getByText('主城')).toBeVisible()
  await page.getByTestId('knowledge-page-search').fill('主城')
  await expect(page.getByText('主城')).toBeVisible()
  await page.getByTestId('knowledge-page-search').fill('')
  await page.getByTestId('knowledge-page-tab-character').click()

  await page.getByTestId('knowledge-page-insert-note-001').click()
  await page.getByTestId('knowledge-back').click()

  await withRealFeedback(page, {
    api: { url: '/api/chapters/chapter-001/content', method: 'PUT' },
    action: async () => {
      await focusEditor(page)
      await page.keyboard.type('触发保存')
    },
    ui: async () => {
      const editor = page.getByTestId('editor-content')
      await expect(editor.getByRole('heading', { name: /资料卡引用 kb:note-001/ })).toBeVisible()
      await expect(editor.getByText('主角设定：出身、性格、目标。')).toBeVisible()
    },
    persist: async () => {
      await waitForExplorer(page)
      await chapterByName(page, '第1章 试读开篇').click()
      const editor = page.getByTestId('editor-content')
      await expect(editor.getByRole('heading', { name: /资料卡引用 kb:note-001/ })).toBeVisible()
    }
  })

  const updatedDescription = `更新设定-${Date.now()}`

  await page.getByTestId('topbar-knowledge-base').click()

  await withRealFeedback(page, {
    api: { url: '/api/notes/note-001', method: 'PUT' },
    action: async () => {
      await page.getByTestId('knowledge-page-edit-note-001').click()
      await page.getByTestId('knowledge-page-edit-description').fill(updatedDescription)
      await page.getByTestId('knowledge-page-edit-save').click()
    },
    ui: async () => {
      await expect(page.getByTestId('knowledge-page-edit-description')).toHaveCount(0)
    },
    persist: async () => {
      await waitForExplorer(page)
      await page.getByTestId('topbar-knowledge-base').click()
      await page.getByTestId('knowledge-page-edit-note-001').click()
      await expect(page.getByTestId('knowledge-page-edit-description')).toHaveValue(updatedDescription)
      await page.getByTestId('knowledge-page-edit-cancel').click()
    }
  })

  const refreshResponse = page.waitForResponse(
    (response) =>
      response.url().includes('/api/chapters/chapter-001/content') &&
      response.request().method() === 'PUT' &&
      response.ok()
  )
  await page.getByTestId('knowledge-page-refresh').click()
  await refreshResponse
  await page.getByTestId('knowledge-back').click()
  await expect(page.getByTestId('editor-content').getByText(updatedDescription)).toBeVisible()
})

test('AI retry respects request settings', async ({ page, request }) => {
  const settingsResponse = await request.get('http://localhost:8787/api/settings')
  const settings = await settingsResponse.json()
  settings.ai.request.maxRetries = 1
  settings.ai.request.retryDelayMs = 0
  await request.put('http://localhost:8787/api/settings', { data: settings })

  let callCount = 0
  await page.route('**/api/ai/complete', async (route) => {
    callCount += 1
    if (callCount === 1) {
      await route.fulfill({ status: 500, body: 'retry' })
      return
    }
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ content: 'AI 重试成功' })
    })
  })

  await page.setViewportSize({ width: 1400, height: 900 })
  await page.goto('/')
  await waitForExplorer(page)

  await chapterByName(page, '第1章 试读开篇').click()
  await focusEditor(page)
  await page.keyboard.type('用于 AI 重试的内容')
  await expect(page.getByTestId('editor-content').getByText('用于 AI 重试的内容')).toBeVisible()

  const successResponse = page.waitForResponse(
    (response) =>
      response.url().includes('/api/ai/complete') &&
      response.request().method() === 'POST' &&
      response.ok()
  )
  await page.getByTestId('ai-block-continue').click()
  await successResponse
  await expect(page.getByText('续写 完成')).toBeVisible()
  await page.reload()
  await waitForExplorer(page)
  await expect(page.getByText('续写 完成')).toHaveCount(0)
  await expect.poll(() => callCount).toBe(2)
})

test('agent serial schema output and replay', async ({ page, request }) => {
  const settingsResponse = await request.get('http://localhost:8787/api/settings')
  const settings = await settingsResponse.json()
  const providerId = settings.providers[0].id
  const schema = JSON.stringify({
    type: 'object',
    properties: { summary: { type: 'string' } },
    required: ['summary']
  })
  settings.agents = [
    {
      id: 'agent-serial-1',
      name: '串行 Agent A',
      providerId,
      systemPrompt: '输出结构化摘要',
      serialEnabled: true,
      serialOrder: 1,
      outputSchema: schema
    },
    {
      id: 'agent-serial-2',
      name: '串行 Agent B',
      providerId,
      systemPrompt: '复核输出',
      serialEnabled: true,
      serialOrder: 2,
      outputSchema: schema
    }
  ]
  settings.ai.defaultAgentId = 'agent-serial-1'
  settings.ai.request.maxRetries = 0
  settings.ai.request.retryDelayMs = 0
  await request.put('http://localhost:8787/api/settings', { data: settings })

  let callCount = 0
  await page.route('**/api/ai/complete', async (route) => {
    callCount += 1
    const payload = callCount === 1 ? { summary: 'first' } : { summary: 'second' }
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ content: JSON.stringify(payload) })
    })
  })

  await page.setViewportSize({ width: 1400, height: 900 })
  await page.goto('/')
  await waitForExplorer(page)

  await chapterByName(page, '第1章 试读开篇').click()
  await focusEditor(page)
  const initialSave = page.waitForResponse(
    (response) =>
      response.url().includes('/api/chapters/chapter-001/content') &&
      response.request().method() === 'PUT' &&
      response.ok()
  )
  await page.keyboard.type('用于串行 Agent 的输入')
  await initialSave
  const inputBlock = page.getByTestId('editor-content').getByText('用于串行 Agent 的输入')
  await expect(inputBlock).toBeVisible()
  await inputBlock.click()

  const aiSaveResponse = page.waitForResponse(
    (response) =>
      response.url().includes('/api/chapters/chapter-001/content') &&
      response.request().method() === 'PUT' &&
      response.ok()
  )
  await withRealFeedback(page, {
    api: { url: '/api/ai/complete', method: 'POST' },
    action: async () => {
      await page.getByTestId('ai-block-continue').click()
    },
    ui: async () => {
      await expect(page.getByText('续写 完成')).toBeVisible()
    },
    reload: false,
    persist: async () => {
      await aiSaveResponse
      await page.reload()
      await waitForExplorer(page)
      await chapterByName(page, '第1章 试读开篇').click()
      await expect(page.getByTestId('editor-content').getByText('second')).toBeVisible()
    }
  })

  await expect.poll(() => callCount).toBe(2)

  await ensureAccordionOpen(page, 'AI 控制台')
  const replayButton = page.locator('[data-testid^="ai-run-replay-"]').first()
  await expect(replayButton).toBeVisible()
  await replayButton.click()
  await expect.poll(() => callCount).toBe(4)
  const replayLogs = page.locator('.log-list').getByText('重放完成')
  await expect(replayLogs).toHaveCount(2)
})

test('TXT preview export available', async ({ page }) => {
  await page.goto('/')
  await waitForExplorer(page)

  await chapterByName(page, '第1章 试读开篇').click()
  await expect(page.getByTestId('editor-content').getByText('这是种子章节内容，用于回归测试。')).toBeVisible()
  await page.getByTestId('topbar-preview').click()
  await page.getByTestId('preview-tab-text').click()
  await expect(page.getByTestId('preview-tab-text')).toHaveAttribute('aria-pressed', 'true')
  await expect(page.getByTestId('preview-panel').getByText('这是种子章节内容，用于回归测试。')).toBeVisible()

  const downloadPromise = page.waitForEvent('download')
  await page.getByTestId('preview-download').click()
  const download = await downloadPromise
  expect(download.suggestedFilename()).toMatch(/\.txt$/)
})

test('conflict modal appears on revision mismatch', async ({ page, request }) => {
  await page.setViewportSize({ width: 1400, height: 900 })
  await page.goto('/')
  await waitForExplorer(page)

  await chapterByName(page, '第1章 试读开篇').click()

  await request.put('http://localhost:8787/api/chapters/chapter-001/content', {
    data: {
      content: [{ id: 'conflict-block', type: 'paragraph', content: 'server update' }],
      wordCount: 2,
      updatedAt: new Date().toISOString()
    }
  })

  const conflictResponse = page.waitForResponse(
    (response) => response.url().includes('/api/chapters/chapter-001/content') && response.status() === 409
  )

  await focusEditor(page)
  await page.keyboard.type('触发冲突')
  await conflictResponse
  await expect(page.getByTestId('conflict-overlay')).toBeVisible()
})
