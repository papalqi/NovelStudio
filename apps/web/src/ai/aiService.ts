import type { Agent, Provider, Settings } from '../types'
import { runAiCompletion } from '../api'

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

export const buildPrompt = (action: AiAction, content: string, context: string, agent?: Agent) => {
  const system = agent?.systemPrompt ?? '你是网络小说写作助手。'
  const instruction = {
    rewrite: '请改写以下内容，保持意思一致但提升文学性。',
    expand: '请扩写以下内容，补充细节、动作与情绪。',
    shorten: '请压缩以下内容，保留关键情节。',
    continue: '请在以下内容后继续写作。',
    outline: '请根据以下章节内容生成结构化大纲（分镜、节奏、冲突）。',
    chapterCheck: '请检查以下章节的连贯性并给出修改建议。',
    characterCheck: '请检查以下章节中的人物一致性，并指出矛盾点。',
    styleTune: '请优化以下内容的语言风格，使其更符合网络小说叙述。',
    worldbuilding: '请基于以下内容扩展世界观设定。'
  }[action]

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
}) => {
  const provider = params.providers.find((item) => item.id === (params.providerId ?? params.settings.ai.defaultProviderId))
  const agent = params.agents.find((item) => item.id === (params.agentId ?? params.settings.ai.defaultAgentId))

  if (!provider) {
    throw new Error('未配置 Provider')
  }

  const messages = buildPrompt(params.action, params.content, params.context, agent)
  const response = await runAiCompletion(
    {
      provider: {
        baseUrl: provider.baseUrl,
        token: provider.token,
        model: provider.model
      },
      messages,
      temperature: params.settings.ai.temperature,
      maxTokens: params.settings.ai.maxTokens
    },
    params.settings.sync.apiBaseUrl,
    params.settings.ai.request
  )

  return {
    content: response.content,
    provider,
    agent,
    label: actionLabel[params.action],
    meta: response.meta
  }
}

export const getAiActionLabel = (action: AiAction) => actionLabel[action]
