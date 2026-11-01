# 串行 parity 交接：历史 B3 gate closed，下一步只做 B4

工作目录 `D:/Code/Project/cadence-ui`，2026-11-02（Asia/Shanghai）。
本文件为最新权威交接，取代 b2-gate.md 的“B3 next”；旧文件保留历史证据。
用户授权持续按 docs/parity-plan.md 完成全部排期/收尾、原子提交与完整交接，不重复确认。
本会话唯一实施，未创建会话/子代理/并行实施，未 push。git clean 后停止。
协调须在本会话 completed/idle 后创建下一唯一实施会话，用户指定 GPT-6.1 Sol High。

## 当前状态与下一步

- 58组件实现齐全；B1–B3、B6–B9 gates closed。整体 goal 未完成。
- 下一会话只做历史 B4 七项：dialog、alert-dialog、sheet、drawer、popover、tooltip、hover-card。
  完成 gate、完整 B5 onward handoff 后停止，不开始 B5。
- 再由协调串行创建 B5（dropdown-menu、context-menu、menubar、select、combobox、command、toast），
  然后全部 §8 tooling/site/metadata 与跨库 callback/render/ref/nativeevents、popup clock/none 审计。
- 65 registry items、58 docs（56 UI +2 blocks）、60 preview files（含新增共享scope）、58 pinned surfaces。
  DataTable/DatePicker 当前归 B8；不按历史旧称重开其 gate。
- 固定 pin `96da9cc7f1aa10580a3741664e2a77c721206c00`，未移动。

## 本轮提交及修复

起点 `f03de17`，开始 git clean。B2 source58c96b9 / payload310a295。
B3 source/docs/tests/plan **bfb04bc**；从 final source rebuild/check 后 payload **02e8ad5**，
payload sourceSha 为 bfb04bc。本文件为第三个独立 handoff commit，不为 handoff 再 build。

1. 逐项读取八份 `.cache/shadcn/base/<id>.tsx` pinned source、manifest、installed Base1.6.0
   类型/关键实现与 input-otp1.5.0；只读 shadcn docs 八项链接记录 `.cache/b3-upstream-docs.log`。
2. Checkbox、RadioGroup/Item、Switch、Slider、Toggle、ToggleGroup/Item、Progress/Track/Label/Value
   现在先真实求值 className(state) 再 cn，caller last。ProgressIndicator 的 style(state) 保留 width100%
   与调用方末位覆盖；ToggleGroup style(state)/对象保留 --gap，并将 orientation 传给 Base（原来只写
   data-orientation，导致垂直组键盘仍按水平方向）。InputOTP/group/slot/separator 原生类型仍字符串/对象。
3. Checkbox 的 indeterminate 原来 opacity0；现在显示 Minus 标记并保留 aria-checked=mixed。
   Slider number value/defaultValue 生成一个 thumb；数组按条目生成，省略值仍保留 pinned 两 thumb默认。
   InputOTP 恢复 pinned spellCheck=false（调用方仍可覆盖），invalid preview 的真实 input 也标 aria-invalid。
4. 真浏览器复现旧 none live bug：改变 transition prop 不取消同 target 上正在跑的 opacity/translate。
   `.cache/b3-debug.log` 曾记录 none 下 opacity 继续从.12逐帧变化。
   先补 animation-system §3.1 state.morph 取消规则，再加 `lib/control-animation.tsx`；该内部适配器通过
   value/transition signature 在 commit 后 stop，零时长 set当前target，否则 start同recipe，同 DOM节点。
   ControlSpan/Div 用于 checkbox/radio/switch/slider/progress，初始target不做入口；不重挂、不新增recipe。
   helper 随 cadence-provider 的 files 安装（该item已有motion依赖），相对imports；provider本身runtime未改。
   此修复仅证明 B3，不替代跨库 running-mode audit。
5. OTP去掉 key=char 的重挂；同一span通过controls重播字符entry。previousCharacter避免初始填充值、
   focus或mode升级重播。mode/clock变化 stop并到终值；none首帧filled直接显示。只opacity/scale，caret静态。
6. 八个preview局部mode selector +初始none样本；Progress增加调用方range控制value；Slider手机竖排。
   八份docs修实际API：Base className支持state callback，Slider值支持number/array；Progress composed track
   按真实upstream说明会保留默认track。P11维持caller所有权。
   无新外部依赖/registry item/公开props/recipe/parity deviation；T0约定未改，未动其他batch实现。

## 验证与缓存证据

- 新 `tests/components/b3-compatibility.test.tsx` 4 tests，全部旧测试保留：真实callback/callerlast、
  render element/function、merged native events、13个React19 ref cleanup、外部受控值/invalid/disabled更新、
  OTP同节点/focus、mixed marker、numeric slider。外部替换OTP值按input-otp/native策略移动选区，
  不虚构替换值后还保留旧选区的保证；浏览器另证resize时选区保持。
- 完整check 457/457 tests、71/71 files（61.40s）；`.cache/b3-final-check-retry.log`。typecheck、Biome、registry freshness、P11、
  全部gzip tier budgets、parity58 surfaces均通过。既有Item preview img warning；没有弱化检查配置。
