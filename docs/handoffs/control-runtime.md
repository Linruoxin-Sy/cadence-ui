# 串行 parity 交接：B3 控制器运行与 React 19.0

2026-11-02 Asia/Shanghai，D:/Code/Project/cadence-ui。接替 compatibility-base.md。
本轮唯一实施者；无子代理、并行实施、后继会话、push、发布、部署或 freeze。
本组完成后停止，由协调核实 completed/idle + clean，决定下一唯一实施会话。
整体 /goal **未完成**。已有授权不重问。用户指定 GPT-6.1 Sol High。

## 提交与 authority

起点 clean 682b08e（前轮 handoff）；旧 runtime f1a0fa0、review02ad6d7、payload004d626
全部作为历史保留。本轮：

1. **c53c55a4e1c6bf2f7cace19b7828b002bd86bdf9**：最终 runtime source，普通 effect
   替代两个 useEffectEvent 路径，修复 Motion 旧 same-target 排队写入覆盖 none 目标；
   首帧探针、真实 React19.0 fixture、原始反例、motion scheme说明与§8同期提交。
2. **60b0387**：最终 review/evidence，补 c53c55a 的完整 check、最终生产、真实 minimum
   consumer、依赖解析与预算证据，runtime不变。不为 evidence-only 机械刷新sourceSha。
3. **7007c0d**：独立 final payload，61 generated JSON变更，174 sourceSha均c53c55a。
   public/r/snapshots、registry-snapshots.json、.gitattributes与起点逐git diff无差异。
4. 本完整 handoff 独立提交，SHA见 git log；不为 handoff build。

固定 upstream pin96da9cc7f1aa10580a3741664e2a77c721206c00 未移。
主 workspace仍 React/ReactDOM19.3.1、Motion13.5.1、Base1.9.0、OTP1.5.0，
其余实际类型/版本复用 compatibility-inventory.json。无 dependency/lock/API/default/
export/data-slot/registry-id/parity记录变化。shadcn技能已只读，无consumer CLI命令。

## 四个旧失败：定位纠正与真实修复

先在未改 runtime 的全新 .next-control-runtime production build 重现四fail，
不是依赖旧 .next-compat-base。原断言/超时保留。
**前轮 handoff 把 line148 的失败误归为 initial 断言；实际是操作 sampler 的
`every(scale===1)`。** 不应继续把原四fail叫作“已证明有首帧活动动画”。
原 initial 数组非空且animations0，但只采root/static节点；真实indicator未获证明。
原交互样本从 opacity0/scale0.96/animations0 开始，点击后到 opacity1/scale1。

证据 docs/evidence/control-runtime-original.json 保留四个未改源反例、原失败snippet、
DOM与原始帧。原完整 .cache/control-initial-original.json、-initial-raw.json、
-fresh-baseline.json、-original-samples.json仍保留。前轮JSON不重写。

临时诊断确认 effect 已收到 target scale1/duration0，DOM仍0.96。安装的Motion13.5.1
animation/interfaces/visual-element-target.mjs在same-target skip时仍排队
`frame.update(()=>value.set(valueTarget))`；先前 full 的0.96任务晚于none立即set写回。
只移除useEffectEvent仍四fail（.cache/control-fixed-browser.json：45pass/4fail）；
修复先stop/set，随后public frame.update重申当前zero-clock target，cleanup取消该任务
并stop controls，四fail才消失。没有计时器、延迟显示、重挂载、清空SSR或改Provider模式。
临时debug属性/console已移除，源中不保留诊断代码。

control-animation使用普通effect提交闭包，signature=JSON.stringify([target,transition])；
OTP使用char/mode/timeScale/controls effect。无render阶段写ref来泄露未提交状态；
无无关rerender重启动画。保留受控目标、稳定DOM/ref/focus、StrictMode与cleanup。

## 真实首帧与影响路径验证

新的 tests/e2e/initial-control-probe.ts 从parser插入、属性mutation和120个rAF记录真正
slotted parts及OTP character spans；不采provider静态div，不在第一个root出现就停止。
原nonempty/every animations0断言保留；另外必须出现实际animated part，Checkbox/Radio
专用static-none checked样本必须mode none/opacity1/transformnone。记录时间、tag、slot、
mode、inline/computed style、WAAPI state/time/timing/keyframes。无空样本容忍/晚等结束。
独立negative control在同一插入task启动真实opacity WAAPI，要求probe捕获非零动画。
它仅用于验证测试探针；实际site static-none实例没有重挂载或延迟。

