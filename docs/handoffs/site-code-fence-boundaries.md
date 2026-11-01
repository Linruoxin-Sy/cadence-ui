# 串行 parity 交接：真实 fence feature 边界有收益，预算仍 OPEN

工作目录 `D:/Code/Project/cadence-ui`，2026-11-02（Asia/Shanghai）。本文件接替
`site-runtime-boundaries.md`；完整读该文件、`site-initial-js-budget.md`、`docs/site-js-budget.md`、
三份 `docs/evidence/site-{js-budget,runtime-boundaries,code-fence-boundaries}.json`、AGENTS 与适用设计/ADR。
本轮唯一实施会话，未创建会话/子代理/并行实施，未 push，未请求重复确认。
**B1–B9 gates closed；整体 goal 未完成，initial JS 预算仍 OPEN，不能标 complete。**
协调核实 completed/idle、git clean 后再开下一唯一实施会话；本会话交接提交后停止。

## 提交与范围

起点 `5a1a3d5`，git clean。研究实现 **6da369a**：扩展可运行 SSR probe，增加真实复制与
package-manager 功能断言、feature 图断言、compact JSON、测量报告及 ADR-016/§8 调查记录。
产品 app/component/content/metadata/依赖/Next config/安装树无改动；未采纳组件或框架变更。
固定 pin `96da9cc7f1aa10580a3741664e2a77c721206c00`，Base UI 实装1.9.0。
58 components /65 registry items /58 docs /38 animated suites /20 T0 suites保持。
最终 payload **2c94b71**；payload 与本交接独立提交，不为交接再次 build。

## 新实证与决定

三个 fresh Edge 冷加载、CDP禁cache、无交互10秒、全部自动script逐URL去重逐实体gzip：

| 隔离候选                                                | gzip bytes | scripts |
| ------------------------------------------------------- | ---------: | ------: |
| scoped Button + 原CodeBlock普通fence，重复baseline      |     135334 |       3 |
| scoped Button + 拆tab模块/同步scoped CodeBlock普通fence |     120492 |       3 |
| 上一候选 + 实际PackageManagerBlock/Provider             |     136462 |       3 |

CodeBlock root 的 firstTabValue 通过函数identity引用CodeBlockTab，令未渲染tab的fence也保留
tab的完整motion初始化。实验只在.cache生成fork：tab原函数抽到模块、private marker纯Object.assign，
root不再value引用tab；core使用m + 内部同步LazyMotion/domAnimation，tab保持原motion/layoutId。
不是全库domAnimation替换，不用内部Motion入口，不需要宿主新provider，无延迟features。
fold/animate/useMotionValue、copy/reveal/highlight hook、全部原props/exports/recipe仍保留。
这只是研究，尚无独立安装、全motion conformance等产品采纳证明，registry源码不变。

普通fence保留33bytes tab模块初始化glue，但无tab indicator/projection-node/drag-controller实现；
package-manager确实用tab，会恢复三者，tab模块1074bytes。小geometry utility/drag-active flag
仍可能存在，不能声称所有含projection/drag路径均移除。generic animate sequence仍在。
metafile是loaded outputs minified raw attribution，非可相加gzip归因。
早期marker直接赋值造成副作用未摇掉，135290bytes；改纯Object.assign后120492。
最终probe首次把tab模块预期为0，断言失败；按实际33bytes初始化glue修正为断言indicator/两个
engine真正不在loaded code，最终通过，未放宽尺寸预算或产品门禁。

实际PackageManagerBlock/Provider/commands用真实Button install命令及受支持lines:null分支。
它不是完整预高亮MDX：无Shiki tokens/stylesheet/chrome，仍是乐观子集。每个子集证明无JS的16个
真实preview Button、无recoverable hydration error、计数Button Enter激活、preview三mode held
full0.97/reduced-none identity、真实clipboard example。package子集另证ArrowRight选npm、
aria-selected、复制完整npx命令、localStorage npm。不是全CodeBlock三mode×两OS、firstpaint、
livecancel/nestedfull/rapid/refs/render/nativecallbacks/highlight/a11y或shared-layout逐帧证明。
产品源码没变，因此本轮不机械重跑全库browser矩阵，也不把局部probe当全库验收。

