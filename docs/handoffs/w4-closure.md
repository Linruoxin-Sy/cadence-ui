# W4 最终交接：核对已交付，整体仍未达标

2026-11-02，D:/Code/Project/cadence-ui，PowerShell。唯一实施者，无子代理、后继会话、
push/发布/部署。协调会话核实completed/idle、git clean及服务退出后再决定后续。
整体目标保持ACTIVE/INCOMPLETE，不能因W4核对交付完成而标记项目完成。

## 权威入口与提交

先读实际AGENTS、project-status、execution-boundary、
[W4要求对照](../evidence/w4-verification.md)及其JSON，不从历史handoff的OPEN重建待办。

- 起点 `5c9d7f5`，产品runtime `f60e7fe`，payload `201975a`、sourceSha f60e7fe。
- 工具 `e09a058`：有限生产交互CLS采样器、retained evidence源码/图/归档对账。
- 证据 `f9db6f3`：逐要求PASS/FAIL/UNPROVEN表、机器对账、生产CLS、检查/清理归档；
  修正W3的11→10个registry Motion value API，站点useInView明确在参考合集范围外。
- 本交接与project-status/execution-boundary/parity更新单独提交；最终SHA以git log为准。

本轮不改registry/content/shipped source/site runtime/依赖/Next配置/payload，
不机械重建174 sourceSha。上游pin96da9cc7f1aa10580a3741664e2a77c721206c00、
冻结snapshot84cc78703b354b29c815c3970cb26973e4760dea398fdf48756b8a24c996b2f1及清单/attributes不变。

## 实际核对与检查

W2最终25个source hash、W3全部58组件hash匹配；466有限API条目已分类。
W3两份原始归档及已有raw元数据引用的58份归档均重新解压核验长度/SHA。
W3 graph闭包重算包含16动态import边，排除实际baseline，保留专用/async依赖，21/58结论一致。
全部138冷加载记录重新核算gzip与CLS，当前build root文件hash逐条匹配。
有限历史API/CSS/站点/分发按其源码与实际断言范围复用，没有重开任意caller/全框架矩阵。

W4完整检查链按typecheck→lint→registry:check→parity:check→Vitest串行全部通过，
88 files/724 tests，forks2/min1、RAYON2、NODE_OPTIONS768MB。
初次lint发现W3最后状态文档的format漂移及新报告format，已修复，初次失败日志仍归档。
所有完整日志见w4-checks.json指向的gzip。没有新产品build，复用W2
`.next-motion-runtime`，build ID19Ek7XDFoWB78EgcZRqpJ。

新增生产Accordion/Tabs/Select×桌面/移动模拟6窗口，full/OS no-preference，
打开/内容追加/选择/尺寸/滚动与最后15秒dwell，6/6 CLS0。
71条原shift均保留、均带recent-input，标准CLS按规则排除；未删样本或把瞬时reflow叫CLS失败。
这不证明其他页面/模式、任意长时间浏览、真机或FPS。
复现 `node scripts/audit-w4-interaction-cls.mjs http://127.0.0.1:3183`（先确认端口空闲，
设CADENCE_DIST_DIR=.next-motion-runtime、PLAYWRIGHT_CHANNEL=msedge，复用Next start）。
`node scripts/verify-w4-evidence.mjs`可独立重算静态/归档证据；生成JSON后按Biome格式化。

## 仍阻止整体完成的真实缺口

| 要求                                  | 状态                                                                           |
| ------------------------------------- | ------------------------------------------------------------------------------ |
| initial JS≤120000                     | FAIL，138/138失败，284526–426590；root132767                                   |
| initial Motion≤48000                  | UNPROVEN（Next生产精确归因）；registry参考consumer47294通过，m/domMax49621拒绝 |
| component added≤8000，仅排共享runtime | FAIL，21/58通过37失败；local-only58/58不是完整门                               |
| 真中端移动≥55fps                      | UNPROVEN，无设备/呈现trace                                                     |
| CLS<.02                               | PASS仅冷加载138及本轮指定6交互窗口；更广交互/长窗口/真机UNPROVEN               |

没有production client source maps或其他可复用精确包压缩归因数据；不做混合chunk gzip比例分摊。
本轮没有打开新架构候选、迁移、调整预算、删功能或新增依赖豁免。

## 下一步必须依据既有用户问题的回答

协调已问A保留120000和全功能、授权完整Button route hydration/framework原型；
B保留Next/功能、先制定新预算/依赖合同供审阅；C保留现合同及失败状态、停止架构候选。
本实施者未收到答复，不代选、不重复问、不将等待当批准。真机条件问题也仍待答。
收到明确选择后仅推进对应有授权的步骤；若提供设备，按W3真机协议采证。
没有回答时，交付当前红项即可，不自行创建W5或无限实验，也不以新的兼容/功能任务取代收束。
AI25未排期、direction deferred、form/native-select/sonner exclusions维持原决定。

## 服务和清理

本轮唯一Next3183已实际停止，结束核验3181/3183/5037无listener；没有启动ADB。
9份W4日志92398 bytes已全部无损归档并解压逐字节验证，再逐文件解析绝对workspace路径、
检查普通文件与SHA，使用原生PowerShell删除重复日志；清单见w4-cleanup.json。
没有新Next构建目录；未重做已完成的48build/20cache历史清理。
保留所有必要负例/证据gzip/可复现脚本、固定上游缓存、React19 consumer fixture、
`.next-motion-runtime`及`.cache/basic-controls-exploratory-20261102.tar.gz`；未触碰用户.next/3000。
最终git clean与SHA在实施者final及协调复核中给出。
