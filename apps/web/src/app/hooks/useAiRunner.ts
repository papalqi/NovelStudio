import { useCallback, useEffect, useState } from 'react'
import type { BlockNoteEditor } from '@blocknote/core'
import type { Block, Chapter, Settings, AiRunRecord } from '../../types'
import { createAiRun, listAiRuns } from '../../api'
import { runAiAction, getAiActionLabel, type AiAction } from '../../ai/aiService'
import { createId } from '../../utils/id'
import { getPlainTextFromBlock } from '../../utils/text'
import { nowMs } from '../../utils/time'
import { createLogEntry, type LogEntry } from '../../utils/logging'

const AI_ACTIONS: AiAction[] = [
  'rewrite',
  'expand',
  'shorten',
  'continue',
  'outline',
  'chapterCheck',
  'characterCheck',
  'styleTune',
  'worldbuilding'
]

const isValidAiAction = (value: string): value is AiAction => AI_ACTIONS.includes(value as AiAction)

const isBlockAction = (action: AiAction) =>
  action === 'rewrite' || action === 'expand' || action === 'shorten' || action === 'continue'

type UseAiRunnerArgs = {
  editor: BlockNoteEditor
  settings: Settings | null
  activeChapter: Chapter | null
  selectedBlock: Block | null
  resolvedChapterId: string
  resolvedProviderId: string
  resolvedAgentId: string
  pushLog: (entry: LogEntry) => void
}

