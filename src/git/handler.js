import { authenticateUser, isAdminUser } from '../accounts/users.js';
import { RepoError } from '../config/errors.js';
import { auditFor } from '../http/audit.js';
import { normalizeOwner, slugify } from '../repositories/naming.js';
import { findRepo } from '../repositories/store.js';
import { isPushRequest, parseBasicAuth } from '../security/auth.js';
import { handleGitRequest } from './backend.js';
export function parseGitPath(pathname) {
    const segments = pathname.split('/').slice(1);
    if (segments.length < 2 || segments[0] === '' || segments[1] === '') {
        throw new RepoError(404, 'Not found: use /<user>/<repository>.git');
    }
    const [rawOwner, rawNameSegment, ...restSegments] = segments;
    const rawName = rawNameSegment.toLowerCase().endsWith('.git')
        ? rawNameSegment.slice(0, -4)
        : rawNameSegment;
    return {
        owner: normalizeOwner(rawOwner),
        name: slugify(rawName, 'name'),
        rest: restSegments.length > 0 ? `/${restSegments.join('/')}` : '',
    };
}
/** Everything a git request needs from the caller, resolved once. */
export async function gitCaller(req) {
    const basic = parseBasicAuth(req);
    if (!basic)
        return null;
    return authenticateUser(basic.username, basic.password);
}
export async function handleGit(req, res, url, pathname) {
    const target = parseGitPath(pathname);
    const repo = findRepo(target.owner, target.name);
    if (!repo)
        throw new RepoError(404, `Repository '${target.owner}/${target.name}' not found`);
    const storagePath = `/${repo.path}${target.rest}`;
    const query = url.search.replace(/^\?/, '');
    const push = isPushRequest(storagePath, query);
    const label = `${repo.owner}/${repo.name}`;
    const deny = (status, message) => {
        res.setHeader('WWW-Authenticate', 'Basic realm="git-server", charset="UTF-8"');
        auditFor(req, push ? 'git.push' : 'git.fetch', status, { repo: label, detail: 'unauthorized' }, null);
        throw new RepoError(status, message);
    };
    let remoteUser;
    if (push || repo.isPrivate) {
        const user = await gitCaller(req);
        if (!user)
            return deny(401, 'Sign in with your account username and password');
        const isOwner = repo.ownerId !== null && repo.ownerId === user.id;
        if (!isOwner && !isAdminUser(user)) {
            deny(403, `Only the owner of '${label}' can access it`);
        }
        remoteUser = user.username;
    }
    const started = Date.now();
    await handleGitRequest(req, res, storagePath, query, remoteUser);
    if (push && req.method === 'POST') {
        auditFor(req, 'git.push', res.statusCode, { repo: label, detail: `${Date.now() - started} ms` }, null);
    }
}
//# sourceMappingURL=handler.js.map