import { getAuthToken } from '../utils/auth'

const LOCAL_HOSTS = new Set(['localhost', '127.0.0.1', '0.0.0.0', '::1'])
const DEFAULT_API_TIMEOUT_MS = 12000

const stripTrailingSlash = (value: string) => value.replace(/\/$/, '')

const getBrowserHost = () => {
  if (typeof window === 'undefined') return ''
  return window.location?.hostname ?? ''
}

const buildDefaultBaseUrl = () => {
  const envBaseUrl = import.meta.env.VITE_API_BASE_URL
  if (envBaseUrl) return stripTrailingSlash(envBaseUrl)
  const host = getBrowserHost()
  if (host) return `http://${host}:8787`
  return 'http://localhost:8787'
}

export const resolveApiBaseUrl = (baseUrl?: string) => {
  const fallback = buildDefaultBaseUrl()
  if (!baseUrl) return fallback
  const normalized = stripTrailingSlash(baseUrl)
  const host = getBrowserHost()
  if (!host) return normalized
  try {
    const url = new URL(normalized)
    if (LOCAL_HOSTS.has(url.hostname)) {
      url.hostname = host
      return stripTrailingSlash(url.toString())
    }
  } catch {
    return normalized
  }
  return normalized
}

type FetchJsonOptions = RequestInit & { timeoutMs?: number }

const buildErrorMessage = (status: number, statusText: string, bodyText: string) => {
  const trimmed = bodyText.trim()
  if (!trimmed) return `请求失败 (${status} ${statusText})`
  try {
    const parsed = JSON.parse(trimmed) as { error?: string; message?: string }
    const message = parsed?.error || parsed?.message
    if (message && typeof message === 'string') {
      return `请求失败 (${status} ${statusText})：${message}`
    }
  } catch {
    // ignore JSON parse errors
  }
  return `请求失败 (${status} ${statusText})：${trimmed}`
}

export const withAuthHeader = (headers: HeadersInit = {}) => {
  const token = getAuthToken()
  const nextHeaders = new Headers(headers)
  if (token && !nextHeaders.has('Authorization')) {
    nextHeaders.set('Authorization', `Bearer ${token}`)
  }
  return nextHeaders
}

export const createApiClient = (baseUrl?: string) => {
  const resolvedBaseUrl = resolveApiBaseUrl(baseUrl)
  const fetchJson = async <T>(path: string, options?: FetchJsonOptions): Promise<T> => {
    const headers = withAuthHeader(options?.headers)
    if (!headers.has('Content-Type')) {
      headers.set('Content-Type', 'application/json')
    }
    const { timeoutMs = DEFAULT_API_TIMEOUT_MS, ...rest } = options ?? {}
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs)
    try {
      const res = await fetch(`${resolvedBaseUrl}${path}`, {
        headers,
        signal: controller.signal,
        ...rest
      })
      if (!res.ok) {
        const text = await res.text()
        throw new Error(buildErrorMessage(res.status, res.statusText, text))
      }
      return res.json() as Promise<T>
    } catch (error: unknown) {
      if (error instanceof Error && error.name === 'AbortError') {
        throw new Error(`请求超时（${timeoutMs}ms），请检查服务是否可用`)
      }
      throw error
    } finally {
      clearTimeout(timeoutId)
    }
  }

  return {
    fetchJson,
    baseUrl: resolvedBaseUrl
  }
}
