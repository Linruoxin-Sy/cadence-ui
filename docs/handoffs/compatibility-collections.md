# 串行 parity 交接：B6–B9 有限 API/context 审查闭合

2026-11-02 Asia/Shanghai，D:/Code/Project/cadence-ui。接替 control-runtime.md。
本轮唯一实施者；没有子代理、并行实施、后继会话、push、发布、部署或 freeze。
本逻辑组完成后停止，由协调核实 completed/idle + clean，再决定下一唯一实施会话。
整体 /goal **未完成**，不因有限 ledger 绿而标整体完成。已有授权不重问。

## Authority 与提交

起点 clean438a716，前轮 runtime c53c55a、review60b0387、payload7007c0d 保留历史。
本轮按实质逻辑提交：

1. **4d34639** runtime：修复 collections/compositions 继承 callback/render/native/ref 契约；
   包含5个源码、2个测试和 Chart/Sidebar 用户文档。无依赖/lock/pin/API/default/export/
   data-slot/registry id/parity 记录变化。没有 motion token/target/recipe/controller 修改。
2. **523035d** review/evidence：有限93出口逐项结论、完整58/466对账、旧源反例/最终check/
   生产结果和预算；修正旧 Sidebar e2e 的两个歧义定位器。仅 tests/evidence/plan，runtime不变。
3. **8300605** final payload：63生成文件；132 current root JSON/MD、174 sourceSha字段
   均4d34639。review-only 不机械刷新runtime provenance。无快照冻结/修改。
4. 本handoff独立提交，SHA见 git log；不为handoff build。

固定 upstream pin96da9cc7f1aa10580a3741664e2a77c721206c00 不移。实装 Base1.9.0、
Motion13.5.1、React/ReactDOM19.3.1；Embla8.6.0、Recharts3.10.1、DayPicker9.13.2、
Resizable4.16.0、TanStack9.3.1。全部真实声明路径/版本仍在 unchanged inventory。
shadcn skill只读，遵守AGENTS边界；没有consumer init/add/apply/create/preset。

## 有限审查结果

手工 docs/evidence/compatibility-ledger.json，未重造pending inventory。
本轮B6六item29出口，B7五item45，B8两item6，B9 Attachment/Bubble两item13，合计93。
86条runtime +7条puretype/CVA；全部有限义务已审查关闭。最终：

- 58items/466exports = **342 reviewed-compatibility +124 reviewed-static**。
- 0open、0historical bounded。不是“58个组件全部运行矩阵通过”。
- 独立JSON名称核对与inventory逐item/逐export相等；相对438a716恰好只有原93open行变更，
  已审373行均逐值保持。CodeBlock24/Progress10未重开，inventory脚本/文件未改。
- 每行有具体kind/真实转发或context路径、证据与边界。透明div/Base转发有真实源码+继承
  类型+适用旧风险证据，无机械每div镜像测试。Provider/hook/columns/style emitter实际分类，
  不因没有className/ref判N/A。caller任意renderer负责spread真实props/ref及自写motion。

精确名字、共享路径、旧suite/historical gate适用范围、全部有限边界见
**docs/evidence/compatibility-collections.md**、ledger，以及
**compatibility-collections-validation.json**。旧 B6–B9 gate仍保留；没有用静态parity、
单onClick或axe0认证未审路径。Resizables的elementRef/groupRef/panelRef、CalendarDayButton
无公开ref的ButtonHTMLAttributes、Recharts/TanStack数据renderer与Base render均区别记录。

## 真实缺陷与修复

- Accordion Root/Item/Trigger 的 className(state) 传cn丢失；Content callback落到native
  measured div。现在按实际Base state求值caller-last。Content保留pin的inner class位置，
  outer Panel style/events/ref；私有useRender桥保留element/function和既有Base属性，
  不额外生成data-value。主panel/body稳定，测量observer/geometry recipe不变。
- Carousel Next/Previous、Sidebar Input/Separator/Trigger继承Base callback同样修复。
  native string-only API未被扩成callback；caller style/render/ref/events仍转发到真实依赖。
- 移动Sidebar原将native props传无DOM的Sheet Root且丢className。现在落到实际SheetContent，
  保留ref/styles/Sheet focus；dir也传desktop/static。桌面caller transform ownership不变。
- Tabs TriggerSurface把同一Base ref同时放props与useRender.ref，实际替换时cleanup两次。
  去掉重复入口，主tab/focus/controlled active state保持。
