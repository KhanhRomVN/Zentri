// src/renderer/src/presentation/pages/EmailManager/index.tsx
import { useState, useMemo, useCallback, useEffect } from 'react'
import { Mail } from 'lucide-react'
import DatabaseModal from './components/DatabaseModal'
import CreateEmailModal from './components/CreateEmailModal'
import EmailListPanel from './components/EmailListPanel'
import EmailDetailPanel, { TabType } from './components/EmailDetailPanel'
import TableManagerDrawer from './components/TableManagerDrawer'
import BulkImportDrawer from './components/EmailListPanel/components/BulkImportDrawer'
import { useDatabaseManager } from './hooks/useDatabaseManager'
import { Email, Email2FA, ServiceAccount, ServiceAccount2FA, ServiceAccountSecret } from './types'
import { databaseService } from './services/DatabaseService'

const EmailManagerPage = () => {
  const {
    // Database state
    currentDatabase,
    isLoading,
    showDatabaseModal,
    isDatabaseReady,

    // Email data
    emails,

    // Actions
    handleDatabaseSelected,
    loadEmails,
    createEmail,
    updateEmail,
    closeDatabase
  } = useDatabaseManager()

  // Local state
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedEmail, setSelectedEmail] = useState<Email | null>(null)
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [isCreatingEmail, setIsCreatingEmail] = useState(false)
  const [showTableManager, setShowTableManager] = useState(false)
  const [showBulkImport, setShowBulkImport] = useState(false)
  const [emailActiveTabs, setEmailActiveTabs] = useState<Record<string, TabType>>({})
  const [showCreateFormByEmail, setShowCreateFormByEmail] = useState<Record<string, boolean>>({})
  const [serviceFormDraftByEmail, setServiceFormDraftByEmail] = useState<Record<string, any>>({})

  // Related data for selected email
  const [email2FAMethods, setEmail2FAMethods] = useState<Email2FA[]>([])
  const [serviceAccounts, setServiceAccounts] = useState<ServiceAccount[]>([])
  const [allServiceAccounts, setAllServiceAccounts] = useState<ServiceAccount[]>([])
  const [allServiceAccountSecrets, setAllServiceAccountSecrets] = useState<ServiceAccountSecret[]>(
    []
  )
  const [selectedServiceAccount, setSelectedServiceAccount] = useState<ServiceAccount | null>(null)
  const [serviceAccount2FAMethods, setServiceAccount2FAMethods] = useState<ServiceAccount2FA[]>([])
  const [serviceAccountSecrets, setServiceAccountSecrets] = useState<ServiceAccountSecret[]>([])

  useEffect(() => {
    const loadAllServicesAndSecrets = async () => {
      if (!isDatabaseReady) return

      try {
        const [allServices, allSecrets] = await Promise.all([
          databaseService.getAllServiceAccounts(),
          databaseService.getAllServiceAccountSecrets()
        ])
        setAllServiceAccounts(allServices)
        setAllServiceAccountSecrets(allSecrets)
      } catch (error) {
        console.error('Failed to load all services and secrets:', error)
      }
    }

    loadAllServicesAndSecrets()
  }, [isDatabaseReady])

  useEffect(() => {
    if (selectedEmail?.id) {
      // Giữ lại draft data cho email hiện tại
      // Không cần làm gì ở đây vì draft data được quản lý theo email id
    }
  }, [selectedEmail?.id])

  useEffect(() => {
    return () => {
      // Cleanup: xóa tất cả draft data khi component unmount
      setServiceFormDraftByEmail({})
    }
  }, [])

  // Filters state
  const [filters, setFilters] = useState({
    email_address: '',
    provider: [] as string[],
    name: '',
    age: '',
    recovery_email: [] as string[],
    tags: [] as string[],
    email2FA: [] as string[],
    serviceAccount: [] as string[],
    service_type: [] as string[]
  })

  // Filter emails based on search and filters
  const filteredEmails = useMemo(() => {
    if (!isDatabaseReady || !emails) return []

    return emails.filter((email) => {
      // Search query filter
      const matchesSearch =
        searchQuery === '' ||
        email.email_address?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        email.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        email.email_provider?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        email.tags?.some((tag) => tag.toLowerCase().includes(searchQuery.toLowerCase()))

      // Email address filter
      const matchesEmailAddress =
        !filters.email_address ||
        email.email_address?.toLowerCase().includes(filters.email_address.toLowerCase())

      // Provider filter
      const matchesProvider =
        filters.provider.length === 0 ||
        (email.email_provider && filters.provider.includes(email.email_provider))

      // Name filter
      const matchesName =
        !filters.name || email.name?.toLowerCase().includes(filters.name.toLowerCase())

      // Age filter
      const matchesAge = !filters.age || email.age?.toString().includes(filters.age)

      // Recovery email filter
      const matchesRecoveryEmail =
        filters.recovery_email.length === 0 ||
        (email.recovery_email && filters.recovery_email.includes(email.recovery_email))

      // Tags filter
      const matchesTags =
        filters.tags.length === 0 ||
        (email.tags && email.tags.some((tag) => filters.tags.includes(tag)))

      // Email 2FA filter
      const matchesEmail2FA =
        filters.email2FA.length === 0 ||
        (email.id &&
          email2FAMethods.some(
            (method) =>
              method.email_id === email.id && filters.email2FA.includes(method.method_type)
          ))

      // Service Account filter - kiểm tra xem email có service account với service_type trong filters
      const matchesServiceType =
        filters.service_type.length === 0 ||
        (email.id &&
          serviceAccounts.some(
            (sa) => sa.email_id === email.id && filters.service_type.includes(sa.service_type)
          ))

      return (
        matchesSearch &&
        matchesEmailAddress &&
        matchesProvider &&
        matchesName &&
        matchesAge &&
        matchesRecoveryEmail &&
        matchesTags &&
        matchesEmail2FA &&
        matchesServiceType
      )
    })
  }, [emails, searchQuery, filters, isDatabaseReady, email2FAMethods, serviceAccounts])

  // Load related data for selected email
  // Load related data for selected email
  const loadEmailRelatedData = useCallback(
    async (emailId: string) => {
      if (!isDatabaseReady) return

      try {
        const [email2FA, services, allServices] = await Promise.all([
          databaseService.getEmail2FAByEmailId(emailId),
          databaseService.getServiceAccountsByEmailId(emailId),
          databaseService.getAllServiceAccounts()
        ])

        setEmail2FAMethods(email2FA)
        setServiceAccounts(services)
        setAllServiceAccounts(allServices)
      } catch (error) {
        console.error('Failed to load email related data:', error)
      }
    },
    [isDatabaseReady]
  )

  // Load service account related data
  const loadServiceAccountRelatedData = useCallback(
    async (serviceAccountId: string) => {
      if (!isDatabaseReady) return

      try {
        const [sa2FA, secrets] = await Promise.all([
          databaseService.getServiceAccount2FAByServiceId(serviceAccountId),
          databaseService.getServiceAccountSecretsByServiceId(serviceAccountId)
        ])

        setServiceAccount2FAMethods(sa2FA)
        setServiceAccountSecrets(secrets)
      } catch (error) {
        console.error('Failed to load service account related data:', error)
      }
    },
    [isDatabaseReady]
  )

  // Handle email selection
  const handleSelectEmail = useCallback(
    (email: Email) => {
      setSelectedEmail(email)
      setSelectedServiceAccount(null)
      if (email.id) {
        loadEmailRelatedData(email.id)
      }
    },
    [loadEmailRelatedData]
  )

  // Handle create email
  const handleCreateEmail = async (emailData: Omit<Email, 'id'>) => {
    try {
      setIsCreatingEmail(true)
      const newEmail = await createEmail(emailData)

      if (newEmail) {
        setIsCreateModalOpen(false)
        await loadEmails()
        handleSelectEmail(newEmail)
      }
    } catch (error) {
      console.error('Failed to create email:', error)
    } finally {
      setIsCreatingEmail(false)
    }
  }

  // Handle create new email button
  const handleCreateNewEmail = () => {
    if (isDatabaseReady && !isLoading) {
      setIsCreateModalOpen(true)
    }
  }

  const handleDeleteEmail = async (emailId: string): Promise<boolean> => {
    if (!isDatabaseReady) return false

    try {
      await databaseService.deleteEmail(emailId)
      await loadEmails()

      // Reset selected email nếu đang xem email bị xóa
      if (selectedEmail?.id === emailId) {
        setSelectedEmail(null)
      }

      return true
    } catch (error) {
      console.error('Failed to delete email:', error)
      return false
    }
  }

  // Handle close create modal
  const handleCloseCreateModal = () => {
    if (!isCreatingEmail) {
      setIsCreateModalOpen(false)
    }
  }

  // Auto-select first email if none selected
  useEffect(() => {
    if (isDatabaseReady && !selectedEmail && filteredEmails.length > 0) {
      handleSelectEmail(filteredEmails[0])
    }
  }, [isDatabaseReady, selectedEmail, filteredEmails, handleSelectEmail])

  // CRUD operations for Email2FA
  const handleAddEmail2FA = async (data: Omit<Email2FA, 'id'>) => {
    if (!isDatabaseReady || !selectedEmail?.id) return
    try {
      await databaseService.createEmail2FA(data)
      await loadEmailRelatedData(selectedEmail.id)
    } catch (error) {
      console.error('Failed to add email 2FA:', error)
      throw error
    }
  }

  const handleUpdateEmail2FA = async (id: string, updates: Partial<Email2FA>) => {
    if (!isDatabaseReady || !selectedEmail?.id) return
    try {
      await databaseService.updateEmail2FA(id, updates)
      await loadEmailRelatedData(selectedEmail.id)
    } catch (error) {
      console.error('Failed to update email 2FA:', error)
      throw error
    }
  }

  const handleDeleteEmail2FA = async (id: string) => {
    if (!isDatabaseReady || !selectedEmail?.id) return
    try {
      await databaseService.deleteEmail2FA(id)
      await loadEmailRelatedData(selectedEmail.id)
    } catch (error) {
      console.error('Failed to delete email 2FA:', error)
    }
  }

  const handleAddServiceAccount = async (data: Omit<ServiceAccount, 'id' | 'email_id'>) => {
    if (!isDatabaseReady || !selectedEmail?.id) return
    try {
      const serviceData = { ...data, email_id: selectedEmail.id }
      await databaseService.createServiceAccount(serviceData)
      await loadEmailRelatedData(selectedEmail.id)

      // Đóng form và xóa draft sau khi tạo thành công
      setShowCreateFormByEmail((prev) => ({
        ...prev,
        [selectedEmail.id!]: false
      }))

      // Xóa draft data sau khi submit thành công
      setServiceFormDraftByEmail((prev) => {
        const newDrafts = { ...prev }
        delete newDrafts[selectedEmail.id!]
        return newDrafts
      })
    } catch (error) {
      console.error('Failed to add service account:', error)
      throw error
    }
  }

  // Toggle create service form
  const handleToggleCreateServiceForm = (show: boolean) => {
    if (selectedEmail?.id) {
      setShowCreateFormByEmail((prev) => ({
        ...prev,
        [selectedEmail.id!]: show
      }))

      // Nếu đóng form, xóa draft data
      if (!show) {
        setServiceFormDraftByEmail((prev) => {
          const newDrafts = { ...prev }
          delete newDrafts[selectedEmail.id!]
          return newDrafts
        })
      }
    }
  }

  // Handler để lưu draft data khi form thay đổi
  const handleServiceFormDraftChange = (emailId: string, draftData: any) => {
    setServiceFormDraftByEmail((prev) => ({
      ...prev,
      [emailId]: draftData
    }))
  }

  const handleUpdateServiceAccount = async (
    serviceId: string,
    field: string,
    value: string
  ): Promise<boolean> => {
    if (!isDatabaseReady || !selectedEmail?.id) return false
    try {
      const updates: Partial<ServiceAccount> = { [field]: value }
      await databaseService.updateServiceAccount(serviceId, updates)
      await loadEmailRelatedData(selectedEmail.id)
      return true
    } catch (error) {
      console.error('Failed to update service account:', error)
      return false
    }
  }

  const handleServiceAccountClick = (
    service: ServiceAccount,
    targetTab?: 'service_security' | 'service_secret'
  ) => {
    setSelectedServiceAccount(service)
    if (service.id) {
      loadServiceAccountRelatedData(service.id)
    }

    // Chuyển đến tab được chỉ định, hoặc mặc định là 'services'
    if (selectedEmail?.id) {
      const newTab = targetTab || 'services'
      setEmailActiveTabs((prev) => ({
        ...prev,
        [selectedEmail.id!]: newTab
      }))
    }
  }

  const handleBackToServicesList = () => {
    setSelectedServiceAccount(null)
  }

  // CRUD operations for Service Account 2FA
  const handleAddServiceAccount2FA = async (data: Omit<ServiceAccount2FA, 'id'>) => {
    if (!isDatabaseReady || !selectedServiceAccount?.id) return
    try {
      await databaseService.createServiceAccount2FA(data)
      await loadServiceAccountRelatedData(selectedServiceAccount.id)
    } catch (error) {
      console.error('Failed to add service account 2FA:', error)
      throw error
    }
  }

  const handleUpdateServiceAccount2FA = async (id: string, updates: Partial<ServiceAccount2FA>) => {
    if (!isDatabaseReady || !selectedServiceAccount?.id) return
    try {
      await databaseService.updateServiceAccount2FA(id, updates)
      await loadServiceAccountRelatedData(selectedServiceAccount.id)
    } catch (error) {
      console.error('Failed to update service account 2FA:', error)
      throw error
    }
  }

  const handleDeleteServiceAccount2FA = async (id: string) => {
    if (!isDatabaseReady || !selectedServiceAccount?.id) return
    try {
      await databaseService.deleteServiceAccount2FA(id)
      await loadServiceAccountRelatedData(selectedServiceAccount.id)
    } catch (error) {
      console.error('Failed to delete service account 2FA:', error)
    }
  }

  // CRUD operations for Service Account Secrets
  const handleAddServiceAccountSecret = async (data: Omit<ServiceAccountSecret, 'id'>) => {
    if (!isDatabaseReady || !selectedServiceAccount?.id) return
    try {
      await databaseService.createServiceAccountSecret(data)
      await loadServiceAccountRelatedData(selectedServiceAccount.id)
    } catch (error) {
      console.error('Failed to add service account secret:', error)
      throw error
    }
  }

  const handleUpdateServiceAccountSecret = async (
    id: string,
    updates: Partial<ServiceAccountSecret>
  ) => {
    if (!isDatabaseReady || !selectedServiceAccount?.id) return
    try {
      await databaseService.updateServiceAccountSecret(id, updates)
      await loadServiceAccountRelatedData(selectedServiceAccount.id)
    } catch (error) {
      console.error('Failed to update service account secret:', error)
    }
  }

  const handleDeleteServiceAccountSecret = async (id: string) => {
    if (!isDatabaseReady || !selectedServiceAccount?.id) return
    try {
      await databaseService.deleteServiceAccountSecret(id)
      await loadServiceAccountRelatedData(selectedServiceAccount.id)
    } catch (error) {
      console.error('Failed to delete service account secret:', error)
    }
  }

  // Handle bulk create emails
  const handleBulkCreateEmails = async (emails: Omit<Email, 'id'>[]) => {
    if (!isDatabaseReady) return

    try {
      const createdEmails: Email[] = []

      for (const emailData of emails) {
        const newEmail = await createEmail(emailData)
        if (newEmail) {
          createdEmails.push(newEmail)
        }
      }

      await loadEmails()

      // Select first created email
      if (createdEmails.length > 0) {
        handleSelectEmail(createdEmails[0])
      }
    } catch (error) {
      console.error('Failed to bulk create emails:', error)
      throw error
    }
  }

  // If database modal should be shown, render only the modal
  if (showDatabaseModal) {
    return <DatabaseModal onDatabaseSelected={handleDatabaseSelected} />
  }

  return (
    <div className="h-screen bg-background overflow-hidden">
      <div className="w-full h-full flex">
        {/* Left Panel - Email List */}
        <div className="flex-shrink-0 h-screen overflow-hidden">
          <EmailListPanel
            emails={filteredEmails}
            serviceAccounts={serviceAccounts}
            email2FAMethods={email2FAMethods}
            selectedEmail={selectedEmail}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            onSelectEmail={handleSelectEmail}
            onCreateNewEmail={handleCreateNewEmail}
            onShowTableManager={() => setShowTableManager(true)}
            onShowBulkImport={() => setShowBulkImport(true)}
            filters={filters}
            onFiltersChange={setFilters}
            isLoading={isLoading}
          />
        </div>

        {/* Right Panel - Email Details */}
        <div className="flex-1 min-w-0 min-h-0 overflow-hidden">
          <div className="h-full flex flex-col min-h-0">
            {/* Content */}
            <div className="flex-1 overflow-hidden">
              {selectedEmail ? (
                <EmailDetailPanel
                  email={selectedEmail}
                  email2FAMethods={email2FAMethods}
                  serviceAccounts={serviceAccounts}
                  serviceAccount2FAMethods={serviceAccount2FAMethods}
                  serviceAccountSecrets={serviceAccountSecrets}
                  allServiceAccounts={allServiceAccounts}
                  selectedServiceAccount={selectedServiceAccount}
                  currentDatabase={currentDatabase}
                  onCloseDatabase={closeDatabase}
                  activeTab={emailActiveTabs[selectedEmail.id || ''] || 'overview'}
                  allServiceAccountSecrets={allServiceAccountSecrets}
                  onTabChange={(tab) => {
                    if (selectedEmail.id) {
                      setEmailActiveTabs((prev) => ({
                        ...prev,
                        [selectedEmail.id!]: tab
                      }))
                    }
                  }}
                  showCreateServiceForm={showCreateFormByEmail[selectedEmail.id || ''] || false}
                  onToggleCreateServiceForm={handleToggleCreateServiceForm}
                  serviceFormDraft={serviceFormDraftByEmail[selectedEmail.id || '']}
                  onServiceFormDraftChange={(draftData) => {
                    if (selectedEmail.id) {
                      handleServiceFormDraftChange(selectedEmail.id, draftData)
                    }
                  }}
                  onUpdateEmail={async (id: string, updates: Partial<Email>) => {
                    const success = await updateEmail(id, updates)

                    if (success && selectedEmail?.id === id) {
                      setSelectedEmail((prev) => (prev ? { ...prev, ...updates } : null))
                    }

                    return success
                  }}
                  onDeleteEmail={handleDeleteEmail}
                  onAdd2FA={handleAddEmail2FA}
                  onUpdate2FA={handleUpdateEmail2FA}
                  onDelete2FA={handleDeleteEmail2FA}
                  onServiceAdd={handleAddServiceAccount}
                  onServiceClick={handleServiceAccountClick}
                  onServiceUpdate={handleUpdateServiceAccount}
                  onAddServiceAccount2FA={handleAddServiceAccount2FA}
                  onUpdateServiceAccount2FA={handleUpdateServiceAccount2FA}
                  onDeleteServiceAccount2FA={handleDeleteServiceAccount2FA}
                  onAddServiceAccountSecret={handleAddServiceAccountSecret}
                  onUpdateServiceAccountSecret={handleUpdateServiceAccountSecret}
                  onDeleteServiceAccountSecret={handleDeleteServiceAccountSecret}
                  onBackToList={handleBackToServicesList}
                />
              ) : (
                <div className="h-full flex items-center justify-center">
                  <div className="text-center space-y-4">
                    <Mail className="h-16 w-16 text-gray-300 dark:text-gray-600 mx-auto" />
                    <div>
                      <p className="text-lg font-medium text-text-primary">No Email Selected</p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        Select an email from the list to view details
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Create Email Modal */}
      <CreateEmailModal
        isOpen={isCreateModalOpen}
        onClose={handleCloseCreateModal}
        onSubmit={handleCreateEmail}
        loading={isCreatingEmail}
      />

      {/* Table Manager Drawer */}
      <TableManagerDrawer
        isOpen={showTableManager}
        onClose={() => setShowTableManager(false)}
        emails={emails}
        serviceAccounts={serviceAccounts}
        email2FAMethods={email2FAMethods}
        serviceAccount2FAMethods={serviceAccount2FAMethods}
        serviceAccountSecrets={serviceAccountSecrets}
      />

      {/* Bulk Import Drawer */}
      <BulkImportDrawer
        isOpen={showBulkImport}
        onClose={() => setShowBulkImport(false)}
        onBulkCreate={handleBulkCreateEmails}
      />
    </div>
  )
}

export default EmailManagerPage
