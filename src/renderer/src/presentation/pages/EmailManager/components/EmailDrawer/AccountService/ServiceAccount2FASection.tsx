// src/renderer/src/presentation/pages/EmailManager/components/ServiceAccount2FASection.tsx
import React, { useState } from 'react'
import { Badge } from '../../../../../../components/ui/badge'
import { Button } from '../../../../../../components/ui/button'
import { Label } from '../../../../../../components/ui/label'
import CustomInput from '../../../../../../components/common/CustomInput'
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
import { ServiceAccount, ServiceAccount2FA } from '../../../types'

interface ServiceAccount2FASectionProps {
  serviceAccount: ServiceAccount
  serviceAccount2FAMethods: ServiceAccount2FA[]
  className?: string
}

const ServiceAccount2FASection: React.FC<ServiceAccount2FASectionProps> = ({
  serviceAccount,
  serviceAccount2FAMethods,
  className
}) => {
  const [showSecrets, setShowSecrets] = useState<Record<string, boolean>>({})
  const [is2FAExpanded, setIs2FAExpanded] = useState(true) // Default expanded for service details

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

  const renderMethodValue = (method: ServiceAccount2FA) => {
    const isVisible = showSecrets[method.id]

    if (method.method_type === 'backup_codes' && Array.isArray(method.value)) {
      return (
        <div className="space-y-2">
          <Label className="text-xs text-gray-600 dark:text-gray-400">
            Backup Codes ({method.value.length} codes)
          </Label>
          <div className="p-3 bg-orange-50 dark:bg-orange-900/10 rounded-lg border border-orange-100 dark:border-orange-800/30">
            {isVisible ? (
              <div className="grid grid-cols-2 gap-2 text-sm font-mono">
                {method.value.map((code, index) => (
                  <div
                    key={index}
                    className="p-2 bg-white dark:bg-gray-800 rounded border text-center cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                    onClick={() => copyToClipboard(code)}
                    title="Click to copy"
                  >
                    {code}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-sm text-orange-800 dark:text-orange-300 font-medium text-center py-2">
                Click to reveal backup codes
              </div>
            )}
            {method.metadata && (
              <div className="mt-2 text-xs text-orange-700 dark:text-orange-400">
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
      <div className="space-y-2">
        <Label className="text-xs text-gray-600 dark:text-gray-400">Secret Value</Label>
        <CustomInput
          value={
            isVisible
              ? typeof method.value === 'string'
                ? method.value
                : JSON.stringify(method.value)
              : '•'.repeat(32)
          }
          readOnly
          size="sm"
          variant="filled"
          rightIcon={
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => toggleSecretVisibility(method.id)}
                className="p-1 h-5 w-5 hover:bg-gray-100 dark:hover:bg-gray-600"
              >
                {isVisible ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() =>
                  copyToClipboard(
                    typeof method.value === 'string' ? method.value : JSON.stringify(method.value)
                  )
                }
                className="p-1 h-5 w-5 hover:bg-gray-100 dark:hover:bg-gray-600"
              >
                <Copy className="h-3 w-3" />
              </Button>
            </div>
          }
        />
      </div>
    )
  }

  const handleEdit2FA = (method: ServiceAccount2FA) => {
    console.log('Edit 2FA method:', method)
    // Implementation for editing 2FA method
  }

  const handleDelete2FA = (methodId: string) => {
    console.log('Delete 2FA method:', methodId)
    // Implementation for deleting 2FA method
  }

  const handleAdd2FA = () => {
    console.log('Add new 2FA method for service:', serviceAccount.id)
    // Implementation for adding new 2FA method
  }

  const has2FA = serviceAccount2FAMethods.length > 0
  const active2FAMethods = serviceAccount2FAMethods.length

  return (
    <div className={cn('', className)}>
      {/* Two-Factor Authentication Methods */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200/60 dark:border-gray-700/60 shadow-sm hover:shadow-md transition-all duration-300">
        <div className="p-6">
          {/* Header with Toggle */}
          <button
            onClick={() => setIs2FAExpanded(!is2FAExpanded)}
            className="w-full flex items-center justify-between group"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-50 dark:bg-green-900/20 rounded-xl flex items-center justify-center">
                <Shield className="h-5 w-5 text-green-600 dark:text-green-400" />
              </div>
              <div className="text-left">
                <h4 className="text-xl font-bold text-gray-900 dark:text-white">
                  Two-Factor Authentication
                </h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {serviceAccount.service_name} •{' '}
                  {has2FA ? `${active2FAMethods} methods active` : 'Not configured'}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Button
                size="sm"
                onClick={(e) => {
                  e.stopPropagation()
                  handleAdd2FA()
                }}
                className="bg-green-600 hover:bg-green-700 text-white shadow-sm"
              >
                <Plus className="h-4 w-4 mr-1" />
                Add 2FA
              </Button>
              <Badge
                variant="secondary"
                className={cn(
                  'text-xs border',
                  has2FA
                    ? 'bg-green-50 text-green-700 border-green-200 dark:bg-green-900/20 dark:text-green-300 dark:border-green-800'
                    : 'bg-gray-50 text-gray-700 border-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:border-gray-600'
                )}
              >
                {has2FA ? (
                  <CheckCircle className="h-3 w-3 mr-1" />
                ) : (
                  <AlertCircle className="h-3 w-3 mr-1" />
                )}
                {has2FA ? 'Enabled' : 'Disabled'}
              </Badge>
              <div className="w-6 h-6 bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center group-hover:bg-gray-200 dark:group-hover:bg-gray-600 transition-colors">
                {is2FAExpanded ? (
                  <ChevronUp className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                ) : (
                  <ChevronDown className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                )}
              </div>
            </div>
          </button>

          {/* Collapsible Content */}
          {is2FAExpanded && (
            <div className="mt-6 pt-6 border-t border-gray-100 dark:border-gray-700">
              {has2FA ? (
                <div className="space-y-4">
                  {serviceAccount2FAMethods.map((method) => {
                    const methodInfo = getTwoFAMethodInfo(method.method_type)
                    const MethodIcon = methodInfo.icon

                    return (
                      <div
                        key={method.id}
                        className="border border-gray-200 dark:border-gray-700 rounded-xl p-4 bg-gray-50/50 dark:bg-gray-700/50 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                      >
                        {/* Method Header */}
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-gradient-to-br from-green-500 to-emerald-600 rounded-lg flex items-center justify-center shadow-sm">
                              <MethodIcon className="h-4 w-4 text-white" />
                            </div>
                            <div>
                              <Badge
                                variant="secondary"
                                className={cn('border text-xs', methodInfo.color)}
                              >
                                {methodInfo.label}
                              </Badge>
                              {method.app && (
                                <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                  App: {method.app}
                                </div>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleEdit2FA(method)}
                              className="text-blue-600 border-blue-200 hover:bg-blue-50 dark:text-blue-400 dark:border-blue-700 dark:hover:bg-blue-900/20"
                            >
                              <Edit className="h-3 w-3 mr-1" />
                              Edit
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDelete2FA(method.id)}
                              className="text-red-600 border-red-200 hover:bg-red-50 dark:text-red-400 dark:border-red-700 dark:hover:bg-red-900/20"
                            >
                              <Trash2 className="h-3 w-3 mr-1" />
                              Delete
                            </Button>
                          </div>
                        </div>

                        {/* Method Description */}
                        <div className="mb-4">
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            {methodInfo.description}
                          </p>
                        </div>

                        {/* Method Value */}
                        {renderMethodValue(method)}

                        {/* Method Meta */}
                        <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mt-4 pt-3 border-t border-gray-200 dark:border-gray-600">
                          <span>Last updated: {formatDate(method.last_update)}</span>
                          {method.expire_at && <span>Expires: {formatDate(method.expire_at)}</span>}
                        </div>

                        {/* Additional Metadata */}
                        {method.metadata && Object.keys(method.metadata).length > 0 && (
                          <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-600">
                            <div className="flex flex-wrap gap-2">
                              {Object.entries(method.metadata)
                                .filter(([key]) => !['codes_used', 'total_codes'].includes(key))
                                .map(([key, value]) => (
                                  <span
                                    key={key}
                                    className="px-2 py-1 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 rounded text-xs"
                                  >
                                    {key.replace(/_/g, ' ')}: {String(value)}
                                  </span>
                                ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              ) : (
                <div className="text-center py-12">
                  <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <Shield className="h-8 w-8 text-gray-400" />
                  </div>
                  <p className="text-gray-600 dark:text-gray-400 font-medium mb-1">
                    Two-Factor Authentication Not Configured
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-500 mb-4">
                    Enable 2FA to enhance {serviceAccount.service_name} account security
                  </p>
                  <Button
                    onClick={handleAdd2FA}
                    className="bg-green-600 hover:bg-green-700 text-white"
                  >
                    <Shield className="h-4 w-4 mr-1" />
                    Set up 2FA
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default ServiceAccount2FASection
