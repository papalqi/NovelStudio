import { useState } from 'react'
import type { Chapter, Comment, Note, Provider, Agent, Block } from '../../types'
import type { AiAction } from '../../ai/aiService'
import { getPlainTextFromBlock } from '../../utils/text'
import './RightPanel.css'

type RightPanelProps = {
  chapter: Chapter | null
  selectedBlock: Block | null
  providers: Provider[]
  agents: Agent[]
  activeProviderId: string
  activeAgentId: string
  onProviderChange: (id: string) => void
  onAgentChange: (id: string) => void
  onRunAiAction: (action: AiAction) => void
  versions: { id: string; createdAt: string }[]
  onRestoreVersion: (versionId: string) => void
  onRefreshVersions: () => void
  comments: Comment[]
  onAddComment: (author: string, body: string) => void
  notes: Note[]
  onSaveNote: (note: Partial<Note>) => void
  onDeleteNote: (noteId: string) => void
  aiLogs: string[]
  authorName: string
}

export const RightPanel = ({
  chapter,
  selectedBlock,
  providers,
  agents,
  activeProviderId,
  activeAgentId,
  onProviderChange,
  onAgentChange,
  onRunAiAction,
  versions,
  onRestoreVersion,
  onRefreshVersions,
  comments,
  onAddComment,
  notes,
  onSaveNote,
  onDeleteNote,
  aiLogs,
  authorName
}: RightPanelProps) => {
  const [commentBody, setCommentBody] = useState('')
  const [noteType, setNoteType] = useState<'character' | 'location' | 'lore' | 'reference'>('character')
  const [noteTitle, setNoteTitle] = useState('')

  return (
    <aside className="right-panel">
      <div className="panel-section">
        <div className="panel-title">AI 执行器</div>
        <div className="panel-body">
          <label>
            Provider
            <select value={activeProviderId} onChange={(event) => onProviderChange(event.target.value)}>
              {providers.map((provider) => (
                <option key={provider.id} value={provider.id}>
                  {provider.name}
                </option>
              ))}
            </select>
          </label>
          <label>
            Agent
            <select value={activeAgentId} onChange={(event) => onAgentChange(event.target.value)}>
              {agents.map((agent) => (
                <option key={agent.id} value={agent.id}>
                  {agent.name}
                </option>
              ))}
            </select>
          </label>
        </div>
      </div>

      <div className="panel-section">
        <div className="panel-title">块级 AI</div>
        <div className="panel-body">
          <div className="block-card">
            <div className="block-label">当前块</div>
            <div className="block-value">
              {selectedBlock?.type ?? '未选择'} · {getPlainTextFromBlock(selectedBlock).slice(0, 20)}
            </div>
          </div>
          <div className="action-grid">
            <button className="action-button" onClick={() => onRunAiAction('rewrite')}>
              改写
            </button>
            <button className="action-button" onClick={() => onRunAiAction('expand')}>
              扩写
            </button>
            <button className="action-button" onClick={() => onRunAiAction('shorten')}>
              缩写
            </button>
            <button className="action-button" onClick={() => onRunAiAction('continue')}>
              续写
            </button>
          </div>
        </div>
      </div>

      <div className="panel-section">
        <div className="panel-title">章节 AI</div>
        <div className="panel-body">
          <div className="action-grid">
            <button className="action-button" onClick={() => onRunAiAction('outline')}>
              章节大纲
            </button>
            <button className="action-button" onClick={() => onRunAiAction('chapterCheck')}>
              连贯性检查
            </button>
            <button className="action-button" onClick={() => onRunAiAction('characterCheck')}>
              角色一致性
            </button>
            <button className="action-button" onClick={() => onRunAiAction('styleTune')}>
              风格润色
            </button>
            <button className="action-button" onClick={() => onRunAiAction('worldbuilding')}>
              设定扩展
            </button>
          </div>
          <div className="chapter-pill">
            当前章节：{chapter?.title ?? '未选择'}
          </div>
        </div>
      </div>

      <div className="panel-section">
        <div className="panel-title">版本历史</div>
        <div className="panel-body">
          <button className="ghost-button" onClick={onRefreshVersions}>
            刷新版本
          </button>
          <div className="version-list">
            {versions.map((version) => (
              <div key={version.id} className="version-item">
                <span>{version.createdAt}</span>
                <button className="ghost-button" onClick={() => onRestoreVersion(version.id)}>
                  回滚
                </button>
              </div>
            ))}
            {versions.length === 0 && <div className="empty-state">暂无版本</div>}
          </div>
        </div>
      </div>

      <div className="panel-section">
        <div className="panel-title">评论协作</div>
        <div className="panel-body">
          <div className="comment-list">
            {comments.map((comment) => (
              <div key={comment.id} className="comment-item">
                <div className="comment-author">{comment.author}</div>
                <div>{comment.body}</div>
                <div className="comment-time">{comment.createdAt}</div>
              </div>
            ))}
            {comments.length === 0 && <div className="empty-state">暂无评论</div>}
          </div>
          <textarea
            rows={3}
            placeholder="留下评论"
            value={commentBody}
            onChange={(event) => setCommentBody(event.target.value)}
          />
          <button
            className="primary-button"
            onClick={() => {
              if (!commentBody.trim()) return
              onAddComment(authorName, commentBody.trim())
              setCommentBody('')
            }}
          >
            发送评论
          </button>
        </div>
      </div>

      <div className="panel-section">
        <div className="panel-title">资料库</div>
        <div className="panel-body">
          <div className="note-toolbar">
            <select
              value={noteType}
              onChange={(event) =>
                setNoteType(event.target.value as 'character' | 'location' | 'lore' | 'reference')
              }
            >
              <option value="character">角色卡</option>
              <option value="location">地点</option>
              <option value="lore">世界观</option>
              <option value="reference">引用</option>
            </select>
            <input
              placeholder="标题"
              value={noteTitle}
              onChange={(event) => setNoteTitle(event.target.value)}
            />
            <button
              className="ghost-button"
              onClick={() => {
                if (!noteTitle.trim()) return
                onSaveNote({ type: noteType, title: noteTitle.trim(), content: {} })
                setNoteTitle('')
              }}
            >
              + 新条目
            </button>
          </div>
          <div className="note-list">
            {notes
              .filter((note) => note.type === noteType)
              .map((note) => (
                <div key={note.id} className="note-item">
                  <span>{note.title}</span>
                  <button className="ghost-button" onClick={() => onDeleteNote(note.id)}>
                    删除
                  </button>
                </div>
              ))}
            {notes.filter((note) => note.type === noteType).length === 0 && (
              <div className="empty-state">暂无条目</div>
            )}
          </div>
        </div>
      </div>

      <div className="panel-section">
        <div className="panel-title">AI 控制台</div>
        <div className="panel-body">
          <div className="log-list">
            {aiLogs.map((entry, index) => (
              <div key={`${entry}-${index}`} className="log-item">
                {entry}
              </div>
            ))}
          </div>
        </div>
      </div>
    </aside>
  )
}
