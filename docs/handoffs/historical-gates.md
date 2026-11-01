# 串行 parity 交接：B9 已闭合，历史 B1–B5 gate 与 §8 待审计

本文件是 Bubble/B9 完成后的完整权威交接，工作目录 `D:/Code/Project/cadence-ui`。
协调会话确认当前实施会话 completed/idle、git clean、下列提交存在后，再创建唯一下一实施会话。
本会话没有创建新会话、子代理或并行代理，没有 push，不再开始历史 gate。
用户授权持续按 `docs/parity-plan.md` 完成排期、原子提交、完整交接；不重复请求确认。
后续实施会话使用用户指定的 GPT-6.1 Sol High，串行、唯一实施。

## 完整目标、当前边界和下一项

整体目标尚未完成：B0–B9 实现已交付，B6/B7/B8/B9 batch gate closed；历史 B1–B5 视觉 gate 与
`docs/parity-plan.md` §8 carried work 仍 open。不能因组件已齐全或 B9 关闭而标记整体 goal complete。
下一步从历史 B1 gate 开始，先实查现有证据/测试，补真实缺口，必要修复保持最小范围；
完成一个有边界的 gate 后提交并保存完整交接，停止交协调核验。随后依次 B2/B3/B4/B5，再逐条 §8。
本轮没有偷跑这些审计，不能引用 B9 回归证明旧 select/menu 或全库 wrapper 已符合。
不扩大到未排期 AI、direction 或 excluded items。

## Git、数量和固定来源

- main，本轮起点 `19f8b2c`，开始时 git clean。
- Bubble 源码/metadata/文档/preview/单测/E2E/设计记录/计划：`9f28070`。
- 从该最终源码 rebuild + check 后的 public payload：`258c73c`，payload meta.sourceSha=`9f28070`。
- 本交接独立提交在其后，实际提交号见 git log；**不要为 handoff 再 rebuild payload**。
- 当前 65 registry items，58 documented components = 56 registry:ui + 2 registry:block，58 docs，
  59 previews，58 pinned upstream surfaces。旧计划总数57漏计提前交付的 code-block，现按真实清单改为58，
  B9计3项，AI backlog由旧26修为25。没有为凑旧总数遗漏组件，也没有伪造新增工作估算。
- 固定 upstream pin `96da9cc7f1aa10580a3741664e2a77c721206c00` 没有移动。
- 无新 npm 包、无 shared motion/provider runtime 改动、无 build/test 配置改动。
  本轮生产 build 的 Next 自动 tsconfig 修改已 restore。
- 历史保留：Attachment source `e32cb11` / plan `11cde69` / payload `2ac6c0d` / handoff `19f8b2c`；
  Date Picker source `08899b7` / payload `2c8daa1` / handoff `30adb9f`；Data Table `1125c4b` /
  `d07f08d` / `efad5da` / `079dcfe`；Sidebar `d0fb14d` / `210443d`；Resizable `99694dd` /
  `b2ad5c5` / `a3fa762`；Navigation `3c52632` / `8c3c773`；duration token `f1afa33` / `6b732e5`。
  不重写、回退上述历史。

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

1. **历史 B1–B5 visual gates**：按各batch真实清单查证据并补缺。下一步从B1开始，不把旧done等同
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
   本轮Bubble是原生useRenderComponentProps，不新增不适用的状态callback接口。
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
下一唯一实施会话仅由协调核实当前idle后创建，整体goal不可误标complete。
