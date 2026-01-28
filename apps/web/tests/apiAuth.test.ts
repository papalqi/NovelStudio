import { afterEach, expect, test, vi } from 'vitest'
import { runAiCompletion } from '../src/api'
import { clearAuthToken, setAuthToken } from '../src/utils/auth'

afterEach(() => {
  clearAuthToken()
  vi.restoreAllMocks()
})

test('runAiCompletion attaches auth header when token exists', async () => {
  setAuthToken('token-123')
  const fetchMock = vi.fn().mockResolvedValue({
    ok: true,
    json: async () => ({ content: 'pong' }),
    text: async () => ''
  })
  vi.stubGlobal('fetch', fetchMock)

  await runAiCompletion(
    {
      provider: { baseUrl: 'http://api.test/v1', token: '', model: 'gpt-4' },
      messages: [{ role: 'user', content: 'ping' }],
      temperature: 0,
      maxTokens: 16
    },
    'http://localhost:8787',
    { maxRetries: 0, timeoutMs: 0, retryDelayMs: 0, maxConcurrency: 1, rateLimitPerMinute: 0 }
  )

  const options = fetchMock.mock.calls[0]?.[1] as RequestInit
  expect(options).toBeTruthy()
  const headers = options.headers as Record<string, string>
  expect(headers.Authorization).toBe('Bearer token-123')
})
