import { createHash, randomBytes, scrypt, timingSafeEqual } from 'node:crypto';
import { promisify } from 'node:util';
const scryptAsync = promisify(scrypt);
const SALT_BYTES = 16;
const KEY_BYTES = 32;
export function newSalt() {
    return randomBytes(SALT_BYTES).toString('hex');
}
export async function hashPassword(password, salt) {
    const derived = await scryptAsync(password, salt, KEY_BYTES);
    return derived.toString('hex');
}
export async function sealSecret(password) {
    const salt = newSalt();
    return { salt, hash: await hashPassword(password, salt) };
}
export async function verifyPassword(password, stored) {
    const derived = Buffer.from(await hashPassword(password, stored.salt), 'hex');
    const expected = Buffer.from(stored.hash, 'hex');
    if (derived.length !== expected.length) {
        return false;
    }
    return timingSafeEqual(derived, expected);
}
export function hashToken(token) {
    return createHash('sha256').update(token, 'utf8').digest('hex');
}
export function newToken(bytes = 32) {
    return randomBytes(bytes).toString('base64url');
}
export function parseBasicAuth(req) {
    const header = req.headers.authorization;
    if (!header)
        return null;
    const match = /^Basic\s+([A-Za-z0-9+/=]+)$/i.exec(header.trim());
    if (!match)
        return null;
    const decoded = Buffer.from(match[1], 'base64').toString('utf8');
    const separator = decoded.indexOf(':');
    if (separator === -1)
        return null;
    return {
        username: decoded.slice(0, separator),
        password: decoded.slice(separator + 1),
    };
}
export function parseBearerAuth(req) {
    const header = req.headers.authorization;
    if (!header)
        return null;
    const match = /^Bearer\s+([A-Za-z0-9._~+/=-]+)$/i.exec(header.trim());
    return match ? match[1] : null;
}
export function isPushRequest(pathname, search) {
    if (pathname.endsWith('/git-receive-pack'))
        return true;
    return /(?:^|[?&])service=git-receive-pack(?:&|$)/.test(search);
}
//# sourceMappingURL=auth.js.map