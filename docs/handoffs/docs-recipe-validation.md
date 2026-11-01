# 串行 parity 交接：§8 docs-side recipe validation closed

工作目录 `D:/Code/Project/cadence-ui`，2026-11-02（Asia/Shanghai）。
本文件接替 b5-gate.md 的下一步指引；旧交接保留完整历史证据，先读本文件再读旧记录的适用部分。
用户授权继续 parity-plan 全部排期/收尾，原子提交+完整交接；本轮只做 §8 tooling 第一项。
唯一实施会话，未创建会话、子代理或并行实施，未 push，未重复请求确认。
协调核实 completed/idle、git clean 后创建下一唯一实施会话。用户指定 GPT-6.1 Sol High。

## 当前边界与提交

**B1–B9 gates closed，整体 goal 未完成。** 本轮只关闭 docs-side recipe validation。
expectMotionContract helper、高亮根因、JS 预算、站点、metadata 和跨库审计全部保留 open。
58 components / 65 registry items / 58 docs / 61 preview files / 58 pinned surfaces。
固定 pin `96da9cc7f1aa10580a3741664e2a77c721206c00` 不移动，Base UI 实际 1.9.0。

起点 `2107242`，git clean；继承 B5 source `e26cbfb` / payload `aaa2787`。
本轮 source **83d2de0**；从该 source rebuild/check 后 payload **b73a7bb**，sourceSha=83d2de0。
本文件为独立 handoff commit，不为 handoff 再 build。

## 实现、约定和入口

- `scripts/check-registry.mjs` 直接调用 `checkMotionDocs()`（`scripts/motion-docs.mjs`），
  所以 `pnpm registry:check` 与 `pnpm check` 都强制执行，非孤立未调用脚本。
  保留既有 `motion-manifest.mjs` 的源码实现形式检查和 animation-system §3 catalogue / §5 Recipe union 校验。
- 按 `## Motion contract` / `## Recipes` section + 指定 Markdown 表列解析，不全文模糊搜索。
  代码围栏（反引号和波浪号）、HTML 注释、普通 prose、API 表不充当 recipe 声明。
  `Token` / `Recipe` / `Recipe / cause` / `Recipe / tokens` 中 inline-code recipe 组成集合；
  duration/ease/spring/distance 命名空间为 timing tokens，不当 recipe。
  T0 支持空 Token 表及 Mode / Authored motion、Mode / Animated properties 静态表。
- 集合比较涵盖 registry meta.motion、frontmatter motion、实际合同表、runtime recipe catalogue；
  guide Recipes table 同 runtime catalogue。缺失、额外、未知、重复声明、重复表/section、无表、坏行有路径诊断。
  recipe 可在不同阶段重复，单 cell 重复/meta/frontmatter 重复/guide catalogue 重复都失败。
  不引入虚假的 cm.transition 调用；continuous、CSS popup、engine、composition 原有实现边界不变。
- 先修改 design record `docs/documentation-site-and-distribution.md` §2.1，明确表列与 prose 自由边界。
  `new-item.mjs` 现在为所有 --motion recipes 生成行（以前只写第一个），T0 生成静态表。
- 首轮发现 Button 表内只有 spring.press，Skeleton/Spinner 表内只有 animate-*；recipe 只在表外 prose。
  对照源代码、animation-system 与连续形式后，把真实 recipe 补进表格。Carousel 新增 Recipe 列，
  保留完整行为说明和依赖 Button 自有反馈边界。NavigationMenu / Table 的既有表头直接支持，未无故改文档。
  无 runtime / metadata / dependency / export / motion form / upstream pin 改动，不靠 metadata 掩盖实现漂移。
- parity-plan §8 同 source commit 闭合本项并记录验证，其他项目未关闭。

## 验证与证据

- 新 `tests/lib/motion-docs.test.tsx` **19 tests**。正例遍历 58 真实文档，包含 T0、显式组合、
  continuous CSS、CSS popup、engine forms；多阶段 recipe 重复是合法场景。
  负例修改隔离临时 fixture，通过真实 `node scripts/check-registry.mjs` 子进程断言 exit1 与具体诊断：
  missing/extra/unknown/duplicate、missing/duplicate section、missing table、frontmatter drift/duplicate/非法类型、
  guide missing/unknown/duplicate/missing table。还有 prose/API/comment/fence 不误读、meta duplicate 和
  真实 new-item T0/多 recipe scaffold 校验。保留旧 tests 与 commits。
- 首次专测 17/19：Vitest it.each 数组被展开导致 scaffold 参数错误，改成 object case 后 **19/19**。
  不是改阈值或重试侥幸通过。首次完整check在 Biome 的 design Markdown fence 表格对齐停止，格式化该文件后通过。
- Source commit 前 `pnpm registry:build` + 完整 `pnpm check` **493/493，74/74 files，66.32s**：
  `.cache/motion-docs-build.log` / `.cache/motion-docs-check.log`。
  Final source 后严格顺序再 build/check：`.cache/motion-docs-source-build.log` /
  `.cache/motion-docs-source-check.log`，**493/493，74/74 files，65.96s**；typecheck、Biome、registry、
  gzip tier budgets、P11、parity58 surfaces 全通过。既有 Item img lint warning 与 Base act warnings 保留。
  CodeBlock 两轮通过仍不代表历史1s timeout根因解决，后续必须调查。
