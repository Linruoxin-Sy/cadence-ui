# 串行 parity 交接：CodeBlock async highlight reliability closed

工作目录 `D:/Code/Project/cadence-ui`，2026-11-02（Asia/Shanghai）。
本文件接替 `motion-contract-helper.md` 的下一步指引；历史交接与提交保留。
本轮唯一实施会话，只处理用户指定的高亮可靠性；未创建会话/子代理/并行实施，未 push，未重复确认。
协调核实 completed/idle、git clean 后再建立下一唯一实施会话。本会话提交交接后停止。
**B1–B9 gates closed；整体 goal 未完成，不标 complete。**

## 起点、提交和范围

起点 `7e400b0`，git clean；继承 implementation `236018f` / payload `33967bd`。
本轮 implementation **65ecc76**：仅测试与 parity-plan §8，无生产源码/content/metadata/依赖/配置改动。
Final-source payload **1bd34d4**；60 个 JSON 仅 sourceSha 更新为 **65ecc76**。
本文件为独立 handoff commit，不为 handoff 再 build。

58 components / 65 registry items / 58 docs / 38 animated suites / 20 T0 structural suites。
固定 pin `96da9cc7f1aa10580a3741664e2a77c721206c00` 不移动；实际 Base UI 1.9.0。
本轮没有做 JS 预算、站点功能或跨库审计；不以此关闭其他 §8 项。

## 失败证据与根因边界

实际读取 `.cache/b1-final-check.log`、`.cache/b3-precommit-check.log`、`.cache/b3-final-check.log`。
同一 CodeBlock `highlights a string source once it is given a language` 断言在 1281/1181/1044ms
失败：查询带 `--shiki-light` style 的 token 仍为 null，DOM 仍有原始完整源码。原完整 retry 通过不作根因证据。

旧测试在 render 后立刻启动 Testing Library 默认 1s waitFor，未同步任何 readiness。
该时钟同时承担 hook 的动态 `import("./highlight")`、Shiki core + 两个 theme、按需 TS grammar、
首次 tokenizer 与 React commit。测试目的为正确高亮，却隐含了冷加载吞吐量限制。
这是可证明的同步边界错误；历史日志没有逐阶段 timing，不能声称已定位当时某个 import 的实际耗时。
不将冷加载延迟当作取消竞态，不以当前机器 baseline 绿推断旧环境永远小于 1s。

检查了实际 Shiki 4.5.0 / @shikijs core + primitive 实现、Vitest 3.2.7、Testing Library React
16.3.3 / DOM 10.4.2。createHighlighterCore 的 async primitive 解析 themes/engine；项目 getCore
缓存 Promise，language 动态按需加载，语法解析与 tokenization 使用 JS regex（非 WASM）。
hook effect 按 language 清理 cancelled 标记，忽略旧请求；loaded.language 检查防止跨语言使用旧值；
render 读取当前 source，streaming cache 按语言/前缀重置，完成行与 grammar state 保留。
这些路径的新增真实引擎测试未发现生产缺陷，因此不强行修改生产 cache/API/源码。
core Promise 拒绝会保持拒绝缓存这一既有事实未改变；本轮不宣称支持同语言网络失败自动重试，
既有合同为 plain fallback，后续有效语言恢复的测试注入的是一次 loader delivery 拒绝。

## 修复与有意义复现

- `tests/components/code-block.test.tsx` 在 beforeAll await 真实 `loadHighlighter("ts")`。
  仅同步就绪，不替换引擎/grammar/token；原 DOM waitFor 断言、默认1s deadline、三mode helper均保留。
  若真实初始化失败，setup 本身失败，不会悄悄变成 plain-output 成功。
- `tests/components/code-highlight.test.tsx` 去掉 100/50ms 固定 sleep，使用 dynamicImportSettled +
  真实 loadHighlighter readiness；first paint 仍断言 plain，并新增 second paint highlighted。
  原 streaming settled-node identity、grammar state、themes、alias、unknown-language tests 全保留。
- `tests/lib/highlight-lifecycle.test.tsx` 五项新增测试：
  1. 用 gate 只延迟 loader delivery，真实 CodeBlock 进入 fallback；原 waitFor 默认1s断言
     **预期失败**，完整源码仍在。finally release 后调用真实 cold loader/tokenizer，真实 themed
     spans 出现，源码逐字符保留。未增加 timeout；不是 mock tokens 后声称真实高亮。
  2. 并发首次 python/py/json grammar 加载，共享真实 core，所有结果包含双主题 token 与完整字符。
  3. TS 请求未结束先切 JSON、同语言 pending 时更新 source，再倒序完成；当前文本为最新43，
     stale TS 完成不能覆盖当前 JSON markup；随后移除 language 立即回 plain。
  4. StrictMode 两次 effect delivery、卸载后完成、随后重新挂载：真实引擎结果仍可用。
  5. 注入 delivery rejection 验证 catch；真实 unknown language 仍 plain；有效 TS 恢复真实高亮。

