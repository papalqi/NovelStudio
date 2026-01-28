export const SEED_TIMESTAMP = '2026-01-01T00:00:00.000Z'

const paragraph = (id, text) => ({
  id,
  type: 'paragraph',
  props: {
    textColor: 'default',
    backgroundColor: 'default',
    textAlignment: 'left'
  },
  content: [{ type: 'text', text }],
  children: []
})

const resolveSeedApiBaseUrl = () => {
  const override = process.env.NOVELSTUDIO_SEED_API_BASE_URL
  if (override && override.trim()) return override
  const port = process.env.PORT || '8787'
  return `http://localhost:${port}`
}

export const seedSettings = {
  sync: { apiBaseUrl: resolveSeedApiBaseUrl() },
  ui: { theme: 'light', fontFamily: 'IBM Plex Sans', editorWidth: 'full' },
  autosave: { enabled: true, intervalMs: 1500 },
  export: { defaultFormat: 'markdown' },
  ai: {
    temperature: 0.7,
    maxTokens: 800,
    defaultProviderId: 'provider-default',
    defaultAgentId: 'agent-default',
    prompts: {
      block: {
        rewrite: '请改写以下内容，保持意思一致但提升文学性。',
        expand: '请扩写以下内容，补充细节、动作与情绪。',
        shorten: '请压缩以下内容，保留关键情节。',
        continue: '请在以下内容后继续写作。'
      }
    },
    request: {
      timeoutMs: 20000,
      maxRetries: 2,
      retryDelayMs: 800,
      maxConcurrency: 2,
      rateLimitPerMinute: 60
    }
  },
  providers: [
    {
      id: 'provider-default',
      name: 'OpenAI Compatible',
      baseUrl: 'https://api.example.com/v1',
      token: '',
      model: 'gpt-4.1-mini'
    }
  ],
  agents: [
    {
      id: 'agent-default',
      name: '章节编辑 Agent',
      providerId: 'provider-default',
      systemPrompt: '你是网络小说编辑助手，擅长结构规划与续写。'
    }
  ],
  profile: { authorName: '测试作者' }
}

export const seedVolumes = [
  {
    id: 'volume-001',
    title: '第一卷 · 试读',
    orderIndex: 0,
    createdAt: SEED_TIMESTAMP,
    updatedAt: SEED_TIMESTAMP
  },
  {
    id: 'volume-002',
    title: '第二卷 · 测试',
    orderIndex: 1,
    createdAt: SEED_TIMESTAMP,
    updatedAt: SEED_TIMESTAMP
  }
]

export const seedChapters = [
  {
    id: 'chapter-001',
    volumeId: 'volume-001',
    title: '第1章 试读开篇',
    status: 'draft',
    tags: ['开篇', '试读'],
    wordCount: 12,
    targetWordCount: 1200,
    orderIndex: 0,
    updatedAt: SEED_TIMESTAMP,
    content: [paragraph('block-001', '这是种子章节内容，用于回归测试。')],
    revision: 1
  },
  {
    id: 'chapter-002',
    volumeId: 'volume-001',
    title: '第2章 试读延展',
    status: 'review',
    tags: ['试读'],
    wordCount: 8,
    targetWordCount: 1200,
    orderIndex: 1,
    updatedAt: SEED_TIMESTAMP,
    content: [paragraph('block-002', '这是第二个种子章节。')],
    revision: 1
  },
  {
    id: 'chapter-003',
    volumeId: 'volume-002',
    title: '第3章 测试章节',
    status: 'done',
    tags: ['测试'],
    wordCount: 10,
    targetWordCount: 1500,
    orderIndex: 0,
    updatedAt: SEED_TIMESTAMP,
    content: [paragraph('block-003', '用于验证完成状态与版本功能。')],
    revision: 1
  }
]

export const seedNotes = [
  {
    id: 'note-001',
    type: 'character',
    title: '主角 A',
    content: { description: '主角设定：出身、性格、目标。' },
    updatedAt: SEED_TIMESTAMP
  },
  {
    id: 'note-002',
    type: 'location',
    title: '主城',
    content: { description: '主要故事发生地点。' },
    updatedAt: SEED_TIMESTAMP
  }
]
