import { test, expect, type Page } from '@playwright/test'
import { withRealFeedback } from './realFeedback'
import { resetTestData } from './resetTestData'

const waitForExplorer = async (page: Page) => {
  await expect(page.getByText('资源管理器')).toBeVisible()
}

test.beforeEach(async ({ request }) => {
  await resetTestData(request)
})

const volumeByName = (page: Page, name: string) =>
  page.locator('[data-testid^="explorer-volume-"]').filter({ hasText: name }).first()

const chapterByName = (page: Page, name: string) =>
  page.locator('[data-testid^="explorer-chapter-"]').filter({ hasText: name }).first()

const getVolumeOrder = async (page: Page) =>
  page.locator('[data-testid^="explorer-volume-"]').allTextContents()

const getChapterOrder = async (page: Page, volumeName: string) => {
  const group = page.locator('.tree-group', { has: volumeByName(page, volumeName) })
  return group.locator('.tree-item-title').allTextContents()
}

const createVolume = async (page: Page) => {
  const before = await page.locator('[data-testid^="explorer-volume-"]').count()
  await withRealFeedback(page, {
    api: { url: '/api/volumes', method: 'POST' },
    action: async () => {
      await page.getByTestId('explorer-new-volume').click()
    },
    ui: async () => {
      await expect.poll(async () => page.locator('[data-testid^="explorer-volume-"]').count()).toBeGreaterThanOrEqual(before + 1)
    },
    persist: async () => {
      await waitForExplorer(page)
      await expect.poll(async () => page.locator('[data-testid^="explorer-volume-"]').count()).toBeGreaterThanOrEqual(before + 1)
    }
  })
}

const renameVolume = async (page: Page, targetName: string) => {
  await page.locator('[data-testid^="explorer-volume-"]').last().click({ button: 'right' })
  await page.getByTestId('context-volume-rename').click()
  await page.getByTestId('explorer-rename-input').fill(targetName)

  await withRealFeedback(page, {
    api: { url: '/api/volumes/', method: 'PUT' },
    action: async () => {
      await page.getByTestId('explorer-rename-confirm').click()
    },
    ui: async () => {
      await expect(volumeByName(page, targetName)).toBeVisible()
    },
    persist: async () => {
      await waitForExplorer(page)
      await expect(volumeByName(page, targetName)).toBeVisible()
    }
  })
}

const createChapter = async (page: Page, volumeName: string) => {
  await expect(volumeByName(page, volumeName)).toBeVisible()
  await volumeByName(page, volumeName).click({ button: 'right' })

  await withRealFeedback(page, {
    api: { url: '/api/chapters', method: 'POST' },
    action: async () => {
      await page.getByTestId('context-volume-add-chapter').click()
    },
    ui: async () => {
      await expect(page.locator('[data-testid^="explorer-chapter-"]').last()).toBeVisible()
    },
    persist: async () => {
      await waitForExplorer(page)
      await expect(page.locator('[data-testid^="explorer-chapter-"]').last()).toBeVisible()
    }
  })
}

const renameChapter = async (page: Page, chapterName: string) => {
  await page.locator('[data-testid^="explorer-chapter-"]').last().click({ button: 'right' })
  await page.getByTestId('context-chapter-rename').click()
  await page.getByTestId('explorer-rename-input').fill(chapterName)

  await withRealFeedback(page, {
    api: { url: '/api/chapters/', method: 'PUT' },
    action: async () => {
      await page.getByTestId('explorer-rename-confirm').click()
    },
    ui: async () => {
      await expect(chapterByName(page, chapterName)).toBeVisible()
    },
    persist: async () => {
      await waitForExplorer(page)
      await expect(chapterByName(page, chapterName)).toBeVisible()
    }
  })
}

