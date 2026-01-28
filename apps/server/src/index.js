import express from 'express'
import cors from 'cors'
import { z } from 'zod'
import crypto from 'node:crypto'
import { dataDir, getUserDb } from './db.js'
import { buildOpenAiEndpoint } from './openAiUrl.js'
import {
  createStore
} from './store.js'
import { resetDatabase, clearWorkspaceData } from './seedUtils.js'
import { enforceTestResetGuard } from './testGuards.js'
import {
  createUser,
  authenticateUser,
  createSession,
  getSessionByToken,
  revokeSession
} from './authStore.js'

const app = express()
const port = process.env.PORT || 8787
const host = process.env.HOST || '0.0.0.0'
const testResetEnabled = process.env.NOVELSTUDIO_ALLOW_TEST_RESET === '1'

if (testResetEnabled) {
  enforceTestResetGuard(dataDir)
}

app.use(cors())
app.use(express.json({ limit: '5mb' }))

const DEFAULT_SETTINGS = {
  sync: { apiBaseUrl: `http://localhost:${port}` },
  ui: { theme: 'light', fontFamily: 'IBM Plex Sans', editorWidth: 'full' },
  autosave: { enabled: true, intervalMs: 1500 },
  export: { defaultFormat: 'markdown' },
  ai: {
    temperature: 0.7,
    maxTokens: 2000,
    defaultProviderId: 'provider-papalqi',
    defaultAgentId: 'agent-writer',
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
      id: 'provider-papalqi',
      name: '用户 API',
      baseUrl: 'https://api.papalqi.top',
      token: 'sk-UQtfUNw1yniN9a9VlR8ENYK8xCg8LDr6YdS9TwNYqNTfpnEY',
      model: 'gpt-oss-120b'
    },
    {
      id: 'provider-openai',
      name: 'OpenAI 兼容',
      baseUrl: 'https://api.openai.com/v1',
      token: '',
      model: 'gpt-4o'
    },
    {
      id: 'provider-deepseek',
      name: 'DeepSeek',
      baseUrl: 'https://api.deepseek.com/v1',
      token: '',
      model: 'deepseek-chat'
    },
    {
      id: 'provider-local',
      name: '本地模型',
      baseUrl: 'http://localhost:11434/v1',
      token: 'ollama',
      model: 'qwen2.5:7b'
    }
  ],
  agents: [
    {
      id: 'agent-writer',
      name: '写作助手',
      providerId: 'provider-papalqi',
      systemPrompt: '你是专业的网络小说写作助手，擅长情节构思、文笔润色、角色塑造。请用中文回复，保持网文风格。',
      builtIn: true
    },
    {
      id: 'agent-continue',
      name: '续写大师',
      providerId: 'provider-papalqi',
      systemPrompt: '你是续写专家，能够根据上下文风格续写内容，保持人物性格一致，情节连贯。请直接输出续写内容，不要解释。',
      builtIn: true
    },
    {
      id: 'agent-polish',
      name: '润色专家',
      providerId: 'provider-papalqi',
      systemPrompt: '你是文笔润色专家，优化文字表达，增强画面感，但保持原意和风格不变。请直接输出润色后的内容。',
      builtIn: true
    },
    {
      id: 'agent-outline',
      name: '大纲规划师',
      providerId: 'provider-papalqi',
      systemPrompt: '你擅长故事结构设计，熟悉三幕式、英雄之旅等叙事框架。帮助作者规划章节大纲和情节走向。',
      builtIn: true
    },
    {
      id: 'agent-character',
      name: '角色设计师',
      providerId: 'provider-papalqi',
      systemPrompt: '你是角色设计专家，擅长创建立体的人物形象，包含外貌、性格、背景、动机。输出结构化的角色卡。',
      builtIn: true
    },
    {
      id: 'agent-worldbuilder',
      name: '世界构建师',
      providerId: 'provider-papalqi',
      systemPrompt: '你是世界观架构师，擅长构建完整的世界观体系，包括魔法/科技、社会/历史、地理/文化。',
      builtIn: true
    },
    {
      id: 'agent-dialogue',
      name: '对话专家',
      providerId: 'provider-papalqi',
      systemPrompt: '你擅长优化对话，让对话更自然、更有个性，符合角色身份和性格特点。请直接输出优化后的对话。',
      builtIn: true
    },
    {
      id: 'agent-proofreader',
      name: '校对助手',
      providerId: 'provider-papalqi',
      systemPrompt: '你是专业校对，检查错别字、病句、前后矛盾、设定冲突。以列表形式指出问题和建议修改。',
      builtIn: true
    }
  ],
  profile: { authorName: '匿名作者' }
}

