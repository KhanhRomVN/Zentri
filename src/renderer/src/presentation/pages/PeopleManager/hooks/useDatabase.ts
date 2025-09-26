// src/renderer/src/presentation/pages/PeopleManager/hooks/useDatabase.ts
import { useState, useEffect, useCallback } from 'react'
import { peopleService } from '../services/PeopleService'
import { DatabaseInfo, Person } from '../types'

export interface DatabaseManagerState {
  currentDatabase: DatabaseInfo | null
  isLoading: boolean
  error: string | null
  people: Person[]
  showDatabaseModal: boolean
  isInitialized: boolean
}

export const useDatabase = () => {
  const [state, setState] = useState<DatabaseManagerState>({
    currentDatabase: null,
    isLoading: true,
    error: null,
    people: [],
    showDatabaseModal: false,
    isInitialized: false
  })

  const isDatabaseReady =
    state.currentDatabase !== null && !state.showDatabaseModal && state.isInitialized

  useEffect(() => {
    const initializeDatabase = async () => {
      try {
        setState((prev) => ({ ...prev, isLoading: true, error: null }))

        const hasExistingDatabase = await peopleService.initialize()

        if (hasExistingDatabase) {
          const currentDatabase = peopleService.getCurrentDatabase()
          setState((prev) => ({
            ...prev,
            currentDatabase,
            showDatabaseModal: false,
            isInitialized: true,
            isLoading: false
          }))
        } else {
          setState((prev) => ({
            ...prev,
            showDatabaseModal: true,
            isInitialized: true,
            isLoading: false
          }))
        }
      } catch (error) {
        setState((prev) => ({
          ...prev,
          error: error instanceof Error ? error.message : 'Failed to initialize database',
          showDatabaseModal: true,
          isInitialized: true,
          isLoading: false
        }))
      }
    }

    initializeDatabase()
  }, [])

  const handleDatabaseSelected = useCallback(async () => {
    try {
      setState((prev) => ({
        ...prev,
        isLoading: true,
        error: null,
        showDatabaseModal: false
      }))

      const currentDatabase = peopleService.getCurrentDatabase()
      if (currentDatabase) {
        setState((prev) => ({
          ...prev,
          currentDatabase,
          isLoading: false
        }))
        await loadPeople()
      }
    } catch (error) {
      setState((prev) => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Failed to load database',
        isLoading: false,
        showDatabaseModal: true
      }))
    }
  }, [])

  const loadPeople = useCallback(async () => {
    if (!isDatabaseReady && !state.currentDatabase) return

    try {
      setState((prev) => ({ ...prev, isLoading: true, error: null }))
      const people = await peopleService.getAllPeople()
      setState((prev) => ({
        ...prev,
        people,
        isLoading: false
      }))
    } catch (error) {
      setState((prev) => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Failed to load people',
        isLoading: false
      }))
    }
  }, [isDatabaseReady, state.currentDatabase])

  const createPerson = useCallback(
    async (personData: Omit<Person, 'id'>): Promise<Person | null> => {
      if (!isDatabaseReady) return null

      try {
        setState((prev) => ({ ...prev, isLoading: true, error: null }))
        const newPerson = await peopleService.createPerson(personData)
        await loadPeople()
        return newPerson
      } catch (error) {
        setState((prev) => ({
          ...prev,
          error: error instanceof Error ? error.message : 'Failed to create person',
          isLoading: false
        }))
        return null
      }
    },
    [isDatabaseReady, loadPeople]
  )

  const updatePerson = useCallback(
    async (id: string, updates: Partial<Person>): Promise<boolean> => {
      if (!isDatabaseReady) return false

      try {
        setState((prev) => ({ ...prev, isLoading: true, error: null }))
        await peopleService.updatePerson(id, updates)
        await loadPeople()
        return true
      } catch (error) {
        setState((prev) => ({
          ...prev,
          error: error instanceof Error ? error.message : 'Failed to update person',
          isLoading: false
        }))
        return false
      }
    },
    [isDatabaseReady, loadPeople]
  )

  const deletePerson = useCallback(
    async (id: string): Promise<boolean> => {
      if (!isDatabaseReady) return false

      try {
        setState((prev) => ({ ...prev, isLoading: true, error: null }))
        await peopleService.deletePerson(id)
        await loadPeople()
        return true
      } catch (error) {
        setState((prev) => ({
          ...prev,
          error: error instanceof Error ? error.message : 'Failed to delete person',
          isLoading: false
        }))
        return false
      }
    },
    [isDatabaseReady, loadPeople]
  )

  const closeDatabase = useCallback(async () => {
    try {
      await peopleService.closeDatabase()
      setState({
        currentDatabase: null,
        isLoading: false,
        error: null,
        people: [],
        showDatabaseModal: true,
        isInitialized: true
      })
    } catch (error) {
      setState((prev) => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Failed to close database'
      }))
    }
  }, [])

  const forgetDatabase = useCallback(async () => {
    try {
      await peopleService.forgetDatabase()
      setState({
        currentDatabase: null,
        isLoading: false,
        error: null,
        people: [],
        showDatabaseModal: true,
        isInitialized: true
      })
    } catch (error) {
      setState((prev) => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Failed to forget database'
      }))
    }
  }, [])

  const clearError = useCallback(() => {
    setState((prev) => ({ ...prev, error: null }))
  }, [])

  useEffect(() => {
    if (isDatabaseReady && state.people.length === 0) {
      loadPeople()
    }
  }, [isDatabaseReady, loadPeople, state.people.length])

  return {
    ...state,
    isDatabaseReady,
    handleDatabaseSelected,
    loadPeople,
    createPerson,
    updatePerson,
    deletePerson,
    closeDatabase,
    forgetDatabase,
    clearError
  }
}
