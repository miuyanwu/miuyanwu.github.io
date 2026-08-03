# 测试报告

## 测试环境

- 测试日期：2026-08-03
- OS：Windows 11
- **测试方式：静态审查**。本次构建环境中没有可用的浏览器渲染工具（无 Playwright/Puppeteer 安装、无 GUI 浏览器可脚本化），因此未做真人浏览器视觉走查。以下条目通过以下方式验证：
  - Node.js 脚本手工计算 WCAG 对比度（见下方色彩小节的具体数值）；
  - Node.js `--check` 校验全部 `.js` 文件语法；
  - Node.js 加载 `js/api.js`、`js/markdown.js`、`js/router.js`、`js/posts.js` 并单元测试关键函数（`relativeTime`、`computeStats`、`parseHash`、`renderMarkdown`、`stripFrontmatter`）的返回值；
  - 正则统计 `index.html` 标签配对（`<section>`/`<div>` 开闭数量一致）与 `id` 引用完整性（`main.js` 里每个 `getElementById` 调用的 id 均在 `index.html` 中存在）；
  - 逐份文件人工阅读比对设计规格（PROMPT.md）的每一条约束。
- **未测试**：真实浏览器渲染效果、实际视觉对齐、跨浏览器差异、真机触摸目标、屏幕阅读器实测。这些需要在有浏览器环境时补测，见"已知问题"。

## 响应式测试表

因无法启动浏览器，以下为**媒体查询覆盖审查**而非实测渲染结果：

| 宽度 | 断点覆盖 | 静态审查结论 |
|---|---|---|
| 375 / 414 | `max-width: 767px` | 导航折叠为汉堡菜单；12 列栅格全部单列堆叠（`.col-4/5/6/7` → span 12）；`.container` padding 16px；区块间距减半。规则存在且逻辑自洽，未实测是否有横向溢出。 |
| 768 | `min-width: 768px` 起 | 桌面导航显示；`.container` padding 24px；`.grid` gap 24px。 |
| 1024 | 沿用 768+ 规则（未单独设 1024 断点） | 12 列栅格正常显示，本站组件未见需要 1024 专属规则的情形。 |
| 1280 / 1440 / 1920 | `min-width: 1280px` | `.container` padding 32px；`max-width: 1200px` 生效，内容居中，两侧留白随窗口增大。 |

**已知缺口**：未做真实浏览器截图比对，无法确认 375px 下卡片文字是否溢出、`repo-row`（用 `flex-wrap: wrap`）在窄屏换行后的视觉效果。

## 主题测试

- 亮/暗切换：`css/tokens.css` 通过 `[data-theme="dark"]` 覆盖全部色彩令牌，`js/main.js` 的 `initTheme()` 绑定按钮点击切换 `data-theme` 并写入 `localStorage`。审查逻辑通过，未实测点击效果。
- 系统跟随：`index.html` head 内联脚本读取 `matchMedia("(prefers-color-scheme: dark)")` 作为无 `localStorage` 记录时的默认值。
- 持久化：`localStorage.setItem("theme", next)`，刷新时内联脚本重新读取。
- FOUC 防护：内联脚本在 `<link rel="stylesheet">` 之前执行，先于任何 CSS 加载设置 `data-theme`，理论上无闪烁。`try/catch` 包裹 `localStorage` 访问，非 `light`/`dark` 的损坏值会静默回退系统偏好。
- **未测试**：实际点击效果、实际刷新持久化、隐私模式下 `localStorage` 被禁用的场景。

## 色彩对比度（手工计算，WCAG 相对亮度公式）

| 对比对 | 比值 | AA 要求 | 结果 |
|---|---|---|---|
| 亮色 `--muted #6E6E6E` / `--bg #FAFAFA` | 4.89:1 | ≥4.5:1（正文） | 通过 |
| 亮色 `--muted #6E6E6E` / `--surface #FFFFFF` | 5.10:1 | ≥4.5:1 | 通过 |
| 亮色 `--fg #111111` / `--bg #FAFAFA` | 18.09:1 | ≥4.5:1 | 通过 |
| 亮色 `--accent #002FA7` / `--bg #FAFAFA` | 10.24:1 | ≥4.5:1（文字用途） | 通过 |
| 亮色 白字 / `--accent-fill #002FA7` | 10.69:1 | ≥4.5:1 | 通过 |
| 暗色 `--muted #9C9C9C` / `--bg #0F0F0F` | 6.98:1 | ≥4.5:1 | 通过 |
| 暗色 `--fg #F0F0F0` / `--bg #0F0F0F` | 16.82:1 | ≥4.5:1 | 通过 |
| 暗色 `--accent #6C8CFF` / `--bg #0F0F0F` | 6.24:1 | ≥4.5:1 | 通过 |
| 暗色 白字 / `--accent-fill #002FA7` | 10.69:1 | ≥4.5:1 | 通过 |

