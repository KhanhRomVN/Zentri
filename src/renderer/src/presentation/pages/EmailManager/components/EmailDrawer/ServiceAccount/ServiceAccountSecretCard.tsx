// src/renderer/src/presentation/pages/EmailManager/components/EmailDrawer/ServiceAccount/ServiceAccountSecretCard.tsx
import React, { useState } from 'react'
import CustomButton from '../../../../../../components/common/CustomButton'
import CustomInput from '../../../../../../components/common/CustomInput'
import CustomBadge from '../../../../../../components/common/CustomBadge'
import {
  Key,
  AlertCircle,
  Calendar,
  X,
  ChevronDown,
  ChevronUp,
  Copy,
  Eye,
  EyeOff
} from 'lucide-react'
import { ServiceAccountSecret } from '../../../types'

interface ServiceAccountSecretCardProps {
  secret: ServiceAccountSecret
  onDelete?: (secretId: string) => void
  onSecretChange?: (secretId: string, secret: ServiceAccountSecret) => void
  viewMode?: 'collapse' | 'expand'
  className?: string
}

const ServiceAccountSecretCard: React.FC<ServiceAccountSecretCardProps> = ({
  secret,
  onDelete,
  onSecretChange,
  viewMode = 'collapse',
  className
}) => {
  const [isExpanded, setIsExpanded] = useState(viewMode === 'expand')
  const [showSecrets, setShowSecrets] = useState<Record<string, boolean>>({})

  const handleDeleteClick = () => {
    if (onDelete && window.confirm('Are you sure you want to delete this secret?')) {
      onDelete(secret.id)
    }
  }

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text)
    } catch (err) {
      console.error('Failed to copy:', err)
    }
  }

  // Thêm function này ở đầu component ServiceAccountSecretCard
  const formatDateForInput = (dateString: string): string => {
    if (!dateString) return ''
    try {
      const date = new Date(dateString)
      if (isNaN(date.getTime())) return ''
      return date.toISOString().slice(0, 16)
    } catch {
      return ''
    }
  }

  // Check if secret is expired
  const isSecretExpired = (expireAt?: string) => {
    if (!expireAt) return false
    return new Date(expireAt) <= new Date()
  }

  // Extract custom fields (exclude secret_name)
  const { secret_name, ...customFields } = secret.secret || { secret_name: 'Unknown' }
  const customFieldsCount = Object.keys(customFields).length
  const expired = isSecretExpired(secret.expire_at)

  const toggleSecretVisibility = (fieldKey: string) => {
    setShowSecrets((prev) => ({
      ...prev,
      [fieldKey]: !prev[fieldKey]
    }))
  }

  const handleFieldChange = (fieldKey: string, newValue: string) => {
    if (!onSecretChange) return

    const updatedSecret = {
      ...secret,
      secret: {
        ...secret.secret,
        [fieldKey]: newValue
      }
    }

    onSecretChange(secret.id, updatedSecret)
  }

  const handleSecretNameChange = (newName: string) => {
    if (!onSecretChange) return

    const updatedSecret = {
      ...secret,
      secret: {
        ...secret.secret,
        secret_name: newName
      }
    }

    onSecretChange(secret.id, updatedSecret)
  }

  // Collapsed View
  const renderCollapsedView = () => (
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md transition-all duration-200">
      <div className="p-2">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-purple-50 dark:bg-purple-900/20 rounded-lg flex items-center justify-center">
              <Key className="h-4 w-4 text-purple-600 dark:text-purple-400" />
            </div>
            <div>
              <p className="font-medium text-text-primary text-base">{secret_name}</p>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  {customFieldsCount} field{customFieldsCount !== 1 ? 's' : ''}
                </span>
                {expired && (
                  <CustomBadge variant="error" size="sm" icon={AlertCircle} className="text-xs">
                    Expired
                  </CustomBadge>
                )}
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-1">
            {/* Expand Button */}
            <CustomButton
              variant="ghost"
              size="sm"
              onClick={() => setIsExpanded(true)}
              className="p-1 h-6 w-6 text-gray-500 hover:text-gray-700 hover:bg-gray-100 dark:hover:bg-gray-700"
              title="Expand details"
            >
              <ChevronDown className="h-3 w-3" />
            </CustomButton>

            {/* Delete button */}
            {onDelete && (
              <CustomButton
                variant="ghost"
                size="sm"
                onClick={handleDeleteClick}
                className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20 p-1 h-6 w-6"
                title="Delete secret"
              >
                <X className="h-3 w-3" />
              </CustomButton>
            )}
          </div>
        </div>
      </div>
    </div>
  )

  // Expanded View
  const renderExpandedView = () => (
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm">
      <div className="p-4 space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-purple-50 dark:bg-purple-900/20 rounded-lg flex items-center justify-center">
              <Key className="h-5 w-5 text-purple-600 dark:text-purple-400" />
            </div>
            <div>
              <h5 className="font-semibold text-gray-900 dark:text-white text-base">
                {secret_name}
              </h5>
              <div className="flex items-center gap-2 mt-1">
                {expired && (
                  <CustomBadge variant="error" size="sm" icon={AlertCircle} className="text-xs">
                    Expired
                  </CustomBadge>
                )}
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-1">
            {/* Collapse Button */}
            <CustomButton
              variant="ghost"
              size="sm"
              onClick={() => setIsExpanded(false)}
              className="p-1 h-6 w-6 text-gray-500 hover:text-gray-700 hover:bg-gray-100 dark:hover:bg-gray-700"
              title="Collapse"
            >
              <ChevronUp className="h-3 w-3" />
            </CustomButton>

            {/* Delete button */}
            {onDelete && (
              <CustomButton
                variant="ghost"
                size="sm"
                onClick={handleDeleteClick}
                className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20 p-1 h-6 w-6"
                title="Delete secret"
              >
                <X className="h-3 w-3" />
              </CustomButton>
            )}
          </div>
        </div>

        <div className="space-y-2">
          <CustomInput
            label="Secret Name"
            value={secret_name}
            onChange={handleSecretNameChange}
            variant="filled"
            size="sm"
            readOnly={!onSecretChange}
            leftIcon={<Key className="h-4 w-4" />}
          />
        </div>
        {/* Custom Fields - All fields visible */}
        {customFieldsCount > 0 && (
          <div className="space-y-3">
            <h6 className="font-medium text-gray-700 dark:text-gray-300 text-sm border-b border-gray-200 dark:border-gray-700 pb-2">
              Secret Fields
            </h6>

            {Object.entries(customFields).map(([key, value]) => (
              <div key={key} className="space-y-2">
                <CustomInput
                  label={key}
                  value={
                    showSecrets[key]
                      ? String(value)
                      : '•'.repeat(Math.min(String(value).length, 20))
                  }
                  onChange={(newValue) => handleFieldChange(key, newValue)}
                  variant="filled"
                  size="sm"
                  readOnly={!onSecretChange}
                  rightIcon={
                    <div className="flex items-center gap-1">
                      {/* Toggle Visibility */}
                      <button
                        onClick={() => toggleSecretVisibility(key)}
                        className="p-1 h-5 w-5 text-gray-500 hover:text-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 rounded transition-colors"
                        title={showSecrets[key] ? 'Hide value' : 'Show value'}
                      >
                        {showSecrets[key] ? (
                          <EyeOff className="h-3 w-3" />
                        ) : (
                          <Eye className="h-3 w-3" />
                        )}
                      </button>

                      {/* Copy Button */}
                      <button
                        onClick={() => copyToClipboard(String(value))}
                        className="p-1 h-5 w-5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded transition-colors"
                        title="Copy value"
                      >
                        <Copy className="h-3 w-3" />
                      </button>
                    </div>
                  }
                />
              </div>
            ))}
          </div>
        )}

        {/* Expiry Date Section - Editable */}
        <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
          <div className="space-y-3">
            <h6 className="font-medium text-gray-700 dark:text-gray-300 text-sm">Expired Date</h6>

            <CustomInput
              label="Expiry Date"
              type="datetime-local"
              value={secret.expire_at ? formatDateForInput(secret.expire_at) : ''}
              onChange={(value) => {
                if (!onSecretChange) return
                const updatedSecret = {
                  ...secret,
                  expire_at: value || undefined
                }
                onSecretChange(secret.id, updatedSecret)
              }}
              variant="filled"
              size="sm"
              readOnly={!onSecretChange}
              leftIcon={<Calendar className="h-4 w-4" />}
              hint={expired ? 'This secret has expired' : 'Set expiry date (optional)'}
              error={expired ? 'Secret expired' : undefined}
            />
          </div>
        </div>

        {/* Empty state for no custom fields */}
        {customFieldsCount === 0 && (
          <div className="text-center py-6 border-t border-gray-200 dark:border-gray-700">
            <div className="w-12 h-12 bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center mx-auto mb-3">
              <Key className="h-6 w-6 text-gray-400" />
            </div>
            <h6 className="font-medium text-gray-900 dark:text-white mb-1">No Secret Fields</h6>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              This secret collection doesn't contain any custom fields yet.
            </p>
          </div>
        )}
      </div>
    </div>
  )

  // Determine which view to show
  const shouldShowExpanded = viewMode === 'expand' || isExpanded

  return (
    <div className={className}>
      {shouldShowExpanded ? renderExpandedView() : renderCollapsedView()}
    </div>
  )
}

export default ServiceAccountSecretCard
