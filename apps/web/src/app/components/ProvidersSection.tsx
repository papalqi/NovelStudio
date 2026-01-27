import { useCallback, useEffect, useRef, useState } from 'react'
import type { Provider } from '../../types'
import { fetchProviderModels, testProviderConnection } from '../../api'
import { createId } from '../../utils/id'
import { createLogEntry, formatLogEntry, type LogEntry } from '../../utils/logging'
import { nowMs } from '../../utils/time'
import { Card, Input, Select, Button } from './common'

type ProviderModelState = {
  status: 'idle' | 'loading' | 'success' | 'error'
  models: string[]
  error?: string
  lastFetchedAt?: string
  requestId?: string
}

type ProviderTestState = {
  status: 'idle' | 'loading' | 'success' | 'error'
  message?: string
  durationMs?: number
  requestId?: string
}

type ModelFetchReason = 'auto' | 'manual'

type ProvidersSectionProps = {
  providers: Provider[]
  onSetProviders: (updater: (prev: Provider[]) => Provider[]) => void
  syncApiBaseUrl?: string
}

const normalizeModelList = (models: string[]) => {
  const cleaned = models.map((value) => value.trim()).filter((value) => value.length > 0)
  return Array.from(new Set(cleaned))
}

const buildProviderSummary = (provider: Provider, extra?: string) => {
  const payload = [
    `provider=${provider.id}`,
    `baseUrl=${provider.baseUrl || '-'}`,
    `model=${provider.model || '-'}`,
    extra
  ]
    .filter(Boolean)
    .join(' ')
  return payload
}

const formatTimeLabel = (value?: string) => {
  if (!value) return ''
  try {
    return new Date(value).toLocaleTimeString()
  } catch {
    return value
  }
}

