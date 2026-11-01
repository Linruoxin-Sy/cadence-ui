# 串行 parity 交接：T0 tier-specific docs template 闭合

D:/Code/Project/cadence-ui，2026-11-02 Asia/Shanghai。接替 registry-distribution.md。
本轮唯一实施，无新会话/子代理/并行实施、无 push、无部署/发布/标签操作。
本逻辑组完成后停止，由协调核实 completed/idle + git clean 再继续。整体 goal 未完成。

## Authority / commits

起点 b9d2503，git clean；e1a287f/ba1124d/0cbb6fa/b27394f/01035e2/2161a06/
9880c18/be06e1e/b9d2503 全保留。上一完整交接：registry-distribution.md；HTTP/JS evidence
及 catalog-sidebar/preview-variants/component-page-flow、架构研究交接继续适用。

- 3b8cd30：设计 §2、AGENTS/CONTRIBUTING、shared template gate、scaffold、真实 docs、
  tests、58页 inventory/evidence 与 parity-plan §8 本项闭合，原子 source commit。
- 最终 public payload 独立 commit；准确 SHA 见本交接末尾或 git log。
- 本完整交接独立 commit；不为 handoff build，不生成新快照。

固定 upstream pin 96da9cc7f1aa10580a3741664e2a77c721206c00 不移，Base UI 实装1.9。
58 components /65 items /58 component docs /38 animated suites /20 T0 suites 保持。
没有改 registry/cadence 源码、registry.json metadata、props/defaults、recipes、dependencies/lock。
shadcn skill只读参考；未调用 consumer init/add/apply/create/preset，未生成 components.json。

## 实际缺口与所选约定

实查全部58文档和scaffold/check/build：旧设计表把 title/preview site chrome也计为12，
AGENTS/CONTRIBUTING却说T0–T1九节/T2+十二节，而真实flat examples数量不固定。
20 T0中Resizable已有split responsive/performance，另外19个缺失；T1 Button也缺失。
原motion-docs只校验recipe table，registry build/check均未强制整个body结构。

采用 **tier-specific compact模板**，但所有tier仍必须有响应式/性能覆盖，绝不只删旧清单：
Installation、Usage首先；自由增补flat examples；When to use、When not to use、API、
Motion contract、a11y/keyboard、ownership（适用时）、responsive/performance、AI、optional related。
T0–T1可在Accessibility涵盖native keyboard；T2–T5 UI与block必须覆盖keyboard与a11y，
可combined也可split且a11y/keyboard两节顺序兼容既有文档。Responsive/performance也可
combined或有序split。所有required sections一次且非空；没有9/12总数限制。
Only API允许### inline-code parts；无Examples wrapper、其他nested/H1/Setext/HTML headings。
Fences/comments/inline-code examples不误判。Block既有combined段落和早期ownership保持合法。
明确input ID集合执行ownership要求；新input scaffold --input，实施新API时须登记集合。
结构gate不声称能证明prose真实性或自动推断新组件业务语义。

新增19个T0+Button性能段落根据真实source/API解释：Card可选ResizeObserver即时测量、
Field container query、Textarea CSS field-sizing无JS auto-grow fallback、Avatar Base加载、
ScrollArea Base/native scroll、Table无virtualization、调用方layout/overflow责任。
T0不是零JS：无authored animation runtime/插值，仍可有Base/native/observation client行为，
composed children保持自己的motion。4KiB gzip是own source预算，非dependency/app bundle零字节。
Resizable既有完整section保留；没有虚构全库性能或no-JS交互认证。
Select/Combobox补真实caller data/validation ownership；两个menu API中的Items/Structure
改为实际part inline-code组名，匹配既有“API内###只分parts”规则，不改其功能。

## 强制入口 / 验证

scripts/doc-template.mjs被build-registry、check-registry调用，后者是pnpm check真实路径。
new-item生成所有tier所需段落，写入前用同一gate校验；输入组件可--input。
既有58 docs recipe校验与38 animated runtime-helper mandatory reporter全保持。
visibleLines共用fence/comment忽略规则，并保留comment换行以给准确body行诊断。

新增 tests/lib/doc-template.test.tsx **26 tests**：

- 58实际body全通过；extra examples、API inline-code parts、comments/fences合法。
- 实际node check-registry进程负例：缺required/performance/ownership/keyboard、opening与
  later order、Examples包装、nested/H1/deep/non-part API、Setext/HTML、duplicate、empty、
  combined+split冲突均exit1并包含source path。真实build进程也在写payload前拒绝缺段。
- T0–T5各跑真实new-item，然后真实check入口接受其body；其未实现source/payload stub仍
  如预期失败，未声称stub是完成组件。删掉其performance再次得到真实path诊断。
  Fixtures复制retention inventory并保留隔离条件，绝不改写旧snapshot。
- Card/Input/Resizable/Button/Dialog/DataTable/Attachment用next-mdx-remote+site GFM编译并
  renderToStaticMarkup，断言真实HTML table与required headings；不是新browser layout审计。

