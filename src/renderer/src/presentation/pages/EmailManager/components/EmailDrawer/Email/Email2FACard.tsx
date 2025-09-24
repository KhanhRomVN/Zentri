// src/renderer/src/presentation/pages/EmailManager/components/EmailDrawer/Email/Email2FACard.tsx
import React, { useState } from 'react'
import { Button } from '../../../../../../components/ui/button'
import { Badge } from '../../../../../../components/ui/badge'
import CustomBadge from '../../../../../../components/common/CustomBadge'
import CustomButton from '../../../../../../components/common/CustomButton'
import { Label } from '../../../../../../components/ui/label'
import CustomInput from '../../../../../../components/common/CustomInput'
import Metadata from '../../../../../../components/common/Metadata'
import {
  Eye,
  EyeOff,
  Copy,
  Shield,
  CheckCircle,
  QrCode,
  FileText,
  Key,
  Smartphone,
  Mail,
  Edit,
  Trash2,
  Save,
  X
} from 'lucide-react'
import { cn } from '../../../../../../shared/lib/utils'
import { Email2FA } from '../../../types'

interface Email2FACardProps {
  method: Email2FA
  onEdit?: (method: Email2FA) => void
  onDelete?: (methodId: string) => void
  onSave?: (id: string, updates: Partial<Email2FA>) => void
  className?: string
  compact?: boolean
}

const Email2FACard: React.FC<Email2FACardProps> = ({
  method,
  onEdit,
  onDelete,
  onSave,
  className
}) => {
  const [showSecret, setShowSecret] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [editingData, setEditingData] = useState<Email2FA>(method)

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
        description: 'Recovery codes for account access'
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

  const handleSave = async () => {
    if (onSave) {
      await onSave(method.id, editingData)
    }
    setIsEditing(false)
  }

  const handleCancel = () => {
    setEditingData(method)
    setIsEditing(false)
  }

  const handleEdit = () => {
    if (onEdit) {
      onEdit(method)
    } else {
      setIsEditing(true)
    }
  }

  const handleDelete = () => {
    if (onDelete && window.confirm('Are you sure you want to delete this 2FA method?')) {
      onDelete(method.id)
    }
  }

  const renderMethodValue = () => {
    const currentValue = isEditing ? editingData.value : method.value

    if (method.method_type === 'backup_codes' && Array.isArray(currentValue)) {
      return (
        <div className="space-y-3">
          <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Backup Codes ({currentValue.length} codes)
          </Label>

          <div className="p-4 bg-orange-50 dark:bg-orange-900/10 rounded-lg border border-orange-100 dark:border-orange-800/30">
            {showSecret ? (
              <div className="grid grid-cols-2 gap-2">
                {currentValue.map((code, index) => (
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
                  {method.metadata.total_codes || currentValue.length}
                </div>
              </div>
            )}
          </div>
        </div>
      )
    }

    // For single string values
    return (
      <div className="space-y-2">
        <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">Secret Value</Label>

        {isEditing ? (
          <CustomInput
            value={typeof currentValue === 'string' ? currentValue : JSON.stringify(currentValue)}
            onChange={(value) => setEditingData((prev) => ({ ...prev, value }))}
            variant="outlined"
            size="sm"
            multiline={typeof currentValue !== 'string'}
            rows={2}
          />
        ) : (
          <CustomInput
            value={
              showSecret
                ? typeof currentValue === 'string'
                  ? currentValue
                  : JSON.stringify(currentValue)
                : '•'.repeat(24)
            }
            readOnly
            size="sm"
            variant="filled"
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
                  onClick={() =>
                    copyToClipboard(
                      typeof currentValue === 'string' ? currentValue : JSON.stringify(currentValue)
                    )
                  }
                  className="p-1 h-6 w-6 hover:bg-gray-100 dark:hover:bg-gray-600"
                >
                  <Copy className="h-3 w-3" />
                </Button>
              </div>
            }
          />
        )}
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
            <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-600 rounded-lg flex items-center justify-center shadow-sm">
              <MethodIcon className="h-5 w-5 text-white" />
            </div>

            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <Badge variant="secondary" className={cn('text-sm px-2 py-1', methodInfo.color)}>
                  {methodInfo.label}
                </Badge>
                <CustomBadge variant="success" size="sm" icon={CheckCircle} className="text-xs">
                  Active
                </CustomBadge>
              </div>

              {(method.app || isEditing) && (
                <div className="flex items-center gap-2">
                  <Label className="text-xs text-gray-500 dark:text-gray-400">App:</Label>
                  {isEditing ? (
                    <CustomInput
                      value={editingData.app || ''}
                      onChange={(value) => setEditingData((prev) => ({ ...prev, app: value }))}
                      placeholder="App name"
                      variant="outlined"
                      size="sm"
                      className="flex-1 max-w-32"
                    />
                  ) : (
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      {method.app}
                    </span>
                  )}
                </div>
              )}

              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                {methodInfo.description}
              </p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-1">
            {isEditing ? (
              <>
                <CustomButton
                  variant="success"
                  size="sm"
                  onClick={handleSave}
                  icon={Save}
                  className="text-xs px-2 py-1"
                >
                  Save
                </CustomButton>
                <CustomButton
                  variant="secondary"
                  size="sm"
                  onClick={handleCancel}
                  icon={X}
                  className="text-xs px-2 py-1"
                >
                  Cancel
                </CustomButton>
              </>
            ) : (
              <>
                <CustomButton
                  variant="ghost"
                  size="sm"
                  onClick={handleEdit}
                  icon={Edit}
                  className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 dark:hover:bg-blue-900/20 text-xs px-2 py-1"
                >
                  Edit
                </CustomButton>
                <CustomButton
                  variant="ghost"
                  size="sm"
                  onClick={handleDelete}
                  icon={Trash2}
                  className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20 text-xs px-2 py-1"
                >
                  Delete
                </CustomButton>
              </>
            )}
          </div>
        </div>

        {/* Method Value */}
        {renderMethodValue()}

        {/* Dates and Status */}
        <div className="flex justify-between items-center text-xs text-gray-500 dark:text-gray-400 pt-3 border-t border-gray-100 dark:border-gray-700">
          <div className="flex items-center gap-4">
            <span>Updated: {formatDate(method.last_update)}</span>
            {method.expire_at && (
              <span className="text-amber-600 dark:text-amber-400">
                Expires: {formatDate(method.expire_at)}
              </span>
            )}
          </div>
        </div>

        {/* Metadata */}
        {method.metadata && Object.keys(method.metadata).length > 0 && (
          <div className="pt-3 border-t border-gray-100 dark:border-gray-700">
            <Metadata
              metadata={method.metadata}
              title="Additional Information"
              compact={true}
              collapsible={true}
              defaultExpanded={false}
              size="sm"
              maxVisibleFields={3}
              readOnly={!isEditing}
              showDeleteButtons={isEditing}
              onMetadataChange={
                isEditing
                  ? (metadata) => setEditingData((prev) => ({ ...prev, metadata }))
                  : undefined
              }
            />
          </div>
        )}
      </div>
    </div>
  )
}

export default Email2FACard
