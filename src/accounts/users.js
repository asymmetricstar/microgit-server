import { RepoError } from '../config/errors.js';
import { caches } from '../data/cache.js';
import { usersDb } from '../data/db.js';
import { sealSecret, verifyPassword } from '../security/auth.js';
const USERNAME_PATTERN = /^[a-z0-9][a-z0-9._-]{1,30}[a-z0-9]$/;
/** First URL segments the server answers itself, so no account may take them. */
const RESERVED_USERNAMES = new Set(['api', 'health', 'metrics']);
/** Lower-case and validate a username; it is also used as the Basic auth name. */
export function normalizeUsername(input) {
    if (typeof input !== 'string') {
        throw new RepoError(400, "'username' is required and must be a string");
    }
    const username = input.trim().toLowerCase();
    if (!USERNAME_PATTERN.test(username)) {
        throw new RepoError(400, 'A username of 3-32 characters is required: letters, digits, dot, dash or underscore');
    }
    if (RESERVED_USERNAMES.has(username)) {
        throw new RepoError(400, `'${username}' is reserved by the server`);
    }
    return username;
}
/** Validate the account password. */
export function normalizePassword(input) {
    if (typeof input !== 'string') {
        throw new RepoError(400, "'password' is required and must be a string");
    }
    if (input.length < 8 || input.length > 256) {
        throw new RepoError(400, 'A password of 8-256 characters is required');
    }
    return input;
}
function toUser(row) {
    return {
        id: row.id,
        username: row.username,
        isAdmin: row.is_admin === 1,
        createdAt: row.created_at,
    };
}
export function findUserByUsername(username) {
    const row = usersDb()
        .prepare('SELECT id, username, salt, hash, is_admin, created_at FROM users WHERE username = ?')
        .get(username);
    return row ?? null;
}
/** Create an account. The first account created becomes an administrator. */
export async function registerUser(rawUsername, rawPassword) {
    const username = normalizeUsername(rawUsername);
    const password = normalizePassword(rawPassword);
    if (findUserByUsername(username)) {
        throw new RepoError(409, `User '${username}' already exists`);
    }
    const { salt, hash } = await sealSecret(password);
    const created = new Date().toISOString();
    const first = countUsers() === 0;
    const result = usersDb()
        .prepare('INSERT INTO users (username, salt, hash, is_admin, created_at) VALUES (?, ?, ?, ?, ?)')
        .run(username, salt, hash, first ? 1 : 0, created);
    return {
        id: Number(result.lastInsertRowid),
        username,
        isAdmin: first,
        createdAt: created,
    };
}
/** A stored salt/hash to compare against when the username does not exist, so a
 *  login miss costs the same scrypt work as a wrong password. */
const DUMMY_SECRET = { salt: '00'.repeat(16), hash: '00'.repeat(32) };
/** Check a username/password pair; `null` means "wrong credentials". */
export async function authenticateUser(rawUsername, rawPassword) {
    const username = typeof rawUsername === 'string' ? rawUsername.trim().toLowerCase() : '';
    const password = typeof rawPassword === 'string' ? rawPassword : '';
    const row = username ? findUserByUsername(username) : null;
    const ok = await verifyPassword(password, row ?? DUMMY_SECRET);
    return row && ok ? toUser(row) : null;
}
export function countUsers() {
    const row = usersDb().prepare('SELECT COUNT(*) AS count FROM users').get();
    return Number(row.count);
}
/**
 * Administrators live only in the database (`users.is_admin`), so there is one
 * source of truth: no settings file can grant or take the flag away.
 */
export function isAdminUser(user) {
    return user.isAdmin;
}
/** Every account, oldest first. Passwords and salts never leave this module. */
export function listUsers() {
    const rows = usersDb()
        .prepare('SELECT id, username, is_admin, created_at FROM users ORDER BY id')
        .all();
    return rows.map((row) => ({
        id: row.id,
        username: row.username,
        isAdmin: row.is_admin === 1,
        createdAt: row.created_at,
    }));
}
export function countAdmins() {
    const row = usersDb()
        .prepare('SELECT COUNT(*) AS count FROM users WHERE is_admin = 1')
        .get();
    return Number(row.count);
}
/**
 * Grant or revoke the administrator flag. The last administrator cannot be
 * demoted, otherwise nobody could manage repositories or read the audit trail.
 * Sessions are cached for a few seconds, so the cache is cleared to make the
 * change visible on the very next request.
 */
export function setAdmin(rawUsername, isAdmin) {
    const username = normalizeUsername(rawUsername);
    const row = findUserByUsername(username);
    if (!row)
        throw new RepoError(404, `User '${username}' not found`);
    const wasAdmin = row.is_admin === 1;
    if (wasAdmin && !isAdmin && countAdmins() <= 1) {
        throw new RepoError(409, `'${username}' is the last administrator and cannot be demoted`);
    }
    if (wasAdmin !== isAdmin) {
        usersDb().prepare('UPDATE users SET is_admin = ? WHERE id = ?').run(isAdmin ? 1 : 0, row.id);
        caches.session.clear();
    }
    return { id: row.id, username: row.username, isAdmin, createdAt: row.created_at };
}
/**
 * Startup safety net: accounts are the only source of admin rights, so if the
 * flag is missing everywhere (an imported or restored database) the oldest
 * account is promoted instead of leaving the server without an administrator.
 * Returns the promoted username, or `null` when nothing changed.
 */
export function ensureAdminExists() {
    if (countUsers() === 0 || countAdmins() > 0)
        return null;
    const oldest = usersDb()
        .prepare('SELECT id, username FROM users ORDER BY id LIMIT 1')
        .get();
    if (!oldest)
        return null;
    usersDb().prepare('UPDATE users SET is_admin = 1 WHERE id = ?').run(oldest.id);
    caches.session.clear();
    return oldest.username;
}
//# sourceMappingURL=users.js.map