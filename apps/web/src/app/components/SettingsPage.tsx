import { useCallback, useEffect, useState } from 'react'
import { ArrowLeft, User, Palette, Bot, Cpu, Cloud, Save, Download, Shield } from 'lucide-react'
import type { Settings, Provider, Agent, AiRequestSettings } from '../../types'
import type { AuthUser } from '../../utils/auth'
import { createId } from '../../utils/id'
import { normalizeAiRequestSettings } from '../../utils/aiRequest'
import { ProvidersSection } from './ProvidersSection'
import { Card, Input, Select, Toggle, Button, Modal } from './common'
import './SettingsPage.css'

type SettingsPageProps = {
  settings: Settings | null
  onBack: () => void
  onSave: (settings: Settings) => void
  authUser?: AuthUser | null
  onLogout?: () => void
  onClearWorkspace?: () => Promise<void>
}

type SettingsCategory =
  | 'account'
  | 'profile'
  | 'appearance'
  | 'providers'
  | 'agents'
  | 'ai'
  | 'sync'
  | 'autosave'
  | 'export'

const NAV_ITEMS: { id: SettingsCategory; label: string; icon: typeof User }[] = [
  { id: 'account', label: '账号/工作空间', icon: Shield },
  { id: 'profile', label: '个人资料', icon: User },
  { id: 'appearance', label: '外观', icon: Palette },
  { id: 'providers', label: 'Provider 配置', icon: Cpu },
  { id: 'agents', label: 'Agent 配置', icon: Bot },
  { id: 'ai', label: 'AI 默认参数', icon: Bot },
  { id: 'sync', label: '同步', icon: Cloud },
  { id: 'autosave', label: '自动保存', icon: Save },
  { id: 'export', label: '导出', icon: Download }
]

