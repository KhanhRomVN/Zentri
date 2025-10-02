// src/renderer/src/presentation/pages/EmailManager/services/DatabaseService.ts
import { v4 as uuidv4 } from 'uuid'
import {
  Email,
  Email2FA,
  ServiceAccount,
  ServiceAccount2FA,
  ServiceAccountSecret,
  DatabaseInfo
} from '../types'

declare global {
  interface Window {
    electronAPI: {
      sqlite: {
        createDatabase: (path: string) => Promise<void>
        openDatabase: (path: string) => Promise<void>
        closeDatabase: () => Promise<void>
        runQuery: (query: string, params?: any[]) => Promise<any>
        getAllRows: (query: string, params?: any[]) => Promise<any[]>
        getOneRow: (query: string, params?: any[]) => Promise<any>
      }
      fileSystem: {
        showSaveDialog: (options: any) => Promise<{ canceled: boolean; filePath?: string }>
        showOpenDialog: (options: any) => Promise<{ canceled: boolean; filePaths: string[] }>
        exists: (path: string) => Promise<boolean>
        createDirectory: (path: string, options?: { recursive?: boolean }) => Promise<void> // Added for folder creation
      }
      // Thêm API cho persistent storage
      storage: {
        set: (key: string, value: any) => Promise<void>
        get: (key: string) => Promise<any>
        remove: (key: string) => Promise<void>
      }
    }
  }
}

const STORAGE_KEY_LAST_DATABASE = 'email_manager_last_database'

export class DatabaseService {
  private currentDatabase: DatabaseInfo | null = null

  // Thêm method để khởi tạo và tự động mở database cuối cùng
  async initialize(): Promise<boolean> {
    try {
      const lastDatabase = await this.getLastDatabase()
      if (lastDatabase) {
        const exists = await window.electronAPI.fileSystem.exists(lastDatabase.path)
        if (exists) {
          await window.electronAPI.sqlite.openDatabase(lastDatabase.path)
          this.currentDatabase = {
            ...lastDatabase,
            lastAccess: new Date().toISOString()
          }
          await this.saveLastDatabase(this.currentDatabase)
          return true
        } else {
          // File không tồn tại, xóa khỏi storage
          await this.clearLastDatabase()
        }
      }
      return false
    } catch (error) {
      console.error('Error initializing database:', error)
      await this.clearLastDatabase()
      return false
    }
  }

  // Helper method to get path separator based on OS
  private getPathSeparator(): string {
    return navigator.platform.toLowerCase().includes('win') ? '\\' : '/'
  }

  // Helper method to create EmailManager folder structure
  private async createEmailManagerFolder(basePath: string): Promise<string> {
    const separator = this.getPathSeparator()
    const folderPath = basePath + separator + 'EmailManager'

    try {
      // Create the EmailManager directory
      await window.electronAPI.fileSystem.createDirectory(folderPath, { recursive: true })
      // Return the full path to the database file
      return folderPath + separator + 'email_manager.db'
    } catch (error) {
      console.error('Error creating EmailManager folder:', error)
      throw new Error(
        `Failed to create EmailManager folder: ${error instanceof Error ? error.message : 'Unknown error'}`
      )
    }
  }

  // Database lifecycle methods
  async createNewDatabase(): Promise<string | null> {
    try {
      const result = await window.electronAPI.fileSystem.showSaveDialog({
        title: 'Create New Email Manager Database',
        defaultPath: 'EmailManager', // Changed to suggest folder name
        filters: [
          { name: 'Email Manager Project', extensions: [''] }, // Allow selecting folders
          { name: 'All Files', extensions: ['*'] }
        ]
      })

      if (result.canceled || !result.filePath) {
        return null
      }

      // Create the EmailManager folder structure and get the database path
      const databasePath = await this.createEmailManagerFolder(result.filePath)

      // Create the database at the specified path
      await window.electronAPI.sqlite.createDatabase(databasePath)
      await this.initializeTables()

      this.currentDatabase = {
        path: databasePath,
        name: this.getProjectNameFromPath(result.filePath),
        lastAccess: new Date().toISOString()
      }

      // Lưu thông tin database vào storage
      await this.saveLastDatabase(this.currentDatabase)

      return databasePath
    } catch (error) {
      console.error('Error creating database:', error)
      throw error
    }
  }

