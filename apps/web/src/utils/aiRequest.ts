import type { AiRequestSettings } from '../types'

const clampNumber = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value))
const clampInteger = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, Math.round(value)))

export const DEFAULT_AI_REQUEST_SETTINGS: AiRequestSettings = {
  timeoutMs: 20000,
  maxRetries: 2,
  retryDelayMs: 800,
  maxConcurrency: 2,
  rateLimitPerMinute: 60
}

export const normalizeAiRequestSettings = (input?: Partial<AiRequestSettings>): AiRequestSettings => {
  const merged = { ...DEFAULT_AI_REQUEST_SETTINGS, ...(input ?? {}) }
  return {
    timeoutMs: clampNumber(merged.timeoutMs, 0, 120000),
    maxRetries: clampInteger(merged.maxRetries, 0, 5),
    retryDelayMs: clampNumber(merged.retryDelayMs, 0, 10000),
    maxConcurrency: clampInteger(merged.maxConcurrency, 1, 10),
    rateLimitPerMinute: clampInteger(merged.rateLimitPerMinute, 0, 600)
  }
}
