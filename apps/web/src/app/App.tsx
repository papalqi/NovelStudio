import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useCreateBlockNote } from '@blocknote/react'
import { TopBar } from './components/TopBar'
import { Explorer } from './components/Explorer'
import { EditorPane } from './components/EditorPane'
import { RightPanel } from './components/RightPanel'
import { SettingsPage } from './components/SettingsPage'
import { AuthPage } from './components/AuthPage'
import { PreviewModal } from './components/PreviewModal'
import { ConflictModal } from './components/ConflictModal'
import { KnowledgeBasePage } from './components/KnowledgeBasePage'
import { useAppData } from './hooks/useAppData'
import { useConflictHandler } from './hooks/useConflictHandler'
import { useChapterBulkActions } from './hooks/useChapterBulkActions'
import { useAiRunner } from './hooks/useAiRunner'
import { debounce } from '../utils/debounce'
import { createId } from '../utils/id'
import { estimateWordCount, getPlainTextFromBlock, getPlainTextFromDoc } from '../utils/text'
import { nowMs } from '../utils/time'
import { createLogEntry, type LogEntry } from '../utils/logging'
import { loginUser, registerUser, fetchAuthProfile, logoutUser, clearUserWorkspace, runAiCompletion } from '../api'
import type { Chapter, ChapterStatus, Settings, ChapterVersion, Comment, Block, Note } from '../types'
import {
  getAuthToken,
  setAuthToken,
  clearAuthToken,
  getStoredAuthUser,
  setStoredAuthUser,
  clearStoredAuthUser
} from '../utils/auth'
import { validateJsonSchema } from '../utils/jsonSchema'
import {
  buildNoteSnapshot,
  buildReferenceHeader,
  parseReferenceId,
  NOTE_AI_SCHEMAS,
  NOTE_FIELD_DEFS,
  NOTE_TYPE_LABELS
} from './utils/knowledge'
import './App.css'

type AppPage = 'editor' | 'settings' | 'knowledge'

const formatDate = () => new Date().toISOString().slice(0, 10)

