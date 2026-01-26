# E2E 环境编排与日志归档

本项目的 E2E（Playwright）环境由 `apps/web/playwright.config.ts` 统一编排，确保本地与 CI 一致。

## 启动方式

Playwright 使用 `apps/web/e2e/devServer.js` 启动前后端服务：

- Web: `http://localhost:5173`
- Server: `http://localhost:8787`

E2E 运行时会强制启动独立服务实例，不复用已有本地进程，以保证环境一致。
如本地已有进程占用 5173/8787，请先停止再执行 E2E。

启动命令等价于执行根目录的 `npm run dev`，并注入以下环境变量：

- `NOVELSTUDIO_DATA_DIR=apps/server/data/e2e`
- `NOVELSTUDIO_ALLOW_TEST_RESET=1`
- `VITE_API_BASE_URL=http://localhost:8787`

## 数据目录隔离

E2E 使用独立数据目录：`apps/server/data/e2e`，避免污染开发数据。

## 日志归档

服务启动日志写入：

- `apps/web/test-results/dev-server.log`

该文件可用于 CI/本地复现与错误定位。

## 测试重置与失败采集

- 测试重置接口：`POST /api/test/reset`（仅在 `NOVELSTUDIO_ALLOW_TEST_RESET=1` 时可用）。
  Playwright 在每个用例前重置数据，避免测试间依赖。
- Playwright 失败时保留截图、trace、视频，便于回归定位。
