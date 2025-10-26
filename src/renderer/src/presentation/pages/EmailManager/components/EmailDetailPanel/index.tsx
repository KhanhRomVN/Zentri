// src/renderer/src/presentation/pages/EmailManager/components/EmailDetailPanel/index.tsx
import React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Globe, Shield, Key, User, Trash2, Database, X } from 'lucide-react'
import {
  Email,
  Email2FA,
  ServiceAccount,
  ServiceAccount2FA,
  ServiceAccountSecret
} from '../../types'
import CustomButton from '../../../../../components/common/CustomButton'
import EmailSection from './components/Email/EmailSection'
import Email2FASection from './components/Email/Email2FASection'
import ServiceAccountSection from './components/ServiceAccount/section/ServiceAccountSection'
import ServiceAccount2FASection from './components/ServiceAccount/section/ServiceAccount2FASection'
import ServiceAccountSecretSection from './components/ServiceAccount/section/ServiceAccountSecretSection'

interface EmailDetailPanelProps {
  email: Email
  email2FAMethods: Email2FA[]
  serviceAccounts: ServiceAccount[]
  serviceAccount2FAMethods: ServiceAccount2FA[]
  serviceAccountSecrets: ServiceAccountSecret[]
  selectedServiceAccount: ServiceAccount | null
  allServiceAccountSecrets: ServiceAccountSecret[]
  allServiceAccounts: ServiceAccount[]
  currentDatabase?: { path: string } | null
  onCloseDatabase?: () => void
  activeTab?: TabType
  onTabChange?: (tab: TabType) => void
  showCreateServiceForm?: boolean
  onToggleCreateServiceForm?: (show: boolean) => void
  serviceFormDraft?: any
  onServiceFormDraftChange?: (draftData: any) => void
  onUpdateEmail?: (id: string, updates: Partial<Email>) => Promise<boolean>
  onDeleteEmail?: (id: string) => Promise<boolean>
  onAdd2FA?: (data: Omit<Email2FA, 'id'>) => Promise<void>
  onUpdate2FA?: (id: string, updates: Partial<Email2FA>) => Promise<void>
  onDelete2FA?: (id: string) => void
  onServiceAdd?: (service: Omit<ServiceAccount, 'id' | 'email_id'>) => void
  onServiceClick?: (
    service: ServiceAccount,
    targetTab?: 'service_security' | 'service_secret'
  ) => void
  onServiceUpdate?: (serviceId: string, field: string, value: string) => Promise<boolean>
  onAddServiceAccount2FA?: (data: Omit<ServiceAccount2FA, 'id'>) => Promise<void>
  onUpdateServiceAccount2FA?: (id: string, updates: Partial<ServiceAccount2FA>) => Promise<void>
  onDeleteServiceAccount2FA?: (id: string) => void
  onAddServiceAccountSecret?: (data: Omit<ServiceAccountSecret, 'id'>) => Promise<void>
  onUpdateServiceAccountSecret?: (id: string, updates: Partial<ServiceAccountSecret>) => void
  onDeleteServiceAccountSecret?: (id: string) => void
  onBackToList?: () => void
}

export type TabType = 'overview' | 'services' | 'security' | 'service_security' | 'service_secret'

interface TabConfig {
  id: TabType
  label: string
  icon: React.ComponentType<{ className?: string }>
  description: string
  color: string
  activeColor: string
}

const TABS: TabConfig[] = [
  {
    id: 'overview',
    label: 'Email Information',
    icon: User,
    description: 'Personal information and contact details',
    color: 'text-blue-600 dark:text-blue-400',
    activeColor: 'border-blue-600 dark:border-blue-400'
  },
  {
    id: 'security',
    label: 'Email Security',
    icon: Shield,
    description: 'Two-factor authentication and security settings',
    color: 'text-green-600 dark:text-green-400',
    activeColor: 'border-green-600 dark:border-green-400'
  },
  {
    id: 'services',
    label: 'Services',
    icon: Globe,
    description: 'Connected service accounts',
    color: 'text-purple-600 dark:text-purple-400',
    activeColor: 'border-purple-600 dark:border-purple-400'
  },
  {
    id: 'service_security',
    label: 'Service Security',
    icon: Shield,
    description: 'Service account two-factor authentication',
    color: 'text-orange-600 dark:text-orange-400',
    activeColor: 'border-orange-600 dark:border-orange-400'
  },
  {
    id: 'service_secret',
    label: 'Service Secret',
    icon: Key,
    description: 'Service account secrets and credentials',
    color: 'text-pink-600 dark:text-pink-400',
    activeColor: 'border-pink-600 dark:border-pink-400'
  }
]

