// src/renderer/src/presentation/pages/EmailManager/components/EmailDrawer/ServiceAccount/ServiceAccountSecretSection.tsx
import React, { useState } from 'react'
import CustomBadge from '../../../../../../components/common/CustomBadge'
import CustomButton from '../../../../../../components/common/CustomButton'
import CustomInput from '../../../../../../components/common/CustomInput'
import {
  Key,
  CheckCircle,
  AlertCircle,
  ChevronDown,
  ChevronUp,
  Plus,
  Database,
  Shield,
  Calendar,
  X,
  Save,
  Trash2,
  Edit
} from 'lucide-react'
import { cn } from '../../../../../../shared/lib/utils'
import { ServiceAccount, ServiceAccountSecret } from '../../../types'

interface ServiceAccountSecretSectionProps {
  serviceAccount: ServiceAccount
  secrets: ServiceAccountSecret[]
  onAddSecret?: (secretData: Omit<ServiceAccountSecret, 'id'>) => Promise<void>
  onSecretChange?: (secretId: string, secret: ServiceAccountSecret) => void
  onDeleteSecret?: (secretId: string) => void
  loading?: boolean
  error?: string
  className?: string
}

interface CreateSecretFormData {
  secret_name: string
  expire_at: string
  customFields: Record<string, any>
}

interface SecretField {
  key: string
  value: string
}

