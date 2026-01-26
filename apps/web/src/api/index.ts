import { createApiClient, resolveApiBaseUrl } from './client'
import type { AppBootstrap, Chapter, Note, Settings, Block, ChapterVersion, Comment, AiRequestSettings } from '../types'
import { normalizeAiRequestSettings } from '../utils/aiRequest'

export const fetchBootstrap = (baseUrl?: string) =>
  createApiClient(baseUrl).fetchJson<AppBootstrap>('/api/bootstrap')

export const saveSettings = (settings: Settings, baseUrl?: string) =>
  createApiClient(baseUrl).fetchJson<Settings>('/api/settings', {
    method: 'PUT',
    body: JSON.stringify(settings)
  })

export const createVolume = (volume: { id: string; title: string; orderIndex: number }, baseUrl?: string) =>
  createApiClient(baseUrl).fetchJson('/api/volumes', {
    method: 'POST',
    body: JSON.stringify(volume)
  })

export const updateVolume = (id: string, payload: { title: string; orderIndex: number }, baseUrl?: string) =>
  createApiClient(baseUrl).fetchJson(`/api/volumes/${id}`, {
    method: 'PUT',
    body: JSON.stringify(payload)
  })

export const deleteVolume = (id: string, baseUrl?: string) =>
  createApiClient(baseUrl).fetchJson(`/api/volumes/${id}`, { method: 'DELETE' })

export const createChapter = (chapter: Partial<Chapter>, baseUrl?: string) =>
  createApiClient(baseUrl).fetchJson<Chapter>('/api/chapters', {
    method: 'POST',
    body: JSON.stringify(chapter)
  })

export const updateChapter = (id: string, chapter: Chapter, baseUrl?: string) =>
  createApiClient(baseUrl).fetchJson<Chapter>(`/api/chapters/${id}`, {
    method: 'PUT',
    body: JSON.stringify(chapter)
  })

export const updateChapterContent = (
  id: string,
  payload: { content: Block[]; wordCount: number; updatedAt?: string },
  baseUrl?: string
) =>
  createApiClient(baseUrl).fetchJson<Chapter>(`/api/chapters/${id}/content`, {
    method: 'PUT',
    body: JSON.stringify(payload)
  })

export const deleteChapter = (id: string, baseUrl?: string) =>
  createApiClient(baseUrl).fetchJson(`/api/chapters/${id}`, { method: 'DELETE' })

export const listVersions = (chapterId: string, baseUrl?: string) =>
  createApiClient(baseUrl).fetchJson<ChapterVersion[]>(`/api/chapters/${chapterId}/versions`)

export const createVersion = (chapterId: string, snapshot: Chapter, baseUrl?: string) =>
  createApiClient(baseUrl).fetchJson<ChapterVersion[]>(`/api/chapters/${chapterId}/versions`, {
    method: 'POST',
    body: JSON.stringify({ snapshot })
  })

export const restoreVersion = (chapterId: string, versionId: string, baseUrl?: string) =>
  createApiClient(baseUrl).fetchJson<Chapter>(`/api/chapters/${chapterId}/restore/${versionId}`, {
    method: 'POST'
  })

export const listNotes = (baseUrl?: string) =>
  createApiClient(baseUrl).fetchJson<Note[]>('/api/notes')

export const saveNote = (note: Partial<Note>, baseUrl?: string) =>
  createApiClient(baseUrl).fetchJson<Note>('/api/notes', {
    method: 'POST',
    body: JSON.stringify(note)
  })

export const updateNote = (id: string, note: Partial<Note>, baseUrl?: string) =>
  createApiClient(baseUrl).fetchJson<Note>(`/api/notes/${id}`, {
    method: 'PUT',
    body: JSON.stringify(note)
  })

export const deleteNote = (id: string, baseUrl?: string) =>
  createApiClient(baseUrl).fetchJson(`/api/notes/${id}`, { method: 'DELETE' })

export const listComments = (chapterId: string, baseUrl?: string) =>
  createApiClient(baseUrl).fetchJson<Comment[]>(`/api/chapters/${chapterId}/comments`)

export const addComment = (
  chapterId: string,
  payload: { author: string; body: string },
  baseUrl?: string
) =>
  createApiClient(baseUrl).fetchJson<Comment[]>(`/api/chapters/${chapterId}/comments`, {
    method: 'POST',
    body: JSON.stringify(payload)
  })

export type AiRequestMeta = { attempts: number; retries: number }

export class AiRequestError extends Error {
  status?: number
  code?: string
  attempts: number
  retries: number

