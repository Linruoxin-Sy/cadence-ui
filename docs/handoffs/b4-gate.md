# 串行 parity 交接：历史 B4 gate closed，下一步只做 B5

工作目录 `D:/Code/Project/cadence-ui`，2026-11-02（Asia/Shanghai）。
本文件为最新权威交接，取代 b3-gate.md 的“B4 next”；旧文件保留历史证据。
用户授权按 parity-plan 持续完成所有排期/收尾、原子提交和完整交接，不重复确认。
本会话唯一实施，未创建会话/子代理/并行实施，未 push。git clean 后停止。
协调在本会话 completed/idle 后创建下一唯一实施会话，用户指定 GPT-6.1 Sol High。

## 当前边界与下一步

58组件齐全；B1–B4/B6–B9 gates closed，整体 goal 未完成。
下一会话只做历史 B5：dropdown-menu、context-menu、menubar、select、combobox、command、toast。
完成 B5 gate 和完整 §8 onward handoff 后停止；由协调核实 idle 后串行继续 §8。
DataTable/DatePicker 属于 B8，不按旧称重开 gate。65 registry items、58 docs、61 preview files（含共享scope）、58 pinned surfaces。
固定 pin `96da9cc7f1aa10580a3741664e2a77c721206c00` 不移动。
声明 Base UI ^1.6.0，实际解析 **1.9.0**；不要把旧记录写的1.6当实际安装版本。

## 本轮实现

起点 f413ea5，git clean。B3 source bfb04bc / payload02e8ad5。
B4 source **816e178**；final-source rebuild/check 后 payload **016f839**，sourceSha=816e178。
本文件为第三个独立 handoff commit，不为 handoff 再 build。

- 固定七份 `.cache/shadcn/base/<id>.tsx` 与 installed Base UI 类型/实现核对；只读 CLI docs 链接
  `.cache/b4-upstream-docs.log`。CLI给hover-card API URL404，实际 primitive 为 preview-card；
  以本地 installed preview-card root/trigger/popup 类型与实现为准，触发默认600ms/关闭300ms。
- Dialog/AlertDialog/Drawer/Tooltip/HoverCard 的 popup/backdrop 本地 token clocks；Sheet 统一到
  `lib/popup-style.ts`，Popover保留其既有等价adapter。helper随cadence-provider安装，relative imports。
  每个Base className(state)先求值再cn，style(state)保留，caller last；Title/Description同样修正。
- 先补animation-system §3.1 CSS popup规则：reduced移除几何transition属性，真正取消在跑scale/
  translate/transform并保留opacity；none transition-none、删除starting/ending opacity，首帧立即显示。
  本轮为原生CSS取消，不应用B3 Motion控制器，不换key、不重挂，不新增recipe。
- AlertDialogAction原先擅自用Close并自动关闭，违反fixed pin。恢复ButtonProps及Button行为，
  Action不自动close，Cancel仍Close；原测试保留并改为先证Action stays open，再Cancel/restore focus。
  真实axe暴露其destructive白字4.28(light)/4.37(dark)对比度；仅Action采用foreground+tinted warning
  背景修复，caller last。Button及B1实现未动，无publicprops/defaults/pin/dependency新增。
- Tooltip额外aria-describedby的open镜像在调用方cancel时不更新；真实键盘取消测试覆盖。
- 七preview加入局部Popup motion selector；7docs解释nested/full、live cancel、callbacks。
  修Dialog/Alert退出base时钟与reduced overlay96ms/panel132ms；修HoverCard delay属于Trigger；
  修Drawer Motion table把原生gesture从误写的gesture.drag recipe改为primitive-owned gesture。
  旧Alert两按钮都close的说明已删除。P11 UI-only，不做请求/验证编排。

## 验证与证据

- 新tests/components/b4-compatibility.test.tsx九项，加所有旧测试保留：真实state callbacks、callerlast、
  render function与element、native events合并、React19 ref cleanup、controlled open/mode更新、稳定DOM、
  Tooltip cancel。Alert Action旧测试保留并改为先证不自动关闭，再Cancel/restore focus。
- 完整check466/466、72/72files；.cache/b4-final-check.log（63.18s）。type、Biome、registry freshness、
  P11、全部gzip tierbudgets、parity58surfaces通过。finalsource复检.cache/b4-source-final-check.log同为466/466、72/72（62.50s）。
  .cache/b4-source-check.log只到lint：plan表格格式错误，Biome仅修plan并整合进本轮source commit后重建复检。
  没弱化配置/阈值；既有Item img lint warning、Base act warnings保留。B4完整checks没有CodeBlock timeout。
- 隔离.next-b4-gate production build69pages，.cache/b4-final-build.log；Next自动tsconfig新增include/
  格式差异已核实并仅restore本轮生成内容。.next/用户3000未碰。check/build顺序执行。
- Edge/msedge port3137、workers2：最终 **76/76 (2.3m)**，.cache/b4-final-e2e.log。
  42=七项×三mode×两OS：rAF实采popup/backdrop opacity、scale/translate/transform，entry/exit、
  none初始帧/livecancel，resize/focustrap与局部mode；outer none/localfull恢复（OS仍可强制reduced）。
  7=slow clock active-transition proof：先断言getAnimations确实有在跑动画，再reduced取消geometry、
  opacity仍在跑，最后none取消opacity；同节点。click popups mid-exit反转；hover leave/re-entry保留节点。
  6=Drawer真实CDP touch拖拽，在三mode×两OS都直接跟指并dismiss；7=所有preview位置键盘focus/
  Enter/Space打开、Escape关闭并恢复focus；14=七页双主题，每例1280/390完整页+openpopupaxe0。
  axe WCAG2A/2AA/2.1AA无disabledrules，无document横向溢出，无pageerror。
