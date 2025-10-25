// src/renderer/src/presentation/pages/EmailManager/components/EmailDrawer/Email/CreateEmail2FADrawer.tsx
import React, { useState, useEffect } from 'react'
import CustomButton from '../../../../../../../components/common/CustomButton'
import CustomInput from '../../../../../../../components/common/CustomInput'
import CustomTextArea from '../../../../../../../components/common/CustomTextArea'
import CustomCombobox from '../../../../../../../components/common/CustomCombobox'
import CustomDrawer from '../../../../../../../components/common/CustomDrawer'
import CustomTag from '../../../../../../../components/common/CustomTag'
import {
  Shield,
  QrCode,
  FileText,
  Key,
  Mail,
  Smartphone,
  AlertCircle,
  Calendar
} from 'lucide-react'
import { Email2FA, Email } from '../../../../types'
import Metadata from '../../../../../../../components/common/Metadata'
import { Label } from '@radix-ui/react-label'

interface CreateEmail2FADrawerProps {
  isOpen: boolean
  email: Email
  existingMethods: Email2FA[]
  onSubmit: (data: Omit<Email2FA, 'id'>) => Promise<void>
  onClose: () => void
  loading?: boolean
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
    autoFillFromEmail: false,
    unique: true
  },
  {
    value: 'backup_codes',
    label: 'Backup Codes',
    icon: FileText,
    description: 'Recovery codes for account access',
    placeholder: 'Enter backup codes (one per line)...',
    inputType: 'textarea',
    showAppName: false,
    autoFillFromEmail: false,
    unique: true
  },
  {
    value: 'app_password',
    label: 'App Password',
    icon: Key,
    description: 'Application-specific password',
    placeholder: 'Enter app password...',
    inputType: 'password',
    showAppName: true,
    autoFillFromEmail: false,
    unique: false
  },
  {
    value: 'security_key',
    label: 'Security Key',
    icon: Shield,
    description: 'Hardware security key identifier',
    placeholder: 'Enter security key ID...',
    inputType: 'text',
    showAppName: false,
    autoFillFromEmail: false,
    unique: false
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
    autoFillField: 'recovery_email',
    unique: true
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
    autoFillField: 'phone_numbers',
    unique: true
  }
]

