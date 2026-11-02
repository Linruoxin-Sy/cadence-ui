# W3 性能验收交接

2026-11-02。将本文件交给新对话后，按下面的任务继续。当前对话只编写交接，不恢复已清除的 goal，
不启动实现、构建或新会话。新对话使用 GPT-6.1 Sol High，只保持一个实施者。

## 新对话任务

你在 `D:/Code/Project/cadence-ui` 工作，使用 PowerShell。接手 **W3 性能验收**，按照既定边界完成
真实测量、归因和必要优化；不要从头重做 parity，也不要无限派生新的修改任务。
先核对实际工作区和提交，不覆盖用户新改动。常规可逆修复自主推进；涉及框架、预算或功能合同的
重大变更，先完成独立测量并提交具体方案、影响和证据，交由用户决定。

依次阅读：

1. 仓库实际 `AGENTS.md`。
2. [项目状态](../project-status.md)、[执行边界](../execution-boundary.md)、[parity plan](../parity-plan.md)。
3. [W2 交接](engine-runtime-closure.md) 和 [W2 最终运行验收](../evidence/engine-runtime-closure.md)，按需读取其 JSON/原始 gzip。
4. 改动相关的 [整体设计](../overall-design.md)、[动画系统](../animation-system.md)、[站点与分发设计](../documentation-site-and-distribution.md) 和 [ADR](../adr.md)。

历史文档中的 OPEN 或“下一 prompt”不自动覆盖最新项目状态。已闭项目按其真实 source/context 范围复用，
只验证本次改动影响的路径；不重新创建全库 pending 清单，不机械重跑所有 W2 矩阵。

## 接手基线

交接前核实的 HEAD 为 `0fa352f`，git 工作区干净。本文件本身是其后的纯文档变更。
最终 runtime `f60e7fe`，sampler `49064c7`，证据 `5193c0b`，payload `201975a`；
当前 payload 的 174 个 sourceSha 均为 `f60e7fe`。纯 handoff/证据提交不机械重建 payload 或刷新 sourceSha。

已完成：58 个正式组件（56 UI + 2 compositions）、B0–B9 实现、B1–B9 历史 batch gates、
有限 API/context 466/466、CSS/lifecycle、既有站点/文档/冻结分发范围，以及 W1、W2。
W2 固定 11 行清单的实际 host、首两帧、clock、反向与 cleanup 已收尾；不是任意 caller 或框架认证。
最终 check 为 **88 files / 723 tests**，隔离 Next production build 成功，最终受影响生产回归
**29/29**，零 skipped/unexpected/flaky。更早的 W2 production273/273 是历史报告，不能改写成最终源码全量重跑。

保留最近修复：原生 pointerId/Enter press ownership、committed controller stop/set 与 frame reassertion、
reduced per-key zero clock、Select 单一 width owner/flight controller、CodeBlock 实际 viewport clamp、
Recharts terminal interpolation、DocumentEntrance 已消费 offscreen 不重放，以及 Chart Consumer 函数 children。
不要为性能优化回退这些合同，或以 remount/删除功能实现预算。

## 剩余验收

| 性能门                                             | 当前状态                                               |
| -------------------------------------------------- | ------------------------------------------------------ |
| 所有适用完整站点页面 initial JS ≤120000 bytes gzip | 四个最新实测页均失败，见下表；其余页仍需按适用范围验收 |
| Initial Motion runtime ≤48 KB gzip                 | 待实测归因                                             |
| 编译后每组件增量 ≤8 KB gzip，排共享 runtime        | 待实测；不是 source tier gzip 预算                     |
| 中端移动设备 ≥55 fps                               | 待真实环境采证                                         |
| CLS <0.02                                          | 待实测                                                 |

最新完整站点基线为 runtime `f60e7fe`：

| 页面      | gzip bytes | scripts |
| --------- | ---------: | ------: |
| Button    |     293222 |      23 |
| Chart     |     426590 |      24 |
| Calendar  |     318581 |      24 |
| CodeBlock |     376619 |      29 |

报告是 [w2-close-site-js.json](../evidence/w2-close-site-js.json)，audit exit1。
计量沿用 `scripts/site-js-budget.mjs` 和 `scripts/audit-site-pages-js.mjs`：fresh browser、cache disabled、
无交互/滚动/请求屏蔽，load + networkidle + 10s + networkidle，所有自动 script/prefetch/async URL 去重，
对解码后的每个响应 body 用 gzip6 后求和，保留 manifest/hash/status/errors。
不能抬门槛、缩观察窗、漏算异步 chunk、藏入 inline/data 或删 SSR/功能凑数。

