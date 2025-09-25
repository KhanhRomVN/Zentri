// src/renderer/src/presentation/pages/EmailManager/components/EmailDrawer/ServiceAccount/ServiceAccountSecretForm.tsx
import React, { useState } from 'react'
import CustomButton from '../../../../../../components/common/CustomButton'
import CustomInput from '../../../../../../components/common/CustomInput'
import { Key, AlertCircle, Plus, Calendar, X, Save, Trash2, Edit } from 'lucide-react'
import { ServiceAccount, ServiceAccountSecret } from '../../../types'

interface ServiceAccountSecretFormProps {
  serviceAccount: ServiceAccount
  onAddSecret?: (secretData: Omit<ServiceAccountSecret, 'id'>) => Promise<void>
  onCancel?: () => void
  loading?: boolean
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

const ServiceAccountSecretForm: React.FC<ServiceAccountSecretFormProps> = ({
  serviceAccount,
  onAddSecret,
  onCancel,
  loading = false,
  className
}) => {
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
        handleResetForm()

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

  const handleResetForm = () => {
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

  const handleCancelCreate = () => {
    handleResetForm()
    onCancel?.()
  }

  // Get minimum date for expiry (today + 1 day)
  const getMinExpiryDate = () => {
    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)
    return tomorrow.toISOString().slice(0, 16)
  }

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
            value={newFieldKey}
            onChange={(value) => setNewFieldKey(value)}
            placeholder="e.g., API Key, Access Token, Client Secret..."
            variant="filled"
            size="sm"
            disabled={isCreating}
            hint="Cannot use 'secret_name' as field name"
          />
          <CustomInput
            label="Field Value"
            value={newFieldValue}
            onChange={(value) => setNewFieldValue(value)}
            placeholder="Enter the secret value..."
            variant="filled"
            size="sm"
            disabled={isCreating}
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

  return (
    <div className={`space-y-4 ${className || ''}`}>
      {/* Fixed Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-purple-50 dark:bg-purple-900/20 rounded-lg flex items-center justify-center">
            <Plus className="h-4 w-4 text-purple-600 dark:text-purple-400" />
          </div>
          <div>
            <h4 className="font-medium text-gray-900 dark:text-gray-100">
              Add New Secret for {serviceAccount.service_name}
            </h4>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Store API keys, tokens, and other sensitive credentials securely
            </p>
          </div>
        </div>
        <button
          onClick={handleCancelCreate}
          disabled={isCreating}
          className="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors disabled:opacity-50"
        >
          <X className="h-4 w-4" />
        </button>
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
}

export default ServiceAccountSecretForm
