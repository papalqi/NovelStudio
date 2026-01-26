# 回归测试覆盖矩阵（真实点击）

关联计划：`plan/2026-01-26_15-18-26-strict-regression-real-clicks.md`

说明：本矩阵用于“每一个按钮/每一个功能”的真实点击回归，包含 UI 反馈 + 接口/持久化反馈。每条均需要在 E2E 中通过真实点击完成验证，且刷新后仍能观察到持久化结果（如适用）。

字段说明：
- ID：矩阵标识
- 控件/触发：按钮/输入/菜单/交互
- 期望 UI 反馈：界面变化或可见状态
- 期望接口/持久化：对应 API/数据变化（如适用）

## 顶部栏 TopBar (`apps/web/src/app/components/TopBar.tsx`)
| ID | 控件/触发 | 期望 UI 反馈 | 期望接口/持久化 | 覆盖用例 |
| --- | --- | --- | --- | --- |
| TB-01 | 资料库按钮 | 资料库页面打开 | `/api/notes` 列表可见且刷新后仍存在 | e2e/app.spec.ts |
| TB-02 | 预览按钮 | 预览弹窗打开 | 使用当前章节内容渲染 | e2e/app.spec.ts; e2e/coverage.spec.ts |
| TB-03 | 主题切换按钮 | `data-theme` 在 light/dark 间切换 | `/api/settings` 持久化主题配置 | e2e/app.spec.ts; e2e/coverage.spec.ts |
| TB-04 | 设置按钮 | 设置页面打开 | `/api/settings` 被加载并可保存 | e2e/app.spec.ts; e2e/coverage.spec.ts |
| TB-05 | 手动同步按钮（autosave 关闭时） | 显示同步完成/状态变化 | `/api/settings` 或同步逻辑被触发（如实现） | e2e/app.spec.ts; e2e/coverage.spec.ts |

## 资源管理器 Explorer (`apps/web/src/app/components/Explorer.tsx`)
| ID | 控件/触发 | 期望 UI 反馈 | 期望接口/持久化 | 覆盖用例 |
| --- | --- | --- | --- | --- |
| EX-01 | + 新卷 | 新卷显示在卷列表 | `/api/volumes` 新增且刷新后仍存在 | e2e/coverage.spec.ts |
| EX-02 | 搜索输入 | 列表筛选变化 | 不涉及持久化 | e2e/coverage.spec.ts |
| EX-03 | 状态筛选下拉 | 列表筛选变化 | 不涉及持久化 | e2e/coverage.spec.ts |
| EX-04 | 点击卷标题 | 当前卷高亮/激活 | 激活状态可用于章节创建 | e2e/coverage.spec.ts |
| EX-05 | 右键卷 -> 新建章节 | 章节出现在卷下 | `/api/chapters` 新增且刷新后仍存在 | e2e/coverage.spec.ts |
| EX-06 | 右键卷 -> 上移 | 卷顺序变化 | `/api/volumes/:id` orderIndex 持久化 | e2e/coverage.spec.ts |
| EX-07 | 右键卷 -> 下移 | 卷顺序变化 | `/api/volumes/:id` orderIndex 持久化 | e2e/coverage.spec.ts |
| EX-08 | 右键卷 -> 重命名 | 弹出重命名弹窗 | 不涉及持久化 | e2e/coverage.spec.ts |
| EX-09 | 重命名输入 | 输入框内容变化 | 无持久化 | e2e/coverage.spec.ts |
| EX-10 | 重命名弹窗确认 | 卷名称更新 | `/api/volumes/:id` title 持久化 | e2e/coverage.spec.ts |
| EX-11 | 重命名弹窗取消 | 弹窗关闭 | 无持久化 | e2e/coverage.spec.ts |
| EX-12 | 右键卷 -> 删除 | 卷消失 | `/api/volumes/:id` 删除且刷新后仍不存在 | e2e/coverage.spec.ts |
| EX-13 | 点击章节条目 | 章节激活并加载 | `/api/chapters/:id` 加载内容 | e2e/coverage.spec.ts |
| EX-14 | 右键章节 -> 重命名 | 弹出重命名弹窗 | 无持久化 | e2e/coverage.spec.ts |
| EX-15 | 章节重命名输入 | 输入框内容变化 | 无持久化 | e2e/coverage.spec.ts |
| EX-16 | 章节重命名确认 | 章节名更新 | `/api/chapters/:id` title 持久化 | e2e/coverage.spec.ts |
| EX-17 | 章节重命名取消 | 弹窗关闭 | 无持久化 | e2e/coverage.spec.ts |
| EX-18 | 右键章节 -> 删除 | 章节消失 | `/api/chapters/:id` 删除且刷新后仍不存在 | e2e/coverage.spec.ts |
| EX-19 | 拖拽章节排序 | 顺序变化 | `/api/chapters/:id` orderIndex 持久化 | e2e/coverage.spec.ts |
| EX-20 | 点击章节（键盘 Enter/Space） | 可用键盘激活 | 行为与点击一致 | e2e/coverage.spec.ts |
| EX-21 | 章节复选框 | 批量操作面板出现 | 无持久化 | e2e/new-features.spec.ts |
| EX-22 | 批量复制按钮 | 新章节出现在目标卷 | `/api/chapters` 新增 | e2e/new-features.spec.ts |
| EX-23 | 批量移动按钮 | 章节出现在目标卷 | `/api/chapters/:id` 更新 | e2e/new-features.spec.ts |
| EX-24 | 批量合并按钮 | 合并章节生成且源章节删除 | `/api/chapters` 新增 + 删除 | e2e/new-features.spec.ts |

