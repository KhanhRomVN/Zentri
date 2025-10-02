// src/renderer/src/presentation/pages/PeopleManager/hooks/usePeopleManager.ts
import { useState, useCallback, useMemo } from 'react'
import { useDatabase } from './useDatabase'
import { Person } from '../types'

export const usePeopleManager = () => {
  const database = useDatabase()

  // Local state for UI management
  const [selectedPerson, setSelectedPerson] = useState<Person | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [filters, setFilters] = useState({
    gender: [] as string[],
    nationality: [] as string[],
    tags: [] as string[]
  })

  // Get PersonInfo for selected person
  const selectedPersonInfo = useMemo(() => {
    if (!selectedPerson) return null
    return database.personInfos.find((info) => info.person_id === selectedPerson.id) || null
  }, [selectedPerson, database.personInfos])

  // Get Identifications for selected person
  const selectedPersonIdentifications = useMemo(() => {
    if (!selectedPerson) return []
    return database.identifications.filter((id) => id.person_id === selectedPerson.id)
  }, [selectedPerson, database.identifications])

  // Get Addresses for selected person
  const selectedPersonAddresses = useMemo(() => {
    if (!selectedPerson) return []
    return database.addresses.filter((addr) => addr.person_id === selectedPerson.id)
  }, [selectedPerson, database.addresses])

  // Get Contacts for selected person
  const selectedPersonContacts = useMemo(() => {
    if (!selectedPerson) return []
    return database.contacts.filter((contact) => contact.person_id === selectedPerson.id)
  }, [selectedPerson, database.contacts])

  // Get ServiceAccounts for selected person
  const selectedPersonServiceAccounts = useMemo(() => {
    if (!selectedPerson) return []
    return database.serviceAccounts.filter((sa) => sa.person_id === selectedPerson.id)
  }, [selectedPerson, database.serviceAccounts])

  // Get Relationships for selected person
  const selectedPersonRelationships = useMemo(() => {
    if (!selectedPerson) return []
    return database.relationships.filter(
      (rel) => rel.person_id === selectedPerson.id || rel.related_person_id === selectedPerson.id
    )
  }, [selectedPerson, database.relationships])

  // Filter people based on search and filters
  const filteredPeople = useMemo(() => {
    if (!database.isDatabaseReady) return []

    return database.people.filter((person) => {
      const personInfo = database.personInfos.find((info) => info.person_id === person.id)
      const personContacts = database.contacts.filter((c) => c.person_id === person.id)

      // Search query filter
      const matchesSearch =
        personInfo?.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        personInfo?.preferred_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        personContacts.some(
          (c) =>
            c.contact_type === 'email' &&
            c.contact_value.toLowerCase().includes(searchQuery.toLowerCase())
        ) ||
        personContacts.some(
          (c) => c.contact_type === 'phone' && c.contact_value.includes(searchQuery)
        )

      // Gender filter
      const matchesGender =
        filters.gender.length === 0 ||
        (personInfo?.gender && filters.gender.includes(personInfo.gender))

      return matchesSearch && matchesGender
    })
  }, [
    database.people,
    database.personInfos,
    database.contacts,
    searchQuery,
    filters,
    database.isDatabaseReady
  ])

  // Person selection
  const selectPerson = useCallback((person: Person | null) => {
    setSelectedPerson(person)
  }, [])

  // Filter management
  const updateFilters = useCallback((newFilters: Partial<typeof filters>) => {
    setFilters((prev) => ({ ...prev, ...newFilters }))
  }, [])

  // Clear all filters
  const clearFilters = useCallback(() => {
    setFilters({
      gender: [],
      nationality: [],
      tags: []
    })
    setSearchQuery('')
  }, [])

  // Get person statistics
  const getStatistics = useCallback(() => {
    const totalPeople = database.people.length
    const withEmail = database.contacts.filter((c) => c.contact_type === 'email').length
    const withPhone = database.contacts.filter((c) => c.contact_type === 'phone').length
    const withAddress = database.addresses.length

    const genderStats = database.personInfos.reduce(
      (acc, personInfo) => {
        if (personInfo.gender) {
          acc[personInfo.gender] = (acc[personInfo.gender] || 0) + 1
        }
        return acc
      },
      {} as Record<string, number>
    )

    return {
      totalPeople,
      withEmail,
      withPhone,
      withAddress,
      genderStats
    }
  }, [database.people, database.personInfos, database.contacts, database.addresses])

  return {
    // Database state
    ...database,

    // People data
    people: database.people,
    personInfos: database.personInfos,
    filteredPeople,
    selectedPerson,
    selectedPersonInfo,
    selectedPersonIdentifications,
    selectedPersonAddresses,
    selectedPersonContacts,
    selectedPersonServiceAccounts,
    selectedPersonRelationships,

    // Search and filters
    searchQuery,
    setSearchQuery,
    filters,
    updateFilters,
    clearFilters,

    // Actions
    selectPerson,
    getStatistics
  }
}
