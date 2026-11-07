import { findUserByUsername, isAdminUser, normalizeUsername } from '../../accounts/users.js';
import { RepoError } from '../../config/errors.js';
import { canViewRepo } from '../../repositories/access.js';
import { listRepoMembers, removeRepoMember, setRepoMember } from '../../repositories/members.js';
import { findRepo } from '../../repositories/store.js';
import { auditFor } from '../audit.js';
import { readJsonBody, requiredField } from '../request.js';
import { sendJson } from '../response.js';
import { currentUser, requireUser } from '../session.js';
function repoForCaller(req, rawOwner, rawName) {
    const repo = findRepo(rawOwner, rawName);
    const label = repo ? `${repo.owner}/${repo.name}` : `${rawOwner}/${rawName}`;
    if (!repo || !canViewRepo(repo, currentUser(req))) {
        throw new RepoError(404, `Repository '${label}' not found`);
    }
    return repo;
}
function requireManager(req, repo) {
    const user = requireUser(req);
    if (!isAdminUser(user) && user.id !== repo.ownerId) {
        throw new RepoError(403, `Only the owner of '${repo.owner}/${repo.name}' or an administrator can manage its members`);
    }
    return user;
}
function roleField(payload, key, fallback) {
    const value = payload[key];
    if (value === undefined || value === null)
        return fallback;
    if (typeof value !== 'string' || (value !== 'read' && value !== 'write')) {
        throw new RepoError(400, `'${key}' must be 'read' or 'write'`);
    }
    return value;
}
function accountNamed(rawUsername) {
    const username = normalizeUsername(rawUsername);
    const account = findUserByUsername(username);
    if (!account)
        throw new RepoError(404, `User '${username}' not found`);
    return { id: account.id, username: account.username };
}
function payloadFor(repo) {
    return {
        owner: repo.owner,
        name: repo.name,
        path: `${repo.owner}/${repo.name}.git`,
        private: repo.isPrivate,
    };
}
export function handleMemberList(req, res, owner, name) {
    const repo = repoForCaller(req, owner, name);
    const members = listRepoMembers(repo.id);
    sendJson(res, 200, {
        ...payloadFor(repo),
        total: members.length,
        members,
    });
}
export async function handleMemberAdd(req, res, owner, name) {
    const repo = repoForCaller(req, owner, name);
    const user = requireManager(req, repo);
    const payload = await readJsonBody(req);
    const role = roleField(payload, 'role', 'read');
    const member = accountNamed(requiredField(payload, 'username'));
    if (repo.ownerId !== null && member.id === repo.ownerId) {
        throw new RepoError(409, `'${member.username}' owns this repository and already has full access`);
    }
    const { created } = setRepoMember(repo.id, member.id, role);
    const status = created ? 201 : 200;
    auditFor(req, created ? 'repo.member.add' : 'repo.member.update', status, { repo: `${repo.owner}/${repo.name}`, detail: `${member.username}: role=${role}` }, user);
    sendJson(res, status, {
        ...payloadFor(repo),
        username: member.username,
        userId: member.id,
        role,
        created,
    });
}
export function handleMemberRemove(req, res, owner, name, rawUsername) {
    const repo = repoForCaller(req, owner, name);
    const user = requireManager(req, repo);
    const member = accountNamed(rawUsername);
    if (!removeRepoMember(repo.id, member.id)) {
        throw new RepoError(404, `'${member.username}' is not a member of '${repo.owner}/${repo.name}'`);
    }
    auditFor(req, 'repo.member.remove', 200, { repo: `${repo.owner}/${repo.name}`, detail: member.username }, user);
    sendJson(res, 200, {
        ...payloadFor(repo),
        username: member.username,
        userId: member.id,
        removed: true,
    });
}
//# sourceMappingURL=members.js.map