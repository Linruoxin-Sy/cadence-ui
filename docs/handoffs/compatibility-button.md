# 串行 parity 交接：全库兼容性 inventory + Button 原生事件有界修复

D:/Code/Project/cadence-ui，2026-11-02 Asia/Shanghai。接替 t0-doc-template.md。
本轮唯一实施；无新会话、子代理、并行实施、push、发布、部署或新 snapshot。
**全库兼容性与整体 goal 都未完成**。本轮只完成下述有界子集，停止后由协调核实
completed/idle + git clean，再安排下一唯一实施会话；不要从本文件推断全库已认证。

## Authority / commits

起点 ffb1230，git clean；上一 source3b8cd30 /payload639e329 /handoff ffb1230 保留。

- 967bcf9：Button native boundary、9项真实事件/ref/render等测试、motion.create观测、
  设计/用户文档、§8有界进度与58项真实类型inventory/证据。
- 12343bd：audit evidence表格格式，final source authority；未改变运行代码。
- 从12343bd最终 registry:build/check后的public独立提交，SHA见本文件末尾/git log。
- 本完整handoff再独立提交，不为handoff build，不freeze。

固定 upstream pin96da9cc7f1aa10580a3741664e2a77c721206c00不移，实装Base1.9.0，
Motion13.5.1，React19.3.1。所有root实际依赖版本保存在inventory.installedPackages；
没有改依赖/lockfile/API/defaults/slots/recipe或预算配置。
58components /65items /58docs /38animated suites保持。测试新增独立native suite，不删旧测试。
shadcn技能只读；没有consumer init/add/apply/create/preset/components.json。

## 真实有界发现与修复

ButtonProps从实装Base继承原生React事件。默认render原为motion.button，Motion保留了
onAnimationStart/onDrag/onDragStart/onDragEnd。原onAnimationStart收不到CSS animationstart，
还可能被Motion当作动画生命周期消费；drag过滤仅有draggable的特殊路径。
不能靠HTMLMotionProps cast保留原生语义。

先建反例：.cache/button-native-before.log失败，dispatch animationstart caller调用0次。
然后先补animation-system §4设计，再用Motion公开motion.create包装私有NativeButton。
四个冲突handler通过private nativeEvents prop bag跨过Motion过滤，恢复到同一个button。
无native listener代理/伪造event/DOM wrapper/remount/强制失焦。whileTap、scale.press、
cm.transition(feedback.press)、原classes、Base caller render覆盖顺序均不变。
Adapter只在Button/index.tsx内部；未为此全库替换其他Motion-rendered parts。

新tests/components/button-native.test.tsx九项：四个冲突名称逐个断言真实nativeEvent与
currentTarget、capture/bubble、preventDefault/stopPropagation；callback class/style实际disabled
状态求值与callerlast；default stable callback ref cleanup和object ref清空；render element自带
handler/ref与caller合并、两cleanup；render function实际props spread；press不误触原生动画/drag
回调；Tab/Enter、form点击取消/阻止冒泡、focus保持；外部disabled更新保留DOM节点。
保留Button10项与B1旧覆盖。没有把普通onClick测试当作所有冲突事件证明。

Motion conformance：唯一feedback.press声明=实现=docs；无新recipe/token，三模式同原分支。
第一次完整check中现有motion-contract测试三个负例拦住新motion.create未被observer观测，
因此扩展tests/motion-observer.tsx，仍渲染真实Motion，不弱化helper或只靠DOM data-motion。
新增create观测路径与旧property观测共用逻辑；现有helper negative/runtime reporter全部保留。
Button full/reduced/none helper真实执行，default standalone原生事件测试无需provider。

## 全58 scope inventory 的准确边界

