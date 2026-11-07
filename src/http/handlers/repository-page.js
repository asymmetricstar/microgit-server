import { readFile, readCommitDiff, readOverview, readRecentCommits, gitBuffer } from '../../git/inspect.js';
import { commitsPage, commitDiffPage, errorPage, privateRepoPage, repositoryPage } from '../pages/repository.js';
import { canViewRepo } from '../../repositories/access.js';
import { cloneUrlFor, findRepo } from '../../repositories/store.js';
import { sendHtml, sendText, sendBuffer } from '../response.js';
import { currentUser } from '../session.js';
const MAX_PAGE_PATH_LENGTH = 512;
const MAX_PAGE_PATH_SEGMENTS = 32;
export function repoPageTarget(pathname) {
    const trailingSlash = pathname.endsWith('/');
    const segments = pathname.split('/').slice(1);
    if (trailingSlash)
        segments.pop();
    if (segments.length < 2)
        return null;
    const [owner, rawName, mode, ...rest] = segments;
    if (!owner || !rawName)
        return null;
    const name = rawName.toLowerCase().endsWith('.git') ? rawName.slice(0, -4) : rawName;
    if (!name)
        return null;
    if (mode === undefined)
        return { owner, name, kind: 'root', path: '' };
    if (mode === 'commit') {
        if (rest.length !== 1 || !rest[0])
            return null;
        return { owner, name, kind: 'commit', path: rest[0] };
    }
    if (mode === 'commits') {
        return { owner, name, kind: 'commits', path: '' };
    }
    if (mode !== 'tree' && mode !== 'blob')
        return null;
    if (rest.length > MAX_PAGE_PATH_SEGMENTS)
        return null;
    const pagePath = rest.join('/');
    if (pagePath.length > MAX_PAGE_PATH_LENGTH)
        return null;
    if (pagePath === '')
        return mode === 'tree' ? { owner, name, kind: 'root', path: '' } : null;
    return { owner, name, kind: mode, path: pagePath };
}
function canonicalPath(target) {
    const base = `/${encodeURIComponent(target.owner)}/${encodeURIComponent(target.name)}/`;
    if (target.kind === 'root')
        return base;
    if (target.kind === 'commit')
        return `${base}commit/${encodeURIComponent(target.path)}`;
    if (target.kind === 'commits')
        return `${base}commits`;
    const encodedPath = target.path.split('/').map(encodeURIComponent).join('/');
    return target.kind === 'tree' ? `${base}tree/${encodedPath}/` : `${base}blob/${encodedPath}`;
}
function parentDir(filePath) {
    const index = filePath.lastIndexOf('/');
    return index === -1 ? '' : filePath.slice(0, index);
}
function contentTypeForPath(filePath) {
    const lower = filePath.toLowerCase();
    if (lower.endsWith('.png'))
        return 'image/png';
    if (lower.endsWith('.jpg') || lower.endsWith('.jpeg'))
        return 'image/jpeg';
    if (lower.endsWith('.gif'))
        return 'image/gif';
    if (lower.endsWith('.webp'))
        return 'image/webp';
    if (lower.endsWith('.svg'))
        return 'image/svg+xml';
    if (lower.endsWith('.ico'))
        return 'image/x-icon';
    if (lower.endsWith('.bmp'))
        return 'image/bmp';
    if (lower.endsWith('.pdf'))
        return 'application/pdf';
    return 'application/octet-stream';
}
export async function handleRepositoryPage(req, res, base, target) {
    const url = new URL(req.url ?? '/', base);
    const canonical = canonicalPath(target);
    if (url.pathname !== canonical) {
        res.writeHead(302, { Location: `${canonical}${url.search}` });
        res.end();
        return;
    }
    const notFound = (title = 'Repository not found', message = `${target.owner}/${target.name} does not exist on this server.`) => {
        sendHtml(res, 404, errorPage(title, message));
    };
    let repo;
    try {
        repo = findRepo(target.owner, target.name);
    }
    catch {
        notFound();
        return;
    }
    if (!repo) {
        notFound();
        return;
    }
    const viewer = currentUser(req);
    if (!canViewRepo(repo, viewer)) {
        sendHtml(res, 403, privateRepoPage(repo.owner, repo.name, viewer !== null));
        return;
    }
    const raw = url.searchParams.get('raw') === '1';
    if (target.kind === 'blob') {
        const file = await readFile(repo, target.path);
        if (!file) {
            notFound('Path not found', `${target.owner}/${target.name} has no file at ${target.path}.`);
            return;
        }
        if (raw) {
            if (file.binary) {
                const buffer = await gitBuffer(repo, ['show', `HEAD:${target.path}`]);
                if (!buffer) {
                    sendText(res, 404, 'Not found\n');
                    return;
                }
                sendBuffer(res, 200, buffer, contentTypeForPath(target.path));
                return;
            }
            if (file.text === null) {
                sendText(res, 415, 'This file cannot be shown as plain text.\n');
                return;
            }
            sendText(res, 200, file.text);
            return;
        }
        const overview = await readOverview(repo, parentDir(target.path));
        if (!overview) {
            notFound('Path not found', `${target.owner}/${target.name} has no file at ${target.path}.`);
            return;
        }
        sendHtml(res, 200, repositoryPage({
            owner: repo.owner,
            name: repo.name,
            isPrivate: repo.isPrivate,
            cloneUrl: cloneUrlFor(repo, base),
            overview,
            raw: false,
            file,
        }));
        return;
    }
    if (target.kind === 'commit') {
        const diff = await readCommitDiff(repo, target.path);
        if (!diff) {
            notFound('Commit not found', `${target.owner}/${target.name} has no commit ${target.path}.`);
            return;
        }
        sendHtml(res, 200, commitDiffPage(repo.owner, repo.name, diff, cloneUrlFor(repo, base)));
        return;
    }
    if (target.kind === 'commits') {
        const commits = await readRecentCommits(repo, 50);
        sendHtml(res, 200, commitsPage(repo.owner, repo.name, commits, cloneUrlFor(repo, base)));
        return;
    }
    const overview = await readOverview(repo, target.kind === 'tree' ? target.path : '');
    if (!overview) {
        notFound('Path not found', `${target.owner}/${target.name} has no directory at ${target.path}.`);
        return;
    }
    sendHtml(res, 200, repositoryPage({
        owner: repo.owner,
        name: repo.name,
        isPrivate: repo.isPrivate,
        cloneUrl: cloneUrlFor(repo, base),
        overview,
        raw: raw && overview.readme !== null,
        file: null,
    }));
}
//# sourceMappingURL=repository-page.js.map