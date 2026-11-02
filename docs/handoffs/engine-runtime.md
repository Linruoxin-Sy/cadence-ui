# 串行 parity 交接：Motion/engine 实测修复增量

2026-11-02，Asia/Shanghai，D:/Code/Project/cadence-ui。
起点 clean `3f43535`。本轮唯一实施者；没有子代理、并行实施者、后继会话、push、发布、部署或 freeze。
**完整 Motion/engine 矩阵尚未闭合，整体 /goal 未完成。** 本交接不把已通过的代表用例泛称为全库完成。
由协调核实本会话 completed/idle + clean 后决定下一唯一实施会话；用户指定 GPT-6.1 Sol High。

## 提交与 authority

1. `d636cae`：修正起点 CSS lifecycle 证据表的 Biome 格式；纯格式，无 CSS/runtime 改动。
2. `0a97033`：ControlAnimation/OTP 改为 client committed layout effect；Checkbox/Radio reduced scale 零时长；
   DocumentEntrance 与 CodeBlock 浮动 Actions、copy 双 glyph、expand span 使用可取消控制器；
   held-disabled Button/Toggle/Group 与 Slider scale 取消；原始反例、探针和 scheme 同步。
3. `0373de4`：修正 B5 全局首个 SelectValue 采样错误，真实 Framework none 宽度反例先红；
   初始 reduced/none 改用自然宽度。此提交还不是最终 live 修复。
4. `819482c`：native disabled 吞 pointerup 后，重新启用会复活旧按压；清除已取消的私有手势，
   inactive tap 不存潜伏手势。真实 pointer/Enter 轨迹和 none→disable→release→enable→full 单测先红后绿。
5. **`50cc262`：最终 runtime source。** Select live 降级时 React auto 仍会被旧 Motion 数值覆盖。
   保留单一 MotionValue width owner，jump 到 auto，并在绘制前写同一 auto 目标；full 仍保留测量 spring。
6. `25333f0`：最终 review/evidence、加强非空/真实部分 scale 断言、可重现四页 JS 审计工具、§8 进度。
   测试/证据改动不机械刷新 runtime sourceSha。
7. `489f3f3`：独立 final payload，61 个当前 JSON；**174 个 sourceSha 都为 50cc262**。
8. 本完整 handoff 独立提交，SHA 见 git log；不为 handoff build。

固定 upstream pin `96da9cc7f1aa10580a3741664e2a77c721206c00`、依赖/锁、公开 props/defaults/exports/data-slot/id 未改。
主 workspace 仍 React/ReactDOM19.3.1、Motion13.5.1、Base1.9.0；完整版本/类型源沿用 compatibility-inventory。
shadcn skill 只读，未运行 consumer init/add/apply/create/preset。
`public/r/snapshots/`、registry-snapshots.json、`.gitattributes` 与起点逐 git diff 无差异；未 freeze。

## 实测纠错与实际修复

- A：不是只凭 useEffect 字样推断。外部异步 React 更新的 commit、随后第一个/第二个 rAF 原始样本
  确实保留旧控制器与 OTP 状态；client layout effect 修复。保留 c53c55a 的 stop/set + public
  frame.update 重申与 cancelFrame cleanup，未引入 useEffectEvent、render ref 写入、延迟显示或 remount。
- B：Checkbox/Radio 从真实部分 scale0.960209 切 reduced 后仍补间；目标1不是 snap 证明。
  per-key scale duration0 保留允许的 opacity。CodeBlock copy glyph 也出现0.999643 的同类反例并修复。
- C：DocumentEntrance 旧 unchanged-target 声明式动画在 none 后仍继续 opacity/y。
  新控制器在 commit 前取消，explicit none 的 SSR initial 为 RESTING。article/section/div SSR9 用例通过；
  真实 Next article 两 OS 采样证明首个 none 帧中 opacity1/中性 geometry/无残留动画、同主 DOM。
  原入口、4px blur/clipPath site 特例、useInView、完成后清层、noscript/print 规则保留。
- D：真实 pointer held-disabled 取消后，又发现 native disabled 吞 release，重新启用再次 scale。
  原生 Button、focusableWhenDisabled Button、Toggle、继承 group-disabled 的 Item，各有 pointer/Enter
  真正部分 scale→禁用中性→释放/重新启用中性。8 条通过；记录 Base 焦点策略，没有强迫 native disabled 保焦。
  原 Space 样本无按压动画，不算 keyboard 动画证明。Slider 取的是 Base dragging 的 ControlDiv，
  disabled 后 dragging 仍可为 true，已显式以 disabled 取消其 scale；Base position/translate/输入值保留。
