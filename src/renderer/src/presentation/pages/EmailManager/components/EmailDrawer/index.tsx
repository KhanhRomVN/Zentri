// src/renderer/src/presentation/pages/EmailManager/components/EmailDrawer.tsx
import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import CustomDrawer from '../../../../../components/common/CustomDrawer'
import CustomBreadcrumb, { BreadcrumbItem } from '../../../../../components/common/CustomBreadcrumb'
import CustomButton from '../../../../../components/common/CustomButton'
import EmailSection from './Email/EmailSection'
import Email2FASection from './Email/Email2FASection'
import ServiceAccountList from './ServiceAccount/ServiceAccountList'
import ServiceAccountSection from './ServiceAccount/ServiceAccountSection'
import ServiceAccount2FASection from './ServiceAccount/ServiceAccount2FASection'
import { ArrowLeft, X } from 'lucide-react'
import {
  Email,
  ServiceAccount,
  Email2FA,
  ServiceAccount2FA,
  ServiceAccountSecret
} from '../../types'
import { databaseService } from '../../services/DatabaseService'
import ServiceAccountSecretSection from './ServiceAccount/ServiceAccountSecretSection'

interface EmailDrawerProps {
  isOpen: boolean
  onClose: () => void
  email?: Email | null
  onUpdateEmail?: (id: string, updates: Partial<Email>) => Promise<boolean>
}

type ViewType = 'email' | 'services' | '2fa' | 'service_detail'

