// src/renderer/src/presentation/pages/EmailManager/components/EmailDrawer/ServiceAccount/ServiceAccountSecretForm.tsx

import React, { useState, useCallback, useMemo } from 'react'
import CustomButton from '../../../../../../components/common/CustomButton'
import CustomInput from '../../../../../../components/common/CustomInput'
import { Key, AlertCircle, Plus, Calendar, X, Save, Trash2 } from 'lucide-react'
import { ServiceAccount, ServiceAccountSecret } from '../../../types'

interface ServiceAccountSecretFormProps {
  serviceAccount: ServiceAccount
  onAddSecret?: (secretData: Omit<ServiceAccountSecret, 'id'>) => Promise<void>
  onCancel?: () => void
  loading?: boolean
  className?: string
}

interface SecretField {
  key: string
  value: string
}

const ServiceAccountSecretForm: React.FC<ServiceAccountSecretFormProps> = ({
  serviceAccount,
  onAddSecret,
  onCancel,
  className
}) => {
  const [isCreating, setIsCreating] = useState(false)

  // Form state đơn giản
  const [formData, setFormData] = useState({
    secret_name: '',
    expire_at: '',
    fields: [] as SecretField[]
  })

  const [errors, setErrors] = useState<Record<string, string>>({})

  // State cho field đang thêm
  const [newField, setNewField] = useState({
    key: '',
    value: ''
  })

  // Thêm field mới
  const handleAddField = useCallback(() => {
    if (!newField.key.trim() || !newField.value.trim()) {
      alert('Please enter both field name and value')
      return
    }

    // Kiểm tra trùng key
    if (formData.fields.some((field) => field.key === newField.key.trim())) {
      alert('Field name already exists')
      return
    }

    setFormData((prev) => ({
      ...prev,
      fields: [
        ...prev.fields,
        {
          key: newField.key.trim(),
          value: newField.value.trim()
        }
      ]
    }))

    // Reset new field inputs
    setNewField({ key: '', value: '' })
  }, [newField.key, newField.value, formData.fields])

  // Xóa field
  const handleRemoveField = useCallback((index: number) => {
    setFormData((prev) => ({
      ...prev,
      fields: prev.fields.filter((_, i) => i !== index)
    }))
  }, [])

  // Validate form
  const validateForm = useCallback((): boolean => {
    const newErrors: Record<string, string> = {}

    if (!formData.secret_name.trim()) {
      newErrors.secret_name = 'Secret name is required'
    }

    if (formData.expire_at) {
      const expiryDate = new Date(formData.expire_at)
      if (expiryDate <= new Date()) {
        newErrors.expire_at = 'Expiry date must be in the future'
      }
    }

    if (formData.fields.length === 0) {
      newErrors.fields = 'Please add at least one custom field (API key, token, etc.)'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }, [formData.secret_name, formData.expire_at, formData.fields.length])

  // Submit form
  const handleCreateSecret = async () => {
    if (!validateForm()) return

    try {
      setIsCreating(true)
      setErrors({})

      // Convert fields array to object
      const customFieldsObject = formData.fields.reduce(
        (acc, field) => {
          acc[field.key] = field.value
          return acc
        },
        {} as Record<string, string>
      )

      const secretData: Omit<ServiceAccountSecret, 'id'> = {
        service_account_id: serviceAccount.id,
        secret_name: formData.secret_name.trim(),
        secret: {
          secret_name: formData.secret_name.trim(),
          ...customFieldsObject
        },
        expire_at: formData.expire_at || undefined
      }

      if (onAddSecret) {
        await onAddSecret(secretData)
        handleResetForm()
      }
    } catch (error) {
      console.error('[ERROR] Error creating secret:', error)
      setErrors({
        general:
          error instanceof Error ? error.message : 'Failed to create secret. Please try again.'
      })
    } finally {
      setIsCreating(false)
    }
  }

  // Reset form
  const handleResetForm = useCallback(() => {
    setFormData({
      secret_name: '',
      expire_at: '',
      fields: []
    })
    setNewField({ key: '', value: '' })
    setErrors({})
  }, [])

  const handleCancelCreate = useCallback(() => {
    handleResetForm()
    onCancel?.()
  }, [handleResetForm, onCancel])

  // Get minimum date for expiry (today + 1 day)
  const getMinExpiryDate = useCallback(() => {
    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)
    return tomorrow.toISOString().slice(0, 16)
  }, [])

  const minExpiryDate = useMemo(() => getMinExpiryDate(), [getMinExpiryDate])

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
        key="secret-name-input"
        label="Secret Name"
        value={formData.secret_name}
        onChange={(value) => setFormData((prev) => ({ ...prev, secret_name: value }))}
        placeholder="e.g., Production API Keys, Development Tokens..."
        variant="filled"
        size="sm"
        leftIcon={<Key className="h-4 w-4" />}
        hint="Give this secret collection a descriptive name"
        error={errors.secret_name}
        required
        disabled={isCreating}
      />

      {/* Custom Fields Section */}
      <div className="border-t border-gray-200 dark:border-gray-700 pt-4 space-y-4">
        <div className="flex items-center justify-between">
          <h5 className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Custom Fields ({formData.fields.length})
          </h5>
        </div>

        {/* Add New Field Form - giống như CreateServiceAccount2FAForm */}
        <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800 p-4 space-y-3">
          <div className="flex items-center gap-2 mb-2">
            <Plus className="h-4 w-4 text-blue-600 dark:text-blue-400" />
            <span className="text-sm font-medium text-blue-800 dark:text-blue-300">
              Add Custom Field
            </span>
          </div>

          <div className="space-y-3">
            <CustomInput
              key="new-field-key-input"
              label="Field Name"
              value={newField.key}
              onChange={(value) => setNewField((prev) => ({ ...prev, key: value }))}
              placeholder="e.g., API Key, Access Token..."
              variant="filled"
              size="sm"
              disabled={isCreating}
            />
            <CustomInput
              key="new-field-value-input"
              label="Field Value"
              value={newField.value}
              onChange={(value) => setNewField((prev) => ({ ...prev, value: value }))}
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
              onClick={handleAddField}
              disabled={isCreating || !newField.key.trim() || !newField.value.trim()}
              icon={Plus}
            >
              Add Field
            </CustomButton>
          </div>
        </div>

        {/* Display Added Fields */}
        {formData.fields.length > 0 && (
          <div className="space-y-3">
            <h5 className="text-sm font-medium text-gray-700 dark:text-gray-300">Added Fields</h5>
            {formData.fields.map((field, index) => (
              <CustomInput
                key={`field-${index}-${field.key}`}
                label={field.key}
                value={field.value}
                readOnly
                variant="filled"
                size="sm"
                rightIcon={
                  <button
                    onClick={() => handleRemoveField(index)}
                    className="p-1 h-5 w-5 text-gray-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
                    title="Delete field"
                    disabled={isCreating}
                  >
                    <Trash2 className="h-3 w-3" />
                  </button>
                }
              />
            ))}
          </div>
        )}

        {errors.fields && (
          <p className="text-sm text-red-600 dark:text-red-400 flex items-center gap-1">
            <AlertCircle className="h-4 w-4" />
            {errors.fields}
          </p>
        )}
      </div>

      {/* Expiry Date */}
      <CustomInput
        key="expiry-date-input"
        label="Expiry Date (Optional)"
        type="datetime-local"
        value={formData.expire_at}
        onChange={(value) => setFormData((prev) => ({ ...prev, expire_at: value }))}
        variant="filled"
        size="sm"
        leftIcon={<Calendar className="h-4 w-4" />}
        hint="Set when these secrets expire (if applicable)"
        error={errors.expire_at}
        disabled={isCreating}
        minDate={minExpiryDate}
      />

      {/* Form Actions */}
      <div className="flex items-center justify-end gap-2 pt-3 border-t border-gray-200 dark:border-gray-700">
        {/* Hiển thị lỗi general nếu có */}
        {errors.general && (
          <div className="flex-1 mr-3">
            <p className="text-sm text-red-600 dark:text-red-400 flex items-center gap-1">
              <AlertCircle className="h-4 w-4" />
              {errors.general}
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
          disabled={isCreating || formData.fields.length === 0 || !formData.secret_name.trim()}
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