  async openExistingDatabase(): Promise<string | null> {
    try {
      const result = await window.electronAPI.fileSystem.showOpenDialog({
        title: 'Open Email Manager Database',
        filters: [
          { name: 'Database Files', extensions: ['db', 'sqlite'] },
          { name: 'All Files', extensions: ['*'] }
        ],
        properties: ['openFile']
      })

      if (result.canceled || result.filePaths.length === 0) {
        return null
      }

      const filePath = result.filePaths[0]
      await window.electronAPI.sqlite.openDatabase(filePath)

      // Extract project name from the path structure
      const projectName = this.getProjectNameFromDatabasePath(filePath)

      this.currentDatabase = {
        path: filePath,
        name: projectName,
        lastAccess: new Date().toISOString()
      }

      // Lưu thông tin database vào storage
      await this.saveLastDatabase(this.currentDatabase)

      return filePath
    } catch (error) {
      console.error('Error opening database:', error)
      throw error
    }
  }

  async closeDatabase(): Promise<void> {
    try {
      await window.electronAPI.sqlite.closeDatabase()
      this.currentDatabase = null
      // Không xóa thông tin database khỏi storage khi đóng
      // await this.clearLastDatabase()
    } catch (error) {
      console.error('Error closing database:', error)
      throw error
    }
  }

  getCurrentDatabase(): DatabaseInfo | null {
    return this.currentDatabase
  }

  // Persistent storage methods
  private async saveLastDatabase(database: DatabaseInfo): Promise<void> {
    try {
      if (window.electronAPI.storage) {
        await window.electronAPI.storage.set(STORAGE_KEY_LAST_DATABASE, database)
      } else {
        // Fallback to localStorage if electron storage not available
        localStorage.setItem(STORAGE_KEY_LAST_DATABASE, JSON.stringify(database))
      }
    } catch (error) {
      console.error('Error saving last database:', error)
    }
  }

  private async getLastDatabase(): Promise<DatabaseInfo | null> {
    try {
      if (window.electronAPI.storage) {
        return await window.electronAPI.storage.get(STORAGE_KEY_LAST_DATABASE)
      } else {
        // Fallback to localStorage if electron storage not available
        const stored = localStorage.getItem(STORAGE_KEY_LAST_DATABASE)
        return stored ? JSON.parse(stored) : null
      }
    } catch (error) {
      console.error('Error getting last database:', error)
      return null
    }
  }

  private async clearLastDatabase(): Promise<void> {
    try {
      if (window.electronAPI.storage) {
        await window.electronAPI.storage.remove(STORAGE_KEY_LAST_DATABASE)
      } else {
        // Fallback to localStorage if electron storage not available
        localStorage.removeItem(STORAGE_KEY_LAST_DATABASE)
      }
    } catch (error) {
      console.error('Error clearing last database:', error)
    }
  }

  // Method để xóa hoàn toàn database khỏi storage (khi user muốn reset)
  async forgetDatabase(): Promise<void> {
    await this.closeDatabase()
    await this.clearLastDatabase()
  }