受控 gate 和一次 rejected delivery 是异步故障注入；高亮和恢复始终走真实 Shiki，未 mock 整个模块。
延迟测试专门承担 cold fallback/真实异步/取消证据，setup readiness 不掩盖这些产品路径。
没有增加等待阈值、配置 timeout、retry、skip，没有弱化 reporter 或用 test-name 过滤掉三mode。
测试证明的是这些生命周期路径及同步可靠性，不是冷加载性能 SLA、浏览器首帧或全库取消审计。

## 验证

- 原配置未改 baseline 两文件 **29/29**，`.cache/highlight-baseline.log`（2.40s）。
- 初次 focused 三文件 **34/34**，`.cache/highlight-focused.log`（4.02s）；受控原断言确实
  timeout 后真实恢复，单 case 1204ms。随后补充 pending same-language source43 断言并更正名称，
  两次完整 check 都包含该最终测试版本。
- Implementation 前顺序 registry build/check：`.cache/highlight-build.log` /
  `.cache/highlight-check.log`，**558/558, 76/76 files, 71.30s**。
- Final source 后顺序 build/check：`.cache/highlight-source-build.log` /
  `.cache/highlight-source-check.log`，**558/558, 76/76 files, 71.37s**，exit0。
- typecheck、Biome、registry freshness/docs recipe/tier budgets/P11、parity58、38 suite三mode reporter
  全保留。既有 Item img warning、Base act/nativeButton warnings不在本轮扩大修复。
- 结构化比较60个变化 JSON，递归剔除 sourceSha 后 **nonShaDifferences=[]**；全部新 sourceSha65ecc76。
- 无生产源码或视觉变动，无需重跑浏览器矩阵/production build；未碰 .next、3000、tsconfig或服务端口。
  低内存顺序验证 VITEST_MAX_FORKS2/MIN1；Biome只检查/格式化改动文件，UTF8/LF。
  `.cache`日志不提交。git diff --check通过。

## 下一唯一会话：实测并修复初始 JS 预算

先完整读本文件、`motion-contract-helper.md`、AGENTS、parity-plan §8 和适用 design/skills。
只读 upstream pin/manifest 与 shadcn；不移动pin、不运行init/add/apply/create/preset、不创建components.json。
下一步实测 `/components/button` 初始 JavaScript **≤120 KB gzip**（animation-system §7）；
按真实 production route 请求/manifest/可复核 gzip 口径定位并修复，不能用 registry 单项预算或 production
build 成功代替 route initial-JS 实测。Next16新构建报告是否给出该数字须实查，不假设旧文本仍准确。
修复与计划记录同commit；final-source build/check的public独立commit；完整handoff独立commit。
不做站点承诺串行实施，协调核实 idle 后再创建下一会话；本会话不创建后继，不push，不标整体complete。

## 必须完整保留的后续 open

1. §8 tooling：高亮可靠性本轮closed；docs recipe/helper先前closed且门禁必须保留；button初始JS预算open。
2. §8 site全部承诺实查：preview variant/codeview/installcopy，search+category/intensity/complexity
   filters，TOC/prevnext/Edit，immutable /r/[...path]，missingguides；站点sidebar landmark/
   aria-controls/heightanimation。部分可能存在，实际审查，不重复实现或凭局部证据关闭全库。
3. metadata intensity定义一致性；T0 responsiveness/performance模板强制；mobileAPI窄列可读性。
4. 跨库callback/render/ref/nativeevents：按真实Base类型查callback求值/callerlast、render element/
   function、React19cleanup、nativeevents；原生useRender.ComponentProps只string/object，不伪造回调。
   B1–B5局部证据、静态parity不能代替全库真实类型兼容。
5. 历史CSSpopup全库：nestedclock、none首帧/livecancel、full→reduced去geometry保留opacity。
   Navigation/Sheet/Dropdown/Popover/B5局部证据不是未审部件豁免。
6. 跨库Motion running-mode：transition prop更新不能保证same-target旧动画取消；ControlSpan和
   helper adoption都不是全库证明。不能强制remount或丢focus规避。
7. B5 Combobox inert outsidepointer dismiss/activation、Tab/ShiftTab、nested popup ownership/cleanup
   真实兼容实证保留open；axe0不是全兼容或全库证明。
8. 旧contract drift§7.4、parityprops§7.6、B1–B9保持closed；发现具体新缺陷仍修。
9. AI25 unscheduled、direction deferred、form/native-select/sonner excluded不扩。Attachment/Bubble
   无新包不代表全局AI prerequisites完成。

继续relativeimports/sharedlib/namespaceddeps/P11UIonly、tokens/reduced-none/Base render/callerlast/
refcleanup；保留所有旧tests/commits。38 animated suites实际三mode reporter强制，20T0豁免。
定向验证也尊重门禁；不按名字过滤掉三mode后禁用reporter。任何source/content/meta改动先registry:build再check。
低内存check/build顺序，不并发；production必要时隔离CADENCE_DIST_DIR、RAYON_NUM_THREADS2、
NODE_OPTIONS768MB；Edge/msedge workers2，先查空闲port，不碰.next/用户3000。核实Next新增tsconfig
差异后仅restore本轮。不要机械重跑无关浏览器，不放宽配置/阈值，不无限retry到绿。
