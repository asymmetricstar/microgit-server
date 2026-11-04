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
    // Large pushes take longer than Node's default 5 minute request timeout.
    server.requestTimeout = 0;
    server.timeout = 0;
    return server;
}
//# sourceMappingURL=server.js.map