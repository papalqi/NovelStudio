import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { vi } from 'vitest'
import type { Settings } from '../src/types'
import { SettingsPage } from '../src/app/components/SettingsPage'
import { fetchProviderModels, testProviderConnection } from '../src/api'

vi.mock('../src/api', () => ({
  fetchProviderModels: vi.fn(),
  testProviderConnection: vi.fn()
}))

const baseSettings: Settings = {
  sync: { apiBaseUrl: 'http://localhost:8787' },
  ui: { theme: 'light', fontFamily: 'IBM Plex Sans', editorWidth: 'full' },
  autosave: { enabled: true, intervalMs: 1000 },
  export: { defaultFormat: 'markdown' },
  ai: {
    temperature: 0.7,
    maxTokens: 800,
    defaultProviderId: 'p1',
    defaultAgentId: 'a1',
    request: {
      timeoutMs: 20000,
      maxRetries: 2,
      retryDelayMs: 800,
      maxConcurrency: 2,
      rateLimitPerMinute: 60
    }
  },
  providers: [{ id: 'p1', name: 'Mock', baseUrl: 'http://api.test/v1', token: '', model: '' }],
  agents: [{ id: 'a1', name: 'Agent', providerId: 'p1', systemPrompt: '' }],
  profile: { authorName: '测试' }
}

const fetchProviderModelsMock = vi.mocked(fetchProviderModels)
const testProviderConnectionMock = vi.mocked(testProviderConnection)

afterEach(() => {
  vi.clearAllMocks()
})

test('auto fetches provider models and applies default selection', async () => {
  fetchProviderModelsMock.mockResolvedValue({ models: ['model-a', 'model-b'] })

  render(<SettingsPage settings={baseSettings} onBack={vi.fn()} onSave={vi.fn()} />)

  fireEvent.click(screen.getByTestId('settings-nav-providers'))

  await waitFor(() => expect(fetchProviderModelsMock).toHaveBeenCalled(), { timeout: 2000 })
  await waitFor(() => expect(screen.getByTestId('settings-provider-model-p1')).toHaveValue('model-a'))
  expect(screen.getByTestId('settings-provider-endpoint-p1')).toHaveTextContent('http://api.test/v1/')
})

test('runs provider availability test from settings panel', async () => {
  fetchProviderModelsMock.mockResolvedValue({ models: ['model-a'] })
  testProviderConnectionMock.mockResolvedValue({ ok: true, latencyMs: 12, model: 'model-a', content: 'pong' })

  const settingsWithModel: Settings = {
    ...baseSettings,
    providers: [{ ...baseSettings.providers[0], model: 'model-a' }]
  }

  render(<SettingsPage settings={settingsWithModel} onBack={vi.fn()} onSave={vi.fn()} />)

  fireEvent.click(screen.getByTestId('settings-nav-providers'))

  fireEvent.click(screen.getByTestId('settings-provider-test-p1'))

  await waitFor(() => expect(testProviderConnectionMock).toHaveBeenCalled(), { timeout: 2000 })
  await waitFor(() =>
    expect(screen.getByTestId('settings-provider-test-status-p1')).toHaveTextContent('通过')
  )
})

test('displays base url without v1 when baseUrl ends with #', () => {
  const settingsWithHash: Settings = {
    ...baseSettings,
    providers: [{ ...baseSettings.providers[0], baseUrl: 'https://api.papalqi.top#' }]
  }

  render(<SettingsPage settings={settingsWithHash} onBack={vi.fn()} onSave={vi.fn()} />)

  fireEvent.click(screen.getByTestId('settings-nav-providers'))

  expect(screen.getByTestId('settings-provider-endpoint-p1')).toHaveTextContent('https://api.papalqi.top/')
})
