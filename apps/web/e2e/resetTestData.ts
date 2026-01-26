import type { APIRequestContext } from '@playwright/test'

export const resetTestData = async (request: APIRequestContext) => {
  const response = await request.post('http://localhost:8787/api/test/reset')
  if (!response.ok()) {
    const text = await response.text()
    throw new Error(`Test reset failed: ${response.status()} ${text}`)
  }
}
