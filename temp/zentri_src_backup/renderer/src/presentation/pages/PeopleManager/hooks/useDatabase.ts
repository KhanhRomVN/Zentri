// src/renderer/src/presentation/pages/PeopleManager/hooks/useDatabase.ts
import { useState, useEffect, useCallback } from 'react'
import { peopleService } from '../services/PeopleService'
import {
  DatabaseInfo,
  Person,
  PersonInfo,
  Contact,
  Address,
  Identification,
  ServiceAccount,
  Relationship
} from '../types'

export interface DatabaseManagerState {
  currentDatabase: DatabaseInfo | null
  isLoading: boolean
  error: string | null
  people: Person[]
  personInfos: PersonInfo[]
  contacts: Contact[]
  addresses: Address[]
  identifications: Identification[]
  serviceAccounts: ServiceAccount[]
  relationships: Relationship[]
  showDatabaseModal: boolean
  isInitialized: boolean
}

export const useDatabase = () => {
  const [state, setState] = useState<DatabaseManagerState>({
    currentDatabase: null,
    isLoading: true,
    error: null,
    people: [],
    personInfos: [],
    contacts: [],
    addresses: [],
    identifications: [],
    serviceAccounts: [],
    relationships: [],
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
        await loadAllData()
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

  const loadAllData = useCallback(async () => {
    if (!isDatabaseReady && !state.currentDatabase) return

    try {
      setState((prev) => ({ ...prev, isLoading: true, error: null }))

      const people = await peopleService.getAllPeople()

      // Load related data for all people
      const personInfosPromises = people.map((p) => peopleService.getPersonInfoByPersonId(p.id))
      const contactsPromises = people.map((p) => peopleService.getContactsByPersonId(p.id))
      const addressesPromises = people.map((p) => peopleService.getAddressesByPersonId(p.id))
      const identificationsPromises = people.map((p) =>
        peopleService.getIdentificationsByPersonId(p.id)
      )
      const serviceAccountsPromises = people.map((p) =>
        peopleService.getServiceAccountsByPersonId(p.id)
      )
      const relationshipsPromises = people.map((p) =>
        peopleService.getRelationshipsByPersonId(p.id)
      )

      const [
        personInfosResults,
        contactsResults,
        addressesResults,
        identificationsResults,
        serviceAccountsResults,
        relationshipsResults
      ] = await Promise.all([
        Promise.all(personInfosPromises),
        Promise.all(contactsPromises),
        Promise.all(addressesPromises),
        Promise.all(identificationsPromises),
        Promise.all(serviceAccountsPromises),
        Promise.all(relationshipsPromises)
      ])

      const personInfos = personInfosResults.filter((info): info is PersonInfo => info !== null)
      const contacts = contactsResults.flat()
      const addresses = addressesResults.flat()
      const identifications = identificationsResults.flat()
      const serviceAccounts = serviceAccountsResults.flat()
      const relationships = relationshipsResults.flat()

      setState((prev) => ({
        ...prev,
        people,
        personInfos,
        contacts,
        addresses,
        identifications,
        serviceAccounts,
        relationships,
        isLoading: false
      }))
    } catch (error) {
      setState((prev) => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Failed to load data',
        isLoading: false
      }))
    }
  }, [isDatabaseReady, state.currentDatabase])

  // ServiceAccount CRUD
  const createServiceAccount = useCallback(
    async (serviceAccount: Omit<ServiceAccount, 'id'>): Promise<ServiceAccount | null> => {
      if (!isDatabaseReady) return null

      try {
        const newServiceAccount = await peopleService.createServiceAccount(serviceAccount)
        await loadAllData()
        return newServiceAccount
      } catch (error) {
        setState((prev) => ({
          ...prev,
          error: error instanceof Error ? error.message : 'Failed to create service account'
        }))
        return null
      }
    },
    [isDatabaseReady, loadAllData]
  )

  const updateServiceAccount = useCallback(
    async (id: string, updates: Partial<ServiceAccount>): Promise<boolean> => {
      if (!isDatabaseReady) return false

      try {
        await peopleService.updateServiceAccount(id, updates)
        await loadAllData()
        return true
      } catch (error) {
        setState((prev) => ({
          ...prev,
          error: error instanceof Error ? error.message : 'Failed to update service account'
        }))
        return false
      }
    },
    [isDatabaseReady, loadAllData]
  )

  const deleteServiceAccount = useCallback(
    async (id: string): Promise<boolean> => {
      if (!isDatabaseReady) return false

      try {
        await peopleService.deleteServiceAccount(id)
        await loadAllData()
        return true
      } catch (error) {
        setState((prev) => ({
          ...prev,
          error: error instanceof Error ? error.message : 'Failed to delete service account'
        }))
        return false
      }
    },
    [isDatabaseReady, loadAllData]
  )

  // Relationship CRUD
  const createRelationship = useCallback(
    async (relationship: Omit<Relationship, 'id'>): Promise<Relationship | null> => {
      if (!isDatabaseReady) return null

      try {
        const newRelationship = await peopleService.createRelationship(relationship)
        await loadAllData()
        return newRelationship
      } catch (error) {
        setState((prev) => ({
          ...prev,
          error: error instanceof Error ? error.message : 'Failed to create relationship'
        }))
        return null
      }
    },
    [isDatabaseReady, loadAllData]
  )

  const updateRelationship = useCallback(
    async (id: string, updates: Partial<Relationship>): Promise<boolean> => {
      if (!isDatabaseReady) return false

      try {
        await peopleService.updateRelationship(id, updates)
        await loadAllData()
        return true
      } catch (error) {
        setState((prev) => ({
          ...prev,
          error: error instanceof Error ? error.message : 'Failed to update relationship'
        }))
        return false
      }
    },
    [isDatabaseReady, loadAllData]
  )

  const deleteRelationship = useCallback(
    async (id: string): Promise<boolean> => {
      if (!isDatabaseReady) return false

      try {
        await peopleService.deleteRelationship(id)
        await loadAllData()
        return true
      } catch (error) {
        setState((prev) => ({
          ...prev,
          error: error instanceof Error ? error.message : 'Failed to delete relationship'
        }))
        return false
      }
    },
    [isDatabaseReady, loadAllData]
  )

  // Person CRUD
  const createPerson = useCallback(async (): Promise<Person | null> => {
    if (!isDatabaseReady) return null

    try {
      setState((prev) => ({ ...prev, isLoading: true, error: null }))
      const newPerson = await peopleService.createPerson()
      await loadAllData()
      return newPerson
    } catch (error) {
      setState((prev) => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Failed to create person',
        isLoading: false
      }))
      return null
    }
  }, [isDatabaseReady, loadAllData])

  const deletePerson = useCallback(
    async (id: string): Promise<boolean> => {
      if (!isDatabaseReady) return false

      try {
        setState((prev) => ({ ...prev, isLoading: true, error: null }))
        await peopleService.deletePerson(id)
        await loadAllData()
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
    [isDatabaseReady, loadAllData]
  )

  // PersonInfo CRUD
  const createPersonInfo = useCallback(
    async (personInfo: Omit<PersonInfo, 'id'>): Promise<PersonInfo | null> => {
      if (!isDatabaseReady) return null

      try {
        const newPersonInfo = await peopleService.createPersonInfo(personInfo)
        await loadAllData()
        return newPersonInfo
      } catch (error) {
        setState((prev) => ({
          ...prev,
          error: error instanceof Error ? error.message : 'Failed to create person info'
        }))
        return null
      }
    },
    [isDatabaseReady, loadAllData]
  )

  const updatePersonInfo = useCallback(
    async (id: string, updates: Partial<PersonInfo>): Promise<boolean> => {
      if (!isDatabaseReady) return false

      try {
        await peopleService.updatePersonInfo(id, updates)
        await loadAllData()
        return true
      } catch (error) {
        setState((prev) => ({
          ...prev,
          error: error instanceof Error ? error.message : 'Failed to update person info'
        }))
        return false
      }
    },
    [isDatabaseReady, loadAllData]
  )

  // Contact CRUD
  const createContact = useCallback(
    async (contact: Omit<Contact, 'id'>): Promise<Contact | null> => {
      if (!isDatabaseReady) return null

      try {
        const newContact = await peopleService.createContact(contact)
        await loadAllData()
        return newContact
      } catch (error) {
        setState((prev) => ({
          ...prev,
          error: error instanceof Error ? error.message : 'Failed to create contact'
        }))
        return null
      }
    },
    [isDatabaseReady, loadAllData]
  )

  const updateContact = useCallback(
    async (id: string, updates: Partial<Contact>): Promise<boolean> => {
      if (!isDatabaseReady) return false

      try {
        await peopleService.updateContact(id, updates)
        await loadAllData()
        return true
      } catch (error) {
        setState((prev) => ({
          ...prev,
          error: error instanceof Error ? error.message : 'Failed to update contact'
        }))
        return false
      }
    },
    [isDatabaseReady, loadAllData]
  )

  const deleteContact = useCallback(
    async (id: string): Promise<boolean> => {
      if (!isDatabaseReady) return false

      try {
        await peopleService.deleteContact(id)
        await loadAllData()
        return true
      } catch (error) {
        setState((prev) => ({
          ...prev,
          error: error instanceof Error ? error.message : 'Failed to delete contact'
        }))
        return false
      }
    },
    [isDatabaseReady, loadAllData]
  )

  // Address CRUD
  const createAddress = useCallback(
    async (address: Omit<Address, 'id'>): Promise<Address | null> => {
      if (!isDatabaseReady) return null

      try {
        const newAddress = await peopleService.createAddress(address)
        await loadAllData()
        return newAddress
      } catch (error) {
        setState((prev) => ({
          ...prev,
          error: error instanceof Error ? error.message : 'Failed to create address'
        }))
        return null
      }
    },
    [isDatabaseReady, loadAllData]
  )

  const updateAddress = useCallback(
    async (id: string, updates: Partial<Address>): Promise<boolean> => {
      if (!isDatabaseReady) return false

      try {
        await peopleService.updateAddress(id, updates)
        await loadAllData()
        return true
      } catch (error) {
        setState((prev) => ({
          ...prev,
          error: error instanceof Error ? error.message : 'Failed to update address'
        }))
        return false
      }
    },
    [isDatabaseReady, loadAllData]
  )

  const deleteAddress = useCallback(
    async (id: string): Promise<boolean> => {
      if (!isDatabaseReady) return false

      try {
        await peopleService.deleteAddress(id)
        await loadAllData()
        return true
      } catch (error) {
        setState((prev) => ({
          ...prev,
          error: error instanceof Error ? error.message : 'Failed to delete address'
        }))
        return false
      }
    },
    [isDatabaseReady, loadAllData]
  )

  // Identification CRUD
  const createIdentification = useCallback(
    async (identification: Omit<Identification, 'id'>): Promise<Identification | null> => {
      if (!isDatabaseReady) return null

      try {
        const newIdentification = await peopleService.createIdentification(identification)
        await loadAllData()
        return newIdentification
      } catch (error) {
        setState((prev) => ({
          ...prev,
          error: error instanceof Error ? error.message : 'Failed to create identification'
        }))
        return null
      }
    },
    [isDatabaseReady, loadAllData]
  )

  const updateIdentification = useCallback(
    async (id: string, updates: Partial<Identification>): Promise<boolean> => {
      if (!isDatabaseReady) return false

      try {
        await peopleService.updateIdentification(id, updates)
        await loadAllData()
        return true
      } catch (error) {
        setState((prev) => ({
          ...prev,
          error: error instanceof Error ? error.message : 'Failed to update identification'
        }))
        return false
      }
    },
    [isDatabaseReady, loadAllData]
  )

  const deleteIdentification = useCallback(
    async (id: string): Promise<boolean> => {
      if (!isDatabaseReady) return false

      try {
        await peopleService.deleteIdentification(id)
        await loadAllData()
        return true
      } catch (error) {
        setState((prev) => ({
          ...prev,
          error: error instanceof Error ? error.message : 'Failed to delete identification'
        }))
        return false
      }
    },
    [isDatabaseReady, loadAllData]
  )

  const closeDatabase = useCallback(async () => {
    try {
      await peopleService.closeDatabase()
      setState({
        currentDatabase: null,
        isLoading: false,
        error: null,
        people: [],
        personInfos: [],
        contacts: [],
        addresses: [],
        identifications: [],
        serviceAccounts: [],
        relationships: [],
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
        personInfos: [],
        contacts: [],
        addresses: [],
        identifications: [],
        serviceAccounts: [],
        relationships: [],
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
      loadAllData()
    }
  }, [isDatabaseReady, loadAllData, state.people.length])

  return {
    ...state,
    isDatabaseReady,
    handleDatabaseSelected,
    loadAllData,
    createPerson,
    deletePerson,
    createPersonInfo,
    updatePersonInfo,
    createContact,
    updateContact,
    deleteContact,
    createAddress,
    updateAddress,
    deleteAddress,
    createIdentification,
    updateIdentification,
    deleteIdentification,
    createServiceAccount,
    updateServiceAccount,
    deleteServiceAccount,
    createRelationship,
    updateRelationship,
    deleteRelationship,
    closeDatabase,
    forgetDatabase,
    clearError
  }
}
