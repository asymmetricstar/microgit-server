/**
 * Defensive helpers: safe property access, type coercion and path/injection
 * guards. Used at API boundaries so malformed or missing input never crashes
 * the server.
 */
/** Safe nested property access. Returns `defaultValue` when any segment is missing. */
export function safeGet(obj, key, defaultValue = undefined) {
    if (obj === null || obj === undefined)
        return defaultValue;
    const value = obj[key];
    return value === undefined || value === null ? defaultValue : value;
}
/** Coerce to string. null/undefined/non-string returns `defaultValue`. */
export function safeString(value, defaultValue = '') {
    if (value === null || value === undefined)
        return defaultValue;
    if (typeof value === 'string')
        return value;
    return defaultValue;
}
/** Coerce to number. Invalid returns `defaultValue`. */
export function safeNumber(value, defaultValue = 0) {
    if (value === null || value === undefined)
        return defaultValue;
    if (typeof value === 'number' && Number.isFinite(value))
        return value;
    const parsed = Number.parseInt(String(value), 10);
    return Number.isFinite(parsed) ? parsed : defaultValue;
}
/** Coerce to boolean. Ambiguous values return `defaultValue`. */
export function safeBoolean(value, defaultValue = false) {
    if (value === null || value === undefined)
        return defaultValue;
    if (typeof value === 'boolean')
        return value;
    if (typeof value === 'string') {
        const lower = value.trim().toLowerCase();
        if (lower === 'true' || lower === '1' || lower === 'yes' || lower === 'on')
            return true;
        if (lower === 'false' || lower === '0' || lower === 'no' || lower === 'off')
            return false;
    }
    return defaultValue;
}
/** Reject path traversal, null bytes and backslashes. */
export function isSafePath(value) {
    if (!value || typeof value !== 'string')
        return false;
    if (value.includes('\0'))
        return false;
    if (value.includes('\\'))
        return false;
    const segments = value.split('/');
    return segments.every((seg) => seg !== '..' && seg !== '.');
}
/** Strip prototype-pollution keys from a plain object. */
export function sanitizeObject(obj) {
    const clean = {};
    for (const [key, value] of Object.entries(obj)) {
        if (key === '__proto__' || key === 'constructor' || key === 'prototype')
            continue;
        clean[key] = value;
    }
    return clean;
}
/** Require a non-empty string; throw when missing. */
export function requireNonEmpty(value, field) {
    const str = safeString(value);
    if (str.trim() === '') {
        throw new Error(`'${field}' is required and must not be empty`);
    }
    return str.trim();
}
//# sourceMappingURL=safe.js.map