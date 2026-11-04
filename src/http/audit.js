import { recordAudit } from '../data/audit.js';
import { clientIp } from './request.js';
import { currentUser } from './session.js';
export function auditFor(req, action, status, fields, actor = currentUser(req)) {
    recordAudit({
        at: new Date().toISOString(),
        action,
        actor: actor?.username ?? null,
        ip: clientIp(req),
        repo: fields.repo ?? null,
        status,
        detail: fields.detail ?? null,
    });
}
//# sourceMappingURL=audit.js.map