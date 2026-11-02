# W4 最终要求核对

2026-11-02 Asia/Shanghai。起点 `5c9d7f5`，runtime `f60e7fe`，payload `201975a`。
**独立核对交付完成，项目整体 INCOMPLETE。** PASS 仅适用于该行所列有限范围；
FAIL 与 UNPROVEN 继续阻止整体达标。没有迁移、改预算、删功能、发布或部署。

依据：AGENTS、execution-boundary 的固定 W1–W4、parity-plan §2/6/7/8、
overall-design P1–P11/API/build、animation-system §3/6/7/9/11、站点设计 §1–6、
ADR-009/013–017 与 CONTRIBUTING。历史交接中的 OPEN/停止要求以当前执行边界和最终证据为准。

## 要求 → 实现 → 证据 → 状态

| 要求与合同                                                 | 实现                                                                        | 可复核证据与适用范围                                                                                                                                                  | 状态                      |
| ---------------------------------------------------------- | --------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------- |
| 58 正式范围，56 UI +2 compositions                         | registry.json、58篇MDX、previews                                            | w4-verification.json：65 items/58 tier items；registry检查和parity-plan历史B1–B9 gates                                                                                | PASS                      |
| 上游固定pin、exports/slots/defaults、仅增补API             | upstream/manifest.json、各index.tsx、meta.parity                            | parity检查；compatibility-ledger.json 466/466分类；既有有限API/context证据，不是任意caller认证                                                                        | PASS                      |
| React19.0最小兼容、ref/原生事件/context/DOM焦点            | lib/control-animation、press-button、native-div及真实Base owners            | parity-plan B3 follow-up、compatibility-base/collections、press-ownership；W2 Chart Consumer最终回归，适用既有实际host                                                | PASS                      |
| P1/P2共享代码、相对import、镜像install target              | registry/cadence/lib、files.target                                          | registry检查：目标/导入/共享依赖；产品路径自5372576未变                                                                                                               | PASS                      |
| @cadence传递依赖与Base render/cn用户class最后              | registry.json及Base adapters                                                | registry检查、有限API证据；没有新增consumer scaffold/components.json                                                                                                  | PASS                      |
| P11 UI不决定验证                                           | attribute-driven invalid状态，无schema/resolver库或API                      | registry检查及有限API记录；调用方保留数据/验证所有权                                                                                                                  | PASS                      |
| motion声明=实现=文档，token和tier预算                      | lib/motion.ts、registry/frontmatter/contract表、主题token                   | registry检查+38个animated suites运行helper；只证明静态/单元约束，实时运行证据另列                                                                                     | PASS                      |
| full/reduced/none、系统优先、clock0/继承/显式clock         | provider、19 recipes、各writer                                              | W1 zero-clock证据；W2固定11行最终验收；不是任意caller自写Motion程序                                                                                                   | PASS                      |
| 实际首帧/在途取消、反向、cleanup、稳定交互节点             | committed controllers、projection、WAAPI、Embla、Recharts、DocumentEntrance | engine-runtime-closure.md/.json：25最终hash全匹配；1236引擎/384几何/264指示器/24flight/60Actions/12基础记录无failures/errors；最终29生产回归，历史273不冒称最终全重跑 | PASS                      |
| CSS popup/disclosure/loop及站点动画真实生命周期            | Base CSS、主题loops、site Reveal/Chevron/PreviewStack                       | css-lifecycle.md/.json及W2收尾；旧DocumentEntrance OPEN已由W2关闭；原生CSS在途clock不承诺live retiming，none取消独立成立                                              | PASS                      |
| T0结构、尺寸/颜色反馈、动画属性预算及例外                  | 静态parts、geometry.resize、已记录Spinner/Chart/DocumentEntrance例外        | animation-system明文、registry检查、CSS/W2实际路径；没有新动画或例外                                                                                                  | PASS                      |
| MDX数据、章节顺序/成员、响应/性能与数据所有权              | content/components、doc-template、build注入                                 | doc-template.md/inventory和registry检查；结构检查不替代文案语义，当前未改任何组件文案/行为                                                                            | PASS                      |
| 目录filter/URL/history/focus与sidebar持续挂载              | catalog、shared site layout、sidebar                                        | catalog-sidebar.md历史真实交互/模式/双主题；当前相关源码未变                                                                                                          | PASS                      |
| 58页预览primary variant、SSR/noJS、source/install/copy流程 | use-preview-variant、PreviewFrame、CodeFence、PackageManager                | preview-variants.md/matrix：37适用/118选项/21不适用、58页noJS；component-page-flow有限流程、历史batch双主题证据                                                       | PASS                      |
| 指南/AI文本/真实source docs与fence统一                     | 八篇guide、llms、code-fence                                                 | registry-distribution交接、doc-template和fence单元检查；未增加MCP或分发Skill                                                                                          | PASS                      |
| 当前payload/sourceSha准确、冻结字节/清单不变               | public/r、sourceSha f60e7fe、ADR-017                                        | registry检查全部payload freshness/快照hash；w4产品diff空，未为纯工具文档刷新174 sourceSha                                                                             | PASS                      |
| HTTP rewrite/CORS/GET/HEAD/ETag/304/cache安全路径          | app/registry-files、next beforeFiles rewrite                                | registry-distribution-http.json原7生产测试；handler/config未变，payload字节变更由当前freshness覆盖；不推断未配置CDN                                                   | PASS                      |
| initial JS每适用页≤120000 gzip                             | 当前Next生产完整69 HTML页                                                   | W3 138双视口冷加载，0通过，284526–426590；root132767已超门；同build根hash再次对账                                                                                     | FAIL                      |
| initial Motion≤48000 gzip                                  | registry实际10个value API consumer                                          | 参考47294通过；无client production maps，实际Next混合实体不能精确按包gzip分摊；不采用粗暴比例分摊；站点useInView不在该参考合集                                        | UNPROVEN                  |
| 每组件编译增量≤8000，仅排共享runtime                       | 58-entry graph+真实lib/Motion baseline                                      | W4重算全部reachable边（含16动态边），21/58通过、37失败；local-only58/58不是此门；累计async不是首屏量                                                                  | FAIL                      |
| 中端真机≥55fps                                             | 尚无连接设备/呈现trace                                                      | W3 adb空列表；模拟视口/rAF不是呈现fps；用户设备条件问题待答                                                                                                           | UNPROVEN                  |
| CLS<.02冷加载窗口                                          | 导航前observer及最大session window helper                                   | W3全部138记录原shift重算，最大0；档案SHA/长度匹配                                                                                                                     | PASS                      |
| CLS<.02已测交互/滚动窗口                                   | 现有Accordion/Tabs/Select生产页面                                           | w4-interaction-cls.json：3页×双视口，full/OS no-preference、指定操作及15s最终dwell，6/6最大0；保留recent-input样本，计算按标准排除                                    | PASS                      |
| 更广交互/长窗口/真实设备CLS                                | 本轮无完整相应覆盖                                                          | 6窗口及冷加载均不能证明任意浏览终身CLS；未将有限样本作为全站关闭依据                                                                                                  | UNPROVEN                  |
| 原子提交、必要检查、handoff、服务退出与清理                | 本轮工具/proof/status独立提交                                               | w4-checks.json、w4-cleanup.json、最终交接和git log；own3183已停，无新Next目录；仅删除已归档且逐字节相同的本轮缓存日志                                                 | PASS（最终git状态见交付） |