  private async initializeTables(): Promise<void> {
    const queries = [
      // Emails table
      `CREATE TABLE IF NOT EXISTS emails (
        id TEXT PRIMARY KEY,
        email_address TEXT NOT NULL UNIQUE,
        email_provider TEXT NOT NULL CHECK (email_provider IN ('gmail', 'yahoo', 'outlook', 'icloud')),
        name TEXT,
        age INTEGER,
        address TEXT,
        password TEXT NOT NULL,
        last_password_change TEXT NOT NULL,
        recovery_email TEXT,
        phone_numbers TEXT,
        tags TEXT, -- JSON array
        note TEXT,
        metadata TEXT, -- JSON object
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        updated_at TEXT DEFAULT CURRENT_TIMESTAMP
      )`,

      // Email 2FA table
      `CREATE TABLE IF NOT EXISTS email_2fa (
        id TEXT PRIMARY KEY,
        email_id TEXT NOT NULL,
        method_type TEXT NOT NULL CHECK (method_type IN ('backup_codes', 'totp_key', 'app_password', 'security_key', 'recovery_email', 'sms')),
        app TEXT,
        value TEXT NOT NULL, -- JSON for arrays or string for single values
        last_update TEXT NOT NULL,
        expire_at TEXT,
        metadata TEXT, -- JSON object
        FOREIGN KEY (email_id) REFERENCES emails (id) ON DELETE CASCADE
      )`,

      // Service accounts table
      `CREATE TABLE IF NOT EXISTS service_accounts (
        id TEXT PRIMARY KEY,
        email_id TEXT NOT NULL,
        service_name TEXT NOT NULL,
        service_type TEXT NOT NULL CHECK (service_type IN (
          'social_media', 'communication', 'developer', 'cloud_storage', 'ai_saas',
          'productivity_tool', 'payment_finance', 'ecommerce', 'entertainment',
          'education', 'hosting_domain', 'security_vpn', 'government', 'health',
          'gaming', 'travel_transport', 'news_media', 'forum_community',
          'iot_smart_device', 'other'
        )),
        service_url TEXT,
        status TEXT CHECK (status IN ('active', 'inactive', 'suspended')) DEFAULT 'active',
        name TEXT,
        username TEXT,
        password TEXT,
        note TEXT,
        metadata TEXT, -- JSON object
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (email_id) REFERENCES emails (id) ON DELETE CASCADE
      )`,

      // Service account 2FA table
      `CREATE TABLE IF NOT EXISTS service_account_2fa (
        id TEXT PRIMARY KEY,
        service_account_id TEXT NOT NULL,
        method_type TEXT NOT NULL CHECK (method_type IN ('backup_codes', 'totp_key', 'app_password', 'security_key', 'recovery_email', 'sms')),
        app TEXT,
        value TEXT NOT NULL, -- JSON for arrays or string for single values
        last_update TEXT NOT NULL,
        expire_at TEXT,
        metadata TEXT, -- JSON object
        FOREIGN KEY (service_account_id) REFERENCES service_accounts (id) ON DELETE CASCADE
      )`,

      // Service account secrets table
      `CREATE TABLE IF NOT EXISTS service_account_secrets (
        id TEXT PRIMARY KEY,
        service_account_id TEXT NOT NULL,
        secret TEXT NOT NULL,
        expire_at TEXT,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (service_account_id) REFERENCES service_accounts (id) ON DELETE CASCADE
      )`,

      // Create indexes for better performance
      `CREATE INDEX IF NOT EXISTS idx_emails_provider ON emails (email_provider)`,
      `CREATE INDEX IF NOT EXISTS idx_email_2fa_email_id ON email_2fa (email_id)`,
      `CREATE INDEX IF NOT EXISTS idx_service_accounts_email_id ON service_accounts (email_id)`,
      `CREATE INDEX IF NOT EXISTS idx_service_accounts_type ON service_accounts (service_type)`,
      `CREATE INDEX IF NOT EXISTS idx_service_account_2fa_service_id ON service_account_2fa (service_account_id)`,
      `CREATE INDEX IF NOT EXISTS idx_service_account_secrets_service_id ON service_account_secrets (service_account_id)`
    ]

    for (const query of queries) {
      await window.electronAPI.sqlite.runQuery(query)
    }
  }

