import { useMemo, useState, useEffect } from 'react'
import { ArrowLeft, BookOpen, Globe, MapPin, Plus, RefreshCw, Search, Trash2, User } from 'lucide-react'
import { Modal, Input, Textarea, Button, Card } from './common'
import type { Note } from '../../types'
import { NOTE_CARD_FIELDS, NOTE_FIELD_DEFS, NOTE_TYPE_LABELS } from '../utils/knowledge'
import './KnowledgeBasePage.css'

type NoteType = 'character' | 'location' | 'lore' | 'reference'

type KnowledgeBasePageProps = {
  notes: Note[]
  onSaveNote: (note: Partial<Note>) => Promise<Note | void>
  onDeleteNote: (noteId: string) => Promise<void>
  onInsertNote: (note: Note) => void
  onGenerateNote?: (payload: { type: NoteType; title: string; content?: Record<string, unknown> }) => Promise<Record<string, string>>
  onRefreshReferences: () => void
  canRefreshReferences: boolean
  onBack: () => void
  activeChapterTitle?: string
}

const NOTE_TYPES: { value: NoteType; label: string; icon: React.ReactNode }[] = [
  { value: 'character', label: '角色', icon: <User size={18} /> },
  { value: 'location', label: '地点', icon: <MapPin size={18} /> },
  { value: 'lore', label: '世界观', icon: <Globe size={18} /> },
  { value: 'reference', label: '引用', icon: <BookOpen size={18} /> }
]

