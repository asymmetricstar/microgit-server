export function safeGet(obj, key, defaultValue = undefined) {
    if (obj === null || obj === undefined)
        return defaultValue;
    const value = obj[key];
    return value === undefined || value === null ? defaultValue : value;
}
export function safeString(value, defaultValue = '') {
    if (value === null || value === undefined)
        return defaultValue;
    if (typeof value === 'string')
        return value;
    return defaultValue;
}
export function safeNumber(value, defaultValue = 0) {
    if (value === null || value === undefined)
        return defaultValue;
    if (typeof value === 'number' && Number.isFinite(value))
        return value;
    const parsed = Number.parseInt(String(value), 10);
    return Number.isFinite(parsed) ? parsed : defaultValue;
}
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
export function sanitizeObject(obj) {
    const clean = {};
    for (const [key, value] of Object.entries(obj)) {
        if (key === '__proto__' || key === 'constructor' || key === 'prototype')
            continue;
        clean[key] = value;
    }
    return clean;
}
export function requireNonEmpty(value, field) {
    const str = safeString(value);
    if (str.trim() === '') {
        throw new Error(`'${field}' is required and must not be empty`);
    }
    return str.trim();
}
//# sourceMappingURL=safe.js.map