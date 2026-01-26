import { dataDir, dbPath } from './db.js'
import { clearDatabase, insertSeedData } from './seedUtils.js'

const args = process.argv.slice(2)
const isClean = args.includes('--clean')
const isHelp = args.includes('--help') || args.includes('-h')

if (isHelp) {
  console.log('Usage: node src/seed.js [--clean]')
  console.log('  --clean  Only clear data without inserting seed records')
  process.exit(0)
}


console.log(`Seed data path: ${dataDir}`)
console.log(`Database: ${dbPath}`)

clearDatabase()

if (!isClean) {
  insertSeedData()
  console.log('Seed data inserted.')
} else {
  console.log('Data cleared. No seed inserted.')
}

console.log('Done.')
