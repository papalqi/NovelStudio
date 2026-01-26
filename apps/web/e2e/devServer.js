import { spawn } from 'node:child_process'
import path from 'node:path'
import fs from 'node:fs'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const repoRoot = path.resolve(__dirname, '../../..')
const logDir = path.resolve(repoRoot, 'apps/web/test-results')
const logPath = path.join(logDir, 'dev-server.log')

fs.mkdirSync(logDir, { recursive: true })
const logStream = fs.createWriteStream(logPath, { flags: 'w' })

const env = {
  ...process.env,
  NOVELSTUDIO_DATA_DIR: path.resolve(repoRoot, 'apps/server/data/e2e'),
  NOVELSTUDIO_ALLOW_TEST_RESET: '1',
  VITE_API_BASE_URL: 'http://localhost:8787'
}

const child = spawn('npm', ['run', 'dev'], {
  cwd: repoRoot,
  env,
  stdio: ['ignore', 'pipe', 'pipe']
})

child.stdout.pipe(logStream)
child.stderr.pipe(logStream)

const shutdown = () => {
  child.kill('SIGTERM')
}

process.on('SIGINT', shutdown)
process.on('SIGTERM', shutdown)

child.on('exit', (code) => {
  logStream.end()
  process.exit(code ?? 0)
})
