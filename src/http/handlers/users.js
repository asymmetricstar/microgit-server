import { isAdminUser, listUsers, setAdmin } from '../../accounts/users.js';
import { RepoError } from '../../config/errors.js';
import { auditFor } from '../audit.js';
import { readJsonBody } from '../request.js';
import { sendJson } from '../response.js';
import { requireUser } from '../session.js';
export function handleUsers(req, res) {
    const user = requireUser(req);
    if (!isAdminUser(user)) {
        throw new RepoError(403, 'An administrator account is required to list accounts');
    }
    const users = listUsers();
    sendJson(res, 200, { count: users.length, users });
}
export async function handleUserAdmin(req, res, username) {
    const actor = requireUser(req);
    if (!isAdminUser(actor)) {
        throw new RepoError(403, 'An administrator account is required to change administrators');
    }
    const payload = await readJsonBody(req);
    if (typeof payload.admin !== 'boolean') {
        throw new RepoError(400, "'admin' is required and must be true or false");
    }
    const user = setAdmin(username, payload.admin);
    auditFor(req, 'user.admin', 200, { detail: `${user.username}: admin=${user.isAdmin}` }, actor);
    sendJson(res, 200, { user });
}
//# sourceMappingURL=users.js.map