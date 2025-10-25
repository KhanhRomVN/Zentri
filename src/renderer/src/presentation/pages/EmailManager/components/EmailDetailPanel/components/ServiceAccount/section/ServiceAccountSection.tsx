// src/renderer/src/presentation/pages/EmailManager/components/ServiceAccountSection.tsx
import React, { useState, useEffect } from 'react'
import { Button } from '../../../../../../../../components/ui/button'
import CustomInput from '../../../../../../../../components/common/CustomInput'
import CustomCombobox from '../../../../../../../../components/common/CustomCombobox'
import Metadata from '../../../../../../../../components/common/Metadata'
import CreateServiceAccountDrawer from '../form/CreateServiceAccountDrawer'
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
  ChevronUp,
  Plus,
  Filter,
  X,
  Search
} from 'lucide-react'
import { cn } from '../../../../../../../../shared/lib/utils'
import { ServiceAccount, Email } from '../../../../../types'
import { Favicon } from '../../../../../../../../shared/utils/faviconUtils'
import ServiceAccountCard from '../card/ServiceAccountCard'
import CustomButton from '../../../../../../../../components/common/CustomButton'

interface ServiceAccountSectionProps {
  // Shared props
  mode?: 'list' | 'detail'
  serviceAccount?: ServiceAccount // For detail mode
  services?: ServiceAccount[] // For list mode
  email?: Email // For list mode
  allServices?: ServiceAccount[] // For list mode

  // List mode props
  showCreateForm?: boolean
  onToggleCreateForm?: (show: boolean) => void
  formDraft?: any
  onFormDraftChange?: (draftData: any) => void
  onServiceAdd?: (service: Omit<ServiceAccount, 'id' | 'email_id'>) => void
  onServiceClick?: (service: ServiceAccount) => void
  compact?: boolean
  showViewDetailsButton?: boolean

  // Detail mode props
  onServiceUpdate?: (serviceId: string, field: string, value: string) => Promise<boolean>

