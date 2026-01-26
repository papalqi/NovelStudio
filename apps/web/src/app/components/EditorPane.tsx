import { BlockNoteView } from '@blocknote/mantine'
import type { BlockNoteEditor } from '@blocknote/core'
import type { Chapter, ChapterStatus } from '../../types'
import './EditorPane.css'

const statusOptions: { value: ChapterStatus; label: string }[] = [
  { value: 'draft', label: '草稿' },
  { value: 'review', label: '审校' },
  { value: 'done', label: '完成' }
]

type EditorPaneProps = {
  editor: BlockNoteEditor
  chapter: Chapter | null
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
          />
          <input
            className="target-input"
            type="number"
            value={chapter.targetWordCount}
            onChange={(event) => onTargetWordCountChange(Number(event.target.value))}
          />
          <button className="ghost-button" onClick={onCreateVersion}>
            保存版本
          </button>
        </div>
      </div>
      <div className={`editor-surface ${editorWidth === 'center' ? 'center' : ''}`}>
        <BlockNoteView editor={editor} onChange={onContentChange} onSelectionChange={onSelectionChange} />
      </div>
    </section>
  )
}
