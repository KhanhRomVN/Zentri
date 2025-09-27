import React, { useState, useEffect } from 'react'
import { Button } from '../../../../../../components/ui/button'
import CustomInput from '../../../../../../components/common/CustomInput'
import CustomCombobox from '../../../../../../components/common/CustomCombobox'
import Metadata from '../../../../../../components/common/Metadata'
import {
  ExternalLink,
  User,
  ChevronRight,
  ChevronDown,
  Globe,
  Shield,
  Eye,
  Copy,
  Key,
  Link,
  Database,
  Check
} from 'lucide-react'
import { cn } from '../../../../../../shared/lib/utils'
import { ServiceAccount, ServiceAccount2FA, ServiceAccountSecret } from '../../../types'
import { Favicon } from '../../../../../../shared/utils/faviconUtils'

interface ServiceAccountCardProps {
  service: ServiceAccount
  onServiceClick?: (service: ServiceAccount) => void
  onServiceView?: (service: ServiceAccount) => void
  onServiceUpdate?: (serviceId: string, field: string, value: string) => Promise<boolean>
  serviceSecrets?: ServiceAccountSecret[]
  service2FA?: ServiceAccount2FA[]
  className?: string
  defaultExpanded?: boolean
  showNestedServices?: boolean
  nestedServices?: ServiceAccount[]
}

// Service type options for the dropdown
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

// Status options for the dropdown
const statusOptions = [
  { value: 'active', label: 'Active' },
  { value: 'inactive', label: 'Inactive' },
  { value: 'suspended', label: 'Suspended' }
]