const EmailDetailPanel: React.FC<EmailDetailPanelProps> = ({
  email,
  email2FAMethods,
  serviceAccounts,
  serviceAccount2FAMethods,
  serviceAccountSecrets,
  allServiceAccountSecrets,
  selectedServiceAccount,
  currentDatabase,
  onCloseDatabase,
  activeTab: externalActiveTab = 'overview',
  onTabChange,
  onToggleCreateServiceForm,
  showCreateServiceForm = false,
  allServiceAccounts,
  onUpdateEmail,
  onDeleteEmail,
  onAdd2FA,
  onUpdate2FA,
  onDelete2FA,
  onServiceAdd,
  onServiceClick,
  onServiceUpdate,
  onAddServiceAccount2FA,
  onUpdateServiceAccount2FA,
  onDeleteServiceAccount2FA,
  onAddServiceAccountSecret,
  onUpdateServiceAccountSecret,
  onDeleteServiceAccountSecret,
  onBackToList
}) => {
  const activeTab = externalActiveTab

  // ✅ THÊM MỚI: Handler xóa email
  const handleDeleteEmail = async () => {
    if (!email.id || !onDeleteEmail) return

    const confirmMessage = `Bạn có chắc chắn muốn xóa email "${email.email_address}"?\n\nHành động này sẽ xóa:\n- Email account\n- ${email2FAMethods.length} 2FA method(s)\n- ${serviceAccounts.length} service account(s)\n- Tất cả secrets liên quan\n\nHành động này không thể hoàn tác!`

    if (window.confirm(confirmMessage)) {
      try {
        const success = await onDeleteEmail(email.id)
        if (!success) {
          alert('Không thể xóa email. Vui lòng thử lại.')
        }
      } catch (error) {
        console.error('Failed to delete email:', error)
        alert('Đã xảy ra lỗi khi xóa email.')
      }
    }
  }

  const handleTabChange = (tab: TabType) => {
    if (onTabChange) {
      onTabChange(tab)
    }

    if (tab === 'overview' || tab === 'security' || tab === 'services') {
      if (onBackToList) {
        onBackToList()
      }
    }
  }

  const getEmailInitials = (emailAddress: string): string => {
    return emailAddress.charAt(0).toUpperCase()
  }

  const renderTabContent = () => {
    // Service Detail View - Hiển thị theo tab
    if (selectedServiceAccount) {
      const serviceSecrets = serviceAccountSecrets.filter(
        (secret) => secret.service_account_id === selectedServiceAccount.id
      )
      const service2FAMethods = serviceAccount2FAMethods.filter(
        (method) => method.service_account_id === selectedServiceAccount.id
      )

      switch (activeTab) {
        case 'services':
          return (
            <div className="p-6 space-y-6">
              <ServiceAccountSection
                mode="detail"
                serviceAccount={selectedServiceAccount}
                onServiceUpdate={onServiceUpdate}
              />
            </div>
          )

        case 'service_security':
          return (
            <div className="p-6 space-y-6">
              <ServiceAccount2FASection
                serviceAccount={selectedServiceAccount}
                serviceAccount2FAMethods={service2FAMethods}
                onAdd2FA={onAddServiceAccount2FA || (async () => {})}
                onDelete2FA={onDeleteServiceAccount2FA}
                onSave2FA={onUpdateServiceAccount2FA}
              />
            </div>
          )

        case 'service_secret':
          return (
            <div className="p-6 space-y-6">
              <ServiceAccountSecretSection
                serviceAccount={selectedServiceAccount}
                secrets={serviceSecrets}
                allServiceAccountSecrets={allServiceAccountSecrets}
                allServiceAccounts={allServiceAccounts}
                onAddSecret={onAddServiceAccountSecret}
                onSecretChange={onUpdateServiceAccountSecret}
                onDeleteSecret={onDeleteServiceAccountSecret}
              />
            </div>
          )

        default:
          // Nếu đang xem service detail nhưng tab không phải service-related,
          // reset về danh sách services
          if (onBackToList) {
            onBackToList()
          }
          return null
      }
    }

    // Tab Views - Khi không xem service detail
    switch (activeTab) {
      case 'overview':
        return (
          <div className="p-6 space-y-6">
            <EmailSection email={email} onUpdateEmail={onUpdateEmail} />
          </div>
        )

      case 'services':
        return (
          <div className="p-6 space-y-6">
            <ServiceAccountSection
              mode="list"
              services={serviceAccounts}
              email={email}
              allServices={allServiceAccounts}
              showCreateForm={showCreateServiceForm}
              onToggleCreateForm={onToggleCreateServiceForm}
              onServiceAdd={onServiceAdd}
              onServiceClick={(
                service: ServiceAccount,
                targetTab?: 'service_security' | 'service_secret'
              ) => {
                if (onServiceClick) {
                  onServiceClick(service, targetTab)
                }
                if (targetTab && onTabChange) {
                  onTabChange(targetTab)
                }
              }}
              onServiceUpdate={onServiceUpdate}
              compact={false}
            />
          </div>
        )

      case 'security':
        return (
          <div className="space-y-6">
            <Email2FASection
              email={email}
              email2FAMethods={email2FAMethods}
              onAdd2FA={onAdd2FA || (async () => {})}
              onDelete2FA={onDelete2FA}
              onSave2FA={onUpdate2FA}
            />
          </div>
        )

      default:
        return null
    }
  }

  return (
    <div className="h-full flex flex-col bg-transparent">
      {/* Header Section */}
      <div className="flex-none  bg-transparent">
        <div className="px-6 pt-4 py-2">
          <div className="flex items-start justify-between">
            {/* Email Info */}
            <div className="flex items-start gap-3">
              {/* Avatar */}
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center text-white font-bold text-lg">
                {getEmailInitials(email.email_address)}
              </div>

              {/* Basic Details */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <h1 className="text-xl font-bold text-text-primary truncate">
                    {email.name || email.email_address}
                  </h1>
                  {email.name && (
                    <span className="text-xs text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded-md">
                      {email.email_address}
                    </span>
                  )}
                  {currentDatabase && (
                    <span className="text-xs text-green-700 dark:text-green-300 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700 px-2 py-0.5 rounded-md flex items-center gap-1.5 max-w-xs">
                      <Database className="h-3 w-3 flex-shrink-0" />
                      <span className="truncate" title={currentDatabase.path}>
                        {currentDatabase.path}
                      </span>
                      {onCloseDatabase && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            onCloseDatabase()
                          }}
                          className="flex-shrink-0 hover:bg-green-100 dark:hover:bg-green-800 rounded-sm transition-colors"
                          title="Close database"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      )}
                    </span>
                  )}
                </div>

                <div className="flex flex-wrap gap-3 text-xs text-gray-600 dark:text-gray-400 mb-2">
                  <span className="font-medium">Provider: {email.email_provider}</span>
                  {email.age && <span className="font-medium">Age: {email.age}</span>}
                  {serviceAccounts.length > 0 && (
                    <span className="font-medium flex items-center gap-1">
                      <Globe className="h-3 w-3" />
                      {serviceAccounts.length} service{serviceAccounts.length !== 1 ? 's' : ''}
                    </span>
                  )}
                  {email2FAMethods.length > 0 && (
                    <span className="font-medium flex items-center gap-1">
                      <Shield className="h-3 w-3" />
                      {email2FAMethods.length} 2FA method{email2FAMethods.length !== 1 ? 's' : ''}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-1">
              {selectedServiceAccount && onBackToList && (
                <CustomButton variant="secondary" size="sm" onClick={onBackToList} className="mr-2">
                  ← Back to Services
                </CustomButton>
              )}
              {onDeleteEmail && (
                <button
                  onClick={handleDeleteEmail}
                  className="p-2 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors group"
                  title="Delete Email"
                >
                  <Trash2 className="h-4 w-4 text-gray-600 dark:text-gray-400 group-hover:text-red-600 dark:group-hover:text-red-400" />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Tab Navigation - Always show */}
      <div className="flex-none border-b border-border-default bg-transparent">
        <div className="px-6">
          <div className="flex space-x-6 overflow-x-auto scrollbar-hide">
            {TABS.map((tab) => {
              const Icon = tab.icon
              const isActive = activeTab === tab.id

              // Chỉ hiển thị tab service_security và service_secret khi đang xem ServiceAccount
              const shouldShowTab =
                tab.id === 'service_security' || tab.id === 'service_secret'
                  ? selectedServiceAccount !== null
                  : true

              if (!shouldShowTab) return null

              return (
                <button
                  key={tab.id}
                  onClick={() => handleTabChange(tab.id)}
                  className={`
        group relative flex items-center gap-2 py-3 px-1 text-sm font-medium whitespace-nowrap transition-all duration-200 border-b-2
        ${
          isActive
            ? `${tab.color} ${tab.activeColor}`
            : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 border-transparent hover:border-gray-300 dark:hover:border-gray-600'
        }
      `}
                  title={tab.description}
                >
                  <Icon className={`h-4 w-4 ${isActive ? tab.color : ''}`} />
                  <span>{tab.label}</span>
                  {/* Service Name Badge - hiển thị khi đang xem service detail và tab là services */}
                  {tab.id === 'services' && selectedServiceAccount && (
                    <span className="ml-1 px-2 py-0.5 text-xs font-medium bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded-full border border-purple-200 dark:border-purple-700">
                      {selectedServiceAccount.service_name}
                    </span>
                  )}
                </button>
              )
            })}
          </div>
        </div>
      </div>

      {/* Tab Content */}
      <div className="flex-1 overflow-y-auto">
        <AnimatePresence mode="wait">
          <motion.div
            key={selectedServiceAccount ? selectedServiceAccount.id : activeTab}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
            className="h-full"
          >
            {renderTabContent()}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  )
}

export default EmailDetailPanel
