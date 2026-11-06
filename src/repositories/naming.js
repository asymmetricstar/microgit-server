import { createHash } from 'node:crypto';
import path from 'node:path';
import { config } from '../config/config.js';
import { RepoError } from '../config/errors.js';
export const DEFAULT_BRANCH = 'main';
const MAX_SLUG_LENGTH = 64;
const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const OWNER = /^[a-z0-9][a-z0-9._-]{1,30}[a-z0-9]$/;
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
export function repoHash(owner, name) {
    return createHash('sha256').update(`${owner}\n${name}`).digest('hex');
}
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