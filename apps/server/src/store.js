import { db } from './db.js'

const now = () => new Date().toISOString()

const parseJSON = (value, fallback) => {
  try {
    return JSON.parse(value)
  } catch {
    return fallback
  }
}

export const getSettings = () => {
  const rows = db.prepare('select key, value from settings').all()
  const settings = {}
  for (const row of rows) {
    settings[row.key] = parseJSON(row.value, row.value)
  }
  return settings
}

export const saveSettings = (settings) => {
  const stmt = db.prepare('insert into settings (key, value) values (?, ?) on conflict(key) do update set value = excluded.value')
  const txn = db.transaction((payload) => {
    for (const [key, value] of Object.entries(payload)) {
      stmt.run(key, JSON.stringify(value))
    }
  })
  txn(settings)
  return getSettings()
}

export const listVolumes = () => {
  return db.prepare('select * from volumes order by orderIndex asc').all()
}

export const upsertVolume = (volume) => {
  const existing = db.prepare('select id from volumes where id = ?').get(volume.id)
  const timestamp = now()
  if (existing) {
    db.prepare('update volumes set title = ?, orderIndex = ?, updatedAt = ? where id = ?')
      .run(volume.title, volume.orderIndex, timestamp, volume.id)
  } else {
    db.prepare('insert into volumes (id, title, orderIndex, createdAt, updatedAt) values (?, ?, ?, ?, ?)')
      .run(volume.id, volume.title, volume.orderIndex, timestamp, timestamp)
  }
}

export const deleteVolume = (volumeId) => {
  db.prepare('delete from volumes where id = ?').run(volumeId)
  db.prepare('delete from chapters where volumeId = ?').run(volumeId)
}

export const listChapters = () => {
  const rows = db.prepare('select * from chapters order by orderIndex asc').all()
  return rows.map((row) => ({
    ...row,
    tags: parseJSON(row.tags, []),
    content: parseJSON(row.content, [])
  }))
}

export const getChapter = (id) => {
  const row = db.prepare('select * from chapters where id = ?').get(id)
  if (!row) return null
  return {
    ...row,
    tags: parseJSON(row.tags, []),
    content: parseJSON(row.content, [])
  }
}

