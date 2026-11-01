# 串行 parity 交接：B1/B2 有限兼容性审查完成

2026-11-02 Asia/Shanghai，仓库 D:/Code/Project/cadence-ui。
接替 docs/handoffs/compatibility-native-div.md。本轮唯一实施者，无子代理、并行实施或
后继会话；未 push/发布/部署/freeze。完成本组后停止，协调核实 completed/idle + clean
后创建下一唯一实施会话（用户指定 GPT-6.1 Sol High）。已有授权无需再询问。
整体 /goal **未完成**，不能带预算 red 或未验矩阵标 complete。

## 提交与 authority

起点9510df4 clean；上一轮 runtime source129365a、payload d606fcf 保留。
本轮最终 review/test source authority **08d8452**；生产运行码仍与129365a一致。
五个文件：新增 compatibility-atoms 风险测试及逐出口证据，扩展 Card 测试，更新手工
ledger 与 parity-plan §8。source 提交后再次 registry:build→pnpm check，见末尾最终结果。
public 为独立提交，完整 handoff 再独立提交；本文件不触发 build。

固定 pin96da9cc7f1aa10580a3741664e2a77c721206c00；Base1.9.0/Motion13.5.1/
React19.3.1/Lucide1.62.0，真实继承类型和声明路径在 compatibility-inventory.json。
shadcn 技能只读，核对 .cache/shadcn/base 下固定 pin 副本及 manifest；未运行 consumer
init/add/apply/create/preset，没有 components.json，无依赖/lock/config/API/default/slot/
recipe/timing/class/DOM/生产交互改动。没有 Next build、tsconfig 生成差异或端口/server 操作，
未碰用户 .next/3000。没有动画实现改动，不引入新动画契约。

## 实质审查结果

B1十一项：button,badge,kbd,separator,label,input,textarea,card,aspect-ratio,avatar,skeleton。
B2九项：alert,empty,item,field,button-group,input-group,breadcrumb,pagination,spinner。
按实际 registry/meta/源码/type inventory 核对全部20项 **164实际导出**（不是每组件一行占位）。
读对应现行完整源、pin API/defaults、实装继承类型/具体上下文、20个组件 suites、B1/B2
compatibility suites、button-native 及历史 B1/B2 gate/handoff；逐出口证据在
docs/evidence/compatibility-atoms.md，区分 native DOM、Base forwarder、native useRender、
测量 DOM、Lucide svg forwarder、纯 type、CVA helper。没有公开 provider/context 导出遗漏。

没有发现需要更改生产源码的兼容性缺陷；透明 rest 转发 + 真实类型 + 适用既有测试支持
有限审查，不为每个静态 div 写镜像测试。Button 旧四事件/动态 ref/取消/render/键盘表单/
disabled activation 证据足以将有限兼容性义务改为 reviewed-compatibility；same-target
live mode/clock、按压中 disabled 的**视觉**取消依然独立 OPEN，不能因 activation 测试关闭。
Toggle/Group 不在本组，保留三个 bounded-runtime 历史行。

ledger 现在 **205/466 classified，261 open**：94 reviewed-compatibility，108 reviewed-static，
3 bounded-runtime。B1/B2 164中 Button 的3出口此前已计数，净新增161分类，未重复计数。
独立 one-shot核对58项/466名字与 inventory完全一致，B1/B2全为reviewed，其他项逐行
JSON与原HEAD相同。生成 inventory 保持不变；生成脚本绝不覆盖手工结论。

关键边界：

- 原生 ComponentProps/useRender.ComponentProps 是 string class/object style，不假装拥有
  Base callback；InputGroupInput 是 native input公开类型，即使内部用 Base Input。
- Button/Input/Avatar Root/Image/Fallback/Separator 与真正继承它们的wrapper支持Base
  callback，先求值再cn callerlast；style/render/ref/events在rest保持。
- 原生四 useRender 为Badge/Item/ButtonGroupText/BreadcrumbLink；实际 Base useRenderElement
  用 useMergedRefs 合并 props-ref/render-element-ref；mergeProps 本身不合并ref。element
  自有props在后组合；function renderer必须spread实际props/ref。preventDefault与
  preventBaseUIHandler所有权不同，无限caller自定义renderer排列不属于库的有限义务。
- Card default ref直达shell；fit分支合并内部测量及callerref，React19 cleanup、identity
  变更重连observer，fit拥有测量height，其他style透传。无动画，不能凭fit把它改T3。
