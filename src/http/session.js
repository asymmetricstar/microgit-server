import { userForToken } from '../accounts/sessions.js';
import { config } from '../config/config.js';
import { RepoError } from '../config/errors.js';
import { parseBearerAuth } from '../security/auth.js';
import { header } from './request.js';
export const SESSION_COOKIE = 'sid';
export function cookieValue(req, name) {
    const raw = header(req, 'cookie');
    if (!raw)
        return null;
    for (const part of raw.split(';')) {
        const index = part.indexOf('=');
        if (index === -1 || part.slice(0, index).trim() !== name)
            continue;
        try {
            return decodeURIComponent(part.slice(index + 1).trim());
        }
        catch {
            return null;
        }
    }
    return null;
}
export function isSecureRequest(req) {
    const forwarded = config.trustProxy ? header(req, 'x-forwarded-proto') : null;
    if (forwarded)
        return forwarded.split(',')[0].trim() === 'https';
    return Boolean(req.socket.encrypted);
}
export function appendSetCookie(res, value) {
    const existing = res.getHeader('Set-Cookie');
    const list = existing === undefined ? [] : Array.isArray(existing) ? existing : [String(existing)];
    res.setHeader('Set-Cookie', [...list, value]);
}
export function setSessionCookie(req, res, token, expiresAt) {
    const expiresAtMs = new Date(expiresAt).getTime();
    const maxAge = Number.isFinite(expiresAtMs) ? Math.max(0, Math.floor((expiresAtMs - Date.now()) / 1000)) : 0;
    const parts = [
        `${SESSION_COOKIE}=${encodeURIComponent(token)}`,
        'Path=/',
        'HttpOnly',
        'SameSite=Lax',
        `Max-Age=${maxAge}`,
    ];
    if (isSecureRequest(req))
        parts.push('Secure');
    appendSetCookie(res, parts.join('; '));
}
export function clearSessionCookie(req, res) {
    const parts = [`${SESSION_COOKIE}=`, 'Path=/', 'HttpOnly', 'SameSite=Lax', 'Max-Age=0'];
    if (isSecureRequest(req))
        parts.push('Secure');
    appendSetCookie(res, parts.join('; '));
}
export function sessionToken(req) {
    return parseBearerAuth(req) ?? cookieValue(req, SESSION_COOKIE);
}
export function currentUser(req) {
    const token = sessionToken(req);
    return token ? userForToken(token) : null;
}
export function requireUser(req) {
    const user = currentUser(req);
    if (!user) {
        throw new RepoError(401, 'Sign in first: POST /api/login keeps a session cookie, or send Authorization: Bearer <token>');
    }
    return user;
}
//# sourceMappingURL=session.js.map