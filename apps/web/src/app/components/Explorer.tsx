import { useMemo, useState } from 'react'
import { Plus, ChevronUp, ChevronDown, Pencil, Trash2 } from 'lucide-react'
import type { Chapter, ChapterStatus, Volume } from '../../types'
import { ContextMenu, useContextMenu, Modal, Input } from './common'
import './Explorer.css'

type ExplorerProps = {
  volumes: Volume[]
  chapters: Chapter[]
  activeVolumeId: string
  activeChapterId: string
  onSelectVolume: (id: string) => void
  onSelectChapter: (id: string) => void
  onCreateChapter: (volumeId: string) => void
  onCreateVolume: () => void
  onRenameVolume: (id: string, title: string) => void
  onDeleteVolume: (id: string) => void
  onMoveVolume: (id: string, direction: 'up' | 'down') => void
  onRenameChapter: (id: string, title: string) => void
  onDeleteChapter: (id: string) => void
  onReorderChapter: (volumeId: string, orderedIds: string[]) => void
}

const statusLabels: Record<ChapterStatus, string> = {
  draft: '草稿',
  review: '审校',
  done: '完成'
}

type RenameTarget = {
  type: 'volume' | 'chapter'
  id: string
  title: string
} | null

export const Explorer = ({
  volumes,
  chapters,
  activeVolumeId,
  activeChapterId,
  onSelectVolume,
  onSelectChapter,
  onCreateChapter,
  onCreateVolume,
  onRenameVolume,
  onDeleteVolume,
  onMoveVolume,
  onRenameChapter,
  onDeleteChapter,
  onReorderChapter
}: ExplorerProps) => {
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<ChapterStatus | 'all'>('all')
  const [draggingId, setDraggingId] = useState<string | null>(null)

  // Context menu states
  const volumeMenu = useContextMenu()
  const chapterMenu = useContextMenu()
  const [activeVolumeForMenu, setActiveVolumeForMenu] = useState<string>('')
  const [activeChapterForMenu, setActiveChapterForMenu] = useState<string>('')

  // Rename modal state
  const [renameTarget, setRenameTarget] = useState<RenameTarget>(null)
  const [renameValue, setRenameValue] = useState('')

  const filteredChapters = useMemo(() => {
    return chapters.filter((chapter) => {
      const matchesSearch = chapter.title.toLowerCase().includes(search.toLowerCase())
      const matchesStatus = statusFilter === 'all' || chapter.status === statusFilter
      return matchesSearch && matchesStatus
    })
  }, [chapters, search, statusFilter])

  const handleDrop = (volumeId: string, targetId: string) => {
    if (!draggingId || draggingId === targetId) return
    const volumeChapters = chapters
      .filter((chapter) => chapter.volumeId === volumeId)
      .sort((a, b) => a.orderIndex - b.orderIndex)
    const ids = volumeChapters.map((chapter) => chapter.id)
    const fromIndex = ids.indexOf(draggingId)
    const toIndex = ids.indexOf(targetId)
    if (fromIndex === -1 || toIndex === -1) return
    ids.splice(fromIndex, 1)
    ids.splice(toIndex, 0, draggingId)
    onReorderChapter(volumeId, ids)
    setDraggingId(null)
  }

  const handleOpenRenameModal = (type: 'volume' | 'chapter', id: string, title: string) => {
    setRenameTarget({ type, id, title })
    setRenameValue(title)
  }

  const handleConfirmRename = () => {
    if (!renameTarget || !renameValue.trim()) return
    if (renameTarget.type === 'volume') {
      onRenameVolume(renameTarget.id, renameValue.trim())
    } else {
      onRenameChapter(renameTarget.id, renameValue.trim())
    }
    setRenameTarget(null)
    setRenameValue('')
  }

  const handleCloseRenameModal = () => {
    setRenameTarget(null)
    setRenameValue('')
  }

  const getVolumeMenuItems = (volumeId: string) => {
    const volume = volumes.find((v) => v.id === volumeId)
    return [
      {
        id: 'volume-add-chapter',
        label: '新建章节',
        icon: <Plus size={16} />,
        onClick: () => onCreateChapter(volumeId)
      },
      { type: 'separator' as const },
      {
        id: 'volume-move-up',
        label: '上移',
        icon: <ChevronUp size={16} />,
        onClick: () => onMoveVolume(volumeId, 'up')
      },
      {
        id: 'volume-move-down',
        label: '下移',
        icon: <ChevronDown size={16} />,
        onClick: () => onMoveVolume(volumeId, 'down')
      },
      { type: 'separator' as const },
      {
        id: 'volume-rename',
        label: '重命名',
        icon: <Pencil size={16} />,
        onClick: () => handleOpenRenameModal('volume', volumeId, volume?.title || '')
      },
      {
        id: 'volume-delete',
        label: '删除',
        icon: <Trash2 size={16} />,
        danger: true,
        onClick: () => onDeleteVolume(volumeId)
      }
    ]
  }

  const getChapterMenuItems = (chapterId: string) => {
    const chapter = chapters.find((c) => c.id === chapterId)
    return [
      {
        id: 'chapter-rename',
        label: '重命名',
        icon: <Pencil size={16} />,
        onClick: () => handleOpenRenameModal('chapter', chapterId, chapter?.title || '')
      },
      { type: 'separator' as const },
      {
        id: 'chapter-delete',
        label: '删除',
        icon: <Trash2 size={16} />,
        danger: true,
        onClick: () => onDeleteChapter(chapterId)
      }
    ]
  }

  return (
    <aside className="sidebar">
      <div className="panel-header">
        <span>资源管理器</span>
        <button className="mini-button" onClick={onCreateVolume} data-testid="explorer-new-volume">
          + 新卷
        </button>
      </div>
      <div className="explorer-filters">
        <input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="搜索章节"
          data-testid="explorer-search"
        />
        <select
          value={statusFilter}
          onChange={(event) => setStatusFilter(event.target.value as ChapterStatus | 'all')}
          data-testid="explorer-status-filter"
        >
          <option value="all">全部状态</option>
          <option value="draft">草稿</option>
          <option value="review">审校</option>
          <option value="done">完成</option>
        </select>
      </div>
      <div className="tree">
        {volumes
          .sort((a, b) => a.orderIndex - b.orderIndex)
          .map((volume) => (
            <div key={volume.id} className="tree-group">
              <div
                className="tree-group-title"
                onContextMenu={(e) => {
                  e.preventDefault()
                  setActiveVolumeForMenu(volume.id)
                  volumeMenu.openMenu(e)
                }}
              >
                <button
                  className={activeVolumeId === volume.id ? 'active' : ''}
                  onClick={() => onSelectVolume(volume.id)}
                  data-testid={`explorer-volume-${volume.id}`}
                >
                  <span className="tree-icon">▸</span>
                  {volume.title}
                </button>
              </div>
              <div className="tree-children">
                {filteredChapters
                  .filter((chapter) => chapter.volumeId === volume.id)
                  .sort((a, b) => a.orderIndex - b.orderIndex)
                  .map((chapter) => (
                    <div
                      key={chapter.id}
                      className={`tree-item ${activeChapterId === chapter.id ? 'selected' : ''}`}
                      onClick={() => onSelectChapter(chapter.id)}
                      onContextMenu={(e) => {
                        e.preventDefault()
                        setActiveChapterForMenu(chapter.id)
                        chapterMenu.openMenu(e)
                      }}
                      draggable
                      onDragStart={() => setDraggingId(chapter.id)}
                      onDragOver={(event) => event.preventDefault()}
                      onDrop={() => handleDrop(volume.id, chapter.id)}
                      role="button"
                      tabIndex={0}
                      onKeyDown={(event) => {
                        if (event.key === 'Enter' || event.key === ' ') {
                          event.preventDefault()
                          onSelectChapter(chapter.id)
                        }
                      }}
                      data-testid={`explorer-chapter-${chapter.id}`}
                    >
                      <span className={`status-dot status-${chapter.status}`} />
                      <span className="tree-item-title">{chapter.title}</span>
                      <span className="tree-meta">
                        {chapter.wordCount}字 · {statusLabels[chapter.status]}
                      </span>
                    </div>
                  ))}
                {filteredChapters.filter((chapter) => chapter.volumeId === volume.id).length === 0 && (
                  <div className="empty-state">暂无章节</div>
                )}
              </div>
            </div>
          ))}
      </div>

      {/* Volume Context Menu */}
      {volumeMenu.isOpen && (
        <ContextMenu
          position={volumeMenu.position}
          onClose={volumeMenu.closeMenu}
          items={getVolumeMenuItems(activeVolumeForMenu)}
        />
      )}

      {/* Chapter Context Menu */}
      {chapterMenu.isOpen && (
        <ContextMenu
          position={chapterMenu.position}
          onClose={chapterMenu.closeMenu}
          items={getChapterMenuItems(activeChapterForMenu)}
        />
      )}

      {/* Rename Modal */}
      <Modal
        open={renameTarget !== null}
        onClose={handleCloseRenameModal}
        title={renameTarget?.type === 'volume' ? '重命名卷' : '重命名章节'}
      >
        <div className="rename-modal-content">
          <Input
            label={renameTarget?.type === 'volume' ? '卷名' : '章节名'}
            value={renameValue}
            onChange={(e) => setRenameValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                handleConfirmRename()
              }
            }}
            autoFocus
            data-testid="explorer-rename-input"
          />
          <div className="rename-modal-actions">
            <button className="ghost-button" onClick={handleCloseRenameModal} data-testid="explorer-rename-cancel">
              取消
            </button>
            <button className="mini-button" onClick={handleConfirmRename} data-testid="explorer-rename-confirm">
              确定
            </button>
          </div>
        </div>
      </Modal>
    </aside>
  )
}
