# 串行 parity 交接：适用 URL 形态闭合，index/sidebar 下一组

工作目录 `D:/Code/Project/cadence-ui`，2026-11-02（Asia/Shanghai）。接替
`component-page-flow.md`。先读本文件、`docs/evidence/preview-variants.md`、完整
`preview-variants-matrix.json` 和 `preview-variants-js.json`，再读前序 component-page-flow、
runtime/budget/fence 三份研究交接、`docs/site-js-budget.md`、AGENTS、parity-plan §8、
站点设计 §2.2 与适用设计/skills。所有历史研究与 gates 保留。

本轮唯一实施会话，未创建会话/子代理/并行实施，未 push，未请求重复确认。
**本轮只闭合适用 preview URL variant 承诺；整体 goal 与 initial JS 预算仍 OPEN。**
完成独立 handoff 提交后停止；协调确认本会话 completed/idle、git clean 后再启动下一唯一会话。
本会话不创建后继，不自行推进 index/sidebar。

## 提交和边界

起点 **94064b2**，git clean；前序 **a9fd620 /7008da2 /94064b2** 保留。

- 实现 **f2f9bbb** `feat(site): complete applicable preview URL shapes and no-JS rendering`：
  站点预览、共享 URL hook、局部 SSR 修复、完整 matrix、测试与 design/plan/evidence 同提交。
- 最终源码 payload **556809e** `chore(registry): rebuild payloads from f2f9bbb`：
  60 个 JSON 递归剔除 sourceSha 比较后 **nonShaDifferences=[]**，新 sourceSha 全为 f2f9bbb。
  没有 registry 源码、content、组件 API、recipe、metadata 或依赖改动。
- 本文件与最终 budget JSON 独立 handoff 提交，不为它们再次 registry build。

固定 pin **96da9cc7f1aa10580a3741664e2a77c721206c00** 不移，Base UI 实装1.9.0。
58 components /65 registry items /58 docs /38 animated suites /20 T0 suites 保持。
ADR-009 仍 Next App Router，ADR-016 仍 investigation；没有框架或 scoped Motion 方案采纳。

## 真实适用矩阵与实现

`docs/evidence/preview-variants-matrix.json` 按 registry 顺序列全58页：**37适用 /118真实选项 /
21不适用**。每适用行有实际 owning part/prop、完整选项和 preview/API 路径；不适用行有具体原因。
不是 grep 子 Button 的 variant，也没有给没有 named 形态的 T0 添加装饰 selector。

主轴优先视觉 variant，其次真实 named size/orientation/placement；其他维度保留原有控件和 specimens。
EmptyMedia、InputGroupAddon、TabsList、menu item、SelectTrigger、AlertDialogContent 属于自身 parts。
Calendar 确实公开 buttonVariant，与把任意嵌套 Button 记给父组件不同。
Chart 使用已有四种真实 Recharts child composition，Toast 使用源内明确渲染的五种 icon type。
任意数值 geometry、选择值、open/invalid/disabled 状态和 motion 模式不改名为 variant。
21 个排除项的原有行为和示例保留；具体理由可逐行复核，不能按代表页外推58页 hydration 已全审。

所有适用页由站点内部 `use-preview-variant.tsx` 处理 URL 约定，逐页把结果传给真正的 typed prop。
没有给 registry 加通用 variant、没有按 variant 改 key、没有统一重写组件 API 或 DOM mutation filter。
原 authored component tag 数量逐文件比较一致。默认/显式 all 还原原展示与本地设置。
Button 继续隐藏原六视觉 specimens（原尺寸/状态行仍在），ScrollArea 隐藏原方向 specimens；节点保留。
其他页在原 specimens 上改实际 prop。Chart 仅改变其原有内部 graph composition，ChartContainer 与数据状态保留。
Toast 形态作用于新请求的 notification，已有 toast 的生命周期不被重置。
Sidebar 的 visual variant 是桌面形态；手机继续原 mobile Sheet 展示和原 lifetime 契约。

冷入URL、client select、history/back-forward 均支持；保留其他 query、hash 与现有 history.state。
all 只移除 variant；unknown 不改写原 URL，回退 all 并由 status region 宣布原因。
同维度旧控件清除 override 后照旧更新本地值，显示其实际 effective value；其他控件独立。
history 隐藏当前 focus specimen 时，把焦点移到 selector；其余变化不抢焦点。

真实 no-JS 验收发现旧局部 Suspense 把完成的 preview 留在隐藏流式 segment，无JS只见Skeleton。
`PreviewFrame` 去掉这层局部 fallback，让 route 等待 lazy preview；per-page dynamic imports、测量边界、
原 specimen entrance 样式保留，导航等待 ready route。现在原 all specimens 真正在58页无JS浏览器可见。
无JS Field可输入，native source disclosure可展开；shape 选择是 hydration 行为。
这是本地 SSR 边界修复，没有采用先前失败的 server catalogue/Pages/framework fork。

## 最终验收与限制

- 实现前 registry build + 完整 check：`.cache/preview-variants-precommit-{registry,check}.log`，
  **560/560、77/77 files、72.74s、exit0**。
- f2f9bbb 后顺序 registry build/check：`.cache/preview-variants-source-{registry,check}.log`，
  **560/560、77/77 files、72.37s、exit0**。type/lint/registry freshness/P11/tier budgets/parity58通过；
  38-suite runtime helper /58-doc recipe门禁未弱化。旧Item img、Base act/nativeButton警告未扩修。
