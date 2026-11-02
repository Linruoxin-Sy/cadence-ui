# Parity 执行边界与剩余工作

2026-11-02，按用户新增的收束要求执行。正式交付范围继续采用
[parity-plan.md](parity-plan.md) 的 58 个组件；计划范围固定为下列四包。
用户随后明确要求完成当前任务后立刻停止并写项目状态。W2 已收尾，自动执行到此停止；
W3、W4 仅在用户明确恢复后执行。当前结论见 [project-status.md](project-status.md)。

## 固定范围

| 工作包              | 状态   | 交付与验收                                                                                                                                               |
| ------------------- | ------ | -------------------------------------------------------------------------------------------------------------------------------------------------------- |
| W1 零时钟修复       | 完成   | runtime `384e94a`，19 个配方的零时钟解析与实际 dispatcher；完整检查 721/721、生产 193/193、浏览器正控 92 条记录通过。见 [交接](handoffs/zero-clock.md)。 |
| W2 剩余引擎运行验收 | 完成   | runtime `f60e7fe`；11 行固定清单收尾，check 723/723，最终受影响生产 29/29。见 [验收](evidence/engine-runtime-closure.md)。                               |
| W3 性能验收         | 未启动 | 测量既定五项性能门并处理范围内的必要优化；重大架构、预算或功能变更进入用户决策点。                                                                       |
| W4 最终验收与清理   | 未启动 | 逐要求核对源码、文档、分发、提交和证据，清理无用途产物与本轮服务，交付准确完成状态及 handoff。                                                           |

当前不创建任何后续实施会话。用户明确恢复后，仍仅按这些固定工作包串行执行，同时保持一个实施者。包内失败继续在该包解决，
不按缺陷另立工作包或额外兼容任务。每包仍拆分逻辑原子提交，source、proof、payload、handoff
按实际依赖顺序提交；纯文档或证据变更不机械刷新 runtime sourceSha。

## 已收尾的 W2 固定清单

W2 的起点是 `80fac2c` 时 [engine-runtime.md](evidence/engine-runtime.md) 的未闭条件及
[零时钟交接](handoffs/zero-clock.md)。下表保留 W2 起点的固定 writer 与原定条件，均已按 [最终验收](evidence/engine-runtime-closure.md) 收尾；
不是新的 pending 表。已有适用证据继续按其实际范围复用。

| 实际范围                           | 原定验收条件                                                                                                          |
| ---------------------------------- | --------------------------------------------------------------------------------------------------------------------- |
| 基础控制器                         | 对账已有 client 与生产证据的适用 SSR/hydration 范围，仅补现有未闭首帧与时钟条件；保留初始 checked Switch 等已证路径。 |
| Menu、Select、Combobox 指示器      | 真实 checkbox/radio host 与 context；Menubar 按实际 delegation 复用；异步 clock、插入、取消和 cleanup。               |
| Select value 与 portal flight      | 同目标 spring clock、异步首帧取消、handoff、继承与显式 clock、cleanup；保留正确 scoped 的六格宽度与 flight 证据。     |
| Tabs 与 CodeBlock shared indicator | 实际 projection host 的部分运动、降级、反向和 resize；按装饰分支的真实节点生命周期验收。                              |
| CodeBlock Actions 与 glyph         | 浮动 Actions、两 copy span、expand span 的初始模式、clock、重入和 cleanup；静态 header Actions 不充当动画证据。       |
| CodeBlock viewport                 | 部分高度、reduced/none 首帧、同目标 clock、resize、受控反向和 cleanup。                                               |
| Sidebar scalar                     | 异步 mode/clock 的首帧、继承与显式 clock、onUpdate 取消和 cleanup。                                                   |
| Calendar WAAPI                     | 实际 grid 的首帧与 clock、受控月份、重开、适用 hydration 和 cleanup。                                                 |
| Embla                              | 实际 track/loop 的 clock 与 none 轨迹、动态 slide cleanup；保留直接拖拽的语义位移。                                   |
| Recharts                           | 对账已安装且实际使用 controller 的 series，验证实际 SVG/data target 的首帧、clock 与 cleanup。                        |
| DocumentEntrance                   | 三种 as 的既有初始模式、offscreen、继承与显式 clock、settled、hydration、noJS 和 print 条件。                         |

模式、系统偏好、时钟、受控更新、反向及清理由既有明文合同和上述缺口决定，
不再扩成任意 props、极端输入或 caller 组合的穷举。零时钟基础修复只证明其已运行的范围，
不直接替代各 writer 的订阅与取消证据。CSS 原生在途 clock 与主题 loop 维持已核实的合同；
没有实际 GSAP writer，因此没有新增 GSAP 验收任务。

## 性能门与决策边界

| 指标                              | 既定门槛                      | 当前状态                                                                                                     |
| --------------------------------- | ----------------------------- | ------------------------------------------------------------------------------------------------------------ |
| 所有适用完整站点页面的 initial JS | 每页 ≤120000 bytes gzip       | 失败；当前四页为 Button 293222、Chart 426590、Calendar 318581、CodeBlock 376619 bytes（runtime `f60e7fe`）。 |
| Initial Motion runtime            | ≤48 KB gzip                   | 待实测归因。                                                                                                 |
| 编译后每组件增量                  | ≤8 KB gzip，共享 runtime 除外 | 待实测归因；不与 source tier gzip 混淆。                                                                     |
| 中端移动帧率                      | ≥55 fps                       | 待按真实环境采证。                                                                                           |
| CLS                               | <0.02                         | 待实测。                                                                                                     |

用户明确恢复 W3 后，先完成真实包体与运行归因，再验证一条明确候选路线，避免继续派生无期限实验。
保留原始计量窗口、自动 script/prefetch/async 计入规则和功能合同。若达标需要迁移框架、
改变功能或调整预算，交付具体测量、方案与影响范围，等待用户决定；不自动扩大修改范围。
红项或未测项继续阻止整体完成，不能把决策报告当作预算通过。

## 已闭范围和新增发现

58 个组件实现、466 项有限 API/context 审核、CSS/lifecycle 组及 B1–B9 历史 gates
保持既有完成状态。目录与侧栏、URL variants、58 页 SSR/noJS、站点流程、分发冻结与指南、
文档模板等已闭范围也不重新展开；变化点只做其影响所需的回归。

新增功能、额外兼容范围、非阻断性的边界探索记入 backlog，不自动创建修改会话。
AI 25 个未排期组件、direction deferred、form/native-select/sonner exclusions 维持计划决定；
不新增 MCP、分发 Skill、发布或部署任务。已列验收的真实失败属于当前包，不能以 backlog
为由跳过；其他新范围需要用户明确追加。

## 最终完成条件

W4 按原目标和既定文档逐项核对，使用实际源码、命令、渲染或运行证据支持对应范围。
完成要求包括准确的当前 payload 与 sourceSha、冻结快照不变、必要检查通过、原子提交、
清晰 handoff、干净工作区和本轮服务停止。已有成功结果按其适用条件复用。

清理保留必要的唯一负例、当前原始证据归档、可复现脚本、固定 upstream 缓存及仍有用途的
当前构建。历史 48 个旧构建目录和 18 个旧缓存文件的删除曾被自动审批以
`blocked by policy` 拒绝，命令未执行；这些项目仍待处理，不通过更换工具或等价命令绕过。
其他确实无用途的本轮产物在策略允许时清理，并记录实际结果。

整体 goal 保持未完成，并按用户要求在 W2 后暂停。任一既定要求仍失败、未证或受策略阻挡时，
准确交付待处理项和必要决策，不以增加新任务替代收尾；恢复必须由用户明确提出。
