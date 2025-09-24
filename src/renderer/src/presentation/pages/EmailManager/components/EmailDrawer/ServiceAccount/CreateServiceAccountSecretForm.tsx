// src/renderer/src/presentation/pages/EmailManager/components/EmailDrawer/ServiceAccount/CreateServiceAccountSecretForm.tsx
import React, { useState } from 'react'
import CustomButton from '../../../../../../components/common/CustomButton'
import CustomInput from '../../../../../../components/common/CustomInput'
import CustomTextArea from '../../../../../../components/common/CustomTextArea'
import CustomCombobox from '../../../../../../components/common/CustomCombobox'
import {
  Key,
  Cookie,
  Shield,
  RefreshCw,
  Lock,
  Code,
  Database,
  Hash,
  Zap,
  Plus,
  X,
  AlertCircle,
  Calendar,
  Globe,
  Eye,
  EyeOff
} from 'lucide-react'
import { cn } from '../../../../../../shared/lib/utils'
import { ServiceAccount, ServiceAccountSecret } from '../../../types'
import Metadata from '../../../../../../components/common/Metadata'
import { Button } from '../../../../../../components/ui/button'

interface CreateServiceAccountSecretFormProps {
  serviceAccount: ServiceAccount
  existingSecrets: ServiceAccountSecret[]
  onSubmit: (data: Omit<ServiceAccountSecret, 'id' | 'service_account_id'>) => Promise<void>
  onCancel: () => void
  loading?: boolean
  className?: string
}

// Secret type options for Service Account secrets
const secretTypeOptions = [
  {
    value: 'api_key',
    label: 'API Key',
    icon: Key,
    description: 'Application Programming Interface authentication key',
    placeholder: 'Enter API key...',
    inputType: 'password',
    isSensitive: true,
    unique: false,
    showName: true
  },
  {
    value: 'cookie',
    label: 'Cookie',
    icon: Cookie,
    description: 'HTTP session cookie data',
    placeholder: 'Enter cookie value...',
    inputType: 'textarea',
    isSensitive: true,
    unique: false,
    showName: true
  },
  {
    value: 'access_token',
    label: 'Access Token',
    icon: Shield,
    description: 'OAuth access token for API authorization',
    placeholder: 'Enter access token...',
    inputType: 'password',
    isSensitive: true,
    unique: true,
    showName: false
  },
  {
    value: 'refresh_token',
    label: 'Refresh Token',
    icon: RefreshCw,
    description: 'Token used to refresh access tokens',
    placeholder: 'Enter refresh token...',
    inputType: 'password',
    isSensitive: true,
    unique: true,
    showName: false
  },
  {
    value: 'private_key',
    label: 'Private Key',
    icon: Lock,
    description: 'Cryptographic private key',
    placeholder: 'Enter private key...',
    inputType: 'textarea',
    isSensitive: true,
    unique: false,
    showName: true
  },
  {
    value: 'client_secret',
    label: 'Client Secret',
    icon: Code,
    description: 'OAuth client application secret',
    placeholder: 'Enter client secret...',
    inputType: 'password',
    isSensitive: true,
    unique: true,
    showName: false
  },
  {
    value: 'session_id',
    label: 'Session ID',
    icon: Database,
    description: 'User session identifier',
    placeholder: 'Enter session ID...',
    inputType: 'text',
    isSensitive: true,
    unique: true,
    showName: false
  },
  {
    value: 'csrf_token',
    label: 'CSRF Token',
    icon: Shield,
    description: 'Cross-Site Request Forgery protection token',
    placeholder: 'Enter CSRF token...',
    inputType: 'text',
    isSensitive: false,
    unique: true,
    showName: false
  },
  {
    value: 'encryption_key',
    label: 'Encryption Key',
    icon: Hash,
    description: 'Data encryption/decryption key',
    placeholder: 'Enter encryption key...',
    inputType: 'password',
    isSensitive: true,
    unique: false,
    showName: true
  },
  {
    value: 'other',
    label: 'Other Secret',
    icon: Zap,
    description: 'Custom secret type',
    placeholder: 'Enter secret value...',
    inputType: 'password',
    isSensitive: true,
    unique: false,
    showName: true
  }
]