- 最终功能浏览器：`.cache/preview-variants-cold-final-e2e.log`，Edge/msedge、workers2、port3143，
  **59/59 (2.8m)**。37页的全部118选项均通过 client 切换和每选项 direct URL entry 的真实 part/
  data prop/style/graph/icon/placement 断言。URL/hash/history state、all、fallback、node identity也覆盖。
- 58路由 matrix/SSR 检查真实 selector/option归属，随后真实禁JS浏览器访问全部58页，检查 visible
  specimens 和 applicable controls；不是仅检查HTML里有字符串，也不宣称禁JS可操作需要JS的popup。
- 六 mode×OS case：输入真实 Resizable Draft，以键盘End/Enter改orientation，证明同一input节点、
  草稿与history后的focus；Bubble保留原按下reaction节点/state，旧Variant控件仍可生效。
  Button/ScrollArea额外history隐藏focus边界测试通过。
- 保留 component-page.spec + package-manager.spec：58页真实source/TOC/orderedlinks/Edit，
  六Button press mode×OS、原source/copy、install失败/重试/偏好、mobiletables/键盘导航均通过。
- `.cache/preview-variants-code-block.log`：旧 motion-matrix --grep code-block **13/13 (13.6s)**，
  tabs/fold六mode×OS与travel pill layering。合计 **72个distinct相关case**，中间重跑不加总。
- Field/Sidebar/Tabs/Attachment ×light/dark ×1280/390：16张全页截图和全页WCAG2A/2AA/2.1AA
  axe **zero**，未禁规则，无document overflow。`.cache/preview-variants-proof/` 的16PNG逐张review，
  八个review sheets含每张top detail+fullpage；Field横向窄输入列仍可读，Tabs真line，Sidebar手机
  trigger/draft正常，Attachment长名在原横滚组内截断。它们不是58页新增双主题视觉审计。
- 初始47/58来自测试slot/class/header定位和pre-hydration填值假设，按真实API/就绪修正；no-JS是
  真缺陷，修在源码。旧12流程均通过。中间58/58、focus1/1与最终59/59重叠，不算更多distinct。
- 生产 `.next-preview-variants-final`：`.cache/preview-variants-final-build.log`，**69pages**。
  final预算捕获的22个脚本body SHA与功能测试生产版逐一集合相同；final产物没有换不同UI代码。
  final BUILD_ID **i92R8tnrktwOICcrrLqCE**。单位check/build/浏览器按阶段顺序执行，不碰用户.next/3000。
- MAX_FORKS2/MIN1；production RAYON2/NODE_OPTIONS768MB，ports3143/3144先查空闲。
  Next tsconfig差异仅格式与本轮隔离types include，diff在.cache，已restore；无配置遗留。
  UTF8/LF，Biome只保留本轮文件差异，git diff --check通过；所有原tests/commits保持。

没有 registry motion implementation 修改、新recipe/token、时钟literal或layout tween。
现有providers/reduced/none树分支保留；此站点shape证明不代替全库callback、首帧和running cancel审计。

## initial JS 仍红

final-source fresh Edge/CDP禁cache、无交互、load+networkidle+10s+networkidle、全部自动script逐URL去重/
逐实体gzip：**290899 bytes /22 scripts**；上一产品290675，**+224**，原历史baseline290171不改写。
**120000 budget OPEN**。gate exit1只有budget断言失败；manifest/root SHA/所有script200/pageerrors=[]先通过。
完整JSON reporter `.cache/preview-variants-final-budget.json`，完整requests/initiators
`.cache/preview-variants-final-requests.json`，提交版 `docs/evidence/preview-variants-js.json` 保留22实体
URL/raw/gzip/SHA/status/initiators与roots。未排chunks、延后观察窗、移除功能、改配额或改统计口径。

前序 scoped ordinary fence120492、真实install136462只是无完整chrome的失败子集，未采纳。
后续保留 actual install-control layout feature边界、generic animate/fold依赖研究，以及完整shell+route
hydration prototype gate。只有header/sidebar/package-manager/source/installcopy/navigation/search/SSR/
preview全部功能、真实mode/focus/a11y和所有自动JS≤120000一并通过才闭合。不能提高budget、
删除tabs/layout/SSR/首屏交互、忽略chunks、延后观察窗加载或把局部fixture当完整产品。

## 下一唯一会话与完整 open

1. **下一逻辑组只做 §8 index + site sidebar**：实查并完成index search/category/intensity/complexity
   filters；审查站点sidebar landmark、aria-controls/ID ownership、height animation的recipe/tier。
   sidebar已有部分controls/height实现，不能照旧文字重复实现或凭局部检查关闭；它不同于registry Sidebar。
2. immutable `/r` route/cache与missing accessibility/registry/ai/changelog guides仍OPEN；静态文件
   存在不等于履行缓存承诺。这组没有偷跑distribution或guides。
3. metadata intensity定义一致性；T0 responsiveness/performance模板强制仍OPEN。
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
10. 本轮URL形态按37/118/21真实matrix闭合；不把未改的21页变造selector，不把它泛化成全库视觉/
    motion/native审计。sourceview/TOC/prevnext/Edit/installcopy/mobiletables和highlight cold lifecycle保留。

继续relativeimports/sharedlib/namespaceddeps/P11UIonly/tokens/reduced-none/Base render/callerlast/
refcleanup；shadcn只读，禁init/add/apply/create/preset/components.json，不移pin、不弱化门禁。
source/content/meta变化先registry:build再check；source原子commit、final-source public独立commit、
完整handoff独立，不为handoffbuild。协调核实idle与gitclean后继续，本会话在此停止，不标整体complete。