## 编辑器 EditorPane (`apps/web/src/app/components/EditorPane.tsx`)
| ID | 控件/触发 | 期望 UI 反馈 | 期望接口/持久化 | 覆盖用例 |
| --- | --- | --- | --- | --- |
| ED-01 | 章节标题输入 | 标题更新 | `/api/chapters/:id` title 持久化 | e2e/coverage.spec.ts |
| ED-02 | 状态下拉选择 | 状态显示更新 | `/api/chapters/:id` status 持久化 | e2e/coverage.spec.ts |
| ED-03 | 标签输入 | 标签显示更新 | `/api/chapters/:id` tags 持久化 | e2e/coverage.spec.ts |
| ED-04 | 目标字数输入 | 目标字数/进度条更新 | `/api/chapters/:id` targetWordCount 持久化 | e2e/coverage.spec.ts |
| ED-05 | 保存版本按钮 | 版本列表新增 | `/api/chapters/:id/versions` 新增 | e2e/coverage.spec.ts |
| ED-06 | 编辑器正文输入 | 字数与内容变化 | `/api/chapters/:id/content` 持久化 | e2e/coverage.spec.ts |
| ED-07 | 版本对比视图 | Diff 视图显示 | 无持久化 | e2e/new-features.spec.ts |
| ED-08 | 版本对比退出 | 返回编辑模式 | 无持久化 | e2e/new-features.spec.ts |

