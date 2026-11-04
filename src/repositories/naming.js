import { createHash } from 'node:crypto';
import path from 'node:path';
import { config } from '../config/config.js';
import { RepoError } from '../config/errors.js';
/** Branch that a fresh repository starts on. */
export const DEFAULT_BRANCH = 'main';
/** Longest accepted (sanitized) repository name. */
const MAX_SLUG_LENGTH = 64;
/** Sanitized names are lowercase words joined by single dashes. */
const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
/** Same shape as an account name, because it is the first URL segment. */
const OWNER = /^[a-z0-9][a-z0-9._-]{1,30}[a-z0-9]$/;
/**
 * Letters that do not decompose into an ASCII base letter under NFKD, so they
 * are transliterated by hand before the accent stripping runs.
 */
const SPECIAL_LETTERS = {
    ı: 'i',
    ł: 'l',
    ø: 'o',
    đ: 'd',
    ß: 'ss',
    æ: 'ae',
    œ: 'oe',
    þ: 'th',
    ð: 'd',
};
/**
 * Turn a user supplied repository name into its stored form: lowercase letters
 * and digits, every other character collapsed into a single dash.
 *
 *   "my app"     -> "my-app"
 *   "örnek-app"  -> "ornek-app"
 *   "my,app"     -> "my-app"
 *
 * Throws a 400 `RepoError` when nothing usable is left.
 */
export function slugify(input, field) {
    if (typeof input !== 'string') {
        throw new RepoError(400, `'${field}' is required and must be a string`);
    }
    const slug = input
        .trim()
        .toLowerCase()
        .replace(/[ıłøđßæœþð]/g, (letter) => SPECIAL_LETTERS[letter] ?? letter)
        .normalize('NFKD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');
    if (slug.length === 0) {
        throw new RepoError(400, `'${field}' must contain at least one letter or digit`);
    }
    if (slug.length > MAX_SLUG_LENGTH) {
        throw new RepoError(400, `'${field}' must be at most ${MAX_SLUG_LENGTH} characters`);
    }
    if (!SLUG.test(slug)) {
        throw new RepoError(400, `'${field}' is not a valid name`);
    }
    return slug;
}
/** Validate the account name that owns a repository (first URL segment). */
export function normalizeOwner(input) {
    if (typeof input !== 'string' || input.trim() === '') {
        throw new RepoError(400, "'owner' is required and must be a string");
    }
    const owner = input.trim().toLowerCase();
    if (!OWNER.test(owner)) {
        throw new RepoError(400, `'${owner}' is not a valid account name`);
    }
    return owner;
}
/** SHA-256 of owner and name together: the only thing a folder is named after. */
export function repoHash(owner, name) {
    return createHash('sha256').update(`${owner}\n${name}`).digest('hex');
}
/** Resolve an owner and a name into their storage location. */
export function locateRepo(rawOwner, rawName) {
    const owner = normalizeOwner(rawOwner);
    const name = slugify(rawName, 'name');
    const hash = repoHash(owner, name);
    return {
        owner,
        name,
        hash,
        relative: `${hash}/${name}.git`,
        container: hash,
        dir: path.join(config.reposRoot, hash, `${name}.git`),
    };
}
//# sourceMappingURL=naming.js.map