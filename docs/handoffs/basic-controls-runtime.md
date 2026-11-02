# 基础控制器 runtime 交接

后续主指针归属修复已完成，当前继续入口为 [press-ownership.md](press-ownership.md)。
本文保留4d06c24历史证据与边界，不将历史数字改写成新源码结果。

2026-11-02 Asia/Shanghai，D:/Code/Project/cadence-ui。起点 clean48a4db5。
本轮唯一实施者；没有子代理、后继聊天、新 goal、push、部署、发布或 freeze。
整体 /goal 和全库 engine 矩阵仍未完成。由协调确认 completed/idle、实际 clean/log 后衔接。

## Authority 与原子提交

1. **4d06c244413b08c472d0cde17588129eab711bd1**：最终 runtime source。
   PressButton 原生按压生命周期与 Slider reduced feedback 修复、真实旧源码负控、
   fixture/observer unit 调整、scheme、逐 writer/part 索引与 parity 进度一起提交。
2. **82967aa**：纯格式，修正 evidence 表与 slider negative JSON 的 Biome 格式。
   初次完整 check 在格式阶段失败，未冒称测试通过；随后完整运行通过。
3. **7180f62**：最终真实浏览器/生产/预算证据、原始采样无损 gzip 与归档脚本。
   增强真实 ResizeObserver delivery/disconnect，产品 runtime 字节不变。
4. **a513bd3**：独立当前 payload 提交，61 JSON；174 个当前 sourceSha 都是 **4d06c24**。
5. 本交接与最后 parity 数值单独提交，SHA 见 git log；不为交接刷新 payload/sourceSha。

固定 upstream pin96da9cc7f1aa10580a3741664e2a77c721206c00、new-york-v4 未移动。
React/ReactDOM19.3.1、Motion13.5.1、Base1.9.0 的主依赖/锁与公开 API/default/exports/
slots/registry ids 未变。shadcn skill 已说明并只读；无 consumer CLI、components.json。
public/r/snapshots、registry-snapshots.json、.gitattributes 与48a4db5逐 git diff 无变化。

## 实际缺陷与修复

**Enter → 失焦 → 另一控件拖拽的跨控件取消。**
`basic-controls-negative.json` 保存旧50cc262的完整 PressButton 源码、真实原始样本、
pointer 事件与失败。最初无效 Radio/value 与 Progress/last-child selector 已按真实 DOM
纠正，负控使用纠正后的 sampler，不把未命中当成引擎失败。

真实 Slider pointerdown/move 命中 thumb/control，buttons1，但之后出现来自前一个
ToggleGroupItem 的 pointercancel，Base 的 document listener 清除了新 drag。
单独二分确认先前 disabled focusable Button 的 Enter 已足以触发；不做此前键盘路径时
同一 Slider 拖拽正常。Motion13.5.1 press/utils/keyboard 在 Enter 安装 blur listener，
keyup 后未撤掉，blur 会合成冒泡 PointerEvent。不是 Slider 没有真实拖动，也不是只看
data-motion/getAnimations 推断。

PressButton 现在在同一 Motion native button 上合并原生 pointer/Enter/blur handlers，
保留调用 Base/caller handlers，驱动原有 useControlAnimation。真实外部 pointer release
由 window listeners 接收，effect cleanup 撤销。禁用/撤掉 recipe 仍清除 pressed；
none 潜伏手势与 disabled 吞 pointerup 的已有修复保留。没有全局阻止事件、patch 依赖、
key-remount、计时器或抹除原生 focus。没有安装 Motion tap，所以不再产生那条合成 blur cancel。
§4 的 whileTap/declarative Actions 历史叙述已按真实 committed controls 修正。

**Slider partial scale → reduced 仍 tween。**
`basic-controls-slider-negative.json` 保存当时 source hashes、完整 Press/Slider 源码及
实际 dragged thumb 轨迹。full → reduced 后首帧 scale 约0.978421，目标1仍短时补间。
Slider 现在在 disabled **或 cm.reduced** 使用 duration0；Base 拖拽的 left/translate/
--position/value 仍即时更新，不把语义位置当成应删除的 transform。

useControlAnimation/OTP 已有 committed layout effect、public frame.update reassert 与
cancelFrame/stop cleanup 未改；Checkbox/Radio reduced per-key zero、Select 单一 width
MotionValue 等旧修复未回退。recipe/frontmatter/Motion table 集合未变，motion conformance
三模式和强制 reporter/故意破坏负控继续通过。

## 新证据与精确边界

入口 `tests/runtime/controls.html` / controls.jsx / controls.mjs。真实 React/Motion/Base，
隔离 Vite client fixture，不是 Next test route、SSR 页面或产品预算替身。
外部异步 setState，无 act/flushSync；父 layout effect 记录 commit 与后续 rAF。
85ms 只等待已记录样本，不跳过前两帧。初始插入的 indicator 标记在 MutationObserver
中完成：初始 commit 不声称已经采齐 indicator，paint1/paint2 必须有全部13个真实 host；
后续外部 commit 已有全部标记。原始帧全部保留，不能拿这份 client 轨迹宣称网络 SSR 全闭。