const ServiceAccountCard: React.FC<ServiceAccountCardProps> = ({
  service,
  onServiceClick,
  onServiceView,
  onServiceUpdate,
  serviceSecrets = [],
  service2FA = [],
  className,
  defaultExpanded = false,
  showNestedServices = false,
  nestedServices = []
}) => {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded)

  // Editable fields - khởi tạo từ service prop
  const [serviceName, setServiceName] = useState(service.service_name)
  const [serviceType, setServiceType] = useState(service.service_type)
  const [serviceUrl, setServiceUrl] = useState(service.service_url || '')
  const [status, setStatus] = useState(service.status || 'active')
  const [username, setUsername] = useState(service.username || '')
  const [name, setName] = useState(service.name || '')
  const [password, setPassword] = useState(service.password || '')
  const [note, setNote] = useState(service.note || '')
  const [metadata, setMetadata] = useState(service.metadata || {})

  // State để theo dõi trạng thái loading và feedback
  const [savingField, setSavingField] = useState<string | null>(null)
  const [saveStatus, setSaveStatus] = useState<{ [key: string]: 'success' | 'error' | null }>({})

  // Reset edited data khi service prop thay đổi
  useEffect(() => {
    setServiceName(service.service_name)
    setServiceType(service.service_type)
    setServiceUrl(service.service_url || '')
    setStatus(service.status || 'active')
    setUsername(service.username || '')
    setName(service.name || '')
    setPassword(service.password || '')
    setNote(service.note || '')
    setMetadata(service.metadata || {})
    setSaveStatus({})
  }, [service])

  // Get service type label
  const getServiceTypeLabel = (type: string) => {
    const option = serviceTypeOptions.find((opt) => opt.value === type)
    return option ? option.label : type.replace(/_/g, ' ')
  }

  // Get stats for collapsed view
  const getServiceStats = () => {
    return {
      hasPassword: !!service.password,
      secretsCount: serviceSecrets.length,
      twoFACount: service2FA.length
    }
  }

  const stats = getServiceStats()

  // Check if values have changed
  const hasServiceNameChanged = serviceName !== service.service_name
  const hasServiceTypeChanged = serviceType !== service.service_type
  const hasServiceUrlChanged = serviceUrl !== (service.service_url || '')
  const hasUsernameChanged = username !== (service.username || '')
  const hasNameChanged = name !== (service.name || '')
  const hasPasswordChanged = password !== (service.password || '')
  const hasNoteChanged = note !== (service.note || '')

  // Hàm xử lý lưu field
  const handleSaveField = async (field: string, value: string) => {
    if (!service.id || !onServiceUpdate) {
      console.error('Missing service ID or update function')
      return
    }

    try {
      setSavingField(field)

      // Gọi hàm update từ parent
      const success = await onServiceUpdate(service.id, field, value)

      if (success) {
        setSaveStatus((prev) => ({ ...prev, [field]: 'success' }))
        // Reset status sau 2 giây
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

  // Hàm render icon trạng thái cho input
  const renderStatusIcon = (field: string, hasChanged: boolean, currentValue: string) => {
    if (savingField === field) {
      return <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
    }

    if (saveStatus[field] === 'success') {
      return <Check className="h-4 w-4 text-green-600" />
    }

    if (saveStatus[field] === 'error') {
      return <div className="text-red-600">!</div>
    }

    if (hasChanged) {
      return (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => handleSaveField(field, currentValue)}
          className="p-0.5 h-5 w-5 text-green-600 hover:text-green-700 hover:bg-green-50"
          disabled={savingField !== null}
        >
          <Check className="h-2.5 w-2.5" />
        </Button>
      )
    }

    return undefined
  }

  // Handle card click - toggle expand/collapse
  const handleCardClick = (e: React.MouseEvent) => {
    // Don't expand if clicking on buttons or inputs
    if ((e.target as HTMLElement).closest('button') || (e.target as HTMLElement).closest('input'))
      return
    setIsExpanded(!isExpanded)
  }

  const handleExternalLink = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (service.service_url) {
      window.open(service.service_url, '_blank')
    }
  }

  const handleView = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (onServiceView) {
      onServiceView(service)
    } else if (onServiceClick) {
      onServiceClick(service)
    }
  }

  const copyToClipboard = (text: string, e: React.MouseEvent) => {
    e.stopPropagation()
    navigator.clipboard.writeText(text)
  }

  const handleNestedServiceClick = (nestedService: ServiceAccount) => {
    if (onServiceClick) {
      onServiceClick(nestedService)
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
  const handleMetadataChange = async (newMetadata: Record<string, any>) => {
    setMetadata(newMetadata)

    // Lưu metadata vào database
    if (service.id && onServiceUpdate) {
      try {
        setSavingField('metadata')
        const success = await onServiceUpdate(service.id, 'metadata', JSON.stringify(newMetadata))

        if (success) {
          setSaveStatus((prev) => ({ ...prev, metadata: 'success' }))
          // Reset status sau 2 giây
          setTimeout(() => {
            setSaveStatus((prev) => ({ ...prev, metadata: null }))
          }, 2000)
        } else {
          setSaveStatus((prev) => ({ ...prev, metadata: 'error' }))
        }
      } catch (error) {
        console.error('Error saving metadata:', error)
        setSaveStatus((prev) => ({ ...prev, metadata: 'error' }))
      } finally {
        setSavingField(null)
      }
    }
  }

  const handleMetadataDelete = async (key: string) => {
    const newMetadata = { ...metadata }
    delete newMetadata[key]

    await handleMetadataChange(newMetadata)
  }

  return (
    <div
      className={cn(
        'group relative bg-card-background rounded-lg border border-gray-100 dark:border-gray-700 shadow-sm transition-all duration-200 overflow-hidden cursor-pointer hover:shadow-md hover:border-blue-200 dark:hover:border-blue-600',
        className
      )}
      onClick={handleCardClick}
    >
      {/* Status Indicator */}
      <div
        className={cn(
          'absolute top-0 left-0 w-1 h-full',
          service.status === 'active'
            ? 'bg-emerald-500'
            : service.status === 'suspended'
              ? 'bg-red-500'
              : 'bg-gray-400'
        )}
      />

      {/* Collapsed View */}
      <div className="p-3 transition-all duration-200">
        <div className="flex items-center justify-between">
          {/* Left Section - Favicon + Service Info */}
          <div className="flex items-center gap-3 flex-1 min-w-0 pl-2">
            {/* Service Favicon */}
            <div className="relative flex-shrink-0">
              <Favicon
                url={service.service_url}
                size={24}
                className="rounded"
                fallbackIcon={<Globe className="h-4 w-4 text-gray-600" />}
              />
              {/* Status Dot */}
              <div
                className={cn(
                  'absolute -bottom-1 -right-1 w-3 h-3 rounded-full border-2 border-white dark:border-gray-800',
                  service.status === 'active'
                    ? 'bg-emerald-500'
                    : service.status === 'suspended'
                      ? 'bg-red-500'
                      : 'bg-gray-400'
                )}
              />
            </div>

            {/* Service Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <h3 className="text-sm font-semibold text-text-primary truncate">
                  {service.service_name}
                </h3>
                {service.service_url && (
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
                {getServiceTypeLabel(service.service_type)} • {service.status || 'unknown'}
              </div>
            </div>
          </div>

          {/* Right Section - Stats + Actions + Expand Button */}
          <div className="flex items-center gap-2">
            {/* Service Stats */}
            <div className="flex items-center gap-1">
              {stats.hasPassword && (
                <div className="flex items-center justify-center w-5 h-5 bg-amber-100 dark:bg-amber-900/20 rounded">
                  <Key className="h-2.5 w-2.5 text-amber-600 dark:text-amber-400" />
                </div>
              )}
              {stats.secretsCount > 0 && (
                <div className="flex items-center justify-center w-5 h-5 bg-purple-100 dark:bg-purple-900/20 rounded">
                  <Database className="h-2.5 w-2.5 text-purple-600 dark:text-purple-400" />
                  <span className="text-xs font-bold text-purple-700 dark:text-purple-300 ml-0.5">
                    {stats.secretsCount}
                  </span>
                </div>
              )}
              {stats.twoFACount > 0 && (
                <div className="flex items-center justify-center w-5 h-5 bg-green-100 dark:bg-green-900/20 rounded">
                  <Shield className="h-2.5 w-2.5 text-green-600 dark:text-green-400" />
                  <span className="text-xs font-bold text-green-700 dark:text-green-300 ml-0.5">
                    {stats.twoFACount}
                  </span>
                </div>
              )}
            </div>

            {/* View Details Button */}
            <Button
              variant="ghost"
              size="sm"
              onClick={handleView}
              className="p-0.5 h-5 w-5 text-gray-400 hover:text-blue-600 opacity-0 group-hover:opacity-100 transition-opacity"
              title="View service details"
            >
              <Eye className="h-3 w-3" />
            </Button>

            {/* Expand/Collapse Button */}
            <Button
              variant="ghost"
              size="sm"
              className="p-0.5 h-5 w-5 text-gray-400 hover:text-gray-600"
            >
              {isExpanded ? (
                <ChevronDown className="h-3 w-3 transition-transform" />
              ) : (
                <ChevronRight className="h-3 w-3 transition-transform" />
              )}
            </Button>
          </div>
        </div>
      </div>

      {/* Expanded View */}
      {isExpanded && (
        <div className="px-3 pb-3 space-y-4 animate-in slide-in-from-top-2 duration-300">
          {/* Divider */}
          <div className="border-t border-gray-100 dark:border-gray-700 ml-2" />

          {/* Header */}
          <div className="flex items-center justify-between ml-2">
            <div className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Service Details
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
                      onClick={(e) => copyToClipboard(serviceName, e)}
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
                        onClick={(e) => copyToClipboard(serviceUrl, e)}
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
                      onClick={(e) => copyToClipboard(username, e)}
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
                      onClick={(e) => copyToClipboard(name, e)}
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
              onDelete={handleMetadataDelete}
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

          {/* Nested Services List */}
          {showNestedServices && nestedServices && nestedServices.length > 0 && (
            <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-700 ml-2">
              <div className="mb-3">
                <h4 className="text-sm font-semibold text-text-primary">
                  Related Services ({nestedServices.length})
                </h4>
              </div>
              <div className="space-y-2">
                {nestedServices.map((nestedService) => (
                  <ServiceAccountCard
                    key={nestedService.id}
                    service={nestedService}
                    onServiceClick={handleNestedServiceClick}
                    onServiceView={onServiceView}
                    onServiceUpdate={onServiceUpdate}
                    className="ml-4 border-l-2 border-blue-200 dark:border-blue-700"
                    defaultExpanded={false}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default ServiceAccountCard
