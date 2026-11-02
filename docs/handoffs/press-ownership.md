# 原生 PressButton 主指针归属交接

2026-11-02 Asia/Shanghai；唯一实施会话，起点62efebc，工作区clean。
本步已完成，整体 goal 仍 OPEN。没有后继聊天、子代理、新 goal、push、发布或部署。
先读本文、basic-controls-runtime.md、engine-runtime.md、parity-plan和实际AGENTS。
shadcn skill仅只读，无consumer CLI或components.json。

## 提交与修复

- **a656074**：source、必要native handler tests、scheme、真实source negative与复现工具。
  press-button SHA256 **72ae32309c83aaa8065e5dc5337026adc9ebc0fbffbbef614edcad88d63dbedf**。
- 后续proof、payload、handoff各自独立提交，具体SHA见git log；不因证据修改刷新runtime sourceSha。

4d06c24仅检查button0，任意trusted window pointerup/cancel都结束held press。
真实Edge CDP两指且没有移动：Press主触点仍持有时，Toggle非主触点缩放；仅释放
Toggle后Press也提前回弹。negative保存精确旧源码、完整事件与数值transform；
legacy50cc262对照不启动第二反馈，但自身最终未归一，不是完整行为金标准。
初次诊断另有“多指之后必须click1”的错误探索断言；两个实现实际均为0，原始负例
如实保留该失败。正控改为多指click0，并独立证明单指click1、Toggle状态与Enter激活。

最小私有修复：只有primary左键pointer能获得pointerId归属；同一owner release/cancel
才清除手势。Enter另有归属，不被其他pointer结束。blur、disabled/aria-disabled、
移除whileTap recipe清归属；window真实release只认owner，unmount撤listener。
Base/caller handlers原样调用，currentTarget、cancel、refs、DOM和原生activation保留。
无Motion tap合成冒泡pointercancel、全局stopPropagation、依赖patch、key remount、
动画timer、新公开props或token。React19.0 API兼容，无useEffectEvent。
recipe/frontmatter/contract集合未变，full原token scale，reduced无scale，none零时钟。

## 证据与命令

`press-ownership-runtime.json`：36cases /222断言，零失败；mode三种×OS两种×
release/cancel/disabled/none/blur/unmount。真实CDP pointerId/isPrimary/isTrusted，
主DOM identity、数值scale、原生多指activation记录；6个release cells额外验证真实
单指Toggle、Enter反馈/activation与鼠标控件外release。不是dispatchEvent或空animations推断。
report.source记录采集开始HEAD；verifiedRuntimeSource用git show精确字节校验绑定a656074。

`press-ownership-controls.json`及gzip：138/138，原始JSON **51,750,541 bytes**，
gzip752034，解压逐字节相等，SHA256见索引，未删帧。旧138的gzip/两个source negatives
继续保留。新首轮controls原始失败gzip单独保留：旧commit的paint2跨collector reset到达，
导致恰好2帧断言得到3；实际Slider drag存在、无跨控件synthetic cancel。
sampler为每个请求分配probeRequest，保留所有原始帧，只把请求commit对应paint1/paint2
用于首帧断言，仍要求恰好两帧；没有改变产品实现、等待窗口或断言阈值。
修正后138通过；legacy fixture23/23、pointer/Enter disabled-release-reenable8/8也通过。

```powershell
node tests/runtime/press-ownership.mjs --negative # 修复前运行exit1，原始结果保留
node tests/runtime/press-ownership.mjs            # 自启/关闭3178，36cells
$env:VITEST_MAX_FORKS='2'; $env:VITEST_MIN_FORKS='1'
pnpm registry:build
pnpm check # 692/692，88files；最终review再次完整check同数通过
# .cache/press-ownership-check.log / press-ownership-check-final.log
$env:RAYON_NUM_THREADS='2'; $env:NODE_OPTIONS='--max-old-space-size=768'
$env:CADENCE_DIST_DIR='.next-motion-runtime'
pnpm exec next build # press-ownership-build.log；仅恢复自己的tsconfig生成diff
$env:PLAYWRIGHT_CHANNEL='msedge'; $env:PLAYWRIGHT_PORT='3167'
pnpm exec playwright test tests/e2e/b3.spec.ts tests/e2e/motion-matrix.spec.ts tests/e2e/calendar.spec.ts tests/e2e/carousel.spec.ts tests/e2e/code-block.spec.ts --workers=2 --reporter=json
# .cache/press-ownership-production.json：193/193，0 skipped/unexpected/flaky/retry
```

Vite不在根直接dependency，通过Vitest物理依赖resolve createServer；3165配置
tests/runtime/vite.config.mjs、esbuild.jsx automatic。服务就绪后实际命令：

```powershell
$env:CADENCE_RUNTIME_SOURCE='a656074'
node tests/runtime/controls.mjs .cache/press-ownership-controls-final.json
node tests/runtime/archive-controls.mjs .cache/press-ownership-controls-final.json docs/evidence/press-ownership-controls.json
node tests/runtime/probe.mjs .cache/press-ownership-legacy-fixture.json
node tests/runtime/assert-report.mjs .cache/press-ownership-legacy-fixture.json
node tests/runtime/press-reenable.mjs
```

