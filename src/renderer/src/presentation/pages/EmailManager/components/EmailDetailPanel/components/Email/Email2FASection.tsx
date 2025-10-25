import React, { useState } from 'react'
import CustomButton from '../../../../../../../components/common/CustomButton'
import Email2FACard from './Email2FACard'
import CreateEmail2FADrawer from './CreateEmail2FADrawer'
import { Shield, Plus, Lock } from 'lucide-react'
import { cn } from '../../../../../../../shared/lib/utils'
import { Email, Email2FA } from '../../../../types'

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
  const [showCreateDrawer, setShowCreateDrawer] = useState(false)
  const [isCreating, setIsCreating] = useState(false)

  const has2FA = email2FAMethods.length > 0

  const handleAdd2FA = () => {
    setShowCreateDrawer(true)
  }

  const handleCreate2FA = async (data: Omit<Email2FA, 'id'>) => {
    try {
      setIsCreating(true)
      await onAdd2FA(data)
      setShowCreateDrawer(false)
    } catch (error) {
      console.error('Error creating 2FA method:', error)
    } finally {
      setIsCreating(false)
    }
  }

  const handleCancelCreate = () => {
    setShowCreateDrawer(false)
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

  return (
    <div className={cn('space-y-6 p-4', className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-bold text-text-primary flex items-center gap-2">
            <Shield className="h-5 w-5 text-green-600 dark:text-green-400" />
            Two-Factor Authentication
          </h3>
          <p className="text-gray-600 dark:text-gray-400 text-sm mt-1">
            {has2FA
              ? `${email2FAMethods.length} method${email2FAMethods.length !== 1 ? 's' : ''} configured`
              : 'No 2FA methods configured'}
          </p>
        </div>
        <CustomButton size="sm" variant="success" icon={Plus} onClick={handleAdd2FA}>
          Add 2FA
        </CustomButton>
      </div>

      <div className="space-y-4">
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
        ) : (
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
        )}
      </div>

      {/* Create 2FA Drawer */}
      <CreateEmail2FADrawer
        isOpen={showCreateDrawer}
        email={email}
        existingMethods={email2FAMethods}
        onSubmit={handleCreate2FA}
        onClose={handleCancelCreate}
        loading={isCreating}
      />
    </div>
  )
}

export default Email2FASection
