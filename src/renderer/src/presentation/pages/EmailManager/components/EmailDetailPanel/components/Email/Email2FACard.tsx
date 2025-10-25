// src/renderer/src/presentation/pages/EmailManager/components/EmailDrawer/Email/Email2FACard.tsx
import React, { useEffect, useState } from 'react'
import { Button } from '../../../../../../../components/ui/button'
import CustomBadge from '../../../../../../../components/common/CustomBadge'
import CustomButton from '../../../../../../../components/common/CustomButton'
import { Label } from '../../../../../../../components/ui/label'
import CustomInput from '../../../../../../../components/common/CustomInput'
import Metadata from '../../../../../../../components/common/Metadata'
import CryptoJS from 'crypto-js'
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
  Check,
  ChevronDown,
  ChevronUp,
  Calendar
} from 'lucide-react'
import { cn } from '../../../../../../../shared/lib/utils'
import { Email2FA } from '../../../../types'
import CustomTag from '../../../../../../../components/common/CustomTag'

interface Email2FACardProps {
  method: Email2FA
  onEdit?: (method: Email2FA) => void
  onDelete?: (methodId: string) => void
  onSave?: (id: string, updates: Partial<Email2FA>) => Promise<void>
  className?: string
  compact?: boolean
}

const Email2FACard: React.FC<Email2FACardProps> = ({ method, onDelete, onSave, className }) => {
  const [showSecret, setShowSecret] = useState(false)
  const [isExpanded, setIsExpanded] = useState(true)

  const [currentOTP, setCurrentOTP] = useState('')
  const [otpTimeRemaining, setOtpTimeRemaining] = useState(30)

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
  const [saveStatus, setSaveStatus] = useState<{ [key: string]: 'success' | 'error' | null }>({})

  useEffect(() => {
    const metadata = method.metadata || {}
    setEditingMetadata(JSON.parse(JSON.stringify(metadata)))
  }, [method.metadata])

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

  const handleSaveField = async (field: string, value: any) => {
    if (!onSave) return

    try {
      setSavingField(field)

      const updates: Partial<Email2FA> = {}

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
          updates.expire_at = parseDateFromInput(value) || null
          break
        default:
          console.warn(`Unknown field: ${field}`)
          return
      }

      await onSave(method.id, updates)

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

  // Base32 decode implementation
  const base32Decode = (encoded: string): Uint8Array => {
    const base32Chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567'
    encoded = encoded.toUpperCase().replace(/=+$/, '')

    let bits = 0
    let value = 0
    let index = 0
    const output = new Uint8Array(Math.floor((encoded.length * 5) / 8))

    for (let i = 0; i < encoded.length; i++) {
      const idx = base32Chars.indexOf(encoded[i])
      if (idx === -1) continue

      value = (value << 5) | idx
      bits += 5

      if (bits >= 8) {
        output[index++] = (value >>> (bits - 8)) & 0xff
        bits -= 8
      }
    }

    return output
  }

  // Generate TOTP
  const generateTOTP = (secret: string, timeStep: number = 30): string => {
    try {
      const keyBytes = base32Decode(secret.replace(/\s/g, ''))
      const epoch = Math.floor(Date.now() / 1000)
      let counter = Math.floor(epoch / timeStep)

      const timeBytes = new Uint8Array(8)
      for (let i = 7; i >= 0; i--) {
        timeBytes[i] = counter & 0xff
        counter = Math.floor(counter / 256)
      }

      const keyHex = Array.from(keyBytes)
        .map((b) => b.toString(16).padStart(2, '0'))
        .join('')
      const timeHex = Array.from(timeBytes)
        .map((b) => b.toString(16).padStart(2, '0'))
        .join('')

      const key = CryptoJS.enc.Hex.parse(keyHex)
      const message = CryptoJS.enc.Hex.parse(timeHex)

      const hmac = CryptoJS.HmacSHA1(message, key)
      const hmacHex = hmac.toString(CryptoJS.enc.Hex)

      const hmacBytes = new Uint8Array(hmacHex.length / 2)
      for (let i = 0; i < hmacHex.length; i += 2) {
        hmacBytes[i / 2] = parseInt(hmacHex.substr(i, 2), 16)
      }

      const offset = hmacBytes[hmacBytes.length - 1] & 0x0f
      const code =
        (((hmacBytes[offset] & 0x7f) << 24) |
          ((hmacBytes[offset + 1] & 0xff) << 16) |
          ((hmacBytes[offset + 2] & 0xff) << 8) |
          (hmacBytes[offset + 3] & 0xff)) %
        1000000

      return code.toString().padStart(6, '0')
    } catch (err) {
      console.error('TOTP generation error:', err)
      return '------'
    }
  }

  // Generate and update OTP for TOTP method
  useEffect(() => {
    if (method.method_type === 'totp_key' && typeof method.value === 'string') {
      const updateOTP = () => {
        try {
          const token = generateTOTP(method.value as string, 30)
          setCurrentOTP(token)

          const now = Math.floor(Date.now() / 1000)
          const remaining = 30 - (now % 30)
          setOtpTimeRemaining(remaining)
        } catch (err) {
          console.error('Error updating OTP:', err)
          setCurrentOTP('------')
        }
      }

      updateOTP()
      const interval = setInterval(updateOTP, 1000)

      return () => clearInterval(interval)
    }
  }, [method.method_type, method.value])

  const hasExpireDateChanged = expireDateValue !== formatDateForInput(method.expire_at)
  const hasAppChanged = appValue !== (method.app || '')
  const hasSecretChanged =
    secretValue !== (typeof method.value === 'string' ? method.value : JSON.stringify(method.value))

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
    // TOTP Key with OTP Generator
    if (method.method_type === 'totp_key' && typeof method.value === 'string') {
      return (
        <div className="space-y-3">
          <div className="space-y-2">
            <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">OTP Code</Label>
            <CustomInput
              value={`${otpTimeRemaining}s - ${currentOTP || '------'}`}
              variant="filled"
              size="sm"
              readOnly
              placeholder="Generating OTP..."
              rightIcon={
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => copyToClipboard(currentOTP)}
                  className="p-1 h-6 w-6 hover:bg-gray-100 dark:hover:bg-gray-600"
                >
                  <Copy className="h-3 w-3" />
                </Button>
              }
            />
          </div>

          <div className="space-y-2">
            <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Secret Key
            </Label>
            <CustomInput
              value={showSecret ? secretValue : '•'.repeat(32)}
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
        </div>
      )
    }

    // Backup Codes
    if (method.method_type === 'backup_codes' && Array.isArray(method.value)) {
      return (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Backup Codes ({method.value.length} codes)
            </Label>
            {method.metadata && (
              <div className="text-xs text-orange-700 dark:text-orange-400">
                Used: {method.metadata.codes_used || 0} /{' '}
                {method.metadata.total_codes || method.value.length}
              </div>
            )}
          </div>

          <CustomTag
            tags={method.value.map(String)}
            onTagsChange={(newCodes) => {
              if (onSave) {
                handleSaveField('value', newCodes)
              }
            }}
            disabled={savingField !== null || !onSave}
            placeholder="Enter backup code..."
            allowDuplicates={false}
            maxTags={20}
            size="sm"
          />
        </div>
      )
    }

    // Other methods (app_password, security_key, etc.)
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
        'group relative bg-card-background rounded-lg border border-border-default transition-all duration-200 overflow-hidden  hover:border-border-hover',
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
            {/* App Name Field */}
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
                  rightIcon={renderStatusIcon('app', hasAppChanged)}
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
                  rightIcon={renderStatusIcon('expire_at', hasExpireDateChanged)}
                  disabled={savingField !== null && savingField !== 'expire_at'}
                />
              </div>
            </div>

            {/* Metadata */}
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
                editable={true}
                allowEmpty={true}
                showAddButton={true}
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

export default Email2FACard
