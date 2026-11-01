# 串行 parity 交接：历史 B2 gate closed，下一步只做 B3

工作目录 `D:/Code/Project/cadence-ui`，2026-11-02（Asia/Shanghai）。
本文件为最新权威交接，取代 b1-gate.md 的“B2 next”状态；旧文件保留供历史溯源。
用户授权持续按 docs/parity-plan.md 完成全部排期/收尾、原子提交、完整交接，不重复确认。
本会话为唯一实施会话，未创建会话/子代理/并行实施，未 push。交接提交、git clean 后停止。
协调必须先确认本会话 completed/idle，再创建下一唯一实施会话（用户指定 GPT-6.1 Sol High）。

## 当前状态与完整目标

- B0–B9 的58组件实现齐全；B1、B2、B6–B9 batch gates closed。
- **整体 goal 尚未完成**：历史 B3/B4/B5 gates、全部 §8 tooling/site/metadata 与跨库
  callback/render/ref/nativeevents/CSS popup clock/none 审计仍 open。
- 下一唯一会话只完成历史 **B3** 八项：checkbox、radio-group、switch、slider、toggle、
  toggle-group、input-otp、progress。完成后保存完整 B4 onward handoff 并停止，不开始 B4。
- 之后协调串行创建 B4（dialog、alert-dialog、sheet、drawer、popover、tooltip、hover-card），
  再 B5（dropdown-menu、context-menu、menubar、select、combobox、command、toast），再 §8。
- 不以“58项实现齐全”结束整体目标；B1/B2/B6–B9 closed 不无故重开。
- 65 registry items；58 documented = 56 ui + 2 blocks，58 docs、59 previews、58 pinned surfaces。
- 固定 pin `96da9cc7f1aa10580a3741664e2a77c721206c00`，不得移动。

## 本轮提交与真实修复

起点 main `6f5635e`，开始 git clean。B1 source `288239d` / payload `922d33c`。
B2 source/docs/tests/preview/plan commit **`58c96b9`**。
Final source 后 rebuild/check 的 payload 独立提交 **`310a295`**；
`public/r/*.json` sourceSha 为 `58c96b9`。本文件为第三个独立 handoff commit，不为 handoff 再 build。

1. 核对九份 `.cache/shadcn/base/<id>.tsx` 真实 pinned source、manifest 与 installed Base
   Separator、Button、useRender 类型；`pnpm exec shadcn docs` 获取九项官方 docs/examples 链接。
   同 pin 的九份真实 guide 缓存 `.cache/b2-upstream/<id>.mdx`。没有 init/add/apply/create/preset。
2. ItemSeparator、ButtonGroupSeparator、InputGroupButton 原来 cn(raw function) 丢失 Base
   `className(state)`。现在先求值再 cn，caller last；style callback 仍交 Base/Button 求值。
   Item、BreadcrumbLink、ButtonGroupText 是原生 useRender.ComponentProps，字符串/对象，
   不伪造回调 API。原生事件合并、render element/function、ref cleanup 已单测。
3. PaginationPrevious/Next 恢复上游允许的 `size` 类型，默认仍 default，可覆盖 sm/lg。
   Pagination 继续普通 anchor + buttonVariants，保留链接语义，不引入 Button 的 role=button。
4. Alert description /90 destructive 透明度导致 axe contrast light4.23/dark4.41，
   改完整 destructive token；Action 使用第三 grid column，避免与标题/正文共享列覆盖文字。
   保留全部 props/exports/defaults/slots；没有新 parity deviation、依赖、runtime 或 recipe。
5. Empty/Item preview 手机单列；Alert/Item 过期数量更新58components/65items。
   Field preview 宽度可实际跨 responsive container breakpoint；Toggle supplied error 仅演示调用方
   提供 invalid，快速切换不改变输入值/节点，不新增验证/orchestration。
