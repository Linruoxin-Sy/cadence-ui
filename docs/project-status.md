# Cadence UI 项目状态

2026-11-02。用户已明确恢复串行执行，W2 已收尾，W3 测量与决策报告已交付。
**项目整体尚未完成**：性能门仍有失败和未测项；W4 独立逐要求核对与清理已交付。不发布、不部署。

## 已完成范围

- `docs/parity-plan.md` 的 58 个正式组件已实现：56 UI + 2 compositions，B0–B9 实现和 B1–B9 历史 batch gates 已完成；当前 registry 65 items、58 篇组件文档。
- 466 / 466 有限 API/context 审核、CSS/lifecycle、目录/侧栏、URL variants、58 页 SSR/noJS、站点流程、冻结分发与指南维持既有完成状态。这里的历史证据按其实际断言范围复用。
- W1 零时钟基础修复完成。W2 固定 11 行清单已收尾，覆盖基础控制器、菜单指示器、Select width/flight、Tabs/CodeBlock projection、CodeBlock Actions/glyph/viewport、Sidebar、Calendar WAAPI、Embla、Recharts 和 DocumentEntrance。逐行范围见 [最终运行验收](evidence/engine-runtime-closure.md)。

W2 修复了旧 writer 在 clock/mode 变化时的首帧取消、Recharts instant 数据几何、实际 viewport 高度下界，
以及已消费 offscreen entrance 恢复 full 时重新隐藏的问题。本包引入的 Chart Consumer 回调丢失也已修复；
真实 Container 测试先复现失败，再验证三模式切换、context 更新和 SVG/text 节点身份。
没有新增公开功能、改变性能预算或迁移框架。

## 当前提交与验证

| 内容                                       | 提交                            |
| ------------------------------------------ | ------------------------------- |
| W2 writer 首帧取消和时钟修复               | `e6b1ee9`                       |
| CodeBlock 渲染高度 clamp                   | `2d2c782`                       |
| 维持 CodeBlock 原 T5 source 预算           | `3f6034c`                       |
| 已消费 DocumentEntrance 保持 settled       | `e559df6`                       |
| Chart 函数 children 回归修复，最终 runtime | `f60e7fe`                       |
| 最终 sampler/cleanup 探针                  | `49064c7`                       |
| 固定 W2 证据与逐行结论                     | `5193c0b`                       |
| 当前 registry payload                      | `201975a`，`sourceSha: f60e7fe` |
| W3测量工具与CLS测试                        | `7242346`                       |
| W3完整测量、原始归档与决策报告             | `ebf64c2`                       |

最终 `pnpm registry:build`、`pnpm check` 通过：类型、lint、registry、parity 均通过，
**88 files / 723 tests**。独立 `.next-motion-runtime` 生产构建成功；最终受影响生产回归
**29 / 29**，零 skipped/unexpected/flaky。此前本包 273 / 273 生产报告保留为历史证据，
没有将其改写成最终 runtime 的全量重跑。命令和完整日志见 [检查记录](evidence/w2-close-checks.json)。

真实浏览器证据分别为：引擎 1236 条、几何 384 条、指示器 264 条、Select flight 24 条、
CodeBlock Actions 60 条、基础零时钟 12 条，均无 failures/errors。首两帧、在途值、实际 controller、
卸载后轨迹和源码 hash 保留在各 gzip 中；范围与历史证据复用依据见最终运行验收。
这些结果不替代移动性能测量或任意 caller 组合认证。

当前 payload 与源码同步，冻结快照
`public/r/snapshots/84cc78703b354b29c815c3970cb26973e4760dea398fdf48756b8a24c996b2f1/`、
`registry-snapshots.json` 和 `.gitattributes` 未改动。上游 pin 仍为
`96da9cc7f1aa10580a3741664e2a77c721206c00`。

## 未完成的性能与最终验收

runtime `f60e7fe` 的W2四页基线（W3桌面重测相同）如下，门槛为每页 **≤120000 bytes gzip**。
计量保留 fresh browser、cache disabled、所有自动脚本/prefetch/async 去重、
load + networkidle + 10s + networkidle、逐响应 gzip6 和 manifest/hash 核验，未缩短窗口或抬高预算。

