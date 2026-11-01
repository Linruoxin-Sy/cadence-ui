# 串行 parity 交接：历史 B5 gate closed，下一步进入 §8

工作目录 `D:/Code/Project/cadence-ui`，2026-11-02（Asia/Shanghai）。
本文件接替 b4-gate.md 的“B5 next”；旧文件保留完整历史证据。
用户授权按 parity-plan 持续完成所有排期/收尾、原子提交和完整交接，不重复确认。
本会话唯一实施，未创建会话/子代理/并行实施，未 push。
协调核实 completed/idle、git clean 后，再创建下一唯一实施会话。用户指定 GPT-6.1 Sol High。

## 当前边界与下一步

58 组件实现齐全，**B1–B9 gates closed，整体 goal 未完成**。
本轮只关闭 dropdown-menu、context-menu、menubar、select、combobox、command、toast 的历史 B5 gate。
下一会话从 parity-plan §8 tooling 开始，按依赖顺序推进后续 site/metadata 和跨库兼容性/运行中模式审计。
不无故重开 B1–B9，不把局部证据当全库豁免。DataTable/DatePicker 当前归属 B8，不按旧称改归属。
65 registry items、58 docs、61 preview files（含共享 scope）、58 pinned surfaces。
固定 pin `96da9cc7f1aa10580a3741664e2a77c721206c00` 不移动。
Base UI 声明 ^1.6.0，实际 **1.9.0**；cmdk1.1.1、Motion13.5.1、React19.3.1。

## 提交与实现

起点 **94e3efe**，git clean；B4 source816e178 / payload016f839（sourceSha816e178）。
本轮 source **e26cbfb**；final-source rebuild/check 后 payload **aaa2787**（sourceSha=e26cbfb）。
本文件为第三个独立 handoff commit，不为 handoff 再 build。

- 只读七份 `.cache/shadcn/base/<id>.tsx` / upstream manifest / installed 类型与实现。
  `.cache/b5-upstream-docs.log` 为只读 CLI docs 地址，`.cache/b5-api-*.md` 为实际读取的 API 文档（HTTP200），
  `.cache/b5-pinned-api-audit.log` 保存 pin surface、cached source 和 resolved versions。
  没运行 consumer init/add/apply/create/preset，没有 components.json、dependency/export/default 变更。
- ContextMenu/Select/Combobox/Toast 使用 B4 `lib/popup-style.ts` 的 local token clock、state callbacks、
  reduced transition-opacity 和 none transition-none/无 starting opacity；Dropdown 保留原等价本地 adapter。
  Menu/ContextMenu/Menubar 其他继承 Base 类型的包装部件修正 className(state) 先求值再 cn，caller last。
  原生 HTML caption/shortcut 仍遵循字符串类型；cmdk parts 仍遵循自己的 string/object API，不伪造 callback。
- Menu/Select/Combobox indicators 接 B3 `ControlSpan`，同 target 的 mode/clock 更新也停旧动画再定向；
  reduced scale duration0、opacity继续，none直接set。没有新 recipe、key/remount 或 setTimeout 动画。
- Select 合并内部 trigger measurement ref 和 caller ref（React19 cleanup），Value 的 Base props/render/ref
  留在真实 Value，callback classes 在该状态求值。宽度测量/ResizeObserver观察自然 inner text，避免外层
  当前 animated width 污染缩小目标；clamp维持预算。模式降级取消 ghost handoff，值恢复可见。
  Root 的 onValueChange 委托调用方，再读取真实 details.isCanceled；取消后清pending并禁止对应pointer flight。
  旧 valid flight 测试保留，新取消测试使用真实 userEvent selection 并提供非零 rect，防止空布局假阳性。
- Base UI1.9 Combobox FloatingFocusManager 的 typeable 分支给背景 aria-hidden，却保留tab stops。
  本轮 open popup 全页 axe 首次暴露 aria-hidden-focus。局部 ComboboxFocusSafety 观察它在本次 portal 生命周期
  新隐藏的节点，补 native inert；已有hidden/inert不归它管理。Tab capture在默认焦点移动前释放，关闭时清理。
  不能按 data-base-ui-inert marker 当hidden node：两者树的边界不同，早期尝试因此未覆盖真正背景，已修原因。
  最终完整axe和真实Tab-out/typing/selection均通过，无disabledrules。保留Base焦点/关闭引擎，不改Root默认。
  ComboboxInput disabled同步给primitive；string classes仍在frame，真实state callback classes在native input。
- 七preview用局部Popup motion selector验证nested modes；ContextMenu demo显式tabIndex0支持真实Shift+F10。
  七docs补local clock/livecancel/callback说明，Select补自然宽度/取消语义，Command明确cmdk原生props。
  P11 UI-only，不加promise、请求、验证、schema或resolver编排。

## 验证与证据

- 新 `tests/components/b5-compatibility.test.tsx` **8 tests**：五类popup的真实typed callbacks、style/class callerlast、
  render function、native event、ref cleanup、controlled open/mode；Select trigger render element/ref、Toast real state
  callback/render element、Select取消selection。保留全部旧tests/commits。
- 最终完整check **474/474，73/73files**，typecheck、Biome、registry freshness、P11、全部gzip tierbudgets、
  parity58surfaces通过。`.cache/b5-final2-check.log`；source commit后的复验 `.cache/b5-source-final-check.log`（474/474，73/73，63.65s）。
  既有Item img lint warning / Base act warnings保留，没有改阈值/配置。CodeBlock本轮完整check未出现timeout；
  B1/B3重复1s timeout的根因调查仍在§8，不据本轮绿关闭。