- Button、focusable Button、Toggle、Group item：真正 button；group disabled 来自 Group。
  六 mode/OS cells、初始 disabled pointer/Enter、held pointer disable-release-reenable、
  真 Enter 反馈、clock 更新、none 取消、同节点与 callback cleanup。
- Slider：真正 slider-thumb ControlDiv。修复后实际 value 改变且 full 有部分 scale；
  继承/显式 clock、live reduced、disabled 与外部 value commit 的前两帧、同 DOM、cleanup。
  位移仍由 Base 负责，环/静态 root 不替代反馈 host。
- Checkbox/Radio：实际 indicator ControlSpan，Radio 以 aria-label A/B 定位，value 在隐藏
  input 上。受控 selection、反转、同目标正时钟、首帧 mode 取消和 cleanup。
- Switch：实际 thumb ControlSpan；checked 的 x=track.clientWidth-thumb.clientWidth
  是正确静态终值。异步 checked、同目标 clock、反转与 none 下宽度改变；真实 ResizeObserver
  回调和 disconnect 记录保留。宽度改变后的第一 rAF 可能先于 observer，第二 rAF 才有新终值；
  没有伪称同步首 rAF 已重测，也没有把 rAF 回调叫作已完成的屏幕截图。
- Progress：默认 indicator、公开组合 indicator、组合后自动追加的默认 indicator 分别采样。
  actual NativeControlDiv scaleX，异步值、反转、clock、首帧 reduced/none 和 cleanup。
  scaleX0.8/0.35 是语义终值，不要求 none 清 transform。它没有 ResizeObserver writer。
- OTP：实际 slot > character span，character replacement/deletion、clock-only settle、
  unrelated render 不回放、模式取消和 cleanup。clock-only 结束旧字符是现有实现行为，
  没有为 helper 发明新动画语义。input/focus/refs 保留由已有实际 consumer/有限 API 证据补足。

full 显式在 none 父级内、继承8×后改4×、显式2×，OS reduce 优先。native WAAPI timing
与 JS numeric matrices 同时保留，不能用 animations[] 为空证明 JS 停止。烘焙 spring 的
实际 duration 受距离/阈值影响（例如4800→2400→1300），不强加精确二分1200的伪合同。

**138/138**，六 cells 无 pageerror。索引 `basic-controls-runtime.json`；其 `.json.gz`
保留完整原始 JSON **51,195,294 bytes**，压缩746,611 bytes，SHA256 在索引。
archive-controls.mjs 验证解压逐字节相等，未删任何 frame。真实 ResizeObserver wrapper
继承原生 observer，只记录实际 delivery/observe/disconnect，不模拟回调。

`basic-controls-validation.json` 汇总命令与范围；生产完整 JSON 保留
`.cache/basic-controls-production.json`。旧 negative 和当前正控不互相覆盖。

## 运行命令与结果

```powershell
$env:VITEST_MAX_FORKS='2'; $env:VITEST_MIN_FORKS='1'
pnpm registry:build
pnpm check
# 最终 review 后再次完整 pnpm check：687/687，88 files
# logs: basic-controls-registry.log / basic-controls-check-final.log /
#       basic-controls-review-check.log
$env:RAYON_NUM_THREADS='2'; $env:NODE_OPTIONS='--max-old-space-size=768'
$env:CADENCE_DIST_DIR='.next-motion-runtime'
pnpm exec next build
# basic-controls-build.log；生成的 tsconfig diff 保存后只恢复了该文件的本轮变更
$env:PLAYWRIGHT_CHANNEL='msedge'; $env:PLAYWRIGHT_PORT='3167'
pnpm exec playwright test tests/e2e/b3.spec.ts tests/e2e/motion-matrix.spec.ts tests/e2e/calendar.spec.ts tests/e2e/carousel.spec.ts tests/e2e/code-block.spec.ts --workers=2 --reporter=json
# 193/193，zero skipped/unexpected/flaky
pnpm exec vite --config tests/runtime/vite.config.mjs
# 另一 shell：
$env:CADENCE_RUNTIME_SOURCE='4d06c24'
node tests/runtime/controls.mjs .cache/basic-controls-final-raw.json
node tests/runtime/archive-controls.mjs .cache/basic-controls-final-raw.json
node tests/runtime/probe.mjs .cache/basic-controls-legacy-fixture.json
node tests/runtime/assert-report.mjs .cache/basic-controls-legacy-fixture.json
node tests/runtime/press-reenable.mjs
# 138/138；legacy23/23；真实 pointer/Enter disabled-release-reenable8/8
```

