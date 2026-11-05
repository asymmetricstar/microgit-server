#!/usr/bin/env node
import path from 'node:path';
import { purgeExpiredSessions } from './accounts/sessions.js';
import { ensureAdminExists } from './accounts/users.js';
import { config } from './config/config.js';
import { ensureSettingsFile, getSettings } from './config/settings.js';
import { SERVER_VERSION } from './config/version.js';
import { closeDatabases } from './data/db.js';
import { createServer } from './http/server.js';
import { ensureStorage } from './repositories/store.js';
import { runSettingsEditor } from './settings-cli.js';
// A single unhandled rejection would otherwise take the whole server down with
// Node's default behaviour. Log it and keep serving; the exit code tells a
// supervisor the process is unhealthy.
process.on('unhandledRejection', (reason) => {
    console.error('[git-server] unhandled promise rejection:', reason);
    process.exitCode = 1;
});
process.on('uncaughtException', (error) => {
    console.error('[git-server] uncaught exception:', error);
    process.exit(1);
});
async function main() {
    ensureSettingsFile();
    const args = process.argv.slice(2);
    if (args.includes('--settings') || args.includes('-s') || args[0] === 'settings') {
        await runSettingsEditor();
        process.exit(0);
        return;
    }
    await ensureStorage();
    purgeExpiredSessions();
    const promoted = ensureAdminExists();
    const settings = getSettings();
    const server = createServer();
    server.on('error', (error) => {
        console.error(`${settings.brand}: cannot listen on ${config.host}:${config.port}:`, error.message);
        process.exit(1);
    });
    server.listen(config.port, config.host, () => {
        const address = server.address();
        const port = typeof address === 'object' && address !== null ? address.port : config.port;
        const origin = config.publicUrl || `http://${config.host}:${port}`;
        console.log();
        console.log('         μ━━━━┳━━━●  Microgit');
        console.log(`              ┣━━━●  ${SERVER_VERSION} — Lightweight self-hosted git server`);
        console.log('              ┗━━━●  your own git server - clone, push, host.');
        console.log();
        console.log('  ┌─ Services');
        console.log(`  │  Listening: ${origin}`);
        console.log(`  │  Clone:    ${origin}/<user>/<repo>.git`);
        console.log('  └────────────────');
        console.log();
        console.log('  ┌─ Storage');
        console.log(`  │  Repos:    ${config.reposRoot}`);
        console.log(`  │  Data:     ${config.dataDir}`);
        console.log(`  │  Settings: ${config.settingsFile}`);
        console.log('  └────────────────');
        console.log();
        console.log('  ┌─ Preferences');
        console.log(`  │  Sessions:      ${settings.sessionDays} days`);
        console.log(`  │  Registration:  ${settings.allowRegistration ? 'open' : 'closed'}`);
        console.log(`  │  Template:      ${settings.template === '' ? 'none' : path.resolve(process.cwd(), settings.template)}`);
        console.log(`  │  MOTD:          ${settings.motd.trim() === '' ? 'none' : 'set'}`);
        console.log('  └────────────────');
        console.log();
        if (promoted) {
            console.log(`  Notice: '${promoted}' was promoted to administrator (none was left)`);
            console.log();
        }
        console.log('  Press Ctrl+C to stop.');
        console.log();
    });
    for (const signal of ['SIGINT', 'SIGTERM']) {
        process.on(signal, () => {
            console.log(`${settings.brand}: ${signal} received, shutting down`);
            server.close(() => {
                closeDatabases();
                process.exit(0);
            });
            // An in-flight git push can hold the socket open indefinitely; cut
            // everything loose after 5s and force the exit after 10s as a last resort.
            const cut = setTimeout(() => server.closeAllConnections(), 5_000);
            const halt = setTimeout(() => process.exit(0), 10_000);
            cut.unref();
            halt.unref();
        });
    }
}
main().catch((error) => {
    console.error(error);
    process.exit(1);
});
//# sourceMappingURL=index.js.map