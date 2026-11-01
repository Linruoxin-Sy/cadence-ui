# 串行 parity 交接：initial JS 已实测，预算仍未达标

工作目录 `D:/Code/Project/cadence-ui`，2026-11-02（Asia/Shanghai）。
本文件接替 `highlight-reliability.md`；历史交接与提交保留。
本轮唯一实施会话，未创建会话/子代理/并行实施，未 push，未请求重复确认。
**B1–B9 gates closed；整体 goal 未完成。initial JS 项仍 OPEN，不得写成 closed。**
协调核实 completed/idle、git clean 后再创建下一唯一会话；本会话交接后停止。

## 提交与范围

起点 `bd985e6`，git clean。implementation `698c728`：只增加真实 production 浏览器预算门禁、
gzip 去重 helper/unit test、证据、设计检查方法与 parity-plan 记录。没有保留生产源码/依赖/config修改。
Payload `f10451e`，60 个 JSON 仅 sourceSha 更新为 `698c728`；完整交接独立 commit，不为它再 build。
固定 upstream pin `96da9cc7f1aa10580a3741664e2a77c721206c00` 不变，Base UI 1.9.0；Next16.4.3/React19.3.1。
58 components /65 registry items /58 docs /38 animated suites /20 T0 structural suites继续保持。

## 关键结果：未达标，不隐瞒

`/components/button` baseline **290,171 bytes gzip /22 scripts /290.171 decimal KB**。
Final-source production ****290,171 bytes gzip /22 scripts /0 page errors****。预算 **120,000 bytes**，仍失败；即使按120KiB=122,880也失败。
Next16.4.3实际build报告没有旧版First Load列。仅rootMainFiles五个文件132,767bytes已超预算。
每个请求路径、body SHA256、raw/gzip bytes、parser/script initiator、root manifest文件清单均已提交：
`docs/evidence/site-js-budget.json`；口径、可复核命令、最小fixture在 `docs/site-js-budget.md`。

真实 fresh Edge context + CDP cache disabled，无storage/scroll/interaction，等preview、networkidle、
额外10秒观察、再networkidle。计入全部Script response，包括20 parser脚本及2自动import。
绝不排除prefetch触发的脚本（本轮采用保守全计），因此无需猜某个chunk是否属于其他路由。
按绝对URL去重，再逐个decoded HTTP body使用Node gzipSync默认level6压缩求和，禁止合并压缩。
只度量external JS bundles；HTML内theme/bootstrap/RSC序列化数据不是被减掉的外部chunk。
这是明确外部JS bundle预算，非全资源/HTML传输预算。有限观察窗不是任意未来timer的证明；无产品代码
被改为推迟到观察窗后加载。未删除控件/预览/SSR/hydration，也未推迟首屏功能来假达标。

`test:site-js` = production build + `site-js-budget.spec.ts`，`test:e2e`也自动包含这个强制失败测试。
门禁输出完整JSON attachment，要求manifest BUILD_ID/root响应gzip和SHA与本地生产文件一致，
所有脚本200、无pageerror、总量≤120000。当前退出1正是预算失败，不能把其他检查通过当作此门禁绿。
`pnpm check`独立type/lint/registry/parity/unit仍绿。

## 实际尝试和反例

- 原client catalogue已经按`dynamic()`拆分；不能声称原实现静态导入了所有预览。
- 把catalogue静态导入移到server、选择一个preview作frame children，实测 **674,973 bytes**，更差。
- server按id native async import再传children，实测 **691,557 bytes**，更差。
  两种方案均已完全撤回，ADR草稿也撤回；不能只看RSC源码就宣称依赖分包成功。
  本地 `.cache/js-budget-rejected-server-load.patch`保留后一失败实验；不提交失败产品变更。
- 同源`next build --webpack`实测 **288,719 bytes**，仍失败；没有偷偷更换默认bundler。
- `.cache/js-floor`最小fixture只有html/body与一个hydrated React计数button，继承parent Next config、
  同安装依赖，无Cadence/site chrome；production实际browser **135,551 bytes**，root131,598。
  最小fixture内容/命令在测量协议中，可重建。此证据说明仅优化preview不足以达标，
  **不是所有可能版本/config的数学下限证明**；继续框架/runtime边界调查仍有必要。
- 未实施任意框架替换/React兼容层/删除Motion/native控件替代，不以损坏parity/体验换数字。

## 验证与产物

- pre-source registry build `.cache/js-budget-registry-build.log`；完整check `.cache/js-budget-check.log`
  **559/559,77/77 files,71.96s**。初次check在修改的design表格format停止，格式化该文件后通过。
- final-source registry build `.cache/js-budget-source-registry-build.log`；check
  `.cache/js-budget-source-check.log`：**559/559,77/77 files,72.25s，exit0**。
