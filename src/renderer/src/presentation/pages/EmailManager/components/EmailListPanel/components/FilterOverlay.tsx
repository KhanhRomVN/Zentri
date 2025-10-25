// src/renderer/src/presentation/pages/EmailManager/components/EmailListPanel/components/FilterOverlay.tsx
import React from 'react'
import CustomOverlay from '../../../../../../components/common/CustomOverlay'
import CustomButton from '../../../../../../components/common/CustomButton'
import CustomCombobox from '../../../../../../components/common/CustomCombobox'
import CustomInput from '../../../../../../components/common/CustomInput'
import { Filter, X, RotateCcw } from 'lucide-react'
import { cn } from '../../../../../../shared/lib/utils'

interface FilterOverlayProps {
  isOpen: boolean
  onClose: () => void
  filters: {
    email_address: string
    provider: string[]
    name: string
    age: string
    recovery_email: string[]
    tags: string[]
    email2FA: string[]
    serviceAccount: string[]
    service_type: string[]
  }
  onFiltersChange: (filters: {
    email_address: string
    provider: string[]
    name: string
    age: string
    recovery_email: string[]
    tags: string[]
    email2FA: string[]
    serviceAccount: string[]
    service_type: string[]
  }) => void
  availableProviders: string[]
  availableTags: string[]
  availableRecoveryEmails: string[]
  availableEmail2FA: string[]
  availableServiceAccounts: string[]
  availableServiceTypes: string[]
  className?: string
}

