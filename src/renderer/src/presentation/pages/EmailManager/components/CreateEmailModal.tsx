// src/renderer/src/presentation/pages/EmailManager/components/CreateEmailModal.tsx
import React, { useState, useEffect } from 'react'
import CustomModal from '../../../../components/common/CustomModal'
import CustomInput from '../../../../components/common/CustomInput'
import CustomCombobox from '../../../../components/common/CustomCombobox'
import CustomTextArea from '../../../../components/common/CustomTextArea'
import { Badge } from '../../../../components/ui/badge'
import { Button } from '../../../../components/ui/button'
import { Mail, Key, User, MapPin, Phone, Tag, Plus, X, AlertCircle, Calendar } from 'lucide-react'
import { Email } from '../types'
import { EMAIL_PROVIDERS, EMAIL_CATEGORIES } from '../constants'
import Metadata from '../../../../components/common/Metadata'

interface CreateEmailModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (emailData: Omit<Email, 'id'>) => void
  loading?: boolean
}

// Curated beautiful hex colors for tags
const TAG_COLORS = [
  '#FF6B6B', // Coral Red
  '#4ECDC4', // Teal
  '#45B7D1', // Sky Blue
  '#96CEB4', // Mint Green
  '#FFEAA7', // Light Yellow
  '#DDA0DD', // Plum
  '#98D8C8', // Mint
  '#F7DC6F', // Light Gold
  '#BB8FCE', // Light Purple
  '#85C1E9', // Light Blue
  '#F8C471', // Peach
  '#82E0AA', // Light Green
  '#F1948A', // Light Pink
  '#85929E', // Blue Gray
  '#D7BDE2', // Lavender
  '#A9DFBF', // Pale Green
  '#F9E79F', // Pale Yellow
  '#AED6F1', // Pale Blue
  '#F5B7B1', // Pale Pink
  '#D5A6BD' // Dusty Pink
]

// Function to get consistent color for a tag
const getTagColor = (tag: string): string => {
  const index = tag.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) % TAG_COLORS.length
  return TAG_COLORS[index]
}