## 右侧面板 RightPanel (`apps/web/src/app/components/RightPanel.tsx`)
| ID | 控件/触发 | 期望 UI 反馈 | 期望接口/持久化 | 覆盖用例 |
| --- | --- | --- | --- | --- |
| RP-01 | Provider 选择 | 当前 Provider 变化 | 影响后续 AI 调用 | e2e/app.spec.ts; e2e/coverage.spec.ts |
| RP-02 | Agent 选择 | 当前 Agent 变化 | 影响后续 AI 调用 | e2e/app.spec.ts; e2e/coverage.spec.ts |
| RP-03 | 块级 AI: 改写 | AI 日志新增 | `/api/ai/complete` 调用记录 | e2e/app.spec.ts; e2e/coverage.spec.ts |
| RP-04 | 块级 AI: 扩写 | AI 日志新增 | `/api/ai/complete` 调用记录 | e2e/app.spec.ts; e2e/coverage.spec.ts |
| RP-05 | 块级 AI: 缩写 | AI 日志新增 | `/api/ai/complete` 调用记录 | e2e/app.spec.ts; e2e/coverage.spec.ts |
| RP-06 | 块级 AI: 续写 | AI 日志新增 | `/api/ai/complete` 调用记录 | e2e/app.spec.ts; e2e/coverage.spec.ts |
| RP-07 | 章节 AI: 章节大纲 | AI 日志新增 | `/api/ai/complete` 调用记录 | e2e/app.spec.ts; e2e/coverage.spec.ts |
| RP-08 | 章节 AI: 连贯性检查 | AI 日志新增 | `/api/ai/complete` 调用记录 | e2e/app.spec.ts; e2e/coverage.spec.ts |
| RP-09 | 章节 AI: 角色一致性 | AI 日志新增 | `/api/ai/complete` 调用记录 | e2e/app.spec.ts; e2e/coverage.spec.ts |
| RP-10 | 章节 AI: 风格润色 | AI 日志新增 | `/api/ai/complete` 调用记录 | e2e/app.spec.ts; e2e/coverage.spec.ts |
| RP-11 | 章节 AI: 设定扩展 | AI 日志新增 | `/api/ai/complete` 调用记录 | e2e/app.spec.ts; e2e/coverage.spec.ts |
| RP-12 | 版本历史刷新 | 版本列表更新 | `/api/chapters/:id/versions` 拉取 | e2e/app.spec.ts; e2e/coverage.spec.ts |
| RP-13 | 版本回滚按钮 | 内容回滚 | `/api/chapters/:id/restore/:versionId` | e2e/app.spec.ts; e2e/coverage.spec.ts |
| RP-14 | 评论输入框 | 输入内容可见 | 不涉及持久化 | e2e/app.spec.ts; e2e/coverage.spec.ts |
| RP-15 | 发送评论 | 评论列表新增 | `/api/chapters/:id/comments` 新增 | e2e/app.spec.ts; e2e/coverage.spec.ts |
| RP-16 | Accordion: AI 执行器 | 折叠/展开 | 无持久化 | e2e/app.spec.ts; e2e/coverage.spec.ts |
| RP-17 | Accordion: 版本历史 | 折叠/展开 | 无持久化 | e2e/app.spec.ts; e2e/coverage.spec.ts |
| RP-18 | Accordion: 评论协作 | 折叠/展开 | 无持久化 | e2e/app.spec.ts; e2e/coverage.spec.ts |
| RP-19 | Accordion: AI 控制台 | 折叠/展开 | 无持久化 | e2e/app.spec.ts; e2e/coverage.spec.ts |
| RP-20 | 版本对比按钮 | 进入版本对比模式 | 无持久化 | e2e/new-features.spec.ts |
| RP-21 | 运行记录重放按钮 | 日志提示重放完成 | `/api/ai/complete` 调用 | e2e/new-features.spec.ts |
| RP-22 | AI 请求重试 | 失败后自动重试并成功 | `/api/ai/complete` 重试 | e2e/new-features.spec.ts |

## 资料库页面 KnowledgeBasePage (`apps/web/src/app/components/KnowledgeBasePage.tsx`)
| ID | 控件/触发 | 期望 UI 反馈 | 期望接口/持久化 | 覆盖用例 |
| --- | --- | --- | --- | --- |
| KB-01 | 返回编辑按钮 | 返回编辑页 | 无持久化 | e2e/new-features.spec.ts |
| KB-02 | 分类 Tab 切换 | 列表筛选变化 | 无持久化 | e2e/coverage.spec.ts |
| KB-03 | 搜索输入 | 列表筛选变化 | 无持久化 | e2e/coverage.spec.ts |
| KB-04 | 新条目标题输入 | 输入可见 | 无持久化 | e2e/coverage.spec.ts |
| KB-05 | 新建按钮 | 列表新增 | `/api/notes` 新增且刷新后仍存在 | e2e/app.spec.ts |
| KB-06 | 条目编辑按钮 | 编辑弹窗打开 | 无持久化 | e2e/coverage.spec.ts |
| KB-07 | 条目删除按钮 | 条目消失 | `/api/notes/:id` 删除且刷新后仍不存在 | e2e/coverage.spec.ts |
| KB-08 | 编辑标题输入 | 文本变化 | 无持久化 | e2e/coverage.spec.ts |
| KB-09 | 编辑描述输入 | 文本变化 | 无持久化 | e2e/new-features.spec.ts |
| KB-10 | 编辑取消 | 弹窗关闭且不保存 | 无持久化 | e2e/coverage.spec.ts |
| KB-11 | 编辑保存 | 条目内容更新 | `/api/notes/:id` 更新持久化 | e2e/new-features.spec.ts |
| KB-12 | 插入引用按钮 | 编辑器插入引用块 | `/api/chapters/:id/content` 持久化 | e2e/new-features.spec.ts |
| KB-13 | 刷新引用按钮 | 引用内容更新 | `/api/chapters/:id/content` 持久化 | e2e/new-features.spec.ts |

