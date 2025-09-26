// src/renderer/src/presentation/pages/PeopleManager/utils/peopleUtils.ts
import { Person, PersonRelationship, PersonEvent } from '../types'
import { GENDER_LABELS, MARITAL_STATUS_LABELS, BLOOD_TYPES } from '../constants'

export const calculateAge = (dateOfBirth: string): number => {
  const today = new Date()
  const birthDate = new Date(dateOfBirth)
  let age = today.getFullYear() - birthDate.getFullYear()
  const monthDiff = today.getMonth() - birthDate.getMonth()

  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--
  }

  return age
}

export const formatDate = (dateString: string, includeTime: boolean = false): string => {
  const date = new Date(dateString)
  const options: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  }

  if (includeTime) {
    options.hour = '2-digit'
    options.minute = '2-digit'
  }

  return date.toLocaleDateString('en-US', options)
}

export const getInitials = (fullName: string): string => {
  return fullName
    .split(' ')
    .map((name) => name.charAt(0))
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

export const getGenderLabel = (gender: string): string => {
  return GENDER_LABELS[gender as keyof typeof GENDER_LABELS] || gender
}

export const getMaritalStatusLabel = (status: string): string => {
  return MARITAL_STATUS_LABELS[status as keyof typeof MARITAL_STATUS_LABELS] || status
}

export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

export const isValidPhoneNumber = (phone: string): boolean => {
  const phoneRegex = /^\+?[\d\s-()]+$/
  return phoneRegex.test(phone)
}

export const formatPhoneNumber = (phone: string): string => {
  // Simple formatting - can be enhanced based on requirements
  return phone.replace(/(\d{3})(\d{3})(\d{4})/, '($1) $2-$3')
}

export const getUpcomingEvents = (events: PersonEvent[], daysAhead: number = 30): PersonEvent[] => {
  const today = new Date()
  const futureDate = new Date()
  futureDate.setDate(today.getDate() + daysAhead)

  return events
    .filter((event) => {
      const eventDate = new Date(event.event_date)
      return eventDate >= today && eventDate <= futureDate
    })
    .sort((a, b) => new Date(a.event_date).getTime() - new Date(b.event_date).getTime())
}

export const getRecentEvents = (events: PersonEvent[], daysBack: number = 30): PersonEvent[] => {
  const today = new Date()
  const pastDate = new Date()
  pastDate.setDate(today.getDate() - daysBack)

  return events
    .filter((event) => {
      const eventDate = new Date(event.event_date)
      return eventDate >= pastDate && eventDate <= today
    })
    .sort((a, b) => new Date(b.event_date).getTime() - new Date(a.event_date).getTime())
}

export const calculateBMI = (height: number, weight: number): number => {
  if (!height || !weight) return 0
  // Convert height from cm to meters
  const heightInMeters = height / 100
  return weight / (heightInMeters * heightInMeters)
}

export const getBMICategory = (bmi: number): string => {
  if (bmi < 18.5) return 'Underweight'
  if (bmi < 25) return 'Normal weight'
  if (bmi < 30) return 'Overweight'
  return 'Obese'
}

export const sortPeople = (
  people: Person[],
  sortBy: string,
  ascending: boolean = true
): Person[] => {
  return [...people].sort((a, b) => {
    let aValue: any
    let bValue: any

    switch (sortBy) {
      case 'name':
        aValue = a.full_name.toLowerCase()
        bValue = b.full_name.toLowerCase()
        break
      case 'age':
        aValue = a.date_of_birth ? calculateAge(a.date_of_birth) : 0
        bValue = b.date_of_birth ? calculateAge(b.date_of_birth) : 0
        break
      case 'last_updated':
        aValue = new Date(a.updated_at)
        bValue = new Date(b.updated_at)
        break
      case 'created':
        aValue = new Date(a.created_at)
        bValue = new Date(b.created_at)
        break
      default:
        aValue = a.full_name.toLowerCase()
        bValue = b.full_name.toLowerCase()
    }

    if (aValue < bValue) return ascending ? -1 : 1
    if (aValue > bValue) return ascending ? 1 : -1
    return 0
  })
}

export const exportToCSV = (people: Person[]): string => {
  const headers = ['Name', 'Email', 'Phone', 'Age', 'Gender', 'Nationality', 'Tags']
  const rows = people.map((person) => [
    person.full_name,
    person.primary_email || '',
    person.primary_phone || '',
    person.date_of_birth ? calculateAge(person.date_of_birth).toString() : '',
    person.gender || '',
    person.nationality || '',
    person.tags?.join(', ') || ''
  ])

  return [headers, ...rows].map((row) => row.map((field) => `"${field}"`).join(',')).join('\n')
}

export const generatePersonReport = (person: Person): string => {
  const report = []

  report.push(`PERSON REPORT: ${person.full_name}`)
  report.push('='.repeat(50))

  if (person.preferred_name) {
    report.push(`Preferred Name: ${person.preferred_name}`)
  }

  if (person.date_of_birth) {
    report.push(`Age: ${calculateAge(person.date_of_birth)} years old`)
  }

  if (person.gender) {
    report.push(`Gender: ${getGenderLabel(person.gender)}`)
  }

  if (person.primary_email) {
    report.push(`Email: ${person.primary_email}`)
  }

  if (person.primary_phone) {
    report.push(`Phone: ${formatPhoneNumber(person.primary_phone)}`)
  }

  if (person.occupation) {
    report.push(`Occupation: ${person.occupation}`)
  }

  if (person.tags && person.tags.length > 0) {
    report.push(`Tags: ${person.tags.join(', ')}`)
  }

  return report.join('\n')
}

export const validatePersonData = (person: Partial<Person>): string[] => {
  const errors: string[] = []

  if (!person.full_name?.trim()) {
    errors.push('Full name is required')
  }

  if (person.primary_email && !isValidEmail(person.primary_email)) {
    errors.push('Invalid email address')
  }

  if (person.date_of_birth) {
    const birthDate = new Date(person.date_of_birth)
    if (birthDate > new Date()) {
      errors.push('Date of birth cannot be in the future')
    }
  }

  if (person.height && (person.height < 50 || person.height > 250)) {
    errors.push('Height must be between 50cm and 250cm')
  }

  if (person.weight && (person.weight < 2 || person.weight > 500)) {
    errors.push('Weight must be between 2kg and 500kg')
  }

  return errors
}
