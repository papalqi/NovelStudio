# 回归用例追踪表

来源矩阵：`docs/RegressionCoverageMatrix.md`

| ID | 控件/触发 | 对应用例 | 覆盖状态 | 风险等级 | 备注 |
| --- | --- | --- | --- | --- | --- |
| TB-01 | 资料库按钮 | e2e/app.spec.ts | 已覆盖 | 低 |  |
| TB-02 | 预览按钮 | e2e/app.spec.ts; e2e/coverage.spec.ts | 已覆盖 | 低 |  |
| TB-03 | 主题切换按钮 | e2e/app.spec.ts; e2e/coverage.spec.ts | 已覆盖 | 低 |  |
| TB-04 | 设置按钮 | e2e/app.spec.ts; e2e/coverage.spec.ts | 已覆盖 | 低 |  |
| TB-05 | 手动同步按钮（autosave 关闭时） | e2e/app.spec.ts; e2e/coverage.spec.ts | 已覆盖 | 低 |  |
| EX-01 | + 新卷 | e2e/coverage.spec.ts | 已覆盖 | 低 |  |
| EX-02 | 搜索输入 | e2e/coverage.spec.ts | 已覆盖 | 低 |  |
| EX-03 | 状态筛选下拉 | e2e/coverage.spec.ts | 已覆盖 | 低 |  |
| EX-04 | 点击卷标题 | e2e/coverage.spec.ts | 已覆盖 | 低 |  |
| EX-05 | 右键卷 -> 新建章节 | e2e/coverage.spec.ts | 已覆盖 | 低 |  |
| EX-06 | 右键卷 -> 上移 | e2e/coverage.spec.ts | 已覆盖 | 低 |  |
| EX-07 | 右键卷 -> 下移 | e2e/coverage.spec.ts | 已覆盖 | 低 |  |
| EX-08 | 右键卷 -> 重命名 | e2e/coverage.spec.ts | 已覆盖 | 低 |  |
| EX-09 | 重命名输入 | e2e/coverage.spec.ts | 已覆盖 | 低 |  |
| EX-10 | 重命名弹窗确认 | e2e/coverage.spec.ts | 已覆盖 | 低 |  |
| EX-11 | 重命名弹窗取消 | e2e/coverage.spec.ts | 已覆盖 | 低 |  |
| EX-12 | 右键卷 -> 删除 | e2e/coverage.spec.ts | 已覆盖 | 低 |  |
| EX-13 | 点击章节条目 | e2e/coverage.spec.ts | 已覆盖 | 低 |  |
| EX-14 | 右键章节 -> 重命名 | e2e/coverage.spec.ts | 已覆盖 | 低 |  |
| EX-15 | 章节重命名输入 | e2e/coverage.spec.ts | 已覆盖 | 低 |  |
| EX-16 | 章节重命名确认 | e2e/coverage.spec.ts | 已覆盖 | 低 |  |
| EX-17 | 章节重命名取消 | e2e/coverage.spec.ts | 已覆盖 | 低 |  |
| EX-18 | 右键章节 -> 删除 | e2e/coverage.spec.ts | 已覆盖 | 低 |  |
| EX-19 | 拖拽章节排序 | e2e/coverage.spec.ts | 已覆盖 | 低 |  |
| EX-20 | 点击章节（键盘 Enter/Space） | e2e/coverage.spec.ts | 已覆盖 | 低 |  |
| EX-21 | 章节复选框 | e2e/new-features.spec.ts | 已覆盖 | 低 |  |
| EX-22 | 批量复制按钮 | e2e/new-features.spec.ts | 已覆盖 | 低 |  |
| EX-23 | 批量移动按钮 | e2e/new-features.spec.ts | 已覆盖 | 低 |  |
| EX-24 | 批量合并按钮 | e2e/new-features.spec.ts | 已覆盖 | 低 |  |
| ED-01 | 章节标题输入 | e2e/coverage.spec.ts | 已覆盖 | 低 |  |
| ED-02 | 状态下拉选择 | e2e/coverage.spec.ts | 已覆盖 | 低 |  |
| ED-03 | 标签输入 | e2e/coverage.spec.ts | 已覆盖 | 低 |  |
| ED-04 | 目标字数输入 | e2e/coverage.spec.ts | 已覆盖 | 低 |  |
| ED-05 | 保存版本按钮 | e2e/coverage.spec.ts | 已覆盖 | 低 |  |
| ED-06 | 编辑器正文输入 | e2e/coverage.spec.ts | 已覆盖 | 低 |  |
| ED-07 | 版本对比视图 | e2e/new-features.spec.ts | 已覆盖 | 低 |  |
| ED-08 | 版本对比退出 | e2e/new-features.spec.ts | 已覆盖 | 低 |  |
| RP-01 | Provider 选择 | e2e/app.spec.ts; e2e/coverage.spec.ts | 已覆盖 | 低 |  |
| RP-02 | Agent 选择 | e2e/app.spec.ts; e2e/coverage.spec.ts | 已覆盖 | 低 |  |
| RP-03 | 块级 AI: 改写 | e2e/app.spec.ts; e2e/coverage.spec.ts | 已覆盖 | 中 | AI 调用依赖外部服务/Mock |
| RP-04 | 块级 AI: 扩写 | e2e/app.spec.ts; e2e/coverage.spec.ts | 已覆盖 | 中 | AI 调用依赖外部服务/Mock |
| RP-05 | 块级 AI: 缩写 | e2e/app.spec.ts; e2e/coverage.spec.ts | 已覆盖 | 中 | AI 调用依赖外部服务/Mock |
| RP-06 | 块级 AI: 续写 | e2e/app.spec.ts; e2e/coverage.spec.ts | 已覆盖 | 中 | AI 调用依赖外部服务/Mock |
| RP-07 | 章节 AI: 章节大纲 | e2e/app.spec.ts; e2e/coverage.spec.ts | 已覆盖 | 中 | AI 调用依赖外部服务/Mock |
| RP-08 | 章节 AI: 连贯性检查 | e2e/app.spec.ts; e2e/coverage.spec.ts | 已覆盖 | 中 | AI 调用依赖外部服务/Mock |
| RP-09 | 章节 AI: 角色一致性 | e2e/app.spec.ts; e2e/coverage.spec.ts | 已覆盖 | 中 | AI 调用依赖外部服务/Mock |
| RP-10 | 章节 AI: 风格润色 | e2e/app.spec.ts; e2e/coverage.spec.ts | 已覆盖 | 低 |  |
| RP-11 | 章节 AI: 设定扩展 | e2e/app.spec.ts; e2e/coverage.spec.ts | 已覆盖 | 低 |  |
| RP-12 | 版本历史刷新 | e2e/app.spec.ts; e2e/coverage.spec.ts | 已覆盖 | 低 |  |
| RP-13 | 版本回滚按钮 | e2e/app.spec.ts; e2e/coverage.spec.ts | 已覆盖 | 低 |  |
| RP-14 | 评论输入框 | e2e/app.spec.ts; e2e/coverage.spec.ts | 已覆盖 | 低 |  |
| RP-15 | 发送评论 | e2e/app.spec.ts; e2e/coverage.spec.ts | 已覆盖 | 低 |  |
| RP-16 | Accordion: AI 执行器 | e2e/app.spec.ts; e2e/coverage.spec.ts | 已覆盖 | 低 |  |
| RP-17 | Accordion: 版本历史 | e2e/app.spec.ts; e2e/coverage.spec.ts | 已覆盖 | 低 |  |
| RP-18 | Accordion: 评论协作 | e2e/app.spec.ts; e2e/coverage.spec.ts | 已覆盖 | 低 |  |
| RP-19 | Accordion: AI 控制台 | e2e/app.spec.ts; e2e/coverage.spec.ts | 已覆盖 | 低 |  |
| RP-20 | 版本对比按钮 | e2e/new-features.spec.ts | 已覆盖 | 低 |  |
| RP-21 | 运行记录重放按钮 | e2e/new-features.spec.ts | 已覆盖 | 中 |  |
| RP-22 | AI 请求重试 | e2e/new-features.spec.ts | 已覆盖 | 中 |  |
| KB-01 | 返回编辑按钮 | e2e/new-features.spec.ts | 已覆盖 | 低 |  |
| KB-02 | 分类 Tab 切换 | e2e/new-features.spec.ts | 已覆盖 | 低 |  |
| KB-03 | 搜索输入 | e2e/new-features.spec.ts | 已覆盖 | 低 |  |
| KB-04 | 新条目标题输入 | e2e/app.spec.ts | 已覆盖 | 低 |  |
| KB-05 | 新建按钮 | e2e/app.spec.ts | 已覆盖 | 低 |  |
| KB-06 | 条目编辑按钮 | e2e/new-features.spec.ts | 已覆盖 | 低 |  |
| KB-07 | 条目删除按钮 | e2e/coverage.spec.ts | 已覆盖 | 低 |  |
| KB-08 | 编辑标题输入 | e2e/coverage.spec.ts | 已覆盖 | 低 |  |
| KB-09 | 编辑描述输入 | e2e/new-features.spec.ts | 已覆盖 | 低 |  |
| KB-10 | 编辑取消 | e2e/new-features.spec.ts | 已覆盖 | 低 |  |
| KB-11 | 编辑保存 | e2e/new-features.spec.ts | 已覆盖 | 低 |  |
| KB-12 | 插入引用按钮 | e2e/new-features.spec.ts | 已覆盖 | 低 |  |
| KB-13 | 刷新引用按钮 | e2e/new-features.spec.ts | 已覆盖 | 低 |  |
| ST-01 | 返回按钮 | e2e/app.spec.ts; e2e/coverage.spec.ts | 已覆盖 | 低 |  |
| ST-02 | 保存设置按钮 | e2e/app.spec.ts; e2e/coverage.spec.ts | 已覆盖 | 低 |  |
| ST-03 | 导航：个人资料 | e2e/app.spec.ts; e2e/coverage.spec.ts | 已覆盖 | 低 |  |
| ST-04 | 导航：外观 | e2e/app.spec.ts; e2e/coverage.spec.ts | 已覆盖 | 低 |  |
| ST-05 | 导航：Provider 配置 | e2e/app.spec.ts; e2e/coverage.spec.ts | 已覆盖 | 低 |  |
| ST-06 | 导航：Agent 配置 | e2e/app.spec.ts; e2e/coverage.spec.ts | 已覆盖 | 低 |  |
| ST-07 | 导航：AI 默认参数 | e2e/app.spec.ts; e2e/coverage.spec.ts | 已覆盖 | 低 |  |
| ST-08 | 导航：同步 | e2e/app.spec.ts; e2e/coverage.spec.ts | 已覆盖 | 低 |  |
| ST-09 | 导航：自动保存 | e2e/app.spec.ts; e2e/coverage.spec.ts | 已覆盖 | 低 |  |
| ST-10 | 导航：导出 | e2e/app.spec.ts; e2e/coverage.spec.ts | 已覆盖 | 低 |  |
| ST-11 | 作者名称输入 | e2e/app.spec.ts; e2e/coverage.spec.ts | 已覆盖 | 低 |  |
| ST-12 | 主题选择 | e2e/app.spec.ts; e2e/coverage.spec.ts | 已覆盖 | 低 |  |
| ST-13 | 字体输入 | e2e/app.spec.ts; e2e/coverage.spec.ts | 已覆盖 | 低 |  |
| ST-14 | 编辑区宽度选择 | e2e/app.spec.ts; e2e/coverage.spec.ts | 已覆盖 | 低 |  |
| ST-15 | Provider 名称输入 | e2e/app.spec.ts; e2e/coverage.spec.ts | 已覆盖 | 低 |  |
| ST-16 | Provider 删除按钮 | e2e/app.spec.ts; e2e/coverage.spec.ts | 已覆盖 | 低 |  |
| ST-17 | Provider API 地址输入 | e2e/app.spec.ts; e2e/coverage.spec.ts | 已覆盖 | 低 |  |
| ST-18 | Provider Token 输入 | e2e/app.spec.ts; e2e/coverage.spec.ts | 已覆盖 | 低 |  |
| ST-19 | Provider 模型输入 | e2e/app.spec.ts; e2e/coverage.spec.ts | 已覆盖 | 低 |  |
| ST-20 | 添加 Provider 按钮 | e2e/app.spec.ts; e2e/coverage.spec.ts | 已覆盖 | 低 |  |
| ST-21 | Agent 名称输入 | e2e/app.spec.ts; e2e/coverage.spec.ts | 已覆盖 | 低 |  |
| ST-22 | Agent 删除按钮 | e2e/app.spec.ts; e2e/coverage.spec.ts | 已覆盖 | 低 |  |
| ST-23 | Agent Provider 选择 | e2e/app.spec.ts; e2e/coverage.spec.ts | 已覆盖 | 低 |  |
| ST-24 | Agent System Prompt 输入 | e2e/app.spec.ts; e2e/coverage.spec.ts | 已覆盖 | 低 |  |
| ST-25 | 添加 Agent 按钮 | e2e/app.spec.ts; e2e/coverage.spec.ts | 已覆盖 | 低 |  |
| ST-26 | Temperature 输入 | e2e/app.spec.ts; e2e/coverage.spec.ts | 已覆盖 | 低 |  |
| ST-27 | Max Tokens 输入 | e2e/app.spec.ts; e2e/coverage.spec.ts | 已覆盖 | 低 |  |
| ST-28 | 默认 Provider 选择 | e2e/app.spec.ts; e2e/coverage.spec.ts | 已覆盖 | 低 |  |
| ST-29 | 默认 Agent 选择 | e2e/app.spec.ts; e2e/coverage.spec.ts | 已覆盖 | 低 |  |
| ST-30 | API 基地址输入 | e2e/app.spec.ts; e2e/coverage.spec.ts | 已覆盖 | 低 |  |
| ST-31 | 自动保存开关 | e2e/app.spec.ts; e2e/coverage.spec.ts | 已覆盖 | 低 |  |
| ST-32 | 自动保存间隔输入 | e2e/app.spec.ts; e2e/coverage.spec.ts | 已覆盖 | 低 |  |
| ST-33 | 导出格式选择 | e2e/app.spec.ts; e2e/coverage.spec.ts | 已覆盖 | 低 |  |
| ST-34 | Agent 串行开关 | e2e/app.spec.ts | 已覆盖 | 低 |  |
| ST-35 | Agent 串行顺序输入 | e2e/app.spec.ts | 已覆盖 | 低 |  |
| ST-36 | Agent 输出 Schema 输入 | e2e/app.spec.ts | 已覆盖 | 低 |  |
| ST-37 | 请求超时输入 | e2e/app.spec.ts | 已覆盖 | 低 |  |
| ST-38 | 最大重试次数输入 | e2e/app.spec.ts | 已覆盖 | 低 |  |
| ST-39 | 重试间隔输入 | e2e/app.spec.ts | 已覆盖 | 低 |  |
| ST-40 | 最大并发输入 | e2e/app.spec.ts | 已覆盖 | 低 |  |
| ST-41 | 每分钟上限输入 | e2e/app.spec.ts | 已覆盖 | 低 |  |
| PV-01 | HTML Tab | e2e/coverage.spec.ts | 已覆盖 | 低 |  |
| PV-02 | Markdown Tab | e2e/coverage.spec.ts | 已覆盖 | 低 |  |
| PV-03 | 下载按钮 | e2e/coverage.spec.ts | 已覆盖 | 中 | 下载依赖浏览器行为 |
| PV-04 | 关闭按钮 | e2e/coverage.spec.ts | 已覆盖 | 低 |  |
| PV-05 | 点击遮罩关闭 | e2e/coverage.spec.ts | 已覆盖 | 低 |  |
| PV-06 | ESC 关闭 | e2e/coverage.spec.ts | 已覆盖 | 低 |  |
| PV-07 | TXT Tab | e2e/new-features.spec.ts | 已覆盖 | 低 |  |
| PV-08 | TXT 下载按钮 | e2e/new-features.spec.ts | 已覆盖 | 低 |  |
| CF-01 | 冲突提示弹窗 | e2e/new-features.spec.ts | 已覆盖 | 中 |  |
| CM-01 | ContextMenu 项点击 | e2e/coverage.spec.ts | 已覆盖 | 低 |  |
| CM-02 | ContextMenu 点击外部 | e2e/coverage.spec.ts | 已覆盖 | 低 |  |
| CM-03 | ContextMenu ESC | e2e/coverage.spec.ts | 已覆盖 | 低 |  |
| MD-01 | Modal 关闭按钮 | e2e/coverage.spec.ts | 已覆盖 | 低 |  |
| MD-02 | Modal 点击遮罩 | e2e/coverage.spec.ts | 已覆盖 | 低 |  |
| AC-01 | Accordion 标题按钮 | e2e/coverage.spec.ts | 已覆盖 | 低 |  |
| SL-01 | Select 打开/选项 | e2e/coverage.spec.ts | 已覆盖 | 低 |  |
| TG-01 | Toggle 切换 | e2e/coverage.spec.ts | 已覆盖 | 低 |  |
