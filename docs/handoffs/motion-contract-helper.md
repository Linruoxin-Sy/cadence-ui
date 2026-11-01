# 串行 parity 交接：§8 expectMotionContract helper closed

工作目录 `D:/Code/Project/cadence-ui`，2026-11-02（Asia/Shanghai）。
本文件接替 `docs-recipe-validation.md` 的下一步指引；旧交接保留历史证据。
本轮唯一实施会话，只做用户指定的共享 helper；未创建会话/子代理/并行实施，未 push，未重复确认。
协调核实 completed/idle、git clean 后再建立下一唯一实施会话。整体 goal 未完成，不标 complete。

## 起点、提交和边界

起点 `be4dd2d`，git clean；继承 docs source `83d2de0` / payload `b73a7bb`。
本轮 implementation **236018f**（helper、38 suites adoption、强制入口、design/scaffold/rules、必要的4个属性修复）。
从 final source 重建并完整 check 后 payload **33967bd**，所有变化 payload 的 sourceSha=`236018f`。
本文件独立 handoff commit；不为 handoff 再 build。

B1–B9 gates 继续 closed；§8 docs-side recipe validation 和本轮 helper closed。
58 components / 65 registry items / 58 docs / 38 animated suites / 20 T0 structural suites。
固定 pin `96da9cc7f1aa10580a3741664e2a77c721206c00` 不移动；Base UI 实际1.9.0。
未改 metadata、recipe、token、callback/render/ref 逻辑；未处理高亮根因、JS预算或站点承诺。

## 实现和强制流程

- `tests/motion-contract.tsx` 的 `expectMotionContract(mode, options)` 在所有38个 animated UI/block
  的原有 `tests/components/<id>.test.tsx` 中实际执行 full/reduced/none。15个原先没有完整循环的
  suites 增加3mode fixture；其余复用既有fixture/行为。保留有意义的交互/API/keyboard/ref tests，
  用 helper 的 `parts` presence 要求替换重复 mode assertion，不删除指定part存在性的覆盖。
- `tests/motion-observer.tsx` 是测试专用的 Motion public API pass-through observer：真实 Motion
  renderer、controls.start/set 和 imperative animate 继续运行，只记录输入。每个test清理记录。
  不引入测试专用生产分支、不用模拟 DOM renderer 代替真实组件。原有 mocks 只有 Carousel Embla
  hook/engine fixture、Chart controller/ResponsiveContainer observation；Resize/IntersectionObserver、
  matchMedia、pointer、OTP hit-test 和scroll等既有 jsdom shims 保留。
- helper断言所有 mounted带slot的mode（portal也包括），所有 observed Motion parts自己的mode，
  CSS starting/ending travel/scale与height branch，CSS none local clock/transition-none/duration-0，
  continuous none gating、reduced opacity pulse与Spinner单glyph spin例外；Motion initial/target/exit、
  gesture、layout projection的降级，以及 none tween/spring/delay/嵌套property clock归零。
  Switch/Progress合法保留position/scaleX但必须instant；static placement/centering不当作动画。
  aria-hidden glyph可保留零时长rotation朝向（CodeBlock展开箭头）；有时长的旋转仍失败。
  `instantImperative`让Select/CodeBlock reduced geometry检查记录到的imperative clock；none始终检查。
- Calendar三mode测试现在stub native WAAPI，真实点击换月后检查actual keyframes、full220/reduced132ms、
  reduced无transform、none不创建effect。Chart真实controller使reduced/none进度完成；Carousel真实
  lifecycle plugin将mock engine setter/release归零；Sidebar真实animate输入full spring及降级不创建
  tween/保留最终状态。Tabs downgraded静态indicator有明确behavior assertion。原有更深行为测试保留。
