const defaultBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8787'

export const createApiClient = (baseUrl = defaultBaseUrl) => {
  const fetchJson = async <T>(path: string, options?: RequestInit): Promise<T> => {
    const res = await fetch(`${baseUrl}${path}`, {
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
    baseUrl
  }
}
