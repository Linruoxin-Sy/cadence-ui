# 串行 parity 交接：Toggle 原生事件与 press controls ref identity

D:/Code/Project/cadence-ui，2026-11-02 Asia/Shanghai。接替 compatibility-button.md。
本轮唯一实施，无子代理/新会话/push/发布/部署/freeze。只完成有界逻辑组，整体goal与
全库兼容性仍OPEN。结束后由协调核实completed/idle + git clean，再安排下一唯一实施会话；
不要在此会话创建后继。新实施会话模型按用户要求GPT-6.1 Sol High。

## Authority / atomic commits

起点efea386 clean，前轮implementation967bcf9 /final source12343bd /payload e13caf7保留。

- 5f02afa：共享私有press-button adapter，修复Toggle/GroupItem四个原生事件冲突；
  修复三个control动态ref identity交接；风险测试、设计与用户docs。
- aa75b88：final source authority；render自身preventDefault与caller ownership补强，
  手工ledger、生成inventory刷新、§8与证据/真实JS报告。没有运行代码进一步变化。
- final source后registry:build/check，再public独立commit，SHA见末尾。
- 完整handoff再独立commit，不为handoff build；其SHA见git log。

固定upstream96da9cc7f1aa10580a3741664e2a77c721206c00；Base1.9.0/Motion13.5.1/
React19.3.1，全部实际依赖见inventory.installedPackages。无API/defaults/slots/recipe/
lockfile/预算配置变化。58components=56UI+2blocks /65items /58docs /38animated suites保留。
shadcn技能只读，遵守repo boundary，无consumer init/add/apply/create/preset/components.json。

## 实际缺陷与修复边界

先写真实animationstart反例：Toggle、ToggleGroupItem均0caller calls，2/2失败，
.cache/toggle-native-before.log。Base原生类型与Motion保留prop过滤冲突，不能靠cast修复。
将前轮Button最小nativeEvents bag adapter抽到registry/cadence/lib/press-button.tsx，
仅供三者复用；cadence-provider现有namespaced依赖正确发货这个共享文件，无新registryitem。
Motion公开motion.create仍管理原style/whileTap/transition；private handlers恢复到同一个button。

随后扩展测试发现三个control的真实ref identity缺陷：旧callback cleanup不执行，
.cache/toggle-native-expanded.log为3fail/29pass。实装framer-motion use-motion-ref.mjs
稳定ref callback只更新externalRefContainer，换ref不通知旧/新ref。private nativeRef通道
在adapter layout effect独立commit Base/caller refs，identity变化/unmount执行原cleanup，
无cleanup则callback(null)，object ref清空。Motion保留内部DOM ref。无DOMwrapper、强制
remount、替换节点、丢focus、native listener代理或伪造事件。animation-system §4先更新。

默认renderer的四个原生event逐个验证exactnativeEvent/currentTarget、capture/bubble、
preventDefault/stopPropagation。native Motion press不冒充animation/drag回调。
新增Button held-pointer中换ref、disabled后release不激活；合法nested span target；
render element/function自身preventDefault保留caller调用与先后顺序；element
preventBaseUIHandler阻止caller handler但仍原生bubble。没有构造非法button嵌button。
Toggle受控pressed、callbackclass/style callerlast、keyboard、disabled语义；Group受控value、
rovingfocus、variant/size上下文、item取消阻止group change、disabled继承；render函数真实
state/props spread、render element handler合并/veto；ref动态换callback/object与cleanup。

不能从unit disabled-release推断press视觉已立刻停止；相同target mode/clock与disabled
visual cancellation还需独立全库motion组。未通过remount绕过。没有关闭全部自定义render/
ref/context交互，组内嵌套独立group等仍需后续风险审计。具体矩阵见evidence/compatibility-toggle.md。

## 手工ledger与下一兼容性行动

