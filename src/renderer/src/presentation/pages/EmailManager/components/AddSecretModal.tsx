// src/renderer/src/presentation/pages/EmailManager/components/AddSecretModal.tsx
import React, { useState } from 'react'
import { Button } from '../../../../components/ui/button'
import { Input } from '../../../../components/ui/input'
import { Label } from '../../../../components/ui/label'
import { Badge } from '../../../../components/ui/badge'
import CustomInput from '../../../../components/common/CustomInput'
import CustomCombobox from '../../../../components/common/CustomCombobox'
import {
  X,
  Key,
  Lock,
  Shield,
  Globe,
  Database,
  Cookie,
  Eye,
  EyeOff,
  Save,
  Plus
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
  secret_name?: string
  creation_date: string
  last_updated: string
  expiry_date?: string
  is_expired?: boolean
  strength?: 'weak' | 'medium' | 'strong'
  metadata?: Record<string, any>
}

interface AddSecretModalProps {
  isOpen: boolean
  onClose: () => void
  onAdd: (secret: Omit<Secret, 'id' | 'creation_date' | 'last_updated'>) => void
  serviceId: string
  serviceName?: string
  className?: string
}

const SECRET_TYPE_OPTIONS = [
  { value: 'password', label: 'Password' },
  { value: 'api_key', label: 'API Key' },
  { value: 'token', label: 'Token' },
  { value: 'certificate', label: 'Certificate' },
  { value: 'private_key', label: 'Private Key' },
  { value: 'session', label: 'Session' },
  { value: 'cookie', label: 'Cookie' },
  { value: '2fa_key', label: '2FA Key' },
  { value: 'other', label: 'Other' }
]

const STRENGTH_OPTIONS = [
  { value: 'weak', label: 'Weak' },
  { value: 'medium', label: 'Medium' },
  { value: 'strong', label: 'Strong' }
]

