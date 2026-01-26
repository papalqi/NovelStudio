import { useMemo, useState } from 'react'
import { ArrowLeft, BookOpen, Globe, MapPin, Plus, RefreshCw, Search, Trash2, User } from 'lucide-react'
import { Modal, Input, Button, Card } from './common'
import type { Note } from '../../types'
import './KnowledgeBasePage.css'

type NoteType = 'character' | 'location' | 'lore' | 'reference'

type KnowledgeBasePageProps = {
  notes: Note[]
  onSaveNote: (note: Partial<Note>) => void
  onDeleteNote: (noteId: string) => void
  onInsertNote: (note: Note) => void
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
  onRefreshReferences,
  canRefreshReferences,
  onBack,
  activeChapterTitle
}: KnowledgeBasePageProps) => {
  const [activeType, setActiveType] = useState<NoteType>('character')
  const [search, setSearch] = useState('')
  const [editingNote, setEditingNote] = useState<Note | null>(null)
  const [newNoteTitle, setNewNoteTitle] = useState('')

  const filteredNotes = useMemo(() => {
    return notes
      .filter((note) => note.type === activeType)
      .filter((note) => note.title.toLowerCase().includes(search.toLowerCase()))
  }, [notes, activeType, search])

  const handleCreateNote = () => {
    if (!newNoteTitle.trim()) return
    onSaveNote({
      type: activeType,
      title: newNoteTitle.trim(),
      content: {}
    })
    setNewNoteTitle('')
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
              <Button variant="primary" size="sm" onClick={handleCreateNote} data-testid="knowledge-page-add">
                <Plus size={16} />
                新建
              </Button>
            </div>
          </div>

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
                        onClick={() => onDeleteNote(note.id)}
                        data-testid={`knowledge-page-delete-${note.id}`}
                      >
                        <Trash2 size={14} />
                      </Button>
                    </div>
                  </div>
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
            <textarea
              className="knowledge-edit-content"
              placeholder="详细描述..."
              value={typeof editingNote.content.description === 'string' ? editingNote.content.description : ''}
              onChange={(e) =>
                setEditingNote({
                  ...editingNote,
                  content: { ...editingNote.content, description: e.target.value }
                })
              }
              rows={8}
              data-testid="knowledge-page-edit-description"
            />
            <div className="knowledge-edit-actions">
              <Button variant="ghost" onClick={() => setEditingNote(null)} data-testid="knowledge-page-edit-cancel">
                取消
              </Button>
              <Button
                variant="primary"
                onClick={() => {
                  onSaveNote(editingNote)
                  setEditingNote(null)
                }}
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