- E：采实际 CodeBlock floating Actions，不采静态 header Actions；copy 两个真实 span 和 expand 的动画 span，
  不采其静态 SVG。旧 source 在 none 后继续 opacity/rotation，新控制器取消；180°静态朝向在 none 合法。
  measured viewport、shared indicator 没有为省事重造，仍需下面专属运行证明。
- Select：旧 B5 `document.querySelector(select-value)` 实际采页头 speed select。旧 width 绿不能证明 Framework。
  改为真实 preview 后，0a97033 有2/6 none 红：旧41px 对新自然37.171875px。
  第一次 auto repair 修了初始，但819482c live 又有3/6红：**data-motion 已为 reduced**，旧37.067px 仍覆盖 auto。
  不是提交前观察；完整 DOM/mode/error 已保留。最终单一 MotionValue owner 修复，原同一数值断言6/6通过。
  没有放宽1px阈值、加迟等结束或去掉 full 真动画断言。

scheme 在 animation-system/site §2.4 同期更新；recipe 集、frontmatter/contract 未变。
CodeBlock 原始 source gzip 曾超 T5 4 bytes；精简说明注释后最终 **12204 ≤12288 bytes**。
这是 raw source tier budget，不能冒充 compiled per-component8KB。

## 最终验证与可重现入口

最终 authority：[engine-runtime-final.json](../evidence/engine-runtime-final.json)、
[逐 part 剩余表](../evidence/engine-runtime.md)、[33 个实际 source sites](../evidence/engine-writers.json)。
源索引是定位/发现，不是运行证明；实际 DOM/调用是 authority。

- `pnpm registry:build` → `pnpm check`：**687/687，88 files**，type/lint/registry/parity58、P11、tier budgets 全通过。
  `.cache/engine-owner-registry.log`、`engine-owner-check.log`。
- 隔离 `.next-motion-runtime` 最终生产 build 成功，`.cache/engine-owner-build.log`。
  Next 自动 tsconfig diff 保存为 engine-owner-tsconfig.diff，核实仅本轮生成的 include/格式后 restore。
  未碰用户 `.next`/3000，未添加产品 test route。Next RAYON_NUM_THREADS2 / NODE_OPTIONS heap768MB。
- Edge/msedge、port3167、workers2：**106/106**，`.cache/engine-owner-browser.json`。
  B3 48；Dropdown checkbox/Select 12；Calendar6；Carousel7；Chart6；Tabs6；Sidebar6；真实 article2；CodeBlock13。
  最后加强 Dropdown checkbox 非空原始帧断言后，专属6/6再次通过，engine-dropdown-owner-browser.json。
  只证明此 checkbox，不代表其余 radio/Context/Combobox/Select indicator。
- `tests/runtime` 独立 Vite/真实 React/Motion/Base：23/23 commit/前两帧断言；
  `press-reenable.mjs` 8/8 pointer/Enter，禁用前必须真实部分 scale。它们不是 Next SSR 或整站预算证明。
  原反例在 engine-runtime-raw.json、engine-select-width.json、engine-select-live-negative.json、
  engine-press-reenable-negative.json；最新数据在 final JSON 和 `.cache/engine-owner-fixture.json`。
  启动 `pnpm exec vite --config tests/runtime/vite.config.mjs` 后运行两个 .mjs；probe 输出再交 assert-report.mjs。
- 真 React/ReactDOM **19.0.0** 隔离 consumer production/StrictMode 再次通过：三类实际 Control adapters、OTP、
  mode/clock、无关 render 不重播、native event 和 React19 cleanup refs。final JSON 核对复制子集与当前 source 字节相等。
  `.cache/engine-react19-final.json` / engine-react19-final-build.log。范围是 adapter/OTP，不声称全58组件19.0 browser。
  其小 fixture 的约114KB不证明产品120KB预算。
- post-runtime review 的 typecheck/lint、JS accounting unit通过；Source/旧 tests/negative helper/reporter保留。
  已有 Item img lint warning、act warnings不屏蔽；没有放宽 timeout/threshold/axe 或删交互断言。
  未重跑整库 dual-theme visual/axe；palette/classes/主DOM未变，旧 gates 的该证据精确复用，不冒称本轮截图。

## 性能仍 OPEN：四页真实失败

最终 [engine-runtime-js.json](../evidence/engine-runtime-js.json)，runtime50cc262：

| Page      | gzip bytes | scripts |  limit |
| --------- | ---------: | ------: | -----: |
| Button    |     293136 |      23 | 120000 |
| Chart     |     414186 |      24 | 120000 |
| Calendar  |     318494 |      24 | 120000 |
| CodeBlock |     376533 |      29 | 120000 |

