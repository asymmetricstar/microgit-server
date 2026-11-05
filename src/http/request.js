import { config } from '../config/config.js';
import { RepoError, isBlank } from '../config/errors.js';
/** Largest JSON body the API accepts; git bodies are streamed to git itself. */
const MAX_API_BODY = 64 * 1024;
/** Absolute origin for clone URLs and generated links. */
export function originFor(req) {
    if (config.publicUrl)
        return config.publicUrl;
    const forwardedProto = header(req, 'x-forwarded-proto');
    const forwardedHost = header(req, 'x-forwarded-host');
    const proto = config.trustProxy && forwardedProto ? forwardedProto.split(',')[0].trim() : 'http';
    const host = (config.trustProxy && forwardedHost ? forwardedHost.split(',')[0].trim() : '') ||
        req.headers.host ||
        `${config.host}:${config.port}`;
    return `${proto}://${host}`;
}
/** First value of a request header, or `null`. */
export function header(req, name) {
    const value = req.headers[name];
    if (Array.isArray(value))
        return value[0] ?? null;
    return typeof value === 'string' ? value : null;
}
/** Caller address, honouring `X-Forwarded-For` only for a trusted proxy. */
export function clientIp(req) {
    const forwarded = config.trustProxy ? header(req, 'x-forwarded-for') : null;
    if (forwarded)
        return forwarded.split(',')[0].trim();
    return req.socket.remoteAddress ?? '';
}
/** Percent-decode and reject anything that could escape the repositories root. */
export function decodePathname(raw) {
    let decoded;
    try {
        decoded = decodeURIComponent(raw);
    }
    catch {
        throw new RepoError(400, 'Malformed percent-encoding in path');
    }
    if (decoded.includes('\0') || decoded.includes('\\')) {
        throw new RepoError(400, 'Illegal character in path');
    }
    if (!decoded.startsWith('/')) {
        throw new RepoError(400, 'Path must start with a slash');
    }
    const segments = decoded.split('/').slice(1);
    if (segments.some(isTraversalSegment)) {
        throw new RepoError(400, 'Path traversal is not allowed');
    }
    return decoded;
}
/**
 * True for a path segment that may resolve to `.` or `..`.
 *
 * Win32 trims trailing dots and spaces from every path component, so `.. ` is
 * the parent directory and a segment made only of dots or spaces collapses;
 * comparing the raw segment alone would let such a request escape the root
 * (git's own `daemon_avoid_alias` check does not catch this either).
 */
function isTraversalSegment(segment) {
    const folded = segment.replace(/[. ]+$/, '');
    if (folded === '')
        return segment !== '';
    return folded === '.' || folded === '..';
}
/** Read and parse a bounded JSON object body. */
export async function readJsonBody(req) {
    // Refuse a declared size before reading a byte; Node discards the rest of
    // the request once the error response is written.
    const declared = Number(req.headers['content-length']);
    if (Number.isFinite(declared) && declared > MAX_API_BODY) {
        throw new RepoError(413, 'Request body too large');
    }
    const chunks = [];
    let size = 0;
    for await (const chunk of req) {
        const buffer = Buffer.isBuffer(chunk) ? chunk : Buffer.from(String(chunk));
        size += buffer.length;
        if (size > MAX_API_BODY)
            throw new RepoError(413, 'Request body too large');
        chunks.push(buffer);
    }
    const raw = Buffer.concat(chunks);
    let parsed;
    try {
        parsed = JSON.parse(raw.length ? raw.toString('utf8') : '{}');
    }
    catch {
        throw new RepoError(400, 'Request body is not valid JSON');
    }
    if (parsed === null || typeof parsed !== 'object' || Array.isArray(parsed)) {
        throw new RepoError(400, 'Request body must be a JSON object');
    }
    return parsed;
}
/** A field the caller must send: missing, `null`, blank or non-string is a 400. */
export function requiredField(payload, key) {
    const value = payload[key];
    if (isBlank(value))
        throw new RepoError(400, `'${key}' is required`);
    if (typeof value !== 'string')
        throw new RepoError(400, `'${key}' must be a string`);
    return value;
}
/** Optional boolean field: missing means the fallback, anything else must be a boolean. */
export function booleanField(payload, key, fallback) {
    const value = payload[key];
    if (value === undefined || value === null)
        return fallback;
    if (typeof value !== 'boolean')
        throw new RepoError(400, `'${key}' must be true or false`);
    return value;
}
//# sourceMappingURL=request.js.map