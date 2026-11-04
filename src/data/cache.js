/**
 * A tiny in-memory TTL cache. No dependency, no timers: expired entries are
 * dropped when they are read or when the map is swept, so an idle process never
 * wakes up just to evict.
 *
 * Insertion order doubles as LRU order: a hit moves the key to the end, and
 * eviction drops the oldest entry first.
 */
export class TtlCache {
    maxEntries;
    defaultTtlMs;
    entries = new Map();
    constructor(maxEntries = 1000, defaultTtlMs = 5000) {
        this.maxEntries = maxEntries;
        this.defaultTtlMs = defaultTtlMs;
    }
    get(key) {
        const hit = this.entries.get(key);
        if (!hit)
            return undefined;
        if (hit.expiresAt <= Date.now()) {
            this.entries.delete(key);
            return undefined;
        }
        // Refresh recency so hot keys survive eviction.
        this.entries.delete(key);
        this.entries.set(key, hit);
        return hit.value;
    }
    /** Return the cached value, or compute and store it. Rejections are not cached. */
    async remember(key, work, ttlMs = this.defaultTtlMs) {
        const hit = this.get(key);
        if (hit !== undefined)
            return hit;
        const value = await work();
        this.set(key, value, ttlMs);
        return value;
    }
    set(key, value, ttlMs = this.defaultTtlMs) {
        if (this.entries.size >= this.maxEntries)
            this.evictOne();
        this.entries.set(key, { value, expiresAt: Date.now() + ttlMs });
    }
    delete(key) {
        this.entries.delete(key);
    }
    clear() {
        this.entries.clear();
    }
    /** Drop every entry whose key starts with a prefix (used for whole-repo groups). */
    deletePrefix(prefix) {
        for (const key of this.entries.keys()) {
            if (key.startsWith(prefix))
                this.entries.delete(key);
        }
    }
    /** Remove expired entries; returns how many were dropped. */
    sweep() {
        const now = Date.now();
        let removed = 0;
        for (const [key, entry] of this.entries) {
            if (entry.expiresAt <= now) {
                this.entries.delete(key);
                removed += 1;
            }
        }
        return removed;
    }
    get size() {
        return this.entries.size;
    }
    evictOne() {
        const oldest = this.entries.keys().next();
        if (!oldest.done)
            this.entries.delete(oldest.value);
    }
}
/** Cache groups used by the server, all invalidated explicitly on writes. */
export const caches = {
    /** `owner\0name` -> repository row (also caches misses as `null`). */
    repo: new TtlCache(2000, 5000),
    /** session token hash -> user id (`null` caches an invalid token). */
    session: new TtlCache(2000, 30_000),
};
export function cacheStats() {
    return {
        repo: describe(caches.repo),
        session: describe(caches.session),
    };
}
function describe(cache) {
    return { size: cache.size, maxEntries: cache.maxEntries, ttlMs: cache.defaultTtlMs };
}
//# sourceMappingURL=cache.js.map