  // Common props
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
  mode = 'list',
  serviceAccount,
  services = [],
  email,
  allServices = [],
  showCreateForm = false,
  onToggleCreateForm,
  formDraft,
  onFormDraftChange,
  onServiceAdd,
  onServiceClick,
  onServiceUpdate,
  className,
  compact = false,
  showViewDetailsButton = false
}) => {
  // ==================== LIST MODE STATE ====================
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedType, setSelectedType] = useState<string>('')
  const [selectedStatus, setSelectedStatus] = useState<string>('')
  const [showFilterPanel] = useState(false)
  const [isCreatingService, setIsCreatingService] = useState(false)

  // ==================== DETAIL MODE STATE ====================
  const [serviceName, setServiceName] = useState('')
  const [serviceType, setServiceType] = useState('')
  const [serviceUrl, setServiceUrl] = useState('')
  const [status, setStatus] = useState<'active' | 'inactive' | 'suspended'>('active')
  const [username, setUsername] = useState('')
  const [name, setName] = useState('')
  const [password, setPassword] = useState('')
  const [note, setNote] = useState('')
  const [metadata, setMetadata] = useState<Record<string, any>>({})
  const [isExpanded, setIsExpanded] = useState(true)
  const [savingField, setSavingField] = useState<string | null>(null)
  const [saveStatus, setSaveStatus] = useState<{ [key: string]: 'success' | 'error' | null }>({})

  // ==================== EFFECTS ====================
  // Reset detail form when serviceAccount changes
  useEffect(() => {
    if (mode === 'detail' && serviceAccount) {
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
    }
  }, [mode, serviceAccount])

  // ==================== LIST MODE LOGIC ====================
  const uniqueTypes = Array.from(new Set(services.map((s) => s.service_type))).sort()
  const uniqueStatuses = Array.from(new Set(services.map((s) => s.status)))
    .filter(Boolean)
    .sort()

  const serviceTypeOptionsForSearch = uniqueTypes.map((type) => ({
    value: type,
    label: type
  }))

  const filteredServices = services.filter((service) => {
    const searchLower = searchTerm.toLowerCase()
    const matchesSearch =
      !searchTerm ||
      service.service_name.toLowerCase().includes(searchLower) ||
      service.service_type.toLowerCase().includes(searchLower) ||
      (service.username && service.username.toLowerCase().includes(searchLower)) ||
      (service.name && service.name.toLowerCase().includes(searchLower)) ||
      (service.metadata && JSON.stringify(service.metadata).toLowerCase().includes(searchLower))

    const matchesType = !selectedType || service.service_type === selectedType
    const matchesStatus = !selectedStatus || service.status === selectedStatus

    return matchesSearch && matchesType && matchesStatus
  })

  const handleAddService = () => {
    if (onToggleCreateForm) {
      onToggleCreateForm(true)
    }
  }

  const handleCreateService = async (serviceData: Omit<ServiceAccount, 'id' | 'email_id'>) => {
    try {
      setIsCreatingService(true)
      if (onServiceAdd) {
        await onServiceAdd(serviceData)
      }
      if (onToggleCreateForm) {
        onToggleCreateForm(false)
      }
      if (onFormDraftChange) {
        onFormDraftChange(null)
      }
    } catch (error) {
      console.error('Error creating service account:', error)
    } finally {
      setIsCreatingService(false)
    }
  }

  const handleCancelCreate = () => {
    if (onToggleCreateForm) {
      onToggleCreateForm(false)
    }
  }

  const handleClearFilters = () => {
    setSelectedType('')
    setSelectedStatus('')
  }

  const hasActiveFilters = selectedType || selectedStatus

  // ==================== DETAIL MODE LOGIC ====================
  const hasServiceNameChanged = serviceName !== (serviceAccount?.service_name || '')
  const hasServiceTypeChanged = serviceType !== (serviceAccount?.service_type || '')
  const hasServiceUrlChanged = serviceUrl !== (serviceAccount?.service_url || '')
  const hasStatusChanged = status !== (serviceAccount?.status || 'active')
  const hasUsernameChanged = username !== (serviceAccount?.username || '')
  const hasNameChanged = name !== (serviceAccount?.name || '')
  const hasPasswordChanged = password !== (serviceAccount?.password || '')
  const hasNoteChanged = note !== (serviceAccount?.note || '')

  const handleSaveField = async (field: string, value: string) => {
    if (!serviceAccount?.id || !onServiceUpdate) {
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

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text)
    } catch (err) {
      console.error('Failed to copy:', err)
    }
  }

  const handleServiceTypeChange = (value: string | string[]) => {
    const newType = Array.isArray(value) ? value[0] : value
    setServiceType(newType as ServiceAccount['service_type'])
  }

  const handleStatusChange = (value: string | string[]) => {
    const newStatus = Array.isArray(value) ? value[0] : value
    setStatus(newStatus as 'active' | 'inactive' | 'suspended')
  }

  const handleMetadataChange = (newMetadata: Record<string, any>) => {
    setMetadata(newMetadata)
  }

  const getServiceTypeLabel = (type: string) => {
    const option = serviceTypeOptions.find((opt) => opt.value === type)
    return option ? option.label : type.replace(/_/g, ' ')
  }

  const handleExternalLink = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (serviceUrl) {
      window.open(serviceUrl, '_blank')
    }
  }

  // ==================== RENDER LIST MODE ====================
  if (mode === 'list') {
    return (
      <div className={cn('space-y-6', className)}>
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold text-text-primary flex items-center gap-2">
              <Globe className="h-5 w-5 text-purple-600 dark:text-purple-400" />
              Service Accounts
            </h3>
            <p className="text-gray-600 dark:text-gray-400 text-sm mt-1">
              {services.length} service{services.length !== 1 ? 's' : ''} connected
            </p>
          </div>
          <CustomButton size="sm" variant="primary" icon={Plus} onClick={handleAddService}>
            Add Service
          </CustomButton>
        </div>

        {/* Create Service Drawer */}
        {email && (
          <CreateServiceAccountDrawer
            isOpen={showCreateForm}
            email={email}
            existingServices={services}
            allServices={allServices}
            onSubmit={handleCreateService}
            loading={isCreatingService}
            onClose={handleCancelCreate}
            initialData={formDraft}
            onDataChange={onFormDraftChange}
          />
        )}

        {/* Search and Filters */}
        {services.length > 0 && (
          <div className="space-y-3">
            <div className="flex gap-3">
              <div className="flex-1">
                <CustomCombobox
                  label=""
                  placeholder="Search by name, type, username, display name, metadata..."
                  value={searchTerm}
                  options={serviceTypeOptionsForSearch}
                  onChange={(val) => setSearchTerm(typeof val === 'string' ? val : '')}
                  searchable={true}
                  creatable={false}
                  size="sm"
                />
              </div>
            </div>

            {/* Filter Panel */}
            {showFilterPanel && (
              <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700 space-y-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-2">
                    <Filter className="h-4 w-4" />
                    Filter Services
                  </h3>
                  {hasActiveFilters && (
                    <button
                      onClick={handleClearFilters}
                      className="text-xs text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 flex items-center gap-1"
                    >
                      <X className="h-3 w-3" />
                      Clear all
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Service Type Filter */}
                  <div>
                    <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Service Type
                    </label>
                    <select
                      value={selectedType}
                      onChange={(e) => setSelectedType(e.target.value)}
                      className="w-full px-3 py-2 text-sm bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                    >
                      <option value="">All Types</option>
                      {uniqueTypes.map((type) => (
                        <option key={type} value={type}>
                          {type}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Status Filter */}
                  <div>
                    <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Status
                    </label>
                    <select
                      value={selectedStatus}
                      onChange={(e) => setSelectedStatus(e.target.value)}
                      className="w-full px-3 py-2 text-sm bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                    >
                      <option value="">All Statuses</option>
                      {uniqueStatuses.map((status) => (
                        <option key={status} value={status}>
                          {status}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Active Filters Display */}
                {hasActiveFilters && (
                  <div className="pt-3 border-t border-gray-200 dark:border-gray-700">
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">Active filters:</p>
                    <div className="flex flex-wrap gap-2">
                      {selectedType && (
                        <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-xs rounded-md">
                          Type: {selectedType}
                          <button
                            onClick={() => setSelectedType('')}
                            className="hover:bg-blue-200 dark:hover:bg-blue-800 rounded-full p-0.5"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </span>
                      )}
                      {selectedStatus && (
                        <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 text-xs rounded-md">
                          Status: {selectedStatus}
                          <button
                            onClick={() => setSelectedStatus('')}
                            className="hover:bg-green-200 dark:hover:bg-green-800 rounded-full p-0.5"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </span>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Services List */}
        {filteredServices.length > 0 ? (
          <>
            {compact ? (
              // Compact mode - single column
              <div className="grid grid-cols-1 gap-4">
                {filteredServices.slice(0, Math.min(5, filteredServices.length)).map((service) => (
                  <ServiceAccountCard
                    key={service.id}
                    service={service}
                    onServiceClick={showViewDetailsButton ? onServiceClick : undefined}
                    onServiceView={onServiceClick}
                    onServiceUpdate={onServiceUpdate}
                    defaultExpanded={false}
                  />
                ))}

                {/* "More" button when there are more than 5 services */}
                {filteredServices.length > 5 && (
                  <div className="text-center pt-4">
                    <CustomButton
                      variant="secondary"
                      size="md"
                      onClick={() => {
                        if (onServiceClick) {
                          onServiceClick({ view: 'all_services' } as any)
                        }
                      }}
                      className="border-dashed border-2 border-blue-300 hover:border-blue-400 text-blue-600 hover:bg-blue-50 dark:border-blue-600 dark:text-blue-400 dark:hover:bg-blue-900/20"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      View All Services ({filteredServices.length - 5} more)
                    </CustomButton>
                  </div>
                )}
              </div>
            ) : (
              // Full mode - two columns
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Column 1 */}
                <div className="space-y-4">
                  {filteredServices
                    .filter((_, index) => index % 2 === 0)
                    .map((service) => (
                      <ServiceAccountCard
                        key={service.id}
                        service={service}
                        onServiceClick={showViewDetailsButton ? onServiceClick : undefined}
                        onServiceView={onServiceClick}
                        onServiceUpdate={onServiceUpdate}
                        defaultExpanded={false}
                      />
                    ))}
                </div>

                {/* Column 2 */}
                <div className="space-y-4">
                  {filteredServices
                    .filter((_, index) => index % 2 === 1)
                    .map((service) => (
                      <ServiceAccountCard
                        key={service.id}
                        service={service}
                        onServiceClick={showViewDetailsButton ? onServiceClick : undefined}
                        onServiceView={onServiceClick}
                        onServiceUpdate={onServiceUpdate}
                        defaultExpanded={false}
                      />
                    ))}
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-12 bg-card-background rounded-xl border border-gray-200 dark:border-gray-700">
            <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
              {services.length === 0 ? (
                <Globe className="h-8 w-8 text-gray-400" />
              ) : (
                <Search className="h-8 w-8 text-gray-400" />
              )}
            </div>
            <h3 className="text-lg font-medium text-text-primary mb-2">
              {services.length === 0 ? 'No service accounts' : 'No services found'}
            </h3>
            <p className="text-gray-500 dark:text-gray-400 mb-4">
              {services.length === 0
                ? 'Connect your first service account to get started'
                : 'Try adjusting your search or filters'}
            </p>
            {services.length === 0 && (
              <Button
                onClick={handleAddService}
                className="bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700"
              >
                <Plus className="h-4 w-4 mr-1" />
                Add First Service
              </Button>
            )}
          </div>
        )}
      </div>
    )
  }

  // ==================== RENDER DETAIL MODE ====================
  if (mode === 'detail' && serviceAccount) {
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
                  <h3 className="text-sm font-semibold text-text-primary truncate">
                    {serviceName}
                  </h3>
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
                        className="p-1 h-6 w-6 text-green-600
hover:text-green-700 hover:bg-green-50"
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

  return null
}

export default ServiceAccountSection
