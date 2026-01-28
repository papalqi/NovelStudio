import crypto from 'node:crypto'
import { getAuthDb } from './db.js'

const now = () => new Date().toISOString()
const SESSION_TTL_DAYS = 30

const addDays = (date, days) => {
  const next = new Date(date)
  next.setDate(next.getDate() + days)
  return next
}

const generateId = () => crypto.randomUUID()

const generateSalt = () => crypto.randomBytes(16).toString('hex')

const hashPassword = (password, salt) => {
  const derived = crypto.scryptSync(password, salt, 64)
  return derived.toString('hex')
}

const verifyPassword = (password, salt, expectedHash) => {
  const actual = hashPassword(password, salt)
  const actualBuf = Buffer.from(actual, 'hex')
  const expectedBuf = Buffer.from(expectedHash, 'hex')
  if (actualBuf.length !== expectedBuf.length) return false
  return crypto.timingSafeEqual(actualBuf, expectedBuf)
}

const generateToken = () => crypto.randomBytes(32).toString('hex')

export const createUser = ({ username, password }) => {
  const db = getAuthDb()
  const trimmed = username.trim()
  const existing = db.prepare('select id from users where username = ?').get(trimmed)
  if (existing) {
    const error = new Error('用户名已存在')
    error.code = 'user_exists'
    throw error
  }
  const timestamp = now()
  const id = generateId()
  const salt = generateSalt()
  const passwordHash = hashPassword(password, salt)
  db.prepare(
    'insert into users (id, username, passwordHash, salt, createdAt, updatedAt) values (?, ?, ?, ?, ?, ?)'
  ).run(id, trimmed, passwordHash, salt, timestamp, timestamp)
  return { id, username: trimmed }
}

export const authenticateUser = ({ username, password }) => {
  const db = getAuthDb()
  const trimmed = username.trim()
  const row = db.prepare('select * from users where username = ?').get(trimmed)
  if (!row) return null
  const ok = verifyPassword(password, row.salt, row.passwordHash)
  if (!ok) return null
  return { id: row.id, username: row.username }
}

export const createSession = (userId) => {
  const db = getAuthDb()
  const timestamp = now()
  const expiresAt = addDays(new Date(), SESSION_TTL_DAYS).toISOString()
  const sessionId = generateId()
  const token = generateToken()
  db.prepare(
    'insert into sessions (id, userId, token, createdAt, expiresAt, revokedAt) values (?, ?, ?, ?, ?, ?)'
  ).run(sessionId, userId, token, timestamp, expiresAt, null)
  return { token, expiresAt }
}

export const getSessionByToken = (token) => {
  const db = getAuthDb()
  const row = db.prepare(
    'select sessions.*, users.username from sessions join users on sessions.userId = users.id where sessions.token = ?'
  ).get(token)
  if (!row) return null
  if (row.revokedAt) return null
  if (new Date(row.expiresAt).getTime() <= Date.now()) return null
  return {
    id: row.id,
    token: row.token,
    userId: row.userId,
    username: row.username,
    expiresAt: row.expiresAt
  }
}

export const revokeSession = (token) => {
  const db = getAuthDb()
  const timestamp = now()
  db.prepare('update sessions set revokedAt = ? where token = ?').run(timestamp, token)
}
