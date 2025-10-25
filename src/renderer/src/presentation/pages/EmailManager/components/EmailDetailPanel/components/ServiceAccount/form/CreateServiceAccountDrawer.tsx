// src/renderer/src/presentation/pages/EmailManager/components/EmailDetailPanel/components/ServiceAccount/form/CreateServiceAccountDrawer.tsx
import React, { useState, useEffect, useMemo } from 'react'
import CustomButton from '../../../../../../../../components/common/CustomButton'
import CustomInput from '../../../../../../../../components/common/CustomInput'
import CustomCombobox from '../../../../../../../../components/common/CustomCombobox'
import CustomDrawer from '../../../../../../../../components/common/CustomDrawer'
import { User, Key, Link, AlertCircle, Shield, Activity } from 'lucide-react'
import { ServiceAccount, Email } from '../../../../../types'
import Metadata from '../../../../../../../../components/common/Metadata'
import { SERVICE_TEMPLATES, ServiceTemplate } from '../../../../../constants/serviceTemplates'

interface CreateServiceAccountDrawerProps {
  isOpen: boolean
  email: Email
  existingServices: ServiceAccount[]
  allServices?: ServiceAccount[]
  onSubmit: (data: Omit<ServiceAccount, 'id' | 'email_id'>) => Promise<void>
  onClose: () => void
  loading?: boolean
  initialData?: any
  onDataChange?: (data: any) => void
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

const CreateServiceAccountDrawer: React.FC<CreateServiceAccountDrawerProps> = ({
  isOpen,
  email,
  existingServices = [],
  onSubmit,
  loading = false,
  allServices = [],
  onClose,
  initialData,
  onDataChange
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
  }>(() => {
    if (initialData) {
      return initialData
    }
    return {
      service_name: '',
      service_type: '',
      service_url: '',
      status: 'active',
      name: '',
      username: '',
      password: '',
      note: '',
      metadata: {}
    }
  })

  const [errors, setErrors] = useState<Record<string, string>>({})

  // Reset form when drawer opens/closes
  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        setFormData(initialData)
      } else {
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
      }
      setErrors({})
    }
  }, [isOpen, email.id, initialData])

  // Auto-save draft data khi form thay đổi
  useEffect(() => {
    if (onDataChange && isOpen) {
      onDataChange(formData)
    }
  }, [formData, onDataChange, isOpen])

  // Merge service templates với existing services
  const availableServices = useMemo(() => {
    const serviceMap = new Map<
      string,
      { value: string; label: string; template: ServiceTemplate }
    >()

    SERVICE_TEMPLATES.forEach((template) => {
      const key = template.service_name.toLowerCase()
      serviceMap.set(key, {
        value: template.service_name,
        label: template.service_name,
        template
      })
    })

    allServices.forEach((service) => {
      const key = service.service_name.toLowerCase()
      serviceMap.set(key, {
        value: service.service_name,
        label: service.service_name,
        template: {
          service_name: service.service_name,
          service_type: service.service_type,
          service_url: service.service_url
        } as ServiceTemplate
      })
    })

    return Array.from(serviceMap.values()).sort((a, b) => a.label.localeCompare(b.label))
  }, [allServices])

  // Handle service name change - auto-fill type & URL from template
  const handleServiceNameChange = (value: string | string[]) => {
    const serviceName = Array.isArray(value) ? value[0] : value

    const matchedService = availableServices.find(
      (s) => s.value.toLowerCase() === serviceName.toLowerCase()
    )

    if (matchedService?.template) {
      setFormData((prev) => ({
        ...prev,
        service_name: serviceName,
        service_type: matchedService.template.service_type,
        service_url: matchedService.template.service_url || ''
      }))
    } else {
      setFormData((prev) => ({
        ...prev,
        service_name: serviceName
      }))
    }

    setErrors({})
  }

  // Get selected service type info
  const selectedServiceType = serviceTypeOptions.find((opt) => opt.value === formData.service_type)

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

    if (!formData.service_name.trim()) {
      newErrors.service_name = 'Service name is required'
    } else {
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
  const handleSubmit = async () => {
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

      // Reset form sau khi submit thành công
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

      if (onDataChange) {
        onDataChange(null)
      }

      onClose()
    } catch (error) {
      console.error('Error creating service account:', error)
    }
  }

  return (
    <CustomDrawer
      isOpen={isOpen}
      onClose={onClose}
      title="Add Service Account"
      subtitle={`Connect a new service account to ${email.email_address}`}
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
            variant="primary"
            size="sm"
            onClick={handleSubmit}
            disabled={loading || !formData.service_name.trim() || !formData.service_type}
            loading={loading}
            className="min-w-[140px] bg-blue-600 hover:bg-blue-700 text-white"
          >
            Add Service Account
          </CustomButton>
        </div>
      }
    >
      <div className="space-y-4 p-4">
        {/* Service Information */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Service Name - Combobox */}
          <div className="space-y-1">
            <CustomCombobox
              label="Service Name"
              value={formData.service_name}
              options={availableServices.map((s) => {
                return { value: s.value, label: s.label }
              })}
              onChange={handleServiceNameChange}
              placeholder="Select or create service..."
              searchable={true}
              creatable={true}
              size="sm"
              required
            />
            {errors.service_name && (
              <p className="text-xs text-red-600 dark:text-red-400 flex items-center gap-1">
                <AlertCircle className="h-3 w-3" />
                {errors.service_name}
              </p>
            )}
            {formData.service_name &&
              availableServices.find((s) => s.value === formData.service_name) && (
                <p className="text-xs text-blue-600 dark:text-blue-400 flex items-center gap-1">
                  ℹ️ Auto-filled from template
                </p>
              )}
          </div>

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

        {/* Notes */}
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
        <div>
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
      </div>
    </CustomDrawer>
  )
}

export default CreateServiceAccountDrawer