- ButtonGroup是CSS-only group，无ButtonGroupButton导出/隐式provider/roving state；
  InputGroupButton真实经过已审Button。Addon caller click先跑、defaultPrevented veto、
  button后代排除、否则聚焦首input；不聚焦textarea为既有pin行为。
- Cadence Field不是Base Field.Root，无表单状态/验证provider；caller拥有value/invalid/
  ids/associations/errors，FieldError只是dedup/显示既有messages或null，P11保持。
- KbdGroup div props但DOM kbd、EmptyDescription p props但DOM div为真实pin行为；
  AspectRatio合并style但owned --ratio由ratio prop决定；Pagination是native anchor，
  只用buttonVariants，不穿过Button/Motion。私有装饰不视为caller props自动可达。

## 新增有效风险测试及验证

新增13项（新suite12 + Card1），没有删旧测试/改阈值/弱化 helper/reporter：

- 四个真实native useRender出口各element/function两形态，共8项：真实drag事件
  nativeEvent/currentTarget身份、取消/bubble、callback替换/cleanup、同DOM/focus、class/style更新。
- InputGroupButton置于真实ButtonGroup/InputGroup/Addon中，四个原生冲突事件各自身份与取消，
  callback→object refcleanup、disabled callbackclass/style同DOM更新。
- Field受控值请求不夺caller ownership，显式label/description/error关联，invalid仅caller更新。
- Separator function render动态orientation/style/class与callback→object cleanup同DOM。
- Avatar keepMounted Image function renderer接真实error，root/image/fallback状态class/style更新。
- Card callback→callback→object交接，observer断连/重新测量、同shell/子button焦点保留、unmount。
  jsdom沿用显式layout stub，不冒充生产测量；Avatar不冒充成功网络图片下载。

实际命令/日志：

- 初次 targeted两suite23/23，.cache/compat-atoms-targeted.log。
- Fixture最初将四种default-tag union的ref写成anchor-only，typecheck发现类型不兼容；
  修成HTMLElement callback refs，无cast/生产类型widen。Biome发现观察bubble的祖先/raw img/
  由Base注入children的空render element，局部说明后修正；最终typecheck通过。
- `VITEST_MAX_FORKS=2 VITEST_MIN_FORKS=1`；`pnpm exec vitest run
  tests/components/compatibility-atoms.test.tsx tests/components/card.test.tsx
  tests/components/b1-compatibility.test.tsx tests/components/b2-compatibility.test.tsx
  tests/components/button-native.test.tsx`：43/43，.cache/compat-atoms-risk.log。
- 首registry构建在Windows写public/r/cadence-base.json时UNKNOWN/open失败，
  .cache/compat-atoms-registry-build.log；原命令retry成功65payloads/58docs，
  .cache/compat-atoms-registry-build-retry.log；没有改构建规则。
- 首全check停在证据表格编辑后的format差异，.cache/compat-atoms-check.log；Biome仅改动文件
  修正后check658/658、85files、86.25s，.cache/compat-atoms-check-final.log。
- 本地source初提交4f2ff6b后registry/check亦658/85、86.26s，.cache/compat-atoms-final-*.log。
  终审发现Card ledger比实际assertions多写border，删除该词并amend本轮未分发source为08d8452；
  以08d8452后再次build/check为最终authority，日志/结果见末尾。未增补无必要测试来凑措辞。

无生产renderer/interaction/class/recipe变化，有据复用B1/B2/press现有生产Edge/双主题证据；
本轮没有新浏览器测试或预算实测，不伪称新测。全部38 animated suites的真实Motion/
motion.create observer/runtime helper reporter保持；绿check不是全库live audit认证。

## 每页首屏JS预算仍 OPEN / FAIL

animation-system §7明文 **Initial JS per page ≤120 KB gzip**；overall-design checklist
也为initial page JS。不是Button-only预算。最近真实 production测量仍292344 gzip bytes /
23scripts >120000，docs/evidence/compatibility-native-div-js.json；无首屏runtime变更故复用。
旧291749/291658/291423、baseline290171全保留。Button为已失败共同/基线路由，不能把
最终scope缩到Button，也无需现在机械重复58个同样red路由。真正闭合时必须覆盖全部适用
site页面及完整shell，尤其Chart/Calendar/CodeBlock重路由。
fresh Edge/cacheoff/nointeraction/networkidle+10s+networkidle，全部automaticasync/prefetch
scripts逐body gzip6 + manifest/hash核对；不抬限/排chunk/延窗/删SSR功能。pnpmcheck绿不盖red。
ADR009仍NextAppRouter，ADR016只调查；directSSR ordinary fence120492/install136462失败未采纳。
完整SSRroute/shell须保留header/sidebar/search/navigation/package-manager/source/installcopy/
realpreview/modes/focus/a11y；小fixture不能证明完整产品预算。