6. Spinner source 无须修改：唯一 data.transition continuous animate-spin，设计 §3.2 单glyph
   rotation exception 明确 full/reduced 都旋转（包括 OS reduce），none animate-none 静止。
   八个 T0 根保持无 provider/data-motion，子 Button 自有 feedback.press 不属于父级 recipe。
   Spinner preview 局部 mode selector + 首次渲染即 none 的实例用于真实行为验证。

## 本轮验证与不提交的证据

- 初步完整 check：453 tests/70 files，`.cache/b2-initial-check.log`（94.28s）。
  新增 `tests/components/b2-compatibility.test.tsx` 3 tests；全部旧测试保留。
- Final source `58c96b9` 后 `pnpm registry:build`：65payloads/58components，
  `.cache/b2-final-registry.log`；`pnpm check` 最终 **453/453 tests、70/70 files 全通过 (113.27s)**，
  `.cache/b2-final-check.log`。
  typecheck/Biome/registry freshness/P11/全部 gzip tier budgets/parity58 surfaces 均通过。
  唯一既有 lint warning 为 Item preview img。没有改配置或弱化检查。
- 隔离生产 `.next-b2-gate` build 成功69pages，`.cache/b2-review-build.log`。
  check 与 build 顺序，低内存设置 VITEST_MAX_FORKS=2/MIN=1；build RAYON_NUM_THREADS=2、
  NODE_OPTIONS=--max-old-space-size=768。Next 自动 tsconfig 格式/include 差异核实后 restore。
- Edge/msedge、workers2、自管空闲 port3135：
  `node node_modules/@playwright/test/cli.js test tests/e2e/b2.spec.ts --workers=2`
  **30/30 passed (1.9m)**，`.cache/b2-review-e2e.log`。
- 六个 Spinner mode×OS 测试逐 rAF 采样真实旋转矩阵；none 所有帧 transform none/0animations，
  full/reduced 确实旋转、opacity1。MutationObserver 从首次插入检查独立 initial-none 实例，
  无初始动画；live none 取消；outer none/local full 恢复；OS reduce 切换保持旋转；同节点。
- 六个 native mode×OS 测试逐八页：pointer press实测子Button full scale<.99，reduced/none=1；
  Enter/Space 与focus-visible ring；原生 anchor Enter URL/current-page；label/addon点击focus；
  输入值、selection、390resize保持焦点同节点；Field responsive实际row/column与rapid invalid4次。
  八个 T0 根getAnimations=0。没有为静态组件伪造popup/exit/layout动画证据。
- 十八个 visual cases = 九页×两主题，各1280/390，全页 axe WCAG2A/2AA/2.1AA零违规，
  无disabled rules、document横向溢出、pageerror。36全页+36preview截图全部逐张review。
  `.cache/b2-proof/<id>-<light|dark>-<1280|390>[-preview].png`，
  `review-<id>[-preview].jpg` 四图拼排：light1280/light390/dark1280/dark390。
  文档表格/代码允许内部横滚，document不溢出；没有长图重复段。
  Item外部image响应固定小SVG，避免外网抖动影响视觉。
- 最后加入 Alert 文字right<=action.left、ButtonGroupSeparator实际高度>0，四个现有visual
  cases重跑 **4/4 (15.9s)**，`.cache/b2-geometry-e2e.log`；不是34个不同测试。
- 首轮28/30，两主题Alert contrast失败，`.cache/b2-gate-e2e.log`；修原因后完整30/30通过，
  不将失败轮计为通过。最终Alert/Field图已重新review。缓存/截图/隔离build不提交。
- 检查过3000/3135监听；本轮未操作用户3000服务，3135由Playwright自管退出。
  `git diff --check`通过。最终gitclean与提交列表在最终回复。

## 继承的 closed 历史边界

