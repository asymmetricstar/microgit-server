import http from 'node:http';
import express from 'express';
import { route } from './router.js';
import { sendError } from './response.js';
export function createApp() {
    const app = express();
    app.disable('x-powered-by');
    // Request bodies stay untouched here: git needs the raw stream for http-backend
    // and the API handlers read their own (bounded) JSON bodies.
    app.use((req, res, next) => {
        route(req, res).catch(next);
    });
    app.use((error, req, res, _next) => {
        sendError(req, res, error);
    });
    return app;
}
export function createServer() {
    const server = http.createServer(createApp());
    server.keepAliveTimeout = 60_000;
    server.headersTimeout = 65_000;
    // A slow or stalled client must not hold a socket (and its buffer) forever:
    // 15 minutes comfortably covers large pushes while still bounding the wait.
    server.requestTimeout = 15 * 60_000;
    server.timeout = 0;
    return server;
}
//# sourceMappingURL=server.js.map