Production Edge/msedge workers2，port3160，源码与最终commit完全相同：

- B3八控件 ×三mode ×两OS：加强后48/48；首帧negative1/1。
- 受影响B5 indicator、pointer/keyboard selection、handoff/measured width：18/18。
- 合并原报告 .cache/control-authority-browser.json：67pass +1预算fail（不是68pass）。
- c53c55a post-commit final production rebuild后，原四none cells +negative再次5/5；
  .cache/control-source-authority-browser.json另外含1预算fail。
- 未改interaction scale/opacity/frame数、同node取消、nestedfull、focus、键盘、阈值、timeout。
  全库CSS/Motion矩阵不据此宣告通过。本轮未机械重复全库visual/axe；没有DOM/classes/
  renderer变化，复用既有历史visual/axe，不冒称本轮截图认证。

详细原始四cell与全部case状态在 docs/evidence/control-runtime.json；其中
finalBrowser.fourRawResults是最终post-commit生产样本，非首次root-only探针。

## 真 React 19.0 consumer

原声明installation React19、overall-design React19.x，无>=19.2限制。
官方19.2新增useEffectEvent（链接在control-runtime.md）。隔离npm包
.cache/react19-consumer安装真实 React19.0.0 +ReactDOM19.0.0、Motion13.5.1、
Base1.9.0、OTP1.5.0、Vite7.3.7；复制registry/cadence布局，所有imports在隔离包解析。
未降主workspace、改主lock、mock/伪造React、patch依赖、feature detect跳动画或收窄文案。

修改前production bundle能build，但浏览器白屏：`useEffectEvent is not a function`。
修改后生产fixture真实运行三个适配器 ControlSpan/ControlDiv/NativeControlDiv 与OTP。
StrictMode、3mode×2OS、实际opacity/geometry帧、none停止、same-target clock取消、
无关render保留真实WAAPI animation identity、OTP JS opacity进展、input/character/DOM/
focus保留、native drag及unmount cleanup refs均通过。OTP清空必须真实Ctrl+A/Backspace
并断言empty；早期fill("")没清内部状态，已修fixture，未放宽断言。一次rAF等待引擎启动，
不晚等动画结束。19.0的OTP使用JS driver，不能以getAnimations非零作为必然条件。

最终可复现 tests/fixtures/react19-consumer/{prepare.mjs,README.md,run.mjs,package.json,
vite.config.mjs,index.html,main.tsx.txt}。template复制成隔离main.tsx，避免host tsc编译fixture。
最终命令：

```powershell
node tests/fixtures/react19-consumer/prepare.mjs
npm install --prefix .cache/react19-consumer --no-audit --no-fund
npm exec --prefix .cache/react19-consumer -- vite build .cache/react19-consumer
# 在隔离包运行 npm exec -- vite preview --host 127.0.0.1 --port 3161
node tests/fixtures/react19-consumer/run.mjs
npm ls --prefix .cache/react19-consumer react react-dom --all
```

安装未改源依赖。final prepare/build/runtime日志为 .cache/control-react19-authority-*
（runtime.err为空）。物理resolution JSON、npm dedupe tree、package-lock SHA、manifest版本
及最终完整frames在control-runtime.json；每一dependency resolve到同一React与ReactDOM路径。
本轮没有额外认证19.1或所有组件最低版；已关闭两个新hook的全部受影响路径最低版缺口。
CodeBlock19.0 imperative handle是可选扩大项，本轮未另测，不虚构认证。

## Motion conformance、最终check与预算

读完animation-system/overall-design/site-distribution/ADR/CONTRIBUTING；shared adapter
调用者实际为Checkbox/Radio/Switch/Slider/Progress、Combo/Context/Dropdown/Select及Menubar
继承路径。原state.morph/data.transition等declared/source/frontmatter/contract集合未变，
新排序task无时长、不增加recipe，targets/timing仍tokens。OTP state.morph full scale/fade、
reduced opacity、none即时，character span保留。shared38 animated实际helper/reporter、
Motion观察器与旧tests未改。normal effect值依赖与queued cleanup已有真实browser证明。

c53c55a提交后串行：

