import { db, dataDir, dbPath } from './db.js'
import { seedSettings, seedVolumes, seedChapters, seedNotes } from './seedData.js'

const args = process.argv.slice(2)
const isClean = args.includes('--clean')
const isHelp = args.includes('--help') || args.includes('-h')

if (isHelp) {
  console.log('Usage: node src/seed.js [--clean]')
  console.log('  --clean  Only clear data without inserting seed records')
  process.exit(0)
}

const clearTables = () => {
  db.exec(`
    delete from comments;
    delete from chapter_versions;
    delete from chapters;
    delete from volumes;
    delete from notes;
    delete from settings;
  `)
}

const insertSeed = () => {
  const settingsStmt = db.prepare(
    'insert into settings (key, value) values (?, ?)'
  )
  for (const [key, value] of Object.entries(seedSettings)) {
    settingsStmt.run(key, JSON.stringify(value))
  }

  const volumeStmt = db.prepare(
    'insert into volumes (id, title, orderIndex, createdAt, updatedAt) values (?, ?, ?, ?, ?)'
  )
  seedVolumes.forEach((volume) => {
    volumeStmt.run(volume.id, volume.title, volume.orderIndex, volume.createdAt, volume.updatedAt)
  })

  const chapterStmt = db.prepare(`
    insert into chapters (id, volumeId, title, status, tags, wordCount, targetWordCount, orderIndex, updatedAt, content, revision)
    values (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `)
  seedChapters.forEach((chapter) => {
    chapterStmt.run(
      chapter.id,
      chapter.volumeId,
      chapter.title,
      chapter.status,
      JSON.stringify(chapter.tags),
      chapter.wordCount,
      chapter.targetWordCount,
      chapter.orderIndex,
      chapter.updatedAt,
      JSON.stringify(chapter.content),
      chapter.revision
    )
  })

  const noteStmt = db.prepare(
    'insert into notes (id, type, title, content, updatedAt) values (?, ?, ?, ?, ?)'
  )
  seedNotes.forEach((note) => {
    noteStmt.run(note.id, note.type, note.title, JSON.stringify(note.content), note.updatedAt)
  })
}

console.log(`Seed data path: ${dataDir}`)
console.log(`Database: ${dbPath}`)

clearTables()

if (!isClean) {
  insertSeed()
  console.log('Seed data inserted.')
} else {
  console.log('Data cleared. No seed inserted.')
}

console.log('Done.')
