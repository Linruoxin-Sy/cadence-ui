# 串行 parity 交接：组件页流程落地，variant 全量与预算仍 OPEN

工作目录 `D:/Code/Project/cadence-ui`，2026-11-02（Asia/Shanghai）。
接替 `site-code-fence-boundaries.md`；先读该交接、runtime/budget 两份交接、
`docs/site-js-budget.md`、本轮 `docs/evidence/component-page-flow.md` 和
`docs/evidence/component-page-js.json`，以及 AGENTS、parity-plan §8、站点设计 §2.2、
overall-design、animation-system、ADR。历史研究证据与交接保留。

本轮唯一实施会话，未创建会话/子代理/并行实施，未 push，未重复确认。
**整体 goal 未完成，initial JS 预算仍 OPEN；Button 之外的 URL variant 仍 OPEN。
本轮没有把组件页全部预览承诺或 §8 标成完成。** 协调核实 completed/idle 与 git clean
后再启动下一唯一会话。本会话交接后停止，不创建后继。

## 提交和范围

起点 `0c35508`，git clean；前序 research `6da369a` / payload `2c94b71` 已在历史中。
实现 **a9fd620** `feat(site): add component source and document navigation flows`。
最终源码 payload **7008da2** `chore(registry): rebuild payloads from a9fd620`。
本文件与最终 budget JSON 是独立交接提交，不为它们再次 registry build。

固定 pin `96da9cc7f1aa10580a3741664e2a77c721206c00` 不变，Base UI 实装1.9.0。
58 components /65 registry items /58 docs /38 animated suites /20 T0 suites 保持。
无依赖、框架、配置、配额、测量口径、recipe 或 token 变更。

## 实际实现和矩阵

完整可追踪矩阵和58个preview源码清单在 `docs/evidence/component-page-flow.md`。
开始实查发现旧 §8 的 copy-command 未使用描述已过时：真实 Installation 已通过 MDX install
fence → PackageManagerFence → PackageManagerBlock 接通。未重新造安装控件或改变三种管理器偏好。

- 58页新增原生 Component source disclosure，服务器读取实际 `public/r/<id>.json` 全部 files。
  复用 CodeFence → build-time highlight → registry CodeBlock/copy；没有手写 pre，没有删除高亮/复制。
  明确这是可安装源码，Usage仍是可运行用例。源码展开与preview是兄弟，不重挂或替换preview。
- Mdx 改为 await compileMDX，一次编译中的实际 heading tree 同时生成 h2/h3 ID 与 TOC。
  inline code 的文字保留；重复slug有后缀；fence文字不会误当heading；支持 direct anchor。
- prev/next 按 `listComponents()` 的真实 registry order，首尾不制造回环。Edit 指向已核实
  origin/main 的 `content/components/<id>.mdx`，不是站点源码或虚构项目地址。
- 文档表格保持语义 table/tabIndex 和overflow wrapper；44rem table最小宽度、7rem cell、
  最后一列16rem，内部键盘横滚，不挤成单字。此规则也作用于guide的MDX表格。
- CodeBlockCopyButton 拒绝写入或缺少clipboard API时用原 live region 宣布失败；可重试。
  复用 copiedText 状态（false表示失败），调用者 preventDefault 会取消复制。成功保留原morph。
  首版独立error状态令T5体积刚超预算，合并状态后原门禁通过，未提高阈值/删功能。
- Button真实六种视觉variant新增URL/client-state selector，默认all保留原16按钮矩阵。
  切换隐藏已有specimens，保留DOM，不以key重挂；保留motion参数/hash、popstate和back/forward。
  其他57个preview的状态、方向、placement、tabs、composition仍是原来真实控件/并列specimens。
  **不能声称它们都支持 `?variant=`。** 设计文档明确当前实现范围；没有加只换标签的假selector。

