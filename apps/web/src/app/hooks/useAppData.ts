import { useCallback, useEffect, useMemo, useState } from 'react'
import type { AppBootstrap, Chapter, Note, Settings, Volume } from '../../types'
import {
  fetchBootstrap,
  saveSettings,
  createVolume,
  updateVolume,
  deleteVolume,
  createChapter,
  updateChapter,
  updateChapterContent,
  deleteChapter,
  listVersions,
  createVersion,
  restoreVersion,
  listNotes,
  saveNote,
  updateNote,
  deleteNote,
  listComments,
  addComment
} from '../../api'
import { resolveApiBaseUrl } from '../../api/client'
import { createId } from '../../utils/id'
import { normalizeAiRequestSettings } from '../../utils/aiRequest'

const CACHE_KEY = 'novelstudio.cache.v1'

const buildCacheKey = (userId?: string | null) => {
  if (!userId) return `${CACHE_KEY}.anonymous`
  return `${CACHE_KEY}.${userId}`
}

const loadCache = (cacheKey: string): AppBootstrap | null => {
  try {
    const raw = localStorage.getItem(cacheKey)
    if (!raw) return null
    return JSON.parse(raw) as AppBootstrap
  } catch {
    return null
  }
}

const saveCache = (cacheKey: string, payload: AppBootstrap) => {
  localStorage.setItem(cacheKey, JSON.stringify(payload))
}

const normalizeSettings = (settings: Settings): Settings => ({
  ...settings,
  ai: {
    ...settings.ai,
    request: normalizeAiRequestSettings(settings.ai?.request)
  }
})

export type AppDataState = {
  settings: Settings | null
  volumes: Volume[]
  chapters: Chapter[]
  notes: Note[]
  loading: boolean
  error: string | null
  offline: boolean
}

