import { useCallback, useEffect, useRef, useState } from 'react'
import { createId } from '../../utils/id'
import { createLogEntry, type LogEntry } from '../../utils/logging'
import { nowMs } from '../../utils/time'
import type { Block, Chapter, ChapterVersion } from '../../types'

type ConflictState = {
  chapterId: string
  chapterTitle: string
  localContent: Block[]
  localWordCount: number
  serverUpdatedAt?: string
}

type SaveChapterContent = (
  chapterId: string,
  content: Block[],
  wordCount: number,
  updatedAt?: string,
  options?: { revision?: number; skipConflict?: boolean }
) => Promise<Chapter>

type UseConflictHandlerParams = {
  activeChapter: Chapter | null
  chapters: Chapter[]
  createChapterVersion: (chapter: Chapter) => Promise<ChapterVersion[]>
  refresh: () => Promise<void>
  saveChapterContent: SaveChapterContent
  pushLog: (entry: LogEntry) => void
  onVersionsUpdated?: (versions: ChapterVersion[]) => void
}

const formatDate = () => new Date().toISOString().slice(0, 10)

export const useConflictHandler = ({
  activeChapter,
  chapters,
  createChapterVersion,
  refresh,
  saveChapterContent,
  pushLog,
  onVersionsUpdated
}: UseConflictHandlerParams) => {
  const [conflictState, setConflictState] = useState<ConflictState | null>(null)
  const conflictRef = useRef(false)

  useEffect(() => {
    conflictRef.current = Boolean(conflictState)
  }, [conflictState])

  const openConflictPrompt = useCallback(
    (content: Block[], wordCount: number) => {
      if (!activeChapter) return
      setConflictState((prev) =>
        prev ?? {
          chapterId: activeChapter.id,
          chapterTitle: activeChapter.title,
          localContent: content,
          localWordCount: wordCount,
          serverUpdatedAt: activeChapter.updatedAt
        }
      )
    },
    [activeChapter]
  )

  const handleConflictOverwrite = useCallback(async () => {
    if (!conflictState) return
    const requestId = createId()
    const startedAt = nowMs()
    try {
      await saveChapterContent(
        conflictState.chapterId,
        conflictState.localContent,
        conflictState.localWordCount,
        formatDate(),
        { skipConflict: true }
      )
      pushLog(
        createLogEntry({
          requestId,
          scope: 'conflict',
          status: 'success',
          message: '已覆盖保存',
          durationMs: nowMs() - startedAt,
          payloadSummary: `chapter=${conflictState.chapterId}`
        })
      )
      setConflictState(null)
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : '覆盖保存失败'
      pushLog(
        createLogEntry({
          requestId,
          scope: 'conflict',
          status: 'error',
          message: `覆盖保存失败：${message}`,
          durationMs: nowMs() - startedAt,
          payloadSummary: `chapter=${conflictState.chapterId}`
        })
      )
    }
  }, [conflictState, saveChapterContent, pushLog])

  const handleConflictSaveCopy = useCallback(async () => {
    if (!conflictState) return
    const conflictChapter = chapters.find((chapter) => chapter.id === conflictState.chapterId)
    if (!conflictChapter) {
      setConflictState(null)
      return
    }
    const requestId = createId()
    const startedAt = nowMs()
    const snapshot: Chapter = {
      ...conflictChapter,
      content: conflictState.localContent,
      wordCount: conflictState.localWordCount,
      updatedAt: formatDate()
    }
    try {
      const nextVersions = await createChapterVersion(snapshot)
      pushLog(
        createLogEntry({
          requestId,
          scope: 'conflict',
          status: 'success',
          message: '已另存为版本',
          durationMs: nowMs() - startedAt,
          payloadSummary: `chapter=${conflictState.chapterId} versions=${nextVersions.length}`
        })
      )
      onVersionsUpdated?.(nextVersions)
      setConflictState(null)
      return nextVersions
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : '另存失败'
      pushLog(
        createLogEntry({
          requestId,
          scope: 'conflict',
          status: 'error',
          message: `另存失败：${message}`,
          durationMs: nowMs() - startedAt,
          payloadSummary: `chapter=${conflictState.chapterId}`
        })
      )
      return null
    }
  }, [chapters, conflictState, createChapterVersion, onVersionsUpdated, pushLog])

  const handleConflictReload = useCallback(async () => {
    if (!conflictState) return
    const requestId = createId()
    const startedAt = nowMs()
    try {
      await refresh()
      pushLog(
        createLogEntry({
          requestId,
          scope: 'conflict',
          status: 'success',
          message: '已重新加载最新版本',
          durationMs: nowMs() - startedAt,
          payloadSummary: `chapter=${conflictState.chapterId}`
        })
      )
      setConflictState(null)
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : '重新加载失败'
      pushLog(
        createLogEntry({
          requestId,
          scope: 'conflict',
          status: 'error',
          message: `重新加载失败：${message}`,
          durationMs: nowMs() - startedAt,
          payloadSummary: `chapter=${conflictState.chapterId}`
        })
      )
    }
  }, [conflictState, pushLog, refresh])

  return {
    conflictState,
    conflictRef,
    openConflictPrompt,
    handleConflictOverwrite,
    handleConflictSaveCopy,
    handleConflictReload
  }
}