const uuid = () => crypto.randomUUID()

const storeCache = new Map()

const getStoreForUser = (userId) => {
  if (!storeCache.has(userId)) {
    storeCache.set(userId, createStore(getUserDb(userId)))
  }
  return storeCache.get(userId)
}

const getBearerToken = (req) => {
  const header = req.headers.authorization || ''
  const [type, token] = header.split(' ')
  if (type !== 'Bearer' || !token) return null
  return token.trim()
}

const requireAuth = (req, res, next) => {
  const token = getBearerToken(req)
  if (!token) {
    return res.status(401).json({ error: '未登录' })
  }
  const session = getSessionByToken(token)
  if (!session) {
    return res.status(401).json({ error: '登录已过期' })
  }
  req.user = { id: session.userId, username: session.username }
  req.store = getStoreForUser(session.userId)
  req.sessionToken = token
  return next()
}

const PUBLIC_ROUTES = new Set(['/api/health', '/api/auth/login', '/api/auth/register'])

app.use((req, res, next) => {
  if (!req.path.startsWith('/api')) return next()
  if (PUBLIC_ROUTES.has(req.path)) return next()
  return requireAuth(req, res, next)
})

const extractModelIds = (payload) => {
  if (!payload) return []
  const data = Array.isArray(payload.data) ? payload.data : Array.isArray(payload.models) ? payload.models : []
  const ids = data
    .map((item) => {
      if (!item) return ''
      if (typeof item === 'string') return item
      if (typeof item === 'object') {
        return item.id || item.model || ''
      }
      return ''
    })
    .filter((value) => typeof value === 'string' && value.trim().length > 0)
  return Array.from(new Set(ids))
}

const mergeSettings = (stored) => {
  return {
    ...DEFAULT_SETTINGS,
    ...stored,
    sync: { ...DEFAULT_SETTINGS.sync, ...(stored?.sync ?? {}) },
    ui: { ...DEFAULT_SETTINGS.ui, ...(stored?.ui ?? {}) },
    autosave: { ...DEFAULT_SETTINGS.autosave, ...(stored?.autosave ?? {}) },
    export: { ...DEFAULT_SETTINGS.export, ...(stored?.export ?? {}) },
    ai: { ...DEFAULT_SETTINGS.ai, ...(stored?.ai ?? {}) },
    providers: stored?.providers?.length ? stored.providers : DEFAULT_SETTINGS.providers,
    agents: stored?.agents?.length ? stored.agents : DEFAULT_SETTINGS.agents,
    profile: { ...DEFAULT_SETTINGS.profile, ...(stored?.profile ?? {}) }
  }
}

app.get('/api/health', (_req, res) => {
  res.json({ ok: true })
})

app.post('/api/auth/register', (req, res) => {
  const schema = z.object({
    username: z.string().min(3).max(64),
    password: z.string().min(6).max(128)
  })
  try {
    const body = schema.parse(req.body)
    const user = createUser({ username: body.username, password: body.password })
    const session = createSession(user.id)
    res.json({ userId: user.id, username: user.username, token: session.token, expiresAt: session.expiresAt })
  } catch (error) {
    if (error?.code === 'user_exists') {
      return res.status(409).json({ error: '用户名已存在' })
    }
    return res.status(400).json({ error: error.message })
  }
})

app.post('/api/auth/login', (req, res) => {
  const schema = z.object({
    username: z.string().min(3).max(64),
    password: z.string().min(6).max(128)
  })
  try {
    const body = schema.parse(req.body)
    const user = authenticateUser({ username: body.username, password: body.password })
    if (!user) {
      return res.status(401).json({ error: '用户名或密码错误' })
    }
    const session = createSession(user.id)
    res.json({ userId: user.id, username: user.username, token: session.token, expiresAt: session.expiresAt })
  } catch (error) {
    res.status(400).json({ error: error.message })
  }
})

app.get('/api/auth/me', (req, res) => {
  res.json({ userId: req.user.id, username: req.user.username })
})

app.post('/api/auth/logout', (req, res) => {
  revokeSession(req.sessionToken)
  res.json({ ok: true })
})

app.post('/api/account/clear', (req, res) => {
  clearWorkspaceData(getUserDb(req.user.id))
  res.json({ ok: true })
})

app.get('/api/bootstrap', (req, res) => {
  const settings = mergeSettings(req.store.getSettings())
  const volumes = req.store.listVolumes()
  const chapters = req.store.listChapters()
  const notes = req.store.listNotes()
  res.json({ settings, volumes, chapters, notes })
})

