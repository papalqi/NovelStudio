import { useEffect, useMemo, useRef, useState } from 'react'
import { useCreateBlockNote } from '@blocknote/react'
import { TopBar } from './components/TopBar'
import { Explorer } from './components/Explorer'
import { EditorPane } from './components/EditorPane'
import { RightPanel } from './components/RightPanel'
import { SettingsPanel } from './components/SettingsPanel'
import { PreviewModal } from './components/PreviewModal'
import { KnowledgeBaseDrawer } from './components/KnowledgeBaseDrawer'
import { useAppData } from './hooks/useAppData'
import { debounce } from '../utils/debounce'
import { estimateWordCount, getPlainTextFromBlock } from '../utils/text'
import { runAiAction, type AiAction } from '../ai/aiService'
import type { Chapter, ChapterStatus, Settings, ChapterVersion, Comment, Block, Note } from '../types'
import './App.css'

const formatDate = () => new Date().toISOString().slice(0, 10)

export const App = () => {
  const editor = useCreateBlockNote()
  const {
    settings,
    volumes,
    chapters,
    notes,
    loading,
    offline,
    updateSettings,
    upsertVolume,
    createNewVolume,
    removeVolume,
    createNewChapter,
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
  } = useAppData()

  const [activeVolumeId, setActiveVolumeId] = useState('')
  const [activeChapterId, setActiveChapterId] = useState('')
  const [selectedBlock, setSelectedBlock] = useState<Block | null>(null)
  const [versions, setVersions] = useState<ChapterVersion[]>([])
  const [comments, setComments] = useState<Comment[]>([])
  const [activeProviderId, setActiveProviderId] = useState('')
  const [activeAgentId, setActiveAgentId] = useState('')
  const [aiLogs, setAiLogs] = useState<string[]>([])
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [previewOpen, setPreviewOpen] = useState(false)
  const [knowledgeBaseOpen, setKnowledgeBaseOpen] = useState(false)

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

  useEffect(() => {
    if (!resolvedChapterId) return
    loadVersions(resolvedChapterId).then(setVersions)
    loadComments(resolvedChapterId).then(setComments)
  }, [resolvedChapterId, loadVersions, loadComments])

  // Load notes data for Knowledge Base Drawer
  useEffect(() => {
    refreshNotes()
  }, [refreshNotes])

  const handleToggleTheme = () => {
    if (!settings) return
    const newTheme = settings.ui.theme === 'light' ? 'dark' : 'light'
    updateSettings({ ...settings, ui: { ...settings.ui, theme: newTheme } })
  }

  const handleSaveNote = (note: Partial<Note>) => {
    upsertNoteItem(note)
  }

  const handleDeleteNote = (noteId: string) => {
    removeNoteItem(noteId)
  }

  const debouncedSave = useMemo(() => {
    return debounce((content: Block[]) => {
      if (!activeChapter || !settings?.autosave.enabled) return
      const wordCount = estimateWordCount(content)
      void saveChapterContent(activeChapter.id, content, wordCount, formatDate()).catch((error) => {
        setAiLogs((prev) => [`保存失败：${error.message}`, ...prev].slice(0, 12))
      })
    }, settings?.autosave.intervalMs ?? 1200)
  }, [activeChapter, saveChapterContent, settings])

  const handleContentChange = () => {
    if (switchingRef.current) return
    const content = editor.document as Block[]
    if (!settings?.autosave.enabled) return
    debouncedSave(content)
  }

  const handleSelectionChange = () => {
    const currentBlock = editor.getTextCursorPosition().block as Block
    setSelectedBlock(currentBlock ?? null)
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

  const handleRunAiAction = async (action: AiAction) => {
    if (!settings) return
    if (!activeChapter) {
      setAiLogs((prev) => ['请先选择章节', ...prev])
      return
    }
    const currentDoc = editor.document as Block[]
    const targetBlock = selectedBlock ?? (editor.getTextCursorPosition().block as Block)
    const content =
      action === 'rewrite' || action === 'expand' || action === 'shorten' || action === 'continue'
        ? getPlainTextFromBlock(targetBlock)
        : (editor.blocksToMarkdownLossy(currentDoc) as string)

    if (!content) {
      setAiLogs((prev) => ['没有可用文本', ...prev])
      return
    }

    try {
      const response = await runAiAction({
        action,
        content,
        context: `章节：${activeChapter.title}\n标签：${activeChapter.tags.join(',')}`,
        settings,
        providers: settings.providers,
        agents: settings.agents,
        providerId: resolvedProviderId,
        agentId: resolvedAgentId
      })

      if (action === 'rewrite' || action === 'expand' || action === 'shorten' || action === 'continue') {
        if (targetBlock?.id) {
          editor.updateBlock(targetBlock.id, { content: response.content })
        }
      } else {
        const lastBlock = currentDoc[currentDoc.length - 1]
        const referenceId = lastBlock?.id ?? currentDoc[0]?.id
        if (referenceId) {
          editor.insertBlocks(
            [{ id: `ai-${Date.now()}`, type: 'paragraph', content: response.content }],
            referenceId,
            'after'
          )
        }
      }
      setAiLogs((prev) => [`${response.label} 完成`, ...prev].slice(0, 12))
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'AI 调用失败'
      setAiLogs((prev) => [`AI 失败：${message}`, ...prev])
    }
  }

  const handleManualSync = () => {
    if (!activeChapter) return
    const content = editor.document as Block[]
    const wordCount = estimateWordCount(content)
    void saveChapterContent(activeChapter.id, content, wordCount, formatDate())
  }

  const previewHtml = useMemo(() => {
    if (!activeChapter) return ''
    return editor.blocksToHTMLLossy(editor.document as Block[])
  }, [activeChapter, editor])

  const previewMarkdown = useMemo(() => {
    if (!activeChapter) return ''
    return editor.blocksToMarkdownLossy(editor.document as Block[])
  }, [activeChapter, editor])

  if (loading) {
    return <div className="app-shell">加载中...</div>
  }

  return (
    <div className="app-shell">
      <TopBar
        authorName={settings?.profile.authorName ?? '匿名作者'}
        offline={offline}
        onOpenSettings={() => setSettingsOpen(true)}
        onOpenPreview={() => setPreviewOpen(true)}
        onManualSync={handleManualSync}
        autosaveEnabled={settings?.autosave.enabled ?? true}
        onOpenKnowledgeBase={() => setKnowledgeBaseOpen(true)}
        theme={settings?.ui.theme ?? 'light'}
        onToggleTheme={handleToggleTheme}
      />

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
        />

        <EditorPane
          editor={editor}
          chapter={activeChapter}
          onTitleChange={(title) => handleChapterMetaUpdate({ title })}
          onStatusChange={(status: ChapterStatus) => handleChapterMetaUpdate({ status })}
          onTagsChange={(tags) => handleChapterMetaUpdate({ tags })}
          onTargetWordCountChange={(target) => handleChapterMetaUpdate({ targetWordCount: target })}
          onCreateVersion={() => {
            if (!activeChapter) return
            createChapterVersion(activeChapter).then(setVersions)
          }}
          onSelectionChange={handleSelectionChange}
          onContentChange={handleContentChange}
          editorWidth={settings?.ui.editorWidth ?? 'full'}
        />

      <RightPanel
          chapter={activeChapter}
          selectedBlock={selectedBlock}
          providers={settings?.providers ?? []}
          agents={settings?.agents ?? []}
          activeProviderId={resolvedProviderId}
          activeAgentId={resolvedAgentId}
          onProviderChange={setActiveProviderId}
          onAgentChange={setActiveAgentId}
          onRunAiAction={handleRunAiAction}
          versions={versions}
          onRestoreVersion={(versionId) =>
            resolvedChapterId && restoreChapterVersion(resolvedChapterId, versionId).then((chapter) => {
              if (chapter) setActiveChapterId(chapter.id)
            })
          }
          onRefreshVersions={() => resolvedChapterId && loadVersions(resolvedChapterId).then(setVersions)}
          comments={comments}
          onAddComment={(author, body) =>
            resolvedChapterId && addChapterComment(resolvedChapterId, author, body).then(setComments)
          }
          aiLogs={aiLogs}
          authorName={settings?.profile.authorName ?? '匿名作者'}
        />
      </main>

      <footer className="status-bar">
        <span>光标块: {selectedBlock?.type ?? '-'}</span>
        <span>章节: {activeChapter?.title ?? '-'}</span>
        <span>AI: {resolvedAgentId || '-'}</span>
        <span>{offline ? '离线缓存' : '在线同步'}</span>
      </footer>

      <SettingsPanel
        open={settingsOpen}
        settings={settings}
        onClose={() => setSettingsOpen(false)}
        onSave={(next: Settings) => updateSettings(next)}
      />

      <PreviewModal open={previewOpen} html={previewHtml} markdown={previewMarkdown} onClose={() => setPreviewOpen(false)} />

      <KnowledgeBaseDrawer
        open={knowledgeBaseOpen}
        onClose={() => setKnowledgeBaseOpen(false)}
        notes={notes}
        onSaveNote={handleSaveNote}
        onDeleteNote={handleDeleteNote}
      />
    </div>
  )
}
