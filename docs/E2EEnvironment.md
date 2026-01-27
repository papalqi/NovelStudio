# E2E 环境编排与日志归档

本项目的 E2E（Playwright）环境由 `apps/web/playwright.config.ts` 统一编排，确保本地与 CI 一致。

## 启动方式

Playwright 使用 `apps/web/e2e/devServer.js` 启动前后端服务（独立端口）：

- Web: `http://localhost:5174`
- Server: `http://localhost:8788`

E2E 运行时会强制启动独立服务实例，不复用已有本地进程，以保证环境一致。
如本地已有进程占用 5174/8788，E2E 会因为 `--strictPort` 直接失败，请先停止再执行。

启动命令会分别拉起 Server 与 Web，并注入以下环境变量：

- `NOVELSTUDIO_DATA_DIR=apps/server/data/e2e`
- `NOVELSTUDIO_ALLOW_TEST_RESET=1`
- `PORT=8788`
- `VITE_API_BASE_URL=http://localhost:8788`

可通过以下变量覆盖端口：

- `NOVELSTUDIO_E2E_WEB_PORT`（默认 5174）
- `NOVELSTUDIO_E2E_SERVER_PORT`（默认 8788）
- `NOVELSTUDIO_E2E_API_BASE_URL`（覆盖 `resetTestData` 的请求地址）

测试重置时写入的 `sync.apiBaseUrl` 将根据服务端 `PORT` 生成，
如需自定义可设置 `NOVELSTUDIO_SEED_API_BASE_URL`。

## 数据目录隔离

E2E 使用独立数据目录：`apps/server/data/e2e`，避免污染开发数据。

## 日志归档

服务启动日志写入：

- `apps/web/test-results/dev-server.log`

该文件可用于 CI/本地复现与错误定位。

## 测试重置与失败采集

- 测试重置接口：`POST /api/test/reset`（仅在 `NOVELSTUDIO_ALLOW_TEST_RESET=1` 时可用）。
  Playwright 在每个用例前重置数据，避免测试间依赖。
- 当启用测试重置时，`NOVELSTUDIO_DATA_DIR` 必须包含 `e2e` 或 `tmp` 目录，否则服务启动会直接失败以防误写开发数据。
- Playwright 失败时保留截图、trace、视频，便于回归定位。