完整历史证据保留在 `docs/handoffs/b1-gate.md`，后半B9“本轮”仅指历史B9，不是新任务。
B1 Input/Separator/Avatar callbacks、Card ref测量、Skeleton opacityloop、Button press 已修并证明。
B8 Button/Popover、历史Sheet/Dropdown有局部 callback/clock修复；不据此关闭全库。
B6 DataTable (`d07f08d`, @tanstack/react-table9.3.1)，B8 DatePicker (`08899b7`，
date-fns4.1.0/react-day-picker9.13.2)保持closed，受控语义/ownership详见B1 handoff。
Attachment `e32cb11`、Bubble `9f28070`、payload `258c73c`，B9联合gate closed。
B1最终check曾既有CodeBlock1s异步高亮timeout449/450，未改组件/测试/阈值，完整原配置retry450/450
通过，日志在B1 handoff。不能据此假定本轮CodeBlock坏或偷改。

## 必须完整保留的 open 工作

1. **历史 B3–B5 gates**：按真实batch逐项核对upstream/installed API、source、tests及旧证据，
   补真实mode×OS、keyboard/focus/pointer、rapid changes/resize、双主题desktop/mobile全页axe与
   逐张截图review，特别B5旧select/menu；B1/B2/B6–B9不无故重开。
2. **§8 tooling**：逐组件 Motion contract 表和 content/docs/motion.mdx recipe catalogue机器核验；
   强制 expectMotionContract() helper；/components/button初始JS≤120KB gzip实测记录。
3. **§8 site**：preview variant/code view、install copy、search+category/intensity/complexity filters、
   TOC/prev-next/Edit this page、immutable /r/[...path]、missing guides；**站点**sidebar landmark/
   aria-controls/height-animation（不是registry Sidebar）。部分可能已实现，必须实际审计再关闭。
4. **§8 metadata/docs**：intensity维度定义/一致性；T0 responsiveness/performance承诺与模板强制。
5. **跨库callback/render/ref/nativeevents**仍open：所有继承Base类型的部件按真实类型查class/style
   求值、callerlast、render、React19 cleanup、nativeevents；原生useRender是字符串/对象。
   B1/B2和既有局部修复不替代全库证据。
6. **历史CSS popup** nested clock/live downgrade/none首帧仍需全库审计。Navigation/Sheet/Dropdown/
   Popover局部已修不代替Select/menu；none不是reduced。每个portal本地clock，嵌套full可恢复。
7. 旧contract drift§7.4、parityprops§7.6保持closed；静态提取限制不代表已覆盖真实类型。
8. AI25项unscheduled，direction deferred，form/native-select/sonner excluded，不扩大范围。
   未排期AI prerequisites按真实API需要处理，Attachment/Bubble无需新包不能全局关闭prerequisites。

## 下一会话约束与命令

先完整读本文件、AGENTS及适用design记录、只读shadcn技能。保持固定pin、相对imports/sharedlib/
namespaceddeps/cn用户last/Base render/data-slot/token recipes。每个动画保留reduced JSX/data-motion，
full/reduced/none真实分支；新motion形式先编辑animation-system；无timer或为动画重挂。P11 UI-only。

先查空闲port，不碰.next或用户3000服务。不修改配置弱化检查，保留旧测试。UTF8/LF，Biome仅改动文件。
源码/content/meta修改后 registry:build 再 check。低内存顺序执行（不要check/build并发）：

```powershell
pnpm registry:build
$env:VITEST_MAX_FORKS='2'; $env:VITEST_MIN_FORKS='1'
pnpm check
$env:CADENCE_DIST_DIR='.next-b3-gate'
$env:RAYON_NUM_THREADS='2'; $env:NODE_OPTIONS='--max-old-space-size=768'
pnpm exec next build
# 核实Next自动tsconfig差异，仅restore本轮生成内容
$env:PLAYWRIGHT_CHANNEL='msedge'; $env:PLAYWRIGHT_PORT='<空闲port>'
node node_modules/@playwright/test/cli.js test <真实spec> --workers=2
```

在实现变更内更新parity-plan，准确区分implementation与gate；source+docs/tests/plan独立commit，
从final source rebuild/check后public独立commit，完整handoff独立commit，不为handoff再build。
确认gitclean后报告实际SHA/测试/证据与下一handoff路径并停止；不push，不创建会话/子代理/并行实施。
协调负责idle后创建下一会话；**不得标记整体goal complete**。