  constructor(message: string, options: { status?: number; code?: string; attempts: number }) {
    super(message)
    this.name = 'AiRequestError'
    this.status = options.status
    this.code = options.code
    this.attempts = options.attempts
    this.retries = Math.max(0, options.attempts - 1)
  }
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

const concurrencyState = {
  active: 0,
  queue: [] as Array<() => void>
}

const acquireConcurrency = (maxConcurrency: number) =>
  new Promise<void>((resolve) => {
    const tryAcquire = () => {
      if (concurrencyState.active < maxConcurrency) {
        concurrencyState.active += 1
        resolve()
        return
      }
      concurrencyState.queue.push(tryAcquire)
    }
    tryAcquire()
  })

const releaseConcurrency = () => {
  concurrencyState.active = Math.max(0, concurrencyState.active - 1)
  const next = concurrencyState.queue.shift()
  if (next) next()
}

const rateState = {
  tokens: 0,
  lastRefillMs: 0,
  rateLimit: 0
}

const waitForRateLimit = async (rateLimitPerMinute: number) => {
  if (rateLimitPerMinute <= 0) return
  while (true) {
    const now = Date.now()
    if (rateState.rateLimit !== rateLimitPerMinute) {
      rateState.rateLimit = rateLimitPerMinute
      rateState.tokens = rateLimitPerMinute
      rateState.lastRefillMs = now
    }
    const elapsed = now - rateState.lastRefillMs
    if (elapsed > 0) {
      const refill = (elapsed / 60000) * rateLimitPerMinute
      rateState.tokens = Math.min(rateLimitPerMinute, rateState.tokens + refill)
      rateState.lastRefillMs = now
    }
    if (rateState.tokens >= 1) {
      rateState.tokens -= 1
      return
    }
    const msPerToken = 60000 / rateLimitPerMinute
    const waitMs = Math.ceil((1 - rateState.tokens) * msPerToken)
    await sleep(waitMs)
  }
}

const isRetryableStatus = (status?: number) => {
  if (!status) return false
  return status === 408 || status === 429 || (status >= 500 && status <= 599)
}

const computeRetryDelay = (baseDelayMs: number, attempt: number) => {
  if (baseDelayMs <= 0) return 0
  const exp = Math.min(3, attempt - 1)
  const jitter = Math.random() * Math.min(250, baseDelayMs)
  return Math.min(baseDelayMs * 2 ** exp + jitter, 10000)
}

const coerceAiRequestError = (error: unknown, attempts: number) => {
  if (error instanceof AiRequestError) {
    return error
  }
  if (error instanceof DOMException && error.name === 'AbortError') {
    return new AiRequestError('请求超时', { code: 'timeout', attempts })
  }
  if (error instanceof TypeError) {
    return new AiRequestError('网络错误', { code: 'network', attempts })
  }
  if (error instanceof Error) {
    return new AiRequestError(error.message || '请求失败', { attempts })
  }
  return new AiRequestError('请求失败', { attempts })
}

const shouldRetry = (error: AiRequestError, attempt: number, maxAttempts: number) => {
  if (attempt >= maxAttempts) return false
  if (error.code === 'timeout' || error.code === 'network') return true
  return isRetryableStatus(error.status)
}

export const runAiCompletion = (
  payload: { provider: { baseUrl: string; token: string; model: string }; messages: unknown[]; temperature: number; maxTokens: number },
  baseUrl?: string,
  requestConfig?: Partial<AiRequestSettings>
): Promise<{ content: string; meta: AiRequestMeta }> => {
  const config = normalizeAiRequestSettings(requestConfig)
  const resolvedBaseUrl = resolveApiBaseUrl(baseUrl)
  const url = `${resolvedBaseUrl}/api/ai/complete`
  const maxAttempts = Math.max(1, config.maxRetries + 1)

  const execute = async (): Promise<{ content: string; meta: AiRequestMeta }> => {
    let attempt = 0
    while (attempt < maxAttempts) {
      attempt += 1
      const controller = new AbortController()
      const timeoutId = config.timeoutMs > 0 ? setTimeout(() => controller.abort(), config.timeoutMs) : undefined
      try {
        const res = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
          signal: controller.signal
        })
        if (!res.ok) {
          const text = await res.text()
          const error = new AiRequestError(text || `请求失败(${res.status})`, {
            status: res.status,
            attempts: attempt
          })
          if (shouldRetry(error, attempt, maxAttempts)) {
            const delayMs = computeRetryDelay(config.retryDelayMs, attempt)
            if (delayMs > 0) await sleep(delayMs)
            continue
          }
          throw error
        }
        const data = (await res.json()) as { content: string }
        return { content: data.content, meta: { attempts: attempt, retries: attempt - 1 } }
      } catch (error) {
        const requestError = coerceAiRequestError(error, attempt)
        if (shouldRetry(requestError, attempt, maxAttempts)) {
          const delayMs = computeRetryDelay(config.retryDelayMs, attempt)
          if (delayMs > 0) await sleep(delayMs)
          continue
        }
        throw requestError
      } finally {
        if (timeoutId) clearTimeout(timeoutId)
      }
    }
    throw new AiRequestError('请求失败', { attempts: maxAttempts })
  }

  return (async () => {
    await waitForRateLimit(config.rateLimitPerMinute)
    await acquireConcurrency(config.maxConcurrency)
    try {
      return await execute()
    } finally {
      releaseConcurrency()
    }
  })()
}
