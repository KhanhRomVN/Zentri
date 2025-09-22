// src/renderer/src/presentation/pages/EmailManager/components/ServiceAccountSecretCard.tsx
import React, { useState } from 'react'
import { Badge } from '../../../../components/ui/badge'
import { Button } from '../../../../components/ui/button'
import {
  Eye,
  EyeOff,
  Copy,
  Key,
  Edit,
  Trash2,
  Calendar,
  Clock,
  Shield,
  Code,
  Database,
  Lock,
  Cookie,
  RefreshCw,
  Zap,
  Hash,
  AlertTriangle
} from 'lucide-react'
import { cn } from '../../../../shared/lib/utils'
import { ServiceAccountSecret } from '../types'

interface ServiceAccountSecretCardProps {
  secret: ServiceAccountSecret
  onEdit?: (secret: ServiceAccountSecret) => void
  onDelete?: (secretId: string) => void
  className?: string
}

const ServiceAccountSecretCard: React.FC<ServiceAccountSecretCardProps> = ({
  secret,
  onEdit,
  onDelete,
  className
}) => {
  const [showSecret, setShowSecret] = useState(false)

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
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getSecretTypeInfo = (type: string) => {
    const typeInfo: Record<
      string,
      {
        icon: React.ElementType
        label: string
        color: string
        description: string
        sensitive: boolean
      }
    > = {
      api_key: {
        icon: Key,
        label: 'API Key',
        color: 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/20 dark:text-blue-300',
        description: 'Application Programming Interface authentication key',
        sensitive: true
      },
      cookie: {
        icon: Cookie,
        label: 'Cookie',
        color:
          'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/20 dark:text-amber-300',
        description: 'HTTP session cookie data',
        sensitive: true
      },
      access_token: {
        icon: Shield,
        label: 'Access Token',
        color:
          'bg-green-50 text-green-700 border-green-200 dark:bg-green-900/20 dark:text-green-300',
        description: 'OAuth access token for API authorization',
        sensitive: true
      },
      refresh_token: {
        icon: RefreshCw,
        label: 'Refresh Token',
        color:
          'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-900/20 dark:text-purple-300',
        description: 'Token used to refresh access tokens',
        sensitive: true
      },
      private_key: {
        icon: Lock,
        label: 'Private Key',
        color: 'bg-red-50 text-red-700 border-red-200 dark:bg-red-900/20 dark:text-red-300',
        description: 'Cryptographic private key',
        sensitive: true
      },
      client_secret: {
        icon: Code,
        label: 'Client Secret',
        color:
          'bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-900/20 dark:text-indigo-300',
        description: 'OAuth client application secret',
        sensitive: true
      },
      session_id: {
        icon: Database,
        label: 'Session ID',
        color: 'bg-teal-50 text-teal-700 border-teal-200 dark:bg-teal-900/20 dark:text-teal-300',
        description: 'User session identifier',
        sensitive: true
      },
      csrf_token: {
        icon: Shield,
        label: 'CSRF Token',
        color:
          'bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-900/20 dark:text-orange-300',
        description: 'Cross-Site Request Forgery protection token',
        sensitive: false
      },
      encryption_key: {
        icon: Hash,
        label: 'Encryption Key',
        color: 'bg-pink-50 text-pink-700 border-pink-200 dark:bg-pink-900/20 dark:text-pink-300',
        description: 'Data encryption/decryption key',
        sensitive: true
      },
      other: {
        icon: Zap,
        label: 'Other Secret',
        color: 'bg-gray-50 text-gray-700 border-gray-200 dark:bg-gray-700 dark:text-gray-300',
        description: 'Custom secret type',
        sensitive: true
      }
    }
    return typeInfo[type] || typeInfo.other
  }

  const isExpired = () => {
    if (!secret.expire_at) return false
    return new Date(secret.expire_at) < new Date()
  }

  const getDaysUntilExpiry = () => {
    if (!secret.expire_at) return null
    const expiryDate = new Date(secret.expire_at)
    const now = new Date()
    const diffTime = expiryDate.getTime() - now.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return diffDays
  }

  const renderSecretValue = () => {
    const secretValue =
      typeof secret.value === 'string' ? secret.value : JSON.stringify(secret.value)

    if (showSecret) {
      return (
        <div className="font-mono text-sm bg-gray-50 dark:bg-gray-700 p-3 rounded-lg border">
          {secretValue.length > 100 ? (
            <div className="space-y-2">
              <div className="text-xs text-gray-500 mb-2">
                Secret Value (truncated for display):
              </div>
              <div className="break-all">{secretValue.substring(0, 100)}...</div>
              <div className="text-xs text-gray-500">
                Full length: {secretValue.length} characters
              </div>
            </div>
          ) : (
            <div className="break-all">{secretValue}</div>
          )}
        </div>
      )
    }

    return (
      <div
        className="font-mono text-sm bg-gray-50 dark:bg-gray-700 p-3 rounded-lg border cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
        onClick={() => setShowSecret(true)}
      >
        <div className="flex items-center justify-center h-8 text-gray-500">
          <Lock className="h-4 w-4 mr-2" />
          Click to reveal secret ({secretValue.length} characters)
        </div>
      </div>
    )
  }

  const typeInfo = getSecretTypeInfo(secret.secret_type)
  const TypeIcon = typeInfo.icon
  const expired = isExpired()
  const daysUntilExpiry = getDaysUntilExpiry()

  return (
    <div
      className={cn(
        'group bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md transition-all duration-300',
        expired && 'border-red-200 dark:border-red-700 bg-red-50/30 dark:bg-red-900/10',
        className
      )}
    >
      {/* Header */}
      <div className="p-4 border-b border-gray-100 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {/* Type Icon */}
            <div
              className={cn(
                'w-8 h-8 rounded-lg flex items-center justify-center shadow-sm',
                typeInfo.sensitive
                  ? 'bg-gradient-to-br from-red-500 to-pink-600'
                  : 'bg-gradient-to-br from-blue-500 to-indigo-600'
              )}
            >
              <TypeIcon className="h-4 w-4 text-white" />
            </div>

            {/* Secret Info */}
            <div>
              <div className="flex items-center gap-2">
                <Badge variant="secondary" className={cn('border text-xs', typeInfo.color)}>
                  {typeInfo.label}
                </Badge>
                {expired && (
                  <Badge
                    variant="secondary"
                    className="border text-xs bg-red-50 text-red-700 border-red-200"
                  >
                    <AlertTriangle className="h-3 w-3 mr-1" />
                    Expired
                  </Badge>
                )}
                {!expired && daysUntilExpiry !== null && daysUntilExpiry <= 30 && (
                  <Badge
                    variant="secondary"
                    className="border text-xs bg-yellow-50 text-yellow-700 border-yellow-200"
                  >
                    <Clock className="h-3 w-3 mr-1" />
                    Expires in {daysUntilExpiry} days
                  </Badge>
                )}
              </div>
              {secret.name && (
                <div className="text-sm font-medium text-gray-900 dark:text-white mt-1">
                  {secret.name}
                </div>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowSecret(!showSecret)}
              className="p-1 h-6 w-6 text-gray-500 hover:text-gray-700"
            >
              {showSecret ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                const secretValue =
                  typeof secret.value === 'string' ? secret.value : JSON.stringify(secret.value)
                copyToClipboard(secretValue)
              }}
              className="p-1 h-6 w-6 text-gray-500 hover:text-blue-600"
            >
              <Copy className="h-3 w-3" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onEdit && onEdit(secret)}
              className="p-1 h-6 w-6 text-gray-500 hover:text-orange-600"
            >
              <Edit className="h-3 w-3" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onDelete && onDelete(secret.id)}
              className="p-1 h-6 w-6 text-gray-500 hover:text-red-600"
            >
              <Trash2 className="h-3 w-3" />
            </Button>
          </div>
        </div>

        {/* Description */}
        <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">{typeInfo.description}</p>
      </div>

      {/* Secret Value */}
      <div className="p-4">{renderSecretValue()}</div>

      {/* Footer */}
      <div className="px-4 pb-4">
        <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              Updated: {formatDate(secret.last_update)}
            </span>
            {secret.expire_at && (
              <span
                className={cn(
                  'flex items-center gap-1',
                  expired
                    ? 'text-red-600 dark:text-red-400'
                    : daysUntilExpiry !== null && daysUntilExpiry <= 30
                      ? 'text-yellow-600 dark:text-yellow-400'
                      : ''
                )}
              >
                <Clock className="h-3 w-3" />
                Expires: {formatDate(secret.expire_at)}
              </span>
            )}
          </div>

          {typeInfo.sensitive && (
            <span className="flex items-center gap-1 text-red-500 dark:text-red-400">
              <Lock className="h-3 w-3" />
              Sensitive
            </span>
          )}
        </div>

        {/* Additional Metadata */}
        {secret.metadata && Object.keys(secret.metadata).length > 0 && (
          <div className="mt-3 pt-3 border-t border-gray-100 dark:border-gray-700">
            <div className="flex flex-wrap gap-2">
              {Object.entries(secret.metadata).map(([key, value]) => (
                <span
                  key={key}
                  className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 rounded text-xs"
                >
                  {key.replace(/_/g, ' ')}: {String(value)}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default ServiceAccountSecretCard
