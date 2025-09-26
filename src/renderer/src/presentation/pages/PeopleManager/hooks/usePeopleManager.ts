// src/renderer/src/presentation/pages/PeopleManager/hooks/usePeopleManager.ts
import { useState, useCallback, useMemo } from 'react'
import { useDatabase } from './useDatabase'
import { Person, PersonRelationship, PersonDocument, PersonEvent } from '../types'

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

  // Filter people based on search and filters
  const filteredPeople = useMemo(() => {
    if (!database.isDatabaseReady) return []

    return database.people.filter((person) => {
      // Search query filter
      const matchesSearch =
        person.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        person.preferred_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        person.primary_email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        person.primary_phone?.includes(searchQuery) ||
        person.tags?.some((tag) => tag.toLowerCase().includes(searchQuery.toLowerCase()))

      // Gender filter
      const matchesGender =
        filters.gender.length === 0 || (person.gender && filters.gender.includes(person.gender))

      // Nationality filter
      const matchesNationality =
        filters.nationality.length === 0 ||
        (person.nationality && filters.nationality.includes(person.nationality))

      // Tags filter
      const matchesTags =
        filters.tags.length === 0 ||
        (person.tags && filters.tags.some((tag) => person.tags!.includes(tag)))

      return matchesSearch && matchesGender && matchesNationality && matchesTags
    })
  }, [database.people, searchQuery, filters, database.isDatabaseReady])

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
    const withEmail = database.people.filter((p) => p.primary_email).length
    const withPhone = database.people.filter((p) => p.primary_phone).length
    const withAddress = database.people.filter(
      (p) => p.current_address && p.current_address.length > 0
    ).length

    const genderStats = database.people.reduce(
      (acc, person) => {
        if (person.gender) {
          acc[person.gender] = (acc[person.gender] || 0) + 1
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
  }, [database.people])

  return {
    // Database state
    ...database,

    // People data
    people: database.people,
    filteredPeople,
    selectedPerson,

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
