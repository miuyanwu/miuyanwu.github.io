// js/markdown.js —— 迷你 markdown 渲染器（含 HTML 转义与代码块处理）

function escapeHtml(str) {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function stripFrontmatter(md) {
  const match = md.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?/);
  if (!match) return { frontmatter: {}, body: md };
  const fmText = match[1];
  const body = md.slice(match[0].length);
  const frontmatter = {};
  fmText.split(/\r?\n/).forEach((line) => {
    const m = line.match(/^(\w+):\s*(.+)$/);
    if (!m) return;
    const key = m[1];
    let value = m[2].trim();
    if (key === "tags") {
      frontmatter.tags = value
        .replace(/^\[|\]$/g, "")
        .split(",")
        .map((s) => s.trim().replace(/^["']|["']$/g, ""))
        .filter(Boolean);
    } else {
      frontmatter[key] = value.replace(/^["']|["']$/g, "");
    }
  });
  return { frontmatter, body };
}

function renderInline(text) {
  let out = escapeHtml(text);
  out = out.replace(/`([^`]+)`/g, "<code>$1</code>");
  out = out.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
  out = out.replace(/\*([^*]+)\*/g, "<em>$1</em>");
  out = out.replace(/\[([^\]]+)\]\(([^)]+)\)/g, (m, label, href) => {
    const safeHref = /^https?:\/\//.test(href) || href.startsWith("#/") ? href : "#";
    const external = /^https?:\/\//.test(safeHref);
    return `<a href="${safeHref}"${external ? ' target="_blank" rel="noopener noreferrer"' : ""}>${label}</a>`;
  });
  return out;
}

function renderMarkdown(md) {
  const lines = md.split(/\r?\n/);
  const html = [];
  let i = 0;
  let listBuffer = [];
  let listType = null;

  function flushList() {
    if (listBuffer.length === 0) return;
    const tag = listType === "ol" ? "ol" : "ul";
    html.push(`<${tag}>` + listBuffer.map((li) => `<li>${renderInline(li)}</li>`).join("") + `</${tag}>`);
    listBuffer = [];
    listType = null;
  }

  while (i < lines.length) {
    const line = lines[i];

    if (/^```/.test(line)) {
      const lang = line.replace(/^```/, "").trim();
      const codeLines = [];
      i++;
      while (i < lines.length && !/^```/.test(lines[i])) {
        codeLines.push(lines[i]);
        i++;
      }
      i++;
      flushList();
      html.push(
        `<pre><code${lang ? ` class="language-${escapeHtml(lang)}"` : ""}>${escapeHtml(codeLines.join("\n"))}</code></pre>`
      );
      continue;
    }

    if (/^#{1,4}\s+/.test(line)) {
      flushList();
      const level = line.match(/^#+/)[0].length;
      const text = line.replace(/^#+\s+/, "");
      html.push(`<h${level}>${renderInline(text)}</h${level}>`);
      i++;
      continue;
    }

    if (/^>\s?/.test(line)) {
      flushList();
      const quoteLines = [];
      while (i < lines.length && /^>\s?/.test(lines[i])) {
        quoteLines.push(lines[i].replace(/^>\s?/, ""));
        i++;
      }
      html.push(`<blockquote><p>${renderInline(quoteLines.join(" "))}</p></blockquote>`);
      continue;
    }

    if (/^\s*[-*]\s+/.test(line)) {
      if (listType !== "ul") { flushList(); listType = "ul"; }
      listBuffer.push(line.replace(/^\s*[-*]\s+/, ""));
      i++;
      continue;
    }

    if (/^\s*\d+\.\s+/.test(line)) {
      if (listType !== "ol") { flushList(); listType = "ol"; }
      listBuffer.push(line.replace(/^\s*\d+\.\s+/, ""));
      i++;
      continue;
    }

    if (/^\s*(---|\*\*\*)\s*$/.test(line)) {
      flushList();
      html.push("<hr>");
      i++;
      continue;
    }

    if (line.trim() === "") {
      flushList();
      i++;
      continue;
    }

    flushList();
    html.push(`<p>${renderInline(line)}</p>`);
    i++;
  }
  flushList();
  return html.join("\n");
}

window.Markdown = { renderMarkdown, stripFrontmatter, escapeHtml };
