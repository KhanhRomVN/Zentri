import { Person, PersonInfo, Event } from '../types'
import { GENDER_LABELS } from '../constants'

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

export const getUpcomingEvents = (events: Event[], daysAhead: number = 30): Event[] => {
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

export const getRecentEvents = (events: Event[], daysBack: number = 30): Event[] => {
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

export const sortPeopleByPersonInfo = (
  people: Person[],
  personInfos: PersonInfo[],
  sortBy: string,
  ascending: boolean = true
): Person[] => {
  return [...people].sort((a, b) => {
    let aValue: any
    let bValue: any

    const aInfo = personInfos.find((info) => info.person_id === a.id)
    const bInfo = personInfos.find((info) => info.person_id === b.id)

    switch (sortBy) {
      case 'name':
        aValue = (aInfo?.full_name || '').toLowerCase()
        bValue = (bInfo?.full_name || '').toLowerCase()
        break
      case 'gender':
        aValue = aInfo?.gender || ''
        bValue = bInfo?.gender || ''
        break
      default:
        aValue = (aInfo?.full_name || '').toLowerCase()
        bValue = (bInfo?.full_name || '').toLowerCase()
    }

    if (aValue < bValue) return ascending ? -1 : 1
    if (aValue > bValue) return ascending ? 1 : -1
    return 0
  })
}

export const exportToCSV = (people: Person[], personInfos: PersonInfo[]): string => {
  const headers = ['Person ID', 'Full Name', 'Preferred Name', 'Gender']
  const rows = people.map((person) => {
    const info = personInfos.find((i) => i.person_id === person.id)
    return [person.id, info?.full_name || '', info?.preferred_name || '', info?.gender || '']
  })

  return [headers, ...rows].map((row) => row.map((field) => `"${field}"`).join(',')).join('\n')
}

export const generatePersonReport = (_person: Person, personInfo: PersonInfo | null): string => {
  const report = []

  report.push(`PERSON REPORT: ${personInfo?.full_name || 'Unknown'}`)
  report.push('='.repeat(50))

  if (personInfo?.preferred_name) {
    report.push(`Preferred Name: ${personInfo.preferred_name}`)
  }

  if (personInfo?.gender) {
    report.push(`Gender: ${getGenderLabel(personInfo.gender)}`)
  }

  return report.join('\n')
}

export const validatePersonInfoData = (personInfo: Partial<PersonInfo>): string[] => {
  const errors: string[] = []

  if (!personInfo.full_name?.trim()) {
    errors.push('Full name is required')
  }

  return errors
}
