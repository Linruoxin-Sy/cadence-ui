# 串行 parity 交接：index/sidebar 闭合，distribution/guides 下一组

D:/Code/Project/cadence-ui，2026-11-02 Asia/Shanghai。接替 `preview-variants.md`。
先读本文件、`docs/evidence/catalog-sidebar.md` / `catalog-sidebar-js.json`，保留前序 URL matrix/
JS evidence 与 component-page-flow、runtime/budget/fence 研究交接、`docs/site-js-budget.md`，再读
AGENTS、parity-plan §8、站点设计、overall-design/animation-system/ADR 与适用 skills。
本轮唯一实施，无新会话/子代理/并行实施，无 push，无重复确认。整体 goal 未完成。
交接提交后停止，协调核实 completed/idle 和 git clean 才开下一唯一会话；不自行创建后继。

## 提交/authority

起点 **56f5dd0** git clean；f2f9bbb /556809e 与全部旧提交保留。

- **13afdd8** `docs(metadata): define and enforce authored motion intensity`：定义独立原子提交。
- **0289d42** `feat(site): complete catalogue filters and persistent accessible navigation`：index/sidebar、
  DataTable 缺失分类、membership gate、design/plan/evidence/tests；没有 registry source/API/motion改动。
- final-source payload 与本交接各自独立提交；准确 SHA 见末尾及 git log。交接不再触发build。

固定 upstream pin **96da9cc7f1aa10580a3741664e2a77c721206c00** 不移，Base UI 实装1.9.0。
58 components /65 items /58 docs /38 animated suites /20 T0 suites 保持。
ADR009仍Next App Router；ADR016只研究，未采纳scopedMotion或framework fork。

## 实际缺口、定义与实现

旧index没有搜索/筛选；categories有secondary memberships，DataTable唯一没有registry分类，已有
MDX明确 collection，现同步registry并强制frontmatter category属于categories，未凭空制造taxonomy。
现有真实10类全使用，顺序58项不变，没有按子Buttonvariant推父类。

旧28/29subtle记录过时；实际 **34 subtle /23 medium /1 expressive**。第一手工31/26统计不准确，
0289d42已纠正文档；没有改评级。animation-system §2.1明确维度：最强authored感知范围，独立于
runtime mode/tier/complexity。subtle=static/local press/glyph/fade/loading，medium=surface/position/
size/collection/chart geometry，expressive=跨surface coordinated handoff（现Select）。
Chart/Carousel data.transition实际运动几何；Calendar/Bubble/loader为局部反馈，不按recipe名盲分。
`catalog-intensity.mjs`实入口强制语义，旧metadata/frontmatter一致检查保持；2单测含真实inventory/
错误评级/recipeforms。**Intensity定义子项闭合，T0 performance模板未闭合。**

Catalogue仅序列化summary而非MDXbody。原生search/select、Enter/Search提交、3维AND、搜索词AND、
count/status/empty/Clear；保留registry order与所有节点。q/category/intensity/complexity URL支持冷入/
historybackforward，保留其他query/hash/history.state。unknown enum回All并announce、不抢改URL。
history隐藏focused result时回search焦点。SSR/noJS默认58完整链接，disabled enhancement controls +
noJS解释，真实禁JS可走mobile Browse/link。没有假筛选、丢条目或registry API改动。

Site sidebar不同于registry Sidebar。旧已有controls/useId，但Motion reveal驱动height:auto、无clamp、
关闭退出期可Tab/unmount、超出预算入口literal为真实缺陷。现顶层named Documentation nav，两个
responsive实例unique useId受控region，closed立即inert/aria-hidden，panel/子状态保留且不remount。
保留原batch分组/顺序/guide/currentpage/desktopsticky/mobile Browse/跨route continuity。

设计先明确T3 site composition采用已存在CSS geometry.resize形式：layout effect/ResizeObserver测
natural inner flow，只写shell、非负target/closed0、duration.slow/ease.out，默认SSR自然展开。
full实际中间height/原地reversal；reduced/none移除heighttransition即时几何；opacity reveal reduced
保留、none none。state.morph icon CSS token形式，reduced/none静态方向；row reveal保留observer入口，
distance.md/scale.in/bounded blur/tokenclock。去除easing.ts夸大literal，首屏visible/离屏初始化无fadeout。
原生transitionpropertylist支持same-target live cancel，不依赖Motion仅改transitionprop的错误假设。
没有新的public recipe/clock、setTimeout动画、layout读render或强制remount。

