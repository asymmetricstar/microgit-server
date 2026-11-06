import { execFile } from 'node:child_process';
import fs from 'node:fs/promises';
import path from 'node:path';
import { promisify } from 'node:util';
import { config } from '../config/config.js';
const execFileAsync = promisify(execFile);
const MAX_ENTRIES = 200;
const MAX_README_CHARS = 200_000;
const MAX_FILE_BYTES = 4 * 1024 * 1024;
const MAX_FILE_CHARS = 400_000;
const BINARY_SNIFF_BYTES = 8000;
const CONCURRENCY = 6;
const COMMIT_FORMAT = '%H%x00%s%x00%an%x00%cI';
function repoDir(repo) {
    return path.join(config.reposRoot, repo.path);
}
async function gitText(repo, args) {
    try {
        const { stdout } = await execFileAsync('git', ['-C', repoDir(repo), ...args], {
            encoding: 'utf8',
            maxBuffer: 16 * 1024 * 1024,
            windowsHide: true,
            env: { ...process.env, GIT_TERMINAL_PROMPT: '0' },
        });
        return stdout;
    }
    catch {
        return null;
    }
}
export async function gitBuffer(repo, args) {
    try {
        const { stdout } = await execFileAsync('git', ['-C', repoDir(repo), ...args], {
            encoding: 'buffer',
            maxBuffer: MAX_FILE_BYTES + 1024 * 1024,
            windowsHide: true,
            env: { ...process.env, GIT_TERMINAL_PROMPT: '0' },
        });
        return stdout;
    }
    catch {
        return null;
    }
}
function parseCommit(raw) {
    if (!raw)
        return null;
    const [sha, subject, author, date] = raw.replace(/\n+$/, '').split('\u0000');
    if (!sha || !date)
        return null;
    return { sha, subject: subject ?? '', author: author ?? '', date };
}
function parseTree(raw) {
    const entries = [];
    for (const line of raw.split('\u0000')) {
        if (!line)
            continue;
        const tab = line.indexOf('\t');
        if (tab === -1)
            continue;
        const [, type] = line.slice(0, tab).split(' ');
        entries.push({ name: line.slice(tab + 1), isDirectory: type === 'tree' });
    }
    return entries;
}
async function directorySize(dir) {
    let entries;
    try {
        entries = await fs.readdir(dir, { withFileTypes: true });
    }
    catch {
        return 0;
    }
    let total = 0;
    for (const entry of entries) {
        const full = path.join(dir, entry.name);
        if (entry.isDirectory()) {
            total += await directorySize(full);
        }
        else if (entry.isFile()) {
            try {
                total += (await fs.stat(full)).size;
            }
            catch {
            }
        }
    }
    return total;
}
async function mapLimited(items, limit, work) {
    const results = new Array(items.length);
    let next = 0;
    const workers = Array.from({ length: Math.min(limit, items.length) }, async () => {
        for (;;) {
            const index = next;
            next += 1;
            if (index >= items.length)
                return;
            results[index] = await work(items[index]);
        }
    });
    await Promise.all(workers);
    return results;
}
async function listTree(repo, dir) {
    const raw = await gitText(repo, dir === '' ? ['ls-tree', '-z', 'HEAD'] : ['ls-tree', '-z', `HEAD:${dir}`]);
    return raw === null ? null : parseTree(raw);
}
export async function readOverview(repo, dir = '') {
    const sizeBytes = await directorySize(repoDir(repo));
    const head = await gitText(repo, ['rev-parse', '--verify', '--quiet', 'HEAD']);
    if (!head) {
        return dir === ''
            ? { commits: 0, lastCommit: null, sizeBytes, dir: '', entries: [], readme: null }
            : null;
    }
    const [countRaw, lastRaw, listing] = await Promise.all([
        gitText(repo, ['rev-list', '--count', 'HEAD']),
        gitText(repo, ['log', '-1', `--format=${COMMIT_FORMAT}`, 'HEAD']),
        listTree(repo, dir),
    ]);
    if (listing === null)
        return null;
    const shown = listing.slice(0, MAX_ENTRIES);
    const entries = await mapLimited(shown, CONCURRENCY, async (entry) => {
        const fullPath = dir === '' ? entry.name : `${dir}/${entry.name}`;
        return {
            ...entry,
            path: fullPath,
            commit: parseCommit(await gitText(repo, ['log', '-1', `--format=${COMMIT_FORMAT}`, 'HEAD', '--', fullPath])),
        };
    });
    const readmeEntry = entries.find((entry) => !entry.isDirectory && /^readme(\.md|\.markdown)$/i.test(entry.name));
    let readme = null;
    if (readmeEntry) {
        const text = await gitText(repo, ['show', `HEAD:${readmeEntry.path}`]);
        if (text !== null) {
            readme = { name: readmeEntry.name, text: text.slice(0, MAX_README_CHARS) };
        }
    }
    const commits = Number.parseInt((countRaw ?? '').trim(), 10);
    return {
        commits: Number.isFinite(commits) ? commits : 0,
        lastCommit: parseCommit(lastRaw),
        sizeBytes,
        dir,
        entries,
        readme,
    };
}
export async function readFile(repo, filePath) {
    const sizeRaw = await gitText(repo, ['cat-file', '-s', `HEAD:${filePath}`]);
    if (!sizeRaw)
        return null;
    const sizeBytes = Number.parseInt(sizeRaw.trim(), 10);
    if (!Number.isFinite(sizeBytes))
        return null;
    const base = {
        path: filePath,
        name: filePath.split('/').pop() ?? filePath,
        sizeBytes,
    };
    if (sizeBytes > MAX_FILE_BYTES) {
        return { ...base, text: null, binary: false, truncated: true, lines: 0 };
    }
    const buffer = await gitBuffer(repo, ['show', `HEAD:${filePath}`]);
    if (buffer === null)
        return null;
    const binary = buffer.subarray(0, BINARY_SNIFF_BYTES).includes(0);
    if (binary)
        return { ...base, text: null, binary: true, truncated: false, lines: 0 };
    const full = buffer.toString('utf8');
    const truncated = full.length > MAX_FILE_CHARS;
    const text = truncated ? full.slice(0, MAX_FILE_CHARS) : full;
    return {
        ...base,
        text,
        binary: false,
        truncated,
        lines: text === '' ? 0 : text.split('\n').length,
    };
}
//# sourceMappingURL=inspect.js.map