1. VITEST_MAX_FORKS=2 /MIN_FORKS=1 `pnpm registry:build`：65payloads/58docs，
   .cache/control-authority-registry.log。
2. `pnpm check`：type/lint/registry/parity58/tier budgets +663/663tests、85/85files；
   .cache/control-authority-check.log。原act与既有Item img警告未屏蔽，无threshold/timeout弱化。
3. RAYON_NUM_THREADS=2 NODE_OPTIONS=--max-old-space-size=768
   CADENCE_DIST_DIR=.next-control-runtime `pnpm exec next build`：production通过，
   .cache/control-authority-next.log。Next tsconfig-only diff保存于
   .cache/control-authority-tsconfig.diff，核实后只restore本轮tsconfig变更。
4. Edge2 final源原四cell/negative/budget结果如上。未触用户.next/3000。

**预算仍OPEN/FAIL：292267 gzip bytes /23 scripts >120000**，
docs/evidence/control-runtime-js.json。真实freshEdge/cacheoff/nointeraction/networkidle+10s+
networkidle，所有automatic async/prefetch脚本逐body gzip6，全部200/no pageerrors，
BUILD_ID/root manifest及精确root body hash核对通过。没有排chunks/延窗/减功能/抬限。
前292314/292327/292344/291749/291658/291423/baseline290171全部保留，不改历史。
本轮precommit与postcommit最终build恰同292267；check绿不能盖预算red。
InitialJS是**每页**≤120KB，Button只是失败共同baseline；最终关闭仍必须覆盖全部适用full
site页，特别Chart/Calendar/CodeBlock，不以fixture114KB gzip替代完整产品预算。

## 保持关闭与全部remaining

- 有限API ledger **373/466 classified：256 compatibility +117 static，93 open B6–B9**，
  未改inventory/ledger，不重审已闭B1–B5/Progress/CodeBlock或扩大分类。
- Combobox实际outside mouse/touch、Tab/ShiftTab、reopen/unmount、parent/siblings、属性
  ownership默认路径有限矩阵仍已闭，见compatibility-combobox-focus.json；本轮不回退guard。
- Provider仍最终token-only fallback duration.base*timeScale/ease.out；无effectivefallback
  模式变化。caller自写Motion程序不自动算库控制，不用Provider变更绕过四fail。
- 保持58=56UI+2blocks、65items、58docs、B1–B9历史gates、recipevalidation/helper/highlight、
  URL37axes/118options/21N/A、58页noJS、siteflow/catalog/sidebar/intensity/distribution/guides/
  T0templates既有关闭结论。Distribution132 current；frozen快照和beforeFiles不变。
- **仍OPEN**：全部适用页initialJS预算；有限compat93 B6→B7–B9；全库CSSpopup nestedclock/
  nonefirstframe/livecancel/full→reduced去geometry留opacity；全库Motion same-target mode/clock
  真取消/nestedfull/nonefirstframe；held-press期间disabled视觉取消；最终整个goal逐要求审计。
  本组闭合原四none几何失败、真实首帧探针缺口和两个hook19.0缺口，不代表全库认证。
- ADR009仍Next App Router；ADR016只研究。旧directSSR ordinaryfence120492/install136462
  失败未采纳，完整产品header/sidebar/search/navigation/package manager/source/installcopy/
  realpreview/modes/focus/a11y不得为预算移除。
- AI25 unscheduled/direction deferred/form-native-select-sonner excluded不扩；MCP/分发Skill/
  release/hosting未实施或授权不虚构。无push/发布/部署。

## 下一可执行步骤与停止状态

协调核实本handoff提交后completed/idle+clean，再开下一唯一实施者；本轮不创建后继。
下一有限审查仍按§8从B6开始，再B7–B9共93实际出口，基于inventory/ledger与实装类型逐
真实surface/context审查；不把类型索引当运行证明，不覆盖ledger。独立全库live矩阵与
预算仍需后续实质组，不把本轮67绿或19.0小fixture当整体goalcomplete。

保持串行编辑→registrybuild→check，source commit后重建最终check；payload/handoff独立。
证据-only不机械刷新runtime sourceSha。UTF8/LF/Biome只处理改动文件，冻结snapshot不可动。
本轮自有3161 Vite preview已按真实process命令行停止，3160 Playwright server自动退出。
提交前git diff --check通过；handoff提交后再次核实git status clean，然后停止。
