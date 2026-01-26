export const getPlainTextFromInline = (inline: unknown) => {
  if (!inline) return ''
  if (typeof inline === 'object' && inline !== null && 'type' in inline) {
    const typed = inline as { type?: string; text?: string }
    if (typed.type === 'text') return typed.text ?? ''
    if (typed.type === 'link') return typed.text ?? ''
  }
  return ''
}

export const getPlainTextFromBlock = (block: { content?: unknown } | null | undefined) => {
  if (!block?.content) return ''
  if (typeof block.content === 'string') return block.content
  if (Array.isArray(block.content)) {
    return block.content.map(getPlainTextFromInline).join('')
  }
  return ''
}

export const getPlainTextFromDoc = (blocks: { content?: unknown }[]) =>
  blocks.map(getPlainTextFromBlock).join('\n')

export const estimateWordCount = (blocks: { content?: unknown }[]) => {
  const text = getPlainTextFromDoc(blocks).replace(/\s+/g, '')
  return text.length
}
