// src/renderer/src/presentation/pages/EmailManager/components/EmailDrawer/Email/CreateEmail2FAForm.tsx
import React, { useState, useEffect } from 'react'
import { Button } from '../../../../../../components/ui/button'
import CustomInput from '../../../../../../components/common/CustomInput'
import CustomTextArea from '../../../../../../components/common/CustomTextArea'
import CustomCombobox from '../../../../../../components/common/CustomCombobox'
import {
  Shield,
  QrCode,
  FileText,
  Key,
  Mail,
  Smartphone,
  Plus,
  X,
  AlertCircle,
  Calendar
} from 'lucide-react'
import { cn } from '../../../../../../shared/lib/utils'
import { Email2FA, Email } from '../../../types'
import Metadata from '../../../../../../components/common/Metadata'

interface CreateEmail2FAFormProps {
  email: Email
  onSubmit: (data: Omit<Email2FA, 'id'>) => Promise<void>
  onCancel: () => void
  loading?: boolean
  className?: string
}

// 2FA Method options
const twoFAMethodOptions = [
  {
    value: 'totp_key',
    label: 'TOTP Key',
    icon: QrCode,
    description: 'Time-based One-Time Password secret key',
    placeholder: 'Enter TOTP secret key...',
    inputType: 'text',
    showAppName: false,
    autoFillFromEmail: false
  },
  {
    value: 'backup_codes',
    label: 'Backup Codes',
    icon: FileText,
    description: 'Recovery codes for account access',
    placeholder: 'Enter backup codes (one per line)...',
    inputType: 'textarea',
    showAppName: false,
    autoFillFromEmail: false
  },
  {
    value: 'app_password',
    label: 'App Password',
    icon: Key,
    description: 'Application-specific password',
    placeholder: 'Enter app password...',
    inputType: 'password',
    showAppName: true,
    autoFillFromEmail: false
  },
  {
    value: 'security_key',
    label: 'Security Key',
    icon: Shield,
    description: 'Hardware security key identifier',
    placeholder: 'Enter security key ID...',
    inputType: 'text',
    showAppName: false,
    autoFillFromEmail: false
  },
  {
    value: 'recovery_email',
    label: 'Recovery Email',
    icon: Mail,
    description: 'Alternative email for recovery',
    placeholder: 'Enter recovery email address...',
    inputType: 'email',
    showAppName: false,
    autoFillFromEmail: true,
    autoFillField: 'recovery_email'
  },
  {
    value: 'sms',
    label: 'SMS Verification',
    icon: Smartphone,
    description: 'SMS-based verification phone number',
    placeholder: 'Enter phone number (+84 xxx xxx xxx)...',
    inputType: 'tel',
    showAppName: false,
    autoFillFromEmail: true,
    autoFillField: 'phone_numbers'
  }
]

