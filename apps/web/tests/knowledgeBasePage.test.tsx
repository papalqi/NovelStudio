import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import type { ComponentProps } from 'react'
import { vi } from 'vitest'
import type { Note } from '../src/types'
import { KnowledgeBasePage } from '../src/app/components/KnowledgeBasePage'

const baseNotes: Note[] = [
  {
    id: 'note-1',
    type: 'character',
    title: '主角',
    content: { description: '旧描述', role: '' },
    updatedAt: '2026-01-20'
  }
]

const renderPage = (overrides?: Partial<ComponentProps<typeof KnowledgeBasePage>>) => {
  const onSaveNote = vi.fn().mockResolvedValue(undefined)
  const onDeleteNote = vi.fn().mockResolvedValue(undefined)
  const onInsertNote = vi.fn()
  const onRefreshReferences = vi.fn()
  const onGenerateNote = vi.fn().mockResolvedValue({
    description: 'AI 生成描述',
    role: '异界勇者'
  })

  render(
    <KnowledgeBasePage
      notes={baseNotes}
      onSaveNote={onSaveNote}
      onDeleteNote={onDeleteNote}
      onInsertNote={onInsertNote}
      onGenerateNote={onGenerateNote}
      onRefreshReferences={onRefreshReferences}
      canRefreshReferences={true}
      onBack={vi.fn()}
      activeChapterTitle="第1章"
      {...overrides}
    />
  )

  return { onSaveNote, onDeleteNote, onGenerateNote }
}

test('AI generate fills character card fields', async () => {
  const { onGenerateNote } = renderPage()

  fireEvent.click(screen.getByTestId('knowledge-page-edit-note-1'))
  fireEvent.click(screen.getByTestId('knowledge-page-ai-generate'))

  await waitFor(() => expect(onGenerateNote).toHaveBeenCalledTimes(1))
  await waitFor(() =>
    expect(screen.getByTestId('knowledge-page-edit-description')).toHaveValue('AI 生成描述')
  )
  expect(screen.getByTestId('knowledge-page-edit-role')).toHaveValue('异界勇者')
})

test('create note shows error feedback when save fails', async () => {
  const onSaveNote = vi.fn().mockRejectedValue(new Error('创建失败'))
  renderPage({ onSaveNote })

  fireEvent.change(screen.getByTestId('knowledge-page-new-title'), { target: { value: '新条目' } })
  fireEvent.click(screen.getByTestId('knowledge-page-add'))

  await waitFor(() => expect(screen.getByTestId('knowledge-page-status')).toHaveTextContent('创建失败'))
})
