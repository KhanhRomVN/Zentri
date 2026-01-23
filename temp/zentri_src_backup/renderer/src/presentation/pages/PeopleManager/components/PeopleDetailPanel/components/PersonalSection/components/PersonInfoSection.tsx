// PersonInfoSection.tsx
import React from 'react'
import { User } from 'lucide-react'
import CustomInput from '../../../../../../../../components/common/CustomInput'
import CustomCombobox from '../../../../../../../../components/common/CustomCombobox'
import Metadata from '../../../../../../../../components/common/Metadata'
import { PersonInfo } from '../../../../../types'

interface PersonInfoSectionProps {
  fullName: string
  preferredName: string
  gender: string
  metadata: Record<string, any>
  personInfo: PersonInfo | null
  savingField: string | null
  onFullNameChange: (value: string) => void
  onPreferredNameChange: (value: string) => void
  onGenderChange: (value: string) => void
  onMetadataChange: (value: Record<string, any>) => void
  onSave: (field: string, value: string | Record<string, any>) => void
  renderStatusIcon: (
    field: string,
    hasChanged: boolean,
    onSave: () => void
  ) => React.ReactNode | undefined
}

const GENDER_OPTIONS_LIST = [
  { value: 'male', label: 'Male' },
  { value: 'female', label: 'Female' },
  { value: 'other', label: 'Other' }
]

const PersonInfoSection: React.FC<PersonInfoSectionProps> = ({
  fullName,
  preferredName,
  gender,
  metadata,
  personInfo,
  savingField,
  onFullNameChange,
  onPreferredNameChange,
  onGenderChange,
  onMetadataChange,
  onSave,
  renderStatusIcon
}) => {
  return (
    <div className="bg-card-background rounded-lg border border-border-default hover:border-border-hover shadow-sm hover:shadow transition-all duration-200">
      <div className="p-3">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-5 h-5 bg-blue-50 dark:bg-blue-900/20 rounded flex items-center justify-center">
            <User className="h-3 w-3 text-blue-600 dark:text-blue-400" />
          </div>
          <h5 className="text-sm font-medium text-text-primary">Personal Info</h5>
        </div>

        <div className="space-y-3">
          <CustomInput
            label="Full Name"
            value={fullName}
            onChange={onFullNameChange}
            placeholder="Enter full name..."
            variant="filled"
            size="sm"
            leftIcon={<User className="h-3 w-3" />}
            rightIcon={renderStatusIcon(
              'full_name',
              fullName !== (personInfo?.full_name || ''),
              () => onSave('full_name', fullName)
            )}
            disabled={savingField !== null}
            required
          />

          <CustomInput
            label="Preferred Name"
            value={preferredName}
            onChange={onPreferredNameChange}
            placeholder="Enter preferred name..."
            variant="filled"
            size="sm"
            rightIcon={renderStatusIcon(
              'preferred_name',
              preferredName !== (personInfo?.preferred_name || ''),
              () => onSave('preferred_name', preferredName)
            )}
            disabled={savingField !== null}
          />

          <div>
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
              Gender
            </label>
            <div className="flex items-center gap-1">
              <div className="flex-1">
                <CustomCombobox
                  label=""
                  value={gender}
                  options={GENDER_OPTIONS_LIST}
                  onChange={(value) => {
                    onGenderChange(value as string)
                    onSave('gender', value as string)
                  }}
                  placeholder="Select gender..."
                  size="sm"
                />
              </div>
              {renderStatusIcon('gender', gender !== (personInfo?.gender || ''), () => {})}
            </div>
          </div>

          <Metadata
            metadata={metadata}
            onMetadataChange={(newMetadata) => {
              onMetadataChange(newMetadata)
              onSave('metadata', newMetadata)
            }}
            title="Additional Info"
            compact={true}
            collapsible={true}
            defaultExpanded={false}
            editable={true}
            showDeleteButtons={true}
            maxVisibleFields={5}
          />
        </div>
      </div>
    </div>
  )
}

export default PersonInfoSection
