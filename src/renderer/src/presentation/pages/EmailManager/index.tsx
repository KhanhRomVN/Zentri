// src/renderer/src/presentation/pages/EmailManager/index.tsx
import { useState, useMemo } from 'react'
import CustomBreadcrumb, { BreadcrumbItem } from '../../../components/common/CustomBreadcrumb'
import CustomButton from '../../../components/common/CustomButton'
import EmailDrawer from './components/EmailDrawer'
import EmailTable from './components/EmailTable'
import DatabaseModal from './components/DatabaseModal'
import CreateEmailModal from './components/CreateEmailModal'
import { Plus, Mail, Database, X, AlertCircle } from 'lucide-react'
import { useDatabaseManager } from './hooks/useDatabaseManager'
import { Email } from './types'
import { databaseService } from './services/DatabaseService'

const EmailManagerPage = () => {
  const {
    // State
    currentDatabase,
    isLoading,
    error,
    emails,
    showDatabaseModal,
    isDatabaseReady,

    // Actions
    handleDatabaseSelected,
    loadEmails,
    closeDatabase,
    clearError,
    createEmail,
    updateEmail
  } = useDatabaseManager()

  const [searchTerm] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [selectedEmail, setSelectedEmail] = useState<Email | null>(null)
  const [isDrawerOpen, setIsDrawerOpen] = useState(false)

  const [isMigrating, setIsMigrating] = useState(false)
  // Create Email Modal state
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [isCreatingEmail, setIsCreatingEmail] = useState(false)

  const pageSize = 10

  // Breadcrumb items
  const breadcrumbItems: BreadcrumbItem[] = [
    {
      label: 'Dashboard',
      href: '/',
      icon: Mail
    },
    {
      label: 'Email Manager',
      isCurrentPage: true
    }
  ]

  // Filter data based on search
  const filteredData = useMemo(() => {
    if (!isDatabaseReady) return []

    return emails.filter(
      (item) =>
        item.email_address.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.email_provider.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (item.tags && item.tags.some((tag) => tag.toLowerCase().includes(searchTerm.toLowerCase())))
    )
  }, [emails, searchTerm, isDatabaseReady])

  const handleMigration = async () => {
    if (!isDatabaseReady) return

    try {
      setIsMigrating(true)

      // Gọi migration method
      await databaseService.migrateDatabaseTables()

      // Refresh data sau khi migration
      await loadEmails()

      // Hiển thị thông báo thành công (có thể thay bằng toast notification)
      alert('Migration completed successfully! Database has been updated.')
    } catch (error) {
      console.error('[MIGRATION ERROR]', error)
      alert(`Migration failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setIsMigrating(false)
    }
  }

  // Handle row click to open drawer
  const handleRowClick = (email: Email) => {
    setSelectedEmail(email)
    setIsDrawerOpen(true)
  }

  // Handle drawer close
  const handleCloseDrawer = () => {
    setIsDrawerOpen(false)
    setSelectedEmail(null)
  }

  // Handle refresh
  const handleRefresh = async () => {
    if (isDatabaseReady) {
      await loadEmails()
    }
  }

  // Handle create email
  const handleCreateEmail = async (emailData: Omit<Email, 'id'>) => {
    try {
      setIsCreatingEmail(true)

      const newEmail = await createEmail(emailData)

      if (newEmail) {
        setIsCreateModalOpen(false)
        await loadEmails()
      }
    } catch (error) {
      console.error('Failed to create email:', error)
      // Optionally show error notification here
    } finally {
      setIsCreatingEmail(false)
    }
  }

  // Handle open create modal
  const handleOpenCreateModal = () => {
    if (isDatabaseReady && !isLoading) {
      setIsCreateModalOpen(true)
    }
  }

  // Handle close create modal
  const handleCloseCreateModal = () => {
    if (!isCreatingEmail) {
      setIsCreateModalOpen(false)
    }
  }

  // If database modal should be shown, render only the modal
  if (showDatabaseModal) {
    return <DatabaseModal onDatabaseSelected={handleDatabaseSelected} />
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Full width container */}
      <div className="w-full h-full flex flex-col">
        {/* Header Section */}
        <div className="flex-none px-2 py-4">
          <div className="space-y-4">
            {/* Breadcrumb */}
            <CustomBreadcrumb items={breadcrumbItems} className="text-text-secondary" />

            {/* Title and Actions */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h1 className="text-3xl font-bold text-text-primary">Email Manager</h1>
                  {currentDatabase && (
                    <div className="flex items-center gap-2 px-3 py-1 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700 rounded-full">
                      <Database className="h-4 w-4 text-green-600 dark:text-green-400" />
                      <span className="text-sm font-medium text-green-700 dark:text-green-300">
                        {currentDatabase.name}
                      </span>
                      <button
                        onClick={closeDatabase}
                        className="p-0.5 hover:bg-green-100 dark:hover:bg-green-800 rounded-full transition-colors"
                        title="Close database"
                      >
                        <X className="h-3 w-3 text-green-600 dark:text-green-400" />
                      </button>
                    </div>
                  )}
                </div>
                <p className="text-text-secondary">
                  {isDatabaseReady
                    ? `Manage your email accounts and services • ${emails.length} email${emails.length !== 1 ? 's' : ''} total`
                    : 'Loading database...'}
                </p>
              </div>

              <div className="flex items-center gap-3">
                <CustomButton
                  variant="secondary"
                  size="md"
                  onClick={handleRefresh}
                  disabled={!isDatabaseReady || isLoading}
                  className="min-w-[100px]"
                >
                  Refresh
                </CustomButton>
                <CustomButton
                  variant="warning"
                  size="md"
                  icon={Database}
                  onClick={handleMigration}
                  disabled={!isDatabaseReady || isLoading || isMigrating}
                  loading={isMigrating}
                  className="min-w-[120px] bg-orange-600 hover:bg-orange-700 text-white"
                >
                  Migration
                </CustomButton>
                <CustomButton
                  variant="primary"
                  size="md"
                  icon={Plus}
                  onClick={handleOpenCreateModal}
                  disabled={!isDatabaseReady || isLoading}
                  className="bg-[#52aaa5] hover:bg-[#52aaa5]/90 min-w-[120px]"
                >
                  Thêm Email
                </CustomButton>
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-lg p-4 flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400 mt-0.5 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <h4 className="text-sm font-semibold text-red-800 dark:text-red-300 mb-1">
                    Database Error
                  </h4>
                  <p className="text-sm text-red-700 dark:text-red-400">{error}</p>
                  <button
                    onClick={clearError}
                    className="text-xs text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 mt-2 underline"
                  >
                    Dismiss
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Table Section - Full Width */}
        <div className="flex-1 p-2">
          <div className="h-full">
            {isDatabaseReady ? (
              <EmailTable
                data={emails}
                loading={isLoading}
                currentPage={currentPage}
                pageSize={pageSize}
                onPageChange={setCurrentPage}
                onRowClick={handleRowClick}
                filteredData={filteredData}
              />
            ) : (
              <div className="h-full flex items-center justify-center">
                <div className="text-center space-y-4">
                  <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-2xl flex items-center justify-center mx-auto">
                    <Database className="h-8 w-8 text-gray-400" />
                  </div>
                  <div>
                    <p className="text-lg font-medium text-text-primary">
                      {isLoading ? 'Loading Database...' : 'No Database Selected'}
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {isLoading
                        ? 'Please wait while we load your email data'
                        : 'Please select a database to continue'}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Email Details Drawer */}
        {isDatabaseReady && (
          <EmailDrawer
            isOpen={isDrawerOpen}
            onClose={handleCloseDrawer}
            email={selectedEmail}
            onUpdateEmail={updateEmail}
          />
        )}

        {/* Create Email Modal */}
        <CreateEmailModal
          isOpen={isCreateModalOpen}
          onClose={handleCloseCreateModal}
          onSubmit={handleCreateEmail}
          loading={isCreatingEmail}
        />
      </div>
    </div>
  )
}

export default EmailManagerPage