- Chart两个content声明native div props却吞style/ref/events/attrs。现在转发native rest，
  过滤实装引擎placement/animation metadata避免泄漏DOM；Tooltip formatter保持。Legend
  formatter和逐entry click/enter/leave用Recharts实参，caller clickable项提供Tab/Enter/Space。
  默认legend DOM/classes、controller、clock、recipes未改。empty/inactive仍null。文档已同步。

新增12个有效测试（新group文件9 +Chart3），旧测试全留。新测试放回旧源438a716时：
**9fail/11pass**，.cache/compat-final-counterexamples.log。失败：Accordion2、Carousel1、
Sidebar callback1/mobile1、Tabs cleanup1、Chart3。finally精确恢复当前源码后20/20通过。
原生drag capture/bubble/cancel、两render、真state、React19 cleanup/ref替换、同DOM/focus，
Sidebar全部5个native useRender（含Tooltip层）、AttachmentTrigger/BubbleContent、Nav guard
替换及Chart真实数据callback签名都有对应证据。没有为已有断言降标。

## Motion conformance 与命令

已读AGENTS/parity-plan/current handoff、前轮compatibility边界，以及animation-system
recipes/modes/budgets/review、overall-design/site-distribution/ADR/CONTRIBUTING。
编辑项declared=source=frontmatter=contract：Accordion geometry.resize；Tabs layout.shared；
Carousel data.transition；Sidebar layout.move；Chart data.transition。tokens、三mode分支、
38个animated真实helper/observer/reporter保留，没有提高源码预算/timeout/axe阈值。
全库first-paint/nested/liveclock审计仍独立OPEN。

严格串行停止源码编辑后，4d34639 authority：

1. `pnpm registry:build`成功65payloads/58docs，.cache/compat-final-authority-registry.log。
2. `VITEST_MAX_FORKS=2 VITEST_MIN_FORKS=1 pnpm check`：**675/675tests，86/86files，
   exit0，87.26s**，.cache/compat-final-authority-check.log。type/lint/registry/parity58/
   tier budgets及38实际helper reporter通过。Item img/原act提示未屏蔽。
   前一个675/86通过记录.cache/compat-final-check.log属于precommit，只以authority为准。
3. `RAYON_NUM_THREADS=2 NODE_OPTIONS=--max-old-space-size=768
   CADENCE_DIST_DIR=.next-compat-final pnpm exec next build`生产成功，
   .cache/compat-final-authority-next.log。Next生成tsconfig仅format/include差异保存为
   .cache/compat-final-authority-tsconfig.diff，人工核对后只restore本轮tsconfig变化。
4. 已实查3162空闲后Edge/msedge、workers2生产浏览器。没有碰用户.next/3000。
5. 只改e2e定位器后 `pnpm typecheck`再次exit0，.cache/compat-final-post-browser-types.log；
   改动文件Biome检查通过。不为test/evidence-only重复source build/check。

中途新Accordion bridge generic类型错误用spread state/props符合public useRender要求修复；
Tabs新测试cleanup2次是真缺陷而非noise。第一次证据写入Python默认GBK读UTF8文档失败，
改显式UTF8/LF，未留编码损坏。PIL未安装，截图contact sheet改用已有Next sharp，未安装依赖。

## Production结果与失败修正

全报告 .cache/compat-final-browser.json：42 cases，35pass/7fail。
7fail = Sidebar6个旧歧义locator +预算1；并非42pass。
`/^Side/`同时匹配旧Side和新增Sidebar variant。先收窄whitespace不匹配真实accessible name
Side（.cache/compat-final-sidebar-browser.json：2pass/6fail）；exact Side随后暴露旧
getByLabel(Variant)也匹配Sidebar variant（-sidebar-exact-browser.json：2pass/6fail）。
最终实际role/name精确Side与Variant，不改行为assertions/30s超时/selector目标：
**.cache/compat-final-sidebar-authority-browser.json 8/8pass**。

合并去重为 **41 unique behavior/a11y cases pass，预算1仍fail**。五组件三mode×两OS，
实际测量/engine/同node取消/keyboard/focus/resize/portal/desktop/mobile旧断言保留。
最终visual rerun `.cache/compat-final-visual-browser.json` **14/14pass**（grep axe还匹配
Carousel axes标题，不能写成14个visual cases）；18 PNG逐张在3张six-image contact sheets
审查，.cache/compat-final-proof。Accordion/Chart/Carousel/Tabs双主题、对应mobile/selected/
vertical状态正常；Sidebar8/8含2responsive axe cases。无axe规则关闭。
这些是受影响路径有限回归，不是全库first-frame/live-clock矩阵，也不是最低React全58认证。

## Initial JS预算仍OPEN/FAIL

