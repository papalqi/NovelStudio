import { useCallback } from 'react'
import { cloneBlocks } from '../../utils/blocks'
import { createId } from '../../utils/id'
import { estimateWordCount } from '../../utils/text'
import type { Block, Chapter } from '../../types'

type CreateChapterWithContent = (draft: Partial<Chapter>) => Promise<Chapter>

type UseChapterBulkActionsParams = {
  chapters: Chapter[]
  createChapterWithContent: CreateChapterWithContent
  saveChapter: (chapter: Chapter) => Promise<Chapter>
  removeChapter: (id: string) => Promise<void>
}

export const useChapterBulkActions = ({
  chapters,
  createChapterWithContent,
  saveChapter,
  removeChapter
}: UseChapterBulkActionsParams) => {
  const handleBatchCopyChapters = useCallback(
    async (chapterIds: string[], targetVolumeId: string) => {
      if (!targetVolumeId || chapterIds.length === 0) return
      const selected = chapters
        .filter((chapter) => chapterIds.includes(chapter.id))
        .sort((a, b) => a.orderIndex - b.orderIndex)
      const targetChapters = chapters.filter((chapter) => chapter.volumeId === targetVolumeId)
      let nextIndex = targetChapters.reduce((max, chapter) => Math.max(max, chapter.orderIndex), -1) + 1
      let copyIndex = 1
      for (const chapter of selected) {
        const suffix = selected.length > 1 ? ` ${copyIndex}` : ''
        await createChapterWithContent({
          volumeId: targetVolumeId,
          title: `${chapter.title} 副本${suffix}`,
          status: chapter.status,
          tags: [...chapter.tags],
          wordCount: chapter.wordCount,
          targetWordCount: chapter.targetWordCount,
          orderIndex: nextIndex,
          content: cloneBlocks(chapter.content)
        })
        nextIndex += 1
        copyIndex += 1
      }
    },
    [chapters, createChapterWithContent]
  )

  const handleBatchMoveChapters = useCallback(
    async (chapterIds: string[], targetVolumeId: string) => {
      if (!targetVolumeId || chapterIds.length === 0) return
      const selected = chapters
        .filter((chapter) => chapterIds.includes(chapter.id))
        .sort((a, b) => a.orderIndex - b.orderIndex)
      const targetChapters = chapters.filter(
        (chapter) => chapter.volumeId === targetVolumeId && !chapterIds.includes(chapter.id)
      )
      let nextIndex = targetChapters.reduce((max, chapter) => Math.max(max, chapter.orderIndex), -1) + 1
      for (const chapter of selected) {
        await saveChapter({ ...chapter, volumeId: targetVolumeId, orderIndex: nextIndex })
        nextIndex += 1
      }
    },
    [chapters, saveChapter]
  )

  const handleBatchMergeChapters = useCallback(
    async (chapterIds: string[], targetVolumeId: string, title: string) => {
      if (!targetVolumeId || chapterIds.length === 0) return
      const selected = chapters
        .filter((chapter) => chapterIds.includes(chapter.id))
        .sort((a, b) => (a.volumeId === b.volumeId ? a.orderIndex - b.orderIndex : a.volumeId.localeCompare(b.volumeId)))
      if (selected.length < 2) return
      const mergedBlocks: Block[] = []
      selected.forEach((chapter, index) => {
        mergedBlocks.push({ id: createId(), type: 'heading', content: chapter.title })
        mergedBlocks.push(...cloneBlocks(chapter.content))
        if (index < selected.length - 1) {
          mergedBlocks.push({ id: createId(), type: 'paragraph', content: '' })
        }
      })
      const mergedTags = Array.from(new Set(selected.flatMap((chapter) => chapter.tags)))
      const base = selected[0]
      const wordCount = estimateWordCount(mergedBlocks)
      const targetChapters = chapters.filter((chapter) => chapter.volumeId === targetVolumeId)
      const nextIndex = targetChapters.reduce((max, chapter) => Math.max(max, chapter.orderIndex), -1) + 1
      await createChapterWithContent({
        volumeId: targetVolumeId,
        title: title.trim() || `${base.title} 合并`,
        status: base.status,
        tags: mergedTags,
        wordCount,
        targetWordCount: base.targetWordCount,
        orderIndex: nextIndex,
        content: mergedBlocks
      })
      for (const chapter of selected) {
        await removeChapter(chapter.id)
      }
    },
    [chapters, createChapterWithContent, removeChapter]
  )

  return {
    handleBatchCopyChapters,
    handleBatchMoveChapters,
    handleBatchMergeChapters
  }
}