const FilterOverlay: React.FC<FilterOverlayProps> = ({
  isOpen,
  onClose,
  filters,
  onFiltersChange,
  availableProviders,
  availableTags,
  availableRecoveryEmails,
  availableEmail2FA,
  availableServiceTypes,
  className
}) => {
  const hasActiveFilters =
    (filters.email_address?.trim() || '') !== '' ||
    (filters.provider?.length || 0) > 0 ||
    (filters.name?.trim() || '') !== '' ||
    (filters.age?.trim() || '') !== '' ||
    (filters.recovery_email?.length || 0) > 0 ||
    (filters.tags?.length || 0) > 0 ||
    (filters.email2FA?.length || 0) > 0 ||
    (filters.serviceAccount?.length || 0) > 0 ||
    (filters.service_type?.length || 0) > 0

  const handleProviderChange = (values: string | string[]) => {
    const providers = Array.isArray(values) ? values : [values]
    onFiltersChange({ ...filters, provider: providers })
  }

  const handleTagsChange = (tags: string[]) => {
    onFiltersChange({ ...filters, tags })
  }

  const handleRecoveryEmailChange = (values: string | string[]) => {
    const recovery_email = Array.isArray(values) ? values : values ? [values] : []
    onFiltersChange({ ...filters, recovery_email })
  }

  const handleEmail2FAChange = (values: string | string[]) => {
    const email2FA = Array.isArray(values) ? values : [values]
    onFiltersChange({ ...filters, email2FA })
  }

  const handleServiceTypeChange = (values: string | string[]) => {
    const service_type = Array.isArray(values) ? values : [values]
    onFiltersChange({ ...filters, service_type })
  }

  const handleReset = () => {
    const resetFilters = {
      email_address: '',
      provider: [],
      name: '',
      age: '',
      recovery_email: [],
      tags: [],
      email2FA: [],
      serviceAccount: [],
      service_type: []
    }
    onFiltersChange(resetFilters)
  }

  const providerOptions = (availableProviders || [])
    .filter((provider) => provider && typeof provider === 'string')
    .map((provider) => ({
      value: provider,
      label: provider.charAt(0).toUpperCase() + provider.slice(1)
    }))

  const email2FAOptions = (availableEmail2FA || [])
    .filter((method) => method && typeof method === 'string')
    .map((method) => ({
      value: method,
      label: method
        .split('_')
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ')
    }))

  const serviceTypeOptions = (availableServiceTypes || [])
    .filter((type) => type && typeof type === 'string')
    .map((type) => ({
      value: type,
      label: type
        .split('_')
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ')
    }))

  return (
    <CustomOverlay
      isOpen={isOpen}
      onClose={onClose}
      title="Filter Emails"
      subtitle={
        hasActiveFilters
          ? `${
              [
                filters.email_address,
                filters.name,
                filters.age,
                ...(filters.provider || []),
                ...(filters.recovery_email || []),
                ...(filters.tags || []),
                ...(filters.email2FA || []),
                ...(filters.serviceAccount || []),
                ...(filters.service_type || [])
              ].filter((v) => v && v.trim && v.trim() !== '').length
            } filter(s) active`
          : 'No filters applied'
      }
      position="right"
      width="380px"
      height="auto"
      gap={4}
      animationType="slide"
      showCloseButton={true}
      className={className}
      footerActions={
        hasActiveFilters ? (
          <CustomButton variant="ghost" size="sm" onClick={handleReset} icon={RotateCcw}>
            Reset All Filters
          </CustomButton>
        ) : undefined
      }
    >
      <div className="p-4 space-y-6">
        {/* Filter Info */}
        <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3 border border-blue-200 dark:border-blue-800">
          <div className="flex items-start gap-2">
            <Filter className="h-4 w-4 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-sm text-blue-800 dark:text-blue-300">
                Filter your email accounts by multiple criteria to quickly find what you need.
              </p>
            </div>
          </div>
        </div>

        {/* Email Address Filter */}
        <div className="space-y-2">
          <CustomInput
            label="Email Address"
            value={filters.email_address}
            onChange={(value) => onFiltersChange({ ...filters, email_address: value })}
            placeholder="Search by email address..."
            variant="primary"
            size="sm"
          />
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Filter by specific email address
          </p>
        </div>

        {/* Email Provider Filter */}
        <div className="space-y-2">
          <CustomCombobox
            label="Email Provider"
            value={filters.provider}
            options={providerOptions}
            onChange={handleProviderChange}
            placeholder="Select providers..."
            multiple={true}
            searchable={true}
            size="sm"
          />
        </div>

        {/* Name Filter */}
        <div className="space-y-2">
          <CustomInput
            label="Name"
            value={filters.name}
            onChange={(value) => onFiltersChange({ ...filters, name: value })}
            placeholder="Search by name..."
            variant="primary"
            size="sm"
          />
          <p className="text-xs text-gray-500 dark:text-gray-400">Filter by account holder name</p>
        </div>

        {/* Age Filter */}
        <div className="space-y-2">
          <CustomInput
            label="Age"
            value={filters.age}
            onChange={(value) => onFiltersChange({ ...filters, age: value })}
            placeholder="Search by age..."
            variant="primary"
            size="sm"
            type="number"
          />
          <p className="text-xs text-gray-500 dark:text-gray-400">Filter by account holder age</p>
        </div>

        {/* Recovery Email Filter */}
        <div className="space-y-2">
          <CustomCombobox
            label="Recovery Email"
            value={filters.recovery_email}
            options={(availableRecoveryEmails || []).map((email) => ({
              value: email,
              label: email
            }))}
            onChange={handleRecoveryEmailChange}
            placeholder="Select recovery emails..."
            multiple={true}
            searchable={true}
            size="sm"
          />
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Filter by recovery email addresses
          </p>
        </div>

        {/* Tags Filter */}
        <div className="space-y-2">
          <CustomCombobox
            label="Tags"
            value={filters.tags}
            options={(availableTags || []).map((tag) => ({ value: tag, label: tag }))}
            onChange={(values) => handleTagsChange(Array.isArray(values) ? values : [values])}
            placeholder="Select tags..."
            multiple={true}
            searchable={true}
            size="sm"
          />
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Filter by custom tags you've assigned to emails
          </p>
        </div>

        {/* Email 2FA Filter */}
        <div className="space-y-2">
          <CustomCombobox
            label="Email 2FA Methods"
            value={filters.email2FA}
            options={email2FAOptions}
            onChange={handleEmail2FAChange}
            placeholder="Select 2FA methods..."
            multiple={true}
            searchable={true}
            size="sm"
          />
          <p className="text-xs text-gray-500 dark:text-gray-400">Filter by 2FA security methods</p>
        </div>

        {/* Service Account Filter */}
        <div className="space-y-2">
          <CustomCombobox
            label="Service Type"
            value={filters.service_type}
            options={serviceTypeOptions}
            onChange={handleServiceTypeChange}
            placeholder="Select service types..."
            multiple={true}
            searchable={true}
            size="sm"
          />
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Filter by connected service accounts
          </p>
        </div>

        {/* Service Type Filter */}
        <div className="space-y-2">
          <CustomCombobox
            label="Service Type"
            value={filters.service_type}
            options={serviceTypeOptions}
            onChange={handleServiceTypeChange}
            placeholder="Select service types..."
            multiple={true}
            searchable={true}
            size="sm"
          />
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Filter by type of service (Social Media, Cloud Storage, etc.)
          </p>
        </div>

        {/* Active Filters Display */}
        {hasActiveFilters && (
          <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Active Filters
              </span>
              <button
                onClick={handleReset}
                className="text-xs text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 flex items-center gap-1"
              >
                <X className="h-3 w-3" />
                Clear all
              </button>
            </div>

            <div className="space-y-2">
              {/* Email Address */}
              {filters.email_address?.trim() !== '' && (
                <div className="space-y-2">
                  <span className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                    Email Address
                  </span>
                  <div className="flex flex-wrap gap-2">
                    <span
                      className={cn(
                        'inline-flex items-center gap-1 px-2 py-1',
                        'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300',
                        'text-xs rounded-md font-medium'
                      )}
                    >
                      {filters.email_address}
                      <button
                        onClick={() => {
                          onFiltersChange({ ...filters, email_address: '' })
                        }}
                        className="hover:bg-blue-200 dark:hover:bg-blue-800 rounded-full p-0.5"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </span>
                  </div>
                </div>
              )}

              {/* Provider Tags */}
              {(filters.provider?.length || 0) > 0 && (
                <div className="space-y-2">
                  <span className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                    Providers
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {filters.provider.map((provider) => (
                      <span
                        key={provider}
                        className={cn(
                          'inline-flex items-center gap-1 px-2 py-1',
                          'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300',
                          'text-xs rounded-md font-medium'
                        )}
                      >
                        {provider}
                        <button
                          onClick={() => {
                            onFiltersChange({
                              ...filters,
                              provider: filters.provider.filter((p) => p !== provider)
                            })
                          }}
                          className="hover:bg-blue-200 dark:hover:bg-blue-800 rounded-full p-0.5"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Name */}
              {filters.name?.trim() !== '' && (
                <div className="space-y-2">
                  <span className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                    Name
                  </span>
                  <div className="flex flex-wrap gap-2">
                    <span
                      className={cn(
                        'inline-flex items-center gap-1 px-2 py-1',
                        'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300',
                        'text-xs rounded-md font-medium'
                      )}
                    >
                      {filters.name}
                      <button
                        onClick={() => {
                          onFiltersChange({ ...filters, name: '' })
                        }}
                        className="hover:bg-green-200 dark:hover:bg-green-800 rounded-full p-0.5"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </span>
                  </div>
                </div>
              )}

              {/* Age */}
              {filters.age?.trim() !== '' && (
                <div className="space-y-2">
                  <span className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                    Age
                  </span>
                  <div className="flex flex-wrap gap-2">
                    <span
                      className={cn(
                        'inline-flex items-center gap-1 px-2 py-1',
                        'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300',
                        'text-xs rounded-md font-medium'
                      )}
                    >
                      {filters.age}
                      <button
                        onClick={() => {
                          onFiltersChange({ ...filters, age: '' })
                        }}
                        className="hover:bg-orange-200 dark:hover:bg-orange-800 rounded-full p-0.5"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </span>
                  </div>
                </div>
              )}

              {/* Recovery Email */}
              {(filters.recovery_email?.length || 0) > 0 && (
                <div className="space-y-2">
                  <span className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                    Recovery Email
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {filters.recovery_email.map((email) => (
                      <span
                        key={email}
                        className={cn(
                          'inline-flex items-center gap-1 px-2 py-1',
                          'bg-teal-100 dark:bg-teal-900/30 text-teal-700 dark:text-teal-300',
                          'text-xs rounded-md font-medium'
                        )}
                      >
                        {email}
                        <button
                          onClick={() => {
                            onFiltersChange({
                              ...filters,
                              recovery_email: filters.recovery_email.filter((e) => e !== email)
                            })
                          }}
                          className="hover:bg-teal-200 dark:hover:bg-teal-800 rounded-full p-0.5"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Tag Filters */}
              {(filters.tags?.length || 0) > 0 && (
                <div className="space-y-2">
                  <span className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                    Tags
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {filters.tags.map((tag) => (
                      <span
                        key={tag}
                        className={cn(
                          'inline-flex items-center gap-1 px-2 py-1',
                          'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300',
                          'text-xs rounded-md font-medium'
                        )}
                      >
                        {tag}
                        <button
                          onClick={() => {
                            onFiltersChange({
                              ...filters,
                              tags: filters.tags.filter((t) => t !== tag)
                            })
                          }}
                          className="hover:bg-purple-200 dark:hover:bg-purple-800 rounded-full p-0.5"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Email 2FA */}
              {(filters.email2FA?.length || 0) > 0 && (
                <div className="space-y-2">
                  <span className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                    Email 2FA
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {filters.email2FA.map((method) => (
                      <span
                        key={method}
                        className={cn(
                          'inline-flex items-center gap-1 px-2 py-1',
                          'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300',
                          'text-xs rounded-md font-medium'
                        )}
                      >
                        {method
                          .split('_')
                          .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
                          .join(' ')}
                        <button
                          onClick={() => {
                            onFiltersChange({
                              ...filters,
                              email2FA: filters.email2FA.filter((m) => m !== method)
                            })
                          }}
                          className="hover:bg-red-200 dark:hover:bg-red-800 rounded-full p-0.5"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Service Account */}
              {(filters.serviceAccount?.length || 0) > 0 && (
                <div className="space-y-2">
                  <span className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                    Service Accounts
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {filters.serviceAccount.map((service) => (
                      <span
                        key={service}
                        className={cn(
                          'inline-flex items-center gap-1 px-2 py-1',
                          'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300',
                          'text-xs rounded-md font-medium'
                        )}
                      >
                        {service}
                        <button
                          onClick={() => {
                            onFiltersChange({
                              ...filters,
                              serviceAccount: filters.serviceAccount.filter((s) => s !== service)
                            })
                          }}
                          className="hover:bg-indigo-200 dark:hover:bg-indigo-800 rounded-full p-0.5"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Service Type */}
              {(filters.service_type?.length || 0) > 0 && (
                <div className="space-y-2">
                  <span className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                    Service Type
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {filters.service_type.map((type) => (
                      <span
                        key={type}
                        className={cn(
                          'inline-flex items-center gap-1 px-2 py-1',
                          'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300',
                          'text-xs rounded-md font-medium'
                        )}
                      >
                        {type
                          .split('_')
                          .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
                          .join(' ')}
                        <button
                          onClick={() => {
                            onFiltersChange({
                              ...filters,
                              service_type: filters.service_type.filter((t) => t !== type)
                            })
                          }}
                          className="hover:bg-amber-200 dark:hover:bg-amber-800 rounded-full p-0.5"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* No Filters State */}
        {!hasActiveFilters && (
          <div className="text-center py-6">
            <div className="w-12 h-12 bg-gray-100 dark:bg-gray-700 rounded-xl flex items-center justify-center mx-auto mb-3">
              <Filter className="h-6 w-6 text-gray-400" />
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              No filters active. Use the options above to filter your emails.
            </p>
          </div>
        )}
      </div>
    </CustomOverlay>
  )
}

export default FilterOverlay
