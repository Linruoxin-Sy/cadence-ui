# 串行 parity 交接：历史 B1 gate closed，下一步只做 B2

工作目录 `D:/Code/Project/cadence-ui`，本轮 2026-11-01 至 2026-11-02（Asia/Shanghai）。
本文件为 B1 后完整交接，取代 historical-gates.md 中“B1 next”的历史状态；旧文件原样保留供溯源。
用户授权持续按 docs/parity-plan.md 完成全部排期与收尾、原子提交、完整交接，不重复确认。
本轮是唯一实施会话，未创建会话/子代理/并行实施，未 push。完成交接、git clean 后停止。
协调必须先确认本会话 completed/idle，再创建下一唯一实施会话（用户指定 GPT-6.1 Sol High）。

## 当前状态与完整剩余目标

- B0–B9 的 58 个组件实现已交付；B1、B6–B9 batch gates closed。
- **整体 goal 尚未完成**。历史 B2/B3/B4/B5 gates、全部 §8 carried tooling/site/metadata、
  跨库 Base callback/render/ref/nativeevents 与 CSS popup clock/none 审计仍 open。
- 下一会话只做历史 **B2** 的九项：alert、empty、item、field、button-group、input-group、
  breadcrumb、pagination、spinner。按真实 API/源码/既有测试补缺，完成后独立 handoff 停止；
  然后协调串行创建 B3，再 B4/B5，再 §8。不要把“58 项都有实现”当作 goal 完成。
- B6–B9 不无故重开；B1 的有限证据不能证明全库 callback 或旧 popup 已符合。
- 65 registry items；58 documented = 56 ui + 2 blocks，58 docs、59 previews、58 pinned surfaces。
- 固定 pin `96da9cc7f1aa10580a3741664e2a77c721206c00`；没有新依赖/配置削弱/新 recipe/runtime。

## 本轮提交与来源

- 起点 main `be16384`，开始 git clean；B9 source `9f28070`、payload `258c73c`。
- B1 source/docs/tests/preview/plan **`288239d`**。
- final source 后 registry rebuild/check、独立 payload commit：`922d33c`。
  `public/r/*.json` 的 sourceSha 应为 `288239d`。
- 本文件独立 handoff commit 在其后，实际 SHA 看 git log；不要为 handoff 再 rebuild。
- 固定 manifest 和 `.cache/shadcn/base/<B1-id>.tsx` 对照了全部十一项实际上游源码，
  installed Base Input/Avatar/Separator types 核对状态 callback；只读 shadcn skill/registry reference。
  未运行 init/add/apply/create/preset，未生成 components.json。

## B1 真实修复与兼容性边界

1. Input、Separator、Avatar Root/Image/Fallback 原来把 Base `className(state)` 函数直接传 cn，
   回调样式会丢失。现在真实求值，再 cn，caller last；style callback 仍交给 Base 原样求值。
   Input 设 client boundary，避免由服务端向 Base 传新建 callback。无 provider 运行时加入 T0。
2. Button 沿用 B8 的 callback 修复，不退回 cn(raw function)；自定义 render element/function、
   原生事件合并、状态 styles、React19 cleanup refs 保留。Badge 为原生 useRender props，
   不伪造状态 className/style callback；native parts 同样维持真实字符串/对象类型。
3. Card `fit="content"` 原 spread caller ref 覆盖内部 ref，ResizeObserver 会失效。现在合并内部与
   caller refs，支持 object/function/React19 cleanup；ref 改变时重连测量，普通 Card 仍直接透传。
   fit 的尺寸即时写入，零 interpolation，不新建 geometry.resize recipe。新增带 caller object ref 的
   真实内容切换 preview，浏览器证明文字变长、快速切换、390 resize、同节点与焦点保持。
4. KbdGroup 对照 pinned source 恢复 native div prop 类型（上游实际 DOM 仍是 kbd）；无 runtime 改变。
5. Skeleton 唯一 recipe `data.transition` continuous CSS animate-pulse；显式 reduced transform-none
   分支，none animate-none/opacity1。没有定时器、Motion loop、硬编码 motion 值或新 timing。
   Button 唯一 recipe feedback.press，cm token/transition 不变。九个静态 T0 不强加 data-motion/provider。