## 全部 remaining 与下一实际组

1. 每页initialJS仍red，完整可行方案 + 真实scope匹配证据。
2. 全58compat剩261未review出口逐实际实现审查；另Toggle/Group3DOM仍historicalbounded。
   下一有限组 **B3八项**：checkbox/radio-group/switch/slider/toggle/toggle-group/input-otp/progress。
   Progress10出口已reviewed，按当前未变实现有据复用，不重开34个已闭Progress/CodeBlock出口；
   Toggle/Group有限义务应按现有真实证据收束，独立running矩阵不要混进compat状态。
   其余未审组件在ledger精确open行；不要再生成一个全pending inventory代替审查。
3. 全库CSSpopup nestedclock、nonefirstframe/livecancel、full→reduced去geometry留opacity。
   现有B4/B5/Nav局部证明不等于全库；真实portal局部时钟和nestedfull必须逐路径。
4. 全库Motion same-target mode/clock取消、nestedfull、nonefirstframe；Button/Toggle/Group
   disabled-during-press视觉取消仍OPEN。B3局部/expectMotionContract/transitionprops更新/activation
   单测不能证明停止运行中动画。对应registry真实公开parts、tests/e2e/motion-matrix.spec.ts
   及真实需要的生产fixture逐项验证，不强制remount/focus丢失。
5. Combobox FocusSafety：inert outsidepointer dismiss/activation、Tab/ShiftTab、nestedownership/
   cleanup真实路径；registry/cadence/combobox/index.tsx与适用B5生产测试，axe0不足。
6. 最终整体完成审计；预算red/未验矩阵不标goalcomplete。

保持closed：58=56UI+2blocks/65items/58docs、B1–B9 gates、recipevalidation/helper/highlight、
URL37axes/118options/21N/A、58页noJS、source/install/TOC/prevnext、catalog/sidebar/intensity、
distribution/guides/T0templates。AI25unscheduled/directiondeferred/form-native-select-sonnerexcluded
不扩；MCP/分发Skill/release/hosting未实现/未授权不虚构。

不要回退press-button nativeEvents/motion.create/nativeRef layout commit/React19 cleanup、
native-div仅公开ProgressIndicator/floatingCodeBlockActions的适配，以及CodeBlockTabs/Content
内部ref与callerref并存修复。private indicator/ControlSpan/Div不凭import推断caller可达。
Shipped relativeimports/sharedlib/@cadence deps/Base render/cn callerlast/P11继续；动画实现
改动先读animation-system且declared=implemented=documented、token/full/reduced/none完整审计。

后续check/build严格顺序；Vitest forks2/min1；需要Next生产build时
RAYON_NUM_THREADS=2 NODE_OPTIONS=--max-old-space-size=768 CADENCE_DIST_DIR=.next-compat-atoms，
不碰用户.next/3000，Edge/msedge workers2先实查空闲port；Next tsconfig生成diff保存核实后
仅restore本轮。源码/content/meta改变先registry:build再check，finalsource之后再次build/check，
public独立commit，完整handoff独立且不为handoffbuild。UTF8/LF/Biome仅改动文件。
Distribution132current资源；冻结public/r/snapshots/84cc78703b354b29c815c3970cb26973e4760dea398fdf48756b8a24c996b2f1/、
registry-snapshots.json、.gitattributes -text均保持，latestETagrevalidate/frozenimmutable/
beforeFilesroute优先不变，无freeze。

## 最终 source / payload / clean

最终source08d8452后registry:build成功65payloads/58docs，
.cache/compat-atoms-authority-registry.log；随后pnpm check exit0，658/658tests、85/85files、
85.47s，.cache/compat-atoms-authority-check.log。type/lint/registry/parity58/tierbudgets及
38suite runtimehelper reporter通过；既有Item img warning/React act提示保留，不屏蔽。

public独立提交 **2189a5a**：60个current JSON，仅sourceSha更新为08d8452；
逐JSON递归移除sourceSha后与提交前完全相同，注入code/docs/其他metadata不变。
一次临时核对脚本误比full SHA与payload short SHA而失败，按build-registry.mjs真实
rev-parse --short规则校正后60项全过，无产品修复/重建需要。
冻结snapshot/registry-snapshots.json/.gitattributes未变，132current资源数不变。

本handoff独立提交（SHA见git log），不为handoff build。末次git diff --check与
git status --short均通过/clean后停止；协调再开下一唯一实施会话。
