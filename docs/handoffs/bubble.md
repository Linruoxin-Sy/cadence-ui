# 串行 parity 交接：B9 Bubble 与联合 gate

本文件是 Attachment 完成后的 Bubble 串行交接，最新边界以本文件为准。目录 `D:/Code/Project/cadence-ui`。
协调会话确认本会话 completed/idle、git clean 和下列提交存在后，再开唯一 Bubble 实施会话。本会话不创建会话、不启动子代理。
用户要求后续会话使用 GPT-6.1 Sol High；不启动子代理、并行代理或额外实施会话；无需 push、无需重复确认。
本交接文件的保存提交在 payload 提交之后，以实际 git log/status 为准，不能回退历史提交。

## 完整目标和本轮停止边界

完整目标仍是按 `docs/parity-plan.md` 的依赖顺序完成全部已排期工作、历史未闭合 gate 与 §8，
每步原子提交。不能以 B6/B7/B8 完成声称整体目标完成。
下一实施项是 B9 Bubble（Attachment、code-block 已 shipped），及其实际必要依赖、方案、
证据、修复和 batch gate；之后历史 B1–B5 gate 与 §8 逐条实查/补齐。
不扩大到未排期 AI。完成下一项后写真正完整的后续交接并停止，由协调核验 idle 后继续。
本会话已停止在 Attachment，不自行创建会话，不开始 Bubble。Bubble 完成时实查 Attachment / Bubble / code-block 联合 gate；之后停止交协调核验，不偷跑历史 gate。

## 当前实际状态和提交

- main；本轮开始时 git clean、HEAD `30adb9f`；已核实 `08899b7` / `2c8daa1` / `30adb9f`。
- Attachment source `e32cb11`；plan formatting `11cde69`；payload `2ac6c0d`；handoff 在其后独立提交。
- `08899b7 feat(date-picker): ship calendar composition and close B8 joint gate`。
- `2c8daa1 chore(registry): publish date-picker block and completed B8 catalog`。
- 本轮 final payload 的 sourceSha 是 `11cde69`；handoff 另行提交，不能为 handoff 重建 sourceSha。最终 git clean 需协调再核实。
- 57 documented components（55 registry:ui + 2 registry:block）、64 registry items、57 docs、58 previews。
  `public/r/date-picker.json` 和 `attachment.json` 的 meta.sourceSha 均为 `11cde69`；Date Picker 原 source 仍为 `08899b7`。
- B6 §7.14、B7 §7.20 保持 closed；Data Table §7.21、Date Picker §7.22、B8 gate §7.23 closed。
  Attachment 已 shipped (§7.24)，Bubble 与 B9 gate、历史 B1–B5 视觉 gate、§8 仍 open。
- 固定 upstream pin `96da9cc7f1aa10580a3741664e2a77c721206c00` 未移动。
- 本轮没有新增 npm 包，没有改 shared motion/provider runtime 或 build/test 配置。
  date-fns 4.1.0 / react-day-picker 9.13.2 保持原固定版本，Next 自动修改的 tsconfig 已恢复。
- 保留历史提交：Data Table `1125c4b` / `d07f08d` / `efad5da` / `079dcfe`；Sidebar
  `d0fb14d` / `210443d`；Resizable `99694dd` / `b2ad5c5` / `a3fa762`；Navigation
  `3c52632` / `8c3c773`；duration token `f1afa33` / `6b732e5`。不重写或回退。

## Date Picker 已完成，不重开

真实固定来源：Base `apps/v4/examples/base/date-picker-demo.tsx`、指南
`apps/v4/content/docs/components/base/date-picker.mdx`、视觉
`apps/v4/registry/new-york-v4/examples/date-picker-demo.tsx`。
不是 ui/date-picker.tsx。CLI `pnpm exec shadcn docs date-picker` 返回 not found；读取了真实 raw 固定
SHA 资源并缓存 `.cache/shadcn/base/date-picker.tsx`、base-date-picker.mdx、visual-date-picker.tsx，
以及该 pin 的 range/basic/dob/input/time 示例。manifest 记录真实 path/guide 和 DatePickerDemo export。

`DatePickerDemo` 是可复制修改的 block，保留初始空 single selection、选中后弹层保持打开。
新增 DatePickerDemoProps discriminated union：mode single/range，value/defaultValue/onValueChange。
**value prop 存在即受控，包括 undefined**；配对 setter 更新；无 callback 的受控值只读。
未传 value 时内部维护，callback 只观察。range 两个月默认，支持 incomplete range 和 caller preset。
Calendar 的 disabled matcher、locale、month/caption、min/max/excludeDisabled 等通过 calendarProps。
选择四项 mode/selected/onSelect/required 由组合拥有，不加通用多选/validation API。
open/defaultOpen/onOpenChange 保留 Base UI ownership 与 event details。

