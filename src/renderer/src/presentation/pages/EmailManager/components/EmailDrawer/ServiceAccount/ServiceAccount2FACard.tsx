// src/renderer/src/presentation/pages/EmailManager/components/EmailDrawer/ServiceAccount/ServiceAccount2FACard.tsx
import React, { useState } from 'react'
import { Button } from '../../../../../../components/ui/button'
import CustomButton from '../../../../../../components/common/CustomButton'
import { Label } from '../../../../../../components/ui/label'
import CustomInput from '../../../../../../components/common/CustomInput'
import Metadata from '../../../../../../components/common/Metadata'
import {
  Eye,
  EyeOff,
  Copy,
  Shield,
  QrCode,
  FileText,
  Key,
  Smartphone,
  Mail,
  Trash2,
  Check
} from 'lucide-react'
import { cn } from '../../../../../../shared/lib/utils'
import { ServiceAccount2FA } from '../../../types'

interface ServiceAccount2FACardProps {
  method: ServiceAccount2FA
  onEdit?: (method: ServiceAccount2FA) => void
  onDelete?: (methodId: string) => void
  onSave?: (id: string, updates: Partial<ServiceAccount2FA>) => void
  className?: string
  compact?: boolean
}

const ServiceAccount2FACard: React.FC<ServiceAccount2FACardProps> = ({
  method,
  onDelete,
  onSave,
  className
}) => {
  const [showSecret, setShowSecret] = useState(false)

  // State cho inline editing
  const [appValue, setAppValue] = useState(method.app || '')
  const [secretValue, setSecretValue] = useState(
    typeof method.value === 'string' ? method.value : JSON.stringify(method.value)
  )
  const formatDateForInput = (dateString: string | undefined): string => {
    if (!dateString) return ''
    try {
      const date = new Date(dateString)
      if (isNaN(date.getTime())) return ''
      // Format to YYYY-MM-DDTHH:MM for datetime-local input
      return date.toISOString().slice(0, 16)
    } catch {
      return ''
    }
  }
  const [editingMetadata, setEditingMetadata] = useState(method.metadata || {})
  const [expireDateValue, setExpireDateValue] = useState(formatDateForInput(method.expire_at))
  // State cho việc lưu
  const [savingField, setSavingField] = useState<string | null>(null)
  const [saveStatus, setSaveStatus] = useState<{ [key: string]: 'success' | 'error' | null }>({})

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
      year: 'numeric'
    })
  }

  const getTwoFAMethodInfo = (type: string) => {
    const methodInfo: Record<
      string,
      { icon: React.ElementType; label: string; color: string; description: string }
    > = {
      backup_codes: {
        icon: FileText,
        label: 'Backup Codes',
        color:
          'bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-900/20 dark:text-orange-300',
        description: 'Recovery codes for service account access'
      },
      totp_key: {
        icon: QrCode,
        label: 'TOTP Key',
        color:
          'bg-green-50 text-green-700 border-green-200 dark:bg-green-900/20 dark:text-green-300',
        description: 'Time-based One-Time Password secret'
      },
      app_password: {
        icon: Key,
        label: 'App Password',
        color: 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/20 dark:text-blue-300',
        description: 'Application-specific password'
      },
      security_key: {
        icon: Shield,
        label: 'Security Key',
        color:
          'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-900/20 dark:text-purple-300',
        description: 'Hardware security key'
      },
      recovery_email: {
        icon: Mail,
        label: 'Recovery Email',
        color:
          'bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-900/20 dark:text-indigo-300',
        description: 'Alternative email for recovery'
      },
      sms: {
        icon: Smartphone,
        label: 'SMS',
        color: 'bg-pink-50 text-pink-700 border-pink-200 dark:bg-pink-900/20 dark:text-pink-300',
        description: 'SMS-based verification'
      }
    }
    return methodInfo[type] || methodInfo.totp_key
  }

  // Hàm lưu field
  const handleSaveField = async (field: string, value: any) => {
    if (!onSave) return

    try {
      setSavingField(field)

      const updates: Partial<ServiceAccount2FA> = {}

      switch (field) {
        case 'app':
          updates.app = value
          break
        case 'value':
          updates.value = value
          break
        case 'metadata':
          updates.metadata = value
          break
        case 'expire_at':
          updates.expire_at = parseDateFromInput(value) || null
          break
        default:
          console.warn(`Unknown field: ${field}`)
          return
      }

      await onSave(method.id, updates)

      setSaveStatus((prev) => ({ ...prev, [field]: 'success' }))
      // Reset status sau 2 giây
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

  const hasExpireDateChanged = expireDateValue !== (method.expire_at || '')

  // Check if values have changed
  const hasAppChanged = appValue !== (method.app || '')
  const hasSecretChanged =
    secretValue !== (typeof method.value === 'string' ? method.value : JSON.stringify(method.value))

  // Hàm render icon trạng thái cho input
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
          onClick={() => {
            if (field === 'app') {
              handleSaveField('app', appValue)
            } else if (field === 'value') {
              handleSaveField('value', secretValue)
            } else if (field === 'metadata') {
              handleSaveField('metadata', editingMetadata)
            } else if (field === 'expire_at') {
              handleSaveField('expire_at', expireDateValue)
            }
          }}
          className="p-0.5 h-5 w-5 text-green-600 hover:text-green-700 hover:bg-green-50"
          disabled={savingField !== null}
        >
          <Check className="h-2.5 w-2.5" />
        </Button>
      )
    }

    return undefined
  }

  const handleDelete = () => {
    if (onDelete && window.confirm('Are you sure you want to delete this 2FA method?')) {
      onDelete(method.id)
    }
  }

  const handleMetadataChange = (newMetadata: Record<string, any>) => {
    setEditingMetadata(newMetadata)
    // Auto save khi có thay đổi
    handleSaveField('metadata', newMetadata)
  }

  const renderMethodValue = () => {
    if (method.method_type === 'backup_codes' && Array.isArray(method.value)) {
      return (
        <div className="space-y-3">
          <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Backup Codes ({method.value.length} codes)
          </Label>

          <div className="p-4 bg-orange-50 dark:bg-orange-900/10 rounded-lg border border-orange-100 dark:border-orange-800/30">
            {showSecret ? (
              <div className="grid grid-cols-2 gap-2">
                {method.value.map((code, index) => (
                  <div
                    key={index}
                    className="p-2 bg-white dark:bg-gray-800 rounded border text-center cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors font-mono text-sm"
                    onClick={() => copyToClipboard(code)}
                    title="Click to copy"
                  >
                    {code}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-4">
                <div className="text-orange-800 dark:text-orange-300 font-medium mb-2">
                  Click to reveal backup codes
                </div>
                <CustomButton
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowSecret(true)}
                  icon={Eye}
                >
                  Show Codes
                </CustomButton>
              </div>
            )}

            {method.metadata && (
              <div className="mt-3 pt-3 border-t border-orange-200 dark:border-orange-800">
                <div className="text-sm text-orange-700 dark:text-orange-400">
                  Used: {method.metadata.codes_used || 0} /{' '}
                  {method.metadata.total_codes || method.value.length}
                </div>
              </div>
            )}
          </div>
        </div>
      )
    }

    // For single string values - với inline editing
    return (
      <div className="space-y-2">
        <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">Secret Value</Label>

        <CustomInput
          value={showSecret ? secretValue : '•'.repeat(24)}
          onChange={(value) => setSecretValue(value)}
          variant="filled"
          size="sm"
          multiline={secretValue.length > 50}
          rows={2}
          rightIcon={
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowSecret(!showSecret)}
                className="p-1 h-6 w-6 hover:bg-gray-100 dark:hover:bg-gray-600"
              >
                {showSecret ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => copyToClipboard(secretValue)}
                className="p-1 h-6 w-6 hover:bg-gray-100 dark:hover:bg-gray-600"
              >
                <Copy className="h-3 w-3" />
              </Button>
              {renderStatusIcon('value', hasSecretChanged)}
            </div>
          }
          disabled={savingField !== null && savingField !== 'value'}
        />
      </div>
    )
  }

  const methodInfo = getTwoFAMethodInfo(method.method_type)
  const MethodIcon = methodInfo.icon

  return (
    <div
      className={cn(
        'bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md transition-all duration-200',
        className
      )}
    >
      <div className="p-4 space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center shadow-sm">
              <MethodIcon className="h-5 w-5 text-white" />
            </div>

            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1 text-text-primary">
                {methodInfo.label}
              </div>

              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                {methodInfo.description}
              </p>
            </div>
          </div>

          {/* Actions - Chỉ còn Delete */}
          <div className="flex items-center gap-1">
            <CustomButton
              variant="ghost"
              size="sm"
              onClick={handleDelete}
              icon={Trash2}
              className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20 text-xs px-2 py-1"
            ></CustomButton>
          </div>
        </div>

        {/* App Field */}
        {(method.app || appValue) && (
          <div className="space-y-2">
            <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">App Name</Label>
            <CustomInput
              value={appValue}
              onChange={setAppValue}
              placeholder="App name"
              variant="filled"
              size="sm"
              rightIcon={renderStatusIcon('app', hasAppChanged)}
              disabled={savingField !== null && savingField !== 'app'}
            />
          </div>
        )}

        {/* Method Value */}
        {renderMethodValue()}

        {/* Dates and Status */}
        <div className="pt-3 border-t border-gray-100 dark:border-gray-700 space-y-3">
          <div className="flex justify-between items-center text-xs text-gray-500 dark:text-gray-400">
            <span>Updated: {formatDate(method.last_update)}</span>
          </div>

          {/* Expire Date Field */}
          <div className="space-y-2">
            <Label className="text-xs text-gray-500 dark:text-gray-400">Expire Date:</Label>
            <CustomInput
              value={expireDateValue}
              onChange={setExpireDateValue}
              placeholder="Select expiry date"
              variant="filled"
              size="sm"
              type="datetime-local"
              showTime={false}
              rightIcon={renderStatusIcon('expire_at', hasExpireDateChanged)}
              disabled={savingField !== null && savingField !== 'expire_at'}
            />
          </div>
        </div>

        {/* Metadata với inline editing */}
        <div className="pt-3 border-t border-gray-100 dark:border-gray-700">
          <Metadata
            metadata={editingMetadata || {}}
            title="Additional Information"
            compact={true}
            collapsible={true}
            defaultExpanded={false}
            size="sm"
            maxVisibleFields={3}
            showDeleteButtons={true}
            onMetadataChange={handleMetadataChange}
            showAddButton={true}
            allowEmpty={true}
          />
        </div>
      </div>
    </div>
  )
}

export default ServiceAccount2FACard
