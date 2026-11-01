# 串行 parity 交接：runtime 边界新增实证，initial JS 仍 OPEN

工作目录 `D:/Code/Project/cadence-ui`，2026-11-02（Asia/Shanghai）。
本文件接替 `site-initial-js-budget.md`；先完整读两份交接、`docs/site-js-budget.md`、
`docs/evidence/site-js-budget.json`、`docs/evidence/site-runtime-boundaries.json`、AGENTS 和适用设计/ADR。
本轮唯一实施会话，没有创建会话、子代理或并行实施，没有 push，没有重复确认。
**B1–B9 gates closed；整体 goal 未完成，initial JS 预算仍 OPEN，不能标 complete。**
协调核实 completed/idle、git clean 后再开下一唯一实施会话；本会话提交交接后停止。

## 提交、范围与不变约束

起点 `97b8700`，git clean。implementation **a17a66e**：两个可运行隔离实验脚本、compact JSON
请求/模块证据、测量报告、parity-plan §8 与研究状态 ADR-016。Payload **1908a20**，60 个 JSON
仅 sourceSha 更新为 a17a66e；本文件独立交接提交，不为它再次 registry build。
无产品 app/component/content/metadata/依赖/Next config 改动，无框架迁移采纳。
固定 upstream pin `96da9cc7f1aa10580a3741664e2a77c721206c00`，Base UI 实装1.9.0。
58 components /65 registry items /58 docs /38 animated suites /20 T0 suites保持。

## 新证据与限制

原产品仍 **290,171 bytes gzip /22 scripts**，120,000-byte 预算仍失败。
本轮未重建无改动产品或重复其预算负例，不冒充新 final-production 结果；上一轮真实 gate 和
request/SHA清单继续有效。本轮核对 retained `.next-js-budget-final` 的全部22文件与已提交baseline SHA一致。
产品 runtime 的 React/renderer 字符串实际为 **19.3.0-canary-278794d7-20261002**，来自Next内置版本；
package.json/node_modules stable React19.3.1不能描述为App Router实际renderer版本。
只发现一个 rendererPackageName marker，无第二 stable renderer marker；无实证支持“重复加载两个renderer”。
72,047-byte root实体包含renderer；45,595-byte实体包含router/reducer，实体还可有其他模块。
这不是单独包gzip贡献，也不是所有Next配置的数学下限。未替换Next内部React aliases。

以下均是 fresh Edge、CDP禁cache、无交互10秒观察、全部自动脚本逐URL去重逐实体gzip，与产品同collector：

| 隔离候选                                                  | bytes gzip | scripts |
| --------------------------------------------------------- | ---------: | ------: |
| Next Pages hydrated counter                               |     113032 |       7 |
| Next Pages unchanged ButtonPreview                        |     168699 |       7 |
| Direct React SSR unchanged ButtonPreview + counted Button |     126429 |       1 |
| Direct SSR local Button m/domAnimation synchronous fork   |     112220 |       1 |
| 上一候选加真实 CodeBlock docs fence/copy control          |     135334 |       3 |

工具命令和scope详见 `docs/site-js-budget.md` 新节。两个脚本只生成`.cache` fixtures，OS选择空闲port，
finally关闭browser/server；无请求拦截、无自动chunk豁免、无延迟到窗口后、无组件删除。
Pages使用Next16.4.3/React19.3.1/reactCompiler，最终脚本cpus2；raw SSR使用实装esbuild0.28.2，
从Vitest/Vite工具链解析，无新增依赖，不宣称raw esbuild等价于React Compiler产品构建。
raw SSR baseline/lean/lean-fence在最终脚本上串行重跑，数字一致：`.cache/runtime-boundaries-final-probes.log`。

Pages counter Enter激活、Pages preview16按钮和live none被验证。SSR三个候选验证no-JS16按钮、
hydration无recoverable error、Enter更新计数、三mode属性、held scale full0.97/reduced-none identity。
第一次full按压probe在之前键盘操作后采到identity；最终probe先click建立pointer操作再采样，通过0.96–0.98断言。
这些不替代完整a11y、首帧、live cancellation或全库审计。fixture没有产品stylesheet/chrome，未做截图/axe。
fence真实使用CodeBlock root/header/title/actions/copy/content；只验证其dependency/load成本，
不宣称fixture证明clipboard/highlight行为。首次unsplit构建误把deferred grammars打进315017-byte单体；
已改正常ESM splitting，最终只计3个真实自动加载实体，不能把unsplit诊断当框架下限。
metafile贡献是loaded outputs中的minified raw bytes，非可相加gzip归因；compact JSON保留top30和总模块数。

## 决定与下一安全行动

不采纳Pages迁移：连无chrome的ButtonPreview都168699。不能直接采纳112220候选：它没有完整站点，
只剩7780空间，真实CodeBlock fence就把它推到135334。
ADR-016仅研究记录，ADR-009的单Next App Router产品决定仍有效，预算不提高。
Motion官方domAnimation支持animation/exit/tap/hover/focus，不支持domMax的layout/drag；
不能全库替换以损坏真实parity来换数字。实验fork只在`.cache`，原registry保持原样。

下一步先在隔离fixture收窄**实际CodeBlock docs fence**的依赖/feature边界，保留registry renderer、
copy与所有原功能，分析是否能不把未使用layout/drag拉入Button route。不重新做已失败server catalogue方案。
若此候选可行，再构建完整SSR document shell + route-specific hydrated islands的Button route prototype，
保留header/sidebar/package-manager/source/installcopy/navigation/search/SSR/preview全部功能；测所有自动scripts，
真实冷加载/复制/导航/search/三mode/focus/a11y通过后，才考虑框架/组件架构采纳，并先按ADR记录决定。
任何重大架构路线都有MDX/metadata/assets/immutable r hosting迁移影响，必须可review实证，不能只比fixture。
不是“已证明框架不可能”；其他站点/metadata/跨库审计也可独立推进，不因难而blocked。

## 验证

- 首次pnpm check在新脚本Biome相邻else格式停止；只格式化改动文件后修正，无阈值/配置修改。
- implementation前完整check `.cache/runtime-boundaries-check.log`：**559/559,77/77 files,73.39s,exit0**。
- a17a66e后顺序registry build `.cache/runtime-boundaries-source-registry.log`，65 payloads/58 docs。
  完整check `.cache/runtime-boundaries-source-check.log`：**559/559,77/77 files,73.49s,exit0**。
- payload递归剔除sourceSha比较 **60 files, nonShaDifferences=[]**，新SHA全为a17a66e。
  比较工具同时收集before/after，所以日志sourceShas列表含旧698c728与新a17a66e。
- 旧Item img lint warning、Base act warning保留，不扩修；38-suite三mode reporter/58-doc recipe门禁未弱化。
- UTF8/LF、Biome只格式化改动文件，git diff --check通过；MAX_FORKS2/MIN1、build/check顺序执行，
  NODE_OPTIONS768MB/RAYON2。独立Pages最终fixture使用cpus2；浏览器单实例顺序，未碰用户3000/.next。
  tsconfig无变化，无需restore；实验Next与Edge进程已关闭。没有产品UI变更，不机械重跑全库browser矩阵。

## 必须完整保留的后续 open

1. §8 tooling：docs recipe/helper/highlight reliability closed；initial JS实测与runtime研究完成一轮，预算仍open。
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
