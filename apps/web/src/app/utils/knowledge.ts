import type { Note } from '../../types'

const noteTypeLabels: Record<Note['type'], string> = {
  character: '角色',
  location: '地点',
  lore: '设定',
  reference: '引用'
}

export const buildNoteSnapshot = (note: Note) => {
  const description = typeof note.content.description === 'string' ? note.content.description.trim() : ''
  if (description) return description
  const fallback = Object.values(note.content).find(
    (value) => typeof value === 'string' && value.trim().length > 0
  )
  if (typeof fallback === 'string') return fallback.trim()
  return '（资料卡内容为空）'
}

export const buildReferenceHeader = (note: Note) => {
  const typeLabel = noteTypeLabels[note.type]
  const suffix = typeLabel ? `${note.title}（${typeLabel}）` : note.title
  return `【资料卡引用 kb:${note.id}】${suffix}`
}

export const parseReferenceId = (content: string) => {
  const match = content.match(/^【资料卡引用 kb:([A-Za-z0-9-]+)】/)
  return match ? match[1] : null
}
