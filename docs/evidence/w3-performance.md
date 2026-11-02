# W3 性能测量与决策报告

2026-11-02，唯一实施会话；产品 runtime `f60e7fe`，保留的 Next production
build ID `19Ek7XDFoWB78EgcZRqpJ`。本轮不改产品源码、依赖、框架、功能合同或预算。
用户已恢复 W3；旧 handoff 的停止条件与清理受阻描述已由最新指令和 `5372576` 覆盖。

## 最终五门状态

| 门                             | 结果                                                                  |
| ------------------------------ | --------------------------------------------------------------------- |
| 全部适用页initial JS≤120000    | **失败**：69页×2视口=138记录，0符合；284526–426590 bytes gzip         |
| initial Motion≤48000           | 参考consumer编译47294符合；Next生产混合实体的精确分摊**仍未证**       |
| 每组件增量≤8000，排共享runtime | 依赖计入21/58符合、37/58超限；仅自有编译代码58/58符合，不能替代完整门 |
| 真中端移动≥55fps               | **未证**：无连接设备或原始trace                                       |
| CLS<.02                        | **冷加载范围符合**：138/138，最大0；交互/长窗口/真机未证              |

最终完整检查88 files /724 tests通过，另最终helper两测试通过；工具提交`7242346`。
沿用W2已验证production构建，无产品改动，未机械重建payload。原始日志见w3-checks.json。
完整collector运行中使用早期内联CLS计算；最终helper修正边界后，summary重新计算全部原始shift并
断言与原始结果一致。所有样本结果为0，这一修正未改变本轮结论。

## 测量协议与复现

`scripts/audit-w3-site.mjs` 从 production prerender manifest 枚举 69 个 HTML 页面：
首页、组件目录、58 个组件页、指南目录和八篇指南。排除两个错误端点及 robots/sitemap，
不把分发 JSON/XML 当 HTML 页面。两条独立 browser lane 对应桌面 1280×720 与移动模拟
390×844，每个页面均新建 Edge 进程，CDP 禁缓存，不交互、不滚动、不拦请求。
沿用 load + networkidle + 10s + networkidle，所有自动脚本逐绝对 URL 去重，
解码 body 后逐实体 gzip6，保留 status/hash/initiator/errors、BUILD_ID 和根 manifest 核对。
collector 额外接收 `.js/.mjs` 响应，避免预加载 JS 的 resourceType 不是 Script 时漏计。
没有隐藏 inline/data 内容、移动功能到观察窗后或排除自动异步实体。

CLS observer 在导航前注册，保留所有 layout-shift 的时间、分数、recent-input 和 source rect。
按 1 秒间隔、最长 5 秒的最大 session window 计算。证据仅覆盖冷加载窗口，不证明交互、
长时间浏览、真实手机或所有外部字体/网络状态下的 CLS。移动模拟与桌面相同机器，不能证明移动 FPS。

```powershell
$env:CADENCE_DIST_DIR='.next-motion-runtime'
$env:CADENCE_RUNTIME_SOURCE='f60e7fe'
$env:PLAYWRIGHT_CHANNEL='msedge'
# 确认端口空闲后启动；不重建或修改用户 .next/3000
pnpm exec next start --port 3183
# 另一终端，复用同一构建；预计约 15 分钟，两条独立浏览器 lane
node scripts/audit-w3-site.mjs http://127.0.0.1:3183 .cache/w3-site.json
node scripts/audit-w3-bundles.mjs
node scripts/summarize-w3.mjs
```

全站 audit 只要 JS 或 CLS 有失败便 exit1；bundle 工具输出测量，不以工具 exit0 表示预算通过。
summary 要求 69×2 唯一记录，原始 site/bundle 报告无损 gzip 并解压逐字节核验。
汇总与原始 hash 见 [w3-performance.json](w3-performance.json)。

## Initial JS 归因与候选

当前五个必载 root 实体 gzip6 分别为 1979、8756、72047、45595、4390 bytes，
合计 **132767 bytes**，比整页 120000 门槛多 12767。每页都核验其实际网络响应与磁盘 hash。
这不是通用 Next 数学下限，只证明本构建在加载任何组件前就已超限。
历史 root 的 renderer/router markers 与当前 hash 一致；不能把整个混合 chunk 的 gzip 称为某个
独立 package 的贡献，也不能凭 package.json 的 stable React 版本声称 Next 使用该 renderer。

本轮选择一个具体公开 API 候选：实际 Motion API 合集与 `m + LazyMotion/domMax` 同条件编译。
原 API 合集 **47294 bytes gzip**，候选 **49621**，增加 **2327**，因此拒绝采纳。
没有为更小数据改用缺少 layout/drag 的 domAnimation，也没有更改任何组件。
旧 Pages/SSR/fence 实验继续复用，不重跑：Pages 真 ButtonPreview168699；SSR lean112220，
加真 fence135334；feature-split fence120492，加必需 PackageManager136462。
这些不是完整站点，仍不能作为迁移达标证明。

## Motion 与组件编译增量

