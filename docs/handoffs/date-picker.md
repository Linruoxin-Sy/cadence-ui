# 串行 parity 交接：B8 Date Picker

本文件是 Data Table 完成后的下一项实施交接。目录 `D:/Code/Project/cadence-ui`。
协调会话确认 Data Table 会话 completed/idle、git clean 和下列提交存在后，再创建唯一 Date Picker 实施会话。
用户要求后续会话使用 GPT-6.1 Sol High；不启动子代理、并行代理或额外实施会话；无需 push、无需重复确认。
本文件的保存提交在 payload 提交之后；以实际 git log / git status 为准，不回退历史提交。

## 完整目标与当前边界

完整目标是按 `docs/parity-plan.md` 的依赖顺序完成所有已排期工作及未闭合 gate，每步原子提交。
下一会话只实施 B8 Date Picker block 及必要依赖、方案、证据、修复，并审计 B8 联合 gate。
之后 B9 attachment/bubble（code-block 已提前 shipped），再历史 B1–B5 gate 与 §8 实查/补齐。
不能以 B7、Data Table 或 B8 单项完成称整体目标完成。完成下一项后保存真正完整的后续交接并停止，
由协调确认 idle 后继续，不自行创建新会话。

## 最新实际状态

- main；开始 Data Table 前 HEAD `210443d`、git clean。
- `1125c4b chore(deps): pin TanStack Table v9 for B8 composition`。
- `d07f08d feat(data-table): ship B8 payments composition with pinned v9 guide`。
- `efad5da chore(registry): publish data-table block and B8 catalog`；随后仅本交接文件保存提交。
- 55 components（54 registry:ui + 1 registry:block）/ 62 registry items / 55 docs / 56 previews。
  `public/r/data-table.json` 的 `meta.sourceSha=d07f08d`。
- B6 gate §7.14 已关闭；B7 五项与 batch gate §7.19–7.20 已关闭。Data Table §7.21 shipped。
  B8 1/2；Date Picker next，B8 batch gate 仍开放。
- 新增且仅新增精确依赖 `@tanstack/react-table@9.3.1`；没有移动固定 pin，
  没有改共享 motion/provider runtime，没有构建或测试配置残留。tsconfig 的 Next 自动改动已恢复。
- 保留全部历史提交，特别 Sidebar `d0fb14d`/`210443d`，Resizable `99694dd`/`b2ad5c5`/`a3fa762`，
  Navigation `3c52632`/`8c3c773`，duration token `f1afa33`/`6b732e5`。

## Data Table 已完成，不重开

真实固定来源（pin `96da9cc7f1aa10580a3741664e2a77c721206c00`）是：

- Base composition: `apps/v4/examples/base/data-table-demo.tsx`。
- Base guide: `apps/v4/content/docs/components/base/data-table.mdx`。
- Visual reference: `apps/v4/registry/new-york-v4/examples/data-table-demo.tsx`。

不是 `ui/data-table.tsx`。指南和示例都使用 TanStack v9；已读安装包 d.ts/useTable 源码。
缓存 `.cache/shadcn/base-data-table.tsx`、`base-data-table.mdx`、`visual-data-table.tsx`；
供 parity --write 的缓存是 `.cache/shadcn/base/data-table.tsx`。
`pnpm exec shadcn docs data-table` 实际返回 not found；GitHub tree API 曾 403，
最终通过固定 SHA 的真实 raw 路径读取，不根据 ID 伪造 API surface。

