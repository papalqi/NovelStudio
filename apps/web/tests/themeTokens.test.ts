import fs from 'node:fs'
import path from 'node:path'

test('legacy theme tokens are defined', () => {
  const variablesPath = path.resolve(__dirname, '../src/styles/variables.css')
  const css = fs.readFileSync(variablesPath, 'utf8')
  const requiredTokens = [
    '--accent:',
    '--accent-dark:',
    '--bg-accent:',
    '--panel:',
    '--panel-border:',
    '--ink:',
    '--muted:',
    '--radius:',
    '--shadow:'
  ]

  for (const token of requiredTokens) {
    expect(css).toContain(token)
  }
})
