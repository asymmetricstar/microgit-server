import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { countSessions } from '../../accounts/sessions.js';
import { countUsers } from '../../accounts/users.js';
import { SERVER_VERSION } from '../../config/version.js';
import { cacheStats } from '../../data/cache.js';
import { listRepos } from '../../repositories/store.js';
import { landingPage } from '../pages/landing.js';
import { sendJson, sendHtml, sendText } from '../response.js';
const moduleDir = path.dirname(fileURLToPath(import.meta.url));
const packageRoot = path.resolve(moduleDir, '..', '..', '..');
const assetsDir = fs.existsSync(path.join(packageRoot, 'assets'))
    ? path.join(packageRoot, 'assets')
    : path.resolve(process.cwd(), 'assets');
const assetCache = new Map();
export function handleAsset(res, name, contentType) {
    let data = assetCache.get(name);
    if (!data) {
        try {
            data = fs.readFileSync(path.join(assetsDir, name));
        }
        catch {
            sendText(res, 404, 'Not found\n');
            return;
        }
        assetCache.set(name, data);
    }
    res.writeHead(200, {
        'Content-Type': contentType,
        'Content-Length': data.length,
        'Cache-Control': 'public, max-age=3600',
    });
    res.end(data);
}
function repositoryCount() {
    return listRepos({ limit: 1 }).total;
}
export function handleRoot(res, base) {
    sendHtml(res, 200, landingPage(base, {
        repositories: repositoryCount(),
        users: countUsers(),
        sessions: countSessions(),
    }));
}
export function handleHealth(res) {
    sendJson(res, 200, {
        status: 'ok',
        version: SERVER_VERSION,
        uptimeSeconds: Math.round(process.uptime()),
        repositories: repositoryCount(),
    });
}
export function handleMetrics(res) {
    const stats = cacheStats();
    sendJson(res, 200, {
        version: SERVER_VERSION,
        uptimeSeconds: Math.round(process.uptime()),
        ...stats,
    });
}
//# sourceMappingURL=system.js.map