import { memberRole } from './members.js';
function isOwner(repo, user) {
    return repo.ownerId !== null && repo.ownerId === user.id;
}
export function canViewRepo(repo, user) {
    if (!user)
        return !repo.isPrivate;
    if (user.isAdmin || isOwner(repo, user))
        return true;
    if (!repo.isPrivate)
        return true;
    return memberRole(repo.id, user.id) !== null;
}
export function canPushRepo(repo, user) {
    if (!user)
        return false;
    if (user.isAdmin || isOwner(repo, user))
        return true;
    return memberRole(repo.id, user.id) === 'write';
}
//# sourceMappingURL=access.js.map