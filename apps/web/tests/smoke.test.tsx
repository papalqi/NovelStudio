import { render, screen } from '@testing-library/react'
import { vi } from 'vitest'
import { App } from '../src/app/App'

const mockEditor = {
  document: [],
  replaceBlocks: vi.fn(),
  updateBlock: vi.fn(),
  insertBlocks: vi.fn(),
  getTextCursorPosition: () => ({ block: { id: 'block-1', type: 'paragraph', content: 'hi' } }),
  blocksToMarkdownLossy: () => 'markdown',
  blocksToHTMLLossy: () => '<p>html</p>'
}

vi.mock('@blocknote/react', () => ({
  useCreateBlockNote: () => mockEditor
}))

vi.mock('@blocknote/mantine', () => ({
  BlockNoteView: () => <div data-testid="editor" />
}))

const bootstrapResponse = {
  settings: {
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
    providers: [{ id: 'p1', name: 'Mock', baseUrl: 'http://x', token: '', model: 'm' }],
    agents: [{ id: 'a1', name: 'Agent', providerId: 'p1', systemPrompt: '' }],
    profile: { authorName: '测试' }
  },
  volumes: [{ id: 'v1', title: '卷一', orderIndex: 0 }],
  chapters: [
    {
      id: 'c1',
      volumeId: 'v1',
      title: '第1章',
      status: 'draft',
      tags: [],
      wordCount: 0,
      targetWordCount: 1000,
      orderIndex: 0,
      updatedAt: '2026-01-25',
      content: []
    }
  ],
  notes: []
}

beforeEach(() => {
  localStorage.setItem('novelstudio.auth.token', 'test-token')
  localStorage.setItem('novelstudio.auth.user', JSON.stringify({ userId: 'u1', username: '测试用户' }))
  if (!globalThis.fetch) {
    // @ts-expect-error test-only polyfill
    globalThis.fetch = vi.fn()
  }
  vi.spyOn(globalThis, 'fetch').mockImplementation(async (input: RequestInfo) => {
    if (typeof input === 'string' && input.includes('/api/bootstrap')) {
      return new Response(JSON.stringify(bootstrapResponse), { status: 200 })
    }
    if (typeof input === 'string' && input.includes('/api/auth/me')) {
      return new Response(JSON.stringify({ userId: 'u1', username: '测试用户' }), { status: 200 })
    }
    return new Response(JSON.stringify([]), { status: 200 })
  })
})

afterEach(() => {
  localStorage.clear()
  vi.restoreAllMocks()
})

test('App renders with explorer and editor', async () => {
  render(<App />)
  expect(await screen.findByText('资源管理器')).toBeInTheDocument()
  expect(await screen.findByTestId('editor')).toBeInTheDocument()
})
