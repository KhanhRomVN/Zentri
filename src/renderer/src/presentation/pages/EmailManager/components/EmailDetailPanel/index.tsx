// src/renderer/src/presentation/pages/EmailManager/components/EmailDetailPanel/index.tsx
import React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Globe, Shield, Key, SlidersHorizontal, Plus, User } from 'lucide-react'
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
  activeTab?: TabType
  onTabChange?: (tab: TabType) => void
  showCreateServiceForm?: boolean
  onToggleCreateServiceForm?: (show: boolean) => void
  serviceFormDraft?: any
  onServiceFormDraftChange?: (draftData: any) => void
  onUpdateEmail?: (id: string, updates: Partial<Email>) => Promise<boolean>
  onAdd2FA?: (data: Omit<Email2FA, 'id'>) => Promise<void>
  onUpdate2FA?: (id: string, updates: Partial<Email2FA>) => Promise<void>
  onDelete2FA?: (id: string) => void
  onServiceAdd?: (service: Omit<ServiceAccount, 'id' | 'email_id'>) => void
  onServiceClick?: (service: ServiceAccount) => void
  onServiceUpdate?: (serviceId: string, field: string, value: string) => Promise<boolean>
  onAddServiceAccount2FA?: (data: Omit<ServiceAccount2FA, 'id'>) => Promise<void>
  onUpdateServiceAccount2FA?: (id: string, updates: Partial<ServiceAccount2FA>) => Promise<void>
  onDeleteServiceAccount2FA?: (id: string) => void
  onAddServiceAccountSecret?: (data: Omit<ServiceAccountSecret, 'id'>) => Promise<void>
  onUpdateServiceAccountSecret?: (id: string, updates: Partial<ServiceAccountSecret>) => void
  onDeleteServiceAccountSecret?: (id: string) => void
  onBackToList?: () => void
}

type TabType = 'overview' | 'services' | 'security' | 'service_security' | 'service_secret'

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
  activeTab: externalActiveTab = 'overview',
  onTabChange,
  onToggleCreateServiceForm,
  showCreateServiceForm = false,
  allServiceAccounts,
  onUpdateEmail,
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
  onDeleteServiceAccountSecret,
  onBackToList
}) => {
  const activeTab = externalActiveTab

  const handleTabChange = (tab: TabType) => {
    if (onTabChange) {
      onTabChange(tab)
    }

    // Reset selectedServiceAccount khi chuyển sang bất kỳ tab nào không phải service detail tabs
    // hoặc khi click vào tab "services" để quay về list
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
                allServiceAccountSecrets={allServiceAccountSecrets} // ✅ Đảm bảo prop này có
                allServiceAccounts={allServiceAccounts} // ✅ Thêm prop này
                onAddSecret={onAddServiceAccountSecret}
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
              onServiceClick={onServiceClick}
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
      <div className="flex-none border-b border-gray-200 dark:border-gray-700 bg-transparent">
        <div className="px-6 py-4">
          <div className="flex items-start justify-between">
            {/* Email Info */}
            <div className="flex items-start gap-3">
              {/* Avatar */}
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center text-white font-bold text-lg">
                {getEmailInitials(email.email_address)}
              </div>

              {/* Basic Details */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h1 className="text-xl font-bold text-text-primary truncate">
                    {email.name || email.email_address}
                  </h1>
                  {email.name && (
                    <span className="text-xs text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded-md">
                      {email.email_address}
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
              <button
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                title="Filter (Coming Soon)"
              >
                <SlidersHorizontal className="h-4 w-4 text-gray-600 dark:text-gray-400" />
              </button>
              <CustomButton
                variant="primary"
                size="sm"
                icon={Plus}
                className="p-2 h-8 w-8 bg-blue-600 hover:bg-blue-700"
                children={undefined}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Tab Navigation - Always show */}
      <div className="flex-none border-b border-gray-200 dark:border-gray-700 bg-transparent">
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
