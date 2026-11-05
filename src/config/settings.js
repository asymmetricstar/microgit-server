import fs from 'node:fs';
import path from 'node:path';
/**
 * The settings file is the one path that cannot come from the settings file
 * itself; everything else (address, directories, template, MOTD) is in there.
 */
const SETTINGS_FILE = path.resolve(process.cwd(), process.env.GIT_SETTINGS_FILE ?? 'settings.json');
const DEFAULTS = {
    host: '127.0.0.1',
    brand: 'Microgit',
    tagline: '',
    port: 3000,
    reposDir: 'repos',
    dataDir: 'data',
    publicUrl: '',
    domain: '',
    trustProxy: false,
    motd: '',
    allowRegistration: true,
    template: '',
    sessionDays: 7,
    maxPushBytes: 0,
    cacheTtlMs: 5000,
};
let cache = null;
function normalize(raw) {
    const input = (raw ?? {});
    const bool = (key) => typeof input[key] === 'boolean' ? input[key] : DEFAULTS[key];
    const text = (key) => typeof input[key] === 'string' ? input[key] : DEFAULTS[key];
    const number = (key) => {
        const value = input[key];
        return typeof value === 'number' && Number.isFinite(value) && value >= 0
            ? value
            : DEFAULTS[key];
    };
    const integer = (key, min, max, fallback) => {
        const value = input[key];
        return typeof value === 'number' && Number.isInteger(value) && value >= min && value <= max
            ? value
            : fallback;
    };
    return {
        host: text('host').trim() || DEFAULTS.host,
        brand: text('brand').trim() || DEFAULTS.brand,
        tagline: text('tagline').trim(),
        port: integer('port', 1, 65_535, DEFAULTS.port),
        reposDir: text('reposDir').trim() || DEFAULTS.reposDir,
        dataDir: text('dataDir').trim() || DEFAULTS.dataDir,
        publicUrl: text('publicUrl').trim().replace(/\/+$/, ''),
        domain: text('domain').trim().replace(/\/+$/, ''),
        trustProxy: bool('trustProxy'),
        motd: text('motd'),
        allowRegistration: bool('allowRegistration'),
        template: text('template').trim(),
        sessionDays: integer('sessionDays', 0, 365, DEFAULTS.sessionDays),
        maxPushBytes: number('maxPushBytes'),
        cacheTtlMs: integer('cacheTtlMs', 0, 86_400_000, DEFAULTS.cacheTtlMs),
    };
}
/** Create `settings.json` if it does not exist, so an admin can edit it. */
export function ensureSettingsFile() {
    if (fs.existsSync(SETTINGS_FILE))
        return;
    fs.mkdirSync(path.dirname(SETTINGS_FILE), { recursive: true });
    const body = `${JSON.stringify(DEFAULTS, null, 2)}\n`;
    fs.writeFileSync(SETTINGS_FILE, body, { encoding: 'utf8' });
    // Written once, then owned by the administrator.
    cache = { settings: { ...DEFAULTS }, mtimeMs: fs.statSync(SETTINGS_FILE).mtimeMs };
}
/** Absolute path of the settings file (from `GIT_SETTINGS_FILE`, else CWD). */
export function settingsFilePath() {
    return SETTINGS_FILE;
}
/**
 * Current settings. The file is read again whenever its mtime changes, so an
 * edit takes effect without a restart.
 */
export function getSettings() {
    let stat;
    try {
        stat = fs.statSync(SETTINGS_FILE);
    }
    catch {
        ensureSettingsFile();
        stat = fs.statSync(SETTINGS_FILE);
    }
    if (cache && cache.mtimeMs === stat.mtimeMs)
        return cache.settings;
    const text = fs.readFileSync(SETTINGS_FILE, 'utf8');
    let parsed;
    try {
        parsed = JSON.parse(text);
    }
    catch (error) {
        throw new Error(`settings file '${SETTINGS_FILE}' is not valid JSON: ${error.message}`);
    }
    const settings = normalize(parsed);
    cache = { settings, mtimeMs: stat.mtimeMs };
    return settings;
}
/** Values safe to show to any client. */
export function publicSettings() {
    const settings = getSettings();
    return { allowRegistration: settings.allowRegistration, motd: settings.motd };
}
/** Test helper: forget the cached settings so the file is re-read. */
export function resetSettingsCache() {
    cache = null;
}
//# sourceMappingURL=settings.js.map