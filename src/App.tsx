import { useEffect, useMemo, useRef, useState } from 'react'
import { useCreateBlockNote } from '@blocknote/react'
import { BlockNoteView } from '@blocknote/mantine'
import './App.css'

type ChapterStatus = 'draft' | 'review' | 'done'

type Chapter = {
  id: string
  volumeId: string
  title: string
  status: ChapterStatus
  updatedAt: string
  wordCount: number
}

type Volume = {
  id: string
  title: string
  chapterIds: string[]
}

type ProviderConfig = {
  id: string
  name: string
  baseUrl: string
  token: string
  model: string
}

type AgentConfig = {
  id: string
  name: string
  providerId: string
  systemPrompt: string
}

type BlockNoteBlock = any

const DEFAULT_PROVIDER: ProviderConfig = {
  id: 'provider-openai',
  name: 'OpenAI Compatible',
  baseUrl: 'https://api.example.com/v1',
  token: '',
  model: 'gpt-4.1-mini'
}

const DEFAULT_AGENT: AgentConfig = {
  id: 'agent-novel-planner',
  name: '章节规划 Agent',
  providerId: DEFAULT_PROVIDER.id,
  systemPrompt: '你是网络小说编辑助手，擅长结构规划、节奏控制与人物一致性。'
}

const createId = () =>
  globalThis.crypto?.randomUUID?.() ?? `id-${Math.random().toString(36).slice(2, 10)}`

const getPlainTextFromInline = (inline: any) => {
  if (!inline) return ''
  if (inline.type === 'text') return inline.text ?? ''
  if (inline.type === 'link') return inline.text ?? ''
  return ''
}

const getPlainTextFromBlock = (block: BlockNoteBlock | null | undefined) => {
  if (!block?.content) return ''
  if (typeof block.content === 'string') return block.content
  if (Array.isArray(block.content)) {
    return block.content.map(getPlainTextFromInline).join('')
  }
  return ''
}

const getPlainTextFromDoc = (blocks: BlockNoteBlock[]) =>
  blocks.map(getPlainTextFromBlock).join('\n')

const estimateWordCount = (blocks: BlockNoteBlock[]) => {
  const text = getPlainTextFromDoc(blocks).replace(/\s+/g, '')
  return text.length
}

const initialVolumes: Volume[] = [
  { id: 'vol-1', title: '第一卷 · 迷雾城', chapterIds: ['ch-1', 'ch-2', 'ch-3'] },
  { id: 'vol-2', title: '第二卷 · 风暴海', chapterIds: ['ch-4'] }
]

const initialChapters: Chapter[] = [
  {
    id: 'ch-1',
    volumeId: 'vol-1',
    title: '第1章 夜航',
    status: 'draft',
    updatedAt: '2026-01-25',
    wordCount: 1280
  },
  {
    id: 'ch-2',
    volumeId: 'vol-1',
    title: '第2章 地下灯火',
    status: 'review',
    updatedAt: '2026-01-24',
    wordCount: 2100
  },
  {
    id: 'ch-3',
    volumeId: 'vol-1',
    title: '第3章 霜印',
    status: 'draft',
    updatedAt: '2026-01-23',
    wordCount: 1560
  },
  {
    id: 'ch-4',
    volumeId: 'vol-2',
    title: '第4章 风暴港',
    status: 'done',
    updatedAt: '2026-01-21',
    wordCount: 3420
  }
]

const defaultChapterContent: Record<string, BlockNoteBlock[]> = {
  'ch-1': [
    {
      id: 'ch-1-1',
      type: 'heading',
      content: '第1章 夜航'
    },
    {
      id: 'ch-1-2',
      type: 'paragraph',
      content:
        '海面像一块被磨亮的黑曜石，夜航船在微光里划开一条窄窄的纹路。你可以从这里开始写开场场景。'
    }
  ],
  'ch-2': [
    {
      id: 'ch-2-1',
      type: 'heading',
      content: '第2章 地下灯火'
    },
    {
      id: 'ch-2-2',
      type: 'paragraph',
      content: '这里适合描述城市的地下体系、人物第一次交锋。'
    }
  ],
  'ch-3': [
    {
      id: 'ch-3-1',
      type: 'heading',
      content: '第3章 霜印'
    },
    {
      id: 'ch-3-2',
      type: 'paragraph',
      content: '使用这个章节放置主角技能或谜团的铺垫。'
    }
  ],
  'ch-4': [
    {
      id: 'ch-4-1',
      type: 'heading',
      content: '第4章 风暴港'
    },
    {
      id: 'ch-4-2',
      type: 'paragraph',
      content: '这是一个高潮节点，适合制造冲突和悬念。'
    }
  ]
}

