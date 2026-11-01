# 会话分屏 / Session Split View

[![npm version](https://img.shields.io/npm/v/dsh-session-split-view.svg)](https://www.npmjs.com/package/dsh-session-split-view)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](./LICENSE)

- npm: https://www.npmjs.com/package/dsh-session-split-view
- GitHub: https://github.com/Mengnan578/dsh-session-split-view
- Issues: https://github.com/Mengnan578/dsh-session-split-view/issues

DeepSeek Harness Web GUI 的多会话分屏插件：在当前会话旁边并排加入其他会话，最多同时显示 **4 个会话**。

这是一个 DSH **插件 bundle**（npm 包 `dsh-session-split-view`），安装后由插件管理器加载，不是独立应用。

## 特性

- 分屏是**当前会话面板内部的一种模式**，不是另一个主面板：
  - 左侧栏仍然选中当前会话，当前会话的灰色高亮保留；
  - 右侧栏（文件、终端、浏览器等）保持原来的开关状态；
  - 普通单会话视图完全不改动，只有开启分屏时才临时替换会话主体。
- 当前会话固定为第 1 个分屏；最多再加入 3 个伴随会话。
- 2–3 个会话横向排列，可拖动分隔条调整宽度；4 个会话自动排成 2×2。
- 每个分屏都是完整的会话正文：消息流、输入框、模型选择、权限、审批和停止按钮都在各自的会话内工作。
- 关闭**最后一个**伴随分屏后，会自动退出分屏模式，回到普通单会话视图。
- “退出分屏”只退出模式，不删除已加入的会话；再次打开会恢复上次的组合。
- 分屏组合和宽度比例保存在浏览器 `localStorage`（`dsh.split-view.v2`）。

## 使用

- **当前会话标题栏右侧的分屏图标**
  - 点击后在图标下方（右上角）打开紧凑的会话选择器；
  - 选一个会话后进入分屏；
  - 分屏内右上角的“添加会话”也会打开同一个选择器。

- **左侧栏当前会话行的分屏图标**
  - 点击后在该行图标下方打开紧凑选择器，选择要并排的会话。

- **左侧栏其他会话行的分屏图标**
  - 直接把该会话加入当前分屏。

分屏顶部右侧的“添加会话”可继续添加；每个伴随分屏标题栏可以在普通单会话中打开或关闭该分屏；当前会话分屏不可关闭。

## 安装

在 Harness 的 **设置 → 插件** 中安装 npm 包：

```text
dsh-session-split-view
```

插件管理器会把它作为 bundle 激活，无需单独构建。安装后如果页面尚未热加载，刷新一次即可。

### 兼容性

- 面向 DeepSeek Harness Web GUI 0.2.x，已在 `0.2.1-rc.3` 上验证。
- 纯 Client 插件，无 Host 服务、工具或额外运行时依赖。
- 不使用 iframe；分屏正文直接复用 Harness 的会话渲染。

## 已知限制

- 分屏期间顶部是分屏工具栏，原会话标题栏的改名、分支、View 切换和右侧栏开关按钮暂时不可用；退出分屏即可恢复。
- 分屏内固定显示 Chat 视图，不显示 Trajectory 视图。
- 子会话（subagent）不参与分屏。
- 最多同时显示 4 个会话（当前 + 3 个伴随）。
- 分屏组合是全局的，不按工作区分别保存。
- 分屏打开时会在各自会话内保留消息、草稿和审批状态；但切换分屏布局时滚动位置可能重新定位。

## 仓库

- GitHub: https://github.com/Mengnan578/dsh-session-split-view
- Issues: https://github.com/Mengnan578/dsh-session-split-view/issues
- npm: https://www.npmjs.com/package/dsh-session-split-view

## 许可证

[MIT](./LICENSE)

Copyright (c) 2026 dsh-session-split-view contributors
