// src/renderer/src/presentation/pages/EmailManager/components/ServiceAccountSection.tsx
import React, { useState, useEffect } from 'react'
import { Button } from '../../../../../../../../components/ui/button'
import CustomInput from '../../../../../../../../components/common/CustomInput'
import CustomCombobox from '../../../../../../../../components/common/CustomCombobox'
import Metadata from '../../../../../../../../components/common/Metadata'
import {
  Copy,
  Check,
  User,
  Globe,
  Link,
  Key,
  ExternalLink,
  AlertCircle,
  ChevronDown,
  ChevronUp
} from 'lucide-react'
import { cn } from '../../../../../../../../shared/lib/utils'
import { ServiceAccount } from '../../../../../types'
import { Favicon } from '../../../../../../../../shared/utils/faviconUtils'

interface ServiceAccountSectionProps {
  serviceAccount: ServiceAccount
  onServiceUpdate?: (serviceId: string, field: string, value: string) => Promise<boolean>
  className?: string
}

// Service type options
const serviceTypeOptions = [
  { value: 'social_media', label: 'Social Media' },
  { value: 'communication', label: 'Communication' },
  { value: 'developer', label: 'Developer' },
  { value: 'cloud_storage', label: 'Cloud Storage' },
  { value: 'ai_saas', label: 'AI & SaaS' },
  { value: 'productivity_tool', label: 'Productivity' },
  { value: 'payment_finance', label: 'Payment & Finance' },
  { value: 'ecommerce', label: 'E-commerce' },
  { value: 'entertainment', label: 'Entertainment' },
  { value: 'education', label: 'Education' },
  { value: 'hosting_domain', label: 'Hosting & Domain' },
  { value: 'security_vpn', label: 'Security & VPN' },
  { value: 'government', label: 'Government' },
  { value: 'health', label: 'Health' },
  { value: 'gaming', label: 'Gaming' },
  { value: 'travel_transport', label: 'Travel & Transport' },
  { value: 'news_media', label: 'News & Media' },
  { value: 'forum_community', label: 'Forum & Community' },
  { value: 'iot_smart_device', label: 'IoT & Smart Device' },
  { value: 'other', label: 'Other' }
]

// Status options
const statusOptions = [
  { value: 'active', label: 'Active' },
  { value: 'inactive', label: 'Inactive' },
  { value: 'suspended', label: 'Suspended' }
]

