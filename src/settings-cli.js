import fs from 'node:fs';
import readline from 'node:readline';
import { getSettings, settingsFilePath, ensureSettingsFile } from './config/settings.js';
import { SERVER_VERSION } from './config/version.js';
import { sanitizeObject } from './util/safe.js';
const colour = Boolean(process.stdout.isTTY) && process.env.NO_COLOR === undefined;
const paint = (spec) => (text) => colour ? `\u001b[${spec}m${text}\u001b[0m` : text;
const faint = paint('38;5;240');
const dim = paint('38;5;246');
const bold = paint('1');
const red = paint('38;5;203');
const yellow = paint('38;5;179');
const white = paint('38;5;255');
const green = paint('38;5;114');
const NODE = red('●');
function clearScreen() {
    if (process.stdout.isTTY)
        process.stdout.write('\u001b[2J\u001b[3J\u001b[H');
}
function logo() {
    const settings = getSettings();
    const name = `${bold(settings.brand)} ${dim('·')} ${dim('server')}`;
    const version = `v${SERVER_VERSION}`;
    const tagline = settings.tagline === '' ? '' : dim(settings.tagline);
    return [
        `  ${NODE} ${faint('━━━━')} ${NODE}`,
        `    ${faint('┣━━━')} ${NODE}   ${name}  ${dim(version)}`,
        `    ${faint('┗━━━')} ${NODE}   ${tagline}`,
    ].join('\n');
}
function readSettingsRaw() {
    const file = settingsFilePath();
    try {
        return sanitizeObject(JSON.parse(fs.readFileSync(file, 'utf8')));
    }
    catch {
        return {};
    }
}
function writeSettingsRaw(raw) {
    const file = settingsFilePath();
    fs.writeFileSync(file, `${JSON.stringify(raw, null, 2)}\n`, 'utf8');
}
const EDITABLE = [
    { key: 'host', label: 'host', hint: 'bind address', desc: 'Address the HTTP server binds to. Use 127.0.0.1 (loopback) to keep it private, or 0.0.0.0 to expose it on all interfaces.' },
    { key: 'port', label: 'port', hint: 'TCP port', desc: 'TCP port the server listens on. Change it if 3000 is taken; restart required.' },
    { key: 'brand', label: 'brand', hint: 'name in header/title', desc: 'Name shown in the page header, the HTML <title> and the footer. The service trademark.' },
    { key: 'tagline', label: 'tagline', hint: 'word after brand', desc: 'Optional word printed after the brand in the header (e.g. "lightweight git service"). Empty shows only the brand.' },
    { key: 'motd', label: 'motd', hint: 'banner after sign-in', desc: 'Free-form message of the day shown to CLI/terminal clients after sign-in. Empty disables it.' },
    { key: 'allowRegistration', label: 'allowRegistration', hint: 'true/false', desc: 'Allow POST /api/register. Turn off after creating the accounts you need.' },
    { key: 'sessionDays', label: 'sessionDays', hint: 'session lifetime (days)', desc: 'Lifetime of an API session token in days. Expired sessions are purged at startup.' },
    { key: 'domain', label: 'domain', hint: 'public domain', desc: 'Public domain shown in the UI and clone URLs (e.g. git.example.com or https://git.example.com). Empty derives from the request.' },
    { key: 'dataDir', label: 'dataDir', hint: 'SQLite directory', desc: 'Directory holding users.db and repo.db. Restart required after changing.' },
    { key: 'reposDir', label: 'reposDir', hint: 'bare repos directory', desc: 'Directory holding the bare repositories served over HTTP. Restart required after changing.' },
];
function ask(rl, question) {
    return new Promise((resolve) => rl.question(question, (a) => resolve(a.trim())));
}
function showHelp() {
    console.log('');
    console.log(`  ${bold('Settings help')}`);
    console.log(`  ${faint('─'.repeat(60))}`);
    for (const field of EDITABLE) {
        console.log(`  ${red('●')} ${bold(field.label)}`);
        console.log(`      ${dim(field.desc)}`);
    }
    console.log('');
    console.log(`  ${dim('Values are written to settings.json. host/port/dataDir/reposDir need a restart.')}`);
    console.log('');
}
/** Interactive (or piped) settings editor. Zero external dependencies. */
export async function runSettingsEditor() {
    ensureSettingsFile();
    const raw = readSettingsRaw();
    const isTTY = Boolean(process.stdin.isTTY) && Boolean(process.stdout.isTTY);
    // Piped (non-interactive) mode: read all lines then apply in order.
    if (!isTTY) {
        const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
        const lines = [];
        for await (const line of rl)
            lines.push(line.trim());
        let changed = false;
        let li = 0;
        for (const field of EDITABLE) {
            const answer = li < lines.length ? lines[li++] : '';
            if (answer === '')
                continue;
            if (field.key === 'port' || field.key === 'sessionDays') {
                const n = Number.parseInt(answer, 10);
                if (!Number.isFinite(n) || n < 0)
                    continue;
                raw[field.key] = n;
            }
            else if (field.key === 'allowRegistration') {
                if (answer !== 'true' && answer !== 'false')
                    continue;
                raw[field.key] = answer === 'true';
            }
            else {
                raw[field.key] = answer;
            }
            changed = true;
        }
        if (changed) {
            writeSettingsRaw(raw);
            console.log(`settings saved to ${settingsFilePath()}`);
        }
        else {
            console.log('no changes made.');
        }
        return;
    }
    // Interactive menu mode with native readline (no enquirer).
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
    try {
        let changed = false;
        let exiting = false;
        while (!exiting) {
            console.log(logo());
            console.log('');
            console.log(`  ${bold('Select a setting to edit:')}`);
            for (let i = 0; i < EDITABLE.length; i++) {
                const field = EDITABLE[i];
                const current = raw[field.key];
                const display = current === undefined || current === null ? '' : String(current);
                console.log(`  ${String(i + 1).padStart(2, ' ')}. ${field.label} - ${field.hint}  ${dim('[' + (display === '' ? '(empty)' : display) + ']')}`);
            }
            console.log(`  0. Save & exit`);
            console.log(`  h. Help`);
            console.log(`  q. Quit`);
            console.log('');
            const answer = (await ask(rl, `  ${bold('Choice: ')}`)).toLowerCase();
            if (answer === 'q' || answer === 'quit') {
                console.log(`\n  ${dim('discarded. no changes written.')}`);
                exiting = true;
                break;
            }
            if (answer === 'h' || answer === 'help') {
                clearScreen();
                console.log(logo());
                console.log('');
                showHelp();
                continue;
            }
            if (answer === '0') {
                if (changed) {
                    writeSettingsRaw(raw);
                    console.log(`\n  ${green('✓')} ${dim('settings saved to')} ${dim(settingsFilePath())}`);
                }
                else {
                    console.log(`\n  ${dim('no changes made.')}`);
                }
                exiting = true;
                break;
            }
            const index = Number.parseInt(answer, 10) - 1;
            if (!Number.isFinite(index) || index < 0 || index >= EDITABLE.length) {
                console.log(`  ${red('✗')} invalid selection`);
                continue;
            }
            const field = EDITABLE[index];
            const current = raw[field.key];
            const display = current === undefined || current === null ? '' : String(current);
            console.log('');
            console.log(`  ${red('●')} ${bold(field.label)}  ${dim(field.hint)}`);
            console.log(`      ${dim(field.desc)}`);
            console.log(`      ${dim('current:')} ${white(display === '' ? '(empty)' : display)}`);
            const value = await ask(rl, `      new value for ${field.label} (Enter to keep): `);
            if (value === '') {
                console.log(`      ${dim('kept.')}`);
            }
            else {
                if (field.key === 'port' || field.key === 'sessionDays') {
                    const n = Number.parseInt(value, 10);
                    if (!Number.isFinite(n) || n < 0) {
                        console.log(`      ${red('✗')} invalid number`);
                    }
                    else {
                        raw[field.key] = n;
                        changed = true;
                        console.log(`      ${green('✓')} updated`);
                    }
                }
                else if (field.key === 'allowRegistration') {
                    if (value !== 'true' && value !== 'false') {
                        console.log(`      ${red('✗')} expected true/false`);
                    }
                    else {
                        raw[field.key] = value === 'true';
                        changed = true;
                        console.log(`      ${green('✓')} updated`);
                    }
                }
                else {
                    raw[field.key] = value;
                    changed = true;
                    console.log(`      ${green('✓')} updated`);
                }
            }
        }
    }
    finally {
        rl.close();
    }
}
//# sourceMappingURL=settings-cli.js.map