  private getFileNameFromPath(path: string): string {
    return path.split(/[\\/]/).pop() || path
  }

  // New method to extract project name from the selected folder path
  private getProjectNameFromPath(path: string): string {
    const pathParts = path.split(/[\\/]/)
    return pathParts[pathParts.length - 1] || 'Email Manager Project'
  }

  // New method to extract project name from database file path
  private getProjectNameFromDatabasePath(databasePath: string): string {
    const pathParts = databasePath.split(/[\\/]/)
    // Find the parent folder of the database file
    // Expected structure: .../projectName/EmailManager/email_manager.db
    const EmailManagerIndex = pathParts.findIndex((part) => part === 'EmailManager')
    if (EmailManagerIndex > 0) {
      return pathParts[EmailManagerIndex - 1]
    }
    // Fallback to database file name if structure is different
    return this.getFileNameFromPath(databasePath).replace('.db', '')
  }

  // Email CRUD operations
  async getAllEmails(): Promise<Email[]> {
    const rows = await window.electronAPI.sqlite.getAllRows(
      'SELECT * FROM emails ORDER BY created_at DESC'
    )
    return rows.map(this.mapRowToEmail)
  }

  async getEmailById(id: string): Promise<Email | null> {
    const row = await window.electronAPI.sqlite.getOneRow('SELECT * FROM emails WHERE id = ?', [id])
    return row ? this.mapRowToEmail(row) : null
  }

