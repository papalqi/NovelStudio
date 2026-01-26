# 前端重构建议清单

> 基于代码审查，以下是从架构、代码组织、UI/UX、性能、可维护性等维度的重构建议。

---

## 🍎 零、核心视觉重构（macOS 风格）

### 0.1 整体设计语言
- [ ] 采用 **macOS Sonoma** 风格设计语言
- [ ] 毛玻璃效果（`backdrop-filter: blur(20px) saturate(180%)`）
- [ ] 更圆润的圆角（16-20px）
- [ ] 精致的阴影层次（多层阴影叠加）
- [ ] 微妙的边框（`rgba(255,255,255,0.2)` 内发光效果）

### 0.2 深色模式完善
- [ ] **完整的深色主题变量**
  ```css
  html[data-theme='dark'] {
    --bg-primary: #1e1e1e;
    --bg-secondary: #2d2d2d;
    --bg-tertiary: #3d3d3d;
    --bg-elevated: rgba(50, 50, 50, 0.8);
    --text-primary: #ffffff;
    --text-secondary: rgba(255, 255, 255, 0.7);
    --text-tertiary: rgba(255, 255, 255, 0.5);
    --border-primary: rgba(255, 255, 255, 0.1);
    --border-secondary: rgba(255, 255, 255, 0.05);
    --accent: #0a84ff;
    --accent-hover: #409cff;
  }
  ```
- [ ] 深色模式下的毛玻璃效果调整
- [ ] 图标和状态色在深色模式下的适配
- [ ] 系统主题自动跟随（`prefers-color-scheme`）

### 0.3 右键菜单替代按钮操作
- [ ] **卷操作改为右键菜单**
  - 移除「上移」「下移」「改名」「删除」按钮
  - 右键弹出 macOS 风格上下文菜单
  - 菜单项：重命名 / 上移 / 下移 / 分隔线 / 删除（红色）
- [ ] **章节操作改为右键菜单**
  - 右键弹出：重命名 / 移动到... / 复制 / 分隔线 / 删除
- [ ] **右键菜单组件设计**
  ```
  ┌─────────────────────┐
  │ 📝 重命名           │
  ├─────────────────────┤
  │ ⬆️ 上移             │
  │ ⬇️ 下移             │
  ├─────────────────────┤
  │ 🗑️ 删除      ⌘⌫    │  ← 红色文字
  └─────────────────────┘
  ```
- [ ] 菜单动画：缩放 + 淡入（`transform: scale(0.95)` → `scale(1)`）
- [ ] 点击外部自动关闭

---

## 🎛️ 0.4 设置面板重构（macOS System Preferences 风格）

### 当前问题
- 表单堆砌，缺乏层次
- 没有分类导航
- 视觉不够精致

### 目标效果
```
┌──────────────────────────────────────────────────────────┐
│  ←  设置                                          ✕     │  ← 毛玻璃标题栏
├────────────┬─────────────────────────────────────────────┤
│            │                                             │
│  👤 个人   │   个人资料                                  │
│  🎨 外观   │   ─────────────────────────────────────     │
│  💾 存储   │                                             │
│  🤖 AI    │   作者名称                                   │
│  📤 导出   │   ┌─────────────────────────────────┐       │
│            │   │ 匿名作者                        │       │
│            │   └─────────────────────────────────┘       │
│            │                                             │
│            │   头像                                      │
│            │   ┌──────┐                                  │
│            │   │  👤  │  更换头像                        │
│            │   └──────┘                                  │
│            │                                             │
└────────────┴─────────────────────────────────────────────┘
```

### 实现要点
- [ ] **左侧图标导航栏**
  - 垂直图标列表
  - 选中态高亮背景
  - 悬停态微妙反馈
- [ ] **右侧内容区**
  - 分组卡片布局
  - 每组有标题和描述
  - 表单控件 macOS 风格
- [ ] **表单控件重设计**
  - Toggle 开关（macOS 风格圆角胶囊）
  - 下拉选择器（自定义样式，非原生 select）
  - 输入框（圆角、聚焦态发光边框）
  - 滑块（用于 temperature 等数值）
- [ ] **Provider/Agent 卡片**
  - 卡片式布局，可展开/折叠
  - 拖拽排序
  - 删除确认动画

---

## 📊 0.5 右侧面板重构（macOS Inspector 风格）

### 当前问题
- 内容过多，滚动体验差
- 面板之间缺乏层次
- 资料库不应该放在右侧（需独立模块）

