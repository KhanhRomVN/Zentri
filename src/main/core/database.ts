import * as sqlite3 from 'sqlite3';
import * as path from 'path';
import * as fs from 'fs';
import { app } from 'electron';

export class DbManager {
  private db: sqlite3.Database | null = null;
  public dbPath: string = '';

  constructor() {}

  async init(inputPath?: string): Promise<void> {
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

      CREATE TABLE IF NOT EXISTS service_secrets (
          id TEXT PRIMARY KEY,
          service_email_id TEXT,
          secret_name TEXT NOT NULL,
          secret_value TEXT,
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

  private async applyMigrations(): Promise<void> {
    const columns = await this.all<{ name: string }>('PRAGMA table_info(emails)');
    const hasDeletionColumn = columns.some((c) => c.name === 'scheduled_deletion_at');
    if (!hasDeletionColumn) {
      try {
        await this.run('ALTER TABLE emails ADD COLUMN scheduled_deletion_at DATETIME');
        console.log('[DB] Migration: Added scheduled_deletion_at to emails table');
      } catch (e) {
        console.error('[DB] Migration failed:', e);
      }
    }

    // Migration for services table (ensure description exists)
    const serviceColumns = await this.all<{ name: string }>('PRAGMA table_info(services)');
    const hasDescription = serviceColumns.some((c) => c.name === 'description');
    if (!hasDescription) {
      try {
        await this.run('ALTER TABLE services ADD COLUMN description TEXT');
        console.log('[DB] Migration: Added description to services table');
      } catch (e) {
        console.error('[DB] Migration failed (description):', e);
      }
    }

    // Migration for service_emails (username, notes)
    const serviceEmailColumns = await this.all<{ name: string }>(
      'PRAGMA table_info(service_emails)',
    );
    const hasUsername = serviceEmailColumns.some((c) => c.name === 'username');
    if (!hasUsername) {
      try {
        await this.run('ALTER TABLE service_emails ADD COLUMN username TEXT');
        await this.run('ALTER TABLE service_emails ADD COLUMN notes TEXT');
        console.log('[DB] Migration: Added username and notes to service_emails table');
      } catch (e) {
        console.error('[DB] Migration failed (username/notes):', e);
      }
    }

    const hasPassword = serviceEmailColumns.some((c) => c.name === 'password');
    if (!hasPassword) {
      try {
        await this.run('ALTER TABLE service_emails ADD COLUMN password TEXT');
        console.log('[DB] Migration: Added password to service_emails table');
      } catch (e) {
        console.error('[DB] Migration failed (password):', e);
      }
    }
  }

  async run(query: string, params: any[] = []): Promise<{ lastID: number; changes: number }> {
    return new Promise((resolve, reject) => {
      this.db?.run(query, params, function (err) {
        if (err) reject(err);
        else resolve({ lastID: this.lastID, changes: this.changes });
      });
    });
  }

  async get<T>(query: string, params: any[] = []): Promise<T | undefined> {
    return new Promise((resolve, reject) => {
      this.db?.get(query, params, (err, row) => {
        if (err) reject(err);
        else resolve(row as T);
      });
    });
  }

  async all<T>(query: string, params: any[] = []): Promise<T[]> {
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