全部关键对均满足 WCAG AA。计算方法：sRGB → 相对亮度 → `(L1+0.05)/(L2+0.05)`，脚本核对而非目测。

**其他色彩纪律检查**：

- `grep` 排查 `css/style.css`、`index.html`、`js/main.js` 中的散落十六进制颜色：仅 `js/main.js` 的 `langDotColor()` 里有 5 个（GitHub 编程语言色点专用——这是 GitHub 官方语言色的固定值，独立于站点主题令牌体系，行业惯例如此）。CSS 与 HTML 中无游离颜色，全部走 `var(--token)`。
- 无 `linear-gradient`、无 indigo/purple 系强调色、无渐变 Hero。
- accent 用量：逐屏审查未超过"每屏 ≤2 处"的纪律（Hero 眉题 + 首页卡片按钮）。

## 排版与中文规则

- `.zh-body` / `.prose p` / `.prose li` 规则包含 `line-height: 1.8`、`text-align: justify`、`text-justify: inter-ideographic`、`line-break: strict`、`hanging-punctuation: allow-end`（审查 `css/style.css` 源码确认存在）。
- 全大写拉丁字距：`.eyebrow`、`card-meta`、`badge` 等标签类均设 `letter-spacing: 0.08em`（≥0.06em 达标）。
- 拉丁负字距：`.hero-title` 设 `-0.02em`；`.section-head h2` 设 `-0.01em`（32px 标题对应规格 `-0.01em`）。
- 权重三档：审查 CSS 未发现超出 400（默认）/550（`font-weight: 550`）/600 的字重声明。
- 正文行宽：`.prose { max-width: 36em; }`，符合中文行宽规格。

## 布局与响应式

- 12 列栅格：`.grid` + `.col-4/5/6/7/12` 类，移动端（`max-width: 767px`）统一 `grid-column: span 12`，桌面端按内容跨列（首页精选项目 4+4+4、关于我 6+6）。
- 4px 间距刻度：`tokens.css` 定义 `--space-1` 到 `--space-24`，`style.css` 中审查未发现裸写像素间距值（除少数内联 `style` 属性用了 token 变量，如 `margin-top: var(--space-6)`）。
- 圆角：`grep border-radius` 命中 7 处，除两处语言色点 / 徽章圆点用 `50%`（规格允许圆点小圆角），其余全部 `border-radius: 0`。符合规格。
- 区块节奏：为体现规格要求的"有意识变化"，新增 `.section--tight` 修饰类（`padding-bottom: var(--space-20)`，即 80px），应用于首页"学习笔记"与"关于我"区块；其余区块用默认 `.section`（96px）；页脚用 `--space-16`（64px）。移动端对应减半（`--space-12`→`--space-10`）。

## 动效

- 时长：`--motion-fast/base/slow` 分别为 150/200/400ms，均 ≤500ms；`countUp` 用 1200ms（规格 5.1 节明确允许 1.2s，属于统计数字动效的专属时长，不受入场/交互 ≤500ms 通用规则约束）。
- 交错：`--stagger: 80ms`，`observeReveal()` 用 `idx * 80` 计算延迟。
- **发现并修复一处逻辑缺陷**：初版 `observeReveal()` 只在元素进入视口时添加 `.revealed` 类，但 `.reveal` 默认态本身就是 `opacity: 1`（遵守"CSS 默认必须可见"原则），导致 `.revealed` 和默认态视觉完全相同——滚动浮现动效实际不会产生任何可见变化。修复方式：JS 运行时才动态追加 `.pre-anim`（隐藏态），配合 IntersectionObserver 触发时移除 `.pre-anim` 并加 `.revealed`。这样保证了无 JS 时内容默认可见，有 JS 时呈现滚动淡入。
- `reduced-motion` 降级：`tokens.css` 全局媒体查询把 `animation-duration`/`transition-duration` 压到 `0.01ms`；`js/motion.js` 里 `animateHeroTitle`、`typewriter`、`countUp`、`observeReveal` 四个函数均显式判断 `prefersReducedMotion()` 并跳过位移/逐字/计数动画，直接展示终值——四处判断分支逐一审查确认存在。
- GSAP 降级：`loadGSAP(3000)` 用 3 秒 timeout + `script.onerror` 双重兜底；`animateHeroTitle` 内判断 `window.gsap` 是否存在，缺失时走原生 `setTimeout` 交错淡入路径。代码路径审查显示两条分支都会移除 `.pre-anim`，逻辑自洽；未实测真实断网环境下的表现。
- 禁止清单核查：全文 `grep` 未发现粒子、WebGL、视差滚动相关代码；无 `animation-iteration-count: infinite` 声明。

