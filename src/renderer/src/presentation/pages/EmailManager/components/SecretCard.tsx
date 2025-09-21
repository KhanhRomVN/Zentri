// src/renderer/src/presentation/pages/EmailManager/components/SecretCard.tsx
import React, { useState } from 'react'
import { Button } from '../../../../components/ui/button'
import { Badge } from '../../../../components/ui/badge'
import { Input } from '../../../../components/ui/input'
import {
  Key,
  Lock,
  Shield,
  Eye,
  EyeOff,
  Copy,
  Edit,
  Trash2,
  Calendar,
  Activity,
  AlertTriangle,
  CheckCircle,
  Globe,
  Database,
  Cookie
} from 'lucide-react'
import { cn } from '../../../../shared/lib/utils'

interface Secret {
  id: string
  service_id: string
  secret_type:
    | 'password'
    | 'api_key'
    | 'token'
    | 'certificate'
    | 'private_key'
    | 'session'
    | 'cookie'
    | '2fa_key'
    | 'other'
  secret_value: string
  secret_name?: string // Custom name for the secret
  creation_date: string
  last_updated: string
  expiry_date?: string
  is_expired?: boolean
  strength?: 'weak' | 'medium' | 'strong'
  metadata?: Record<string, any>
}

interface SecretCardProps {
  secret: Secret
  onEdit?: (secret: Secret) => void
  onDelete?: (secretId: string) => void
  onCopy?: (value: string) => void
  className?: string
  compact?: boolean
}