### 目标效果（精简版，移除资料库）
```
┌─────────────────────────────┐
│  AI 助手                 ▾  │  ← 可折叠标题
├─────────────────────────────┤
│  ┌─────────┐ ┌─────────┐   │
│  │ Claude  │ │ 写作助手 │   │  ← 胶囊选择器
│  └─────────┘ └─────────┘   │
│                             │
│  当前选中                   │
│  ┌─────────────────────────┐│
│  │ 段落块                  ││  ← 毛玻璃卡片
│  │ "这是一段示例文字..."   ││
│  └─────────────────────────┘│
│                             │
│  ┌────┐ ┌────┐ ┌────┐ ┌────┐│
│  │改写│ │扩写│ │缩写│ │续写││  ← 图标按钮网格
│  └────┘ └────┘ └────┘ └────┘│
└─────────────────────────────┘
│  版本历史                ▸  │  ← 折叠状态
├─────────────────────────────┤
│  评论                    ▸  │
├─────────────────────────────┤
│  AI 日志                 ▸  │
└─────────────────────────────┘
```

### 实现要点
- [ ] **可折叠面板（Accordion）**
  - 默认只展开「AI 助手」
  - 点击标题展开/折叠
  - 平滑动画过渡
- [ ] **毛玻璃卡片**
  - 半透明背景
  - 模糊效果
  - 细边框
- [ ] **图标化操作按钮**
  - 用图标替代文字
  - 悬停显示 tooltip
  - 网格布局
- [ ] **分段控制器（Segmented Control）**
  - 用于 Provider/Agent 切换
  - macOS 风格胶囊设计

---

## 📚 0.6 资料库独立模块（Knowledge Base）

### 设计理念
资料库是独立的知识管理系统，包含角色卡、地点、世界观、引用等内容。
应该作为**左侧边栏的独立 Tab** 或 **独立页面/抽屉**，而非挤在右侧面板。

### 方案一：左侧边栏 Tab 切换
```
┌─────────────────────────────────────────────────────────────┐
│  NovelstudioAI                                              │
├──────┬──────┬───────────────────────────────────────────────┤
│ 📁   │ 📚   │                                               │
│章节  │资料库│                                               │
├──────┴──────┤                                               │
│             │                                               │
│  [资料库]   │              编辑区                           │
│             │                                               │
│  👤 角色    │                                               │
│  ├─ 主角    │                                               │
│  ├─ 反派    │                                               │
│  └─ 配角    │                                               │
│             │                                               │
│  🗺️ 地点    │                                               │
│  ├─ 王都    │                                               │
│  └─ 魔法塔  │                                               │
│             │                                               │
│  🌍 世界观  │                                               │
│  ├─ 魔法体系│                                               │
│  └─ 历史年表│                                               │
│             │                                               │
│  📎 引用    │                                               │
│  └─ 参考资料│                                               │
│             │                                               │
└─────────────┴───────────────────────────────────────────────┘
```

### 方案二：独立抽屉/模态框（推荐）
```
┌─────────────────────────────────────────────────────────────┐
│  NovelstudioAI                    [📚 资料库] [⚙️ 设置]     │  ← 顶栏按钮
└─────────────────────────────────────────────────────────────┘

点击「资料库」按钮后，从右侧滑出大型抽屉：

                              ┌────────────────────────────────┐
                              │  📚 资料库                  ✕  │
                              ├────────────────────────────────┤
                              │  🔍 搜索资料...                │
                              ├────────┬───────────────────────┤
                              │        │                       │
                              │ 👤 角色│  林逸尘               │
                              │ 🗺️ 地点│  ─────────────────    │
                              │ 🌍 世界│                       │
                              │ 📎 引用│  基本信息             │
                              │        │  ┌─────────────────┐  │
                              │ + 新建 │  │ 年龄: 25        │  │
                              │        │  │ 身份: 剑修      │  │
                              │────────│  │ 性格: 沉稳内敛  │  │
                              │ 最近   │  └─────────────────┘  │
                              │ · 林逸尘│                       │
                              │ · 王都 │  外貌描写             │
                              │ · 魔法 │  ┌─────────────────┐  │
                              │        │  │ 黑发黑眸，身形  │  │
                              │        │  │ 修长，常着青衫  │  │
                              │        │  └─────────────────┘  │
                              │        │                       │
                              │        │  [插入到编辑器] [编辑]│
                              └────────┴───────────────────────┘
```

### 资料卡片结构设计
```typescript
type NoteCard = {
  id: string
  type: 'character' | 'location' | 'worldbuilding' | 'reference'
  title: string
  icon?: string           // 自定义图标/头像
  color?: string          // 标签颜色
  tags: string[]          // 分类标签
  fields: NoteField[]     // 自定义字段
  content: string         // 富文本描述（Markdown）
  relations: string[]     // 关联其他卡片 ID
  createdAt: string
  updatedAt: string
}

type NoteField = {
  key: string             // 字段名：年龄、身份、位置...
  value: string           // 字段值
  type: 'text' | 'number' | 'date' | 'select' | 'multiselect'
}
```

