import { execFile } from 'node:child_process';
import fs from 'node:fs/promises';
import path from 'node:path';
import { promisify } from 'node:util';
import { config } from '../config/config.js';
const execFileAsync = promisify(execFile);
/** Longest listing the page renders; a repository is not a file browser. */
const MAX_ENTRIES = 200;
/** README text passed to the page, in characters; longer files are cut. */
const MAX_README_CHARS = 200_000;
/** Largest file whose contents are handed to the page. */
const MAX_FILE_BYTES = 4 * 1024 * 1024;
/** Code viewer text, in characters; longer files are cut and marked. */
const MAX_FILE_CHARS = 400_000;
/** Bytes inspected for a NUL when deciding whether a file is binary. */
const BINARY_SNIFF_BYTES = 8000;
/** How many `git log` calls run at once while reading per-entry commits. */
const CONCURRENCY = 6;
/** Fields a commit row needs: sha, subject, author name, committer date (ISO). */
const COMMIT_FORMAT = '%H%x00%s%x00%an%x00%cI';
function repoDir(repo) {
    return path.join(config.reposRoot, repo.path);
}
/** Run git inside the bare repository; `null` when git exits non-zero. */
async function gitText(repo, args) {
    try {
        const { stdout } = await execFileAsync('git', ['-C', repoDir(repo), ...args], {
            encoding: 'utf8',
            maxBuffer: 16 * 1024 * 1024,
            windowsHide: true,
            // A page request must never wait for a credential prompt.
            env: { ...process.env, GIT_TERMINAL_PROMPT: '0' },
        });
        return stdout;
    }
    catch {
        return null;
    }
}
/** Same as `gitText`, but for file contents where bytes matter. */
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
/** Parse `git ls-tree -z` output into names and entry kinds. */
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
/** Total size of the repository on disk, including objects and refs. */
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
                // A file removed mid-walk is not a page error.
            }
        }
    }
    return total;
}
/** Run `work` over `items` with at most `limit` promises in flight. */
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
/** `git ls-tree` for `dir`; `null` when the directory does not exist. */
async function listTree(repo, dir) {
    // `ls-tree HEAD:<dir>` yields names relative to that directory. `HEAD` alone
    // lists the root commit's tree.
    const raw = await gitText(repo, dir === '' ? ['ls-tree', '-z', 'HEAD'] : ['ls-tree', '-z', `HEAD:${dir}`]);
    return raw === null ? null : parseTree(raw);
}
/**
 * One directory of the repository plus the facts the page shows above it:
 * commit count, newest commit, disk size and the directory's README. Returns
 * `null` when `dir` does not exist at `HEAD`.
 */
export async function readOverview(repo, dir = '') {
    const sizeBytes = await directorySize(repoDir(repo));
    const head = await gitText(repo, ['rev-parse', '--verify', '--quiet', 'HEAD']);
    if (!head) {
        // An empty repository only has a root, and even that has no entries.
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
/** Read one file at `HEAD`. `null` when the path is not a file. */
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
    // Oversized files are described, not loaded into the page.
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