import { createId } from './id'

export type LogScope = 'ai' | 'diff' | 'agent' | 'autosave' | 'conflict' | 'system'
export type LogStatus = 'info' | 'success' | 'error' | 'warn'

export type LogEntry = {
  id: string
  requestId: string
  scope: LogScope
  status: LogStatus
  message: string
  durationMs: number
  payloadSummary: string
  createdAt: string
}

export type CreateLogEntryInput = {
  requestId?: string
  scope: LogScope
  status: LogStatus
  message: string
  durationMs?: number
  payloadSummary?: string
}

export const createLogEntry = (input: CreateLogEntryInput): LogEntry => {
  const requestId = input.requestId ?? createId()
  const durationMs = Number.isFinite(input.durationMs) ? Math.max(0, input.durationMs ?? 0) : 0
  const payloadSummary = input.payloadSummary?.trim() || '-'

  return {
    id: createId(),
    requestId,
    scope: input.scope,
    status: input.status,
    message: input.message,
    durationMs,
    payloadSummary,
    createdAt: new Date().toISOString()
  }
}

export const formatLogEntry = (entry: LogEntry) => {
  const durationLabel = `${Math.round(entry.durationMs)}ms`
  return `${entry.createdAt} [${entry.scope}] ${entry.status.toUpperCase()} request=${entry.requestId} duration=${durationLabel} ${entry.message} payload=${entry.payloadSummary}`
}