const ServiceAccountSecretSection: React.FC<ServiceAccountSecretSectionProps> = ({
  serviceAccount,
  secrets = [],
  onAddSecret,
  onDeleteSecret,
  loading = false,
  error,
  className
}) => {
  const [isExpanded, setIsExpanded] = useState(false)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [isCreating, setIsCreating] = useState(false)

  // Form state cho tạo secret mới
  const [createFormData, setCreateFormData] = useState<CreateSecretFormData>({
    secret_name: '',
    expire_at: '',
    customFields: {}
  })
  const [createFormErrors, setCreateFormErrors] = useState<Record<string, string>>({})

  // State cho custom fields form
  const [customFields, setCustomFields] = useState<SecretField[]>([])
  const [newFieldKey, setNewFieldKey] = useState('')
  const [newFieldValue, setNewFieldValue] = useState('')

  const hasSecrets = secrets.length > 0
  const activeSecrets = secrets.length

  const handleAddSecret = () => {
    setShowCreateForm(true)
    setIsExpanded(true)
    // Reset fields khi mở form mới
    setCustomFields([])
    setNewFieldKey('')
    setNewFieldValue('')
    setCreateFormData({
      secret_name: '',
      expire_at: '',
      customFields: {}
    })
  }

  // Handle thêm custom field mới
  const handleAddCustomField = () => {
    if (!newFieldKey.trim() || !newFieldValue.trim()) {
      alert('Please enter both field name and value')
      return
    }

    // Không cho phép tạo field có tên secret_name (reserved)
    if (newFieldKey.trim().toLowerCase() === 'secret_name') {
      alert('Field name "secret_name" is reserved. Please use a different name.')
      return
    }

    // Kiểm tra trùng key
    if (customFields.some((field) => field.key === newFieldKey.trim())) {
      alert('Field name already exists')
      return
    }

    const newField: SecretField = {
      key: newFieldKey.trim(),
      value: newFieldValue.trim()
    }

    setCustomFields((prev) => [...prev, newField])

    // Update createFormData.customFields
    const updatedCustomFields = { ...createFormData.customFields }
    updatedCustomFields[newField.key] = newField.value
    setCreateFormData((prev) => ({ ...prev, customFields: updatedCustomFields }))

    // Reset input fields
    setNewFieldKey('')
    setNewFieldValue('')
  }

  // Handle xóa custom field
  const handleRemoveCustomField = (keyToRemove: string) => {
    setCustomFields((prev) => prev.filter((field) => field.key !== keyToRemove))

    // Update createFormData.customFields
    const updatedCustomFields = { ...createFormData.customFields }
    delete updatedCustomFields[keyToRemove]
    setCreateFormData((prev) => ({ ...prev, customFields: updatedCustomFields }))
  }

  // Handle update custom field
  const handleUpdateCustomField = (oldKey: string, newKey: string, newValue: string) => {
    if (!newKey.trim() || !newValue.trim()) {
      alert('Please enter both field name and value')
      return
    }

    // Không cho phép tạo field có tên secret_name (reserved)
    if (newKey.trim().toLowerCase() === 'secret_name') {
      alert('Field name "secret_name" is reserved. Please use a different name.')
      return
    }

    // Kiểm tra trùng key (trừ chính nó)
    if (oldKey !== newKey && customFields.some((field) => field.key === newKey.trim())) {
      alert('Field name already exists')
      return
    }

    // Update custom fields
    setCustomFields((prev) =>
      prev.map((field) =>
        field.key === oldKey ? { key: newKey.trim(), value: newValue.trim() } : field
      )
    )

    // Update createFormData.customFields
    const updatedCustomFields = { ...createFormData.customFields }
    if (oldKey !== newKey) {
      delete updatedCustomFields[oldKey]
    }
    updatedCustomFields[newKey.trim()] = newValue.trim()
    setCreateFormData((prev) => ({ ...prev, customFields: updatedCustomFields }))
  }

  const handleCreateSecret = async () => {
    try {
      setIsCreating(true)
      setCreateFormErrors({})

      // Validate form
      const newErrors: Record<string, string> = {}

      // Validate secret name (bắt buộc)
      if (!createFormData.secret_name.trim()) {
        newErrors.secret_name = 'Secret name is required'
      }

      // Validate expiry date if provided
      if (createFormData.expire_at) {
        const expiryDate = new Date(createFormData.expire_at)
        if (expiryDate <= new Date()) {
          newErrors.expire_at = 'Expiry date must be in the future'
        }
      }

      // Check if có ít nhất 1 custom field
      if (customFields.length === 0) {
        newErrors.customFields = 'Please add at least one custom field (API key, token, etc.)'
      }

      if (Object.keys(newErrors).length > 0) {
        setCreateFormErrors(newErrors)
        return
      }

      console.log('[DEBUG] Creating new secret for service:', serviceAccount.id)
      console.log('[DEBUG] Secret name:', createFormData.secret_name)
      console.log('[DEBUG] Custom fields:', customFields)

      if (onAddSecret) {
        // Prepare secret data với cấu trúc mới
        const secretData: Omit<ServiceAccountSecret, 'id'> = {
          service_account_id: serviceAccount.id,
          secret: {
            secret_name: createFormData.secret_name.trim(),
            ...createFormData.customFields
          },
          expire_at: createFormData.expire_at || undefined
        }

        console.log('[DEBUG] Final secret data to create:', secretData)

        // Gọi callback để parent component xử lý việc tạo secret mới
        await onAddSecret(secretData)

        // Reset form CHỈ sau khi tạo thành công
        setCreateFormData({
          secret_name: '',
          expire_at: '',
          customFields: {}
        })
        setCustomFields([])
        setNewFieldKey('')
        setNewFieldValue('')
        setShowCreateForm(false)

        console.log('[DEBUG] Secret created successfully, form reset')
      }
    } catch (error) {
      console.error('[ERROR] Error creating secret:', error)
      setCreateFormErrors({
        general:
          error instanceof Error ? error.message : 'Failed to create secret. Please try again.'
      })
    } finally {
      setIsCreating(false)
    }
  }

  const handleCancelCreate = () => {
    setShowCreateForm(false)
    setCreateFormData({
      secret_name: '',
      expire_at: '',
      customFields: {}
    })
    setCustomFields([])
    setNewFieldKey('')
    setNewFieldValue('')
    setCreateFormErrors({})
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

  // Get minimum date for expiry (today + 1 day)
  const getMinExpiryDate = () => {
    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)
    return tomorrow.toISOString().slice(0, 16)
  }

  // Format date display
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  // Check if secret is expired
  const isSecretExpired = (expireAt?: string) => {
    if (!expireAt) return false
    return new Date(expireAt) <= new Date()
  }

  // Custom Fields Form Component
  const CustomFieldsForm = () => (
    <div className="space-y-4">
      {/* Add New Field Form */}
      <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800 p-4 space-y-4">
        <div className="flex items-center gap-2 mb-2">
          <Plus className="h-4 w-4 text-blue-600 dark:text-blue-400" />
          <span className="text-sm font-medium text-blue-800 dark:text-blue-300">
            Add Custom Field
          </span>
          <span className="text-xs text-gray-500">(API keys, tokens, etc.)</span>
        </div>

        <div className="space-y-3">
          <CustomInput
            label="Field Name"
            value={newFieldKey}
            onChange={setNewFieldKey}
            placeholder="e.g., API Key, Access Token, Client Secret..."
            variant="filled"
            size="sm"
            disabled={isCreating}
            hint="Cannot use 'secret_name' as field name"
          />
          <CustomInput
            label="Field Value"
            value={newFieldValue}
            onChange={setNewFieldValue}
            placeholder="Enter the secret value..."
            variant="filled"
            size="sm"
            disabled={isCreating}
          />
        </div>

        <div className="flex justify-end">
          <CustomButton
            variant="primary"
            size="sm"
            onClick={handleAddCustomField}
            disabled={isCreating || !newFieldKey.trim() || !newFieldValue.trim()}
            icon={Plus}
            className="bg-blue-600 hover:bg-blue-700 text-xs"
          >
            Add Field
          </CustomButton>
        </div>
      </div>

      {/* Created Fields - Below the form */}
      {customFields.length > 0 && (
        <div className="space-y-3">
          <h5 className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Custom Fields ({customFields.length})
          </h5>
          {customFields.map((field, index) => (
            <CustomFieldItem
              key={`${field.key}-${index}`}
              field={field}
              onUpdate={(newKey, newValue) => handleUpdateCustomField(field.key, newKey, newValue)}
              onRemove={() => handleRemoveCustomField(field.key)}
            />
          ))}
        </div>
      )}

      {createFormErrors.customFields && (
        <p className="text-sm text-red-600 dark:text-red-400 flex items-center gap-1">
          <AlertCircle className="h-4 w-4" />
          {createFormErrors.customFields}
        </p>
      )}
    </div>
  )

  // Custom Field Item Component
  const CustomFieldItem: React.FC<{
    field: SecretField
    onUpdate: (newKey: string, newValue: string) => void
    onRemove: () => void
  }> = ({ field, onUpdate, onRemove }) => {
    const [isEditing, setIsEditing] = useState(false)
    const [editKey, setEditKey] = useState(field.key)
    const [editValue, setEditValue] = useState(field.value)

    const handleSave = () => {
      onUpdate(editKey, editValue)
      setIsEditing(false)
    }

    const handleCancel = () => {
      setEditKey(field.key)
      setEditValue(field.value)
      setIsEditing(false)
    }

    if (isEditing) {
      return (
        <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800 p-4 space-y-3">
          <div className="flex items-center gap-2 mb-1">
            <Edit className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
            <h5 className="font-medium text-yellow-900 dark:text-yellow-100">Edit Field</h5>
          </div>
          <CustomInput
            label="Field Name"
            value={editKey}
            onChange={setEditKey}
            placeholder="Field name"
            variant="filled"
            size="sm"
          />
          <CustomInput
            label="Field Value"
            value={editValue}
            onChange={setEditValue}
            placeholder="Field value"
            variant="filled"
            size="sm"
          />
          <div className="flex justify-end gap-2">
            <CustomButton variant="secondary" size="sm" onClick={handleCancel}>
              Cancel
            </CustomButton>
            <CustomButton variant="primary" size="sm" onClick={handleSave}>
              Save Changes
            </CustomButton>
          </div>
        </div>
      )
    }

    // Display mode
    return (
      <div>
        <CustomInput
          label={field.key}
          value={field.value}
          readOnly
          variant="filled"
          size="sm"
          rightIcon={
            <div className="flex items-center gap-1">
              {/* Edit Button */}
              <button
                onClick={() => setIsEditing(true)}
                className="p-1 h-5 w-5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded transition-colors"
                title="Edit field"
              >
                <Edit className="h-3 w-3" />
              </button>

              {/* Delete Button */}
              <button
                onClick={onRemove}
                className="p-1 h-5 w-5 text-gray-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
                title="Delete field"
              >
                <Trash2 className="h-3 w-3" />
              </button>
            </div>
          }
        />
      </div>
    )
  }

  // Create form component
  const CreateSecretForm = () => (
    <div className="space-y-4">
      {/* Fixed Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Plus className="h-4 w-4 text-purple-600 dark:text-purple-400" />
          <h4 className="font-medium text-gray-900 dark:text-gray-100">
            Add New Secret for {serviceAccount.service_name}
          </h4>
        </div>
        <CustomButton
          variant="ghost"
          size="sm"
          onClick={handleCancelCreate}
          disabled={isCreating}
          className="p-1 h-6 w-6"
        >
          <X className="h-3 w-3" />
        </CustomButton>
      </div>

      {/* Secret Name Field - Required */}
      <CustomInput
        label="Secret Name"
        value={createFormData.secret_name}
        onChange={(value) => setCreateFormData((prev) => ({ ...prev, secret_name: value }))}
        placeholder="e.g., Production API Keys, Development Tokens..."
        variant="filled"
        size="sm"
        leftIcon={<Key className="h-4 w-4" />}
        hint="Give this secret collection a descriptive name"
        error={createFormErrors.secret_name}
        required
        disabled={isCreating}
      />

      {/* Custom Fields Form - ALWAYS VISIBLE */}
      <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
        <CustomFieldsForm />
      </div>

      {/* Expiry Date */}
      <CustomInput
        label="Expiry Date (Optional)"
        type="datetime-local"
        value={createFormData.expire_at}
        onChange={(value) => setCreateFormData((prev) => ({ ...prev, expire_at: value }))}
        variant="filled"
        size="sm"
        leftIcon={<Calendar className="h-4 w-4" />}
        hint="Set when these secrets expire (if applicable)"
        error={createFormErrors.expire_at}
        disabled={isCreating}
        minDate={getMinExpiryDate()}
      />

      {/* Form Actions */}
      <div className="flex items-center justify-end gap-2 pt-3 border-t border-gray-200 dark:border-gray-700">
        {/* Hiển thị lỗi general nếu có */}
        {createFormErrors.general && (
          <div className="flex-1 mr-3">
            <p className="text-sm text-red-600 dark:text-red-400 flex items-center gap-1">
              <AlertCircle className="h-4 w-4" />
              {createFormErrors.general}
            </p>
          </div>
        )}

        <CustomButton
          variant="secondary"
          size="sm"
          onClick={handleCancelCreate}
          disabled={isCreating}
          className="min-w-[70px]"
        >
          Cancel
        </CustomButton>
        <CustomButton
          variant="primary"
          size="sm"
          onClick={handleCreateSecret}
          disabled={isCreating || customFields.length === 0 || !createFormData.secret_name.trim()}
          loading={isCreating}
          icon={Save}
          className="min-w-[120px] bg-purple-600 hover:bg-purple-700"
        >
          Add Secret
        </CustomButton>
      </div>
    </div>
  )

  // Secret card component
  const SecretCard = ({ secret }: { secret: ServiceAccountSecret }) => {
    const expired = isSecretExpired(secret.expire_at)

    const handleDeleteClick = () => {
      if (onDeleteSecret && window.confirm('Are you sure you want to delete this secret?')) {
        onDeleteSecret(secret.id)
      }
    }

    // Extract custom fields (exclude secret_name)
    const { secret_name, ...customFields } = secret.secret || { secret_name: 'Unknown' }
    const customFieldsCount = Object.keys(customFields).length

    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md transition-all duration-200">
        <div className="p-4">
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-purple-50 dark:bg-purple-900/20 rounded-lg flex items-center justify-center">
                <Key className="h-4 w-4 text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <h5 className="font-medium text-gray-900 dark:text-white">{secret_name}</h5>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    {customFieldsCount} custom field{customFieldsCount !== 1 ? 's' : ''}
                  </span>
                  {expired && (
                    <CustomBadge variant="error" size="sm" icon={AlertCircle} className="text-xs">
                      Expired
                    </CustomBadge>
                  )}
                </div>
              </div>
            </div>

            {/* Delete button */}
            {onDeleteSecret && (
              <CustomButton
                variant="ghost"
                size="sm"
                onClick={handleDeleteClick}
                className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20 p-1 h-6 w-6"
              >
                <X className="h-3 w-3" />
              </CustomButton>
            )}
          </div>

          {/* Custom Fields Preview */}
          {customFieldsCount > 0 && (
            <div className="mb-3 space-y-2">
              {Object.entries(customFields)
                .slice(0, 2)
                .map(([key, value]) => (
                  <div key={key} className="flex items-center justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-400 font-medium">{key}:</span>
                    <span className="text-gray-500 dark:text-gray-500 truncate max-w-[120px]">
                      {'•'.repeat(Math.min(String(value).length, 12))}
                    </span>
                  </div>
                ))}
              {customFieldsCount > 2 && (
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  +{customFieldsCount - 2} more field{customFieldsCount - 2 !== 1 ? 's' : ''}
                </div>
              )}
            </div>
          )}

          {/* Expiry Info */}
          {secret.expire_at && (
            <div
              className={cn(
                'text-xs px-2 py-1 rounded-md mb-3 flex items-center gap-1',
                expired
                  ? 'bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-300'
                  : 'bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-300'
              )}
            >
              <Calendar className="h-3 w-3" />
              {expired ? 'Expired' : 'Expires'}: {formatDate(secret.expire_at)}
            </div>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className={cn('space-y-6', className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="pl-2">
          <h3 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
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
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200/60 dark:border-gray-700/60 shadow-sm hover:shadow-md transition-all duration-200">
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
              {showCreateForm && <CreateSecretForm />}

              {/* Secrets List */}
              {!loading && !error && hasSecrets ? (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium text-gray-900 dark:text-white text-sm">
                      Stored Secrets
                    </h4>
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      {activeSecrets} total
                    </span>
                  </div>

                  <div className="grid gap-3">
                    {secrets.map((secret) => (
                      <SecretCard key={secret.id} secret={secret} />
                    ))}
                  </div>
                </div>
              ) : !loading && !error && !hasSecrets && !showCreateForm ? (
                /* Empty State */
                <div className="text-center py-8">
                  <div className="w-12 h-12 bg-gray-100 dark:bg-gray-700 rounded-xl flex items-center justify-center mx-auto mb-3">
                    <Key className="h-6 w-6 text-gray-400" />
                  </div>

                  <h4 className="text-base font-medium text-gray-900 dark:text-white mb-2">
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
