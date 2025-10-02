// src/renderer/src/presentation/pages/PeopleManager/services/PeopleService.ts
import { v4 as uuidv4 } from 'uuid'
import { Person, PersonInfo, Identification, Address, Contact, DatabaseInfo } from '../types'

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
        mkdir: (path: string, options?: { recursive?: boolean }) => Promise<void>
      }
      storage: {
        set: (key: string, value: any) => Promise<void>
        get: (key: string) => Promise<any>
        remove: (key: string) => Promise<void>
      }
    }
  }
}

const STORAGE_KEY_LAST_DATABASE = 'people_manager_last_database'

export class PeopleService {
  private currentDatabase: DatabaseInfo | null = null

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

  async createNewDatabase(): Promise<string | null> {
    try {
      // Show folder picker instead of save dialog
      const result = await window.electronAPI.fileSystem.showOpenDialog({
        title: 'Select Folder for People Manager Database',
        properties: ['openDirectory', 'createDirectory']
      })

      if (result.canceled || result.filePaths.length === 0) {
        return null
      }

      // Build the database path: <selected_folder>/PeopleManager/people_manager.db
      const selectedFolder = result.filePaths[0]
      const peopleManagerFolder = `${selectedFolder}/PeopleManager`
      const dbFilePath = `${peopleManagerFolder}/people_manager.db`

      // Create PeopleManager folder if it doesn't exist
      await window.electronAPI.fileSystem.createDirectory(peopleManagerFolder, { recursive: true })
      // Create the database
      await window.electronAPI.sqlite.createDatabase(dbFilePath)
      await this.initializeTables()

      this.currentDatabase = {
        path: dbFilePath,
        name: this.getFileNameFromPath(dbFilePath),
        lastAccess: new Date().toISOString()
      }

      await this.saveLastDatabase(this.currentDatabase)
      return dbFilePath
    } catch (error) {
      console.error('Error creating database:', error)
      throw error
    }
  }

