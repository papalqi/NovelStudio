export const E2E_WEB_PORT = process.env.NOVELSTUDIO_E2E_WEB_PORT ?? '5174'
export const E2E_SERVER_PORT = process.env.NOVELSTUDIO_E2E_SERVER_PORT ?? '8788'

export const E2E_WEB_URL = `http://localhost:${E2E_WEB_PORT}`
export const E2E_API_BASE_URL = process.env.NOVELSTUDIO_E2E_API_BASE_URL ?? `http://localhost:${E2E_SERVER_PORT}`