最终新production实测 **292267gzipbytes /23scripts >120000**；
**docs/evidence/compatibility-collections-js.json**保留全部requests/bodysha/gzip、BUILD_ID/
root manifest校验、all200/no pageerrors。与前轮数值相同是实际重测，不是复用旧report。
freshEdge/cacheoff/nointeraction/networkidle+10s+networkidle，所有自动async/prefetch
逐body gzip6；未排chunks、延窗、抬限、移inline/data或删SSR功能。
旧292267/292314/292327/292344/291749/291658/291423/baseline290171均保留。
Button是失败共同baseline；真正闭合需所有适用完整shell页，尤其Chart/Calendar/CodeBlock，
不机械跑58red路由。check绿不盖budgetred。
ADR009仍Next App Router，ADR016仅研究；旧directSSR fence120492/install136462失败方案未采纳。
完整产品方案保留header/sidebar/search/navigation/package-manager/source/installcopy/realpreview/
modes/focus/a11y。19.0小fixture不是完整产品预算认证。

## Distribution与clean

8300605的63生成文件，current root132JSON/MD；174sourceSha均4d34639。
冻结public/r/snapshots/84cc78703b354b29c815c3970cb26973e4760dea398fdf48756b8a24c996b2f1/、
registry-snapshots.json、.gitattributes相对438a716无diff，未freeze。latestETag revalidation、
frozenimmutable、beforeFiles rewrite优先保持。Playwright自有3162server自动退出。
本handoff独立；git diff --check和最终git status clean后停止，不自己创建后继。

## 全部remaining与下一实际runtime组

1. 全部适用site页initialJS≤120KB方案与范围匹配的production证据，当前red不能带过。
2. **有限ledger已466/466闭合**；下一组不重造pending表、不重开无关34Progress/CodeBlock。
   只在新真实缺陷证据出现时有界修复。随后最终goal逐要求审计仍必须做。
3. 全库CSSpopup nestedclock/nonefirstframe/livecancel/full→reduced去geometry留opacity；
   现B4/B5/Nav及本轮局部证据不能代替全库。
4. 全库Motion same-target mode/clock真取消、nestedfull、nonefirstframe；held-press期间
   disabled视觉取消仍OPEN，activation/unit/helper不证明。只改transition prop不证明停止。
5. 精确待验证点（**不是已证缺陷**）：c53c55a将ControlAnimation和OTP改passive useEffect；
   离散事件probe已过。未来global矩阵要测外部异步controlled mode/value/clock提交后的
   第一绘制帧，确认none无一帧旧动画、OTP不先显示终态再淡入。按实际证据决定是否
   prepaint stop/set加后续queued重申；不能仅凭useEffect推断bug或宣称已证明安全。
6. Combobox有限outside mouse/touch/Tab/ShiftTab/reopen/unmount/parent/sibling/属性ownership
   已闭，不沿用旧inert吞activation泛化待办；独立motion/provider矩阵仍含其实际parts。
7. 最终整个goal逐条审计，预算red/未验global matrix不能complete。

前轮authority不可回退：c53c55a无useEffectEvent硬依赖，真实React/ReactDOM19.0 fixture六mode×
OS/动画/none停止/同目标clock/无关rerender/OTP/focus/refcleanup通过，不等于全58最低版认证。
原“4首帧fail”真实为Checkbox/RadioGroup操作采样scale0.96；Motion13.5.1旧same-target
frame.update写回覆盖none.set，经stop/set+public frame.update重申/cancelFrame修复。原断言、
真实WAAPI negative和真实animated-part探针保留；B3/B5局部67pass、final原4+negative5pass
不等于全库。press/native-div私有nativeEvents/nativeRef layoutcommit、CodeBlock internal/caller
DOMhandle合成、Provider token-only默认fallback语义全部保持；caller Motion程序不能当库控制。

保持已闭58=56UI+2blocks/65items/58docs、B1–B9历史gates、recipe/helper/highlight、URL37axes/
118options/21N/A、58页noJS、siteflow/catalog/sidebar/intensity/distribution/guides/T0templates。
AI25unscheduled/directiondeferred/form-native-select-sonnerexcluded不扩；MCP/分发Skill/release/
hosting未实现或授权不虚构。下轮仍serial唯一实施，无子代理/后继/push/发布/部署。

继续按编辑→registrybuild→check串行；VITEST_MAX_FORKS2/MIN1，Next RAYON2/NODE768MB，
隔离distDir和实查空闲端口，Edgeworkers2，不碰用户.next/3000。UTF8/LF，Biome只改动文件。
source/content/registry改先build再check，finalruntime提交后再build/check；payload与handoff
独立；evidence-only不机械刷新runtime sourceSha。冻结目录/retention manifest/-text不可动。
