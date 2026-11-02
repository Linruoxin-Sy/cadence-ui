# 串行 parity 交接：CSS运行索引与修复增量

2026-11-02 Asia/Shanghai，D:/Code/Project/cadence-ui，起点clean be6ebfb。
本轮唯一实施者；没有子代理、并行实施、后继、push、发布、部署或freeze。
**未完成委派要求的整个CSS闭合组。** 已完成有真实反例的修复、实际part索引和有限
生产矩阵；剩余CSS条件明确OPEN。不要把本交接视作CSS全闭或整体/goal完成。
停在已提交的可复核边界，由协调核实completed/idle+clean后决定下一唯一实施会话。

## Authority与提交

1. **7548345** runtime/source/docs/tests：PreviewStack reduced与冷OS首帧修复，
   Accordion/Collapsible本地CSS时钟，Provider/指南的loop时钟澄清；同期§8进度。
   新增2unit与37生产CSS测试，两个旧suite通知定位修正。
2. **74897f0** review/index/evidence：58items实际engine/slot/writer/sourceSHA256索引，
   每part适用旧证据和缺口、原始反例/样本/最终预算，不是新API pending ledger。
3. **300b701** final payload独立提交：61生成文件，174sourceSha均7548345。
   review-only不机械刷新runtime provenance，132current保持。
4. 本handoff独立提交，SHA见git log；不为handoff build。

固定pin96da9cc7f1aa10580a3741664e2a77c721206c00；实装Base1.9.0/Motion13.5.1/
React19.3.1等版本及真实声明路径复用unchanged compatibility-inventory。
无dependency/lock/API/default/export/data-slot/registry-id/recipe/parity例外变化。
shadcn技能只读，无consumerCLI。冻结snapshot、registry-snapshots.json、.gitattributes
逐diff无变化，未freeze；beforeFiles/ETag/immutable规则不变。

## 实际索引与修复证据

docs/evidence/runtime-parts.json含58items/38非空motion、6site surfaces、8shared源。
每项真实recipe、slot/writer行号与source hash、unslotted/engine目标、委托路径均在。
透明组合不重复N/A；Motion加速WAAPI仍属Motion，Calendar是nativeWAAPI，Embla与
Recharts是独立engine，没有实际GSAP writer。静态定位/语义geometry和colour/border/
shadow反馈不算autonomous motion。独立hash核对全部匹配。再生成命令见css-runtime.md。
每part适用旧B4/B5/nav/sidebar/组合/continuous证据与局限也在该文档表中。

- PreviewStack旧source在reduced的三个适用cell仍translate4px：真实CSS插入负例3fail，
  full/none原本通过。修复显式cm分支/data-motion/localclock，不改完整full入口效果。
  clone probe仅复制实际CSS surface、同parent，不带子engine，不冒称React/SSR。
- 随后独立coldOSreduce探针捕获148样本，含4px->3.5142px->1.14084px与后续travel。
  补系统媒体utilities覆盖hydration前窗口，同时保留React显式分支。最终cold probe过。
- Accordion/Collapsible在4x仍320ms而非1280ms，两个真实生产反例失败。实际Panel用
  popupStyle本地clock，caller state style最后；measurement/height/render/ref/Base生命周期
  不变。2unit证明outer none/4x->innerfull、显式inner2x、reduced/none、同panel/state样式。
- 四loop实际theme clock：Skeleton/Progress indeterminate/AttachmentTitle pulse2s，
  Spinner spin1s，Provider4x不影响。实际part改theme400ms采CSSAnimation timing/keyframes/
  state/currentTime/属性变化，reduced保留、none取消。只澄清合同，无逐元素duration硬编。
  Spinner reduced单glyph rotation例外保持。

原负例.cache/css-runtime-negative.json（3真sourcefail+Progress selector错误）、
css-disclosure-negative.json（2真sourcefail）、css-runtime-followup.json（coldOS真fail）。
Progress原selector绑定animate-pulse在none消失，改Preparing preview语义；Menubar原
选File无submenu，改Edit；Attachment明确本地full，测试改操作本地selector。两个旧
suite的status同时匹配URLvariant status与原notice，改定位原通知，文本断言未变。
未放宽threshold/timeout/axe/helper/observer/reporter。

## 最终验证与预算

runtime7548345提交后严格串行：registrybuild65payload/58docs -> pnpm check
**677/677tests、87/87files，88.38s** -> isolated Next production build全部通过。
type/lint/registry/parity58/P11/tier预算/38实际helper reporter保持。
.cache/css-runtime-authority-{registry,check,build}.log；VitestMAX/MINforks2/1；
RAYON_NUM_THREADS2、NODE_OPTIONS=--max-old-space-size=768、
CADENCE_DIST_DIR=.next-css-runtime。Next tsconfig-only diff保存/核实/仅restore本轮。

Edge/msedge3162/workers2：广泛193cases=181pass+12旧通知定位fail，修正后12/12pass。
冷OS负例修复后，最终37/37CSS生产case提交前及提交后重建均通过，包含NavigationMenu
Content自身六cell crossfade。合并是**200unique passing behavior cases**，不是把重跑
累加。完整report .cache/css-runtime-{matrix,followup,final-browser,authority-browser}.json。
authority-browser是37pass+1预算fail，不是38pass。无新全库视觉/axe认证，精确复用旧证据。

