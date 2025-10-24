// src/renderer/src/presentation/pages/EmailManager/components/EmailDrawer/ServiceAccount/ServiceAccountSecretSection.tsx
import React, { useState } from 'react'
import CustomBadge from '../../../../../../../../components/common/CustomBadge'
import CustomButton from '../../../../../../../../components/common/CustomButton'
import CreateServiceAccountSecretForm from '../form/CreateServiceAccountSecretForm'
import ServiceAccountSecretCard from '../card/ServiceAccountSecretCard'
import {
  Key,
  CheckCircle,
  AlertCircle,
  ChevronDown,
  ChevronUp,
  Plus,
  Database,
  Shield
} from 'lucide-react'
import { cn } from '../../../../../../../../shared/lib/utils'
import { ServiceAccount, ServiceAccountSecret } from '../../../../../types'

interface ServiceAccountSecretSectionProps {
  serviceAccount: ServiceAccount
  secrets: ServiceAccountSecret[]
  allServiceAccountSecrets?: ServiceAccountSecret[] // Thêm prop mới
  onAddSecret?: (secretData: Omit<ServiceAccountSecret, 'id'>) => Promise<void>
  onSecretChange?: (secretId: string, secret: ServiceAccountSecret) => void
  onDeleteSecret?: (secretId: string) => void
  loading?: boolean
  error?: string
  className?: string
}

