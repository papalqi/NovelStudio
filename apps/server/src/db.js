import Database from 'better-sqlite3'
import path from 'node:path'
import fs from 'node:fs'

const resolveDataDir = () => {
  const override = process.env.NOVELSTUDIO_DATA_DIR
  if (override && override.trim()) {
    return path.resolve(override)
  }
  return path.resolve(process.cwd(), 'data')
}

export const dataDir = resolveDataDir()

const ensureDir = (dirPath) => {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true })
  }
}

const initDataSchema = (db) => {
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

    create table if not exists ai_runs (
      id text primary key,
      chapterId text,
      action text not null,
      status text not null,
      providerId text,
      agentIds text not null,
      request text not null,
      response text not null,
      createdAt text not null
    );
  `)
}

const initAuthSchema = (db) => {
  db.exec(`
    create table if not exists users (
      id text primary key,
      username text not null unique,
      passwordHash text not null,
      salt text not null,
      createdAt text not null,
      updatedAt text not null
    );

    create table if not exists sessions (
      id text primary key,
      userId text not null,
      token text not null unique,
      createdAt text not null,
      expiresAt text not null,
      revokedAt text,
      foreign key(userId) references users(id)
    );
  `)
}

const userDbCache = new Map()
let authDb = null

export const getAuthDb = () => {
  if (authDb) return authDb
  ensureDir(dataDir)
  const dbPath = path.join(dataDir, 'auth.db')
  authDb = new Database(dbPath)
  authDb.pragma('journal_mode = WAL')
  initAuthSchema(authDb)
  return authDb
}

export const getUserDb = (userId) => {
  if (!userId) {
    throw new Error('userId is required')
  }
  if (userDbCache.has(userId)) {
    return userDbCache.get(userId)
  }
  ensureDir(dataDir)
  const userDir = path.join(dataDir, 'users', userId)
  ensureDir(userDir)
  const dbPath = path.join(userDir, 'novelstudio.db')
  const db = new Database(dbPath)
  db.pragma('journal_mode = WAL')
  initDataSchema(db)
  userDbCache.set(userId, db)
  return db
}