原生 div props、caller class/style、React19 ref cleanup、Button/Popover callback classes/styles 保留。
label 作为可访问 trigger 前缀和 sr-only PopoverTitle；选中日自动 focus，Arrow 移动，Escape 返回 trigger。
日期用 date-fns PPP，locale 与 Calendar 一致（enUS 默认/局部locale合并），明确 local Date vs UTC
字符串语义。timeZone 由 caller 配置，显式 TZDate(Pacific/Kiritimati) 实际单测证明 civil fields 和 trigger
一致；不做隐含时区转换。弹层开启中外部 value 更新保留 displayed month/grid/focus，若需导航需显式受控 month。
free text/time/natural-language 是原指南中的其他 compositions，本 block 文档明确 single/range 范围、
保留应用 parsing/draft/time ownership，不安装 chrono-node，不加 schema/resolver/validate/fetch。

T2 仅组合 feedback.press / popup.anchored / exit.fade / data.transition。
日期 label 和 selection 即时更新，不加 reveal/geometry/timer/remount；Calendar 稳定 grid 的 WAAPI 原实现未改。
Preview 有受控 single/range、clear、external update、range preset、法语切换、disabled 和局部模式选择。
移动端 range 双月堆叠，popup 受 available-width/height 限制并滚动；trigger 长文本可截断。

必要依赖修复在 source commit：Popover portal 自解 duration.fast（timeScale/reducedDurationScale），
callback class/style 求值 caller last；none 不带 starting/ending opacity，transition-none duration-0；
reduced transition-opacity 移除 active scale。Title/Description class callback 同样修复。
Button className 原来直接传 cn，状态回调未执行，现已执行再合并，单测 disabled state/class override。
未因此重写所有早期 wrappers；全库回调兼容性尚未证明，见未闭合事项。

## Data Table 保留上下文，不重开

原 source `d07f08d`，独立精确依赖 `@tanstack/react-table@9.3.1`，固定 Base composition/guide 实际使用 v9。
来源 `apps/v4/examples/base/data-table-demo.tsx`、`apps/v4/content/docs/components/base/data-table.mdx`，
视觉 `apps/v4/registry/new-york-v4/examples/data-table-demo.tsx`。不是 ui/data-table.tsx。
导出 Payment/columns/DataTableDemo，新增 Props；可修改 payment-specific composition，不是通用新 table。
五条默认数据/pageSize10；sorting/filter/visibility/selection/pagination 可内部或配对外部回调。
TanStack updater；只 state 是只读，callback 接管该 slice 更新（与 Date Picker observer 语义不同）。
稳定 payment.id；排序/数组换序不选错记录；移除记录后的 stale selection 由 caller 清理。
当前页 header selection，过滤集合选中统计，大小写不敏感邮件排序/包含过滤，visible colspan 空态。
copy ID 真实 clipboard，email 真实 mailto；无 fake view action。无 fetching/validation/server/virtualization 偷加。
Checkbox inline-flex 使 cell 内真实16px；native table 有名称/焦点环/scope/aria-sort。
T2 Button/Checkbox/Dropdown 既有 recipes；row/data/geometry 即时；table/input 不以状态key重挂。
Dropdown portal local clock/callback/live downgrade/none first-frame 修复已在此前 source，B8 继续回归通过。
工具 sync/parity --write 支持 block、保留 meta.upstream.path/guide，parity offline 校验二者；
build/check 对 block 做 frontmatter/deps/motion/intensity 检查。后续真实来源仍按此机制。

## Date Picker / B8 已完成证据（历史保留，不作为本轮新测）

- 从 final source `08899b7` 再 registry:build + check：431 tests / 66 files，56 pinned surfaces；
  typecheck/Biome/registry freshness/全部 tier gzip budgets/P11/parity 通过。
  `.cache/date-picker-final-registry.log`、`.cache/date-picker-final-check.log`。
  唯一 warning 是既有 item img；未降低检查。
- 隔离 `CADENCE_DIST_DIR=.next-date-picker pnpm exec next build` 成功：67 static pages。
  `.cache/date-picker-build.log`。无构建配置残留，tsconfig 已恢复。3132 listener 已结束。
- Edge workers2、port3132、Playwright 自管生产 server。
  `node node_modules/@playwright/test/cli.js test tests/e2e/date-picker.spec.ts tests/e2e/data-table.spec.ts tests/e2e/motion-matrix.spec.ts --grep 'date-picker|data-table|popover|button|dropdown-menu|menubar' --workers=2`
  51/51通过（1.3m），`.cache/date-picker-b8-e2e-final.log`。
  文档最后只修 pipe escaping；随后 date-picker visual + interrupted refinement 3/3（30.9s），
  `.cache/date-picker-visual-final.log`。不要把这说成54个不同测试。
