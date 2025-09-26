// src/renderer/src/presentation/pages/PeopleManager/constants/index.ts

export const GENDER_OPTIONS = {
  MALE: 'male',
  FEMALE: 'female',
  OTHER: 'other'
} as const

export const MARITAL_STATUS = {
  SINGLE: 'single',
  MARRIED: 'married',
  DIVORCED: 'divorced',
  WIDOWED: 'widowed'
} as const

export const BLOOD_TYPES = {
  A_POSITIVE: 'A+',
  A_NEGATIVE: 'A-',
  B_POSITIVE: 'B+',
  B_NEGATIVE: 'B-',
  AB_POSITIVE: 'AB+',
  AB_NEGATIVE: 'AB-',
  O_POSITIVE: 'O+',
  O_NEGATIVE: 'O-'
} as const

export const DOCUMENT_TYPES = {
  PASSPORT: 'passport',
  NATIONAL_ID: 'national_id',
  DRIVER_LICENSE: 'driver_license',
  BIRTH_CERTIFICATE: 'birth_certificate',
  RESUME: 'resume',
  CONTRACT: 'contract',
  CERTIFICATE: 'certificate',
  MEDICAL_RECORD: 'medical_record',
  FINANCIAL_DOCUMENT: 'financial_document',
  LEGAL_DOCUMENT: 'legal_document',
  OTHER: 'other'
} as const

export const RELATIONSHIP_TYPES = {
  FAMILY: 'family',
  FRIEND: 'friend',
  COLLEAGUE: 'colleague',
  BUSINESS_PARTNER: 'business_partner',
  ACQUAINTANCE: 'acquaintance',
  ROMANTIC: 'romantic',
  PROFESSIONAL: 'professional'
} as const

export const EVENT_TYPES = {
  BIRTHDAY: 'birthday',
  ANNIVERSARY: 'anniversary',
  MEETING: 'meeting',
  APPOINTMENT: 'appointment',
  MILESTONE: 'milestone',
  ACHIEVEMENT: 'achievement',
  TRAVEL: 'travel',
  MEDICAL: 'medical',
  EDUCATION: 'education',
  CAREER: 'career'
} as const

export const PRIVACY_LEVELS = {
  PUBLIC: 'public',
  PRIVATE: 'private',
  CONFIDENTIAL: 'confidential'
} as const

export const LANGUAGE_PROFICIENCY = {
  BASIC: 'basic',
  INTERMEDIATE: 'intermediate',
  FLUENT: 'fluent',
  NATIVE: 'native'
} as const

export const ADDRESS_TYPES = {
  HOME: 'home',
  WORK: 'work',
  OTHER: 'other'
} as const

export const INSURANCE_TYPES = {
  HEALTH: 'health',
  LIFE: 'life',
  AUTO: 'auto',
  HOME: 'home',
  TRAVEL: 'travel'
} as const

export const PROPERTY_TYPES = {
  HOUSE: 'house',
  APARTMENT: 'apartment',
  LAND: 'land',
  COMMERCIAL: 'commercial'
} as const

export const OWNERSHIP_TYPES = {
  OWNED: 'owned',
  RENTED: 'rented'
} as const

// Label mappings
export const GENDER_LABELS = {
  [GENDER_OPTIONS.MALE]: 'Male',
  [GENDER_OPTIONS.FEMALE]: 'Female',
  [GENDER_OPTIONS.OTHER]: 'Other'
} as const

export const MARITAL_STATUS_LABELS = {
  [MARITAL_STATUS.SINGLE]: 'Single',
  [MARITAL_STATUS.MARRIED]: 'Married',
  [MARITAL_STATUS.DIVORCED]: 'Divorced',
  [MARITAL_STATUS.WIDOWED]: 'Widowed'
} as const

export const DOCUMENT_TYPE_LABELS = {
  [DOCUMENT_TYPES.PASSPORT]: 'Passport',
  [DOCUMENT_TYPES.NATIONAL_ID]: 'National ID',
  [DOCUMENT_TYPES.DRIVER_LICENSE]: 'Driver License',
  [DOCUMENT_TYPES.BIRTH_CERTIFICATE]: 'Birth Certificate',
  [DOCUMENT_TYPES.RESUME]: 'Resume',
  [DOCUMENT_TYPES.CONTRACT]: 'Contract',
  [DOCUMENT_TYPES.CERTIFICATE]: 'Certificate',
  [DOCUMENT_TYPES.MEDICAL_RECORD]: 'Medical Record',
  [DOCUMENT_TYPES.FINANCIAL_DOCUMENT]: 'Financial Document',
  [DOCUMENT_TYPES.LEGAL_DOCUMENT]: 'Legal Document',
  [DOCUMENT_TYPES.OTHER]: 'Other'
} as const

export const RELATIONSHIP_TYPE_LABELS = {
  [RELATIONSHIP_TYPES.FAMILY]: 'Family',
  [RELATIONSHIP_TYPES.FRIEND]: 'Friend',
  [RELATIONSHIP_TYPES.COLLEAGUE]: 'Colleague',
  [RELATIONSHIP_TYPES.BUSINESS_PARTNER]: 'Business Partner',
  [RELATIONSHIP_TYPES.ACQUAINTANCE]: 'Acquaintance',
  [RELATIONSHIP_TYPES.ROMANTIC]: 'Romantic',
  [RELATIONSHIP_TYPES.PROFESSIONAL]: 'Professional'
} as const

export const EVENT_TYPE_LABELS = {
  [EVENT_TYPES.BIRTHDAY]: 'Birthday',
  [EVENT_TYPES.ANNIVERSARY]: 'Anniversary',
  [EVENT_TYPES.MEETING]: 'Meeting',
  [EVENT_TYPES.APPOINTMENT]: 'Appointment',
  [EVENT_TYPES.MILESTONE]: 'Milestone',
  [EVENT_TYPES.ACHIEVEMENT]: 'Achievement',
  [EVENT_TYPES.TRAVEL]: 'Travel',
  [EVENT_TYPES.MEDICAL]: 'Medical',
  [EVENT_TYPES.EDUCATION]: 'Education',
  [EVENT_TYPES.CAREER]: 'Career'
} as const

export const DATABASE_CONFIG = {
  FILE_EXTENSIONS: ['db', 'sqlite'],
  DEFAULT_NAME: 'people_manager.db',
  SUPPORTED_FORMATS: [
    { name: 'Database Files', extensions: ['db', 'sqlite'] },
    { name: 'All Files', extensions: ['*'] }
  ]
} as const
