// src/renderer/src/presentation/pages/Setting/components/GeminiAPIManagerSection.tsx
import React, { useState, useEffect } from 'react'
import {
  Key,
  Plus,
  Trash2,
  Eye,
  EyeOff,
  Check,
  X,
  Activity,
  Calendar,
  TrendingUp,
  AlertCircle,
  Edit2,
  Save,
  RefreshCw
} from 'lucide-react'
import { cn } from '../../../../shared/lib/utils'
import CustomButton from '../../../../components/common/CustomButton'
import CustomInput from '../../../../components/common/CustomInput'
import CustomBadge from '../../../../components/common/CustomBadge'
import { geminiService, GeminiAPIKey } from '../../../../services/GeminiService'

interface APIKeyCardProps {
  apiKey: GeminiAPIKey
  onUpdate: (id: string, updates: Partial<GeminiAPIKey>) => void
  onDelete: (id: string) => void
  onValidate: (id: string) => void
  validating: string | null
}

const APIKeyCard: React.FC<APIKeyCardProps> = ({
  apiKey,
  onUpdate,
  onDelete,
  onValidate,
  validating
}) => {
  const [showKey, setShowKey] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [editedName, setEditedName] = useState(apiKey.name)
  const [editedKey, setEditedKey] = useState(apiKey.key)

  const handleSave = () => {
    onUpdate(apiKey.id, {
      name: editedName,
      key: editedKey
    })
    setIsEditing(false)
  }

  const handleCancel = () => {
    setEditedName(apiKey.name)
    setEditedKey(apiKey.key)
    setIsEditing(false)
  }

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Never'
    return new Date(dateString).toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const isValidating = validating === apiKey.id

  return (
    <div
      className={cn(
        'bg-card-background rounded-xl border transition-all duration-200',
        apiKey.isActive
          ? 'border-green-200 dark:border-green-700 shadow-sm'
          : 'border-gray-200 dark:border-gray-700 opacity-60'
      )}
    >
      <div className="p-4 space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              className={cn(
                'w-10 h-10 rounded-lg flex items-center justify-center',
                apiKey.isActive
                  ? 'bg-gradient-to-br from-green-500 to-emerald-600'
                  : 'bg-gray-300 dark:bg-gray-600'
              )}
            >
              <Key className="h-5 w-5 text-white" />
            </div>

            <div>
              {isEditing ? (
                <CustomInput
                  value={editedName}
                  onChange={setEditedName}
                  placeholder="API Key Name"
                  size="sm"
                  className="w-48"
                />
              ) : (
                <h3 className="font-semibold text-text-primary">{apiKey.name}</h3>
              )}
              <div className="flex items-center gap-2 mt-1">
                <CustomBadge
                  variant={apiKey.isActive ? 'success' : 'secondary'}
                  size="sm"
                  className="text-xs"
                >
                  {apiKey.isActive ? 'Active' : 'Inactive'}
                </CustomBadge>
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  Used {apiKey.usageCount} times
                </span>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-1">
            {isEditing ? (
              <>
                <CustomButton
                  variant="ghost"
                  size="sm"
                  icon={Save}
                  onClick={handleSave}
                  className="text-green-600 hover:text-green-700"
                  children={undefined}
                />
                <CustomButton
                  variant="ghost"
                  size="sm"
                  icon={X}
                  onClick={handleCancel}
                  className="text-gray-600 hover:text-gray-700"
                  children={undefined}
                />
              </>
            ) : (
              <>
                <CustomButton
                  variant="ghost"
                  size="sm"
                  icon={Edit2}
                  onClick={() => setIsEditing(true)}
                  className="text-blue-600 hover:text-blue-700"
                  children={undefined}
                />
                <CustomButton
                  variant="ghost"
                  size="sm"
                  icon={Trash2}
                  onClick={() => onDelete(apiKey.id)}
                  className="text-red-600 hover:text-red-700"
                  children={undefined}
                />
              </>
            )}
          </div>
        </div>

        {/* API Key Display */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">API Key</span>
            <button
              onClick={() => setShowKey(!showKey)}
              className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1"
            >
              {showKey ? (
                <>
                  <EyeOff className="h-3 w-3" />
                  Hide
                </>
              ) : (
                <>
                  <Eye className="h-3 w-3" />
                  Show
                </>
              )}
            </button>
          </div>

          {isEditing ? (
            <CustomInput
              value={editedKey}
              onChange={setEditedKey}
              placeholder="Enter API Key"
              type={showKey ? 'text' : 'password'}
              size="sm"
            />
          ) : (
            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3 font-mono text-sm break-all">
              {showKey ? apiKey.key : '•'.repeat(40)}
            </div>
          )}
        </div>

        {/* Statistics */}
        <div className="grid grid-cols-2 gap-3 pt-3 border-t border-gray-100 dark:border-gray-700">
          <div className="space-y-1">
            <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
              <Calendar className="h-3 w-3" />
              <span>Last Used</span>
            </div>
            <p className="text-sm font-medium text-text-primary">{formatDate(apiKey.lastUsed)}</p>
          </div>

          <div className="space-y-1">
            <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
              <Activity className="h-3 w-3" />
              <span>Created</span>
            </div>
            <p className="text-sm font-medium text-text-primary">{formatDate(apiKey.createdAt)}</p>
          </div>
        </div>

        {/* Actions Footer */}
        <div className="flex items-center justify-between pt-3 border-t border-gray-100 dark:border-gray-700">
          <button
            onClick={() =>
              onUpdate(apiKey.id, {
                isActive: !apiKey.isActive
              })
            }
            className={cn(
              'text-sm font-medium transition-colors',
              apiKey.isActive
                ? 'text-red-600 hover:text-red-700'
                : 'text-green-600 hover:text-green-700'
            )}
          >
            {apiKey.isActive ? 'Deactivate' : 'Activate'}
          </button>

          <CustomButton
            variant="ghost"
            size="sm"
            onClick={() => onValidate(apiKey.id)}
            disabled={isValidating}
            loading={isValidating}
            className="text-xs"
          >
            Validate Key
          </CustomButton>
        </div>
      </div>
    </div>
  )
}

