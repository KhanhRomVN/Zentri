// ServiceAccountForm.tsx - FIXED VERSION
import React from 'react'
import CustomInput from '../../../../../../../../../../components/common/CustomInput'
import CustomCombobox from '../../../../../../../../../../components/common/CustomCombobox'
import CustomButton from '../../../../../../../../../../components/common/CustomButton'
import Metadata from '../../../../../../../../../../components/common/Metadata'
import { Globe } from 'lucide-react'

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
}

const ServiceAccountForm: React.FC<ServiceAccountFormProps> = ({
  formData,
  serviceTypeOptions,
  isSubmitting,
  onFormDataChange,
  onSubmit,
  onCancel
}) => {
  const handleFieldChange = (field: keyof ServiceAccountFormData, value: any) => {
    onFormDataChange({
      ...formData,
      [field]: value
    })
  }

  const isSocialMedia = formData.service_type === 'social_media'

  const handleMetadataChange = (newMetadata: Record<string, any>) => {
    // Lọc bỏ các field rỗng trước khi lưu
    const cleanedMetadata = Object.entries(newMetadata).reduce(
      (acc, [key, value]) => {
        // Chỉ giữ lại nếu value không phải empty string/null/undefined
        if (value !== '' && value !== null && value !== undefined) {
          acc[key] = value
        }
        return acc
      },
      {} as Record<string, any>
    )

    // Chỉ update metadata, KHÔNG tự động đồng bộ sang service_url
    onFormDataChange({
      ...formData,
      metadata: cleanedMetadata
    })
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

      <CustomInput
        label="Service URL"
        value={formData.service_url}
        onChange={(value) => handleFieldChange('service_url', value)}
        placeholder="https://..."
        variant="filled"
        size="sm"
        leftIcon={<Globe className="h-3 w-3" />}
      />

      {/* ✅ Metadata - Mở rộng mặc định khi là social_media */}
      {/* Metadata - Hiển thị profile_url khi là social_media */}
      <div className="pt-2">
        <Metadata
          metadata={formData.metadata}
          onMetadataChange={handleMetadataChange}
          title={isSocialMedia ? 'Profile Information' : 'Additional Metadata'}
          compact={true}
          size="sm"
          allowCreate={true}
          allowEdit={true}
          allowDelete={true}
          collapsible={true}
          defaultExpanded={isSocialMedia}
          placeholder={
            isSocialMedia
              ? {
                  key: 'profile_url',
                  value: 'https://... (optional)'
                }
              : {
                  key: 'custom_field',
                  value: 'value...'
                }
          }
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
          disabled={!formData.service_name?.trim() || isSubmitting}
          loading={isSubmitting}
        >
          Create
        </CustomButton>
      </div>
    </div>
  )
}

export default ServiceAccountForm