先复用已有研究，按需读 [runtime boundaries](site-runtime-boundaries.md) 和
[code fence boundaries](site-code-fence-boundaries.md)。它们是历史受限 prototype，不是产品采纳或预算通过。
ADR-009 的 Next App Router 决定仍有效，ADR-016 仅为调查；不能因候选子集看似更小而擅自迁移。
先完成一次有证据的脚本/依赖归因，明确缺口和测量方法，再选择一条有依据的候选路线；
不重复无限候选实验。独立可测的其余性能门应继续完成，不因一个架构决策悬而未测。

## 仓库约束与验证

- registry 是直接复制给用户的源码；使用相对 imports、共享 lib、`@cadence/` registryDependencies，保持 upstream exports/props/defaults/data-slot、Base UI render、cn 用户类最后和 P11 UI-only。
- shadcn skill 仅可只读参考；禁止 init/add/apply/create/preset/components.json。上游 pin 不变：`96da9cc7f1aa10580a3741664e2a77c721206c00`。
- 动画使用 tokens/既定 recipes，保留 full/reduced/none 的真实差异、data-motion、取消与 cleanup。源码/registry/docs 配方一致；方案有变化先改设计记录。保持 React19.0 支持，不引入 useEffectEvent 等更晚 API。
- 不改冻结目录 `public/r/snapshots/84cc78703b354b29c815c3970cb26973e4760dea398fdf48756b8a24c996b2f1/`、`registry-snapshots.json` 或 `.gitattributes` 的冻结语义。
- 保留原断言、预算、必要 axe/键盘/focus/ref/SSR/noJS 与实际 motion 合同。桌面 fixture 不当作中端移动性能证明；未测项明确未测。

源码稳定后串行执行检查，不让 check/build 重叠。registry/source/content 变化后先 `pnpm registry:build` 再 `pnpm check`；
测试按实际影响选择，必要生产验证使用隔离目录，先确认端口空闲。环境沿用：

```powershell
$env:VITEST_MAX_FORKS='2'; $env:VITEST_MIN_FORKS='1'
$env:CADENCE_DIST_DIR='.next-motion-runtime'; $env:RAYON_NUM_THREADS='2'
$env:NODE_OPTIONS='--max-old-space-size=768'
$env:PLAYWRIGHT_CHANNEL='msedge'
```

Playwright 用 workers2。Next 产生的 tsconfig include 差异只恢复本轮生成部分；不碰用户 `.next`/3000。
需要重测四页时，隔离 build/start 后运行下列命令，完成后停止自己服务：

```powershell
$env:CADENCE_RUNTIME_SOURCE='<实际已提交 runtime SHA>'
node scripts/audit-site-pages-js.mjs .cache/w3-site-js.json http://127.0.0.1:<已确认空闲的端口> button,chart,calendar,code-block
```

这四页是对比入口，不代表全站最终验收完成。

## 范围与结束条件

本次负责 W3。W4 是后续全目标核对与最终清理，不能以 W3 的局部绿项替代；不要自行开后继会话。
不派子代理、不新增并行 goal、不 push/发布/部署。AI25、direction deferred、form/native-select/sonner exclusions
维持原决定，不新增 MCP、分发 Skill、托管或兼容性扩展。非阻断新发现只记 backlog。

按逻辑原子提交源码/测试、proof、必要 payload、handoff；每次结论绑定实际源码和测量条件。
W3 收尾更新项目状态、执行边界、parity 进度并写 handoff，列出五门逐项结果及需要用户决定的具体问题。
有失败/未测项就保持整体未完成，不以决策报告当作性能通过。

随手清理本轮确定无用途的产物，保留唯一负例、完整原始归档、可复现脚本、当前有用构建、固定 upstream 缓存
和 React19 consumer fixture。上一轮56份 W2 归档已校验；两份已归档重复 raw 已删除。
历史48个旧 `.next-*` 目录与18个旧 `.cache` 文件（374823052 bytes）的删除曾被自动审批以
`blocked by policy` 拒绝，命令未执行；仍未清理，不换工具或等价命令绕过。
上轮 Next3183 和 fixture3181 已退出；新会话仍需重新检查实际端口。