- 隔离 `.next-b3-gate` production build69pages：`.cache/b3-final-build.log`。
  VITEST_MAX_FORKS2/MIN1；RAYON_NUM_THREADS2、NODE_OPTIONS --max-old-space-size=768，check/build顺序。
  Next自动tsconfig格式/include差异已核实，仅restore本轮生成内容；未碰.next/用户3000。
- Edge/msedge port3136、workers2：.cache/b3-final-review-e2e.log，64/64。
  48=八组件×三mode×两OS，逐rAF实测scale/translate/opacity，按recipe分别证明：tick/dot/OTP full
  opacity+scale、reduced仅opacity；Switch full连续travel/reduced与none跳终点；press full压缩、其他无scale；
  Progress full scaleX插值、reduced跳值，indeterminate full/reduced都opacitypulse、none无pulse。
  初始none MutationObserver观察无animation、live none每帧不变且无motion keyframes（held pointer也检查），
  outer none/local full真正恢复运动，同节点；键盘Space/Enter/方向键、垂直group、slider Home/Arrow与drag、
  OTP typing/delete/真实clipboard paste/selection、rapid state/mode、390resize focus都有实际断言。
- 16 visual cases=八页×两主题，各1280/390，全页axe WCAG2A/AA/2.1AA零违规、无disabledrules、
  document无横向溢出、无pageerror。32full+32preview PNG逐张review：
  `.cache/b3-proof/<id>-<light|dark>-<1280|390>[-preview].png`，
  `review-<id>[-preview].jpg`四图拼排，light1280/light390/dark1280/dark390。
  文档表格与code允许内部横滚，文档API文字已修。缓存/日志/截图/build不提交。
- 初轮 `.cache/b3-e2e.log`52/64，none实时取消12失败（含OTP自动fill清空未观察到slot变化）；修源与
  使用真实Ctrl+A/Backspace并明确assertslot清空后，`.cache/b3-review-e2e.log`64/64 (2.3m)。
  最终扩展drag/paste/rapid/focus后完整重跑见.cache/b3-final-review-e2e.log，不将失败轮或重复run累加为独立case。
- `.cache/b3-precommit-check.log`与`.cache/b3-final-check.log`均456/457，唯一失败为CodeBlock既有异步高亮1s等待；未改测试/超时/源，最终完整retry为准。
- `.cache/b3-final-e2e.log`61/64：两个Edge launch/page crash，一个none采样在React commit前开始；明确等待mode属性提交后保留每帧断言，完整retry见最终日志。
- 中间 `.cache/b3-review-check.log`进程在接近结尾失去session、无summary，不计作通过；最终完整check为准。

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

1. **历史 B4–B5 gates**：按真实batch逐项核对upstream/installed API、source、tests及旧证据，
   补真实mode×OS、keyboard/focus/pointer、rapid changes/resize、双主题desktop/mobile全页axe与
   逐张截图review，特别B5旧select/menu；B1–B3/B6–B9不无故重开。
2. **§8 tooling**：逐组件 Motion contract 表和 content/docs/motion.mdx recipe catalogue机器核验；
   强制 expectMotionContract() helper；/components/button初始JS≤120KB gzip实测记录。
3. **§8 site**：preview variant/code view、install copy、search+category/intensity/complexity filters、
   TOC/prev-next/Edit this page、immutable /r/[...path]、missing guides；**站点**sidebar landmark/
   aria-controls/height-animation（不是registry Sidebar）。部分可能已实现，必须实际审计再关闭。
4. **§8 metadata/docs**：intensity维度定义/一致性；T0 responsiveness/performance承诺与模板强制。
5. **跨库callback/render/ref/nativeevents**仍open：所有继承Base类型的部件按真实类型查class/style
   求值、callerlast、render、React19 cleanup、nativeevents；原生useRender是字符串/对象。
   B1/B2/B3和既有局部修复不替代全库证据。
6. **历史CSS popup** nested clock/live downgrade/none首帧仍需全库审计。Navigation/Sheet/Dropdown/
   Popover局部已修不代替Select/menu；none不是reduced。每个portal本地clock，嵌套full可恢复。
   B3修复同时表明Motion仅更新transition prop不能保证同target live取消；跨库Motion running-mode
   审计也仍open，不能只看data-motion或以B3适配器代替其他组件证据。
7. 旧contract drift§7.4、parityprops§7.6保持closed；静态提取限制不代表已覆盖真实类型。
8. AI25项unscheduled，direction deferred，form/native-select/sonner excluded，不扩大范围。
   未排期AI prerequisites按真实API需要处理，Attachment/Bubble无需新包不能全局关闭prerequisites。

## 下一 B4 会话约束与命令

先完整读本文件、AGENTS及适用design记录、只读shadcn技能。保持固定pin、相对imports/sharedlib/
namespaceddeps/cn用户last/Base render/data-slot/token recipes。每个动画保留reduced JSX/data-motion，
full/reduced/none真实分支；新motion形式先编辑animation-system；无timer或为动画重挂。P11 UI-only。

先查空闲port，不碰.next或用户3000服务。不修改配置弱化检查，保留旧测试。UTF8/LF，Biome仅改动文件。
源码/content/meta修改后 registry:build 再 check。低内存顺序执行（不要check/build并发）：

```powershell
pnpm registry:build
$env:VITEST_MAX_FORKS='2'; $env:VITEST_MIN_FORKS='1'
pnpm check
$env:CADENCE_DIST_DIR='.next-b4-gate'
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
