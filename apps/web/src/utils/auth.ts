const TOKEN_KEY = 'novelstudio.auth.token'
const USER_KEY = 'novelstudio.auth.user'

export type AuthUser = {
  userId: string
  username: string
}

export const getAuthToken = () => {
  if (typeof window === 'undefined') return ''
  return window.localStorage.getItem(TOKEN_KEY) ?? ''
}

export const setAuthToken = (token: string) => {
  if (typeof window === 'undefined') return
  window.localStorage.setItem(TOKEN_KEY, token)
}

export const clearAuthToken = () => {
  if (typeof window === 'undefined') return
  window.localStorage.removeItem(TOKEN_KEY)
}

export const getStoredAuthUser = (): AuthUser | null => {
  if (typeof window === 'undefined') return null
  const raw = window.localStorage.getItem(USER_KEY)
  if (!raw) return null
  try {
    return JSON.parse(raw) as AuthUser
  } catch {
    return null
  }
}

export const setStoredAuthUser = (user: AuthUser) => {
  if (typeof window === 'undefined') return
  window.localStorage.setItem(USER_KEY, JSON.stringify(user))
}

export const clearStoredAuthUser = () => {
  if (typeof window === 'undefined') return
  window.localStorage.removeItem(USER_KEY)
}
