// js/main.js —— 组装：路由挂载、主题切换、标签筛选、分页、事件委托

let githubDataCache = null;

function initTheme() {
  const btn = document.querySelector(".theme-toggle");
  if (!btn) return;
  btn.addEventListener("click", () => {
    const html = document.documentElement;
    const current = html.getAttribute("data-theme") || "light";
    const next = current === "light" ? "dark" : "light";
    html.setAttribute("data-theme", next);
    try { localStorage.setItem("theme", next); } catch (e) {}
  });
}

function initMobileNav() {
  const toggle = document.querySelector(".nav-toggle");
  const menu = document.querySelector(".mobile-menu");
  if (!toggle || !menu) return;
  toggle.addEventListener("click", () => {
    const isOpen = menu.classList.toggle("open");
    toggle.setAttribute("aria-expanded", String(isOpen));
  });
  menu.querySelectorAll("a").forEach((a) => {
    a.addEventListener("click", () => menu.classList.remove("open"));
  });
}

async function getGitHubData() {
  if (githubDataCache) return githubDataCache;
  githubDataCache = await window.GitHubData.loadGitHubData();
  return githubDataCache;
}

function langDotColor(lang) {
  const map = { "C#": "#178600", Python: "#3572A5", JavaScript: "#f1e05a", HTML: "#e34c26", CSS: "#563d7c" };
  return map[lang] || "var(--accent)";
}

function renderRepoRow(repo, offline, showBadge) {
  const badge =
    showBadge && repo.status === "in-progress"
      ? '<span class="badge badge-progress"><span class="badge-dot"></span>进行中</span>'
      : showBadge && repo.status === "done"
      ? '<span class="badge badge-done"><span class="badge-dot"></span>已完成</span>'
      : "";
  const langHtml = repo.language
    ? `<span class="repo-lang"><span class="repo-lang-dot" style="background:${langDotColor(repo.language)}"></span>${window.Markdown.escapeHtml(repo.language)}</span>`
    : "";
  const desc = repo.description || (repo.name === "miuyanwu" ? "Profile README" : "");
  return `
    <div class="repo-row reveal">
      <span class="repo-name">${window.Markdown.escapeHtml(repo.name)}${repo.full_name === "miuyanwu/miuyanwu" ? ' <span class="repo-offline-tag">Profile README</span>' : ""}</span>
      ${langHtml}
      <span class="repo-desc">${window.Markdown.escapeHtml(desc)}</span>
      ${badge}
      <span class="repo-time">${window.GitHubData.relativeTime(repo.pushed_at)}${offline ? ' <span class="repo-offline-tag">· 离线数据</span>' : ""}</span>
      <a href="${repo.html_url}" target="_blank" rel="noopener noreferrer" aria-label="在 GitHub 查看 ${window.Markdown.escapeHtml(repo.name)}">
        <svg class="repo-link-arrow" viewBox="0 0 16 16" fill="none" aria-hidden="true"><path d="M4 12L12 4M12 4H6M12 4V10" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>
      </a>
    </div>`;
}

async function renderHero() {
  const heroTitle = document.querySelector(".hero-title");
  const heroSubtitle = document.querySelector(".hero-subtitle");
  if (heroTitle && !heroTitle.dataset.animated) {
    heroTitle.dataset.animated = "1";
    window.Motion.animateHeroTitle(heroTitle);
  }
  if (heroSubtitle && !heroSubtitle.dataset.animated) {
    heroSubtitle.dataset.animated = "1";
    window.Motion.typewriter(heroSubtitle, "重庆邮电大学 · 生物医学工程 × 人工智能", 45);
  }

  const data = await getGitHubData();
  const statEls = {
    repos: document.getElementById("stat-repos"),
    active: document.getElementById("stat-active"),
    age: document.getElementById("stat-age"),
  };
  if (statEls.repos && !statEls.repos.dataset.counted) {
    statEls.repos.dataset.counted = "1";
    window.Motion.countUp(statEls.repos, data.stats.repos, 1200);
  }
  if (statEls.active && !statEls.active.dataset.counted) {
    statEls.active.dataset.counted = "1";
    window.Motion.countUp(statEls.active, data.stats.activeThisYear, 1200);
  }
  if (statEls.age && !statEls.age.dataset.counted) {
    statEls.age.dataset.counted = "1";
    window.Motion.countUp(statEls.age, data.stats.accountAgeYears, 1200);
  }
}

async function renderRecentPushes(containerId, limit) {
  const container = document.getElementById(containerId);
  if (!container) return;
  const data = await getGitHubData();
  const sorted = [...data.repos]
    .filter((r) => !r.fork)
    .sort((a, b) => new Date(b.pushed_at) - new Date(a.pushed_at))
    .slice(0, limit);
  container.innerHTML = sorted.map((r) => renderRepoRow(r, data.offline, true)).join("");
  window.Motion.observeReveal(container);
}

function sortedPosts() {
  return [...window.POSTS].sort((a, b) => new Date(b.date) - new Date(a.date));
}

