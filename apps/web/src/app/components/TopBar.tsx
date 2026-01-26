import './TopBar.css'
import { Settings, Eye, BookOpen, Moon, Sun, RefreshCw } from 'lucide-react'

type TopBarProps = {
  authorName: string
  offline: boolean
  onOpenSettings: () => void
  onOpenPreview: () => void
  onManualSync: () => void
  autosaveEnabled: boolean
  onOpenKnowledgeBase: () => void
  theme: 'light' | 'dark'
  onToggleTheme: () => void
}

export const TopBar = ({
  authorName,
  offline,
  onOpenSettings,
  onOpenPreview,
  onManualSync,
  autosaveEnabled,
  onOpenKnowledgeBase,
  theme,
  onToggleTheme
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

        <div className="topbar-actions">
          <button className="topbar-button" onClick={onOpenKnowledgeBase} title="资料库">
            <BookOpen size={18} />
            <span className="topbar-button-label">资料库</span>
          </button>

          <button className="topbar-button" onClick={onOpenPreview} title="预览">
            <Eye size={18} />
          </button>

          <button className="topbar-button" onClick={onToggleTheme} title={theme === 'light' ? '深色模式' : '浅色模式'}>
            {theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
          </button>

          <button className="topbar-button" onClick={onOpenSettings} title="设置">
            <Settings size={18} />
          </button>

          {!autosaveEnabled && (
            <button className="topbar-button sync" onClick={onManualSync} title="手动同步">
              <RefreshCw size={18} />
            </button>
          )}
        </div>
      </div>
    </header>
  )
}
