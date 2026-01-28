import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { vi } from 'vitest'
import type { Settings } from '../src/types'
import { SettingsPage } from '../src/app/components/SettingsPage'

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

const authUser = { userId: 'u1', username: '测试用户' }

test('account section clears workspace data', async () => {
  const onClearWorkspace = vi.fn().mockResolvedValue(undefined)

  render(
    <SettingsPage
      settings={baseSettings}
      onBack={vi.fn()}
      onSave={vi.fn()}
      authUser={authUser}
      onLogout={vi.fn()}
      onClearWorkspace={onClearWorkspace}
    />
  )

  fireEvent.click(screen.getByTestId('settings-nav-account'))
  fireEvent.click(screen.getByTestId('settings-auth-clear'))
  fireEvent.click(screen.getByTestId('settings-auth-clear-confirm'))

  await waitFor(() => expect(onClearWorkspace).toHaveBeenCalledTimes(1))
  await waitFor(() =>
    expect(screen.getByTestId('settings-auth-clear-status')).toHaveTextContent('已清空')
  )
})