### 功能要点
- [ ] **分类树形结构**
  - 角色 / 地点 / 世界观 / 引用 四大分类
  - 支持子分类（如角色下分主角、配角、反派）
  - 拖拽排序和移动
- [ ] **卡片详情编辑**
  - 自定义字段（类似 Notion 数据库）
  - 富文本描述区
  - 图片/头像上传
  - 关联其他卡片
- [ ] **快速搜索**
  - 全局搜索所有资料
  - 按类型/标签筛选
  - 模糊匹配
- [ ] **与编辑器联动**
  - 「插入到编辑器」按钮
  - 编辑器中 @ 提及资料卡
  - AI 写作时自动引用相关设定
- [ ] **导入导出**
  - 导出为 JSON/Markdown
  - 从其他工具导入

### 视觉风格
- [ ] 抽屉宽度：50% 屏幕宽度（最小 480px）
- [ ] 毛玻璃背景 + 阴影
- [ ] 左侧分类导航 + 右侧详情
- [ ] 卡片预览：头像 + 标题 + 简介
- [ ] 悬停显示快捷操作

---

## 🤖 0.7 内置 Prompt 与 Agent 预设

### 设计理念
用户开箱即用，无需从零配置。提供专业的写作辅助 Agent 和常用 Prompt 模板。

### 内置 Agent 列表

| Agent 名称 | 用途 | System Prompt 要点 |
|-----------|------|-------------------|
| **写作助手** | 通用写作辅助 | 你是专业的网络小说写作助手，擅长情节构思、文笔润色、角色塑造 |
| **续写大师** | 续写/扩写 | 根据上下文风格续写，保持人物性格一致，情节连贯 |
| **润色专家** | 文笔优化 | 优化文笔，增强画面感，但保持原意和风格不变 |
| **大纲规划师** | 章节/全书大纲 | 擅长故事结构设计，三幕式/英雄之旅等叙事框架 |
| **角色设计师** | 角色卡生成 | 创建立体的人物形象，包含外貌、性格、背景、动机 |
| **世界构建师** | 世界观设定 | 构建完整的世界观体系，魔法/科技/社会/历史 |
| **对话专家** | 对话优化 | 让对话更自然、有个性，符合角色身份 |
| **校对助手** | 错误检查 | 检查错别字、病句、前后矛盾、设定冲突 |

### 内置 Prompt 模板

```typescript
const builtInPrompts = {
  // 块级操作
  rewrite: '请改写以下段落，保持原意但换一种表达方式：\n\n{content}',
  expand: '请扩写以下段落，增加细节描写和心理活动：\n\n{content}',
  shorten: '请精简以下段落，保留核心信息，删除冗余：\n\n{content}',
  continue: '请根据以下内容续写，保持风格一致：\n\n{content}',

  // 章节级操作
  outline: '请为以下章节内容生成详细大纲：\n\n{content}\n\n章节信息：{context}',
  chapterCheck: '请检查以下章节的连贯性，找出逻辑漏洞和前后矛盾：\n\n{content}',
  characterCheck: '请检查以下内容中角色的一致性，包括性格、说话方式、行为逻辑：\n\n{content}\n\n角色设定：{characters}',
  styleTune: '请润色以下内容，提升文笔质量，增强画面感：\n\n{content}',

  // 资料库相关
  generateCharacter: '请根据以下描述生成完整的角色卡：\n\n{description}',
  generateLocation: '请根据以下描述生成详细的地点设定：\n\n{description}',
  generateWorldbuilding: '请扩展以下世界观设定：\n\n{description}',

  // 高级功能
  plotHoles: '请分析以下故事是否存在情节漏洞：\n\n{content}',
  tensionCurve: '请分析以下章节的情节张力曲线，并给出优化建议：\n\n{content}',
  dialoguePolish: '请优化以下对话，使其更自然、更有个性：\n\n{content}'
}
```

### 默认 Provider 配置

```typescript
const defaultProviders = [
  {
    id: 'openai-compatible',
    name: 'OpenAI 兼容',
    baseUrl: 'https://api.openai.com/v1',
    token: '',  // 用户填写
    model: 'gpt-4o'
  },
  {
    id: 'deepseek',
    name: 'DeepSeek',
    baseUrl: 'https://api.deepseek.com/v1',
    token: '',
    model: 'deepseek-chat'
  },
  {
    id: 'moonshot',
    name: 'Moonshot',
    baseUrl: 'https://api.moonshot.cn/v1',
    token: '',
    model: 'moonshot-v1-8k'
  },
  {
    id: 'local',
    name: '本地模型',
    baseUrl: 'http://localhost:11434/v1',
    token: 'ollama',
    model: 'qwen2.5:7b'
  }
]
```