function renderPostRow(post) {
  const tagsHtml = post.tags.map((t) => `<span class="tag">${window.Markdown.escapeHtml(t)}</span>`).join("");
  return `
    <div class="post-row reveal" data-tags="${post.tags.join(",")}">
      <span class="post-date">${post.date}</span>
      <a class="post-title" href="#/posts/${post.slug}">${window.Markdown.escapeHtml(post.title)}</a>
      <span class="post-tags">${tagsHtml}</span>
    </div>`;
}

function renderHomePosts() {
  const container = document.getElementById("home-posts-list");
  if (!container) return;
  const posts = sortedPosts().slice(0, 5);
  container.innerHTML = posts.map(renderPostRow).join("");
  window.Motion.observeReveal(container);
}

const POSTS_PER_PAGE = 6;
const TAGS_VISIBLE_COUNT = 6;

const postsPageState = { activeTag: "all", page: 1 };

function renderPostsPage() {
  const listEl = document.getElementById("posts-full-list");
  const filterEl = document.getElementById("posts-tag-filter");
  const paginationEl = document.getElementById("posts-pagination");
  if (!listEl) return;

  const posts = sortedPosts();
  const allTags = [...new Set(posts.flatMap((p) => p.tags))];

  function renderTagFilter() {
    if (!filterEl) return;
    const visibleTags = allTags.slice(0, TAGS_VISIBLE_COUNT);
    const hiddenTags = allTags.slice(TAGS_VISIBLE_COUNT);
    const tagBtn = (label, tagValue, active, extraClass) =>
      `<button class="tag${active ? " active" : ""}${extraClass ? " " + extraClass : ""}" data-tag="${window.Markdown.escapeHtml(tagValue)}" aria-pressed="${active}">${window.Markdown.escapeHtml(label)}</button>`;

    let html = tagBtn("全部", "all", postsPageState.activeTag === "all");
    html += visibleTags.map((t) => tagBtn(t, t, postsPageState.activeTag === t)).join("");
    if (hiddenTags.length > 0) {
      const hiddenActive = hiddenTags.includes(postsPageState.activeTag);
      html += hiddenTags
        .map((t) => tagBtn(t, t, postsPageState.activeTag === t, "posts-tag-extra" + (hiddenActive ? "" : " posts-tag-collapsed")))
        .join("");
      html += `<button class="tag posts-tag-more" type="button" aria-expanded="${hiddenActive}">${hiddenActive ? "收起 ⌃" : `展开全部 (+${hiddenTags.length}) ⌄`}</button>`;
    }
    filterEl.innerHTML = html;

    filterEl.querySelectorAll(".tag:not(.posts-tag-more)").forEach((btn) => {
      btn.addEventListener("click", () => {
        postsPageState.activeTag = btn.dataset.tag;
        postsPageState.page = 1;
        renderTagFilter();
        renderList();
      });
    });
    const moreBtn = filterEl.querySelector(".posts-tag-more");
    if (moreBtn) {
      moreBtn.addEventListener("click", () => {
        filterEl.querySelectorAll(".posts-tag-extra").forEach((el) => el.classList.toggle("posts-tag-collapsed"));
        const expanded = moreBtn.getAttribute("aria-expanded") === "true";
        moreBtn.setAttribute("aria-expanded", String(!expanded));
        moreBtn.textContent = expanded ? `展开全部 (+${hiddenTags.length}) ⌄` : "收起 ⌃";
      });
    }
  }

  function filteredPosts() {
    if (postsPageState.activeTag === "all") return posts;
    return posts.filter((p) => p.tags.includes(postsPageState.activeTag));
  }

  function renderList() {
    const filtered = filteredPosts();
    const totalPages = Math.max(1, Math.ceil(filtered.length / POSTS_PER_PAGE));
    postsPageState.page = Math.min(postsPageState.page, totalPages);
    const start = (postsPageState.page - 1) * POSTS_PER_PAGE;
    const pagePosts = filtered.slice(start, start + POSTS_PER_PAGE);

    listEl.innerHTML =
      pagePosts.length > 0
        ? pagePosts.map(renderPostRow).join("")
        : `<p class="card-meta" style="padding: var(--space-6) 0;">没有匹配这个标签的笔记。</p>`;
    window.Motion.observeReveal(listEl);
    renderPagination(totalPages);
  }

  function renderPagination(totalPages) {
    if (!paginationEl) return;
    if (totalPages <= 1) {
      paginationEl.innerHTML = "";
      return;
    }
    const pageBtns = Array.from({ length: totalPages }, (_, i) => i + 1)
      .map(
        (n) =>
          `<button class="tag${n === postsPageState.page ? " active" : ""}" data-page="${n}" aria-current="${n === postsPageState.page}">${n}</button>`
      )
      .join("");
    paginationEl.innerHTML = `
      <button class="btn btn-secondary" data-page-nav="prev" ${postsPageState.page <= 1 ? "disabled" : ""}>← 上一页</button>
      <span style="display:flex; gap: var(--space-2);">${pageBtns}</span>
      <button class="btn btn-secondary" data-page-nav="next" ${postsPageState.page >= totalPages ? "disabled" : ""}>下一页 →</button>
    `;
    paginationEl.querySelectorAll("[data-page]").forEach((btn) => {
      btn.addEventListener("click", () => {
        postsPageState.page = Number(btn.dataset.page);
        renderList();
      });
    });
    const prevBtn = paginationEl.querySelector('[data-page-nav="prev"]');
    const nextBtn = paginationEl.querySelector('[data-page-nav="next"]');
    if (prevBtn) prevBtn.addEventListener("click", () => { postsPageState.page--; renderList(); });
    if (nextBtn) nextBtn.addEventListener("click", () => { postsPageState.page++; renderList(); });
  }

  renderTagFilter();
  renderList();
}