scripts/compatibility-inventory.mjs使用TypeScript实际program/checker解析所有58 UI/block项、
466实际导出（含type/helper/context/provider，不冒充466个DOM parts）。逐导出记录className/
style/render/ref/四个冲突事件的真实类型、call signature、声明文件/行，组件source imports、
pinned upstream paths/exports/slots/defaults、原suite路径和全部实装依赖版本。
JSON：docs/evidence/compatibility-inventory.json。生成后对script/JSON运行Biome。
物理pnpm路径只缩写为等价node_modules symlink；实际版本单独保留，不丢真实来源。
原生useRender.ComponentProps仍是其真实string/object，不发明state callback。

**每一生成行都显式open**。本轮没有手工审完全部实现、provider/noDOM/transparent forwarder
上下文，也没有把没有className/ref的行自动判为不适用。原suite只是证据指针，非全库新运行证明。
docs/evidence/compatibility-button.md给出Button逐维度runtime矩阵及历史局部证据复用边界。
不能因为新inventory、静态parity58、38helper全绿而把全库兼容性closed。

Button也仅此边界被证：ref identity动态替换、正在press时disabled、render element自身
preventBaseUIHandler与caller取消ownership的组合、nested native control等仍需审计。
cleanup-unmount测试不证明任意ref replacement生命周期。Same-target运行mode/clock取消是
下一独立逻辑组；本轮没有冒充关闭它，也未改变gesture算法来绕过兼容问题。

## 下一安全行动：继续同一全库兼容性逻辑组

先读本handoff、evidence/compatibility-button.md和完整inventory，再读AGENTS、§8及设计记录。
优先真实复现Toggle与ToggleGroupItem默认motion.button同名事件边界，按它们的Base类型、
pressed受控更新、actualkeyboard、render handlers/ref/cancel ownership证明，再选择最小实现。
不要因为Button已用private bag就盲目全库套同一adapter。
随后逐项分类剩余导出，复用B1–B9明确的局部证明，补真实callback/render/ref/events风险测试。
透明forwarder可用实际source/type +真实context路径证据，不为每行镜像空测。

仍需逐项审计的组件完整范围（Button未验路径也在范围内）：button、badge、kbd、separator、
label、input、textarea、card、avatar、skeleton、aspect-ratio、alert、empty、item、field、
button-group、input-group、breadcrumb、pagination、spinner、checkbox、radio-group、switch、
toggle、toggle-group、slider、progress、input-otp、dialog、alert-dialog、sheet、drawer、tooltip、
hover-card、popover、dropdown-menu、context-menu、menubar、select、combobox、command、toast、
accordion、collapsible、tabs、table、carousel、scroll-area、chart、calendar、navigation-menu、
resizable、sidebar、data-table、date-picker、code-block、attachment、bubble。
以JSON/registry实际58项为权威，顺序不更改parity batch；不要漏掉context-only/providers。

## 验证与失败记录

- 原生反例先红后修。定向Button/native/helper33/33；native9，Button10，helper14。
- 初次全check601中3个helper-observation失败；修observer后三模式完整check602/602，
  82files /83.43s，.cache/compat-button-check2.log。不是忽略这三个旧测试。
- final source967bcf9第一次final check在Biome evidence markdown表格格式停止，未跑后续门禁；
  12343bd只格式化该表，重新registry build和完整check。准确最终结果见末尾。
- .next-compat-button隔离production build成功，.cache/compat-button-build.log。
  RAYON_NUM_THREADS2/NODE_OPTIONS768MB；全check/build严格顺序，未碰用户.next/3000。
  Next自动tsconfig仅格式与隔离types include，diff保存在.cache/compat-button-tsconfig.diff，
  已核实并restore本轮修改，无配置弱化。
- 空闲port3151，Edge/msedge workers2，既有motion-matrix Button12/12通过：3mode×2OS，
  mode与真实按压scale。默认DOM/classes/recipe算法未变，历史双主题截图用于视觉等价证据；
  本轮未新跑全库视觉/axe，不伪称所有render/events均在真实browser中交互证明。
