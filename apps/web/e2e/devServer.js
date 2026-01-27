import { spawn } from 'node:child_process'
import path from 'node:path'
import fs from 'node:fs'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const repoRoot = path.resolve(__dirname, '../../..')
const logDir = path.resolve(repoRoot, 'apps/web/test-results')
const logPath = path.join(logDir, 'dev-server.log')
const webPort = process.env.NOVELSTUDIO_E2E_WEB_PORT ?? '5174'
const serverPort = process.env.NOVELSTUDIO_E2E_SERVER_PORT ?? '8788'
const e2eDataDir = path.resolve(repoRoot, 'apps/server/data/e2e')

fs.mkdirSync(logDir, { recursive: true })
const logStream = fs.createWriteStream(logPath, { flags: 'w' })

logStream.write(
  `[E2E] webPort=${webPort} serverPort=${serverPort} dataDir=${e2eDataDir}\n`
)

const serverEnv = {
  ...process.env,
  NOVELSTUDIO_DATA_DIR: e2eDataDir,
  NOVELSTUDIO_ALLOW_TEST_RESET: '1',
  PORT: serverPort
}

const webEnv = {
  ...process.env,
  VITE_API_BASE_URL: `http://localhost:${serverPort}`
}

const pipeWithPrefix = (stream, prefix) => {
  stream.on('data', (chunk) => {
    const text = chunk.toString()
    const lines = text.split(/\r?\n/)
    lines.forEach((line, index) => {
      if (!line && index === lines.length - 1) return
      logStream.write(`[${prefix}] ${line}\n`)
    })
  })
}

const spawnProcess = (label, args, env) => {
  const child = spawn('npm', args, {
    cwd: repoRoot,
    env,
    stdio: ['ignore', 'pipe', 'pipe']
  })
  pipeWithPrefix(child.stdout, label)
  pipeWithPrefix(child.stderr, label)
  return child
}

const server = spawnProcess('server', ['--workspace', 'apps/server', 'run', 'dev'], serverEnv)
const web = spawnProcess(
  'web',
  ['--workspace', 'apps/web', 'run', 'dev', '--', '--port', webPort, '--strictPort'],
  webEnv
)

let exiting = false
const shutdown = (code = 0) => {
  if (exiting) return
  exiting = true
  server.kill('SIGTERM')
  web.kill('SIGTERM')
  logStream.end()
  process.exit(code)
}

process.on('SIGINT', () => shutdown(130))
process.on('SIGTERM', () => shutdown(143))

server.on('exit', (code) => shutdown(code ?? 0))
web.on('exit', (code) => shutdown(code ?? 0))