async function getPostRawContent(post) {
  if (post.content) return { raw: post.content, error: null };
  if (post.file) {
    try {
      const res = await fetch(post.file);
      if (res.ok) return { raw: await res.text(), error: null };
      return { raw: "", error: `HTTP ${res.status}` };
    } catch (e) {
      const isFileProtocol = window.location.protocol === "file:";
      return {
        raw: "",
        error: isFileProtocol
          ? "浏览器不允许在 file:// 模式下加载本地笔记文件。请把正文临时粘贴进 js/posts.js 的 content 字段本地预览，或用 python -m http.server 起一个本地服务器再访问。"
          : "笔记内容加载失败，请检查网络连接。",
      };
    }
  }
  return { raw: "", error: "这篇笔记既没有 content 也没有 file，无法加载。" };
}

async function renderSinglePost(slug) {
  const container = document.getElementById("post-content");
  if (!container) return false;
  const posts = sortedPosts();
  const idx = posts.findIndex((p) => p.slug === slug);
  if (idx === -1) return false;
  const post = posts[idx];
  const { raw, error } = await getPostRawContent(post);
  const { body } = window.Markdown.stripFrontmatter(raw);
  const tagsHtml = post.tags.map((t) => `<span class="tag">${window.Markdown.escapeHtml(t)}</span>`).join("");
  const bodyHtml = error
    ? `<p class="card-meta" style="color: var(--muted);">⚠ ${window.Markdown.escapeHtml(error)}</p>`
    : window.Markdown.renderMarkdown(body);

  const prev = posts[idx + 1];
  const next = posts[idx - 1];
  const navHtml = `
    <div class="post-nav" style="display:flex; justify-content:space-between; margin-top: var(--space-8); border-top: 1px solid var(--border); padding-top: var(--space-4);">
      <span>${prev ? `<a class="link-underline" href="#/posts/${prev.slug}">← ${window.Markdown.escapeHtml(prev.title)}</a>` : ""}</span>
      <span>${next ? `<a class="link-underline" href="#/posts/${next.slug}">${window.Markdown.escapeHtml(next.title)} →</a>` : ""}</span>
    </div>`;

  container.innerHTML = `
    <div class="prose">
      <p><a class="link-underline" href="#/posts">← 返回笔记列表</a></p>
      <h1>${window.Markdown.escapeHtml(post.title)}</h1>
      <p class="card-meta" style="margin-bottom: var(--space-6);"><span style="font-family:var(--font-mono)">${post.date}</span> ${tagsHtml}</p>
      ${bodyHtml}
      ${navHtml}
    </div>`;
  return true;
}

async function renderProjectsTable() {
  const container = document.getElementById("all-repos-table-body");
  if (!container) return;
  const data = await getGitHubData();
  const sorted = [...data.repos].sort((a, b) => new Date(b.pushed_at) - new Date(a.pushed_at));
  container.innerHTML = sorted
    .map(
      (r) => `<tr>
      <td><a class="link-underline" href="${r.html_url}" target="_blank" rel="noopener noreferrer">${window.Markdown.escapeHtml(r.name)}</a></td>
      <td>${window.Markdown.escapeHtml(r.language || "—")}</td>
      <td>${window.Markdown.escapeHtml(r.description || "")}</td>
      <td class="num">${window.GitHubData.relativeTime(r.pushed_at)}</td>
    </tr>`
    )
    .join("");
  const offlineTag = document.getElementById("projects-offline-tag");
  if (offlineTag) offlineTag.style.display = data.offline ? "inline" : "none";
}

async function handleRoute(route, target) {
  window.Motion.observeReveal(target);

  if (route.view === "home") {
    renderHero();
    renderRecentPushes("home-recent-pushes", 5);
    renderHomePosts();
  } else if (route.view === "posts") {
    renderPostsPage();
  } else if (route.view === "post") {
    const ok = await renderSinglePost(route.slug);
    if (!ok) window.location.hash = "#/404-not-found";
  } else if (route.view === "projects") {
    renderRecentPushes("projects-recent-pushes", 100);
    renderProjectsTable();
  }
}

document.addEventListener("DOMContentLoaded", () => {
  initTheme();
  initMobileNav();
  window.Motion.loadGSAP(3000);
  window.Router.initRouter(handleRoute);
});
