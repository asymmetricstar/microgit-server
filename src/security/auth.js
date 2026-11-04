import { createHash, randomBytes, scrypt, timingSafeEqual } from 'node:crypto';
import { promisify } from 'node:util';
const scryptAsync = promisify(scrypt);
/** Bytes of randomness in a password salt. */
const SALT_BYTES = 16;
/** Length of the derived key stored for a password. */
const KEY_BYTES = 32;
/** Fresh salt for hashing a password. */
export function newSalt() {
    return randomBytes(SALT_BYTES).toString('hex');
}
/** Derive the stored value for a password (scrypt). */
export async function hashPassword(password, salt) {
    const derived = await scryptAsync(password, salt, KEY_BYTES);
    return derived.toString('hex');
}
/** Salt and hash a clear-text password in one step. */
export async function sealSecret(password) {
    const salt = newSalt();
    return { salt, hash: await hashPassword(password, salt) };
}
/** Check a clear-text password against a stored salt/hash pair. */
export async function verifyPassword(password, stored) {
    const derived = Buffer.from(await hashPassword(password, stored.salt), 'hex');
    const expected = Buffer.from(stored.hash, 'hex');
    if (derived.length !== expected.length) {
        timingSafeEqual(derived, derived); // comparable work, then fail
        return false;
    }
    return timingSafeEqual(derived, expected);
}
/** Hash a bearer token or delete key for storage: the clear value is shown once. */
export function hashToken(token) {
    return createHash('sha256').update(token, 'utf8').digest('hex');
}
/** A fresh opaque token for sessions or repository delete keys. */
export function newToken(bytes = 32) {
    return randomBytes(bytes).toString('base64url');
}
/** Parse the `Authorization: Basic ...` header into its two halves. */
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
/** Parse `Authorization: Bearer <token>`, the credential used by the JSON API. */
export function parseBearerAuth(req) {
    const header = req.headers.authorization;
    if (!header)
        return null;
    const match = /^Bearer\s+([A-Za-z0-9._~+/=-]+)$/i.exec(header.trim());
    return match ? match[1] : null;
}
/**
 * True when the request touches the receive-pack service, i.e. a push:
 * the smart-HTTP advertisement (`?service=git-receive-pack`) or the RPC itself.
 * Upload-pack (clone/fetch) requests are intentionally not covered.
 */
export function isPushRequest(pathname, search) {
    if (pathname.endsWith('/git-receive-pack'))
        return true;
    return /(?:^|[?&])service=git-receive-pack(?:&|$)/.test(search);
}
//# sourceMappingURL=auth.js.map