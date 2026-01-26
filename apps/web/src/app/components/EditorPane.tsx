import { useMemo } from 'react'
import { BlockNoteView } from '@blocknote/mantine'
import type { BlockNoteEditor } from '@blocknote/core'
import type { Chapter, ChapterStatus, ChapterVersion } from '../../types'
import { diffLines } from '../../utils/diff'
import { getPlainTextFromDoc } from '../../utils/text'
import './EditorPane.css'

const statusOptions: { value: ChapterStatus; label: string }[] = [
  { value: 'draft', label: '草稿' },
  { value: 'review', label: '审校' },
  { value: 'done', label: '完成' }
]

type EditorPaneProps = {
  editor: BlockNoteEditor
  chapter: Chapter | null
  diffVersion?: ChapterVersion | null
  onExitDiff?: () => void
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
  onTitleChange,
  onStatusChange,
  onTagsChange,
  onTargetWordCountChange,
  onCreateVersion,
  onSelectionChange,
  onContentChange,
  editorWidth
}: EditorPaneProps) => {
  if (!chapter) {
    return (
      <section className="editor-area empty">
        <div className="empty-state">请选择一个章节开始写作</div>
      </section>
    )
  }

  const diffData = useMemo(() => {
    if (!diffVersion) return null
    const beforeText = getPlainTextFromDoc(diffVersion.snapshot?.content ?? [])
    const afterText = getPlainTextFromDoc(chapter.content ?? [])
    const beforeLines = beforeText.split(/\r?\n/)
    const afterLines = afterText.split(/\r?\n/)
    return diffLines(beforeLines, afterLines)
  }, [diffVersion, chapter])

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
        <BlockNoteView editor={editor} onChange={onContentChange} onSelectionChange={onSelectionChange} />
      </div>
    </section>
  )
}
