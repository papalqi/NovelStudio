import { useMemo, useState } from 'react'
import type { Chapter, ChapterStatus, Volume } from '../../types'
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

  return (
    <aside className="sidebar">
      <div className="panel-header">
        <span>资源管理器</span>
        <button className="mini-button" onClick={onCreateVolume}>
          + 新卷
        </button>
      </div>
      <div className="explorer-filters">
        <input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="搜索章节"
        />
        <select
          value={statusFilter}
          onChange={(event) => setStatusFilter(event.target.value as ChapterStatus | 'all')}
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
              <div className="tree-group-title">
                <button
                  className={activeVolumeId === volume.id ? 'active' : ''}
                  onClick={() => onSelectVolume(volume.id)}
                >
                  <span className="tree-icon">▸</span>
                  {volume.title}
                </button>
                <div className="tree-actions">
                  <button className="ghost-button" onClick={() => onCreateChapter(volume.id)}>
                    + 章
                  </button>
                  <button className="ghost-button" onClick={() => onMoveVolume(volume.id, 'up')}>
                    上移
                  </button>
                  <button className="ghost-button" onClick={() => onMoveVolume(volume.id, 'down')}>
                    下移
                  </button>
                  <button
                    className="ghost-button"
                    onClick={() => {
                      const next = window.prompt('卷名', volume.title)
                      if (next) onRenameVolume(volume.id, next)
                    }}
                  >
                    改名
                  </button>
                  <button className="ghost-button" onClick={() => onDeleteVolume(volume.id)}>
                    删除
                  </button>
                </div>
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
                    >
                      <span className={`status-dot status-${chapter.status}`} />
                      <span className="tree-item-title">{chapter.title}</span>
                      <span className="tree-meta">
                        {chapter.wordCount}字 · {statusLabels[chapter.status]}
                      </span>
                      <div className="tree-item-actions">
                        <button
                          className="ghost-button"
                          onClick={(event) => {
                            event.stopPropagation()
                            const next = window.prompt('章节名', chapter.title)
                            if (next) onRenameChapter(chapter.id, next)
                          }}
                        >
                          改名
                        </button>
                        <button
                          className="ghost-button"
                          onClick={(event) => {
                            event.stopPropagation()
                            onDeleteChapter(chapter.id)
                          }}
                        >
                          删除
                        </button>
                      </div>
                    </div>
                  ))}
                {filteredChapters.filter((chapter) => chapter.volumeId === volume.id).length === 0 && (
                  <div className="empty-state">暂无章节</div>
                )}
              </div>
            </div>
          ))}
      </div>
    </aside>
  )
}