export const KnowledgeBasePage = ({
  notes,
  onSaveNote,
  onDeleteNote,
  onInsertNote,
  onGenerateNote,
  onRefreshReferences,
  canRefreshReferences,
  onBack,
  activeChapterTitle
}: KnowledgeBasePageProps) => {
  const [activeType, setActiveType] = useState<NoteType>('character')
  const [search, setSearch] = useState('')
  const [editingNote, setEditingNote] = useState<Note | null>(null)
  const [newNoteTitle, setNewNoteTitle] = useState('')
  const [listStatus, setListStatus] = useState<{ status: 'idle' | 'saving' | 'success' | 'error'; message: string }>(
    { status: 'idle', message: '' }
  )
  const [editStatus, setEditStatus] = useState<{ status: 'idle' | 'saving' | 'error'; message: string }>(
    { status: 'idle', message: '' }
  )
  const [aiStatus, setAiStatus] = useState<{ status: 'idle' | 'loading' | 'error'; message: string }>(
    { status: 'idle', message: '' }
  )

  useEffect(() => {
    setEditStatus({ status: 'idle', message: '' })
    setAiStatus({ status: 'idle', message: '' })
  }, [editingNote?.id])

  const filteredNotes = useMemo(() => {
    return notes
      .filter((note) => note.type === activeType)
      .filter((note) => note.title.toLowerCase().includes(search.toLowerCase()))
  }, [notes, activeType, search])

  const handleCreateNote = async () => {
    if (!newNoteTitle.trim()) {
      setListStatus({ status: 'error', message: '请输入条目标题' })
      return
    }
    setListStatus({ status: 'saving', message: '正在创建...' })
    try {
      await onSaveNote({
        type: activeType,
        title: newNoteTitle.trim(),
        content: {}
      })
      setNewNoteTitle('')
      setListStatus({ status: 'success', message: '资料卡已创建' })
    } catch (error) {
      const message = error instanceof Error ? error.message : '创建失败'
      setListStatus({ status: 'error', message })
    }
  }

  const handleDeleteNote = async (noteId: string) => {
    setListStatus({ status: 'saving', message: '正在删除...' })
    try {
      await onDeleteNote(noteId)
      setListStatus({ status: 'success', message: '资料卡已删除' })
    } catch (error) {
      const message = error instanceof Error ? error.message : '删除失败'
      setListStatus({ status: 'error', message })
    }
  }

  const handleSaveEdit = async () => {
    if (!editingNote) return
    setEditStatus({ status: 'saving', message: '' })
    try {
      await onSaveNote(editingNote)
      setEditStatus({ status: 'idle', message: '' })
      setEditingNote(null)
    } catch (error) {
      const message = error instanceof Error ? error.message : '保存失败'
      setEditStatus({ status: 'error', message })
    }
  }

  const handleGenerate = async () => {
    if (!editingNote || !onGenerateNote) return
    if (!editingNote.title.trim()) {
      setAiStatus({ status: 'error', message: '请先填写标题' })
      return
    }
    setAiStatus({ status: 'loading', message: 'AI 生成中...' })
    try {
      const content = await onGenerateNote({
        type: editingNote.type,
        title: editingNote.title.trim(),
        content: editingNote.content ?? {}
      })
      setEditingNote({
        ...editingNote,
        content: { ...editingNote.content, ...content }
      })
      setAiStatus({ status: 'idle', message: '' })
    } catch (error) {
      const message = error instanceof Error ? error.message : 'AI 生成失败'
      setAiStatus({ status: 'error', message })
    }
  }

  const canInsert = Boolean(activeChapterTitle)

  return (
    <section className="knowledge-page" data-testid="knowledge-page">
      <header className="knowledge-page-header">
        <button className="ghost-button" onClick={onBack} data-testid="knowledge-back">
          <ArrowLeft size={16} />
          返回编辑
        </button>
        <div className="knowledge-page-title">
          <h2>资料库</h2>
          <span>当前章节：{activeChapterTitle ?? '未选择'}</span>
        </div>
        <div className="knowledge-page-actions">
          <Button
            variant="ghost"
            size="sm"
            onClick={onRefreshReferences}
            disabled={!canRefreshReferences}
            data-testid="knowledge-page-refresh"
          >
            <RefreshCw size={16} />
            刷新引用
          </Button>
        </div>
      </header>

      <div className="knowledge-page-body">
        <aside className="knowledge-page-sidebar">
          <div className="knowledge-type-title">分类</div>
          {NOTE_TYPES.map((type) => (
            <button
              key={type.value}
              className={`knowledge-type-item ${activeType === type.value ? 'active' : ''}`}
              onClick={() => setActiveType(type.value)}
              data-testid={`knowledge-page-tab-${type.value}`}
            >
              {type.icon}
              <span>{type.label}</span>
            </button>
          ))}
        </aside>

        <div className="knowledge-page-main">
          <div className="knowledge-page-toolbar">
            <div className="knowledge-search">
              <Search size={16} />
              <input
                type="text"
                placeholder="搜索条目"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                data-testid="knowledge-page-search"
              />
            </div>
            <div className="knowledge-add">
              <input
                type="text"
                placeholder="新条目标题"
                value={newNoteTitle}
                onChange={(e) => setNewNoteTitle(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleCreateNote()}
                data-testid="knowledge-page-new-title"
              />
              <Button
                variant="primary"
                size="sm"
                onClick={handleCreateNote}
                loading={listStatus.status === 'saving'}
                data-testid="knowledge-page-add"
              >
                <Plus size={16} />
                新建
              </Button>
            </div>
          </div>

          {listStatus.message && (
            <div className={`knowledge-alert ${listStatus.status}`} data-testid="knowledge-page-status">
              {listStatus.message}
            </div>
          )}

          {!canInsert && (
            <div className="knowledge-tip">选择一个章节后即可插入资料卡内容。</div>
          )}

          <div className="knowledge-list">
            {filteredNotes.length === 0 ? (
              <div className="knowledge-empty">暂无{NOTE_TYPES.find((t) => t.value === activeType)?.label}条目</div>
            ) : (
              filteredNotes.map((note) => (
                <Card key={note.id} className="knowledge-card">
                  <div className="knowledge-card-header">
                    <span className="knowledge-card-title">{note.title}</span>
                    <div className="knowledge-card-actions">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setEditingNote(note)}
                        data-testid={`knowledge-page-edit-${note.id}`}
                      >
                        编辑
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        disabled={!canInsert}
                        onClick={() => onInsertNote(note)}
                        data-testid={`knowledge-page-insert-${note.id}`}
                      >
                        插入
                      </Button>
                      <Button
                        variant="icon"
                        size="sm"
                        onClick={() => handleDeleteNote(note.id)}
                        data-testid={`knowledge-page-delete-${note.id}`}
                      >
                        <Trash2 size={14} />
                      </Button>
                    </div>
                  </div>
                  {(note.type === 'character' || note.type === 'location') && (
                    <div className="knowledge-card-body">
                      {typeof note.content.description === 'string' && note.content.description.trim() && (
                        <div className="knowledge-card-description">{note.content.description}</div>
                      )}
                      <div className="knowledge-card-grid">
                        {NOTE_CARD_FIELDS[note.type].map((fieldKey) => {
                          const field = NOTE_FIELD_DEFS[note.type].find((item) => item.key === fieldKey)
                          const value = typeof note.content[fieldKey] === 'string' ? note.content[fieldKey] : ''
                          if (!value?.trim()) return null
                          return (
                            <div key={fieldKey} className="knowledge-card-field">
                              <span className="knowledge-card-field-label">{field?.label ?? fieldKey}</span>
                              <span className="knowledge-card-field-value">{value}</span>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  )}
                  {note.type !== 'character' && note.type !== 'location' && (
                    <div className="knowledge-card-description">
                      {typeof note.content.description === 'string' ? note.content.description : ''}
                    </div>
                  )}
                  <div className="knowledge-card-meta">更新于 {note.updatedAt}</div>
                </Card>
              ))
            )}
          </div>
        </div>
      </div>

      {editingNote && (
        <Modal open={true} onClose={() => setEditingNote(null)} title={`编辑 - ${editingNote.title}`}>
          <div className="knowledge-edit-form">
            <Input
              label="标题"
              value={editingNote.title}
              onChange={(e) => setEditingNote({ ...editingNote, title: e.target.value })}
              data-testid="knowledge-page-edit-title"
            />
            {(editingNote.type === 'character' || editingNote.type === 'location') && onGenerateNote && (
              <div className="knowledge-ai-row">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleGenerate}
                  loading={aiStatus.status === 'loading'}
                  data-testid="knowledge-page-ai-generate"
                >
                  AI 生成{NOTE_TYPE_LABELS[editingNote.type]}卡
                </Button>
                {aiStatus.message && (
                  <span className={`knowledge-ai-status ${aiStatus.status}`}>{aiStatus.message}</span>
                )}
              </div>
            )}
            <div className="knowledge-edit-grid">
              {NOTE_FIELD_DEFS[editingNote.type].map((field) => {
                const rawValue = editingNote.content?.[field.key]
                const value = typeof rawValue === 'string' ? rawValue : ''
                const update = (nextValue: string) =>
                  setEditingNote({
                    ...editingNote,
                    content: { ...editingNote.content, [field.key]: nextValue }
                  })
                if (field.multiline) {
                  return (
                    <Textarea
                      key={field.key}
                      label={field.label}
                      value={value}
                      onChange={(e) => update(e.target.value)}
                      rows={field.rows ?? 3}
                      placeholder={field.placeholder}
                      data-testid={
                        field.key === 'description'
                          ? 'knowledge-page-edit-description'
                          : `knowledge-page-edit-${field.key}`
                      }
                    />
                  )
                }
                return (
                  <Input
                    key={field.key}
                    label={field.label}
                    value={value}
                    onChange={(e) => update(e.target.value)}
                    placeholder={field.placeholder}
                    data-testid={`knowledge-page-edit-${field.key}`}
                  />
                )
              })}
            </div>
            {editStatus.message && (
              <div className="knowledge-edit-status" data-testid="knowledge-page-edit-status">
                {editStatus.message}
              </div>
            )}
            <div className="knowledge-edit-actions">
              <Button variant="ghost" onClick={() => setEditingNote(null)} data-testid="knowledge-page-edit-cancel">
                取消
              </Button>
              <Button
                variant="primary"
                loading={editStatus.status === 'saving'}
                onClick={handleSaveEdit}
                data-testid="knowledge-page-edit-save"
              >
                保存
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </section>
  )
}