- 隔离 `.next-b5-gate` production build **69pages**，最终 `.cache/b5-final-build.log`。
  Next自动tsconfig include/格式差异核实后只restore本轮内容；未碰.next、用户3000。
- Edge/msedge port3138、workers2，最终 **104/104（2.6m）**，`.cache/b5-source-e2e.log`。
  `.cache/b5-complete-e2e.log` 的104/104为取消修复前的完整快照；最终套件重新验证最终source。
  42=七项×三mode×两OS entry/exit实际rAF opacity/scale、none首帧、nested localfull、resize/live none。
  7=slow clock先证明在跑CSS动画，再full→reduced取消geometry保留opacity，none取消opacity，同节点。
  6=indicator三mode×两OS真实scale/opacity帧、live cancellation、rapid toggles，6=Select同矩阵handoff/width帧、
  modecancel/focus。6=popup mid-exit reversal保持原node。1=三菜单native keyboard/typeahead/submenu portal/rovingfocus/
  pointer hover/disabled。6=Select/Combobox/Menu pointer+keyboardselection、filter/empty、resize关闭和Tab-out。
  14=七页双主题，分别1280/390完整页与openpopup WCAG2A/2AA/2.1AA axe0，无disabledrules/overflow/pageerror。
  16=既有Command/Toast浏览器回归（含B4 Dialog helper、F6焦点、action/stack/manager行为），没有用其证明旧menu。
- `.cache/b5-proof/<id>-<light|dark>-<1280|390>[-open].png` **56张**，14张 `review-<id>[-open].jpg`
  四图拼排（light1280/light390/dark1280/dark390）逐张review；最终两张API局部detail也重新复核。移动API表列狭窄仍是§8站点可读性问题。
  浏览器/截图/日志/build不提交，review脚本`.cache/b5-review.mjs`使用现有sharp，不新增依赖。
- 初轮浏览器32/79的失败来自采样旧帧与Select错误count0假设；改为重启sampler，遵从Base1.9隐藏forceMount
  typeahead树（Select关闭后可能保留hidden popup，且alignItemWithTrigger原生resize会关闭）。不改组件绕生命周期。
  `.cache/b5-e2e-review.log`61/63只余旧build Combobox axe；修adapter后`.cache/b5-extra-e2e.log`21/27，六失败为
  empty文字撞到文档code示例；改真实slot后selection6/6。菜单键盘旧demo不可聚焦，显式demo optin后通过。
  `.cache/b5-final-check.log`473/474因最初textContent防取消方案抢在Base值提交前丢失合法flight；改到真实
  onValueChange cancellation，保留旧测试，`.cache/b5-cancel-unit3.log`19/19。最终完整checks重新通过。
  不累加重复run为新增case，不隐藏失败原因，不采用无限retry到绿。

## 继承的 closed 历史边界

完整历史证据在 b1-gate.md / b2-gate.md / b3-gate.md / b4-gate.md 及 parity-plan。
B1 Input/Separator/Avatar callbacks、Card ref测量、Skeleton opacityloop、Button press已修并证明。
B8 Button/Popover、历史Sheet/Dropdown曾有局部callback/clock修复；不据此关闭全库。
B6历史DataTable d07f08d（@tanstack/react-table9.3.1）、B8历史DatePicker08899b7
（date-fns4.1.0 / react-day-picker9.13.2）保持closed，当前两者归属B8。
Attachment e32cb11、Bubble9f28070、payload258c73c，B9联合gate closed。
B4 helper影响CommandDialog已在本轮回归。Sheet局部修复不表示全局豁免。

## 必须完整保留的 open 工作：§8 onward

1. **§8 tooling**：逐组件Motion contract表 + content/docs/motion.mdx recipe catalogue机器校验；
   强制expectMotionContract() helper；/components/button初始JS≤120KB gzip实测并按结果修复。
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

## 下一会话约束与命令

先完整阅读本文件、AGENTS、parity-plan及适用design记录/只读shadcn技能。
从§8 tooling实际检查开始：优先机器校验与helper/高亮可靠性，测量初始JS，再串行site/metadata/跨库审计。
若一次实施范围需拆分，原子实现+完整handoff后停止，由协调核实idle后创建下一唯一会话。
不要创建会话/子代理/并行实施，不push，不重复确认，不标整体goalcomplete。
Base render不是asChild（cmdk保留其原生API），relativeimports/sharedlib/namespaceddeps/cn用户last/data-slot/
纯tokens/recipes/reduced JSX；新motion形式先design，P11 UI-only，保留全部旧tests/commits。
先查空闲port，勿碰.next/用户3000；UTF8/LF，Biome只改动文件。
低内存顺序check与build，不并行：VITEST_MAX_FORKS2/MIN1、RAYON_NUM_THREADS2、
NODE_OPTIONS=--max-old-space-size=768、隔离CADENCE_DIST_DIR与Edge/msedge workers2。
Next tsconfig自动差异核实后只restore本轮内容；本轮一次误提前启动build发现check未结束，立即停止该build，
后续所有check/build严格串行，最终证据来自完整顺序run。无需复用被中断build日志作证。
source/content/meta变更先registry:build再check；不改配置/阈值弱化检查。
source+必要fix/docs/tests/plan原子commit；从finalsource rebuild/check的public独立commit；完整handoff独立commit，
不为handoff再build。gitclean后报告实际SHA/tests/logs/screenshots和下一handoff路径并停止。