compatibility-ledger.json是独立手工维护记录，不由compatibility-inventory.mjs覆盖。
58items/466exports中只分类10项：Button/Toggle/Group的实际DOM、Group私有context路径、
四个纯Props type、两个varianthelpers；其余456明确unreviewed/open。纯type/helper不是
DOM，不因无className/ref自动N/A；已分类DOM也只是bounded-runtime而不是closed。
生成inventory仍全部open；真实类型/声明来源/版本/导出不作为运行认证。
历史B1–B9只有具体局部证据复用，helper38套/静态parity58/axe0不认证全库兼容。

下一安全有界组：先读AGENTS、parity-plan §8、本handoff、compatibility-toggle.md和ledger，
再读相关设计；优先ProgressIndicator（公开Base props默认ControlDiv）和CodeBlockActions
（header原生div/floating motion.div）实际原生event/ref/context反例；复现后再选最小修复。
ControlSpan/Div中的HTMLMotionProps cast本身不证明caller可达。Checkbox/Radio/Switch/
Slider内部indicator/thumb、SelectValue私有wrapper、Tabs私有indicator、InputOTP内部span，
要区分public DOM和内部装饰。Dropdown/ContextMenu/Select/Combobox公开indicator也要在真实
context按出口审计。不要仅因共用Motion就全库替换。手工ledger随每个真实结论逐项更新。

完整58scope保持：button、badge、kbd、separator、label、input、textarea、card、avatar、
skeleton、aspect-ratio、alert、empty、item、field、button-group、input-group、breadcrumb、
pagination、spinner、checkbox、radio-group、switch、toggle、toggle-group、slider、progress、
input-otp、dialog、alert-dialog、sheet、drawer、tooltip、hover-card、popover、dropdown-menu、
context-menu、menubar、select、combobox、command、toast、accordion、collapsible、tabs、table、
carousel、scroll-area、chart、calendar、navigation-menu、resizable、sidebar、data-table、
date-picker、code-block、attachment、bubble。以实际registry/ledger58项为权威。

## 真实验证 / 失败修复

- 定向五套57/57：Button14native+10original；Toggle/Group18native+7+8original。
  .cache/toggle-native-expanded2.log；后续Button ownership补强14/14，
  .cache/compat-toggle-ownership.log。所有旧测试保留，无skip/弱化helper。
- 初次完整check因fixture编辑closingtag错在typecheck停止；修复后完整
  625/625 tests /83files /85.29s，.cache/compat-toggle-check2.log。
  旧Item img warning与已有act warnings保留，无新增忽略规则。
- 三控件feedback.press声明=source=frontmatter=contract；scale.press与cm.transition不变。
  full whileTap，reduced/none无scale，none零duration，原三模式helper实际执行，
  motion.create真实观测保持。不能据此宣称全库live same-target取消完成。
- .next-compat-toggle隔离production build exit0，.cache/compat-toggle-build.log；
  RAYON_NUM_THREADS2/NODE_OPTIONS768MB；全check/build顺序，无碰用户.next/3000。
  Next tsconfig只加隔离types include与格式，diff保存在.cache/compat-toggle-tsconfig.diff，
  核实并restore本轮修改。
- Edge/msedge空闲3152/workers2。Button matrix12/12（12.01s）；B3筛选toggle16/16
  （32.40s），三mode×2OS×2control实际frames/keyboard/stablenode +两页×双theme axe。
  axe在1280/390均0，无disabledrules/overflow/pageerrors。16PNG在.cache/b3-proof，
  4张.cache/compat-toggle-{toggle,toggle-group}-{light,dark}.jpg逐张review，preview外观保持。
  contact full-page缩略图只看结构，不冒充所有细字可读性审计；无全库axe/visual重跑声明。
  单独browser JSON见.cache/compat-toggle-button-browser.json与compat-toggle-b3-browser.json。
