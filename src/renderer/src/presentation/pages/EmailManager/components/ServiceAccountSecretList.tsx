// src/renderer/src/presentation/pages/EmailManager/components/ServiceAccountSecretList.tsx
import React, { useState } from 'react'
import { Button } from '../../../../components/ui/button'
import { Input } from '../../../../components/ui/input'
import {
  Plus,
  Search,
  Filter,
  Key,
  Database,
  Clock,
  AlertTriangle,
  Lock,
  ChevronDown,
  ChevronUp
} from 'lucide-react'
import { cn } from '../../../../shared/lib/utils'
import { ServiceAccount, ServiceAccountSecret } from '../types'
import ServiceAccountSecretCard from './ServiceAccountSecretCard'

interface ServiceAccountSecretListProps {
  serviceAccount: ServiceAccount
  secrets: ServiceAccountSecret[]
  onSecretAdd?: (secret: Omit<ServiceAccountSecret, 'id' | 'service_account_id'>) => void
  onSecretEdit?: (secret: ServiceAccountSecret) => void
  onSecretDelete?: (secretId: string) => void
  className?: string
  compact?: boolean
}

const ServiceAccountSecretList: React.FC<ServiceAccountSecretListProps> = ({
  serviceAccount,
  secrets,
  onSecretEdit,
  onSecretDelete,
  className
}) => {
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedType, setSelectedType] = useState<string>('')
  const [showExpired, setShowExpired] = useState(true)
  const [isSecretsExpanded, setIsSecretsExpanded] = useState(true)

  // Filter secrets based on search and filters
  const filteredSecrets = secrets.filter((secret) => {
    const matchesSearch =
      secret.secret_type.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (secret.name && secret.name.toLowerCase().includes(searchTerm.toLowerCase()))

    const matchesType = !selectedType || secret.secret_type === selectedType

    const isExpired = secret.expire_at ? new Date(secret.expire_at) < new Date() : false
    const matchesExpiredFilter = showExpired || !isExpired

    return matchesSearch && matchesType && matchesExpiredFilter
  })

  // Get unique secret types from the secrets
  const secretTypes = [...new Set(secrets.map((s) => s.secret_type).filter(Boolean))]

  // Get statistics
  const expiredSecrets = secrets.filter(
    (secret) => secret.expire_at && new Date(secret.expire_at) < new Date()
  ).length

  const expiringSecrets = secrets.filter((secret) => {
    if (!secret.expire_at) return false
    const expiryDate = new Date(secret.expire_at)
    const now = new Date()
    const daysUntilExpiry = Math.ceil(
      (expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
    )
    return daysUntilExpiry > 0 && daysUntilExpiry <= 30
  }).length

  const getTypeLabel = (type: string) => {
    const typeLabels: Record<string, string> = {
      api_key: 'API Key',
      cookie: 'Cookie',
      access_token: 'Access Token',
      refresh_token: 'Refresh Token',
      private_key: 'Private Key',
      client_secret: 'Client Secret',
      session_id: 'Session ID',
      csrf_token: 'CSRF Token',
      encryption_key: 'Encryption Key',
      other: 'Other'
    }
    return typeLabels[type] || type.replace(/_/g, ' ')
  }

  const handleSecretEdit = (secret: ServiceAccountSecret) => {
    if (onSecretEdit) {
      onSecretEdit(secret)
    }
  }

  const handleSecretDelete = (secretId: string) => {
    if (onSecretDelete) {
      onSecretDelete(secretId)
    }
  }

  const handleAddSecret = () => {
    console.log('Open add secret modal for service:', serviceAccount.id)
    // Implementation for add secret modal
  }

  return (
    <div className={cn('space-y-6', className)}>
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200/60 dark:border-gray-700/60 shadow-sm hover:shadow-md transition-all duration-300">
        <div className="p-6">
          {/* Header with Toggle */}
          <button
            onClick={() => setIsSecretsExpanded(!isSecretsExpanded)}
            className="w-full flex items-center justify-between group"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-purple-50 dark:bg-purple-900/20 rounded-xl flex items-center justify-center">
                <Database className="h-5 w-5 text-purple-600 dark:text-purple-400" />
              </div>
              <div className="text-left">
                <h4 className="text-xl font-bold text-gray-900 dark:text-white">
                  Secrets & Tokens
                </h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {serviceAccount.service_name} • {secrets.length} secret
                  {secrets.length !== 1 ? 's' : ''} stored
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Button
                size="sm"
                onClick={(e) => {
                  e.stopPropagation()
                  handleAddSecret()
                }}
                className="bg-purple-600 hover:bg-purple-700 text-white shadow-sm"
              >
                <Plus className="h-4 w-4 mr-1" />
                Add Secret
              </Button>
              <div className="w-6 h-6 bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center group-hover:bg-gray-200 dark:group-hover:bg-gray-600 transition-colors">
                {isSecretsExpanded ? (
                  <ChevronUp className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                ) : (
                  <ChevronDown className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                )}
              </div>
            </div>
          </button>

          {/* Expanded Content */}
          {isSecretsExpanded && (
            <div className="mt-6 pt-6 border-t border-gray-100 dark:border-gray-700">
              {/* Search and Filters */}
              {secrets.length > 0 && (
                <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-4 border border-gray-100 dark:border-gray-600 mb-6">
                  <div className="flex flex-col lg:flex-row gap-3">
                    <div className="relative flex-1">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <Input
                        placeholder="Search secrets by type or name..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-600"
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <Filter className="h-4 w-4 text-gray-400" />
                      <select
                        value={selectedType}
                        onChange={(e) => setSelectedType(e.target.value)}
                        className="px-3 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg text-sm focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500"
                      >
                        <option value="">All types</option>
                        {secretTypes.map((type) => (
                          <option key={type} value={type}>
                            {getTypeLabel(type)}
                          </option>
                        ))}
                      </select>
                      <label className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                        <input
                          type="checkbox"
                          checked={showExpired}
                          onChange={(e) => setShowExpired(e.target.checked)}
                          className="rounded border-gray-300 dark:border-gray-600"
                        />
                        Show expired
                      </label>
                    </div>
                  </div>
                </div>
              )}

              {/* Quick Stats */}
              {secrets.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                  <div className="bg-blue-50 dark:bg-blue-900/10 rounded-xl p-4 border border-blue-100 dark:border-blue-800/30">
                    <div className="flex items-center gap-2 mb-2">
                      <Key className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                      <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                        {secrets.length}
                      </div>
                    </div>
                    <div className="text-sm text-blue-700 dark:text-blue-300">Total Secrets</div>
                  </div>

                  {expiredSecrets > 0 && (
                    <div className="bg-red-50 dark:bg-red-900/10 rounded-xl p-4 border border-red-100 dark:border-red-800/30">
                      <div className="flex items-center gap-2 mb-2">
                        <AlertTriangle className="h-4 w-4 text-red-600 dark:text-red-400" />
                        <div className="text-2xl font-bold text-red-600 dark:text-red-400">
                          {expiredSecrets}
                        </div>
                      </div>
                      <div className="text-sm text-red-700 dark:text-red-300">Expired</div>
                    </div>
                  )}

                  {expiringSecrets > 0 && (
                    <div className="bg-yellow-50 dark:bg-yellow-900/10 rounded-xl p-4 border border-yellow-100 dark:border-yellow-800/30">
                      <div className="flex items-center gap-2 mb-2">
                        <Clock className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
                        <div className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
                          {expiringSecrets}
                        </div>
                      </div>
                      <div className="text-sm text-yellow-700 dark:text-yellow-300">
                        Expiring Soon
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Secrets List */}
              {filteredSecrets.length > 0 ? (
                <div className="space-y-4">
                  {filteredSecrets.map((secret) => (
                    <ServiceAccountSecretCard
                      key={secret.id}
                      secret={secret}
                      onEdit={handleSecretEdit}
                      onDelete={handleSecretDelete}
                    />
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    {secrets.length === 0 ? (
                      <Database className="h-8 w-8 text-gray-400" />
                    ) : (
                      <Search className="h-8 w-8 text-gray-400" />
                    )}
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                    {secrets.length === 0 ? 'No secrets stored' : 'No secrets found'}
                  </h3>
                  <p className="text-gray-500 dark:text-gray-400 mb-4">
                    {secrets.length === 0
                      ? `Store API keys, tokens, and other secrets for ${serviceAccount.service_name}`
                      : 'Try adjusting your search or filters'}
                  </p>
                  {secrets.length === 0 && (
                    <Button
                      onClick={handleAddSecret}
                      className="bg-purple-600 hover:bg-purple-700 text-white"
                    >
                      <Plus className="h-4 w-4 mr-1" />
                      Add First Secret
                    </Button>
                  )}
                </div>
              )}

              {/* Security Notice */}
              {secrets.length > 0 && (
                <div className="mt-6 p-4 bg-amber-50 dark:bg-amber-900/10 rounded-xl border border-amber-100 dark:border-amber-800/30">
                  <div className="flex items-start gap-3">
                    <Lock className="h-5 w-5 text-amber-600 dark:text-amber-400 mt-0.5" />
                    <div>
                      <h5 className="text-sm font-semibold text-amber-800 dark:text-amber-300 mb-1">
                        Security Notice
                      </h5>
                      <p className="text-sm text-amber-700 dark:text-amber-400">
                        Secrets are encrypted and stored securely. Always use unique, strong secrets
                        and rotate them regularly. Never share these values outside of authorized
                        systems.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default ServiceAccountSecretList