6. Preview input/card 在手机改为单列；separator 可换行且使用 orientation-qualified h-6，
   普通 h-6 会输给已有 data orientation h-full，因此测试必须读真实高度；不能只数 role。
   Label disabled group 修复了无效的 preceding-label peer 顺序，文档示例同步。
   Button/Input/Separator/Avatar 文档明确真实 class/style callback；Button contract 明列 recipe。
   Card 示例 57/9 旧数量同步真实 58/10。Button/Skeleton 局部 mode selector 用于 same-node/nesting。

## B1 实际验证与不提交的证据

- final source `288239d` 后 `pnpm registry:build`：65 payloads / 58 components，
  `.cache/b1-final-registry.log`；随后 `pnpm check`：**450 tests / 69 files 全通过 (87.77s)**，
  `.cache/b1-final-check-retry.log`。typecheck/Biome/registry freshness/P11/所有 tier gzip budgets/
  parity 58 surfaces 均需通过。唯一既有 lint warning 为 Item img。保留全部旧测试。
- 本轮新增 B1 compatibility 3 tests、Card cleanup ref 1 test；共450tests/69files。
  定向13/13通过；初步与 review 完整 check 也通过，最终以 final-check log 为准。
- 隔离生产 `.next-b1-gate` build 成功，69 pages，`.cache/b1-gate-build.log`。
  build RAYON_NUM_THREADS=2、NODE_OPTIONS=--max-old-space-size=768；
  最终Kbd文档补充后再次69页build成功，`.cache/b1-final-doc-build.log`；Kbd两主题视觉例
  重跑2/2(12.5s)，`.cache/b1-kbd-final-e2e.log`，新整页截图再次review，不累加为42个不同测试。
  check VITEST_MAX_FORKS=2/VITEST_MIN_FORKS=1，不改仓库配置。
  一次早期误启动 build 发生于初步 check 收尾时，立即 Ctrl-C 取消；未作为成功证据。
  后续成功的 build 与 check 都顺序执行。Next 自动 tsconfig include/格式差异核实后 restore。
- Edge/msedge、自管 port3134，workers2：
  `node node_modules/@playwright/test/cli.js test tests/e2e/b1.spec.ts --workers=2`
  **40/40 passed (2.0m)**，`.cache/b1-gate-e2e.log`。
- 22 个视觉测试=11页×2主题，各自1280与390，全页axe WCAG2A/2AA/2.1AA零违规，
  不禁用规则；document无横向溢出，无pageerror。44全页+44preview截图全部逐张review，
  `.cache/b1-proof/<id>-<light|dark>-<1280|390>[-preview].png`。
  复核通过 `.cache/b1-proof/review-<id>[-preview].jpg` 四图拼排，顺序light1280/light390/
  dark1280/dark390；全部十一页已看，六个后改docs/preview页再次看最终图。不存在长图重复段。
  Avatar外部成功图片响应由浏览器route固定为小SVG，另保留实际missing URL的error fallback。
- 12个动画测试=Button/Skeleton各6个mode×OS组合。Button真实pointer-held scale full<.99、
  reduced/none=1，Enter/Space和focus-visible ring；pointer按住时切none取消并保持节点；
  outer none + local full恢复press（OSreduce仍reduced）。无 popup/exit/geometry 可测，勿伪造这些行为。
- Skeleton在真实rAF上按computed CSS duration完整采样一周期，full/reduced opacity差>.4且无transform；
  none samples恒opacity1、animationName none；live none立即零animations并保留节点，
  nestedfull重启CSSloop，live OSreduce保留opacityloop。第一轮80frames不足整周期（高刷新率），
  两例幅度.14/.149失败；修采样覆盖真实周期而不是降低阈值，之后全部通过。
- 6个native测试=3mode×2OS，逐页实际输入/selection/resize焦点同节点/FileList选择、
  label点击focus/checkbox切换与Space、Badge链接Enter、separator语义与可见高度、
  Avatar fallback、三个aspect ratio实测、kbd不进Tab序列、Card fit变化/resize/rapid/focus。
