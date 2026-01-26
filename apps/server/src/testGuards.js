import path from 'node:path'

const normalizeSegments = (dir) =>
  path.resolve(dir).split(path.sep).filter(Boolean).map((segment) => segment.toLowerCase())

const isSafeTestDataDir = (dir) => {
  if (!dir) return false
  const segments = normalizeSegments(dir)
  return segments.includes('e2e') || segments.includes('tmp') || segments.includes('temp')
}

const logGuardFailure = (dataDir) => {
  const message = `[FATAL][test-reset-guard] NOVELSTUDIO_ALLOW_TEST_RESET=1 requires NOVELSTUDIO_DATA_DIR to include /e2e or /tmp (current: ${dataDir})`
  console.error(message)
}

export const enforceTestResetGuard = (dataDir) => {
  if (process.env.NOVELSTUDIO_ALLOW_TEST_RESET !== '1') return
  if (!isSafeTestDataDir(dataDir)) {
    logGuardFailure(dataDir)
    process.exit(1)
  }
}
