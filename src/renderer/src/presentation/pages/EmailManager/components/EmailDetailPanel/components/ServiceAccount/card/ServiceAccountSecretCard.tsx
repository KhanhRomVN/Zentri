// src/renderer/src/presentation/pages/EmailManager/components/EmailDrawer/ServiceAccount/ServiceAccountSecretCard.tsx
import React, { useState, useEffect } from 'react'
import { Button } from '../../../../../../../../components/ui/button'
import CustomBadge from '../../../../../../../../components/common/CustomBadge'
import CustomButton from '../../../../../../../../components/common/CustomButton'
import CustomInput from '../../../../../../../../components/common/CustomInput'
import {
  Eye,
  EyeOff,
  Copy,
  Key,
  Trash2,
  Calendar,
  AlertTriangle,
  Edit2,
  ChevronDown,
  ChevronUp,
  Plus
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
  const [isExpanded, setIsExpanded] = useState(true)
  const [editingSecretField, setEditingSecretField] = useState<EditingSecretField | null>(null)

  // State cho inline editing
  const [secretName, setSecretName] = useState(secret.secret_name || '')
  const [editingFields, setEditingFields] = useState<Record<string, string>>(() => {
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

  // ✅ Sync secretName khi secret.secret_name thay đổi
  useEffect(() => {
    setSecretName(secret.secret_name || '')
  }, [secret.secret_name])

  // ✅ Sync editingFields khi secret.secret thay đổi
  useEffect(() => {
    const fields: Record<string, string> = {}
    if (secret.secret && typeof secret.secret === 'object') {
      Object.entries(secret.secret).forEach(([key, value]) => {
        if (key !== 'secret_name') {
          fields[key] = String(value)
        }
      })
    }
    setEditingFields(fields)
  }, [secret.secret])

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

  // Track changes state - sử dụng cho CustomInput props
  const [savingField, setSavingField] = useState<string | null>(null)
  const [saveSuccess, setSaveSuccess] = useState<{ [key: string]: boolean }>({})

  // ✅ Reset saveSuccess khi component mount
  useEffect(() => {
    console.log('[ServiceAccountSecretCard] Component mounted, resetting saveSuccess')
    setSaveSuccess({})
  }, [])

  // ✅ Reset saveSuccess khi secret thay đổi
  useEffect(() => {
    console.log(
      '[ServiceAccountSecretCard] Secret changed, resetting saveSuccess. Secret ID:',
      secret.id
    )
    setSaveSuccess({})
  }, [secret.id])

  // ✅ Log saveSuccess changes
  useEffect(() => {
    console.log('[ServiceAccountSecretCard] saveSuccess state changed:', saveSuccess)
  }, [saveSuccess])

  // Initial values for tracking
  const initialExpireDate = formatDateForInput(secret.expire_at)
  const initialFields = (() => {
    const fields: Record<string, string> = {}
    if (secret.secret && typeof secret.secret === 'object') {
      Object.entries(secret.secret).forEach(([key, value]) => {
        if (key !== 'secret_name') {
          fields[key] = String(value)
        }
      })
    }
    return fields
  })()

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text)
    } catch (err) {
      console.error('Failed to copy:', err)
    }
  }

  const parseDateFromInput = (inputValue: string): string => {
    if (!inputValue) return ''
    try {
      return new Date(inputValue).toISOString()
    } catch {
      return ''
    }
  }

  const handleSaveField = async (field: string, value: string) => {
    if (!onSecretChange) {
      return
    }

    try {
      setSavingField(field)
      // Reset save success state trước khi save
      setSaveSuccess((prev) => ({ ...prev, [field]: false }))

      const updatedSecret: ServiceAccountSecret = { ...secret }

      switch (field) {
        case 'secret_name':
          updatedSecret.secret_name = value
          if (updatedSecret.secret && typeof updatedSecret.secret === 'object') {
            updatedSecret.secret.secret_name = value
          }
          break
        case 'expire_at':
          updatedSecret.expire_at = parseDateFromInput(value) || undefined
          break
        case 'fields':
          updatedSecret.secret = {
            secret_name: secretName,
            ...editingFields
          }
          break
        default:
          console.warn(`[DEBUG] Unknown field: ${field}`)
          return
      }

      await onSecretChange(secret.id, updatedSecret)

      // Set success state
      setSaveSuccess((prev) => ({ ...prev, [field]: true }))

      // Reset success state sau 2 giây
      setTimeout(() => {
        setSaveSuccess((prev) => ({ ...prev, [field]: false }))
      }, 2000)
    } catch (error) {
      console.error(`[ERROR ServiceAccountSecretCard] Error saving ${field}:`, error)
      console.error('[ERROR] Error stack:', error instanceof Error ? error.stack : 'No stack')
      setSaveSuccess((prev) => ({ ...prev, [field]: false }))
      alert(`Error saving ${field}. Please try again.`)
    } finally {
      setSavingField(null)
    }
  }

  const handleDelete = () => {
    if (onDeleteSecret && window.confirm('Are you sure you want to delete this secret?')) {
      onDeleteSecret(secret.id)
    }
  }

  const handleAddField = () => {
    const newFieldName = prompt('Enter field name:')
    if (newFieldName && !editingFields[newFieldName]) {
      setEditingFields((prev) => ({
        ...prev,
        [newFieldName]: ''
      }))
    }
  }

  const handleRemoveField = (fieldName: string) => {
    const newFields = { ...editingFields }
    delete newFields[fieldName]
    setEditingFields(newFields)
  }

  const startEditSecretField = (fieldName: string, fieldValue: string) => {
    setEditingSecretField({
      fieldName,
      newFieldName: fieldName,
      newFieldValue: fieldValue
    })
  }

  const cancelSecretFieldEdit = () => {
    setEditingSecretField(null)
  }

  const saveEditedSecretField = async () => {
    if (!editingSecretField || !onSecretChange) return

    const trimmedFieldName = editingSecretField.newFieldName.trim()
    const trimmedFieldValue = editingSecretField.newFieldValue.trim()

    if (!trimmedFieldName) {
      alert('Field name is required')
      return
    }

    if (!trimmedFieldValue) {
      alert('Field value is required')
      return
    }

    if (trimmedFieldName !== editingSecretField.fieldName && editingFields[trimmedFieldName]) {
      alert('Field name already exists')
      return
    }

    try {
      setSavingField('secret_field_edit')

      const newEditingFields = { ...editingFields }
      if (trimmedFieldName !== editingSecretField.fieldName) {
        delete newEditingFields[editingSecretField.fieldName]
      }
      newEditingFields[trimmedFieldName] = trimmedFieldValue

      setEditingFields(newEditingFields)

      const updatedSecret: ServiceAccountSecret = {
        ...secret,
        secret: {
          secret_name: secretName,
          ...newEditingFields
        }
      }

      await onSecretChange(secret.id, updatedSecret)

      setEditingSecretField(null)
    } catch (error) {
      console.error('Error saving secret field:', error)
    } finally {
      setSavingField(null)
    }
  }

  const isExpired = secret.expire_at && new Date(secret.expire_at) < new Date()
  const isExpiringSoon =
    secret.expire_at &&
    new Date(secret.expire_at) > new Date() &&
    new Date(secret.expire_at).getTime() - new Date().getTime() < 7 * 24 * 60 * 60 * 1000

  return (
    <div
      className={cn(
        'group relative bg-card-background rounded-lg border border-border-default transition-all duration-200 overflow-hidden hover:border-border-hover',
        isExpired && 'border-red-300 dark:border-red-600',
        isExpiringSoon && !isExpired && 'border-amber-300 dark:border-amber-600',
        className
      )}
    >
      {/* Status Indicator */}
      <div
        className="absolute top-0 left-0 w-1 h-full transition-colors duration-300"
        style={{
          background: isExpired
            ? 'linear-gradient(to bottom, rgb(220, 38, 38), rgb(185, 28, 28))'
            : isExpiringSoon
              ? 'linear-gradient(to bottom, rgb(245, 158, 11), rgb(217, 119, 6))'
              : 'linear-gradient(to bottom, rgb(168, 85, 247), rgb(147, 51, 234))'
        }}
      />

      <div className="space-y-0">
        {/* Header - Always Visible */}
        <div className="p-4">
          <div className="flex items-center justify-between">
            <div
              className="flex items-center gap-3 flex-1 min-w-0 cursor-pointer"
              onClick={() => setIsExpanded(!isExpanded)}
            >
              <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-lg flex items-center justify-center shadow-sm flex-shrink-0">
                <Key className="h-4 w-4 text-white" />
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-text-primary font-medium">
                    {secret.secret_name || 'Unnamed Secret'}
                  </span>
                  {isExpired && (
                    <CustomBadge
                      variant="secondary"
                      size="sm"
                      className="text-xs bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-300"
                    >
                      <AlertTriangle className="h-3 w-3 mr-1" />
                      Expired
                    </CustomBadge>
                  )}
                  {isExpiringSoon && !isExpired && (
                    <CustomBadge
                      variant="secondary"
                      size="sm"
                      className="text-xs bg-amber-100 dark:bg-amber-900/20 text-amber-700 dark:text-amber-300"
                    >
                      <AlertTriangle className="h-3 w-3 mr-1" />
                      Expiring Soon
                    </CustomBadge>
                  )}
                </div>

                <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                  {Object.keys(editingFields).length} field
                  {Object.keys(editingFields).length !== 1 ? 's' : ''} stored
                </p>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-1 flex-shrink-0">
              <CustomButton
                variant="ghost"
                size="sm"
                onClick={handleDelete}
                icon={Trash2}
                className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20 text-xs px-2 py-1"
                children={undefined}
              />
              <CustomButton
                variant="ghost"
                size="sm"
                onClick={() => setIsExpanded(!isExpanded)}
                className="p-1 h-7 w-7 hover:bg-gray-100 dark:hover:bg-gray-600 ml-1"
              >
                {isExpanded ? (
                  <ChevronUp className="h-4 w-4 text-gray-500" />
                ) : (
                  <ChevronDown className="h-4 w-4 text-gray-500" />
                )}
              </CustomButton>
            </div>
          </div>
        </div>

        {/* Expandable Content */}
        {isExpanded && (
          <div className="space-y-4 border-t border-gray-100 dark:border-gray-700 p-4">
            {/* Secret Name */}
            <div className="space-y-2">
              <CustomInput
                label="Secret Name"
                value={secretName}
                onChange={setSecretName}
                placeholder="Enter secret name"
                variant="filled"
                size="sm"
                trackChanges={true}
                initialValue={secret.secret_name || ''}
                onSave={async (value) => {
                  await handleSaveField('secret_name', value)
                }}
                isSaving={savingField === 'secret_name'}
                saveSuccess={saveSuccess['secret_name'] || false}
                disabled={savingField !== null && savingField !== 'secret_name'}
              />
            </div>

            {/* Secret Fields */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-text-primary">Secret</label>
                <CustomButton
                  variant="ghost"
                  size="sm"
                  onClick={handleAddField}
                  className="text-purple-600 hover:text-purple-700 hover:bg-purple-50 dark:hover:bg-purple-900/20 !w-auto px-3 shrink-0"
                >
                  Create
                </CustomButton>
              </div>

              <div className="space-y-3">
                {Object.entries(editingFields).map(([fieldName, fieldValue]) => {
                  const isBeingEdited = editingSecretField?.fieldName === fieldName

                  if (isBeingEdited && editingSecretField) {
                    return (
                      <div
                        key={fieldName}
                        className="bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800 p-3 space-y-3"
                      >
                        <div className="flex items-center gap-2 mb-1">
                          <Edit2 className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                          <h5 className="font-medium text-blue-900 dark:text-blue-100 text-sm">
                            Edit Secret Field
                          </h5>
                        </div>

                        <div className="space-y-3">
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

                          <div className="flex items-center gap-2 pt-1">
                            <CustomButton
                              variant="primary"
                              size="sm"
                              onClick={saveEditedSecretField}
                            >
                              Save Changes
                            </CustomButton>
                            <CustomButton
                              variant="secondary"
                              size="sm"
                              onClick={cancelSecretFieldEdit}
                            >
                              Cancel
                            </CustomButton>
                          </div>
                        </div>
                      </div>
                    )
                  }

                  return (
                    <div key={fieldName} className="space-y-2">
                      <CustomInput
                        label={fieldName}
                        value={showSecrets ? fieldValue : '•'.repeat(24)}
                        onChange={(value) => {
                          setEditingFields((prev) => ({ ...prev, [fieldName]: value }))
                        }}
                        placeholder={`${fieldName} value`}
                        variant="filled"
                        size="sm"
                        trackChanges={true}
                        initialValue={initialFields[fieldName] || ''}
                        onSave={async () => {
                          const updatedSecret: ServiceAccountSecret = {
                            ...secret,
                            secret: {
                              secret_name: secretName,
                              ...editingFields
                            }
                          }
                          await onSecretChange?.(secret.id, updatedSecret)
                        }}
                        isSaving={savingField === 'fields'}
                        saveSuccess={saveSuccess['fields'] || false}
                        additionalActions={
                          <>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setShowSecrets(!showSecrets)}
                              className="p-1 h-6 w-6 hover:bg-gray-100 dark:hover:bg-gray-600"
                            >
                              {showSecrets ? (
                                <EyeOff className="h-3 w-3" />
                              ) : (
                                <Eye className="h-3 w-3" />
                              )}
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => startEditSecretField(fieldName, fieldValue)}
                              className="p-1 h-6 w-6 hover:bg-gray-100 dark:hover:bg-gray-600"
                            >
                              <Edit2 className="h-3 w-3" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => copyToClipboard(fieldValue)}
                              className="p-1 h-6 w-6 hover:bg-gray-100 dark:hover:bg-gray-600"
                            >
                              <Copy className="h-3 w-3" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleRemoveField(fieldName)}
                              className="p-1 h-6 w-6 text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </>
                        }
                        disabled={savingField !== null && savingField !== 'fields'}
                      />
                    </div>
                  )
                })}

                {Object.keys(editingFields).length === 0 && (
                  <div className="text-center py-4">
                    <div className="text-sm text-gray-500 dark:text-gray-400 mb-2">
                      No secret fields configured
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleAddField}
                      className="text-purple-600 hover:text-purple-700 hover:bg-purple-50"
                    >
                      <Plus className="h-4 w-4 mr-1" />
                      Add Secret Field
                    </Button>
                  </div>
                )}
              </div>
            </div>

            {/* Expiry Date */}
            <div className="space-y-2">
              <CustomInput
                label="Expiry Date"
                value={expireDateValue}
                onChange={setExpireDateValue}
                placeholder="Select expiry date"
                variant="filled"
                size="sm"
                type="datetime-local"
                leftIcon={<Calendar className="h-4 w-4" />}
                trackChanges={true}
                initialValue={initialExpireDate}
                onSave={(value) => handleSaveField('expire_at', value)}
                isSaving={savingField === 'expire_at'}
                saveSuccess={saveSuccess['expire_at'] || false}
                disabled={savingField !== null && savingField !== 'expire_at'}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default ServiceAccountSecretCard