| 页面      | gzip bytes | scripts | 结果 |
| --------- | ---------: | ------: | ---- |
| Button    |     293222 |      23 | 失败 |
| Chart     |     426590 |      24 | 失败 |
| Calendar  |     318581 |      24 | 失败 |
| CodeBlock |     376619 |      29 | 失败 |

完整记录见 [w2-close-site-js.json](evidence/w2-close-site-js.json)，audit exit 1。
四页失败已阻止全站预算通过；其余适用页面也不能用这四页替代验收。

| 剩余性能门                                    | 状态                                                                      |
| --------------------------------------------- | ------------------------------------------------------------------------- |
| Initial Motion runtime ≤48 KB gzip            | 参考 consumer 编译47294符合；Next production精确分摊仍未证                |
| 编译后每组件增量 ≤8 KB gzip，排除共享 runtime | 依赖计入的独立增量21/58符合、37/58超限；仅模块编译58/58符合，不替代完整门 |
| 中端移动设备 ≥55 fps                          | 未证；ADB无设备，未用桌面模拟替代                                         |
| CLS <0.02                                     | 全站双视口冷加载证据见W3报告；交互/长窗口仍未证                           |

W3已完成69个适用HTML页面双视口严格冷加载审计，共138记录，JS 0符合、138失败，
范围284526–426590 bytes；冷加载CLS 138/138符合，最大0。并已完成58组件编译图。
五个必载root实体132767 bytes已超整页预算；公开m/LazyMotion/domMax候选49621，
比原Motion API合集47294更大，拒绝采纳。具体结果、原始证据、测量边界及可review决策见
[W3性能报告](evidence/w3-performance.md)和[汇总](evidence/w3-performance.json)。
产品源码、预算、功能、框架和payload未变；W3性能门尚未整体通过。
下一步需要用户确定框架/预算约束优先级，并提供真机条件；不自动展开架构修改。
W4 已交付[逐要求核对](evidence/w4-verification.md)及机器可读对账，
不能以 W2 检查通过宣称整体完成。[执行边界](execution-boundary.md) 继续约束剩余范围。

AI 25 个组件未排期、direction deferred、form/native-select/sonner exclusions 保持计划决定。
不新增 MCP、分发 Skill、发布、托管或额外兼容任务；非阻断新发现仅记录 backlog。

## 清理与停止状态

本轮 15 份大型原始报告共 178428046 bytes 已压缩归档为 2676351 bytes，并逐字节验证解压一致；
全部原始样本和负例仍保留。最终累计校验 56 份 W2 归档。另已删除当前收尾中两份有相同已验证归档的
`.cache` raw 副本，共 81139065 bytes。必要负例、可复现脚本、当前构建、固定 upstream 缓存及
React19 consumer fixture 保留。

历史清理曾被自动审批以 `blocked by policy` 拒绝。2026-11-02 用户明确要求再次尝试后，
已成功删除全部 48 个旧 `.next-*` 构建目录和原定 18 个旧缓存文件，另删除 2 份与已存 gzip
逐字节一致的 W2 raw 副本；本次合计 20 个缓存文件、18494340144 bytes（约 18.49 GB）。
原定缓存中 17 份独有诊断已先归档至 `.cache/basic-controls-exploratory-20261102.tar.gz`，
并校验每份原始字节的 SHA256；其余 3 份 raw 有完全一致的既有证据归档。
旧构建中的 92 个 junction 仅移除链接本身，依赖目标未删除。`.next`、`.next-motion-runtime`、
固定 upstream 缓存和 React19 consumer fixture 均保留。清理结果与固定清单在
`.cache/cleanup-result.json`、`cleanup-old-builds.json`、`cleanup-cache-targets.json`。
当前收尾使用的 Next 服务端口 3183 已停止，fixture 3181 已退出，未触碰用户 `.next`/3000。
上述是W2清理记录；最新用户指令已恢复W3，性能门仍保持真实未完成状态。

