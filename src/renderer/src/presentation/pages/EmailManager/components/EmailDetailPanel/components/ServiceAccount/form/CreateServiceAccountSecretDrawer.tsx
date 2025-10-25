// src/renderer/src/presentation/pages/EmailManager/components/EmailDetailPanel/components/ServiceAccount/form/CreateServiceAccountSecretDrawer.tsx

import React, { useState, useCallback, useMemo, useEffect } from 'react'
import CustomButton from '../../../../../../../../components/common/CustomButton'
import CustomInput from '../../../../../../../../components/common/CustomInput'
import CustomDrawer from '../../../../../../../../components/common/CustomDrawer'
import CustomCombobox from '../../../../../../../../components/common/CustomCombobox'
import { Key, AlertCircle, Plus, Calendar, Trash2 } from 'lucide-react'
import { ServiceAccount, ServiceAccountSecret } from '../../../../../types'

interface CreateServiceAccountSecretDrawerProps {
  isOpen: boolean
  serviceAccount: ServiceAccount
  allServiceAccountSecrets?: ServiceAccountSecret[]
  allServiceAccounts?: ServiceAccount[]
  onSubmit: (secretData: Omit<ServiceAccountSecret, 'id'>) => Promise<void>
  onClose: () => void
  loading?: boolean
}

interface SecretField {
  key: string
  value: string
}

const CreateServiceAccountSecretDrawer: React.FC<CreateServiceAccountSecretDrawerProps> = ({
  isOpen,
  serviceAccount,
  allServiceAccountSecrets = [],
  allServiceAccounts = [],
  onSubmit,
  onClose,
  loading = false
}) => {
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

  // Reset form when drawer opens/closes
  useEffect(() => {
    if (isOpen) {
      setFormData({
        secret_name: '',
        expire_at: '',
        fields: []
      })
      setNewField({ key: '', value: '' })
      setErrors({})
    }
  }, [isOpen])

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

  // Compute available secret names from allServiceAccountSecrets
  const availableSecretNames = useMemo(() => {
    if (!allServiceAccountSecrets || allServiceAccountSecrets.length === 0) {
      return []
    }

    if (!allServiceAccounts || allServiceAccounts.length === 0) {
      return []
    }

    const secretNameSet = new Set<string>()
    allServiceAccountSecrets.forEach((secret: ServiceAccountSecret) => {
      const relatedService = allServiceAccounts.find((sa) => sa.id === secret.service_account_id)

      // Chỉ lấy secret_name của các service có cùng service_name với serviceAccount hiện tại
      if (
        relatedService &&
        relatedService.service_name.toLowerCase() === serviceAccount.service_name.toLowerCase() &&
        secret.secret_name &&
        secret.secret_name.trim()
      ) {
        secretNameSet.add(secret.secret_name.trim())
      }
    })

    const result = Array.from(secretNameSet)
      .sort((a, b) => a.localeCompare(b))
      .map((name) => ({
        value: name,
        label: name
      }))

    return result
  }, [allServiceAccountSecrets, allServiceAccounts, serviceAccount.service_name])

  // Submit form
  const handleSubmit = async () => {
    if (!validateForm()) return

    try {
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

      await onSubmit(secretData)

      // Reset form sau khi submit thành công
      setFormData({
        secret_name: '',
        expire_at: '',
        fields: []
      })
      setNewField({ key: '', value: '' })
      setErrors({})

      onClose()
    } catch (error) {
      console.error('[ERROR] Error creating secret:', error)
      setErrors({
        general:
          error instanceof Error ? error.message : 'Failed to create secret. Please try again.'
      })
    }
  }

  // Get minimum date for expiry (today + 1 day)
  const getMinExpiryDate = useCallback(() => {
    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)
    return tomorrow.toISOString().slice(0, 16)
  }, [])

  const minExpiryDate = useMemo(() => getMinExpiryDate(), [getMinExpiryDate])

  return (
    <CustomDrawer
      isOpen={isOpen}
      onClose={onClose}
      title={`Add Secret for ${serviceAccount.service_name}`}
      subtitle="Store API keys, tokens, and other sensitive credentials securely"
      size="md"
      footerActions={
        <div className="flex items-center justify-between w-full">
          {/* Hiển thị lỗi general nếu có */}
          {errors.general && (
            <div className="flex-1 mr-3">
              <p className="text-sm text-red-600 dark:text-red-400 flex items-center gap-1">
                <AlertCircle className="h-4 w-4" />
                {errors.general}
              </p>
            </div>
          )}
          <div className="flex items-center gap-2 ml-auto">
            <CustomButton
              variant="secondary"
              size="sm"
              onClick={onClose}
              disabled={loading}
              className="min-w-[80px]"
            >
              Cancel
            </CustomButton>
            <CustomButton
              variant="primary"
              size="sm"
              onClick={handleSubmit}
              disabled={loading || formData.fields.length === 0 || !formData.secret_name.trim()}
              loading={loading}
              className="min-w-[140px] bg-purple-600 hover:bg-purple-700 text-white"
            >
              Add Secret
            </CustomButton>
          </div>
        </div>
      }
    >
      <div className="space-y-4 p-4">
        {/* Secret Name Field - Required */}
        <div className="space-y-1">
          <CustomCombobox
            label="Secret Name"
            value={formData.secret_name}
            options={availableSecretNames}
            onChange={(value) => {
              const secretName = Array.isArray(value) ? value[0] : value
              setFormData((prev) => ({ ...prev, secret_name: secretName }))
            }}
            placeholder="Select or create secret name..."
            searchable={true}
            creatable={true}
            size="sm"
            required
          />
          {errors.secret_name && (
            <p className="text-xs text-red-600 dark:text-red-400 flex items-center gap-1">
              <AlertCircle className="h-3 w-3" />
              {errors.secret_name}
            </p>
          )}
          {formData.secret_name &&
            availableSecretNames.find((s) => s.value === formData.secret_name) && (
              <p className="text-xs text-blue-600 dark:text-blue-400 flex items-center gap-1">
                ℹ️ This secret name was used before for {serviceAccount.service_name}
              </p>
            )}
        </div>

        {/* Custom Fields Section */}
        <div className="border-t border-gray-200 dark:border-gray-700 pt-4 space-y-4">
          <div className="flex items-center justify-between">
            <h5 className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Custom Fields ({formData.fields.length})
            </h5>
          </div>

          {/* Add New Field Form */}
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
                disabled={loading}
              />
              <CustomInput
                key="new-field-value-input"
                label="Field Value"
                value={newField.value}
                onChange={(value) => setNewField((prev) => ({ ...prev, value: value }))}
                placeholder="Enter the secret value..."
                variant="filled"
                size="sm"
                disabled={loading}
              />
            </div>

            <div className="flex justify-end">
              <CustomButton
                variant="primary"
                size="sm"
                onClick={handleAddField}
                disabled={loading || !newField.key.trim() || !newField.value.trim()}
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
                      disabled={loading}
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  }
                />
              ))}
            </div>
          )}

          {errors.fields && (
            <p className="text-xs text-red-600 dark:text-red-400 flex items-center gap-1">
              <AlertCircle className="h-3 w-3" />
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
          disabled={loading}
          minDate={minExpiryDate}
        />
      </div>
    </CustomDrawer>
  )
}

export default CreateServiceAccountSecretDrawer