### UI 展示
- [ ] 设置面板中区分「内置」和「自定义」Agent
- [ ] 内置 Agent 不可删除，但可复制后修改
- [ ] Prompt 模板支持变量替换（`{content}`, `{context}`, `{characters}`）
- [ ] 用户可新建自定义 Prompt 模板

---

## 📐 0.8 响应式布局设计

### 断点定义

| 断点名称 | 宽度范围 | 典型设备 |
|---------|---------|---------|
| `xs` | < 640px | 手机竖屏 |
| `sm` | 640px - 768px | 手机横屏、小平板 |
| `md` | 768px - 1024px | 平板竖屏 |
| `lg` | 1024px - 1280px | 平板横屏、小笔记本 |
| `xl` | 1280px - 1536px | 笔记本 |
| `2xl` | ≥ 1536px | 桌面显示器 |

### 各断点布局方案

#### 2xl（≥1536px）- 完整三栏
```
┌─────────────────────────────────────────────────────────────────┐
│  TopBar                                                         │
├──────────────┬────────────────────────────────┬─────────────────┤
│  Explorer    │         EditorPane             │   RightPanel    │
│  280px       │         flex: 1                │   360px         │
│              │                                │                 │
└──────────────┴────────────────────────────────┴─────────────────┘
```

#### xl（1280px - 1536px）- 标准三栏
```
┌─────────────────────────────────────────────────────────────────┐
│  TopBar                                                         │
├────────────┬──────────────────────────────────┬─────────────────┤
│  Explorer  │         EditorPane               │   RightPanel    │
│  240px     │         flex: 1                  │   320px         │
└────────────┴──────────────────────────────────┴─────────────────┘
```

#### lg（1024px - 1280px）- 紧凑三栏
```
┌─────────────────────────────────────────────────────────────────┐
│  TopBar                                                         │
├──────────┬────────────────────────────────────┬─────────────────┤
│ Explorer │         EditorPane                 │  RightPanel     │
│ 220px    │         flex: 1                    │  280px          │
│ 可折叠   │                                    │  可折叠         │
└──────────┴────────────────────────────────────┴─────────────────┘
```
- 左右面板可点击折叠为图标栏（48px）
- 折叠后悬停展开

#### md（768px - 1024px）- 双栏 + 抽屉
```
┌─────────────────────────────────────────────────────────────────┐
│  TopBar                              [☰] [AI] [⚙️]              │
├────────────┬────────────────────────────────────────────────────┤
│  Explorer  │              EditorPane                            │
│  200px     │              flex: 1                               │
│  可折叠    │                                                    │
└────────────┴────────────────────────────────────────────────────┘
```
- 右侧面板变为抽屉，点击 [AI] 按钮滑出
- 左侧面板可折叠

#### sm（640px - 768px）- 单栏 + 底部导航
```
┌─────────────────────────────────────────────────────────────────┐
│  TopBar (简化)                                    [☰]          │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│                        EditorPane                               │
│                        (全宽)                                   │
│                                                                 │
├─────────────────────────────────────────────────────────────────┤
│   [📁 章节]    [✏️ 编辑]    [🤖 AI]    [⚙️ 更多]               │  ← 底部 Tab
└─────────────────────────────────────────────────────────────────┘
```
- 底部 Tab 切换不同面板
- 章节/AI/设置 作为全屏覆盖层

#### xs（< 640px）- 极简移动端
```
┌───────────────────────────────┐
│  NovelstudioAI          [☰]  │
├───────────────────────────────┤
│                               │
│        EditorPane             │
│        (全宽全高)             │
│                               │
│                               │
├───────────────────────────────┤
│  [📁]  [✏️]  [🤖]  [⚙️]      │
└───────────────────────────────┘
```
- 极简顶栏
- 底部图标导航
- 所有面板全屏覆盖

### 关键组件响应式行为

#### Explorer（章节树）
| 断点 | 行为 |
|-----|------|
| ≥1024px | 固定显示，可手动折叠 |
| 768-1024px | 默认折叠为图标栏，悬停展开 |
| <768px | 隐藏，通过底部 Tab 或汉堡菜单访问 |

#### RightPanel（AI/版本/评论）
| 断点 | 行为 |
|-----|------|
| ≥1280px | 固定显示 |
| 1024-1280px | 固定显示，可折叠 |
| 768-1024px | 抽屉模式，按钮触发 |
| <768px | 全屏覆盖层 |

#### EditorPane（编辑区）
| 断点 | 行为 |
|-----|------|
| ≥1024px | 工具栏完整显示 |
| 768-1024px | 工具栏精简，次要操作收入下拉菜单 |
| <768px | 工具栏最小化，浮动工具按钮 |

#### SettingsModal（设置面板）
| 断点 | 行为 |
|-----|------|
| ≥768px | 居中模态框，左右分栏 |
| <768px | 全屏覆盖，顶部 Tab 切换分类 |