- **强制入口不是静态搜名字。** `vitest.config.ts` 加载 `tests/motion-contract-reporter.mjs`；helper
  成功才通过 onTestFinished 写入task metadata，reporter只计passed test cases。按registry非空motion
  对每个执行的animated suite要求full/reduced/none；import、dead call、skip或缺mode不能交差。
  `pnpm check`必跑该reporter；`registry:check`还拒绝缺少对应named `.test.tsx`文件。
  只跑单文件可以，但被选择的animated suite也须覆盖三mode；按test-name过滤掉contract会失败。
- `new-item.mjs`为animated生成provider+helper+三mode实际测试；静态source stub尚未实现动画时测试
  故意失败。T0不加provider/helper。AGENTS/CONTRIBUTING/animation-system §9.3已更新，先design后实现。
  prior docs machine validation全58继续通过；原19 tests保留，新增缺失animated test file负例，共20。
  scaffold正例同时断言animated有调用/T0无provider/helper。

## 确证并修复的最小源代码缺陷

严格检查每个observed Motion part时，CodeBlock3mode失败：tab indicator、两个copy glyph和expand
chevron没有自己的data-motion。源码确认这4个motion.span均直接读取cm、驱动动画，却缺属性。
仅补 `data-motion={cm.mode}` 四处。未改高亮、clock、recipe、geometry、classes或upstream surface。
Motion conformance：data.transition=float actions，layout.shared=tab pill，state.morph=copy/chevron，
geometry.resize=measured/clamped viewport；registry/frontmatter/合同表/source一致。既有reduced保留
opacity，禁scale/FLIP，heightinstant，chevronorientationinstant；none所有clock0。helper和现有行为
测试证明相应输入分支；本轮浏览器验证该局部组件，不外推到全库running-mode。

## 验证与证据

- `tests/lib/motion-contract.test.tsx` **14 tests**：真实Button3mode、真实坏Motion none branch、wrong
  mode、reduced/none retainedtransform、initial/gesture/layout、nonzero tween/spring/delay/nestedproperty、
  controls.start、CSStravel/height/noneclock/continuousloop、instantposition/rotation与空behavior负例。
  isolated真实Vitest子进程：button unusedimport、toggle deadcall、checkbox整suite skip、switch缺none
  都exit1并给id诊断；Spinner真实3mode与T0正控不报。不是只测试静态名字/未调用helper。
- 最后focused34/34（helper14 + docs20），`.cache/helper-final-focused.log`。
- 首轮helper把Button colour/box-shadow当motion CSSclock，按实际属性收窄后修复；严格mode检查另
  暴露上述CodeBlock4处缺属性，修源码而非metadata豁免。首次check在新test格式停止，格式化改动文件。
  无阈值/配置放宽，无retry到绿。旧CodeBlock高亮本轮通过仍不构成历史timeout根因解决。
- Source前 registry build `.cache/helper-build.log`；完整check **553/553,75/75 files,70.21s**，
  `.cache/helper-check-fixed.log`。Source后严格顺序build/check：`.cache/helper-source-build.log` /
  `.cache/helper-source-check.log`，**553/553,75/75 files,70.73s**。typecheck/Biome/registry/P11/tierbudgets/parity58
  全通过。既有Item img lint warning、Baseact/nativeButton warnings保留。
- 隔离production build `.cache/helper-production.log` 成功：CADENCE_DIST_DIR=.next-motion-helper，
  RAYON_NUM_THREADS2，NODE_OPTIONS768MB。Next生成tsconfig仅新增isolated types includes和重排，已核实
  后仅restore该文件。未碰.next/用户3000。unit MAX_FORKS2/MIN1；build/check按低内存顺序运行。
- 先查3197空闲，Edge/msedge workers2、无retry：code-block motion-matrix **13/13**（3mode×2系统
  偏好tabs/fold + pillpaint），增强对4处新属性的断言，`.cache/helper-browser.log`；原B9codeblock
  light/dark×1280/390 screenshot+axe tests **2/2**，`.cache/helper-visual.log`。四份preview截图复制到
  `.cache/helper-proof/code-preview-{light,dark}-{1280,390}.png`并逐张检查。移动code仍按既有横滚展示。
  这些是局部CodeBlock证据，不是全库axe0或首帧/livecancel审计。浏览器server已退出，3197未留服务。
