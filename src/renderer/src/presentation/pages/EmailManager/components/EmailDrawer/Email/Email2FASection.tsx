// src/renderer/src/presentation/pages/EmailManager/components/Email2FASection.tsx
import React, { useState } from 'react'
import { Badge } from '../../../../../../components/ui/badge'
import { Button } from '../../../../../../components/ui/button'
import { Label } from '../../../../../../components/ui/label'
import CustomInput from '../../../../../../components/common/CustomInput'
import CreateEmail2FAForm from './CreateEmail2FAForm'
import {
  Eye,
  EyeOff,
  Copy,
  Shield,
  CheckCircle,
  AlertCircle,
  QrCode,
  FileText,
  ChevronDown,
  ChevronUp,
  Key,
  Smartphone,
  Mail,
  Plus,
  Edit,
  Trash2
} from 'lucide-react'
import { cn } from '../../../../../../shared/lib/utils'
import { Email, Email2FA } from '../../../types'
import Metadata from '../../../../../../components/common/Metadata'

interface Email2FASectionProps {
  email: Email
  email2FAMethods: Email2FA[]
  onAdd2FA?: (data: Omit<Email2FA, 'id'>) => Promise<void>
  onEdit2FA?: (method: Email2FA) => void
  onDelete2FA?: (methodId: string) => void
  className?: string
}