- 第一轮37/37在Card额外例和完整OS静态矩阵加入之前通过；不能累加为独立77例。
  扩展40例中曾6例因separator高度0失败；orientation-qualified覆盖后最终40/40才是gate结果。
- 首次final check有既有Code Block异步高亮1s等待超时，449/450；日志
  `.cache/b1-final-check.log`。不修改B9组件/测试或弱化配置，完整原配置重跑以确认。
  完整原配置retry为450/450通过(87.77s)，包括Code Block 21/21；不能把第一次失败说成通过。
- `git diff --check`通过；缓存、日志、截图、.next-b1-gate不提交。
  用户port3000 PID364未动；port3134在Playwright完成后退出，结束再次检查。

## 继承的 B6–B9 设计与证据（历史记录，保持 closed）

以下来自 historical-gates.md 的 B9 交接，所称“本轮”在此节均指旧 B9 实施，
不是本轮 B1；这些历史结果只保留追溯，不冒充本轮全库验证。

## Bubble 的真实来源与 prerequisite 判断

先读了 `docs/handoffs/bubble.md`、AGENTS、适用设计记录、CONTRIBUTING 与只读 shadcn skill/registry说明。
`pnpm exec shadcn docs bubble` 返回没有链接，按固定SHA读取真实资源：

- Base API：`apps/v4/registry/bases/base/ui/bubble.tsx`。
- 视觉：`apps/v4/registry/new-york-v4/ui/bubble.tsx`。
- 指南：`apps/v4/content/docs/components/base/bubble.mdx`。
- 示例：`apps/v4/examples/base/bubble-demo.tsx`。
- 缓存 `.cache/bubble-upstream/{base.tsx,visual.tsx,guide.mdx,demo.tsx}`，
  API 副本 `.cache/shadcn/base/bubble.tsx`。
- 读 installed `@base-ui/react/use-render/useRender.d.ts`，按真实 useRender/mergeProps 集成。

Pinned Bubble 只有四个展示部件，依赖已有 Base UI + CVA，不导入 @shadcn/react，不拥有 streaming model。
因此无需新包/依赖提交。这个判断只适用于真实四部件接口，**未排期 AI 的三个 prerequisites 仍 open**。
没有安装 Markdown/网络/验证库或实现消息编排。

## Bubble 最终实现与 motion conformance

保留 BubbleGroup、Bubble、BubbleContent、BubbleReactions 四导出、四slot，所有原生props/defaults：
variant default/secondary/muted/tinted/outline/ghost/destructive（default=default），align=start，
reaction side=bottom/align=end。Bubble 默认80%宽，ghost可全宽；group gap；长词可换行。
Content 使用 Base UI render element/function，不改成 asChild。原生事件合并、style/classes、ref与
React19 cleanup 单测。useRender.ComponentProps继承的 className/style 是原生字符串/对象，
不是假定 Base popup 的状态回调；render function state 的 slot 运行时保留，类型和真实上游一样是{}。
按钮/链接语义和可见 focus ring 保留，反应按钮有名字/aria-pressed。

视觉差异：真实 axe 在两个主题发现上游 destructive 正文色对比度不足（dark=4.37:1）。
改为 text-foreground + border-destructive/50，保留 destructive 背景与 hover；预览带 Delivery failed 文本。
这不改变 API/defaults，不需要虚构 parity props deviation；已在用户文档/计划记录。

T5 唯一声明 `data.transition`，与 frontmatter、Motion contract 表、实现同集：

- CSS @starting-style 一次性 opacity 入场；`cm.transition("data.transition").duration` 本地解析，
  ease-cadence-out 从既有token，timeScale被尊重，嵌套full不会继承outer none的零CSS时钟。