本轮Next build曾与第一次check的后半段tests重叠，不能记成完全串行；最终完整check
是在build结束后独立执行并通过。没有边编辑shipped source边build/check。
一次重复start碰到Playwright自启3167而退出，无额外listener；审计初次漏dist/env channel
分别在读manifest/启动浏览器前失败，补齐环境后真实完成四页审计，没下载新browser。

## 生产与性能边界

真实193包括基础Button/B3、初始checked Switch、Progress和受Button委托影响的
Calendar/Carousel/CodeBlock等。没有重新声称全库dual-theme截图认证。
旧React19.0 consumer证据继续有效；新PressButton的19.0实际browser生命周期未单独认证，
不能扩写为最低版全58组件矩阵。fixture不替代全网络SSR/hydration。

`press-ownership-js.json`，同一实际最终production build，fresh Edge/cacheoff、所有自动
script逐body gzip6、load+networkidle+10s+networkidle、无interaction、root hash核对：

| page      | gzip bytes | scripts | result     |
| --------- | ---------: | ------: | ---------- |
| Button    |     293501 |      23 | FAIL120000 |
| Chart     |     414551 |      24 | FAIL120000 |
| Calendar  |     318859 |      24 | FAIL120000 |
| CodeBlock |     376898 |      29 | FAIL120000 |

全200、无pageerror；真实审计exit1。使用CADENCE_DIST_DIR和PLAYWRIGHT_CHANNEL后：
`node scripts/audit-site-pages-js.mjs docs/evidence/press-ownership-js.json http://127.0.0.1:3167 button,chart,calendar,code-block`。
不改阈值、不缩窗口、不藏功能。48KBinitialMotion、8KBcompiled/item排共享runtime、
中端≥55fps与CLS<0.02仍缺真实证据。stagger0/0已闭，不外推所有循环20限制。

## 完整下一步与停止状态

固定pin96da9cc7f1aa10580a3741664e2a77c721206c00不动；冻结snapshot目录、
registry-snapshots.json、.gitattributes与起点无diff。当前174 sourceSha均a656074。
没有改依赖/lock/API/default/export/slot/registry id；全部relative imports、Base render、
cn userlast与P11保留。payload独立提交，最终handoff不触发刷新。

必须继续推进的整体余项：

- engine-runtime.md剩余表：menus/Select/Combobox实际checkbox/radio/context（Menubar真实
  delegation），Select measuredwidth/flight同目标clock、异步首帧和cleanup；
  Tabs/CodeBlock sharedprojection、floatingActions/两copy/expand/viewport各生命周期；
  Sidebar scalar/onUpdate，Calendar WAAPI，Embla，Recharts真实series/controllers；
  DocumentEntrance三个as的initial/offscreen/inheritedclock/settled/hydration/noJS/print。
  无实际GSAP writer，不造测试。
- 基础controls有限client已补；网络SSR/hydration按真实实例对账，生产已有Switch初始
  checked，不盲造pending。Switch resize第二rAF才有真实RO endpoint，不称第一帧已重测。
- timeScale0/负/非有限未认证。旧first.json包含clock0探索，不能当正时钟证据；
  公开合同未发现positive-only域，后续先实测，不能retroactively排除0或将0等同none。
  正clock8/4/2继续有效；physicalSpring0的Infinity与Motion默认fallback尚未在本步证明。
- 上述全部性能门仍OPEN；ADR009 NextAppRouter有效，ADR016仅研究，未擅自迁移。
- 58正式范围=56UI+2blocks、65items/58docs；API466、CSS/lifecycle、Combobox有限焦点、
  B1–B9旧gates、URL37axes/118options/21N/A、58页noJS与siteflow/catalog/sidebar/
  intensity/distribution/guides/T0templates原有authority不重置。AI25未排期、direction
  deferred、form/native-select/sonner exclusions不扩；不虚构MCP/Skill/release/deploy。
  最后仍须整个goal逐要求真实审计。

清理：本轮两个新raw重复文件在保留gzip且逐字节核对后已用原生PowerShell非递归删除。
先前被auto-review拒绝的48个旧.next-*目录与18个旧.cache文件仍在，未换工具重试，
不能声称全清理完成。保留必要全部source negatives、gzip、脚本、固定upstream缓存、
.next-motion-runtime和react19-consumer。新的两份check日志与当前生产原始输出有交接用途。
最终停止本轮3165 fixture；Playwright自行停止3167，3178由脚本finally关闭。
最终端口与git clean由实际工具复核。用户.next/3000未碰。

下一prompt：只开唯一下一实施会话，读本交接和engine表，选一个独立writer有边界推进
（优先menus/Select/Combobox实际indicator/context），保留并按shared变化复跑本组证据。
按source→registrybuild→完整check→实际production→proof→独立payload→完整handoff顺序
原子提交，不push/发布，不派代理，不自行开后继。整体goal继续OPEN；清理旧拒绝状态
如实保留，不重复制造同一caller排列，也不把API/CSS/fixture闭合外推全库Motion闭合。
