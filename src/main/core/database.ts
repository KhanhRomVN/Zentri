import * as sqlite3 from 'sqlite3';
import * as path from 'path';
import * as fs from 'fs';
import { app } from 'electron';

export class DbManager {
  private db: sqlite3.Database | null = null;
  public dbPath: string = '';

  private initializing: Promise<void> | null = null;

  constructor() {}

  async init(inputPath?: string): Promise<void> {
    if (this.initializing) {
      return this.initializing;
    }

    this.initializing = this.doInit(inputPath);
    return this.initializing;
  }

  private async ensureInitialized(): Promise<void> {
    if (this.initializing) {
      await this.initializing;
    } else {
      await this.init();
    }
  }

  private async doInit(inputPath?: string): Promise<void> {
    if (inputPath) {
      // Check if it's a directory or a file
      if (fs.existsSync(inputPath) && fs.statSync(inputPath).isDirectory()) {
        this.dbPath = path.join(inputPath, 'zentri.db');
      } else {
        this.dbPath = inputPath;
      }
    } else {
      this.dbPath = path.join(app.getPath('userData'), 'zentri.db');
    }

    // Ensure the directory for the DB exists
    const dbDir = path.dirname(this.dbPath);
    if (!fs.existsSync(dbDir)) {
      fs.mkdirSync(dbDir, { recursive: true });
    }

    // Also ensure profiles directory exists in the same folder as the DB
    const profilesPath = path.join(dbDir, 'profiles');
    if (!fs.existsSync(profilesPath)) {
      fs.mkdirSync(profilesPath, { recursive: true });
    }

    return new Promise((resolve, reject) => {
      this.db = new sqlite3.Database(
        this.dbPath,
        sqlite3.OPEN_READWRITE | sqlite3.OPEN_CREATE,
        (err) => {
          if (err) {
            reject(err);
          } else {
            this.setupSchema().then(resolve).catch(reject);
          }
        },
      );
    });
  }

  private async setupSchema(): Promise<void> {
    const schema = `
      PRAGMA foreign_keys = ON;

      CREATE TABLE IF NOT EXISTS emails (
          id TEXT PRIMARY KEY,
          email TEXT NOT NULL,
          password TEXT,
          status TEXT DEFAULT 'active',
          phone_number TEXT,
          recovery_email TEXT,
          totp_secret_key TEXT,
          backup_codes TEXT,
          scheduled_deletion_at DATETIME,
          last_used_at DATETIME,
          inbox_cache TEXT,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      CREATE INDEX IF NOT EXISTS idx_emails_status ON emails(status);

      CREATE TABLE IF NOT EXISTS services (
          id TEXT PRIMARY KEY,
          name TEXT NOT NULL,
          url TEXT,
          tags TEXT,
          category TEXT,
          description TEXT,
          config_json TEXT,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS service_emails (
          id TEXT PRIMARY KEY,
          email_id TEXT,
          service_id TEXT,
          password TEXT,
          username TEXT,
          notes TEXT,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (email_id) REFERENCES emails(id) ON DELETE CASCADE,
          FOREIGN KEY (service_id) REFERENCES services(id) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS service_emails_secrets (
          id TEXT PRIMARY KEY,
          service_email_id TEXT,
          secret_name TEXT NOT NULL,
          secret_value TEXT,
          secret_type TEXT DEFAULT 'password',
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (service_email_id) REFERENCES service_emails(id) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS agents (
          id TEXT PRIMARY KEY,
          name TEXT,
          config_json TEXT,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS sessions (
          id TEXT PRIMARY KEY,
          email_id TEXT,
          user_agent TEXT,
          proxy_id TEXT,
          started_at DATETIME,
          ended_at DATETIME,
          status TEXT,
          FOREIGN KEY (email_id) REFERENCES emails(id) ON DELETE CASCADE
      );
    `;

    return new Promise((resolve, reject) => {
      this.db?.exec(schema, async (err) => {
        if (err) {
          reject(err);
        } else {
          try {
            await this.applyMigrations();
            resolve();
          } catch (e) {
            reject(e);
          }
        }
      });
    });
  }

  // Raw methods for internal use during initialization to avoid deadlock
  private rawAll<T>(query: string, params: any[] = []): Promise<T[]> {
    return new Promise((resolve, reject) => {
      this.db?.all(query, params, (err, rows) => {
        if (err) reject(err);
        else resolve(rows as T[]);
      });
    });
  }

  private rawRun(query: string, params: any[] = []): Promise<{ lastID: number; changes: number }> {
    return new Promise((resolve, reject) => {
      this.db?.run(query, params, function (err) {
        if (err) reject(err);
        else resolve({ lastID: this.lastID, changes: this.changes });
      });
    });
  }