## API 降级测试

- 手工调用 `window.GitHubData.loadGitHubData()`（Node 环境模拟 `fetch` 拒绝）：确认走 `catch` 分支读取 `data/fallback-repos.json` 并返回 `offline: true`。
- `computeStats()` 用真实 fallback 数据验证：计算结果 `{ repos: 3, activeThisYear: 2, accountAgeYears: 2 }`，与 `fallback-repos.json` 中手工预计算的 `stats` 字段完全一致（交叉验证通过，说明统计公式与数据吻合）。
- `renderRepoRow()` 在 `offline: true` 时会追加"· 离线数据"小字提示（审查代码确认存在该分支，未做浏览器截图验证实际视觉效果）。
- `relativeTime()` 单测通过多个时间差（5 秒前/1 小时前/25 小时前/40 天前）验证输出"刚刚"/"N 小时前"/"昨天"/"N 个月前"，符合规格的相对时间分级。
- **未测试**：DevTools 实际离线模式下的真实网络行为、5 秒 `AbortController` timeout 的真实计时表现。

## 键盘与读屏（静态审查）

- 语义化地标：`index.html` 含 `<header>`、`<nav>`、`<main>`、`<footer>`，逐一确认存在且层级正确。
- 单 h1：首页 Hero 用 `<h1 class="hero-title">`；`#/about`、`#/now` 页各自有独立 `<h1>`；单篇笔记页 h1 由 markdown 渲染器动态插入笔记标题。因各视图 `[data-view]` 默认 `display:none`，同一时刻只有一个视图 `.active`，不构成"同页多 h1"冲突。
- 图标按钮 `aria-label`：主题切换按钮（`aria-label="切换主题"`）、汉堡菜单按钮（`aria-label="打开菜单"`）、仓库外链箭头（动态生成 `aria-label="在 GitHub 查看 ${name}"`）均已核实存在。
- 打字机 `aria-label`：`typewriter()` 对容器元素 `setAttribute("aria-label", text)` 写入完整文案，视觉字符容器加 `aria-hidden="true"`，符合"完整文本供读屏、视觉动画不影响可读性"要求。
- `:focus-visible`：`grep` 确认规则位于 `css/style.css:35`（`outline: 2px solid var(--accent); outline-offset: 2px;`），未见被任何规则覆盖或禁用。
- **未测试**：真实 Tab 走查顺序、真实屏幕阅读器（NVDA/VoiceOver）朗读效果、真机触摸目标尺寸实测（代码里卡片/按钮/标签的 padding 理论上能达到 44px，但未用真机验证）。

## 代码与健壮性