export const SettingsPage = ({ settings, onBack, onSave, authUser, onLogout, onClearWorkspace }: SettingsPageProps) => {
  const [draft, setDraft] = useState<Settings | null>(settings)
  const [activeCategory, setActiveCategory] = useState<SettingsCategory>('profile')
  const [clearModalOpen, setClearModalOpen] = useState(false)
  const [clearStatus, setClearStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [clearMessage, setClearMessage] = useState('')

  useEffect(() => {
    if (!settings) return
    // eslint-disable-next-line react-hooks/set-state-in-effect -- sync incoming settings into editable draft
    setDraft({
      ...settings,
      ai: {
        ...settings.ai,
        request: normalizeAiRequestSettings(settings.ai.request)
      }
    })
  }, [settings])

  if (!draft) return null

  const handleClearWorkspace = async () => {
    if (!onClearWorkspace) return
    setClearStatus('loading')
    setClearMessage('')
    try {
      await onClearWorkspace()
      setClearStatus('success')
      setClearMessage('已清空当前工作空间数据')
      setClearModalOpen(false)
    } catch (error) {
      const message = error instanceof Error ? error.message : '清空失败'
      setClearStatus('error')
      setClearMessage(message)
    }
  }

  const renderAccountSection = () => (
    <div className="settings-content-inner">
      <Card>
        <div className="settings-group">
          <div className="settings-row">
            <span className="settings-row-label">当前账号</span>
            <div className="settings-row-control">
              <span className="settings-inline-text" data-testid="settings-auth-user">
                {authUser?.username ?? '未知账号'}
              </span>
            </div>
          </div>
          <div className="settings-row">
            <span className="settings-row-label">账号 ID</span>
            <div className="settings-row-control">
              <span className="settings-inline-text" data-testid="settings-auth-userid">
                {authUser?.userId ?? '-'}
              </span>
            </div>
          </div>
          {onLogout && (
            <div className="settings-row">
              <span className="settings-row-label">账号操作</span>
              <div className="settings-row-control settings-row-actions">
                <Button
                  variant="danger"
                  size="sm"
                  onClick={onLogout}
                  data-testid="settings-auth-logout"
                >
                  退出登录
                </Button>
              </div>
            </div>
          )}
          {onClearWorkspace && (
            <div className="settings-row">
              <span className="settings-row-label">工作空间</span>
              <div className="settings-row-control settings-row-actions">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setClearModalOpen(true)
                    setClearStatus('idle')
                    setClearMessage('')
                  }}
                  data-testid="settings-auth-clear"
                >
                  清空当前工作区
                </Button>
              </div>
            </div>
          )}
          {clearMessage && (
            <div className={`settings-alert ${clearStatus}`} data-testid="settings-auth-clear-status">
              {clearMessage}
            </div>
          )}
        </div>
      </Card>
      <Modal open={clearModalOpen} onClose={() => setClearModalOpen(false)} title="确认清空工作区">
        <div className="settings-modal-body">
          <p>此操作将删除当前账号下的章节、卷、资料库与 AI 记录，且无法恢复。</p>
          <div className="settings-modal-actions">
            <Button variant="ghost" size="sm" onClick={() => setClearModalOpen(false)}>
              取消
            </Button>
            <Button
              variant="danger"
              size="sm"
              loading={clearStatus === 'loading'}
              onClick={handleClearWorkspace}
              data-testid="settings-auth-clear-confirm"
            >
              确认清空
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )

  const setProviders = useCallback((updater: (prev: Provider[]) => Provider[]) => {
    setDraft((prev) => {
      if (!prev) return prev
      return { ...prev, providers: updater(prev.providers) }
    })
  }, [])

  const updateAgent = (id: string, patch: Partial<Agent>) => {
    setDraft({
      ...draft,
      agents: draft.agents.map((item) => (item.id === id ? { ...item, ...patch } : item))
    })
  }

  const updateAiRequest = (patch: Partial<AiRequestSettings>) => {
    setDraft({
      ...draft,
      ai: {
        ...draft.ai,
        request: {
          ...draft.ai.request,
          ...patch
        }
      }
    })
  }

  const handleSave = () => {
    onSave(draft)
    onBack()
  }

  const getSchemaError = (schema?: string) => {
    if (!schema?.trim()) return ''
    try {
      JSON.parse(schema)
      return ''
    } catch {
      return 'Schema JSON 格式错误'
    }
  }

  const renderProfileSection = () => (
    <div className="settings-content-inner">
      <Card>
        <div className="settings-group">
          <div className="settings-row">
            <span className="settings-row-label">作者名称</span>
            <div className="settings-row-control">
              <Input
                value={draft.profile.authorName}
                onChange={(e) =>
                  setDraft({
                    ...draft,
                    profile: { ...draft.profile, authorName: e.target.value }
                  })
                }
                placeholder="输入作者名称"
                data-testid="settings-author-name"
              />
            </div>
          </div>
          <div className="settings-row">
            <span className="settings-row-label">账号入口</span>
            <div className="settings-row-control">
              <span className="settings-inline-text">请到“账号/工作空间”管理</span>
            </div>
          </div>
        </div>
      </Card>
    </div>
  )

  const renderAppearanceSection = () => (
    <div className="settings-content-inner">
      <Card>
        <div className="settings-group">
          <div className="settings-row">
            <span className="settings-row-label">主题</span>
            <div className="settings-row-control">
              <Select
                value={draft.ui.theme}
                onChange={(value) =>
                  setDraft({
                    ...draft,
                    ui: { ...draft.ui, theme: value as Settings['ui']['theme'] }
                  })
                }
                options={[
                  { value: 'light', label: '浅色' },
                  { value: 'dark', label: '深色' }
                ]}
                testId="settings-theme"
              />
            </div>
          </div>
          <div className="settings-row">
            <span className="settings-row-label">字体</span>
            <div className="settings-row-control">
              <Input
                value={draft.ui.fontFamily}
                onChange={(e) =>
                  setDraft({
                    ...draft,
                    ui: { ...draft.ui, fontFamily: e.target.value }
                  })
                }
                placeholder="系统默认字体"
                data-testid="settings-font-family"
              />
            </div>
          </div>
          <div className="settings-row">
            <span className="settings-row-label">编辑区宽度</span>
            <div className="settings-row-control">
              <Select
                value={draft.ui.editorWidth}
                onChange={(value) =>
                  setDraft({
                    ...draft,
                    ui: { ...draft.ui, editorWidth: value as Settings['ui']['editorWidth'] }
                  })
                }
                options={[
                  { value: 'full', label: '全宽' },
                  { value: 'center', label: '居中' }
                ]}
                testId="settings-editor-width"
              />
            </div>
          </div>
        </div>
      </Card>
    </div>
  )

  const renderProvidersSection = () => (
    <ProvidersSection
      providers={draft.providers}
      onSetProviders={setProviders}
      syncApiBaseUrl={draft.sync.apiBaseUrl}
    />
  )

  const renderAgentsSection = () => (
    <div className="settings-content-inner">
      <Card header="Agent 列表">
        <div className="settings-group">
          {draft.agents.map((agent, index) => (
            <div key={agent.id} className="settings-item-card">
              <div className="settings-item-header">
                <Input
                  value={agent.name}
                  onChange={(e) => updateAgent(agent.id, { name: e.target.value })}
                  placeholder="Agent 名称"
                  data-testid={`settings-agent-name-${agent.id}`}
                />
                <Button
                  variant="danger"
                  size="sm"
                  onClick={() =>
                    setDraft({
                      ...draft,
                      agents: draft.agents.filter((item) => item.id !== agent.id)
                    })
                  }
                  data-testid={`settings-agent-delete-${agent.id}`}
                >
                  删除
                </Button>
              </div>
              <div className="settings-item-fields">
                <Select
                  value={agent.providerId}
                  onChange={(value) => updateAgent(agent.id, { providerId: value })}
                  options={draft.providers.map((p) => ({ value: p.id, label: p.name }))}
                  label="Provider"
                  testId={`settings-agent-provider-${agent.id}`}
                />
                <div className="settings-row">
                  <span className="settings-row-label">串行执行</span>
                  <div className="settings-row-control">
                    <Toggle
                      checked={agent.serialEnabled ?? false}
                      onChange={(e) => updateAgent(agent.id, { serialEnabled: e.target.checked })}
                      data-testid={`settings-agent-serial-${agent.id}`}
                    />
                  </div>
                </div>
                <Input
                  type="number"
                  value={agent.serialOrder ?? index + 1}
                  onChange={(e) => updateAgent(agent.id, { serialOrder: Number(e.target.value) })}
                  min="1"
                  step="1"
                  label="串行顺序"
                  data-testid={`settings-agent-serial-order-${agent.id}`}
                />
                <Input
                  value={agent.systemPrompt}
                  onChange={(e) => updateAgent(agent.id, { systemPrompt: e.target.value })}
                  placeholder="输入系统提示词..."
                  label="System Prompt"
                  data-testid={`settings-agent-prompt-${agent.id}`}
                />
                <Input
                  value={agent.outputSchema ?? ''}
                  onChange={(e) => updateAgent(agent.id, { outputSchema: e.target.value })}
                  placeholder='{"type":"object","properties":{"summary":{"type":"string"}},"required":["summary"]}'
                  label="输出 Schema (JSON)"
                  error={getSchemaError(agent.outputSchema) || undefined}
                  data-testid={`settings-agent-schema-${agent.id}`}
                />
              </div>
            </div>
          ))}
          <Button
            variant="ghost"
            className="settings-add-button"
            onClick={() =>
              setDraft({
                ...draft,
                agents: [
                  ...draft.agents,
                  {
                    id: createId(),
                    name: '新 Agent',
                    providerId: draft.providers[0]?.id ?? '',
                    systemPrompt: ''
                  }
                ]
              })
            }
            data-testid="settings-agent-add"
          >
            + 添加 Agent
          </Button>
        </div>
      </Card>
    </div>
  )

  const renderAISection = () => (
    <div className="settings-content-inner">
      <Card header="默认参数">
        <div className="settings-group">
          <div className="settings-row">
            <span className="settings-row-label">Temperature</span>
            <div className="settings-row-control">
              <Input
                type="number"
                value={draft.ai.temperature}
                onChange={(e) =>
                  setDraft({
                    ...draft,
                    ai: { ...draft.ai, temperature: Number(e.target.value) }
                  })
                }
                step="0.1"
                min="0"
                max="2"
                data-testid="settings-ai-temperature"
              />
            </div>
          </div>
          <div className="settings-row">
            <span className="settings-row-label">Max Tokens</span>
            <div className="settings-row-control">
              <Input
                type="number"
                value={draft.ai.maxTokens}
                onChange={(e) =>
                  setDraft({
                    ...draft,
                    ai: { ...draft.ai, maxTokens: Number(e.target.value) }
                  })
                }
                min="1"
                data-testid="settings-ai-max-tokens"
              />
            </div>
          </div>
          <div className="settings-row">
            <span className="settings-row-label">默认 Provider</span>
            <div className="settings-row-control">
              <Select
                value={draft.ai.defaultProviderId}
                onChange={(value) =>
                  setDraft({ ...draft, ai: { ...draft.ai, defaultProviderId: value } })
                }
                options={draft.providers.map((p) => ({ value: p.id, label: p.name }))}
                testId="settings-ai-default-provider"
              />
            </div>
          </div>
          <div className="settings-row">
            <span className="settings-row-label">默认 Agent</span>
            <div className="settings-row-control">
              <Select
                value={draft.ai.defaultAgentId}
                onChange={(value) =>
                  setDraft({ ...draft, ai: { ...draft.ai, defaultAgentId: value } })
                }
                options={draft.agents.map((a) => ({ value: a.id, label: a.name }))}
                testId="settings-ai-default-agent"
              />
            </div>
          </div>
        </div>
      </Card>
      <Card header="请求策略">
        <div className="settings-group">
          <div className="settings-row">
            <span className="settings-row-label">请求超时（毫秒）</span>
            <div className="settings-row-control">
              <Input
                type="number"
                value={draft.ai.request.timeoutMs}
                onChange={(e) => updateAiRequest({ timeoutMs: Number(e.target.value) })}
                min="0"
                step="500"
                data-testid="settings-ai-timeout"
              />
            </div>
          </div>
          <div className="settings-row">
            <span className="settings-row-label">最大重试次数</span>
            <div className="settings-row-control">
              <Input
                type="number"
                value={draft.ai.request.maxRetries}
                onChange={(e) => updateAiRequest({ maxRetries: Number(e.target.value) })}
                min="0"
                step="1"
                data-testid="settings-ai-max-retries"
              />
            </div>
          </div>
          <div className="settings-row">
            <span className="settings-row-label">重试间隔（毫秒）</span>
            <div className="settings-row-control">
              <Input
                type="number"
                value={draft.ai.request.retryDelayMs}
                onChange={(e) => updateAiRequest({ retryDelayMs: Number(e.target.value) })}
                min="0"
                step="100"
                data-testid="settings-ai-retry-delay"
              />
            </div>
          </div>
          <div className="settings-row">
            <span className="settings-row-label">最大并发数</span>
            <div className="settings-row-control">
              <Input
                type="number"
                value={draft.ai.request.maxConcurrency}
                onChange={(e) => updateAiRequest({ maxConcurrency: Number(e.target.value) })}
                min="1"
                step="1"
                data-testid="settings-ai-max-concurrency"
              />
            </div>
          </div>
          <div className="settings-row">
            <span className="settings-row-label">每分钟请求上限</span>
            <div className="settings-row-control">
              <Input
                type="number"
                value={draft.ai.request.rateLimitPerMinute}
                onChange={(e) => updateAiRequest({ rateLimitPerMinute: Number(e.target.value) })}
                min="0"
                step="1"
                data-testid="settings-ai-rate-limit"
              />
            </div>
          </div>
        </div>
      </Card>
    </div>
  )

  const renderSyncSection = () => (
    <div className="settings-content-inner">
      <Card>
        <div className="settings-group">
          <div className="settings-row">
            <span className="settings-row-label">API 基地址</span>
            <div className="settings-row-control">
              <Input
                value={draft.sync.apiBaseUrl}
                onChange={(e) =>
                  setDraft({
                    ...draft,
                    sync: { ...draft.sync, apiBaseUrl: e.target.value }
                  })
                }
                placeholder="https://api.example.com"
                data-testid="settings-sync-api-base"
              />
            </div>
          </div>
        </div>
      </Card>
    </div>
  )

  const renderAutosaveSection = () => (
    <div className="settings-content-inner">
      <Card>
        <div className="settings-group">
          <div className="settings-row">
            <span className="settings-row-label">开启自动保存</span>
            <div className="settings-row-control">
              <Toggle
                checked={draft.autosave.enabled}
                onChange={(e) =>
                  setDraft({
                    ...draft,
                    autosave: { ...draft.autosave, enabled: e.target.checked }
                  })
                }
                data-testid="settings-autosave-toggle"
              />
            </div>
          </div>
          <div className="settings-row">
            <span className="settings-row-label">保存间隔（毫秒）</span>
            <div className="settings-row-control">
              <Input
                type="number"
                value={draft.autosave.intervalMs}
                onChange={(e) =>
                  setDraft({
                    ...draft,
                    autosave: { ...draft.autosave, intervalMs: Number(e.target.value) }
                  })
                }
                min="1000"
                step="1000"
                data-testid="settings-autosave-interval"
              />
            </div>
          </div>
        </div>
      </Card>
    </div>
  )

  const renderExportSection = () => (
    <div className="settings-content-inner">
      <Card>
        <div className="settings-group">
          <div className="settings-row">
            <span className="settings-row-label">默认格式</span>
            <div className="settings-row-control">
              <Select
                value={draft.export.defaultFormat}
                onChange={(value) =>
                  setDraft({
                    ...draft,
                    export: {
                      ...draft.export,
                      defaultFormat: value as Settings['export']['defaultFormat']
                    }
                  })
                }
                options={[
                  { value: 'markdown', label: 'Markdown' },
                  { value: 'html', label: 'HTML' }
                ]}
                testId="settings-export-format"
              />
            </div>
          </div>
        </div>
      </Card>
    </div>
  )

  const renderContent = () => {
    switch (activeCategory) {
      case 'account':
        return renderAccountSection()
      case 'profile':
        return renderProfileSection()
      case 'appearance':
        return renderAppearanceSection()
      case 'providers':
        return renderProvidersSection()
      case 'agents':
        return renderAgentsSection()
      case 'ai':
        return renderAISection()
      case 'sync':
        return renderSyncSection()
      case 'autosave':
        return renderAutosaveSection()
      case 'export':
        return renderExportSection()
      default:
        return null
    }
  }

  return (
    <div className="settings-page">
      <header className="settings-page-header">
        <button className="settings-back-btn" onClick={onBack} data-testid="settings-back">
          <ArrowLeft size={20} />
          <span>返回</span>
        </button>
        <h1 className="settings-page-title">设置</h1>
        <div className="settings-header-actions">
          <Button variant="primary" onClick={handleSave} data-testid="settings-save">保存设置</Button>
        </div>
      </header>

      <div className="settings-page-body">
        <nav className="settings-nav">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon
            return (
              <button
                key={item.id}
                className={`settings-nav-item ${activeCategory === item.id ? 'active' : ''}`}
                onClick={() => setActiveCategory(item.id)}
                data-testid={`settings-nav-${item.id}`}
              >
                <Icon className="nav-icon" size={18} />
                <span>{item.label}</span>
              </button>
            )
          })}
        </nav>

        <div className="settings-content">{renderContent()}</div>
      </div>
    </div>
  )
}
