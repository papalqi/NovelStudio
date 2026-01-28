import { useEffect, useMemo, useState, type FC } from 'react'
import { BlockNoteView } from '@blocknote/mantine'
import type { BlockNoteEditor } from '@blocknote/core'
import { SideMenuExtension } from '@blocknote/core/extensions'
import { AddBlockButton, DragHandleButton, SideMenu, useComponentsContext, useExtensionState } from '@blocknote/react'
import { ArrowRight, Edit3, Maximize2, Minimize2, Sparkles } from 'lucide-react'
import type { Chapter, ChapterStatus, ChapterVersion } from '../../types'
import type { AiAction } from '../../ai/aiService'
import { diffLines } from '../../utils/diff'
import { getPlainTextFromDoc } from '../../utils/text'
import './EditorPane.css'

const statusOptions: { value: ChapterStatus; label: string }[] = [
  { value: 'draft', label: '草稿' },
  { value: 'review', label: '审校' },
  { value: 'done', label: '完成' }
]

const BLOCK_AI_ACTIONS: { action: AiAction; label: string; icon: typeof Edit3 }[] = [
  { action: 'rewrite', label: '改写', icon: Edit3 },
  { action: 'expand', label: '扩写', icon: Maximize2 },
  { action: 'shorten', label: '缩写', icon: Minimize2 },
  { action: 'continue', label: '续写', icon: ArrowRight }
]

type BlockAiSideMenuProps = {
  onRunAiAction: (action: AiAction, targetBlockId?: string) => Promise<boolean>
  dragHandleMenu?: FC
}

const BlockAiSideMenu = ({ onRunAiAction, dragHandleMenu }: BlockAiSideMenuProps) => {
  const [open, setOpen] = useState(false)
  const [status, setStatus] = useState<'idle' | 'loading' | 'error'>('idle')
  const [activeAction, setActiveAction] = useState<AiAction | null>(null)
  const Components = useComponentsContext()
  const block = useExtensionState(SideMenuExtension, {
    selector: (state) => state?.block
  })

  useEffect(() => {
    setOpen(false)
    setStatus('idle')
    setActiveAction(null)
  }, [block?.id])

  if (!block) return null

  const handleActionClick = async (action: AiAction) => {
    setOpen(true)
    setStatus('loading')
    setActiveAction(action)
    const success = await onRunAiAction(action, block.id)
    if (success) {
      setStatus('idle')
      setActiveAction(null)
      setOpen(false)
      return
    }
    setStatus('error')
  }

  const SideMenuButton = Components?.SideMenu.Button
  const activeLabel = BLOCK_AI_ACTIONS.find((item) => item.action === activeAction)?.label

  return (
    <SideMenu>
      <AddBlockButton />
      <DragHandleButton dragHandleMenu={dragHandleMenu} />
      {SideMenuButton ? (
        <SideMenuButton
          className="bn-button ai-side-menu-trigger"
          label="AI"
          icon={<Sparkles size={16} />}
          onClick={() => setOpen((prev) => !prev)}
        />
      ) : (
        <button
          type="button"
          className="ai-side-menu-trigger"
          aria-label="AI"
          onClick={() => setOpen((prev) => !prev)}
        >
          <Sparkles size={16} />
        </button>
      )}
      {open && (
        <div className="ai-side-menu" role="menu">
          {BLOCK_AI_ACTIONS.map(({ action, label, icon: Icon }) => (
            <button
              key={action}
              type="button"
              className="ai-side-menu-action"
              onClick={() => handleActionClick(action)}
              disabled={status === 'loading'}
            >
              <Icon size={14} />
              <span>{label}</span>
            </button>
          ))}
          {status !== 'idle' && (
            <div className={`ai-side-menu-status ${status}`}>
              {status === 'loading' ? `${activeLabel ?? 'AI'} 处理中...` : `${activeLabel ?? 'AI'} 失败，请重试`}
            </div>
          )}
        </div>
      )}
    </SideMenu>
  )
}

type EditorPaneProps = {
  editor: BlockNoteEditor
  chapter: Chapter | null
  diffVersion?: ChapterVersion | null
  onExitDiff?: () => void
  onRunAiAction: (action: AiAction, targetBlockId?: string) => Promise<boolean>
  onTitleChange: (title: string) => void
  onStatusChange: (status: ChapterStatus) => void
  onTagsChange: (tags: string[]) => void
  onTargetWordCountChange: (target: number) => void
  onCreateVersion: () => void
  onSelectionChange: () => void
  onContentChange: () => void
  editorWidth: 'full' | 'center'
}

