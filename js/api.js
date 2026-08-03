// js/api.js —— GitHub API 拉取（超时/失败 → fallback）+ relative-time + 统计计算

const API_TIMEOUT_MS = 5000;
const GITHUB_USER = "miuyanwu";

function fetchWithTimeout(url, ms) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), ms);
  return fetch(url, { signal: controller.signal })
    .then((res) => {
      clearTimeout(timer);
      if (!res.ok) throw new Error("HTTP " + res.status);
      return res.json();
    })
    .catch((err) => {
      clearTimeout(timer);
      throw err;
    });
}

function computeStats(user, repos) {
  const nonForkRepos = repos.filter((r) => !r.fork);
  const thisYear = new Date().getUTCFullYear();
  const activeThisYear = nonForkRepos.filter((r) => {
    if (!r.pushed_at) return false;
    return new Date(r.pushed_at).getUTCFullYear() === thisYear;
  }).length;
  const createdYear = new Date(user.created_at).getUTCFullYear();
  const accountAgeYears = Math.max(0, thisYear - createdYear);
  return {
    repos: nonForkRepos.length,
    activeThisYear,
    accountAgeYears,
  };
}

function relativeTime(isoString) {
  const then = new Date(isoString).getTime();
  const now = Date.now();
  const diffSec = Math.max(0, Math.floor((now - then) / 1000));

  if (diffSec < 60) return "刚刚";
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return diffMin + " 分钟前";
  const diffHour = Math.floor(diffMin / 60);
  if (diffHour < 24) return diffHour + " 小时前";
  const diffDay = Math.floor(diffHour / 24);
  if (diffDay === 1) return "昨天";
  if (diffDay < 7) return diffDay + " 天前";
  const diffWeek = Math.floor(diffDay / 7);
  if (diffWeek < 5) return diffWeek + " 周前";
  const diffMonth = Math.floor(diffDay / 30);
  if (diffMonth < 12) return diffMonth + " 个月前";
  const d = new Date(isoString);
  return d.getUTCFullYear() + "-" + String(d.getUTCMonth() + 1).padStart(2, "0") + "-" + String(d.getUTCDate()).padStart(2, "0");
}

async function loadGitHubData() {
  try {
    const [user, repos] = await Promise.all([
      fetchWithTimeout(`https://api.github.com/users/${GITHUB_USER}`, API_TIMEOUT_MS),
      fetchWithTimeout(`https://api.github.com/users/${GITHUB_USER}/repos?per_page=100`, API_TIMEOUT_MS),
    ]);
    const stats = computeStats(user, repos);
    return { user, repos, stats, offline: false };
  } catch (err) {
    const res = await fetch("data/fallback-repos.json");
    const fallback = await res.json();
    return { user: fallback.user, repos: fallback.repos, stats: fallback.stats, offline: true };
  }
}

window.GitHubData = { loadGitHubData, relativeTime, computeStats };
