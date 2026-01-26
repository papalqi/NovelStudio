import Database from 'better-sqlite3'
import path from 'node:path'
import fs from 'node:fs'

const dataDir = path.resolve(process.cwd(), 'data')
const dbPath = path.join(dataDir, 'novelstudio.db')

if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true })
}

export const db = new Database(dbPath)

db.pragma('journal_mode = WAL')

db.exec(`
  create table if not exists settings (
    key text primary key,
    value text not null
  );

  create table if not exists volumes (
    id text primary key,
    title text not null,
    orderIndex integer not null,
    createdAt text not null,
    updatedAt text not null
  );

  create table if not exists chapters (
    id text primary key,
    volumeId text not null,
    title text not null,
    status text not null,
    tags text not null,
    wordCount integer not null,
    targetWordCount integer not null,
    orderIndex integer not null,
    updatedAt text not null,
    content text not null,
    revision integer not null
  );

  create table if not exists chapter_versions (
    id text primary key,
    chapterId text not null,
    createdAt text not null,
    snapshot text not null
  );

  create table if not exists notes (
    id text primary key,
    type text not null,
    title text not null,
    content text not null,
    updatedAt text not null
  );

  create table if not exists comments (
    id text primary key,
    chapterId text not null,
    author text not null,
    body text not null,
    createdAt text not null
  );
`)