export const ProvidersSection = ({ providers, onSetProviders, syncApiBaseUrl }: ProvidersSectionProps) => {
  const [modelStates, setModelStates] = useState<Record<string, ProviderModelState>>({})
  const [testStates, setTestStates] = useState<Record<string, ProviderTestState>>({})
  const [providerLogs, setProviderLogs] = useState<Record<string, LogEntry>>({})
  const providersRef = useRef(providers)
  const modelFetchTimers = useRef<Record<string, ReturnType<typeof setTimeout>>>({})
  const modelRequestIds = useRef<Record<string, string>>({})
  const testRequestIds = useRef<Record<string, string>>({})
  const lastModelKeys = useRef<Record<string, string>>({})

  useEffect(() => {
    providersRef.current = providers
  }, [providers])

  const updateProvider = useCallback(
    (id: string, patch: Partial<Provider>) => {
      onSetProviders((prev) => prev.map((item) => (item.id === id ? { ...item, ...patch } : item)))
    },
    [onSetProviders]
  )

  const removeProvider = useCallback(
    (id: string) => {
      onSetProviders((prev) => prev.filter((item) => item.id !== id))
    },
    [onSetProviders]
  )

  const addProvider = useCallback(() => {
    onSetProviders((prev) => [
      ...prev,
      { id: createId(), name: '新 Provider', baseUrl: '', token: '', model: '' }
    ])
  }, [onSetProviders])

  const pushProviderLog = useCallback(
    (provider: Provider, status: LogEntry['status'], message: string, durationMs?: number, extra?: string) => {
      const entry = createLogEntry({
        scope: 'ai',
        status,
        message,
        durationMs,
        payloadSummary: buildProviderSummary(provider, extra)
      })
      setProviderLogs((prev) => ({ ...prev, [provider.id]: entry }))
    },
    []
  )

  const applyDefaultModel = useCallback(
    (providerId: string, models: string[]) => {
      if (models.length === 0) return
      onSetProviders((prev) => {
        const provider = prev.find((item) => item.id === providerId)
        if (!provider || provider.model.trim().length > 0) return prev
        return prev.map((item) => (item.id === providerId ? { ...item, model: models[0] } : item))
      })
    },
    [onSetProviders]
  )

  const fetchProviderModelsFor = useCallback(
    async (provider: Provider, reason: ModelFetchReason) => {
      const baseUrl = provider.baseUrl.trim()
      const token = provider.token.trim()
      if (!baseUrl) {
        setModelStates((prev) => ({
          ...prev,
          [provider.id]: { status: 'idle', models: [], error: undefined }
        }))
        if (reason === 'manual') {
          pushProviderLog(provider, 'warn', '模型列表获取失败：未配置 API 地址', 0, 'action=model-list')
        }
        return
      }

      const current = providersRef.current.find((item) => item.id === provider.id)
      if (!current) return
      if (current.baseUrl.trim() !== baseUrl || current.token.trim() !== token) return

      const requestId = createId()
      modelRequestIds.current[provider.id] = requestId
      setModelStates((prev) => ({
        ...prev,
        [provider.id]: {
          status: 'loading',
          models: prev[provider.id]?.models ?? [],
          error: undefined,
          requestId
        }
      }))
      const startedAt = nowMs()

      try {
        const response = await fetchProviderModels({ baseUrl, token }, syncApiBaseUrl)
        if (modelRequestIds.current[provider.id] !== requestId) return
        const models = normalizeModelList(response.models ?? [])
        setModelStates((prev) => ({
          ...prev,
          [provider.id]: {
            status: 'success',
            models,
            error: undefined,
            lastFetchedAt: new Date().toISOString(),
            requestId
          }
        }))
        pushProviderLog(
          provider,
          'success',
          `模型列表获取成功（${models.length}个）`,
          nowMs() - startedAt,
          `action=model-list reason=${reason} count=${models.length}`
        )
        applyDefaultModel(provider.id, models)
      } catch (error) {
        if (modelRequestIds.current[provider.id] !== requestId) return
        const message = error instanceof Error ? error.message : '模型列表获取失败'
        setModelStates((prev) => ({
          ...prev,
          [provider.id]: {
            status: 'error',
            models: prev[provider.id]?.models ?? [],
            error: message,
            lastFetchedAt: prev[provider.id]?.lastFetchedAt,
            requestId
          }
        }))
        pushProviderLog(
          provider,
          'error',
          `模型列表获取失败：${message}`,
          nowMs() - startedAt,
          `action=model-list reason=${reason}`
        )
      }
    },
    [applyDefaultModel, pushProviderLog, syncApiBaseUrl]
  )

  const scheduleModelFetch = useCallback(
    (provider: Provider, reason: ModelFetchReason) => {
      if (modelFetchTimers.current[provider.id]) {
        clearTimeout(modelFetchTimers.current[provider.id])
      }
      const delay = reason === 'auto' ? 600 : 0
      modelFetchTimers.current[provider.id] = setTimeout(() => {
        void fetchProviderModelsFor(provider, reason)
      }, delay)
    },
    [fetchProviderModelsFor]
  )

  const runProviderTest = useCallback(
    async (provider: Provider) => {
      const baseUrl = provider.baseUrl.trim()
      const token = provider.token.trim()
      const model = provider.model.trim()
      if (!baseUrl || !model) {
        const message = !baseUrl ? '请先填写 API 地址' : '请先选择模型'
        setTestStates((prev) => ({
          ...prev,
          [provider.id]: { status: 'error', message, durationMs: 0 }
        }))
        pushProviderLog(provider, 'warn', `可用性测试跳过：${message}`, 0, 'action=test')
        return
      }

      const requestId = createId()
      testRequestIds.current[provider.id] = requestId
      setTestStates((prev) => ({
        ...prev,
        [provider.id]: { status: 'loading', message: '测试中...', durationMs: 0, requestId }
      }))
      const startedAt = nowMs()

      try {
        const response = await testProviderConnection({ provider: { baseUrl, token, model } }, syncApiBaseUrl)
        if (testRequestIds.current[provider.id] !== requestId) return
        const durationMs = response.latencyMs ?? nowMs() - startedAt
        setTestStates((prev) => ({
          ...prev,
          [provider.id]: { status: 'success', message: '通过', durationMs, requestId }
        }))
        pushProviderLog(provider, 'success', '可用性测试通过', durationMs, 'action=test')
      } catch (error) {
        if (testRequestIds.current[provider.id] !== requestId) return
        const message = error instanceof Error ? error.message : '测试失败'
        const durationMs = nowMs() - startedAt
        setTestStates((prev) => ({
          ...prev,
          [provider.id]: { status: 'error', message, durationMs, requestId }
        }))
        pushProviderLog(provider, 'error', `可用性测试失败：${message}`, durationMs, 'action=test')
      }
    },
    [pushProviderLog, syncApiBaseUrl]
  )

  useEffect(() => {
    const providerIds = new Set(providers.map((provider) => provider.id))

    setModelStates((prev) => {
      const next: Record<string, ProviderModelState> = {}
      Object.entries(prev).forEach(([id, state]) => {
        if (providerIds.has(id)) next[id] = state
      })
      return next
    })

    setTestStates((prev) => {
      const next: Record<string, ProviderTestState> = {}
      Object.entries(prev).forEach(([id, state]) => {
        if (providerIds.has(id)) next[id] = state
      })
      return next
    })

    setProviderLogs((prev) => {
      const next: Record<string, LogEntry> = {}
      Object.entries(prev).forEach(([id, entry]) => {
        if (providerIds.has(id)) next[id] = entry
      })
      return next
    })

    Object.keys(modelFetchTimers.current).forEach((id) => {
      if (!providerIds.has(id)) {
        clearTimeout(modelFetchTimers.current[id])
        delete modelFetchTimers.current[id]
      }
    })

    Object.keys(lastModelKeys.current).forEach((id) => {
      if (!providerIds.has(id)) delete lastModelKeys.current[id]
    })

    Object.keys(modelRequestIds.current).forEach((id) => {
      if (!providerIds.has(id)) delete modelRequestIds.current[id]
    })

    Object.keys(testRequestIds.current).forEach((id) => {
      if (!providerIds.has(id)) delete testRequestIds.current[id]
    })
  }, [providers])

  useEffect(() => {
    providers.forEach((provider) => {
      const baseUrl = provider.baseUrl.trim()
      const token = provider.token.trim()
      const key = `${baseUrl}|${token}`
      const prevKey = lastModelKeys.current[provider.id]
      if (key === prevKey) return
      lastModelKeys.current[provider.id] = key
      if (!baseUrl) {
        setModelStates((prev) => ({
          ...prev,
          [provider.id]: { status: 'idle', models: [], error: undefined }
        }))
        return
      }
      scheduleModelFetch({ ...provider, baseUrl, token }, 'auto')
    })
  }, [providers, scheduleModelFetch])

  useEffect(() => {
    return () => {
      Object.values(modelFetchTimers.current).forEach((timer) => clearTimeout(timer))
    }
  }, [])

  return (
    <div className="settings-content-inner">
      <Card header="Provider 列表">
        <div className="settings-group">
          {providers.map((provider) => {
            const modelState = modelStates[provider.id]
            const testState = testStates[provider.id]
            const logEntry = providerLogs[provider.id]
            const models = modelState?.models ?? []
            const modelOptions = models.map((model) => ({ value: model, label: model }))
            if (provider.model && !models.includes(provider.model)) {
              modelOptions.unshift({ value: provider.model, label: `${provider.model}（自定义）` })
            }
            const modelStatusText = (() => {
              const baseUrl = provider.baseUrl.trim()
              if (!baseUrl) return '未配置 API 地址'
              if (modelState?.status === 'loading') return '模型列表加载中...'
              if (modelState?.status === 'error') {
                return `模型列表获取失败：${modelState.error ?? '未知错误'}`
              }
              if (modelState?.status === 'success') {
                const timeLabel = formatTimeLabel(modelState.lastFetchedAt)
                const suffix = timeLabel ? `（${timeLabel}）` : ''
                return modelState.models.length > 0
                  ? `已加载 ${modelState.models.length} 个模型${suffix}`
                  : `模型列表为空${suffix}`
              }
              return '待获取模型列表'
            })()
            const testStatusText = (() => {
              if (testState?.status === 'loading') return '测试中...'
              if (testState?.status === 'success') {
                const duration = testState.durationMs ? Math.round(testState.durationMs) : 0
                return duration > 0 ? `通过（${duration}ms）` : '通过'
              }
              if (testState?.status === 'error') {
                return `失败：${testState.message ?? '未知错误'}`
              }
              return '未测试'
            })()

            return (
              <div
                key={provider.id}
                className="settings-item-card"
                data-testid={`settings-provider-card-${provider.id}`}
              >
                <div className="settings-item-header">
                  <Input
                    value={provider.name}
                    onChange={(e) => updateProvider(provider.id, { name: e.target.value })}
                    placeholder="Provider 名称"
                    data-testid={`settings-provider-name-${provider.id}`}
                  />
                  <Button
                    variant="danger"
                    size="sm"
                    onClick={() => removeProvider(provider.id)}
                    data-testid={`settings-provider-delete-${provider.id}`}
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
                    data-testid={`settings-provider-baseurl-${provider.id}`}
                  />
                  <Input
                    value={provider.token}
                    onChange={(e) => updateProvider(provider.id, { token: e.target.value })}
                    placeholder="API Token"
                    label="Token"
                    type="password"
                    data-testid={`settings-provider-token-${provider.id}`}
                  />
                  <div className="provider-model-grid">
                    <Select
                      value={provider.model}
                      onChange={(value) => updateProvider(provider.id, { model: value })}
                      options={modelOptions}
                      placeholder={modelState?.status === 'loading' ? '加载中...' : '自动获取模型列表'}
                      label="模型列表"
                      testId={`settings-provider-model-select-${provider.id}`}
                    />
                    <Input
                      value={provider.model}
                      onChange={(e) => updateProvider(provider.id, { model: e.target.value })}
                      placeholder="gpt-4"
                      label="自定义模型"
                      data-testid={`settings-provider-model-${provider.id}`}
                    />
                  </div>
                  <div className="provider-action-row">
                    <Button
                      variant="ghost"
                      size="sm"
                      loading={modelState?.status === 'loading'}
                      onClick={() =>
                        scheduleModelFetch(
                          { ...provider, baseUrl: provider.baseUrl.trim(), token: provider.token.trim() },
                          'manual'
                        )
                      }
                      data-testid={`settings-provider-model-refresh-${provider.id}`}
                    >
                      刷新模型
                    </Button>
                    <span
                      className={`provider-status ${modelState?.status ?? 'idle'}`}
                      data-testid={`settings-provider-model-status-${provider.id}`}
                    >
                      {modelStatusText}
                    </span>
                  </div>
                  <div className="provider-action-row">
                    <Button
                      variant="primary"
                      size="sm"
                      loading={testState?.status === 'loading'}
                      onClick={() => runProviderTest(provider)}
                      data-testid={`settings-provider-test-${provider.id}`}
                    >
                      测试连接
                    </Button>
                    <span
                      className={`provider-status ${testState?.status ?? 'idle'}`}
                      data-testid={`settings-provider-test-status-${provider.id}`}
                    >
                      {testStatusText}
                    </span>
                  </div>
                  {logEntry && (
                    <div className="provider-log" data-testid={`settings-provider-log-${provider.id}`}>
                      {formatLogEntry(logEntry)}
                    </div>
                  )}
                </div>
              </div>
            )
          })}
          <Button
            variant="ghost"
            className="settings-add-button"
            onClick={addProvider}
            data-testid="settings-provider-add"
          >
            + 添加 Provider
          </Button>
        </div>
      </Card>
    </div>
  )
}
