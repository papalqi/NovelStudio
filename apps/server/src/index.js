import express from 'express'
import cors from 'cors'
import { z } from 'zod'
import crypto from 'node:crypto'
import {
  getSettings,
  saveSettings,
  listVolumes,
  upsertVolume,
  deleteVolume,
  listChapters,
  getChapter,
  upsertChapter,
  updateChapterContent,
  deleteChapter,
  listVersions,
  createVersion,
  restoreVersion,
  listNotes,
  upsertNote,
  deleteNote,
  listComments,
  addComment
} from './store.js'

const app = express()
const port = process.env.PORT || 8787

app.use(cors())
app.use(express.json({ limit: '5mb' }))

const DEFAULT_SETTINGS = {
  sync: { apiBaseUrl: `http://localhost:${port}` },
  ui: { theme: 'light', fontFamily: 'IBM Plex Sans', editorWidth: 'full' },
  autosave: { enabled: true, intervalMs: 1500 },
  export: { defaultFormat: 'markdown' },
  ai: {
    temperature: 0.7,
    maxTokens: 800,
    defaultProviderId: 'provider-default',
    defaultAgentId: 'agent-default'
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
  profile: { authorName: '匿名作者' }
}

const uuid = () => crypto.randomUUID()

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

app.get('/api/bootstrap', (_req, res) => {
  const settings = mergeSettings(getSettings())
  const volumes = listVolumes()
  const chapters = listChapters()
  const notes = listNotes()
  res.json({ settings, volumes, chapters, notes })
})

app.get('/api/settings', (_req, res) => {
  res.json(mergeSettings(getSettings()))
})

app.put('/api/settings', (req, res) => {
  const payload = req.body
  const settings = saveSettings(payload)
  res.json(mergeSettings(settings))
})

app.post('/api/volumes', (req, res) => {
  const schema = z.object({ id: z.string().default(uuid()), title: z.string(), orderIndex: z.number().default(0) })
  const volume = schema.parse(req.body)
  upsertVolume(volume)
  res.json({ ok: true })
})

app.put('/api/volumes/:id', (req, res) => {
  const schema = z.object({ title: z.string(), orderIndex: z.number() })
  const body = schema.parse(req.body)
  upsertVolume({ id: req.params.id, ...body })
  res.json({ ok: true })
})

app.delete('/api/volumes/:id', (req, res) => {
  deleteVolume(req.params.id)
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
  const saved = upsertChapter(chapter)
  res.json(saved)
})

app.get('/api/chapters/:id', (req, res) => {
  const chapter = getChapter(req.params.id)
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
  const saved = upsertChapter({ id: req.params.id, ...body })
  res.json(saved)
})

app.put('/api/chapters/:id/content', (req, res) => {
  const schema = z.object({ content: z.any(), wordCount: z.number(), updatedAt: z.string().optional() })
  const body = schema.parse(req.body)
  const saved = updateChapterContent({ id: req.params.id, ...body })
  if (!saved) return res.status(404).json({ error: 'not found' })
  res.json(saved)
})

app.delete('/api/chapters/:id', (req, res) => {
  deleteChapter(req.params.id)
  res.json({ ok: true })
})

app.get('/api/chapters/:id/versions', (req, res) => {
  res.json(listVersions(req.params.id))
})

app.post('/api/chapters/:id/versions', (req, res) => {
  const schema = z.object({ snapshot: z.any() })
  const body = schema.parse(req.body)
  const versions = createVersion({ id: uuid(), chapterId: req.params.id, snapshot: body.snapshot })
  res.json(versions)
})

app.post('/api/chapters/:id/restore/:versionId', (req, res) => {
  const chapter = restoreVersion({ chapterId: req.params.id, versionId: req.params.versionId })
  if (!chapter) return res.status(404).json({ error: 'not found' })
  res.json(chapter)
})

app.get('/api/notes', (_req, res) => {
  res.json(listNotes())
})

app.post('/api/notes', (req, res) => {
  const schema = z.object({ id: z.string().default(uuid()), type: z.string(), title: z.string(), content: z.any().default({}) })
  const note = schema.parse(req.body)
  res.json(upsertNote(note))
})

app.put('/api/notes/:id', (req, res) => {
  const schema = z.object({ type: z.string(), title: z.string(), content: z.any() })
  const body = schema.parse(req.body)
  res.json(upsertNote({ id: req.params.id, ...body }))
})

app.delete('/api/notes/:id', (req, res) => {
  deleteNote(req.params.id)
  res.json({ ok: true })
})

app.get('/api/chapters/:id/comments', (req, res) => {
  res.json(listComments(req.params.id))
})

app.post('/api/chapters/:id/comments', (req, res) => {
  const schema = z.object({ author: z.string().default('匿名'), body: z.string() })
  const body = schema.parse(req.body)
  res.json(addComment({ id: uuid(), chapterId: req.params.id, author: body.author, body: body.body }))
})

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
    const { baseUrl } = body.provider
    const endpoint = baseUrl.endsWith('/v1') ? `${baseUrl}/chat/completions` : `${baseUrl.replace(/\/$/, '')}/v1/chat/completions`
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

app.listen(port, () => {
  console.log(`NovelstudioAI server running at http://localhost:${port}`)
})