const AddSecretModal: React.FC<AddSecretModalProps> = ({
  isOpen,
  onClose,
  onAdd,
  serviceId,
  serviceName,
  className
}) => {
  const [formData, setFormData] = useState({
    secret_type: 'password' as Secret['secret_type'],
    secret_value: '',
    secret_name: '',
    expiry_date: '',
    strength: 'medium' as Secret['strength'],
    metadata: {} as Record<string, any>
  })

  const [showPassword, setShowPassword] = useState(false)
  const [metadataFields, setMetadataFields] = useState<Array<{ key: string; value: string }>>([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  const getSecretTypeInfo = (type: string) => {
    const typeInfo: Record<
      string,
      {
        icon: React.ElementType
        color: string
        placeholder: string
        description: string
        examples: string[]
      }
    > = {
      password: {
        icon: Lock,
        color: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
        placeholder: 'Enter password...',
        description: 'Account login password',
        examples: ['MySecurePassword123!', 'P@ssw0rd2024']
      },
      api_key: {
        icon: Key,
        color: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
        placeholder: 'Enter API key...',
        description: 'API access key or token',
        examples: ['sk_live_123abc...', 'AIzaSyD...', 'ghp_1234...']
      },
      token: {
        icon: Shield,
        color: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300',
        placeholder: 'Enter token...',
        description: 'Authentication or access token',
        examples: ['Bearer eyJhbGciOi...', 'jwt_token_here', 'oauth_token']
      },
      certificate: {
        icon: Shield,
        color: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300',
        placeholder: 'Enter certificate content...',
        description: 'Digital certificate or SSL cert',
        examples: ['-----BEGIN CERTIFICATE-----', 'cert.pem content']
      },
      private_key: {
        icon: Key,
        color: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
        placeholder: 'Enter private key...',
        description: 'Cryptographic private key',
        examples: ['-----BEGIN PRIVATE KEY-----', 'RSA private key']
      },
      session: {
        icon: Globe,
        color: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-300',
        placeholder: 'Enter session ID...',
        description: 'Session identifier or token',
        examples: ['sess_1234567890abcdef', 'PHPSESSID=abc123']
      },
      cookie: {
        icon: Cookie,
        color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300',
        placeholder: 'Enter cookie value...',
        description: 'Browser cookie value',
        examples: ['auth_token=xyz123; Path=/', '_session_id=abc']
      },
      '2fa_key': {
        icon: Shield,
        color: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300',
        placeholder: 'Enter 2FA secret...',
        description: 'Two-factor authentication secret',
        examples: ['JBSWY3DPEHPK3PXP', 'MFRGG43UEBQW433O']
      },
      other: {
        icon: Database,
        color: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300',
        placeholder: 'Enter secret value...',
        description: 'Custom secret type',
        examples: ['Any secure value', 'Custom data']
      }
    }
    return typeInfo[type] || typeInfo['other']
  }

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.secret_value.trim()) {
      newErrors.secret_value = 'Secret value is required'
    }

    if (formData.secret_type === 'password' && formData.secret_value.length < 8) {
      newErrors.secret_value = 'Password should be at least 8 characters'
    }

    if (formData.expiry_date) {
      const expiryDate = new Date(formData.expiry_date)
      if (expiryDate <= new Date()) {
        newErrors.expiry_date = 'Expiry date must be in the future'
      }
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) return

    setIsSubmitting(true)

    try {
      // Prepare metadata
      const metadata: Record<string, any> = { ...formData.metadata }
      metadataFields.forEach((field) => {
        if (field.key.trim() && field.value.trim()) {
          metadata[field.key.trim()] = field.value.trim()
        }
      })

      const secretData: Omit<Secret, 'id' | 'creation_date' | 'last_updated'> = {
        service_id: serviceId,
        secret_type: formData.secret_type,
        secret_value: formData.secret_value,
        secret_name: formData.secret_name || undefined,
        expiry_date: formData.expiry_date || undefined,
        strength: formData.strength,
        metadata: Object.keys(metadata).length > 0 ? metadata : undefined
      }

      await onAdd(secretData)
      handleReset()
      onClose()
    } catch (error) {
      console.error('Error adding secret:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleReset = () => {
    setFormData({
      secret_type: 'password',
      secret_value: '',
      secret_name: '',
      expiry_date: '',
      strength: 'medium',
      metadata: {}
    })
    setMetadataFields([])
    setErrors({})
    setShowPassword(false)
  }

  const addMetadataField = () => {
    setMetadataFields([...metadataFields, { key: '', value: '' }])
  }

  const updateMetadataField = (index: number, field: 'key' | 'value', value: string) => {
    const updated = [...metadataFields]
    updated[index][field] = value
    setMetadataFields(updated)
  }

  const removeMetadataField = (index: number) => {
    setMetadataFields(metadataFields.filter((_, i) => i !== index))
  }

  const typeInfo = getSecretTypeInfo(formData.secret_type)
  const TypeIcon = typeInfo.icon

  if (!isOpen) return null

  return (
    <div
      className={cn(
        'fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4',
        className
      )}
    >
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center">
              <Key className="h-5 w-5 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">Add New Secret</h2>
              {serviceName && (
                <p className="text-sm text-gray-600 dark:text-gray-400">for {serviceName}</p>
              )}
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="overflow-y-auto max-h-[calc(90vh-140px)]">
          <div className="p-6 space-y-6">
            {/* Secret Type */}
            <div>
              <CustomCombobox
                label="Secret Type *"
                value={formData.secret_type}
                options={SECRET_TYPE_OPTIONS}
                onChange={(value) =>
                  setFormData({ ...formData, secret_type: value as Secret['secret_type'] })
                }
                placeholder="Choose secret type..."
              />

              {/* Type Info */}
              <div className="mt-3 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl border border-gray-200 dark:border-gray-600">
                <div className="flex items-center gap-3 mb-2">
                  <TypeIcon className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                  <Badge variant="secondary" className={cn('border', typeInfo.color)}>
                    {SECRET_TYPE_OPTIONS.find((opt) => opt.value === formData.secret_type)?.label}
                  </Badge>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                  {typeInfo.description}
                </p>
                <div className="text-xs text-gray-500 dark:text-gray-500">
                  <strong>Examples:</strong> {typeInfo.examples.join(', ')}
                </div>
              </div>
            </div>

            {/* Secret Name */}
            <CustomInput
              label="Secret Name (Optional)"
              value={formData.secret_name}
              onChange={(value) => setFormData({ ...formData, secret_name: value })}
              placeholder="Give this secret a descriptive name..."
              hint="e.g., 'Main API Key', 'Production DB Password', 'Auth Token'"
            />

            {/* Secret Value */}
            <CustomInput
              label="Secret Value *"
              type={showPassword ? 'text' : 'password'}
              value={formData.secret_value}
              onChange={(value) => setFormData({ ...formData, secret_value: value })}
              placeholder={typeInfo.placeholder}
              error={errors.secret_value}
              rightIcon={
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowPassword(!showPassword)}
                  className="p-1 h-6 w-6"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              }
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Strength */}
              <CustomCombobox
                label="Strength Assessment"
                value={formData.strength || 'medium'}
                options={STRENGTH_OPTIONS}
                onChange={(value) =>
                  setFormData({ ...formData, strength: value as Secret['strength'] })
                }
                placeholder="Select strength..."
              />

              {/* Expiry Date */}
              <CustomInput
                label="Expiry Date (Optional)"
                type="date"
                value={formData.expiry_date}
                onChange={(value) => setFormData({ ...formData, expiry_date: value })}
                error={errors.expiry_date}
                hint="Leave empty if this secret doesn't expire"
              />
            </div>

            {/* Metadata Fields */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Additional Metadata (Optional)
                </Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addMetadataField}
                  className="text-indigo-600 border-indigo-200 hover:bg-indigo-50 dark:text-indigo-400"
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Add Field
                </Button>
              </div>

              {metadataFields.length > 0 && (
                <div className="space-y-3">
                  {metadataFields.map((field, index) => (
                    <div
                      key={index}
                      className="flex items-center gap-2 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg border border-gray-200 dark:border-gray-600"
                    >
                      <Input
                        placeholder="Key (e.g., 'environment')"
                        value={field.key}
                        onChange={(e) => updateMetadataField(index, 'key', e.target.value)}
                        className="flex-1"
                      />
                      <Input
                        placeholder="Value (e.g., 'production')"
                        value={field.value}
                        onChange={(e) => updateMetadataField(index, 'value', e.target.value)}
                        className="flex-1"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeMetadataField(index)}
                        className="p-1 h-8 w-8 text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}

              <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                Add custom key-value pairs for additional context (e.g., environment: production,
                purpose: authentication)
              </p>
            </div>

            {/* Security Notice */}
            <div className="p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl">
              <div className="flex items-start gap-3">
                <Shield className="h-5 w-5 text-amber-600 dark:text-amber-400 mt-0.5" />
                <div>
                  <h4 className="text-sm font-medium text-amber-800 dark:text-amber-200 mb-1">
                    Security Notice
                  </h4>
                  <p className="text-xs text-amber-700 dark:text-amber-300">
                    All secrets are encrypted and stored securely. Make sure to use strong, unique
                    values and regularly rotate your secrets for optimal security.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50">
            <Button type="button" variant="ghost" onClick={onClose} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button type="button" variant="secondary" onClick={handleReset} disabled={isSubmitting}>
              Reset
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting || !formData.secret_value.trim()}
              className="bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700"
            >
              {isSubmitting ? (
                <>
                  <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full mr-2" />
                  Adding...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Add Secret
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default AddSecretModal