- 独立JS门禁仍FAIL，唯一budget断言：291749gzip bytes/23scripts，limit120000，
  比上一291658多91；原baseline290171、上一291423都保留。所有script200，pageerrors空，
  root manifest/bodyhash/BUILD_ID、requests/initiators完整在compatibility-toggle-js.json。
  freshEdge/cacheoff/nointeraction/networkidle+10s+networkidle，逐bodygzip默认level6，
  不抬限、不排async/prefetch/chunks、不延窗、不删SSR/功能。预算red不被check绿覆盖。
  .cache/compat-toggle-budget-browser.json：expected0/unexpected1，13.28s。
- 初始combined grep中的pipe被Windows pnpm shim解释，未运行；改为三个独立Playwright调用。
  contact-sheet生成首次Python无PIL、Node无rootsharp，最终System.Drawing完成，无改deps。
- VITEST_MAX_FORKS2/MIN1；UTF8/LF显式写；Biome仅改动文件；gitdiffcheck完成。

## Closed 保持 / 分发约束

B1–B9、文档recipe/helper/highlight、URL37axes118options21N/A、58页noJS、source/install/
TOC/prevnext、catalog/sidebar/intensity、distribution/guides、T0template等先前closed保持。
只复用原记录范围，不冒充本轮重新全量认证。

132current资源；排除docs/sourceSha后相对efea386只有button/cadence-provider/toggle/
toggle-group四个rootJSON实质变化；provider增加sharedadapter，其余runtime不变。
sourceSha统一aa75b88。冻结public/r/snapshots/84cc78703b354b29c815c3970cb26973e4760dea398fdf48756b8a24c996b2f1、
registry-snapshots.json、.gitattributes -text零差异；无freeze。
latest ETag revalidate/explicitsnapshotimmutable/beforeFiles优先语义保持，无本轮132HTTP复验声明。

## 所有其他remaining（不可丢失或标整体complete）

1. initialJS预算仍OPEN/FAIL，291749/23 >120000。ADR009仍NextAppRouter，ADR016只研究，
   未采纳迁移。directSSR普通fence120492/install136462都失败。后续完整route/shell方案必须
   保留SSR/search/navigation/package-manager/source/installcopy/preview/modes/focus/a11y，
   包含所有自动脚本真实≤120000；不能抬阈值/排chunks/删功能或延后观察。
2. 全58逐组件/逐出口callback/render/ref/nativeevent兼容仍OPEN；上述10只bounded classification。
3. 全库CSSpopup nestedclock、none首帧/livecancel、full→reduced去geometry留opacity仍OPEN。
4. 全库Motion same-target live mode/clock cancellation、nestedfull、nonefirstframe仍OPEN；
   transition prop变化不保证旧animation停止，原B3选定路径通过不覆盖全部target/clock组合。
5. ComboboxFocusSafety inert outsidepointer dismiss/activation、Tab/ShiftTab、nestedownership/
   cleanup仍OPEN；axe0不能替代真实交互。
6. 最终整体完成审计仍OPEN，不能带预算red/未验矩阵宣称goalcomplete。
7. AI25unscheduled、directiondeferred、form/native-select/sonnerexcluded不扩；MCP/分发Skill/
   release/hosting无实现或授权，不虚构。所有旧commits/tests保留。

本有界组结束停止，让协调核实idle/clean；不创建新会话或子代理、不push、无整体complete。

## Final gate / artifact identities

- Final source **aa75b88** 后 registry:build exit0，65payload/58docs，
  .cache/compat-toggle-final-registry.log。
- 完整pnpm check **625/625 /83files /84.34s /exit0**，
  .cache/compat-toggle-final-check.log；type/lint/registryfreshness/parity58/P11/
  tierbudgets/38animatedruntime reporter均通过；既有Item img warning保留。
- Public独立提交 **ae04295**，65files，item sourceSha统一aa75b88。
  除docs/sourceSha的实质变化仅四个rootJSON；132current资源与冻结hash完整保持。
- 本handoff随后独立提交，不再次build；handoff SHA见git log。
  最终git diff --check与git status clean核实后停止，整体goal与全库兼容性仍OPEN。
