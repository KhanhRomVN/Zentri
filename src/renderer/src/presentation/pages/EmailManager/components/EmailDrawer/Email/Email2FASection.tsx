// src/renderer/src/presentation/pages/EmailManager/components/EmailDrawer/Email/Email2FASection.tsx
import React, { useState } from 'react'
import CustomBadge from '../../../../../../components/common/CustomBadge'
import CustomButton from '../../../../../../components/common/CustomButton'
import Email2FACard from './Email2FACard'
import CreateEmail2FAForm from './CreateEmail2FAForm'
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
import { Email, Email2FA } from '../../../types'

interface Email2FASectionProps {
  email: Email
  email2FAMethods: Email2FA[]
  onAdd2FA: (data: Omit<Email2FA, 'id'>) => Promise<void>
  onEdit2FA?: (method: Email2FA) => void
  onDelete2FA?: (methodId: string) => void
  onSave2FA?: (id: string, updates: Partial<Email2FA>) => Promise<void>
  className?: string
}

const Email2FASection: React.FC<Email2FASectionProps> = ({
  email,
  email2FAMethods,
  onAdd2FA,
  onEdit2FA,
  onDelete2FA,
  onSave2FA,
  className
}) => {
  const [is2FAExpanded, setIs2FAExpanded] = useState(false)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [isCreating, setIsCreating] = useState(false)

  const has2FA = email2FAMethods.length > 0
  const active2FAMethods = email2FAMethods.length

  const handleAdd2FA = () => {
    setShowCreateForm(true)
    setIs2FAExpanded(true)
  }

  const handleCreate2FA = async (data: Omit<Email2FA, 'id'>) => {
    try {
      setIsCreating(true)
      await onAdd2FA(data)
      setShowCreateForm(false)
    } catch (error) {
      console.error('Error creating 2FA method:', error)
    } finally {
      setIsCreating(false)
    }
  }

  const handleCancelCreate = () => {
    setShowCreateForm(false)
  }

  const handleEdit2FA = (method: Email2FA) => {
    if (onEdit2FA) {
      onEdit2FA(method)
    }
  }

  const handleDelete2FA = (methodId: string) => {
    if (onDelete2FA) {
      onDelete2FA(methodId)
    }
  }

  const handleSave2FA = async (id: string, updates: Partial<Email2FA>) => {
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
  const SecurityIcon = securityStatus.icon

  return (
    <div className={cn('space-y-6', className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="pl-2">
          <h3 className="text-xl font-bold text-text-primary flex items-center gap-2">
            <Shield className="h-5 w-5 text-green-600 dark:text-green-400" />
            Two-Factor Authentication
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

      {/* Main Card - Reduced padding and spacing */}
      <div className="bg-card-background rounded-xl border border-gray-200/60 dark:border-gray-700/60 shadow-sm hover:shadow-md transition-all duration-200">
        {/* Header - Reduced padding */}
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
              {/* Create Form */}
              {showCreateForm && (
                <CreateEmail2FAForm
                  email={email}
                  existingMethods={email2FAMethods}
                  onSubmit={handleCreate2FA}
                  onCancel={handleCancelCreate}
                  loading={isCreating}
                />
              )}

              {/* Methods List */}
              {has2FA ? (
                <div className="space-y-3">
                  <div className="grid gap-3">
                    {email2FAMethods.map((method) => (
                      <Email2FACard
                        key={method.id}
                        method={method}
                        onEdit={handleEdit2FA}
                        onDelete={handleDelete2FA}
                        onSave={handleSave2FA}
                      />
                    ))}
                  </div>
                </div>
              ) : !showCreateForm ? (
                <div className="text-center py-8">
                  <div className="w-12 h-12 bg-gray-100 dark:bg-gray-700 rounded-xl flex items-center justify-center mx-auto mb-3">
                    <Lock className="h-6 w-6 text-gray-400" />
                  </div>

                  <h4 className="text-base font-medium text-text-primary mb-2">
                    No 2FA Methods Configured
                  </h4>

                  <p className="text-gray-600 dark:text-gray-400 mb-4 max-w-sm mx-auto text-sm">
                    Enhance your account security by setting up two-factor authentication.
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
              ) : null}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default Email2FASection
