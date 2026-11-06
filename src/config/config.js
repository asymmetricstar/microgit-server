import path from 'node:path';
import { getSettings, settingsFilePath } from './settings.js';
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
    port: intEnv('PORT', settings.port),
    host: process.env.HOST ?? settings.host,
    reposRoot,
    dataDir,
    usersDbFile: path.join(dataDir, 'users.db'),
    repoDbFile: path.join(dataDir, 'repo.db'),
    settingsFile: settingsFilePath(),
    publicUrl: normalizeOrigin(process.env.PUBLIC_URL ?? settings.publicUrl) ||
        normalizeOrigin(settings.domain),
    trustProxy: boolEnv('TRUST_PROXY', settings.trustProxy),
};
//# sourceMappingURL=config.js.map