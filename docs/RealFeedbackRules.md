# 真实反馈验收规则

目标：每条 E2E 用例必须同时验证 **UI 变化 + 接口响应 + 持久化结果**。

## 统一验收要点

1. **UI 变化断言**：动作完成后，必须有可见的界面变化。
2. **接口响应断言**：必须等待并校验对应 API 响应（HTTP 200-299）。
3. **持久化断言**：刷新或重开后，验证数据是否正确持久化。
   - 对于临时态（如日志/临时弹窗），持久化断言应验证“刷新后状态消失”。

## Playwright 统一封装

已提供统一辅助函数：`apps/web/e2e/realFeedback.ts`，包含：

- `withRealFeedback(page, { action, ui, api, persist })`
- `waitForApi(page, { url, method })`

所有回归用例应通过该函数执行，以确保 UI + API + 持久化三段式校验一致。

## 示例

```ts
await withRealFeedback(page, {
  api: { url: '/api/volumes', method: 'POST' },
  action: async () => page.getByTestId('explorer-new-volume').click(),
  ui: async () => expect(await getVolumeCount(page)).toBeGreaterThan(0),
  persist: async () => {
    await expect(page.getByText('资源管理器')).toBeVisible()
    expect(await getVolumeCount(page)).toBeGreaterThan(0)
  }
})
```