保留 upstream exports `Payment`、`columns`、`DataTableDemo`，增加 DataTableDemoProps；
这是可复制修改的 payment-specific block，不是新通用 table primitive。
默认五条 payment、pageSize 10。data 可传入；sorting、columnFilters、columnVisibility、
rowSelection、pagination 可各自内部管理或配对外部 callback（TanStack value/updater）；
只传 state 是只读。callback 接管该 slice 的更新，配对 state 使用。
getRowId 使用 payment.id；选择不会因排序/数组换序选中别的记录。移除记录后的陈旧选择由调用方清理。
Header checkbox 只选当前页，status 统计过滤集合里的选中行。
邮件大小写不敏感排序/包含过滤，分页、列显隐和空态 visible colspan 均有实际测试。
Copy payment ID 使用真实 clipboard API，Email customer 是真实 mailto 链接，没有无效的假 View 操作。
原生 div props、caller class/style、React19 ref cleanup 均保留；native table 有名称/焦点环，
header scope/aria-sort，row checkbox 邮件名称。table/input 不以状态 key 重挂载。
表内两处 Checkbox 加 inline-flex，修复 span 行内盒子在 cell 内压成细线；浏览器断言至少16px。

T2 仅组合既有 `feedback.press`、`state.morph`、`popup.anchored`、`exit.fade`。
行排序、过滤、分页、显隐即时更新，无 reveal/data.transition/geometry.resize/额外motion runtime。
数据量大的服务端分页、虚拟化、编辑、validation、fetch 都由应用决定，不在本 block 偷加。
Preview 23条数据，五种外部受控状态、page size、reset、外部金额更新和本地motion切换。

必要 Dropdown Menu 修复在同一 source commit：portal 自己解析 duration.fast，包含 timeScale 与
reducedDurationScale；callback className/style 求值后 caller last；none 不带 starting/ending opacity。
真实浏览器发现只有 duration0 仍可能保留正在执行的 scale transition：现在 none 用
transition-none duration-0，reduced 用 transition-opacity，立即取消 scale。
本轮没有修改共享 clock。其他历史 CSS popup 的嵌套full/none gate 仍须逐项实查。

工具配套：sync-upstream 包含 block，sync 与 parity --write 保留 meta.upstream.path/guide，
parity offline 校验 source/guide 路径；manifest 是实际示例提取的三 exports、无自造 slots/API。
build-registry 对 block 也验证 docs frontmatter/deps；check-registry 对 block 也检查motion/intensity。
Date Picker 必须同样使用真实 composition 来源，不伪造 ui primitive。

## 最终证据

- 从最终 source `d07f08d` 再 `pnpm registry:build` + `pnpm check`：420 tests / 65 files，
  55 pinned surfaces；typecheck/Biome/registry freshness/tier gzip budgets/P11/parity 全通过。
  `.cache/data-table-final-registry.log`、`.cache/data-table-final-check.log`。
  唯一 Biome warning 是既有 item img；不通过配置降低检查。
- 隔离 `CADENCE_DIST_DIR=.next-data-table pnpm exec next build` 成功，66 static pages。
  `.cache/data-table-build.log`。之后恢复 Next 自动修改的 tsconfig；未改 next.config/playwright config。
- Edge 生产 23/23（26.9s）：Data Table 10 tests + 既有 Dropdown Menu 7 + Menubar 6。
  `.cache/data-table-e2e-final.log`；workers2、port3130，Playwright 自管生产 server，结束后无3130监听。
  PowerShell 经 pnpm 传带 `|` 的 grep 会被 cmd 误解；可直接运行：
  `node node_modules/@playwright/test/cli.js test tests/e2e/data-table.spec.ts tests/e2e/motion-matrix.spec.ts --grep 'data-table|dropdown-menu|menubar' --workers=2`。
- 三模式×两OS偏好真实逐帧 popup opacity/scale/duration：full变化、reduced无scale、
  none 首帧 opacity1/duration0。外层none内full恢复；同portal节点live none取消且 getAnimations0；
  system reduce保留节点/drop scale；同table/input/value；排序反转、筛选、三页边界、page selection、
  列显隐、外部reset/update、Space/菜单ArrowDown/Escape/return focus、390px keyboard横滚。
  真实剪贴板读回 payment-1、mailto地址正确、无pageerror。