test('explorer management coverage', async ({ page }) => {
  await page.goto('/')
  await waitForExplorer(page)

  const volumeA = `E2E-卷A-${Date.now()}`
  const volumeB = `E2E-卷B-${Date.now()}`

  await createVolume(page)
  await renameVolume(page, volumeA)

  await createVolume(page)
  await renameVolume(page, volumeB)

  const orderBeforeMoveUp = await getVolumeOrder(page)
  const indexBeforeMoveUp = orderBeforeMoveUp.findIndex((item) => item.includes(volumeB))

  await withRealFeedback(page, {
    api: { url: '/api/volumes/', method: 'PUT' },
    action: async () => {
      await volumeByName(page, volumeB).click({ button: 'right' })
      await page.getByTestId('context-volume-move-up').click()
    },
    ui: async () => {
      const order = await getVolumeOrder(page)
      expect(order.findIndex((item) => item.includes(volumeB))).toBeLessThan(indexBeforeMoveUp)
    },
    persist: async () => {
      await waitForExplorer(page)
      const order = await getVolumeOrder(page)
      expect(order.findIndex((item) => item.includes(volumeB))).toBeLessThan(indexBeforeMoveUp)
    }
  })

  const orderBeforeMoveDown = await getVolumeOrder(page)
  const indexBeforeMoveDown = orderBeforeMoveDown.findIndex((item) => item.includes(volumeB))

  await withRealFeedback(page, {
    api: { url: '/api/volumes/', method: 'PUT' },
    action: async () => {
      await volumeByName(page, volumeB).click({ button: 'right' })
      await page.getByTestId('context-volume-move-down').click()
    },
    ui: async () => {
      const order = await getVolumeOrder(page)
      expect(order.findIndex((item) => item.includes(volumeB))).toBeGreaterThan(indexBeforeMoveDown)
    },
    persist: async () => {
      await waitForExplorer(page)
      const order = await getVolumeOrder(page)
      expect(order.findIndex((item) => item.includes(volumeB))).toBeGreaterThan(indexBeforeMoveDown)
    }
  })

  const chapterA = `E2E-章A-${Date.now()}`
  const chapterB = `E2E-章B-${Date.now()}`

  await createChapter(page, volumeA)
  await renameChapter(page, chapterA)

  await createChapter(page, volumeA)
  await renameChapter(page, chapterB)

  await page.getByTestId('explorer-search').fill(chapterA)
  await expect(chapterByName(page, chapterA)).toBeVisible()
  await page.getByTestId('explorer-search').fill('')

  await page.getByTestId('explorer-status-filter').selectOption('draft')
  await page.getByTestId('explorer-status-filter').selectOption('all')

  await withRealFeedback(page, {
    api: { url: '/api/chapters/', method: 'PUT' },
    action: async () => {
      await chapterByName(page, chapterB).dragTo(chapterByName(page, chapterA))
    },
    ui: async () => {
      const order = await getChapterOrder(page, volumeA)
      expect(order.findIndex((item) => item.includes(chapterB))).toBeLessThan(order.findIndex((item) => item.includes(chapterA)))
    },
    persist: async () => {
      await waitForExplorer(page)
      const order = await getChapterOrder(page, volumeA)
      expect(order.findIndex((item) => item.includes(chapterB))).toBeLessThan(order.findIndex((item) => item.includes(chapterA)))
    }
  })

  await withRealFeedback(page, {
    api: { url: '/api/chapters/', method: 'DELETE' },
    action: async () => {
      await chapterByName(page, chapterB).click({ button: 'right' })
      await page.getByTestId('context-chapter-delete').click()
    },
    ui: async () => {
      await expect(chapterByName(page, chapterB)).toHaveCount(0)
    },
    persist: async () => {
      await waitForExplorer(page)
      await expect(chapterByName(page, chapterB)).toHaveCount(0)
    }
  })

  await withRealFeedback(page, {
    api: { url: '/api/volumes/', method: 'DELETE' },
    action: async () => {
      await volumeByName(page, volumeB).click({ button: 'right' })
      await page.getByTestId('context-volume-delete').click()
    },
    ui: async () => {
      await expect(volumeByName(page, volumeB)).toHaveCount(0)
    },
    persist: async () => {
      await waitForExplorer(page)
      await expect(volumeByName(page, volumeB)).toHaveCount(0)
    }
  })
})

