# E2E 环境编排与日志归档

本项目的 E2E（Playwright）环境由 `apps/web/playwright.config.ts` 统一编排，确保本地与 CI 一致。

## 启动方式

Playwright 使用 `apps/web/e2e/devServer.js` 启动前后端服务：

- Web: `http://localhost:5173`
- Server: `http://localhost:8787`

启动命令等价于执行根目录的 `npm run dev`，并注入以下环境变量：

- `NOVELSTUDIO_DATA_DIR=apps/server/data/e2e`
- `VITE_API_BASE_URL=http://localhost:8787`

## 数据目录隔离

E2E 使用独立数据目录：`apps/server/data/e2e`，避免污染开发数据。

## 日志归档

服务启动日志写入：

- `apps/web/test-results/dev-server.log`

该文件可用于 CI/本地复现与错误定位。
