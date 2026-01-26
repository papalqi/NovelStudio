import './TopBar.css'

type TopBarProps = {
  authorName: string
  offline: boolean
  onOpenSettings: () => void
  onOpenPreview: () => void
  onManualSync: () => void
  autosaveEnabled: boolean
}

export const TopBar = ({
  authorName,
  offline,
  onOpenSettings,
  onOpenPreview,
  onManualSync,
  autosaveEnabled
}: TopBarProps) => {
  return (
    <header className="top-bar">
      <div className="brand">
        <span className="brand-dot" />
        <div>
          <div className="brand-title">NovelstudioAI</div>
          <div className="brand-sub">网络小说 · 块编辑 · 多模型 Agent</div>
        </div>
      </div>
      <div className="top-actions">
        <span className={`sync-pill ${offline ? 'offline' : ''}`}>
          {offline ? '离线模式' : '同步中'}
        </span>
        <span className="author-pill">作者：{authorName}</span>
        {!autosaveEnabled && (
          <button className="ghost-button" onClick={onManualSync}>
            手动同步
          </button>
        )}
        <button className="ghost-button" onClick={onOpenPreview}>
          发布预览
        </button>
        <button className="primary-button" onClick={onOpenSettings}>
          设置面板
        </button>
      </div>
    </header>
  )
}
