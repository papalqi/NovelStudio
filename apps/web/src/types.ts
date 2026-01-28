import type { DefaultBlockSchema, DefaultInlineContentSchema, DefaultStyleSchema, PartialBlock } from '@blocknote/core'

export type ChapterStatus = 'draft' | 'review' | 'done'

export type Volume = {
  id: string
  title: string
  orderIndex: number
  createdAt?: string
  updatedAt?: string
}

export type Chapter = {
  id: string
  volumeId: string
  title: string
  status: ChapterStatus
  tags: string[]
  wordCount: number
  targetWordCount: number
  orderIndex: number
  updatedAt: string
  content: Block[]
  revision?: number
}

export type Block = PartialBlock<DefaultBlockSchema, DefaultInlineContentSchema, DefaultStyleSchema>

export type Provider = {
  id: string
  name: string
  baseUrl: string
  token: string
  model: string
}

export type Agent = {
  id: string
  name: string
  providerId: string
  systemPrompt: string
  outputSchema?: string
  serialEnabled?: boolean
  serialOrder?: number
}

export type AiRequestSettings = {
  timeoutMs: number
  maxRetries: number
  retryDelayMs: number
  maxConcurrency: number
  rateLimitPerMinute: number
}

export type BlockAiPromptSettings = {
  rewrite: string
  expand: string
  shorten: string
  continue: string
}

export type AiPromptSettings = {
  block: BlockAiPromptSettings
}

export type Settings = {
  sync: { apiBaseUrl: string }
  ui: { theme: 'light' | 'dark'; fontFamily: string; editorWidth: 'full' | 'center' }
  autosave: { enabled: boolean; intervalMs: number }
  export: { defaultFormat: 'markdown' | 'html' }
  ai: {
    temperature: number
    maxTokens: number
    defaultProviderId: string
    defaultAgentId: string
    request: AiRequestSettings
    prompts: AiPromptSettings
  }
  providers: Provider[]
  agents: Agent[]
  profile: { authorName: string }
}

export type Note = {
  id: string
  type: 'character' | 'location' | 'lore' | 'reference'
  title: string
  content: Record<string, unknown>
  updatedAt: string
}

export type ChapterVersion = {
  id: string
  chapterId: string
  createdAt: string
  snapshot: Chapter
}

export type Comment = {
  id: string
  chapterId: string
  author: string
  body: string
  createdAt: string
}

export type AiRunRequest = {
  action: string
  content: string
  context: string
  providerId?: string
  agentId?: string
  agentSequenceIds: string[]
  temperature: number
  maxTokens: number
  requestConfig: AiRequestSettings
  targetBlockId?: string
  scope: 'block' | 'chapter'
}

export type AiRunResponse = {
  content?: string
  error?: string
  meta?: { retries: number; attempts: number }
}

export type AiRunRecord = {
  id: string
  createdAt: string
  status: 'success' | 'error'
  chapterId?: string
  action: string
  providerId?: string
  agentIds: string[]
  request: AiRunRequest
  response: AiRunResponse
}

export type AppBootstrap = {
  settings: Settings
  volumes: Volume[]
  chapters: Chapter[]
  notes: Note[]
}
