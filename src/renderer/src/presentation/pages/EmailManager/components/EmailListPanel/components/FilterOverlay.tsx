// src/renderer/src/presentation/pages/EmailManager/components/EmailListPanel/components/FilterOverlay.tsx
import React, { useState } from 'react'
import CustomOverlay from '../../../../../../components/common/CustomOverlay'
import CustomButton from '../../../../../../components/common/CustomButton'
import CustomCombobox from '../../../../../../components/common/CustomCombobox'
import { Filter, X, RotateCcw } from 'lucide-react'
import { cn } from '../../../../../../shared/lib/utils'

interface FilterOverlayProps {
  isOpen: boolean
  onClose: () => void
  filters: {
    provider: string[]
    tags: string[]
  }
  onFiltersChange: (filters: { provider: string[]; tags: string[] }) => void
  availableProviders: string[]
  availableTags: string[]
  className?: string
}

const FilterOverlay: React.FC<FilterOverlayProps> = ({
  isOpen,
  onClose,
  filters,
  onFiltersChange,
  availableProviders,
  availableTags,
  className
}) => {
  // Local state for temp filters
  const [tempFilters, setTempFilters] = useState(filters)

  // Update temp filters when filters prop changes
  React.useEffect(() => {
    setTempFilters(filters)
  }, [filters])

  const hasActiveFilters = tempFilters.provider.length > 0 || tempFilters.tags.length > 0

  const handleProviderChange = (values: string | string[]) => {
    const providers = Array.isArray(values) ? values : [values]
    setTempFilters((prev) => ({ ...prev, provider: providers }))
  }

  const handleTagsChange = (values: string | string[]) => {
    const tags = Array.isArray(values) ? values : [values]
    setTempFilters((prev) => ({ ...prev, tags }))
  }

  const handleApply = () => {
    onFiltersChange(tempFilters)
    onClose()
  }

  const handleReset = () => {
    const resetFilters = { provider: [], tags: [] }
    setTempFilters(resetFilters)
    onFiltersChange(resetFilters)
  }

  const handleCancel = () => {
    setTempFilters(filters) // Reset to original filters
    onClose()
  }

  const providerOptions = availableProviders.map((provider) => ({
    value: provider,
    label: provider.charAt(0).toUpperCase() + provider.slice(1)
  }))

  const tagOptions = availableTags.map((tag) => ({
    value: tag,
    label: tag
  }))

  return (
    // Tại dòng 88-95, thay đổi:
    <CustomOverlay
      isOpen={isOpen}
      onClose={handleCancel}
      title="Filter Emails"
      subtitle={
        hasActiveFilters
          ? `${tempFilters.provider.length + tempFilters.tags.length} filter(s) active`
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
        <>
          <CustomButton variant="secondary" size="sm" onClick={handleCancel}>
            Cancel
          </CustomButton>
          {hasActiveFilters && (
            <CustomButton variant="ghost" size="sm" onClick={handleReset} icon={RotateCcw}>
              Reset
            </CustomButton>
          )}
          <CustomButton variant="primary" size="sm" onClick={handleApply}>
            Apply Filters
          </CustomButton>
        </>
      }
    >
      <div className="p-4 space-y-6">
        {/* Filter Info */}
        <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3 border border-blue-200 dark:border-blue-800">
          <div className="flex items-start gap-2">
            <Filter className="h-4 w-4 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-sm text-blue-800 dark:text-blue-300">
                Filter your email accounts by provider and tags to quickly find what you need.
              </p>
            </div>
          </div>
        </div>

        {/* Email Provider Filter */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Email Provider
          </label>
          <CustomCombobox
            value={tempFilters.provider}
            options={providerOptions}
            onChange={handleProviderChange}
            placeholder="Select providers..."
            multiple={true}
            searchable={true}
            size="sm"
          />
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Filter by email service provider (Gmail, Yahoo, etc.)
          </p>
        </div>

        {/* Tags Filter */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Tags</label>
          <CustomCombobox
            value={tempFilters.tags}
            options={tagOptions}
            onChange={handleTagsChange}
            placeholder="Select tags..."
            multiple={true}
            searchable={true}
            creatable={false}
            size="sm"
          />
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Filter by custom tags you've assigned to emails
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
              {/* Provider Tags */}
              {tempFilters.provider.length > 0 && (
                <div className="space-y-2">
                  <span className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                    Providers
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {tempFilters.provider.map((provider) => (
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
                            setTempFilters((prev) => ({
                              ...prev,
                              provider: prev.provider.filter((p) => p !== provider)
                            }))
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

              {/* Tag Filters */}
              {tempFilters.tags.length > 0 && (
                <div className="space-y-2">
                  <span className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                    Tags
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {tempFilters.tags.map((tag) => (
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
                            setTempFilters((prev) => ({
                              ...prev,
                              tags: prev.tags.filter((t) => t !== tag)
                            }))
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
              No filters active. Select providers or tags above to filter your emails.
            </p>
          </div>
        )}
      </div>
    </CustomOverlay>
  )
}

export default FilterOverlay
