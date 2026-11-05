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
/** Resolve the `assets/` directory: prefer the package root (so an installed
 *  npm package finds its assets), fall back to the current working directory. */
const moduleDir = path.dirname(fileURLToPath(import.meta.url));
const packageRoot = path.resolve(moduleDir, '..', '..', '..');
const assetsDir = fs.existsSync(path.join(packageRoot, 'assets'))
    ? path.join(packageRoot, 'assets')
    : path.resolve(process.cwd(), 'assets');
const assetCache = new Map();
/** Serve one of the root assets (favicon.ico, logo.png, etc.). */
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
/** The landing page for `/`: what the server is, how to clone, how to sign in. */
export function handleRoot(res, base) {
    sendHtml(res, 200, landingPage(base, {
        repositories: listRepos({ limit: 1, viewer: null }).total,
        users: countUsers(),
        sessions: countSessions(),
    }));
}
export function handleHealth(res) {
    sendJson(res, 200, {
        status: 'ok',
        version: SERVER_VERSION,
        uptimeSeconds: Math.round(process.uptime()),
        repositories: listRepos({ limit: 1, viewer: null }).total,
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