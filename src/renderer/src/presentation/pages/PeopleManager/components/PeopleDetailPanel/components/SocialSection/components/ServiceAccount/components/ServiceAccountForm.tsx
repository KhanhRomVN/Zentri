// src/renderer/src/presentation/pages/PeopleManager/components/PeopleDetailPanel/components/SocialSection/components/ServiceAccount/components/ServiceAccountForm.tsx
import React from 'react'
import { Button } from '../../../../../../../../../../components/ui/button'
import CustomInput from '../../../../../../../../../../components/common/CustomInput'
import CustomCombobox from '../../../../../../../../../../components/common/CustomCombobox'
import CustomButton from '../../../../../../../../../../components/common/CustomButton'
import Metadata from '../../../../../../../../../../components/common/Metadata'
import { Copy } from 'lucide-react'

interface ServiceAccountFormData {
  service_name: string
  service_type: 'social_media' | 'communication' | 'other'
  service_url: string
  metadata: Record<string, any>
}

interface ServiceAccountFormProps {
  formData: ServiceAccountFormData
  serviceTypeOptions: Array<{ value: string; label: string }>
  isSubmitting: boolean
  onFormDataChange: (updates: Partial<ServiceAccountFormData>) => void
  onSubmit: () => void
  onCancel: () => void
  onCopyUrl: (url: string) => void
}

const ServiceAccountForm: React.FC<ServiceAccountFormProps> = ({
  formData,
  serviceTypeOptions,
  isSubmitting,
  onFormDataChange,
  onSubmit,
  onCancel,
  onCopyUrl
}) => {
  const handleFieldChange = (field: keyof ServiceAccountFormData, value: any) => {
    onFormDataChange({ [field]: value })
  }

  return (
    <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg space-y-2 border-2 border-blue-400">
      <CustomInput
        label="Service Name"
        value={formData.service_name}
        onChange={(value) => handleFieldChange('service_name', value)}
        placeholder="e.g., Facebook, Instagram..."
        variant="filled"
        size="sm"
        required
      />

      <CustomCombobox
        label="Service Type"
        value={formData.service_type}
        options={serviceTypeOptions}
        onChange={(value) => handleFieldChange('service_type', value as any)}
        placeholder="Select type..."
        size="sm"
      />

      <div className="flex items-center gap-2">
        <div className="flex-1">
          <CustomInput
            label="Profile URL"
            value={formData.service_url}
            onChange={(value) => handleFieldChange('service_url', value)}
            placeholder="https://..."
            variant="filled"
            size="sm"
          />
        </div>
        {formData.service_url && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onCopyUrl(formData.service_url)}
            className="p-1 h-6 w-6 mt-5"
            title="Copy URL"
          >
            <Copy className="h-3 w-3" />
          </Button>
        )}
      </div>

      <div className="pt-2">
        <Metadata
          metadata={formData.metadata}
          onMetadataChange={(newMetadata) => handleFieldChange('metadata', newMetadata)}
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
        <CustomButton variant="secondary" size="sm" onClick={onCancel} disabled={isSubmitting}>
          Cancel
        </CustomButton>
        <CustomButton
          variant="primary"
          size="sm"
          onClick={onSubmit}
          disabled={!formData.service_name.trim() || isSubmitting}
          loading={isSubmitting}
        >
          Create
        </CustomButton>
      </div>
    </div>
  )
}

export default ServiceAccountForm
