// src/renderer/src/presentation/pages/EmailManager/components/EmailDrawer/ServiceAccount/ServiceAccount2FACard.tsx
import React, { useEffect, useState } from 'react'
import { Button } from '../../../../../../../../components/ui/button'
import CustomBadge from '../../../../../../../../components/common/CustomBadge'
import CustomButton from '../../../../../../../../components/common/CustomButton'
import { Label } from '../../../../../../../../components/ui/label'
import CustomInput from '../../../../../../../../components/common/CustomInput'
import Metadata from '../../../../../../../../components/common/Metadata'
import CustomTag from '../../../../../../../../components/common/CustomTag'
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
  ChevronDown,
  ChevronUp,
  Calendar
} from 'lucide-react'
import { cn } from '../../../../../../../../shared/lib/utils'
import { ServiceAccount2FA } from '../../../../../types'

interface ServiceAccount2FACardProps {
  method: ServiceAccount2FA
  onEdit?: (method: ServiceAccount2FA) => void
  onDelete?: (methodId: string) => void
  onSave?: (id: string, updates: Partial<ServiceAccount2FA>) => Promise<void>
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
  const [isExpanded, setIsExpanded] = useState(true)

  // State cho inline editing
  const [appValue, setAppValue] = useState(method.app || '')
  const [secretValue, setSecretValue] = useState(
    typeof method.value === 'string' ? method.value : JSON.stringify(method.value)
  )

  // Sync secretValue với method.value khi method thay đổi
  useEffect(() => {
    setSecretValue(typeof method.value === 'string' ? method.value : JSON.stringify(method.value))
  }, [method.value])

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

  const [editingMetadata, setEditingMetadata] = useState(() => {
    const metadata = method.metadata || {}
    return JSON.parse(JSON.stringify(metadata))
  })

  const [expireDateValue, setExpireDateValue] = useState(formatDateForInput(method.expire_at))

  const [savingField, setSavingField] = useState<string | null>(null)

  // State riêng để track save success cho từng field
  const [fieldSaveSuccess, setFieldSaveSuccess] = useState<{ [key: string]: boolean }>({})

  // ✅ Reset fieldSaveSuccess khi component mount hoặc method thay đổi
  useEffect(() => {
    setFieldSaveSuccess({})
  }, [method.id])

  useEffect(() => {
    const metadata = method.metadata || {}
    setEditingMetadata(JSON.parse(JSON.stringify(metadata)))
  }, [method.metadata])

