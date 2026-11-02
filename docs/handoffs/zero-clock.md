# 零配方时钟交接

2026-11-02 Asia/Shanghai；起点95747f5，唯一实施会话。本逻辑步完成，整体goal仍ACTIVE。
不创建后继/子代理/并行goal，不push/发布/部署。固定upstream pin
96da9cc7f1aa10580a3741664e2a77c721206c00不动。shadcn skill仅只读，无consumer CLI/components.json。
先读本文、press-ownership.md、basic-controls-runtime.md、engine-runtime.md及其逐part表、
parity-plan、AGENTS与animation/overall/site-distribution/ADR/CONTRIBUTING。

## 提交和行为

- **384e94a**：scheme先写，source/必要tests/旧源码负控独立提交。
- 后续review/proof、payload、完整handoff分别独立提交，SHA见git log。
  当前payload sourceSha应为384e94a，纯证据/交接不机械刷新runtime SHA。

真实installed Motion13.5.1复现原motion.ts SHA256
5091af569d54981515b3154aa7ad328b08b78632dd3a5649e796a6408d5d52f6：
physical零clock为Infinity并触发默认物理回退，visualDuration0也仍播放。
保留完整旧源、generator正负数据和浏览器原始负控，不用强制spring()误判修复后的tween。

transitionFor对所有19 recipes在spring转换前返回duration0/delay0；直接physicalSpring(0)
返回duration0。timeScale有限非负、允许0；Provider和active recipe拒绝负/非有限值，
physicalSpring拒绝负/非有限visualDuration；none仍先忽略options，不改变原强制禁用语义。
0不改cm.mode/reduced/disabled，full held Button仍立即scale0.97；不是停在scale1。
继承0、nested0覆盖正clock、per-call0都保留；正时钟对象、velocity continuity和
caller-authored Motion provider fallback策略不改。CSS --animate-* loop独立theme clock；
原生在途CSS transition不承诺clock变化实时重启/重定时，none取消合同不回退。
无新recipe/硬编码组件motion值/依赖patch/动画timer/key-remount/React19.2新API。
保留Press owner pointer/Enter、native adapters、ref cleanup、Base/caller handlers及DOM语义。

## 真实验证

详细证据和探针纠错见 `docs/evidence/zero-clock-review.md`。
`tests/runtime/zero-clock.mjs`自行启动/关闭3179，真实Edge/React/Motion/Base。
`--negative`通过只读Vite plugin加载保存的精确旧motion.ts，不改当前文件。
两个JSON分别保留全部原始样本；commit和paint1/paint2都保留，包括positive/reset setup。
MotionValue绑定真正motion.div，检查数值、实际host transform与isAnimating，不靠空animations。

- 19 recipes零clock/去delay、initial inherited0、nested/percall0覆盖正clock；
  四种family真实partial正clock→同target0；恢复正clock、无关render不重启、partial cleanup；
  direct physical0、actual Base Button full0 held0.97；mode full/reducedfalse/disabledfalse。
- 负控与正控最终数量和样本见review；初始诊断原始失败另存，不覆盖。
- Unit旧源码24失败/17通过；修复后token/provider51/51。
- `pnpm registry:build`完成后完整`pnpm check`：721/721，88files，registry/parity58/P11/tier及
  mandatory38 suite reporter通过。VITEST_MAX_FORKS2/MIN1。
  初次check因新raw JSON格式失败，Biome仅重排空白后完整重跑成功，未改断言/样本。
- source稳定后隔离`.next-motion-runtime` production build成功，RAYON_NUM_THREADS2、
  NODE_OPTIONS=--max-old-space-size=768。Next生成tsconfig include/格式diff已核对，仅恢复自身生成diff。
  不碰用户.next/3000。`.cache/zero-clock-build.log`。
- msedge port3167 workers2：b3/motion-matrix/calendar/carousel/code-block **193/193**，
  0 skipped/unexpected/flaky；`.cache/zero-clock-production.json`。保留全部阈值、axe和原交互。
  原有full/reduced/none有限正时钟证据复用，不宣称本轮全库dual-theme截图。

```powershell
node tests/runtime/zero-clock-generator.mjs # 重放保留旧源，仅generator负控，不验证修复后的dispatcher
node tests/runtime/zero-clock.mjs --negative # 预期exit1，精确旧源
node tests/runtime/zero-clock.mjs            # 预期exit0，当前源
$env:VITEST_MAX_FORKS='2'; $env:VITEST_MIN_FORKS='1'
pnpm registry:build
pnpm check
$env:CADENCE_DIST_DIR='.next-motion-runtime'; $env:RAYON_NUM_THREADS='2'
$env:NODE_OPTIONS='--max-old-space-size=768'
pnpm exec next build
$env:PLAYWRIGHT_CHANNEL='msedge'; $env:PLAYWRIGHT_PORT='3167'
pnpm exec playwright test tests/e2e/b3.spec.ts tests/e2e/motion-matrix.spec.ts tests/e2e/calendar.spec.ts tests/e2e/carousel.spec.ts tests/e2e/code-block.spec.ts --workers=2 --reporter=json
```

## 性能与仍未闭合的实际writer

