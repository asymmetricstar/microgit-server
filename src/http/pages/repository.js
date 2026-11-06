import { getSettings } from '../../config/settings.js';
import { escapeHtml } from './html.js';
import { LAYOUT_CSS, siteFooter, siteHeader } from './layout.js';
import { renderMarkdown } from './markdown.js';
const FOLDER_PATH = 'M1.75 0A1.75 1.75 0 0 0 0 1.75v10.5C0 13.22.78 14 1.75 14h12.5A1.75 1.75 0 0 0 16 12.25v-8.5A1.75 1.75 0 0 0 14.25 2H7.5a.25.25 0 0 1-.2-.1l-.9-1.2C6.07 0.25 5.55 0 5 0H1.75Z';
export const ICONS = {
    repo: '<svg class="repo-icon" viewBox="0 0 16 16" fill="currentColor"><path d="M2 2.5A2.5 2.5 0 0 1 4.5 0h8.75a.75.75 0 0 1 .75.75v12.5a.75.75 0 0 1-.75.75h-2.5a.75.75 0 0 1 0-1.5h1.75v-2.5a3.25 3.25 0 0 0-3.25-3.25H4.5A2.5 2.5 0 0 0 2 9.5v3.75a.75.75 0 0 1-1.5 0V2.5Z"/></svg>',
    folder: `<svg class="file-icon folder" viewBox="0 0 16 16" fill="currentColor"><path d="${FOLDER_PATH}"/></svg>`,
    file: '<svg class="file-icon file" viewBox="0 0 16 16" fill="currentColor"><path d="M2 1.75C2 .784 2.784 0 3.75 0h6.586c.464 0 .909.184 1.237.513l2.914 2.914c.329.328.513.773.513 1.237V12.75A1.75 1.75 0 0 1 13.25 14.5H3.75A1.75 1.75 0 0 1 2 12.75V1.75Zm1.75-.25a.25.25 0 0 0-.25.25v11a.25.25 0 0 0 .25.25h9.5a.25.25 0 0 0 .25-.25V5.5a.25.25 0 0 0-.2-.245l-2.8-2.8a.25.25 0 0 0-.18-.08H3.75Z"/></svg>',
    book: '<svg viewBox="0 0 16 16" fill="currentColor"><path d="M0 1.75A.75.75 0 0 1 .75 1h4.253c1.227 0 2.317.59 3 1.5A3.743 3.743 0 0 1 11.006 1H12.25a.75.75 0 0 1 .75.75v10.5a.75.75 0 0 1-.75.75h-1.244c-1.227 0-2.317-.59-3-1.5a3.743 3.743 0 0 1-3.004 1.5H.75A.75.75 0 0 1 0 12.25V1.75Z"/></svg>',
    commits: '<svg viewBox="0 0 16 16" fill="currentColor"><path d="M8 5a3 3 0 1 0 0 6 3 3 0 0 0 0-6Z"/><path d="M0 7.25a.75.75 0 0 1 .75-.75h4a.75.75 0 0 1 0 1.5h-4A.75.75 0 0 1 0 7.25Zm11.25-.75h4a.75.75 0 0 1 0 1.5h-4a.75.75 0 0 1 0-1.5Z"/></svg>',
    size: '<svg viewBox="0 0 16 16" fill="currentColor"><path d="M8 0a8 8 0 1 1 0 16A8 8 0 0 1 8 0ZM1.5 8a6.5 6.5 0 1 0 13 0 6.5 6.5 0 0 0-13 0Zm7.25-3.25a.75.75 0 0 0-1.5 0v3.5c0 .2.08.39.22.53l2 2a.75.75 0 0 0 1.06-1.06l-1.78-1.78V4.75Z"/></svg>',
    link: '<svg viewBox="0 0 16 16" width="14" height="14" fill="currentColor"><path d="M7.775 3.275a.75.75 0 0 0 1.06 1.06l1.25-1.25a2 2 0 1 1 2.83 2.83l-2.5 2.5a2 2 0 0 1-2.83 0 .75.75 0 0 0-1.06 1.06 3.5 3.5 0 0 0 4.95 0l2.5-2.5a3.5 3.5 0 0 0-4.95-4.95l-1.25 1.25Zm-4.69 9.64a2 2 0 0 1 0-2.83l2.5-2.5a2 2 0 0 1 2.83 0 .75.75 0 0 0 1.06-1.06 3.5 3.5 0 0 0-4.95 0l-2.5 2.5a3.5 3.5 0 0 0 4.95 4.95l1.25-1.25a.75.75 0 0 0-1.06-1.06l-1.25 1.25a2 2 0 0 1-2.83 0Z"/></svg>',
    raw: '<svg width="12" height="12" viewBox="0 0 16 16" fill="currentColor"><path d="M2 1.75C2 .784 2.784 0 3.75 0h6.586c.464 0 .909.184 1.237.513l2.914 2.914c.329.328.513.773.513 1.237V12.75A1.75 1.75 0 0 1 13.25 14.5H3.75A1.75 1.75 0 0 1 2 12.75V1.75Zm1.75-.25a.25.25 0 0 0-.25.25v11a.25.25 0 0 0 .25.25h9.5a.25.25 0 0 0 .25-.25V5.5a.25.25 0 0 0-.2-.245l-2.8-2.8a.25.25 0 0 0-.18-.08H3.75Z"/></svg>',
    copy: '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.2"><rect x="2.5" y="2.5" width="8" height="8" rx="1.5"/><path d="M6 5.5H12.5A1.5 1.5 0 0 1 14 7v6a1.5 1.5 0 0 1-1.5 1.5H6"/></svg>',
    crumbFolder: `<svg class="icon" viewBox="0 0 16 16" fill="currentColor"><path d="${FOLDER_PATH}"/></svg>`,
};
export function relativeTime(iso, now = Date.now()) {
    const then = Date.parse(iso);
    if (!Number.isFinite(then))
        return '';
    const seconds = Math.max(0, Math.round((now - then) / 1000));
    if (seconds < 60)
        return 'just now';
    const minutes = Math.round(seconds / 60);
    if (minutes < 60)
        return `${minutes} ${minutes === 1 ? 'minute' : 'minutes'} ago`;
    const hours = Math.round(minutes / 60);
    if (hours < 24)
        return `${hours} ${hours === 1 ? 'hour' : 'hours'} ago`;
    const days = Math.round(hours / 24);
    if (days < 30)
        return `${days} ${days === 1 ? 'day' : 'days'} ago`;
    const months = Math.round(days / 30);
    if (months < 12)
        return `${months} ${months === 1 ? 'month' : 'months'} ago`;
    const years = Math.round(months / 12);
    return `${years} ${years === 1 ? 'year' : 'years'} ago`;
}
export function formatSize(bytes) {
    if (bytes < 1024)
        return `${bytes} B`;
    const units = ['KB', 'MB', 'GB', 'TB'];
    let value = bytes / 1024;
    let unit = 0;
    while (value >= 1024 && unit < units.length - 1) {
        value /= 1024;
        unit += 1;
    }
    return `${value >= 10 ? Math.round(value) : value.toFixed(1)} ${units[unit]}`;
}
function encoded(value) {
    return encodeURIComponent(value);
}
function encodedPath(value) {
    return value.split('/').filter(Boolean).map(encoded).join('/');
}
function repoUrl(owner, name) {
    return `/${encoded(owner)}/${encoded(name)}/`;
}
function treeUrl(owner, name, dir) {
    return dir === '' ? repoUrl(owner, name) : `${repoUrl(owner, name)}tree/${encodedPath(dir)}/`;
}
function blobUrl(owner, name, filePath, raw = false) {
    return `${repoUrl(owner, name)}blob/${encodedPath(filePath)}${raw ? '?raw=1' : ''}`;
}
function readmeUrl(data) {
    const base = treeUrl(data.owner, data.name, data.overview.dir);
    return data.raw ? base : `${base}?raw=1`;
}
function breadcrumbBar(data) {
    const root = repoUrl(data.owner, data.name);
    const dir = data.overview.dir;
    const segments = dir === '' ? [] : dir.split('/');
    const parts = [
        `<a href="${escapeHtml(root)}" title="${escapeHtml(data.owner)}">${ICONS.crumbFolder}${escapeHtml(data.owner)}</a>`,
    ];
    const pushDirs = (withRepo) => {
        if (withRepo)
            parts.push(`<a href="${escapeHtml(root)}">${escapeHtml(data.name)}</a>`);
        segments.forEach((segment, index) => {
            const href = treeUrl(data.owner, data.name, segments.slice(0, index + 1).join('/'));
            const current = withRepo && index === segments.length - 1 && !data.file;
            parts.push(current
                ? `<span class="current" aria-current="page">${escapeHtml(segment)}</span>`
                : `<a href="${escapeHtml(href)}">${escapeHtml(segment)}</a>`);
        });
    };
    if (data.file) {
        pushDirs(true);
        parts.push(`<span class="current" aria-current="page">${escapeHtml(data.file.name)}</span>`);
    }
    else if (segments.length === 0) {
        parts.push(`<span class="current" aria-current="page">${escapeHtml(data.name)}</span>`);
    }
    else {
        pushDirs(true);
    }
    return `<nav class="breadcrumb" aria-label="Breadcrumb">${parts.join('<span class="sep">/</span>')}</nav>`;
}
const STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@500&family=Inter:wght@400;500;600&display=swap');
  :root {
    --bg: #FFFFFF;
    --bg-subtle: #F6F8FA;
    --border: #D0D7DE;
    --text: #24292F;
    --text-secondary: #656D76;
    --text-black: #1F2328;
    --blue: #0969DA;
    --blue-light: #EBF2FF;
    --green: #1F883D;
    --red: #CF222E;
  }
  * { box-sizing: border-box; }
  body {
    margin: 0;
    background: var(--bg);
    color: var(--text);
    font-family: "Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif;
    -webkit-font-smoothing: antialiased;
    min-height: 100vh;
    display: flex;
    flex-direction: column;
  }
  a { color: var(--blue); text-decoration: none; }
  a:hover { text-decoration: underline; }
  button, input { font-family: inherit; }
  :focus-visible { outline: 2px solid var(--blue); outline-offset: 2px; }

  .lite-container { max-width: 1400px; width: 100%; margin: 0 auto; padding: 28px 28px 56px; flex: 1 0 auto; }

  .repo-title-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 16px;
    flex-wrap: wrap;
    margin-bottom: 14px;
  }
  .repo-title-left { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; }
  a.repo-title-left { text-decoration: none; color: inherit; cursor: pointer; }
  a.repo-title-left:hover h1 { text-decoration: underline; }
  .repo-title-left h1 {
    margin: 0;
    font-size: 20px;
    font-weight: 600;
    color: var(--text-black);
    letter-spacing: -0.3px;
    display: flex;
    align-items: center;
    gap: 8px;
  }
  .repo-icon { width: 20px; height: 20px; color: var(--text-secondary); }
  .public-badge {
    display: inline-flex;
    align-items: center;
    height: 22px;
    padding: 0 8px;
    border: 1px solid var(--border);
    border-radius: 999px;
    font-size: 12px;
    font-weight: 500;
    color: var(--text-secondary);
    background: var(--bg);
    white-space: nowrap;
  }
  .repo-title-actions { display: flex; gap: 8px; flex-wrap: wrap; }
  .btn-lite {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    height: 32px;
    padding: 0 12px;
    border: 1px solid var(--border);
    border-radius: 6px;
    background: var(--bg-subtle);
    color: var(--text);
    font-size: 13px;
    font-weight: 500;
    cursor: pointer;
    white-space: nowrap;
  }
  .btn-lite:hover { background: #EFF2F5; text-decoration: none; }
  .btn-lite svg { width: 16px; height: 16px; opacity: 0.8; }

  .stats-line {
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    gap: 4px 16px;
    padding: 0 0 18px 0;
    border-bottom: 1px solid var(--border);
    font-size: 13px;
    color: var(--text-secondary);
    margin-bottom: 18px;
  }
  .stats-line .stat {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    color: var(--text-secondary);
    transition: color 0.15s;
  }
  .stats-line .stat:hover { color: var(--blue); }
  .stats-line .stat strong { font-weight: 600; color: var(--text); }
  .stats-line .stat:hover strong { color: var(--blue); }
  .stats-line svg { width: 16px; height: 16px; }

  .action-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    flex-wrap: wrap;
    margin-bottom: 16px;
  }
  .file-count { font-size: 13px; color: var(--text); font-weight: 500; }
  .file-count span { color: var(--text-secondary); font-weight: 400; }
  .clone-row { display: flex; align-items: center; gap: 8px; }
  .btn-code {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    height: 32px;
    padding: 0 14px;
    border-radius: 6px;
    border: 0;
    background: var(--blue);
    color: #fff;
    font-size: 13px;
    font-weight: 500;
    cursor: pointer;
    font-family: inherit;
    white-space: nowrap;
  }
  .btn-code:hover { background: #0860CA; }
  .clone-input-wrap {
    display: none;
    align-items: center;
    border: 1px solid var(--border);
    border-radius: 6px;
    background: var(--bg-subtle);
    overflow: hidden;
    height: 32px;
  }
  .clone-input-wrap.is-open { display: flex; }
  .clone-input-wrap input {
    border: 0;
    background: transparent;
    font-family: ui-monospace, SFMono-Regular, monospace;
    font-size: 12px;
    color: var(--text);
    padding: 0 10px;
    width: 280px;
    outline: none;
  }
  .clone-input-wrap button {
    height: 100%;
    border: 0;
    border-left: 1px solid var(--border);
    background: var(--bg);
    padding: 0 10px;
    cursor: pointer;
    color: var(--text-secondary);
    font-size: 13px;
  }
  .clone-input-wrap button:hover { color: var(--text); }

  /* The trail sits in the same place on every repository page. */
  .breadcrumb {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 9px 14px;
    margin-bottom: 16px;
    background: var(--bg-subtle);
    border: 1px solid var(--border);
    border-radius: 6px;
    font-size: 13px;
    color: var(--text-secondary);
    overflow-x: auto;
    white-space: nowrap;
  }
  .breadcrumb a {
    display: inline-flex;
    align-items: center;
    gap: 5px;
    color: var(--text-secondary);
    padding: 2px 6px;
    border-radius: 4px;
    transition: color 0.15s, background 0.15s;
  }
  .breadcrumb a:hover { color: var(--blue); background: var(--blue-light); text-decoration: none; }
  .breadcrumb .sep { color: var(--text-secondary); opacity: 0.5; font-size: 12px; user-select: none; }
  .breadcrumb .current {
    color: var(--text);
    font-weight: 600;
    padding: 2px 6px;
    background: var(--bg);
    border: 1px solid var(--border);
    border-radius: 4px;
  }
  .breadcrumb .icon { width: 14px; height: 14px; flex-shrink: 0; color: var(--blue); }

  .file-list-box {
    border: 1px solid var(--border);
    border-radius: 6px;
    overflow: hidden;
    background: var(--bg);
    margin-bottom: 24px;
  }
  .file-list-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    padding: 10px 16px;
    background: var(--bg-subtle);
    border-bottom: 1px solid var(--border);
    font-size: 13px;
  }
  .commit-info { display: flex; align-items: center; gap: 8px; min-width: 0; }
  .avatar {
    width: 20px; height: 20px;
    border-radius: 50%;
    background: #D0D7DE;
    flex-shrink: 0;
    display: grid; place-items: center;
    font-size: 10px; font-weight: 600; color: #656D76;
  }
  .commit-msg { color: var(--text); font-weight: 500; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .commit-meta { color: var(--text-secondary); white-space: nowrap; }
  .commit-time { color: var(--text-secondary); font-size: 12px; }
  .commit-sha {
    font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
    font-size: 12px;
    color: var(--text-secondary);
    background: var(--bg);
    border: 1px solid var(--border);
    border-radius: 6px;
    padding: 1px 6px;
  }
  a.file-row {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 9px 16px;
    font-size: 13px;
    border-bottom: 1px solid #EAEEF2;
    color: var(--text);
    text-decoration: none;
  }
  a.file-row:last-child { border-bottom: 0; }
  a.file-row:hover { background: var(--bg-subtle); text-decoration: none; }
  a.file-row:hover .file-name { color: var(--blue); }
  a.file-row .file-icon { width: 16px; height: 16px; flex-shrink: 0; }
  .file-icon.folder { color: #54AEFF; }
  .file-icon.file { color: var(--text-secondary); }
  a.file-row:hover .file-icon.file { color: var(--blue); }
  .file-name {
    color: var(--text);
    font-weight: 400;
    min-width: 160px;
    max-width: 40%;
    flex-shrink: 0;
    overflow-wrap: anywhere;
  }
  .file-row.readme-row { background: var(--blue-light); }
  .file-row.readme-row .file-name { color: var(--blue); font-weight: 500; }
  .file-row.readme-row:hover { background: #DFE9FF; }
  .file-message {
    color: var(--text-secondary);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    flex: 1;
    min-width: 0;
  }
  .file-time { color: var(--text-secondary); font-size: 12px; white-space: nowrap; margin-left: auto; }
  .empty-note { padding: 22px 16px; font-size: 13px; color: var(--text-secondary); }
  .empty-note code {
    font-family: ui-monospace, SFMono-Regular, monospace;
    font-size: 12.5px;
    background: var(--bg-subtle);
    border: 1px solid #EAEEF2;
    padding: 1px 5px;
    border-radius: 6px;
  }

  .readme-box { border: 1px solid var(--border); border-radius: 6px; overflow: hidden; background: var(--bg); }
  .readme-box-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    padding: 10px 16px;
    border-bottom: 1px solid var(--border);
    background: var(--bg-subtle);
  }
  .readme-title { display: flex; align-items: center; gap: 8px; font-size: 13px; font-weight: 600; color: var(--text-black); min-width: 0; }
  .readme-title svg { width: 16px; height: 16px; color: var(--text-secondary); flex-shrink: 0; }
  .btn-raw {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    height: 26px;
    padding: 0 8px;
    border: 1px solid var(--border);
    border-radius: 6px;
    background: var(--bg);
    font-size: 12px;
    color: var(--text-secondary);
    cursor: pointer;
    white-space: nowrap;
  }
  .btn-raw:hover { color: var(--text); background: #EFF2F5; text-decoration: none; }

  .readme-box-body { padding: 28px 32px; font-size: 14px; line-height: 1.65; color: var(--text); }
  .readme-box-body h1, .readme-box-body h2, .readme-box-body h3 {
    font-weight: 600;
    letter-spacing: -0.3px;
    color: var(--text-black);
  }
  .readme-box-body h1 { font-size: 24px; margin: 0 0 12px 0; padding-bottom: 10px; border-bottom: 1px solid var(--border); }
  .readme-box-body h2 { font-size: 19px; margin: 24px 0 10px 0; }
  .readme-box-body h3 { font-size: 16px; margin: 20px 0 8px 0; }
  .readme-box-body p { margin: 0 0 14px 0; color: var(--text); }
  .readme-box-body ul, .readme-box-body ol { margin: 0 0 16px 20px; padding: 0; }
  .readme-box-body li { margin: 4px 0; }
  .readme-box-body blockquote {
    margin: 0 0 16px 0;
    padding: 0 14px;
    color: var(--text-secondary);
    border-left: 3px solid var(--border);
  }
  .readme-box-body hr { border: 0; border-top: 1px solid var(--border); margin: 20px 0; }
  .readme-box-body code.inline {
    font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
    font-size: 12.5px;
    background: var(--bg-subtle);
    border: 1px solid #EAEEF2;
    padding: 1px 5px;
    border-radius: 6px;
  }
  .readme-box-body pre {
    background: var(--bg-subtle);
    border: 1px solid var(--border);
    border-radius: 6px;
    padding: 16px;
    overflow-x: auto;
    font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
    font-size: 12.5px;
    line-height: 1.5;
    margin: 16px 0;
  }
  .readme-box-body pre code { background: none; border: 0; padding: 0; }
  .readme-box-body a { color: var(--blue); }
  .readme-box-body table { border-collapse: collapse; width: 100%; margin: 0 0 16px 0; }
  .readme-box-body th, .readme-box-body td { border: 1px solid var(--border); padding: 6px 10px; font-size: 13px; text-align: left; }
  .readme-box-body th { background: var(--bg-subtle); }
  .readme-box-body img.readme-img { max-width: 100%; height: auto; border-radius: 6px; margin: 8px 0; display: block; }
  .readme-box-body .task-list-item { list-style: none; margin-left: -20px; }
  .readme-box-body .task-list-item input { margin-right: 6px; }
  .readme-box-body blockquote.callout { border-left: 4px solid var(--blue); padding: 8px 12px; background: var(--bg-subtle); border-radius: 0 6px 6px 0; }
  .readme-box-body .callout-title { font-weight: 600; margin-bottom: 4px; text-transform: capitalize; }
  .readme-empty .readme-box-body { padding: 20px 16px; font-size: 13px; color: var(--text-secondary); }
  .readme-empty .readme-box-body p { margin: 0; color: var(--text-secondary); }
  .readme-raw { margin: 0; white-space: pre-wrap; overflow-wrap: anywhere; }

  /* Code preview: header, toolbar, gutter, code, footer. */
  .preview-box { border: 1px solid var(--border); border-radius: 6px; overflow: hidden; background: var(--bg); }
  .preview-box-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    padding: 10px 14px;
    background: var(--bg-subtle);
    border-bottom: 1px solid var(--border);
    flex-wrap: wrap;
  }
  .preview-file-info { display: flex; align-items: center; gap: 10px; min-width: 0; flex-wrap: wrap; }
  .preview-file-name {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 13px;
    font-weight: 600;
    color: var(--text-black);
    min-width: 0;
    overflow-wrap: anywhere;
  }
  .preview-file-name svg { width: 16px; height: 16px; color: var(--text-secondary); flex-shrink: 0; }
  .meta-badge {
    display: inline-flex;
    align-items: center;
    height: 20px;
    padding: 0 8px;
    background: var(--bg);
    border: 1px solid var(--border);
    border-radius: 999px;
    font-size: 11px;
    font-weight: 500;
    color: var(--text-secondary);
    gap: 6px;
    white-space: nowrap;
  }
  .meta-badge .dot { width: 6px; height: 6px; border-radius: 50%; background: var(--green); }
  .preview-actions { display: flex; align-items: center; gap: 8px; margin-left: auto; }
  .btn-mini {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    height: 28px;
    padding: 0 10px;
    border: 1px solid var(--border);
    border-radius: 6px;
    background: var(--bg);
    color: var(--text);
    font-size: 12px;
    font-weight: 500;
    cursor: pointer;
    white-space: nowrap;
  }
  .btn-mini:hover { background: var(--bg-subtle); text-decoration: none; }
  .btn-mini svg { width: 14px; height: 14px; }
  .btn-mini.is-done { color: var(--green); border-color: var(--green); }

  .preview-toolbar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    padding: 8px 14px;
    background: var(--bg);
    border-bottom: 1px solid var(--border);
    font-size: 12px;
    color: var(--text-secondary);
    flex-wrap: wrap;
  }
  .toolbar-left, .toolbar-right { display: flex; align-items: center; gap: 8px; }
  .toolbar-left .dot-sep, .toolbar-right .dot-sep { opacity: 0.3; }
  .toolbar-right .read-only { color: var(--blue); }

  .code-wrap {
    display: flex;
    background: #ffffff;
    overflow: auto;
    max-height: 640px;
  }
  .line-nums {
    min-width: 56px;
    flex-shrink: 0;
    background: var(--bg-subtle);
    border-right: 1px solid var(--border);
    padding: 16px 10px 16px 16px;
    text-align: right;
    font-family: "JetBrains Mono", ui-monospace, SFMono-Regular, Menlo, monospace;
    font-size: 13px;
    line-height: 1.7;
    color: var(--text-secondary);
    user-select: none;
    position: sticky;
    left: 0;
    white-space: pre;
    height: fit-content;
  }
  .code-content {
    flex: 1;
    min-width: 0;
    padding: 16px;
    font-family: "JetBrains Mono", ui-monospace, SFMono-Regular, Menlo, monospace;
    font-size: 13px;
    line-height: 1.7;
    color: var(--text);
    white-space: pre;
    overflow-wrap: normal;
    tab-size: 2;
  }
  /* Minimal syntax colours for the preview: comments, strings, numbers,
     keywords, attributes and calls. Deliberately small and flat. */
  .tok-c { color: var(--text-secondary); }
  .tok-s { color: #0A3069; }
  .tok-n, .tok-b, .tok-v { color: var(--blue); }
  .tok-k { color: var(--red); }
  .tok-a { color: #953800; }
  .tok-t { color: var(--green); }
  .tok-f { color: #8250DF; }
  .tok-h { color: var(--red); font-weight: 600; }
  .tok-d { color: #6f42c1; }

  .preview-footer {
    padding: 12px 14px;
    background: var(--bg-subtle);
    border-top: 1px solid var(--border);
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    flex-wrap: wrap;
    font-size: 12px;
    color: var(--text-secondary);
  }
  .preview-footer strong { color: var(--text); font-weight: 600; }
  .preview-footer code {
    font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
    background: var(--bg);
    border: 1px solid var(--border);
    border-radius: 6px;
    padding: 1px 6px;
    overflow-wrap: anywhere;
  }
  .preview-footer .warning { color: var(--red); font-weight: 500; }
  .file-note { padding: 26px 16px; font-size: 13px; color: var(--text-secondary); text-align: center; }

  /* Tables and filters (audit page). */
  .filter-form { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; margin-bottom: 16px; }
  .filter-form input {
    height: 32px;
    padding: 0 10px;
    border: 1px solid var(--border);
    border-radius: 6px;
    background: var(--bg);
    color: var(--text);
    font-size: 13px;
    outline: none;
    min-width: 180px;
  }
  .filter-form input:focus { border-color: var(--blue); }
  .filter-form button {
    height: 32px;
    padding: 0 14px;
    border: 1px solid transparent;
    border-radius: 6px;
    background: var(--blue);
    color: #fff;
    font-size: 13px;
    font-weight: 500;
    cursor: pointer;
  }
  .filter-form button:hover { background: #0860CA; }
  .filter-form .form-link { font-size: 13px; }
  .table-box {
    border: 1px solid var(--border);
    border-radius: 6px;
    background: var(--bg);
    overflow-x: auto;
    margin-bottom: 24px;
  }
  .table-box table { border-collapse: collapse; width: 100%; font-size: 13px; }
  .table-box th {
    text-align: left;
    background: var(--bg-subtle);
    border-bottom: 1px solid var(--border);
    padding: 10px 14px;
    font-weight: 600;
    color: var(--text-black);
    white-space: nowrap;
  }
  .table-box td { border-bottom: 1px solid #EAEEF2; padding: 9px 14px; color: var(--text); vertical-align: top; }
  .table-box tr:last-child td { border-bottom: 0; }
  .table-box td b { font-weight: 600; color: var(--text-black); }
  .table-box td.muted { color: var(--text-secondary); }

  /* Landing page (root) layout, rendered through the shared shell. */
  .landing h1 { font-size: 36px; font-weight: 600; letter-spacing: -0.8px; color: var(--text-black); margin: 0 0 8px 0; }
  .landing-copy { max-width: 760px; }
  .landing-copy h2 { font-size: 24px; font-weight: 600; letter-spacing: -0.3px; color: var(--text-black); margin: 28px 0 10px 0; }
  .landing-copy p { margin: 0 0 14px 0; font-size: 14.5px; line-height: 1.65; color: var(--text); }
  .landing-copy code.inline {
    font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
    font-size: 12.5px;
    background: var(--bg-subtle);
    border: 1px solid #EAEEF2;
    padding: 1px 5px;
    border-radius: 6px;
  }
  .landing-signin { margin-bottom: 8px; }

  @media (max-width: 760px) {
    .lite-container { padding: 20px 16px 48px; }
    .page-wide { padding: 0 16px; }
    .clone-row { width: 100%; flex-wrap: wrap; }
    .clone-input-wrap.is-open { flex: 1; }
    .clone-input-wrap input { width: 100%; min-width: 0; }
    .file-message { display: none; }
    .file-name { min-width: 0; max-width: none; }
    .readme-box-body { padding: 20px; }
    .action-row { align-items: stretch; flex-direction: column; }
    .preview-box-header { align-items: flex-start; }
    .preview-actions { margin-left: 0; }
    .line-nums { padding: 16px 8px 16px 10px; min-width: 44px; }
  }
`;
function initial(name) {
    return name.trim().charAt(0).toUpperCase() || '?';
}
function commitRowHeader(commit) {
    if (!commit)
        return '<span class="commit-meta">No commits yet</span>';
    return `<div class="commit-info">
      <div class="avatar">${escapeHtml(initial(commit.author))}</div>
      <span class="commit-msg">${escapeHtml(commit.subject)}</span>
      <span class="commit-meta">· ${escapeHtml(commit.author)} ·</span>
      <span class="commit-time">${escapeHtml(relativeTime(commit.date))}</span>
    </div>
    <span class="commit-sha">${escapeHtml(commit.sha.slice(0, 7))}</span>`;
}
function fileRows(data) {
    const { overview } = data;
    const ordered = [...overview.entries].sort((a, b) => Number(b.isDirectory) - Number(a.isDirectory));
    return ordered
        .map((entry) => {
        const isReadme = overview.readme !== null && entry.path === `${overview.dir ? `${overview.dir}/` : ''}${overview.readme.name}`;
        const href = entry.isDirectory
            ? treeUrl(data.owner, data.name, entry.path)
            : blobUrl(data.owner, data.name, entry.path);
        return `<a class="file-row${isReadme ? ' readme-row' : ''}" href="${escapeHtml(href)}">
      ${entry.isDirectory ? ICONS.folder : ICONS.file}
      <span class="file-name">${escapeHtml(entry.name)}${entry.isDirectory ? '/' : ''}</span>
      <span class="file-message">${escapeHtml(entry.commit?.subject ?? '')}</span>
      <span class="file-time">${escapeHtml(entry.commit ? relativeTime(entry.commit.date) : '')}</span>
    </a>`;
    })
        .join('\n');
}
function readmeBox(data) {
    const readme = data.overview.readme;
    if (!readme) {
        const where = data.overview.dir === '' ? 'this repository' : 'this directory';
        return `<div class="readme-box readme-empty">
    <div class="readme-box-header">
      <div class="readme-title">${ICONS.book} README.md</div>
    </div>
    <div class="readme-box-body">
      <p>No README.md found in ${where}. Add one to describe the project.</p>
    </div>
  </div>`;
    }
    const toggle = data.raw
        ? `<a class="btn-raw" href="${escapeHtml(treeUrl(data.owner, data.name, data.overview.dir))}">${ICONS.raw} Rendered</a>`
        : `<a class="btn-raw" href="${escapeHtml(readmeUrl(data))}">${ICONS.raw} Raw</a>`;
    const body = data.raw
        ? `<pre class="readme-raw">${escapeHtml(readme.text)}</pre>`
        : renderMarkdown(readme.text, { owner: data.owner, name: data.name, dir: data.overview.dir });
    return `<div class="readme-box">
    <div class="readme-box-header">
      <div class="readme-title">${ICONS.book} ${escapeHtml(readme.name)}</div>
      ${toggle}
    </div>
    <div class="readme-box-body">${body}</div>
  </div>`;
}
function languageLabel(filePath) {
    const base = filePath.split('/').pop() ?? filePath;
    const dot = base.lastIndexOf('.');
    const ext = (dot === -1 ? '' : base.slice(dot + 1)).toLowerCase();
    const known = {
        md: 'Markdown',
        markdown: 'Markdown',
        json: 'JSON',
        js: 'JavaScript',
        jsx: 'JavaScript',
        mjs: 'JavaScript',
        cjs: 'JavaScript',
        ts: 'TypeScript',
        tsx: 'TypeScript',
        css: 'CSS',
        scss: 'SCSS',
        less: 'Less',
        html: 'HTML',
        htm: 'HTML',
        xml: 'XML',
        svg: 'SVG',
        yml: 'YAML',
        yaml: 'YAML',
        toml: 'TOML',
        ini: 'INI',
        cfg: 'Config',
        py: 'Python',
        rb: 'Ruby',
        go: 'Go',
        rs: 'Rust',
        java: 'Java',
        kt: 'Kotlin',
        swift: 'Swift',
        c: 'C',
        h: 'C',
        cc: 'C++',
        cpp: 'C++',
        hpp: 'C++',
        cs: 'C#',
        php: 'PHP',
        sh: 'Shell',
        bash: 'Shell',
        zsh: 'Shell',
        sql: 'SQL',
        lua: 'Lua',
        php4: 'PHP',
        txt: 'Plain text',
        csv: 'CSV',
    };
    return Object.prototype.hasOwnProperty.call(known, ext) ? known[ext] : 'Plain text';
}
function shownText(file) {
    const text = (file.text ?? '').replace(/\n$/, '');
    return { text, lines: text === '' ? 1 : text.split('\n').length };
}
const COPY_SCRIPT = `<script>
(function () {
  var button = document.getElementById('copy-code');
  var code = document.getElementById('code-content');
  if (!button || !code) return;
  var label = button.querySelector('.btn-label');
  var done = function () {
    button.classList.add('is-done');
    if (label) label.textContent = 'Copied';
    setTimeout(function () {
      button.classList.remove('is-done');
      if (label) label.textContent = 'Copy';
    }, 1500);
  };
  var legacy = function (text) {
    var area = document.createElement('textarea');
    area.value = text;
    area.setAttribute('readonly', '');
    area.style.position = 'fixed';
    area.style.opacity = '0';
    document.body.appendChild(area);
    area.select();
    try { document.execCommand('copy'); } catch (error) {}
    document.body.removeChild(area);
  };
  button.addEventListener('click', function () {
    var text = code.textContent || '';
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(done, function () { legacy(text); done(); });
    } else {
      legacy(text);
      done();
    }
  });
})();
</script>`;
const HIGHLIGHT_SCRIPT = String.raw `<script>
(function () {
  var box = document.getElementById('code-content');
  if (!box) return;
  var source = box.textContent || '';
  var lang = box.getAttribute('data-lang') || '';
  if (source.length === 0 || source.length > 250000) return;

  var NAMED = { '&': 'amp', '<': 'lt', '>': 'gt' };
  var esc = function (value) {
    return value.replace(/[&<>]/g, function (one) { return '&' + NAMED[one] + ';'; });
  };
  var words = function (list) {
    return new RegExp('\\b(?:' + list.join('|') + ')\\b');
  };
  var eitherCase = function (word) {
    return word.split('').map(function (letter) {
      return '[' + letter.toLowerCase() + letter.toUpperCase() + ']';
    }).join('');
  };

  var BASE = ['as', 'async', 'await', 'break', 'case', 'catch', 'class', 'const',
    'continue', 'default', 'delete', 'do', 'else', 'enum', 'export', 'extends',
    'finally', 'for', 'from', 'function', 'if', 'implements', 'import', 'in',
    'instanceof', 'interface', 'let', 'new', 'of', 'private', 'protected',
    'public', 'return', 'static', 'super', 'switch', 'this', 'throw', 'try',
    'type', 'typeof', 'var', 'void', 'while', 'with', 'yield'];
  var CODE = BASE.concat(['abstract', 'auto', 'bool', 'byte', 'char', 'crate',
    'defer', 'double', 'explicit', 'extern', 'float', 'fn', 'friend', 'go', 'goto',
    'impl', 'inline', 'int', 'long', 'map', 'match', 'mod', 'mut', 'namespace',
    'operator', 'override', 'package', 'pub', 'range', 'ref', 'short', 'signed',
    'sizeof', 'struct', 'template', 'trait', 'typename', 'union', 'unsigned',
    'using', 'virtual', 'volatile']);
  var SCRIPT = BASE.concat(['alias', 'and', 'attr', 'begin', 'def', 'del', 'elif',
    'ensure', 'esac', 'except', 'fi', 'global', 'lambda', 'local', 'module',
    'nonlocal', 'not', 'or', 'pass', 'print', 'raise', 'require', 'rescue', 'self',
    'then', 'unless', 'until', 'when']);
  var SHELL = BASE.concat(['alias', 'elif', 'esac', 'fi', 'local', 'read', 'source',
    'then', 'until', 'done']);

  var LITERAL = /\b(?:true|false|null|undefined|None|True|False|NaN|Infinity|nil)\b/;
  var NUMBER = /\b0[xX][0-9a-fA-F]+\b|\b\d[\d_]*(?:\.\d+)?(?:[eE][+-]?\d+)?\b/;
  var CALL = /\b[A-Za-z_$][\w$]*(?=\s*\()/;
  var DQUOTED = /"(?:\\.|[^"\\\n])*"|'(?:\\.|[^'\\\n])*'/;

  var JS = [
    { cls: 'c', re: /\/\*[\s\S]*?\*\/|\/\/[^\n]*/ },
    { cls: 's', re: /"(?:\\.|[^"\\\n])*"|'(?:\\.|[^'\\\n])*'|\x60(?:\\.|[^\x60])*\x60/ },
    { cls: 'n', re: NUMBER },
    { cls: 'k', re: words(BASE) },
    { cls: 'b', re: LITERAL },
    { cls: 'f', re: CALL }
  ];
  var CLIKE = [
    { cls: 'c', re: /\/\*[\s\S]*?\*\/|\/\/[^\n]*/ },
    { cls: 's', re: DQUOTED },
    { cls: 'n', re: NUMBER },
    { cls: 'k', re: words(CODE) },
    { cls: 'b', re: LITERAL },
    { cls: 'f', re: CALL }
  ];
  var PHP_G = [
    { cls: 'c', re: /\/\*[\s\S]*?\*\/|\/\/[^\n]*|#[^\n]*/ },
    { cls: 'v', re: /\$[A-Za-z_]\w*/ },
    { cls: 's', re: DQUOTED },
    { cls: 'n', re: NUMBER },
    { cls: 'k', re: words(CODE) },
    { cls: 'b', re: LITERAL },
    { cls: 'f', re: CALL }
  ];
  var SHELL_G = [
    { cls: 'c', re: /#[^\n]*/ },
    { cls: 'v', re: /\$\{[^}\n]*\}|\$[A-Za-z_]\w*/ },
    { cls: 's', re: /"(?:\\.|[^"\\])*"|'[^'\n]*'/ },
    { cls: 'n', re: NUMBER },
    { cls: 'k', re: words(SHELL) },
    { cls: 'b', re: LITERAL },
    { cls: 'f', re: CALL }
  ];
  var SCRIPT_G = [
    { cls: 'c', re: /#[^\n]*/ },
    { cls: 's', re: /"""[\s\S]*?"""|'''[\s\S]*?'''|"(?:\\.|[^"\\\n])*"|'(?:\\.|[^'\\\n])*'/ },
    { cls: 'n', re: NUMBER },
    { cls: 'k', re: words(SCRIPT) },
    { cls: 'b', re: LITERAL },
    { cls: 'f', re: CALL }
  ];
  var PYTHON_G = [
    { cls: 'c', re: /#[^\n]*/ },
    { cls: 'd', re: /@[A-Za-z_][\w]*(?:\.[A-Za-z_][\w]*)*/ },
    { cls: 's', re: /[fFrRbB]?"""[\s\S]*?"""|[fFrRbB]?'''[\s\S]*?'''|[fFrRbB]?"(?:\\.|[^"\\\n])*"|[fFrRbB]?'(?:\\.|[^'\\\n])*'/ },
    { cls: 'n', re: NUMBER },
    { cls: 'k', re: words(['and', 'as', 'assert', 'async', 'await', 'break', 'class', 'continue', 'def', 'del', 'elif', 'else', 'except', 'finally', 'for', 'from', 'global', 'if', 'import', 'in', 'is', 'lambda', 'nonlocal', 'not', 'or', 'pass', 'raise', 'return', 'try', 'while', 'with', 'yield']) },
    { cls: 'b', re: LITERAL },
    { cls: 'f', re: CALL }
  ];
  var SQL_G = [
    { cls: 'c', re: /--[^\n]*|\/\*[\s\S]*?\*\// },
    { cls: 's', re: /'(?:[^']|'')*'/ },
    { cls: 'k', re: words(['select', 'from', 'where', 'insert', 'into', 'values',
      'update', 'set', 'delete', 'create', 'table', 'drop', 'alter', 'index', 'view',
      'join', 'inner', 'left', 'right', 'full', 'outer', 'on', 'group', 'by', 'order',
      'having', 'limit', 'offset', 'distinct', 'as', 'and', 'or', 'not', 'in', 'is',
      'like', 'between', 'exists', 'union', 'all', 'primary', 'key', 'foreign',
      'references', 'default', 'unique', 'count', 'sum', 'avg', 'min', 'max', 'case',
      'when', 'then', 'else', 'end', 'asc', 'desc', 'with', 'returning'].map(eitherCase)) },
    { cls: 'b', re: words(['null', 'true', 'false'].map(eitherCase)) },
    { cls: 'n', re: NUMBER }
  ];
  var JSON_G = [
    { cls: 'a', re: /"(?:\\.|[^"\\])*"(?=\s*:)/ },
    { cls: 's', re: /"(?:\\.|[^"\\])*"/ },
    { cls: 'n', re: /-?\b\d+(?:\.\d+)?(?:[eE][+-]?\d+)?\b/ },
    { cls: 'b', re: LITERAL }
  ];
  var CSS_G = [
    { cls: 'c', re: /\/\*[\s\S]*?\*\/|\/\/[^\n]*/ },
    { cls: 's', re: DQUOTED },
    { cls: 'k', re: /@[A-Za-z-]+/ },
    { cls: 'n', re: /#[0-9a-fA-F]{3,8}\b|\b\d+(?:\.\d+)?(?:px|em|rem|vh|vw|vmin|vmax|%|s|ms|fr|deg|ch|ex|pt)?\b/ },
    { cls: 'a', re: /(?<=[{;]\s|^)[-a-zA-Z]+(?=\s*:)/ }
  ];
  var MARKUP_G = [
    { cls: 'c', re: /<!--[\s\S]*?-->/ },
    { cls: 't', re: /<\/?[A-Za-z][\w:.-]*|\/?>/ },
    { cls: 'a', re: /\b[A-Za-z_:][\w:.-]*(?=\s*=)/ },
    { cls: 's', re: /"[^"\n]*"|'[^'\n]*'/ },
    { cls: 'n', re: NUMBER }
  ];
  var MD_G = [
    { cls: 'c', re: /\x60\x60\x60[\s\S]*?\x60\x60\x60|\x60[^\x60\n]+\x60/ },
    { cls: 'h', re: /^#{1,6}[^\n]*$/m },
    { cls: 's', re: /!?\[[^\]\n]*\]\([^)\n]*\)/ },
    { cls: 'b', re: /\*\*[^*\n]+\*\*|__[^_\n]+__/ },
    { cls: 'k', re: /^\s{0,3}>[^\n]*$/m }
  ];
  var YAML_G = [
    { cls: 'c', re: /#[^\n]*/ },
    { cls: 'a', re: /^[ \t]*-?[ \t]*[\w.-]+(?=\s*:)/m },
    { cls: 's', re: /"(?:\\.|[^"\\\n])*"|'(?:\\.|[^'\\\n])*'/ },
    { cls: 'n', re: /\b\d+(?:\.\d+)?\b/ },
    { cls: 'b', re: LITERAL }
  ];
  var INI_G = [
    { cls: 'c', re: /[#;][^\n]*/ },
    { cls: 't', re: /^[ \t]*\[[^\]\n]+\][ \t]*$/m },
    { cls: 'a', re: /^[ \t]*[\w.-]+(?=\s*=)/m },
    { cls: 's', re: /"[^"\n]*"|'[^'\n]*'/ },
    { cls: 'n', re: /\b\d+(?:\.\d+)?\b/ }
  ];

  var GRAMMAR = {
    JavaScript: JS, TypeScript: JS,
    Java: CLIKE, Kotlin: CLIKE, Swift: CLIKE, C: CLIKE, 'C++': CLIKE, 'C#': CLIKE,
    Go: CLIKE, Rust: CLIKE, PHP: PHP_G,
    Shell: SHELL_G, Python: PYTHON_G, Ruby: SCRIPT_G, SQL: SQL_G,
    JSON: JSON_G, CSS: CSS_G, SCSS: CSS_G, Less: CSS_G,
    HTML: MARKUP_G, XML: MARKUP_G, SVG: MARKUP_G,
    Markdown: MD_G, YAML: YAML_G, TOML: YAML_G, INI: INI_G, Config: INI_G
  };

  var rules = GRAMMAR[lang];
  if (!rules) return;
  var pattern = rules.map(function (rule) { return '(' + rule.re.source + ')'; }).join('|');
  var scanner;
  try {
    scanner = new RegExp(pattern, 'gm');
  } catch (error) {
    return;
  }
  var html = '';
  var offset = 0;
  var match;
  while ((match = scanner.exec(source)) !== null) {
    if (match[0] === '') { scanner.lastIndex += 1; continue; }
    html += esc(source.slice(offset, match.index));
    var cls = 'k';
    for (var i = 1; i < match.length; i += 1) {
      if (match[i] !== undefined) { cls = rules[i - 1].cls; break; }
    }
    html += '<span class="tok tok-' + cls + '">' + esc(match[0]) + '</span>';
    offset = match.index + match[0].length;
  }
  html += esc(source.slice(offset));
  box.innerHTML = html;
})();
</script>`;
function previewBox(data, file) {
    const rawHref = blobUrl(data.owner, data.name, file.path, true);
    const header = (badge, actions) => `  <div class="preview-box-header">
    <div class="preview-file-info">
      <div class="preview-file-name">${ICONS.file}<span>${escapeHtml(file.path)}</span></div>
      ${badge}
    </div>
    <div class="preview-actions">${actions}</div>
  </div>`;
    const rawButton = `<a class="btn-mini" href="${escapeHtml(rawHref)}">${ICONS.raw} Raw</a>`;
    if (file.text === null) {
        const why = file.binary
            ? 'This file is binary and cannot be displayed.'
            : `This file is too large to display (${escapeHtml(formatSize(file.sizeBytes))}).`;
        const badge = `<span class="meta-badge">${escapeHtml(formatSize(file.sizeBytes))}</span>`;
        return `<div class="preview-box">
${header(badge, rawButton)}
  <div class="file-note">${why}<br>Use <strong>Raw</strong> to download it.</div>
</div>`;
    }
    const { text, lines } = shownText(file);
    const language = languageLabel(file.path);
    const eol = (file.text ?? '').includes('\r\n') ? 'CRLF' : 'LF';
    const badge = `<span class="meta-badge"><span class="dot"></span>${escapeHtml(language)} · ${escapeHtml(formatSize(file.sizeBytes))}</span>`;
    const actions = `<button class="btn-mini" id="copy-code" type="button" title="Copy the file">${ICONS.copy}<span class="btn-label">Copy</span></button>${rawButton}`;
    const entry = data.overview.entries.find((item) => item.path === file.path);
    const commit = entry?.commit ?? data.overview.lastCommit;
    const footer = commit
        ? `    <div>Last commit: <strong>${escapeHtml(commit.subject)}</strong> · ${escapeHtml(commit.author)} · ${escapeHtml(relativeTime(commit.date))} · <code>${escapeHtml(commit.sha.slice(0, 7))}</code></div>`
        : '    <div>No commit information for this file.</div>';
    const truncated = file.truncated
        ? ' <span class="warning">· preview truncated</span>'
        : '';
    const gutter = Array.from({ length: lines }, (_value, index) => index + 1).join('\n');
    return `<div class="preview-box">
${header(badge, actions)}
  <div class="preview-toolbar">
    <div class="toolbar-left">
      <span>${escapeHtml(language)}</span><span class="dot-sep">·</span>
      <span>UTF-8</span><span class="dot-sep">·</span>
      <span>${eol}</span>
    </div>
    <div class="toolbar-right">
      <span>${lines} ${lines === 1 ? 'line' : 'lines'}</span><span class="dot-sep">·</span>
      <span class="read-only">read-only</span>
    </div>
  </div>
  <div class="code-wrap">
    <div class="line-nums" aria-hidden="true">${escapeHtml(gutter)}</div>
    <div class="code-content" id="code-content" data-lang="${escapeHtml(language)}">${escapeHtml(text)}</div>
  </div>
  <div class="preview-footer">
${footer}
    <div><code>HEAD:${escapeHtml(file.path)}</code>${truncated}</div>
  </div>
</div>
${COPY_SCRIPT}
${HIGHLIGHT_SCRIPT}`;
}
export function cloneControls(cloneUrl) {
    return `<button class="btn-code" id="clone-toggle" type="button" title="Show the Git remote">${ICONS.link} Git URL</button>
<div class="clone-input-wrap" id="clone-wrap">
  <input id="clone-input" readonly value="${escapeHtml(cloneUrl)}">
  <button id="clone-copy" type="button" title="Copy the Git URL">⎘</button>
</div>
<script>
(function () {
  var toggle = document.getElementById('clone-toggle');
  var wrap = document.getElementById('clone-wrap');
  var input = document.getElementById('clone-input');
  var copy = document.getElementById('clone-copy');
  toggle.addEventListener('click', function () { wrap.classList.toggle('is-open'); });
  copy.addEventListener('click', function () {
    input.select();
    try { document.execCommand('copy'); } catch (error) {}
    copy.textContent = '✓';
    setTimeout(function () { copy.textContent = '⎘'; }, 1500);
  });
})();
</script>`;
}
export function shell(title, body, headerRight) {
    const { brand } = getSettings();
    const right = headerRight !== undefined ? headerRight : '<a class="header-link" href="/#quickstart">Quick start</a>';
    return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<link rel="icon" href="/favicon.ico">
<title>${escapeHtml(title)} · ${escapeHtml(brand)}</title>
<style>${STYLES}${LAYOUT_CSS}</style>
</head>
<body>
${siteHeader('page-wide', right)}
<div class="lite-container">
${body}
</div>
${siteFooter('page-wide')}
</body>
</html>`;
}
export function repositoryPage(data) {
    const label = `${data.owner}@${data.name}.git`;
    const { overview } = data;
    const file = data.file ?? null;
    const lastCommit = overview.lastCommit;
    const dir = overview.dir;
    const fileCount = overview.entries.length;
    const stats = [
        `<span class="stat">${ICONS.commits}<strong>${overview.commits}</strong> ${overview.commits === 1 ? 'commit' : 'commits'}</span>`,
        `<span class="stat">${ICONS.size}<strong>${escapeHtml(formatSize(overview.sizeBytes))}</strong></span>`,
    ].join('');
    let list;
    if (!lastCommit) {
        list = `<div class="file-list-box">
    <div class="file-list-header"><span class="commit-meta">Empty repository</span></div>
    <div class="empty-note">No commits yet. Push your first commit:
      <code>git clone ${escapeHtml(data.cloneUrl)}</code></div>
  </div>`;
    }
    else if (fileCount === 0) {
        list = `<div class="file-list-box">
    <div class="file-list-header">${commitRowHeader(lastCommit)}</div>
    <div class="empty-note">This directory is empty.</div>
  </div>`;
    }
    else {
        list = `<div class="file-list-box">
    <div class="file-list-header">${commitRowHeader(lastCommit)}</div>
    ${fileRows(data)}
  </div>`;
    }
    const where = dir === '' ? 'root' : `<code>${escapeHtml(dir)}</code>`;
    const lastLine = lastCommit
        ? `<span>· ${fileCount} ${fileCount === 1 ? 'item' : 'items'} in ${where} · last updated ${escapeHtml(relativeTime(lastCommit.date))}</span>`
        : '<span>· empty repository</span>';
    const body = `<div class="repo-title-row">
  <a class="repo-title-left" href="${escapeHtml(repoUrl(data.owner, data.name))}">
    <h1>${ICONS.repo}${escapeHtml(data.name)}</h1>
    <span class="public-badge">${data.isPrivate ? 'Private' : 'Public'}</span>
  </a>
</div>
<div class="stats-line">${stats}</div>
<div class="action-row">
  <div class="file-count">${lastLine}</div>
  <div class="clone-row">${cloneControls(data.cloneUrl)}</div>
</div>
${breadcrumbBar(data)}
${file ? previewBox(data, file) : `${list}${readmeBox(data)}`}
`;
    const headerRight = `<a class="header-link" href="${escapeHtml(repoUrl(data.owner, data.name))}">${escapeHtml(label)}</a>`;
    return shell(label, body, headerRight);
}
export function errorPage(title, message) {
    const body = `<div class="repo-title-row">
  <div class="repo-title-left"><h1>${ICONS.repo}${escapeHtml(title)}</h1></div>
</div>
<div class="stats-line" style="border-bottom: 0; margin-bottom: 0"><span class="stat">${escapeHtml(message)}</span></div>`;
    return shell(title, body);
}
//# sourceMappingURL=repository.js.map