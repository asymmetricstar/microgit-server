import { isAdminUser } from '../../accounts/users.js';
import { motd } from '../../config/motd.js';
import { sendJson } from '../response.js';
import { requireUser } from '../session.js';
export function handleMe(req, res) {
    const user = requireUser(req);
    sendJson(res, 200, {
        id: user.id,
        username: user.username,
        admin: isAdminUser(user),
        createdAt: user.createdAt,
        motd: motd(),
    });
}
//# sourceMappingURL=account.js.map