## 设置页 SettingsPage (`apps/web/src/app/components/SettingsPage.tsx`)
| ID | 控件/触发 | 期望 UI 反馈 | 期望接口/持久化 | 覆盖用例 |
| --- | --- | --- | --- | --- |
| ST-01 | 返回按钮 | 返回编辑页 | 无持久化 | e2e/app.spec.ts; e2e/coverage.spec.ts |
| ST-02 | 保存设置按钮 | 设置保存并返回 | `/api/settings` 持久化 | e2e/app.spec.ts; e2e/coverage.spec.ts |
| ST-03 | 导航：个人资料 | 内容切换 | 无持久化 | e2e/app.spec.ts; e2e/coverage.spec.ts |
| ST-04 | 导航：外观 | 内容切换 | 无持久化 | e2e/app.spec.ts; e2e/coverage.spec.ts |
| ST-05 | 导航：Provider 配置 | 内容切换 | 无持久化 | e2e/app.spec.ts; e2e/coverage.spec.ts |
| ST-06 | 导航：Agent 配置 | 内容切换 | 无持久化 | e2e/app.spec.ts; e2e/coverage.spec.ts |
| ST-07 | 导航：AI 默认参数 | 内容切换 | 无持久化 | e2e/app.spec.ts; e2e/coverage.spec.ts |
| ST-08 | 导航：同步 | 内容切换 | 无持久化 | e2e/app.spec.ts; e2e/coverage.spec.ts |
| ST-09 | 导航：自动保存 | 内容切换 | 无持久化 | e2e/app.spec.ts; e2e/coverage.spec.ts |
| ST-10 | 导航：导出 | 内容切换 | 无持久化 | e2e/app.spec.ts; e2e/coverage.spec.ts |
| ST-11 | 作者名称输入 | 文本变化 | `/api/settings` 持久化 | e2e/app.spec.ts; e2e/coverage.spec.ts |
| ST-12 | 主题选择 | 主题切换 | `/api/settings` 持久化 | e2e/app.spec.ts; e2e/coverage.spec.ts |
| ST-13 | 字体输入 | 文本变化 | `/api/settings` 持久化 | e2e/app.spec.ts; e2e/coverage.spec.ts |
| ST-14 | 编辑区宽度选择 | 布局变化 | `/api/settings` 持久化 | e2e/app.spec.ts; e2e/coverage.spec.ts |
| ST-15 | Provider 名称输入 | 文本变化 | `/api/settings` 持久化 | e2e/app.spec.ts; e2e/coverage.spec.ts |
| ST-16 | Provider 删除按钮 | 列表减少 | `/api/settings` 持久化 | e2e/app.spec.ts; e2e/coverage.spec.ts |
| ST-17 | Provider API 地址输入 | 文本变化 | `/api/settings` 持久化 | e2e/app.spec.ts; e2e/coverage.spec.ts |
| ST-18 | Provider Token 输入 | 文本变化 | `/api/settings` 持久化 | e2e/app.spec.ts; e2e/coverage.spec.ts |
| ST-19 | Provider 模型输入 | 文本变化 | `/api/settings` 持久化 | e2e/app.spec.ts; e2e/coverage.spec.ts |
| ST-20 | 添加 Provider 按钮 | 列表新增 | `/api/settings` 持久化 | e2e/app.spec.ts; e2e/coverage.spec.ts |
| ST-21 | Agent 名称输入 | 文本变化 | `/api/settings` 持久化 | e2e/app.spec.ts; e2e/coverage.spec.ts |
| ST-22 | Agent 删除按钮 | 列表减少 | `/api/settings` 持久化 | e2e/app.spec.ts; e2e/coverage.spec.ts |
| ST-23 | Agent Provider 选择 | 选项变化 | `/api/settings` 持久化 | e2e/app.spec.ts; e2e/coverage.spec.ts |
| ST-24 | Agent System Prompt 输入 | 文本变化 | `/api/settings` 持久化 | e2e/app.spec.ts; e2e/coverage.spec.ts |
| ST-25 | 添加 Agent 按钮 | 列表新增 | `/api/settings` 持久化 | e2e/app.spec.ts; e2e/coverage.spec.ts |
| ST-26 | Temperature 输入 | 数值变化 | `/api/settings` 持久化 | e2e/app.spec.ts; e2e/coverage.spec.ts |
| ST-27 | Max Tokens 输入 | 数值变化 | `/api/settings` 持久化 | e2e/app.spec.ts; e2e/coverage.spec.ts |
| ST-28 | 默认 Provider 选择 | 选项变化 | `/api/settings` 持久化 | e2e/app.spec.ts; e2e/coverage.spec.ts |
| ST-29 | 默认 Agent 选择 | 选项变化 | `/api/settings` 持久化 | e2e/app.spec.ts; e2e/coverage.spec.ts |
| ST-30 | API 基地址输入 | 文本变化 | `/api/settings` 持久化 | e2e/app.spec.ts; e2e/coverage.spec.ts |
| ST-31 | 自动保存开关 | 状态变化 | `/api/settings` 持久化 | e2e/app.spec.ts; e2e/coverage.spec.ts |
| ST-32 | 自动保存间隔输入 | 数值变化 | `/api/settings` 持久化 | e2e/app.spec.ts; e2e/coverage.spec.ts |
| ST-33 | 导出格式选择 | 选项变化 | `/api/settings` 持久化 | e2e/app.spec.ts; e2e/coverage.spec.ts |
| ST-34 | Agent 串行开关 | 串行状态变化 | `/api/settings` 持久化 | e2e/app.spec.ts |
| ST-35 | Agent 串行顺序输入 | 顺序数值变化 | `/api/settings` 持久化 | e2e/app.spec.ts |
| ST-36 | Agent 输出 Schema 输入 | Schema 文本变化 | `/api/settings` 持久化 | e2e/app.spec.ts |
| ST-37 | 请求超时输入 | 数值变化 | `/api/settings` 持久化 | e2e/app.spec.ts |
| ST-38 | 最大重试次数输入 | 数值变化 | `/api/settings` 持久化 | e2e/app.spec.ts |
| ST-39 | 重试间隔输入 | 数值变化 | `/api/settings` 持久化 | e2e/app.spec.ts |
| ST-40 | 最大并发输入 | 数值变化 | `/api/settings` 持久化 | e2e/app.spec.ts |
| ST-41 | 每分钟上限输入 | 数值变化 | `/api/settings` 持久化 | e2e/app.spec.ts |