  private async applyMigrations(): Promise<void> {
    const columns = await this.rawAll<{ name: string }>('PRAGMA table_info(emails)');

    const hasDeletionColumn = columns.some((c) => c.name === 'scheduled_deletion_at');
    if (!hasDeletionColumn) {
      try {
        await this.rawRun('ALTER TABLE emails ADD COLUMN scheduled_deletion_at DATETIME');
        console.log('[DB] Migration: Added scheduled_deletion_at to emails table');
      } catch (e) {
        console.error('[DB] Migration failed (scheduled_deletion_at):', e);
      }
    }

    const hasInboxCache = columns.some((c) => c.name === 'inbox_cache');
    if (!hasInboxCache) {
      try {
        await this.rawRun('ALTER TABLE emails ADD COLUMN inbox_cache TEXT');
        console.log('[DB] Migration: Added inbox_cache to emails table');
      } catch (e) {
        console.error('[DB] Migration failed (inbox_cache):', e);
      }
    }

    // Migration for services table (ensure description and metadata exists)
    const serviceColumns = await this.rawAll<{ name: string }>('PRAGMA table_info(services)');
    const hasDescription = serviceColumns.some((c) => c.name === 'description');
    if (!hasDescription) {
      try {
        await this.rawRun('ALTER TABLE services ADD COLUMN description TEXT');
        console.log('[DB] Migration: Added description to services table');
      } catch (e) {
        console.error('[DB] Migration failed (description):', e);
      }
    }

    const hasMetadata = serviceColumns.some((c) => c.name === 'metadata');
    if (!hasMetadata) {
      try {
        await this.rawRun('ALTER TABLE services ADD COLUMN metadata TEXT');
        console.log('[DB] Migration: Added metadata to services table');
      } catch (e) {
        console.error('[DB] Migration failed (metadata):', e);
      }
    }

    // Migration for service_emails (username, notes)
    const serviceEmailColumns = await this.rawAll<{ name: string }>(
      'PRAGMA table_info(service_emails)',
    );
    const hasUsername = serviceEmailColumns.some((c) => c.name === 'username');
    if (!hasUsername) {
      try {
        await this.rawRun('ALTER TABLE service_emails ADD COLUMN username TEXT');
        await this.rawRun('ALTER TABLE service_emails ADD COLUMN notes TEXT');
        console.log('[DB] Migration: Added username and notes to service_emails table');
      } catch (e) {
        console.error('[DB] Migration failed (username/notes):', e);
      }
    }

    const hasPassword = serviceEmailColumns.some((c) => c.name === 'password');
    if (!hasPassword) {
      try {
        await this.rawRun('ALTER TABLE service_emails ADD COLUMN password TEXT');
        console.log('[DB] Migration: Added password to service_emails table');
      } catch (e) {
        console.error('[DB] Migration failed (password):', e);
      }
    }

    const hasEmailMetadata = serviceEmailColumns.some((c) => c.name === 'metadata');
    if (!hasEmailMetadata) {
      try {
        await this.rawRun('ALTER TABLE service_emails ADD COLUMN metadata TEXT');
        console.log('[DB] Migration: Added metadata to service_emails table');
      } catch (e) {
        console.error('[DB] Migration failed (service_emails metadata):', e);
      }
    }

    const hasStatus = serviceEmailColumns.some((c) => c.name === 'status');
    if (!hasStatus) {
      try {
        await this.rawRun("ALTER TABLE service_emails ADD COLUMN status TEXT DEFAULT 'active'");
        await this.rawRun('ALTER TABLE service_emails ADD COLUMN scheduled_deletion_at DATETIME');
        console.log(
          '[DB] Migration: Added status and scheduled_deletion_at to service_emails table',
        );
      } catch (e) {
        console.error('[DB] Migration failed (status/deletion):', e);
      }
    }

    // Migration to rename service_secrets to service_emails_secrets
    const oldTableExists = await this.rawAll<{ name: string }>(
      "SELECT name FROM sqlite_master WHERE type='table' AND name='service_secrets'",
    );
    const newTableExists = await this.rawAll<{ name: string }>(
      "SELECT name FROM sqlite_master WHERE type='table' AND name='service_emails_secrets'",
    );

    if (oldTableExists.length > 0 && newTableExists.length === 0) {
      try {
        await this.rawRun('ALTER TABLE service_secrets RENAME TO service_emails_secrets');
        console.log('[DB] Migration: Renamed service_secrets to service_emails_secrets');
      } catch (e) {
        console.error('[DB] Migration failed (rename service_secrets):', e);
      }
    } else if (oldTableExists.length > 0 && newTableExists.length > 0) {
      console.log('[DB] Migration skip: both service_secrets and service_emails_secrets exist');
    }

    const secretColumns = await this.rawAll<{ name: string }>(
      'PRAGMA table_info(service_emails_secrets)',
    );
    const hasSecretType = secretColumns.some((c) => c.name === 'secret_type');
    if (!hasSecretType) {
      try {
        await this.rawRun(
          "ALTER TABLE service_emails_secrets ADD COLUMN secret_type TEXT DEFAULT 'password'",
        );
        console.log('[DB] Migration: Added secret_type to service_emails_secrets table');
      } catch (e) {
        console.error('[DB] Migration failed (secret_type):', e);
      }
    }
  }

  async run(query: string, params: any[] = []): Promise<{ lastID: number; changes: number }> {
    await this.ensureInitialized();
    return new Promise((resolve, reject) => {
      this.db?.run(query, params, function (err) {
        if (err) reject(err);
        else resolve({ lastID: this.lastID, changes: this.changes });
      });
    });
  }

  async get<T>(query: string, params: any[] = []): Promise<T | undefined> {
    await this.ensureInitialized();
    return new Promise((resolve, reject) => {
      this.db?.get(query, params, (err, row) => {
        if (err) reject(err);
        else resolve(row as T);
      });
    });
  }

  async all<T>(query: string, params: any[] = []): Promise<T[]> {
    await this.ensureInitialized();
    return new Promise((resolve, reject) => {
      this.db?.all(query, params, (err, rows) => {
        if (err) reject(err);
        else resolve(rows as T[]);
      });
    });
  }

  async close(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (this.db) {
        this.db.close((err) => {
          if (err) reject(err);
          else {
            this.db = null;
            resolve();
          }
        });
      } else {
        resolve();
      }
    });
  }
}

export const dbManager = new DbManager();