test('editor, versions, comments, preview coverage', async ({ page }) => {
  await page.setViewportSize({ width: 1400, height: 800 })
  await page.goto('/')
  await waitForExplorer(page)

  const volumeName = `E2E-编辑-${Date.now()}`
  const chapterName = `E2E-编辑章-${Date.now()}`

  await createVolume(page)
  await renameVolume(page, volumeName)

  await createChapter(page, volumeName)
  await renameChapter(page, chapterName)

  await chapterByName(page, chapterName).click()

  const updatedTitle = `${chapterName}-更新`
  const tags = 'tagA,tagB'
  const target = '2500'

  await withRealFeedback(page, {
    api: { url: '/api/chapters/', method: 'PUT' },
    action: async () => {
      await page.getByTestId('editor-title').fill(updatedTitle)
      await page.getByTestId('editor-status').selectOption('done')
      await page.getByTestId('editor-tags').fill(tags)
      await page.getByTestId('editor-target-word-count').fill(target)
    },
    ui: async () => {
      await expect(page.getByTestId('editor-title')).toHaveValue(updatedTitle)
    },
    persist: async () => {
      await waitForExplorer(page)
      await chapterByName(page, updatedTitle).click()
      await expect(page.getByTestId('editor-title')).toHaveValue(updatedTitle)
      await expect(page.getByTestId('editor-tags')).toHaveValue(tags)
      await expect(page.getByTestId('editor-target-word-count')).toHaveValue(target)
    }
  })

  await page.getByRole('button', { name: '版本历史' }).click()

  const versionsBefore = await page.locator('.version-item').count()
  await withRealFeedback(page, {
    api: { url: '/api/chapters/', method: 'POST' },
    action: async () => {
      await page.getByTestId('editor-save-version').click()
    },
    ui: async () => {
      await expect.poll(async () => page.locator('.version-item').count()).toBeGreaterThanOrEqual(versionsBefore + 1)
    },
    persist: async () => {
      await waitForExplorer(page)
      await chapterByName(page, updatedTitle).click()
      await page.getByRole('button', { name: '版本历史' }).click()
      await expect.poll(async () => page.locator('.version-item').count()).toBeGreaterThan(0)
    }
  })

  const changedTitle = `${updatedTitle}-改`
  await page.getByTestId('editor-title').fill(changedTitle)
  await expect(page.getByTestId('editor-title')).toHaveValue(changedTitle)

  await withRealFeedback(page, {
    api: { url: '/api/chapters/', method: 'POST' },
    action: async () => {
      await page.locator('[data-testid^="version-restore-"]').first().click()
    },
    ui: async () => {
      await expect(page.getByTestId('editor-title')).toHaveValue(updatedTitle)
    },
    persist: async () => {
      await waitForExplorer(page)
      await chapterByName(page, updatedTitle).click()
      await expect(page.getByTestId('editor-title')).toHaveValue(updatedTitle)
    }
  })

  const commentText = `评论-${Date.now()}`
  await page.getByRole('button', { name: '评论协作' }).click()
  await withRealFeedback(page, {
    api: { url: '/api/chapters/', method: 'POST' },
    action: async () => {
      await page.getByTestId('comment-input').fill(commentText)
      await page.getByTestId('comment-send').click()
    },
    ui: async () => {
      await expect(page.getByText(commentText)).toBeVisible()
    },
    persist: async () => {
      await waitForExplorer(page)
      await chapterByName(page, updatedTitle).click()
      await expect(page.getByText(commentText)).toBeVisible()
    }
  })

  await page.getByTestId('topbar-preview').click()
  await expect(page.getByTestId('preview-panel')).toBeVisible()
  await page.getByTestId('preview-tab-markdown').click()
  const downloadPromise = page.waitForEvent('download')
  await page.getByTestId('preview-download').click()
  await downloadPromise
  await page.getByTestId('preview-close').click()
})