const CreateServiceAccountSecretForm: React.FC<CreateServiceAccountSecretFormProps> = ({
  serviceAccount,
  existingSecrets = [],
  onSubmit,
  onCancel,
  loading = false,
  className
}) => {
  const [formData, setFormData] = useState<{
    secret_type: string
    name: string
    value: string
    expire_at: string
    metadata: Record<string, any>
  }>({
    secret_type: '',
    name: '',
    value: '',
    expire_at: '',
    metadata: {}
  })

  const [errors, setErrors] = useState<Record<string, string>>({})
  const [showValue, setShowValue] = useState(false)

  // Filter available secret types based on uniqueness and existing secrets
  const availableSecretOptions = secretTypeOptions.filter((secretType) => {
    if (!secretType.unique) return true
    return !existingSecrets.some((existing) => existing.secret_type === secretType.value)
  })

  // Get selected secret type info
  const selectedSecretType = secretTypeOptions.find((opt) => opt.value === formData.secret_type)

  // Handle secret type change
  const handleSecretTypeChange = (value: string | string[]) => {
    const secretValue = Array.isArray(value) ? value[0] : value
    setFormData((prev) => ({
      ...prev,
      secret_type: secretValue,
      name: '',
      value: '',
      metadata: {}
    }))
    setErrors({})
  }

  // Validate form
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {}

    if (!formData.secret_type) {
      newErrors.secret_type = 'Secret type is required'
    }

    if (!formData.value.trim()) {
      newErrors.value = 'Secret value is required'
    }

    // Validate name for secret types that require it
    if (selectedSecretType?.showName && !formData.name.trim()) {
      newErrors.name = 'Name is required for this secret type'
    }

    // Validate expiry date if provided
    if (formData.expire_at) {
      const expiryDate = new Date(formData.expire_at)
      if (expiryDate <= new Date()) {
        newErrors.expire_at = 'Expiry date must be in the future'
      }
    }

    // Check for duplicate names (if name is provided)
    if (formData.name.trim()) {
      const isDuplicateName = existingSecrets.some(
        (secret) =>
          secret.name &&
          secret.name.toLowerCase() === formData.name.trim().toLowerCase() &&
          secret.secret_type === formData.secret_type
      )
      if (isDuplicateName) {
        newErrors.name = 'A secret with this name already exists for this type'
      }
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) return

    try {
      // Prepare value based on secret type
      let processedValue: string | string[]
      if (selectedSecretType?.inputType === 'textarea') {
        // For textarea inputs, keep as string but trim
        processedValue = formData.value.trim()
      } else {
        processedValue = formData.value.trim()
      }

      const secretData: Omit<ServiceAccountSecret, 'id' | 'service_account_id'> = {
        secret_type: formData.secret_type as any,
        name: formData.name.trim() || undefined,
        value: processedValue,
        last_update: new Date().toISOString(),
        expire_at: formData.expire_at || undefined,
        metadata: {
          created_by: 'user',
          service_name: serviceAccount.service_name,
          service_type: serviceAccount.service_type,
          service_url: serviceAccount.service_url,
          is_sensitive: selectedSecretType?.isSensitive || true,
          secret_category: selectedSecretType?.description || '',
          created_at: new Date().toISOString(),
          ...formData.metadata
        }
      }

      await onSubmit(secretData)
    } catch (error) {
      console.error('Error creating service account secret:', error)
    }
  }

  // Handle cancel
  const handleCancel = () => {
    setFormData({
      secret_type: '',
      name: '',
      value: '',
      expire_at: '',
      metadata: {}
    })
    setErrors({})
    onCancel()
  }

  // Get minimum date for expiry (today + 1 day)
  const getMinExpiryDate = () => {
    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)
    return tomorrow.toISOString().slice(0, 16)
  }

  // Get field label based on secret type
  const getValueLabel = () => {
    if (!selectedSecretType) return 'Secret Value'

    switch (formData.secret_type) {
      case 'api_key':
        return 'API Key'
      case 'cookie':
        return 'Cookie Value'
      case 'access_token':
        return 'Access Token'
      case 'refresh_token':
        return 'Refresh Token'
      case 'private_key':
        return 'Private Key'
      case 'client_secret':
        return 'Client Secret'
      case 'session_id':
        return 'Session ID'
      case 'csrf_token':
        return 'CSRF Token'
      case 'encryption_key':
        return 'Encryption Key'
      case 'other':
        return 'Secret Value'
      default:
        return 'Secret Value'
    }
  }

  // Render value input based on secret type
  const renderValueInput = () => {
    if (!selectedSecretType) return null

    const commonProps = {
      required: true,
      error: errors.value,
      disabled: loading,
      size: 'sm' as const,
      leftIcon: <selectedSecretType.icon className="h-4 w-4" />
    }

    if (selectedSecretType.inputType === 'textarea') {
      return (
        <CustomTextArea
          label={getValueLabel()}
          value={formData.value}
          onChange={(value) => setFormData((prev) => ({ ...prev, value }))}
          placeholder={selectedSecretType.placeholder}
          rows={6}
          maxLength={10000}
          showCharCount
          hint={
            selectedSecretType.isSensitive ? 'This sensitive data will be encrypted' : undefined
          }
          {...commonProps}
        />
      )
    }

    return (
      <CustomInput
        label={getValueLabel()}
        type={selectedSecretType.isSensitive && !showValue ? 'password' : 'text'}
        value={formData.value}
        onChange={(value) => setFormData((prev) => ({ ...prev, value }))}
        placeholder={selectedSecretType.placeholder}
        variant="filled"
        hint={selectedSecretType.isSensitive ? 'This sensitive data will be encrypted' : undefined}
        rightIcon={
          selectedSecretType.isSensitive ? (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setShowValue(!showValue)}
              className="p-1 h-6 w-6 hover:bg-gray-100 dark:hover:bg-gray-600"
            >
              {showValue ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
            </Button>
          ) : undefined
        }
        {...commonProps}
      />
    )
  }

  return (
    <div
      className={cn(
        'bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm p-4 mb-4',
        className
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 bg-purple-50 dark:bg-purple-900/20 rounded-lg flex items-center justify-center">
            <Plus className="h-3 w-3 text-purple-600 dark:text-purple-400" />
          </div>
          <div>
            <h4 className="text-base font-bold text-gray-900 dark:text-white">
              Add Secret for {serviceAccount.service_name}
            </h4>
            <p className="text-xs text-gray-600 dark:text-gray-400">
              Store API keys, tokens, and other sensitive data securely
            </p>
          </div>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleCancel}
          disabled={loading}
          className="p-1 h-6 w-6"
          type="button"
        >
          <X className="h-3 w-3" />
        </Button>
      </div>

      {/* Service Account Info */}
      <div className="bg-blue-50 dark:bg-blue-900/10 border border-blue-200 dark:border-blue-800 rounded-lg p-3 mb-4">
        <div className="flex items-center gap-2">
          <Globe className="h-4 w-4 text-blue-600 dark:text-blue-400" />
          <div>
            <div className="text-sm font-medium text-blue-800 dark:text-blue-300">
              {serviceAccount.service_name}
            </div>
            <div className="text-xs text-blue-700 dark:text-blue-200">
              {serviceAccount.service_type} • {serviceAccount.service_url || 'No URL provided'}
            </div>
          </div>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Secret Type Selection */}
        <div className="space-y-1">
          <CustomCombobox
            label="Secret Type"
            value={formData.secret_type}
            options={availableSecretOptions.map((option) => ({
              value: option.value,
              label: option.label
            }))}
            onChange={handleSecretTypeChange}
            placeholder="Select secret type..."
            searchable={true}
            size="sm"
          />
          {errors.secret_type && (
            <p className="text-xs text-red-600 dark:text-red-400 flex items-center gap-1">
              <AlertCircle className="h-3 w-3" />
              {errors.secret_type}
            </p>
          )}

          {/* Secret Type Description */}
          {selectedSecretType && (
            <div className="bg-purple-50 dark:bg-purple-900/10 border border-purple-200 dark:border-purple-800 rounded-lg p-3">
              <div className="flex items-center gap-2 mb-1">
                <selectedSecretType.icon className="h-3 w-3 text-purple-600 dark:text-purple-400" />
                <span className="text-xs font-medium text-purple-800 dark:text-purple-300">
                  {selectedSecretType.label}
                </span>
                {selectedSecretType.isSensitive && (
                  <span className="text-xs text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 px-1.5 py-0.5 rounded">
                    Sensitive
                  </span>
                )}
              </div>
              <p className="text-xs text-purple-700 dark:text-purple-200">
                {selectedSecretType.description}
                {selectedSecretType.unique && (
                  <span className="block mt-1 text-purple-600 dark:text-purple-400">
                    • Only one {selectedSecretType.label.toLowerCase()} can be stored per service
                  </span>
                )}
                {selectedSecretType.isSensitive && (
                  <span className="block mt-1 text-red-600 dark:text-red-400">
                    • This data will be encrypted and stored securely
                  </span>
                )}
              </p>
            </div>
          )}
        </div>

        {/* Secret Name (Optional for some types) */}
        {selectedSecretType?.showName && (
          <CustomInput
            label={`${selectedSecretType.label} Name`}
            value={formData.name}
            onChange={(value) => setFormData((prev) => ({ ...prev, name: value }))}
            placeholder={`e.g., Production ${selectedSecretType.label}, Dev API Key, etc.`}
            variant="filled"
            leftIcon={<selectedSecretType.icon className="h-4 w-4" />}
            hint="Give this secret a descriptive name to identify its purpose"
            error={errors.name}
            required={selectedSecretType.showName}
            disabled={loading}
            size="sm"
          />
        )}

        {/* Secret Value Input */}
        {formData.secret_type && renderValueInput()}

        {/* Expiry Date (Optional) */}
        {formData.secret_type && (
          <CustomInput
            label="Expiry Date (Optional)"
            type="datetime-local"
            value={formData.expire_at}
            onChange={(value) => setFormData((prev) => ({ ...prev, expire_at: value }))}
            variant="filled"
            leftIcon={<Calendar className="h-4 w-4" />}
            hint="Set when this secret expires (if applicable)"
            error={errors.expire_at}
            disabled={loading}
            size="sm"
            minDate={getMinExpiryDate()}
          />
        )}

        {/* Metadata Form */}
        {formData.secret_type && (
          <div onClick={(e) => e.preventDefault()}>
            <Metadata
              metadata={formData.metadata}
              onMetadataChange={(newMetadata) =>
                setFormData((prev) => ({ ...prev, metadata: newMetadata }))
              }
              title="Additional Metadata"
              compact={true}
              size="sm"
              allowCreate={true}
              allowEdit={true}
              allowDelete={true}
              collapsible={true}
              defaultExpanded={false}
              className="border border-gray-200 dark:border-gray-700 rounded-lg p-3 bg-gray-50 dark:bg-gray-700/50"
            />
          </div>
        )}

        {/* Security Warning */}
        {selectedSecretType?.isSensitive && (
          <div className="bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800 rounded-lg p-3">
            <div className="flex items-start gap-2">
              <AlertCircle className="h-4 w-4 text-amber-600 dark:text-amber-400 mt-0.5" />
              <div>
                <h5 className="text-xs font-medium text-amber-800 dark:text-amber-300 mb-1">
                  Security Notice
                </h5>
                <p className="text-xs text-amber-700 dark:text-amber-400">
                  This sensitive data will be encrypted before storage. Ensure you're entering the
                  correct value as it cannot be recovered if lost. Never share this information
                  outside of authorized systems.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Form Actions */}
        <div className="flex items-center justify-end gap-2 pt-3 border-t border-gray-200 dark:border-gray-700">
          <CustomButton
            variant="secondary"
            size="sm"
            onClick={handleCancel}
            disabled={loading}
            className="min-w-[80px]"
            type="button"
          >
            Cancel
          </CustomButton>
          <CustomButton
            variant="primary"
            size="sm"
            type="submit"
            disabled={loading || !formData.secret_type || !formData.value.trim()}
            loading={loading}
            className="min-w-[120px] bg-purple-600 hover:bg-purple-700 text-white"
          >
            Add Secret
          </CustomButton>
        </div>
      </form>
    </div>
  )
}

export default CreateServiceAccountSecretForm