Targeted含旧motion-docs：46/46 /2 files /16.05s，.cache/doc-template-tests.log。
初始HTML guard误计Card inline-code h3示例，已排除inline code；另初次typecheck揭露测试
loop tuple可undefined，改as const。两处修复后全门禁通过，没有跳过/放宽配置。
首次source/content build后完整check **593/593 /81 files /82.35s /exit0**，
.cache/doc-template-{registry,check}.log；type/lint/registry/parity58/P11/budgets/runtime保持。
source3b8cd30之后再次registry build和完整check，最终结果见末尾。

持久evidence：docs/evidence/doc-template.md 与 doc-template-inventory.json（58页所有##）。
本轮无UI/animation源码修改，未机械重复全库browser或JS预算；MDX代表HTML渲染覆盖本轮需求。
没有生产build，不碰用户.next/3000/tsconfig，无服务启动或遗留。低内存Vitest MAX2/MIN1。
UTF8/LF作者文件；Biome只检查改动文件，git diff --check干净。

## Distribution invariant 保持

132 current资源。最终JSON去掉docs/sourceSha后与起点递归比较 **零差异**；60个JSON变更
仅文档/sourceSha（含catalog/registry）；item sourceSha统一3b8cd30。MD/llms文档随build更新。
public/r latest仍ETag revalidate；没有修改handler/cache/四guide，也不声称本轮重跑HTTP。
快照84cc78703b354b29c815c3970cb26973e4760dea398fdf48756b8a24c996b2f1固定目录/bytes、
registry-snapshots.json inventory及.gitattributes -text全部不变。build/check均验证retention。
普通build不freeze，不为handoff创建快照，不把frozen旧文档作为current freshness对象。
保留所有依赖closure/immutable alias语义与隔离fixtures复制retentioninventory的条件。

## 下一唯一逻辑组 / 完整 open

下一实施先读本交接、registry-distribution/evidence及前序研究交接、AGENTS、parity-plan §8、
animation-system/overall-design/site-distribution/ADR与适用skills。
**下一组：全库兼容性逻辑组**。先核对所有58组件真实Base/types surface与既有局部证明，
聚焦callback求值/caller-last、render element/function、React19 cleanup、native events；
不要重做本轮template或把局部历史gate当全库认证。按有界逻辑组独立source/public/handoff。
没有本会话创建后继，协调核实idle/clean后再继续。

所有open原样带入：

1. initialJS预算120000仍OPEN。最近真实值 **291423 gzip bytes /23 scripts**，
   docs/evidence/registry-distribution-js.json；本轮未重测、不声称delta0实测。
   历史baseline290171保持。保留actual install-control layout/generic animate/fold边界研究，
   完整shell+route hydration prototype gate：SSR/search/navigation/package-manager/source/
   installcopy/preview/modes/focus/a11y与全部自动JS≤120000一起通过才closed。
   ADR009仍Next App Router，ADR016只研究；不抬限/删SSR或功能/排chunks/改观察窗凑数。
   ordinary120492/install136462失败子集不是产品采纳。
2. 全库Base实际types/callback求值、callerlast、render element/function、React19 cleanup、
   nativeevents仍OPEN；native useRender.ComponentProps仅string/object，不伪造callback。
   B1–B5局部证据/静态parity/runtime helper不是全库兼容性证明。
3. 全库CSSpopup nestedclock、none首帧/livecancel、full→reduced去geometry保留opacity；
   Navigation/Sheet/Dropdown/Popover/B5局部证明不豁免其他part。
4. Motion same-target running动画不因transition prop更新自动cancel；继续livecancel/
   nestedfull/none首帧审计。ControlSpan/helper adoption非全库proof，不强制remount/丢focus。
5. B5Combobox inert outsidepointer dismiss/activation、Tab/ShiftTab、nestedownership/cleanup
   真实兼容仍OPEN；axe0不能替代。B1–B9及已closed §8、contractdrift/parityprops gates保持。
6. AI25unscheduled、directiondeferred、form/native-select/sonnerexcluded不扩。Attachment/
   Bubble无新增包不等于全部AI prerequisites完成；无Cadence MCP/已分发Skill/release/
   hosting实现或授权，不虚构。
7. 37轴/118选项/21不适用URLmatrix、58页真noJS、index/sidebar语义、source/TOC/prevnext/
   Edit/installcopy/mobiletables、highlight readiness/cold lifecycle保留；不声称本轮全库复验。

继续relativeimports/sharedlib/namespaceddeps/P11UIonly/tokens/reduced-none/Base render/
callerlast/refcleanup；固定pin与Base实际版本不移。禁shadcn消费端命令/配置，不弱化门禁。
每组source原子commit，final-source payload独立commit，handoff独立且不触发build。
本会话到此停止，不push，不标整体goalcomplete；由协调核实gitclean/completed-idle再继续。

## 最终 source / artifact / check

- Source **3b8cd30** 后 registry:build exit0：.cache/doc-template-final-registry.log。
- 最终完整 pnpm check **593/593 tests /81/81 files /83.41s /exit0**：
  .cache/doc-template-final-check.log。38 animated runtime-helper reporter与58 docs recipes保持。
- Public独立commit **639e329**，85 files；current item sourceSha统一3b8cd30。
  132 current资源，JSON排除docs/sourceSha后递归比较零差异，冻结目录/inventory无差异。
- 本交接随后独立提交，不为handoff再次build；准确最后SHA见git log。
  最终git diff --check与git status核实后停止，整体goal未完成。