const ServiceAccountSection: React.FC<ServiceAccountSectionProps> = ({
  serviceAccount,
  onServiceUpdate,
  className
}) => {
  // Form state
  const [serviceName, setServiceName] = useState(serviceAccount.service_name || '')
  const [serviceType, setServiceType] = useState(serviceAccount.service_type || '')
  const [serviceUrl, setServiceUrl] = useState(serviceAccount.service_url || '')
  const [status, setStatus] = useState(serviceAccount.status || 'active')
  const [username, setUsername] = useState(serviceAccount.username || '')
  const [name, setName] = useState(serviceAccount.name || '')
  const [password, setPassword] = useState(serviceAccount.password || '')
  const [note, setNote] = useState(serviceAccount.note || '')
  const [metadata, setMetadata] = useState(serviceAccount.metadata || {})

  // UI state
  const [isExpanded, setIsExpanded] = useState(true)
  const [savingField, setSavingField] = useState<string | null>(null)
  const [saveStatus, setSaveStatus] = useState<{ [key: string]: 'success' | 'error' | null }>({})

  // Reset form khi serviceAccount thay đổi
  useEffect(() => {
    setServiceName(serviceAccount.service_name || '')
    setServiceType(serviceAccount.service_type || '')
    setServiceUrl(serviceAccount.service_url || '')
    setStatus(serviceAccount.status || 'active')
    setUsername(serviceAccount.username || '')
    setName(serviceAccount.name || '')
    setPassword(serviceAccount.password || '')
    setNote(serviceAccount.note || '')
    setMetadata(serviceAccount.metadata || {})
    setSaveStatus({})
  }, [serviceAccount])

  // Kiểm tra thay đổi
  const hasServiceNameChanged = serviceName !== (serviceAccount.service_name || '')
  const hasServiceTypeChanged = serviceType !== (serviceAccount.service_type || '')
  const hasServiceUrlChanged = serviceUrl !== (serviceAccount.service_url || '')
  const hasStatusChanged = status !== (serviceAccount.status || 'active')
  const hasUsernameChanged = username !== (serviceAccount.username || '')
  const hasNameChanged = name !== (serviceAccount.name || '')
  const hasPasswordChanged = password !== (serviceAccount.password || '')
  const hasNoteChanged = note !== (serviceAccount.note || '')

  // Hàm lưu field
  const handleSaveField = async (field: string, value: string) => {
    if (!serviceAccount.id || !onServiceUpdate) {
      console.error('Missing service ID or update function')
      return
    }

    try {
      setSavingField(field)
      const success = await onServiceUpdate(serviceAccount.id, field, value)

      if (success) {
        setSaveStatus((prev) => ({ ...prev, [field]: 'success' }))
        setTimeout(() => {
          setSaveStatus((prev) => ({ ...prev, [field]: null }))
        }, 2000)
      } else {
        setSaveStatus((prev) => ({ ...prev, [field]: 'error' }))
      }
    } catch (error) {
      console.error(`Error saving ${field}:`, error)
      setSaveStatus((prev) => ({ ...prev, [field]: 'error' }))
    } finally {
      setSavingField(null)
    }
  }

  // Render status icon
  const renderStatusIcon = (field: string, hasChanged: boolean, currentValue: string) => {
    if (savingField === field) {
      return <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
    }

    if (saveStatus[field] === 'success') {
      return <Check className="h-4 w-4 text-green-600" />
    }

    if (saveStatus[field] === 'error') {
      return <AlertCircle className="h-4 w-4 text-red-600" />
    }

    if (hasChanged) {
      return (
        <Button
          variant="ghost"
          size="sm"
          onClick={(e) => {
            e.stopPropagation()
            handleSaveField(field, currentValue)
          }}
          className="p-0.5 h-5 w-5 text-green-600 hover:text-green-700 hover:bg-green-50"
          disabled={savingField !== null}
        >
          <Check className="h-3 w-3" />
        </Button>
      )
    }

    return null
  }

  // Copy to clipboard
  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text)
    } catch (err) {
      console.error('Failed to copy:', err)
    }
  }

  // Handle dropdown changes
  const handleServiceTypeChange = (value: string | string[]) => {
    const newType = Array.isArray(value) ? value[0] : value
    setServiceType(newType as ServiceAccount['service_type'])
  }

  const handleStatusChange = (value: string | string[]) => {
    const newStatus = Array.isArray(value) ? value[0] : value
    setStatus(newStatus as 'active' | 'inactive' | 'suspended')
  }

  // Handle metadata change
  const handleMetadataChange = (newMetadata: Record<string, any>) => {
    setMetadata(newMetadata)
  }

  // Get service type label
  const getServiceTypeLabel = (type: string) => {
    const option = serviceTypeOptions.find((opt) => opt.value === type)
    return option ? option.label : type.replace(/_/g, ' ')
  }

  // Handle external link
  const handleExternalLink = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (serviceUrl) {
      window.open(serviceUrl, '_blank')
    }
  }

  return (
    <div
      className={cn(
        'group relative bg-card-background rounded-lg border border-gray-100 dark:border-gray-700 shadow-sm transition-all duration-200 overflow-hidden',
        className
      )}
    >
      {/* Status Indicator */}
      <div
        className={cn(
          'absolute top-0 left-0 w-1 h-full',
          status === 'active'
            ? 'bg-emerald-500'
            : status === 'suspended'
              ? 'bg-red-500'
              : 'bg-gray-400'
        )}
      />

      {/* Header */}
      <div className="p-3 transition-all duration-200">
        <div className="flex items-center justify-between">
          {/* Left Section - Favicon + Service Info */}
          <div className="flex items-center gap-3 flex-1 min-w-0 pl-2">
            {/* Service Favicon */}
            <div className="relative flex-shrink-0">
              <Favicon
                url={serviceUrl}
                size={24}
                className="rounded"
                fallbackIcon={<Globe className="h-4 w-4 text-gray-600" />}
              />
              {/* Status Dot */}
              <div
                className={cn(
                  'absolute -bottom-1 -right-1 w-3 h-3 rounded-full border-2 border-white dark:border-gray-800',
                  status === 'active'
                    ? 'bg-emerald-500'
                    : status === 'suspended'
                      ? 'bg-red-500'
                      : 'bg-gray-400'
                )}
              />
            </div>

            {/* Service Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <h3 className="text-sm font-semibold text-text-primary truncate">{serviceName}</h3>
                {serviceUrl && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleExternalLink}
                    className="p-0.5 h-4 w-4 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-blue-100 dark:hover:bg-blue-900/20"
                    title="Open website"
                  >
                    <ExternalLink className="h-2.5 w-2.5 text-blue-600" />
                  </Button>
                )}
              </div>

              <div className="text-xs text-gray-500 dark:text-gray-400">
                {getServiceTypeLabel(serviceType)} • {status || 'unknown'}
              </div>
            </div>
          </div>

          {/* Expand/Collapse Button */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-0.5 h-5 w-5 text-gray-400 hover:text-gray-600"
          >
            {isExpanded ? (
              <ChevronUp className="h-3 w-3 transition-transform" />
            ) : (
              <ChevronDown className="h-3 w-3 transition-transform" />
            )}
          </Button>
        </div>
      </div>

      {/* Expanded Content */}
      {isExpanded && (
        <div className="px-3 pb-3 space-y-4 animate-in slide-in-from-top-2 duration-300">
          {/* Divider */}
          <div className="border-t border-gray-100 dark:border-gray-700 ml-2" />

          {/* Header */}
          <div className="flex items-center justify-between ml-2">
            <div className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Service Account Details
            </div>
          </div>

          {/* Service Information Section */}
          <div className="space-y-3 ml-2">
            {/* Service Name */}
            <CustomInput
              label="Service Name"
              value={serviceName}
              onChange={setServiceName}
              size="sm"
              variant="filled"
              leftIcon={<Globe className="h-3 w-3" />}
              required
              disabled={savingField !== null && savingField !== 'service_name'}
              rightIcon={
                <div className="flex items-center gap-1">
                  {renderStatusIcon('service_name', hasServiceNameChanged, serviceName)}
                  {serviceName && !hasServiceNameChanged && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation()
                        copyToClipboard(serviceName)
                      }}
                      className="p-0.5 h-4 w-4 text-gray-500 hover:text-blue-600"
                      disabled={savingField !== null}
                    >
                      <Copy className="h-2.5 w-2.5" />
                    </Button>
                  )}
                </div>
              }
            />

            {/* Service Type & Status - Same Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {/* Service Type */}
              <div className="space-y-1">
                <CustomCombobox
                  label="Service Type"
                  value={serviceType}
                  options={serviceTypeOptions}
                  onChange={handleServiceTypeChange}
                  placeholder="Select service type..."
                  size="sm"
                />
                {hasServiceTypeChanged && (
                  <div className="flex justify-end">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleSaveField('service_type', serviceType)}
                      className="p-1 h-6 w-6 text-green-600 hover:text-green-700 hover:bg-green-50"
                      disabled={savingField !== null}
                    >
                      <Check className="h-3 w-3" />
                    </Button>
                  </div>
                )}
              </div>

              {/* Status */}
              <div className="space-y-1">
                <CustomCombobox
                  label="Status"
                  value={status}
                  options={statusOptions}
                  onChange={handleStatusChange}
                  placeholder="Select status..."
                  size="sm"
                />
                {hasStatusChanged && (
                  <div className="flex justify-end">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleSaveField('status', status)}
                      className="p-1 h-6 w-6 text-green-600 hover:text-green-700 hover:bg-green-50"
                      disabled={savingField !== null}
                    >
                      <Check className="h-3 w-3" />
                    </Button>
                  </div>
                )}
              </div>
            </div>

            {/* Service URL */}
            <CustomInput
              label="Service URL"
              value={serviceUrl}
              onChange={setServiceUrl}
              size="sm"
              variant="filled"
              leftIcon={<Link className="h-3 w-3" />}
              placeholder="https://example.com"
              disabled={savingField !== null && savingField !== 'service_url'}
              rightIcon={
                <div className="flex items-center gap-1">
                  {renderStatusIcon('service_url', hasServiceUrlChanged, serviceUrl)}
                  {serviceUrl && !hasServiceUrlChanged && (
                    <>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation()
                          window.open(serviceUrl, '_blank')
                        }}
                        className="p-0.5 h-4 w-4 text-gray-500 hover:text-green-600"
                        disabled={savingField !== null}
                      >
                        <ExternalLink className="h-2.5 w-2.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation()
                          copyToClipboard(serviceUrl)
                        }}
                        className="p-0.5 h-4 w-4 text-gray-500 hover:text-blue-600"
                        disabled={savingField !== null}
                      >
                        <Copy className="h-2.5 w-2.5" />
                      </Button>
                    </>
                  )}
                </div>
              }
            />

            {/* Username */}
            <CustomInput
              label="Username"
              value={username}
              onChange={setUsername}
              size="sm"
              variant="filled"
              leftIcon={<User className="h-3 w-3" />}
              placeholder="Enter username"
              disabled={savingField !== null && savingField !== 'username'}
              rightIcon={
                <div className="flex items-center gap-1">
                  {renderStatusIcon('username', hasUsernameChanged, username)}
                  {username && !hasUsernameChanged && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation()
                        copyToClipboard(username)
                      }}
                      className="p-0.5 h-4 w-4 text-gray-500 hover:text-blue-600"
                      disabled={savingField !== null}
                    >
                      <Copy className="h-2.5 w-2.5" />
                    </Button>
                  )}
                </div>
              }
            />

            {/* Display Name */}
            <CustomInput
              label="Display Name"
              value={name}
              onChange={setName}
              size="sm"
              variant="filled"
              leftIcon={<User className="h-3 w-3" />}
              placeholder="Enter display name"
              disabled={savingField !== null && savingField !== 'name'}
              rightIcon={
                <div className="flex items-center gap-1">
                  {renderStatusIcon('name', hasNameChanged, name)}
                  {name && !hasNameChanged && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation()
                        copyToClipboard(name)
                      }}
                      className="p-0.5 h-4 w-4 text-gray-500 hover:text-blue-600"
                      disabled={savingField !== null}
                    >
                      <Copy className="h-2.5 w-2.5" />
                    </Button>
                  )}
                </div>
              }
            />

            {/* Password */}
            <CustomInput
              label="Password"
              type="password"
              value={password}
              onChange={setPassword}
              size="sm"
              variant="filled"
              leftIcon={<Key className="h-3 w-3" />}
              placeholder="Enter password"
              disabled={savingField !== null && savingField !== 'password'}
              rightIcon={renderStatusIcon('password', hasPasswordChanged, password)}
            />

            {/* Notes */}
            <CustomInput
              label="Notes"
              value={note}
              onChange={setNote}
              size="sm"
              variant="filled"
              multiline={true}
              rows={2}
              placeholder="Add notes about this service"
              disabled={savingField !== null && savingField !== 'note'}
              rightIcon={renderStatusIcon('note', hasNoteChanged, note)}
            />
          </div>

          {/* Metadata Section */}
          <div className="ml-2">
            <Metadata
              metadata={metadata}
              onMetadataChange={handleMetadataChange}
              title="Service Metadata"
              compact={true}
              size="sm"
              collapsible={true}
              defaultExpanded={false}
              allowCreate={true}
              allowEdit={true}
              allowDelete={true}
              protectedFields={['created_at']}
              showDeleteButtons={true}
            />
          </div>
        </div>
      )}
    </div>
  )
}

export default ServiceAccountSection