- 同run独立initialJS测试在唯一budget断言失败：**291658gzip bytes /23scripts**，
  limit120000，较上一实测291423增加235。原始requests/initiators/rootmanifest核对/BUILD_ID/
  emptyerrors保存在docs/evidence/compatibility-button-js.json。
  .cache/compat-button-browser.json：expected12/unexpected1/flaky0，22.12s。
  所有script200；没有预算/窗口/chunk排除或SSR/功能删减。绿compatibility不覆盖红budget。
- Playwright自管3151服务运行结束无listener。UTF8/LF作者文件，Biome只改动文件。

## 保持的 closed / distribution invariant

B1–B9及模板/文档recipe/helper/highlight/siteflows/URLmatrix/indexsidebar/intensity/
distributionguides全部先前closed保持；本轮仅Button用户文档补原生事件说明。
37轴/118选项/21不适用URLmatrix、58页noJS、catalog/sidebar语义不回退；未冒充本轮全库复验。

132current资源。最终root JSON排除docs/sourceSha与起点递归比较，仅button.json实际源码变化；
其他项源码/meta/defaults/recipes/deps均相同。最终item sourceSha12343bd。
冻结目录84cc78703b354b29c815c3970cb26973e4760dea398fdf48756b8a24c996b2f1、
registry-snapshots.json及.gitattributes -text零差异。普通build不freeze，不改写旧snapshot。
四guides、ETag/revalidated latest和immutable snapshot语义保持，无本轮HTTP全量复验声明。

## 完整其他 open，绝不丢失

1. initialJS120000预算仍OPEN，新实测291658/23。原baseline290171及上一291423保留。
   actualinstallcontrol layout/generic animate/fold依赖边界研究继续；完整shell/route hydration
   prototype必须同时保留SSR/search/navigation/package-manager/source/installcopy/preview/modes/
   focus/a11y与全部自动JS≤120000。ADR009仍NextAppRouter，ADR016只研究，不抬限/排chunks/
   删SSR或功能/延后观察窗。ordinary120492/install136462失败子集不采纳。
2. 本兼容性仍OPEN，完整58scope见上；B1–B5局部/静态parity/runtimehelper不能替代。
3. 全库CSSpopup nestedclock、none首帧/livecancel、full→reduced去geometry留opacity；
   Navigation/Sheet/Dropdown/Popover/B5局部证据不豁免其他part。
4. 全库Motion same-target running-mode livecancel/nestedfull/none首帧仍OPEN；仅更新transition
   不保证取消，ControlSpan/helper不是全库证明。不得强制remount/丢focus。
5. B5Combobox inert outsidepointer dismiss/activation、Tab/ShiftTab、nestedownership/cleanup
   真实兼容仍OPEN；axe0不替代。
6. AI25unscheduled/directiondeferred/form-native-select-sonnerexcluded不扩；Attachment/Bubble
   无新增依赖不代表全AI prerequisites完成。无已实现/授权MCP/分发Skill/release/外部hosting，
   不虚构。Pin/lock/公开surface、relativeimports/sharedlib/namespaceddeps/P11/tokens/三mode/
   Base render/callerlast/refcleanup及全部旧commits/tests保持。

本轮完成有界子集后停止，由协调核实idle/clean再继续，不创建后继、不push、不标goalcomplete。
后续仍source原子提交→finalsource重建check→public独立→完整handoff独立，不为handoffbuild。

## 最终检查与 artifact identity

- Final source **12343bd** 后registry:build exit0：.cache/compat-button-final-registry2.log。
- 完整pnpm check **602/602 /82files /82.70s /exit0**：
  .cache/compat-button-final-check2.log。type/lint/registry/parity58/P11/tierbudgets/
  docs58 recipe与38animated runtime-helper reporter均通过，保留既有Item img warning。
- Public独立commit **e13caf7**，62files；item sourceSha统一12343bd。
  排除docs/sourceSha后与起点比较仅button.json源码变化；snapshot/inventory/attributes零差异。
- 本handoff随后独立提交，不再次build；最终handoff SHA见git log。
  final git diff --check、git status核实后停止，整体goal和全库兼容性仍OPEN。
