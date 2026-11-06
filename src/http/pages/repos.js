import { getSettings } from '../../config/settings.js';
import { escapeHtml } from './html.js';
import { pageShell } from './layout.js';
import { listRepos } from '../../repositories/store.js';
const PAGE_CSS = `
  .repos-page h1 {
    font-size: 24px; font-weight: 600; letter-spacing: -0.3px;
    color: var(--text-black); margin: 0 0 8px;
  }
  .repos-page .desc {
    font-size: 14px; color: var(--text-secondary); margin: 0 0 24px;
  }
  .repo-card { border: 1px solid var(--border); border-radius: 6px; overflow: hidden; background: var(--bg); margin-bottom: 24px; }
  .repo-card-header {
    display: flex; align-items: center; justify-content: space-between; gap: 12px; flex-wrap: wrap;
    padding: 10px 16px; background: var(--bg-subtle); border-bottom: 1px solid var(--border);
    font-size: 13px; font-weight: 600; color: var(--text-black);
  }
  .repo-card-header .label { font-size: 11px; font-weight: 500; text-transform: uppercase; letter-spacing: 0.05em; color: var(--text-secondary); font-family: "JetBrains Mono", ui-monospace, SFMono-Regular, Menlo, monospace; }
  .repo-card-header .count { font-size: 11px; color: var(--text-secondary); font-family: "JetBrains Mono", ui-monospace, SFMono-Regular, Menlo, monospace; }
  .repo-row {
    display: flex; align-items: center; gap: 10px; padding: 9px 16px;
    border-bottom: 1px solid #EAEEF2; color: var(--text); text-decoration: none;
  }
  .repo-row:last-child { border-bottom: 0; }
  .repo-row:hover { background: var(--bg-subtle); text-decoration: none; }
  .repo-row:hover .repo-name { color: var(--blue); }
  .repo-row-icon { width: 16px; height: 16px; color: var(--text-secondary); flex-shrink: 0; }
  .repo-row-name { font-weight: 600; color: var(--text-black); min-width: 120px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .repo-row-arrow { color: var(--text-secondary); font-size: 12px; font-weight: 600; white-space: nowrap; }
  .repo-row-badge { display: inline-flex; align-items: center; height: 20px; padding: 0 8px; border: 1px solid var(--border); border-radius: 999px; font-size: 11px; font-weight: 500; color: var(--text-secondary); background: var(--bg); white-space: nowrap; }
  .repo-row-badge.private { background: #fff8c5; border-color: #d9a01c40; color: #7d4e00; }
  .repo-row-meta { color: var(--text-secondary); font-size: 12px; white-space: nowrap; margin-left: auto; }
  .repo-empty { padding: 22px 16px; font-size: 13px; color: var(--text-secondary); text-align: center; }
  .repo-summary { margin-top: 16px; padding: 14px 16px; border: 1px solid var(--border); border-radius: 6px; background: var(--bg-subtle); display: flex; flex-wrap: wrap; gap: 16px; font-size: 12px; color: var(--text-secondary); font-family: "JetBrains Mono", ui-monospace, SFMono-Regular, Menlo, monospace; }
  .repo-summary strong { color: var(--text-black); font-weight: 600; }
`;
export function reposPage(base) {
    const { brand } = getSettings();
    const result = listRepos({ limit: 200, viewer: null });
    const repos = result.repositories;
    const rows = repos
        .slice()
        .sort((a, b) => {
        if (a.isPrivate !== b.isPrivate)
            return a.isPrivate ? 1 : -1;
        const oa = a.owner.toLowerCase();
        const ob = b.owner.toLowerCase();
        if (oa !== ob)
            return oa.localeCompare(ob);
        return a.name.localeCompare(b.name);
    })
        .map((repo) => {
        const href = `/${encodeURIComponent(repo.owner)}/${encodeURIComponent(repo.name)}/`;
        const updated = repo.updatedAt ? new Date(repo.updatedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '';
        return `<a class="repo-row" href="${escapeHtml(href)}">
      <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor" style="color:var(--text-secondary);flex-shrink:0"><path d="M2 2.5A2.5 2.5 0 0 1 4.5 0h8.75a.75.75 0 0 1 .75.75v12.5a.75.75 0 0 1-.75.75h-2.5a.75.75 0 0 1 0-1.5h1.75v-2.5a3.25 3.25 0 0 0-3.25-3.25H4.5A2.5 2.5 0 0 0 2 9.5v3.75a.75.75 0 0 1-1.5 0V2.5Z"/></svg>
      <span class="repo-row-name">${escapeHtml(repo.owner)}/${escapeHtml(repo.name)}</span>
      <span class="repo-row-arrow">&gt;</span>
      <span class="repo-row-badge${repo.isPrivate ? ' private' : ''}">${repo.isPrivate ? 'Private' : 'Public'}</span>
      ${updated ? `<span class="repo-row-meta">Updated ${escapeHtml(updated)}</span>` : ''}
    </a>`;
    })
        .join('');
    const listHtml = repos.length === 0
        ? `<div style="padding:22px 16px;font-size:13px;color:var(--text-secondary);text-align:center">No repositories yet.</div>`
        : `<div class="repo-card">
      <div class="repo-card-header">
        <span class="label">${escapeHtml(base.replace(/\/$/, '').replace(/^https?:\/\//, ''))} / repositories</span>
        <span class="count">${repos.length} ${repos.length === 1 ? 'repo' : 'repos'}</span>
      </div>
      ${rows}
    </div>`;
    const body = `<div style="padding-top: 70px;">
  <h1 style="font-size:24px;font-weight:600;letter-spacing:-0.3px;color:var(--text-black);margin:0 0 8px">Repositories</h1>
  <p style="font-size:14px;color:var(--text-secondary);margin:0 0 24px">${repos.length} ${repos.length === 1 ? 'repository' : 'repositories'} on this server.</p>
  ${listHtml}
  <div class="repo-summary">
    <span><strong>${repos.length}</strong> repos</span>
    <span><strong>${repos.length}</strong> records</span>
  </div>
</div>`;
    return pageShell(`Repositories`, body, {
        pageCss: PAGE_CSS,
        headerRight: '<a class="header-link" href="/">Home</a><a class="header-link" href="https://github.com/asymmetricstar/microgit-server">Github</a>',
        container: 'page-wide',
    });
}
//# sourceMappingURL=repos.js.map