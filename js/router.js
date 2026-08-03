// js/router.js —— hash 路由、标题更新、滚动复位、404 视图

const ROUTE_TITLES = {
  home: "Elysia10032 — 首页",
  posts: "Elysia10032 — 笔记",
  post: "Elysia10032 — 笔记",
  projects: "Elysia10032 — 项目",
  about: "Elysia10032 — 关于我",
  now: "Elysia10032 — Now",
  "404": "Elysia10032 — 页面不存在",
};

const ROUTE_DESC = {
  home: "Elysia10032（miuyanwu）的个人博客：项目复盘、学习笔记与 GitHub 动态。",
  posts: "全部学习笔记：项目复盘、C 语言学习笔记，按标签与月份筛选。",
  projects: "精选项目：Favorite-sticker 剪贴板工具、乳腺超声图像诊断系统，及全部公开仓库。",
  about: "关于 Elysia10032：重庆邮电大学生物医学工程，方向 AI × 医学影像。",
  now: "Elysia10032 最近在做的事。",
  "404": "页面不存在。",
};

function parseHash() {
  const hash = window.location.hash.replace(/^#/, "") || "/";
  const parts = hash.split("/").filter(Boolean);
  if (parts.length === 0) return { view: "home" };
  if (parts[0] === "posts" && parts.length === 1) return { view: "posts" };
  if (parts[0] === "posts" && parts.length === 2) {
    const slug = parts[1];
    if (!/^[a-z0-9-]+$/.test(slug)) return { view: "404" };
    return { view: "post", slug };
  }
  if (parts[0] === "projects") return { view: "projects" };
  if (parts[0] === "about") return { view: "about" };
  if (parts[0] === "now") return { view: "now" };
  return { view: "404" };
}

function setActiveNav(view) {
  document.querySelectorAll(".nav-link").forEach((link) => {
    const href = link.getAttribute("href") || "";
    const matches =
      (view === "home" && href === "#/") ||
      (view === "posts" && href === "#/posts") ||
      (view === "post" && href === "#/posts") ||
      (view === "projects" && href === "#/projects") ||
      (view === "about" && href === "#/about") ||
      (view === "now" && href === "#/now");
    if (matches) link.setAttribute("aria-current", "page");
    else link.removeAttribute("aria-current");
  });
}

function showView(view, onShow) {
  document.querySelectorAll("[data-view]").forEach((section) => {
    section.classList.remove("active", "view-enter");
  });
  const target = document.querySelector(`[data-view="${view}"]`);
  if (!target) return;
  target.classList.add("active", "view-enter");
  document.title = ROUTE_TITLES[view] || "Elysia10032";
  const metaDesc = document.querySelector('meta[name="description"]');
  if (metaDesc) metaDesc.setAttribute("content", ROUTE_DESC[view] || ROUTE_DESC.home);
  setActiveNav(view);
  window.scrollTo(0, 0);
  const mobileMenu = document.querySelector(".mobile-menu");
  if (mobileMenu) mobileMenu.classList.remove("open");
  if (onShow) onShow(target);
}

function initRouter(onRouteChange) {
  function handle() {
    const route = parseHash();
    showView(route.view, (target) => onRouteChange(route, target));
  }
  window.addEventListener("hashchange", handle);
  handle();
}

window.Router = { initRouter, parseHash, showView };
