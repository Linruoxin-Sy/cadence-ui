# 串行 parity 交接：CSS运行条件闭合，下一组 Motion/engine

2026-11-02 Asia/Shanghai，D:/Code/Project/cadence-ui，起点clean c563b50。
本轮唯一实施者，无子代理/并行实施/后继会话/push/发布/部署/freeze。
**有限CSS运行组已闭；整体goal未完成。** 停在已提交边界，由协调核实completed/idle+
clean后开下一唯一实施会话。本实施者不自己创建后继。

## 提交与权威

1. **eec81c8** runtime/source/tests/动画方案澄清/§8进度：Browse rotate属性修复；
   NavigationMenu Content与Popup none取消；Accordion/Collapsible reduced/none取消。
   新37生产生命周期用例，原两unit分支增加transition-none断言，保留原helper/reporter。
2. **f138739** review/index/evidence：CSS范围逐owner/委托对账、八个旧源码负例、最终
   原始样本子集/报告、JS预算、runtime索引正确描述Browse text span并刷新受影响hash。
3. **c88785e** payload独立：60文件，除sourceSha外只有Accordion/Collapsible/
   NavigationMenu三个payload改变；current sourceSha=eec81c8（source-only权威）。
4. 本handoff独立提交，SHA见git log；不为纯handoff刷新sourceSha或build。

固定pin96da9cc7f1aa10580a3741664e2a77c721206c00，Base1.9.0/Motion13.5.1/React19.3.1
及真实类型路径复用unchanged compatibility-inventory。无依赖/lock/API/default/export/
data-slot/registry-id/recipe/parity例外变更。shadcn技能仅只读，禁consumerCLI/preset。
relativeimports/sharedlib/@cadence、Base render/cn callerlast/statecallback/refcleanup、
P11UIonly保持。没有重做有限API ledger，没有以200绿概括全库。

## 本组修复与真实证据

权威详表 [../evidence/css-lifecycle.md](../evidence/css-lifecycle.md)。与runtime-parts.json
58items/38非空recipe、6site、8shared逐目标对账。72源hash独立核对匹配。

原生产.next-css-runtime（7548345，BUILD_ID n9mSDXfLUMsimdT1oE3GG）在核对hash后复用
做负例。最终 .cache/css-lifecycle-negative-final.json **8/8真实行为失败**：

- Browse实际span由Tailwind rotate驱动，却transition transform，full无动画。
- NavigationMenu Content两OS、Popup独立，在none仍有旧opacity动画。
- Accordion/Collapsible各reduced/none四cell，仍有旧height动画。

最小修复：Browse列rotate；另三组件实际目标显式transition-none（disclosure保留duration0）。
不引入第二controller/重挂载/timer/硬编motion值；Base原测量/ref/render/生命周期保持。
没有新recipe；声明/实现/frontmatter/contract一致。原unit/helper/observer/reporter保留。
none原生取消需要移除transition-property，仅computed duration0不能证明旧动画已停。

补齐全部指定CSS条件：Reveal六初始cell及两OSlive；两Chevron十二初始cell、toggle/
reversal/live；PreviewStack真实React路由到达、full运行→reduced保留opacity→none，
同node；Content自身exit/reversal/live、keepMounted同panel、整个Portal关闭卸载后重开
none首帧；Progress Preparing preview实际loop六cell；DatePicker外none内显式full/4x
两OS真实popup；Content继承4x；Accordion实际运行nativeclock身份/timing与反转。

实际nativeclock：height id2 duration1280ms，computed变320ms后仍id2/timing1280ms；
反转id3/native duration214.8861495787092ms。不新增实时重定时/重启承诺。四loop仍由
theme --animate-*时钟所有，Provider4x不乘loop是原合同。Reduced保留opacity，Spinner
单glyph rotation例外。静态位置/语义orientation不要求一律transform:none。

已有B4/B5/Nav/Sidebar/组合/四loop/Bubble证据按真实writer复用；透明wrapper没有重复N/A，
CommandDialog→Dialog、Sidebar mobile→Sheet、DatePicker→Popover、DataTable→Dropdown。
其余信号明确为static反馈/instantlayout/Motion/CalendarWAAPI/Embla/Recharts；无实际GSAP。
无新authored stagger/delay，0元素/0ms仍满足20/400ms。CSS闭合为已定义合同与实际writer/
共享路径的有限证明，不承诺任意caller样式/任意props或未授权引擎行为。冷URLnone在
hydration前未知保持原SSR边界，冷OSreduce另有旧真实parser证据。

原始report全部在.cache/css-lifecycle-{first,second,extra-negative,negative-final,fixed,
final-probes,final-browser,authority-browser}.json。Committed css-lifecycle-browser.json
存报告结果及最终负例/新37case的原始first8/every24th/last/stage边界子集，带原index/length；
完整数组保留原report，未抬1MiB上限。旧css-runtime-browser.json继续保留其余owner原样本。
六mobile隐藏header定位timeout、原NavigationMenu速度菜单诱发退出的clock误测、六个
keepMounted/closing卸载假设错误均作为harness错误保留；修正后探针仍旧源码8fail。
不弱化原断言/timeout/负对照/axe，未造空样本pass。

## 最终验证

eec81c8提交后严格串行：registrybuild65payloads/58docs → pnpm check **677/677，87files**
（88.96s）→ isolated production Next build73pages。日志
.cache/css-lifecycle-authority-{registry,check,build}.log。VitestMAX/MINforks2/1；
RAYON_NUM_THREADS2，NODE_OPTIONS=--max-old-space-size=768，CADENCE_DIST_DIR=.next-css-lifecycle。
Next tsconfig-only diff保存/核实/只restore本轮，未碰用户.next/3000。

