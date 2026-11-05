import { RepoError } from '../config/errors.js';
import { publicSettings } from '../config/settings.js';
import { handleGit } from '../git/handler.js';
import { handleAudit } from './handlers/audit.js';
import { handleMe } from './handlers/account.js';
import { handleLogin, handleLogout, handleRegister } from './handlers/auth.js';
import { handleAsset, handleHealth, handleMetrics, handleRoot } from './handlers/system.js';
import { handleDelete, handleList, handleNew, handleRepoInfo, } from './handlers/repositories.js';
import { handleRepositoryPage, repoPageTarget } from './handlers/repository-page.js';
import { handleUserAdmin, handleUsers } from './handlers/users.js';
import { decodePathname, originFor } from './request.js';
import { methodNotAllowed, sendJson } from './response.js';
export async function route(req, res) {
    const rawUrl = req.url ?? '/';
    let url;
    try {
        url = new URL(rawUrl, originFor(req));
    }
    catch {
        throw new RepoError(400, 'Malformed request URL');
    }
    const method = (req.method ?? 'GET').toUpperCase();
    const pathname = decodePathname(url.pathname);
    const base = originFor(req);
    const isRead = method === 'GET' || method === 'HEAD';
    if (pathname === '/' && isRead) {
        handleRoot(res, base);
        return;
    }
    if (pathname === '/health' && isRead) {
        handleHealth(res);
        return;
    }
    if (pathname === '/metrics' && isRead) {
        handleMetrics(res);
        return;
    }
    if (pathname === '/favicon.ico' && isRead) {
        handleAsset(res, 'favicon.ico', 'image/x-icon');
        return;
    }
    if (pathname === '/logo.png' && isRead) {
        handleAsset(res, 'logo.png', 'image/png');
        return;
    }
    // Generic asset route: /assets/<file> (e.g. /assets/cli-terminal.png).
    if (pathname.startsWith('/assets/') && isRead) {
        const file = pathname.slice('/assets/'.length);
        if (file === '' || file.includes('/') || file.includes('\\')) {
            throw new RepoError(404, 'Not found');
        }
        const contentType = file.endsWith('.png')
            ? 'image/png'
            : file.endsWith('.ico')
                ? 'image/x-icon'
                : file.endsWith('.jpg') || file.endsWith('.jpeg')
                    ? 'image/jpeg'
                    : file.endsWith('.gif')
                        ? 'image/gif'
                        : file.endsWith('.webp')
                            ? 'image/webp'
                            : file.endsWith('.svg')
                                ? 'image/svg+xml'
                                : 'application/octet-stream';
        handleAsset(res, file, contentType);
        return;
    }
    if (pathname === '/api/settings' && isRead) {
        sendJson(res, 200, publicSettings());
        return;
    }
    if (pathname === '/api/register') {
        if (method !== 'POST')
            return methodNotAllowed(req, res, 'POST');
        await handleRegister(req, res);
        return;
    }
    if (pathname === '/api/login') {
        if (method !== 'POST')
            return methodNotAllowed(req, res, 'POST');
        await handleLogin(req, res);
        return;
    }
    if (pathname === '/api/logout') {
        if (method !== 'POST')
            return methodNotAllowed(req, res, 'POST');
        handleLogout(req, res);
        return;
    }
    if (pathname === '/api/me' && isRead) {
        handleMe(req, res);
        return;
    }
    if (pathname === '/api/new') {
        if (method !== 'POST')
            return methodNotAllowed(req, res, 'POST');
        await handleNew(req, res);
        return;
    }
    if (pathname === '/api/delete') {
        if (method !== 'POST')
            return methodNotAllowed(req, res, 'POST');
        await handleDelete(req, res);
        return;
    }
    if (pathname === '/api/audit') {
        if (!isRead)
            return methodNotAllowed(req, res, 'GET, HEAD');
        await handleAudit(req, res, url);
        return;
    }
    if (pathname === '/api/users') {
        if (!isRead)
            return methodNotAllowed(req, res, 'GET, HEAD');
        handleUsers(req, res);
        return;
    }
    if (pathname.startsWith('/api/users/')) {
        const username = pathname.slice('/api/users/'.length);
        if (username === '' || username.includes('/'))
            throw new RepoError(404, 'Not found');
        if (method !== 'PATCH')
            return methodNotAllowed(req, res, 'PATCH');
        await handleUserAdmin(req, res, username);
        return;
    }
    if (pathname === '/api/repos') {
        if (!isRead)
            return methodNotAllowed(req, res, 'GET, HEAD');
        await handleList(req, res, url);
        return;
    }
    if (pathname.startsWith('/api/repos/')) {
        const segments = pathname.slice('/api/repos/'.length).split('/');
        if (segments.length === 2 && segments[0] !== '' && segments[1] !== '') {
            const [owner, rawName] = segments;
            const name = rawName.toLowerCase().endsWith('.git') ? rawName.slice(0, -4) : rawName;
            if (method === 'DELETE') {
                await handleDelete(req, res, owner, name);
                return;
            }
            if (isRead) {
                await handleRepoInfo(res, base, owner, name);
                return;
            }
            return methodNotAllowed(req, res, 'GET, HEAD, DELETE');
        }
        throw new RepoError(404, 'Not found');
    }
    // An unknown `/api/...` path never falls through to the pages or git: the
    // API answers JSON to every client, browsers included.
    if (pathname.startsWith('/api/')) {
        throw new RepoError(404, 'Not found');
    }
    // `/alice/app/`, `/alice/app.git`, `/alice/app/tree/src/` and
    // `/alice/app/blob/src/index.ts` are rendered from the bare repository; the
    // handler redirects to the canonical form so links stay stable.
    const page = repoPageTarget(pathname);
    if (page && isRead) {
        await handleRepositoryPage(req, res, base, page);
        return;
    }
    // Everything else is handed to `git http-backend`: `info/refs`,
    // `git-upload-pack`, `git-receive-pack` and the dumb-protocol file paths.
    // The URL carries user and name; the backend only ever sees `<hash>/<name>.git`.
    await handleGit(req, res, url, pathname);
}
//# sourceMappingURL=router.js.map