使用现有工具链中的 esbuild0.28.2，无新增依赖；production minify、ES2020、ESM、React/
ReactDOM external。保留 registry 每个公开 value export，避免只测一个最小部件。
Motion 取 registry/cadence 源码实际使用的 10 个 value API，包括 motion、animate、LayoutGroup、MotionConfig、
useMotionValue/useTransform/useAnimationControls、frame/cancelFrame/cubicBezier。
站点 DocumentEntrance 独用的 useInView 不在此 registry consumer 合集中；这不是全站 Motion API 集合。
47294 是该参考 consumer 编译的 runtime 值，距 48000 仅 706 bytes；**参考编译符合门槛**。
Next 实际把包混入多个实体，没有 production source map，此值不冒称实际页面 Motion chunk
分摊 gzip 的精确认证；该生产口径仍未证，分块压缩也可能消耗这 706 bytes 余量。

组件用 58-entry splitting graph，再加实际 Cadence lib 全部导出和上述 Motion 的 shared baseline。
每项从其完整 reachable outputs 中只排除 baseline reachable outputs；保留专用依赖、组合用的
其他组件和 emitted async outputs，逐实体 gzip6。baseline 自身60368 bytes，其中也有 cn/
Tailwind merge/共享 helper 等，不能把它全部叫 Motion。图中一个 output 可供多组件共享，
各组件数字是相同基线之上的独立添加成本，**不能跨组件相加**。

在此明确的依赖计入方案中，**21/58 符合，37/58 超限**。Button6372，Chart118999，
Calendar32164，CodeBlock198321。CodeBlock 的累计可达增量含按需加载的 Shiki grammars，
其数字不是首屏请求量。metafile 可区分 initial/dynamic edges；原始 module bytes 不是可相加 gzip。
例如 CodeBlock 图中的 @shikijs/langs 编译 raw bytes 合计1030203，说明专用高亮代码的重要性，
不是“该包首屏占用1MB”或“该包gzip贡献”的结论。

另提供全部 imports external 的单模块编译对照：**58/58 ≤8000**，最大 CodeBlock4643、
Sidebar4039、Select3171、Chart3059。它排除了所有依赖，只证明本地组件代码；不能据此关闭
“仅排共享 runtime”的完整增量门，也不等于历史 source tier gzip 门。
当前未定义第三方依赖均豁免的规则，本轮不静默增加豁免。若维护者希望预算只约束组件自有代码，
需要明确修改指标合同；现有依赖计入口径下保留失败。

## 真实设备帧率缺口

本机可执行 `D:/Software/platform-tools/adb.exe`；`adb devices -l` 无连接设备。
尚无设备型号、SoC/GPU、系统、浏览器版本、刷新率、热状态或原始 trace，不能证明 ≥55fps。
本轮已向用户询问真实设备条件；没有将等待或桌面移动模拟当作用户答复或授权。

可复现采证要求：用确定的中端真机（记录上述信息，至少60Hz、关闭节能、无 CPU 仿真），
经 `adb reverse tcp:3183 tcp:3183` 访问相同 production build，远程 DevTools 记录原始 performance
trace。记录 full 模式的 Button 连续按压、Tabs 换项、Accordion 反向、Select 展开/选择、
CodeBlock 展开与 tabs、Chart 数据更新和 Carousel 切换；分别标记有效运动窗口并重复三次，
同时保留 reduced/none 行为对照。不能用静止时长稀释低帧率窗口。
依据真实呈现帧/掉帧计算 FPS，保存 frame timelines、任务/paint/compositor 事件、操作和源码
hash；requestAnimationFrame 回调频率单独不足以证明呈现 FPS。每个有效窗口需 ≥55fps，
不以桌面 CPU throttle 或缺帧 trace 宣称通过。

## 可 review 的决策与影响

现有框架的 mandatory root 已超整页预算；当前 Motion 候选反而变大。没有证据支持继续修改
组件直到整个 Next 页面自动降到120000。本轮结束候选实验，不采纳 ADR-016 或修改 ADR-009。

需要用户确定约束优先级，三条具体路径均不是本轮自动授权的产品变更：

1. 保持120000和全部功能，授权重新设计文档 hydration/framework 边界。先产出完整 Button
   route 原型，再决定是否迁移；原型必须保留 header/sidebar、搜索/导航、四包管理器安装与复制、
   source/code view、真实 preview、SSR/noJS、focus/a11y、主题和 full/reduced/none/clock，
   通过相同计量后才讨论覆盖其余68页。旧精简 SSR 候选已失败，因此不能承诺这条路线达标。
   影响含 RSC/MDX renderer、React Compiler、路由/元数据/assets、8指南/58组件页面、
   immutable registry HTTP/CORS/ETag/缓存与现有生产测试；冻结快照保持不动。
2. 保持 Next 与功能，用户明确批准重订性能预算或依赖计入合同。应以本轮全站分布及依赖图制定，
   单独 ADR 并更新测试；**本轮未抬门槛，也未建议用一个拍脑袋的新数字掩盖失败**。
3. 保持所有现合同，接受此刻性能验收未完成，停止新的无依据候选，不把决策报告当作通过。

无论选哪条，真机 FPS 与交互/长窗口 CLS 仍需独立证据。W4 可独立核对已有目标、提交和
清理状态，但必须保留 W3 红项，不能宣称项目整体完成。
