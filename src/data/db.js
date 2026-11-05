import fs from 'node:fs';
import path from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import { config } from '../config/config.js';
/**
 * Two SQLite databases, opened once per process:
 *
 *   users.db - accounts, API sessions, audit trail
 *   repo.db  - repositories and their owners
 *
 * Keeping them apart means the repository catalogue can be inspected, backed up
 * or replaced without touching live sessions, and a damaged users database can
 * be rebuilt without losing repository metadata.
 */
let usersDatabase = null;
let repoDatabase = null;
function open(file) {
    fs.mkdirSync(path.dirname(file), { recursive: true });
    let db;
    try {
        db = new DatabaseSync(file);
    }
    catch (error) {
        // Never delete an unreadable database: park it (together with its WAL/SHM
        // sidecars) under a `.corrupt-<timestamp>` name so the data stays
        // recoverable, then start fresh. Silently dropping the file would destroy
        // every account or the whole repository catalogue.
        const parked = `${file}.corrupt-${new Date().toISOString().replace(/[^0-9A-Za-z]/g, '_')}`;
        try {
            for (const suffix of ['', '-wal', '-shm']) {
                if (fs.existsSync(file + suffix))
                    fs.renameSync(file + suffix, parked + suffix);
            }
        }
        catch (renameError) {
            throw new Error(`Cannot open ${file}: ${error.message}; ` +
                `cannot park the file aside either: ${renameError.message}`);
        }
        console.error(`[git-server] cannot open ${file}: ${error.message}`);
        console.error(`[git-server] the file was parked at ${parked}; continuing with a fresh database`);
        db = new DatabaseSync(file);
    }
    // WAL keeps readers running while a write commits; busy_timeout makes two
    // processes (e.g. the test server and a CLI) wait instead of failing.
    db.exec('PRAGMA journal_mode = WAL');
    db.exec('PRAGMA synchronous = NORMAL');
    db.exec('PRAGMA foreign_keys = ON');
    db.exec('PRAGMA busy_timeout = 5000');
    return db;
}
/**
 * Safe, unique backup name for a legacy table: parked instead of dropped so a
 * schema migration never destroys data.
 */
function legacyTableName(table) {
    return `${table}_legacy_${new Date().toISOString().replace(/[^0-9A-Za-z]/g, '_')}`;
}
/** Column names of one table, or an empty list when it does not exist. */
function columnsOf(db, table) {
    const rows = db.prepare(`PRAGMA table_info(${table})`).all();
    return rows.map((row) => row.name);
}
export function usersDb() {
    if (!usersDatabase) {
        usersDatabase = open(config.usersDbFile);
        // The audit trail used to be keyed by branch; repositories are now owned by
        // a user and have no branch in their identity.
        const auditColumns = columnsOf(usersDatabase, 'audit');
        if (auditColumns.length > 0 && !auditColumns.includes('repo')) {
            // Park the legacy table instead of dropping evidence; the CREATE TABLE
            // below builds the current schema next to it.
            usersDatabase.exec(`ALTER TABLE audit RENAME TO ${legacyTableName('audit')}`);
        }
        usersDatabase.exec(`
      CREATE TABLE IF NOT EXISTS users (
        id         INTEGER PRIMARY KEY AUTOINCREMENT,
        username   TEXT NOT NULL UNIQUE COLLATE NOCASE,
        salt       TEXT NOT NULL,
        hash       TEXT NOT NULL,
        is_admin   INTEGER NOT NULL DEFAULT 0,
        created_at TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS sessions (
        token_hash TEXT PRIMARY KEY,
        user_id    INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        created_at TEXT NOT NULL,
        expires_at TEXT NOT NULL
      );
      CREATE INDEX IF NOT EXISTS sessions_expiry ON sessions(expires_at);
      CREATE INDEX IF NOT EXISTS sessions_user ON sessions(user_id);

      CREATE TABLE IF NOT EXISTS audit (
        id      INTEGER PRIMARY KEY AUTOINCREMENT,
        at      TEXT NOT NULL,
        action  TEXT NOT NULL,
        actor   TEXT,
        ip      TEXT,
        repo    TEXT,
        status  INTEGER NOT NULL,
        detail  TEXT
      );
      CREATE INDEX IF NOT EXISTS audit_at ON audit(at DESC);
      CREATE INDEX IF NOT EXISTS audit_action ON audit(action);
    `);
    }
    return usersDatabase;
}
export function repoDb() {
    if (!repoDatabase) {
        repoDatabase = open(config.repoDbFile);
        // Repositories used to be identified by a name/branch pair with per-repo
        // push credentials. The new identity is owner/name, so the old catalogue is
        // rebuilt; nothing is lost because those rows are not addressable anymore.
        const repoColumns = columnsOf(repoDatabase, 'repos');
        if (repoColumns.length > 0 && !repoColumns.includes('owner')) {
            // Park the legacy catalogue instead of dropping it: the CREATE TABLE below
            // builds the current schema next to it, and the old rows stay recoverable.
            // (Dropping repos would orphan every on-disk repository directory.)
            if (columnsOf(repoDatabase, 'repo_credentials').length > 0) {
                repoDatabase.exec(`ALTER TABLE repo_credentials RENAME TO ${legacyTableName('repo_credentials')}`);
            }
            repoDatabase.exec(`ALTER TABLE repos RENAME TO ${legacyTableName('repos')}`);
        }
        else if (repoColumns.includes('delete_key_hash')) {
            // Delete keys existed only for the anonymous repositories of the old
            // design; an owned repository is deleted with its session.
            repoDatabase.exec('ALTER TABLE repos DROP COLUMN delete_key_hash');
        }
        repoDatabase.exec(`
      CREATE TABLE IF NOT EXISTS repos (
        id              INTEGER PRIMARY KEY AUTOINCREMENT,
        owner_id        INTEGER,
        owner           TEXT NOT NULL,
        name            TEXT NOT NULL,
        hash            TEXT NOT NULL UNIQUE,
        path            TEXT NOT NULL UNIQUE,
        is_private      INTEGER NOT NULL DEFAULT 0,
        created_at      TEXT NOT NULL,
        updated_at      TEXT NOT NULL,
        UNIQUE(owner, name)
      );
      CREATE INDEX IF NOT EXISTS repos_owner ON repos(owner);
    `);
    }
    return repoDatabase;
}
/** Close both databases; used by the graceful shutdown path. */
export function closeDatabases() {
    if (usersDatabase) {
        usersDatabase.close();
        usersDatabase = null;
    }
    if (repoDatabase) {
        repoDatabase.close();
        repoDatabase = null;
    }
}
//# sourceMappingURL=db.js.map