四页全部 **FAIL**，每页 fresh Edge、cache disabled、无交互、不滚动、不排 prefetch/自动 async chunks，
load + networkidle +10s +networkidle，每个响应实体 gzip level6；全部200、无 pageerrors，root manifest/hash/gzip核对一致。
工具 `scripts/audit-site-pages-js.mjs <output> <baseURL> <comma-separated ids>`，环境：
CADENCE_DIST_DIR=.next-motion-runtime、CADENCE_RUNTIME_SOURCE=50cc262、PLAYWRIGHT_CHANNEL=msedge。
可重现审计退出码1，不能把它算 green；旧 Button budget test保留。原 helper 仅增加可选真实页面 readiness selector。
819482c 四页结果保留 engine-runtime-js-819482c.json；css-lifecycle292461等历史结果不覆盖。

最终所有适用完整 shell 页面都需≤120KB；不能 Button-only，不机械重复58个已知共同 baseline红。
ADR009仍 Next App Router；ADR016只是研究。保留 header/sidebar/search/nav/package-manager/source/install-copy/
真实 preview/modes/focus/a11y/SSR；不抬限、延窗、删功能或把功能 JS藏到 inline/data。
48KB initial Motion runtime、8KB compiled per-item（排 shared runtime）、≥55fps midrange mobile、CLS<0.02
仍为**未测证据缺口**，不是本轮实测失败/通过。后续要真实 compiled 归因，并披露硬件/throttle，不假称物理手机。

## 下一步：先继续真实 engine 矩阵，不能宣称本组全闭

逐 part 的已证范围和可执行剩余以 engine-runtime.md 的表为准，不重开已闭有限 API/CSS。
优先顺序：

1. 新 press carrier 的 Button 六初始 mode/OS cells；其余 disabled OS-reduce、clock/cleanup；
   actual Slider、Switch、Progress 与 OTP 外部异步受控 value/mode/clock 第一 paint。
2. Checkbox/Radio 外部 clock/reversal/cleanup；Dropdown radio、Context checkbox/radio、Select/Combobox
   每个实际 indicator。MenuBar 按真实 Dropdown context 引用证明，不把 checkbox 六格冒称所有 indicator。
3. Select 当前 initial/live width/flight 六格已真实 scoped通过；补 same-target full spring clock、
   inherited/explicit clock、异步首次取消、flight handoff/cleanup。不要回退到全局首个 header value。
4. Tabs/CodeBlock shared projection 的真正部分帧→降级、reversal/resize；CodeBlock floating Actions、两 copy
   glyph、expand span 的六冷插入/clock/re-entry/cleanup 与真实 Next private-host 探针。
   measured viewport 要真实 partial height、mode/clock、resize/controlled reversal/cleanup，不采 pre 或 SVG代替。
5. Sidebar scalar/onUpdate、Calendar native grid、Embla track/loop relocation 的 first-paint、clock、外部受控/cleanup；
   Recharts source枚举其他实际 controller-backed series，对实际 SVG/data target补 immediate first paint。
   现有 Chart测试跳过头2样本，不证明头2帧。getAnimations0不证明 JS driver停止。
6. Site DocumentEntrance 三个 as 的六初始格、offscreen、继承/显式 clock、settled不重播、真实 hydration/noJS/print。
   SSR9/实际 article2/fixture不是上述全部条件的替代。

每个实际 writer 依据明文 recipe 验 full/reduced/none ×两 OS、适用插入/重开/SSR条件、真实中间帧、
同 target mode/clock、full inside none（系统 reduce优先）、reverse/resize/controlled/cleanup。
clock按各 engine已有明文合同，不造 CSS原生正在运行 transition 的 live-retime承诺。
静态 position/data scaleX/坐标/180°朝向合法；主控件DOM/focus/ref/Base生命周期保留，不 key=mode重挂载。
装饰 branch按真实源码生命周期，不假设每个 indicator永远同node。无实际GSAP writer，不为未来目录造测试。

API466=342 compatibility+124 static全闭，CSS runtime/lifecycle全闭，B1–B9旧gates保留。
58=56UI+2blocks /65items/58docs、URL37axes/118options/21N/A、58页noJS、siteflow/catalog/sidebar/intensity/
distribution/guides/T0templates沿用既有authority。Combobox outside mouse/touch/Tab等有限矩阵不回退 inert吞激活。
AI25 unscheduled/direction deferred/form-native-select-sonner excluded不扩；MCP/分发Skill/release/hosting未实施不虚构。

后续仍串行编辑→registry build→check；新缺陷先红后最小修复，scheme错先改文档。
最终 runtime commit后 build/check，payload/handoff独立；纯测试/证据不机械 sourceSha刷新。
不创建后继/子代理、不push/发布；整体goal及全库运行矩阵保持OPEN。