- full/reduced/none × 两OS偏好真实逐帧 popup opacity/scale/duration、calendar month transform/opacity，
  reduced 保留 opacity/drop transform；none 首帧opacity1/duration0/no WAAPI。
  outer none 内full clock .64s；OS reduce .384s；live none CSS/WAAPI getAnimations0，
  同popup/day/grid与focus，month rapid reverse、popup interrupted close/reopen 同节点。
  single/range选择、Arrow/Space/Enter/Escape、disabled、外部clear/update/preset、French、resize通过。
  Data Table原完整用例共同运行，含clipboard/mailto、mobile keyboard scroll。
- 双主题 × 1280/390，open/closed 全页 axe WCAG2A/2AA/2.1AA 零违规，无disabled rules、无document溢出。
  `.cache/date-picker-proof/date-picker-{light,dark}-{1280,390}.png` 最终四张逐张复核；
  open-range/preview 四张各自也复核。截图复核发现 Markdown pipe 问题后修正；E2E现在要求
  article真实有两张table，union cell内容正确，最终截图已复核。缓存证据不提交。
- git diff --check通过；source/public/handoff分别提交。不要为交接文件再生成public sourceSha。

## Attachment 已完成：实际来源、行为与最终证据

- source `e32cb11`，状态表排版 `11cde69`，final registry sourceSha `11cde69`。
- 固定 pin 的真实 Base 源 `apps/v4/registry/bases/base/ui/attachment.tsx`、guide
  `apps/v4/content/docs/components/base/attachment.mdx`、示例 `apps/v4/examples/base/attachment-demo.tsx`；
  视觉 `apps/v4/registry/new-york-v4/ui/attachment.tsx`。CLI docs attachment 没有链接；raw 固定资源
  缓存于 `.cache/attachment-upstream/`，API 副本 `.cache/shadcn/base/attachment.tsx`。
  GitHub tree API rate-limit，未据此猜造来源；new-york-v4 examples/attachment-demo.tsx 404，
  真实 Base 示例已读取。manifest 57 surfaces，pin 未移动。
- 不需要新增依赖：真实源只依赖已装 Base UI mergeProps/useRender、CVA、Button；不导入 @shadcn/react。
  §7.24 记录此项 prerequisite 判断；未来 AI streaming prerequisites 仍未全局满足。
- 保留 9 导出/slot、props/defaults：Attachment(state=done,size=default,orientation=horizontal)、Group、
  Media(variant=icon)、Content、Title、Description、Actions、Action(size=icon-xs,variant??ghost)、Trigger。
  原生 div/span/ref/events/style、React19 cleanup、Trigger render element/function 与合并事件保留；
  Action 的 Base UI className/style state callbacks 求值、caller last。Trigger overlay 独立于 z20 actions；
  增补可见 focus ring。布局/移除/状态即时，无存在感延迟，不因进度/模式/大小而重挂。
- T5 data.transition continuous：uploading/processing title 的 CSS animate-pulse（opacity only），取代
  upstream travelling shimmer。Full/reduced 保留 opacity；none animate-none、opacity1、无 loop；
  reduced/none JSX transform-none。feedback.press 由 Button action 复用。声明/frontmatter/文档表同集。
  无新 recipe、无 shared runtime 修改。自定义 Button render 与既有 Button 一样由 caller 自有 feedback。
- File/input accept/multiple/name/required、FileList、upload/network/cancel/retry/progress/validation、
  object URL/revoke 全归应用。组件只展示 state，不是 uploader/validator/streaming orchestrator。
  Preview 真 native file input 只更新名称、无网络；手动状态/size/orientation/mode；移除、reset、
  inspect report、锚点 link、原生 img（本地 data SVG、真实加载）、长名称与横向键盘 scroll。
- 最终仓库 check：439 tests / 67 files；typecheck/Biome/registry freshness/全部 tier gzip budgets/P11/
  57 pinned surfaces 通过。日志 `.cache/attachment-final-{registry,check}.log`。
- 隔离 `.next-b9` 生产 build：68 static pages，日志 `.cache/attachment-build.log`。
  Next 自动 tsconfig 修改已 restore。3133 listener 已自动退出，未结束用户 dev。