尚未完成的本组范围：其他具备可命名形态的preview是否需要URL selector，逐项定义真实形态和
对应控件/状态后实现并证明。源码清单只记录真实prop/aria-label存在，不能把它算成每页URL或
交互验收。下一会话应先解决这项明确缺口，再继续index/sidebar；不要凭本轮代表页关闭全库。

## 验证和限制

- Precommit registry build +完整check：`.cache/component-page-precommit-registry.log`、
  `.cache/component-page-precommit-check.log`，**560/560,77/77 files,72.32s,exit0**。
- a9fd620 后顺序 registry build/check：`.cache/component-page-source-registry.log`、
  `.cache/component-page-source-check.log`，**560/560,77/77 files,72.33s,exit0**。
  type/lint/registry freshness/P11/tier budgets/parity58均通过，38suite三mode reporter不弱化。
- Payload全部67个JSON递归忽略sourceSha比较，只有code-block.json的实际source内容变化；
  git最终60files变更，其余是sourceSha；新sourceSha为a9fd620。没有内容/metadata漂移。
- 最终隔离生产 `.next-component-page-final`，`.cache/component-page-final-build.log`，69pages。
  RAYON_NUM_THREADS2/NODE_OPTIONS768MB；最终check完成后才build。早期探索有一次check尾部与
  第一次build短暂重叠，最终验证已串行执行。未碰用户.next/3000。
- Next只添加隔离types include和格式变化，核实`.cache/component-page-tsconfig.diff`后restore。
  产品配置与工作树没有遗留差异；端口3141/3142事先查空闲，Edge/msedge workers2。
- 最终生产 Edge **25/25 passed,55.9s**：`.cache/component-page-final-e2e.log`。
  12 = 新组件页11case +旧package-manager1case；13 = 保留CodeBlock tabs/fold六mode×OS组合
  和travel pill layering。旧测试原样执行，没有改变超时/retry/阈值或axe规则。
- 一个SSR case核实全部58路由200、每个TOC链接与真实heading文字/id相同、registry-order
  prevnext、真实Edit路径、所有payload源文件逐行相同。它不加载58个hydrated runtime；此前各
  batch生产验收保留，不能把SSR检查说成全库浏览器交互重验。
- 六个Button mode×OS case证明真实held scale full0.97/reduced-none1、selector真实改变可见
  specimen、focus/DOM identity、URL/hash、back-forward、source展开/真实clipboard、TOC anchor。
  direct #usage入页后先scroll目标并click建立pointer，再按压采样，避免离屏坐标/首次pointer误差。
- 安装case用真实npm完整命令，注入一次clipboard拒绝，验证live失败/重试/成功/focus及reload偏好。
  pagination用键盘Enter实际跳Badge再back。旧跨guide/home偏好case保持。
- Button/Dialog/CodeBlock/DataTable × light/dark ×1280/390：16张全页截图与全页axe WCAG2A/
  2AA/2.1AA全部zero，无规则禁用，无document横向溢出；mobile实际ArrowRight令内部scrollLeft>0，
  table宽度≥704px，源码展开另做axe。`.cache/component-page-proof/`16fullpage +source-open PNG、
  四个review contact sheets已视觉检查；测试拍图前重置table/window scroll，避免把滚后左列当缺字。
  这些是相关代表页，不是58页新增全库视觉证明。
- 初始browser断言失败来自测试把第一个Browse details当source、selectOption不主动focus、
  跨平台clipboard换行、CodeBlock按行span不产生textContent换行；最终按真实语义修正并严格比源。
  没有用删除断言/改预算掩盖产品回归。
- CodeBlock的五个recipe仍declared=implemented=documented；未添加动画、literal时钟或engine。
  三mode helper runtime22test suite与旧browser tabs/fold矩阵通过。静态失败反馈不改变原motion。
  此证据不替代全库same-target live cancel/nested override/first paint审计。
- UTF8/LF、Biome只处理改动文件、git diff --check通过。旧Item img和Base act/nativeButton警告未扩修。