test('knowledge base and settings coverage', async ({ page }) => {
  await page.goto('/')
  await waitForExplorer(page)

  const syncVolume = `E2E-同步-${Date.now()}`
  const syncChapter = `E2E-同步章-${Date.now()}`

  await createVolume(page)
  await renameVolume(page, syncVolume)
  await createChapter(page, syncVolume)
  await renameChapter(page, syncChapter)

  const noteTitle = `资料-${Date.now()}`
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

  const noteCard = page.locator('.knowledge-card').filter({ hasText: noteTitle }).first()
  const editButton = noteCard.getByRole('button', { name: '编辑' })
  const editTestId = await editButton.getAttribute('data-testid')
  const noteId = editTestId?.replace('knowledge-edit-', '')
  await editButton.click()

  const updatedTitle = `${noteTitle}-改`
  await page.getByTestId('knowledge-edit-title').fill(updatedTitle)
  await page.getByTestId('knowledge-edit-description').fill('编辑后的描述')

  await withRealFeedback(page, {
    api: { url: '/api/notes/', method: 'PUT' },
    action: async () => {
      await page.getByTestId('knowledge-edit-save').click()
    },
    ui: async () => {
      await expect(page.getByText(updatedTitle)).toBeVisible()
    },
    persist: async () => {
      await waitForExplorer(page)
      await page.getByTestId('topbar-knowledge-base').click()
      await expect(page.getByText(updatedTitle)).toBeVisible()
    }
  })

  await page.getByTestId('knowledge-search').fill(updatedTitle)
  await expect(page.getByText(updatedTitle)).toBeVisible()
  await page.getByTestId('knowledge-search').fill('')

  await page.getByTestId('knowledge-tab-location').click()
  await page.getByTestId('knowledge-tab-character').click()

  if (noteId) {
    await withRealFeedback(page, {
      api: { url: '/api/notes/', method: 'DELETE' },
      action: async () => {
        await page.getByTestId(`knowledge-delete-${noteId}`).click()
      },
      ui: async () => {
        await expect(page.getByText(updatedTitle)).toHaveCount(0)
      },
      persist: async () => {
        await waitForExplorer(page)
        await page.getByTestId('topbar-knowledge-base').click()
        await expect(page.getByText(updatedTitle)).toHaveCount(0)
      }
    })
  }

  await page.getByTestId('knowledge-close').click()
  await page.getByTestId('topbar-settings').click()
  await expect(page.getByRole('heading', { name: '设置' })).toBeVisible()

  await page.getByTestId('settings-nav-profile').click()
  await page.getByTestId('settings-nav-appearance').click()
  await page.getByTestId('settings-font-family').fill('IBM Plex Sans')
  const themeSelect = page.getByTestId('settings-theme')
  await themeSelect.locator('.select-trigger').click()
  await page.getByRole('option', { name: '深色' }).click()
  const widthSelect = page.getByTestId('settings-editor-width')
  await widthSelect.locator('.select-trigger').click()
  await page.getByRole('option', { name: '居中' }).click()

  await page.getByTestId('settings-nav-providers').click()
  await page.getByTestId('settings-provider-add').click()
  const providerCards = page.locator('.settings-content .settings-item-card')
  await providerCards.last().getByPlaceholder('Provider 名称').fill('E2E Provider')
  await providerCards.last().getByRole('button', { name: '删除' }).click()

  await page.getByTestId('settings-nav-agents').click()
  await page.getByTestId('settings-agent-add').click()
  const agentCards = page.locator('.settings-content .settings-item-card')
  await agentCards.last().getByPlaceholder('Agent 名称').fill('E2E Agent')
  await agentCards.last().getByRole('button', { name: '删除' }).click()

  await page.getByTestId('settings-nav-ai').click()
  await page.getByTestId('settings-ai-temperature').fill('0.9')

  await page.getByTestId('settings-nav-sync').click()
  await page.getByTestId('settings-sync-api-base').fill('http://localhost:8787')

  await page.getByTestId('settings-nav-autosave').click()
  const autosaveToggle = page.getByTestId('settings-autosave-toggle')
  await autosaveToggle.setChecked(false, { force: true })
  await expect(autosaveToggle).not.toBeChecked()
  await page.getByTestId('settings-autosave-interval').fill('2000')

  await page.getByTestId('settings-nav-export').click()
  const exportSelect = page.getByTestId('settings-export-format')
  await exportSelect.locator('.select-trigger').click()
  await page.getByRole('option', { name: 'HTML' }).click()

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
      await page.getByTestId('settings-nav-export').click()
      await expect(page.getByTestId('settings-export-format')).toContainText('HTML')
      await page.getByTestId('settings-back').click()
    }
  })

  await chapterByName(page, syncChapter).click()
  await expect(page.getByTestId('topbar-manual-sync')).toBeVisible()
  const syncResponse = page.waitForResponse((response) =>
    response.url().includes('/api/chapters/') &&
    response.url().includes('/content') &&
    response.request().method() === 'PUT'
  )
  await page.getByTestId('topbar-manual-sync').click()
  expect((await syncResponse).ok()).toBeTruthy()
})