最终`zero-clock-js.json`，runtime384e94a，同一production build；fresh Edge/cacheoff，
所有自动script/prefetch/async URLdedup逐bodygzip6，load+networkidle+10s+networkidle，
无交互/root manifest hash核对，全200/无pageerrors，审计exit1：

| page      | gzip bytes | scripts | limit/result |
| --------- | ---------: | ------: | ------------ |
| Button    |     293597 |      23 | 120000/FAIL  |
| Chart     |     414647 |      24 | 120000/FAIL  |
| Calendar  |     318955 |      24 | 120000/FAIL  |
| CodeBlock |     376994 |      29 | 120000/FAIL  |

全部适用full-shell页面initialJS≤120000仍FAIL。Motion initial≤48KB、compiled/item≤8KB排共享、
midrange≥55fps、CLS<0.02仍缺真实证据，区别source tier gzip。stagger0/0已闭，不扩循环限额。
ADR009 Next App Router仍有效；ADR016仅研究，完整route/conformance前不擅迁移架构。
不抬限/缩窗/排chunks/藏inline-data/删功能，不把小fixture当生产预算。

本步闭合基础零clock解析与上述有限dispatcher/Button证据。不能从helper/19recipe dispatcher
外推所有writer均订阅同target clock变化；不能用client fixture替代网络SSR/hydration。
engine-runtime.md逐part剩余表继续适用：

1. menus/Select/Combobox实际checkbox/radio/context，Menubar真实delegation；Select measuredwidth/
   flight同目标clock、异步first-paint/cleanup。已证有限width/reducednone不重造pending。
2. Tabs/CodeBlock sharedprojection、floatingActions/两copy/expand/viewport各glyph生命周期与实际host。
3. Sidebar scalar/onUpdate、Calendar WAAPI、Embla track/loop relocation、Recharts其他真实series/controller；
   DocumentEntrance三种as的initial/offscreen/继承显式clock/settled/hydration/noJS/print。
4. 基础controls此前有限client/OS矩阵和生产Switch initialchecked复用。零clock新加入后对各writer
   按实际engine合同补clock订阅/第一paint/cleanup，发现缺陷先实际旧源负控，再最小修复。
   原生CSS无live-retime承诺，无实际GSAP writer不造测试。

58正式范围=56UI+2blocks/65items/58docs；API466、CSS/lifecycle、Combobox有限外部focus、
B1–B9 gates、URL37axes/118options/21N/A、58页noJS、siteflow/catalog/sidebar/intensity/
distribution/guides/T0templates的既有闭合不重造pending。AI25未排期、directiondeferred、
form/native-select/sonnerexcluded不扩；MCP/分发Skill/release/hosting未实施不虚构。
最终仍需整个goal逐要求实际审计，整体goal保持ACTIVE。

## 清理和下一prompt

> 下方下一 prompt 为历史交接，已由 W2 收尾及用户停止要求替代。当前不得自动新建实施会话；
> 以 [项目状态](../project-status.md) 和 [W2 交接](engine-runtime-closure.md) 为准。

冻结目录public/r/snapshots/84cc78703b354b29c815c3970cb26973e4760dea398fdf48756b8a24c996b2f1/、
registry-snapshots.json及.gitattributes与起点无diff，无重新freeze。
历史48旧.next-*目录与18旧.cache文件374823052bytes的删除曾被auto-review以blocked by policy拒绝，
本步没有重试或换工具绕过，也不声称完成历史清理。保留全部必要unique source negatives/raw samples、
固定upstream缓存、当前.next-motion-runtime和react19 consumer。新probe没有持久临时server目录。
最终本步临时日志清理、端口和git状态见下方完成记录。

下一prompt：遵守用户最新的[固定执行边界](../execution-boundary.md)，只开唯一 W2 实施会话，
一次性收尾现有 engine-runtime.md 未闭清单；包内阻断在本包解决，不按单个 writer 或新发现另开修改任务。
不要重开已充分证明的正时钟有限排列。
保留本轮基础零clock及原生Press所有修复。串行source→registrybuild→完整check→production，
source/proof/payload/handoff原子提交；实际生产依赖变动重测现成JS审计，失败如实记账。
不自己创建后继/子代理，不push/发布，由协调确认completed+idle后开下一唯一会话。


完成记录：最终负控92records/49failures(exit1)，当前92records/0failures(exit0)，345raw samples；
164个实际host paint均检查精确数值/transform/idle。最终脚本同断言，两套source分别重跑。
proof **8dc3e0b**，payload **f78243b**；174处sourceSha均为**384e94a**。
本轮三个无用途格式日志zero-clock-format.log、zero-clock-format-source.log、
zero-clock-proof-format.log已验证绝对路径位于本workspace/.cache后，用原生PowerShell非递归删除成功。
完整check/build/production/negative/unit/final lint日志有复核用途保留。历史拒绝清理未重试。
3179由fixture finally关闭；193production后Playwright关闭3167；JS audit临时重启的3167已Ctrl-C并
结束batch确认，最终3161/3165/3167/3178/3179均无listener。未触碰用户.next/3000。
最终source/proof/payload/handoff依次提交，git状态由最后复核；整体goal仍ACTIVE。
