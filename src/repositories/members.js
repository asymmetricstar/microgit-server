import { repoDb, usersDb } from '../data/db.js';
function toRole(value) {
    return value === 'write' ? 'write' : 'read';
}
export function listRepoMembers(repoId) {
    const rows = repoDb()
        .prepare(`SELECT user_id, role, created_at FROM repo_members
       WHERE repo_id = ?
       ORDER BY created_at, user_id`)
        .all(repoId);
    if (rows.length === 0)
        return [];
    const ids = rows.map((row) => row.user_id);
    const placeholders = ids.map(() => '?').join(',');
    const accounts = usersDb()
        .prepare(`SELECT id, username FROM users WHERE id IN (${placeholders})`)
        .all(...ids);
    const names = new Map(accounts.map((account) => [account.id, account.username]));
    const members = [];
    for (const row of rows) {
        const username = names.get(row.user_id);
        if (username === undefined)
            continue;
        members.push({
            userId: row.user_id,
            username,
            role: toRole(row.role),
            addedAt: row.created_at,
        });
    }
    return members;
}
export function memberRole(repoId, userId) {
    const row = repoDb()
        .prepare('SELECT role FROM repo_members WHERE repo_id = ? AND user_id = ?')
        .get(repoId, userId);
    return row ? toRole(row.role) : null;
}
export function setRepoMember(repoId, userId, role) {
    const existing = memberRole(repoId, userId);
    if (existing === null) {
        repoDb()
            .prepare(`INSERT INTO repo_members (repo_id, user_id, role, created_at)
         VALUES (?, ?, ?, ?)`)
            .run(repoId, userId, role, new Date().toISOString());
        return { created: true, role };
    }
    if (existing !== role) {
        repoDb()
            .prepare('UPDATE repo_members SET role = ? WHERE repo_id = ? AND user_id = ?')
            .run(role, repoId, userId);
    }
    return { created: false, role };
}
export function removeRepoMember(repoId, userId) {
    const result = repoDb()
        .prepare('DELETE FROM repo_members WHERE repo_id = ? AND user_id = ?')
        .run(repoId, userId);
    return Number(result.changes) > 0;
}
//# sourceMappingURL=members.js.map