  // Helper function to parse date from input
  const parseDateFromInput = (inputValue: string): string => {
    if (!inputValue) return ''
    try {
      return new Date(inputValue).toISOString()
    } catch {
      return ''
    }
  }

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text)
    } catch (err) {
      console.error('Failed to copy:', err)
    }
  }

  const getTwoFAMethodInfo = (type: string) => {
    const methodInfo: Record<
      string,
      {
        icon: React.ElementType
        label: string
        color: string
        bgColor: string
        description: string
      }
    > = {
      backup_codes: {
        icon: FileText,
        label: 'Backup Codes',
        color:
          'bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-900/20 dark:text-orange-300',
        bgColor: 'bg-gradient-to-br from-orange-500 to-orange-600',
        description: 'Recovery codes for account access'
      },
      totp_key: {
        icon: QrCode,
        label: 'TOTP Key',
        color:
          'bg-green-50 text-green-700 border-green-200 dark:bg-green-900/20 dark:text-green-300',
        bgColor: 'bg-gradient-to-br from-green-500 to-emerald-600',
        description: 'Time-based One-Time Password secret'
      },
      app_password: {
        icon: Key,
        label: 'App Password',
        color: 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/20 dark:text-blue-300',
        bgColor: 'bg-gradient-to-br from-blue-500 to-blue-600',
        description: 'Application-specific password'
      },
      security_key: {
        icon: Shield,
        label: 'Security Key',
        color:
          'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-900/20 dark:text-purple-300',
        bgColor: 'bg-gradient-to-br from-purple-500 to-purple-600',
        description: 'Hardware security key'
      },
      recovery_email: {
        icon: Mail,
        label: 'Recovery Email',
        color:
          'bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-900/20 dark:text-indigo-300',
        bgColor: 'bg-gradient-to-br from-indigo-500 to-indigo-600',
        description: 'Alternative email for recovery'
      },
      sms: {
        icon: Smartphone,
        label: 'SMS',
        color: 'bg-pink-50 text-pink-700 border-pink-200 dark:bg-pink-900/20 dark:text-pink-300',
        bgColor: 'bg-gradient-to-br from-pink-500 to-pink-600',
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
      // Reset save success state
      setFieldSaveSuccess((prev) => ({ ...prev, [field]: false }))

      const updates: Partial<ServiceAccount2FA> = {}

      switch (field) {
        case 'app':
          updates.app = value
          break
        case 'value':
          updates.value = value
          break
        case 'metadata':
          updates.metadata = value as Record<string, any>
          updates.last_update = new Date().toISOString()
          break
        case 'expire_at':
          updates.expire_at = parseDateFromInput(value) || undefined
          break
        default:
          console.warn(`Unknown field: ${field}`)
          return
      }

      await onSave(method.id, updates)

      setFieldSaveSuccess((prev) => ({ ...prev, [field]: true }))

      // Reset status sau 2 giây
      setTimeout(() => {
        setFieldSaveSuccess((prev) => ({ ...prev, [field]: false }))
      }, 2000)
    } catch (error) {
      console.error(`Error saving ${field}:`, error)
      setFieldSaveSuccess((prev) => ({ ...prev, [field]: false }))
    } finally {
      setSavingField(null)
    }
  }

  const handleDelete = () => {
    if (onDelete && window.confirm('Are you sure you want to delete this 2FA method?')) {
      onDelete(method.id)
    }
  }

  const handleMetadataChange = async (newMetadata: Record<string, any>) => {
    const cleanedMetadata = Object.fromEntries(
      Object.entries(newMetadata).filter(
        ([_, value]) => value !== null && value !== undefined && value !== ''
      )
    )
    setEditingMetadata(cleanedMetadata)
    handleSaveField('metadata', cleanedMetadata)
  }

  const renderMethodValue = () => {
    if (method.method_type === 'backup_codes' && Array.isArray(method.value)) {
      const currentCodes = showSecret
        ? method.value.map(String)
        : method.value.map(() => '••••••••')

      return (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Backup Codes ({method.value.length} codes)
            </Label>
            <div className="flex items-center gap-2">
              <CustomButton
                variant="ghost"
                size="sm"
                onClick={() => setShowSecret(!showSecret)}
                icon={showSecret ? EyeOff : Eye}
                className="text-xs"
              >
                {showSecret ? 'Hide' : 'Show'}
              </CustomButton>
            </div>
          </div>

          <div className="p-4 bg-orange-50 dark:bg-orange-900/10 rounded-lg border border-orange-100 dark:border-orange-800/30">
            <CustomTag
              tags={currentCodes}
              onTagsChange={(newCodes: string[]) => {
                if (onSave && showSecret) {
                  handleSaveField('value', newCodes)
                }
              }}
              disabled={savingField !== null || !showSecret || !onSave}
              placeholder="Enter backup code..."
              allowDuplicates={false}
              maxTags={20}
              size="sm"
            />

            {method.metadata && (
              <div className="mt-3 pt-3 border-t border-orange-200 dark:border-orange-800">
                <div className="text-sm text-orange-700 dark:text-orange-400 flex items-center justify-between">
                  <span>
                    Used: {method.metadata.codes_used || 0} /{' '}
                    {method.metadata.total_codes || method.value.length}
                  </span>
                  {method.metadata.codes_used > 0 && (
                    <span className="text-xs">
                      Remaining:{' '}
                      {(method.metadata.total_codes || method.value.length) -
                        (method.metadata.codes_used || 0)}
                    </span>
                  )}
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
          key={showSecret ? 'visible' : 'hidden'}
          value={showSecret ? secretValue : '•'.repeat(Math.max(24, secretValue.length))}
          onChange={(value) => {
            if (showSecret) {
              setSecretValue(value)
            }
          }}
          variant="filled"
          size="sm"
          multiline={secretValue.length > 50}
          rows={2}
          trackChanges={showSecret}
          initialValue={
            typeof method.value === 'string' ? method.value : JSON.stringify(method.value)
          }
          onSave={(value) => handleSaveField('value', value)}
          isSaving={savingField === 'value'}
          saveSuccess={fieldSaveSuccess['value'] || false}
          additionalActions={
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation()
                  setShowSecret(!showSecret)
                }}
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
        'group relative bg-card-background rounded-lg border border-gray-100 dark:border-gray-700 shadow-sm transition-all duration-200 overflow-hidden hover:shadow-md hover:border-blue-200 dark:hover:border-blue-600',
        className
      )}
    >
      {/* Status Indicator */}
      <div
        className="absolute top-0 left-0 w-1 h-full transition-colors duration-300"
        style={{
          background: (() => {
            const gradients: Record<string, string> = {
              'bg-gradient-to-br from-orange-500 to-orange-600':
                'linear-gradient(to bottom right, rgb(249, 115, 22), rgb(234, 88, 12))',
              'bg-gradient-to-br from-green-500 to-emerald-600':
                'linear-gradient(to bottom right, rgb(34, 197, 94), rgb(5, 150, 105))',
              'bg-gradient-to-br from-blue-500 to-blue-600':
                'linear-gradient(to bottom right, rgb(59, 130, 246), rgb(37, 99, 235))',
              'bg-gradient-to-br from-purple-500 to-purple-600':
                'linear-gradient(to bottom right, rgb(168, 85, 247), rgb(147, 51, 234))',
              'bg-gradient-to-br from-indigo-500 to-indigo-600':
                'linear-gradient(to bottom right, rgb(99, 102, 241), rgb(79, 70, 229))',
              'bg-gradient-to-br from-pink-500 to-pink-600':
                'linear-gradient(to bottom right, rgb(236, 72, 153), rgb(219, 39, 119))'
            }
            return (
              gradients[methodInfo.bgColor] ||
              'linear-gradient(to bottom right, rgb(34, 197, 94), rgb(5, 150, 105))'
            )
          })()
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
              <div
                className={`w-10 h-10 ${methodInfo.bgColor} rounded-lg flex items-center justify-center shadow-sm flex-shrink-0`}
              >
                <MethodIcon className="h-4 w-4 text-white" />
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-text-primary font-medium">{methodInfo.label}</span>
                  {method.app && (
                    <CustomBadge variant="secondary" size="sm" className="text-xs">
                      {method.app}
                    </CustomBadge>
                  )}
                </div>

                <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                  {methodInfo.description}
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
            {/* App Name Field (if applicable) */}
            {method.app && (
              <div className="space-y-2">
                <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Application
                </Label>
                <CustomInput
                  value={appValue}
                  onChange={setAppValue}
                  placeholder="App name"
                  variant="filled"
                  size="sm"
                  trackChanges={true}
                  initialValue={method.app || ''}
                  onSave={(value) => handleSaveField('app', value)}
                  isSaving={savingField === 'app'}
                  saveSuccess={fieldSaveSuccess['app'] || false}
                  disabled={savingField !== null && savingField !== 'app'}
                />
              </div>
            )}

            {/* Method Value */}
            {renderMethodValue()}

            {/* Dates and Status */}
            <div className="space-y-3">
              {/* Expire Date Field */}
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
                  showTime={false}
                  leftIcon={<Calendar className="h-4 w-4" />}
                  trackChanges={true}
                  initialValue={formatDateForInput(method.expire_at)}
                  onSave={(value) => handleSaveField('expire_at', value)}
                  isSaving={savingField === 'expire_at'}
                  saveSuccess={fieldSaveSuccess['expire_at'] || false}
                  disabled={savingField !== null && savingField !== 'expire_at'}
                />
              </div>
            </div>

            {/* Metadata với inline editing */}
            <div className="pt-3 border-t border-gray-100 dark:border-gray-700">
              <Metadata
                metadata={editingMetadata || {}}
                onMetadataChange={handleMetadataChange}
                onDelete={(key) => {
                  const newMetadata = { ...editingMetadata }
                  delete newMetadata[key]
                  setEditingMetadata(newMetadata)
                  handleSaveField('metadata', newMetadata)
                }}
                title="Additional Information"
                compact={true}
                collapsible={true}
                defaultExpanded={false}
                size="sm"
                maxVisibleFields={3}
                showDeleteButtons={true}
                hideEmpty={true}
                allowCreate={true}
                allowEdit={true}
                allowDelete={true}
                readOnly={false}
                shouldRenderField={(_, value) => {
                  if (value === null || value === undefined || value === '') {
                    return false
                  }
                  return true
                }}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default ServiceAccount2FACard
