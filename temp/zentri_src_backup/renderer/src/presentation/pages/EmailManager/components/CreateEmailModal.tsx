// src/renderer/src/presentation/pages/EmailManager/components/CreateEmailModal.tsx
import React, { useState, useEffect } from 'react'
import CustomModal from '../../../../components/common/CustomModal'
import CustomInput from '../../../../components/common/CustomInput'
import CustomCombobox from '../../../../components/common/CustomCombobox'
import { Mail, Key, User, MapPin, Phone, AlertCircle, Calendar } from 'lucide-react'
import { Email } from '../types'
import { EMAIL_PROVIDERS } from '../constants'

interface CreateEmailModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (emailData: Omit<Email, 'id'>) => void
  loading?: boolean
}

const CreateEmailModal: React.FC<CreateEmailModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  loading = false
}) => {
  // Form state
  const [emailAddress, setEmailAddress] = useState('')
  const [emailProvider, setEmailProvider] = useState('')
  const [name, setName] = useState('')
  const [age, setAge] = useState('')
  const [address, setAddress] = useState('')
  const [password, setPassword] = useState('')
  const [recoveryEmail, setRecoveryEmail] = useState('')
  const [phoneNumbers, setPhoneNumbers] = useState('')

  // Form validation state
  const [errors, setErrors] = useState<Record<string, string>>({})

  // Tag management

  // Email provider options
  const providerOptions = [
    { value: EMAIL_PROVIDERS.GMAIL, label: 'Gmail' },
    { value: EMAIL_PROVIDERS.YAHOO, label: 'Yahoo' },
    { value: EMAIL_PROVIDERS.OUTLOOK, label: 'Outlook' },
    { value: EMAIL_PROVIDERS.ICLOUD, label: 'iCloud' }
  ]

  // Auto-detect email provider when email address changes
  useEffect(() => {
    if (emailAddress.includes('@')) {
      const domain = emailAddress.split('@')[1]?.toLowerCase()
      if (domain) {
        if (domain.includes('gmail.com')) {
          setEmailProvider(EMAIL_PROVIDERS.GMAIL)
        } else if (domain.includes('yahoo.com') || domain.includes('yahoo.')) {
          setEmailProvider(EMAIL_PROVIDERS.YAHOO)
        } else if (
          domain.includes('outlook.com') ||
          domain.includes('hotmail.com') ||
          domain.includes('live.com')
        ) {
          setEmailProvider(EMAIL_PROVIDERS.OUTLOOK)
        } else if (
          domain.includes('icloud.com') ||
          domain.includes('me.com') ||
          domain.includes('mac.com')
        ) {
          setEmailProvider(EMAIL_PROVIDERS.ICLOUD)
        }
      }
    }
  }, [emailAddress])

  // Form validation
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {}

    // Required fields
    if (!emailAddress.trim()) {
      newErrors.emailAddress = 'Email address is required'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailAddress)) {
      newErrors.emailAddress = 'Please enter a valid email address'
    }

    if (!emailProvider) {
      newErrors.emailProvider = 'Email provider is required'
    }

    if (!password.trim()) {
      newErrors.password = 'Password is required'
    } else if (password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters long'
    }

    // Age validation
    if (age && (isNaN(Number(age)) || Number(age) < 1 || Number(age) > 150)) {
      newErrors.age = 'Please enter a valid age between 1 and 150'
    }

    // Recovery email validation
    if (recoveryEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(recoveryEmail)) {
      newErrors.recoveryEmail = 'Please enter a valid recovery email address'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  // Handle form submission
  const handleSubmit = () => {
    if (!validateForm()) {
      return
    }

    const emailData: Omit<Email, 'id'> = {
      email_address: emailAddress.trim(),
      email_provider: emailProvider as any,
      name: name.trim() || undefined,
      age: age ? parseInt(age) : undefined,
      address: address.trim() || undefined,
      pasword: password, // Note: typo in interface
      last_password_change: new Date().toISOString(),
      recovery_email: recoveryEmail.trim() || undefined,
      phone_numbers: phoneNumbers.trim() || undefined
    }

    onSubmit(emailData)
  }

  const isFormValid = (): boolean => {
    return (
      emailAddress.trim() !== '' &&
      emailProvider !== '' &&
      password.trim() !== '' &&
      /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailAddress) &&
      password.length >= 6
    )
  }

  // Handle form reset when modal closes
  const handleClose = () => {
    if (!loading) {
      resetForm()
      onClose()
    }
  }

  // Reset form
  const resetForm = () => {
    setEmailAddress('')
    setEmailProvider('')
    setName('')
    setAge('')
    setAddress('')
    setPassword('')
    setRecoveryEmail('')
    setPhoneNumbers('')
    setErrors({})
  }

  return (
    <CustomModal
      isOpen={isOpen}
      onClose={handleClose}
      title="Create Email"
      actionText="Create Email"
      onAction={handleSubmit}
      actionDisabled={loading || !isFormValid()}
      actionLoading={loading}
      size="xl"
    >
      <div className="p-6 max-h-[70vh] overflow-y-auto space-y-6">
        {/* Basic Email Information */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-text-primary flex items-center gap-2">
            <Mail className="h-5 w-5 text-blue-600" />
            Email Information
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Email Address */}
            <CustomInput
              label="Email Address"
              value={emailAddress}
              onChange={setEmailAddress}
              placeholder="example@gmail.com"
              variant="filled"
              leftIcon={<Mail className="h-4 w-4" />}
              error={errors.emailAddress}
              required
              type="email"
              size="sm"
            />

            {/* Email Provider */}
            <CustomCombobox
              label="Email Provider"
              value={emailProvider}
              options={providerOptions}
              onChange={(value) => setEmailProvider(value as string)}
              placeholder="Select email provider..."
              searchable={false}
              creatable={false}
              size="sm"
              required
            />
          </div>

          {errors.emailProvider && (
            <p className="text-sm text-red-600 dark:text-red-400 flex items-center gap-1">
              <AlertCircle className="w-4 h-4" />
              {errors.emailProvider}
            </p>
          )}
        </div>

        {/* Password Information */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-text-primary flex items-center gap-2">
            <Key className="h-5 w-5 text-amber-600" />
            Authentication
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Password */}
            <CustomInput
              label="Password"
              type="password"
              value={password}
              onChange={setPassword}
              placeholder="Enter password..."
              variant="filled"
              error={errors.password}
              required
              size="sm"
            />

            {/* Recovery Email */}
            <CustomInput
              label="Recovery Email"
              value={recoveryEmail}
              onChange={setRecoveryEmail}
              placeholder="recovery@example.com"
              variant="filled"
              leftIcon={<Mail className="h-4 w-4" />}
              error={errors.recoveryEmail}
              type="email"
              size="sm"
            />
          </div>
        </div>

        {/* Personal Information */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-text-primary flex items-center gap-2">
            <User className="h-5 w-5 text-green-600" />
            Personal Information
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Name */}
            <CustomInput
              label="Full Name"
              value={name}
              onChange={setName}
              placeholder="Enter full name..."
              variant="filled"
              leftIcon={<User className="h-4 w-4" />}
              size="sm"
            />

            {/* Age */}
            <CustomInput
              label="Age"
              type="number"
              value={age}
              onChange={setAge}
              placeholder="25"
              variant="filled"
              leftIcon={<Calendar className="h-4 w-4" />}
              error={errors.age}
              size="sm"
            />

            {/* Phone Numbers */}
            <CustomInput
              label="Phone Numbers"
              value={phoneNumbers}
              onChange={setPhoneNumbers}
              placeholder="+84 xxx xxx xxx"
              variant="filled"
              leftIcon={<Phone className="h-4 w-4" />}
              size="sm"
            />

            {/* Address */}
            <CustomInput
              label="Address"
              value={address}
              onChange={setAddress}
              placeholder="Enter address..."
              variant="filled"
              leftIcon={<MapPin className="h-4 w-4" />}
              size="sm"
            />
          </div>
        </div>
      </div>
    </CustomModal>
  )
}

export default CreateEmailModal