- full/reduced 都只有 opacity，无入场translation/scale/layout；reduced JSX transform-none。
- none 首帧opacity1，transition-none/duration0，不带 starting opacity；live none取消同节点动画。
- timeScale4实际 full=.88s / reduced或OSreduce=.528s；默认单测.22/.132/0。
- 文本追加、variant/alignment/reactions/resize即时更新，不 replay entry、不重挂；移除即时，没有exit。
- Reactions 的 translate-y 是静态定位，非动画；没有动画literal/timer/布局读取。
- `docs/animation-system.md` §3.0.1明确现有recipe的CSS entry形式，没有新增recipe或runtime改动。

Preview 自有 stable message IDs（新增用 crypto.randomUUID）、本地追加文本、增加回复、七variant、alignment、
reaction side/alignment、pressed状态、真实button/link、局部mode/timeScale4。
应用拥有消息ID/内容/chunking/transport/cancel/retry/scroll与focus-after-removal；Bubble只渲染给定内容。
没有为动画重挂输入、滚动容器或消息节点。

## 本轮真实验证与缓存证据

- final source `9f28070` 后 `pnpm registry:build`：65 payloads/58 documented，
  `.cache/bubble-final-registry.log`。
- 随后顺序 `pnpm check`：446 tests / 68 files，typecheck/Biome/registry freshness/P11/
  全部gzip tier budgets/parity58 surfaces均通过，`.cache/bubble-final-check.log`。
  Bubble新增7 tests；保留全部旧测试；唯一既有警告为 Item 的 img lint warning。
- final source前后变更对比检查 `git diff --check`通过；最终源码的定向Bubble7单测/type/lint通过。
- `.next-b9`隔离生产构建成功，69 static pages，`.cache/bubble-build.log`。
  build使用 RAYON_NUM_THREADS=2、NODE_OPTIONS=--max-old-space-size=768。
  check使用 VITEST_MAX_FORKS=2/VITEST_MIN_FORKS=1。check与build从不并发。
  没有改仓库配置弱化检查。Next修改的tsconfig已恢复。
- Edge/msedge、workers2、port3133、自管生产server（已退出）：
  `node node_modules/@playwright/test/cli.js test tests/e2e/bubble.spec.ts tests/e2e/attachment.spec.ts tests/e2e/motion-matrix.spec.ts --grep 'bubble|attachment|code-block' --workers=2`
  **31/31 (1.0m)**，`.cache/bubble-b9-e2e.log`。
- Bubble six mode/OS组合，MutationObserver在真实React append前安装，读首帧opacity/duration/
  getAnimations逐帧，不是只看data attr。full/reduced变opacity，无transform；none全程opacity1/
  零animations/零duration。live none取消；nestedfull恢复；OS变化；同节点text更新、焦点保持；
  pointer Add/Append/select与Enter/Space反应/按钮、Enter锚点，全部通过，无pageerror。
- Attachment完整8例共同重跑，覆盖原生FileList/name、pointer trigger/remove独立、Tab/Enter/Space、
  锚点、横向键盘滚动、live none恢复、状态/大小/方向/resize的同节点、六mode/OS组合。
- Code Block原motion-matrix13例共同重跑（6mode×fold/tab + mid-flight pill layering），
  highlighter真实加载、selection/fold终态、aria-controls、zero-mode与pill标签层次继续通过。
- 三页 light/dark ×1280/390 全页axe WCAG2A/2AA/2.1AA零违规，无disabled rules，无document溢出。
  Bubble扫描七variants，所有reaction side/alignment与root alignment尺寸；Attachment三sizes/两orientation。
- 每页4张fullpage+4张preview分别review：
  `.cache/bubble-proof/bubble-{light,dark}-{1280,390}.png`、`preview-...`；
  `.cache/bubble-proof/code-block-{light,dark}-{1280,390}.png`、`code-preview-...`；
  `.cache/attachment-proof/attachment-{light,dark}-{1280,390}.png`、`preview-...`。
- Code Block移动文档22917px，Edge整页capture在长图后段重复像素（不是新增UI实现错误），
  另存真实scroll下5000px viewport重叠tiles：
  `.cache/bubble-proof/code-block-{light,dark}-390-tile-{0..5}.png`，全部12张逐张review到footer。
  `.cache/bubble-code-tiles.log` **2/2 (10.0s)**，仅重跑现有两个Code Block视觉例，不能说33个不同测试。
  测试中保留tiles机制，防止以后把长图截图缺陷当成完整视觉证据。