- 双主题×1280/390 full-page axe WCAG2A/2AA/2.1AA零违规，无disabled rules，无document横溢出。
  `.cache/data-table-proof/data-table-{light,dark}-{1280,390}.png` 四张最终全页图逐张目视复核；
  `preview-{light,dark}-{1280,390}.png` 四张最终预览图也逐张复核。移动表格横向滚动，footer/控制区折行。
  缓存证据不提交。Git diff --check通过，source/public独立提交。

## Date Picker 开始前与实施要求

先核对上述提交和git clean，再读 AGENTS.md、parity-plan（§7.19–7.21与§8）、overall-design、
animation-system、documentation-site-and-distribution、CONTRIBUTING。
shadcn技能只读，禁 init/add/apply/create/preset；不生成 components.json，不信任注入的consumer路径。
固定pin不能移动。Date Picker 是 registry:block composition/guide；先查固定pin实际 Base 示例、
visual参考和官方指南。不要凭UI id推定存在 ui/date-picker.tsx。使用上面的真实来源metadata工具。

先看 Calendar、Popover、Button 的现有 API/依赖与已装源码，按实际guide范围实现。
受控/非受控日期、清空/禁用/范围（以真实guide承诺为准）、日期格式/locale/时区语义和keyboard focus
需明确；不添加validation/schema/resolver/validate props或数据获取ownership。
必要依赖精确版本独立提交。先按真实cause选tier/recipes；组合已有motion可声明dependency recipes，
不能为了动画remount输入/日历，新增recipe先改animation-system。

registry/cadence仅relative imports、共享lib、@cadence命名deps，cn caller last，Base render，
保留原生props/callback class/style/ref cleanup。Docs frontmatter与registry一致，flat ##，只有API可### parts；
测试用.test.tsx。UTF8/LF，Python读写encoding=utf-8，Biome只格式化改动文件。
三模式必须真实证明，none首帧零时长、live downgrade取消，同节点/焦点/输入保留；
嵌套full在none/reduced外层恢复本地clock不能假定已正确，Popover尤其需要实际核验。
本轮只证明Dropdown Menu与既有Navigation/Sheet，不代表其他popup全局通过。

浏览器隔离 `CADENCE_DIST_DIR=.next-date-picker`，先查空闲端口（3132可试），Edge workers2，
不影响用户dev。真实desktop/mobile、pointer/keyboard/focus、受控外部更新、rapid reverse、resize、
OS reduce/live mode/none首帧，双主题full-page axe/overflow与逐张截图review。
Date Picker完成后联合Data Table审计B8 gate；没有联合证据不能关闭。
source/content/meta改后registry:build再check；source+meta+docs+preview+unit/e2e+必要scheme+plan原子提交，
从final source commit再registry:build/check，public独立commit。保存完整下一项交接后停止。

## 必须继续保留的未闭合工作

- B1–B5历史视觉gate仍开，尤其旧select/menu。早期batch done不代表后来承认缺失的视觉已补。
  B6/B7已closed，不无故重开；B8 Date Picker与联合gate，B9 attachment/bubble仍待做。
- §8逐条实查：每组件docs motion table/content/docs/motion catalogue；强制expectMotionContract helper；
  /components/button初始JS≤120KB gzip实测；preview variant/code view；install copy；搜索与category/
  intensity/complexity filters；TOC/prev-next/Edit this page；immutable /r/[...path]；missing guides；
  **站点**sidebar landmark/aria-controls/height-animation（与registry Sidebar不同）；intensity定义；
  T0 responsiveness/performance承诺。部分可能已有实现，必须实查，不能凭旧清单重复实现或直接关闭。
- 历史CSS popup全局嵌套clock、live downgrade、none首帧尚未逐项证明；Nav/Sheet/Dropdown的证据
  不能关闭全局gate。Dropdown本轮回归也不能替代旧select/menu完整历史视觉gate。
- 不重开已closed contract drift/parity props；静态class/type提取局限不是现有缺失实现的替身。
- AI未排期、direction deferred、form/native-select/sonner excluded；不扩大范围。
  AI prerequisites按真实排期处理。所有历史记录以parity-plan为准，不覆盖旧审计结论。