const SecretCard: React.FC<SecretCardProps> = ({
  secret,
  onEdit,
  onDelete,
  onCopy,
  className,
  compact = false
}) => {
  const [showSecret, setShowSecret] = useState(false)
  const [isHovered, setIsHovered] = useState(false)

  const getSecretTypeInfo = (type: string) => {
    const typeInfo: Record<
      string,
      {
        color: string
        icon: React.ElementType
        label: string
        description: string
      }
    > = {
      password: {
        color: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300 border-blue-200',
        icon: Lock,
        label: 'Password',
        description: 'Account login password'
      },
      api_key: {
        color:
          'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300 border-green-200',
        icon: Key,
        label: 'API Key',
        description: 'Application Programming Interface key'
      },
      token: {
        color:
          'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300 border-purple-200',
        icon: Shield,
        label: 'Token',
        description: 'Authentication or access token'
      },
      certificate: {
        color:
          'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300 border-orange-200',
        icon: Shield,
        label: 'Certificate',
        description: 'Digital certificate or SSL cert'
      },
      private_key: {
        color: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300 border-red-200',
        icon: Key,
        label: 'Private Key',
        description: 'Cryptographic private key'
      },
      session: {
        color:
          'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-300 border-indigo-200',
        icon: Globe,
        label: 'Session',
        description: 'Session identifier or token'
      },
      cookie: {
        color:
          'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300 border-yellow-200',
        icon: Cookie,
        label: 'Cookie',
        description: 'Browser cookie value'
      },
      '2fa_key': {
        color:
          'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300 border-emerald-200',
        icon: Shield,
        label: '2FA Key',
        description: 'Two-factor authentication secret'
      },
      other: {
        color: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300 border-gray-200',
        icon: Database,
        label: 'Other',
        description: 'Custom secret type'
      }
    }
    return typeInfo[type] || typeInfo['other']
  }

  const getStrengthInfo = (strength?: string) => {
    switch (strength) {
      case 'strong':
        return {
          color:
            'bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-300',
          icon: CheckCircle,
          label: 'Strong'
        }
      case 'medium':
        return {
          color:
            'bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-300',
          icon: AlertTriangle,
          label: 'Medium'
        }
      case 'weak':
        return {
          color: 'bg-red-100 text-red-800 border-red-200 dark:bg-red-900/30 dark:text-red-300',
          icon: AlertTriangle,
          label: 'Weak'
        }
      default:
        return null
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    })
  }

  const isExpiringSoon = (expiryDate?: string) => {
    if (!expiryDate) return false
    const expiry = new Date(expiryDate)
    const now = new Date()
    const diffDays = Math.ceil((expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
    return diffDays <= 30 && diffDays > 0
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    if (onCopy) {
      onCopy(text)
    }
  }

  const handleEdit = () => {
    if (onEdit) {
      onEdit(secret)
    }
  }

  const handleDelete = () => {
    if (onDelete) {
      onDelete(secret.id)
    }
  }

  const typeInfo = getSecretTypeInfo(secret.secret_type)
  const TypeIcon = typeInfo.icon
  const strengthInfo = getStrengthInfo(secret.strength)

  // Truncate secret value for display
  const displayValue = showSecret
    ? secret.secret_value.length > 50
      ? `${secret.secret_value.substring(0, 50)}...`
      : secret.secret_value
    : '•'.repeat(Math.min(secret.secret_value.length, 20))

  return (
    <div
      className={cn(
        'group bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 transition-all duration-200',
        isHovered ? 'shadow-lg border-blue-300 dark:border-blue-600' : 'shadow-sm hover:shadow-md',
        compact ? 'p-4' : 'p-6',
        className
      )}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center shadow-md">
            <TypeIcon className="h-5 w-5 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Badge variant="secondary" className={cn('text-xs border', typeInfo.color)}>
                {typeInfo.label}
              </Badge>
              {strengthInfo &&
                (() => {
                  const StrengthIcon = strengthInfo.icon
                  return (
                    <Badge variant="secondary" className={cn('text-xs border', strengthInfo.color)}>
                      <StrengthIcon className="h-3 w-3 mr-1" />
                      {strengthInfo.label}
                    </Badge>
                  )
                })()}
            </div>
            {secret.secret_name && (
              <h4 className="font-medium text-gray-900 dark:text-white text-sm">
                {secret.secret_name}
              </h4>
            )}
            <p className="text-xs text-gray-500 dark:text-gray-400">{typeInfo.description}</p>
          </div>
        </div>

        {/* Actions */}
        <div
          className={cn(
            'flex items-center gap-1 transition-opacity duration-200',
            isHovered ? 'opacity-100' : 'opacity-0'
          )}
        >
          <Button
            variant="ghost"
            size="sm"
            onClick={handleEdit}
            className="p-1 h-7 w-7 text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
          >
            <Edit className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleDelete}
            className="p-1 h-7 w-7 text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Secret Value */}
      <div className="mb-4">
        <div className="flex items-center gap-2">
          <Input
            value={displayValue}
            readOnly
            className={cn(
              'flex-1 font-mono bg-gray-50 dark:bg-gray-700 text-sm',
              compact ? 'h-8' : 'h-10'
            )}
          />
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowSecret(!showSecret)}
            className="px-3 hover:bg-yellow-50 dark:hover:bg-yellow-900/20"
          >
            {showSecret ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => copyToClipboard(secret.secret_value)}
            className="px-3 hover:bg-blue-50 dark:hover:bg-blue-900/20"
          >
            <Copy className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Status Badges */}
      <div className="flex flex-wrap gap-2 mb-4">
        {secret.expiry_date && (
          <Badge
            variant="secondary"
            className={cn(
              'text-xs border',
              secret.is_expired
                ? 'bg-red-100 text-red-800 border-red-200 dark:bg-red-900/30 dark:text-red-300'
                : isExpiringSoon(secret.expiry_date)
                  ? 'bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-300'
                  : 'bg-green-100 text-green-800 border-green-200 dark:bg-green-900/30 dark:text-green-300'
            )}
          >
            {secret.is_expired ? (
              <AlertTriangle className="h-3 w-3 mr-1" />
            ) : (
              <CheckCircle className="h-3 w-3 mr-1" />
            )}
            {secret.is_expired ? 'Expired' : `Expires ${formatDate(secret.expiry_date)}`}
          </Badge>
        )}
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 pt-3 border-t border-gray-100 dark:border-gray-700">
        <div className="flex items-center gap-1">
          <Calendar className="h-3 w-3" />
          <span>Created {formatDate(secret.creation_date)}</span>
        </div>
        <div className="flex items-center gap-1">
          <Activity className="h-3 w-3" />
          <span>Updated {formatDate(secret.last_updated)}</span>
        </div>
      </div>

      {/* Metadata */}
      {secret.metadata && Object.keys(secret.metadata).length > 0 && (
        <div className="mt-3 pt-3 border-t border-gray-100 dark:border-gray-700">
          <div className="flex flex-wrap gap-1">
            {Object.entries(secret.metadata)
              .slice(0, 3)
              .map(([key, value]) => (
                <span
                  key={key}
                  className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 rounded text-xs"
                >
                  {key}: {String(value)}
                </span>
              ))}
            {Object.keys(secret.metadata).length > 3 && (
              <span className="px-2 py-1 text-gray-500 text-xs">
                +{Object.keys(secret.metadata).length - 3} more
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default SecretCard
