import path from 'node:path';
import { getSettings, settingsFilePath } from './settings.js';
/**
 * Configuration comes from `settings.json`; the environment only overrides it,
 * which keeps containers and one-off runs working without editing the file.
 *
 * The address and the two directories are read once, at startup: changing them
 * while the process runs would move databases that are already open. Template,
 * MOTD and the session limits are read per request by `getSettings()`.
 */
function intEnv(name, fallback) {
    const raw = process.env[name];
    if (raw === undefined || raw.trim() === '')
        return fallback;
    const value = Number.parseInt(raw, 10);
    return Number.isFinite(value) ? value : fallback;
}
function boolEnv(name, fallback) {
    const raw = process.env[name];
    if (raw === undefined || raw.trim() === '')
        return fallback;
    return /^(1|true|yes|on)$/i.test(raw.trim());
}
/** Turn a bare domain into an origin, keeping a scheme when one is given. */
function normalizeOrigin(value) {
    const trimmed = value.trim().replace(/\/+$/, '');
    if (trimmed === '')
        return '';
    return /^[a-z][a-z0-9+.-]*:\/\//i.test(trimmed) ? trimmed : `http://${trimmed}`;
}
const settings = getSettings();
const cwd = process.cwd();
const dataDir = path.resolve(cwd, process.env.GIT_DATA_DIR ?? settings.dataDir);
const reposRoot = path.resolve(cwd, process.env.GIT_REPOS_DIR ?? settings.reposDir);
export const config = {
    /** TCP port the HTTP server listens on. */
    port: intEnv('PORT', settings.port),
    /** Bind address. Defaults to loopback from settings.json. */
    host: process.env.HOST ?? settings.host,
    /** Directory holding the bare repositories that are served over HTTP. */
    reposRoot,
    /** Directory holding both SQLite databases. */
    dataDir,
    /** SQLite database with users, sessions and the audit trail. */
    usersDbFile: path.join(dataDir, 'users.db'),
    /** SQLite database with repositories and their owners. */
    repoDbFile: path.join(dataDir, 'repo.db'),
    /** Server side settings, editable by the administrator only. */
    settingsFile: settingsFilePath(),
    /**
     * Absolute origin used in generated clone URLs, e.g. `https://git.example.com`.
     * Precedence: `PUBLIC_URL`, then `publicUrl`, then the `domain` setting. Leave
     * empty to derive it from the request (`X-Forwarded-*` when trustProxy).
     */
    publicUrl: normalizeOrigin(process.env.PUBLIC_URL ?? settings.publicUrl) ||
        normalizeOrigin(settings.domain),
    /** Trust `X-Forwarded-Proto` / `X-Forwarded-Host` from a reverse proxy. */
    trustProxy: boolEnv('TRUST_PROXY', settings.trustProxy),
};
//# sourceMappingURL=config.js.map