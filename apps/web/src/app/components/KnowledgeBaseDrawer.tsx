import { useState, useMemo } from 'react'
import { X, Search, Plus, User, MapPin, Globe, BookOpen, Trash2 } from 'lucide-react'
import { Modal, Input, Button, Card } from './common'
import type { Note } from '../../types'
import './KnowledgeBaseDrawer.css'

type NoteType = 'character' | 'location' | 'lore' | 'reference'

type KnowledgeBaseDrawerProps = {
  open: boolean
  onClose: () => void
  notes: Note[]
  onSaveNote: (note: Partial<Note>) => void
  onDeleteNote: (noteId: string) => void
}

const NOTE_TYPES: { value: NoteType; label: string; icon: React.ReactNode }[] = [
  { value: 'character', label: '角色', icon: <User size={18} /> },
  { value: 'location', label: '地点', icon: <MapPin size={18} /> },
  { value: 'lore', label: '世界观', icon: <Globe size={18} /> },
  { value: 'reference', label: '引用', icon: <BookOpen size={18} /> },
]

export const KnowledgeBaseDrawer = ({
  open,
  onClose,
  notes,
  onSaveNote,
  onDeleteNote
}: KnowledgeBaseDrawerProps) => {
  const [activeType, setActiveType] = useState<NoteType>('character')
  const [search, setSearch] = useState('')
  const [editingNote, setEditingNote] = useState<Note | null>(null)
  const [newNoteTitle, setNewNoteTitle] = useState('')
  
  const filteredNotes = useMemo(() => {
    return notes
      .filter(note => note.type === activeType)
      .filter(note => note.title.toLowerCase().includes(search.toLowerCase()))
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
  
  if (!open) return null
  
  return (
    <div className="knowledge-drawer-overlay" onClick={onClose}>
      <aside className="knowledge-drawer" onClick={e => e.stopPropagation()}>
        <header className="knowledge-drawer-header">
          <h2>📚 资料库</h2>
          <Button variant="icon" onClick={onClose}>
            <X size={20} />
          </Button>
        </header>
        
        <div className="knowledge-drawer-body">
          {/* 类型选择 Tab */}
          <div className="knowledge-type-tabs">
            {NOTE_TYPES.map(type => (
              <button
                key={type.value}
                className={`knowledge-type-tab ${activeType === type.value ? 'active' : ''}`}
                onClick={() => setActiveType(type.value)}
              >
                {type.icon}
                <span>{type.label}</span>
              </button>
            ))}
          </div>
          
          {/* 搜索和新建 */}
          <div className="knowledge-toolbar">
            <div className="knowledge-search">
              <Search size={16} />
              <input
                type="text"
                placeholder="搜索..."
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>
            <div className="knowledge-add">
              <input
                type="text"
                placeholder="新条目标题"
                value={newNoteTitle}
                onChange={e => setNewNoteTitle(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleCreateNote()}
              />
              <Button variant="primary" size="sm" onClick={handleCreateNote}>
                <Plus size={16} />
              </Button>
            </div>
          </div>
          
          {/* 条目列表 */}
          <div className="knowledge-list">
            {filteredNotes.length === 0 ? (
              <div className="knowledge-empty">
                暂无{NOTE_TYPES.find(t => t.value === activeType)?.label}条目
              </div>
            ) : (
              filteredNotes.map(note => (
                <Card key={note.id} className="knowledge-card">
                  <div className="knowledge-card-header">
                    <span className="knowledge-card-title">{note.title}</span>
                    <div className="knowledge-card-actions">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setEditingNote(note)}
                      >
                        编辑
                      </Button>
                      <Button
                        variant="icon"
                        size="sm"
                        onClick={() => onDeleteNote(note.id)}
                      >
                        <Trash2 size={14} />
                      </Button>
                    </div>
                  </div>
                  <div className="knowledge-card-meta">
                    更新于 {note.updatedAt}
                  </div>
                </Card>
              ))
            )}
          </div>
        </div>
        
        {/* 编辑弹窗 */}
        {editingNote && (
          <Modal
            open={true}
            onClose={() => setEditingNote(null)}
            title={`编辑 - ${editingNote.title}`}
          >
            <div className="knowledge-edit-form">
              <Input
                label="标题"
                value={editingNote.title}
                onChange={e => setEditingNote({...editingNote, title: e.target.value})}
              />
              <textarea
                className="knowledge-edit-content"
                placeholder="详细描述..."
                value={typeof editingNote.content.description === 'string' ? editingNote.content.description : ''}
                onChange={e => setEditingNote({
                  ...editingNote,
                  content: {...editingNote.content, description: e.target.value}
                })}
                rows={8}
              />
              <div className="knowledge-edit-actions">
                <Button variant="ghost" onClick={() => setEditingNote(null)}>
                  取消
                </Button>
                <Button
                  variant="primary"
                  onClick={() => {
                    onSaveNote(editingNote)
                    setEditingNote(null)
                  }}
                >
                  保存
                </Button>
              </div>
            </div>
          </Modal>
        )}
      </aside>
    </div>
  )
}