const loadJson = <T,>(key: string, fallback: T) => {
  try {
    const raw = localStorage.getItem(key)
    if (!raw) return fallback
    return JSON.parse(raw) as T
  } catch {
    return fallback
  }
}

const saveJson = (key: string, value: unknown) => {
  localStorage.setItem(key, JSON.stringify(value))
}

function App() {
  const editor = useCreateBlockNote()
  const [volumes, setVolumes] = useState<Volume[]>(initialVolumes)
  const [chapters, setChapters] = useState<Chapter[]>(initialChapters)
  const [activeVolumeId, setActiveVolumeId] = useState(initialVolumes[0].id)
  const [activeChapterId, setActiveChapterId] = useState(initialChapters[0].id)
  const [chapterContent, setChapterContent] = useState<Record<string, BlockNoteBlock[]>>(
    defaultChapterContent
  )
  const chapterContentRef = useRef(chapterContent)
  const [providers, setProviders] = useState<ProviderConfig[]>(() =>
    loadJson('novelstudio.providers', [DEFAULT_PROVIDER])
  )
  const [agents, setAgents] = useState<AgentConfig[]>(() =>
    loadJson('novelstudio.agents', [DEFAULT_AGENT])
  )
  const [activeProviderId, setActiveProviderId] = useState(DEFAULT_PROVIDER.id)
  const [activeAgentId, setActiveAgentId] = useState(DEFAULT_AGENT.id)
  const [selectedBlock, setSelectedBlock] = useState<BlockNoteBlock | null>(null)
  const [aiLog, setAiLog] = useState<string[]>([
    'AI 控制台已连接。请选择块并尝试“改写/扩写”。'
  ])
  const switchingRef = useRef(false)

  useEffect(() => {
    chapterContentRef.current = chapterContent
  }, [chapterContent])

  useEffect(() => {
    saveJson('novelstudio.providers', providers)
  }, [providers])

  useEffect(() => {
    saveJson('novelstudio.agents', agents)
  }, [agents])

  useEffect(() => {
    const storedContent = chapterContentRef.current[activeChapterId]
    const nextContent = (storedContent ?? defaultChapterContent[activeChapterId] ?? []) as any[]
    switchingRef.current = true
    editor.replaceBlocks(editor.document, nextContent)
    switchingRef.current = false
  }, [activeChapterId, editor])

  const activeChapter = useMemo(
    () => chapters.find((chapter) => chapter.id === activeChapterId),
    [chapters, activeChapterId]
  )

  const volumeMap = useMemo(
    () => new Map(volumes.map((volume) => [volume.id, volume])),
    [volumes]
  )

  const chapterMap = useMemo(
    () => new Map(chapters.map((chapter) => [chapter.id, chapter])),
    [chapters]
  )

  const updateActiveChapterContent = () => {
    if (switchingRef.current) return
    const content = editor.document as BlockNoteBlock[]
    setChapterContent((prev) => ({ ...prev, [activeChapterId]: content }))
    const wordCount = estimateWordCount(content)
    setChapters((prev) =>
      prev.map((chapter) =>
        chapter.id === activeChapterId
          ? { ...chapter, wordCount, updatedAt: '2026-01-25' }
          : chapter
      )
    )
  }

  const handleSelectionChange = () => {
    const currentBlock = editor.getTextCursorPosition().block as BlockNoteBlock
    setSelectedBlock(currentBlock ?? null)
  }

  const addChapter = () => {
    const id = createId()
    const chapterTitle = `第${chapters.length + 1}章 新章节`
    const newChapter: Chapter = {
      id,
      volumeId: activeVolumeId,
      title: chapterTitle,
      status: 'draft',
      updatedAt: '2026-01-25',
      wordCount: 0
    }
    setChapters((prev) => [...prev, newChapter])
    setVolumes((prev) =>
      prev.map((volume) =>
        volume.id === activeVolumeId
          ? { ...volume, chapterIds: [...volume.chapterIds, id] }
          : volume
      )
    )
    setChapterContent((prev) => ({
      ...prev,
      [id]: [
        { id: `${id}-h`, type: 'heading', content: chapterTitle },
        { id: `${id}-p`, type: 'paragraph', content: '从这里开始写本章内容。' }
      ]
    }))
    setActiveChapterId(id)
  }

  const updateChapterTitle = (chapterId: string, title: string) => {
    setChapters((prev) =>
      prev.map((chapter) => (chapter.id === chapterId ? { ...chapter, title } : chapter))
    )
  }

  const addProvider = () => {
    const id = createId()
    setProviders((prev) => [
      ...prev,
      { id, name: 'New Provider', baseUrl: '', token: '', model: '' }
    ])
    setActiveProviderId(id)
  }

  const addAgent = () => {
    const id = createId()
    setAgents((prev) => [
      ...prev,
      {
        id,
        name: '新 Agent',
        providerId: activeProviderId,
        systemPrompt: '描述 Agent 的职责和风格。'
      }
    ])
    setActiveAgentId(id)
  }

  const pushAiLog = (message: string) => {
    setAiLog((prev) => [message, ...prev].slice(0, 12))
  }

  const applyAiTransform = (mode: string) => {
    if (!selectedBlock) {
      pushAiLog('请先在正文中选中一个块。')
      return
    }
    const sourceText = getPlainTextFromBlock(selectedBlock)
    const provider = providers.find((item) => item.id === activeProviderId)
    const agent = agents.find((item) => item.id === activeAgentId)
    pushAiLog(
      `发送到 ${provider?.name ?? 'Provider'} · ${agent?.name ?? 'Agent'}：${mode}`
    )
    const result = sourceText
      ? `【AI ${mode}】${sourceText}`
      : `【AI ${mode}】请在此输出内容。`
    editor.updateBlock(selectedBlock.id, { content: result })
    updateActiveChapterContent()
  }

  const runAgent = () => {
    const provider = providers.find((item) => item.id === activeProviderId)
    const agent = agents.find((item) => item.id === activeAgentId)
    pushAiLog(`Agent ${agent?.name ?? ''} 已触发，准备调用 ${provider?.name ?? ''}。`)
  }

  return (
    <div className="app-shell">
      <header className="top-bar">
        <div className="brand">
          <span className="brand-dot" />
          <div>
            <div className="brand-title">NovelStudio AI</div>
            <div className="brand-sub">网络小说 · 块编辑 · 多模型 Agent</div>
          </div>
        </div>
        <div className="top-actions">
          <button className="ghost-button">发布预览</button>
          <button className="primary-button">同步云端</button>
        </div>
      </header>

      <main className="workspace">
        <aside className="sidebar">
          <div className="panel-header">
            <span>资源管理器</span>
            <button className="mini-button" onClick={addChapter}>
              + 新章节
            </button>
          </div>
          <div className="tree">
            {volumes.map((volume) => (
              <div key={volume.id} className="tree-group">
                <button
                  className={`tree-group-title ${
                    activeVolumeId === volume.id ? 'active' : ''
                  }`}
                  onClick={() => setActiveVolumeId(volume.id)}
                >
                  <span className="tree-icon">▸</span>
                  {volume.title}
                </button>
                <div className="tree-children">
                  {volume.chapterIds.map((chapterId) => {
                    const chapter = chapterMap.get(chapterId)
                    if (!chapter) return null
                    return (
                      <button
                        key={chapter.id}
                        className={`tree-item ${
                          activeChapterId === chapter.id ? 'selected' : ''
                        }`}
                        onClick={() => setActiveChapterId(chapter.id)}
                      >
                        <span className={`status-dot status-${chapter.status}`} />
                        <span className="tree-item-title">{chapter.title}</span>
                        <span className="tree-meta">{chapter.wordCount}字</span>
                      </button>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>
        </aside>

        <section className="editor-area">
          <div className="editor-toolbar">
            <div className="chapter-info">
              <input
                className="chapter-title-input"
                value={activeChapter?.title ?? ''}
                onChange={(event) => updateChapterTitle(activeChapterId, event.target.value)}
              />
              <span className="chapter-meta">
                {activeChapter?.wordCount ?? 0}字 · 更新 {activeChapter?.updatedAt ?? '-'}
              </span>
            </div>
            <div className="toolbar-actions">
              <button className="ghost-button">章节设定</button>
              <button className="ghost-button">人物卡</button>
              <button className="ghost-button">世界观</button>
            </div>
          </div>
          <div className="editor-surface">
            <BlockNoteView
              editor={editor}
              onChange={updateActiveChapterContent}
              onSelectionChange={handleSelectionChange}
            />
          </div>
        </section>

        <aside className="right-panel">
          <div className="panel-section">
            <div className="panel-title">块级 AI 动作</div>
            <div className="panel-body">
              <div className="block-card">
                <div className="block-label">当前块</div>
                <div className="block-value">
                  {selectedBlock?.type ?? '未选择'} ·{' '}
                  {getPlainTextFromBlock(selectedBlock).slice(0, 20)}
                </div>
              </div>
              <div className="action-grid">
                <button className="action-button" onClick={() => applyAiTransform('改写')}>
                  改写
                </button>
                <button className="action-button" onClick={() => applyAiTransform('扩写')}>
                  扩写
                </button>
                <button className="action-button" onClick={() => applyAiTransform('缩写')}>
                  缩写
                </button>
                <button className="action-button" onClick={() => applyAiTransform('续写')}>
                  续写
                </button>
              </div>
            </div>
          </div>

          <div className="panel-section">
            <div className="panel-title">AI Provider 配置</div>
            <div className="panel-body">
              <div className="select-row">
                <select
                  value={activeProviderId}
                  onChange={(event) => setActiveProviderId(event.target.value)}
                >
                  {providers.map((provider) => (
                    <option key={provider.id} value={provider.id}>
                      {provider.name}
                    </option>
                  ))}
                </select>
                <button className="mini-button" onClick={addProvider}>
                  + Provider
                </button>
              </div>
              {providers
                .filter((provider) => provider.id === activeProviderId)
                .map((provider) => (
                  <div key={provider.id} className="field-stack">
                    <label>
                      名称
                      <input
                        value={provider.name}
                        onChange={(event) =>
                          setProviders((prev) =>
                            prev.map((item) =>
                              item.id === provider.id
                                ? { ...item, name: event.target.value }
                                : item
                            )
                          )
                        }
                      />
                    </label>
                    <label>
                      API URL
                      <input
                        value={provider.baseUrl}
                        onChange={(event) =>
                          setProviders((prev) =>
                            prev.map((item) =>
                              item.id === provider.id
                                ? { ...item, baseUrl: event.target.value }
                                : item
                            )
                          )
                        }
                        placeholder="https://api.xxx.com/v1"
                      />
                    </label>
                    <label>
                      Token
                      <input
                        value={provider.token}
                        onChange={(event) =>
                          setProviders((prev) =>
                            prev.map((item) =>
                              item.id === provider.id
                                ? { ...item, token: event.target.value }
                                : item
                            )
                          )
                        }
                        placeholder="sk-..."
                        type="password"
                      />
                    </label>
                    <label>
                      Model
                      <input
                        value={provider.model}
                        onChange={(event) =>
                          setProviders((prev) =>
                            prev.map((item) =>
                              item.id === provider.id
                                ? { ...item, model: event.target.value }
                                : item
                            )
                          )
                        }
                        placeholder="gpt-4.1-mini"
                      />
                    </label>
                  </div>
                ))}
            </div>
          </div>

          <div className="panel-section">
            <div className="panel-title">Agent 配置</div>
            <div className="panel-body">
              <div className="select-row">
                <select
                  value={activeAgentId}
                  onChange={(event) => setActiveAgentId(event.target.value)}
                >
                  {agents.map((agent) => (
                    <option key={agent.id} value={agent.id}>
                      {agent.name}
                    </option>
                  ))}
                </select>
                <button className="mini-button" onClick={addAgent}>
                  + Agent
                </button>
              </div>
              {agents
                .filter((agent) => agent.id === activeAgentId)
                .map((agent) => (
                  <div key={agent.id} className="field-stack">
                    <label>
                      名称
                      <input
                        value={agent.name}
                        onChange={(event) =>
                          setAgents((prev) =>
                            prev.map((item) =>
                              item.id === agent.id
                                ? { ...item, name: event.target.value }
                                : item
                            )
                          )
                        }
                      />
                    </label>
                    <label>
                      Provider
                      <select
                        value={agent.providerId}
                        onChange={(event) =>
                          setAgents((prev) =>
                            prev.map((item) =>
                              item.id === agent.id
                                ? { ...item, providerId: event.target.value }
                                : item
                            )
                          )
                        }
                      >
                        {providers.map((provider) => (
                          <option key={provider.id} value={provider.id}>
                            {provider.name}
                          </option>
                        ))}
                      </select>
                    </label>
                    <label>
                      System Prompt
                      <textarea
                        rows={4}
                        value={agent.systemPrompt}
                        onChange={(event) =>
                          setAgents((prev) =>
                            prev.map((item) =>
                              item.id === agent.id
                                ? { ...item, systemPrompt: event.target.value }
                                : item
                            )
                          )
                        }
                      />
                    </label>
                    <button className="primary-button" onClick={runAgent}>
                      运行 Agent
                    </button>
                  </div>
                ))}
            </div>
          </div>

          <div className="panel-section">
            <div className="panel-title">AI 控制台</div>
            <div className="panel-body">
              <div className="log-list">
                {aiLog.map((entry, index) => (
                  <div key={`${entry}-${index}`} className="log-item">
                    {entry}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </aside>
      </main>

      <footer className="status-bar">
        <span>光标块: {selectedBlock?.type ?? '-'}</span>
        <span>卷: {volumeMap.get(activeVolumeId)?.title ?? '-'}</span>
        <span>章节: {activeChapter?.title ?? '-'}</span>
      </footer>
    </div>
  )
}

export default App
