import fs from 'node:fs';
import path from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import { config } from '../config/config.js';
let usersDatabase = null;
let repoDatabase = null;
function open(file) {
    fs.mkdirSync(path.dirname(file), { recursive: true });
    let db;
    try {
        db = new DatabaseSync(file);
    }
    catch (error) {
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
    db.exec('PRAGMA journal_mode = WAL');
    db.exec('PRAGMA synchronous = NORMAL');
    db.exec('PRAGMA foreign_keys = ON');
    db.exec('PRAGMA busy_timeout = 5000');
    return db;
}
function legacyTableName(table) {
    return `${table}_legacy_${new Date().toISOString().replace(/[^0-9A-Za-z]/g, '_')}`;
}
function columnsOf(db, table) {
    const rows = db.prepare(`PRAGMA table_info(${table})`).all();
    return rows.map((row) => row.name);
}
export function usersDb() {
    if (!usersDatabase) {
        usersDatabase = open(config.usersDbFile);
        const auditColumns = columnsOf(usersDatabase, 'audit');
        if (auditColumns.length > 0 && !auditColumns.includes('repo')) {
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
        const repoColumns = columnsOf(repoDatabase, 'repos');
        if (repoColumns.length > 0 && !repoColumns.includes('owner')) {
            if (columnsOf(repoDatabase, 'repo_credentials').length > 0) {
                repoDatabase.exec(`ALTER TABLE repo_credentials RENAME TO ${legacyTableName('repo_credentials')}`);
            }
            repoDatabase.exec(`ALTER TABLE repos RENAME TO ${legacyTableName('repos')}`);
        }
        else if (repoColumns.includes('delete_key_hash')) {
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

      -- Who else may open a repository: a private repository belongs to its
      -- owner, but the owner can hand out access — 'read' opens it and clones
      -- it, 'write' may also push. The owner and administrators are never
      -- listed here; they already have every right.
      -- There is deliberately no FOREIGN KEY on user_id: accounts live in
      -- users.db, a different file, and SQLite cannot reference across files.
      -- src/repositories/members.ts drops rows whose account has gone.
      CREATE TABLE IF NOT EXISTS repo_members (
        repo_id    INTEGER NOT NULL REFERENCES repos(id) ON DELETE CASCADE,
        user_id    INTEGER NOT NULL,
        role       TEXT NOT NULL DEFAULT 'read' CHECK (role IN ('read', 'write')),
        created_at TEXT NOT NULL,
        PRIMARY KEY (repo_id, user_id)
      );
      CREATE INDEX IF NOT EXISTS repo_members_user ON repo_members(user_id);
    `);
    }
    return repoDatabase;
}
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