- .cache/b4-proof/<id>-<light|dark>-<1280|390>[-open].png，共56截图，14张review-<id>[-open].jpg
  四图拼排（light1280/light390/dark1280/dark390）逐张review；最后三个文档修正后又重建/重截图复核。
  表格真实渲染，mobile内部横滚可用但列窄的站点可读性问题保留§8，不伪称完全解决。
- 首轮.cache/b4-unit.log52/54：旧Sheet两处assert期待reduced/none保留translate transition，
  更新其模式断言后通过；旧测试全部保留。首轮.cache/b4-e2e.log54/56：AlertAction两主题contrast失败，
  修source后.cache/b4-review-e2e.log63/63，再加touch/placements后最终76/76；不累加重复run为新case。
  .cache/b4-extra-unit.log17/17为已有unitcase子集，不计为额外测试。缓存/日志/截图/build不提交。
- payload从816e178重新registry:build，public/r/dialog.json等sourceSha确认816e178；public独立commit。
  交接后不再build，完整未完事项见下。

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

1. **历史 B5 gate**：按真实batch逐项核对upstream/installed API、source、tests及旧证据，
   补真实mode×OS、keyboard/focus/pointer、rapid changes/resize、双主题desktop/mobile全页axe与
   逐张截图review，特别旧select/menu；B1–B4/B6–B9不无故重开。
2. **§8 tooling**：逐组件 Motion contract 表和 content/docs/motion.mdx recipe catalogue机器核验；
   强制 expectMotionContract() helper；/components/button初始JS≤120KB gzip实测记录。
3. **§8 site**：preview variant/code view、install copy、search+category/intensity/complexity filters、
   TOC/prev-next/Edit this page、immutable /r/[...path]、missing guides；**站点**sidebar landmark/
   aria-controls/height-animation（不是registry Sidebar）。部分可能已实现，必须实际审计再关闭。
4. **§8 metadata/docs**：intensity维度定义/一致性；T0 responsiveness/performance承诺与模板强制。
5. **跨库callback/render/ref/nativeevents**仍open：所有继承Base类型的部件按真实类型查class/style
   求值、callerlast、render、React19 cleanup、nativeevents；原生useRender是字符串/对象。
   B1–B4和既有局部修复不替代全库证据。
6. **历史CSS popup** nested clock/live downgrade/none首帧仍需全库审计。Navigation/Sheet/Dropdown/
   Popover局部已修不代替Select/menu；none不是reduced。每个portal本地clock，嵌套full可恢复。
   B3修复同时表明Motion仅更新transition prop不能保证同target live取消；跨库Motion running-mode
   审计也仍open，不能只看data-motion或以B3适配器代替其他组件证据。
7. 旧contract drift§7.4、parityprops§7.6保持closed；静态提取限制不代表已覆盖真实类型。
8. AI25项unscheduled，direction deferred，form/native-select/sonner excluded，不扩大范围。
   未排期AI prerequisites按真实API需要处理，Attachment/Bubble无需新包不能全局关闭prerequisites。


## 必须带入 §8 tooling 的可靠性调查

B1/B3多次CodeBlock异步高亮1s等待timeout后，原配置完整retry通过；本轮不偷改B9。
重复超时的根因与测试可靠性需要收尾调查，不能永远只重试到绿。已加入parity-plan §8 tooling。
移动端部分API表内部可滚动但列狭窄，仍需在§8站点可读性审计中检查，不把axe0等同于可读性完美。

## 下一 B5 约束与命令

先完整阅读本文件、AGENTS与适用design记录、只读shadcn技能。
逐项核对pinned/真实installed API、旧tests与历史证据；callback/render/ref/nativeevents、每portal
本地clock、outer none/local full、live full→reduced保留opacity、live none真实cancel及首帧都要实测。
B3证明Motion只更新transition不能取消同target旧动画；内部control-animation适配器不是跨库豁免。
不为动画强制remount；模式切换/反转/受控更新保持DOM/focus；保留所有旧测试与提交。
Base render不是asChild；relativeimports/sharedlib/namespaceddeps/cn用户last/data-slot/tokens/reduced JSX。
新motion形式先design，P11 UI-only。禁shadcn init/add/apply/create/preset/components.json，不push。

先查空闲port，勿碰.next或用户3000。UTF8/LF，Biome仅改动文件。
低内存顺序check与build，不并行：VITEST_MAX_FORKS2/MIN1；
CADENCE_DIST_DIR=.next-b5-gate、RAYON_NUM_THREADS2、NODE_OPTIONS=--max-old-space-size=768。
Edge/msedge workers2，按空闲端口设置PLAYWRIGHT_PORT。核实Next tsconfig自动差异，只restore本轮内容。
source/content/meta变化先registry:build再check，不弱化配置/阈值。
source+必要修复/docs/tests/parity-plan原子commit；从final source rebuild/check的public独立commit；
完整handoff独立commit，不为handoff再build。git clean后报告SHA/tests/logs/screenshots与下一交接并停止。
协调负责idle后创建下一唯一会话；不得标整体goalcomplete。
