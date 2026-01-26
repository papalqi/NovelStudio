import { useEffect, useMemo, useState } from 'react'
import { Plus, ChevronUp, ChevronDown, Pencil, Trash2 } from 'lucide-react'
import type { Chapter, ChapterStatus, Volume } from '../../types'
import { ContextMenu, useContextMenu, Modal, Input, Select } from './common'
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
  onBatchCopyChapters: (chapterIds: string[], targetVolumeId: string) => Promise<void>
  onBatchMoveChapters: (chapterIds: string[], targetVolumeId: string) => Promise<void>
  onBatchMergeChapters: (chapterIds: string[], targetVolumeId: string, title: string) => Promise<void>
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

type BatchAction = 'copy' | 'move' | 'merge' | null

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
  onReorderChapter,
  onBatchCopyChapters,
  onBatchMoveChapters,
  onBatchMergeChapters
}: ExplorerProps) => {
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<ChapterStatus | 'all'>('all')
  const [draggingId, setDraggingId] = useState<string | null>(null)
  const [collapsedVolumes, setCollapsedVolumes] = useState<Set<string>>(new Set())
  const [selectedChapters, setSelectedChapters] = useState<Set<string>>(new Set())
  const [lastSelectedId, setLastSelectedId] = useState<string | null>(null)
  const [batchAction, setBatchAction] = useState<BatchAction>(null)
  const [batchTargetVolumeId, setBatchTargetVolumeId] = useState('')
  const [mergeTitle, setMergeTitle] = useState('')
  const [batchError, setBatchError] = useState('')
  const [batchLoading, setBatchLoading] = useState(false)

  // Context menu states
  const volumeMenu = useContextMenu()
  const chapterMenu = useContextMenu()
  const [activeVolumeForMenu, setActiveVolumeForMenu] = useState<string>('')
  const [activeChapterForMenu, setActiveChapterForMenu] = useState<string>('')

  const toggleVolumeCollapse = (volumeId: string) => {
    setCollapsedVolumes((prev) => {
      const next = new Set(prev)
      if (next.has(volumeId)) {
        next.delete(volumeId)
      } else {
        next.add(volumeId)
      }
      return next
    })
  }

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

  const volumeOptions = useMemo(
    () => volumes.map((volume) => ({ value: volume.id, label: volume.title })),
    [volumes]
  )

  const selectedChapterList = useMemo(
    () => chapters.filter((chapter) => selectedChapters.has(chapter.id)),
    [chapters, selectedChapters]
  )

  const visibleChapterIds = useMemo(() => {
    const orderedVolumes = [...volumes].sort((a, b) => a.orderIndex - b.orderIndex)
    const ids: string[] = []
    orderedVolumes.forEach((volume) => {
      filteredChapters
        .filter((chapter) => chapter.volumeId === volume.id)
        .sort((a, b) => a.orderIndex - b.orderIndex)
        .forEach((chapter) => ids.push(chapter.id))
    })
    return ids
  }, [filteredChapters, volumes])

  useEffect(() => {
    setSelectedChapters((prev) => {
      if (prev.size === 0) return prev
      const validIds = new Set(chapters.map((chapter) => chapter.id))
      const next = new Set(Array.from(prev).filter((id) => validIds.has(id)))
      return next.size === prev.size ? prev : next
    })
  }, [chapters])

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

  const toggleChapterSelection = (chapterId: string, checked: boolean, useRange: boolean) => {
    setSelectedChapters((prev) => {
      const next = new Set(prev)
      if (useRange && lastSelectedId) {
        const startIndex = visibleChapterIds.indexOf(lastSelectedId)
        const endIndex = visibleChapterIds.indexOf(chapterId)
        if (startIndex !== -1 && endIndex !== -1) {
          const [from, to] = startIndex < endIndex ? [startIndex, endIndex] : [endIndex, startIndex]
          visibleChapterIds.slice(from, to + 1).forEach((id) => {
            if (checked) {
              next.add(id)
            } else {
              next.delete(id)
            }
          })
          return next
        }
      }

      if (checked) {
        next.add(chapterId)
      } else {
        next.delete(chapterId)
      }
      return next
    })
    setLastSelectedId(chapterId)
  }

  const clearSelection = () => {
    setSelectedChapters(new Set())
  }

  const selectAllVisible = () => {
    if (visibleChapterIds.length === 0) return
    setSelectedChapters(new Set(visibleChapterIds))
  }

  const openBatchModal = (action: BatchAction) => {
    if (selectedChapterList.length === 0) return
    if (action === 'merge' && selectedChapterList.length < 2) {
      setBatchError('合并需要至少选择两个章节')
      return
    }
    const defaultVolumeId =
      selectedChapterList[0]?.volumeId || activeVolumeId || volumes[0]?.id || ''
    setBatchTargetVolumeId(defaultVolumeId)
    if (action === 'merge') {
      setMergeTitle(`${selectedChapterList[0]?.title ?? '合并章节'} 合并`)
    }
    setBatchError('')
    setBatchAction(action)
  }

  const closeBatchModal = () => {
    setBatchAction(null)
    setBatchLoading(false)
    setBatchError('')
  }

  const handleBatchConfirm = async () => {
    if (!batchAction) return
    if (!batchTargetVolumeId) {
      setBatchError('请选择目标卷')
      return
    }
    if (batchAction === 'merge' && !mergeTitle.trim()) {
      setBatchError('请输入合并章节标题')
      return
    }
    setBatchLoading(true)
    try {
      const ids = selectedChapterList.map((chapter) => chapter.id)
      if (batchAction === 'copy') {
        await onBatchCopyChapters(ids, batchTargetVolumeId)
      } else if (batchAction === 'move') {
        await onBatchMoveChapters(ids, batchTargetVolumeId)
      } else if (batchAction === 'merge') {
        await onBatchMergeChapters(ids, batchTargetVolumeId, mergeTitle.trim())
      }
      clearSelection()
      closeBatchModal()
    } catch (error) {
      setBatchError('批量操作失败，请重试')
      setBatchLoading(false)
    }
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

  const batchTitle =
    batchAction === 'copy' ? '批量复制章节' : batchAction === 'move' ? '批量移动章节' : '合并章节'

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
      {selectedChapters.size > 0 && (
        <div className="batch-actions" data-testid="explorer-batch-actions">
          <div className="batch-actions-header">
            <span>已选 {selectedChapters.size} 章</span>
            <div className="batch-actions-tools">
              <button className="ghost-button" onClick={selectAllVisible} data-testid="explorer-batch-select-all">
                全选
              </button>
              <button className="ghost-button" onClick={clearSelection} data-testid="explorer-batch-clear">
                清空
              </button>
            </div>
          </div>
          {batchError && <div className="batch-error">{batchError}</div>}
          <div className="batch-actions-buttons">
            <button
              className="batch-action-btn"
              type="button"
              onClick={() => openBatchModal('copy')}
              disabled={batchLoading}
              data-testid="explorer-batch-copy"
            >
              批量复制
            </button>
            <button
              className="batch-action-btn"
              type="button"
              onClick={() => openBatchModal('move')}
              disabled={batchLoading}
              data-testid="explorer-batch-move"
            >
              批量移动
            </button>
            <button
              className="batch-action-btn"
              type="button"
              onClick={() => openBatchModal('merge')}
              disabled={batchLoading}
              data-testid="explorer-batch-merge"
            >
              合并章节
            </button>
          </div>
        </div>
      )}
      <div className="tree">
        {volumes
          .sort((a, b) => a.orderIndex - b.orderIndex)
          .map((volume) => {
            const isCollapsed = collapsedVolumes.has(volume.id)
            return (
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
                    onClick={() => {
                      toggleVolumeCollapse(volume.id)
                      onSelectVolume(volume.id)
                    }}
                    data-testid={`explorer-volume-${volume.id}`}
                  >
                    <span className={`tree-icon ${isCollapsed ? '' : 'expanded'}`}>▸</span>
                    {volume.title}
                  </button>
                </div>
                {!isCollapsed && (
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
                          <input
                            type="checkbox"
                            className="chapter-select"
                            checked={selectedChapters.has(chapter.id)}
                            onChange={(event) => {
                              const nativeEvent = event.nativeEvent as MouseEvent
                              toggleChapterSelection(chapter.id, event.target.checked, Boolean(nativeEvent?.shiftKey))
                            }}
                            onClick={(event) => event.stopPropagation()}
                            data-testid={`explorer-chapter-select-${chapter.id}`}
                          />
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
                )}
              </div>
            )
          })}
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

      <Modal open={batchAction !== null} onClose={closeBatchModal} title={batchTitle}>
        <div className="batch-modal-content">
          <Select
            label="目标卷"
            options={volumeOptions}
            value={batchTargetVolumeId}
            onChange={setBatchTargetVolumeId}
            placeholder="选择目标卷"
            testId="explorer-batch-target"
          />
          {batchAction === 'merge' && (
            <Input
              label="合并标题"
              value={mergeTitle}
              onChange={(event) => setMergeTitle(event.target.value)}
              data-testid="explorer-batch-merge-title"
            />
          )}
          {batchAction === 'merge' && (
            <div className="batch-modal-note">合并后会删除源章节，可通过版本历史回滚。</div>
          )}
          {batchError && <div className="batch-error">{batchError}</div>}
          <div className="batch-modal-actions">
            <button className="ghost-button" onClick={closeBatchModal} disabled={batchLoading}>
              取消
            </button>
            <button className="mini-button" onClick={handleBatchConfirm} disabled={batchLoading}>
              {batchLoading ? '处理中...' : '确认执行'}
            </button>
          </div>
        </div>
      </Modal>
    </aside>
  )
}
