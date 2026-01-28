import { dataDir, getUserDb } from './db.js'
import { clearDatabase, insertSeedData } from './seedUtils.js'

const args = process.argv.slice(2)
const isClean = args.includes('--clean')
const isHelp = args.includes('--help') || args.includes('-h')
const userArgIndex = args.findIndex((item) => item === '--user')
const userFromArg = userArgIndex >= 0 ? args[userArgIndex + 1] : null
const userId = userFromArg || process.env.NOVELSTUDIO_SEED_USER

if (isHelp) {
  console.log('Usage: node src/seed.js --user <userId> [--clean]')
  console.log('  --user   Target user id to seed')
  console.log('  --clean  Only clear data without inserting seed records')
  process.exit(0)
}

if (!userId) {
  console.error('Missing userId. Provide --user <userId> or NOVELSTUDIO_SEED_USER.')
  process.exit(1)
}

console.log(`Seed data path: ${dataDir}`)
console.log(`User: ${userId}`)

const db = getUserDb(userId)

clearDatabase(db)

if (!isClean) {
  insertSeedData(db)
  console.log('Seed data inserted.')
} else {
  console.log('Data cleared. No seed inserted.')
}

console.log('Done.')
