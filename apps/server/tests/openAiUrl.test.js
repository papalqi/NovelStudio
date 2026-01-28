import test from 'node:test'
import assert from 'node:assert/strict'
import { buildOpenAiEndpoint } from '../src/openAiUrl.js'

test('buildOpenAiEndpoint appends /v1 when needed', () => {
  assert.equal(
    buildOpenAiEndpoint('https://api.papalqi.top', '/models'),
    'https://api.papalqi.top/v1/models'
  )
  assert.equal(
    buildOpenAiEndpoint('https://api.papalqi.top/', '/models'),
    'https://api.papalqi.top/v1/models'
  )
  assert.equal(
    buildOpenAiEndpoint('https://api.papalqi.top/v1', '/chat/completions'),
    'https://api.papalqi.top/v1/chat/completions'
  )
  assert.equal(
    buildOpenAiEndpoint('https://api.papalqi.top/v1/', '/chat/completions'),
    'https://api.papalqi.top/v1/chat/completions'
  )
})

test('buildOpenAiEndpoint skips /v1 when baseUrl ends with #', () => {
  assert.equal(
    buildOpenAiEndpoint('https://api.papalqi.top#', '/models'),
    'https://api.papalqi.top/models'
  )
  assert.equal(
    buildOpenAiEndpoint('https://api.papalqi.top/custom#', '/chat/completions'),
    'https://api.papalqi.top/custom/chat/completions'
  )
  assert.equal(
    buildOpenAiEndpoint('https://api.papalqi.top/v1#', '/models'),
    'https://api.papalqi.top/v1/models'
  )
})