#### KnowledgeBaseDrawer（资料库）
| 断点 | 行为 |
|-----|------|
| ≥1024px | 右侧抽屉，宽度 50% |
| 768-1024px | 右侧抽屉，宽度 70% |
| <768px | 全屏覆盖 |

### CSS 实现要点

```css
/* 断点变量 */
:root {
  --breakpoint-xs: 640px;
  --breakpoint-sm: 768px;
  --breakpoint-md: 1024px;
  --breakpoint-lg: 1280px;
  --breakpoint-xl: 1536px;
}

/* 侧边栏宽度 */
:root {
  --sidebar-width-xl: 280px;
  --sidebar-width-lg: 240px;
  --sidebar-width-md: 220px;
  --sidebar-width-collapsed: 48px;

  --rightpanel-width-xl: 360px;
  --rightpanel-width-lg: 320px;
  --rightpanel-width-md: 280px;
}

/* 响应式网格 */
.workspace {
  display: grid;
  grid-template-columns: var(--sidebar-width-lg) 1fr var(--rightpanel-width-lg);
  gap: 16px;
}

@media (max-width: 1280px) {
  .workspace {
    grid-template-columns: var(--sidebar-width-md) 1fr var(--rightpanel-width-md);
    gap: 12px;
  }
}

@media (max-width: 1024px) {
  .workspace {
    grid-template-columns: var(--sidebar-width-collapsed) 1fr;
  }
  .right-panel {
    position: fixed;
    right: 0;
    top: 64px;
    bottom: 32px;
    width: 320px;
    transform: translateX(100%);
    transition: transform 0.3s ease;
  }
  .right-panel.open {
    transform: translateX(0);
  }
}

@media (max-width: 768px) {
  .workspace {
    grid-template-columns: 1fr;
  }
  .sidebar {
    position: fixed;
    inset: 0;
    z-index: 50;
    transform: translateX(-100%);
  }
  .sidebar.open {
    transform: translateX(0);
  }
}
```

### 防止离谱情况的保护措施

- [ ] **最小宽度限制**：`min-width: 320px`（防止过窄）
- [ ] **最大内容宽度**：编辑区 `max-width: 900px` 居中（防止过宽难阅读）
- [ ] **文字不换行溢出**：`overflow-wrap: break-word`
- [ ] **图片自适应**：`max-width: 100%`
- [ ] **弹窗不超出视口**：`max-height: 90vh; max-width: 90vw`
- [ ] **触摸目标最小尺寸**：44x44px
- [ ] **安全区域适配**：`env(safe-area-inset-*)`（刘海屏）

---

## 🏗️ 一、架构与代码组织

### 1.1 App.tsx 过于臃肿（341 行）
- [ ] **拆分业务逻辑到自定义 Hooks**
  - `useChapterEditor` - 章节编辑相关逻辑
  - `useAiActions` - AI 调用相关逻辑
  - `useVersionControl` - 版本历史相关逻辑
  - `useSync` - 同步/保存相关逻辑
- [ ] **提取常量和工具函数**到独立文件
- [ ] **使用 Context 或状态管理库**（如 Zustand/Jotai）替代层层 props 传递

### 1.2 组件职责不清晰
- [ ] **RightPanel.tsx（250 行）过于庞大**，应拆分为：
  - `AiExecutor.tsx` - AI 执行器面板
  - `BlockAiPanel.tsx` - 块级 AI 操作
  - `ChapterAiPanel.tsx` - 章节级 AI 操作
  - `VersionHistory.tsx` - 版本历史
  - `CommentSection.tsx` - 评论区
  - `NoteLibrary.tsx` - 资料库
  - `AiConsole.tsx` - AI 控制台
- [ ] **SettingsPanel.tsx（358 行）超限**，应拆分为：
  - `ProfileSettings.tsx`
  - `UiSettings.tsx`
  - `AutosaveSettings.tsx`
  - `AiSettings.tsx`
  - `ProviderConfig.tsx`
  - `AgentConfig.tsx`
  - `ExportSettings.tsx`

### 1.3 目录结构优化
```
src/
├── components/
│   ├── common/          # 通用基础组件
│   │   ├── Button/
│   │   ├── Input/
│   │   ├── Select/
│   │   ├── Modal/
│   │   └── Card/
│   ├── layout/          # 布局组件
│   │   ├── TopBar/
│   │   ├── Sidebar/
│   │   └── StatusBar/
│   ├── editor/          # 编辑器相关
│   │   ├── EditorPane/
│   │   ├── EditorToolbar/
│   │   └── ChapterMeta/
│   ├── explorer/        # 资源管理器
│   │   ├── Explorer/
│   │   ├── VolumeTree/
│   │   └── ChapterItem/
│   ├── panels/          # 右侧面板
│   │   ├── RightPanel/
│   │   ├── AiPanel/
│   │   ├── VersionPanel/
│   │   ├── CommentPanel/
│   │   └── NotePanel/
│   └── settings/        # 设置相关
├── hooks/               # 自定义 Hooks
├── stores/              # 状态管理
├── styles/              # 全局样式
│   ├── variables.css
│   ├── reset.css
│   └── themes/
├── utils/               # 工具函数
└── types/               # 类型定义
```