const Email2FASection: React.FC<Email2FASectionProps> = ({
  email,
  email2FAMethods,
  onAdd2FA,
  onEdit2FA,
  onDelete2FA,
  className
}) => {
  const [showSecrets, setShowSecrets] = useState<Record<string, boolean>>({})
  const [is2FAExpanded, setIs2FAExpanded] = useState(false)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [isCreating, setIsCreating] = useState(false)

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text)
      // You could add a toast notification here
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

  const toggleSecretVisibility = (methodId: string) => {
    setShowSecrets((prev) => ({ ...prev, [methodId]: !prev[methodId] }))
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

  const renderMethodValue = (method: Email2FA) => {
    const isVisible = showSecrets[method.id]

    if (method.method_type === 'backup_codes' && Array.isArray(method.value)) {
      return (
        <div className="space-y-2">
          <Label className="text-xs text-gray-600 dark:text-gray-400">
            Backup Codes ({method.value.length} codes)
          </Label>
          <div className="p-2 bg-orange-50 dark:bg-orange-900/10 rounded border border-orange-100 dark:border-orange-800/30">
            {isVisible ? (
              <div className="grid grid-cols-2 gap-1 text-xs font-mono">
                {method.value.map((code, index) => (
                  <div
                    key={index}
                    className="p-1 bg-white dark:bg-gray-800 rounded border text-center cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                    onClick={() => copyToClipboard(code)}
                    title="Click to copy"
                  >
                    {code}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-xs text-orange-800 dark:text-orange-300 font-medium text-center py-1">
                Click to reveal backup codes
              </div>
            )}
            {method.metadata && (
              <div className="mt-1 text-xs text-orange-700 dark:text-orange-400">
                Used: {method.metadata.codes_used || 0} /{' '}
                {method.metadata.total_codes || method.value.length}
              </div>
            )}
          </div>
        </div>
      )
    }

    // For other method types (single string values)
    return (
      <div className="space-y-1">
        <Label className="text-xs text-gray-600 dark:text-gray-400">Secret Value</Label>
        <CustomInput
          value={
            isVisible
              ? typeof method.value === 'string'
                ? method.value
                : JSON.stringify(method.value)
              : '•'.repeat(24)
          }
          readOnly
          size="sm"
          variant="filled"
          className="text-xs"
          rightIcon={
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => toggleSecretVisibility(method.id)}
                className="p-0.5 h-4 w-4 hover:bg-gray-100 dark:hover:bg-gray-600"
              >
                {isVisible ? <EyeOff className="h-2 w-2" /> : <Eye className="h-2 w-2" />}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() =>
                  copyToClipboard(
                    typeof method.value === 'string' ? method.value : JSON.stringify(method.value)
                  )
                }
                className="p-0.5 h-4 w-4 hover:bg-gray-100 dark:hover:bg-gray-600"
              >
                <Copy className="h-2 w-2" />
              </Button>
            </div>
          }
        />
      </div>
    )
  }

  const handleEdit2FA = (method: Email2FA) => {
    if (onEdit2FA) {
      onEdit2FA(method)
    }
  }

  const handleDelete2FA = (methodId: string) => {
    if (onDelete2FA) {
      onDelete2FA(methodId)
    }
  }

  const handleAdd2FA = () => {
    setShowCreateForm(true)
    setIs2FAExpanded(true)
  }

  const handleCreate2FA = async (data: Omit<Email2FA, 'id'>) => {
    if (!onAdd2FA) return

    try {
      setIsCreating(true)
      await onAdd2FA(data)
      setShowCreateForm(false)
    } catch (error) {
      console.error('Error creating 2FA method:', error)
    } finally {
      setIsCreating(false)
    }
  }

  const handleCancelCreate = () => {
    setShowCreateForm(false)
  }

  const has2FA = email2FAMethods.length > 0
  const active2FAMethods = email2FAMethods.length

  return (
    <div className={cn('', className)}>
      {/* Two-Factor Authentication Methods - Compact Design */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200/60 dark:border-gray-700/60 shadow-sm hover:shadow-md transition-all duration-300">
        <div className="p-4">
          {/* Compact Header with Toggle */}
          <button
            onClick={() => setIs2FAExpanded(!is2FAExpanded)}
            className="w-full flex items-center justify-between group"
          >
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 bg-green-50 dark:bg-green-900/20 rounded-lg flex items-center justify-center">
                <Shield className="h-4 w-4 text-green-600 dark:text-green-400" />
              </div>
              <div className="text-left">
                <h4 className="text-base font-bold text-gray-900 dark:text-white">
                  Two-Factor Authentication
                </h4>
                <p className="text-xs text-gray-600 dark:text-gray-400">
                  {has2FA
                    ? `${active2FAMethods} method${active2FAMethods !== 1 ? 's' : ''} active`
                    : 'Not configured'}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                onClick={(e) => {
                  e.stopPropagation()
                  handleAdd2FA()
                }}
                className="bg-green-600 hover:bg-green-700 text-white shadow-sm text-xs px-2 py-1 h-7"
              >
                <Plus className="h-3 w-3 mr-1" />
                Add 2FA
              </Button>
              <Badge
                variant="secondary"
                className={cn(
                  'text-xs border px-1.5 py-0.5',
                  has2FA
                    ? 'bg-green-50 text-green-700 border-green-200 dark:bg-green-900/20 dark:text-green-300 dark:border-green-800'
                    : 'bg-gray-50 text-gray-700 border-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:border-gray-600'
                )}
              >
                {has2FA ? (
                  <CheckCircle className="h-2 w-2 mr-1" />
                ) : (
                  <AlertCircle className="h-2 w-2 mr-1" />
                )}
                {has2FA ? 'Enabled' : 'Disabled'}
              </Badge>
              <div className="w-5 h-5 bg-gray-100 dark:bg-gray-700 rounded flex items-center justify-center group-hover:bg-gray-200 dark:group-hover:bg-gray-600 transition-colors">
                {is2FAExpanded ? (
                  <ChevronUp className="h-3 w-3 text-gray-600 dark:text-gray-400" />
                ) : (
                  <ChevronDown className="h-3 w-3 text-gray-600 dark:text-gray-400" />
                )}
              </div>
            </div>
          </button>

          {/* Collapsible Content */}
          {is2FAExpanded && (
            <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-700">
              {/* Create Form */}
              {showCreateForm && (
                <div className="mb-4">
                  <CreateEmail2FAForm
                    email={{
                      id: email.id!,
                      email_address: email.email_address,
                      email_provider: email.email_provider
                    }}
                    onSubmit={handleCreate2FA}
                    onCancel={handleCancelCreate}
                    loading={isCreating}
                  />
                </div>
              )}

              {has2FA ? (
                <div className="space-y-3">
                  {email2FAMethods.map((method) => {
                    const methodInfo = getTwoFAMethodInfo(method.method_type)
                    const MethodIcon = methodInfo.icon

                    return (
                      <div
                        key={method.id}
                        className="border border-gray-200 dark:border-gray-700 rounded-lg p-3 bg-gray-50/50 dark:bg-gray-700/50 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                      >
                        {/* Compact Method Header */}
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-2">
                            <div className="w-6 h-6 bg-gradient-to-br from-green-500 to-emerald-600 rounded flex items-center justify-center shadow-sm">
                              <MethodIcon className="h-3 w-3 text-white" />
                            </div>
                            <div>
                              <Badge
                                variant="secondary"
                                className={cn('border text-xs px-1.5 py-0.5', methodInfo.color)}
                              >
                                {methodInfo.label}
                              </Badge>
                              {method.app && (
                                <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                                  {method.app}
                                </div>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-1">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleEdit2FA(method)}
                              className="text-blue-600 border-blue-200 hover:bg-blue-50 dark:text-blue-400 dark:border-blue-700 dark:hover:bg-blue-900/20 px-2 py-1 h-6 text-xs"
                            >
                              <Edit className="h-2 w-2 mr-1" />
                              Edit
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDelete2FA(method.id)}
                              className="text-red-600 border-red-200 hover:bg-red-50 dark:text-red-400 dark:border-red-700 dark:hover:bg-red-900/20 px-2 py-1 h-6 text-xs"
                            >
                              <Trash2 className="h-2 w-2 mr-1" />
                              Delete
                            </Button>
                          </div>
                        </div>

                        {/* Method Value - Compact */}
                        {renderMethodValue(method)}

                        {/* Compact Meta */}
                        <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mt-2 pt-2 border-t border-gray-200 dark:border-gray-600">
                          <span>Updated: {formatDate(method.last_update)}</span>
                          {method.expire_at && <span>Expires: {formatDate(method.expire_at)}</span>}
                        </div>

                        {/* Additional Metadata */}
                        {method.metadata && Object.keys(method.metadata).length > 0 && (
                          <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-600">
                            <Metadata
                              metadata={method.metadata}
                              title=""
                              compact={true}
                              collapsible={true}
                              defaultExpanded={false}
                              showDeleteButtons={false}
                              maxVisibleFields={3}
                            />
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              ) : !showCreateForm ? (
                <div className="text-center py-8">
                  <div className="w-12 h-12 bg-gray-100 dark:bg-gray-700 rounded-xl flex items-center justify-center mx-auto mb-3">
                    <Shield className="h-6 w-6 text-gray-400" />
                  </div>
                  <p className="text-gray-600 dark:text-gray-400 font-medium mb-1 text-sm">
                    Two-Factor Authentication Not Configured
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-500 mb-3">
                    Enable 2FA to enhance account security
                  </p>
                  <Button
                    onClick={handleAdd2FA}
                    className="bg-green-600 hover:bg-green-700 text-white text-sm"
                    size="sm"
                  >
                    <Shield className="h-3 w-3 mr-1" />
                    Set up 2FA
                  </Button>
                </div>
              ) : null}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default Email2FASection
