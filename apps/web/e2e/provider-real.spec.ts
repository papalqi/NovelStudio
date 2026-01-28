import { test, expect, type Page } from '@playwright/test'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import Database from 'better-sqlite3'
import { resetTestData } from './resetTestData'
import { E2E_API_BASE_URL } from './e2eEnv'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const repoRoot = path.resolve(__dirname, '../../..')
const defaultDataDir = path.resolve(repoRoot, 'apps/server/data')

const pickLatestDb = (paths: string[]) => {
  const candidates = paths
    .filter((item) => fs.existsSync(item))
    .map((item) => ({ path: item, mtime: fs.statSync(item).mtimeMs }))
    .sort((a, b) => b.mtime - a.mtime)
  return candidates[0]?.path ?? ''
}

const loadPrimarySettings = () => {
  const userRoot = path.join(defaultDataDir, 'users')
  const userDbPaths: string[] = []
  if (fs.existsSync(userRoot)) {
    for (const entry of fs.readdirSync(userRoot)) {
      const dbPath = path.join(userRoot, entry, 'novelstudio.db')
      if (fs.existsSync(dbPath)) userDbPaths.push(dbPath)
    }
  }
  const legacyDb = path.join(defaultDataDir, 'novelstudio.db')
  const dbPath = userDbPaths.length > 0 ? pickLatestDb(userDbPaths) : (fs.existsSync(legacyDb) ? legacyDb : '')
  if (!dbPath) {
    throw new Error('未找到可用的用户设置数据库')
  }
  const db = new Database(dbPath, { readonly: true })
  const rows = db.prepare('select key, value from settings').all() as Array<{ key: string; value: string }>
  const settings: Record<string, unknown> = {}
  for (const row of rows) {
    try {
      settings[row.key] = JSON.parse(row.value)
    } catch {
      settings[row.key] = row.value
    }
  }
  db.close()
  return settings
}

const waitForExplorer = async (page: Page) => {
  await expect(page.getByText('资源管理器')).toBeVisible()
}

test('provider availability uses configured provider', async ({ page, request }) => {
  test.setTimeout(90_000)

  const auth = await resetTestData(request)
  await page.addInitScript(({ token, userId, username }) => {
    window.localStorage.setItem('novelstudio.auth.token', token)
    window.localStorage.setItem('novelstudio.auth.user', JSON.stringify({ userId, username }))
  }, { token: auth.token, userId: auth.userId, username: auth.username })

  const settingsResponse = await request.get(`${E2E_API_BASE_URL}/api/settings`, {
    headers: { Authorization: `Bearer ${auth.token}` }
  })
  expect(settingsResponse.ok()).toBeTruthy()
  const settings = await settingsResponse.json()
  const primarySettings = loadPrimarySettings() as { providers?: unknown; ai?: { defaultProviderId?: string } }
  const providers = Array.isArray(primarySettings.providers) ? primarySettings.providers : []
  if (providers.length === 0) {
    throw new Error('未读取到可用的 Provider 配置')
  }
  const nextSettings = {
    ...settings,
    providers,
    ai: {
      ...settings.ai,
      defaultProviderId: primarySettings.ai?.defaultProviderId ?? settings.ai?.defaultProviderId
    }
  }
  const updateResponse = await request.put(`${E2E_API_BASE_URL}/api/settings`, {
    data: nextSettings,
    headers: { Authorization: `Bearer ${auth.token}` }
  })
  expect(updateResponse.ok()).toBeTruthy()

  const preferredId = nextSettings.ai?.defaultProviderId
  const providerId = nextSettings.providers?.find((item: { id: string }) => item.id === preferredId)?.id
    ?? nextSettings.providers?.[0]?.id
  expect(providerId).toBeTruthy()

  await page.goto('/')
  await waitForExplorer(page)

  await page.getByTestId('topbar-settings').click()
  await expect(page.getByRole('heading', { name: '设置' })).toBeVisible()
  await page.getByTestId('settings-nav-providers').click()

  const testButton = page.getByTestId(`settings-provider-test-${providerId}`)
  await testButton.scrollIntoViewIfNeeded()

  const responsePromise = page.waitForResponse(
    (response) => response.url().includes('/api/ai/test') && response.request().method() === 'POST'
  )
  await testButton.click()
  const response = await responsePromise
  expect(response.ok()).toBeTruthy()

  await expect(page.getByTestId(`settings-provider-test-status-${providerId}`)).toContainText('通过', {
    timeout: 60_000
  })
})