const ServiceAccountSecretSection: React.FC<ServiceAccountSecretSectionProps> = ({
  serviceAccount,
  secrets = [],
  allServiceAccountSecrets = [],
  onAddSecret,
  onSecretChange,
  onDeleteSecret,
  loading = false,
  error,
  className
}) => {
  const [isExpanded, setIsExpanded] = useState(false)
  const [showCreateForm, setShowCreateForm] = useState(false)

  const hasSecrets = secrets.length > 0
  const activeSecrets = secrets.length

  const handleAddSecret = () => {
    setShowCreateForm(true)
    setIsExpanded(true)
  }

  const handleCancelCreate = () => {
    setShowCreateForm(false)
  }

  const handleSecretCreated = async (secretData: Omit<ServiceAccountSecret, 'id'>) => {
    if (onAddSecret) {
      await onAddSecret(secretData)
      setShowCreateForm(false)
    }
  }

  // Get security status based on secrets count
  const getSecurityStatus = () => {
    if (!hasSecrets) {
      return {
        level: 'Low',
        color: 'bg-red-50 text-red-700 border-red-200 dark:bg-red-900/20 dark:text-red-300',
        icon: AlertCircle,
        description: 'No secrets configured'
      }
    }

    if (activeSecrets <= 2) {
      return {
        level: 'Medium',
        color:
          'bg-yellow-50 text-yellow-700 border-yellow-200 dark:bg-yellow-900/20 dark:text-yellow-300',
        icon: Shield,
        description: 'Basic secrets stored'
      }
    }

    return {
      level: 'High',
      color: 'bg-green-50 text-green-700 border-green-200 dark:bg-green-900/20 dark:text-green-300',
      icon: CheckCircle,
      description: 'Multiple secrets secured'
    }
  }

  const securityStatus = getSecurityStatus()
  const SecurityIcon = securityStatus.icon

  return (
    <div className={cn('space-y-6', className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="pl-2">
          <h3 className="text-xl font-bold text-text-primary flex items-center gap-2">
            <Key className="h-5 w-5 text-purple-600 dark:text-purple-400" />
            Secret Information
            <CustomBadge
              variant={hasSecrets ? 'success' : 'secondary'}
              size="sm"
              icon={hasSecrets ? CheckCircle : AlertCircle}
              className="text-xs ml-2"
            >
              {hasSecrets ? 'Configured' : 'Empty'}
            </CustomBadge>
          </h3>
          <p className="text-gray-600 dark:text-gray-400 text-sm mt-1">
            {activeSecrets} secret{activeSecrets !== 1 ? 's' : ''} stored • Security level:{' '}
            {securityStatus.level}
          </p>
        </div>
        <CustomButton
          size="sm"
          variant="primary"
          icon={Plus}
          onClick={handleAddSecret}
          disabled={loading}
          className="bg-purple-600 hover:bg-purple-700 shadow-sm px-3 py-1.5 text-xs"
        >
          Add Secret
        </CustomButton>
      </div>

      {/* Main Card */}
      <div className="bg-card-background rounded-xl border border-gray-200/60 dark:border-gray-700/60 shadow-sm hover:shadow-md transition-all duration-200">
        {/* Header */}
        <div className="p-4 pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {/* Stats Info */}
              <div className="flex-1">
                <div className="flex items-center gap-3 text-sm text-gray-600 dark:text-gray-400">
                  <div className="flex items-center gap-1">
                    <Database className="h-3 w-3" />
                    <span className="text-xs">
                      {activeSecrets} secret{activeSecrets !== 1 ? 's' : ''}
                    </span>
                  </div>

                  <div className="flex items-center gap-1">
                    <span className="text-xs">Security:</span>
                    <CustomBadge
                      variant="secondary"
                      size="sm"
                      icon={SecurityIcon}
                      className={cn('text-xs px-1.5 py-0.5', securityStatus.color)}
                    >
                      {securityStatus.level}
                    </CustomBadge>
                  </div>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-1">
              <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              >
                {isExpanded ? (
                  <ChevronUp className="h-4 w-4 text-gray-500" />
                ) : (
                  <ChevronDown className="h-4 w-4 text-gray-500" />
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Expandable Content */}
        {isExpanded && (
          <div className="px-4 pb-4">
            <div className="border-t border-gray-100 dark:border-gray-700 pt-4 space-y-4">
              {/* Loading State */}
              {loading && (
                <div className="text-center py-4">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-purple-600 mx-auto mb-2"></div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Loading secrets...</p>
                </div>
              )}

              {/* Error State */}
              {error && !loading && (
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400 mt-0.5 flex-shrink-0" />
                    <div className="flex-1">
                      <h4 className="text-sm font-semibold text-red-800 dark:text-red-300 mb-1">
                        Error Loading Secrets
                      </h4>
                      <p className="text-sm text-red-700 dark:text-red-400">{error}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Create Form */}
              {showCreateForm && (
                <CreateServiceAccountSecretForm
                  serviceAccount={serviceAccount}
                  allServiceAccountSecrets={allServiceAccountSecrets}
                  onAddSecret={handleSecretCreated}
                  onCancel={handleCancelCreate}
                  loading={loading}
                />
              )}

              {/* Secrets List */}
              {!loading && !error && hasSecrets ? (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium text-text-primary text-sm">Stored Secrets</h4>
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      {activeSecrets} total
                    </span>
                  </div>

                  <div className="grid gap-3">
                    {secrets.map((secret) => (
                      <ServiceAccountSecretCard
                        key={secret.id}
                        secret={secret}
                        onSecretChange={onSecretChange || undefined}
                        onDeleteSecret={onDeleteSecret || undefined}
                      />
                    ))}
                  </div>
                </div>
              ) : !loading && !error && !hasSecrets && !showCreateForm ? (
                /* Empty State - giữ nguyên */
                <div className="text-center py-8">
                  <div className="w-12 h-12 bg-gray-100 dark:bg-gray-700 rounded-xl flex items-center justify-center mx-auto mb-3">
                    <Key className="h-6 w-6 text-gray-400" />
                  </div>

                  <h4 className="text-base font-medium text-text-primary mb-2">
                    No Secrets Stored
                  </h4>

                  <p className="text-gray-600 dark:text-gray-400 mb-4 max-w-sm mx-auto text-sm">
                    Store API keys, access tokens, certificates and other sensitive information
                    securely for {serviceAccount.service_name}.
                  </p>

                  <div className="flex flex-col sm:flex-row gap-2 justify-center">
                    <CustomButton
                      onClick={handleAddSecret}
                      variant="primary"
                      size="sm"
                      icon={Key}
                      className="bg-purple-600 hover:bg-purple-700"
                    >
                      Add Your First Secret
                    </CustomButton>
                  </div>
                </div>
              ) : null}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default ServiceAccountSecretSection