- 首次E2E预览select label包含options文字导致exact定位超时；已补明确aria-label再build。
  随后axe发现destructive对比度并修source/doc再build；最终31/31是修复后的真实结果。
- 缓存截图/日志不提交。开始/结束核实port3000 listener PID364为用户dev，未动它。
  3133没有残留listener；不要为了清理误杀其他会话。

## 近期已完成工作：保持上下文，不重开

### Attachment

Source `e32cb11`，plan `11cde69`。真实API为同pin的 bases/base/ui/attachment.tsx，guide与base demo
真实读取，visual new-york-v4/ui/attachment.tsx。9导出/slot；root state=done、size=default、
orientation=horizontal；media variant=icon；Action size=icon-xs/variant??ghost；Trigger overlay
与z20 actions独立，Base render/ref cleanup/nativeevents保留，Button callback classes/styles caller last。
T5 continuous data.transition=busy title animate-pulse opacity-only（替代上游travelling shimmer）；
none animate-none/opacity1；feedback.press复用Button；state/removal/resize无延迟或重挂。
File/input accept/multiple/name/required/FileList、upload/cancel/retry/progress/validation、URL生命周期归应用。
无需@shadcn/react，不等于以后所有AI都无需。原439tests/67files、生产68pages，原8/8与本轮联合8例均通过。

### Date Picker / B8

Source `08899b7`，payload `2c8daa1`。真实上游是base/date-picker-demo composition和guide，不是ui文件。
DatePickerDemo为可修改block，single/range，初始空single，选中不强制关闭；value prop存在即受控，
包括undefined；配对setter更新，无callback只读；未传value时内部维护，callback只观察。
Calendar disabled/locale/month/min/max/excludeDisabled等透传，四项mode/selected/onSelect/required由组合拥有。
open/defaultOpen/onOpenChange保留Base事件details。date-fns PPP跟Calendar同locale，civil Date字段，
显式TZDate Pacific/Kiritimati已测；不做隐式UTC转换。弹层中外部值更新保留month/grid/focus。
T2复用feedback.press/popup.anchored/exit.fade/data.transition，无新recipe/geometry/key-remount。
Calendar month既有WAAPI运行时不改。range双月移动端堆叠且popup可滚动。
必要修复已在历史source：Popover portal本地clock、callback class/style caller last、none首帧无opacity起点；
Button className状态回调真实执行。原431tests/66files、67pages；B8联合51/51与最后视觉refinement3/3
（后者是重跑不是54不同测试），full/reduced/none×OS、live cancel/嵌套、keyboard、range、locale、resize、
全页axe/双主题desktop/mobile screenshot都通过。B8 §7.23 closed。
精确包 date-fns4.1.0/react-day-picker9.13.2保持不动。

### Data Table / B7/B6

DataTable源码`d07f08d`，精确@tanstack/react-table9.3.1，固定Base composition/guide实际用v9。
Payment/columns/DataTableDemo+Props，为payment-specific可修改block，不假装通用table。
5行/pageSize10，sort/filter/visibility/selection/pagination内部或受控slice，TanStack updater；
只state只读，callback接管该slice更新（与DatePicker observer语义不同）。稳定payment.id，当前页header选择，
过滤集合选中统计、email大小写不敏感、empty colspan；真实clipboard/mailto，无fake view action。
无fetch/validation/server/virtualization偷加；表格名称/focus/scope/aria-sort与Checkbox16px已修。
Dropdown portal本地clock/callback/live none/首帧修复在历史source，B8回归通过。
工具sync/parity支持block真实path/guide；build/check支持blockfrontmatter/deps/motion/intensity。
B6 §7.14、B7 §7.20保持closed，不无故重开Navigation/Resizable/Sidebar等。
上一轮完整历史细节还保存在 `docs/handoffs/bubble.md`，其中“Bubble next/B9 open”为历史状态，
当前状态以本文件和parity-plan §7.25/7.26为准。