---

## 🎨 二、样式与设计系统

### 2.1 建立设计 Token 系统
- [ ] **统一 CSS 变量命名规范**
  ```css
  /* 间距 */
  --space-xs: 4px;
  --space-sm: 8px;
  --space-md: 16px;
  --space-lg: 24px;
  --space-xl: 32px;
  
  /* 圆角 */
  --radius-sm: 6px;
  --radius-md: 10px;
  --radius-lg: 14px;
  --radius-full: 999px;
  
  /* 阴影 */
  --shadow-sm: ...;
  --shadow-md: ...;
  --shadow-lg: ...;
  
  /* 字体大小 */
  --text-xs: 11px;
  --text-sm: 12px;
  --text-base: 14px;
  --text-lg: 16px;
  --text-xl: 18px;
  ```

### 2.2 消除硬编码颜色值
- [ ] **当前问题**：多处使用硬编码颜色如 `#f5a623`、`#e4d5c3`、`#7a4a21`
- [ ] **解决方案**：全部提取为 CSS 变量，支持主题切换
  ```css
  --color-status-draft: #f5a623;
  --color-status-review: #5c9ded;
  --color-status-done: #61c554;
  --color-border-input: var(--panel-border);
  ```

### 2.3 采用 CSS Modules 或 CSS-in-JS
- [ ] 当前每个组件都有独立 `.css` 文件，容易产生样式冲突
- [ ] 建议迁移到 **CSS Modules**（`.module.css`）或使用 **Tailwind CSS**

---

## 🧩 三、通用组件抽象

### 3.1 按钮组件统一
- [ ] 当前有 `primary-button`、`ghost-button`、`mini-button`、`action-button` 四种样式分散定义
- [ ] 创建统一的 `Button` 组件：
  ```tsx
  <Button variant="primary | ghost | mini | action" size="sm | md | lg" />
  ```

### 3.2 表单控件统一
- [ ] 提取通用 `Input`、`Select`、`Textarea` 组件
- [ ] 添加统一的 label、error、help text 支持

### 3.3 面板/卡片组件
- [ ] 创建 `Panel` 组件统一面板样式
- [ ] 创建 `Card` 组件统一卡片样式
- [ ] 创建 `SectionTitle` 组件统一标题样式

### 3.4 空状态组件
- [ ] 当前 `empty-state` 散落各处
- [ ] 创建 `EmptyState` 组件，支持自定义图标和文案

---

## ⚡ 四、性能优化

### 4.1 减少不必要的重渲染
- [ ] **使用 `React.memo`** 包装纯展示组件
- [ ] **使用 `useCallback`** 缓存事件处理函数
- [ ] **拆分大组件**，避免局部状态变化导致全局重渲染

### 4.2 懒加载优化
- [ ] **设置面板**使用 `React.lazy` 动态加载
- [ ] **预览模态框**使用 `React.lazy` 动态加载
- [ ] 使用 `Suspense` 提供加载状态

### 4.3 虚拟列表
- [ ] 章节列表数量较多时，使用虚拟滚动（如 `react-window`）
- [ ] 评论、版本历史列表同理

---

## 🔧 五、代码质量提升

### 5.1 消除 window.prompt
- [ ] 当前重命名卷/章节使用 `window.prompt`，体验差
- [ ] 替换为自定义 Modal 组件

### 5.2 错误边界
- [ ] 添加 `ErrorBoundary` 组件捕获渲染错误
- [ ] 对 AI 调用、API 请求添加 try-catch 和用户友好提示

### 5.3 无障碍访问（A11y）
- [ ] 添加 `aria-label` 到图标按钮
- [ ] 确保所有交互元素可键盘访问
- [ ] 添加适当的 `role` 属性

### 5.4 类型安全
- [ ] 避免使用 `any` 和类型断言
- [ ] 为事件处理函数添加正确的类型
- [ ] 使用 `satisfies` 操作符确保类型安全

---

## 📱 六、响应式与移动端适配

### 6.1 当前断点设计不完善
- [ ] 1200px 以下隐藏右侧面板，但无法访问 AI 功能
- [ ] 900px 以下三栏变一栏，交互不友好
- [ ] 建议添加侧滑抽屉或 Tab 切换方案

