# Cadence UI 项目状态

2026-11-02。当前 W2 剩余引擎验收已收尾，按用户要求停止自动执行并暂停 goal。
**项目整体尚未完成**：性能门仍有失败和未测项，W3、W4 尚未启动。继续工作需要用户明确恢复；
当前不新建实施会话、不发布、不部署。

## 已完成范围

- `docs/parity-plan.md` 的 58 个正式组件已实现：56 UI + 2 compositions，B0–B9 实现和 B1–B9 历史 batch gates 已完成；当前 registry 65 items、58 篇组件文档。
- 466 / 466 有限 API/context 审核、CSS/lifecycle、目录/侧栏、URL variants、58 页 SSR/noJS、站点流程、冻结分发与指南维持既有完成状态。这里的历史证据按其实际断言范围复用。
- W1 零时钟基础修复完成。W2 固定 11 行清单已收尾，覆盖基础控制器、菜单指示器、Select width/flight、Tabs/CodeBlock projection、CodeBlock Actions/glyph/viewport、Sidebar、Calendar WAAPI、Embla、Recharts 和 DocumentEntrance。逐行范围见 [最终运行验收](evidence/engine-runtime-closure.md)。

W2 修复了旧 writer 在 clock/mode 变化时的首帧取消、Recharts instant 数据几何、实际 viewport 高度下界，
以及已消费 offscreen entrance 恢复 full 时重新隐藏的问题。本包引入的 Chart Consumer 回调丢失也已修复；
真实 Container 测试先复现失败，再验证三模式切换、context 更新和 SVG/text 节点身份。
没有新增公开功能、改变性能预算或迁移框架。

## 当前提交与验证

| 内容                                       | 提交                            |
| ------------------------------------------ | ------------------------------- |
| W2 writer 首帧取消和时钟修复               | `e6b1ee9`                       |
| CodeBlock 渲染高度 clamp                   | `2d2c782`                       |
| 维持 CodeBlock 原 T5 source 预算           | `3f6034c`                       |
| 已消费 DocumentEntrance 保持 settled       | `e559df6`                       |
| Chart 函数 children 回归修复，最终 runtime | `f60e7fe`                       |
| 最终 sampler/cleanup 探针                  | `49064c7`                       |
| 固定 W2 证据与逐行结论                     | `5193c0b`                       |
| 当前 registry payload                      | `201975a`，`sourceSha: f60e7fe` |

最终 `pnpm registry:build`、`pnpm check` 通过：类型、lint、registry、parity 均通过，
**88 files / 723 tests**。独立 `.next-motion-runtime` 生产构建成功；最终受影响生产回归
**29 / 29**，零 skipped/unexpected/flaky。此前本包 273 / 273 生产报告保留为历史证据，
没有将其改写成最终 runtime 的全量重跑。命令和完整日志见 [检查记录](evidence/w2-close-checks.json)。

真实浏览器证据分别为：引擎 1236 条、几何 384 条、指示器 264 条、Select flight 24 条、
CodeBlock Actions 60 条、基础零时钟 12 条，均无 failures/errors。首两帧、在途值、实际 controller、
卸载后轨迹和源码 hash 保留在各 gzip 中；范围与历史证据复用依据见最终运行验收。
这些结果不替代移动性能测量或任意 caller 组合认证。

当前 payload 与源码同步，冻结快照
`public/r/snapshots/84cc78703b354b29c815c3970cb26973e4760dea398fdf48756b8a24c996b2f1/`、
`registry-snapshots.json` 和 `.gitattributes` 未改动。上游 pin 仍为
`96da9cc7f1aa10580a3741664e2a77c721206c00`。

## 未完成的性能与最终验收

当前 runtime `f60e7fe` 的完整站点四页初始 JS 实测如下，门槛为每页 **≤120000 bytes gzip**。
计量保留 fresh browser、cache disabled、所有自动脚本/prefetch/async 去重、
load + networkidle + 10s + networkidle、逐响应 gzip6 和 manifest/hash 核验，未缩短窗口或抬高预算。

| 页面      | gzip bytes | scripts | 结果 |
| --------- | ---------: | ------: | ---- |
| Button    |     293222 |      23 | 失败 |
| Chart     |     426590 |      24 | 失败 |
| Calendar  |     318581 |      24 | 失败 |
| CodeBlock |     376619 |      29 | 失败 |

完整记录见 [w2-close-site-js.json](evidence/w2-close-site-js.json)，audit exit 1。
四页失败已阻止全站预算通过；其余适用页面也不能用这四页替代验收。

| 剩余性能门                                    | 状态                                      |
| --------------------------------------------- | ----------------------------------------- |
| Initial Motion runtime ≤48 KB gzip            | 待实测归因                                |
| 编译后每组件增量 ≤8 KB gzip，排除共享 runtime | 待实测；source tier gzip 预算不等于该指标 |
| 中端移动设备 ≥55 fps                          | 待真实环境采证                            |
| CLS <0.02                                     | 待实测                                    |

W3 性能验收尚未启动。若恢复后达标需要迁移框架、改变功能或调整预算，先交付具体测量、
候选方案和影响，等待用户决定；不自动展开架构修改。W4 全目标逐要求验收与最终清理也尚未启动，
不能以 W2 检查通过宣称整体完成。[执行边界](execution-boundary.md) 继续约束剩余范围。

AI 25 个组件未排期、direction deferred、form/native-select/sonner exclusions 保持计划决定。
不新增 MCP、分发 Skill、发布、托管或额外兼容任务；非阻断新发现仅记录 backlog。

## 清理与停止状态

本轮 15 份大型原始报告共 178428046 bytes 已压缩归档为 2676351 bytes，并逐字节验证解压一致；
全部原始样本和负例仍保留。最终累计校验 56 份 W2 归档。另已删除当前收尾中两份有相同已验证归档的
`.cache` raw 副本，共 81139065 bytes。必要负例、可复现脚本、当前构建、固定 upstream 缓存及
React19 consumer fixture 保留。

历史清理曾被自动审批以 `blocked by policy` 拒绝。2026-11-02 用户明确要求再次尝试后，
已成功删除全部 48 个旧 `.next-*` 构建目录和原定 18 个旧缓存文件，另删除 2 份与已存 gzip
逐字节一致的 W2 raw 副本；本次合计 20 个缓存文件、18494340144 bytes（约 18.49 GB）。
原定缓存中 17 份独有诊断已先归档至 `.cache/basic-controls-exploratory-20261102.tar.gz`，
并校验每份原始字节的 SHA256；其余 3 份 raw 有完全一致的既有证据归档。
旧构建中的 92 个 junction 仅移除链接本身，依赖目标未删除。`.next`、`.next-motion-runtime`、
固定 upstream 缓存和 React19 consumer fixture 均保留。清理结果与固定清单在
`.cache/cleanup-result.json`、`cleanup-old-builds.json`、`cleanup-cache-targets.json`。
当前收尾使用的 Next 服务端口 3183 已停止，fixture 3181 已退出，未触碰用户 `.next`/3000。
本次仅完成上述固定清单的临时产物清理，不恢复 W3/W4 实施或改变性能门的未完成状态。

## 恢复入口

用户明确要求继续后，从 [W2 handoff](handoffs/engine-runtime-closure.md) 进入 **W3 性能验收**，
保持一个实施者并使用 GPT-6.1 Sol High。W2 已闭项目按实际 source/context 范围复用，
不再逐个 writer 重新派生修改任务。W4 在 W3 之后按原目标执行；当前不自动启动任何一步。