export const App = () => {
  const editor = useCreateBlockNote()
  const [authToken, setAuthTokenState] = useState(() => getAuthToken())
  const [authUser, setAuthUser] = useState(() => getStoredAuthUser())
  const [authChecking, setAuthChecking] = useState(true)
  const [authBusy, setAuthBusy] = useState(false)
  const [authError, setAuthError] = useState<string | null>(null)

  useEffect(() => {
    let active = true
    if (!authToken) {
      setAuthChecking(false)
      setAuthUser(null)
      clearStoredAuthUser()
      return () => {
        active = false
      }
    }
    setAuthChecking(true)
    fetchAuthProfile()
      .then((profile) => {
        if (!active) return
        setAuthUser(profile)
        setStoredAuthUser(profile)
      })
      .catch(() => {
        if (!active) return
        clearAuthToken()
        clearStoredAuthUser()
        setAuthTokenState('')
        setAuthUser(null)
      })
      .finally(() => {
        if (!active) return
        setAuthChecking(false)
      })
    return () => {
      active = false
    }
  }, [authToken])

  const isAuthenticated = Boolean(authToken && authUser)
  const dataEnabled = isAuthenticated && !authChecking

  const {
    settings,
    volumes,
    chapters,
    notes,
    loading,
    offline,
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
  } = useAppData({ enabled: dataEnabled, userId: authUser?.userId })

  const [activeVolumeId, setActiveVolumeId] = useState('')
  const [activeChapterId, setActiveChapterId] = useState('')
  const [selectedBlock, setSelectedBlock] = useState<Block | null>(null)
  const [versions, setVersions] = useState<ChapterVersion[]>([])
  const [comments, setComments] = useState<Comment[]>([])
  const [activeProviderId, setActiveProviderId] = useState('')
  const [activeAgentId, setActiveAgentId] = useState('')
  const [aiLogs, setAiLogs] = useState<LogEntry[]>([])
  const [diffVersion, setDiffVersion] = useState<ChapterVersion | null>(null)
  const [currentPage, setCurrentPage] = useState<AppPage>('editor')
  const [previewOpen, setPreviewOpen] = useState(false)

  const pushLog = useCallback((entry: LogEntry) => {
    setAiLogs((prev) => [entry, ...prev].slice(0, 12))
  }, [])

  const switchingRef = useRef(false)

  const resolvedVolumeId = useMemo(() => {
    if (volumes.find((volume) => volume.id === activeVolumeId)) return activeVolumeId
    return volumes[0]?.id ?? ''
  }, [volumes, activeVolumeId])

  const resolvedChapterId = useMemo(() => {
    if (chapters.find((chapter) => chapter.id === activeChapterId)) return activeChapterId
    return chapters[0]?.id ?? ''
  }, [chapters, activeChapterId])

  const activeChapter = useMemo(
    () => chapters.find((chapter) => chapter.id === resolvedChapterId) ?? null,
    [chapters, resolvedChapterId]
  )

  useEffect(() => {
    if (!settings) return
    document.documentElement.style.setProperty('--app-font', settings.ui.fontFamily)
    document.body.style.fontFamily = settings.ui.fontFamily
    document.documentElement.dataset.theme = settings.ui.theme
  }, [settings])

  const resolvedProviderId = useMemo(() => {
    const providerIds = settings?.providers ?? []
    const active = providerIds.find((provider) => provider.id === activeProviderId)
    if (active) return active.id
    const defaultProvider = providerIds.find((provider) => provider.id === settings?.ai.defaultProviderId)
    return defaultProvider?.id ?? providerIds[0]?.id ?? ''
  }, [settings, activeProviderId])

  const resolvedAgentId = useMemo(() => {
    const agentIds = settings?.agents ?? []
    const active = agentIds.find((agent) => agent.id === activeAgentId)
    if (active) return active.id
    const defaultAgent = agentIds.find((agent) => agent.id === settings?.ai.defaultAgentId)
    return defaultAgent?.id ?? agentIds[0]?.id ?? ''
  }, [settings, activeAgentId])

  useEffect(() => {
    if (!activeChapter) return
    switchingRef.current = true
    editor.replaceBlocks(editor.document, activeChapter.content ?? [])
    switchingRef.current = false
  }, [activeChapter, editor])

  // Load notes data for Knowledge Base Page
  useEffect(() => {
    if (!dataEnabled) return
    refreshNotes()
  }, [dataEnabled, refreshNotes])

  const handleToggleTheme = () => {
    if (!settings) return
    const newTheme = settings.ui.theme === 'light' ? 'dark' : 'light'
    updateSettings({ ...settings, ui: { ...settings.ui, theme: newTheme } })
  }

  const handleLogin = useCallback(
    async (payload: { username: string; password: string }) => {
      setAuthError(null)
      setAuthBusy(true)
      try {
        const response = await loginUser(payload)
        setAuthTokenState(response.token)
        setAuthToken(response.token)
        const profile = { userId: response.userId, username: response.username }
        setAuthUser(profile)
        setStoredAuthUser(profile)
      } catch (error) {
        const message = error instanceof Error ? error.message : '登录失败'
        setAuthError(message)
      } finally {
        setAuthBusy(false)
      }
    },
    []
  )

  const handleRegister = useCallback(
    async (payload: { username: string; password: string }) => {
      setAuthError(null)
      setAuthBusy(true)
      try {
        const response = await registerUser(payload)
        setAuthTokenState(response.token)
        setAuthToken(response.token)
        const profile = { userId: response.userId, username: response.username }
        setAuthUser(profile)
        setStoredAuthUser(profile)
      } catch (error) {
        const message = error instanceof Error ? error.message : '注册失败'
        setAuthError(message)
      } finally {
        setAuthBusy(false)
      }
    },
    []
  )

  const handleLogout = useCallback(async () => {
    setAuthBusy(true)
    try {
      await logoutUser()
    } catch {
      // ignore logout errors
    } finally {
      clearAuthToken()
      clearStoredAuthUser()
      setAuthTokenState('')
      setAuthUser(null)
      setAuthBusy(false)
      setCurrentPage('editor')
    }
  }, [])

  const handleClearWorkspace = useCallback(async () => {
    await clearUserWorkspace(settings?.sync.apiBaseUrl)
    setActiveVolumeId('')
    setActiveChapterId('')
    setSelectedBlock(null)
    setVersions([])
    setComments([])
    await refresh()
  }, [refresh, settings?.sync.apiBaseUrl])

  const handleSaveNote = useCallback(
    async (note: Partial<Note>) => {
      const requestId = createId()
      const startedAt = nowMs()
      const actionLabel = note.id ? '更新资料卡' : '创建资料卡'
      try {
        const saved = await upsertNoteItem(note)
        pushLog(
          createLogEntry({
            requestId,
            scope: 'knowledge',
            status: 'success',
            message: `${actionLabel}成功`,
            durationMs: nowMs() - startedAt,
            payloadSummary: `note=${saved?.id ?? note.id ?? 'new'} type=${note.type ?? '-'}`
          })
        )
        return saved
      } catch (error: unknown) {
        const message = error instanceof Error ? error.message : '资料卡保存失败'
        pushLog(
          createLogEntry({
            requestId,
            scope: 'knowledge',
            status: 'error',
            message: `${actionLabel}失败：${message}`,
            durationMs: nowMs() - startedAt,
            payloadSummary: `note=${note.id ?? 'new'} type=${note.type ?? '-'}`
          })
        )
        throw error
      }
    },
    [pushLog, upsertNoteItem]
  )

  const handleDeleteNote = useCallback(
    async (noteId: string) => {
      const requestId = createId()
      const startedAt = nowMs()
      try {
        await removeNoteItem(noteId)
        pushLog(
          createLogEntry({
            requestId,
            scope: 'knowledge',
            status: 'success',
            message: '删除资料卡成功',
            durationMs: nowMs() - startedAt,
            payloadSummary: `note=${noteId}`
          })
        )
      } catch (error: unknown) {
        const message = error instanceof Error ? error.message : '删除资料卡失败'
        pushLog(
          createLogEntry({
            requestId,
            scope: 'knowledge',
            status: 'error',
            message: `删除资料卡失败：${message}`,
            durationMs: nowMs() - startedAt,
            payloadSummary: `note=${noteId}`
          })
        )
        throw error
      }
    },
    [pushLog, removeNoteItem]
  )

  const handleInsertNote = (note: Note) => {
    if (!activeChapter) {
      pushLog(
        createLogEntry({
          scope: 'system',
          status: 'warn',
          message: '请先选择章节再插入资料卡',
          payloadSummary: `note=${note.id}`
        })
      )
      return
    }
    const description = buildNoteSnapshot(note)
    const headerLabel = buildReferenceHeader(note)
    const blocks: Block[] = [
      { id: createId(), type: 'heading', content: headerLabel },
      { id: createId(), type: 'paragraph', content: description }
    ]
    const currentDoc = editor.document as Block[]
    const cursorBlock = editor.getTextCursorPosition().block as Block
    const referenceId = cursorBlock?.id ?? currentDoc[currentDoc.length - 1]?.id
    if (referenceId) {
      editor.insertBlocks(blocks, referenceId, 'after')
    }
    pushLog(
      createLogEntry({
        scope: 'system',
        status: 'success',
        message: '资料卡已插入到章节',
        payloadSummary: `chapter=${activeChapter.id} note=${note.id}`
      })
    )
  }

  const handleRefreshReferences = () => {
    if (!activeChapter) {
      pushLog(
        createLogEntry({
          scope: 'knowledge',
          status: 'warn',
          message: '请先选择章节再刷新引用',
          payloadSummary: 'refresh=skipped'
        })
      )
      return
    }
    const currentDoc = editor.document as Block[]
    let refreshed = 0
    let updated = 0
    currentDoc.forEach((block, index) => {
      if (block.type !== 'heading') return
      const headerText = getPlainTextFromBlock(block)
      const noteId = parseReferenceId(headerText)
      if (!noteId) return
      const note = notes.find((item) => item.id === noteId)
      if (!note) return
      const nextBlock = currentDoc[index + 1]
      const header = buildReferenceHeader(note)
      const snapshot = buildNoteSnapshot(note)
      const nextText = getPlainTextFromBlock(nextBlock)
      const headerChanged = headerText !== header
      const snapshotChanged = nextBlock?.type === 'paragraph' && nextText !== snapshot
      if (headerChanged) {
        editor.updateBlock(block.id, { content: header })
      }
      if (snapshotChanged && nextBlock) {
        editor.updateBlock(nextBlock.id, { content: snapshot })
      }
      if (headerChanged || snapshotChanged) {
        updated += 1
      }
      refreshed += 1
    })
    if (updated > 0) {
      handleContentChange()
    }
    pushLog(
      createLogEntry({
        scope: 'knowledge',
        status: 'success',
        message: updated > 0 ? `已刷新 ${updated} 条引用` : '未发现可刷新引用',
        payloadSummary: `chapter=${activeChapter.id}`
      })
    )
  }

  const handleGenerateNote = useCallback(
    async (payload: { type: Note['type']; title: string; content?: Record<string, unknown> }) => {
      if (!settings) throw new Error('设置未加载')
      if (payload.type !== 'character' && payload.type !== 'location') {
        throw new Error('仅支持角色/地点卡片生成')
      }
      const provider =
        settings.providers.find((item) => item.id === resolvedProviderId) ?? settings.providers[0]
      if (!provider) {
        throw new Error('未配置 Provider')
      }
      const agent = settings.agents.find((item) => item.id === resolvedAgentId) ?? settings.agents[0]
      const schema = NOTE_AI_SCHEMAS[payload.type]
      const schemaText = JSON.stringify(schema, null, 2)
      const typeLabel = NOTE_TYPE_LABELS[payload.type]
      const fieldLabels = NOTE_FIELD_DEFS[payload.type].map((field) => `${field.key}(${field.label})`).join('、')
      const existingEntries = Object.entries(payload.content ?? {}).filter(
        ([, value]) => typeof value === 'string' && value.trim().length > 0
      )
      const existingText =
        existingEntries.length > 0 ? `\n\n已有信息：\n${JSON.stringify(Object.fromEntries(existingEntries), null, 2)}` : ''

      const systemPrompt = `${agent?.systemPrompt ?? '你是网络小说写作助手。'}\n\n输出必须严格为 JSON，且符合以下 JSON Schema：\n${schemaText}\n只输出 JSON，不要添加解释。`
      const userPrompt = `请为${typeLabel}「${payload.title}」生成资料卡字段。字段包含：${fieldLabels}。${existingText}\n\n要求：语言简洁、有画面感，信息可信。`

      const requestId = createId()
      const startedAt = nowMs()
      pushLog(
        createLogEntry({
          requestId,
          scope: 'knowledge',
          status: 'info',
          message: `AI 生成${typeLabel}资料卡中`,
          payloadSummary: `type=${payload.type} title=${payload.title} provider=${provider.id} agent=${agent?.id ?? '-'}`
        })
      )

      try {
        const response = await runAiCompletion(
          {
            provider: {
              baseUrl: provider.baseUrl,
              token: provider.token,
              model: provider.model
            },
            messages: [
              { role: 'system', content: systemPrompt },
              { role: 'user', content: userPrompt }
            ],
            temperature: settings.ai.temperature,
            maxTokens: settings.ai.maxTokens
          },
          settings.sync.apiBaseUrl,
          settings.ai.request
        )

        const parsed = JSON.parse(response.content) as Record<string, unknown>
        const validation = validateJsonSchema(schema, parsed)
        if (!validation.valid) {
          throw new Error(validation.errors[0] ?? 'AI 输出未通过 Schema 校验')
        }
        const normalized: Record<string, string> = {}
        NOTE_FIELD_DEFS[payload.type].forEach((field) => {
          const value = parsed[field.key]
          if (typeof value === 'string') {
            normalized[field.key] = value.trim()
          } else if (value !== undefined && value !== null) {
            normalized[field.key] = String(value)
          }
        })
        pushLog(
          createLogEntry({
            requestId,
            scope: 'knowledge',
            status: 'success',
            message: `AI 生成${typeLabel}资料卡完成`,
            durationMs: nowMs() - startedAt,
            payloadSummary: `type=${payload.type} title=${payload.title} retries=${response.meta.retries}`
          })
        )
        return normalized
      } catch (error: unknown) {
        const message = error instanceof Error ? error.message : 'AI 生成失败'
        pushLog(
          createLogEntry({
            requestId,
            scope: 'knowledge',
            status: 'error',
            message: `AI 生成${typeLabel}资料卡失败：${message}`,
            durationMs: nowMs() - startedAt,
            payloadSummary: `type=${payload.type} title=${payload.title}`
          })
        )
        throw error
      }
    },
    [pushLog, resolvedAgentId, resolvedProviderId, settings]
  )

  const { conflictState, conflictRef, openConflictPrompt, handleConflictOverwrite, handleConflictSaveCopy, handleConflictReload } =
    useConflictHandler({
      activeChapter,
      chapters,
      createChapterVersion,
      refresh,
      saveChapterContent,
      pushLog,
      onVersionsUpdated: setVersions
    })

  const { handleBatchCopyChapters, handleBatchMoveChapters, handleBatchMergeChapters } = useChapterBulkActions({
    chapters,
    createChapterWithContent,
    saveChapter,
    removeChapter
  })

  const { aiRuns, handleRunAiAction, handleReplayRun } = useAiRunner({
    editor,
    settings,
    activeChapter,
    selectedBlock,
    resolvedChapterId,
    resolvedProviderId,
    resolvedAgentId,
    pushLog
  })

  useEffect(() => {
    if (!resolvedChapterId) return
    loadVersions(resolvedChapterId).then(setVersions)
    loadComments(resolvedChapterId).then(setComments)
  }, [resolvedChapterId, loadVersions, loadComments])

  useEffect(() => {
    setDiffVersion(null)
  }, [resolvedChapterId])

  const debouncedSave = useMemo(() => {
    return debounce((content: Block[]) => {
      if (conflictRef.current) return
      if (!activeChapter || !settings?.autosave.enabled) return
      const requestId = createId()
      const startedAt = nowMs()
      const wordCount = estimateWordCount(content)
      void saveChapterContent(activeChapter.id, content, wordCount, formatDate(), { revision: activeChapter.revision })
        .then(() => {
          pushLog(
            createLogEntry({
              requestId,
              scope: 'autosave',
              status: 'success',
              message: '自动保存成功',
              durationMs: nowMs() - startedAt,
              payloadSummary: `chapter=${activeChapter.id} words=${wordCount}`
            })
          )
        })
        .catch((error) => {
          const message = error instanceof Error ? error.message : '保存失败'
          pushLog(
            createLogEntry({
              requestId,
              scope: 'autosave',
              status: 'error',
              message: `保存失败：${message}`,
              durationMs: nowMs() - startedAt,
              payloadSummary: `chapter=${activeChapter.id} words=${wordCount}`
            })
          )
          if (/409|conflict|冲突/i.test(message)) {
            pushLog(
              createLogEntry({
                requestId,
                scope: 'conflict',
                status: 'warn',
                message: '检测到可能的保存冲突',
                durationMs: nowMs() - startedAt,
                payloadSummary: `chapter=${activeChapter.id}`
              })
            )
            openConflictPrompt(content, wordCount)
          }
        })
    }, settings?.autosave.intervalMs ?? 1200)
  }, [activeChapter, openConflictPrompt, saveChapterContent, settings, pushLog])

  const handleContentChange = () => {
    if (switchingRef.current) return
    if (conflictRef.current) return
    const content = editor.document as Block[]
    if (!settings?.autosave.enabled) return
    debouncedSave(content)
  }

  const handleSelectionChange = () => {
    const currentBlock = editor.getTextCursorPosition().block as Block
    setSelectedBlock(currentBlock ?? null)
  }

  const handleOpenDiff = (versionId: string) => {
    const target = versions.find((version) => version.id === versionId)
    if (!target) return
    const requestId = createId()
    setDiffVersion(target)
    pushLog(
      createLogEntry({
        requestId,
        scope: 'diff',
        status: 'info',
        message: '进入版本对比',
        payloadSummary: `chapter=${resolvedChapterId} version=${versionId}`
      })
    )
  }

  const handleExitDiff = () => {
    if (!diffVersion) return
    const requestId = createId()
    setDiffVersion(null)
    pushLog(
      createLogEntry({
        requestId,
        scope: 'diff',
        status: 'info',
        message: '退出版本对比',
        payloadSummary: `chapter=${resolvedChapterId} version=${diffVersion.id}`
      })
    )
  }

  const handleChapterMetaUpdate = (patch: Partial<Chapter>) => {
    if (!activeChapter) return
    const next = { ...activeChapter, ...patch, updatedAt: formatDate() }
    void saveChapter(next)
  }

  const handleReorderChapter = (volumeId: string, orderedIds: string[]) => {
    const reordered = chapters.map((chapter) => {
      if (chapter.volumeId !== volumeId) return chapter
      const orderIndex = orderedIds.indexOf(chapter.id)
      return { ...chapter, orderIndex }
    })
    reordered
      .filter((chapter) => chapter.volumeId === volumeId)
      .forEach((chapter) => void saveChapter(chapter))
  }

  const handleMoveVolume = (volumeId: string, direction: 'up' | 'down') => {
    const ordered = [...volumes].sort((a, b) => a.orderIndex - b.orderIndex)
    const index = ordered.findIndex((volume) => volume.id === volumeId)
    if (index < 0) return
    const targetIndex = direction === 'up' ? index - 1 : index + 1
    if (targetIndex < 0 || targetIndex >= ordered.length) return
    const current = ordered[index]
    const target = ordered[targetIndex]
    void upsertVolume({ ...current, orderIndex: targetIndex })
    void upsertVolume({ ...target, orderIndex: index })
  }

  const handleManualSync = () => {
    if (!activeChapter) return
    const content = editor.document as Block[]
    const wordCount = estimateWordCount(content)
    void saveChapterContent(activeChapter.id, content, wordCount, formatDate(), { revision: activeChapter.revision })
      .then(() => {
        pushLog(
          createLogEntry({
            scope: 'system',
            status: 'success',
            message: '手动同步成功',
            payloadSummary: `chapter=${activeChapter.id} words=${wordCount}`
          })
        )
      })
      .catch((error) => {
        const message = error instanceof Error ? error.message : '同步失败'
        pushLog(
          createLogEntry({
            scope: 'system',
            status: 'error',
            message: `手动同步失败：${message}`,
            payloadSummary: `chapter=${activeChapter.id}`
          })
        )
        if (/409|conflict|冲突/i.test(message)) {
          openConflictPrompt(content, wordCount)
        }
      })
  }

  const previewHtml = useMemo(() => {
    if (!activeChapter || !previewOpen) return ''
    return editor.blocksToHTMLLossy(editor.document as Block[])
  }, [activeChapter, editor, previewOpen])

  const previewMarkdown = useMemo(() => {
    if (!activeChapter || !previewOpen) return ''
    return editor.blocksToMarkdownLossy(editor.document as Block[])
  }, [activeChapter, editor, previewOpen])

  const previewText = useMemo(() => {
    if (!activeChapter || !previewOpen) return ''
    return getPlainTextFromDoc(editor.document as Block[])
  }, [activeChapter, editor, previewOpen])

  if (authChecking) {
    return <div className="app-loading" data-testid="auth-loading">正在验证登录...</div>
  }

  if (!isAuthenticated) {
    return (
      <AuthPage
        loading={authBusy}
        error={authError}
        onLogin={handleLogin}
        onRegister={handleRegister}
      />
    )
  }

  if (loading) {
    return <div className="app-shell">加载中...</div>
  }

  return (
    <div className="app-shell">
      <TopBar
        authorName={settings?.profile.authorName ?? '匿名作者'}
        offline={offline}
        onOpenSettings={() => setCurrentPage('settings')}
        onOpenPreview={() => setPreviewOpen(true)}
        onManualSync={handleManualSync}
        autosaveEnabled={settings?.autosave.enabled ?? true}
        onOpenKnowledgeBase={() => setCurrentPage('knowledge')}
        theme={settings?.ui.theme ?? 'light'}
        onToggleTheme={handleToggleTheme}
      />

      {currentPage === 'editor' && (
        <>
          <main className="workspace">
            <Explorer
              volumes={volumes}
              chapters={chapters}
              activeVolumeId={resolvedVolumeId}
              activeChapterId={resolvedChapterId}
              onSelectVolume={setActiveVolumeId}
              onSelectChapter={setActiveChapterId}
              onCreateChapter={(volumeId) =>
                createNewChapter(volumeId, `第${chapters.length + 1}章 新章节`).then((chapter) =>
                  setActiveChapterId(chapter.id)
                )
              }
              onCreateVolume={() =>
                createNewVolume(`新卷 ${volumes.length + 1}`).then((volume) => setActiveVolumeId(volume.id))
              }
              onRenameVolume={(id, title) => {
                const volume = volumes.find((item) => item.id === id)
                if (volume) upsertVolume({ ...volume, title })
              }}
              onDeleteVolume={removeVolume}
              onMoveVolume={handleMoveVolume}
              onRenameChapter={(id, title) => {
                const chapter = chapters.find((item) => item.id === id)
                if (chapter) saveChapter({ ...chapter, title })
              }}
              onDeleteChapter={removeChapter}
              onReorderChapter={handleReorderChapter}
              onBatchCopyChapters={handleBatchCopyChapters}
              onBatchMoveChapters={handleBatchMoveChapters}
              onBatchMergeChapters={handleBatchMergeChapters}
            />

            <EditorPane
              editor={editor}
              chapter={activeChapter}
              diffVersion={diffVersion}
              onExitDiff={handleExitDiff}
              onRunAiAction={handleRunAiAction}
              selectedBlock={selectedBlock}
              onTitleChange={(title) => handleChapterMetaUpdate({ title })}
              onStatusChange={(status: ChapterStatus) => handleChapterMetaUpdate({ status })}
              onTagsChange={(tags) => handleChapterMetaUpdate({ tags })}
              onTargetWordCountChange={(target) => handleChapterMetaUpdate({ targetWordCount: target })}
              onCreateVersion={() => {
                if (!activeChapter) return
                const requestId = createId()
                const startedAt = nowMs()
                createChapterVersion(activeChapter)
                  .then((nextVersions) => {
                    setVersions(nextVersions)
                    pushLog(
                      createLogEntry({
                        requestId,
                        scope: 'diff',
                        status: 'success',
                        message: '创建版本快照成功',
                        durationMs: nowMs() - startedAt,
                        payloadSummary: `chapter=${activeChapter.id}`
                      })
                    )
                  })
                  .catch((error: unknown) => {
                    const message = error instanceof Error ? error.message : '创建版本失败'
                    pushLog(
                      createLogEntry({
                        requestId,
                        scope: 'diff',
                        status: 'error',
                        message: `创建版本失败：${message}`,
                        durationMs: nowMs() - startedAt,
                        payloadSummary: `chapter=${activeChapter.id}`
                      })
                    )
                  })
              }}
              onSelectionChange={handleSelectionChange}
              onContentChange={handleContentChange}
              editorWidth={settings?.ui.editorWidth ?? 'full'}
            />

            <RightPanel
              chapter={activeChapter}
              providers={settings?.providers ?? []}
              agents={settings?.agents ?? []}
              activeProviderId={resolvedProviderId}
              activeAgentId={resolvedAgentId}
              onProviderChange={setActiveProviderId}
              onAgentChange={setActiveAgentId}
              onRunAiAction={handleRunAiAction}
              versions={versions}
              activeDiffVersionId={diffVersion?.id}
              onCompareVersion={handleOpenDiff}
              onRestoreVersion={(versionId) =>
                resolvedChapterId &&
                (() => {
                  setDiffVersion(null)
                  const requestId = createId()
                  const startedAt = nowMs()
                  return restoreChapterVersion(resolvedChapterId, versionId)
                    .then((chapter) => {
                      if (chapter) {
                        setActiveChapterId(chapter.id)
                        pushLog(
                          createLogEntry({
                            requestId,
                            scope: 'diff',
                            status: 'success',
                            message: '版本回滚成功',
                            durationMs: nowMs() - startedAt,
                            payloadSummary: `chapter=${resolvedChapterId} version=${versionId}`
                          })
                        )
                      }
                      return chapter
                    })
                    .catch((error: unknown) => {
                      const message = error instanceof Error ? error.message : '版本回滚失败'
                      pushLog(
                        createLogEntry({
                          requestId,
                          scope: 'diff',
                          status: 'error',
                          message: `版本回滚失败：${message}`,
                          durationMs: nowMs() - startedAt,
                          payloadSummary: `chapter=${resolvedChapterId} version=${versionId}`
                        })
                      )
                      throw error
                    })
                })()
              }
              onRefreshVersions={() =>
                resolvedChapterId &&
                (() => {
                  const requestId = createId()
                  const startedAt = nowMs()
                  return loadVersions(resolvedChapterId)
                    .then((nextVersions) => {
                      setVersions(nextVersions)
                      pushLog(
                        createLogEntry({
                          requestId,
                          scope: 'diff',
                          status: 'success',
                          message: '刷新版本成功',
                          durationMs: nowMs() - startedAt,
                          payloadSummary: `chapter=${resolvedChapterId} count=${nextVersions.length}`
                        })
                      )
                      return nextVersions
                    })
                    .catch((error: unknown) => {
                      const message = error instanceof Error ? error.message : '刷新版本失败'
                      pushLog(
                        createLogEntry({
                          requestId,
                          scope: 'diff',
                          status: 'error',
                          message: `刷新版本失败：${message}`,
                          durationMs: nowMs() - startedAt,
                          payloadSummary: `chapter=${resolvedChapterId}`
                        })
                      )
                      throw error
                    })
                })()
              }
              comments={comments}
              onAddComment={(author, body) =>
                resolvedChapterId && addChapterComment(resolvedChapterId, author, body).then(setComments)
              }
              aiLogs={aiLogs}
              aiRuns={aiRuns}
              onReplayRun={handleReplayRun}
              authorName={settings?.profile.authorName ?? '匿名作者'}
            />
          </main>

          <footer className="status-bar">
            <span>光标块: {selectedBlock?.type ?? '-'}</span>
            <span>章节: {activeChapter?.title ?? '-'}</span>
            <span>AI: {resolvedAgentId || '-'}</span>
            <span>{offline ? '离线缓存' : '在线同步'}</span>
          </footer>
        </>
      )}

      {currentPage === 'settings' && (
        <SettingsPage
          settings={settings}
          onBack={() => setCurrentPage('editor')}
          onSave={(next: Settings) => updateSettings(next)}
          authUser={authUser}
          onLogout={handleLogout}
          onClearWorkspace={handleClearWorkspace}
        />
      )}

      {currentPage === 'knowledge' && (
        <KnowledgeBasePage
          notes={notes}
          onSaveNote={handleSaveNote}
          onDeleteNote={handleDeleteNote}
          onInsertNote={handleInsertNote}
          onGenerateNote={handleGenerateNote}
          onRefreshReferences={handleRefreshReferences}
          canRefreshReferences={Boolean(activeChapter)}
          onBack={() => setCurrentPage('editor')}
          activeChapterTitle={activeChapter?.title}
        />
      )}

      <PreviewModal
        open={previewOpen}
        html={previewHtml}
        markdown={previewMarkdown}
        text={previewText}
        onClose={() => setPreviewOpen(false)}
      />

      <ConflictModal
        open={Boolean(conflictState)}
        chapterTitle={conflictState?.chapterTitle ?? ''}
        serverUpdatedAt={conflictState?.serverUpdatedAt}
        onOverwrite={handleConflictOverwrite}
        onSaveCopy={handleConflictSaveCopy}
        onReload={handleConflictReload}
      />

    </div>
  )
}
