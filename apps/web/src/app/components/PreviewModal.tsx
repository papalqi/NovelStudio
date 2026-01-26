import { useState, useEffect, useCallback, type MouseEvent } from 'react'
import { X, Download, FileCode, FileText } from 'lucide-react'
import './PreviewModal.css'

type PreviewModalProps = {
  open: boolean
  html: string
  markdown: string
  onClose: () => void
}

export const PreviewModal = ({ open, html, markdown, onClose }: PreviewModalProps) => {
  const [tab, setTab] = useState<'html' | 'markdown'>('html')

  // ESC 键关闭
  const handleEscape = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose()
      }
    },
    [onClose]
  )

  useEffect(() => {
    if (open) {
      document.addEventListener('keydown', handleEscape)
      document.body.style.overflow = 'hidden'
    }
    return () => {
      document.removeEventListener('keydown', handleEscape)
      document.body.style.overflow = ''
    }
  }, [open, handleEscape])

  // 点击遮罩关闭
  const handleBackdropClick = (e: MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose()
    }
  }

  if (!open) return null

  const handleDownload = () => {
    const content = tab === 'html' ? html : markdown
    const blob = new Blob([content], { type: tab === 'html' ? 'text/html' : 'text/markdown' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `chapter.${tab === 'html' ? 'html' : 'md'}`
    link.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="preview-overlay" onClick={handleBackdropClick}>
      <div className="preview-panel" role="dialog" aria-modal="true" aria-labelledby="preview-title">
        <header>
          <h2 id="preview-title">发布预览</h2>
          <div className="preview-actions">
            <button
              className={`preview-tab-btn ${tab === 'html' ? 'active' : ''}`}
              onClick={() => setTab('html')}
              aria-pressed={tab === 'html'}
            >
              <FileCode size={14} />
              HTML
            </button>
            <button
              className={`preview-tab-btn ${tab === 'markdown' ? 'active' : ''}`}
              onClick={() => setTab('markdown')}
              aria-pressed={tab === 'markdown'}
            >
              <FileText size={14} />
              Markdown
            </button>
            <button className="preview-action-btn" onClick={handleDownload}>
              <Download size={14} />
              下载
            </button>
            <button className="preview-close-btn" onClick={onClose} aria-label="关闭">
              <X size={16} />
            </button>
          </div>
        </header>
        <div className="preview-body">
          {tab === 'html' ? (
            <div className="preview-html" dangerouslySetInnerHTML={{ __html: html }} />
          ) : (
            <pre>{markdown}</pre>
          )}
        </div>
      </div>
    </div>
  )
}
