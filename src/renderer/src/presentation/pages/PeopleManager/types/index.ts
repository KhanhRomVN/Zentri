export interface Person {
  id: string
  // Basic identity information
  full_name: string
  preferred_name?: string
  gender?: 'male' | 'female' | 'other'
  date_of_birth?: string
  place_of_birth?: string
  nationality?: string
  ethnic_origin?: string

  // Contact information
  primary_email?: string
  secondary_emails?: string[]
  primary_phone?: string
  secondary_phones?: string[]
  emergency_contact?: {
    name: string
    relationship: string
    phone: string
    email?: string
  }

  // Physical characteristics
  height?: number // in cm
  weight?: number // in kg
  eye_color?: string
  hair_color?: string
  blood_type?: 'A+' | 'A-' | 'B+' | 'B-' | 'AB+' | 'AB-' | 'O+' | 'O-'
  distinguishing_marks?: string[] // scars, tattoos, etc.

  // Identification documents
  identification_documents?: {
    type: 'passport' | 'national_id' | 'driver_license' | 'birth_certificate'
    number: string
    issuing_country?: string
    issue_date?: string
    expiry_date?: string
    scan_url?: string
  }[]

  // Address information
  current_address?: {
    street: string
    city: string
    state_province?: string
    postal_code?: string
    country: string
    type: 'home' | 'work' | 'other'
  }[]

  // Professional information
  occupation?: string
  employer?: string
  job_title?: string
  work_experience?: {
    company: string
    position: string
    start_date: string
    end_date?: string
    description?: string
  }[]

  // Educational background
  education?: {
    institution: string
    degree?: string
    field_of_study?: string
    start_date: string
    end_date?: string
    grade?: string
  }[]

  // Financial information
  bank_accounts?: {
    bank_name: string
    account_number: string
    account_type: string
    currency: string
  }[]

  tax_identification_number?: string
  credit_cards?: {
    issuer: string
    number: string
    expiry_date: string
    cardholder_name: string
  }[]

  // Medical information
  medical_conditions?: string[]
  allergies?: string[]
  medications?: {
    name: string
    dosage: string
    frequency: string
    prescribing_doctor?: string
  }[]
  primary_care_physician?: string

  // Family relationships
  marital_status?: 'single' | 'married' | 'divorced' | 'widowed'
  spouse?: {
    name: string
    date_of_birth?: string
    marriage_date?: string
  }
  children?: {
    name: string
    date_of_birth: string
    relationship: 'son' | 'daughter'
  }[]
  parents?: {
    name: string
    relationship: 'father' | 'mother'
    date_of_birth?: string
  }[]
  siblings?: {
    name: string
    relationship: 'brother' | 'sister'
    date_of_birth?: string
  }[]

  // Digital presence
  social_media_profiles?: {
    platform: string
    username: string
    url?: string
  }[]

  website?: string
  online_usernames?: string[]

  // Skills and interests
  languages?: {
    language: string
    proficiency: 'basic' | 'intermediate' | 'fluent' | 'native'
  }[]

  skills?: string[]
  hobbies?: string[]
  certifications?: {
    name: string
    issuing_organization: string
    issue_date: string
    expiry_date?: string
  }[]

  // Legal information
  criminal_record?: {
    offense: string
    date: string
    outcome: string
  }[]

  // Military service
  military_service?: {
    country: string
    branch: string
    rank?: string
    start_date: string
    end_date?: string
  }

  // Vehicle information
  vehicles?: {
    make: string
    model: string
    year: number
    license_plate: string
    color: string
  }[]

  // Property ownership
  properties?: {
    address: string
    type: 'house' | 'apartment' | 'land' | 'commercial'
    ownership_type: 'owned' | 'rented'
    purchase_date?: string
  }[]

  // Insurance information
  insurance_policies?: {
    type: 'health' | 'life' | 'auto' | 'home' | 'travel'
    provider: string
    policy_number: string
    expiry_date?: string
  }[]

  // Additional metadata for any other information
  metadata?: Record<string, any>

  // System fields
  created_at: string
  updated_at: string
  last_verified?: string
  tags?: string[]
  notes?: string
  privacy_level: 'public' | 'private' | 'confidential'
}

export interface PersonRelationship {
  id: string
  person_id: string
  related_person_id: string
  relationship_type:
    | 'family'
    | 'friend'
    | 'colleague'
    | 'business_partner'
    | 'acquaintance'
    | 'romantic'
    | 'professional'
  specific_relationship?: string // e.g., "best friend", "direct report"
  start_date?: string
  end_date?: string
  notes?: string
  metadata?: Record<string, any>
}

export interface PersonDocument {
  id: string
  person_id: string
  document_type:
    | 'resume'
    | 'contract'
    | 'certificate'
    | 'photo'
    | 'medical_record'
    | 'financial_document'
    | 'legal_document'
    | 'other'
  title: string
  file_url: string
  file_type: string
  file_size: number
  upload_date: string
  description?: string
  metadata?: Record<string, any>
}

export interface PersonEvent {
  id: string
  person_id: string
  event_type:
    | 'birthday'
    | 'anniversary'
    | 'meeting'
    | 'appointment'
    | 'milestone'
    | 'achievement'
    | 'travel'
    | 'medical'
    | 'education'
    | 'career'
  title: string
  description?: string
  event_date: string
  event_end_date?: string
  location?: string
  participants?: string[] // IDs of other people involved
  metadata?: Record<string, any>
}

export interface PeopleManagerState {
  currentDatabase: {
    path: string
    name: string
    lastAccess: string
  } | null
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
