// src/renderer/src/presentation/pages/EmailManager/components/EmailDrawer/AccountService/CreateAccountServiceForm.tsx
import React, { useState, useEffect } from 'react'
import CustomButton from '../../../../../../components/common/CustomButton'
import CustomInput from '../../../../../../components/common/CustomInput'
import CustomCombobox from '../../../../../../components/common/CustomCombobox'
import { Globe, User, Key, Link, Plus, X, AlertCircle, Shield, Activity } from 'lucide-react'
import { cn } from '../../../../../../shared/lib/utils'
import { ServiceAccount, Email } from '../../../types'
import Metadata from '../../../../../../components/common/Metadata'
import { Button } from '../../../../../../components/ui/button'

interface CreateAccountServiceFormProps {
  email: Email
  existingServices: ServiceAccount[] // Để check trùng lặp service name
  onSubmit: (data: Omit<ServiceAccount, 'id' | 'email_id'>) => Promise<void>
  onCancel: () => void
  loading?: boolean
  className?: string
}

// Service type options
const serviceTypeOptions = [
  {
    value: 'social_media',
    label: 'Social Media',
    description: 'Facebook, Twitter, Instagram, LinkedIn, etc.',
    icon: '📱'
  },
  {
    value: 'communication',
    label: 'Communication',
    description: 'Slack, Discord, Telegram, WhatsApp, etc.',
    icon: '💬'
  },
  {
    value: 'developer',
    label: 'Developer',
    description: 'GitHub, GitLab, Stack Overflow, npm, etc.',
    icon: '👨‍💻'
  },
  {
    value: 'cloud_storage',
    label: 'Cloud Storage',
    description: 'Google Drive, Dropbox, OneDrive, etc.',
    icon: '☁️'
  },
  {
    value: 'ai_saas',
    label: 'AI & SaaS',
    description: 'ChatGPT, Claude, Notion, Figma, etc.',
    icon: '🤖'
  },
  {
    value: 'productivity_tool',
    label: 'Productivity',
    description: 'Trello, Asana, Monday, Todoist, etc.',
    icon: '📊'
  },
  {
    value: 'payment_finance',
    label: 'Payment & Finance',
    description: 'PayPal, Stripe, banking apps, etc.',
    icon: '💳'
  },
  {
    value: 'ecommerce',
    label: 'E-commerce',
    description: 'Amazon, eBay, Shopify, etc.',
    icon: '🛒'
  },
  {
    value: 'entertainment',
    label: 'Entertainment',
    description: 'Netflix, Spotify, YouTube, etc.',
    icon: '🎵'
  },
  {
    value: 'education',
    label: 'Education',
    description: 'Coursera, Udemy, Khan Academy, etc.',
    icon: '📚'
  },
  {
    value: 'hosting_domain',
    label: 'Hosting & Domain',
    description: 'GoDaddy, Namecheap, AWS, DigitalOcean, etc.',
    icon: '🌐'
  },
  {
    value: 'security_vpn',
    label: 'Security & VPN',
    description: 'NordVPN, 1Password, LastPass, etc.',
    icon: '🔒'
  },
  {
    value: 'government',
    label: 'Government',
    description: 'Tax portals, citizen services, etc.',
    icon: '🏛️'
  },
  {
    value: 'health',
    label: 'Health',
    description: 'Health insurance, medical portals, etc.',
    icon: '🏥'
  },
  {
    value: 'gaming',
    label: 'Gaming',
    description: 'Steam, Epic Games, PlayStation, etc.',
    icon: '🎮'
  },
  {
    value: 'travel_transport',
    label: 'Travel & Transport',
    description: 'Booking.com, Uber, Grab, etc.',
    icon: '✈️'
  },
  {
    value: 'news_media',
    label: 'News & Media',
    description: 'Medium, Substack, news websites, etc.',
    icon: '📰'
  },
  {
    value: 'forum_community',
    label: 'Forum & Community',
    description: 'Reddit, Forums, Communities, etc.',
    icon: '👥'
  },
  {
    value: 'iot_smart_device',
    label: 'IoT & Smart Device',
    description: 'Smart home apps, IoT platforms, etc.',
    icon: '🏠'
  },
  {
    value: 'other',
    label: 'Other',
    description: 'Other services not listed above',
    icon: '📦'
  }
]

// Status options
const statusOptions = [
  { value: 'active', label: 'Active' },
  { value: 'inactive', label: 'Inactive' },
  { value: 'suspended', label: 'Suspended' }
]