W3最终检查88 files/724 tests通过；本轮复用production构建，不新增Next目录。
两份大型原始报告约13.38MB已无损归档为约616KB并核验SHA与解压字节，重复.cache副本及
可重建的两个bundle入口已删除。本轮Next3183与自行启动的ADB5037均已停止。

## 恢复入口

从 [W4最终交接](handoffs/w4-closure.md) 恢复；先由协调核实当前会话结束、
git状态及本轮服务退出，再依用户决策安排唯一后继。
W3的JS/依赖增量失败、生产Motion归因和真机/交互CLS缺口继续阻止整体完成。
W2已闭项目按实际source/context范围复用，不再逐writer展开；未获用户架构/预算决策前不迁移或改门槛。

## W4 独立核对（2026-11-02）

要求→实现→证据→PASS/FAIL/UNPROVEN 见 [W4核对表](evidence/w4-verification.md)。
W2最终25个源码hash、W3全部58组件hash匹配；466有限API记录已分类，
W3完整图重算包含16条动态import边，21/58结果一致。Motion参考合集实际为registry的10个API，
已修正文案；站点独用useInView不在该参考consumer口径内。产品源码与payload未改。

新增生产Accordion/Tabs/Select双视口full模式交互/滚动采样6/6符合，CLS均为0，
保留原始shift与操作时间；仅覆盖这些明确窗口，不关闭全站交互/任意长窗口/真机缺口。
本轮复用W2构建，未新build或刷新payload。本轮Next3183已停止。
W4核对交付完成不等于整体达标；JS、组件增量失败，Next Motion精确归因、
真机FPS及更广CLS仍未证；既有用户决策问题继续待答，不重复发问或代选。

W4工具提交`e09a058`、证据提交`f9db6f3`。最终串行完整检查链全部通过，
88 files/724 tests；细节与初次lint失败/修复日志见[evidence/w4-checks.json](evidence/w4-checks.json)。
已有raw元数据引用的58份归档及W3另两份报告重新校验长度/SHA。
本轮9份日志92398 bytes无损归档后删除重复缓存，清单见[evidence/w4-cleanup.json](evidence/w4-cleanup.json)。
端口3181/3183/5037无listener；没有新build目录或重复历史大清理。

## Authorized W3 Button prototype (2026-11-02)

The user selected route A: preserve 120000 bytes and all functionality, build and measure a complete
Button hydration/framework prototype. Historical requests for that choice are resolved. Product
migration, changed budgets, dependency exemptions and other-page rollout remain unauthorized.
The prototype is isolated; the existing product runtime and frozen distribution remain authoritative.
Real-device FPS remains unproven. See [prototype contract](button-route-prototype.md).

## W3 route A complete candidate delivery (2026-11-02)

用户已明确批准路线A；历史W4中的等待A/B/C答复已被覆盖。本轮完成了隔离、可运行的完整
Button hydration原型，而非再交付subset。原型实现4fe1a51；报告与复现见
[evidence/button-route-prototype.md](evidence/button-route-prototype.md)及[合同](button-route-prototype.md)。

全新Edge双视口均221511 bytes gzip，67自动实体，FAIL120000。完整SSR/noJS正文/链接/标题与
产品相同；原16示例、source/copy、真实3包管理器、URL/history、目录搜索筛选/真实结果、
侧栏持续挂载、主题/mode/speed持久化与Button真实按压/在途降级验证已交付；双主题双视口axe0。
冷加载CLS均0。新增source/variant/install/TOC+15s窗口，桌面两者0.0028987，移动候选与产品
均0.0402032，FAIL；不冒称W4其他6窗口或全站终身CLS失败。真机FPS仍未证。

候选未满足迁移条件；ADR009产品Next决定有效，ADR016仍调查。产品runtime f60e7fe、payload
201975a/sourceSha f60e7fe及固定pin/冻结snapshot均未改。没有批准迁移、改变预算、删功能、
依赖豁免或其余68页推广。整体保持INCOMPLETE；后续架构动作需要具体新决策，不能重复问A是否获准。
