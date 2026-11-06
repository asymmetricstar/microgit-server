import { isAdminUser } from '../../accounts/users.js';
import { RepoError, isBlank } from '../../config/errors.js';
import { createRepo } from '../../repositories/create.js';
import { deleteRepo } from '../../repositories/delete.js';
import { cloneUrlFor, findRepo, listRepos, readHead } from '../../repositories/store.js';
import { auditFor } from '../audit.js';
import { booleanField, originFor, readJsonBody, requiredField } from '../request.js';
import { sendJson } from '../response.js';
import { currentUser, requireUser } from '../session.js';
import { safeString } from '../../util/safe.js';
export async function repoPayload(repo, baseUrl) {
    return {
        owner: repo.owner,
        name: repo.name,
        path: `${repo.owner}/${repo.name}.git`,
        private: repo.isPrivate,
        cloneUrl: cloneUrlFor(repo, baseUrl),
        head: await readHead(repo),
        createdAt: repo.createdAt,
        updatedAt: repo.updatedAt,
    };
}
export async function handleNew(req, res) {
    const user = requireUser(req);
    const payload = await readJsonBody(req);
    const name = requiredField(payload, 'name');
    const isPrivate = booleanField(payload, 'private', false);
    const result = await createRepo({
        name,
        isPrivate,
        owner: { id: user.id, username: user.username },
    });
    const body = await repoPayload(result.repo, originFor(req));
    const label = `${body.owner}/${body.name}`;
    auditFor(req, 'repo.create', result.created ? 201 : 200, { repo: label, detail: result.created ? null : 'already existed' }, user);
    sendJson(res, result.created ? 201 : 200, {
        ...body,
        created: result.created,
        ...(result.created ? {} : { note: 'You already had this repository; nothing changed.' }),
    });
}
export async function handleDelete(req, res, ownerValue, nameValue) {
    const hasBody = req.method !== 'DELETE' ||
        req.headers['content-length'] !== undefined ||
        req.headers['transfer-encoding'] !== undefined;
    const payload = hasBody ? await readJsonBody(req) : {};
    const user = currentUser(req);
    const name = nameValue ?? requiredField(payload, 'name');
    const ownerValueOrUser = ownerValue ?? safeString(payload['owner'], user?.username ?? '');
    if (isBlank(ownerValueOrUser)) {
        throw new RepoError(401, 'Sign in first: POST /api/login or send Authorization: Bearer <token>');
    }
    const repo = await deleteRepo({
        owner: ownerValueOrUser,
        name,
        actor: user ? { userId: user.id, isAdmin: isAdminUser(user) } : null,
    });
    auditFor(req, 'repo.delete', 200, { repo: `${repo.owner}/${repo.name}` }, user);
    sendJson(res, 200, {
        owner: repo.owner,
        name: repo.name,
        path: `${repo.owner}/${repo.name}.git`,
        deleted: true,
    });
}
export async function handleList(req, res, url) {
    const page = Number.parseInt(url.searchParams.get('page') ?? '1', 10);
    const limit = Number.parseInt(url.searchParams.get('limit') ?? '50', 10);
    const privateParam = url.searchParams.get('private');
    const user = currentUser(req);
    const result = listRepos({
        owner: url.searchParams.get('owner'),
        name: url.searchParams.get('name'),
        private: privateParam === null ? null : privateParam === 'true' || privateParam === '1',
        page: Number.isFinite(page) ? page : 1,
        limit: Number.isFinite(limit) ? limit : 50,
        viewer: user ? { userId: user.id, isAdmin: isAdminUser(user) } : null,
    });
    const base = originFor(req);
    sendJson(res, 200, {
        page: result.page,
        limit: result.limit,
        total: result.total,
        pages: result.pages,
        repositories: await Promise.all(result.repositories.map((repo) => repoPayload(repo, base))),
    });
}
export async function handleRepoInfo(req, res, baseUrl, owner, name) {
    const repo = findRepo(owner, name);
    const user = currentUser(req);
    const canSee = repo !== null &&
        (!repo.isPrivate ||
            (user !== null && (isAdminUser(user) || user.username.toLowerCase() === repo.owner.toLowerCase())));
    if (!canSee || !repo)
        throw new RepoError(404, `Repository '${owner}/${name}' not found`);
    sendJson(res, 200, await repoPayload(repo, baseUrl));
}
//# sourceMappingURL=repositories.js.map