const CreateEmail2FADrawer: React.FC<CreateEmail2FADrawerProps> = ({
  isOpen,
  email,
  existingMethods = [],
  onSubmit,
  onClose,
  loading = false
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

  // Reset form when drawer opens
  useEffect(() => {
    if (isOpen) {
      setFormData({
        method_type: '',
        app: '',
        value: '',
        expire_at: '',
        metadata: {}
      })
      setErrors({})
    }
  }, [isOpen])

  // Lọc các method options để loại bỏ các method unique đã tồn tại
  const availableMethodOptions = twoFAMethodOptions.filter((method) => {
    if (!method.unique) return true

    return !existingMethods.some((existing) => existing.method_type === method.value)
  })

  // Get selected method info
  const selectedMethod = twoFAMethodOptions.find((opt) => opt.value === formData.method_type)

  // Auto-fill value from email data when method type changes
  useEffect(() => {
    if (selectedMethod?.autoFillFromEmail && selectedMethod.autoFillField) {
      const emailValue = email[selectedMethod.autoFillField as keyof Email]
      if (emailValue) {
        let valueToFill = ''

        if (selectedMethod.autoFillField === 'phone_numbers' && Array.isArray(emailValue)) {
          valueToFill = emailValue.length > 0 ? emailValue[0] : ''
        } else {
          valueToFill = String(emailValue)
        }

        setFormData((prev) => ({
          ...prev,
          value: valueToFill
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
      // Only validate non-backup_codes methods at form level
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
      }
    }

    if (formData.method_type === 'app_password' && !formData.app.trim()) {
      newErrors.app = 'App name is required for app passwords'
    }

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
  const handleSubmit = async () => {
    if (!validateForm()) {
      return
    }

    try {
      let processedValue: string | string[]
      if (formData.method_type === 'backup_codes') {
        const rawCodes = formData.value.trim().split('\n')
        processedValue = rawCodes.map((code) => code.trim()).filter((code) => code)
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
          ...(formData.method_type === 'backup_codes' && {
            total_codes: Array.isArray(processedValue) ? processedValue.length : 0,
            codes_used: 0
          }),
          ...formData.metadata
        }
      }

      await onSubmit(email2FAData)
      onClose()
    } catch (error) {
      console.error('[DEBUG] Error in handleSubmit:', error)
      console.error('Error creating 2FA method:', error)
    }
  }

  // Get minimum date for expiry (today + 1 day)
  const getMinExpiryDate = () => {
    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)
    return tomorrow.toISOString().slice(0, 16)
  }

  // Get field label based on method type
  const getValueLabel = () => {
    if (!selectedMethod) return 'Value'

    switch (formData.method_type) {
      case 'recovery_email':
        return 'Recovery Email Address'
      case 'sms':
        return 'Phone Number'
      case 'totp_key':
        return 'TOTP Secret Key'
      case 'backup_codes':
        return 'Backup Codes'
      case 'app_password':
        return 'App Password'
      case 'security_key':
        return 'Security Key ID'
      default:
        return 'Value'
    }
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

    const isAutoFilled =
      selectedMethod.autoFillFromEmail &&
      email[selectedMethod.autoFillField as keyof Email] !== undefined

    if (selectedMethod.inputType === 'textarea' && formData.method_type === 'backup_codes') {
      const currentCodes = formData.value
        .split('\n')
        .map((code) => code.trim())
        .filter((code) => code.length > 0)

      return (
        <div className="space-y-2">
          {isAutoFilled && (
            <div className="bg-blue-50 dark:bg-blue-900/10 border border-blue-200 dark:border-blue-700 rounded-lg p-2">
              <p className="text-xs text-blue-700 dark:text-blue-300">
                💡 Value auto-filled from email {selectedMethod.autoFillField}
              </p>
            </div>
          )}

          <div className="space-y-1">
            <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">
              {getValueLabel()}
            </Label>
            <CustomTag
              tags={currentCodes}
              onTagsChange={(newCodes) => {
                const joinedValue = newCodes.join('\n')
                setFormData((prev) => ({ ...prev, value: joinedValue }))

                // Clear any form-level errors since CustomTag handles its own validation
                setErrors((prev) => {
                  const newErrors = { ...prev }
                  delete newErrors.value
                  return newErrors
                })
              }}
              placeholder="Enter backup code..."
              allowDuplicates={false}
              maxTags={20}
              disabled={loading}
              size="sm"
            />
          </div>
        </div>
      )
    }

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
            label={getValueLabel()}
            value={formData.value}
            onChange={(value) => setFormData((prev) => ({ ...prev, value }))}
            placeholder={selectedMethod.placeholder}
            hint="Enter one item per line"
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
          label={getValueLabel()}
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
    <CustomDrawer
      isOpen={isOpen}
      onClose={onClose}
      title="Add 2FA Method"
      subtitle={`Configure a new two-factor authentication method for ${email.email_address}`}
      size="md"
      footerActions={
        <div className="flex items-center justify-end gap-2">
          <CustomButton
            variant="secondary"
            size="sm"
            onClick={onClose}
            disabled={loading}
            className="min-w-[80px]"
          >
            Cancel
          </CustomButton>
          <CustomButton
            variant="success"
            size="sm"
            onClick={handleSubmit}
            disabled={loading || !formData.method_type || !formData.value}
            loading={loading}
            className="min-w-[140px] bg-green-600 hover:bg-green-700 text-white"
          >
            Add 2FA Method
          </CustomButton>
        </div>
      }
    >
      <div className="space-y-4 p-4">
        {/* 2FA Method Selection */}
        <div className="space-y-1">
          <CustomCombobox
            label="2FA Method Type"
            value={formData.method_type}
            options={availableMethodOptions.map((option) => ({
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
            minDate={getMinExpiryDate()}
          />
        )}

        {/* Metadata Form */}
        {formData.method_type && (
          <div>
            <Metadata
              metadata={formData.metadata}
              onMetadataChange={(newMetadata) =>
                setFormData((prev) => ({ ...prev, metadata: newMetadata }))
              }
              title="Metadata"
              compact={true}
              size="sm"
              allowCreate={true}
              allowEdit={true}
              allowDelete={true}
              collapsible={true}
              defaultExpanded={false}
            />
          </div>
        )}
      </div>
    </CustomDrawer>
  )
}

export default CreateEmail2FADrawer