## 验证与纠正

- `catalog-sidebar-check-fixed.log`：registrybuild后完整check **566/566，79/79 files，74.24s**。
  type/lint/registry/P11/budgets/parity58、38helper/58docsrecipe保持。最初fork变量前缀错导致未限并发，
  旧mutationentry单case5s超时；改用实际VITEST_MAX_FORKS2/MIN1重跑，不改配置/timeout/门禁。
- `.cache/catalog-sidebar-final-e2e.log` **71/72 (3.1m)**：唯一失败是旧三rAF脚本点击反转probe早于React
  commit，修成真实pointer点击+等待实际中间height/reversal。`.cache/catalog-sidebar-proof-final.log`
  **25/25 (30s)**：12本组case+13原CodeBlock，含full→reduced即时geometry/opacity保留、full→none取消。
  合计**85 distinct**，重复11不加总。完整source/58TOC/orderedlinks/Edit/installfailure-retry/preference/
  mobiletables/oldsidebarcontinuity/全部37轴118选项+58页真实noJS均保持通过（不是全库新motion审计）。
- 3 mode×2OS六格，含index查询、keyboardEnter/Tab、uniqueownership、persistent
  region、嵌套开闭state、resize；full格浏览器见中间height和反转，取消到reduced/none不换node。
- index+Button/sidebar ×light/dark ×1280/390全页axe WCAG2A/2AA/2.1AA zero，无disabledrules，无document
  overflow。mobile用真实键盘Browse、select/Clear并scroll所有入口后稳定扫描。8矩阵+4mobileclosed PNG
  共**12张**逐张detail/fullpage review，`.cache/catalog-sidebar-proof/review-*.jpg`。
  窄屏filter单列可读，完整58目录长页面正常，nav无缺段；两theme hover/current/focus可辨。
- 初次测试误用getByLabel exact（label文本含options）、Browse精确文本包含三角、button搜索误设2实际4，
  均修测试定位/期望；DataTable缺category是真数据缺陷，修source。mobile早期axe抓row入口帧，修离屏
  初始化不淡出，扫描等待稳定而未禁规则。原所有tests保留。
- 生产 `.next-catalog-sidebar`，RAYON2/NODE_OPTIONS768MB，port3145先核实空闲，workers2；不碰.next/3000。
  Next自动tsconfig仅格式+隔离types include，各diff保存在.cache并restore；UTF8/LF，Biome仅改动文件。

## initial JS 仍 OPEN 与下一组

最终source check/build/budget、payloadSHA与脚本集合复核写在末尾。预算仍120000，原历史290171/
前产品290899记录保留；不改变计量口径、chunks、自动加载观察窗或功能。

下一唯一逻辑组：**immutable /r route/cache 与缺失accessibility/registry/ai/changelog guides**，先查
设计/实际route，静态文件存在不等于缓存承诺。不要顺手做全库audit或T0模板；按依赖后续安排。
保留全部open（下列编号承接前handoff）：

2. immutable `/r` route/cache与missing accessibility/registry/ai/changelog guides仍OPEN；静态文件
   存在不等于履行缓存承诺。这组没有偷跑distribution或guides。
3. metadata intensity定义已闭合（本轮13afdd8/0289d42）；T0 responsiveness/performance模板强制仍OPEN。
4. initialJS仍OPEN，研究与完整route gate如上；docsrecipe/helper/highlight reliability保持closed。
5. 全库callback/render/ref/nativeevents：真实Base类型、callback求值/callerlast、render element/function、
   React19 cleanup/nativeevents。native useRender.ComponentProps仅string/object；B1–B5局部证据与
   静态parity不代替全库兼容，不伪造callback surface。
6. 全库CSSpopup nestedclock、none首帧/livecancel、full→reduced去geometry保留opacity；Navigation/
   Sheet/Dropdown/Popover/B5局部实证不是其他part豁免。
