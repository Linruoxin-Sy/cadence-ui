# 串行 parity 交接：B3–B5 有限兼容性审查与 Combobox 修复

2026-11-02 Asia/Shanghai，D:/Code/Project/cadence-ui。接替 compatibility-atoms.md。
本轮唯一实施者，无子代理/并行实施/后继会话；未 push/发布/部署/freeze。
本实质组完成后停止，由协调核实 completed/idle + clean 后开下一唯一实施会话。
用户指定 GPT-6.1 Sol High；已有授权不重问。整体 /goal **未完成**。

## 提交、runtime 与 payload authority

起点 d60befe90bf18839dd1c3811bf2651246b72bee7 clean。原 runtime129365a、
review08d8452、payload2189a5a保留为历史；本轮实际 runtime 已变更。

1. b8402a3：Provider token/comment 修复，最初还改了 effective fallback clock。
2. 18d69f4：B3有限审查、OTP native/ref 与嵌套 ToggleGroup 测试。
3. a950f7d：B4逐实际出口/真实上下文审查。
4. ddc443b：Combobox outside activation 修复、B5有限审查/测试/证据/内容文档。
5. **f1a0fa0：最终 runtime source**；将 Provider fallback 收回最小 token-only范围，
   不更改原 fallback 模式行为；保留前一生产结果。所有库内 Motion writer 显式提供
   transition、controls.start 或 animate 的 recipe timing；调用方自写 Motion程序不能
   自动推断为库控制。默认duration.base*timeScale/ease.out，显式recipe none仍zero。
   修正 reduced halves travel 为 drops transform/layout。不增加recipe/模式/依赖。
6. **02ad6d7：最终 review/evidence authority**；只补最终生产/check证据与§8，
   runtime不变，按授权不为证据提交机械刷新sourceSha。
7. **004d626：独立payload**；63 generated artifacts，174 sourceSha字段均f1a0fa0。
8. 本完整handoff独立commit，SHA见git log；不为handoff build。

固定 pin96da9cc7f1aa10580a3741664e2a77c721206c00；Base1.9.0/Motion13.5.1/React19.3.1/
input-otp1.5.0/cmdk1.1.1；实装继承类型及路径仍在未改inventory。shadcn技能只读，
实际pin副本.cache/shadcn/base，未运行consumer init/add/apply/create/preset。
API/default/export/slot/pin、P11、relative imports/shared lib/@cadence依赖保持。

## 实质结果与边界

B3八项35export：checkbox/radio-group/switch/slider/toggle/toggle-group/input-otp/progress。
B4七项56：dialog/alert-dialog/sheet/drawer/popover/tooltip/hover-card。
B5七项94：dropdown-menu/context-menu/menubar/select/combobox/command/toast。

手工ledger现在 **373/466 classified：256 reviewed-compatibility +117 reviewed-static，
93 open，无historical bounded**。B3新增18分类并将Toggle/Group3DOM有限义务收束；
Progress10出口/CodeBlock24未变，复用已审证据。B4/B5新增150分类。独立one-shot逐
名字核对58items/466exports与inventory完全一致，B6–B9及其他非本组行与起点逐JSON相同。
生成inventory绝不覆盖ledger；不把类型索引当运行证明。

详细逐名列表和具体共用路径在 docs/evidence/compatibility-base.md。完整当前源、pin
API/default和实装类型核对；Base public DOM、native div/span、cmdk native surface、
根provider、Fragment数据consumer、toast manager/factory/hook和anchor ref hook具体分类。
透明转发+实装类型+适用旧风险suite支持有限结论，不为每个div镜像测试。Base render
function必须spread实际props/ref；任意caller renderer实现不属于库的无限义务。
private indicator/ControlSpan/Div不因Motion import自动变成caller root事件可达。

关键发现：

- B3 private Checkbox/Radio/Switch/Slider指示器与public根DOM分开；OTP render是数据
  slots函数，不是Base DOM render；依赖拥有透明input样式。新OTP真实drag事件断言
  nativeEvent/currentTarget身份、取消/bubble、动态callback cleanup、同input/focus；
  嵌套ToggleGroup验证最近值/视觉上下文隔离。
- B4 root/provider无DOM也有真实open/delay/association/context义务；Tooltip取消不写
  内部open，caller aria-describedby/id需自行匹配；Drawer真实最近context决定snap/
  modal/direction/handle。AlertAction保持caller-controlled confirmation。