app.get('/api/settings', (req, res) => {
  res.json(mergeSettings(req.store.getSettings()))
})

app.put('/api/settings', (req, res) => {
  const payload = req.body
  const settings = req.store.saveSettings(payload)
  res.json(mergeSettings(settings))
})

app.post('/api/volumes', (req, res) => {
  const schema = z.object({ id: z.string().default(uuid()), title: z.string(), orderIndex: z.number().default(0) })
  const volume = schema.parse(req.body)
  req.store.upsertVolume(volume)
  res.json({ ok: true })
})

app.put('/api/volumes/:id', (req, res) => {
  const schema = z.object({ title: z.string(), orderIndex: z.number() })
  const body = schema.parse(req.body)
  req.store.upsertVolume({ id: req.params.id, ...body })
  res.json({ ok: true })
})

app.delete('/api/volumes/:id', (req, res) => {
  req.store.deleteVolume(req.params.id)
  res.json({ ok: true })
})

app.post('/api/chapters', (req, res) => {
  const schema = z.object({
    id: z.string().default(uuid()),
    volumeId: z.string(),
    title: z.string(),
    status: z.string().default('draft'),
    tags: z.array(z.string()).default([]),
    wordCount: z.number().default(0),
    targetWordCount: z.number().default(0),
    orderIndex: z.number().default(0),
    content: z.any().default([]),
    revision: z.number().default(1)
  })
  const chapter = schema.parse(req.body)
  const saved = req.store.upsertChapter(chapter)
  res.json(saved)
})

app.get('/api/chapters/:id', (req, res) => {
  const chapter = req.store.getChapter(req.params.id)
  if (!chapter) return res.status(404).json({ error: 'not found' })
  res.json(chapter)
})

app.put('/api/chapters/:id', (req, res) => {
  const schema = z.object({
    volumeId: z.string(),
    title: z.string(),
    status: z.string(),
    tags: z.array(z.string()),
    wordCount: z.number(),
    targetWordCount: z.number(),
    orderIndex: z.number(),
    content: z.any(),
    revision: z.number().optional()
  })
  const body = schema.parse(req.body)
  const saved = req.store.upsertChapter({ id: req.params.id, ...body })
  res.json(saved)
})

app.put('/api/chapters/:id/content', (req, res) => {
  const schema = z.object({
    content: z.any(),
    wordCount: z.number(),
    updatedAt: z.string().optional(),
    revision: z.number().optional()
  })
  const body = schema.parse(req.body)
  const existing = req.store.getChapter(req.params.id)
  if (!existing) return res.status(404).json({ error: 'not found' })
  if (typeof body.revision === 'number' && existing.revision !== body.revision) {
    return res.status(409).send('conflict')
  }
  const saved = req.store.updateChapterContent({
    id: req.params.id,
    content: body.content,
    wordCount: body.wordCount,
    updatedAt: body.updatedAt
  })
  if (!saved) return res.status(404).json({ error: 'not found' })
  res.json(saved)
})

app.delete('/api/chapters/:id', (req, res) => {
  req.store.deleteChapter(req.params.id)
  res.json({ ok: true })
})

app.get('/api/chapters/:id/versions', (req, res) => {
  res.json(req.store.listVersions(req.params.id))
})

app.post('/api/chapters/:id/versions', (req, res) => {
  const schema = z.object({ snapshot: z.any() })
  const body = schema.parse(req.body)
  const versions = req.store.createVersion({ id: uuid(), chapterId: req.params.id, snapshot: body.snapshot })
  res.json(versions)
})

app.post('/api/chapters/:id/restore/:versionId', (req, res) => {
  const chapter = req.store.restoreVersion({ chapterId: req.params.id, versionId: req.params.versionId })
  if (!chapter) return res.status(404).json({ error: 'not found' })
  res.json(chapter)
})

app.get('/api/notes', (req, res) => {
  res.json(req.store.listNotes())
})

app.post('/api/notes', (req, res) => {
  const schema = z.object({ id: z.string().default(uuid()), type: z.string(), title: z.string(), content: z.any().default({}) })
  const note = schema.parse(req.body)
  res.json(req.store.upsertNote(note))
})

app.put('/api/notes/:id', (req, res) => {
  const schema = z.object({ type: z.string(), title: z.string(), content: z.any() })
  const body = schema.parse(req.body)
  res.json(req.store.upsertNote({ id: req.params.id, ...body }))
})

