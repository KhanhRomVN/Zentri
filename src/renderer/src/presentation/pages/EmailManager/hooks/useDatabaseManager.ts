// src/renderer/src/presentation/pages/EmailManager/hooks/useDatabaseManager.ts
import { useState, useEffect, useCallback } from 'react'
import { databaseService } from '../services/DatabaseService'
import { DatabaseInfo, Email, Email2FA, ServiceAccount } from '../types'

export interface DatabaseManagerState {
  currentDatabase: DatabaseInfo | null
  isLoading: boolean
  error: string | null
  emails: Email[]
  showDatabaseModal: boolean
  isInitialized: boolean // Thêm để track việc khởi tạo
}

export const useDatabaseManager = () => {
  const [state, setState] = useState<DatabaseManagerState>({
    currentDatabase: null,
    isLoading: true, // Bắt đầu với loading true
    error: null,
    emails: [],
    showDatabaseModal: false, // Bắt đầu với false, sẽ được set sau khi initialize
    isInitialized: false
  })

  // Check if database is ready
  const isDatabaseReady =
    state.currentDatabase !== null && !state.showDatabaseModal && state.isInitialized

  // Initialize database khi component mount
  useEffect(() => {
    const initializeDatabase = async () => {
      try {
        setState((prev) => ({
          ...prev,
          isLoading: true,
          error: null
        }))

        const hasExistingDatabase = await databaseService.initialize()

        if (hasExistingDatabase) {
          const currentDatabase = databaseService.getCurrentDatabase()

          // Đợi thêm để đảm bảo database hoàn toàn sẵn sàng
          await new Promise((resolve) => setTimeout(resolve, 200))

          setState((prev) => ({
            ...prev,
            currentDatabase,
            showDatabaseModal: false,
            isInitialized: true,
            isLoading: false
          }))

          // Load emails sau khi state đã update
          try {
            const emails = await databaseService.getAllEmails()
            setState((prev) => ({
              ...prev,
              emails
            }))
          } catch (emailError) {
            console.error('Failed to load initial emails:', emailError)
          }
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

  // Handle database selection from modal
  const handleDatabaseSelected = useCallback(async () => {
    try {
      setState((prev) => ({
        ...prev,
        isLoading: true,
        error: null,
        showDatabaseModal: false
      }))

      const currentDatabase = databaseService.getCurrentDatabase()
      if (currentDatabase) {
        setState((prev) => ({
          ...prev,
          currentDatabase,
          isLoading: false
        }))

        // Load emails sau khi database ready
        await loadEmails()
      }
    } catch (error) {
      setState((prev) => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Failed to load database',
        isLoading: false,
        showDatabaseModal: true // Show modal again on error
      }))
    }
  }, [])

  // Load emails from database
  const loadEmails = useCallback(async () => {
    if (!isDatabaseReady && !state.currentDatabase) return

    try {
      setState((prev) => ({ ...prev, isLoading: true, error: null }))

      const emails = await databaseService.getAllEmails()

      setState((prev) => ({
        ...prev,
        emails,
        isLoading: false
      }))
    } catch (error) {
      setState((prev) => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Failed to load emails',
        isLoading: false
      }))
    }
  }, [isDatabaseReady, state.currentDatabase])

  // Create new email
  const createEmail = useCallback(
    async (emailData: Omit<Email, 'id'>): Promise<Email | null> => {
      if (!isDatabaseReady) return null

      try {
        setState((prev) => ({ ...prev, isLoading: true, error: null }))

        const newEmail = await databaseService.createEmail(emailData)

        // Refresh emails list
        await loadEmails()

        return newEmail
      } catch (error) {
        setState((prev) => ({
          ...prev,
          error: error instanceof Error ? error.message : 'Failed to create email',
          isLoading: false
        }))
        return null
      }
    },
    [isDatabaseReady, loadEmails]
  )

  // Update email
  const updateEmail = useCallback(
    async (id: string, updates: Partial<Email>): Promise<boolean> => {
      if (!isDatabaseReady) return false

      try {
        setState((prev) => ({ ...prev, isLoading: true, error: null }))

        await databaseService.updateEmail(id, updates)

        // Refresh emails list
        await loadEmails()

        return true
      } catch (error) {
        setState((prev) => ({
          ...prev,
          error: error instanceof Error ? error.message : 'Failed to update email',
          isLoading: false
        }))
        return false
      }
    },
    [isDatabaseReady, loadEmails]
  )

  // Delete email
  const deleteEmail = useCallback(
    async (id: string): Promise<boolean> => {
      if (!isDatabaseReady) return false

      try {
        setState((prev) => ({ ...prev, isLoading: true, error: null }))

        await databaseService.deleteEmail(id)

        // Refresh emails list
        await loadEmails()

        return true
      } catch (error) {
        setState((prev) => ({
          ...prev,
          error: error instanceof Error ? error.message : 'Failed to delete email',
          isLoading: false
        }))
        return false
      }
    },
    [isDatabaseReady, loadEmails]
  )

  // Get email 2FA methods
  const getEmail2FA = useCallback(
    async (emailId: string): Promise<Email2FA[]> => {
      if (!isDatabaseReady) return []

      try {
        return await databaseService.getEmail2FAByEmailId(emailId)
      } catch (error) {
        console.error('Failed to load email 2FA:', error)
        return []
      }
    },
    [isDatabaseReady]
  )

  // Get service accounts for email
  const getServiceAccounts = useCallback(
    async (emailId: string): Promise<ServiceAccount[]> => {
      if (!isDatabaseReady) return []

      try {
        return await databaseService.getServiceAccountsByEmailId(emailId)
      } catch (error) {
        console.error('Failed to load service accounts:', error)
        return []
      }
    },
    [isDatabaseReady]
  )

  // Close database
  const closeDatabase = useCallback(async () => {
    try {
      await databaseService.closeDatabase()
      setState({
        currentDatabase: null,
        isLoading: false,
        error: null,
        emails: [],
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

  // Forget database - xóa hoàn toàn khỏi storage
  const forgetDatabase = useCallback(async () => {
    try {
      await databaseService.forgetDatabase()
      setState({
        currentDatabase: null,
        isLoading: false,
        error: null,
        emails: [],
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

  // Clear error
  const clearError = useCallback(() => {
    setState((prev) => ({ ...prev, error: null }))
  }, [])

  return {
    // State
    ...state,
    isDatabaseReady,

    // Actions
    handleDatabaseSelected,
    loadEmails,
    createEmail,
    updateEmail,
    deleteEmail,
    getEmail2FA,
    getServiceAccounts,
    closeDatabase,
    forgetDatabase, // Thêm method mới
    clearError
  }
}
