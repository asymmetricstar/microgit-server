import { RepoError } from '../config/errors.js';
import { errorPage } from './pages/repository.js';
import { header } from './request.js';
export function sendJson(res, status, payload) {
    const data = Buffer.from(`${JSON.stringify(payload, null, 2)}\n`);
    res.writeHead(status, {
        'Content-Type': 'application/json; charset=utf-8',
        'Content-Length': data.length,
        'Cache-Control': 'no-store',
        'X-Content-Type-Options': 'nosniff',
    });
    res.end(data);
}
export function sendHtml(res, status, html) {
    const data = Buffer.from(html);
    res.writeHead(status, {
        'Content-Type': 'text/html; charset=utf-8',
        'Content-Length': data.length,
        'Cache-Control': 'no-store',
        'X-Content-Type-Options': 'nosniff',
    });
    res.end(data);
}
export function sendText(res, status, body, contentType = 'text/plain; charset=utf-8') {
    const data = Buffer.from(body);
    res.writeHead(status, {
        'Content-Type': contentType,
        'Content-Length': data.length,
        'Cache-Control': 'no-store',
        'X-Content-Type-Options': 'nosniff',
    });
    res.end(data);
}
export function sendBuffer(res, status, data, contentType) {
    res.writeHead(status, {
        'Content-Type': contentType,
        'Content-Length': data.length,
        'Cache-Control': 'public, max-age=3600',
        'X-Content-Type-Options': 'nosniff',
    });
    res.end(data);
}
function wantsHtmlPage(req) {
    return (header(req, 'accept') ?? '').toLowerCase().includes('text/html');
}
function isApiPath(req) {
    const url = req.url ?? '/';
    return url.split('?', 1)[0].startsWith('/api/');
}
function statusTitle(status) {
    switch (status) {
        case 400:
            return 'Bad request';
        case 401:
            return 'Sign in required';
        case 403:
            return 'Access denied';
        case 404:
            return 'Not found';
        case 405:
            return 'Method not allowed';
        case 409:
            return 'Conflict';
        case 413:
            return 'Request too large';
        case 415:
            return 'Unsupported request';
        case 429:
            return 'Too many requests';
        default:
            return status >= 500 ? 'Server error' : `Error ${status}`;
    }
}
export function sendError(req, res, error) {
    if (res.headersSent) {
        res.destroy();
        return;
    }
    let status;
    let message;
    if (error instanceof RepoError) {
        status = error.statusCode;
        message = error.message;
    }
    else {
        const detail = error instanceof Error ? error.message : String(error);
        console.error('[server] unhandled error:', detail);
        status = 500;
        message = 'Internal server error';
    }
    if (!isApiPath(req) && wantsHtmlPage(req)) {
        sendHtml(res, status, errorPage(statusTitle(status), message));
        return;
    }
    sendJson(res, status, { error: message });
}
export function methodNotAllowed(req, res, allow) {
    res.setHeader('Allow', allow);
    sendError(req, res, new RepoError(405, 'Method not allowed'));
}
//# sourceMappingURL=response.js.map