import { estimateWordCount } from '../src/utils/text'

test('estimateWordCount counts non-space characters', () => {
  const blocks = [{ content: 'hello world' }, { content: '测试' }]
  expect(estimateWordCount(blocks)).toBe(12)
})
