const stripTrailingSlash = (value) => value.replace(/\/$/, '')

const stripTrailingHash = (value) => (value.endsWith('#') ? value.slice(0, -1) : value)

export const buildOpenAiEndpoint = (baseUrl, path) => {
  const raw = baseUrl?.trim() ?? ''
  const disableV1 = raw.endsWith('#')
  const withoutHash = stripTrailingHash(raw)
  const normalized = stripTrailingSlash(withoutHash)
  const base = disableV1
    ? normalized
    : normalized.endsWith('/v1')
      ? normalized
      : `${normalized}/v1`
  const trimmedPath = path.replace(/^\//, '')
  return `${base}/${trimmedPath}`
}
