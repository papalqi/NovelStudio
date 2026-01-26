# 实现 TODO 细项

## 章节与资源管理器
- [x] 章节/卷结构持久化（本地 JSON -> API）
- [x] 章节树拖拽（原生 Drag & Drop）
- [x] 章节批量操作（复制/合并/移动）
- [x] 章节元数据编辑（状态、标签、更新时间）

## 编辑器与块操作
- [x] BlockNote 侧边块菜单改造（插入 AI 按钮）
- [x] 块级选中范围 API 抽象（文本/多块）
- [x] 块级 AI 操作结果写回并保留历史（AI 日志）

## AI Provider
- [x] Provider schema 校验（URL/token/model）
- [x] 请求适配 OpenAI 兼容格式
- [x] 请求超时/重试/限流处理
- [x] 统一错误提示与日志面板

## Agent
- [x] Agent 配置与运行策略（串行）
- [x] Agent 上下文拼装（章节/标签）
- [x] Agent 结果结构化输出
- [x] Agent 运行记录与可复现输入

## 设定与资料库
- [x] 角色卡字段（基础结构）
- [x] 世界观条目与引用
- [x] 章节引用设定片段
- [x] 资料库独立页面与引用插入

## 导出与分享
- [x] Markdown/HTML/TXT 导出
- [x] 发布预览页

## 测试与回归
- [x] 真实点击回归覆盖矩阵与追踪表（RegressionCoverageMatrix/Tracking）
- [x] 真实反馈验收规则（RealFeedbackRules）
- [x] E2E 环境编排与数据重置规范（E2EEnvironment + reset）
- [x] 测试重置安全护栏（仅允许 e2e/tmp 数据目录）

## 基础能力
- [x] 自动保存与冲突处理
- [x] 本地离线缓存与恢复
- [x] 版本历史与差异对比
- [x] 主题切换与字体配置
- [x] 统一设置面板与全量配置入口整合
- [x] 测试体系（smoke / unit / e2e）与 CI 运行指引
- [x] 代码结构拆分，保证单文件 <1000 行
- [x] 开发模式默认 LAN 访问（Vite host + API base 动态解析）
