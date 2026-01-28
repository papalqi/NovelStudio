import type { Agent, Provider, Settings, BlockAiPromptSettings } from '../types'
import { runAiCompletion } from '../api'
import { validateJsonSchema, type JsonSchema } from '../utils/jsonSchema'
import { DEFAULT_BLOCK_AI_PROMPTS } from './aiPrompts'

export type AiAction =
  | 'rewrite'
  | 'expand'
  | 'shorten'
  | 'continue'
  | 'outline'
  | 'chapterCheck'
  | 'characterCheck'
  | 'styleTune'
  | 'worldbuilding'

const actionLabel: Record<AiAction, string> = {
  rewrite: '改写',
  expand: '扩写',
  shorten: '缩写',
  continue: '续写',
  outline: '章节大纲',
  chapterCheck: '连贯性检查',
  characterCheck: '角色一致性检查',
  styleTune: '风格润色',
  worldbuilding: '设定扩展'
}

const parseSchemaText = (schemaText: string) => {
  try {
    return JSON.parse(schemaText) as JsonSchema
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : '未知错误'
    throw new Error(`Schema 解析失败：${message}`)
  }
}

const resolveAgentSequence = (
  agents: Agent[],
  selectedAgentId?: string,
  defaultAgentId?: string,
  forcedAgentIds?: string[]
) => {
  if (forcedAgentIds?.length) {
    const sequence = forcedAgentIds
      .map((id) => agents.find((agent) => agent.id === id))
      .filter((agent): agent is Agent => !!agent)
    if (sequence.length) return sequence
  }
  const serialAgents = agents.filter((agent) => agent.serialEnabled)
  if (serialAgents.length > 0) {
    return serialAgents
      .map((agent, index) => ({ agent, order: agent.serialOrder ?? index }))
      .sort((a, b) => a.order - b.order)
      .map(({ agent }) => agent)
  }
  const fallbackId = selectedAgentId ?? defaultAgentId
  const fallbackAgent = agents.find((agent) => agent.id === fallbackId) ?? agents[0]
  return fallbackAgent ? [fallbackAgent] : []
}

const isBlockAction = (action: AiAction) =>
  action === 'rewrite' || action === 'expand' || action === 'shorten' || action === 'continue'

export const buildPrompt = (
  action: AiAction,
  content: string,
  context: string,
  agent?: Agent,
  schemaText?: string,
  validationHint?: string,
  promptOverrides?: Partial<BlockAiPromptSettings>
) => {
  const schemaInstruction = schemaText?.trim()
    ? `\n\n输出必须严格为 JSON，且符合以下 JSON Schema：\n${schemaText}\n只输出 JSON，不要添加解释。`
    : ''
  const validationInstruction = validationHint ? `\n\n${validationHint}` : ''
  const system = `${agent?.systemPrompt ?? '你是网络小说写作助手。'}${schemaInstruction}${validationInstruction}`
  const baseInstruction: Record<AiAction, string> = {
    rewrite: DEFAULT_BLOCK_AI_PROMPTS.rewrite,
    expand: DEFAULT_BLOCK_AI_PROMPTS.expand,
    shorten: DEFAULT_BLOCK_AI_PROMPTS.shorten,
    continue: DEFAULT_BLOCK_AI_PROMPTS.continue,
    outline: '请根据以下章节内容生成结构化大纲（分镜、节奏、冲突）。',
    chapterCheck: '请检查以下章节的连贯性并给出修改建议。',
    characterCheck: '请检查以下章节中的人物一致性，并指出矛盾点。',
    styleTune: '请优化以下内容的语言风格，使其更符合网络小说叙述。',
    worldbuilding: '请基于以下内容扩展世界观设定。'
  }
  const override = isBlockAction(action) ? promptOverrides?.[action] : undefined
  const instruction = override?.trim() ? override.trim() : baseInstruction[action]

  const user = [instruction, '\n\n上下文：', context, '\n\n正文：', content].join('')
  return [{ role: 'system', content: system }, { role: 'user', content: user }]
}

export const runAiAction = async (params: {
  action: AiAction
  content: string
  context: string
  settings: Settings
  providers: Provider[]
  agents: Agent[]
  providerId?: string
  agentId?: string
  agentSequenceIds?: string[]
}) => {
  const provider = params.providers.find((item) => item.id === (params.providerId ?? params.settings.ai.defaultProviderId))
  const agentSequence = resolveAgentSequence(
    params.agents,
    params.agentId,
    params.settings.ai.defaultAgentId,
    params.agentSequenceIds
  )

  if (!provider) {
    throw new Error('未配置 Provider')
  }

  if (!agentSequence.length) {
    throw new Error('未配置 Agent')
  }

  let currentContent = params.content
  let totalRetries = 0
  let totalAttempts = 0

  for (const agent of agentSequence) {
    const schemaText = agent.outputSchema?.trim() || ''
    const schema = schemaText ? parseSchemaText(schemaText) : null
    const maxSchemaAttempts = Math.max(1, params.settings.ai.request.maxRetries + 1)
    let schemaAttempt = 0
    let lastSchemaError: Error | null = null

    while (schemaAttempt < maxSchemaAttempts) {
      schemaAttempt += 1
      const validationHint =
        schemaAttempt > 1 && schemaText ? '上次输出未通过校验，请严格输出符合 Schema 的 JSON。' : undefined
      const stepProvider = params.providers.find((item) => item.id === agent.providerId) ?? provider
      const messages = buildPrompt(
        params.action,
        currentContent,
        params.context,
        agent,
        schemaText,
        validationHint,
        params.settings.ai.prompts?.block
      )
      const response = await runAiCompletion(
        {
          provider: {
            baseUrl: stepProvider.baseUrl,
            token: stepProvider.token,
            model: stepProvider.model
          },
          messages,
          temperature: params.settings.ai.temperature,
          maxTokens: params.settings.ai.maxTokens
        },
        params.settings.sync.apiBaseUrl,
        params.settings.ai.request
      )

      totalRetries += response.meta.retries
      totalAttempts += response.meta.attempts

      if (schema) {
        let parsed: unknown
        try {
          parsed = JSON.parse(response.content)
        } catch (error: unknown) {
          const message = error instanceof Error ? error.message : '输出非 JSON'
          lastSchemaError = new Error(`Schema 校验失败：${message}`)
        }
        if (parsed !== undefined) {
          const validation = validateJsonSchema(schema, parsed)
          if (validation.valid) {
            currentContent = JSON.stringify(parsed, null, 2)
            break
          }
          lastSchemaError = new Error(`Schema 校验失败：${validation.errors[0] ?? '输出不符合 Schema'}`)
        }
      } else {
        currentContent = response.content
        break
      }

      if (schemaAttempt >= maxSchemaAttempts && lastSchemaError) {
        throw lastSchemaError
      }
    }
  }

  return {
    content: currentContent,
    provider,
    agent: agentSequence[agentSequence.length - 1],
    label: actionLabel[params.action],
    meta: { retries: totalRetries, attempts: totalAttempts },
    agentSequenceIds: agentSequence.map((item) => item.id)
  }
}

export const getAiActionLabel = (action: AiAction) => actionLabel[action]