export const useAppData = (options?: { enabled?: boolean; userId?: string | null }) => {
  const enabled = options?.enabled ?? true
  const cacheKey = useMemo(() => buildCacheKey(options?.userId), [options?.userId])
  const initialState: AppDataState = useMemo(
    () => ({
      settings: null,
      volumes: [],
      chapters: [],
      notes: [],
      loading: enabled,
      error: null,
      offline: false
    }),
    [enabled]
  )
  const [state, setState] = useState<AppDataState>(initialState)

  const apiBaseUrl = resolveApiBaseUrl(state.settings?.sync.apiBaseUrl)

  const applyBootstrap = useCallback((payload: AppBootstrap, offline = false) => {
    const normalizedSettings = normalizeSettings(payload.settings)
    setState({
      settings: normalizedSettings,
      volumes: payload.volumes,
      chapters: payload.chapters,
      notes: payload.notes,
      loading: false,
      error: null,
      offline
    })
    saveCache(cacheKey, {
      settings: normalizedSettings,
      volumes: payload.volumes,
      chapters: payload.chapters,
      notes: payload.notes
    })
  }, [cacheKey])

  const refresh = useCallback(async () => {
    if (!enabled) return
    try {
      setState((prev) => ({ ...prev, loading: true, error: null }))
      const data = await fetchBootstrap(apiBaseUrl)
      applyBootstrap(data, false)
    } catch (error: unknown) {
      const cached = loadCache(cacheKey)
      if (cached) {
        applyBootstrap(cached, true)
      } else {
        const message = error instanceof Error ? error.message : '请求失败'
        setState((prev) => ({ ...prev, loading: false, error: message }))
      }
    }
  }, [apiBaseUrl, applyBootstrap, cacheKey, enabled])

  useEffect(() => {
    if (!enabled) {
      setState(initialState)
      return
    }
    // eslint-disable-next-line react-hooks/set-state-in-effect
    refresh()
  }, [enabled, initialState, refresh])

  useEffect(() => {
    if (!state.settings) return
    saveCache(cacheKey, {
      settings: state.settings,
      volumes: state.volumes,
      chapters: state.chapters,
      notes: state.notes
    })
  }, [cacheKey, state.settings, state.volumes, state.chapters, state.notes])

  const updateSettings = useCallback(
    async (next: Settings) => {
      const normalized = normalizeSettings(next)
      const saved = await saveSettings(normalized, normalized.sync.apiBaseUrl)
      const normalizedSaved = normalizeSettings(saved)
      setState((prev) => ({ ...prev, settings: normalizedSaved }))
      saveCache(cacheKey, {
        settings: normalizedSaved,
        volumes: state.volumes,
        chapters: state.chapters,
        notes: state.notes
      })
      return normalizedSaved
    },
    [cacheKey, state.chapters, state.notes, state.volumes]
  )

  const upsertVolume = useCallback(
    async (volume: Volume) => {
      await updateVolume(volume.id, { title: volume.title, orderIndex: volume.orderIndex }, apiBaseUrl)
      setState((prev) => ({
        ...prev,
        volumes: prev.volumes.map((item) => (item.id === volume.id ? volume : item))
      }))
    },
    [apiBaseUrl]
  )

  const createNewVolume = useCallback(
    async (title: string) => {
      const volume: Volume = {
        id: createId(),
        title,
        orderIndex: state.volumes.length
      }
      await createVolume(volume, apiBaseUrl)
      setState((prev) => ({ ...prev, volumes: [...prev.volumes, volume] }))
      return volume
    },
    [apiBaseUrl, state.volumes.length]
  )

  const removeVolume = useCallback(
    async (volumeId: string) => {
      await deleteVolume(volumeId, apiBaseUrl)
      setState((prev) => ({
        ...prev,
        volumes: prev.volumes.filter((item) => item.id !== volumeId),
        chapters: prev.chapters.filter((chapter) => chapter.volumeId !== volumeId)
      }))
    },
    [apiBaseUrl]
  )

  const createNewChapter = useCallback(
    async (volumeId: string, title: string) => {
      const chapter = await createChapter(
        {
          volumeId,
          title,
          status: 'draft',
          tags: [],
          wordCount: 0,
          targetWordCount: 2000,
          orderIndex: state.chapters.filter((item) => item.volumeId === volumeId).length,
          content: [
            { id: createId(), type: 'heading', content: title },
            { id: createId(), type: 'paragraph', content: '从这里开始写作。' }
          ]
        },
        apiBaseUrl
      )
      setState((prev) => ({ ...prev, chapters: [...prev.chapters, chapter] }))
      return chapter
    },
    [apiBaseUrl, state.chapters]
  )

  const createChapterWithContent = useCallback(
    async (draft: Partial<Chapter>) => {
      const chapter = await createChapter(draft, apiBaseUrl)
      setState((prev) => ({ ...prev, chapters: [...prev.chapters, chapter] }))
      return chapter
    },
    [apiBaseUrl]
  )

  const saveChapter = useCallback(
    async (chapter: Chapter) => {
      const saved = await updateChapter(chapter.id, chapter, apiBaseUrl)
      setState((prev) => ({
        ...prev,
        chapters: prev.chapters.map((item) => (item.id === chapter.id ? saved : item))
      }))
      return saved
    },
    [apiBaseUrl]
  )

  const saveChapterContent = useCallback(
    async (
      chapterId: string,
      content: Chapter['content'],
      wordCount: number,
      updatedAt?: string,
      options?: { revision?: number; skipConflict?: boolean }
    ) => {
      const payload: { content: Chapter['content']; wordCount: number; updatedAt?: string; revision?: number } = {
        content,
        wordCount,
        updatedAt
      }
      if (!options?.skipConflict && typeof options?.revision === 'number') {
        payload.revision = options.revision
      }
      const saved = await updateChapterContent(chapterId, payload, apiBaseUrl)
      setState((prev) => ({
        ...prev,
        chapters: prev.chapters.map((item) => (item.id === chapterId ? saved : item))
      }))
      return saved
    },
    [apiBaseUrl]
  )

  const removeChapter = useCallback(
    async (chapterId: string) => {
      await deleteChapter(chapterId, apiBaseUrl)
      setState((prev) => ({ ...prev, chapters: prev.chapters.filter((item) => item.id !== chapterId) }))
    },
    [apiBaseUrl]
  )

  const loadVersions = useCallback(
    async (chapterId: string) => listVersions(chapterId, apiBaseUrl),
    [apiBaseUrl]
  )

  const createChapterVersion = useCallback(
    async (chapter: Chapter) => createVersion(chapter.id, chapter, apiBaseUrl),
    [apiBaseUrl]
  )

  const restoreChapterVersion = useCallback(
    async (chapterId: string, versionId: string) => {
      const restored = await restoreVersion(chapterId, versionId, apiBaseUrl)
      if (restored) {
        setState((prev) => ({
          ...prev,
          chapters: prev.chapters.map((item) => (item.id === chapterId ? restored : item))
        }))
      }
      return restored
    },
    [apiBaseUrl]
  )

  const refreshNotes = useCallback(async () => {
    const notes = await listNotes(apiBaseUrl)
    setState((prev) => ({ ...prev, notes }))
  }, [apiBaseUrl])

  const upsertNoteItem = useCallback(
    async (note: Partial<Note>) => {
      const saved = note.id ? await updateNote(note.id, note, apiBaseUrl) : await saveNote(note, apiBaseUrl)
      await refreshNotes()
      return saved
    },
    [apiBaseUrl, refreshNotes]
  )

  const removeNoteItem = useCallback(
    async (noteId: string) => {
      await deleteNote(noteId, apiBaseUrl)
      await refreshNotes()
    },
    [apiBaseUrl, refreshNotes]
  )

  const loadComments = useCallback(
    async (chapterId: string) => listComments(chapterId, apiBaseUrl),
    [apiBaseUrl]
  )

  const addChapterComment = useCallback(
    async (chapterId: string, author: string, body: string) =>
      addComment(chapterId, { author, body }, apiBaseUrl),
    [apiBaseUrl]
  )

  const volumeMap = useMemo(() => new Map(state.volumes.map((item) => [item.id, item])), [state.volumes])

  return {
    ...state,
    apiBaseUrl,
    volumeMap,
    refresh,
    updateSettings,
    upsertVolume,
    createNewVolume,
    removeVolume,
    createNewChapter,
    createChapterWithContent,
    saveChapter,
    saveChapterContent,
    removeChapter,
    loadVersions,
    createChapterVersion,
    restoreChapterVersion,
    refreshNotes,
    upsertNoteItem,
    removeNoteItem,
    loadComments,
    addChapterComment
  }
}
