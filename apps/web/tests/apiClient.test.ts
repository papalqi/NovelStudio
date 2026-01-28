import { afterEach, describe, expect, test, vi } from 'vitest'
import { createApiClient } from '../src/api/client'

describe('createApiClient', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
    vi.useRealTimers()
  })

  test('throws readable error message for JSON error response', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: false,
      status: 401,
      statusText: 'Unauthorized',
      text: async () => JSON.stringify({ error: '未登录' })
    })
    vi.stubGlobal('fetch', fetchMock)

    const client = createApiClient('http://example.com')
    await expect(client.fetchJson('/api/notes')).rejects.toThrow('未登录')
    await expect(client.fetchJson('/api/notes')).rejects.toThrow('401')
  })

  test('aborts request on timeout', async () => {
    vi.useFakeTimers()

    const fetchMock = vi.fn((_url: string, options?: RequestInit) => {
      return new Promise((_resolve, reject) => {
        const signal = options?.signal
        if (signal) {
          signal.addEventListener('abort', () => {
            const error = new Error('Aborted')
            error.name = 'AbortError'
            reject(error)
          })
        }
      })
    })
    vi.stubGlobal('fetch', fetchMock)

    const client = createApiClient('http://example.com')
    const promise = client.fetchJson('/api/notes', { timeoutMs: 50 })
    const assertion = expect(promise).rejects.toThrow('请求超时')
    await vi.advanceTimersByTimeAsync(60)
    await assertion
  })
})
