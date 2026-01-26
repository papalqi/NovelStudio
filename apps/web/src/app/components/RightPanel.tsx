import { useState } from 'react'
import {
  Edit3,
  Maximize2,
  Minimize2,
  ArrowRight,
  List,
  CheckCircle,
  Users,
  Sparkles,
  Globe,
  RefreshCw
} from 'lucide-react'
import type { Chapter, Comment, Provider, Agent, Block, AiRunRecord } from '../../types'
import type { AiAction } from '../../ai/aiService'
import { getPlainTextFromBlock } from '../../utils/text'
import { formatLogEntry, type LogEntry } from '../../utils/logging'
import { Accordion, Select, Button, Card } from './common'
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
  aiLogs: LogEntry[]
  aiRuns: AiRunRecord[]
  onReplayRun: (run: AiRunRecord) => void
  authorName: string
}

const AI_BLOCK_ACTIONS = [
  { action: 'rewrite' as AiAction, label: '改写', icon: Edit3 },
  { action: 'expand' as AiAction, label: '扩写', icon: Maximize2 },
  { action: 'shorten' as AiAction, label: '缩写', icon: Minimize2 },
  { action: 'continue' as AiAction, label: '续写', icon: ArrowRight }
]

const AI_CHAPTER_ACTIONS = [
  { action: 'outline' as AiAction, label: '章节大纲', icon: List },
  { action: 'chapterCheck' as AiAction, label: '连贯性检查', icon: CheckCircle },
  { action: 'characterCheck' as AiAction, label: '角色一致性', icon: Users },
  { action: 'styleTune' as AiAction, label: '风格润色', icon: Sparkles },
  { action: 'worldbuilding' as AiAction, label: '设定扩展', icon: Globe }
]

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
  aiLogs,
  aiRuns,
  onReplayRun,
  authorName
}: RightPanelProps) => {
  const [commentBody, setCommentBody] = useState('')

  const providerOptions = providers.map((p) => ({ value: p.id, label: p.name }))
  const agentOptions = agents.map((a) => ({ value: a.id, label: a.name }))

  return (
    <aside className="right-panel">
      <Accordion title="AI 执行器" defaultOpen={true}>
        <div className="ai-executor-content">
          <Select
            label="Provider"
            options={providerOptions}
            value={activeProviderId}
            onChange={onProviderChange}
            testId="rightpanel-provider"
          />
          <Select
            label="Agent"
            options={agentOptions}
            value={activeAgentId}
            onChange={onAgentChange}
            testId="rightpanel-agent"
          />

          <Card className="block-info-card">
            <div className="block-label">当前块</div>
            <div className="block-value">
              {selectedBlock?.type ?? '未选择'} · {getPlainTextFromBlock(selectedBlock).slice(0, 20)}
            </div>
          </Card>

          <div className="ai-section-title">块级 AI</div>
          <div className="ai-action-grid">
            {AI_BLOCK_ACTIONS.map(({ action, label, icon: Icon }) => (
              <button
                key={action}
                className="ai-action-button"
                onClick={() => onRunAiAction(action)}
                data-testid={`ai-block-${action}`}
              >
                <Icon size={16} />
                <span>{label}</span>
              </button>
            ))}
          </div>

          <div className="ai-section-title">章节 AI</div>
          <div className="ai-action-grid">
            {AI_CHAPTER_ACTIONS.map(({ action, label, icon: Icon }) => (
              <button
                key={action}
                className="ai-action-button"
                onClick={() => onRunAiAction(action)}
                data-testid={`ai-chapter-${action}`}
              >
                <Icon size={16} />
                <span>{label}</span>
              </button>
            ))}
          </div>

          <div className="chapter-pill">
            当前章节：{chapter?.title ?? '未选择'}
          </div>
        </div>
      </Accordion>

      <Accordion title="版本历史" defaultOpen={false}>
        <div className="version-content">
          <Button variant="ghost" size="sm" onClick={onRefreshVersions} data-testid="versions-refresh">
            <RefreshCw size={14} />
            刷新版本
          </Button>
          <div className="version-list">
            {versions.map((version) => (
              <div key={version.id} className="version-item">
                <span>{version.createdAt}</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onRestoreVersion(version.id)}
                  data-testid={`version-restore-${version.id}`}
                >
                  回滚
                </Button>
              </div>
            ))}
            {versions.length === 0 && <div className="empty-state">暂无版本</div>}
          </div>
        </div>
      </Accordion>

      <Accordion title="评论协作" defaultOpen={false}>
        <div className="comment-content">
          <div className="comment-list">
            {comments.map((comment) => (
              <div key={comment.id} className="comment-item">
                <div className="comment-author">{comment.author}</div>
                <div className="comment-body">{comment.body}</div>
                <div className="comment-time">{comment.createdAt}</div>
              </div>
            ))}
            {comments.length === 0 && <div className="empty-state">暂无评论</div>}
          </div>
          <textarea
            className="comment-input"
            rows={3}
            placeholder="留下评论"
            value={commentBody}
            onChange={(event) => setCommentBody(event.target.value)}
            data-testid="comment-input"
          />
          <Button
            variant="primary"
            onClick={() => {
              if (!commentBody.trim()) return
              onAddComment(authorName, commentBody.trim())
              setCommentBody('')
            }}
            data-testid="comment-send"
          >
            发送评论
          </Button>
        </div>
      </Accordion>

      <Accordion title="AI 控制台" defaultOpen={false}>
        <div className="console-content">
          <div className="log-list">
            {aiLogs.map((entry) => (
              <div key={entry.id} className="log-item">
                {formatLogEntry(entry)}
              </div>
            ))}
            {aiLogs.length === 0 && <div className="empty-state">暂无日志</div>}
          </div>
          <div className="run-list">
            <div className="run-list-title">运行记录</div>
            {aiRuns.map((run) => (
              <div key={run.id} className="run-item">
                <div className="run-header">
                  <div className="run-meta">
                    <span>{run.createdAt}</span>
                    <span>{run.action}</span>
                    <span className={`run-status ${run.status}`}>{run.status}</span>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onReplayRun(run)}
                    data-testid={`ai-run-replay-${run.id}`}
                  >
                    重放
                  </Button>
                </div>
                <details className="run-details">
                  <summary>查看请求/响应</summary>
                  <pre className="run-json">
                    {JSON.stringify({ request: run.request, response: run.response }, null, 2)}
                  </pre>
                </details>
              </div>
            ))}
            {aiRuns.length === 0 && <div className="empty-state">暂无运行记录</div>}
          </div>
        </div>
      </Accordion>
    </aside>
  )
}
