# 串行 parity 交接：registry distribution / guides 闭合

D:/Code/Project/cadence-ui，2026-11-02 Asia/Shanghai。接替 `catalog-sidebar.md`。
本轮唯一实施；无新会话/子代理/并行实施，无 push，无外部 hosting/发布/标签操作。
本逻辑组完成后停止，由协调核实 completed/idle + git clean 后继续。整体 goal 未完成。

## Authority / commits

起点 `18b10ad`，git clean，前序 `13afdd8` / `0289d42` / `84619f2` 均保留。

- `e1a287f`：ADR-017、revalidated aliases、beforeFiles route、显式快照与 build/check 完整性门禁。
- `ba1124d`：首个冻结快照与 retention inventory，独立 artifact commit；`.gitattributes` 保留冻结字节。
- `0cbb6fa`：四份 guide、guide order、llms、README/CONTRIBUTING、生产测试。
- `b27394f`：旧 motion-docs 隔离 fixture 复制新增 retention inventory，不弱化门禁。
- `01035e2`：tree identity 改固定 code-unit ordering；已有快照 identity/bytes 完全不变。
- `2161a06`：修复 catalog 为全部65项写 docs URL 却只生成58份 MD 的真实缺口，新增7份 support MD。
- `9880c18`：registry guide 使用真实 `@cadence/cadence-motion` id，最终 source authority。
- `be06e1e`：从9880c18重建 current public payload，独立 commit。
- 本交接与 HTTP/JS JSON evidence 独立提交；不为 handoff build。准确最终 SHA 见 git log。

固定 upstream pin `96da9cc7f1aa10580a3741664e2a77c721206c00` 不移，Base UI 实装1.9。
58 components /65 items /58 component docs /38 animated suites /20 T0 suites 保持。
registry/cadence 源码、props/defaults、recipes、包依赖与锁文件均未改。没有引入组件 validation API。
ADR-009仍Next App Router，ADR-016仅研究；没有采用 framework fork 或抬预算。

## 实际缺口与语义

原 public/r 静态存在，但无 handler/cache 设置。设计旧示例将会变化的 latest item URL 设为一年
immutable，且 dynamic catch-all 会输给 public 静态资源；只冻结 index 也不能固定依赖安装。
ADR-017追加修正这些冲突，不伪造 release/version endpoints。

保留所有原 `/r/<id>.json` / component MD / registry/catalog URL 和 shadcn build pipeline。
Next beforeFiles rewrite先于public匹配，将/r送入 app/registry-files/[...path]/route.ts。
严格允许单 lowercase JSON/MD文件，或 snapshots +64hex身份+该文件，拒绝嵌套/非法/编码反斜杠路径。
GET/HEAD读取实际public文件；SHA-256 ETag；weak/list/wildcard If-None-Match支持304。
最新别名 `public, max-age=0, must-revalidate`；冻结资源一年immutable；不存在/非法资源404/no-store。
包含正确Content-Type、read CORS、nosniff。未配置的静态host/CDN不自动获得此合同。

冻结命令 `node scripts/freeze-registry.mjs` **显式**运行，不在普通build/handoff自动冻结。
身份=按固定code-unit文件名排序的JSON [name, sha256] pairs的SHA-256。
当前唯一快照：
`84cc78703b354b29c815c3970cb26973e4760dea398fdf48756b8a24c996b2f1`。
完整目录随仓库提交；manifest覆盖125个当时root JSON/MD文件；registry-snapshots.json记录保留库存。
普通build和registry:check均验证目录库存、身份与全部文件bytes/hash，永不改写/删除旧快照。
新build/restart仍保留同一目录/字节。重复相同输入freeze幂等；缺目录、篡改文件会失败。
部署必须保留全部目录，不依赖.git/本地.cache/尚不存在的外部服务。冻结文件按captured bytes保存，
含少量继承的MD混合换行；-text防止Git归一化破坏hash。曾在提交前发现归一化风险并在快照提交内
纠正，逐个核对 committed Git blobs 对manifest零差异。不要改写这些冻结文件或移除该attributes规则。