const CreateEmail2FAForm: React.FC<CreateEmail2FAFormProps> = ({
  email,
  onSubmit,
  onCancel,
  loading = false,
  className
}) => {
  const [formData, setFormData] = useState<{
    method_type: string
    app: string
    value: string
    expire_at: string
    metadata: Record<string, any>
  }>({
    method_type: '',
    app: '',
    value: '',
    expire_at: '',
    metadata: {}
  })

  const [errors, setErrors] = useState<Record<string, string>>({})

  // Get selected method info
  const selectedMethod = twoFAMethodOptions.find((opt) => opt.value === formData.method_type)

  // Auto-fill value from email data when method type changes
  useEffect(() => {
    if (selectedMethod?.autoFillFromEmail && selectedMethod.autoFillField) {
      const emailValue = email[selectedMethod.autoFillField as keyof Email]
      if (emailValue) {
        setFormData((prev) => ({
          ...prev,
          value: String(emailValue)
        }))
      }
    } else {
      setFormData((prev) => ({
        ...prev,
        value: ''
      }))
    }
  }, [formData.method_type, email, selectedMethod])

  // Handle method type change
  const handleMethodTypeChange = (value: string | string[]) => {
    const methodValue = Array.isArray(value) ? value[0] : value
    setFormData((prev) => ({
      ...prev,
      method_type: methodValue,
      app: '',
      metadata: {}
    }))
    setErrors({})
  }

  // Validate form
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {}

    if (!formData.method_type) {
      newErrors.method_type = '2FA method is required'
    }

    if (!formData.value.trim()) {
      newErrors.value = 'Value is required'
    } else {
      // Validate based on method type
      if (formData.method_type === 'recovery_email') {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
        if (!emailRegex.test(formData.value.trim())) {
          newErrors.value = 'Please enter a valid email address'
        }
      } else if (formData.method_type === 'sms') {
        const phoneRegex = /^\+?[\d\s-()]+$/
        if (!phoneRegex.test(formData.value.trim())) {
          newErrors.value = 'Please enter a valid phone number'
        }
      } else if (formData.method_type === 'backup_codes') {
        const codes = formData.value
          .trim()
          .split('\n')
          .filter((code) => code.trim())
        if (codes.length === 0) {
          newErrors.value = 'Please enter at least one backup code'
        }
      }
    }

    // Validate app name for app_password method
    if (formData.method_type === 'app_password' && !formData.app.trim()) {
      newErrors.app = 'App name is required for app passwords'
    }

    // Validate expiry date if provided
    if (formData.expire_at) {
      const expiryDate = new Date(formData.expire_at)
      if (expiryDate <= new Date()) {
        newErrors.expire_at = 'Expiry date must be in the future'
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
      // Prepare value based on method type
      let processedValue: string | string[]
      if (formData.method_type === 'backup_codes') {
        processedValue = formData.value
          .trim()
          .split('\n')
          .map((code) => code.trim())
          .filter((code) => code)
      } else {
        processedValue = formData.value.trim()
      }

      const email2FAData: Omit<Email2FA, 'id'> = {
        email_id: email.id!,
        method_type: formData.method_type as any,
        app: formData.app.trim() || undefined,
        value: processedValue,
        last_update: new Date().toISOString(),
        expire_at: formData.expire_at || undefined,
        metadata: {
          created_by: 'user',
          email_provider: email.email_provider,
          ...(formData.method_type === 'backup_codes' && {
            total_codes: Array.isArray(processedValue) ? processedValue.length : 0,
            codes_used: 0
          }),
          ...(selectedMethod?.autoFillFromEmail && {
            auto_filled_from_email: true,
            auto_fill_field: selectedMethod.autoFillField
          }),
          ...formData.metadata
        }
      }

      await onSubmit(email2FAData)
    } catch (error) {
      console.error('Error creating 2FA method:', error)
    }
  }

  // Handle cancel
  const handleCancel = () => {
    setFormData({
      method_type: '',
      app: '',
      value: '',
      expire_at: '',
      metadata: {}
    })
    setErrors({})
    onCancel()
  }

  // Render value input based on method type
  const renderValueInput = () => {
    if (!selectedMethod) return null

    const commonProps = {
      required: true,
      error: errors.value,
      disabled: loading,
      size: 'sm' as const
    }

    // Check if value is auto-filled from email
    const isAutoFilled =
      selectedMethod.autoFillFromEmail &&
      email[selectedMethod.autoFillField as keyof Email] !== undefined

    if (selectedMethod.inputType === 'textarea') {
      return (
        <div className="space-y-2">
          {isAutoFilled && (
            <div className="bg-blue-50 dark:bg-blue-900/10 border border-blue-200 dark:border-blue-700 rounded-lg p-2">
              <p className="text-xs text-blue-700 dark:text-blue-300">
                💡 Value auto-filled from email {selectedMethod.autoFillField}
              </p>
            </div>
          )}
          <CustomTextArea
            label="Backup Codes"
            value={formData.value}
            onChange={(value) => setFormData((prev) => ({ ...prev, value }))}
            placeholder={selectedMethod.placeholder}
            hint="Enter one backup code per line"
            rows={5}
            maxLength={2000}
            showCharCount
            {...commonProps}
          />
        </div>
      )
    }

    return (
      <div className="space-y-2">
        {isAutoFilled && (
          <div className="bg-blue-50 dark:bg-blue-900/10 border border-blue-200 dark:border-blue-700 rounded-lg p-2">
            <p className="text-xs text-blue-700 dark:text-blue-300">
              💡 Value auto-filled from email {selectedMethod.autoFillField}
            </p>
          </div>
        )}
        <CustomInput
          label="Value"
          type={selectedMethod.inputType}
          value={formData.value}
          onChange={(value) => setFormData((prev) => ({ ...prev, value }))}
          placeholder={selectedMethod.placeholder}
          variant="filled"
          leftIcon={<selectedMethod.icon className="h-4 w-4" />}
          {...commonProps}
        />
      </div>
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
          <div className="w-6 h-6 bg-green-50 dark:bg-green-900/20 rounded-lg flex items-center justify-center">
            <Plus className="h-3 w-3 text-green-600 dark:text-green-400" />
          </div>
          <div>
            <h4 className="text-base font-bold text-gray-900 dark:text-white">Add 2FA Method</h4>
            <p className="text-xs text-gray-600 dark:text-gray-400">
              Configure a new two-factor authentication method for {email.email_address}
            </p>
          </div>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleCancel}
          disabled={loading}
          className="p-1 h-6 w-6"
        >
          <X className="h-3 w-3" />
        </Button>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* 2FA Method Selection */}
        <div className="space-y-1">
          <CustomCombobox
            label="2FA Method Type"
            value={formData.method_type}
            options={twoFAMethodOptions.map((option) => ({
              value: option.value,
              label: option.label
            }))}
            onChange={handleMethodTypeChange}
            placeholder="Select 2FA method type..."
            searchable={true}
            size="sm"
          />
          {errors.method_type && (
            <p className="text-xs text-red-600 dark:text-red-400 flex items-center gap-1">
              <AlertCircle className="h-3 w-3" />
              {errors.method_type}
            </p>
          )}

          {/* Method Description */}
          {selectedMethod && (
            <div className="bg-blue-50 dark:bg-blue-900/10 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
              <div className="flex items-center gap-2 mb-1">
                <selectedMethod.icon className="h-3 w-3 text-blue-600 dark:text-blue-400" />
                <span className="text-xs font-medium text-blue-800 dark:text-blue-300">
                  {selectedMethod.label}
                </span>
              </div>
              <p className="text-xs text-blue-700 dark:text-blue-200">
                {selectedMethod.description}
                {selectedMethod.autoFillFromEmail && (
                  <span className="block mt-1 text-blue-600 dark:text-blue-400">
                    • Will auto-fill from email {selectedMethod.autoFillField} if available
                  </span>
                )}
              </p>
            </div>
          )}
        </div>

        {/* App Name (Optional) */}
        {selectedMethod?.showAppName && (
          <CustomInput
            label="App Name"
            value={formData.app}
            onChange={(value) => setFormData((prev) => ({ ...prev, app: value }))}
            placeholder="e.g., Google Authenticator, Authy, etc."
            variant="filled"
            leftIcon={<Shield className="h-4 w-4" />}
            hint="Specify which app or service this 2FA method is for"
            error={errors.app}
            required={formData.method_type === 'app_password'}
            disabled={loading}
            size="sm"
          />
        )}

        {/* Value Input */}
        {formData.method_type && renderValueInput()}

        {/* Expiry Date (Optional) */}
        {formData.method_type && (
          <CustomInput
            label="Expiry Date (Optional)"
            type="datetime-local"
            value={formData.expire_at}
            onChange={(value) => setFormData((prev) => ({ ...prev, expire_at: value }))}
            variant="filled"
            leftIcon={<Calendar className="h-4 w-4" />}
            hint="Set when this 2FA method expires (if applicable)"
            error={errors.expire_at}
            disabled={loading}
            size="sm"
          />
        )}

        {/* Metadata Form */}
        {formData.method_type && (
          <Metadata
            metadata={formData.metadata}
            onMetadataChange={(newMetadata) =>
              setFormData((prev) => ({ ...prev, metadata: newMetadata }))
            }
            title="Additional 2FA Metadata"
            maxFields={8}
            keyPlaceholder="Enter metadata field (e.g., backup_location, notes)"
            compact={true}
            size="sm"
            allowedTypes={['text', 'textarea', 'date', 'boolean']}
          />
        )}

        {/* Form Actions */}
        <div className="flex items-center justify-end gap-2 pt-3 border-t border-gray-200 dark:border-gray-700">
          <Button
            type="button"
            variant="outline"
            onClick={handleCancel}
            disabled={loading}
            size="sm"
            className="min-w-[80px]"
          >
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={loading || !formData.method_type || !formData.value.trim()}
            loading={loading}
            size="sm"
            className="min-w-[100px] bg-green-600 hover:bg-green-700 text-white"
          >
            Add 2FA Method
          </Button>
        </div>
      </form>
    </div>
  )
}

export default CreateEmail2FAForm
