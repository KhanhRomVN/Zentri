// src/renderer/src/presentation/pages/EmailManager/components/ServiceAccountSection.tsx
import React, { useState } from 'react'
import { Button } from '../../../../../../../../components/ui/button'
import CustomCombobox from '../../../../../../../../components/common/CustomCombobox'
import CreateServiceAccountDrawer from '../form/CreateServiceAccountDrawer'
import { Globe, Plus, Filter, X, Search } from 'lucide-react'
import { cn } from '../../../../../../../../shared/lib/utils'
import { ServiceAccount, Email } from '../../../../../types'
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
  onServiceClick?: (
    service: ServiceAccount,
    targetTab?: 'service_security' | 'service_secret'
  ) => void
  compact?: boolean
  showViewDetailsButton?: boolean

  // Detail mode props
  onServiceUpdate?: (serviceId: string, field: string, value: string) => Promise<boolean>

  // Common props
  className?: string
}

const ServiceAccountSection: React.FC<ServiceAccountSectionProps> = ({
  mode = 'list',
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
                    onServiceView={(service, targetTab) => {
                      if (onServiceClick) {
                        onServiceClick(service, targetTab)
                      }
                    }}
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
                        onServiceView={(service, targetTab) => {
                          if (onServiceClick) {
                            onServiceClick(service, targetTab)
                          }
                        }}
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
                        onServiceView={(service, targetTab) => {
                          if (onServiceClick) {
                            onServiceClick(service, targetTab)
                          }
                        }}
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

  return null
}

export default ServiceAccountSection
