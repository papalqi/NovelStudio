# NovelstudioAI

基于 BlockNote 的网络小说创作工作台。目标是提供「章节管理 + Notion 式块编辑 + 多模型 Agent + 本地后端存储」的一体化写作体验。

## 项目结构

```text
.
├── apps/
│   ├── web/            前端（React + Vite + BlockNote）
│   └── server/         本地后端（Node + SQLite）
├── docs/               需求/规划/说明文档
├── AGENTS.md           协作规则
└── package.json        根脚本与工作区配置
```

## 本地运行

```bash
npm install
npm run dev
```

默认前端：`http://localhost:5173`，后端：`http://localhost:8787`

## 常用命令

```bash
npm run lint
npm run test
npm run test:smoke
npm run test:e2e
```

## 进度与规划

- 功能规划：`docs/Plan.md`
- 细项 TODO：`docs/issual.md`
