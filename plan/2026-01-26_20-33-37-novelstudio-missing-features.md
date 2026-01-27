---
mode: plan
cwd: /root/project/NovelStudio
task: NovelStudio 功能缺口计划（Diff/批量操作/AI 请求可靠性/Agent 串行+结构化/运行记录/资料库页面+引用/TXT 导出/冲突提示）
complexity: complex
planning_method: builtin
created_at: 2026-01-26T20:33:43+08:00
---

# Plan: NovelStudio 功能缺口执行计划

🎯 任务概述
本计划覆盖版本差异对比、章节批量操作、编辑器内 AI 入口、AI 请求可靠性、Agent 串行编排与结构化输出、运行记录持久化、资料库独立页面+章节引用、TXT 导出与最小化冲突提示等缺口。已确认移除「块锁定/模板块」「Docx/排版模板」「实时协作」，以 TXT 导出与最小冲突提示替代。

📋 执行计划
1. 更新需求文档与 TODO：同步调整 `docs/Plan.md` 与 `docs/issual.md`，移除「块锁定/模板块」「Docx/排版模板」「实时协作」，新增「TXT 导出」「版本差异对比」「最小冲突提示」「资料库独立页面+章节引用」的落地项，作为后续实现的单一事实来源。
2. 统一数据与日志规范：为版本 diff、AI 请求、Agent 运行记录、冲突检测定义统一结构（request_id、duration、status、payload 摘要），抽象通用日志函数，避免各处自定义日志造成定位困难。
3. 版本历史差异对比（主页面 diff）：在主编辑区加入 diff 模式（类 VSCode Git diff 的主页面展示），选中历史版本后基于稳定文本序列化（如 Markdown/纯文本）生成行级 diff，并支持退出 diff/回到可编辑态。
4. 章节批量操作：在 `Explorer` 引入多选状态（含全选/清空/范围选），提供批量复制/移动/合并入口；合并语义为「合并到目标章节并删除源章节」，包含确认与回滚提示。
5. BlockNote 侧边菜单 AI 按钮：在块侧边菜单直接触发 AI 操作（与右侧面板一致的 action），确保交互有显式状态支撑（选中块、loading、结果写回）。
6. AI 请求可靠性：在 `runAiCompletion` 增加 timeout、自动重试、限流（并发/速率）与 429/5xx 退避策略；在统一设置面板暴露可配置项，并记录重试次数与失败原因。
7. Agent 串行编排 + JSON Schema 输出：在 Agent 配置中新增 schema 字段与校验规则，串行执行多个 Agent，若输出不符合 schema 则带校验错误重试；结果结构化解析后写入块，并在 UI 呈现每步状态。
8. Agent 运行记录与可重放：后端持久化完整请求/响应/上下文/设置，并提供查询与重放接口；RightPanel 控制台展示历史运行记录与「重放」操作，注意脱敏 token。
9. 资料库独立页面与章节引用：新增资料库页面并移除抽屉入口；提供“插入设定片段”动作，生成引用块（含 kb_id + 快照文本），允许手动刷新引用内容。
10. TXT 导出与最小冲突提示：`PreviewModal` 新增 TXT 导出（从块内容生成纯文本）；自动保存加入版本号校验，冲突时弹出最小提示（覆盖 / 另存 / 重新加载）。
11. 测试与回归：补齐单测/用例/Playwright E2E（diff 模式、批量操作、AI 重试与限流、Agent 串行+schema、运行记录重放、资料库页面与引用、TXT 导出、冲突提示）。将新功能加入回归矩阵与验收规则。

⚠️ 风险与注意事项
- Diff 依赖序列化格式一致性，需确保 BlockNote 内容转文本稳定，否则 diff 噪声过高。
- Agent 结构化输出可能出现「反复不符合 schema」的重试风暴，需要限制重试次数并记录失败原因。
- 运行记录持久化会增大存储压力，需设计保留期与清理策略。
- 冲突提示只做最小处理，跨设备同时编辑仍可能产生人工合并负担，需要明确 UX。

📎 参考
- `apps/web/src/app/components/RightPanel.tsx`
- `apps/web/src/app/components/Explorer.tsx`
- `apps/web/src/app/components/EditorPane.tsx`
- `apps/web/src/app/components/PreviewModal.tsx`
- `apps/web/src/app/components/SettingsPage.tsx`
- `apps/web/src/app/components/KnowledgeBaseDrawer.tsx`
- `apps/web/src/app/App.tsx`
- `apps/web/src/api/index.ts`
- `docs/Plan.md`
- `docs/issual.md`