## 证据可信度与变化影响

`node scripts/verify-w4-evidence.mjs` 从真实TS import AST重提registry Motion value集合，
与W3编译脚本逐项相同，实际为10项，修正原报告11的计数。只改报告事实，不改编译输入或测量数字。
它同时解压核验W3两份原始报告、已有raw元数据引用的归档，重算图闭包、站点gzip汇总/CLS，
核验W2最终25个源码hash和W3全部58个组件hash；详细归档清单见JSON。
图测量保留所有公开exports及分支；它不执行full/reduced/none，不能取代W2实际运行证明。

产品源码、站点、content、依赖/lock、Next配置和分发相对5372576均无diff。
本轮没有引入影响API/CSS/W2结论的运行变化，因此按上述源/上下文复用，不重做任意caller矩阵。
生产沿用W2 build `19Ek7XDFoWB78EgcZRqpJ`，未宣称重新build。
初次W4 lint实际发现W3最后状态文档的格式漂移及新报告格式，修复并保留初次失败日志；
最终检查结果以w4-checks.json最后记录为准。

最终依次执行typecheck、lint、registry:check、parity:check、Vitest全部通过，
**88 files /724 tests**，Vitest forks2/min1、RAYON2、Node heap768MB。
未重跑全站冷加载或W2生产矩阵。已有raw元数据引用的58份归档及W3另两份报告均校验长度/SHA。
本轮9份缓存日志92398 bytes先归档、解压核验一致，再按绝对路径/普通文件/hash检查删除；
端口3181/3183/5037结束时无listener。未清理旧记录列出的构建或历史诊断。

## 仍需决定或采证

已向用户发送的A/B/C决策和真机问题继续待答，本轮不重复发问，也不将等待视作批准。
A保持120000及全功能并授权完整Button route hydration/framework原型；
B保持Next/功能并先制定新预算/依赖合同供审阅；C保留合同及失败状态停止架构候选。
没有已证明可达标的新架构。Next精确Motion归因缺少可复用client map，当前数据只支持实体/图归因，
不编造压缩比例；真机FPS、更广CLS仍独立未证。AI25/direction deferred/三exclusions维持原范围。