const CreateAccountServiceForm: React.FC<CreateAccountServiceFormProps> = ({
  email,
  existingServices = [],
  onSubmit,
  onCancel,
  loading = false,
  className
}) => {
  const [formData, setFormData] = useState<{
    service_name: string
    service_type: string
    service_url: string
    status: string
    name: string
    username: string
    password: string
    note: string
    metadata: Record<string, any>
  }>({
    service_name: '',
    service_type: '',
    service_url: '',
    status: 'active',
    name: '',
    username: '',
    password: '',
    note: '',
    metadata: {}
  })

  const [errors, setErrors] = useState<Record<string, string>>({})

  // Get selected service type info
  const selectedServiceType = serviceTypeOptions.find((opt) => opt.value === formData.service_type)

  // Auto-generate service URL when service name changes
  useEffect(() => {
    if (formData.service_name && !formData.service_url) {
      // Simple logic to suggest URL based on service name
      const serviceName = formData.service_name.toLowerCase()
      let suggestedUrl = ''

      // Common service URL patterns
      if (serviceName.includes('github')) {
        suggestedUrl = 'https://github.com'
      } else if (serviceName.includes('google')) {
        suggestedUrl = 'https://accounts.google.com'
      } else if (serviceName.includes('facebook')) {
        suggestedUrl = 'https://facebook.com'
      } else if (serviceName.includes('twitter')) {
        suggestedUrl = 'https://twitter.com'
      } else if (serviceName.includes('linkedin')) {
        suggestedUrl = 'https://linkedin.com'
      } else if (serviceName.includes('instagram')) {
        suggestedUrl = 'https://instagram.com'
      } else if (serviceName.includes('netflix')) {
        suggestedUrl = 'https://netflix.com'
      } else if (serviceName.includes('spotify')) {
        suggestedUrl = 'https://spotify.com'
      }

      if (suggestedUrl) {
        setFormData((prev) => ({
          ...prev,
          service_url: suggestedUrl
        }))
      }
    }
  }, [formData.service_name, formData.service_url])

  // Handle service type change
  const handleServiceTypeChange = (value: string | string[]) => {
    const typeValue = Array.isArray(value) ? value[0] : value
    setFormData((prev) => ({
      ...prev,
      service_type: typeValue,
      metadata: {
        ...prev.metadata
      }
    }))
    setErrors({})
  }

  // Handle status change
  const handleStatusChange = (value: string | string[]) => {
    const statusValue = Array.isArray(value) ? value[0] : value
    setFormData((prev) => ({
      ...prev,
      status: statusValue
    }))
  }

  // Validate form
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {}

    // Required fields
    if (!formData.service_name.trim()) {
      newErrors.service_name = 'Service name is required'
    } else {
      // Check for duplicate service names
      const isDuplicate = existingServices.some(
        (service) =>
          service.service_name.toLowerCase() === formData.service_name.trim().toLowerCase()
      )
      if (isDuplicate) {
        newErrors.service_name = 'A service with this name already exists'
      }
    }

    if (!formData.service_type) {
      newErrors.service_type = 'Service type is required'
    }

    // Validate URL if provided
    if (formData.service_url) {
      try {
        new URL(formData.service_url)
      } catch {
        newErrors.service_url = 'Please enter a valid URL'
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
      const serviceData: Omit<ServiceAccount, 'id' | 'email_id'> = {
        service_name: formData.service_name.trim(),
        service_type: formData.service_type as any,
        service_url: formData.service_url.trim() || undefined,
        status: formData.status as any,
        name: formData.name.trim() || undefined,
        username: formData.username.trim() || undefined,
        password: formData.password.trim() || undefined,
        note: formData.note.trim() || undefined,
        metadata: {
          created_at: new Date().toISOString(),
          created_by: 'user',
          ...formData.metadata
        }
      }

      await onSubmit(serviceData)
    } catch (error) {
      console.error('Error creating service account:', error)
    }
  }

  // Handle cancel
  const handleCancel = () => {
    setFormData({
      service_name: '',
      service_type: '',
      service_url: '',
      status: 'active',
      name: '',
      username: '',
      password: '',
      note: '',
      metadata: {}
    })
    setErrors({})
    onCancel()
  }

  return (
    <div
      className={cn(
        'bg-card-background rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm p-4 mb-4',
        className
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 bg-blue-50 dark:bg-blue-900/20 rounded-lg flex items-center justify-center">
            <Plus className="h-3 w-3 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <h4 className="text-base font-bold text-text-primary">Add Service Account</h4>
            <p className="text-xs text-gray-600 dark:text-gray-400">
              Connect a new service account to {email.email_address}
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

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Service Information */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Service Name */}
          <CustomInput
            label="Service Name"
            value={formData.service_name}
            onChange={(value) => setFormData((prev) => ({ ...prev, service_name: value }))}
            placeholder="e.g., GitHub, Google, Facebook"
            variant="filled"
            leftIcon={<Globe className="h-4 w-4" />}
            error={errors.service_name}
            required
            disabled={loading}
            size="sm"
          />

          {/* Service Type */}
          <div className="space-y-1">
            <CustomCombobox
              label="Service Type"
              value={formData.service_type}
              options={serviceTypeOptions.map((option) => ({
                value: option.value,
                label: `${option.icon} ${option.label}`
              }))}
              onChange={handleServiceTypeChange}
              placeholder="Select service type..."
              searchable={true}
              size="sm"
            />
            {errors.service_type && (
              <p className="text-xs text-red-600 dark:text-red-400 flex items-center gap-1">
                <AlertCircle className="h-3 w-3" />
                {errors.service_type}
              </p>
            )}

            {/* Service Type Description */}
            {selectedServiceType && (
              <div className="bg-blue-50 dark:bg-blue-900/10 border border-blue-200 dark:border-blue-800 rounded-lg p-2">
                <p className="text-xs text-blue-700 dark:text-blue-200">
                  {selectedServiceType.description}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Service URL */}
        <CustomInput
          label="Service URL (Optional)"
          value={formData.service_url}
          onChange={(value) => setFormData((prev) => ({ ...prev, service_url: value }))}
          placeholder="https://example.com"
          variant="filled"
          leftIcon={<Link className="h-4 w-4" />}
          error={errors.service_url}
          disabled={loading}
          size="sm"
          hint="URL will be auto-suggested based on service name"
        />

        {/* Account Credentials */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Shield className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
            <h5 className="text-sm font-semibold text-text-primary">Account Credentials</h5>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Username */}
            <CustomInput
              label="Username"
              value={formData.username}
              onChange={(value) => setFormData((prev) => ({ ...prev, username: value }))}
              placeholder="Enter username or email"
              variant="filled"
              leftIcon={<User className="h-4 w-4" />}
              disabled={loading}
              size="sm"
            />

            {/* Display Name */}
            <CustomInput
              label="Display Name (Optional)"
              value={formData.name}
              onChange={(value) => setFormData((prev) => ({ ...prev, name: value }))}
              placeholder="Full name or display name"
              variant="filled"
              leftIcon={<User className="h-4 w-4" />}
              disabled={loading}
              size="sm"
            />
          </div>

          {/* Password */}
          <CustomInput
            label="Password (Optional)"
            type="password"
            value={formData.password}
            onChange={(value) => setFormData((prev) => ({ ...prev, password: value }))}
            placeholder="Enter password (optional)"
            variant="filled"
            leftIcon={<Key className="h-4 w-4" />}
            error={errors.password}
            disabled={loading}
            size="sm"
          />
        </div>

        {/* Status */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <CustomCombobox
            label="Account Status"
            value={formData.status}
            options={statusOptions}
            onChange={handleStatusChange}
            placeholder="Select status..."
            size="sm"
          />

          <div className="flex items-center gap-2 pt-6">
            <Activity className="h-4 w-4 text-gray-500" />
            <span className="text-sm text-gray-600 dark:text-gray-400">
              Status: {statusOptions.find((s) => s.value === formData.status)?.label}
            </span>
          </div>
        </div>

        {/* Notes - SỬA: Thay CustomTextArea thành CustomInput với multiline */}
        <CustomInput
          label="Notes (Optional)"
          value={formData.note}
          onChange={(value) => setFormData((prev) => ({ ...prev, note: value }))}
          placeholder="Add any notes about this service account..."
          variant="filled"
          multiline={true}
          rows={3}
          disabled={loading}
          size="sm"
          hint="Optional notes, reminders, or additional information"
        />

        {/* Metadata Form */}
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
            disabled={loading || !formData.service_name.trim() || !formData.service_type}
            loading={loading}
            className="min-w-[140px] bg-blue-600 hover:bg-blue-700 text-white"
          >
            Add Service Account
          </CustomButton>
        </div>
      </form>
    </div>
  )
}

export default CreateAccountServiceForm