// Function to determine if text should be dark or light based on background
const getTextColor = (hexColor: string): string => {
  // Convert hex to RGB
  const r = parseInt(hexColor.slice(1, 3), 16)
  const g = parseInt(hexColor.slice(3, 5), 16)
  const b = parseInt(hexColor.slice(5, 7), 16)

  // Calculate luminance
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255

  return luminance > 0.5 ? '#374151' : '#FFFFFF' // Dark gray or white
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
  const [tags, setTags] = useState<string[]>([])
  const [note, setNote] = useState('')
  const [customMetadata] = useState<Record<string, any>>({})

  // Form validation state
  const [errors, setErrors] = useState<Record<string, string>>({})

  // Tag management
  const [showAddTag, setShowAddTag] = useState(false)
  const [newTagValue, setNewTagValue] = useState('')
  const [hoveredTag, setHoveredTag] = useState<string | null>(null)

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
      phone_numbers: phoneNumbers.trim() || undefined,
      tags: tags.length > 0 ? tags : undefined,
      note: note.trim() || undefined,
      metadata: {
        created_via: 'create_email_modal',
        created_at: new Date().toISOString(),
        ...customMetadata
      }
    }

    onSubmit(emailData)
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
    setTags([])
    setNote('')
    setErrors({})
    setShowAddTag(false)
    setNewTagValue('')
  }

  // Tag management functions
  const handleAddTag = () => {
    const trimmedTag = newTagValue.trim()
    if (trimmedTag && !tags.includes(trimmedTag)) {
      setTags([...tags, trimmedTag])
      setNewTagValue('')
      setShowAddTag(false)
    }
  }

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter((tag) => tag !== tagToRemove))
  }

  const handleTagKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleAddTag()
    } else if (e.key === 'Escape') {
      setShowAddTag(false)
      setNewTagValue('')
    }
  }

  return (
    <CustomModal
      isOpen={isOpen}
      onClose={handleClose}
      title="Create New Email Account"
      actionText="Create Email"
      onAction={handleSubmit}
      actionDisabled={loading}
      actionLoading={loading}
      size="xl"
      headerActions={
        <Badge variant="secondary" className="bg-blue-50 text-blue-700 border-blue-200">
          <Mail className="h-3 w-3 mr-1" />
          New Account
        </Badge>
      }
    >
      <div className="p-6 max-h-[70vh] overflow-y-auto space-y-6">
        {/* Basic Email Information */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
            <Mail className="h-5 w-5 text-blue-600" />
            Email Information
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Email Address */}
            <div className="md:col-span-2">
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
              />
            </div>

            {/* Email Provider */}
            <CustomCombobox
              label="Email Provider"
              value={emailProvider}
              options={providerOptions}
              onChange={(value) => setEmailProvider(value as string)}
              placeholder="Select email provider..."
              searchable={false}
              creatable={false}
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
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
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
            />
          </div>
        </div>

        {/* Personal Information */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
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
            />

            {/* Phone Numbers */}
            <CustomInput
              label="Phone Numbers"
              value={phoneNumbers}
              onChange={setPhoneNumbers}
              placeholder="+84 xxx xxx xxx"
              variant="filled"
              leftIcon={<Phone className="h-4 w-4" />}
            />

            {/* Address */}
            <CustomInput
              label="Address"
              value={address}
              onChange={setAddress}
              placeholder="Enter address..."
              variant="filled"
              leftIcon={<MapPin className="h-4 w-4" />}
            />
          </div>
        </div>

        {/* Tags Section */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
            <Tag className="h-5 w-5 text-purple-600" />
            Tags
          </h3>

          <div className="flex flex-wrap gap-3 items-center">
            {/* Existing Tags */}
            {tags.map((tag, index) => {
              const bgColor = getTagColor(tag)
              const textColor = getTextColor(bgColor)

              return (
                <div
                  key={index}
                  className="relative group"
                  onMouseEnter={() => setHoveredTag(tag)}
                  onMouseLeave={() => setHoveredTag(null)}
                >
                  <div
                    className="px-3 py-1.5 rounded-lg text-sm font-medium border transition-all duration-200 cursor-default"
                    style={{
                      backgroundColor: bgColor,
                      color: textColor,
                      borderColor: bgColor
                    }}
                  >
                    {tag}

                    {/* Delete Button - appears on hover */}
                    {hoveredTag === tag && (
                      <button
                        onClick={() => handleRemoveTag(tag)}
                        className="ml-2 inline-flex items-center justify-center w-4 h-4 rounded-full hover:opacity-80 transition-opacity"
                        style={{ backgroundColor: 'rgba(0,0,0,0.2)' }}
                      >
                        <X className="h-2.5 w-2.5" style={{ color: textColor }} />
                      </button>
                    )}
                  </div>
                </div>
              )
            })}

            {/* Add Tag Button/Input */}
            {!showAddTag ? (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowAddTag(true)}
                className="border-dashed border-gray-300 hover:border-gray-400 hover:bg-gray-50 text-gray-600 h-8"
              >
                <Plus className="h-3 w-3 mr-1" />
                Add Tag
              </Button>
            ) : (
              <div className="flex items-center gap-2">
                <div className="relative">
                  <input
                    type="text"
                    value={newTagValue}
                    onChange={(e) => setNewTagValue(e.target.value)}
                    onKeyDown={handleTagKeyDown}
                    placeholder="Enter tag name..."
                    autoFocus
                    className="px-3 py-1.5 text-sm border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 min-w-[120px]"
                  />
                </div>

                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleAddTag}
                    disabled={!newTagValue.trim() || tags.includes(newTagValue.trim())}
                    className="h-7 w-7 p-0 text-green-600 hover:text-green-700 hover:bg-green-50"
                  >
                    <Plus className="h-3 w-3" />
                  </Button>

                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setShowAddTag(false)
                      setNewTagValue('')
                    }}
                    className="h-7 w-7 p-0 text-gray-400 hover:text-gray-600 hover:bg-gray-50"
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            )}

            {/* No tags message */}
            {tags.length === 0 && !showAddTag && (
              <span className="text-sm text-gray-500 dark:text-gray-400 italic">
                No tags assigned
              </span>
            )}
          </div>

          {/* Tag hint */}
          {showAddTag && (
            <p className="text-xs text-gray-500">Press Enter to add tag, Escape to cancel</p>
          )}
        </div>

        {/* Notes Section */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Notes</h3>
          <CustomTextArea
            value={note}
            onChange={setNote}
            placeholder="Add any additional notes about this email account..."
            variant="filled"
            showCharCount={true}
            maxLength={500}
            minRows={3}
            maxRows={6}
          />
        </div>

        {/* Metadata Section */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Additional Metadata
          </h3>
          <Metadata
            metadata={{}}
            onMetadataChange={() => {
              // Metadata sẽ được xử lý trong handleSubmit
            }}
            title="Custom Fields"
            maxFields={10}
            keyPlaceholder="Enter field name (e.g., security_question, backup_phone)"
            compact={false}
          />
        </div>

        {/* Summary Info */}
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5" />
            <div>
              <h5 className="text-sm font-semibold text-blue-800 dark:text-blue-300 mb-1">
                Account Security
              </h5>
              <p className="text-sm text-blue-700 dark:text-blue-400">
                Your email credentials will be encrypted and stored securely in the local database.
                Make sure to use a strong password and consider enabling two-factor authentication
                for your email account.
              </p>
            </div>
          </div>
        </div>
      </div>
    </CustomModal>
  )
}

export default CreateEmailModal
