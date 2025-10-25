import React, { useState } from 'react'
import CustomButton from '../../../../../../../../components/common/CustomButton'
import ServiceAccount2FACard from '../card/ServiceAccount2FACard'
import CreateServiceAccount2FADrawer from '../form/CreateServiceAccount2FADrawer'
import { Shield, CheckCircle, AlertCircle, Plus } from 'lucide-react'
import { ServiceAccount, ServiceAccount2FA } from '../../../../../types'

interface ServiceAccount2FASectionProps {
  serviceAccount: ServiceAccount
  serviceAccount2FAMethods: ServiceAccount2FA[]
  onAdd2FA: (data: Omit<ServiceAccount2FA, 'id'>) => Promise<void>
  onEdit2FA?: (method: ServiceAccount2FA) => void
  onDelete2FA?: (methodId: string) => void
  onSave2FA?: (id: string, updates: Partial<ServiceAccount2FA>) => Promise<void>
  className?: string
}

const ServiceAccount2FASection: React.FC<ServiceAccount2FASectionProps> = ({
  serviceAccount,
  serviceAccount2FAMethods,
  onAdd2FA,
  onEdit2FA,
  onDelete2FA,
  onSave2FA
}) => {
  const [showCreateDrawer, setShowCreateDrawer] = useState(false)
  const [isCreating, setIsCreating] = useState(false)

  const has2FA = serviceAccount2FAMethods.length > 0
  const active2FAMethods = serviceAccount2FAMethods.length

  const handleAdd2FA = () => {
    setShowCreateDrawer(true)
  }

  const handleCreate2FA = async (data: Omit<ServiceAccount2FA, 'id'>) => {
    try {
      setIsCreating(true)
      await onAdd2FA(data)
      setShowCreateDrawer(false)
    } catch (error) {
      console.error('Error creating ServiceAccount 2FA method:', error)
      throw error
    } finally {
      setIsCreating(false)
    }
  }

  const handleCancelCreate = () => {
    setShowCreateDrawer(false)
  }

  const handleEdit2FA = (method: ServiceAccount2FA) => {
    if (onEdit2FA) {
      onEdit2FA(method)
    }
  }

  const handleDelete2FA = (methodId: string) => {
    if (onDelete2FA) {
      onDelete2FA(methodId)
    }
  }

  const handleSave2FA = async (id: string, updates: Partial<ServiceAccount2FA>) => {
    if (onSave2FA) {
      await onSave2FA(id, updates)
    }
  }

  // Get security status
  const getSecurityStatus = () => {
    if (!has2FA) {
      return {
        level: 'Low',
        color: 'bg-red-50 text-red-700 border-red-200 dark:bg-red-900/20 dark:text-red-300',
        icon: AlertCircle,
        description: 'No 2FA configured'
      }
    }

    if (active2FAMethods === 1) {
      return {
        level: 'Medium',
        color:
          'bg-yellow-50 text-yellow-700 border-yellow-200 dark:bg-yellow-900/20 dark:text-yellow-300',
        icon: Shield,
        description: 'Basic 2FA active'
      }
    }

    return {
      level: 'High',
      color: 'bg-green-50 text-green-700 border-green-200 dark:bg-green-900/20 dark:text-green-300',
      icon: CheckCircle,
      description: 'Multiple 2FA methods'
    }
  }

  const securityStatus = getSecurityStatus()

  return (
    <>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-bold text-text-primary flex items-center gap-2">
            <Shield className="h-5 w-5 text-green-600 dark:text-green-400" />
            Service Two-Factor Authentication
          </h3>
          <p className="text-gray-600 dark:text-gray-400 text-sm mt-1">
            {active2FAMethods} method{active2FAMethods !== 1 ? 's' : ''} configured • Security
            level: {securityStatus.level}
          </p>
        </div>
        <CustomButton size="sm" variant="success" icon={Plus} onClick={handleAdd2FA}>
          Add 2FA
        </CustomButton>
      </div>
      {/* Main Card - Reduced padding and spacing */}
      <div className="bg-card-background rounded-xl border border-gray-200/60 dark:border-gray-700/60 shadow-sm hover:shadow-md transition-all duration-200">
        <div className="space-y-4">
          {/* Methods List */}
          {has2FA ? (
            serviceAccount2FAMethods.map((method) => (
              <ServiceAccount2FACard
                key={method.id}
                method={method}
                onEdit={handleEdit2FA}
                onDelete={handleDelete2FA}
                onSave={handleSave2FA}
              />
            ))
          ) : (
            <div className="text-center py-8">
              <div className="w-12 h-12 bg-gray-100 dark:bg-gray-700 rounded-xl flex items-center justify-center mx-auto mb-3">
                <Shield className="h-6 w-6 text-gray-400" />
              </div>

              <h4 className="text-base font-medium text-text-primary mb-2">
                No 2FA Methods Configured
              </h4>

              <p className="text-gray-600 dark:text-gray-400 mb-4 max-w-sm mx-auto text-sm">
                Enhance your service account security by setting up two-factor authentication.
              </p>

              <div className="flex flex-col sm:flex-row gap-2 justify-center">
                <CustomButton
                  onClick={handleAdd2FA}
                  variant="primary"
                  size="sm"
                  icon={Shield}
                  className="bg-green-600 hover:bg-green-700"
                >
                  Set up 2FA Now
                </CustomButton>
              </div>
            </div>
          )}
        </div>
      </div>
      {/* Create 2FA Drawer */}
      <CreateServiceAccount2FADrawer
        isOpen={showCreateDrawer}
        serviceAccount={serviceAccount}
        existingMethods={serviceAccount2FAMethods}
        onSubmit={handleCreate2FA}
        onClose={handleCancelCreate}
        loading={isCreating}
      />
    </>
  )
}

export default ServiceAccount2FASection