- public独立60个JSON变化，结构化对比剔除sourceSha后仅code-block.json有4处attribute源内容差异；
  所有变化payload sourceSha236018f。`.cache`、build输出、截图/日志不提交。

## helper能证明和仍需浏览器证明的边界

helper是同质provider fixture的可执行unit分支/输入证据，不能读取jsdom不存在的Tailwind computed
animation或真实layout，不声称完整自动解析文档property集合；recipe集合由registry:check独立验证。
行为callback必须实际执行assertion，engine/WAAPI专用assertions仍需维护。caller自带CSS/WAAPI、
复杂variants/keyframes不自动成为完整coverage。首次paint、same-target运行中取消、nested provider
mixedmode、系统偏好、measuredfinalposition/每帧geometry必须在真实浏览器另证。
**helper adoption不关闭跨库running-mode或callback/render/ref/nativeevent审计。**

## 下一唯一会话：CodeBlock async highlight可靠性

先完整读本文件、docs-recipe-validation.md、AGENTS、parity-plan §8及适用design/skills。
下一步调查B1/B3重复1s高亮timeout的根因与测试可靠性：不能只retry到绿或调阈值，不能因为本轮两次
完整check和浏览器highlight都通过就关闭。按复现/证据修复，保留真实异步加载行为与测试价值。
随后实测并修复button初始JS≤120KBgzip；本轮production build不等于该预算已测或已过。
协调核实本轮idle后再创建下一唯一实施会话；本会话不创建后继，不并行，不push，不标goalcomplete。

## 必须完整保留的后续open

1. §8 tooling剩余：高亮可靠性根因、button初始JS≤120KBgzip实测修复。docs recipe/helper已closed。
2. §8 site全部承诺实查：preview variant/codeview/installcopy，search+category/intensity/complexity
   filters，TOC/prevnext/Edit，immutable /r/[...path]，missingguides；站点sidebar landmark/
   aria-controls/heightanimation。部分可能存在，不重复实现、不凭旧文字关闭。
3. metadata intensity定义一致性；T0responsiveness/performance模板强制；mobileAPI表窄列可读性。
4. 跨库callback/render/ref/nativeevents：按真实Base类型检查callback求值/callerlast、render element/
   function、React19cleanup、nativeevents；原生useRender.ComponentProps仅string/object，不伪造回调。
   B1–B5局部证据或静态parity提取不能代替全库真实类型兼容。
5. 历史CSSpopup全库：nestedclock、none首帧/livecancel、full→reduced去geometry保留opacity。
   Navigation/Sheet/Dropdown/Popover/B5局部通过不代表未审组件豁免。
6. 跨库Motion running-mode：仅改transition prop不保证same-target旧动画取消；按真实行为修，
   ControlSpan不是全库证明，不以强制remount/丢focus解决。本轮helper也不关闭此项。
7. B5 Combobox inert补丁保留outsidepointer dismiss/activation、Tab/ShiftTab、nestedpopupownership/
   cleanup等真实兼容实证；axe0不等于全兼容/全库证明。
8. 旧contract drift §7.4 / parityprops §7.6继续closed，B1–B9closed；不无故重开但发现具体新缺陷要修。
9. AI25 unscheduled、directiondeferred、form/native-select/sonnerexcluded不扩。Attachment/Bubble无新包
   不代表全局AI prerequisites完成。

继续relativeimports/sharedlib/namespaceddeps/P11UIonly、tokens/reduced/none、Base render、callerlast/
refcleanup；只读shadcn，禁init/add/apply/create/preset/components.json。pin/旧commits不动。
UTF8/LF，Biome仅改动文件，Vitest只识别.test.tsx；source/content/meta变化先registry:build再check。
原子implementation→final-source build/check→public独立commit→完整handoff独立commit，不为handoffbuild。
低内存顺序验证、隔离production/闲置port、msedgeworkers2，不碰.next/3000，不弱化配置或阈值。
