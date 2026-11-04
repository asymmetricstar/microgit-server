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
        const label = (text) => `  ${text.padEnd(12)}`;
        const brand = settings.tagline === ''
            ? settings.brand
            : `${settings.brand} — ${settings.tagline}`;
        console.log();
        console.log(`  ${brand} ${SERVER_VERSION}`);
        console.log();
        console.log(`${label('Listening')} ${origin}`);
        console.log(`${label('Clone')} ${origin}/<user>/<repo>.git`);
        console.log(`${label('Repos')} ${config.reposRoot}`);
        console.log(`${label('Data')} ${config.dataDir}`);
        console.log(`${label('Settings')} ${config.settingsFile}`);
        console.log(`${label('Sessions')} ${settings.sessionDays} days`);
        console.log(`${label('Registration')} ${settings.allowRegistration ? 'open' : 'closed'}`);
        console.log(`${label('Template')} ${settings.template === '' ? 'none' : path.resolve(process.cwd(), settings.template)}`);
        console.log(`${label('MOTD')} ${settings.motd.trim() === '' ? 'none' : 'set'}`);
        if (promoted) {
            console.log(`${label('Notice')} '${promoted}' was promoted to administrator (none was left)`);
        }
        console.log();
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
        });
    }
}
main().catch((error) => {
    console.error(error);
    process.exit(1);
});
//# sourceMappingURL=index.js.map