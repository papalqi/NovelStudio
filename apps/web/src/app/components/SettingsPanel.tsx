import { useEffect, useState } from 'react'
import { User, Palette, Bot, Cloud, Save, Download } from 'lucide-react'
import type { Settings, Provider, Agent } from '../../types'
import { createId } from '../../utils/id'
import { Modal, Card, Input, Select, Toggle, Button } from './common'
import './SettingsPanel.css'

type SettingsPanelProps = {
  open: boolean
  settings: Settings | null
  onClose: () => void
  onSave: (settings: Settings) => void
}

type SettingsCategory = 'profile' | 'appearance' | 'ai' | 'sync' | 'autosave' | 'export'

const NAV_ITEMS: { id: SettingsCategory; label: string; icon: typeof User }[] = [
  { id: 'profile', label: '个人资料', icon: User },
  { id: 'appearance', label: '外观', icon: Palette },
  { id: 'ai', label: 'AI 设置', icon: Bot },
  { id: 'sync', label: '同步', icon: Cloud },
  { id: 'autosave', label: '自动保存', icon: Save },
  { id: 'export', label: '导出', icon: Download }
]

export const SettingsPanel = ({ open, settings, onClose, onSave }: SettingsPanelProps) => {
  const [draft, setDraft] = useState<Settings | null>(settings)
  const [activeCategory, setActiveCategory] = useState<SettingsCategory>('profile')

  useEffect(() => {
    setDraft(settings)
  }, [settings])

  if (!draft) return null

  const updateProvider = (id: string, patch: Partial<Provider>) => {
    setDraft({
      ...draft,
      providers: draft.providers.map((item) => (item.id === id ? { ...item, ...patch } : item))
    })
  }

  const updateAgent = (id: string, patch: Partial<Agent>) => {
    setDraft({
      ...draft,
      agents: draft.agents.map((item) => (item.id === id ? { ...item, ...patch } : item))
    })
  }

  const handleSave = () => {
    onSave(draft)
    onClose()
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
              />
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
              />
            </div>
          </div>
        </div>
      </Card>
    </div>
  )

  const renderAISection = () => (
    <div className="settings-content-inner">
      {/* AI 默认参数 */}
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
              />
            </div>
          </div>
        </div>
      </Card>

      {/* Provider 配置 */}
      <Card header="Provider 配置">
        <div className="settings-group">
          {draft.providers.map((provider) => (
            <div key={provider.id} className="settings-item-card">
              <div className="settings-item-header">
                <Input
                  value={provider.name}
                  onChange={(e) => updateProvider(provider.id, { name: e.target.value })}
                  placeholder="Provider 名称"
                />
                <Button
                  variant="danger"
                  size="sm"
                  onClick={() =>
                    setDraft({
                      ...draft,
                      providers: draft.providers.filter((item) => item.id !== provider.id)
                    })
                  }
                >
                  删除
                </Button>
              </div>
              <div className="settings-item-fields">
                <Input
                  value={provider.baseUrl}
                  onChange={(e) => updateProvider(provider.id, { baseUrl: e.target.value })}
                  placeholder="https://api.xxx.com/v1"
                  label="API 地址"
                />
                <Input
                  value={provider.token}
                  onChange={(e) => updateProvider(provider.id, { token: e.target.value })}
                  placeholder="API Token"
                  label="Token"
                  type="password"
                />
                <Input
                  value={provider.model}
                  onChange={(e) => updateProvider(provider.id, { model: e.target.value })}
                  placeholder="gpt-4"
                  label="模型"
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
                providers: [
                  ...draft.providers,
                  { id: createId(), name: '新 Provider', baseUrl: '', token: '', model: '' }
                ]
              })
            }
          >
            + 添加 Provider
          </Button>
        </div>
      </Card>

      {/* Agent 配置 */}
      <Card header="Agent 配置">
        <div className="settings-group">
          {draft.agents.map((agent) => (
            <div key={agent.id} className="settings-item-card">
              <div className="settings-item-header">
                <Input
                  value={agent.name}
                  onChange={(e) => updateAgent(agent.id, { name: e.target.value })}
                  placeholder="Agent 名称"
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
                />
                <Input
                  value={agent.systemPrompt}
                  onChange={(e) => updateAgent(agent.id, { systemPrompt: e.target.value })}
                  placeholder="输入系统提示词..."
                  label="System Prompt"
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
          >
            + 添加 Agent
          </Button>
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
              />
            </div>
          </div>
        </div>
      </Card>
    </div>
  )

  const renderContent = () => {
    switch (activeCategory) {
      case 'profile':
        return renderProfileSection()
      case 'appearance':
        return renderAppearanceSection()
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
    <Modal open={open} onClose={onClose} title="设置">
      <div className="settings-container">
        <div className="settings-layout">
          {/* Left Navigation */}
          <nav className="settings-nav">
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon
              return (
                <button
                  key={item.id}
                  className={`settings-nav-item ${activeCategory === item.id ? 'active' : ''}`}
                  onClick={() => setActiveCategory(item.id)}
                >
                  <Icon className="nav-icon" size={18} />
                  <span>{item.label}</span>
                </button>
              )
            })}
          </nav>

          {/* Content Area */}
          <div className="settings-content">{renderContent()}</div>
        </div>

        {/* Footer */}
        <div className="settings-footer">
          <div />
          <div className="settings-footer-right">
            <Button variant="ghost" onClick={onClose}>
              取消
            </Button>
            <Button variant="primary" onClick={handleSave}>
              保存设置
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  )
}
