# 串行 parity 交接：Progress / CodeBlock 原生事件与 ref

D:/Code/Project/cadence-ui，2026-11-02 Asia/Shanghai。接替 compatibility-toggle.md。
本轮唯一实施，无子代理/后继会话/push/发布/部署/freeze。此实质逻辑组结束后停止，
由协调核实 completed/idle + git clean，再开下一唯一实施会话；模型沿用用户指定
GPT-6.1 Sol High。不要标整体 goal complete。无需重新请求已有授权。

## Authority / 原子提交

起点1a2057d clean；旧source aa75b88 /public ae04295 /implementation5f02afa全部保留。

- 129365a：本轮最终source authority；native div adapter、Progress public路径、CodeBlock
  refs、风险测试、设计记录、逐出口手工ledger、inventory、真实浏览器/预算证据。
- 在此source提交后再次registry:build→pnpm check，再独立提交public，SHA见末尾。
- 完整handoff独立提交，不为handoff build；SHA见git log。

固定upstream96da9cc7f1aa10580a3741664e2a77c721206c00；Base1.9.0/Motion13.5.1/
React19.3.1，全部实际依赖和类型声明来源见compatibility-inventory.json。未改变pin、
lockfile、API/defaults/slots/recipes/threshold/timeout。shadcn技能只读；未执行consumer
init/add/apply/create/preset，未创建components.json。无用户.next/3000操作。

## 缺陷、修复与证据边界

先写真实context反例，.cache/native-div-before.log：15项中10fail/5pass。
ProgressIndicator默认ControlDiv、CodeBlockActions floating Motion div各丢失四个
onAnimationStart/onDrag/onDragStart/onDragEnd原生事件，并不处理替换ref的旧callback
cleanup；header Actions五项全过。类型cast不是修复。

先更新animation-system §4，再新增lib/native-div.tsx，仅上述两个公开路径使用。
motion.create包裹同一个native div；private事件bag避开Motion保留名，private ref通道
使用从press-button抽出的useNativeMotionRef执行layout commit和React19 cleanup。
Progress通过NativeControlDiv保持原imperative control；Actions保留原declarative opacity。
没有原生listener代理/伪造event/DOMwrapper/remount/focus替换。共享lib由cadence-provider
现有namespaced依赖发货；内部ControlSpan/Div未盲目迁移。三个press controls共享hook
后重新执行旧native风险测试。

逐出口发现CodeBlockTabs/Content把caller ref直接spread覆盖内部list/pre ref，实际导致
方向键导航失效、fold测量不发生。校正测试后两项真实失败在
.cache/native-div-context-before.log。修复保留内部ref，通过React.useImperativeHandle
给caller同一DOM，动态callback cleanup/object交接和unmount均有测试。

20项新增测试覆盖：四原生事件nativeEvent/currentTarget身份、capture/bubble取消、
callback→callback→object清理、同DOM/focus；Progress自定义render收到已求值status/
class/style/ref和drag，受控40→100更新；CodeBlock caller ref下导航/fold仍运作。
一项测试最初误用progressStatus，按实际Base类型修正为status；另有首次测试缺import，
均在认证前校正。jsdom测量显式lineHeight/paddingTop/scrollHeight，无伪造生产layout证明。

所有Progress10出口、CodeBlock24出口均实际source/type/context审查，逐行结论见
[证据](../evidence/compatibility-native-div.md)。手工ledger当前44classified/466，422
unreviewed：此前press10仍bounded；本组17DOM为reviewed-compatibility，17type为
reviewed-static。此处关闭有限compatibility义务，独立运行中motion审计仍OPEN。
没有公开provider/helper/context遗漏：两文件这些symbol均private；Panel的ref/style/events
按其ContentProps落到pre，class落wrapper；Native CodeBlock不承诺Base callbackclass/style。
Tab/Expand现有onClick策略是caller在状态请求之前执行，但没有defaultPrevented veto承诺；
Copy与Tabs keyboard可取消。任意caller render实现须自行spread实际props/ref，不无限扩张
库义务。见证据完整出口表，不能扩大为全58认证。

下一组公开indicator先按真实出口审查：Dropdown/ContextMenu/Select/Combobox的Base
ItemIndicator实例在exported Item内部，未作为独立part导出，item props也未自动落到
ControlSpan。不能因Motion import推断caller可达。Checkbox/Radio/Switch内部indicator、
Slider thumb、Tabs indicator、SelectValue private wrapper、InputOTP内span同理。

## 验证及失败处理

UTF8/LF，Biome仅格式化改动文件。初次全check因animation-system Windows行尾格式失败；
另一次因Next build自动改tsconfig与check相撞而格式失败，diff保存
.cache/native-div-next-tsconfig.diff，核实只有Next生成include/格式后restore原文件。
T5 code-block source gzip曾实测12.2KB超原12KB：共享ref hook及React原生imperative handle
减少重复代码后原gate通过；未抬预算/删功能/弱化测试。

实际命令与结果：