  async openExistingDatabase(): Promise<string | null> {
    try {
      const result = await window.electronAPI.fileSystem.showOpenDialog({
        title: 'Open People Manager Database',
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

      // Validate: file must be named "people_manager.db"
      const fileName = this.getFileNameFromPath(filePath)
      if (fileName !== 'people_manager.db') {
        throw new Error('Invalid database file. Must be named "people_manager.db"')
      }

      // Validate: file must be inside a folder named "PeopleManager"
      const pathParts = filePath.split(/[\\/]/)
      const parentFolderIndex = pathParts.length - 2
      const parentFolder = pathParts[parentFolderIndex]

      if (parentFolder !== 'PeopleManager') {
        throw new Error('Invalid database location. File must be inside a "PeopleManager" folder')
      }

      await window.electronAPI.sqlite.openDatabase(filePath)

      this.currentDatabase = {
        path: filePath,
        name: fileName,
        lastAccess: new Date().toISOString()
      }

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
    } catch (error) {
      console.error('Error closing database:', error)
      throw error
    }
  }

  getCurrentDatabase(): DatabaseInfo | null {
    return this.currentDatabase
  }

  private async saveLastDatabase(database: DatabaseInfo): Promise<void> {
    try {
      if (window.electronAPI.storage) {
        await window.electronAPI.storage.set(STORAGE_KEY_LAST_DATABASE, database)
      } else {
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
        localStorage.removeItem(STORAGE_KEY_LAST_DATABASE)
      }
    } catch (error) {
      console.error('Error clearing last database:', error)
    }
  }

  async forgetDatabase(): Promise<void> {
    await this.closeDatabase()
    await this.clearLastDatabase()
  }

  private async initializeTables(): Promise<void> {
    const queries = [
      // People table
      `CREATE TABLE IF NOT EXISTS people (
        id TEXT PRIMARY KEY
      )`,

      // PersonInfo table
      `CREATE TABLE IF NOT EXISTS person_info (
        id TEXT PRIMARY KEY,
        person_id TEXT NOT NULL,
        full_name TEXT,
        preferred_name TEXT,
        gender TEXT CHECK (gender IN ('male', 'female', 'other')),
        metadata TEXT,
        FOREIGN KEY (person_id) REFERENCES people (id) ON DELETE CASCADE
      )`,

      // Identification table
      `CREATE TABLE IF NOT EXISTS identifications (
        id TEXT PRIMARY KEY,
        person_id TEXT NOT NULL,
        type TEXT NOT NULL CHECK (type IN ('passport', 'national_id', 'driver_license', 'birth_certificate')),
        number TEXT NOT NULL,
        issuing_country TEXT,
        issue_date TEXT,
        expiry_date TEXT,
        scan_url TEXT,
        metadata TEXT,
        FOREIGN KEY (person_id) REFERENCES people (id) ON DELETE CASCADE
      )`,

      // Contact table
      `CREATE TABLE IF NOT EXISTS contacts (
        id TEXT PRIMARY KEY,
        person_id TEXT NOT NULL,
        contact_type TEXT NOT NULL CHECK (contact_type IN ('phone', 'email', 'fax', 'other')),
        contact_value TEXT NOT NULL,
        metadata TEXT,
        FOREIGN KEY (person_id) REFERENCES people (id) ON DELETE CASCADE
      )`,

      // Address table
      `CREATE TABLE IF NOT EXISTS addresses (
        id TEXT PRIMARY KEY,
        person_id TEXT NOT NULL,
        address_type TEXT,
        street_address TEXT,
        city TEXT,
        country TEXT,
        start_date TEXT,
        end_date TEXT,
        metadata TEXT,
        FOREIGN KEY (person_id) REFERENCES people (id) ON DELETE CASCADE
      )`,

      // SocialMedia table
      `CREATE TABLE IF NOT EXISTS social_media (
        id TEXT PRIMARY KEY,
        person_id TEXT NOT NULL,
        platform TEXT NOT NULL,
        profile_url TEXT,
        is_primary INTEGER DEFAULT 0,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        updated_at TEXT,
        metadata TEXT,
        FOREIGN KEY (person_id) REFERENCES people (id) ON DELETE CASCADE
      )`,

      // Education table
      `CREATE TABLE IF NOT EXISTS education (
        id TEXT PRIMARY KEY,
        person_id TEXT NOT NULL,
        institution TEXT NOT NULL,
        start_date TEXT NOT NULL,
        end_date TEXT,
        is_current INTEGER DEFAULT 0,
        metadata TEXT,
        FOREIGN KEY (person_id) REFERENCES people (id) ON DELETE CASCADE
      )`,

      // Employment table
      `CREATE TABLE IF NOT EXISTS employment (
        id TEXT PRIMARY KEY,
        person_id TEXT NOT NULL,
        company_name TEXT NOT NULL,
        employment_type TEXT CHECK (employment_type IN ('full_time', 'part_time', 'contract', 'internship', 'freelance', 'self_employed')),
        location TEXT,
        salary REAL,
        start_date TEXT NOT NULL,
        end_date TEXT,
        metadata TEXT,
        FOREIGN KEY (person_id) REFERENCES people (id) ON DELETE CASCADE
      )`,

      // Relationships table
      `CREATE TABLE IF NOT EXISTS relationships (
        id TEXT PRIMARY KEY,
        person_id TEXT NOT NULL,
        related_person_id TEXT NOT NULL,
        relationship_type TEXT NOT NULL,
        start_date TEXT,
        end_date TEXT,
        is_current INTEGER DEFAULT 1,
        notes TEXT,
        metadata TEXT,
        FOREIGN KEY (person_id) REFERENCES people (id) ON DELETE CASCADE,
        FOREIGN KEY (related_person_id) REFERENCES people (id) ON DELETE CASCADE
      )`,

      // Events table
      `CREATE TABLE IF NOT EXISTS events (
        id TEXT PRIMARY KEY,
        person_id TEXT NOT NULL,
        event_date TEXT NOT NULL,
        event_type TEXT NOT NULL CHECK (event_type IN ('milestone', 'achievement', 'crisis', 'celebration', 'loss', 'change', 'other')),
        title TEXT NOT NULL,
        description TEXT,
        location TEXT,
        participants TEXT,
        impact_level TEXT CHECK (impact_level IN ('low', 'medium', 'high')),
        emotional_state TEXT,
        notes TEXT,
        metadata TEXT,
        FOREIGN KEY (person_id) REFERENCES people (id) ON DELETE CASCADE
      )`,

      // Habits table
      `CREATE TABLE IF NOT EXISTS habits (
        id TEXT PRIMARY KEY,
        person_id TEXT NOT NULL,
        habit_name TEXT NOT NULL,
        habit_type TEXT NOT NULL CHECK (habit_type IN ('health', 'productivity', 'social', 'personal', 'professional', 'other')),
        frequency TEXT NOT NULL CHECK (frequency IN ('daily', 'weekly', 'monthly', 'irregular')),
        frequency_count INTEGER,
        start_date TEXT NOT NULL,
        end_date TEXT,
        is_active INTEGER DEFAULT 1,
        is_positive INTEGER,
        tracking_notes TEXT,
        metadata TEXT,
        FOREIGN KEY (person_id) REFERENCES people (id) ON DELETE CASCADE
      )`,

      // ExternalDocuments table
      `CREATE TABLE IF NOT EXISTS external_documents (
        id TEXT PRIMARY KEY,
        person_id TEXT NOT NULL,
        document_type TEXT NOT NULL CHECK (document_type IN ('medical', 'legal', 'financial', 'educational', 'personal', 'other')),
        title TEXT NOT NULL,
        description TEXT,
        relative_path TEXT NOT NULL,
        file_format TEXT,
        upload_date TEXT DEFAULT CURRENT_TIMESTAMP,
        document_date TEXT,
        is_archived INTEGER DEFAULT 0,
        tags TEXT,
        metadata TEXT,
        FOREIGN KEY (person_id) REFERENCES people (id) ON DELETE CASCADE
      )`,

      // Create indexes
      `CREATE INDEX IF NOT EXISTS idx_person_info_person ON person_info (person_id)`,
      `CREATE INDEX IF NOT EXISTS idx_identifications_person ON identifications (person_id)`,
      `CREATE INDEX IF NOT EXISTS idx_contacts_person ON contacts (person_id)`,
      `CREATE INDEX IF NOT EXISTS idx_addresses_person ON addresses (person_id)`,
      `CREATE INDEX IF NOT EXISTS idx_social_media_person ON social_media (person_id)`,
      `CREATE INDEX IF NOT EXISTS idx_education_person ON education (person_id)`,
      `CREATE INDEX IF NOT EXISTS idx_employment_person ON employment (person_id)`,
      `CREATE INDEX IF NOT EXISTS idx_relationships_person ON relationships (person_id)`,
      `CREATE INDEX IF NOT EXISTS idx_events_person ON events (person_id)`,
      `CREATE INDEX IF NOT EXISTS idx_events_date ON events (event_date)`,
      `CREATE INDEX IF NOT EXISTS idx_habits_person ON habits (person_id)`,
      `CREATE INDEX IF NOT EXISTS idx_documents_person ON external_documents (person_id)`
    ]

    for (const query of queries) {
      await window.electronAPI.sqlite.runQuery(query)
    }
  }

  private getFileNameFromPath(path: string): string {
    return path.split(/[\\/]/).pop() || path
  }

  // Person CRUD operations
  async getAllPeople(): Promise<Person[]> {
    const rows = await window.electronAPI.sqlite.getAllRows('SELECT * FROM people')
    return rows.map((row) => ({ id: row.id }))
  }

  async getPersonById(id: string): Promise<Person | null> {
    const row = await window.electronAPI.sqlite.getOneRow('SELECT * FROM people WHERE id = ?', [id])
    return row ? { id: row.id } : null
  }

  async createPerson(): Promise<Person> {
    const id = uuidv4()
    await window.electronAPI.sqlite.runQuery('INSERT INTO people (id) VALUES (?)', [id])
    return { id }
  }

  async deletePerson(id: string): Promise<void> {
    await window.electronAPI.sqlite.runQuery('DELETE FROM people WHERE id = ?', [id])
  }

  // PersonInfo operations
  async getPersonInfoByPersonId(personId: string): Promise<PersonInfo | null> {
    const row = await window.electronAPI.sqlite.getOneRow(
      'SELECT * FROM person_info WHERE person_id = ?',
      [personId]
    )
    return row ? this.mapRowToPersonInfo(row) : null
  }

  async createPersonInfo(personInfo: Omit<PersonInfo, 'id'>): Promise<PersonInfo> {
    const id = uuidv4()
    await window.electronAPI.sqlite.runQuery(
      `INSERT INTO person_info (id, person_id, full_name, preferred_name, gender, metadata) 
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        id,
        personInfo.person_id,
        personInfo.full_name || null,
        personInfo.preferred_name || null,
        personInfo.gender || null,
        JSON.stringify(personInfo.metadata || {})
      ]
    )
    return { ...personInfo, id }
  }

  async updatePersonInfo(id: string, updates: Partial<PersonInfo>): Promise<void> {
    const fields: string[] = []
    const values: any[] = []

    if (updates.full_name !== undefined) {
      fields.push('full_name = ?')
      values.push(updates.full_name)
    }
    if (updates.preferred_name !== undefined) {
      fields.push('preferred_name = ?')
      values.push(updates.preferred_name)
    }
    if (updates.gender !== undefined) {
      fields.push('gender = ?')
      values.push(updates.gender)
    }
    if (updates.metadata !== undefined) {
      fields.push('metadata = ?')
      values.push(JSON.stringify(updates.metadata))
    }

    if (fields.length > 0) {
      values.push(id)
      await window.electronAPI.sqlite.runQuery(
        `UPDATE person_info SET ${fields.join(', ')} WHERE id = ?`,
        values
      )
    }
  }

  // Identification operations
  async getIdentificationsByPersonId(personId: string): Promise<Identification[]> {
    const rows = await window.electronAPI.sqlite.getAllRows(
      'SELECT * FROM identifications WHERE person_id = ?',
      [personId]
    )
    return rows.map(this.mapRowToIdentification)
  }

  async createIdentification(identification: Omit<Identification, 'id'>): Promise<Identification> {
    const id = uuidv4()
    await window.electronAPI.sqlite.runQuery(
      `INSERT INTO identifications (id, person_id, type, number, issuing_country, issue_date, expiry_date, scan_url, metadata)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        identification.person_id,
        identification.type,
        identification.number,
        identification.issuing_country || null,
        identification.issue_date || null,
        identification.expiry_date || null,
        identification.scan_url || null,
        JSON.stringify(identification.metadata || {})
      ]
    )
    return { ...identification, id }
  }

  async updateIdentification(id: string, updates: Partial<Identification>): Promise<void> {
    const fields: string[] = []
    const values: any[] = []

    Object.entries(updates).forEach(([key, value]) => {
      if (key !== 'id' && key !== 'person_id' && value !== undefined) {
        fields.push(`${key} = ?`)
        values.push(key === 'metadata' ? JSON.stringify(value) : value)
      }
    })

    if (fields.length > 0) {
      values.push(id)
      await window.electronAPI.sqlite.runQuery(
        `UPDATE identifications SET ${fields.join(', ')} WHERE id = ?`,
        values
      )
    }
  }

  async deleteIdentification(id: string): Promise<void> {
    await window.electronAPI.sqlite.runQuery('DELETE FROM identifications WHERE id = ?', [id])
  }

  // Contact operations
  async getContactsByPersonId(personId: string): Promise<Contact[]> {
    const rows = await window.electronAPI.sqlite.getAllRows(
      'SELECT * FROM contacts WHERE person_id = ?',
      [personId]
    )
    return rows.map(this.mapRowToContact)
  }

  async createContact(contact: Omit<Contact, 'id'>): Promise<Contact> {
    const id = uuidv4()
    await window.electronAPI.sqlite.runQuery(
      `INSERT INTO contacts (id, person_id, contact_type, contact_value, metadata)
       VALUES (?, ?, ?, ?, ?)`,
      [
        id,
        contact.person_id,
        contact.contact_type,
        contact.contact_value,
        JSON.stringify(contact.metadata || {})
      ]
    )
    return { ...contact, id }
  }

  async updateContact(id: string, updates: Partial<Contact>): Promise<void> {
    const fields: string[] = []
    const values: any[] = []

    Object.entries(updates).forEach(([key, value]) => {
      if (key !== 'id' && key !== 'person_id' && value !== undefined) {
        fields.push(`${key} = ?`)
        values.push(key === 'metadata' ? JSON.stringify(value) : value)
      }
    })

    if (fields.length > 0) {
      values.push(id)
      await window.electronAPI.sqlite.runQuery(
        `UPDATE contacts SET ${fields.join(', ')} WHERE id = ?`,
        values
      )
    }
  }

  async deleteContact(id: string): Promise<void> {
    await window.electronAPI.sqlite.runQuery('DELETE FROM contacts WHERE id = ?', [id])
  }

  // Address operations
  async getAddressesByPersonId(personId: string): Promise<Address[]> {
    const rows = await window.electronAPI.sqlite.getAllRows(
      'SELECT * FROM addresses WHERE person_id = ?',
      [personId]
    )
    return rows.map(this.mapRowToAddress)
  }

  async createAddress(address: Omit<Address, 'id'>): Promise<Address> {
    const id = uuidv4()
    await window.electronAPI.sqlite.runQuery(
      `INSERT INTO addresses (id, person_id, address_type, street_address, city, country, start_date, end_date, metadata)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        address.person_id,
        address.address_type || null,
        address.street_address || null,
        address.city || null,
        address.country || null,
        address.start_date || null,
        address.end_date || null,
        JSON.stringify(address.metadata || {})
      ]
    )
    return { ...address, id }
  }

  async updateAddress(id: string, updates: Partial<Address>): Promise<void> {
    const fields: string[] = []
    const values: any[] = []

    Object.entries(updates).forEach(([key, value]) => {
      if (key !== 'id' && key !== 'person_id' && value !== undefined) {
        fields.push(`${key} = ?`)
        values.push(key === 'metadata' ? JSON.stringify(value) : value)
      }
    })

    if (fields.length > 0) {
      values.push(id)
      await window.electronAPI.sqlite.runQuery(
        `UPDATE addresses SET ${fields.join(', ')} WHERE id = ?`,
        values
      )
    }
  }

  async deleteAddress(id: string): Promise<void> {
    await window.electronAPI.sqlite.runQuery('DELETE FROM addresses WHERE id = ?', [id])
  }

  // Mapping functions
  private mapRowToPersonInfo(row: any): PersonInfo {
    return {
      id: row.id,
      person_id: row.person_id,
      full_name: row.full_name,
      preferred_name: row.preferred_name,
      gender: row.gender,
      metadata: row.metadata ? JSON.parse(row.metadata) : {}
    }
  }

  private mapRowToIdentification(row: any): Identification {
    return {
      id: row.id,
      person_id: row.person_id,
      type: row.type,
      number: row.number,
      issuing_country: row.issuing_country,
      issue_date: row.issue_date,
      expiry_date: row.expiry_date,
      scan_url: row.scan_url,
      metadata: row.metadata ? JSON.parse(row.metadata) : {}
    }
  }

  private mapRowToContact(row: any): Contact {
    return {
      id: row.id,
      person_id: row.person_id,
      contact_type: row.contact_type,
      contact_value: row.contact_value,
      metadata: row.metadata ? JSON.parse(row.metadata) : {}
    }
  }

  private mapRowToAddress(row: any): Address {
    return {
      id: row.id,
      person_id: row.person_id,
      address_type: row.address_type,
      street_address: row.street_address,
      city: row.city,
      country: row.country,
      start_date: row.start_date,
      end_date: row.end_date,
      metadata: row.metadata ? JSON.parse(row.metadata) : {}
    }
  }
}

export const peopleService = new PeopleService()
