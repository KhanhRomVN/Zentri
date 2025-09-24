// src/renderer/src/presentation/pages/EmailManager/components/EmailDrawer/AccountService/ServiceAccount2FASection.tsx
import React, { useState } from 'react'
import CustomBadge from '../../../../../../components/common/CustomBadge'
import CustomButton from '../../../../../../components/common/CustomButton'
import ServiceAccount2FACard from './ServiceAccount2FACard' // Giả sử có component này
import {
  Shield,
  CheckCircle,
  AlertCircle,
  ChevronDown,
  ChevronUp,
  Plus,
  Users,
  Lock
} from 'lucide-react'
import { cn } from '../../../../../../shared/lib/utils'
import { ServiceAccount, ServiceAccount2FA } from '../../../types'

interface ServiceAccount2FASectionProps {
  serviceAccount: ServiceAccount
  serviceAccount2FAMethods: ServiceAccount2FA[]
  onAdd2FA?: (data: Omit<ServiceAccount2FA, 'id'>) => Promise<void>
  onEdit2FA?: (method: ServiceAccount2FA) => void
  onDelete2FA?: (methodId: string) => void
  className?: string
}

const ServiceAccount2FASection: React.FC<ServiceAccount2FASectionProps> = ({
  serviceAccount,
  serviceAccount2FAMethods,
  onAdd2FA,
  onEdit2FA,
  onDelete2FA,
  className
}) => {
  const [is2FAExpanded, setIs2FAExpanded] = useState(false)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [isCreating, setIsCreating] = useState(false)

  const has2FA = serviceAccount2FAMethods.length > 0
  const active2FAMethods = serviceAccount2FAMethods.length

  const handleAdd2FA = () => {
    setShowCreateForm(true)
    setIs2FAExpanded(true)
  }

  const handleCreate2FA = async (data: Omit<ServiceAccount2FA, 'id'>) => {
    try {
      setIsCreating(true)
      console.log('Creating service 2FA method:', data)
      if (onAdd2FA) {
        await onAdd2FA(data)
      }
      setShowCreateForm(false)
      console.log('Service 2FA method created successfully')
    } catch (error) {
      console.error('Error creating service 2FA method:', error)
    } finally {
      setIsCreating(false)
    }
  }

  const handleCancelCreate = () => {
    setShowCreateForm(false)
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
  const SecurityIcon = securityStatus.icon

  return (
    <div className={cn('space-y-6', className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Shield className="h-5 w-5 text-green-600 dark:text-green-400" />
            Service Two-Factor Authentication
            <CustomBadge
              variant={has2FA ? 'success' : 'secondary'}
              size="sm"
              icon={has2FA ? CheckCircle : AlertCircle}
              className="text-xs ml-2"
            >
              {has2FA ? 'Enabled' : 'Disabled'}
            </CustomBadge>
          </h3>
          <p className="text-gray-600 dark:text-gray-400 text-sm mt-1">
            {active2FAMethods} method{active2FAMethods !== 1 ? 's' : ''} configured • Security
            level: {securityStatus.level}
          </p>
        </div>
        <CustomButton
          size="sm"
          variant="success"
          icon={Plus}
          onClick={handleAdd2FA}
          className="shadow-sm px-3 py-1.5 text-xs"
        >
          Add 2FA
        </CustomButton>
      </div>

      {/* Main Card */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200/60 dark:border-gray-700/60 shadow-sm hover:shadow-md transition-all duration-200">
        {/* Header */}
        <div className="p-4 pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {/* Stats Info */}
              <div className="flex-1">
                <div className="flex items-center gap-3 text-sm text-gray-600 dark:text-gray-400">
                  <div className="flex items-center gap-1">
                    <Users className="h-3 w-3" />
                    <span className="text-xs">
                      {active2FAMethods} method{active2FAMethods !== 1 ? 's' : ''}
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
                onClick={() => setIs2FAExpanded(!is2FAExpanded)}
                className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              >
                {is2FAExpanded ? (
                  <ChevronUp className="h-4 w-4 text-gray-500" />
                ) : (
                  <ChevronDown className="h-4 w-4 text-gray-500" />
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Expandable Content */}
        {is2FAExpanded && (
          <div className="px-4 pb-4">
            <div className="border-t border-gray-100 dark:border-gray-700 pt-4 space-y-4">
              {/* Create Form - Placeholder for future implementation */}
              {showCreateForm && (
                <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-700 p-4">
                  <div className="text-center py-4">
                    <p className="text-blue-700 dark:text-blue-300 text-sm">
                      2FA creation form for {serviceAccount.service_name} will be implemented here
                    </p>
                    <div className="flex gap-2 justify-center mt-3">
                      <CustomButton
                        variant="secondary"
                        size="sm"
                        onClick={handleCancelCreate}
                        className="text-xs"
                      >
                        Cancel
                      </CustomButton>
                    </div>
                  </div>
                </div>
              )}

              {/* Methods List */}
              {has2FA ? (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium text-gray-900 dark:text-white text-sm">
                      Active 2FA Methods
                    </h4>
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      {active2FAMethods} total
                    </span>
                  </div>

                  <div className="grid gap-3">
                    {serviceAccount2FAMethods.map((method) => (
                      <div
                        key={method.id}
                        className="bg-gray-50 dark:bg-gray-700/50 rounded-lg border border-gray-200 dark:border-gray-600 p-3"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Shield className="h-4 w-4 text-green-600 dark:text-green-400" />
                            <span className="text-sm font-medium text-gray-900 dark:text-white">
                              {method.method_type.replace(/_/g, ' ')}
                            </span>
                            {method.app && (
                              <span className="text-xs text-gray-500 dark:text-gray-400">
                                ({method.app})
                              </span>
                            )}
                          </div>
                          <div className="flex gap-1">
                            <CustomButton
                              variant="ghost"
                              size="sm"
                              onClick={() => onEdit2FA?.(method)}
                              className="text-blue-600 hover:text-blue-700 text-xs px-2 py-1"
                            >
                              Edit
                            </CustomButton>
                            <CustomButton
                              variant="ghost"
                              size="sm"
                              onClick={() => onDelete2FA?.(method.id)}
                              className="text-red-600 hover:text-red-700 text-xs px-2 py-1"
                            >
                              Delete
                            </CustomButton>
                          </div>
                        </div>
                        <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                          Last updated: {new Date(method.last_update).toLocaleDateString()}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : !showCreateForm ? (
                <div className="text-center py-8">
                  <div className="w-12 h-12 bg-gray-100 dark:bg-gray-700 rounded-xl flex items-center justify-center mx-auto mb-3">
                    <Lock className="h-6 w-6 text-gray-400" />
                  </div>

                  <h4 className="text-base font-medium text-gray-900 dark:text-white mb-2">
                    No 2FA Methods Configured
                  </h4>

                  <p className="text-gray-600 dark:text-gray-400 mb-4 max-w-sm mx-auto text-sm">
                    Enhance your {serviceAccount.service_name} account security by setting up
                    two-factor authentication.
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

                  {/* Security Tips */}
                  <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-700">
                    <h5 className="font-medium text-blue-900 dark:text-blue-100 mb-1 text-sm">
                      Security Tips for {serviceAccount.service_name}
                    </h5>
                    <ul className="text-xs text-blue-800 dark:text-blue-200 space-y-0.5 text-left max-w-sm mx-auto">
                      <li>• Use TOTP apps like Google Authenticator</li>
                      <li>• Keep backup codes secure</li>
                      <li>• Enable app-specific passwords if available</li>
                    </ul>
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

export default ServiceAccount2FASection
