// src/renderer/src/presentation/pages/PeopleManager/services/PeopleService.ts
import { v4 as uuidv4 } from 'uuid'
import { Person, PersonRelationship, PersonDocument, PersonEvent, DatabaseInfo } from '../types'

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
      const result = await window.electronAPI.fileSystem.showSaveDialog({
        title: 'Create New People Manager Database',
        defaultPath: 'people_manager.db',
        filters: [
          { name: 'Database Files', extensions: ['db', 'sqlite'] },
          { name: 'All Files', extensions: ['*'] }
        ]
      })

      if (result.canceled || !result.filePath) {
        return null
      }

      await window.electronAPI.sqlite.createDatabase(result.filePath)
      await this.initializeTables()

      this.currentDatabase = {
        path: result.filePath,
        name: this.getFileNameFromPath(result.filePath),
        lastAccess: new Date().toISOString()
      }

      await this.saveLastDatabase(this.currentDatabase)
      return result.filePath
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
      await window.electronAPI.sqlite.openDatabase(filePath)

      this.currentDatabase = {
        path: filePath,
        name: this.getFileNameFromPath(filePath),
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
        id TEXT PRIMARY KEY,
        full_name TEXT NOT NULL,
        preferred_name TEXT,
        gender TEXT CHECK (gender IN ('male', 'female', 'other')),
        date_of_birth TEXT,
        place_of_birth TEXT,
        nationality TEXT,
        ethnic_origin TEXT,
        primary_email TEXT,
        secondary_emails TEXT,
        primary_phone TEXT,
        secondary_phones TEXT,
        emergency_contact TEXT,
        height INTEGER,
        weight INTEGER,
        eye_color TEXT,
        hair_color TEXT,
        blood_type TEXT CHECK (blood_type IN ('A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-')),
        distinguishing_marks TEXT,
        identification_documents TEXT,
        current_address TEXT,
        occupation TEXT,
        employer TEXT,
        job_title TEXT,
        work_experience TEXT,
        education TEXT,
        bank_accounts TEXT,
        tax_identification_number TEXT,
        credit_cards TEXT,
        medical_conditions TEXT,
        allergies TEXT,
        medications TEXT,
        primary_care_physician TEXT,
        marital_status TEXT CHECK (marital_status IN ('single', 'married', 'divorced', 'widowed')),
        spouse TEXT,
        children TEXT,
        parents TEXT,
        siblings TEXT,
        social_media_profiles TEXT,
        website TEXT,
        online_usernames TEXT,
        languages TEXT,
        skills TEXT,
        hobbies TEXT,
        certifications TEXT,
        criminal_record TEXT,
        military_service TEXT,
        vehicles TEXT,
        properties TEXT,
        insurance_policies TEXT,
        metadata TEXT,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
        last_verified TEXT,
        tags TEXT,
        notes TEXT,
        privacy_level TEXT CHECK (privacy_level IN ('public', 'private', 'confidential')) DEFAULT 'private'
      )`,

      // Relationships table
      `CREATE TABLE IF NOT EXISTS relationships (
        id TEXT PRIMARY KEY,
        person_id TEXT NOT NULL,
        related_person_id TEXT NOT NULL,
        relationship_type TEXT NOT NULL CHECK (relationship_type IN ('family', 'friend', 'colleague', 'business_partner', 'acquaintance', 'romantic', 'professional')),
        specific_relationship TEXT,
        start_date TEXT,
        end_date TEXT,
        notes TEXT,
        metadata TEXT,
        FOREIGN KEY (person_id) REFERENCES people (id) ON DELETE CASCADE,
        FOREIGN KEY (related_person_id) REFERENCES people (id) ON DELETE CASCADE
      )`,

      // Documents table
      `CREATE TABLE IF NOT EXISTS documents (
        id TEXT PRIMARY KEY,
        person_id TEXT NOT NULL,
        document_type TEXT NOT NULL CHECK (document_type IN ('resume', 'contract', 'certificate', 'photo', 'medical_record', 'financial_document', 'legal_document', 'other')),
        title TEXT NOT NULL,
        file_url TEXT NOT NULL,
        file_type TEXT,
        file_size INTEGER,
        upload_date TEXT DEFAULT CURRENT_TIMESTAMP,
        description TEXT,
        metadata TEXT,
        FOREIGN KEY (person_id) REFERENCES people (id) ON DELETE CASCADE
      )`,

      // Events table
      `CREATE TABLE IF NOT EXISTS events (
        id TEXT PRIMARY KEY,
        person_id TEXT NOT NULL,
        event_type TEXT NOT NULL CHECK (event_type IN ('birthday', 'anniversary', 'meeting', 'appointment', 'milestone', 'achievement', 'travel', 'medical', 'education', 'career')),
        title TEXT NOT NULL,
        description TEXT,
        event_date TEXT NOT NULL,
        event_end_date TEXT,
        location TEXT,
        participants TEXT,
        metadata TEXT,
        FOREIGN KEY (person_id) REFERENCES people (id) ON DELETE CASCADE
      )`,

      // Create indexes
      `CREATE INDEX IF NOT EXISTS idx_people_name ON people (full_name)`,
      `CREATE INDEX IF NOT EXISTS idx_people_email ON people (primary_email)`,
      `CREATE INDEX IF NOT EXISTS idx_relationships_person ON relationships (person_id)`,
      `CREATE INDEX IF NOT EXISTS idx_documents_person ON documents (person_id)`,
      `CREATE INDEX IF NOT EXISTS idx_events_person ON events (person_id)`,
      `CREATE INDEX IF NOT EXISTS idx_events_date ON events (event_date)`
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
    const rows = await window.electronAPI.sqlite.getAllRows(
      'SELECT * FROM people ORDER BY full_name'
    )
    return rows.map(this.mapRowToPerson)
  }

  async getPersonById(id: string): Promise<Person | null> {
    const row = await window.electronAPI.sqlite.getOneRow('SELECT * FROM people WHERE id = ?', [id])
    return row ? this.mapRowToPerson(row) : null
  }

  async createPerson(person: Omit<Person, 'id'>): Promise<Person> {
    const id = uuidv4()
    const now = new Date().toISOString()

    await window.electronAPI.sqlite.runQuery(
      `INSERT INTO people (
        id, full_name, preferred_name, gender, date_of_birth, place_of_birth,
        nationality, ethnic_origin, primary_email, secondary_emails, primary_phone,
        secondary_phones, emergency_contact, height, weight, eye_color, hair_color,
        blood_type, distinguishing_marks, identification_documents, current_address,
        occupation, employer, job_title, work_experience, education, bank_accounts,
        tax_identification_number, credit_cards, medical_conditions, allergies,
        medications, primary_care_physician, marital_status, spouse, children,
        parents, siblings, social_media_profiles, website, online_usernames,
        languages, skills, hobbies, certifications, criminal_record, military_service,
        vehicles, properties, insurance_policies, metadata, created_at, updated_at,
        last_verified, tags, notes, privacy_level
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        person.full_name,
        person.preferred_name || null,
        person.gender || null,
        person.date_of_birth || null,
        person.place_of_birth || null,
        person.nationality || null,
        person.ethnic_origin || null,
        person.primary_email || null,
        JSON.stringify(person.secondary_emails || []),
        person.primary_phone || null,
        JSON.stringify(person.secondary_phones || []),
        JSON.stringify(person.emergency_contact || {}),
        person.height || null,
        person.weight || null,
        person.eye_color || null,
        person.hair_color || null,
        person.blood_type || null,
        JSON.stringify(person.distinguishing_marks || []),
        JSON.stringify(person.identification_documents || []),
        JSON.stringify(person.current_address || []),
        person.occupation || null,
        person.employer || null,
        person.job_title || null,
        JSON.stringify(person.work_experience || []),
        JSON.stringify(person.education || []),
        JSON.stringify(person.bank_accounts || []),
        person.tax_identification_number || null,
        JSON.stringify(person.credit_cards || []),
        JSON.stringify(person.medical_conditions || []),
        JSON.stringify(person.allergies || []),
        JSON.stringify(person.medications || []),
        person.primary_care_physician || null,
        person.marital_status || null,
        JSON.stringify(person.spouse || {}),
        JSON.stringify(person.children || []),
        JSON.stringify(person.parents || []),
        JSON.stringify(person.siblings || []),
        JSON.stringify(person.social_media_profiles || []),
        person.website || null,
        JSON.stringify(person.online_usernames || []),
        JSON.stringify(person.languages || []),
        JSON.stringify(person.skills || []),
        JSON.stringify(person.hobbies || []),
        JSON.stringify(person.certifications || []),
        JSON.stringify(person.criminal_record || []),
        JSON.stringify(person.military_service || {}),
        JSON.stringify(person.vehicles || []),
        JSON.stringify(person.properties || []),
        JSON.stringify(person.insurance_policies || []),
        JSON.stringify(person.metadata || {}),
        now,
        now,
        person.last_verified || null,
        JSON.stringify(person.tags || []),
        person.notes || null,
        person.privacy_level || 'private'
      ]
    )

    return { ...person, id }
  }

  async updatePerson(id: string, updates: Partial<Person>): Promise<void> {
    const fields = []
    const values = []

    // Add all possible fields
    const fieldMappings = {
      full_name: 'full_name',
      preferred_name: 'preferred_name',
      gender: 'gender',
      date_of_birth: 'date_of_birth',
      place_of_birth: 'place_of_birth',
      nationality: 'nationality',
      ethnic_origin: 'ethnic_origin',
      primary_email: 'primary_email',
      secondary_emails: 'secondary_emails',
      primary_phone: 'primary_phone',
      secondary_phones: 'secondary_phones',
      emergency_contact: 'emergency_contact',
      height: 'height',
      weight: 'weight',
      eye_color: 'eye_color',
      hair_color: 'hair_color',
      blood_type: 'blood_type',
      distinguishing_marks: 'distinguishing_marks',
      identification_documents: 'identification_documents',
      current_address: 'current_address',
      occupation: 'occupation',
      employer: 'employer',
      job_title: 'job_title',
      work_experience: 'work_experience',
      education: 'education',
      bank_accounts: 'bank_accounts',
      tax_identification_number: 'tax_identification_number',
      credit_cards: 'credit_cards',
      medical_conditions: 'medical_conditions',
      allergies: 'allergies',
      medications: 'medications',
      primary_care_physician: 'primary_care_physician',
      marital_status: 'marital_status',
      spouse: 'spouse',
      children: 'children',
      parents: 'parents',
      siblings: 'siblings',
      social_media_profiles: 'social_media_profiles',
      website: 'website',
      online_usernames: 'online_usernames',
      languages: 'languages',
      skills: 'skills',
      hobbies: 'hobbies',
      certifications: 'certifications',
      criminal_record: 'criminal_record',
      military_service: 'military_service',
      vehicles: 'vehicles',
      properties: 'properties',
      insurance_policies: 'insurance_policies',
      metadata: 'metadata',
      last_verified: 'last_verified',
      tags: 'tags',
      notes: 'notes',
      privacy_level: 'privacy_level'
    }

    Object.entries(fieldMappings).forEach(([key, dbField]) => {
      if (updates[key as keyof Person] !== undefined) {
        fields.push(`${dbField} = ?`)
        const value = updates[key as keyof Person]
        // Stringify array and object fields
        if (
          Array.isArray(value) ||
          (value && typeof value === 'object' && !(value instanceof Date))
        ) {
          values.push(JSON.stringify(value))
        } else {
          values.push(value)
        }
      }
    })

    if (fields.length > 0) {
      fields.push('updated_at = ?')
      values.push(new Date().toISOString())
      values.push(id)

      const query = `UPDATE people SET ${fields.join(', ')} WHERE id = ?`
      await window.electronAPI.sqlite.runQuery(query, values)
    }
  }

  async deletePerson(id: string): Promise<void> {
    await window.electronAPI.sqlite.runQuery('DELETE FROM people WHERE id = ?', [id])
  }

  // Relationship operations
  async getRelationshipsByPersonId(personId: string): Promise<PersonRelationship[]> {
    const rows = await window.electronAPI.sqlite.getAllRows(
      'SELECT * FROM relationships WHERE person_id = ? OR related_person_id = ?',
      [personId, personId]
    )
    return rows.map(this.mapRowToRelationship)
  }

  // Document operations
  async getDocumentsByPersonId(personId: string): Promise<PersonDocument[]> {
    const rows = await window.electronAPI.sqlite.getAllRows(
      'SELECT * FROM documents WHERE person_id = ? ORDER BY upload_date DESC',
      [personId]
    )
    return rows.map(this.mapRowToDocument)
  }

  // Event operations
  async getEventsByPersonId(personId: string): Promise<PersonEvent[]> {
    const rows = await window.electronAPI.sqlite.getAllRows(
      'SELECT * FROM events WHERE person_id = ? ORDER BY event_date DESC',
      [personId]
    )
    return rows.map(this.mapRowToEvent)
  }

  // Mapping functions
  private mapRowToPerson(row: any): Person {
    return {
      id: row.id,
      full_name: row.full_name,
      preferred_name: row.preferred_name,
      gender: row.gender,
      date_of_birth: row.date_of_birth,
      place_of_birth: row.place_of_birth,
      nationality: row.nationality,
      ethnic_origin: row.ethnic_origin,
      primary_email: row.primary_email,
      secondary_emails: row.secondary_emails ? JSON.parse(row.secondary_emails) : [],
      primary_phone: row.primary_phone,
      secondary_phones: row.secondary_phones ? JSON.parse(row.secondary_phones) : [],
      emergency_contact: row.emergency_contact ? JSON.parse(row.emergency_contact) : undefined,
      height: row.height,
      weight: row.weight,
      eye_color: row.eye_color,
      hair_color: row.hair_color,
      blood_type: row.blood_type,
      distinguishing_marks: row.distinguishing_marks ? JSON.parse(row.distinguishing_marks) : [],
      identification_documents: row.identification_documents
        ? JSON.parse(row.identification_documents)
        : [],
      current_address: row.current_address ? JSON.parse(row.current_address) : [],
      occupation: row.occupation,
      employer: row.employer,
      job_title: row.job_title,
      work_experience: row.work_experience ? JSON.parse(row.work_experience) : [],
      education: row.education ? JSON.parse(row.education) : [],
      bank_accounts: row.bank_accounts ? JSON.parse(row.bank_accounts) : [],
      tax_identification_number: row.tax_identification_number,
      credit_cards: row.credit_cards ? JSON.parse(row.credit_cards) : [],
      medical_conditions: row.medical_conditions ? JSON.parse(row.medical_conditions) : [],
      allergies: row.allergies ? JSON.parse(row.allergies) : [],
      medications: row.medications ? JSON.parse(row.medications) : [],
      primary_care_physician: row.primary_care_physician,
      marital_status: row.marital_status,
      spouse: row.spouse ? JSON.parse(row.spouse) : undefined,
      children: row.children ? JSON.parse(row.children) : [],
      parents: row.parents ? JSON.parse(row.parents) : [],
      siblings: row.siblings ? JSON.parse(row.siblings) : [],
      social_media_profiles: row.social_media_profiles ? JSON.parse(row.social_media_profiles) : [],
      website: row.website,
      online_usernames: row.online_usernames ? JSON.parse(row.online_usernames) : [],
      languages: row.languages ? JSON.parse(row.languages) : [],
      skills: row.skills ? JSON.parse(row.skills) : [],
      hobbies: row.hobbies ? JSON.parse(row.hobbies) : [],
      certifications: row.certifications ? JSON.parse(row.certifications) : [],
      criminal_record: row.criminal_record ? JSON.parse(row.criminal_record) : [],
      military_service: row.military_service ? JSON.parse(row.military_service) : undefined,
      vehicles: row.vehicles ? JSON.parse(row.vehicles) : [],
      properties: row.properties ? JSON.parse(row.properties) : [],
      insurance_policies: row.insurance_policies ? JSON.parse(row.insurance_policies) : [],
      metadata: row.metadata ? JSON.parse(row.metadata) : {},
      created_at: row.created_at,
      updated_at: row.updated_at,
      last_verified: row.last_verified,
      tags: row.tags ? JSON.parse(row.tags) : [],
      notes: row.notes,
      privacy_level: row.privacy_level
    }
  }

  private mapRowToRelationship(row: any): PersonRelationship {
    return {
      id: row.id,
      person_id: row.person_id,
      related_person_id: row.related_person_id,
      relationship_type: row.relationship_type,
      specific_relationship: row.specific_relationship,
      start_date: row.start_date,
      end_date: row.end_date,
      notes: row.notes,
      metadata: row.metadata ? JSON.parse(row.metadata) : {}
    }
  }

  private mapRowToDocument(row: any): PersonDocument {
    return {
      id: row.id,
      person_id: row.person_id,
      document_type: row.document_type,
      title: row.title,
      file_url: row.file_url,
      file_type: row.file_type,
      file_size: row.file_size,
      upload_date: row.upload_date,
      description: row.description,
      metadata: row.metadata ? JSON.parse(row.metadata) : {}
    }
  }

  private mapRowToEvent(row: any): PersonEvent {
    return {
      id: row.id,
      person_id: row.person_id,
      event_type: row.event_type,
      title: row.title,
      description: row.description,
      event_date: row.event_date,
      event_end_date: row.event_end_date,
      location: row.location,
      participants: row.participants ? JSON.parse(row.participants) : [],
      metadata: row.metadata ? JSON.parse(row.metadata) : {}
    }
  }
}

export const peopleService = new PeopleService()