const EmailDrawer: React.FC<EmailDrawerProps> = ({ isOpen, onClose, email, onUpdateEmail }) => {
  const [currentView, setCurrentView] = useState<ViewType>('email')
  const [selectedService, setSelectedService] = useState<ServiceAccount | null>(null)
  const [loading, setLoading] = useState(false)

  // Data states
  const [emailServiceAccounts, setEmailServiceAccounts] = useState<ServiceAccount[]>([])
  const [email2FAMethods, setEmail2FAMethods] = useState<Email2FA[]>([])
  const [selectedServiceSecrets, setSelectedServiceSecrets] = useState<ServiceAccountSecret[]>([])
  const [selectedService2FA, setSelectedService2FA] = useState<ServiceAccount2FA[]>([])

  // Reset view when drawer opens/closes
  useEffect(() => {
    if (isOpen) {
      setCurrentView('email')
      setSelectedService(null)
      loadEmailData()
    }
  }, [isOpen, email?.id])

  // Load related data for this email
  const loadEmailData = async () => {
    if (!email?.id) return

    try {
      setLoading(true)

      // Load service accounts and 2FA methods in parallel
      const [serviceAccounts, email2FA] = await Promise.all([
        databaseService.getServiceAccountsByEmailId(email.id),
        databaseService.getEmail2FAByEmailId(email.id)
      ])

      setEmailServiceAccounts(serviceAccounts)
      setEmail2FAMethods(email2FA)
    } catch (error) {
      console.error('Error loading email data:', error)
    } finally {
      setLoading(false)
    }
  }

  // Load service-specific data when viewing service details
  const loadServiceData = async (service: ServiceAccount) => {
    try {
      setLoading(true)

      // Load service secrets and 2FA in parallel
      const [secrets, service2FA] = await Promise.all([
        databaseService.getServiceAccountSecretsByServiceId(service.id),
        databaseService.getServiceAccount2FAByServiceId(service.id)
      ])

      setSelectedServiceSecrets(secrets)
      setSelectedService2FA(service2FA)
    } catch (error) {
      console.error('Error loading service data:', error)
    } finally {
      setLoading(false)
    }
  }

  // Utility function to get email provider icon
  const getEmailProviderIcon = (provider: string): string => {
    const iconMap: Record<string, string> = {
      gmail: '/src/renderer/src/assets/icon/gmail_icon.png',
      yahoo: '/src/renderer/src/assets/icon/yahoo_icon.png',
      outlook: '/src/renderer/src/assets/icon/outlook_icon.png',
      icloud: '/src/renderer/src/assets/icon/icloud_icon.png'
    }
    return iconMap[provider] || iconMap.gmail
  }

  // Create breadcrumb items based on current view
  const getBreadcrumbItems = (): BreadcrumbItem[] => {
    if (!email) return []

    const emailProviderIcon = getEmailProviderIcon(email.email_provider)

    const baseItems: BreadcrumbItem[] = [
      {
        label: email.email_address,
        icon: ({ className }) => (
          <img
            src={emailProviderIcon}
            alt={email.email_provider}
            className={className}
            style={{ width: '16px', height: '16px' }}
          />
        ),
        onClick: () => setCurrentView('email')
      }
    ]

    if (currentView === 'service_detail' && selectedService) {
      baseItems.push({
        label: 'Services',
        onClick: () => setCurrentView('services')
      })
      baseItems.push({
        label: `${selectedService.service_name}`,
        isCurrentPage: true
      })
    } else if (currentView !== 'email') {
      const viewLabels = {
        services: 'Services',
        '2fa': '2FA Authentication'
      }

      baseItems.push({
        label: viewLabels[currentView as keyof typeof viewLabels] || currentView,
        isCurrentPage: true
      })
    }

    return baseItems
  }

  const getHeaderActions = () => {
    if (currentView !== 'email') {
      return (
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3 }}
        >
          <CustomButton
            variant="ghost"
            size="sm"
            onClick={() => {
              if (selectedService && currentView === 'service_detail') {
                setSelectedService(null)
                setCurrentView('email')
              } else {
                setCurrentView('email')
              }
            }}
            icon={ArrowLeft}
          >
            Back
          </CustomButton>
        </motion.div>
      )
    }
    return null
  }

  const handleAdd2FA = async (data: Omit<Email2FA, 'id'>) => {
    try {
      console.log('Adding 2FA method:', data)

      // Call the database service to create the 2FA method
      const newMethod = await databaseService.createEmail2FA(data)

      console.log('2FA method created:', newMethod)

      // Refresh the 2FA methods list
      const updated2FA = await databaseService.getEmail2FAByEmailId(email!.id!)
      setEmail2FAMethods(updated2FA)
    } catch (error) {
      console.error('Error adding 2FA method:', error)
      throw error // Re-throw so the form can handle the error
    }
  }

  // Handle editing 2FA method
  const handleEdit2FA = async (method: Email2FA) => {
    console.log('Edit 2FA method:', method)
    // You can implement a modal or inline editing here
  }

  // Handle ServiceAccount2FA operations
  const handleAddService2FA = async (data: Omit<ServiceAccount2FA, 'id'>) => {
    try {
      console.log('Adding ServiceAccount 2FA method:', data)

      // Gọi database service để tạo ServiceAccount2FA
      const newMethod = await databaseService.createServiceAccount2FA(data)

      console.log('ServiceAccount 2FA method created:', newMethod)

      // Refresh danh sách ServiceAccount2FA cho service hiện tại
      if (selectedService) {
        const updated2FA = await databaseService.getServiceAccount2FAByServiceId(selectedService.id)
        setSelectedService2FA(updated2FA)
      }
    } catch (error) {
      console.error('Error adding ServiceAccount 2FA method:', error)
      throw error // Re-throw để form có thể handle error
    }
  }

  const handleEditService2FA = async (method: ServiceAccount2FA) => {
    console.log('Edit ServiceAccount 2FA method:', method)
    // Implement edit logic sau
  }

  const handleDeleteService2FA = async (methodId: string) => {
    try {
      console.log('Deleting ServiceAccount 2FA method:', methodId)

      await databaseService.deleteServiceAccount2FA(methodId)

      // Refresh danh sách ServiceAccount2FA
      if (selectedService) {
        const updated2FA = await databaseService.getServiceAccount2FAByServiceId(selectedService.id)
        setSelectedService2FA(updated2FA)
      }
    } catch (error) {
      console.error('Error deleting ServiceAccount 2FA method:', error)
    }
  }

  const handleSaveService2FA = async (id: string, updates: Partial<ServiceAccount2FA>) => {
    try {
      console.log('Saving ServiceAccount 2FA method:', id, updates)

      await databaseService.updateServiceAccount2FA(id, updates)

      // Refresh danh sách ServiceAccount2FA
      if (selectedService) {
        const updated2FA = await databaseService.getServiceAccount2FAByServiceId(selectedService.id)
        setSelectedService2FA(updated2FA)
      }
    } catch (error) {
      console.error('Error saving ServiceAccount 2FA method:', error)
    }
  }

  const handleServiceUpdate = async (
    serviceId: string,
    field: string,
    value: string
  ): Promise<boolean> => {
    try {
      console.log('Updating service:', serviceId, field, value)

      // Tạo object updates dựa trên field
      const updates: Partial<ServiceAccount> = {}

      switch (field) {
        case 'service_name':
          updates.service_name = value
          break
        case 'service_url':
          updates.service_url = value
          break
        case 'username':
          updates.username = value
          break
        case 'name':
          updates.name = value
          break
        case 'password':
          updates.password = value
          break
        case 'note':
          updates.note = value
          break
        case 'metadata':
          try {
            // Parse JSON để kiểm tra tính hợp lệ
            JSON.parse(value)
            updates.metadata = JSON.parse(value)
          } catch (parseError) {
            console.error('Invalid metadata JSON:', parseError)
            return false
          }
          break
        default:
          console.warn('Unknown field:', field)
          return false
      }

      // Gọi database service để update
      await databaseService.updateServiceAccount(serviceId, updates)

      // Refresh danh sách service accounts
      if (email?.id) {
        const updatedServices = await databaseService.getServiceAccountsByEmailId(email.id)
        setEmailServiceAccounts(updatedServices)
      }

      console.log('Service updated successfully')
      return true
    } catch (error) {
      console.error('Error updating service:', error)
      return false
    }
  }

  // Handle deleting 2FA method
  const handleDelete2FA = async (methodId: string) => {
    try {
      console.log('Deleting 2FA method:', methodId)

      await databaseService.deleteEmail2FA(methodId)

      // Refresh the 2FA methods list
      const updated2FA = await databaseService.getEmail2FAByEmailId(email!.id!)
      setEmail2FAMethods(updated2FA)
    } catch (error) {
      console.error('Error deleting 2FA method:', error)
    }
  }

  const handleSecretChange = async (secretId: string, updatedSecret: ServiceAccountSecret) => {
    try {
      await databaseService.updateServiceAccountSecret(secretId, {
        expire_at: updatedSecret.expire_at,
        secret: updatedSecret.secret,
        secret_name: updatedSecret.secret_name
      })
      // Refresh secrets list
      if (selectedService) {
        const updatedSecrets = await databaseService.getServiceAccountSecretsByServiceId(
          selectedService.id
        )
        setSelectedServiceSecrets(updatedSecrets)
      }
    } catch (error) {
      console.error('Error updating secret:', error)
    }
  }

  const handleDeleteSecret = async (secretId: string) => {
    try {
      console.log('Deleting secret:', secretId)

      // Cần thêm method deleteServiceAccountSecret vào DatabaseService
      await databaseService.deleteServiceAccountSecret(secretId)

      // Refresh secrets list
      if (selectedService) {
        const updatedSecrets = await databaseService.getServiceAccountSecretsByServiceId(
          selectedService.id
        )
        setSelectedServiceSecrets(updatedSecrets)
      }
    } catch (error) {
      console.error('Error deleting secret:', error)
    }
  }

  const handleAddSecret = async (secretData: Omit<ServiceAccountSecret, 'id'>) => {
    if (!selectedService) return

    try {
      console.log('Adding new secret for service:', selectedService.id)
      console.log('Secret data to create:', secretData)

      // Tạo secret mới trong database với cấu trúc secret mới
      const newSecret = await databaseService.createServiceAccountSecret({
        service_account_id: selectedService.id,
        secret_name: secretData.secret_name,
        secret: secretData.secret || { secret_name: secretData.secret_name },
        expire_at: secretData.expire_at
      })

      console.log('New secret created successfully:', newSecret)

      console.log('Secret created:', newSecret)

      // Refresh secrets list
      const updatedSecrets = await databaseService.getServiceAccountSecretsByServiceId(
        selectedService.id
      )
      setSelectedServiceSecrets(updatedSecrets)
    } catch (error) {
      console.error('Error adding secret:', error)
      throw error // Re-throw để form có thể handle error
    }
  }

  // Handle service click to navigate to service detail view
  const handleServiceClick = async (service: ServiceAccount) => {
    setSelectedService(service)
    setCurrentView('service_detail')
    await loadServiceData(service)
  }

  // THÊM: Handle service add
  const handleServiceAdd = async (serviceData: Omit<ServiceAccount, 'id' | 'email_id'>) => {
    if (!email?.id) return

    try {
      setLoading(true)

      // Create service account in database
      const newService = await databaseService.createServiceAccount({
        ...serviceData,
        email_id: email.id
      })

      console.log('Service account created:', newService)

      // Refresh service accounts list
      const updatedServices = await databaseService.getServiceAccountsByEmailId(email.id)
      setEmailServiceAccounts(updatedServices)
    } catch (error) {
      console.error('Error creating service account:', error)
      throw error
    } finally {
      setLoading(false)
    }
  }

  if (!email) return null

  return (
    <CustomDrawer
      isOpen={isOpen}
      onClose={onClose}
      size="md"
      direction="right"
      animationType="elastic"
      enableBlur={true}
      className="shadow-2xl"
      hideHeader={true}
    >
      {/* Override container to fix scroll */}
      <div className="flex flex-col h-full" style={{ height: '100vh' }}>
        {/* Custom Header với Breadcrumb */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.4 }}
          className="flex-shrink-0 px-6 py-4 border-b border-border bg-card-background"
        >
          <div className="flex items-center justify-between">
            <div className="flex-1 min-w-0 mr-4">
              <CustomBreadcrumb
                items={getBreadcrumbItems()}
                showHomeIcon={false}
                className="text-text-primary"
              />
            </div>
            <div className="flex items-center gap-2">
              {getHeaderActions()}
              <motion.button
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                transition={{ delay: 0.4, duration: 0.3 }}
                onClick={onClose}
                className="p-2 text-text-secondary hover:text-text-primary hover:bg-background rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-primary/20"
              >
                <X className="h-5 w-5" />
              </motion.button>
            </div>
          </div>
        </motion.div>

        {/* Main Content - Fixed Scroll Container */}
        <div
          className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden"
          style={{ flex: '1 1 0%', minHeight: 0 }}
        >
          <AnimatePresence mode="wait">
            {/* Email View */}
            {currentView === 'email' && (
              <motion.div
                key="email-view"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
                className="p-4 space-y-6 pb-8"
              >
                {loading && (
                  <div className="flex items-center justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                  </div>
                )}

                {/* Email Information Section */}
                <EmailSection
                  email={email}
                  onServiceClick={() => setCurrentView('services')}
                  serviceAccounts={emailServiceAccounts}
                  onUpdateEmail={onUpdateEmail}
                />

                {/* Two-Factor Authentication Section */}
                <Email2FASection
                  email={email}
                  email2FAMethods={email2FAMethods}
                  onAdd2FA={handleAdd2FA}
                  onEdit2FA={handleEdit2FA}
                  onDelete2FA={handleDelete2FA}
                />

                {/* Service Accounts Section - THÊM email prop */}
                <ServiceAccountList
                  services={emailServiceAccounts}
                  emailAddress={email.email_address}
                  email={email}
                  onServiceAdd={handleServiceAdd}
                  onServiceClick={handleServiceClick}
                  onServiceUpdate={handleServiceUpdate}
                  compact={true}
                  showViewDetailsButton={true}
                />
              </motion.div>
            )}

            {/* Service Detail View */}
            {currentView === 'service_detail' && selectedService && (
              <motion.div
                key="service-detail-view"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
                className="p-4 space-y-6 pb-8"
              >
                {loading && (
                  <div className="flex items-center justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                  </div>
                )}

                {/* Service Account Section */}
                <ServiceAccountSection serviceAccount={selectedService} />

                {/* Service Account 2FA Section */}
                <ServiceAccount2FASection
                  serviceAccount={selectedService}
                  serviceAccount2FAMethods={selectedService2FA}
                  onAdd2FA={handleAddService2FA}
                  onEdit2FA={handleEditService2FA}
                  onDelete2FA={handleDeleteService2FA}
                  onSave2FA={handleSaveService2FA}
                />

                <ServiceAccountSecretSection
                  serviceAccount={selectedService}
                  secrets={selectedServiceSecrets}
                  onAddSecret={handleAddSecret}
                  onSecretChange={handleSecretChange}
                  onDeleteSecret={handleDeleteSecret}
                  loading={loading}
                  error={undefined}
                />
              </motion.div>
            )}

            {currentView === 'services' && (
              <motion.div
                key="services-view"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
                className="p-4 space-y-6 pb-8"
              >
                <ServiceAccountList
                  services={emailServiceAccounts}
                  emailAddress={email.email_address}
                  email={email}
                  onServiceAdd={handleServiceAdd}
                  onServiceClick={handleServiceClick}
                  onServiceUpdate={handleServiceUpdate}
                  compact={false}
                  showViewDetailsButton={true}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </CustomDrawer>
  )
}

export default EmailDrawer
