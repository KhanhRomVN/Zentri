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
          metadata TEXT,
          auth_method TEXT,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS service_emails (
          id TEXT PRIMARY KEY,
          email_id TEXT,
          service_id TEXT,
          FOREIGN KEY (email_id) REFERENCES emails(id) ON DELETE CASCADE,
          FOREIGN KEY (service_id) REFERENCES services(id) ON DELETE CASCADE
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

      CREATE TABLE IF NOT EXISTS proxies (
          id TEXT PRIMARY KEY,
          ip_version INTEGER NOT NULL,
          proxy_type TEXT NOT NULL,
          source_type TEXT NOT NULL,
          rotation_type TEXT NOT NULL,
          pricing_type TEXT NOT NULL,
          protocol TEXT,
          host TEXT,
          port INTEGER,
          username TEXT,
          password TEXT,
          country TEXT,
          city TEXT,
          isp TEXT,
          duration_days INTEGER,
          bandwidth_gb REAL,
          price NUMERIC,
          status TEXT DEFAULT 'active',
          metadata TEXT,
          expiration_date INTEGER,
          last_checked_at INTEGER,
          is_healthy INTEGER,
          purchase_url TEXT,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS fingerprints (
          id TEXT PRIMARY KEY,
          name TEXT NOT NULL,
          description TEXT,
          ua TEXT,
          os TEXT,
          os_version TEXT,
          config_json TEXT,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS proxy_history (
          id TEXT PRIMARY KEY,
          proxy_id TEXT NOT NULL,
          email_id TEXT NOT NULL,
          target_site TEXT,
          used_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (proxy_id) REFERENCES proxies(id) ON DELETE CASCADE,
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

    // Migration for services table (ensure metadata, auth_method, and description exist)
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

    const hasAuthMethod = serviceColumns.some((c) => c.name === 'auth_method');
    if (!hasAuthMethod) {
      try {
        await this.rawRun('ALTER TABLE services ADD COLUMN auth_method TEXT');
        console.log('[DB] Migration: Added auth_method to services table');
      } catch (e) {
        console.error('[DB] Migration failed (auth_method):', e);
      }
    }

    // Migration for service_emails: strip down to only id, email_id, service_id
    // SQLite doesn't support DROP COLUMN easily, so we recreate the table
    const serviceEmailColumns = await this.rawAll<{ name: string }>(
      'PRAGMA table_info(service_emails)',
    );
    const hasExtraColumns = serviceEmailColumns.some(
      (c) => ['password', 'username', 'notes', 'metadata', 'status', 'scheduled_deletion_at', 'last_used_at', 'created_at', 'updated_at'].includes(c.name)
    );
    if (hasExtraColumns) {
      try {
        // Backup existing links
        await this.rawRun(`
          CREATE TABLE IF NOT EXISTS service_emails_backup AS
          SELECT id, email_id, service_id FROM service_emails
        `);
        // Drop old table
        await this.rawRun('DROP TABLE service_emails');
        // Recreate with minimal columns
        await this.rawRun(`
          CREATE TABLE service_emails (
            id TEXT PRIMARY KEY,
            email_id TEXT,
            service_id TEXT,
            FOREIGN KEY (email_id) REFERENCES emails(id) ON DELETE CASCADE,
            FOREIGN KEY (service_id) REFERENCES services(id) ON DELETE CASCADE
          )
        `);
        // Restore data
        await this.rawRun(`
          INSERT INTO service_emails (id, email_id, service_id)
          SELECT id, email_id, service_id FROM service_emails_backup
        `);
        // Drop backup
        await this.rawRun('DROP TABLE service_emails_backup');
        console.log('[DB] Migration: Stripped service_emails to minimal columns (id, email_id, service_id)');
      } catch (e) {
        console.error('[DB] Migration failed (service_emails strip):', e);
      }
    }

    // Migration: drop service_emails_secrets and service_secrets tables (no longer needed)
    const secretsTables = ['service_emails_secrets', 'service_secrets'];
    for (const tableName of secretsTables) {
      const exists = await this.rawAll<{ name: string }>(
        `SELECT name FROM sqlite_master WHERE type='table' AND name='${tableName}'`,
      );
      if (exists.length > 0) {
        try {
          await this.rawRun(`DROP TABLE ${tableName}`);
          console.log(`[DB] Migration: Dropped ${tableName} table (no longer needed)`);
        } catch (e) {
          console.error(`[DB] Migration failed (drop ${tableName}):`, e);
        }
      }
    }

    // Migration for proxies new fields (Version 2)
    const proxyColumns = await this.rawAll<{ name: string }>(
      "PRAGMA table_info('proxies')",
    );
    const hasExpiredAt = proxyColumns.some((c) => c.name === 'expired_at');

    if (!hasExpiredAt) {
      try {
        // Add expired_at and last_checked_at as DATETIME
        await this.rawRun('ALTER TABLE proxies ADD COLUMN expired_at DATETIME');
        await this.rawRun('ALTER TABLE proxies ADD COLUMN last_checked_at DATETIME');
        await this.rawRun('ALTER TABLE proxies ADD COLUMN purchase_url TEXT');
        
        // If old expiration_date exists, we could try to migrate it, 
        // but since we are in dev, we can just ensure the column is there.
        const hasOldExp = proxyColumns.some((c) => c.name === 'expiration_date');
        if (hasOldExp) {
          // Attempt migration of data from expiration_date (timestamp) to expired_at (DATETIME)
          await this.rawRun("UPDATE proxies SET expired_at = datetime(expiration_date / 1000, 'unixepoch') WHERE expiration_date IS NOT NULL");
        }

        console.log('[DB] Migration: Updated proxies with new DATETIME fields');
      } catch (e) {
        console.error('[DB] Migration failed (proxies refactor):', e);
      }
    }

    // Remove is_healthy if it exists (SQLite doesn't support DROP COLUMN easily before 3.35.0, 
    // but we can just ignore it or do a more complex migration if really needed.
    // For now, let's just make sure we don't use it in code.)

    // Migration for proxy_history table
    const historyExists = await this.rawAll<{ name: string }>(
      "SELECT name FROM sqlite_master WHERE type='table' AND name='proxy_history'",
    );
    if (historyExists.length === 0) {
      try {
        await this.rawRun(`
          CREATE TABLE IF NOT EXISTS proxy_history (
            id TEXT PRIMARY KEY,
            proxy_id TEXT NOT NULL,
            email_id TEXT NOT NULL,
            target_site TEXT,
            used_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (proxy_id) REFERENCES proxies(id) ON DELETE CASCADE,
            FOREIGN KEY (email_id) REFERENCES emails(id) ON DELETE CASCADE
          )
        `);
        console.log('[DB] Migration: Created proxy_history table');
      } catch (e) {
        console.error('[DB] Migration failed (proxy_history):', e);
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