- B5菜单Label公开native props，即便group内走Base GroupLabel也不虚构callback API。
  Menubar透明继承Dropdown路径和真实Composite上下文。SelectValue caller ref/style/
  events到内Base Value，私有Motion host拥有width；新SelectTrigger测试证明动态ref
  cleanup/同focused DOM与随后keyboard popup仍可用。Command保留cmdk asChild，
  不是Base render；Toast manager实际add/update/close/onRemove/隔离有旧测试证明。

## Combobox真实反例、修复与有限矩阵

旧FocusSafety给新aria-hidden节点加native inert。production Vite7.3.7/Edge3156，
同Base1.9默认配置对照：鼠标/必要触摸outside按钮都会关闭popup；Base按钮激活1次，
Cadence0次。不是axe或单onClick推断，是实际坐标pointer/touch hit testing。

改为临时负tabindex抑制新hidden区域focus stop，保留pointer激活。Tab前release；
cleanup只在属性仍为guard的-1时恢复原值，caller后续tabindex改写保留；预存hidden/
inert祖先不改。无事件重放/伪造、native listener代理、remount或focus reset。
content/components/combobox.mdx同步。

完整fixture/config/runner/result保存在 **compatibility-combobox-focus.json**：

- 鼠标与触摸outside均dismiss+activation1，与Base一致。
- Tab/ShiftTab关闭popup；Cadence Tab到generated trigger，Base夹具无此trigger到outside，
  ShiftTab均Before；不是要求两个不同组合有同一Tab目标。
- 两次Escape重开、卸载后恢复；caller tabindex2保留，预存aria-hidden/tabindex3与
  inert/tabindex4保持原所有权。
- 父Dialog内outside-Combo按钮鼠标/触摸激活只关闭Combo，父继续打开；父close后
  outside属性恢复。并列两个Combo点击第二个关闭第一/打开第二，Escape关闭并清理。

这闭合记录的默认outsideactivation/Tab/父popup/并列/重开/卸载/属性所有权有限矩阵；
不认证自写shadow/focus engine或任意嵌套renderer。独立全库live motion矩阵仍OPEN。
初始隔离夹具缺少站点CSS，明确补Dialog popup z-index，分开并列控件避免物理遮挡；
hidden sibling用实际input DOM查询，未forceclick或弱化断言。

## 动画一致性与未闭首帧证据

Combobox仍declared/frontmatter/contract/implementation=popup.anchored + exit.fade +
state.morph；CSS popup local tokens/full/reduced/none和private indicator cm.transition
保持，helper三模式实际执行。Guard不改动画目标/时序/类/DOM。Provider最终数值等价
复用duration.base/ease.out。旧press-button/native-div/CodeBlock内部ref修复未回退。

首轮productionB3/B4+budget141例：B3 60pass/4fail，B4 **76/76pass**，budget1fail。
原报告保存在compatibility-base-provider-browser.json，原budget292327见-provider-js.json。
最终原fallback语义后定向15例：Combobox **10/10pass**（六mode×OS frame/cancel +
四light/dark1280/390 complete-page axe/overflow）；B3同四断言仍fail，budgetfail。
compatibility-base-browser.json保留最终逐例。

四例：Checkbox/RadioGroup，none，OS no-preference与reduce，b3.spec.ts:148。
断言是 **initial.length>0 && every sample animations===0**；目前不能区分没有sample
与真实animation存在，不能称为已证实动画缺陷，更不能当作通过。下一独立first-frame
矩阵应抓取原始样本/时序，保留原断言。复现不依赖最初fallback模式变更，不能把
修正fallback scope冒充修复此项。旧batch gate不机械重开，但新反例/证据缺口保留OPEN。

最终截图.cache/b5-proof/combobox-{light,dark}-{1280,390}{,-open}.png，
light390-open/dark1280-open逐图查看，布局/文案/焦点可读，未扩大为全库视觉结论。

## 命令与最终验证

- provider定向5/5：.cache/compat-base-provider-final-test.log。
- B3/toggle-native24/24：.cache/compat-base-b3-test3.log。
- 七suite65/65：.cache/compat-base-targeted.log。
- f1a0fa0后 pnpm registry:build成功65payload/58docs：
  .cache/compat-base-authority-registry.log。
- 最终production Next build成功：.cache/compat-base-authority-next.log；
  RAYON_NUM_THREADS=2 NODE_OPTIONS=--max-old-space-size=768
  CADENCE_DIST_DIR=.next-compat-base；未碰用户.next/3000。
- Next只生成tsconfig格式/include变化，差异保存
  .cache/compat-base-authority-tsconfig.diff核对后git restore仅本轮变化。
