import { spawn } from 'node:child_process';
import { config } from '../config/config.js';
import { SERVER_VERSION } from '../config/version.js';
const SERVER_SOFTWARE = `git-server/${SERVER_VERSION}`;
/** Read the whole request body; git clients send either fixed length or chunked bodies. */
async function readBody(req) {
    if (req.method === 'GET' || req.method === 'HEAD')
        return Buffer.alloc(0);
    const chunks = [];
    for await (const chunk of req) {
        chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(String(chunk)));
    }
    return Buffer.concat(chunks);
}
/** Find the blank line separating CGI headers from the body. */
function indexOfHeaderEnd(buf) {
    const crlf = buf.indexOf('\r\n\r\n');
    const lf = buf.indexOf('\n\n');
    if (crlf === -1 && lf === -1)
        return null;
    if (lf === -1 || (crlf !== -1 && crlf <= lf))
        return { index: crlf, length: 4 };
    return { index: lf, length: 2 };
}
function parseCgiHeaders(raw) {
    const headers = {};
    let status = 200;
    for (const line of raw.split(/\r?\n/)) {
        const colon = line.indexOf(':');
        if (colon === -1)
            continue;
        const key = line.slice(0, colon).trim();
        const value = line.slice(colon + 1).trim();
        if (key.toLowerCase() === 'status') {
            const match = /^(\d{3})\b/.exec(value);
            if (match)
                status = Number.parseInt(match[1], 10);
            continue;
        }
        headers[key] = value;
    }
    return { status, headers };
}
function buildCgiEnv(req, pathInfo, queryString, body) {
    const env = { ...process.env };
    // `PATH_TRANSLATED` must never win over `GIT_PROJECT_ROOT`/`PATH_INFO`.
    delete env.PATH_TRANSLATED;
    env.GATEWAY_INTERFACE = 'CGI/1.1';
    env.SERVER_SOFTWARE = SERVER_SOFTWARE;
    env.SERVER_PROTOCOL = 'HTTP/1.1';
    env.REQUEST_METHOD = req.method ?? 'GET';
    env.GIT_PROJECT_ROOT = config.reposRoot;
    env.PATH_INFO = pathInfo;
    env.QUERY_STRING = queryString;
    // Skip the `git-daemon-export-ok` gate: repositories served here are exported.
    env.GIT_HTTP_EXPORT_ALL = '1';
    env.REMOTE_ADDR = req.socket.remoteAddress ?? '';
    env.REMOTE_PORT = String(req.socket.remotePort ?? 0);
    const host = req.headers.host;
    if (host) {
        const [name, port] = host.split(':');
        env.SERVER_NAME = name;
        if (port)
            env.SERVER_PORT = port;
    }
    // Standard CGI header mapping: `Git-Protocol` -> `HTTP_GIT_PROTOCOL`,
    // `Content-Encoding` -> `HTTP_CONTENT_ENCODING`, and so on.
    for (const [name, value] of Object.entries(req.headers)) {
        if (value === undefined || name.startsWith(':'))
            continue;
        env[`HTTP_${name.toUpperCase().replace(/-/g, '_')}`] = Array.isArray(value)
            ? value.join(', ')
            : value;
    }
    const contentType = req.headers['content-type'];
    if (contentType)
        env.CONTENT_TYPE = contentType;
    // Buffering the body lets us always report an exact length, which also covers
    // clients that use chunked transfer encoding.
    if (body.length > 0 || req.headers['content-length'] !== undefined) {
        env.CONTENT_LENGTH = String(body.length);
    }
    return env;
}
/**
 * Translate an HTTP request into a `git http-backend` CGI invocation and stream
 * its response back. Everything about the smart HTTP protocol (pkt-line,
 * packfiles, protocol v0/v1/v2) is handled by git itself.
 */
export async function handleGitRequest(req, res, pathInfo, queryString, remoteUser) {
    const body = await readBody(req);
    const env = buildCgiEnv(req, pathInfo, queryString, body);
    // `git http-backend` only allows receive-pack for an authenticated user.
    if (remoteUser)
        env.REMOTE_USER = remoteUser;
    const child = spawn('git', ['http-backend'], {
        env,
        stdio: ['pipe', 'pipe', 'pipe'],
        windowsHide: true,
    });
    let stderr = '';
    child.stderr.setEncoding('utf8');
    child.stderr.on('data', (chunk) => {
        stderr += chunk;
        process.stderr.write(`[git http-backend] ${chunk}`);
    });
    let headerBuffer = Buffer.alloc(0);
    let headersSent = false;
    const fail = (status, message) => {
        if (res.destroyed || res.headersSent)
            return;
        const payload = `${message}\n`;
        res.writeHead(status, {
            'Content-Type': 'text/plain; charset=utf-8',
            'Content-Length': Buffer.byteLength(payload),
        });
        res.end(payload);
    };
    child.stdout.on('data', (chunk) => {
        if (res.destroyed)
            return;
        if (headersSent) {
            res.write(chunk);
            return;
        }
        headerBuffer = Buffer.concat([headerBuffer, chunk]);
        const end = indexOfHeaderEnd(headerBuffer);
        if (!end)
            return;
        const { status, headers } = parseCgiHeaders(headerBuffer.subarray(0, end.index).toString('latin1'));
        const rest = headerBuffer.subarray(end.index + end.length);
        headerBuffer = Buffer.alloc(0);
        headersSent = true;
        res.writeHead(status, headers);
        if (rest.length > 0)
            res.write(rest);
    });
    child.on('error', (error) => {
        fail(500, `Failed to start git http-backend: ${error.message}`);
        res.end();
    });
    child.on('close', () => {
        if (res.destroyed)
            return;
        if (!headersSent) {
            fail(500, stderr.trim() || 'git http-backend exited without a response');
            return;
        }
        res.end();
    });
    // A failed spawn emits `error`, not `close`, so only guard the normal path here.
    child.stdin.on('error', () => {
        /* client or git closed the pipe early */
    });
    if (body.length > 0)
        child.stdin.end(body);
    else
        child.stdin.end();
    res.on('close', () => {
        if (!child.killed && child.exitCode === null)
            child.kill();
    });
}
//# sourceMappingURL=backend.js.map