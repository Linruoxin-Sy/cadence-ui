# W2 交接与停止点

2026-11-02。W2 固定 11 行剩余引擎清单已收尾；按用户最新要求，**在这里停止并暂停 goal**。
当前状态以 [project-status.md](../project-status.md) 为准。以下 prompt 仅供用户明确恢复后使用，
当前不得自行创建 W3、W4 或任何后继实施会话。

## 最终交付

Runtime `f60e7fe`；sampler `49064c7`；证据 `5193c0b`；payload `201975a`，sourceSha 绑定 f60e7fe。
源码原子提交为 e6b1ee9、2d2c782、3f6034c、e559df6、f60e7fe。
[逐行验收](../evidence/engine-runtime-closure.md) 与其 JSON 给出 33 个实际 writer sites 的 source hash、
11 行固定范围、真实 host/phase、负例和历史复用依据；不是任意调用组合认证。

最终 check 723/723 in88 files，隔离 Next build 成功，最终受影响 production29/29，零跳过/重试/flaky。
引擎1236、几何384、指示器264、flight24、Actions60、基础zero12均通过。此前production273/273只作历史证据。
Chart Consumer 回归测试先失败后通过，最终全套Chart13/13。命令可复现如下，先确认端口空闲：

```powershell
$env:VITEST_MAX_FORKS='2'; $env:VITEST_MIN_FORKS='1'
pnpm registry:build
pnpm check
node tests/runtime/w2-engines.mjs .cache/w2-engines-replay.json
node tests/runtime/w2-geometry.mjs .cache/w2-geometry-replay.json
node tests/runtime/w2-indicators.mjs .cache/w2-indicators-replay.json
node tests/runtime/w2-select-flight.mjs .cache/w2-flight-replay.json
node tests/runtime/w2-code-actions.mjs .cache/w2-actions-replay.json
node tests/runtime/w2-controls-zero.mjs .cache/w2-controls-zero-replay.json
$env:CADENCE_DIST_DIR='.next-motion-runtime'; $env:RAYON_NUM_THREADS='2'
$env:NODE_OPTIONS='--max-old-space-size=768'
pnpm exec next build
$env:PLAYWRIGHT_CHANNEL='msedge'; $env:PLAYWRIGHT_PORT='3183'
pnpm exec playwright test tests/e2e/motion-matrix.spec.ts tests/e2e/w2-production.spec.ts tests/e2e/chart.spec.ts --grep 'code-block|W2 production|chart' --workers=2 --reporter=json
```

上述命令是复现说明，不是自动重跑指令。源码稳定后串行执行，不让 check/build 重叠；
Next 产生的 tsconfig include 差异仅恢复本轮生成部分。冻结快照与用户 `.next`/3000 不动。
实际原始报告/附件和完整命令日志均在 `docs/evidence/w2-close-*.json` 及其 gzip。

当前四页 strict JS 为 Button293222、Chart426590、Calendar318581、CodeBlock376619 bytes gzip，
全部失败120000。48KB initial Motion、8KB compiled/item、55fps、CLS.02仍待实测。
源码 T5 gzip 12063/12288 不等于 compiled8KB 门通过。

## 清理

56 份归档逐字节验证；本轮15份大型raw已压缩并保留所有帧，当前两份已归档重复raw（81139065 bytes）已删除。
历史48旧build目录与18旧cache文件374823052 bytes仍未清，自动审批曾以 blocked by policy 拒绝，未重试绕过。
必要唯一负例、当前build、shadcn pin缓存和React19 consumer保留。
本轮Next3183已停，fixture3181已退；其他应用监听未处理。

## 仅在用户明确恢复后的 prompt

阅读实际 AGENTS.md、docs/project-status.md、execution-boundary.md、parity-plan.md、
本handoff及engine-runtime-closure证据。你是唯一 W3 性能实施者，使用 GPT-6.1 Sol High，
不派子代理、不自己新建后继、不 push/发布/部署。W1/W2、58实现、API466、CSS/lifecycle及既有站点/分发闭合保持；
只验证其被修改所影响的范围，不重新建立全库pending清单。

执行既定五个性能门的真实归因与必要范围内优化。全站initial JS ≤120000 bytes gzip、
Motion initial≤48KB、compiled/item≤8KB排共享、midrange≥55fps、CLS<.02；保留原计量窗口、
自动script/prefetch/async计入规则和功能合同，不用source tier budget代替编译后增量。
重大框架、预算或功能变更先给出测量/方案/影响供用户决定，不擅自迁移、不继续无限候选实验。
新非阻断发现只记backlog，AI25/direction/exclusions等范围不扩。

仅用户明确恢复才执行此prompt；W4仍待W3之后按原目标做最终核对和安全清理。
每包拆原子提交，source稳定后registrybuild/check/必要production，payload独立，handoff记录真实红项。
纯证据/设计文档不机械刷新runtime sourceSha。历史被拒删除不换工具重试；只清理本轮有确定用途结论的产物。
