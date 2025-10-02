export interface Person {
  id: string
}

export interface PersonInfo {
  id: string
  person_id: string
  full_name?: string
  preferred_name?: string
  gender?: string
  metadata?: Record<string, any>
}

export interface Identification {
  id: string
  person_id: string
  type: 'passport' | 'national_id' | 'driver_license' | 'birth_certificate'
  number: string
  issuing_country?: string
  issue_date?: string
  expiry_date?: string
  scan_url?: string
  metadata?: Record<string, any>
}

export interface Contact {
  id: string
  person_id: string
  contact_type: 'sms' | 'email' | 'communication' | 'social_media' | 'other'
  email_address?: string
  phone_number?: string
  service_account_id?: string
  tags?: string
  is_primary?: boolean
  metadata?: Record<string, any>
}

export interface ServiceAccount {
  id: string
  person_id: string
  service_name: string
  service_url?: string
  service_type: 'social_media' | 'communication' | 'other'
  metadata?: Record<string, any>
}

export interface Education {
  id: string
  person_id: string
  institution: string
  start_date: string
  end_date?: string
  is_current?: boolean
  metadata?: Record<string, any>
}

export interface Address {
  id: string
  person_id: string
  address_type?: string
  street_address?: string
  city?: string
  country?: string
  start_date?: string
  end_date?: string
  metadata?: Record<string, any>
}

export interface Employment {
  id: string
  person_id: string
  company_name: string
  employment_type?:
    | 'full_time'
    | 'part_time'
    | 'contract'
    | 'internship'
    | 'freelance'
    | 'self_employed'
  location?: string
  salary?: number
  start_date: string
  end_date?: string
  metadata?: Record<string, any>
}

export interface Relationship {
  id: string
  person_id: string
  related_person_id: string
  relationship_type: string
  start_date?: string
  end_date?: string
  is_current?: boolean
  notes?: string
  metadata?: Record<string, any>
}

export interface Event {
  id: string
  person_id: string
  event_date: string
  event_type: 'milestone' | 'achievement' | 'crisis' | 'celebration' | 'loss' | 'change' | 'other'
  title: string
  description?: string
  location?: string
  participants?: string[]
  impact_level?: 'low' | 'medium' | 'high'
  emotional_state?: string
  notes?: string
  metadata?: Record<string, any>
}

export interface Habit {
  id: string
  person_id: string
  habit_name: string
  habit_type: 'health' | 'productivity' | 'social' | 'personal' | 'professional' | 'other'
  frequency: 'daily' | 'weekly' | 'monthly' | 'irregular'
  frequency_count?: number
  start_date: string
  end_date?: string
  is_active?: boolean
  is_positive?: boolean
  tracking_notes?: string
  metadata?: Record<string, any>
}

export interface ExternalDocument {
  id: string
  person_id: string
  document_type: 'medical' | 'legal' | 'financial' | 'educational' | 'personal' | 'other'
  title: string
  description?: string
  relative_path: string
  file_format?: string
  upload_date: string
  document_date?: string
  is_archived?: boolean
  tags?: string[]
  metadata?: Record<string, any>
}

// PersonalSection.tsx (PersonInfo, Identification, Address, Contact)
// CarrerSection.tsx (Skills, Education, Employment)
// SocialSection.tsx (ServiceAccount, Relationship)
// LifeSection.tsx (Event, Habit, Hobbie)
// DocumentsSection.tsx (ExternalDocument)

export interface DatabaseInfo {
  path: string
  name: string
  lastAccess: string
}

export interface PeopleManagerState {
  currentDatabase: DatabaseInfo | null
  isLoading: boolean
  error: string | null
  selectedPerson: Person | null
  searchQuery: string
  filters: {
    gender?: string[]
    nationality?: string[]
    tags?: string[]
  }
}

export interface FilterOptions {
  genders: string[]
  nationalities: string[]
  tags: string[]
}

export interface PeopleStatistics {
  totalPeople: number
  withEmail: number
  withPhone: number
  withAddress: number
  genderStats: Record<string, number>
}
