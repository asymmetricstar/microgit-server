import { createSession, purgeExpiredSessions, revokeSession, userForToken, } from '../../accounts/sessions.js';
import { authenticateUser, isAdminUser, registerUser } from '../../accounts/users.js';
import { RepoError } from '../../config/errors.js';
import { motd } from '../../config/motd.js';
import { getSettings } from '../../config/settings.js';
import { auditFor } from '../audit.js';
import { readJsonBody } from '../request.js';
import { sendJson } from '../response.js';
import { clearSessionCookie, sessionToken, setSessionCookie } from '../session.js';
import { safeGet } from '../../util/safe.js';
export async function handleRegister(req, res) {
    const settings = getSettings();
    if (!settings.allowRegistration) {
        throw new RepoError(403, 'Registration is disabled by the server settings (allowRegistration)');
    }
    const payload = await readJsonBody(req);
    const user = await registerUser(safeGet(payload, 'username'), safeGet(payload, 'password'));
    const session = createSession(user);
    setSessionCookie(req, res, session.token, session.expiresAt);
    purgeExpiredSessions();
    auditFor(req, 'auth.register', 201, { detail: user.username });
    sendJson(res, 201, {
        user: { id: user.id, username: user.username, admin: isAdminUser(user) },
        motd: motd(),
        token: session.token,
        expiresAt: session.expiresAt,
    });
}
export async function handleLogin(req, res) {
    const payload = await readJsonBody(req);
    const user = await authenticateUser(safeGet(payload, 'username'), safeGet(payload, 'password'));
    if (!user) {
        auditFor(req, 'auth.login', 401, { detail: 'invalid credentials' }, null);
        throw new RepoError(401, 'Invalid username or password');
    }
    const session = createSession(user);
    setSessionCookie(req, res, session.token, session.expiresAt);
    purgeExpiredSessions();
    auditFor(req, 'auth.login', 200, {}, user);
    sendJson(res, 200, {
        user: { id: user.id, username: user.username, admin: isAdminUser(user) },
        motd: motd(),
        token: session.token,
        expiresAt: session.expiresAt,
    });
}
export function handleLogout(req, res) {
    const token = sessionToken(req);
    const user = token ? userForToken(token) : null;
    const removed = token ? revokeSession(token) : false;
    clearSessionCookie(req, res);
    if (removed)
        auditFor(req, 'auth.logout', 200, {}, user);
    sendJson(res, 200, { loggedOut: removed });
}
//# sourceMappingURL=auth.js.map