40/40 定向 unit 先通过；最终完整 check 含所有 native event/ref、controlled tests 与 helper
破坏负控。没有放宽既有断言、超时、axe 或阈值；Item img/act warning 未屏蔽。
生产193含真实 Button、B3、Switch 初始 checked、Progress、委托 Button 的 Calendar/Carousel、
CodeBlock 和其余 motion-matrix。没有机械重跑全库视觉快照，未冒称本轮 dual-theme 截图认证。

真实 React/ReactDOM19.0.0 consumer prepare/build/run 再通过，logs为
basic-controls-react19-build.log / basic-controls-react19.json / .err(空)。复制 source 子集与
最终运行时逐字节相等。范围是 Control adapters/OTP/native ref cleanup；没有另行认证新
PressButton 原生生命周期的19.0浏览器交互，不能冒称58组件最低版全矩阵。

## 性能与全部 remaining

`basic-controls-js.json`，runtime4d06c24，四页 fresh Edge/cache-off/无交互，所有自动
script response、单资源gzip6求和、networkidle+10s+networkidle，root manifest/hash校验：

| Page      | gzip bytes | scripts | result     |
| --------- | ---------: | ------: | ---------- |
| Button    |     293406 |      23 | FAIL120000 |
| Chart     |     414456 |      24 | FAIL120000 |
| Calendar  |     318764 |      24 | FAIL120000 |
| CodeBlock |     376803 |      29 | FAIL120000 |

全部200、无 pageerror；审计进程真实 exit1。命令：启动当前 Next3167 后运行
`node scripts/audit-site-pages-js.mjs docs/evidence/basic-controls-js.json http://127.0.0.1:3167 button,chart,calendar,code-block`。
阈值、窗口、产品功能未改，没有架构迁移。旧50cc262四页数值保留历史，不改写成当前。
48KB initial Motion、8KB compiled/item（排共享）、中端55fps、CLS<0.02 仍缺真实证据。

基础控制器本轮关闭的是上述有限 client 条件与两条实际缺陷；全网络SSR/hydration矩阵、
Switch synchronous first-rAF resize、零/负/非有限 timeScale 不在此认证范围。
早期错误-selector诊断 `.cache/basic-controls-first.json` 还含 clock0 探索，未当作正时钟
或 none 模式证明；后续应先核对该输入域与实际 host，不能以本轮正控外推0时钟行为。

独立余项继续以 engine-runtime.md 表为准：Select/Combobox/menus 各 indicator host/context、
Select width/flight clock/cleanup，Tabs/CodeBlock projection、CodeBlock viewport/各glyph完整
生命周期，Sidebar scalar、Calendar WAAPI、Embla、Recharts各 series/controller，DocumentEntrance
offscreen/hydration/noJS/print。source发现不是运行证明；没有实际GSAP writer，不造验证。
API466/466、58组件/65items、CSS组、Combobox有限焦点、B1–B9旧 gates、站点/分发冻结等
已有闭合范围不重置。AI25/direction/exclusions不扩。最终 whole-goal audit 仍OPEN。

## 清理与停止状态

3161 Vite consumer、3165 fixture、3167 Next 的 listener PID/实际命令行均先核实为本轮所有，
随后停止；端口最终无 listener。未碰用户.next/3000。保留仍需复用的.next-motion-runtime、
.cache/react19-consumer、最终原始证据、失败证据及可复现脚本。

**清理被自动审批阻止，不能记作已完成。** 协调此前核验的48个过期根.next-*目录依旧在，
其批量递归删除曾被拒绝，本轮没有换工具重试。另核验18个本轮自有、非reparse、未跟踪、
位于工作区.cache内的过期诊断/重复raw文件（共374,823,052 bytes），尝试原生PowerShell
Remove-Item -LiteralPath 非递归删除，自动审批再次拒绝，理由仅“blocked by policy”。
整个命令未执行，18文件仍在，拟生成的 exploratory gzip 也未创建。不绕过拒绝重试。
因此包括已无损归档的 basic-controls-final-raw.json 在内的重复文件仍占磁盘，交由后续
在实际策略允许时处理；不得因清理丢失两个 source negatives 或唯一当前raw gzip。

提交 payload 后 git clean；再单独提交本 handoff 与最终 parity数值。最终 clean/log/端口
由实际核实给协调。本轮结束，不自行创建后继。

下一可执行 prompt：阅读本交接、engine-runtime.md 和设计记录，复用本组 actual-host
138正控/两个负控与193生产证据，不重新跑旧测试就把相同缺口交接。选一个独立 writer
有边界推进（优先菜单/Select/Combobox indicators 的正确实例、异步时钟/取消/cleanup），
保留本组原生 press 与 reduced Slider 修复；若修改 shared controls，复跑本组。按原子
source→build/check→production→payload→handoff串行提交，固定pin/frozen不动，无push/发布。
全部性能门和最后逐条全目标审计继续OPEN；临时清理策略拒绝状态必须继续如实交接。
