// src/renderer/src/presentation/pages/EmailManager/components/EmailDrawer/ServiceAccount/ServiceAccountSecretCard.tsx
import React, { useState } from 'react'
import { Button } from '../../../../../../../../components/ui/button'
import CustomButton from '../../../../../../../../components/common/CustomButton'
import { Label } from '../../../../../../../../components/ui/label'
import CustomInput from '../../../../../../../../components/common/CustomInput'
import {
  Eye,
  EyeOff,
  Copy,
  Key,
  Trash2,
  Check,
  Calendar,
  AlertTriangle,
  Save,
  Edit2
} from 'lucide-react'
import { cn } from '../../../../../../../../shared/lib/utils'
import { ServiceAccountSecret } from '../../../../../types'

interface ServiceAccountSecretCardProps {
  secret: ServiceAccountSecret
  onSecretChange?: (secretId: string, secret: ServiceAccountSecret) => void
  onDeleteSecret?: (secretId: string) => void
  className?: string
  compact?: boolean
}

interface EditingSecretField {
  fieldName: string
  newFieldName: string
  newFieldValue: string
}

const ServiceAccountSecretCard: React.FC<ServiceAccountSecretCardProps> = ({
  secret,
  onSecretChange,
  onDeleteSecret,
  className
}) => {
  const [showSecrets, setShowSecrets] = useState(false)
  const [isEditing] = useState(false)

  const [editingSecretField, setEditingSecretField] = useState<EditingSecretField | null>(null)

  // State cho inline editing
  const [secretName, setSecretName] = useState(secret.secret_name || '')
  const [editingFields, setEditingFields] = useState<Record<string, string>>(() => {
    // Initialize editing fields from secret object
    const fields: Record<string, string> = {}
    if (secret.secret && typeof secret.secret === 'object') {
      Object.entries(secret.secret).forEach(([key, value]) => {
        if (key !== 'secret_name') {
          fields[key] = String(value)
        }
      })
    }
    return fields
  })

  const formatDateForInput = (dateString: string | undefined): string => {
    if (!dateString) return ''
    try {
      const date = new Date(dateString)
      if (isNaN(date.getTime())) return ''
      return date.toISOString().slice(0, 16)
    } catch {
      return ''
    }
  }

  const [expireDateValue, setExpireDateValue] = useState(formatDateForInput(secret.expire_at))

  // State cho việc lưu
  const [savingField, setSavingField] = useState<string | null>(null)
  const [saveStatus, setSaveStatus] = useState<{ [key: string]: 'success' | 'error' | null }>({})

  // Check if values have changed
  const hasSecretNameChanged = secretName !== (secret.secret_name || '')
  const hasExpireDateChanged = expireDateValue !== formatDateForInput(secret.expire_at)

  const hasFieldsChanged = Object.entries(editingFields).some(([key, value]) => {
    const originalValue =
      secret.secret && typeof secret.secret === 'object' ? String(secret.secret[key] || '') : ''
    return value !== originalValue
  })

  const startEditSecretField = (fieldName: string, fieldValue: string) => {
    setEditingSecretField({
      fieldName,
      newFieldName: fieldName,
      newFieldValue: fieldValue
    })
  }

  // Cancel secret field edit
  const cancelSecretFieldEdit = () => {
    setEditingSecretField(null)
  }

  // Save edited secret field
  const saveEditedSecretField = async () => {
    if (!editingSecretField || !onSecretChange) return

    const trimmedFieldName = editingSecretField.newFieldName.trim()
    const trimmedFieldValue = editingSecretField.newFieldValue.trim()

    // Validation
    if (!trimmedFieldName) {
      alert('Field name is required')
      return
    }

    if (!trimmedFieldValue) {
      alert('Field value is required')
      return
    }

    // Check if new field name already exists (except original)
    if (trimmedFieldName !== editingSecretField.fieldName && editingFields[trimmedFieldName]) {
      alert('Field name already exists')
      return
    }

    try {
      setSavingField('secret_field_edit')

      // Create new editing fields
      const newEditingFields = { ...editingFields }

      // If field name changed, remove old field
      if (trimmedFieldName !== editingSecretField.fieldName) {
        delete newEditingFields[editingSecretField.fieldName]
      }

      // Set new field
      newEditingFields[trimmedFieldName] = trimmedFieldValue

      // Update editing fields state
      setEditingFields(newEditingFields)

      // Update secret object
      const updatedSecret: ServiceAccountSecret = {
        ...secret,
        secret: {
          secret_name: secretName,
          ...newEditingFields
        }
      }

      await onSecretChange(secret.id, updatedSecret)

      setEditingSecretField(null)
      setSaveStatus((prev) => ({ ...prev, secret_field_edit: 'success' }))
      setTimeout(() => {
        setSaveStatus((prev) => ({ ...prev, secret_field_edit: null }))
      }, 2000)
    } catch (error) {
      console.error('Error saving secret field:', error)
      setSaveStatus((prev) => ({ ...prev, secret_field_edit: 'error' }))
    } finally {
      setSavingField(null)
    }
  }

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text)
    } catch (err) {
      console.error('Failed to copy:', err)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const parseDateFromInput = (inputValue: string): string => {
    if (!inputValue) return ''
    try {
      return new Date(inputValue).toISOString()
    } catch {
      return ''
    }
  }

  // Handle save field
  const handleSaveField = async (field: string) => {
    if (!onSecretChange) return

    try {
      setSavingField(field)

      const updatedSecret: ServiceAccountSecret = { ...secret }

      switch (field) {
        case 'secret_name':
          updatedSecret.secret_name = secretName
          // Update secret_name in secret object as well
          if (updatedSecret.secret && typeof updatedSecret.secret === 'object') {
            updatedSecret.secret.secret_name = secretName
          }
          break
        case 'expire_at':
          updatedSecret.expire_at = parseDateFromInput(expireDateValue) || undefined
          break
        case 'fields':
          // Update all fields in the secret object
          updatedSecret.secret = {
            secret_name: secretName,
            ...editingFields
          }
          break
        default:
          console.warn(`Unknown field: ${field}`)
          return
      }

      await onSecretChange(secret.id, updatedSecret)

      setSaveStatus((prev) => ({ ...prev, [field]: 'success' }))
      setTimeout(() => {
        setSaveStatus((prev) => ({ ...prev, [field]: null }))
      }, 2000)
    } catch (error) {
      console.error(`Error saving ${field}:`, error)
      setSaveStatus((prev) => ({ ...prev, [field]: 'error' }))
    } finally {
      setSavingField(null)
    }
  }

  // Handle delete
  const handleDelete = () => {
    if (onDeleteSecret && window.confirm('Are you sure you want to delete this secret?')) {
      onDeleteSecret(secret.id)
    }
  }

  // Handle add new field
  const handleAddField = () => {
    const newFieldName = prompt('Enter field name:')
    if (newFieldName && !editingFields[newFieldName]) {
      setEditingFields((prev) => ({
        ...prev,
        [newFieldName]: ''
      }))
    }
  }

  // Handle remove field
  const handleRemoveField = (fieldName: string) => {
    setEditingFields((prev) => {
      const newFields = { ...prev }
      delete newFields[fieldName]
      return newFields
    })
  }

  // Render status icon
  const renderStatusIcon = (field: string, hasChanged: boolean) => {
    if (savingField === field) {
      return <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
    }

    if (saveStatus[field] === 'success') {
      return <Check className="h-4 w-4 text-green-600" />
    }

    if (saveStatus[field] === 'error') {
      return <div className="text-red-600">!</div>
    }

    if (hasChanged) {
      return (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => handleSaveField(field)}
          className="p-0.5 h-5 w-5 text-green-600 hover:text-green-700 hover:bg-green-50"
          disabled={savingField !== null}
        >
          <Check className="h-2.5 w-2.5" />
        </Button>
      )
    }

    return undefined
  }

  // Check if secret is expired
  const isExpired = secret.expire_at && new Date(secret.expire_at) < new Date()
  const isExpiringSoon =
    secret.expire_at &&
    new Date(secret.expire_at) > new Date() &&
    new Date(secret.expire_at).getTime() - new Date().getTime() < 7 * 24 * 60 * 60 * 1000 // 7 days

  return (
    <div
      className={cn(
        'bg-card-background rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md transition-all duration-200',
        isExpired && 'border-red-300 dark:border-red-600 bg-red-50/30 dark:bg-red-900/10',
        isExpiringSoon &&
          !isExpired &&
          'border-amber-300 dark:border-amber-600 bg-amber-50/30 dark:bg-amber-900/10',
        className
      )}
    >
      <div className="p-4 space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-lg flex items-center justify-center shadow-sm">
              <Key className="h-5 w-5 text-white" />
            </div>

            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-base font-semibold text-text-primary">
                  {secret.secret_name || 'Unnamed Secret'}
                </span>
                {isExpired && (
                  <div className="flex items-center gap-1 px-2 py-0.5 bg-red-100 dark:bg-red-900/20 rounded-full">
                    <AlertTriangle className="h-3 w-3 text-red-600 dark:text-red-400" />
                    <span className="text-xs font-medium text-red-700 dark:text-red-300">
                      Expired
                    </span>
                  </div>
                )}
                {isExpiringSoon && !isExpired && (
                  <div className="flex items-center gap-1 px-2 py-0.5 bg-amber-100 dark:bg-amber-900/20 rounded-full">
                    <AlertTriangle className="h-3 w-3 text-amber-600 dark:text-amber-400" />
                    <span className="text-xs font-medium text-amber-700 dark:text-amber-300">
                      Expiring Soon
                    </span>
                  </div>
                )}
              </div>

              <div className="text-sm text-gray-500 dark:text-gray-400">
                {Object.keys(editingFields).length} field
                {Object.keys(editingFields).length !== 1 ? 's' : ''}
                {secret.expire_at && (
                  <span className="ml-2">• Expires: {formatDate(secret.expire_at)}</span>
                )}
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-1">
            <CustomButton
              variant="ghost"
              size="sm"
              onClick={handleDelete}
              icon={Trash2}
              className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20 text-xs px-2 py-1"
            >
              Delete
            </CustomButton>
          </div>
        </div>

        {/* Secret Name - Editable */}
        <div className="space-y-2">
          <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Secret Name
          </Label>
          <CustomInput
            value={secretName}
            onChange={setSecretName}
            placeholder="Enter secret name"
            variant="filled"
            size="sm"
            rightIcon={renderStatusIcon('secret_name', hasSecretNameChanged)}
            disabled={savingField !== null && savingField !== 'secret_name'}
          />
        </div>

        {/* Secret Fields */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Secret Fields
            </Label>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleAddField}
                className="p-1 h-6 w-6 text-purple-600 hover:text-purple-700 hover:bg-purple-50"
                title="Add field"
              >
                <Key className="h-3 w-3" />
              </Button>
              {hasFieldsChanged && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleSaveField('fields')}
                  className="p-1 h-6 w-6 text-green-600 hover:text-green-700 hover:bg-green-50"
                  disabled={savingField !== null}
                  title="Save changes"
                >
                  <Save className="h-3 w-3" />
                </Button>
              )}
            </div>
          </div>

          <div className="space-y-3">
            {Object.entries(editingFields).map(([fieldName, fieldValue]) => {
              const isBeingEdited = editingSecretField?.fieldName === fieldName

              if (isBeingEdited && editingSecretField) {
                return (
                  <div
                    key={fieldName}
                    className="bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800 p-4 space-y-3"
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <Edit2 className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                      <h5 className="font-medium text-blue-900 dark:text-blue-100">
                        Edit Secret Field
                      </h5>
                    </div>

                    <div className="space-y-3">
                      {/* Field Name */}
                      <CustomInput
                        label="Field Name"
                        value={editingSecretField.newFieldName}
                        onChange={(value) =>
                          setEditingSecretField((prev) =>
                            prev ? { ...prev, newFieldName: value } : null
                          )
                        }
                        placeholder="Enter field name..."
                        variant="filled"
                        size="sm"
                        required
                      />

                      {/* Field Value */}
                      <CustomInput
                        label="Field Value"
                        value={editingSecretField.newFieldValue}
                        onChange={(value) =>
                          setEditingSecretField((prev) =>
                            prev ? { ...prev, newFieldValue: value } : null
                          )
                        }
                        placeholder="Enter field value..."
                        variant="filled"
                        size="sm"
                        required
                      />

                      {/* Action Buttons */}
                      <div className="flex items-center gap-2 pt-1">
                        <CustomButton variant="primary" size="sm" onClick={saveEditedSecretField}>
                          Save Changes
                        </CustomButton>
                        <CustomButton variant="secondary" size="sm" onClick={cancelSecretFieldEdit}>
                          Cancel
                        </CustomButton>
                      </div>
                    </div>
                  </div>
                )
              }

              return (
                <div key={fieldName} className="space-y-2">
                  <Label className="text-xs text-gray-500 dark:text-gray-400">{fieldName}</Label>
                  <CustomInput
                    value={fieldValue}
                    readOnly
                    placeholder={`${fieldName} value`}
                    variant="filled"
                    size="sm"
                    rightIcon={
                      <div className="flex items-center gap-1">
                        {/* Edit Button */}
                        <button
                          onClick={() => startEditSecretField(fieldName, fieldValue)}
                          className="p-1 h-5 w-5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded transition-colors"
                          title="Edit field"
                        >
                          <Edit2 className="h-3 w-3" />
                        </button>

                        {/* Copy Button */}
                        <button
                          onClick={() => copyToClipboard(fieldValue)}
                          className="p-1 h-5 w-5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded transition-colors"
                          title="Copy value"
                        >
                          <Copy className="h-3 w-3" />
                        </button>

                        {/* Delete Button */}
                        <button
                          onClick={() => handleRemoveField(fieldName)}
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
            })}

            {Object.keys(editingFields).length === 0 && (
              <div className="text-center py-4">
                <div className="text-sm text-gray-500 dark:text-gray-400 mb-2">
                  No secret fields configured
                </div>
                {isEditing && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleAddField}
                    className="text-purple-600 hover:text-purple-700 hover:bg-purple-50"
                  >
                    <Key className="h-4 w-4 mr-1" />
                    Add Secret Field
                  </Button>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Expiry Date - Editable */}
        <div className="space-y-2">
          <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Expiry Date
          </Label>
          <CustomInput
            value={expireDateValue}
            onChange={setExpireDateValue}
            placeholder="Select expiry date"
            variant="filled"
            size="sm"
            type="datetime-local"
            leftIcon={<Calendar className="h-4 w-4" />}
            rightIcon={renderStatusIcon('expire_at', hasExpireDateChanged)}
            disabled={savingField !== null && savingField !== 'expire_at'}
          />
        </div>

        {/* Footer - Show dates and actions */}
        <div className="pt-3 border-t border-gray-100 dark:border-gray-700">
          <div className="flex justify-between items-center text-xs text-gray-500 dark:text-gray-400">
            <div className="flex items-center gap-4">
              {secret.expire_at && (
                <span
                  className={cn(
                    'flex items-center gap-1',
                    isExpired && 'text-red-600 dark:text-red-400',
                    isExpiringSoon && !isExpired && 'text-amber-600 dark:text-amber-400'
                  )}
                >
                  <Calendar className="h-3 w-3" />
                  Expires: {formatDate(secret.expire_at)}
                </span>
              )}
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowSecrets(!showSecrets)}
                className="p-1 h-5 w-5 text-gray-500 hover:text-gray-700"
                title={showSecrets ? 'Hide all secrets' : 'Show all secrets'}
              >
                {showSecrets ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ServiceAccountSecretCard