docs/evidence/css-runtime-browser.json含逐case结果和未修改raw值。为避免反复存相同
keyframes，committed数组选原first8/every16th/last并写原长度/规则；完整原数组在上述
.cache。未抬Biome1MiB上限。独立索引hash核对全匹配，review-only lint过，仅既有Item
img警告；git diff --check过。自有Playwright3162自动退出，实查无listener，未用.next/3000。

**最终strict initialJS292454gzipbytes/23scripts >120000 FAIL**，
docs/evidence/css-runtime-js.json。freshEdge/cacheoff/nointeraction/networkidle+10s+
networkidle，all200/no pageerrors，BUILD_ID/root manifest/逐bodySHA256/gzip6核对。
较旧292267增加187bytes，旧292314/292327/292344等保留。Button仍仅共同baseline。

## 下一步先补剩余CSS，再进入Motion/engine

CSS仍OPEN，不可跳过这些条件直接宣称全闭：

1. Site Reveal和两个Chevron位置的真实running raw；旧catalog-sidebar证明Panel高度/
   inert/IDs/node/focus/keyboard/reversal/resize，不能代表Reveal/Chevron。PreviewStack
   实际同target live full->reduced->none与node identity；现probe是CSS插入和coldOS。
   冷URL?motion=none在hydration前未知的既有文档边界保持。
2. NavigationMenu Content六cell是switch crossfade，还补自身live downgrade/exit
   生命周期，不能拿shared Popup样本代替。
3. 代表性实际keepMounted/reopen/firstframe、nested full inside none（OSreduce优先）、
   inherited/explicitclock browser与running nativeclock animation identity/timing。
   unit localclock不代替runtime；computed新duration不证明旧transition重定时。
   按真实schema检查，不给CSS新增无依据的第二controller/实时重启承诺。
4. Progress indeterminate完整初始mode/OS实际part样本；不拿determinate Motion/root
   冒充loop。其余loop适用六cell/主题证据详见evidence表。

后继Motion/engine必须保留：

- c53c55a ControlAnimation由isomorphic layout effect改passive effect、OTP也passive。
  离散事件/实际React19.0 probes已过，但外部异步controlled mode/value/clock提交后的
  第一绘制帧仍未证：none是否多帧旧动画、OTP是否先终态再淡入。按真实证据决定
  prepaint stop/set/排队重申，不凭useEffect猜结论；保留sameDOM/focus/ref/Base生命周期。
- components/site/document-entrance.tsx必须纳入：站点设计§2.4有article rise/opacity/
  4pxblur/clipPath例外、SSRhidden+noscript/printrestore。同target y0/opacity1只更新
  transition可能不取消旧动画，必须实测，不预认安全/已失败。不为budget删除入口/
  SSR/noJS/print/readability/主DOM。Site sidebar/reveal也保留scope。
- 索引全部Motion声明/controls/layout/imperative、Calendar nativeWAAPI、Embla、Recharts
  实际targets：same-target mode/clock livecancel、nestedfull、nonefirstframe、heldpress
  期间disabled视觉取消。helper调用/单测activation/只改transitionprops不证明停止。

性能与最终goal审计仍OPEN：

- 每完整shell页initialJS<=120KB；特别Chart/Calendar/CodeBlock及所有适用site页。
  不排chunks/延观察窗/转inline或data逃量/减SSR功能。保留header/sidebar/search/
  navigation/package-manager/source/installcopy/realpreview/modes/focus/a11y。
  ADR009仍NextAppRouter，ADR016只研究，旧directSSR120492/136462失败未采纳，
  React19.0小fixture114KB不是产品预算。
- §7 Motionruntime(initial)<=48KB gzip、compiled percomponentaddedJS<=8KB（shared
  runtimeexcluded）、>=55fps midrange mobile、CLS<0.02仍是证据缺口，不叫已测失败。
  先定义compiled归因，区别raw tier-source4–14KB及既有exceptions，不放宽任一限额。
  披露真实硬件/CPUthrottle，不假称物理手机。
- 本轮检索registry/site/app无authored stagger/delay writer，tokens/recipe定义与Item
  注释不是writer。nativeCSS stagger场景0/同时stagger元素0/总stagger0ms，满足20/400ms。
  不把stagger上限误套所有独立loop/reveal；显式slowclock不会产生新authored stagger。
- 最终整个goal逐要求审计未做，不能带red/未验matrix标complete。

有限API58/466=342compatibility+124static、0open，inventory/ledger未改；旧B1–B9gates、
38helper/reporter、recipes/highlight、URL37axes118options21N/A、58页noJS、siteflow/
catalog/sidebar/intensity/distribution/guides/T0templates保持。Combobox outside mouse/
touch/Tab/ShiftTab/reopen/unmount/parent/sibling/ownership有限矩阵仍闭，不回退guard。
AI25unscheduled/directiondeferred/form-native-select-sonnerexcluded不扩；MCP/分发Skill/
release/hosting未实施或授权不虚构。无后继/子代理/并行实施/推送发布。

下一唯一实施者从CSS缺口继续，不重造API审查。编辑->registrybuild->check严格串行，
新缺陷先真实反例，新recipe先scheme；最终runtime提交后build/check，payload/handoff
独立；pureevidence不机械刷新runtime sourceSha。
