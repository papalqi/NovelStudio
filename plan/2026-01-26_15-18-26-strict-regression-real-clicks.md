---
mode: plan
cwd: /root/project/NovelStudio
task: 严格检查回归测试，使用真实点击，检查真实反馈。测试每一个按钮，每一个功能
complexity: complex
planning_method: builtin
created_at: 2026-01-26T15:18:03+08:00
---

# Plan: 全量真实点击回归测试

🎯 任务概述
本计划面向当前前后端联动的全量回归测试，要求使用 Playwright 真实点击覆盖所有可交互按钮与功能。
每个测试需要验证真实反馈：UI 变化 + 真实接口响应 + 数据持久化（含刷新后仍可见）。
采用固定种子数据以保证可重复执行，同时明确覆盖矩阵与可追踪的测试清单。

📋 执行计划
1. 建立功能与按钮清单：按页面/模块列出所有按钮与交互控件，建立“按钮→功能→期望反馈”覆盖矩阵，明确遗漏点与优先级。
2. 固化测试数据策略：设计并生成固定种子数据（卷/章/资料库/设置），定义数据初始化与清理流程，确保每次运行一致。
3. 规划测试环境编排：明确 web + server 启动方式、端口、数据目录隔离与日志归档，确保本地与 CI 一致可复现。
4. 设计真实点击准入规范：为每个按钮确定稳定定位方式（role/name 或 data-testid），补齐缺失的可访问标识，避免脆弱选择器。
5. 定义“真实反馈”验收规则：每个测试必须包含 UI 变化断言、接口响应断言、持久化断言（刷新/重开后仍存在）。
6. 分模块落地 E2E 套件：资源管理器、编辑器、设置面板、资料库抽屉、AI 面板、导出流程等逐一实现覆盖矩阵。
7. 建立回归用例追踪表：将每个按钮与测试用例绑定到文档清单，标记已覆盖/待覆盖/高风险项。
8. 加入稳定性与回归守护：消除测试间依赖，加入重置/隔离、等待策略、失败截图与日志采集。
9. 文档与回归入口完善：在 `docs/Plan.md` 与 `docs/issual.md` 登记新增测试 TODO 与执行规范，形成长期回归入口。

⚠️ 风险与注意事项
- UI 选择器不稳定或缺乏语义化标识会导致 E2E 易碎，需要补齐可访问标识或 data-testid。
- 真实反馈包含“持久化验证”，需要明确后端数据隔离策略，避免污染真实数据。
- AI 能力依赖外部服务，需为测试准备稳定可控的模拟响应或本地兼容服务。

📎 参考
- `apps/web/e2e/app.spec.ts`
- `apps/web/playwright.config.ts`
- `apps/web/src/app/App.tsx`
- `apps/web/src/app/components/Explorer.tsx`
- `apps/web/src/app/components/SettingsPanel.tsx`
- `apps/server/src/index.js`
- `apps/server/src/store.js`
- `docs/Plan.md`
- `docs/issual.md`
- `docs/RegressionCoverageMatrix.md`