const GeminiAPIManagerSection: React.FC = () => {
  const [apiKeys, setApiKeys] = useState<GeminiAPIKey[]>([])
  const [showAddForm, setShowAddForm] = useState(false)
  const [newKeyName, setNewKeyName] = useState('')
  const [newKey, setNewKey] = useState('')
  const [validating, setValidating] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  // Load API keys on mount
  useEffect(() => {
    loadAPIKeys()
  }, [])

  const loadAPIKeys = () => {
    const keys = geminiService.getAPIKeys()
    setApiKeys(keys)
  }

  const handleAddKey = async () => {
    if (!newKeyName.trim() || !newKey.trim()) {
      setError('Please enter both name and API key')
      return
    }

    try {
      // Validate key before adding
      setValidating('new')
      const isValid = await geminiService.validateAPIKey(newKey.trim())

      if (!isValid) {
        setError('Invalid API key. Please check and try again.')
        setValidating(null)
        return
      }

      geminiService.addAPIKey(newKey.trim(), newKeyName.trim())
      loadAPIKeys()
      setNewKeyName('')
      setNewKey('')
      setShowAddForm(false)
      setSuccess('API key added successfully!')
      setValidating(null)

      setTimeout(() => setSuccess(null), 3000)
    } catch (error) {
      console.error('Failed to add API key:', error)
      setError('Failed to add API key. Please try again.')
      setValidating(null)
    }
  }

  const handleUpdateKey = (id: string, updates: Partial<GeminiAPIKey>) => {
    geminiService.updateAPIKey(id, updates)
    loadAPIKeys()
    setSuccess('API key updated successfully!')
    setTimeout(() => setSuccess(null), 3000)
  }

  const handleDeleteKey = (id: string) => {
    if (window.confirm('Are you sure you want to delete this API key?')) {
      geminiService.deleteAPIKey(id)
      loadAPIKeys()
      setSuccess('API key deleted successfully!')
      setTimeout(() => setSuccess(null), 3000)
    }
  }

  const handleValidateKey = async (id: string) => {
    const key = apiKeys.find((k) => k.id === id)
    if (!key) return

    try {
      setValidating(id)
      const isValid = await geminiService.validateAPIKey(key.key)

      if (isValid) {
        setSuccess(`API key "${key.name}" is valid!`)
      } else {
        setError(`API key "${key.name}" is invalid!`)
      }

      setTimeout(() => {
        setSuccess(null)
        setError(null)
      }, 3000)
    } catch (error) {
      console.error('Validation failed:', error)
      setError('Validation failed. Please try again.')
    } finally {
      setValidating(null)
    }
  }

  const statistics = geminiService.getStatistics()

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-text-primary flex items-center gap-2">
            <Key className="h-6 w-6 text-purple-600 dark:text-purple-400" />
            Gemini API Keys
          </h2>
          <p className="text-sm text-text-secondary mt-1">
            Manage your Google Gemini API keys for AI-powered features
          </p>
        </div>

        <CustomButton
          variant="primary"
          size="sm"
          icon={Plus}
          onClick={() => setShowAddForm(!showAddForm)}
          className="bg-purple-600 hover:bg-purple-700"
        >
          Add API Key
        </CustomButton>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 border border-blue-200 dark:border-blue-700">
          <div className="flex items-center gap-2 mb-2">
            <Key className="h-4 w-4 text-blue-600 dark:text-blue-400" />
            <span className="text-sm font-medium text-blue-700 dark:text-blue-300">Total Keys</span>
          </div>
          <p className="text-2xl font-bold text-blue-900 dark:text-blue-100">
            {statistics.totalKeys}
          </p>
        </div>

        <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4 border border-green-200 dark:border-green-700">
          <div className="flex items-center gap-2 mb-2">
            <Check className="h-4 w-4 text-green-600 dark:text-green-400" />
            <span className="text-sm font-medium text-green-700 dark:text-green-300">
              Active Keys
            </span>
          </div>
          <p className="text-2xl font-bold text-green-900 dark:text-green-100">
            {statistics.activeKeys}
          </p>
        </div>

        <div className="bg-orange-50 dark:bg-orange-900/20 rounded-lg p-4 border border-orange-200 dark:border-orange-700">
          <div className="flex items-center gap-2 mb-2">
            <X className="h-4 w-4 text-orange-600 dark:text-orange-400" />
            <span className="text-sm font-medium text-orange-700 dark:text-orange-300">
              Inactive Keys
            </span>
          </div>
          <p className="text-2xl font-bold text-orange-900 dark:text-orange-100">
            {statistics.inactiveKeys}
          </p>
        </div>

        <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-4 border border-purple-200 dark:border-purple-700">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="h-4 w-4 text-purple-600 dark:text-purple-400" />
            <span className="text-sm font-medium text-purple-700 dark:text-purple-300">
              Total Usage
            </span>
          </div>
          <p className="text-2xl font-bold text-purple-900 dark:text-purple-100">
            {statistics.totalUsage}
          </p>
        </div>
      </div>

      {/* Success/Error Messages */}
      {success && (
        <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700 rounded-lg p-4 flex items-start gap-3">
          <Check className="h-5 w-5 text-green-600 dark:text-green-400 mt-0.5 flex-shrink-0" />
          <p className="text-sm text-green-700 dark:text-green-300">{success}</p>
        </div>
      )}

      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-lg p-4 flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400 mt-0.5 flex-shrink-0" />
          <div className="flex-1">
            <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
            <button
              onClick={() => setError(null)}
              className="text-xs text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 mt-1 underline"
            >
              Dismiss
            </button>
          </div>
        </div>
      )}

      {/* Add API Key Form */}
      {showAddForm && (
        <div className="bg-card-background rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm p-4 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-text-primary">Add New API Key</h3>
            <button
              onClick={() => setShowAddForm(false)}
              className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
            >
              <X className="h-4 w-4 text-gray-500" />
            </button>
          </div>

          <CustomInput
            label="API Key Name"
            value={newKeyName}
            onChange={setNewKeyName}
            placeholder="e.g., Production Key, Development Key..."
            size="sm"
            required
          />

          <CustomInput
            label="API Key"
            value={newKey}
            onChange={setNewKey}
            placeholder="Enter your Gemini API key..."
            type="password"
            size="sm"
            required
          />

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-gray-100 dark:border-gray-700">
            <CustomButton
              variant="secondary"
              size="sm"
              onClick={() => setShowAddForm(false)}
              disabled={validating === 'new'}
            >
              Cancel
            </CustomButton>
            <CustomButton
              variant="primary"
              size="sm"
              onClick={handleAddKey}
              disabled={validating === 'new'}
              loading={validating === 'new'}
              icon={validating === 'new' ? RefreshCw : Check}
              className="bg-purple-600 hover:bg-purple-700"
            >
              {validating === 'new' ? 'Validating...' : 'Add API Key'}
            </CustomButton>
          </div>
        </div>
      )}

      {/* API Keys List */}
      {apiKeys.length === 0 ? (
        <div className="text-center py-12 bg-card-background rounded-xl border border-gray-200 dark:border-gray-700">
          <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
            <Key className="h-8 w-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-text-primary mb-2">No API Keys</h3>
          <p className="text-sm text-text-secondary mb-4">
            Add your first Gemini API key to enable AI-powered features
          </p>
          <CustomButton
            variant="primary"
            size="sm"
            icon={Plus}
            onClick={() => setShowAddForm(true)}
            className="bg-purple-600 hover:bg-purple-700"
          >
            Add Your First API Key
          </CustomButton>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {apiKeys.map((apiKey) => (
            <APIKeyCard
              key={apiKey.id}
              apiKey={apiKey}
              onUpdate={handleUpdateKey}
              onDelete={handleDeleteKey}
              onValidate={handleValidateKey}
              validating={validating}
            />
          ))}
        </div>
      )}
    </div>
  )
}

export default GeminiAPIManagerSection
