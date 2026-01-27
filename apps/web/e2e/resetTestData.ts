import type { APIRequestContext } from '@playwright/test'
import { E2E_API_BASE_URL } from './e2eEnv'

export const resetTestData = async (request: APIRequestContext) => {
  const response = await request.post(`${E2E_API_BASE_URL}/api/test/reset`)
  if (!response.ok()) {
    const text = await response.text()
    throw new Error(`Test reset failed: ${response.status()} ${text}`)
  }
}
