// src/renderer/src/presentation/pages/EmailManager/components/SecretsList.tsx
import React, { useState } from 'react'
import { Button } from '../../../../components/ui/button'
import { Input } from '../../../../components/ui/input'
import { Plus, Search, Filter, Key, Shield, AlertTriangle } from 'lucide-react'
import { cn } from '../../../../shared/lib/utils'
import SecretCard from './SecretCard'
import AddSecretModal from './AddSecretModal'
import { ServiceAccountSecret } from '../data/mockEmailData'

interface SecretsListProps {
  secrets: ServiceAccountSecret[]
  serviceName?: string
  serviceId?: string
  onSecretAdd?: (secret: Omit<ServiceAccountSecret, 'id' | 'last_update'>) => void
  onSecretEdit?: (secret: ServiceAccountSecret) => void
  onSecretDelete?: (secretId: string) => void
  className?: string
  compact?: boolean
}

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
  secret_name?: string
  creation_date: string
  last_updated: string
  expiry_date?: string
  is_expired?: boolean
  strength?: 'weak' | 'medium' | 'strong'
  metadata?: Record<string, any>
}

const SecretsList: React.FC<SecretsListProps> = ({
  secrets,
  serviceName,
  serviceId,
  onSecretAdd,
  onSecretEdit,
  onSecretDelete,
  className,
  compact = false
}) => {
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedType, setSelectedType] = useState<string>('')
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)

  // Get unique secret types from the secrets
  const secretTypes = [...new Set(secrets.map((s) => s.secret_type).filter(Boolean))]

  const filteredSecrets = secrets.filter((secret) => {
    const matchesSearch =
      (secret.name && secret.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
      secret.secret_type.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesType = !selectedType || secret.secret_type === selectedType

    return matchesSearch && matchesType
  })

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
    return typeLabels[type] || type
  }

  const handleAddSecret = (secretData: Omit<Secret, 'id' | 'creation_date' | 'last_updated'>) => {
    if (onSecretAdd) {
      // Convert Secret format to ServiceAccountSecret format
      const convertedSecret: Omit<ServiceAccountSecret, 'id' | 'last_update'> = {
        service_account_id: secretData.service_id,
        secret_type: secretData.secret_type as any,
        name: secretData.secret_name,
        value: secretData.secret_value,
        expire_at: secretData.expiry_date,
        metadata: secretData.metadata
      }
      onSecretAdd(convertedSecret)
    }
    setIsAddModalOpen(false)
  }

  const handleEditSecret = (secret: ServiceAccountSecret) => {
    if (onSecretEdit) {
      onSecretEdit(secret)
    }
  }

  const handleDeleteSecret = (secretId: string) => {
    if (onSecretDelete) {
      onSecretDelete(secretId)
    }
  }

  const handleCopySecret = (value: string | string[]) => {
    const textToCopy = Array.isArray(value) ? value.join('\n') : value
    navigator.clipboard.writeText(textToCopy)
    // You could add a toast notification here
  }

  return (
    <div className={cn('space-y-6', className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3
            className={cn(
              'font-bold text-gray-900 dark:text-white flex items-center gap-2',
              compact ? 'text-lg' : 'text-xl'
            )}
          >
            <Shield className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
            Secrets & Tokens
            {serviceName && (
              <span className="text-base font-normal text-gray-600 dark:text-gray-400">
                for {serviceName}
              </span>
            )}
          </h3>
          <p className="text-gray-600 dark:text-gray-400 text-sm mt-1">
            {secrets.length} secret{secrets.length !== 1 ? 's' : ''} stored securely
          </p>
        </div>
        <Button
          size="sm"
          onClick={() => setIsAddModalOpen(true)}
          className="bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white shadow-md"
        >
          <Plus className="h-4 w-4 mr-1" />
          Add Secret
        </Button>
      </div>

      {/* Search and Filters */}
      {secrets.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700 shadow-sm">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search secrets by name or type..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 bg-gray-50 dark:bg-gray-700 border-gray-200 dark:border-gray-600"
              />
            </div>
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-gray-400" />
              <select
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value)}
                className="px-3 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              >
                <option value="">All types</option>
                {secretTypes.map((type) => (
                  <option key={type} value={type}>
                    {getTypeLabel(type)}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      )}

      {/* Secrets List */}
      {filteredSecrets.length === 0 ? (
        <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
          <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
            {secrets.length === 0 ? (
              <Key className="h-8 w-8 text-gray-400" />
            ) : (
              <Search className="h-8 w-8 text-gray-400" />
            )}
          </div>
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            {secrets.length === 0 ? 'No secrets stored' : 'No secrets found'}
          </h3>
          <p className="text-gray-500 dark:text-gray-400 mb-4">
            {secrets.length === 0
              ? 'Store API keys, tokens, and other sensitive data securely'
              : 'Try adjusting your search or filters'}
          </p>
          {secrets.length === 0 && (
            <Button
              onClick={() => setIsAddModalOpen(true)}
              className="bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700"
            >
              <Plus className="h-4 w-4 mr-1" />
              Add First Secret
            </Button>
          )}
        </div>
      ) : (
        <div className="grid gap-4">
          {filteredSecrets.map((secret) => (
            <SecretCard
              key={secret.id}
              secret={{
                id: secret.id,
                service_id: secret.service_account_id,
                secret_type: secret.secret_type as any,
                secret_value: Array.isArray(secret.value) ? secret.value.join('\n') : secret.value,
                secret_name: secret.name,
                creation_date: secret.last_update,
                last_updated: secret.last_update,
                expiry_date: secret.expire_at,
                is_expired: secret.expire_at ? new Date(secret.expire_at) < new Date() : false,
                metadata: secret.metadata
              }}
              onEdit={(editedSecret) => {
                // Convert back to ServiceAccountSecret format
                const convertedSecret: ServiceAccountSecret = {
                  id: editedSecret.id,
                  service_account_id: editedSecret.service_id,
                  secret_type: editedSecret.secret_type as any,
                  name: editedSecret.secret_name,
                  value: editedSecret.secret_value,
                  last_update: editedSecret.last_updated,
                  expire_at: editedSecret.expiry_date,
                  metadata: editedSecret.metadata
                }
                handleEditSecret(convertedSecret)
              }}
              onDelete={handleDeleteSecret}
              onCopy={handleCopySecret}
              compact={compact}
            />
          ))}
        </div>
      )}

      {/* Quick Stats */}
      {secrets.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-2 mb-2">
              <Key className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
              <div className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">
                {secrets.filter((s) => s.secret_type === 'api_key').length}
              </div>
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">API Keys</div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-2 mb-2">
              <Shield className="h-4 w-4 text-green-600 dark:text-green-400" />
              <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                {secrets.filter((s) => s.secret_type.includes('token')).length}
              </div>
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Tokens</div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400" />
              <div className="text-2xl font-bold text-amber-600 dark:text-amber-400">
                {secrets.filter((s) => s.expire_at && new Date(s.expire_at) < new Date()).length}
              </div>
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Expired</div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-2 mb-2">
              <Key className="h-4 w-4 text-purple-600 dark:text-purple-400" />
              <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                {secretTypes.length}
              </div>
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Types</div>
          </div>
        </div>
      )}

      {/* Add Secret Modal */}
      {serviceId && (
        <AddSecretModal
          isOpen={isAddModalOpen}
          onClose={() => setIsAddModalOpen(false)}
          onAdd={handleAddSecret}
          serviceId={serviceId}
          serviceName={serviceName}
        />
      )}
    </div>
  )
}

export default SecretsList