export const EditorPane = ({
  editor,
  chapter,
  diffVersion,
  onExitDiff,
  onRunAiAction,
  onTitleChange,
  onStatusChange,
  onTagsChange,
  onTargetWordCountChange,
  onCreateVersion,
  onSelectionChange,
  onContentChange,
  editorWidth
}: EditorPaneProps) => {

  const diffData = useMemo(() => {
    if (!diffVersion || !chapter) return null
    const beforeText = getPlainTextFromDoc(diffVersion.snapshot?.content ?? [])
    const afterText = getPlainTextFromDoc(chapter.content ?? [])
    const beforeLines = beforeText.split(/\r?\n/)
    const afterLines = afterText.split(/\r?\n/)
    return diffLines(beforeLines, afterLines)
  }, [diffVersion, chapter])

  if (!chapter) {
    return (
      <section className="editor-area empty">
        <div className="empty-state">请选择一个章节开始写作</div>
      </section>
    )
  }

  if (diffVersion && diffData) {
    return (
      <section className="editor-area diff-mode" data-testid="editor-diff-mode">
        <div className="editor-toolbar diff-toolbar">
          <div className="diff-title-group">
            <div className="diff-title">版本对比</div>
            <div className="diff-subtitle">
              历史版本 {diffVersion.createdAt} · 当前章节 {chapter.updatedAt}
            </div>
            <div className="diff-legend">
              <span className="diff-legend-item diff-legend-insert">新增</span>
              <span className="diff-legend-item diff-legend-delete">删除</span>
            </div>
          </div>
          <div className="toolbar-actions">
            <button className="ghost-button" onClick={() => onExitDiff?.()} data-testid="editor-diff-exit">
              退出对比
            </button>
          </div>
        </div>
        <div className={`editor-surface diff-surface ${editorWidth === 'center' ? 'center' : ''}`}>
          <div className="diff-header-row">
            <div className="diff-header-cell">
              <span>历史版本</span>
              <span className="diff-header-meta">{diffVersion.createdAt}</span>
            </div>
            <div className="diff-header-cell">
              <span>当前内容</span>
              <span className="diff-header-meta">{chapter.updatedAt}</span>
            </div>
          </div>
          <div className="diff-body">
            {diffData.rows.map((row, index) => (
              <div key={`${row.type}-${index}`} className={`diff-row ${row.type}`}>
                <div className="diff-cell diff-left">
                  <span className="diff-line-no">{row.leftLine ?? ''}</span>
                  <span className="diff-line-text">{row.left ?? ''}</span>
                </div>
                <div className="diff-cell diff-right">
                  <span className="diff-line-no">{row.rightLine ?? ''}</span>
                  <span className="diff-line-text">{row.right ?? ''}</span>
                </div>
              </div>
            ))}
          </div>
          {diffData.truncated && (
            <div className="diff-truncated">
              内容较大，仅展示前 {diffData.rows.length} 行差异（历史 {diffData.beforeLineCount} 行 / 当前{' '}
              {diffData.afterLineCount} 行）。
            </div>
          )}
        </div>
      </section>
    )
  }

  const progress = chapter.targetWordCount
    ? Math.min(100, Math.round((chapter.wordCount / chapter.targetWordCount) * 100))
    : 0

  return (
    <section className="editor-area">
      <div className="editor-toolbar">
        <div className="chapter-info">
          <input
            className="chapter-title-input"
            value={chapter.title}
            onChange={(event) => onTitleChange(event.target.value)}
            data-testid="editor-title"
          />
          <div className="chapter-meta">
            {chapter.wordCount}字 / 目标 {chapter.targetWordCount}字 · 更新 {chapter.updatedAt}
          </div>
          <div className="progress-bar">
            <div className="progress-fill" style={{ width: `${progress}%` }} />
          </div>
        </div>
        <div className="toolbar-actions">
          <select
            value={chapter.status}
            onChange={(event) => onStatusChange(event.target.value as ChapterStatus)}
            data-testid="editor-status"
          >
            {statusOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <input
            className="tags-input"
            placeholder="标签：用逗号分隔"
            value={chapter.tags.join(',')}
            onChange={(event) =>
              onTagsChange(
                event.target.value
                  .split(',')
                  .map((tag) => tag.trim())
                  .filter(Boolean)
              )
            }
            data-testid="editor-tags"
          />
          <input
            className="target-input"
            type="number"
            value={chapter.targetWordCount}
            onChange={(event) => onTargetWordCountChange(Number(event.target.value))}
            data-testid="editor-target-word-count"
          />
          <button className="ghost-button" onClick={onCreateVersion} data-testid="editor-save-version">
            保存版本
          </button>
        </div>
      </div>
      <div className={`editor-surface ${editorWidth === 'center' ? 'center' : ''}`} data-testid="editor-content">
        <BlockNoteView
          editor={editor}
          onChange={onContentChange}
          onSelectionChange={onSelectionChange}
          sideMenu={false}
        >
          <BlockAiSideMenu onRunAiAction={onRunAiAction} />
        </BlockNoteView>
      </div>
    </section>
  )
}
