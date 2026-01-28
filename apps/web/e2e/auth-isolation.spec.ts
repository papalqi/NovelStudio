import { test, expect, type Page, type APIRequestContext } from '@playwright/test'
import { resetTestData } from './resetTestData'
import { E2E_API_BASE_URL } from './e2eEnv'

const waitForExplorer = async (page: Page) => {
  await expect(page.getByText('资源管理器')).toBeVisible()
}

type AuthPayload = {
  userId: string
  username: string
  token: string
}

const registerUser = async (request: APIRequestContext, username: string, password: string): Promise<AuthPayload> => {
  const response = await request.post(`${E2E_API_BASE_URL}/api/auth/register`, {
    data: { username, password }
  })
  if (!response.ok()) {
    const text = await response.text()
    throw new Error(`Register failed: ${response.status()} ${text}`)
  }
  return response.json()
}

const queueAuthStorage = async (page: Page, auth: AuthPayload) => {
  await page.addInitScript(({ token, userId, username }) => {
    window.localStorage.setItem('novelstudio.auth.token', token)
    window.localStorage.setItem('novelstudio.auth.user', JSON.stringify({ userId, username }))
  }, auth)
}

test('users workspaces are isolated', async ({ page, request }) => {
  const authA = await resetTestData(request)
  await page.addInitScript(({ token, userId, username }) => {
    window.localStorage.setItem('novelstudio.auth.token', token)
    window.localStorage.setItem('novelstudio.auth.user', JSON.stringify({ userId, username }))
  }, { token: authA.token, userId: authA.userId, username: authA.username })

  await page.goto('/')
  await waitForExplorer(page)
  await expect(page.getByText('第一卷 · 试读')).toBeVisible()

  const usernameB = `e2e-user-${Date.now()}`
  const passwordB = 'e2e-pass-1234'
  const authB = await registerUser(request, usernameB, passwordB)

  await queueAuthStorage(page, authB)
  await page.reload()
  await waitForExplorer(page)

  await expect(page.getByText('第一卷 · 试读')).toHaveCount(0)
  await expect(page.getByText('第1章 试读开篇')).toHaveCount(0)
})