## 预览弹窗 PreviewModal (`apps/web/src/app/components/PreviewModal.tsx`)
| ID | 控件/触发 | 期望 UI 反馈 | 期望接口/持久化 | 覆盖用例 |
| --- | --- | --- | --- | --- |
| PV-01 | HTML Tab | 内容切换到 HTML | 无持久化 | e2e/coverage.spec.ts |
| PV-02 | Markdown Tab | 内容切换到 Markdown | 无持久化 | e2e/coverage.spec.ts |
| PV-03 | 下载按钮 | 文件下载触发 | 浏览器下载行为 | e2e/coverage.spec.ts |
| PV-04 | 关闭按钮 | 弹窗关闭 | 无持久化 | e2e/coverage.spec.ts |
| PV-05 | 点击遮罩关闭 | 弹窗关闭 | 无持久化 | e2e/coverage.spec.ts |
| PV-06 | ESC 关闭 | 弹窗关闭 | 无持久化 | e2e/coverage.spec.ts |
| PV-07 | TXT Tab | 内容切换到 TXT | 无持久化 | e2e/new-features.spec.ts |
| PV-08 | TXT 下载按钮 | TXT 下载触发 | 浏览器下载行为 | e2e/new-features.spec.ts |

## 冲突提示 ConflictModal (`apps/web/src/app/components/ConflictModal.tsx`)
| ID | 控件/触发 | 期望 UI 反馈 | 期望接口/持久化 | 覆盖用例 |
| --- | --- | --- | --- | --- |
| CF-01 | 冲突提示弹窗 | 弹窗显示并可见按钮 | `/api/chapters/:id/content` 返回 409 | e2e/new-features.spec.ts |

## 通用组件交互覆盖（由各模块用例覆盖）
| ID | 控件/触发 | 期望 UI 反馈 | 期望接口/持久化 | 覆盖用例 |
| --- | --- | --- | --- | --- |
| CM-01 | ContextMenu 项点击 | 触发对应动作 | 由对应功能验证 | e2e/coverage.spec.ts |
| CM-02 | ContextMenu 点击外部 | 菜单关闭 | 无持久化 | e2e/coverage.spec.ts |
| CM-03 | ContextMenu ESC | 菜单关闭 | 无持久化 | e2e/coverage.spec.ts |
| MD-01 | Modal 关闭按钮 | 弹窗关闭 | 无持久化 | e2e/coverage.spec.ts |
| MD-02 | Modal 点击遮罩 | 弹窗关闭 | 无持久化 | e2e/coverage.spec.ts |
| AC-01 | Accordion 标题按钮 | 展开/收起 | 无持久化 | e2e/coverage.spec.ts |
| SL-01 | Select 打开/选项 | 选项变化 | 由对应功能验证 | e2e/coverage.spec.ts |
| TG-01 | Toggle 切换 | 状态变化 | 由对应功能验证 | e2e/coverage.spec.ts |
