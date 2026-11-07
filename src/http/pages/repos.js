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
  .repo-name { color: #292d30e8; font-size: auto; }
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
      <span class="repo-row-badge${repo.isPrivate ? " private" : ""}">${repo.isPrivate ? "Private" : "Public"}</span>
      <span class="repo-row-arrow">
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" height="24px" width="24px" fill="#e3e3e3"><path d="M16.6,20.98q-0.2-0.05-0.38-0.18l-3-1.75q-0.35-0.2-0.54-0.54q-0.19-0.34-0.19-0.74V14.25q0-0.4 0.19-0.74t0.54-0.54l3-1.75q0.18-0.13 0.38-0.18T17,11t0.39,0.06t0.36,0.16l3,1.75q0.35,0.2 0.55,0.54t0.2,0.74v3.52q0,0.4-0.2,0.74t-0.55,0.54l-3,1.75q-0.18,0.1-0.36,0.16T17,21.03t-0.4-0.05ZM7.18,10.83Q6,9.65 6,8T7.18,5.18T10,4t2.83,1.18T14,8t-1.17,2.82T10,12T7.18,10.83ZM2,20V17.2q0-0.82 0.43-1.55t1.17-1.1q1.27-0.65 2.88-1.1T10,13q0.2,0 0.35,0t0.3,0.05q-0.2,0.45-0.34,0.94Q10.18,14.48 10.1,15H10q-1.78,0-3.19,0.45T4.5,16.35Q4.28,16.48 4.14,16.7Q4,16.93 4,17.2V18h6.3q0.15,0.52 0.4,1.04T11.25,20H2ZM11.41,9.41Q12,8.82 12,8T11.41,6.59T10,6Q9.18,6 8.59,6.59Q8,7.18 8,8T8.59,9.41T10,10t1.41-0.59ZM10,8Zm0.3,10Zm4.35-4.15L17,15.23l2.35-1.38L17,12.5l-2.35,1.35Zm3.1,5.2L20,17.75V15l-2.25,1.32v2.73ZM14,17.75l2.25,1.32V16.35L14,15.03v2.72Z"/></svg>
      </span>
      <span class="repo-row-name">
        <span class="repo-name">${escapeHtml(repo.owner)}@${escapeHtml(repo.name)}.git</span>
      </span>
      ${updated ? `<span class="repo-row-meta">Updated ${escapeHtml(updated)}</span>` : ""}
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