// src/renderer/src/presentation/pages/EmailManager/components/EmailDrawer/ServiceAccount/ServiceAccountSecretSection.tsx
import React, { useState } from 'react'
import CustomButton from '../../../../../../../../components/common/CustomButton'
import CreateServiceAccountSecretDrawer from '../form/CreateServiceAccountSecretDrawer'
import ServiceAccountSecretCard from '../card/ServiceAccountSecretCard'
import { Key, Plus, Lock } from 'lucide-react'
import { cn } from '../../../../../../../../shared/lib/utils'
import { ServiceAccount, ServiceAccountSecret } from '../../../../../types'

interface ServiceAccountSecretSectionProps {
  serviceAccount: ServiceAccount
  secrets: ServiceAccountSecret[]
  allServiceAccountSecrets?: ServiceAccountSecret[]
  allServiceAccounts?: ServiceAccount[]
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
  allServiceAccounts = [],
  onAddSecret,
  onSecretChange,
  onDeleteSecret,
  loading = false,
  error,
  className
}) => {
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [isCreating, setIsCreating] = useState(false)

  const hasSecrets = secrets.length > 0

  const handleAddSecret = () => {
    setShowCreateForm(true)
  }

  const handleCancelCreate = () => {
    setShowCreateForm(false)
  }

  const handleSecretCreated = async (secretData: Omit<ServiceAccountSecret, 'id'>) => {
    try {
      setIsCreating(true)
      if (onAddSecret) {
        await onAddSecret(secretData)
        setShowCreateForm(false)
      }
    } catch (error) {
      console.error('Error creating secret:', error)
    } finally {
      setIsCreating(false)
    }
  }

  return (
    <div className={cn('space-y-6 p-4', className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-bold text-text-primary flex items-center gap-2">
            <Key className="h-5 w-5 text-purple-600 dark:text-purple-400" />
            Secret Information
          </h3>
          <p className="text-gray-600 dark:text-gray-400 text-sm mt-1">
            {hasSecrets
              ? `${secrets.length} secret${secrets.length !== 1 ? 's' : ''} stored`
              : 'No secrets stored'}
          </p>
        </div>
        <CustomButton
          size="sm"
          variant="primary"
          icon={Plus}
          onClick={handleAddSecret}
          disabled={loading}
          className="bg-purple-600 hover:bg-purple-700"
        >
          Add Secret
        </CustomButton>
      </div>

      <div className="space-y-4">
        {/* Create Drawer */}
        <CreateServiceAccountSecretDrawer
          isOpen={showCreateForm}
          serviceAccount={serviceAccount}
          allServiceAccountSecrets={allServiceAccountSecrets}
          allServiceAccounts={allServiceAccounts}
          onSubmit={handleSecretCreated}
          onClose={handleCancelCreate}
          loading={isCreating}
        />

        {/* Loading State */}
        {loading && !showCreateForm && (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto mb-3"></div>
            <p className="text-sm text-gray-500 dark:text-gray-400">Loading secrets...</p>
          </div>
        )}

        {/* Error State */}
        {error && !loading && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-lg p-4">
            <p className="text-sm text-red-700 dark:text-red-400">{error}</p>
          </div>
        )}

        {/* Secrets List */}
        {hasSecrets && !loading && !error ? (
          <div className="space-y-3">
            <div className="grid gap-3">
              {secrets.map((secret) => (
                <ServiceAccountSecretCard
                  key={secret.id}
                  secret={secret}
                  onSecretChange={onSecretChange}
                  onDeleteSecret={onDeleteSecret}
                />
              ))}
            </div>
          </div>
        ) : !loading && !error && !hasSecrets && !showCreateForm ? (
          <div className="text-center py-8">
            <div className="w-12 h-12 bg-gray-100 dark:bg-gray-700 rounded-xl flex items-center justify-center mx-auto mb-3">
              <Lock className="h-6 w-6 text-gray-400" />
            </div>

            <h4 className="text-base font-medium text-text-primary mb-2">No Secrets Stored</h4>

            <p className="text-gray-600 dark:text-gray-400 mb-4 max-w-sm mx-auto text-sm">
              Store API keys, access tokens, certificates and other sensitive information securely.
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
  )
}

export default ServiceAccountSecretSection