### 6.2 移动端触摸优化
- [ ] 增大点击目标尺寸（最小 44x44px）
- [ ] 拖拽排序需支持触摸事件
- [ ] 下拉菜单替换为底部弹出选择器

---

## 🎯 七、UX 交互改进

### 7.1 反馈机制
- [ ] AI 操作添加 loading 状态和进度条
- [ ] 保存成功/失败添加 Toast 提示
- [ ] 按钮点击添加 disabled 状态防止重复提交

### 7.2 确认对话框
- [ ] 删除卷/章节添加二次确认
- [ ] 版本回滚添加确认提示
- [ ] 危险操作使用红色警示

### 7.3 快捷键支持
- [ ] `Ctrl+S` 手动保存
- [ ] `Ctrl+/` 打开 AI 面板
- [ ] `Ctrl+Shift+V` 创建版本快照

### 7.4 拖拽体验优化
- [ ] 拖拽时显示占位符
- [ ] 添加拖拽预览效果
- [ ] 禁止跨卷拖拽（或明确支持跨卷移动）

---

## 🧪 八、测试覆盖

### 8.1 单元测试
- [ ] 为所有工具函数添加单元测试
- [ ] 为自定义 Hooks 添加测试
- [ ] 达到 80%+ 覆盖率

### 8.2 组件测试
- [ ] 使用 React Testing Library 测试组件行为
- [ ] 模拟用户交互流程
- [ ] 测试边界条件（空状态、错误状态）

### 8.3 E2E 测试补充
- [ ] 覆盖主要用户流程
- [ ] 添加视觉回归测试

---

## 📦 九、优先级建议（更新版）

| 优先级 | 任务 | 预估工作量 |
|--------|------|-----------|
| **P0** | **macOS 风格设计系统 + 深色模式** | 2 天 |
| **P0** | **响应式布局系统（6 断点适配）** | 2 天 |
| **P0** | **右键菜单组件（替代按钮操作）** | 1 天 |
| **P0** | **设置面板重构（左侧导航 + 分组）** | 2 天 |
| **P0** | **右侧面板重构（折叠式 + 毛玻璃）** | 1.5 天 |
| **P0** | **资料库独立模块（抽屉式知识库）** | 3 天 |
| **P0** | **内置 Agent/Prompt 预设** | 1 天 |
| P1 | 拆分 App.tsx 和 RightPanel.tsx | 2 天 |
| P1 | 提取通用组件（Button/Input/Card） | 1 天 |
| P1 | 添加状态管理（Zustand） | 1.5 天 |
| P2 | 迁移到 CSS Modules | 1 天 |
| P2 | 添加 loading/toast 反馈 | 1 天 |
| P3 | 快捷键支持 | 0.5 天 |
| P3 | 虚拟列表优化 | 1 天 |

---

## 🎨 十、macOS 风格视觉规范

### 10.1 颜色系统
```css
/* 浅色模式 */
:root {
  /* 背景层次 */
  --bg-canvas: #f5f5f7;
  --bg-primary: rgba(255, 255, 255, 0.72);
  --bg-secondary: rgba(255, 255, 255, 0.5);
  --bg-tertiary: rgba(255, 255, 255, 0.3);

  /* 文字层次 */
  --text-primary: #1d1d1f;
  --text-secondary: #86868b;
  --text-tertiary: #aeaeb2;

  /* 边框 */
  --border-primary: rgba(0, 0, 0, 0.1);
  --border-secondary: rgba(0, 0, 0, 0.05);

  /* 强调色 */
  --accent: #007aff;
  --accent-hover: #0056b3;
  --destructive: #ff3b30;
}

/* 深色模式 */
html[data-theme='dark'] {
  --bg-canvas: #000000;
  --bg-primary: rgba(44, 44, 46, 0.72);
  --bg-secondary: rgba(58, 58, 60, 0.5);
  --bg-tertiary: rgba(72, 72, 74, 0.3);

  --text-primary: #f5f5f7;
  --text-secondary: #a1a1a6;
  --text-tertiary: #636366;

  --border-primary: rgba(255, 255, 255, 0.1);
  --border-secondary: rgba(255, 255, 255, 0.05);

  --accent: #0a84ff;
  --accent-hover: #409cff;
  --destructive: #ff453a;
}
```

### 10.2 毛玻璃效果
```css
.glass-panel {
  background: var(--bg-primary);
  backdrop-filter: blur(20px) saturate(180%);
  -webkit-backdrop-filter: blur(20px) saturate(180%);
  border: 1px solid var(--border-primary);
  border-radius: 12px;
  box-shadow:
    0 0 0 0.5px rgba(0, 0, 0, 0.05),
    0 2px 8px rgba(0, 0, 0, 0.08),
    0 8px 24px rgba(0, 0, 0, 0.06);
}
```

