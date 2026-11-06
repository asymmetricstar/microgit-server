import { execFile } from 'node:child_process';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { promisify } from 'node:util';
import { config } from '../config/config.js';
import { RepoError } from '../config/errors.js';
import { getSettings } from '../config/settings.js';
import { repoDb } from '../data/db.js';
import { DEFAULT_BRANCH, locateRepo } from './naming.js';
import { invalidateRepo, lookupRepo } from './store.js';
const run = promisify(execFile);
async function configureRepository(dir) {
    const settings = getSettings();
    await run('git', ['-C', dir, 'config', 'http.uploadpack', 'true']);
    await run('git', ['-C', dir, 'config', 'core.longpaths', 'true']);
    if (settings.maxPushBytes > 0) {
        await run('git', ['-C', dir, 'config', 'receive.maxInputSize', String(settings.maxPushBytes)]);
    }
}
function isNothingToCommit(error) {
    const message = error.stderr ?? '';
    return /nothing to commit|nothing added to commit/i.test(message);
}
async function applyTemplate(dest) {
    const template = getSettings().template;
    if (template === '')
        return;
    const source = path.resolve(process.cwd(), template);
    let entries;
    try {
        entries = await fs.readdir(source);
    }
    catch {
        console.warn(`[git-server] template '${source}' cannot be read; creating an empty repository`);
        return;
    }
    if (entries.length === 0)
        return;
    const hasGit = await fs
        .stat(path.join(source, '.git'))
        .then((stat) => stat.isDirectory() || stat.isFile())
        .catch(() => false);
    try {
        if (hasGit) {
            const head = await run('git', ['-C', source, 'symbolic-ref', '--short', 'HEAD'])
                .then((result) => result.stdout.trim())
                .catch(() => DEFAULT_BRANCH);
            await run('git', [
                '--git-dir',
                dest,
                'fetch',
                '--quiet',
                source,
                '+refs/heads/*:refs/heads/*',
                '+refs/tags/*:refs/tags/*',
            ]);
            await run('git', ['--git-dir', dest, 'symbolic-ref', 'HEAD', `refs/heads/${head || DEFAULT_BRANCH}`]);
            return;
        }
        const work = await fs.mkdtemp(path.join(os.tmpdir(), 'git-server-template-'));
        try {
            await fs.cp(source, work, { recursive: true });
            await run('git', ['-C', work, 'init', '--quiet', `--initial-branch=${DEFAULT_BRANCH}`]);
            await run('git', ['-C', work, 'add', '--all']);
            try {
                await run('git', [
                    '-C',
                    work,
                    '-c',
                    'user.name=git-server',
                    '-c',
                    'user.email=git-server@localhost',
                    'commit',
                    '--quiet',
                    '-m',
                    'Initial commit from template',
                ]);
            }
            catch (error) {
                if (isNothingToCommit(error))
                    return;
                throw error;
            }
            await run('git', ['-C', work, 'push', '--quiet', dest, `HEAD:refs/heads/${DEFAULT_BRANCH}`]);
        }
        finally {
            await fs.rm(work, { recursive: true, force: true });
        }
    }
    catch (error) {
        console.error(`[git-server] template '${source}' was not applied: ${error.message}`);
    }
}
export async function createRepo(input) {
    const location = locateRepo(input.owner.username, input.name);
    const { owner, name, hash, relative, container, dir } = location;
    const settleExisting = (existing) => {
        if (existing.isPrivate !== input.isPrivate) {
            throw new RepoError(409, `'${owner}/${name}' already exists as a ${existing.isPrivate ? 'private' : 'public'} repository`);
        }
        return { repo: existing, created: false };
    };
    const existing = lookupRepo(owner, name);
    if (existing)
        return settleExisting(existing);
    const containerDir = path.join(config.reposRoot, container);
    await fs.mkdir(config.reposRoot, { recursive: true });
    try {
        await fs.mkdir(containerDir);
    }
    catch (error) {
        if (error.code === 'EEXIST') {
            invalidateRepo(owner, name);
            const raced = lookupRepo(owner, name);
            if (raced)
                return settleExisting(raced);
            throw new RepoError(409, `'${owner}/${name}' already exists`);
        }
        throw new RepoError(500, `Cannot create repository folder: ${error.message}`);
    }
    try {
        await run('git', ['init', '--bare', `--initial-branch=${DEFAULT_BRANCH}`, dir]);
        await configureRepository(dir);
        await applyTemplate(dir);
    }
    catch (error) {
        await fs.rm(containerDir, { recursive: true, force: true });
        throw new RepoError(500, `Failed to initialize repository: ${error.message}`);
    }
    const now = new Date().toISOString();
    try {
        repoDb()
            .prepare(`INSERT INTO repos (owner_id, owner, name, hash, path, is_private, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`)
            .run(input.owner.id, owner, name, hash, relative, input.isPrivate ? 1 : 0, now, now);
    }
    catch (error) {
        repoDb().prepare('DELETE FROM repos WHERE hash = ?').run(hash);
        await fs.rm(containerDir, { recursive: true, force: true });
        invalidateRepo(owner, name);
        throw new RepoError(500, `Failed to record repository: ${error.message}`);
    }
    invalidateRepo(owner, name);
    const repo = lookupRepo(owner, name);
    if (!repo)
        throw new RepoError(500, 'Repository disappeared right after creation');
    return { repo, created: true };
}
//# sourceMappingURL=create.js.map