  async createEmail(email: Omit<Email, 'id'>): Promise<Email> {
    const id = uuidv4()
    const now = new Date().toISOString()

    await window.electronAPI.sqlite.runQuery(
      `INSERT INTO emails (
        id, email_address, email_provider, name, age, address, password,
        last_password_change, recovery_email, phone_numbers, tags, note, metadata, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        email.email_address,
        email.email_provider,
        email.name || null,
        email.age || null,
        email.address || null,
        email.pasword,
        email.last_password_change,
        email.recovery_email || null,
        email.phone_numbers || null,
        JSON.stringify(email.tags || []),
        email.note || null,
        JSON.stringify(email.metadata || {}),
        now,
        now
      ]
    )

    return { ...email, id }
  }

  async updateEmail(id: string, updates: Partial<Email>): Promise<void> {
    const fields = []
    const values = []

    if (updates.email_address !== undefined) {
      fields.push('email_address = ?')
      values.push(updates.email_address)
    }
    if (updates.email_provider !== undefined) {
      fields.push('email_provider = ?')
      values.push(updates.email_provider)
    }
    if (updates.name !== undefined) {
      fields.push('name = ?')
      values.push(updates.name)
    }
    if (updates.age !== undefined) {
      fields.push('age = ?')
      values.push(updates.age)
    }
    if (updates.address !== undefined) {
      fields.push('address = ?')
      values.push(updates.address)
    }
    if (updates.pasword !== undefined) {
      fields.push('password = ?')
      values.push(updates.pasword)
    }
    if (updates.last_password_change !== undefined) {
      fields.push('last_password_change = ?')
      values.push(updates.last_password_change)
    }
    if (updates.recovery_email !== undefined) {
      fields.push('recovery_email = ?')
      values.push(updates.recovery_email)
    }
    if (updates.phone_numbers !== undefined) {
      fields.push('phone_numbers = ?')
      values.push(updates.phone_numbers)
    }
    if (updates.tags !== undefined) {
      fields.push('tags = ?')
      values.push(JSON.stringify(updates.tags))
    }
    if (updates.note !== undefined) {
      fields.push('note = ?')
      values.push(updates.note)
    }
    if (updates.metadata !== undefined) {
      fields.push('metadata = ?')
      values.push(JSON.stringify(updates.metadata))
    }

    if (fields.length > 0) {
      fields.push('updated_at = ?')
      values.push(new Date().toISOString())
      values.push(id) // for WHERE clause

      const query = `UPDATE emails SET ${fields.join(', ')} WHERE id = ?`
      await window.electronAPI.sqlite.runQuery(query, values)
    }
  }

  async deleteEmail(id: string): Promise<void> {
    await window.electronAPI.sqlite.runQuery('DELETE FROM emails WHERE id = ?', [id])
  }

  // Email 2FA operations
  async getEmail2FAByEmailId(emailId: string): Promise<Email2FA[]> {
    const rows = await window.electronAPI.sqlite.getAllRows(
      'SELECT * FROM email_2fa WHERE email_id = ?',
      [emailId]
    )
    return rows.map(this.mapRowToEmail2FA)
  }

  // Service Account operations
  async getServiceAccountsByEmailId(emailId: string): Promise<ServiceAccount[]> {
    const rows = await window.electronAPI.sqlite.getAllRows(
      'SELECT * FROM service_accounts WHERE email_id = ? ORDER BY service_name',
      [emailId]
    )
    return rows.map(this.mapRowToServiceAccount)
  }

  // Service Account 2FA operations
  async getServiceAccount2FAByServiceId(serviceAccountId: string): Promise<ServiceAccount2FA[]> {
    const rows = await window.electronAPI.sqlite.getAllRows(
      'SELECT * FROM service_account_2fa WHERE service_account_id = ?',
      [serviceAccountId]
    )
    return rows.map(this.mapRowToServiceAccount2FA)
  }

  // Service Account Secrets operations
  async getServiceAccountSecretsByServiceId(
    serviceAccountId: string
  ): Promise<ServiceAccountSecret[]> {
    const rows = await window.electronAPI.sqlite.getAllRows(
      'SELECT * FROM service_account_secrets WHERE service_account_id = ? ORDER BY created_at DESC',
      [serviceAccountId]
    )
    return rows.map(this.mapRowToServiceAccountSecret)
  }

  private mapRowToEmail(row: any): Email {
    return {
      id: row.id,
      email_address: row.email_address,
      email_provider: row.email_provider,
      name: row.name,
      age: row.age,
      address: row.address,
      pasword: row.password,
      last_password_change: row.last_password_change,
      recovery_email: row.recovery_email,
      phone_numbers: row.phone_numbers,
      tags: row.tags ? JSON.parse(row.tags) : [],
      note: row.note,
      metadata: row.metadata ? JSON.parse(row.metadata) : {}
    }
  }

  private mapRowToEmail2FA(row: any): Email2FA {
    return {
      id: row.id,
      email_id: row.email_id,
      method_type: row.method_type,
      app: row.app,
      value: row.value
        ? row.value.startsWith('[') || row.value.startsWith('{')
          ? JSON.parse(row.value)
          : row.value
        : '',
      last_update: row.last_update,
      expire_at: row.expire_at,
      metadata: row.metadata ? JSON.parse(row.metadata) : {}
    }
  }

  private mapRowToServiceAccount(row: any): ServiceAccount {
    return {
      id: row.id,
      email_id: row.email_id,
      service_name: row.service_name,
      service_type: row.service_type,
      service_url: row.service_url,
      status: row.status,
      name: row.name,
      username: row.username,
      password: row.password,
      note: row.note,
      metadata: row.metadata ? JSON.parse(row.metadata) : {}
    }
  }

  private mapRowToServiceAccount2FA(row: any): ServiceAccount2FA {
    return {
      id: row.id,
      service_account_id: row.service_account_id,
      method_type: row.method_type,
      app: row.app,
      value: row.value
        ? row.value.startsWith('[') || row.value.startsWith('{')
          ? JSON.parse(row.value)
          : row.value
        : '',
      last_update: row.last_update,
      expire_at: row.expire_at,
      metadata: row.metadata ? JSON.parse(row.metadata) : {}
    }
  }

  private mapRowToServiceAccountSecret(row: any): ServiceAccountSecret {
    const parsedSecret = row.secret ? JSON.parse(row.secret) : { secret_name: '' }
    return {
      id: row.id,
      service_account_id: row.service_account_id,
      secret_name: parsedSecret.secret_name || 'Unknown Secret',
      secret: parsedSecret,
      expire_at: row.expire_at
    }
  }

  // Email 2FA CRUD operations
  async createEmail2FA(email2FAData: Omit<Email2FA, 'id'>): Promise<Email2FA> {
    const id = uuidv4()

    await window.electronAPI.sqlite.runQuery(
      `INSERT INTO email_2fa (
      id, email_id, method_type, app, value, last_update, expire_at, metadata
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        email2FAData.email_id,
        email2FAData.method_type,
        email2FAData.app || null,
        typeof email2FAData.value === 'string'
          ? email2FAData.value
          : JSON.stringify(email2FAData.value),
        email2FAData.last_update,
        email2FAData.expire_at || null,
        JSON.stringify(email2FAData.metadata || {})
      ]
    )

    return { ...email2FAData, id }
  }