7. Motion same-target running动画不因transition prop更新自动取消；ControlSpan/helper adoption不是
   全库proof。继续livecancel/nestedfull/none首帧审计，不强制remount/丢focus规避。
8. B5Combobox inert outsidepointer dismiss/activation、Tab/ShiftTab、nestedownership/cleanup真实兼容
   仍OPEN；axe0不替代native兼容。B1–B9、contractdrift/parityprops历史gates保持closed。
9. AI25unscheduled、directiondeferred、form/native-select/sonnerexcluded不扩；Attachment/Bubble
   无新增包不等于全AI prerequisites完成。
10. 前轮URL形态按37/118/21真实matrix闭合；不把未改的21页变造selector，不把它泛化成全库视觉/
    motion/native审计。sourceview/TOC/prevnext/Edit/installcopy/mobiletables和highlight cold lifecycle保留。


继续relativeimports/sharedlib/namespaceddeps/P11UIonly/tokens/reduced-none/Base render/callerlast/refcleanup；
shadcn只读，禁init/add/apply/create/preset/components.json。不移pin，不弱化任何门禁；source/content/meta
先registrybuild后check，source原子/public独立/handoff独立，不为handoffbuild。不标整体goalcomplete。

## 最终 source / payload / browser / budget

- source **0289d42** 后顺序 `registry:build` / `pnpm check`：
  `.cache/catalog-sidebar-source-{registry,check}.log`，**566/566 /79/79 files /73.46s /exit0**。
- public独立commit **84619f2**。新sourceSha均0289d42；剔除sourceSha递归比较，nonShaDifferences仅
  **catalog.json /data-table.json /registry.json**（DataTable collection分类）；62tracked public文件
  改动包含元数据SHA与llms分类展示。registry源码一字未动，所有旧API/recipe/default保持。
- 最终生产 `.next-catalog-sidebar-final`，`.cache/catalog-sidebar-source-build.log` **69pages**，
  BUILD_ID **ZrWDfzGxAYjuq51-kr9dj**。最终`.cache/catalog-sidebar-source-e2e.log` **13/13 (23.5s)**，
  全本组12case+原sidebarcontinuity，current full→reduced/none/reversal、historyfocus、mobile/noJS与
  全页axe/overflow再通过。重复测试不计额外distinct。最终23loaded JS body SHA全部存在于此前
  `.next-catalog-sidebar`实际功能测试的生产脚本集合（`.cache/catalog-sidebar-tested-scripts.json`），
  `testedScriptHashDifferences=[]`。这不是只凭source相同推测bundle相同。
- 最终预算gate `.cache/catalog-sidebar-source-budget.{json,log}` **exit1，仅120000断言失败**；
  freshEdge/CDP禁cache，无交互，load+networkidle+10s+networkidle，所有自动脚本按URL实体gzip：
  **291423 bytes /23 scripts**，前产品290899 **+524bytes**，原历史baseline290171保留。
  新catalogue chunk `2ezjynak2t3vm.js`（1845gzip）确实自动请求并计入；整体差值还含sidebar/reveal
  改动，不能把1845当净增量。没有过滤prefetch或asyncscript，未改观察窗/配额/功能。
  所有23响应200，pageerrors=[]，rootmanifest本地/served SHA/gzip一致先通过。完整requests/
  initiators为`.cache/catalog-sidebar-source-requests.json`；提交版`docs/evidence/catalog-sidebar-js.json`
  保留全部files/requests/roots/BUILD_ID。**Budget仍OPEN，不以功能绿替代。**
- 完整shell+route prototype门禁保持：SSR/search/navigation/package-manager/source/installcopy/
  preview/modes/focus/a11y与所有自动JS≤120000同时通过才可采纳。保留actual install-control layout/
  generic animate/fold依赖研究；不能把scopedordinaryfence120492或install136462失败子集当产品采纳。
- Next各隔离build的tsconfigdiff已核实仅格式/typesinclude并restore，无配置遗留；没有用户.next/3000
  写入。UTF8/LF，Biome改动文件，gitdiffcheck通过。最终handoff与JS JSON独立commit，不为handoffbuild。

本会话到此停止，不开新线程、不push、不宣称整体goalcomplete；协调核实gitclean/completed-idle后继续。
