import fs from 'node:fs/promises';
import path from 'node:path';
import { config } from '../config/config.js';
import { RepoError } from '../config/errors.js';
import { repoDb } from '../data/db.js';
import { normalizeOwner, slugify } from './naming.js';
import { invalidateRepo, lookupRepo } from './store.js';
/**
 * Remove one repository. Only the owner and administrators may do it.
 */
export async function deleteRepo(input) {
    const owner = normalizeOwner(input.owner);
    const name = slugify(input.name, 'name');
    const repo = lookupRepo(owner, name);
    if (!repo)
        throw new RepoError(404, `Repository '${owner}/${name}' not found`);
    if (!input.actor)
        throw new RepoError(401, 'Sign in to delete a repository');
    if (!input.actor.isAdmin && repo.ownerId !== input.actor.userId) {
        throw new RepoError(403, 'Only the owner or an administrator can delete this repository');
    }
    const hashPattern = /^[0-9a-f]{64}$/i;
    if (!hashPattern.test(repo.hash)) {
        throw new RepoError(400, `Repository hash is invalid: ${repo.hash}`);
    }
    const target = path.resolve(config.reposRoot, repo.hash);
    const root = path.resolve(config.reposRoot);
    if (target !== root && !target.startsWith(`${root}${path.sep}`)) {
        throw new RepoError(400, 'Invalid repository path');
    }
    try {
        await fs.rm(target, { recursive: true, force: true });
    }
    catch (error) {
        throw new RepoError(500, `Failed to remove repository: ${error.message}`);
    }
    repoDb().prepare('DELETE FROM repos WHERE id = ?').run(repo.id);
    invalidateRepo(repo.owner, repo.name);
    return repo;
}
//# sourceMappingURL=delete.js.map