  async updateEmail2FA(id: string, updates: Partial<Email2FA>): Promise<void> {
    const fields = []
    const values = []

    if (updates.method_type !== undefined) {
      fields.push('method_type = ?')
      values.push(updates.method_type)
    }
    if (updates.app !== undefined) {
      fields.push('app = ?')
      values.push(updates.app)
    }
    if (updates.value !== undefined) {
      fields.push('value = ?')
      values.push(typeof updates.value === 'string' ? updates.value : JSON.stringify(updates.value))
    }
    if (updates.last_update !== undefined) {
      fields.push('last_update = ?')
      values.push(updates.last_update)
    }
    if (updates.expire_at !== undefined) {
      fields.push('expire_at = ?')
      values.push(updates.expire_at)
    }
    if (updates.metadata !== undefined) {
      fields.push('metadata = ?')
      values.push(JSON.stringify(updates.metadata))
    }

    if (fields.length > 0) {
      values.push(id) // for WHERE clause
      const query = `UPDATE email_2fa SET ${fields.join(', ')} WHERE id = ?`
      await window.electronAPI.sqlite.runQuery(query, values)
    }
  }

  async deleteEmail2FA(id: string): Promise<void> {
    await window.electronAPI.sqlite.runQuery('DELETE FROM email_2fa WHERE id = ?', [id])
  }