consumer必须把同一个 **@cadence namespace** 指向 snapshot/{name}.json，才能固定transitive依赖。
单个direct frozen URL搭配latest namespace仍会装latest依赖。包版本范围仍需consumer lockfile。
冻结MD/catalog captured prose/links仍指latest，不能用它们推断版本解析。此快照捕获sourceSha18b10ad，
是明确保留的仓库快照，不是已发布release。没有 registry-<version>.json/tag aliases。

catalog原有7个support docs链接404，现生成简短真实用途/类型/install信息，current共有132资源：
65 item JSON +65 MD +registry/catalog。快照不重写、不为此修复再冻结；旧catalog指向latest的support
MD链接现在也可访问。所有既有JSON除sourceSha之外递归比较零差异；源码与payload内容保持。

## Guides / data

content/docs新增 accessibility、registry、ai、changelog，接在installation/theming/motion/motion-modes后。
通过现有lib/content、guide index、sidebar、metadata、llms列表接入，无新client组件/全局脚本。
现有CodeFence/registry CodeBlock和build-time highlight复用，新增fences只有已支持bash/json/tsx/package-manager。
README与CONTRIBUTING同步。没有hand-rolled pre、安装新包或组件动画修改。

Accessibility阐明真实keyboard/ARIA、caller focus/labels/validation ownership、OS优先与nested模式边界，
明确局部axe/helper并非全库认证。Registry给可本地复现server与namespace、真实保留hash示例和缓存/升级
语义。AI描述实际llms/catalog/JSON/MD消费，明确没有Cadence MCP或已分发Skill，AI25仍unscheduled。
Changelog仅Unreleased，未编造0.5.0发布/推送，完整保留初始JS与全库审计缺口。

## 验证 / evidence

最终 source9880c18：`.cache/distribution-9880c18-{registry,check,build}.log`。
完整 `pnpm check`：**567/567，80/80 files，75.07s，exit0**；type/lint/registry/P11/tier budgets/
parity58/38 runtime-helper与58 docs recipes门禁保持。最初cache设计Markdown格式由Biome纠正。
新增retention门禁揭露旧隔离fixture缺库存文件，曾导致17个真实失败；b27394f复制库存后20/20专项、
多次最终完整check通过，不是改超时/跳过/放宽门禁。snapshot测试还证明alias变化/重复freeze/篡改/
删除目录失败。现有act与img lint warning未改，不影响完整check exit0。

生产 `.next-distribution-final`，BUILD_ID **D2DR-DJ3xCGv8mTvt2gyF**，73pages，RAYON2/NODE_OPTIONS768MB。
port3147先核实空闲，Edge/msedge workers2。前轮port3146首次生产也验证快照；后续build与重启再验。
`.cache/distribution-9880c18-e2e.json` **7/7，40.72s**：

- 全132 current资源逐bytes比对，真实shadcn/schema解析65items/index，catalog65全部item/docs链接200。
- 所有125 frozen资源逐manifest hash比对，依赖closure；GET/HEAD/type/cache/ETag、24 latest conditional
  variants、weak/list/wildcard/stale、immutable conditional与6非法/unknown路径404/no-store。
- 4guides ×2themes ×1280/390，整页axe WCAG2A/2AA/2.1AA零违规、无禁用规则、无document overflow，
  全部main内部链接200、真实guide卡片顺序和llms包含4入口，4路由真实禁JS可读。
- 初次测试guide顺序把两份sidebar也计入24链接，修定位到guide grid后通过；不是删重复产品导航。
  header断言按cache directives集合比较，避免依赖Next可重排的文本顺序。

16主题/尺寸PNG位于`.cache/distribution-guides-proof/<slug>-<theme>-<width>.png`，总览review-all.jpg已
查看；Changelog四格另逐张查看。长MDX与代码横向滚动保持正常，未声称做全58页的新视觉/动画审计。
最后文案只修实际support id；最终7/7对修正后的完整生产构建重复通过并重存全部截图。

`docs/evidence/registry-distribution-http.json`持久保存132资源实际headers、snapshot报告与刷新证明。
最终旧snapshot Button ETag：`9b5311ac68584f37acfd2f57760c069fa4417a72a17357506839bcc8ad182d80`；
latest9880c18：`6b3f62d910dd41ad63abbd7a51096afbf027a47d22c8540248455cea8a6cd24a`。
用旧ETag读latest返回200；用新ETag读latest304；旧snapshot仍304，sha18b10ad不变。
证明handler真的覆盖public与alias刷新，不是从源码猜HTTP。

