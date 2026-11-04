import { isAdminUser } from '../../accounts/users.js';
import { RepoError } from '../../config/errors.js';
import { queryAudit } from '../../data/audit.js';
import { escapeHtml } from '../pages/html.js';
import { ICONS, shell } from '../pages/repository.js';
import { sendHtml, sendJson } from '../response.js';
import { requireUser } from '../session.js';
export function auditPage(rows, filter) {
    const body = rows
        .map((row) => `<tr>
      <td>${escapeHtml(row.at)}</td>
      <td><b>${escapeHtml(row.action)}</b></td>
      <td>${escapeHtml(row.actor ?? '-')}</td>
      <td>${escapeHtml(row.repo ?? '-')}</td>
      <td>${escapeHtml(row.status)}</td>
      <td class="muted">${escapeHtml(row.ip ?? '-')}</td>
      <td class="muted">${escapeHtml(row.detail ?? '')}</td>
    </tr>`)
        .join('\n');
    const page = `<div class="repo-title-row">
  <div class="repo-title-left">
    <h1>${ICONS.repo}Audit trail</h1>
    <span class="public-badge">${rows.length} ${rows.length === 1 ? 'entry' : 'entries'}</span>
  </div>
  <div class="repo-title-actions">
    <a class="btn-lite" href="/api/audit?format=json">JSON</a>
  </div>
</div>
<div class="stats-line"><span class="stat">${ICONS.commits}<strong>${rows.length}</strong> recorded events, newest first</span></div>
<form class="filter-form" method="get" action="/api/audit">
  <input name="action" placeholder="action (repo.create)" value="${escapeHtml(filter.action ?? '')}">
  <input name="repo" placeholder="repo (owner/name)" value="${escapeHtml(filter.repo ?? '')}">
  <input type="hidden" name="format" value="html">
  <button type="submit">Filter</button>
  <a class="form-link" href="/api/audit?format=json">View as JSON</a>
</form>
<div class="table-box">
<table>
  <thead><tr><th>Time</th><th>Action</th><th>Actor</th><th>Repository</th><th>Status</th><th>IP</th><th>Detail</th></tr></thead>
  <tbody>${body || '<tr><td colspan="7" class="muted">No entries yet.</td></tr>'}</tbody>
</table>
</div>`;
    return shell('Audit trail', page);
}
export async function handleAudit(req, res, url) {
    const user = requireUser(req);
    if (!isAdminUser(user)) {
        throw new RepoError(403, 'An administrator account is required to read the audit trail');
    }
    const action = url.searchParams.get('action') ?? undefined;
    const repo = url.searchParams.get('repo') ?? undefined;
    const limitRaw = Number.parseInt(url.searchParams.get('limit') ?? '100', 10);
    const rows = queryAudit({ action, repo, limit: Number.isFinite(limitRaw) ? limitRaw : 100 });
    const format = (url.searchParams.get('format') ?? 'json').toLowerCase();
    if (format === 'html') {
        sendHtml(res, 200, auditPage(rows, { action, repo }));
        return;
    }
    sendJson(res, 200, { count: rows.length, entries: rows });
}
//# sourceMappingURL=audit.js.map