普通fence节省14842bytes，但仍超492；一个必需install控件令其超16462，且还没有chrome。
**本候选不推进完整route prototype，不采纳产品修复/迁移**。不是所有未来架构不可能的证明。
完整route gate仍须保留header/sidebar/package-manager/source/installcopy/navigation/search/SSR/
真实preview与站点全部功能，全部自动JS≤120000及真实功能/mode/focus/a11y证明；不能从子集泛化。
研究ADR-016仍investigation，ADR-009仍有效；其他58route、MDX/metadata/assets/immutable r都须review。

下一安全行动：调查实际install-control的layout feature边界与generic animate/fold图，按实装公开
Motion API研究是否能保留shared-layout/geometry contract而减少未使用engine成本，或提出另一明确
runtime候选后实测。不能再重复已失败servercatalogue/Pages迁移；不能用删tabs/layout/SSR/首屏交互、
换KB口径、排除自动chunks、延迟到观察窗后或提高预算假闭合。未有完整gate前不采纳架构。

## 验证

- 最终脚本顺序运行三命令（见docs/site-js-budget.md）；全部exit0，数字稳定。
  `.cache/fence-baseline-final.log`、`fence-scoped-final.log`、`fence-package-final.log`。
  每个report.json原始CDP/请求与module图在对应.cache目录；提交JSON保留每条请求path/hash/gzip、
  initiator、errors、modes、功能结果、feature markers、top30及总数、fork SHA256，可重建。
- implementation前完整check：`.cache/fence-boundary-check.log`，559/559、77/77files、72.18s、exit0。
- 6da369a后registry build：`.cache/fence-boundary-source-registry.log`，65payloads/58docs。
  最终完整check `.cache/fence-boundary-source-check.log`：559/559、77/77files、72.87s、exit0；
  没有弱化38suite三mode reporter/58docs recipe门禁。
- payload递归剔除sourceSha比较：60files，nonShaDifferences=[]，新sourceSha全6da369a；
  `.cache/fence-boundary-payload-compare.log`。产品源未改，未重复无变化production预算负例：
  retained final-production 290171bytes/22scripts仍有效，不冒充本轮新产品build/browser结果。
- UTF8/LF，Biome只处理改动文件；git diff --check通过。MAX_FORKS2/MIN1、build/check顺序，
  NODE_OPTIONS768MB/RAYON2。OS分配port、Edge实例finally关闭；未碰用户3000/.next，
  tsconfig无变化。旧Item img、Base act/nativeButton警告未扩修。

## 必须完整保留的后续 open

1. §8 tooling：docs recipe/helper/highlight reliability closed；initial JS仍open。
2. §8 site全部承诺实查：preview variant/codeview/installcopy，search+category/intensity/complexity
   filters，TOC/prevnext/Edit，immutable /r/[...path]，missingguides；sidebar landmark/
   aria-controls/heightanimation。部分可能存在，实际审查，不重复实现、不凭局部证据关闭全库。
3. metadata intensity定义一致性；T0 responsiveness/performance模板强制；mobileAPI窄列可读性。
4. 跨库callback/render/ref/nativeevents：按真实Base类型查callback求值/callerlast、render element/
   function、React19cleanup、nativeevents；原生useRender.ComponentProps仅string/object，不伪造回调。
   B1–B5局部证据、静态parity不能代替全库真实类型兼容。
5. 历史CSSpopup全库：nestedclock、none首帧/livecancel、full→reduced去geometry保留opacity。
   Navigation/Sheet/Dropdown/Popover/B5局部证据不是未审部件豁免。
6. 跨库Motion running-mode：transition prop更新不能保证same-target旧动画取消；ControlSpan和
   helper adoption不是全库证明。不能强制remount或丢focus规避。
7. B5Combobox inert outsidepointer dismiss/activation、Tab/ShiftTab、nestedownership/cleanup
   真实兼容实证保留open；axe0不是全兼容/全库证明。
8. 旧contract drift§7.4、parityprops§7.6、B1–B9保持closed；发现具体新缺陷仍修。
9. AI25unscheduled、directiondeferred、form/native-select/sonnerexcluded不扩；Attachment/Bubble
   无新包不代表全局AI prerequisites完成。

继续relativeimports/sharedlib/namespaceddeps/P11UIonly/tokens/reduced-none/Base render/callerlast/
refcleanup；只读shadcn禁init/add/apply/create/preset/components.json。固定pin/所有旧commits/tests保留。
source/content/meta变化先registry:build再check；implementation原子commit，final-source重建/检查public独立commit，
完整handoff独立commit，不为handoffbuild；协调核实idle再创建后继。本会话不创建后继、不push、不标整体complete。
