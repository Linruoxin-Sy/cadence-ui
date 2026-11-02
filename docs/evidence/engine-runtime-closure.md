# W2 剩余引擎运行验收

2026-11-02。固定的 11 行 W2 清单已收尾，最终 runtime 为 `f60e7fe`。
这是 [执行边界](../execution-boundary.md) 内的验收，不是任意 caller 组合或全框架认证。
整体 goal 尚未完成；用户要求当前包结束后停止，W3、W4 均未启动。

## 验收范围

机器可读逐行依据和源码 SHA256 见 [engine-runtime-closure.json](engine-runtime-closure.json)。

| 固定范围                    | 证据和适用边界                                                                                                                                                                                                                               |
| --------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 基础控制器                  | 复用 native pointer/Enter ownership 的 36 cases / 222 assertions、138 条控制器记录；新增 `w2-controls-zero-current.json` 12 条。初始 checked Switch、语义 Progress scaleX、原 Next B3/hydration 仅复用实际已证范围，不新增全 host SSR 认证。 |
| Menu/Select/Combobox 指示器 | `w2-indicators-source-final.json` 264 条，真实 Dropdown/Context checkbox/radio 与 Select/Combobox host；插入、异步选择、继承/显式 clock、none、cleanup。Menubar Checkbox/Radio 直接调用相同 Dropdown owners，按源码 delegation 复用。        |
| Select width/flight         | `w2-geometry-complete.json` 的 Select 行与 `w2-select-flight-source-final.json` 24 条；实际 pointer flight、同目标时钟、异步取消、继承/显式 clock、handoff/cleanup。flight 报告中非 Select 文件的历史 hash 不用于声明其已复验。              |
| Tabs/CodeBlock indicator    | `w2-geometry-complete.json` 384 条总矩阵中的对应行；真实 partial projection、两次在途反向、active resize、zero/none。静态装饰分支按真实节点生命周期验收，主交互节点不按 mode 重挂载。                                                        |
| CodeBlock Actions/glyph     | `w2-close-code-actions.json` 60 条最终源码记录，浮动 Actions、两 copy span、expand span；六格、clipboard、hover、clock、重入、反向、卸载。header Actions 静态，不作运动替身。                                                                |
| CodeBlock viewport          | 384 条几何矩阵的实际 partial/clamped height、首两帧、clock/reverse/resize/cleanup；最终生产 fold 和私有 host 探针。                                                                                                                          |
| Sidebar                     | 同一几何矩阵的 actual scalar/onUpdate、异步首两帧、继承/显式 clock、活跃值卸载及 detached output 冻结。                                                                                                                                      |
| Calendar                    | 真实 table WAAPI、受控月份反向、clock、首帧取消、cleanup、稳定月份 reopen；未改 owner 的生产上下文复用此前 W2 Calendar 记录。初始稳定月份没有入场动画。                                                                                      |
| Embla                       | `w2-close-engines.json` 的 loop track/relocation、clock/none、动态 slides、活跃 cleanup；语义 drag 保留，既有 Carousel drag 证据继续有效。                                                                                                   |
| Recharts                    | 最终引擎报告含 8 类 controller-backed series；SVG/data target 含 Line dash、Area reveal clip、默认 dots。首两帧和 terminal reference、实际 clock 应用、活跃 controller 取消与 callback 冻结。最终生产 Chart 路径和 Consumer 回归测试通过。   |
| DocumentEntrance            | 最终引擎报告覆盖 article/section/div 的六格、visible/offscreen、初始 none 后恢复 full 不重放、时钟、settled、cleanup；最终生产真实 article hydration/noJS/print。保留站点明文 blur/clip 特例。                                               |

`w2-close-engines.json` 共 1236 条、几何矩阵 384 条、指示器 264 条、flight 24 条、
Actions 60 条、基础零时钟 12 条，均无 failures/errors。报告链接的 gzip 保留完整原始帧和源码；
每个 requested commit 对应其 paint1/paint2，不丢弃前两帧，不以等待 settled 代替首帧断言。
Radar/Funnel 的新 controller 可稍后启动，因此分别记录首两帧配置和首次实际 clock 应用。

## 实际修复与负例

- Calendar/Embla 旧 writer 的取消移到 committed layout 阶段；Select width 在同目标 clock 变化时停止并使用新 clock，portal flight 使用已提交 controller。
- Tabs/CodeBlock 在 reduced 或 zero clock 下改用静态装饰 indicator；保留主 controls。Sidebar 停止旧 handle 和 MotionValue，jump 清除旧速度，卸载后不再写 detached host。
- Recharts 的八类 series 在 instant 分支使用公开 terminal interpolator，正 clock 按当前 token 积分；不 remount chart，不全局禁止 SVG。
- CodeBlock 将实际渲染高度 clamp 至 closed 下界；source gzip 12063 bytes，仍在 T5 12288-byte 预算内。DocumentEntrance zero 使用 RESTING，已消费的 offscreen entrance 恢复 full 不再隐藏。
- 本次新增 Chart traversal 丢弃 Context.Consumer 的函数 children，真实 Container 用例先失败 1 / 13；`f60e7fe` 保留函数 children，13 / 13 通过，并验证 context 更新及 SVG/text identity。见 `w2-chart-context.json`。

旧源负例保留：`w2-geometry-negative-committed.json` 10 failures、
`w2-engines-negative-final.json` 30 failures、`w2-select-flight-negative.json` 1 failure、
`w2-entrance-offscreen-negative.json` 3 failures，以及初始采证/修复中间报告。
中间报告即使名字含 accepted/final，也不能覆盖此处的最终权威；其失败和原始采样未删除。

## 最终检查与剩余项

`pnpm registry:build`、`pnpm check` 通过，88 files / 723 tests；隔离 Next production build 成功。
最终受影响生产回归 29 / 29，零 skipped/unexpected/flaky，含 Chart、CodeBlock motion-matrix 和
W2 private hosts/noJS/print。此前 273 / 273 是本包历史生产报告，不改写成最终 runtime 的全量重跑。
命令、完整日志与生产附件见 `w2-close-checks.json`、`w2-close-production.json` 及其 gzip。

当前四页 strict initial JS 均失败，见 [w2-close-site-js.json](w2-close-site-js.json)：
Button 293222、Chart 426590、Calendar 318581、CodeBlock 376619 bytes gzip；门槛 120000。
Motion 48 KB、编译后每组件增量 8 KB、中端移动 55 fps、CLS <0.02 仍待实测。
W3/W4 未执行，后续工作须用户明确恢复；不发布、不部署、不新增会话。