- Edge port3133 workers2 最终 8/8 (15.9s)，`.cache/attachment-e2e.log`。Full/reduced/none × 两 OS偏好：
  title逐帧 opacity 变化/no transform、none opacity1/零 animations；真实按压只full有scale；
  live none取消、外层none内full恢复、OS reduce；状态/size/orientation/resize 保留 title；真实 native
  file selection、Enter/Space/Tab、独立 pointer trigger/remove、anchor与横向键盘滚动全部通过。
- Light/dark ×1280/390，两orientation、全部size无document溢出；全页axe WCAG2A/2AA/2.1AA零违规，
  没有disable rules。最终四张全页 `.cache/attachment-proof/attachment-{light,dark}-{1280,390}.png`
  与四张 preview 各自逐张复核。缓存证据不提交。只关闭 Attachment，不关闭 B9。
- 初次无约束验证与build竞争导致OOM；最终顺序，Vitest环境 VITEST_MAX_FORKS=2/VITEST_MIN_FORKS=1，
  build环境 RAYON_NUM_THREADS=2/NODE_OPTIONS=--max-old-space-size=768。不改任何build/test配置、不降低检查。
  首轮E2E label匹配问题已修preview aria-label；img intrinsic SVG width由浏览器决定，加载断言naturalWidth>0。

## Bubble 开始前和实施要求

先核对 git clean 与本文件提交，再读 AGENTS.md、parity-plan（B9/§7.5/§7.24/§8）、overall-design、
animation-system、documentation-site-and-distribution、CONTRIBUTING。
shadcn skill只读：禁 init/add/apply/create/preset，不生成components.json，不信consumer injected paths。
先找固定pin真实Bubble Base API、visual、guide与示例，核对installed源码。Attachment无需@shadcn/react
不能推广给Bubble；按Bubble实际API判断prerequisite。若确需npm包则精确版本独立提交；pin不移动。
流式消息模型按实际接口明确ownership，但不扩大到未排期AI、不伪造surface、不增加验证/请求编排。
新recipe先改animation-system。相对imports、共享lib、namespaced deps、cn caller last、Base render、
native props/events/ref cleanup；尤其className/style callbacks须真实执行，静态props regex不证明兼容。
Motion树中reduced与data-motion；none首帧零时长/live取消；nestedfull恢复localclock；不要为动画重挂输入/
滚动节点。UTF8/LF，Pythonencoding=utf-8，Biome只格式化改动文件；markdown表格也检查。
隔离生产 `.next-b9`（已存在可复用；不要碰.next用户dev），先查端口，Edge workers2；保留低内存命令。
真实pointer/keyboard/focus、desktop/mobile、rapid reversal/external updates/resize/OSreduce/live mode，
双主题全页axe与截图逐张review。source/content/meta后build再check；源和最终payload分别原子提交。
Bubble完成必须实际跑Attachment/Bubble/code-block联合gate与必要依赖回归，不能只两个新增项就假设B9闭合。
完成后保存所有后续目标/证据完整handoff并停止，由协调核验idle后再开下一唯一实施会话。不要自动继续历史gate。

## 必须继续保留的未闭合工作

- 历史 B1–B5 视觉gate仍开，尤其旧select/menu。早期batch done不代表后来承认缺失的视觉已补。
  B6/B7/B8 closed，不无故重开。下一项Bubble及B9联合gate；Attachment与code-block已shipped。
- §8逐条实查：每组件docs motion table / content/docs/motion catalogue；强制expectMotionContract helper；
  /components/button初始JS≤120KB gzip实测；preview variant/code view；install copy；搜索与category/
  intensity/complexity filters；TOC/prev-next/Edit this page；immutable /r/[...path]；missing guides；
  **站点**sidebar landmark/aria-controls/height-animation（不是registry Sidebar）；intensity定义；
  T0 responsiveness/performance承诺。部分可能已实现，必须实查，不能凭旧清单重复实现或直接关闭。
- 历史CSS popup全局 nested clock/live downgrade/none首帧未逐项证明；Nav/Sheet/Dropdown/Popover的
  局部修复与证据不能关闭全局gate，也不能替代旧select/menu完整历史视觉gate。
- 额外兼容性线索：早期Base UI wrappers继承className state callback类型却可能直接传cn。
  本轮Button/Popover popup/title/description已修，近期Sheet/Dropdown局部已修，但未证明全库；
  收尾必须按真实upstream类型实查className/style回调求值、caller last、render/ref cleanup。
  不以静态props提取/局部单测/本轮回归证明全库兼容；不是要求下一项偷扩全库重写。
- 不重开已closed contract drift/parity props；静态class/type提取局限不是缺失实现的替身。
- AI 25项未排期、direction deferred、form/native-select/sonner excluded；不扩大范围。
  AI prerequisites按真实排期处理。历史结论以parity-plan为准，不覆盖旧审计记录。