- final-source production `.cache/js-budget-final-production.log`，隔离`.next-js-budget-final`，
  RAYON_NUM_THREADS2、NODE_OPTIONS768MB；实际browser gate `.cache/js-budget-final-browser.log`：**预算断言预期失败，290171>120000，exit1；manifest/root hash、200响应与pageerror断言先通过**。
- 为持久化请求attachment，以JSON reporter再执行一次同门禁（不是retry到绿），仍exit1，无skip/flaky。
  `.cache/js-budget-final-browser-report.json`内attachment解码为`.cache/js-budget-final-requests.json`；
  BUILD_ID=`FY8YdajUVwGZd7ucvlpS5`，22条URL路径/gzip/SHA256与已提交baseline清单逐条完全一致。
  final-source测量因此可用同一份已提交清单复核；不以旧baseline替代final build/browser执行。
- 浏览器无生产UI改动；本轮不机械重复全库交互/axe/截图，也不将测量通过readiness当作交互审计。
  所有旧tests、recipe/helper门禁、高亮real cold/delayed五case保留。未放宽timeout/retry/config。
- Unit新增测试证明按URLdedup及逐entity gzip，保留自动chunk；真实预算负例由生产gate执行。
- payload递归剔除sourceSha比较：**60 files, nonShaDifferences=[], sourceShas=[698c728]**。git diff --check通过。
- UTF8/LF；Biome只格式化改动文件。低内存build/check顺序、Vitest MAX_FORKS2/MIN1。
  隔离production ports3198/3199，Edge/msedge，workers2；未碰用户.next/3000。
  Next自动tsconfig差异仅新增本轮isolated include及格式变动，核实后restore；实验服务已关闭。

## 下一唯一会话

先完整阅读本文件、`highlight-reliability.md`、AGENTS、parity-plan §8、animation-system §7、
overall-design、documentation-site-and-distribution、ADR及适用skills。
**预算尚未修复：下一步仍是initial JS框架/runtime/route依赖边界调查，不能直接跳过并宣称站点收尾完成。**
120KB限制不提高，不移除SSR/hydration/首屏控件、不忽略自动chunks、不改统计口径凑达标。
框架/runtime架构需要变动时先按design evidence记录决定，保留全部站点/组件功能与真实三mode/a11y。
若有可行实现，再按baseline→optimization→final-source production/browser门禁证明闭合。
站点审计可作为后续独立项，但不能靠它覆盖预算open事实；本会话不创建后继、不push、不标goalcomplete。

## 必须完整保留的后续open

1. §8 tooling：docs recipe/helper/highlight reliability closed；initial JS实测完成但预算仍open。
2. §8 site全部承诺实查：preview variant/codeview/installcopy，search+category/intensity/complexity
   filters，TOC/prevnext/Edit，immutable /r/[...path]，missingguides；sidebar landmark/
   aria-controls/heightanimation。部分可能存在，实际审查，不重复实现、不凭局部证据关闭全库。
3. metadata intensity定义一致性；T0 responsiveness/performance模板强制；mobileAPI窄列可读性。
4. 跨库callback/render/ref/nativeevents：按真实Base类型查callback求值/callerlast、render element/
   function、React19cleanup、nativeevents；原生useRender.ComponentProps仅string/object，不伪造回调。
   B1–B5局部证据、静态parity不能代替全库真实类型兼容。
5. 历史CSSpopup全库：nestedclock、none首帧/livecancel、full→reduced去geometry保留opacity。
   Navigation/Sheet/Dropdown/Popover/B5局部证据不是未审部件豁免。
6. 跨库Motion running-mode：transition prop更新不能保证same-target旧动画取消；ControlSpan和
   helper adoption不是全库证明。不能强制remount或丢focus规避。
7. B5Combobox inert outsidepointer dismiss/activation、Tab/ShiftTab、nestedownership/cleanup
   真实兼容实证保留open；axe0不是全兼容/全库证明。
8. 旧contract drift§7.4、parityprops§7.6、B1–B9保持closed；发现具体新缺陷仍修。
9. AI25unscheduled、directiondeferred、form/native-select/sonnerexcluded不扩；Attachment/Bubble
   无新包不代表全局AI prerequisites完成。

继续relativeimports/sharedlib/namespaceddeps/P11UIonly/tokens/reduced-none/Base render/callerlast/
refcleanup；只读shadcn禁init/add/apply/create/preset/components.json。固定pin/所有旧commits/tests保留。
38 animated suites真实三mode reporter及58docs recipe门禁不弱化，T0豁免。
source/content/meta变化先registry:build再check；source commit后final-source重建/检查public独立commit，
完整handoff独立commit，不为handoff再build。协调核实idle才创建下一唯一实施会话。