- `$env:VITEST_MAX_FORKS='2'; $env:VITEST_MIN_FORKS='1'`。
- `pnpm exec vitest run tests/components/native-div.test.tsx tests/components/progress.test.tsx tests/components/code-block.test.tsx`，中间48/48；新增ref生命周期后native suite20项。
- `pnpm exec vitest run tests/components/native-div.test.tsx tests/components/button-native.test.tsx tests/components/toggle-native.test.tsx`，52/52，.cache/native-div-final-targeted.log。
- `pnpm registry:build`→`pnpm check`，首次完整绿645tests/84files，.cache/native-div-check.log；source提交后final结果见末尾。
- 生产：RAYON_NUM_THREADS=2，NODE_OPTIONS=--max-old-space-size=768，CADENCE_DIST_DIR=.next-compat-motion；`pnpm build`成功，.cache/native-div-production-build.log。
- 实查空闲port3153，PLAYWRIGHT_CHANNEL=msedge，workers2；`node node_modules/@playwright/test/cli.js test tests/e2e/motion-matrix.spec.ts --grep 'progress|code-block' --workers=2`，19/19；首次pnpm包装命令在Windows误解析grep管道，direct node原样assertion重跑通过。
- `pnpm exec playwright test tests/e2e/b3.spec.ts --grep 'progress' --workers=2`，8/8；含六mode×OS frames及两整页light/dark axe/overflow。合计站点27/27，无全库认证。
- Progress本轮截图.cache/b3-proof/progress-{light,dark}-{1280,390}{,-preview}.png；light390、dark1280 preview各自目视检查，布局/控件可读；无DOM/classes改动，CodeBlock旧visual有据复用并fresh tabs/fold浏览器回归。
- Floating Actions不在生产站点preview的两个header实例中，补用实际组件的Vite7.3.7 production bundle，在Edge3154证明full/reduced/none focus reveal、12exactnative事件与取消、focused同DOM callback ref交接；fixture/runner/config/results完整保存compatibility-native-div-browser.json。fixture无站点CSS/shell，不冒充页面视觉/预算证明。Windows Python初次JS MIME text/plain使harness加载失败，修正本地HTTP MIME后原assertions通过；fixture server已停止。
- React测试仍有既有act提示；assertions及真实Motion observer/reporter保持，未跳测试。

## 首屏预算仍 OPEN / RED

真实Next production build之后执行同一`site-js-budget.spec.ts`，等价test:site-js的build+test：
PLAYWRIGHT_CHANNEL=msedge/port3153，`pnpm exec playwright test tests/e2e/site-js-budget.spec.ts --workers=2 --reporter=json`。
FAIL292344 gzip bytes/23scripts，limit120000，较前291749增595。完整attachment在
compatibility-native-div-js.json；BUILD_ID Pli6wIFrQuRPdWgoO2iwU，root manifest/body hashes
吻合，全部200/pageerrors空。fresh Edge/cacheoff/nointeraction/networkidle+10s+networkidle，
全部自动async/prefetch scripts逐body gzip6；原规则不变。不抬限/排chunk/延窗/删功能或SSR。
pnpmcheck绿色不覆盖此红。旧291749/291658/291423和baseline290171全部保留。

ADR009仍NextAppRouter，ADR016只是调查；directSSR普通fence120492/install136462仍失败，
未采纳迁移。后续完整SSRroute/shell必须保留全部header/sidebar/search/navigation/
package-manager/source/installcopy/realpreview/modes/focus/a11y且全部自动JS<=120000，
小fixture绿绝不闭合真实route。

## 全部 remaining，不得丢失

1. 上述首屏预算red，后续完整方案和真实全route证据。
2. 全58 compatibility余422出口逐组件/出口真实审计；本组有限34出口已review，旧press10仍有bounded历史边界。
3. 全库CSSpopup nestedclock、none首帧/livecancel、full→reduced去geometry留opacity；B4/B5/Nav局部不等于全库。
4. 全库Motion same-target live mode/clock cancellation、nestedfull、nonefirstframe；原B3路径/helper与本轮27浏览器不等于全库；press期间disabled视觉取消不由activation测试证明。
5. ComboboxFocusSafety inert outsidepointer dismiss/activation、Tab/ShiftTab、nestedownership/cleanup真实兼容，axe0不足。
6. 最终整体完成审计；不可带budgetred/未验matrix标goalcomplete。

保持closed：全部58=56UI+2blocks/65registryitems/58docs，B1–B9 gates；recipevalidation/
helper/highlight、URL37axes/118options/21N/A、58页noJS、source/install/TOC/prevnext、
catalog/sidebar/intensity、distribution/guides、T0templates。仅新确切缺陷有界修复，勿机械
重复全库visual。38animated-suite真实helper/reportergate保持。AI25unscheduled/
directiondeferred/form-native-select-sonnerexcluded不扩；MCP/分发Skill/release/hosting
未实现/未授权不虚构。

Distribution：132current资源；冻结public/r/snapshots/84cc78703b354b29c815c3970cb26973e4760dea398fdf48756b8a24c996b2f1/、registry-snapshots.json、.gitattributes -text均未动，无freeze。
latestETag revalidation/explicitfrozenimmutable/beforeFilesroute优先保留。

下一实际动作：先读本handoff/evidence/ledger和parity-plan §8，再选余下真实公开Motion
root的最小具体组，或推进独立running-motion矩阵；不要先全库替换ControlSpan/Div。
source更改先registry:build/check，sourcecommit后再build/check，public独立commit，完整
handoff独立；由协调开下一唯一实施会话。

## Final source / payload / clean

最终source129365a之后，`pnpm registry:build`成功65payloads/58docs，
.cache/native-div-final-registry-build.log；随后的`pnpm check` exit0，645/645tests、
84/84files、parity58、registry65/docs58、全部tier预算及38suite runtime gate通过，
.cache/native-div-final-check.log（86.22s）。检查未覆盖仍红的首屏JS预算，见上。

public独立提交d606fcf，61files仅current payload/catalog/registry sourceSha与实际source
更新；没有冻结snapshot/retention/.gitattributes变化。handoff单独提交，SHA见git log。
最后执行git diff --check与git status --short，clean后停止。没有新实施会话或整体完成标记。