app.delete('/api/notes/:id', (req, res) => {
  req.store.deleteNote(req.params.id)
  res.json({ ok: true })
})

app.get('/api/chapters/:id/comments', (req, res) => {
  res.json(req.store.listComments(req.params.id))
})

app.post('/api/chapters/:id/comments', (req, res) => {
  const schema = z.object({ author: z.string().default('匿名'), body: z.string() })
  const body = schema.parse(req.body)
  res.json(req.store.addComment({ id: uuid(), chapterId: req.params.id, author: body.author, body: body.body }))
})

app.get('/api/ai/runs', (req, res) => {
  const chapterId = req.query.chapterId
  res.json(req.store.listAiRuns(typeof chapterId === 'string' ? chapterId : undefined))
})

app.post('/api/ai/runs', (req, res) => {
  const schema = z.object({
    id: z.string().default(uuid()),
    createdAt: z.string().optional(),
    chapterId: z.string().optional(),
    action: z.string(),
    status: z.enum(['success', 'error']),
    providerId: z.string().optional(),
    agentIds: z.array(z.string()).default([]),
    request: z.any(),
    response: z.any()
  })
  const body = schema.parse(req.body)
  const saved = req.store.createAiRun(body)
  res.json(saved)
})

if (testResetEnabled) {
  app.post('/api/test/reset', (req, res) => {
    resetDatabase(getUserDb(req.user.id), { seed: true })
    res.json({ ok: true })
  })
}

app.post('/api/ai/complete', async (req, res) => {
  const schema = z.object({
    provider: z.object({
      baseUrl: z.string(),
      token: z.string().optional(),
      model: z.string()
    }),
    messages: z.array(z.any()),
    temperature: z.number().optional(),
    maxTokens: z.number().optional()
  })
  try {
    const body = schema.parse(req.body)
    const endpoint = buildOpenAiEndpoint(body.provider.baseUrl, '/chat/completions')
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(body.provider.token ? { Authorization: `Bearer ${body.provider.token}` } : {})
      },
      body: JSON.stringify({
        model: body.provider.model,
        messages: body.messages,
        temperature: body.temperature ?? 0.7,
        max_tokens: body.maxTokens ?? 800
      })
    })

    if (!response.ok) {
      const errorText = await response.text()
      return res.status(500).json({ error: errorText })
    }

    const data = await response.json()
    const content = data.choices?.[0]?.message?.content ?? ''
    res.json({ content })
  } catch (error) {
    res.status(400).json({ error: error.message })
  }
})

app.post('/api/ai/models', async (req, res) => {
  const schema = z.object({
    baseUrl: z.string().min(1),
    token: z.string().optional()
  })

  try {
    const body = schema.parse(req.body)
    const endpoint = buildOpenAiEndpoint(body.baseUrl, '/models')
    const response = await fetch(endpoint, {
      method: 'GET',
      headers: {
        ...(body.token ? { Authorization: `Bearer ${body.token}` } : {})
      }
    })

    if (!response.ok) {
      const errorText = await response.text()
      return res.status(500).json({ error: errorText || `请求失败(${response.status})`, status: response.status })
    }

    const data = await response.json()
    const models = extractModelIds(data)
    res.json({ models })
  } catch (error) {
    res.status(400).json({ error: error.message })
  }
})

app.post('/api/ai/test', async (req, res) => {
  const schema = z.object({
    provider: z.object({
      baseUrl: z.string().min(1),
      token: z.string().optional(),
      model: z.string().min(1)
    })
  })

  try {
    const body = schema.parse(req.body)
    const endpoint = buildOpenAiEndpoint(body.provider.baseUrl, '/chat/completions')
    const startedAt = Date.now()
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(body.provider.token ? { Authorization: `Bearer ${body.provider.token}` } : {})
      },
      body: JSON.stringify({
        model: body.provider.model,
        messages: [{ role: 'user', content: 'ping' }],
        temperature: 0,
        max_tokens: 16
      })
    })

    if (!response.ok) {
      const errorText = await response.text()
      return res.status(500).json({ error: errorText || `请求失败(${response.status})`, status: response.status })
    }

    const data = await response.json()
    const content = data.choices?.[0]?.message?.content ?? ''
    res.json({
      ok: true,
      model: body.provider.model,
      latencyMs: Date.now() - startedAt,
      content
    })
  } catch (error) {
    res.status(400).json({ error: error.message })
  }
})

app.listen(port, host, () => {
  console.log(`NovelstudioAI server running at http://${host}:${port}`)
})
