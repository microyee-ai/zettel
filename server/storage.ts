import { DatabaseSync } from 'node:sqlite';
import { mkdirSync, chmodSync } from 'node:fs';
import { dirname } from 'node:path';
import { emptyWorkspace, parseWorkspace, type WorkspaceData } from '../shared/schema.js';

export class RevisionConflict extends Error {
  constructor() { super('Workspace changed. Reload before saving.'); }
}

export class WorkspaceStore {
  private db: DatabaseSync;
  readonly path: string;
  constructor(path: string) {
    this.path = path;
    if (path !== ':memory:') mkdirSync(dirname(path), { recursive: true, mode: 0o700 });
    this.db = new DatabaseSync(path);
    try {
      this.db.exec('PRAGMA busy_timeout=5000; PRAGMA journal_mode=WAL;');
      const version = this.db.prepare('PRAGMA user_version').get() as { user_version: number };
      if (version.user_version > 1) throw new Error('This workspace requires a newer Zettel version.');
      this.db.exec(`CREATE TABLE IF NOT EXISTS workspace (id INTEGER PRIMARY KEY CHECK(id=1), revision INTEGER NOT NULL, data TEXT NOT NULL);
        CREATE TABLE IF NOT EXISTS recovery (revision INTEGER PRIMARY KEY, saved_at TEXT NOT NULL, data TEXT NOT NULL);
        PRAGMA user_version=1;`);
      this.db.prepare('INSERT OR IGNORE INTO workspace (id,revision,data) VALUES (1,0,?)').run(JSON.stringify(emptyWorkspace()));
      if (path !== ':memory:') chmodSync(path, 0o600);
      this.load();
    } catch (error) { this.db.close(); throw error; }
  }
  load(): WorkspaceData {
    const row = this.db.prepare('SELECT data FROM workspace WHERE id=1').get() as { data: string };
    return parseWorkspace(JSON.parse(row.data));
  }
  save(input: unknown, expectedRevision: number): WorkspaceData {
    if (!Number.isSafeInteger(expectedRevision) || expectedRevision < 0) throw new Error('A valid expectedRevision is required');
    const data = parseWorkspace(input);
    this.db.exec('BEGIN IMMEDIATE');
    try {
      const current = this.load();
      if (current.revision !== expectedRevision) throw new RevisionConflict();
      if (data.workspace.id === current.workspace.id) data.workspace.nextIssueNumber = Math.max(data.workspace.nextIssueNumber ?? 1, current.workspace.nextIssueNumber ?? 1);
      const next = parseWorkspace({ ...data, revision: current.revision + 1 });
      this.db.prepare('INSERT OR REPLACE INTO recovery (revision,saved_at,data) VALUES (?,?,?)').run(current.revision, new Date().toISOString(), JSON.stringify(current));
      this.db.prepare('DELETE FROM recovery WHERE revision NOT IN (SELECT revision FROM recovery ORDER BY revision DESC LIMIT 10)').run();
      this.db.prepare('UPDATE workspace SET revision=?,data=? WHERE id=1').run(next.revision, JSON.stringify(next));
      this.db.exec('COMMIT');
      return next;
    } catch (error) { this.db.exec('ROLLBACK'); throw error; }
  }
  close() { this.db.close(); }
}