最终 `.cache/distribution-9880c18-budget.json` **exit1，唯一预算断言失败**。
`docs/evidence/registry-distribution-js.json`保留23files/requests/initiators/roots/BUILD_ID：
**291423gzip bytes /23 scripts /delta0**，limit120000仍OPEN，原历史baseline290171保留。
freshEdge/CDP禁cache，load+networkidle+10s+networkidle，无交互、所有自动脚本按URL实体gzip。
所有23脚本200，pageerrors=[]；served/rootmanifest SHA/gzip校验先通过。23脚本SHA集合与catalog-sidebar
实测集合完全相同（testedScriptHashDifferences=[]）。不删SSR/功能/chunks，不改窗口、预算或口径。

各次Next隔离build仅自动格式与typesinclude差异已检查、保存.cache/*tsconfig.diff并restore。
未碰用户.next/3000；本轮3147生产服务已按确切PID/commandline停止；无外部部署。
source/content/meta先registry:build再check；final public独立commit，无handoff build。
UTF8/LF作者文件，Biome只改动文件，冻结bytes例外如上；最终git diff --check干净。

## 下一唯一逻辑组 / 完整 open

先读本handoff、HTTP/JS evidence、catalog-sidebar/preview-variants/component-page-flow与研究交接、
AGENTS、parity-plan §8、animation-system/overall-design/site-distribution/ADR及适用skill。
**下一组只做T0 responsiveness/performance tier-specific模板与强制检查**。先实查20 T0 docs现状与
模板/scaffold/check机制，制定真实可检验要求；不要把本轮guides补齐泛化成全站性能闭合。
Intensity定义已在13afdd8/0289d42闭合，不重做。

仍全部保留：

1. initialJS120000预算OPEN。actual install-control layout/generic animate/fold依赖研究与完整shell+route
   hydration prototype gate继续；SSR/search/navigation/package-manager/source/installcopy/preview/modes/
   focus/a11y与全部自动JS≤120000必须同时通过。ADR009不变、ADR016只研究，不抬budget/排chunks/
   删功能/SSR或延后观察窗凑数；先前ordinary120492/install136462失败子集不是产品采纳。
2. 全库callback/render/ref/nativeevents：Base实际类型、callback求值/callerlast、render element/function、
   React19 cleanup/nativeevents。native useRender.ComponentProps仅string/object。B1–B5局部证据与静态
   parity不代替全库兼容，不能伪造callback surface。
3. 全库CSSpopup nestedclock、none首帧/livecancel、full→reduced去geometry保留opacity；Navigation/
   Sheet/Dropdown/Popover/B5局部证据不豁免其他part。
4. Motion same-target正在跑的动画不因transition prop更新自动cancel；继续livecancel/nestedfull/none
   首帧审计。ControlSpan/helper adoption不是全库proof；不强制remount或丢focus规避。
5. B5Combobox inert outsidepointer dismiss/activation、Tab/ShiftTab、nestedownership/cleanup真实兼容仍OPEN。
   axe0不替代native兼容。保留全部原B1–B9、contractdrift、parityprops历史gates。
6. AI25unscheduled、directiondeferred、form/native-select/sonnerexcluded不扩。Attachment/Bubble无新增包
   不等于全部AI prerequisites完成。MCP/Skill/release automation/外部hosting未实现或未授权，不虚构。
7. 37轴/118选项/21不适用URLmatrix、58页noJS、component source/TOC/prevnext/Edit/installcopy/mobiletables、
   highlight cold lifecycle、catalog筛选/sidebar连续性保持既有closure；不冒充本轮重跑全库native/motion审计。

继续relative imports/sharedlib/namespaced deps/P11UIonly/tokens/reduced-none/Base render/callerlast/
refcleanup。shadcn只读，禁repo init/add/apply/create/preset/components.json；pin不移，门禁不弱化。
每组source原子commit、final-source payload独立、handoff独立；不为handoff build。
本会话到此停止，不创建后继、不push、不宣称整体goalcomplete；由协调核实idle/gitclean后继续。
