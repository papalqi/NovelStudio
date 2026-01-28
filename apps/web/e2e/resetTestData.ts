import type { APIRequestContext } from '@playwright/test'
import { E2E_API_BASE_URL } from './e2eEnv'

type AuthPayload = {
  userId: string
  username: string
  token: string
}

const TEST_USERNAME = process.env.NOVELSTUDIO_E2E_USER ?? 'e2e-user'
const TEST_PASSWORD = process.env.NOVELSTUDIO_E2E_PASSWORD ?? 'e2e-password-1234'

const ensureAuth = async (request: APIRequestContext): Promise<AuthPayload> => {
  const loginResponse = await request.post(`${E2E_API_BASE_URL}/api/auth/login`, {
    data: { username: TEST_USERNAME, password: TEST_PASSWORD }
  })
  if (loginResponse.ok()) {
    return loginResponse.json()
  }

  const registerResponse = await request.post(`${E2E_API_BASE_URL}/api/auth/register`, {
    data: { username: TEST_USERNAME, password: TEST_PASSWORD }
  })
  if (!registerResponse.ok()) {
    const text = await registerResponse.text()
    throw new Error(`Auth failed: ${registerResponse.status()} ${text}`)
  }
  return registerResponse.json()
}

export const resetTestData = async (request: APIRequestContext) => {
  const auth = await ensureAuth(request)
  const response = await request.post(`${E2E_API_BASE_URL}/api/test/reset`, {
    headers: { Authorization: `Bearer ${auth.token}` }
  })
  if (!response.ok()) {
    const text = await response.text()
    throw new Error(`Test reset failed: ${response.status()} ${text}`)
  }
  return auth
}
