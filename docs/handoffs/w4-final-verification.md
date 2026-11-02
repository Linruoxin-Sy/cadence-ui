# W3 → W4：最终核对交接 prompt

2026-11-02，D:/Code/Project/cadence-ui，PowerShell。交给协调会话核实当前实施者已结束、
git状态和服务退出后，再创建唯一 W4 实施会话，使用 GPT-6.1 Sol High。本会话不创建后继、
不派子代理、不 push/发布/部署。用户已明确恢复串行执行，历史 W2 停止要求不再阻止 W4 独立核对。

## 接手时先读

实际 AGENTS.md、docs/project-status.md、docs/execution-boundary.md、parity-plan当前进度、
docs/evidence/w3-performance.md/.json，以及相关整体/动画/站点/ADR设计。
不把历史handoff的OPEN当成最新待办，不重做58实现、466API/context、CSS/lifecycle或W2穷举。

## 源码与本轮改动

起点5372576，干净。产品runtime f60e7fe、W2 sampler49064c7、W2 proof5193c0b、
payload201975a/sourceSha f60e7fe。产品源码、依赖、Next配置、registry/content和payload均未改。
本轮增加全站冷加载/CLS、58组件编译增量和汇总工具，以及CLS session-window测试。
工具提交7242346、proof提交ebf64c2；本文件随状态/handoff提交，最新HEAD以实际git log为准。
纯工具/证据/文档不机械刷新174个sourceSha，不运行registry:build制造无意义payload变化。

上游pin96da9cc7f1aa10580a3741664e2a77c721206c00不变。冻结snapshot
public/r/snapshots/84cc78703b354b29c815c3970cb26973e4760dea398fdf48756b8a24c996b2f1/、
registry-snapshots.json及.gitattributes不动。保留W2修复及全部motion/React19.0/API合同。

## 五项性能门的真实状态

1. initial JS≤120000：失败。已测manifest全部69适用HTML页面×桌面/移动模拟=138冷加载记录，
   不用四页代替全站。必载root132767已超门；原四页桌面仍Button293222/Chart426590/
   Calendar318581/CodeBlock376619。精确全站分布见汇总。
2. initial Motion≤48000：参考consumer生产编译实际API合集47294符合；Next混合chunk精确
   生产归因仍未证，不能把此数冒称Next每实体的精确Motion贡献。公开m+domMax候选49621，
   比原API合集增加2327，已拒绝，不继续无限候选。
3. compiled/component≤8000，排共享runtime：58-entry拆分图+actual lib/Motion共享基线，
   专用依赖与可达async代码计入，21/58符合、37/58超限。Button6372、Chart118999、
   Calendar32164、CodeBlock198321；CodeBlock数字含按需高亮，不能叫首屏量。
   单模块编译排所有imports时58/58符合、最大4643，仅自有代码对照不替代完整门。
4. 真中端移动≥55fps：未证。adb devices -l空列表；无真机trace。用户设备条件问题已发出，
   未获答复不算授权/设备证明。不把模拟视口/rAF回调当实际呈现fps。
5. CLS<.02：全站双视口冷加载138/138符合，最大0；仍未证明交互/长窗口或真机CLS。

W3测量与报告交付不等于性能通过。总体仍未完成，W4不能改写为完成。

## 复现与验证

复用.next-motion-runtime build ID19Ek7XDFoWB78EgcZRqpJ；所有页面实际HTTP root hash核对。
确认空闲端口后CADENCE_DIST_DIR=.next-motion-runtime，next start3183。
CADENCE_RUNTIME_SOURCE=f60e7fe，PLAYWRIGHT_CHANNEL=msedge：

```powershell
node scripts/audit-w3-site.mjs http://127.0.0.1:3183 .cache/w3-site.json
node scripts/audit-w3-bundles.mjs
node scripts/summarize-w3.mjs
```

audit预期exit1（预算失败）；全部请求/源hash/图/CLS samples保存在docs/evidence/w3-*.json.gz，
汇总保留归档未压缩SHA、大小，已解压逐字节验证。collector观察窗口和自动加载规则没有弱化。
CLS运行中早期使用内联session算法；最终统一helper纠正边界，summary对全部原始shift重新计算并断言
一致。冷加载全部实际样本的最终结果由summary核验，不凭算法相似性推断。
完整检查88files/724tests及最终targeted helper2/2见w3-checks.json；不因纯handoff重复全库矩阵。
没有新产品build，沿用已核验W2产品构建，不把旧构建说成新源码build。

## 决策点与 W4 固定范围

需要用户确定：保持120000及全部功能，允许完整route的新hydration/framework原型；或保留Next
并明确重订预算/依赖口径；或维持现合同和失败状态。具体方案、迁移影响和旧候选负例见W3报告。
本轮没有批准迁移、改预算、删功能或豁免专用依赖。没有已证明可达标的新架构。

W4现在可独立核对原目标、源码/文档/分发、提交、证据和清理范围；按已有实际证据复用，
只补真正未核条件，不重建全库pending、不重跑已闭W2。重大决策待用户，不能以决策报告闭性能门。
有实际用户回复则纳入下一步。AI25/direction deferred/三exclusions不扩展。

保持单实施者，检查/build串行，Vitest forks2/min1、RAYON2、NODE_OPTIONS768MB、
Edge/workers2。若改registry/source/content，先registry:build再check，motion须完整conformance。
只读shadcn，禁init/add/apply/create/preset/components.json。

## 清理

旧48build/20cache约18.49GB已在5372576之前清理，旧handoff的blocked-by-policy已过时。
保留.cache/basic-controls-exploratory-20261102.tar.gz、证据gzip、固定upstream缓存、React19
consumer fixture和仍有用的.next-motion-runtime；不碰用户.next/3000。
本轮未新建Next构建目录；审计bundle write:false，只产生可复现报告。原始site/bundle报告归档
后可删除重复.cache副本；日志有证据归档才删除。Windows删除前解析确认绝对目标在workspace，
用原生PowerShell，不遍历junction目标。本轮3183服务及自行启动的ADB daemon结束时退出。
两份原始报告逐字节匹配归档后，重复.cache raw与w3-bundles生成目录已删，保留可复现脚本/日志。
Next3183及ADB5037已实际停止；结束时监听检查无3183/5037，未触碰.next/3000。
最终git状态核实见本会话最终交付。
