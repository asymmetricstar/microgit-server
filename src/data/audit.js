import { usersDb } from './db.js';
/** Append one line to the audit trail. Never throws: auditing must not break a request. */
export function recordAudit(entry) {
    try {
        usersDb()
            .prepare(`INSERT INTO audit (at, action, actor, ip, repo, status, detail)
         VALUES (?, ?, ?, ?, ?, ?, ?)`)
            .run(entry.at, entry.action, entry.actor ?? null, entry.ip ?? null, entry.repo ?? null, entry.status, entry.detail ?? null);
    }
    catch (error) {
        console.error('[audit] failed to record entry:', error.message);
    }
}
export function queryAudit(query = {}) {
    const where = [];
    const params = [];
    if (query.action) {
        where.push('action = ?');
        params.push(query.action);
    }
    if (query.repo) {
        where.push('repo = ?');
        params.push(query.repo);
    }
    const limit = Math.min(Math.max(query.limit ?? 100, 1), 1000);
    params.push(limit);
    const sql = `SELECT id, at, action, actor, ip, repo, status, detail
               FROM audit
               ${where.length > 0 ? `WHERE ${where.join(' AND ')}` : ''}
               ORDER BY id DESC
               LIMIT ?`;
    return usersDb().prepare(sql).all(...params);
}
//# sourceMappingURL=audit.js.map