export const upsertChapter = (chapter) => {
  const existing = db.prepare('select revision from chapters where id = ?').get(chapter.id)
  const timestamp = now()
  if (existing) {
    const revision = chapter.revision ?? existing.revision
    db.prepare(`
      update chapters
      set volumeId = ?, title = ?, status = ?, tags = ?, wordCount = ?, targetWordCount = ?, orderIndex = ?, updatedAt = ?, content = ?, revision = ?
      where id = ?
    `).run(
      chapter.volumeId,
      chapter.title,
      chapter.status,
      JSON.stringify(chapter.tags ?? []),
      chapter.wordCount ?? 0,
      chapter.targetWordCount ?? 0,
      chapter.orderIndex ?? 0,
      timestamp,
      JSON.stringify(chapter.content ?? []),
      revision,
      chapter.id
    )
  } else {
    db.prepare(`
      insert into chapters (id, volumeId, title, status, tags, wordCount, targetWordCount, orderIndex, updatedAt, content, revision)
      values (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      chapter.id,
      chapter.volumeId,
      chapter.title,
      chapter.status ?? 'draft',
      JSON.stringify(chapter.tags ?? []),
      chapter.wordCount ?? 0,
      chapter.targetWordCount ?? 0,
      chapter.orderIndex ?? 0,
      timestamp,
      JSON.stringify(chapter.content ?? []),
      chapter.revision ?? 1
    )
  }
  return getChapter(chapter.id)
}

export const updateChapterContent = ({ id, content, wordCount, updatedAt, revision }) => {
  const existing = db.prepare('select revision from chapters where id = ?').get(id)
  if (!existing) return null
  const nextRevision = (existing.revision ?? 0) + 1
  const timestamp = updatedAt ?? now()
  db.prepare('update chapters set content = ?, wordCount = ?, updatedAt = ?, revision = ? where id = ?')
    .run(JSON.stringify(content ?? []), wordCount ?? 0, timestamp, revision ?? nextRevision, id)
  return getChapter(id)
}

export const deleteChapter = (id) => {
  db.prepare('delete from chapters where id = ?').run(id)
  db.prepare('delete from chapter_versions where chapterId = ?').run(id)
  db.prepare('delete from comments where chapterId = ?').run(id)
}

export const listVersions = (chapterId) => {
  const rows = db.prepare('select * from chapter_versions where chapterId = ? order by createdAt desc').all(chapterId)
  return rows.map((row) => ({
    ...row,
    snapshot: parseJSON(row.snapshot, {})
  }))
}

export const createVersion = ({ id, chapterId, snapshot }) => {
  const timestamp = now()
  db.prepare('insert into chapter_versions (id, chapterId, createdAt, snapshot) values (?, ?, ?, ?)')
    .run(id, chapterId, timestamp, JSON.stringify(snapshot))
  return listVersions(chapterId)
}

export const restoreVersion = ({ chapterId, versionId }) => {
  const row = db.prepare('select snapshot from chapter_versions where id = ? and chapterId = ?').get(versionId, chapterId)
  if (!row) return null
  const snapshot = parseJSON(row.snapshot, {})
  return upsertChapter({ ...snapshot, id: chapterId })
}

export const listNotes = () => {
  const rows = db.prepare('select * from notes order by updatedAt desc').all()
  return rows.map((row) => ({ ...row, content: parseJSON(row.content, {}) }))
}

export const upsertNote = (note) => {
  const existing = db.prepare('select id from notes where id = ?').get(note.id)
  const timestamp = now()
  if (existing) {
    db.prepare('update notes set type = ?, title = ?, content = ?, updatedAt = ? where id = ?')
      .run(note.type, note.title, JSON.stringify(note.content ?? {}), timestamp, note.id)
  } else {
    db.prepare('insert into notes (id, type, title, content, updatedAt) values (?, ?, ?, ?, ?)')
      .run(note.id, note.type, note.title, JSON.stringify(note.content ?? {}), timestamp)
  }
  const row = db.prepare('select * from notes where id = ?').get(note.id)
  return row ? { ...row, content: parseJSON(row.content, {}) } : row
}

export const deleteNote = (id) => {
  db.prepare('delete from notes where id = ?').run(id)
}

export const listComments = (chapterId) => {
  return db.prepare('select * from comments where chapterId = ? order by createdAt desc').all(chapterId)
}

export const addComment = ({ id, chapterId, author, body }) => {
  const timestamp = now()
  db.prepare('insert into comments (id, chapterId, author, body, createdAt) values (?, ?, ?, ?, ?)')
    .run(id, chapterId, author, body, timestamp)
  return listComments(chapterId)
}

export const listAiRuns = (chapterId) => {
  const rows = chapterId
    ? db.prepare('select * from ai_runs where chapterId = ? order by createdAt desc').all(chapterId)
    : db.prepare('select * from ai_runs order by createdAt desc').all()
  return rows.map((row) => ({
    ...row,
    agentIds: parseJSON(row.agentIds, []),
    request: parseJSON(row.request, {}),
    response: parseJSON(row.response, {})
  }))
}

export const createAiRun = (run) => {
  const timestamp = run.createdAt ?? now()
  db.prepare(`
    insert into ai_runs (id, chapterId, action, status, providerId, agentIds, request, response, createdAt)
    values (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    run.id,
    run.chapterId ?? null,
    run.action,
    run.status,
    run.providerId ?? null,
    JSON.stringify(run.agentIds ?? []),
    JSON.stringify(run.request ?? {}),
    JSON.stringify(run.response ?? {}),
    timestamp
  )
  const row = db.prepare('select * from ai_runs where id = ?').get(run.id)
  if (!row) return null
  return {
    ...row,
    agentIds: parseJSON(row.agentIds, []),
    request: parseJSON(row.request, {}),
    response: parseJSON(row.response, {})
  }
}
