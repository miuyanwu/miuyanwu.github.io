# Elysia10032 个人博客

纯静态个人博客，零构建、零框架、零后端。写给未来的博主本人（也就是你）。

## 添加一篇笔记

1. 在 `content/posts/` 新建 `<slug>.md`，frontmatter 格式：

   ```markdown
   ---
   title: "笔记标题"
   date: 2026-08-10
   tags: ["标签1", "标签2"]
   ---
   正文从这里开始……
   ```

   `slug` 用全小写 ASCII + 连字符（如 `my-new-note`）；`tags` 填 1–3 个中文名词，会自动出现在筛选栏。

2. 打开 `js/posts.js`，在 `POSTS` 数组里加一条记录：

   ```js
   {
     slug: "my-new-note",
     title: "笔记标题",
     date: "2026-08-10",
     tags: ["标签1", "标签2"],
     file: "content/posts/my-new-note.md",
     // content 字段可以不填！线上环境会自动从 file 加载。
   }
   ```

   注：本地 `file://` 直接打开预览时，因为浏览器不允许本地文件间 fetch，需要临时把 md 全文粘进 `content` 字段（照抄现有两篇笔记的写法）才能看到内容；线上（GitHub Pages，`http(s)://`）环境下 `file` 字段会自动生效，不填 `content` 也没问题。

3. 本地预览确认无误。
4. `git add` / `commit` / `push`。

## 修改主题色

只改 `css/tokens.css` 里两处 `--accent`（`:root` 亮色一处，`[data-theme="dark"]` 暗色一处）。

改完务必用浏览器 DevTools 的对比度检查器（Elements 面板 → 选中文字元素 → Styles 里颜色色块旁会有 contrast ratio）确认：

- 正文文字对比度 ≥ 4.5:1
- 大字号（32px+）文字对比度 ≥ 3:1

不要改动其他令牌值（字号、间距、断点等），它们互相之间有比例关系。

## 更新 GitHub 数据兜底

当仓库有变化（新建/改名/描述更新）后：

1. 浏览器打开 `https://api.github.com/users/miuyanwu`，复制返回的 JSON；
2. 浏览器打开 `https://api.github.com/users/miuyanwu/repos?per_page=100`，复制返回的 JSON；
3. 按 `data/fallback-repos.json` 现有结构（`user` / `repos` / `stats` 三节）整理进去；
4. 手动重新计算 `stats`：
   - `repos`：非 fork 的公开仓库数；
   - `activeThisYear`：今年有过 push 的仓库数（看 `pushed_at` 的年份）；
   - `accountAgeYears`：`(今年 - created_at 年份)`。

## 本地预览

直接双击 `index.html`，零依赖打开。

或者用本地服务器（推荐，笔记 `file` 字段的 fetch 逻辑需要 http 环境才生效）：

```bash
python -m http.server 8000
```

然后访问 `http://localhost:8000`。

## 部署到 GitHub Pages

1. 推送本目录到 `miuyanwu.github.io` 仓库（或任意仓库）；
2. 仓库 Settings → Pages → Source 选 "Deploy from a branch"；
3. 分支选 `main`，目录选 `/`（root）；
4. 保存后访问 `https://<用户名>.github.io/` 或 `https://<用户名>.github.io/<仓库名>/`。

本站全部用相对路径 + hash 路由，任意子路径下都能正常运行。若要绑定自定义域名，在同一个 Settings → Pages 页面的 "Custom domain" 里填写即可。

## 主题机制

页面顶部导航右侧的太阳/月亮按钮手动切换亮暗主题；未手动选择时跟随系统 `prefers-color-scheme`；选择结果记在 `localStorage`，刷新后保持。
