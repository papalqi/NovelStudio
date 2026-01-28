export const DEFAULT_BLOCK_AI_PROMPTS = {
  rewrite: '请改写以下内容，保持意思一致但提升文学性。',
  expand: '请扩写以下内容，补充细节、动作与情绪。',
  shorten: '请压缩以下内容，保留关键情节。',
  continue: '请在以下内容后继续写作。'
} as const

export type BlockAiPromptKey = keyof typeof DEFAULT_BLOCK_AI_PROMPTS
