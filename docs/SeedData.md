# 回归测试种子数据

本项目提供可复用的种子数据初始化与清理流程，确保回归测试数据一致。

## 使用方式

- 初始化（清空并写入固定种子数据）：
  - `npm --workspace apps/server run seed`

- 清理（仅清空数据，不写入种子）：
  - `npm --workspace apps/server run clean`

## 数据隔离

默认数据目录为 `apps/server/data`（随 server 的工作目录）。
如需隔离回归测试数据，可设置环境变量：

- `NOVELSTUDIO_DATA_DIR=/absolute/path/to/data`

## 种子数据范围

- 设置（settings）
- 卷与章节（volumes/chapters）
- 资料库（notes）

种子数据定义见：`apps/server/src/seedData.js`。