  async createServiceAccount(serviceData: Omit<ServiceAccount, 'id'>): Promise<ServiceAccount> {
    const id = uuidv4()
    const now = new Date().toISOString()

    await window.electronAPI.sqlite.runQuery(
      `INSERT INTO service_accounts (
        id, email_id, service_name, service_type, service_url, status,
        name, username, password, note, metadata, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        serviceData.email_id,
        serviceData.service_name,
        serviceData.service_type,
        serviceData.service_url || null,
        serviceData.status || 'active',
        serviceData.name || null,
        serviceData.username || null,
        serviceData.password || null,
        serviceData.note || null,
        JSON.stringify(serviceData.metadata || {}),
        now,
        now
      ]
    )

    return { ...serviceData, id }
  }

  async updateServiceAccount(id: string, updates: Partial<ServiceAccount>): Promise<void> {
    const fields = []
    const values = []

    if (updates.service_name !== undefined) {
      fields.push('service_name = ?')
      values.push(updates.service_name)
    }
    if (updates.service_type !== undefined) {
      fields.push('service_type = ?')
      values.push(updates.service_type)
    }
    if (updates.service_url !== undefined) {
      fields.push('service_url = ?')
      values.push(updates.service_url)
    }
    if (updates.status !== undefined) {
      fields.push('status = ?')
      values.push(updates.status)
    }
    if (updates.name !== undefined) {
      fields.push('name = ?')
      values.push(updates.name)
    }
    if (updates.username !== undefined) {
      fields.push('username = ?')
      values.push(updates.username)
    }
    if (updates.password !== undefined) {
      fields.push('password = ?')
      values.push(updates.password)
    }
    if (updates.note !== undefined) {
      fields.push('note = ?')
      values.push(updates.note)
    }
    if (updates.metadata !== undefined) {
      fields.push('metadata = ?')
      values.push(JSON.stringify(updates.metadata))
    }

    if (fields.length > 0) {
      fields.push('updated_at = ?')
      values.push(new Date().toISOString())
      values.push(id) // for WHERE clause

      const query = `UPDATE service_accounts SET ${fields.join(', ')} WHERE id = ?`
      await window.electronAPI.sqlite.runQuery(query, values)
    }
  }

  async deleteServiceAccount(id: string): Promise<void> {
    await window.electronAPI.sqlite.runQuery('DELETE FROM service_accounts WHERE id = ?', [id])
  }

  // ServiceAccount2FA CRUD operations
  async createServiceAccount2FA(
    serviceAccount2FAData: Omit<ServiceAccount2FA, 'id'>
  ): Promise<ServiceAccount2FA> {
    const id = uuidv4()

    await window.electronAPI.sqlite.runQuery(
      `INSERT INTO service_account_2fa (
      id, service_account_id, method_type, app, value, last_update, expire_at, metadata
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        serviceAccount2FAData.service_account_id,
        serviceAccount2FAData.method_type,
        serviceAccount2FAData.app || null,
        typeof serviceAccount2FAData.value === 'string'
          ? serviceAccount2FAData.value
          : JSON.stringify(serviceAccount2FAData.value),
        serviceAccount2FAData.last_update,
        serviceAccount2FAData.expire_at || null,
        JSON.stringify(serviceAccount2FAData.metadata || {})
      ]
    )

    return { ...serviceAccount2FAData, id }
  }

  async updateServiceAccount2FA(id: string, updates: Partial<ServiceAccount2FA>): Promise<void> {
    const fields = []
    const values = []

    if (updates.method_type !== undefined) {
      fields.push('method_type = ?')
      values.push(updates.method_type)
    }
    if (updates.app !== undefined) {
      fields.push('app = ?')
      values.push(updates.app)
    }
    if (updates.value !== undefined) {
      fields.push('value = ?')
      values.push(typeof updates.value === 'string' ? updates.value : JSON.stringify(updates.value))
    }
    if (updates.last_update !== undefined) {
      fields.push('last_update = ?')
      values.push(updates.last_update)
    }
    if (updates.expire_at !== undefined) {
      fields.push('expire_at = ?')
      values.push(updates.expire_at)
    }
    if (updates.metadata !== undefined) {
      fields.push('metadata = ?')
      values.push(JSON.stringify(updates.metadata))
    }

    if (fields.length > 0) {
      values.push(id) // for WHERE clause
      const query = `UPDATE service_account_2fa SET ${fields.join(', ')} WHERE id = ?`
      await window.electronAPI.sqlite.runQuery(query, values)
    }
  }

  async deleteServiceAccount2FA(id: string): Promise<void> {
    await window.electronAPI.sqlite.runQuery('DELETE FROM service_account_2fa WHERE id = ?', [id])
  }

  async createServiceAccountSecret(
    secretData: Omit<ServiceAccountSecret, 'id'>
  ): Promise<ServiceAccountSecret> {
    const id = uuidv4()
    const now = new Date().toISOString()

    try {
      await window.electronAPI.sqlite.runQuery(
        `INSERT INTO service_account_secrets (
id, service_account_id, secret, expire_at, created_at, updated_at
) VALUES (?, ?, ?, ?, ?, ?)`,
        [
          id,
          secretData.service_account_id,
          JSON.stringify(secretData.secret || { secret_name: secretData.secret_name || 'Unknown' }),
          secretData.expire_at || null,
          now,
          now
        ]
      )

      return { ...secretData, id }
    } catch (error) {
      console.error('[ERROR] Failed to create secret:', error)
      throw new Error(
        `Failed to create secret: ${error instanceof Error ? error.message : 'Unknown error'}`
      )
    }
  }

