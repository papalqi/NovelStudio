import { createApiClient } from './client'
import type { AppBootstrap, Chapter, Note, Settings, Block, ChapterVersion, Comment } from '../types'

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

export const runAiCompletion = (
  payload: { provider: { baseUrl: string; token: string; model: string }; messages: unknown[]; temperature: number; maxTokens: number },
  baseUrl?: string
) =>
  createApiClient(baseUrl).fetchJson<{ content: string }>('/api/ai/complete', {
    method: 'POST',
    body: JSON.stringify(payload)
  })
