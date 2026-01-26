const LOCAL_HOSTS = new Set(['localhost', '127.0.0.1', '0.0.0.0', '::1'])

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

export const createApiClient = (baseUrl?: string) => {
  const resolvedBaseUrl = resolveApiBaseUrl(baseUrl)
  const fetchJson = async <T>(path: string, options?: RequestInit): Promise<T> => {
    const res = await fetch(`${resolvedBaseUrl}${path}`, {
      headers: { 'Content-Type': 'application/json', ...(options?.headers ?? {}) },
      ...options
    })
    if (!res.ok) {
      const text = await res.text()
      throw new Error(text || '请求失败')
    }
    return res.json() as Promise<T>
  }

  return {
    fetchJson,
    baseUrl: resolvedBaseUrl
  }
}