## 必须完整保留的未闭合工作

1. **历史 B2–B5 visual gates**：按各batch真实清单查证据并补缺。下一步从B2开始，不把旧done等同
   视觉已补；尤其B5旧select/menu。B6–B9 closed不重开。各gate需要真实三mode/OS、keyboard/focus/
   pointer、rapid changes/resize、dual-theme desktop/mobile全页axe和截图review，适用recipe逐项证明。
2. **§8 tooling**：逐组件Motion contract表和content/docs/motion.mdx recipe catalogue机器核验；
   强制expectMotionContract() helper；/components/button初始JS≤120KB gzip实际测量与记录。
3. **§8 site**：preview variant/code view、install copy、search+category/intensity/complexity filters、
   TOC/prev-next/Edit this page、immutable /r/[...path]、missing guides；**站点**sidebar landmark/
   aria-controls/height-animation（不是registry Sidebar）。部分可能已实现，必须实际审计后决定补做或关闭。
4. **§8 metadata/docs**：intensity维度定义/一致性；T0 responsiveness/performance承诺与模板强制。
5. **跨库兼容性线索仍open**：历史CSS popup的nested clock/live downgrade/none首帧未全局证明；
   Navigation/Sheet/Dropdown/Popover局部修复与证据不能替代旧select/menu gate或全局结论。
   早期Base wrappers可能继承className/style callback却直接传cn；按真实installed/upstream类型审计
   callback求值、caller last、render、ref cleanup、nativeevents，不以静态props正则或本轮单测证明全库。
   Bubble历史实现是原生useRenderComponentProps；本轮B1局部修复Input/Separator/Avatar，仍不能关闭全库审计。
6. 旧contract drift §7.4与parity props §7.6保持closed；静态提取限制不是缺失实现的替代结论。
7. AI 25项unscheduled、direction deferred、form/native-select/sonner excluded；不扩大范围。
   未排期AI prerequisites仍按真实API需要处理，不能以两个展示组件无需新包为由全局关闭。

## 下一会话实施约束与命令

先完整读本文件、AGENTS和适用设计记录；按parity-plan顺序，先证据后修复，原子提交。
只读shadcn skill，禁止init/add/apply/create/preset/components.json；不要相信consumer injected paths。
真实upstream固定SHA，不移动pin。registry/cadence相对imports，共享lib，namespacedregistryDeps，P11 UI-only。
任何动画必须token/recipe、data-motion/reduced JSX、full/reduced/none各自行为，none首帧/livecancel与nestedfull
本地clock；无强制重挂。新recipe先设计记录；不要复制早期不符合实现。
UTF8/LF，Pythonencoding=utf-8，Biome只格式化改动文件，Markdowntable实际渲染检查。

源码/content/meta变更后registry:build再check。低内存顺序方式：

```powershell
pnpm registry:build
$env:VITEST_MAX_FORKS='2'; $env:VITEST_MIN_FORKS='1'
pnpm check
$env:CADENCE_DIST_DIR='.next-<gate>'
$env:RAYON_NUM_THREADS='2'; $env:NODE_OPTIONS='--max-old-space-size=768'
pnpm exec next build
# restore Next 自动修改的 tsconfig，仅当确认是本轮生成差异
$env:PLAYWRIGHT_CHANNEL='msedge'; $env:PLAYWRIGHT_PORT='<先查空闲端口>'
node node_modules/@playwright/test/cli.js test <对应真实spec> --workers=2
```

`.next-b9`可用于已有B9证据，不碰.next用户dev。不要并发check/build，不改配置弱化检查。
先查端口，不杀用户服务。只读review可批量，但不要并行实施会话/子代理。
source+metadata+docs+tests+design/plan为一个实现提交，真实必要新dependency才独立；
从final source rebuild/check后的public payload独立提交，handoff独立；不为handoff重复build。
保留已有测试与提交，不push。每个有边界步骤保存完整后续handoff，确认gitclean，停止实施。
下一唯一实施会话只做B2，仅由协调核实当前idle后创建，整体goal不可误标complete。
