import { getSettings } from '../config/settings.js';
import { usersDb } from '../data/db.js';
import { caches } from '../data/cache.js';
import { hashToken, newToken } from '../security/auth.js';
export function createSession(user) {
    const settings = getSettings();
    const token = newToken(32);
    const now = new Date();
    const expires = new Date(now.getTime() + settings.sessionDays * 24 * 60 * 60 * 1000);
    usersDb()
        .prepare('INSERT INTO sessions (token_hash, user_id, created_at, expires_at) VALUES (?, ?, ?, ?)')
        .run(hashToken(token), user.id, now.toISOString(), expires.toISOString());
    return { token, expiresAt: expires.toISOString() };
}
export function userForToken(token) {
    const key = `sess:${hashToken(token)}`;
    const cached = caches.session.get(key);
    if (cached !== undefined)
        return cached;
    const row = usersDb()
        .prepare(`SELECT u.id, u.username, u.is_admin, u.created_at, s.expires_at
       FROM sessions s JOIN users u ON u.id = s.user_id
       WHERE s.token_hash = ?`)
        .get(hashToken(token));
    let user = null;
    if (row && new Date(row.expires_at).getTime() > Date.now()) {
        user = {
            id: row.id,
            username: row.username,
            isAdmin: row.is_admin === 1,
            createdAt: row.created_at,
        };
    }
    const ttl = Math.min(getSettings().cacheTtlMs, 30_000);
    caches.session.set(key, user, ttl);
    return user;
}
export function revokeSession(token) {
    const result = usersDb()
        .prepare('DELETE FROM sessions WHERE token_hash = ?')
        .run(hashToken(token));
    caches.session.delete(`sess:${hashToken(token)}`);
    return Number(result.changes) > 0;
}
export function purgeExpiredSessions() {
    const result = usersDb()
        .prepare('DELETE FROM sessions WHERE expires_at <= ?')
        .run(new Date().toISOString());
    return Number(result.changes);
}
export function countSessions() {
    const row = usersDb()
        .prepare('SELECT COUNT(*) AS count FROM sessions WHERE expires_at > ?')
        .get(new Date().toISOString());
    return Number(row.count);
}
//# sourceMappingURL=sessions.js.map