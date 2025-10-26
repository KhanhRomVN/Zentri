// src/renderer/src/presentation/providers/DatabaseSchemaProvider.tsx
import React, { createContext, useContext, useEffect, useState } from 'react'
import { databaseService } from '../pages/EmailManager/services/DatabaseService'

interface DatabaseSchemaContextType {
  isSchemaReady: boolean
  isMigrating: boolean
  migrationError: string | null
  migrationProgress: string
}

const DatabaseSchemaContext = createContext<DatabaseSchemaContextType>({
  isSchemaReady: false,
  isMigrating: false,
  migrationError: null,
  migrationProgress: ''
})

export const useDatabaseSchema = () => {
  const context = useContext(DatabaseSchemaContext)
  if (!context) {
    throw new Error('useDatabaseSchema must be used within DatabaseSchemaProvider')
  }
  return context
}

interface DatabaseSchemaProviderProps {
  children: React.ReactNode
}

// Danh sách các table cần có trong database
const REQUIRED_TABLES = [
  'emails',
  'email_2fa',
  'service_accounts',
  'service_account_2fa',
  'service_account_secrets',
  'saved_tables',
  'query_history'
]

export const DatabaseSchemaProvider: React.FC<DatabaseSchemaProviderProps> = ({ children }) => {
  const [isSchemaReady, setIsSchemaReady] = useState(false)
  const [isMigrating, setIsMigrating] = useState(false)
  const [migrationError, setMigrationError] = useState<string | null>(null)
  const [migrationProgress, setMigrationProgress] = useState('')

  useEffect(() => {
    let isMounted = true // Cleanup flag

    const initializeDatabase = async () => {
      try {
        if (!isMounted) return

        setIsMigrating(true)
        setMigrationError(null)
        setMigrationProgress('Đang khởi tạo database...')

        console.log('[DatabaseSchemaProvider] Initializing database...')

        // 1. Khởi tạo database (auto-open last database nếu có)
        const initialized = await databaseService.initialize()

        if (!isMounted) return // Check lại sau mỗi async operation

        if (!initialized) {
          console.log('[DatabaseSchemaProvider] No existing database found')
          setIsSchemaReady(true)
          setIsMigrating(false)
          setMigrationProgress('')
          return
        }

        console.log('[DatabaseSchemaProvider] Database initialized successfully')

        // 2. Kiểm tra các table hiện có
        setMigrationProgress('Đang kiểm tra cấu trúc database...')
        const existingTables = await checkExistingTables()

        if (!isMounted) return

        console.log('[DatabaseSchemaProvider] Existing tables:', existingTables)

        // 3. Tìm các table còn thiếu
        const missingTables = REQUIRED_TABLES.filter((table) => !existingTables.includes(table))

        if (missingTables.length > 0) {
          console.log('[DatabaseSchemaProvider] Missing tables detected:', missingTables)
          setMigrationProgress(`Đang tạo ${missingTables.length} table còn thiếu...`)

          // 4. Tạo các table còn thiếu
          await databaseService.ensureTablesExist()

          if (!isMounted) return

          console.log('[DatabaseSchemaProvider] Missing tables created successfully')
        } else {
          console.log('[DatabaseSchemaProvider] All required tables exist')
        }

        // 5. Kiểm tra lại sau khi tạo
        setMigrationProgress('Đang xác minh cấu trúc database...')
        const finalTables = await checkExistingTables()

        if (!isMounted) return

        const stillMissing = REQUIRED_TABLES.filter((table) => !finalTables.includes(table))

        if (stillMissing.length > 0) {
          throw new Error(
            `Không thể tạo các table: ${stillMissing.join(', ')}. Vui lòng kiểm tra quyền truy cập database.`
          )
        }

        console.log('[DatabaseSchemaProvider] Schema is ready')
        setMigrationProgress('Hoàn tất!')
        setIsSchemaReady(true)
      } catch (error) {
        if (!isMounted) return

        console.error('[DatabaseSchemaProvider] Error initializing database:', error)
        setMigrationError(
          error instanceof Error ? error.message : 'Unknown database initialization error'
        )
        setIsSchemaReady(false)
      } finally {
        if (isMounted) {
          // Đợi một chút để user thấy "Hoàn tất!" trước khi ẩn loading
          await new Promise((resolve) => setTimeout(resolve, 500))
          setIsMigrating(false)
          setMigrationProgress('')
        }
      }
    }

    initializeDatabase()

    // Cleanup function
    return () => {
      isMounted = false
    }
  }, [])

  // Helper function để lấy danh sách table hiện có
  const checkExistingTables = async (): Promise<string[]> => {
    try {
      const rows = await window.electronAPI.sqlite.getAllRows(
        "SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'"
      )
      return rows.map((row: any) => row.name)
    } catch (error) {
      console.error('[DatabaseSchemaProvider] Error checking tables:', error)
      return []
    }
  }

  const value: DatabaseSchemaContextType = {
    isSchemaReady,
    isMigrating,
    migrationError,
    migrationProgress
  }

  // Hiển thị loading screen khi đang migrate
  if (isMigrating) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4 max-w-md px-6">
          {/* Spinner */}
          <div className="relative w-16 h-16 mx-auto">
            <div className="absolute inset-0 border-4 border-blue-200 dark:border-blue-800 rounded-full"></div>
            <div className="absolute inset-0 border-4 border-transparent border-t-blue-600 dark:border-t-blue-400 rounded-full animate-spin"></div>
          </div>

          {/* Text */}
          <div>
            <h2 className="text-xl font-semibold text-text-primary mb-2">Đang kiểm tra Database</h2>
            <p className="text-sm text-text-secondary">
              {migrationProgress || 'Hệ thống đang kiểm tra và cập nhật cấu trúc database...'}
            </p>
          </div>

          {/* Progress indicator */}
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1 overflow-hidden">
            <div className="h-full bg-blue-600 dark:bg-blue-400 animate-pulse w-2/3"></div>
          </div>
        </div>
      </div>
    )
  }

  // Hiển thị error screen nếu có lỗi
  if (migrationError) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4 max-w-md px-6">
          {/* Error icon */}
          <div className="w-16 h-16 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center mx-auto">
            <svg
              className="w-8 h-8 text-red-600 dark:text-red-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          </div>

          {/* Error text */}
          <div>
            <h2 className="text-xl font-semibold text-red-600 dark:text-red-400 mb-2">
              Lỗi Database
            </h2>
            <p className="text-sm text-text-secondary mb-4 whitespace-pre-wrap">{migrationError}</p>
          </div>

          {/* Retry button */}
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
          >
            Thử lại
          </button>
        </div>
      </div>
    )
  }

  return <DatabaseSchemaContext.Provider value={value}>{children}</DatabaseSchemaContext.Provider>
}