- 随后 pnpm check **exit0，663/663tests，85/85files，95.65s**：
  .cache/compat-base-authority-check.log，VITEST_MAX_FORKS=2/VITEST_MIN_FORKS=1。
  type/lint/registry/parity58/all tierbudgets和38animated实际helper reporter通过。
  原Item img/React act提示未隐藏。
- Edge/msedge已查空闲3155，workers2；Playwright自动server退出，Vite3156会话
  已停止。生产浏览器JSON：.cache/compat-base-authority-browser.json及同名stderr.log。

失败与修正均保留：初OTP测试把dependency-owned透明input颜色误期望红色，按实装
契约修正；transparent computed normalization改查inline。两次中间check与源/测试编辑
重叠导致新旧模块/断言配对失败，不能用作最终结果。最终源提交后停止编辑，build后
恢复Next生成配置，再完整check通过。Biome仅改动文件、UTF8/LF；阈值/timeout/
axe/helper/reporter/旧测试未弱化。所有最终源码改动在runtime f1a0fa0之前。

## Initial JS per page仍OPEN/FAIL

**animation-system§7 Initial JS per page ≤120KB gzip**，overall-design checklist亦为
每页initialJS。最终真实production **292314 gzipbytes/23scripts >120000**，
docs/evidence/compatibility-base-js.json。首轮292327、前轮292344、291749/291658/
291423/baseline290171保留。Button只是已失败共同baseline，不缩成Button-only。
无需机械测58个red路由；真正闭合必须全部适用site页/full shell，特别Chart/Calendar/
CodeBlock重路由。

freshEdge/cacheoff/nointeraction/networkidle+10s+networkidle，全部automatic async/
prefetch scripts逐body gzip6+manifest/root hash核对，all200/no pageerrors。无chunk排除、
延窗、阈值提高或SSR功能删除。pnpmcheck绿不盖此red。ADR009仍NextAppRouter、ADR016
只调查；directSSR ordinaryfence120492/install136462失败未采纳。完整方案保留header/
sidebar/search/navigation/package-manager/source/installcopy/realpreview/modes/focus/
a11y；小fixture不证明产品预算。

## Distribution与最终clean

004d626独立payload：63files，含currentJSON/docs与llms-full；132currentrootJSON/MD。
174sourceSha字段逐值验证均f1a0fa0。review02ad6d7不改变runtime，无需机械刷新SHA。
冻结public/r/snapshots/84cc78703b354b29c815c3970cb26973e4760dea398fdf48756b8a24c996b2f1/、
registry-snapshots.json、.gitattributes -text均未动；latest ETagrevalidation、frozenimmutable、
beforeFilesroute优先保持。无freeze。

本handoff独立提交，不为它build；最后git diff --check与git status --short clean后停止。

## 全部remaining与下一实际组

1. 每页JS预算red：完整方案及scope匹配真实production证据。
2. 58有限compat剩93open，下一B6，再B7–B9；按ledger逐实际export/part/context审查。
   B1–B5/Progress/CodeBlock有限结论不因独立motion矩阵永久bounded。
3. 全库CSSpopup nested clocks、nonefirstframe/livecancel、full→reduced去geometry留opacity。
   旧B4/B5/Nav与本轮局部不等于全库。
4. 全库Motion same-target mode/clock取消、nestedfull/nonefirstframe；held-press期间disabled
   视觉取消仍OPEN，activationunit不能证明。先捕获上述B3四例原始首帧样本，
   区分缺sample/真实动画；保留原断言/超时，不用transitionprop更新冒充停止。
5. Combobox本轮具体有限focus矩阵已闭；不再沿用旧inertoutside吞激活的泛化待办，
   独立全库motion/provider矩阵仍包括其真实popup/indicator路径。
6. 最终整个goal逐要求审计，不能带预算red/未验矩阵标complete。

保持已闭：58=56UI+2blocks/65items/58docs、B1–B9 gates、recipevalidation/helper/highlight、
URL37axes118options21N/A、58页noJS、source/install/TOC/prevnext/catalog/sidebar/intensity/
distribution/guides/T0templates。AI25unscheduled/directiondeferred/form-native-select-sonner
excluded不扩，MCP/分发Skill/release/hosting未实现或授权不虚构。

下一会话继续保持serial唯一实施，不创建子代理/后继/并行实施，不push/发布/部署。
生产build与source编辑/check串行，按上述配置避免编辑中运行全check造成混合证据。