最终Edge/msedge3163/workers2：**82behavior pass +1budget fail**，93.25s；
BUILD_ID WfOcVeqgZFtNxCFAeH2MP。82=37新生命周期+37原CSS+8Nav，重跑不叠加unique。
没有新全库visual/axe认证；无最终外观变化处精确复用旧证据，Browse新增full旋转直接采样。

Strict initialJS **292461gzipbytes/23scripts >120000 FAIL**，css-lifecycle-js.json，
all200/no pageerrors，final BUILD_ID/rootmanifest/逐bodySHA256/gzip核对；freshEdge/cacheoff/
nointeraction/networkidle+10s+networkidle协议保持。旧292454/292267/292314/292327/292344/
291749/291658/291423/baseline290171均保留。Button仅共同fullshellbaseline，不叫Button-only。
此新runtime真实测量不关闭任何其它site页预算。

Review-only lint四文件通过，git diff --check通过；current payload除sourceSha仅三真实source
变化。Frozen public/r/snapshots/84cc78703b354b29c815c3970cb26973e4760dea398fdf48756b8a24c996b2f1/、
registry-snapshots.json、.gitattributes逐diff不变。132current、latestETag/frozenimmutable/
beforeFiles规则保持，未freeze。自有3163已无listener。最终clean核对见终端记录。

## 下一组：实际 Motion/engine；测试后决定修复

CSS不再是pending组；以下明确未证，不能称已失败或被CSS82pass关闭：

A. ControlAnimation和OTP目前passive effect。离散事件probes和真实19.0隔离consumer过，
但外部异步controlled mode/value/clock提交后第一绘制帧是否仍旧动画、OTP是否先终态再
淡入未证。真实probe后决定prepaint stop/set及晚frame排队重申；稳定主DOM/focus/Base
生命周期，不重新引入React19.2hook。原c53c55a相关same-target frame.update/cancelFrame
修复保持。19.0changed-pathfixture不是全58最低版认证。

B. Checkbox/Radio reduced目标scale1，但cm.transition(state.morph)未显式per-key scale
duration0（B5指标已有override）。需实测full中间scale降reduced是否仍160ms补间geometry。
目标1不证明snap。保留允许opacity；未测勿直接改或称失败。

C. Site DocumentEntrance components/site/document-entrance.tsx按site设计§2.4含article
rise/opacity/4pxblur/clipPath例外、SSRhidden+noscript/printrestore。测初始none/系统reduce、
live same-target y0/opacity1取消、nestedclock/offscreen。只更新transition不证明停止；
也不误判clipPath未记录。保留文档入口/SSR/noJS/print/readability/主DOM与focus，不为预算删功能。

D. runtime索引全部Motion声明/controls/layout/imperative、Calendar nativeWAAPI、Embla、
Recharts实际targets：same-target mode/clock真取消、nestedfull、nonefirstframe、held-press
期间disabled视觉取消。helper/unitactivation不是运行证明。Motion加速WAAPI仍属Motion。
没有实际GSAP writer，不为未来catalog示例造引擎测试。Provider仅token复用保持原fallback
语义；caller自写Motion不自动属库可变代码。保留真实part probe+WAAPI negative；旧“四首帧
fail”实为操作scale0.96已纠正并通过，不重新称缺陷。

## 性能与整个goal仍OPEN

- 每完整shell页initialJS≤120KB仍red。最终须覆盖所有适用页尤其Chart/Calendar/CodeBlock；
  当前不机械重跑58red。首屏runtime再变须新生产测量；puretests/evidence可有据复用红并声明。
  不抬限/排chunks/延窗/移JS到inline-data逃量/删SSR功能。保留header/sidebar/search/nav/
  package-manager/source/installcopy/realpreview/modes/focus/a11y。check绿不盖red。
- §7 Motionruntime(initial)≤48KB gzip、compiled percomponentaddedJS≤8KB（sharedruntime
  excluded）、≥55fps midrange mobile、CLS<0.02仍证据缺口，非已测失败。先定义artifact/
  compiled归因，区别rawtier-source4–14KB预算，不放宽（CodeBlockT5原12KB限额保持）。
  真实trace/硬件/throttle披露，不假称物理手机。
- ADR009仍NextAppRouter，ADR016仅研究；directSSR普通fence120492/install136462失败
  未采纳，React19.0小fixture114KB不是产品budget。最终整个goal逐要求审计仍未完成。
- 保持closed58=56UI+2blocks/65items/58docs、B1–B9历史gates、recipe/helper/highlight、
  URL37axes/118options/21N/A、58页noJS、siteflow/catalog/sidebar/intensity/distribution/
  guides/T0templates。有限API466=342compatibility+124static闭合，不重造pendingledger。
  Combobox mouse/touch/Tab/ShiftTab/reopen/unmount/parent/sibling/属性ownership有限矩阵仍闭，
  不回退inert吞激活。AI25unscheduled/directiondeferred/form-native-select-sonnerexcluded
  不扩；MCP/分发Skill/release/hosting未实施/授权不虚构。

下一唯一实施者先读AGENTS、parity-plan当前§8、本交接、css-lifecycle/css-runtime证据与按
目标筛选runtime索引，再读改动相关design/animation/site/ADR/CONTRIBUTING。保持串行原子
提交：编辑→registrybuild→check，最终runtime提交后build/check，payload/handoff独立。
纯证据不机械刷新runtime sourceSha；有真实缺陷先保留反例最小修复，不以预算/未验
matrix标整体complete，不创建后继/子代理/并行实施，不push/发布/部署。
