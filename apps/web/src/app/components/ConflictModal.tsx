import './ConflictModal.css'

type ConflictModalProps = {
  open: boolean
  chapterTitle: string
  serverUpdatedAt?: string
  onOverwrite: () => void
  onSaveCopy: () => void
  onReload: () => void
}

export const ConflictModal = ({
  open,
  chapterTitle,
  serverUpdatedAt,
  onOverwrite,
  onSaveCopy,
  onReload
}: ConflictModalProps) => {
  if (!open) return null

  return (
    <div className="conflict-overlay" data-testid="conflict-overlay">
      <div className="conflict-panel" role="dialog" aria-modal="true" aria-labelledby="conflict-title">
        <header>
          <h2 id="conflict-title">检测到保存冲突</h2>
          <p>
            章节 <span className="conflict-highlight">{chapterTitle}</span> 在其它设备上有更新
            {serverUpdatedAt ? `（${serverUpdatedAt}）` : ''}。
          </p>
        </header>
        <div className="conflict-body">
          <div className="conflict-option">
            <div className="conflict-option-title">覆盖</div>
            <div className="conflict-option-desc">使用当前内容覆盖远端版本。</div>
            <button className="conflict-btn primary" onClick={onOverwrite} data-testid="conflict-overwrite">
              覆盖保存
            </button>
          </div>
          <div className="conflict-option">
            <div className="conflict-option-title">另存</div>
            <div className="conflict-option-desc">将当前内容保存为版本快照，避免丢失。</div>
            <button className="conflict-btn" onClick={onSaveCopy} data-testid="conflict-save-copy">
              另存版本
            </button>
          </div>
          <div className="conflict-option">
            <div className="conflict-option-title">重新加载</div>
            <div className="conflict-option-desc">放弃当前未保存内容，加载远端最新版本。</div>
            <button className="conflict-btn" onClick={onReload} data-testid="conflict-reload">
              重新加载
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