## 初始 JS：仍失败，新增功能的真实成本

最终源生产版Button冷加载 **290675 bytes gzip /22 scripts**，原产品baseline290171，差 **+504**。
预算120000，gate **exit1仅预算断言失败**；manifest/root SHA一致、所有script200、pageerrors=[]先通过。
BUILD_ID `z6qSzsZJu8NC6htak86_h`。提交 `docs/evidence/component-page-js.json` 保留完整22实体
URL/SHA/raw/gzip/initiator及roots；完整CDP requests在`.cache/component-page-final-requests.json`。
原JSON reporter `.cache/component-page-final-budget.json`，stderr同名前缀log。
口径没有改：fresh Edge/CDP禁cache，无交互，load+networkidle+10s+networkidle，全部自动script
按URL去重逐实体gzip。没有把source/copy/hydration延迟过观察窗，没有关闭红门禁。
历史290171是旧baseline；新产品数应引用本次290675，不改写历史研究结果。

ADR009仍Next App Router；ADR016仅研究，未采纳framework/component优化。前序候选
scoped fence120492、加实际install136462均只是无完整chrome的失败子集。保留后续
install-control layout/generic animate/fold依赖边界调查和完整shell+route hydration prototype gate；
只有保留所有功能、SSR、source/install/navigation/search/preview、真实mode/focus/a11y且全部自动JS
≤120000才闭合。不能通过删功能、提高预算、排除chunk、延迟观察窗后加载或迁移失败候选凑绿。

## 下一唯一会话必须保留的 open

1. 本轮matrix真实缺口：Button之外URL variants，按每preview实际形态定义，不重写所有preview
   为虚构统一API，不重挂丢state/focus；不是把并列specimens或mode selector改名variant就完成。
2. §8 index search/category/intensity/complexity filters；优先实际源码再实现。Site sidebar当前已
   有aria-controls与height分支，旧文字不能代替审查：landmark、ID ownership与height recipe/tier
   conformance仍OPEN；它与registry Sidebar不是同一个组件。
3. immutable /r缓存/route与missingguides/accessibility/registry/ai/changelog；仅静态文件存在不
   等于cache承诺履行。没有本轮顺手完成这些项目。
4. metadata intensity定义一致/T0 responsiveness-performance模板强制；本轮只修表格可读性。
5. initialJS仍OPEN，研究下一安全行动如上；docsrecipe/helper/highlight reliability保持closed。
6. 跨库callback/render/ref/nativeevents：查实际Base类型、callback求值/callerlast、render element/
   function、React19cleanup/nativeevents。原生useRender.ComponentProps仅string/object。
   B1–B5局部证据与静态parity不代替全库兼容。
7. CSSpopup全库nestedclock、none首帧/livecancel、full→reduced去geometry保留opacity；
   Navigation/Sheet/Dropdown/Popover/B5局部实证不豁免未审部件。
8. Motion same-target running动画不因transition prop变化自动取消；ControlSpan/helper adoption
   不代表全库proof，不强制remount或丢focus。全库livecancel/nestedfull/none首帧审计保留。
9. B5Combobox inert outsidepointerdismiss/activation、Tab/ShiftTab、nestedownership/cleanup真实
   兼容仍OPEN；axe0不替代native兼容。B1–B9历史gates与contractdrift/parityprops保持closed。
10. AI25unscheduled、directiondeferred、form/native-select/sonnerexcluded不扩；Attachment/Bubble
    无新增包不等于全AI prerequisites完成。

继续relativeimports/sharedlib/namespaceddeps/P11UIonly/tokens/reduced-none/Base render/callerlast/
refcleanup；shadcn只读，禁init/add/apply/create/preset/components.json，不移pin，不弱化门禁。
source/content/meta变化先registry:build再check；source原子commit，final-source payload独立，
完整handoff独立，不为handoffbuild。不push、不创建会话/子代理；协调核实idle后再继续。
