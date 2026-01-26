import { defineConfig } from '@playwright/test'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const configDir = path.dirname(fileURLToPath(import.meta.url))

export default defineConfig({
  testDir: './e2e',
  timeout: 30_000,
  use: {
    baseURL: 'http://localhost:5173'
  },
  webServer: {
    command: 'node e2e/devServer.js',
    url: 'http://localhost:5173',
    reuseExistingServer: !process.env.CI,
    cwd: configDir
  }
})