export const useAiRunner = ({
  editor,
  settings,
  activeChapter,
  selectedBlock,
  resolvedChapterId,
  resolvedProviderId,
  resolvedAgentId,
  pushLog
}: UseAiRunnerArgs) => {
  const [aiRuns, setAiRuns] = useState<AiRunRecord[]>([])

  const focusAiResult = useCallback(
    (blockId: string | null) => {
      if (!blockId) return
      editor.setTextCursorPosition(blockId, 'end')
      editor.focus()
    },
    [editor]
  )

  const applyAiResult = useCallback(
    (action: AiAction, resultContent: string, targetBlockId?: string): string | null => {
      if (isBlockAction(action)) {
        const fallbackBlock = editor.getTextCursorPosition().block as Block
        const blockId = targetBlockId ?? selectedBlock?.id ?? fallbackBlock?.id
        if (blockId) {
          editor.updateBlock(blockId, { content: resultContent })
          return blockId
        }
        return null
      }

      const currentDoc = editor.document as Block[]
      const newBlockId = createId()
      const newBlock: Block = { id: newBlockId, type: 'paragraph', content: resultContent }
      const lastBlock = currentDoc[currentDoc.length - 1]
      const referenceId = lastBlock?.id ?? currentDoc[0]?.id
      if (referenceId) {
        editor.insertBlocks([newBlock], referenceId, 'after')
        return newBlockId
      }
      editor.replaceBlocks(currentDoc, [newBlock])
      return newBlockId
    },
    [editor, selectedBlock]
  )

  const persistAiRun = useCallback(
    async (record: AiRunRecord) => {
      if (!settings) return
      try {
        const saved = await createAiRun(record, settings.sync.apiBaseUrl)
        setAiRuns((prev) => [saved, ...prev].slice(0, 30))
      } catch (error: unknown) {
        const message = error instanceof Error ? error.message : '保存运行记录失败'
        pushLog(
          createLogEntry({
            scope: 'agent',
            status: 'error',
            message: `保存运行记录失败：${message}`,
            payloadSummary: `run=${record.id}`
          })
        )
      }
    },
    [pushLog, settings]
  )

  useEffect(() => {
    if (!resolvedChapterId) {
      setAiRuns([])
      return
    }
    listAiRuns(resolvedChapterId, settings?.sync.apiBaseUrl)
      .then(setAiRuns)
      .catch((error) => {
        const message = error instanceof Error ? error.message : '获取运行记录失败'
        pushLog(
          createLogEntry({
            scope: 'agent',
            status: 'error',
            message: `获取运行记录失败：${message}`,
            payloadSummary: `chapter=${resolvedChapterId}`
          })
        )
      })
  }, [resolvedChapterId, settings?.sync.apiBaseUrl, pushLog])

  const handleRunAiAction = useCallback(
    async (action: AiAction, requestedBlockId?: string): Promise<boolean> => {
      if (!settings) return false
      const requestId = createId()
      if (!activeChapter) {
        pushLog(
          createLogEntry({
            requestId,
            scope: 'ai',
            status: 'warn',
            message: '请先选择章节',
            payloadSummary: `action=${action}`
          })
        )
        return false
      }
      const currentDoc = editor.document as Block[]
      const scope = isBlockAction(action) ? 'block' : 'chapter'
      const blockFromId = requestedBlockId ? (editor.getBlock(requestedBlockId) as Block | undefined) : undefined
      const targetBlock =
        scope === 'block' ? blockFromId ?? selectedBlock ?? (editor.getTextCursorPosition().block as Block) : null
      const targetBlockId = targetBlock?.id ?? requestedBlockId
      const content =
        scope === 'block'
          ? getPlainTextFromBlock(targetBlock)
          : (editor.blocksToMarkdownLossy(currentDoc) as string)

      if (!content) {
        pushLog(
          createLogEntry({
            requestId,
            scope: 'ai',
            status: 'warn',
            message: '没有可用文本',
            payloadSummary: `action=${action} chapter=${activeChapter.id}`
          })
        )
        return false
      }

      const requestStartedAt = nowMs()
      const runContext = `章节：${activeChapter.title}\n标签：${activeChapter.tags.join(',')}`
      const basePayloadSummary = `action=${action} chapter=${activeChapter.id} provider=${resolvedProviderId || '-'} agent=${resolvedAgentId || '-'} chars=${content.length}`
      const baseRunRequest = {
        action,
        content,
        context: runContext,
        providerId: resolvedProviderId,
        agentId: resolvedAgentId,
        agentSequenceIds: [] as string[],
        temperature: settings.ai.temperature,
        maxTokens: settings.ai.maxTokens,
        requestConfig: settings.ai.request,
        targetBlockId,
        scope
      }

      try {
        pushLog(
          createLogEntry({
            requestId,
            scope: 'ai',
            status: 'info',
            message: `${getAiActionLabel(action)} 处理中`,
            payloadSummary: basePayloadSummary
          })
        )
        const response = await runAiAction({
          action,
          content,
          context: runContext,
          settings,
          providers: settings.providers,
          agents: settings.agents,
          providerId: resolvedProviderId,
          agentId: resolvedAgentId
        })
        const appliedBlockId = applyAiResult(action, response.content, targetBlockId)
        focusAiResult(appliedBlockId)
        const successPayloadSummary = `${basePayloadSummary} retries=${response.meta.retries}`
        pushLog(
          createLogEntry({
            requestId,
            scope: 'ai',
            status: 'success',
            message: `${response.label} 完成`,
            durationMs: nowMs() - requestStartedAt,
            payloadSummary: successPayloadSummary
          })
        )
        pushLog(
          createLogEntry({
            requestId,
            scope: 'agent',
            status: 'success',
            message: `Agent 执行完成`,
            durationMs: nowMs() - requestStartedAt,
            payloadSummary: `agent=${resolvedAgentId || '-'} provider=${resolvedProviderId || '-'} action=${action} retries=${response.meta.retries}`
          })
        )
        void persistAiRun({
          id: createId(),
          createdAt: new Date().toISOString(),
          status: 'success',
          chapterId: activeChapter.id,
          action,
          providerId: resolvedProviderId,
          agentIds: response.agentSequenceIds,
          request: { ...baseRunRequest, agentSequenceIds: response.agentSequenceIds },
          response: { content: response.content, meta: response.meta }
        })
        return true
      } catch (error: unknown) {
        const message = error instanceof Error ? error.message : 'AI 调用失败'
        const retryCount =
          typeof (error as { retries?: number }).retries === 'number' ? (error as { retries: number }).retries : 0
        const attempts =
          typeof (error as { attempts?: number }).attempts === 'number'
            ? (error as { attempts: number }).attempts
            : retryCount + 1
        const failurePayloadSummary = `${basePayloadSummary} retries=${retryCount}`
        pushLog(
          createLogEntry({
            requestId,
            scope: 'ai',
            status: 'error',
            message: `AI 失败：${message}`,
            durationMs: nowMs() - requestStartedAt,
            payloadSummary: failurePayloadSummary
          })
        )
        pushLog(
          createLogEntry({
            requestId,
            scope: 'agent',
            status: 'error',
            message: `Agent 执行失败：${message}`,
            durationMs: nowMs() - requestStartedAt,
            payloadSummary: `agent=${resolvedAgentId || '-'} provider=${resolvedProviderId || '-'} action=${action} retries=${retryCount}`
          })
        )
        const fallbackAgentIds = resolvedAgentId ? [resolvedAgentId] : []
        void persistAiRun({
          id: createId(),
          createdAt: new Date().toISOString(),
          status: 'error',
          chapterId: activeChapter.id,
          action,
          providerId: resolvedProviderId,
          agentIds: fallbackAgentIds,
          request: { ...baseRunRequest, agentSequenceIds: fallbackAgentIds },
          response: { error: message, meta: { retries: retryCount, attempts } }
        })
        return false
      }
    },
    [
      activeChapter,
      applyAiResult,
      editor,
      focusAiResult,
      persistAiRun,
      pushLog,
      resolvedAgentId,
      resolvedProviderId,
      selectedBlock,
      settings
    ]
  )

  const handleReplayRun = useCallback(
    async (run: AiRunRecord) => {
      if (!settings) return
      if (!isValidAiAction(run.request.action)) {
        pushLog(
          createLogEntry({
            scope: 'agent',
            status: 'error',
            message: '无法重放：不支持的 AI 动作',
            payloadSummary: `action=${run.request.action}`
          })
        )
        return
      }

      const requestId = createId()
      const requestStartedAt = nowMs()
      const action = run.request.action
      const replaySettings: Settings = {
        ...settings,
        ai: {
          ...settings.ai,
          temperature: run.request.temperature,
          maxTokens: run.request.maxTokens,
          request: run.request.requestConfig,
          defaultProviderId: run.request.providerId ?? settings.ai.defaultProviderId,
          defaultAgentId: run.request.agentId ?? settings.ai.defaultAgentId
        }
      }
      const basePayloadSummary = `action=${action} replay=true provider=${run.request.providerId || '-'} agent=${run.request.agentId || '-'} chars=${run.request.content.length}`

      try {
        pushLog(
          createLogEntry({
            requestId,
            scope: 'ai',
            status: 'info',
            message: `${getAiActionLabel(action)} 重放中`,
            payloadSummary: basePayloadSummary
          })
        )
        const response = await runAiAction({
          action,
          content: run.request.content,
          context: run.request.context,
          settings: replaySettings,
          providers: replaySettings.providers,
          agents: replaySettings.agents,
          providerId: run.request.providerId,
          agentId: run.request.agentId,
          agentSequenceIds: run.request.agentSequenceIds
        })

        const appliedBlockId = applyAiResult(action, response.content, run.request.targetBlockId)
        focusAiResult(appliedBlockId)
        const successPayloadSummary = `${basePayloadSummary} retries=${response.meta.retries}`
        pushLog(
          createLogEntry({
            requestId,
            scope: 'ai',
            status: 'success',
            message: `${response.label} 重放完成`,
            durationMs: nowMs() - requestStartedAt,
            payloadSummary: successPayloadSummary
          })
        )
        pushLog(
          createLogEntry({
            requestId,
            scope: 'agent',
            status: 'success',
            message: `Agent 重放完成`,
            durationMs: nowMs() - requestStartedAt,
            payloadSummary: `agent=${run.request.agentId || '-'} provider=${run.request.providerId || '-'} action=${action} retries=${response.meta.retries}`
          })
        )
        void persistAiRun({
          id: createId(),
          createdAt: new Date().toISOString(),
          status: 'success',
          chapterId: run.chapterId ?? activeChapter?.id,
          action,
          providerId: run.request.providerId,
          agentIds: response.agentSequenceIds,
          request: { ...run.request, agentSequenceIds: response.agentSequenceIds },
          response: { content: response.content, meta: response.meta }
        })
      } catch (error: unknown) {
        const message = error instanceof Error ? error.message : 'AI 调用失败'
        const retryCount =
          typeof (error as { retries?: number }).retries === 'number' ? (error as { retries: number }).retries : 0
        const attempts =
          typeof (error as { attempts?: number }).attempts === 'number'
            ? (error as { attempts: number }).attempts
            : retryCount + 1
        const failurePayloadSummary = `${basePayloadSummary} retries=${retryCount}`
        pushLog(
          createLogEntry({
            requestId,
            scope: 'ai',
            status: 'error',
            message: `AI 重放失败：${message}`,
            durationMs: nowMs() - requestStartedAt,
            payloadSummary: failurePayloadSummary
          })
        )
        pushLog(
          createLogEntry({
            requestId,
            scope: 'agent',
            status: 'error',
            message: `Agent 重放失败：${message}`,
            durationMs: nowMs() - requestStartedAt,
            payloadSummary: `agent=${run.request.agentId || '-'} provider=${run.request.providerId || '-'} action=${action} retries=${retryCount}`
          })
        )
        void persistAiRun({
          id: createId(),
          createdAt: new Date().toISOString(),
          status: 'error',
          chapterId: run.chapterId ?? activeChapter?.id,
          action,
          providerId: run.request.providerId,
          agentIds: run.request.agentSequenceIds,
          request: run.request,
          response: { error: message, meta: { retries: retryCount, attempts } }
        })
      }
    },
    [activeChapter?.id, applyAiResult, focusAiResult, persistAiRun, pushLog, settings]
  )

  return {
    aiRuns,
    handleRunAiAction,
    handleReplayRun
  }
}
