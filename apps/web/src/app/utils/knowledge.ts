import type { Note } from '../../types'
import type { JsonSchema } from '../../utils/jsonSchema'

export type NoteField = {
  key: string
  label: string
  placeholder?: string
  multiline?: boolean
  rows?: number
  compact?: boolean
}

export const NOTE_TYPE_LABELS: Record<Note['type'], string> = {
  character: '角色',
  location: '地点',
  lore: '设定',
  reference: '引用'
}

export const NOTE_FIELD_DEFS: Record<Note['type'], NoteField[]> = {
  character: [
    { key: 'description', label: '角色概述', multiline: true, rows: 3 },
    { key: 'role', label: '身份/称号', placeholder: '例如：青铜剑客 / 城主之女' },
    { key: 'appearance', label: '外貌', multiline: true, rows: 2 },
    { key: 'personality', label: '性格', multiline: true, rows: 2 },
    { key: 'background', label: '背景', multiline: true, rows: 2 },
    { key: 'goal', label: '目标/动机', multiline: true, rows: 2 },
    { key: 'ability', label: '能力/技能', multiline: true, rows: 2 },
    { key: 'relationships', label: '关键关系', multiline: true, rows: 2 }
  ],
  location: [
    { key: 'description', label: '地点概述', multiline: true, rows: 3 },
    { key: 'type', label: '地点类型', placeholder: '例如：主城/遗迹/秘境' },
    { key: 'environment', label: '环境/气候', multiline: true, rows: 2 },
    { key: 'culture', label: '势力/文化', multiline: true, rows: 2 },
    { key: 'history', label: '历史/传说', multiline: true, rows: 2 },
    { key: 'feature', label: '标志性地点', multiline: true, rows: 2 },
    { key: 'danger', label: '冲突/风险', multiline: true, rows: 2 }
  ],
  lore: [{ key: 'description', label: '设定描述', multiline: true, rows: 4 }],
  reference: [{ key: 'description', label: '引用描述', multiline: true, rows: 4 }]
}

export const NOTE_CARD_FIELDS: Record<'character' | 'location', string[]> = {
  character: ['role', 'personality', 'goal'],
  location: ['type', 'environment', 'feature']
}

export const NOTE_AI_SCHEMAS: Record<'character' | 'location', JsonSchema> = {
  character: {
    type: 'object',
    required: ['description', 'role', 'appearance', 'personality', 'background', 'goal', 'ability', 'relationships'],
    properties: {
      description: { type: 'string' },
      role: { type: 'string' },
      appearance: { type: 'string' },
      personality: { type: 'string' },
      background: { type: 'string' },
      goal: { type: 'string' },
      ability: { type: 'string' },
      relationships: { type: 'string' }
    }
  },
  location: {
    type: 'object',
    required: ['description', 'type', 'environment', 'culture', 'history', 'feature', 'danger'],
    properties: {
      description: { type: 'string' },
      type: { type: 'string' },
      environment: { type: 'string' },
      culture: { type: 'string' },
      history: { type: 'string' },
      feature: { type: 'string' },
      danger: { type: 'string' }
    }
  }
}

const readNoteField = (note: Note, key: string) => {
  const value = note.content?.[key]
  if (typeof value === 'string') return value.trim()
  return ''
}

export const buildNoteSnapshot = (note: Note) => {
  const description = readNoteField(note, 'description')
  if (description) return description
  if (note.type === 'character' || note.type === 'location') {
    const lines = NOTE_FIELD_DEFS[note.type]
      .map((field) => {
        if (field.key === 'description') return ''
        const value = readNoteField(note, field.key)
        return value ? `${field.label}：${value}` : ''
      })
      .filter((line) => line.length > 0)
    if (lines.length) return lines.join('\n')
  }
  const fallback = Object.values(note.content).find(
    (value) => typeof value === 'string' && value.trim().length > 0
  )
  if (typeof fallback === 'string') return fallback.trim()
  return '（资料卡内容为空）'
}

export const buildReferenceHeader = (note: Note) => {
  const typeLabel = NOTE_TYPE_LABELS[note.type]
  const suffix = typeLabel ? `${note.title}（${typeLabel}）` : note.title
  return `【资料卡引用 kb:${note.id}】${suffix}`
}

export const parseReferenceId = (content: string) => {
  const match = content.match(/^【资料卡引用 kb:([A-Za-z0-9-]+)】/)
  return match ? match[1] : null
}