  async updateServiceAccountSecret(
    id: string,
    updates: Partial<ServiceAccountSecret>
  ): Promise<void> {
    const fields = []
    const values = []

    if (updates.expire_at !== undefined) {
      fields.push('expire_at = ?')
      values.push(updates.expire_at)
    }

    if (updates.secret !== undefined) {
      // Ensure secret_name is included in the secret object
      const secretWithName = {
        ...updates.secret,
        secret_name: updates.secret_name || updates.secret.secret_name
      }
      fields.push('secret = ?')
      values.push(JSON.stringify(secretWithName))
    }

    if (fields.length > 0) {
      fields.push('updated_at = ?')
      values.push(new Date().toISOString())
      values.push(id)

      const query = `UPDATE service_account_secrets SET ${fields.join(', ')} WHERE id = ?`
      await window.electronAPI.sqlite.runQuery(query, values)
    }
  }

  async deleteServiceAccountSecret(id: string): Promise<void> {
    await window.electronAPI.sqlite.runQuery('DELETE FROM service_account_secrets WHERE id = ?', [
      id
    ])
  }

  async migrateDatabaseTables(): Promise<void> {
    try {
      await this.migrateEmailsTable()
    } catch (error) {
      console.error('[MIGRATION ERROR]', error)
      throw new Error(
        `Migration failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      )
    }
  }

  private async migrateEmailsTable(): Promise<void> {
    try {
      const tableInfo = await window.electronAPI.sqlite.getAllRows('PRAGMA table_info(emails)')

      const hasCategory = tableInfo.some((col: any) => col.name === 'category')
      if (hasCategory) {
        const existingEmails = await window.electronAPI.sqlite.getAllRows('SELECT * FROM emails')
        await window.electronAPI.sqlite.runQuery('DROP TABLE IF EXISTS emails')
        await window.electronAPI.sqlite.runQuery(`
        CREATE TABLE emails (
          id TEXT PRIMARY KEY,
          email_address TEXT NOT NULL UNIQUE,
          email_provider TEXT NOT NULL CHECK (email_provider IN ('gmail', 'yahoo', 'outlook', 'icloud')),
          name TEXT,
          age INTEGER,
          address TEXT,
          password TEXT NOT NULL,
          last_password_change TEXT NOT NULL,
          recovery_email TEXT,
          phone_numbers TEXT,
          tags TEXT,
          note TEXT,
          metadata TEXT,
          created_at TEXT DEFAULT CURRENT_TIMESTAMP,
          updated_at TEXT DEFAULT CURRENT_TIMESTAMP
        )
      `)

        // Restore dữ liệu (loại bỏ field category)
        for (const email of existingEmails) {
          await window.electronAPI.sqlite.runQuery(
            `INSERT INTO emails (
            id, email_address, email_provider, name, age, address, password,
            last_password_change, recovery_email, phone_numbers, tags, note, metadata,
            created_at, updated_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
              email.id,
              email.email_address,
              email.email_provider,
              email.name,
              email.age,
              email.address,
              email.password,
              email.last_password_change,
              email.recovery_email,
              email.phone_numbers,
              email.tags,
              email.note,
              email.metadata,
              email.created_at || new Date().toISOString(),
              email.updated_at || new Date().toISOString()
            ]
          )
        }

        // Tạo lại index
        await window.electronAPI.sqlite.runQuery(
          'CREATE INDEX IF NOT EXISTS idx_emails_provider ON emails (email_provider)'
        )
      }
    } catch (error) {
      console.error('[MIGRATION] Error migrating emails table:', error)
      throw error
    }
  }
}

export const databaseService = new DatabaseService()
