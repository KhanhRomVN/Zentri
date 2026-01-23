// src/renderer/src/presentation/pages/PeopleManager/components/PeopleDetailPanel/components/SocialSection/components/ServiceAccount/components/ServiceAccountCard.tsx
import React, { useState } from 'react'
import { Button } from '../../../../../../../../../../components/ui/button'
import CustomInput from '../../../../../../../../../../components/common/CustomInput'
import CustomCombobox from '../../../../../../../../../../components/common/CustomCombobox'
import CustomButton from '../../../../../../../../../../components/common/CustomButton'
import Metadata from '../../../../../../../../../../components/common/Metadata'
import { Copy, ChevronDown, ChevronRight, ExternalLink, Globe } from 'lucide-react'
import { ServiceAccount } from '../../../../../../../types'
import { Favicon } from '../../../../../../../../../../shared/utils/faviconUtils'

interface ServiceAccountCardProps {
  serviceAccount: ServiceAccount
  editedServiceAccount: ServiceAccount
  serviceTypeOptions: Array<{ value: string; label: string }>
  hasChanges: boolean
  savingField: string | null
  saveStatus: { [key: string]: 'success' | 'error' | null }
  onUpdateField: (field: keyof ServiceAccount, value: any) => void
  onSave: () => void
  onDelete: () => void
  onCopyUrl: (url: string) => void
  renderStatusIcon: (field: string, hasChanged: boolean, onSave: () => void) => React.ReactNode
}

const ServiceAccountCard: React.FC<ServiceAccountCardProps> = ({
  serviceAccount,
  editedServiceAccount,
  serviceTypeOptions,
  hasChanges,
  savingField,
  onUpdateField,
  onSave,
  onDelete,
  onCopyUrl,
  renderStatusIcon
}) => {
  const [isExpanded, setIsExpanded] = useState(false)

  const profileUrl = editedServiceAccount.metadata?.profile_url || ''
  const serviceUrl = editedServiceAccount.service_url || ''

  const handleOpenUrl = (url: string) => {
    if (url) {
      window.open(url, '_blank', 'noopener,noreferrer')
    }
  }

  const getServiceTypeLabel = () => {
    const option = serviceTypeOptions.find((opt) => opt.value === editedServiceAccount.service_type)
    return option?.label || editedServiceAccount.service_type
  }

  const getServiceInitials = (name: string): string => {
    return name
      .split(' ')
      .map((word) => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  // Determine which URL to display and use
  const displayUrl = profileUrl || serviceUrl
  const displayHostname = displayUrl
    ? (() => {
        try {
          return new URL(displayUrl).hostname
        } catch {
          return null
        }
      })()
    : null

  return (
    <div className="bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden transition-all duration-200 hover:border-gray-300 dark:hover:border-gray-600">
      {/* Collapsed Header */}
      <div className="p-2 cursor-pointer select-none" onClick={() => setIsExpanded(!isExpanded)}>
        <div className="flex items-center gap-3">
          {/* Expand/Collapse Icon */}
          <button
            className="flex-shrink-0 p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded transition-colors"
            onClick={(e) => {
              e.stopPropagation()
              setIsExpanded(!isExpanded)
            }}
          >
            {isExpanded ? (
              <ChevronDown className="h-4 w-4 text-gray-600 dark:text-gray-400" />
            ) : (
              <ChevronRight className="h-4 w-4 text-gray-600 dark:text-gray-400" />
            )}
          </button>

          {/* Favicon */}
          <div className="flex-shrink-0">
            {displayUrl ? (
              <Favicon
                url={displayUrl}
                size={32}
                className="rounded"
                fallbackIcon={
                  <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-pink-600 rounded flex items-center justify-center text-white text-xs font-bold">
                    {getServiceInitials(editedServiceAccount.service_name)}
                  </div>
                }
              />
            ) : (
              <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-pink-600 rounded flex items-center justify-center text-white text-xs font-bold">
                {getServiceInitials(editedServiceAccount.service_name)}
              </div>
            )}
          </div>

          {/* Service Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h6 className="text-sm font-medium text-text-primary truncate">
                {editedServiceAccount.service_name}
              </h6>
              {hasChanges && (
                <span
                  className="flex-shrink-0 w-2 h-2 bg-orange-500 rounded-full"
                  title="Unsaved changes"
                />
              )}
            </div>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-xs text-gray-500 dark:text-gray-400">
                {getServiceTypeLabel()}
              </span>
              {displayHostname && (
                <>
                  <span className="text-xs text-gray-400">•</span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      handleOpenUrl(displayUrl)
                    }}
                    className="text-xs text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
                  >
                    <Globe className="h-3 w-3" />
                    <span className="truncate max-w-[150px]">{displayHostname}</span>
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Quick Actions */}
          <div className="flex-shrink-0 flex items-center gap-1">
            {displayUrl && (
              <>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation()
                    onCopyUrl(displayUrl)
                  }}
                  className="p-1 h-7 w-7"
                  title="Copy URL"
                >
                  <Copy className="h-3.5 w-3.5" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation()
                    handleOpenUrl(displayUrl)
                  }}
                  className="p-1 h-7 w-7"
                  title="Open in browser"
                >
                  <ExternalLink className="h-3.5 w-3.5" />
                </Button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Expanded Content */}
      {isExpanded && (
        <div className="border-t border-gray-200 dark:border-gray-700 p-3 space-y-3 bg-white dark:bg-gray-900">
          <CustomInput
            label="Service Name"
            value={editedServiceAccount.service_name}
            onChange={(value) => onUpdateField('service_name', value)}
            placeholder="e.g., Facebook, Instagram..."
            variant="filled"
            size="sm"
          />

          <CustomCombobox
            label="Service Type"
            value={editedServiceAccount.service_type}
            options={serviceTypeOptions}
            onChange={(value) => onUpdateField('service_type', value)}
            placeholder="Select type..."
            size="sm"
          />

          <div className="flex items-center gap-2">
            <div className="flex-1">
              <CustomInput
                label="Service URL"
                value={serviceUrl}
                onChange={(value) => onUpdateField('service_url', value)}
                placeholder="https://..."
                variant="filled"
                size="sm"
                leftIcon={<Globe className="h-3 w-3" />}
              />
            </div>
            {serviceUrl && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onCopyUrl(serviceUrl)}
                className="p-1 h-6 w-6 mt-5"
                title="Copy URL"
              >
                <Copy className="h-3 w-3" />
              </Button>
            )}
          </div>

          <div className="pt-2">
            <Metadata
              metadata={editedServiceAccount.metadata || {}}
              onMetadataChange={(newMetadata) => onUpdateField('metadata', newMetadata)}
              title="Additional Metadata"
              compact={true}
              size="sm"
              allowCreate={true}
              allowEdit={true}
              allowDelete={true}
              collapsible={true}
              defaultExpanded={false}
            />
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-gray-200 dark:border-gray-700">
            <CustomButton
              variant="error"
              size="sm"
              onClick={onDelete}
              disabled={savingField !== null}
            >
              Delete
            </CustomButton>
            {hasChanges && (
              <CustomButton
                variant="primary"
                size="sm"
                onClick={onSave}
                disabled={savingField !== null}
              >
                {renderStatusIcon(`service_account_${serviceAccount.id}`, hasChanges, onSave) ||
                  'Save'}
              </CustomButton>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default ServiceAccountCard