### 10.3 动效规范
```css
/* 标准过渡 */
--transition-fast: 150ms cubic-bezier(0.4, 0, 0.2, 1);
--transition-normal: 250ms cubic-bezier(0.4, 0, 0.2, 1);
--transition-slow: 350ms cubic-bezier(0.4, 0, 0.2, 1);

/* 弹性动画 */
--transition-bounce: 500ms cubic-bezier(0.34, 1.56, 0.64, 1);

/* 菜单弹出 */
@keyframes menu-in {
  from {
    opacity: 0;
    transform: scale(0.95);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}
```

### 10.4 图标系统
- [ ] 使用 **Lucide Icons**（与 macOS SF Symbols 风格接近）
- [ ] 图标尺寸：16px（小）/ 20px（中）/ 24px（大）
- [ ] 线宽统一：1.5px
- [ ] 图标颜色跟随文字颜色

### 10.5 间距系统
```css
--space-1: 4px;
--space-2: 8px;
--space-3: 12px;
--space-4: 16px;
--space-5: 20px;
--space-6: 24px;
--space-8: 32px;
--space-10: 40px;
```

### 10.6 圆角系统
```css
--radius-sm: 6px;
--radius-md: 10px;
--radius-lg: 14px;
--radius-xl: 20px;
--radius-full: 9999px;
```

---

## 🚀 十一、实施路线图

### 第一阶段：设计系统基础（4天）
1. 建立 CSS 变量系统（颜色/间距/圆角/动效）
2. 实现深色模式完整支持
3. 实现响应式布局系统（6 断点）
4. 创建基础组件：Button、Input、Select、Card、Panel、Toggle

### 第二阶段：核心交互重构（5天）
1. 实现右键菜单组件
2. 重构 Explorer 侧边栏（移除按钮，添加右键菜单，响应式折叠）
3. 重构设置面板（左侧导航 + 分组卡片，移动端全屏）
4. 重构右侧面板（折叠式 Accordion，移动端抽屉/覆盖层）

### 第三阶段：资料库 + AI 预设（4天）
1. 资料库抽屉组件
2. 分类树形结构 + 卡片详情编辑器
3. 搜索与筛选 + 编辑器联动
4. 内置 Agent/Prompt 预设
5. Provider 默认配置

### 第四阶段：细节打磨（3天）
1. 添加毛玻璃效果
2. 完善动效过渡
3. 引入图标系统（Lucide）
4. 移动端触摸优化

### 第五阶段：代码优化（2天）
1. 拆分大组件
2. 添加状态管理（Zustand）
3. 性能优化

---

## 📐 十二、整体布局规划

### 新布局结构
```
┌─────────────────────────────────────────────────────────────────────┐
│  🟠 NovelstudioAI          [📚 资料库]  [⚙️]  [🌙]    作者：xxx    │  ← TopBar
├───────────────┬─────────────────────────────────────┬───────────────┤
│               │                                     │               │
│   Explorer    │           EditorPane                │  RightPanel   │
│   (章节树)    │           (编辑区)                  │  (AI/版本/评论)│
│               │                                     │               │
│   右键菜单    │                                     │  折叠式面板   │
│   操作卷/章节 │                                     │               │
│               │                                     │               │
├───────────────┴─────────────────────────────────────┴───────────────┤
│  光标块: paragraph  │  章节: 第一章  │  AI: 写作助手  │  在线同步   │  ← StatusBar
└─────────────────────────────────────────────────────────────────────┘

点击「资料库」→ 右侧滑出抽屉覆盖 RightPanel
点击「设置」→ 居中弹出模态框
```

### 组件层级
```
App
├── TopBar
│   ├── Brand
│   ├── KnowledgeBaseButton  ← 新增
│   ├── SettingsButton
│   ├── ThemeToggle          ← 新增（深色模式切换）
│   └── AuthorPill
├── Workspace
│   ├── Explorer
│   │   ├── VolumeTree
│   │   └── ChapterItem
│   ├── EditorPane
│   │   ├── EditorToolbar
│   │   └── BlockNoteEditor
│   └── RightPanel
│       ├── AiPanel (Accordion)
│       ├── VersionPanel (Accordion)
│       ├── CommentPanel (Accordion)
│       └── LogPanel (Accordion)
├── StatusBar
├── SettingsModal            ← 重构
├── KnowledgeBaseDrawer      ← 新增
│   ├── CategoryNav
│   ├── CardList
│   └── CardDetail
└── ContextMenu              ← 新增
```

---

> **设计理念**：追求 macOS 的精致感和一致性，同时保持写作工具的专注与沉浸。资料库作为独立知识管理模块，随时可调出参考，不干扰主编辑流程。深色模式不是简单的颜色反转，而是完整的视觉体验重塑。