- 四份实际改动 MDX 的 Motion contract，用 `next-mdx-remote/rsc` compileMDX + remarkGfm（同站点编译栈）
  编译，renderToStaticMarkup 后 Edge/msedge 渲染，断言 4 tables 及每行列数完整。
  `.cache/motion-docs-render.mjs` / `.html` / `.png`；已逐表视觉检查无丢字/坏行。
  预览 HTML 使用局部可读 CSS，仅证明真实 MDX 表内容与结构无损，不冒充全站双主题截图或完整 e2e。
  初次 render 脚本使用未导出的 rsc.js import，修成包公开 rsc 入口后成功，未改依赖。
- 本轮仅校验工具与四份表格，未改组件/站点运行逻辑，因此未重跑全浏览器矩阵或 production build。
  未碰 .next / 用户3000 / tsconfig，低内存 tests MAX_FORKS2/MIN1，未并发 check/build。
  `.cache` 证据不提交；public 65 个文件独立提交，仅 sourceSha 与对应 docs/聚合内容更新。

## 继承的 closed gates 和审计边界

完整历史在 b1-gate.md / b2-gate.md / b3-gate.md / b4-gate.md / b5-gate.md 及 parity-plan。
DataTable/DatePicker 现归 B8；Attachment/Bubble B9 closed；不无故重开 closed gates，但发现具体新缺陷必须修。
B5 的 ComboboxFocusSafety 为 Base1.9 typeable aria-hidden 背景补 inert，不能据 axe0 当全兼容证明。
跨库审计必须保留 outside pointer dismiss/activation、Tab/ShiftTab、nested popup ownership、cleanup 等真实兼容路径。
B1–B5 局部 callback/clock/livecancel 证据不替代未审全库，不以静态 parity 提取代替真实类型兼容。

## 必须完整保留的 open 工作：§8 onward

1. **§8 tooling**：docs-side recipe validation 本轮已闭合。下一步强制 expectMotionContract() helper，
   真实采用并强制新组件调用；随后调查 CodeBlock highlight 可靠性和 /components/button 初始 JS≤120KB gzip，
   必须实测并按结果修复。不要跳到站点功能或以局部测试关闭全库审计。
2. **§8 site**：preview variant/code view、install copy、search+category/intensity/complexity filters、
   TOC/prev-next/Edit this page、immutable /r/[...path]、missing guides；站点sidebar landmark/aria-controls/
   height-animation（不是registry Sidebar）。部分可能已存在，实际审计后关闭，勿重复实现或凭旧文字假设缺失。
3. **§8 metadata/docs**：intensity维度定义/一致性；T0 responsiveness/performance承诺与模板强制。
4. **跨库callback/render/ref/nativeevents**：所有继承Base类型的部件按真实类型查callback求值、callerlast、
   render element/function、React19cleanup、nativeevents。原生useRender.ComponentProps只string/object，不伪造回调。
   B1–B5及既有局部修复不能替代全库审计；不能以静态parity提取通过代替真实类型兼容。
5. **历史CSS popup全库审计**：nested clock、none首帧/livecancel、full→reduced去geometry保留opacity。
   B5受本轮证据关闭本批gate；Navigation/Sheet/Dropdown/Popover等局部证据仍不是未审全库的豁免。
6. **跨库Motion running-mode审计**：仅更新transition prop不能保证same-target旧动画取消，B3/B5证实。
   按真实组件行为选修复，ControlSpan不是全库证明；不得为模式强制remount或丢focus。
7. **CodeBlock async highlight可靠性根因**：B1/B3重复1s timeout后原配置完整retry通过，不算根因解决。
   不弱化阈值、不永远重试到绿、不无故重开B9。移动API表内部能横滚但窄列难读，§8站点审计必须处理。
8. 旧contract drift§7.4、parityprops§7.6保持closed；静态提取限制不代表真实类型已全部覆盖。
9. AI25项unscheduled、direction deferred、form/native-select/sonner excluded，不扩大范围。
   未排期AI prerequisites按真实API需要处理，Attachment/Bubble无需新包不能全局关闭prerequisites。

## 下一唯一会话：expectMotionContract helper

先完整读本文件、AGENTS、parity-plan §8 与适用 design record/技能；实际查现有测试后设计 helper。
必须真实采用并强制新组件，不做未调用 helper，也不能只检查 data-motion 而漏 reduced/none transform 证据。
本轮不实施 helper，交由协调核实 idle 后建立下一唯一实施会话。不要创建会话/子代理/并行实施，不 push，
不重复确认，不标整体 goal complete。后续工作按真实依赖继续串行，不丢失上述 open 项。

仍遵循 relative imports/shared lib/namespaced deps/P11 UI-only、Base render 非 asChild、caller last、
data-slot、tokens、reduced/none 与 motion conformance；新 motion 形式先 design。只读 shadcn，
禁 init/add/apply/create/preset/components.json，pin 不移动，保留旧 tests/commits。
UTF8/LF，Biome 仅改动文件，单测用 .test.tsx。内容/meta/shipped 变化先 registry:build 再 check，
source 原子提交后 final-source build/check 的 public 独立 commit，完整 handoff 再独立 commit，不为 handoff build。
低内存顺序 check/build：VITEST_MAX_FORKS2/MIN1；production 需要时隔离 CADENCE_DIST_DIR、
RAYON_NUM_THREADS2、NODE_OPTIONS=--max-old-space-size=768；Edge/msedge workers2，查空闲 port，勿碰 .next/3000。
Next 生成 tsconfig 差异核实后仅 restore 本轮。验证按实际改动选，不弱化配置/阈值，不无限 retry 到绿。
