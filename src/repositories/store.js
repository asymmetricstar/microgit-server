import fs from 'node:fs/promises';
import path from 'node:path';
import { config } from '../config/config.js';
import { getSettings } from '../config/settings.js';
import { caches } from '../data/cache.js';
import { repoDb, usersDb } from '../data/db.js';
import { normalizeOwner, slugify } from './naming.js';
function toRecord(row) {
    return {
        id: row.id,
        ownerId: row.owner_id,
        owner: row.owner,
        name: row.name,
        hash: row.hash,
        path: row.path,
        isPrivate: row.is_private === 1,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
    };
}
function repoCacheKey(owner, name) {
    return `repo:${owner}\u0000${name}`;
}
export function invalidateRepo(owner, name) {
    caches.repo.delete(repoCacheKey(owner, name));
}
export function lookupRepo(owner, name) {
    const key = repoCacheKey(owner, name);
    const cached = caches.repo.get(key);
    if (cached !== undefined)
        return cached;
    const row = repoDb()
        .prepare(`SELECT id, owner_id, owner, name, hash, path, is_private, created_at, updated_at
       FROM repos WHERE owner = ? AND name = ?`)
        .get(owner, name);
    const record = row ? toRecord(row) : null;
    caches.repo.set(key, record, getSettings().cacheTtlMs);
    return record;
}
export function findRepo(rawOwner, rawName) {
    const owner = normalizeOwner(rawOwner);
    const name = slugify(rawName, 'name');
    return lookupRepo(owner, name);
}
export function listRepos(filter = {}) {
    const where = [];
    const params = [];
    if (filter.owner) {
        where.push('owner = ?');
        params.push(normalizeOwner(filter.owner));
    }
    if (filter.name) {
        where.push('name = ?');
        params.push(slugify(filter.name, 'name'));
    }
    if (filter.private === true || filter.private === false) {
        where.push('is_private = ?');
        params.push(filter.private ? 1 : 0);
    }
    if (filter.viewer !== undefined) {
        const viewer = filter.viewer;
        if (viewer === null) {
            where.push('is_private = 0');
        }
        else if (!viewer.isAdmin) {
            where.push('(is_private = 0 OR owner_id = ?)');
            params.push(viewer.userId);
        }
    }
    const clause = where.length > 0 ? `WHERE ${where.join(' AND ')}` : '';
    const limit = Math.min(Math.max(filter.limit ?? 50, 1), 200);
    const page = Math.max(filter.page ?? 1, 1);
    const offset = (page - 1) * limit;
    const total = Number(repoDb()
        .prepare(`SELECT COUNT(*) AS count FROM repos ${clause}`)
        .get(...params).count);
    const rows = repoDb()
        .prepare(`SELECT id, owner_id, owner, name, hash, path, is_private, created_at, updated_at
       FROM repos ${clause}
       ORDER BY owner, name
       LIMIT ? OFFSET ?`)
        .all(...params, limit, offset);
    return {
        repositories: rows.map(toRecord),
        page,
        limit,
        total,
        pages: Math.max(Math.ceil(total / limit), 1),
    };
}
export async function readHead(repo) {
    try {
        const raw = (await fs.readFile(path.join(config.reposRoot, repo.path, 'HEAD'), 'utf8')).trim();
        const match = /^ref:\s*refs\/heads\/(.+)$/.exec(raw);
        return match ? match[1] : raw;
    }
    catch {
        return null;
    }
}
export async function ensureStorage() {
    await fs.mkdir(config.reposRoot, { recursive: true });
    await fs.mkdir(config.dataDir, { recursive: true });
    if (getSettings().template) {
        const templateDir = path.isAbsolute(getSettings().template)
            ? getSettings().template
            : path.resolve(process.cwd(), getSettings().template);
        await fs.mkdir(templateDir, { recursive: true });
    }
    repoDb();
    usersDb();
}
export function cloneUrlFor(repo, baseUrl) {
    const base = (config.publicUrl || baseUrl).replace(/\/+$/, '');
    return `${base}/${repo.owner}/${repo.name}.git`;
}
//# sourceMappingURL=store.js.map