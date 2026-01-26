import { useEffect, useState } from 'react'
import type { Settings, Provider, Agent } from '../../types'
import { createId } from '../../utils/id'
import './SettingsPanel.css'

type SettingsPanelProps = {
  open: boolean
  settings: Settings | null
  onClose: () => void
  onSave: (settings: Settings) => void
}

export const SettingsPanel = ({ open, settings, onClose, onSave }: SettingsPanelProps) => {
  const [draft, setDraft] = useState<Settings | null>(settings)

  useEffect(() => {
    setDraft(settings)
  }, [settings])

  if (!open || !draft) return null

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

  return (
    <div className="settings-overlay">
      <div className="settings-panel">
        <header>
          <h2>设置面板</h2>
          <button className="ghost-button" onClick={onClose}>
            关闭
          </button>
        </header>
        <div className="settings-body">
          <section>
            <h3>基础设置</h3>
            <label>
              作者名称
              <input
                value={draft.profile.authorName}
                onChange={(event) =>
                  setDraft({
                    ...draft,
                    profile: { ...draft.profile, authorName: event.target.value }
                  })
                }
              />
            </label>
            <label>
              API 基地址
              <input
                value={draft.sync.apiBaseUrl}
                onChange={(event) =>
                  setDraft({
                    ...draft,
                    sync: { ...draft.sync, apiBaseUrl: event.target.value }
                  })
                }
              />
            </label>
            <label>
              主题
              <select
                value={draft.ui.theme}
                onChange={(event) =>
                  setDraft({
                    ...draft,
                    ui: { ...draft.ui, theme: event.target.value as Settings['ui']['theme'] }
                  })
                }
              >
                <option value="light">浅色</option>
                <option value="dark">深色</option>
              </select>
            </label>
            <label>
              字体
              <input
                value={draft.ui.fontFamily}
                onChange={(event) =>
                  setDraft({
                    ...draft,
                    ui: { ...draft.ui, fontFamily: event.target.value }
                  })
                }
              />
            </label>
            <label>
              编辑区宽度
              <select
                value={draft.ui.editorWidth}
                onChange={(event) =>
                  setDraft({
                    ...draft,
                    ui: {
                      ...draft.ui,
                      editorWidth: event.target.value as Settings['ui']['editorWidth']
                    }
                  })
                }
              >
                <option value="full">全宽</option>
                <option value="center">居中</option>
              </select>
            </label>
          </section>

          <section>
            <h3>自动保存</h3>
            <label>
              开启自动保存
              <input
                type="checkbox"
                checked={draft.autosave.enabled}
                onChange={(event) =>
                  setDraft({
                    ...draft,
                    autosave: { ...draft.autosave, enabled: event.target.checked }
                  })
                }
              />
            </label>
            <label>
              保存间隔（毫秒）
              <input
                type="number"
                value={draft.autosave.intervalMs}
                onChange={(event) =>
                  setDraft({
                    ...draft,
                    autosave: { ...draft.autosave, intervalMs: Number(event.target.value) }
                  })
                }
              />
            </label>
          </section>

          <section>
            <h3>AI 默认参数</h3>
            <label>
              Temperature
              <input
                type="number"
                value={draft.ai.temperature}
                onChange={(event) =>
                  setDraft({
                    ...draft,
                    ai: { ...draft.ai, temperature: Number(event.target.value) }
                  })
                }
              />
            </label>
            <label>
              Max Tokens
              <input
                type="number"
                value={draft.ai.maxTokens}
                onChange={(event) =>
                  setDraft({
                    ...draft,
                    ai: { ...draft.ai, maxTokens: Number(event.target.value) }
                  })
                }
              />
            </label>
            <label>
              默认 Provider
              <select
                value={draft.ai.defaultProviderId}
                onChange={(event) =>
                  setDraft({ ...draft, ai: { ...draft.ai, defaultProviderId: event.target.value } })
                }
              >
                {draft.providers.map((provider) => (
                  <option key={provider.id} value={provider.id}>
                    {provider.name}
                  </option>
                ))}
              </select>
            </label>
            <label>
              默认 Agent
              <select
                value={draft.ai.defaultAgentId}
                onChange={(event) =>
                  setDraft({ ...draft, ai: { ...draft.ai, defaultAgentId: event.target.value } })
                }
              >
                {draft.agents.map((agent) => (
                  <option key={agent.id} value={agent.id}>
                    {agent.name}
                  </option>
                ))}
              </select>
            </label>
          </section>

          <section>
            <h3>Provider 配置</h3>
            {draft.providers.map((provider) => (
              <div key={provider.id} className="settings-card">
                <input
                  value={provider.name}
                  onChange={(event) => updateProvider(provider.id, { name: event.target.value })}
                />
                <input
                  value={provider.baseUrl}
                  onChange={(event) => updateProvider(provider.id, { baseUrl: event.target.value })}
                  placeholder="https://api.xxx.com/v1"
                />
                <input
                  value={provider.token}
                  onChange={(event) => updateProvider(provider.id, { token: event.target.value })}
                  placeholder="token"
                />
                <input
                  value={provider.model}
                  onChange={(event) => updateProvider(provider.id, { model: event.target.value })}
                  placeholder="model"
                />
                <button
                  className="ghost-button"
                  onClick={() =>
                    setDraft({
                      ...draft,
                      providers: draft.providers.filter((item) => item.id !== provider.id)
                    })
                  }
                >
                  删除 Provider
                </button>
              </div>
            ))}
            <button
              className="ghost-button"
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
              + Provider
            </button>
          </section>

          <section>
            <h3>Agent 配置</h3>
            {draft.agents.map((agent) => (
              <div key={agent.id} className="settings-card">
                <input
                  value={agent.name}
                  onChange={(event) => updateAgent(agent.id, { name: event.target.value })}
                />
                <select
                  value={agent.providerId}
                  onChange={(event) => updateAgent(agent.id, { providerId: event.target.value })}
                >
                  {draft.providers.map((provider) => (
                    <option key={provider.id} value={provider.id}>
                      {provider.name}
                    </option>
                  ))}
                </select>
                <textarea
                  rows={3}
                  value={agent.systemPrompt}
                  onChange={(event) => updateAgent(agent.id, { systemPrompt: event.target.value })}
                />
                <button
                  className="ghost-button"
                  onClick={() =>
                    setDraft({
                      ...draft,
                      agents: draft.agents.filter((item) => item.id !== agent.id)
                    })
                  }
                >
                  删除 Agent
                </button>
              </div>
            ))}
            <button
              className="ghost-button"
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
              + Agent
            </button>
          </section>

          <section>
            <h3>导出设置</h3>
            <label>
              默认格式
              <select
                value={draft.export.defaultFormat}
                onChange={(event) =>
                  setDraft({
                    ...draft,
                    export: {
                      ...draft.export,
                      defaultFormat: event.target.value as Settings['export']['defaultFormat']
                    }
                  })
                }
              >
                <option value="markdown">Markdown</option>
                <option value="html">HTML</option>
              </select>
            </label>
          </section>
        </div>
        <footer>
          <button className="ghost-button" onClick={onClose}>
            取消
          </button>
          <button
            className="primary-button"
            onClick={() => {
              onSave(draft)
              onClose()
            }}
          >
            保存设置
          </button>
        </footer>
      </div>
    </div>
  )
}
