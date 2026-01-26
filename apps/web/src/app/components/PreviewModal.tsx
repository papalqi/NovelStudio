import { useState } from 'react'
import './PreviewModal.css'

type PreviewModalProps = {
  open: boolean
  html: string
  markdown: string
  onClose: () => void
}

export const PreviewModal = ({ open, html, markdown, onClose }: PreviewModalProps) => {
  const [tab, setTab] = useState<'html' | 'markdown'>('html')

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
    <div className="preview-overlay">
      <div className="preview-panel">
        <header>
          <h2>发布预览</h2>
          <div className="preview-actions">
            <button className="ghost-button" onClick={() => setTab('html')}>
              HTML
            </button>
            <button className="ghost-button" onClick={() => setTab('markdown')}>
              Markdown
            </button>
            <button className="ghost-button" onClick={handleDownload}>
              下载
            </button>
            <button className="ghost-button" onClick={onClose}>
              关闭
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