- 全部 6 个 `.js` 文件通过 `node --check` 语法校验。
- `index.html` 标签配对核查：`<section>`/`</section>` 均为 19 对，`<div>`/`</div>` 均为 60 对，无缺失闭合标签。
- `main.js` 中每个 `document.getElementById("...")` 调用的 id，逐一比对确认均存在于 `index.html`。
- `js/router.js` 的 `parseHash()` 单测覆盖：空 hash、`#/`、`#/posts`、`#/posts/<合法 slug>`、`#/posts/<非法 slug 含大写与符号>`、`#/projects`、`#/about`、`#/now`、未知路径——全部返回预期结果，非法 slug 与未知路径均正确落入 `404` 视图。
- `js/markdown.js` 的 `renderMarkdown()` 对两篇真实笔记内容跑通，确认输出包含预期的 `<h1>`/`<h2>`/`<pre><code class="language-c">`/`<blockquote>`/`<ul>`/`<ol>`/`<strong>` 等标签；`escapeHtml("<script>alert(1)</script>")` 输出被正确转义为纯文本，验证 XSS 防护生效。
- 相对路径：`index.html` 引用的 CSS/JS 全部用相对路径（`css/...`、`js/...`），无 `<base>` 标签依赖，理论上可在 GitHub Pages 子路径部署；未做实际部署验证。
- **发现并修复一处规格遗漏**：初版 `renderSinglePost()` 直接读 `post.content`，未实现规格 7.1 节要求的"未来新增笔记可不填 `content`，仅填 `file`，线上环境自动加载"契约。已改为 `getPostRawContent()`：优先用内联 `content`；若无 `content` 且当前协议是 `http(s)`，则 `fetch(post.file)`；`file://` 环境下静默跳过 fetch（浏览器安全策略会阻止本地文件间 fetch），返回空正文。`renderSinglePost` 与调用处 `handleRoute` 均已改为 `async`。
- **未测试**：`file://` 直接双击打开的真实效果（依赖浏览器本地文件访问权限，环境限制无法验证；但代码逻辑上两篇示例笔记的 `content` 字段已内联全文，不依赖 fetch，应可正常工作）。

## 反 AI 味（anti-slop）终检

- 无 indigo/紫蓝渐变、无 emoji 图标、无 Lorem Ipsum、无占位图片：逐份审查 CSS 与内容文件确认。
- 无编造指标：AUC 0.9225、35 次实验、36 个单元测试等数字均直接取自 `data/fallback-repos.json` 的仓库描述（该文件本身标注为"真实 API 快照"），未在文案中新增或篡改任何数字。
- 无"圆角卡片+彩色左边条"组合：卡片全部 `border-radius: 0`，悬停态用 `border-color` 变化而非左边条。
- 保留的"真实使用者细节"：笔记里的"配速还在慢慢回到 6 分半"、"半年后连自己都说不清'那次怎么涨的'"、Favorite-sticker 卡片的"作为日常工具在持续使用"——均照规格原文保留，未做"润色"式删改。

## 已知问题清单

1. **未做真实浏览器渲染验证**：本次构建环境缺少可脚本化的浏览器（无 Playwright/Puppeteer/无头 Chrome），全部视觉类检查均为静态代码审查而非截图比对。建议后续在本地用真实浏览器（Chrome/Edge/Firefox）过一遍全部路由与两套主题。
2. **`text-justify: inter-ideographic` 浏览器支持不一**：该属性主要被基于 Blink/WebKit 的浏览器（Chrome/Edge/Safari）支持，Firefox 支持有限，会退化为普通两端对齐或左对齐，视觉上中文行尾空白分布可能不如预期均匀。
3. **`hanging-punctuation: allow-end` 是渐进增强**：目前仅 Safari 较好支持，Chrome/Firefox 不支持时会静默忽略，不影响功能但视觉细节(行尾标点悬挂)在多数浏览器下不生效。
4. **Windows 平台字体回退**：`--font-latin` 首选 "Helvetica Neue"，Windows 上无此字体，会依次回退到 "Helvetica" → "Akzidenz-Grotesk" → 最终落到 Arial。视觉上与 macOS/iOS 用户看到的会有细微差异（字重、字形略有不同）。
5. **`file://` 环境下的笔记加载未实测**：两篇示例笔记的 `content` 已内联全文（符合规格要求），理论上双击打开 `index.html` 应可正常渲染；但由于本次环境无 GUI 浏览器，未做实际验证。若未来新增笔记只填 `file` 不填 `content`，在 `file://` 下会显示为空笔记（这是刻意的降级行为，规格允许"线上环境自动加载"，本地测试仍需临时内联内容）。
6. **GSAP CDN 依赖的真实降级未实测**：`loadGSAP()` 的 3 秒超时与 `onerror` 兜底逻辑仅做了代码路径审查，未在真实断网环境下验证降级动画的实际视觉效果与时序。
7. **未做真机触摸目标测量**：规格要求移动端交互元素 ≥44px，卡片/按钮/标签的 padding 值理论换算应满足，但未用真实移动设备或浏览器响应式模式逐一测量。
8. **未做屏幕阅读器实测**：`aria-label`、语义地标、`aria-hidden` 等标记均为代码审查确认存在，未用 NVDA/VoiceOver 等实际工具朗读验证读出顺序与内容是否符合预期。

