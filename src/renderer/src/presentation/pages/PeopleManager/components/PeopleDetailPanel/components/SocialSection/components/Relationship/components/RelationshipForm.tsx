import React from 'react'
import CustomInput from '../../../../../../../../../../components/common/CustomInput'
import CustomCombobox from '../../../../../../../../../../components/common/CustomCombobox'
import CustomButton from '../../../../../../../../../../components/common/CustomButton'

interface RelationshipFormData {
  related_person_id: string
  relationship_type: string
  start_date: string
  end_date: string
  is_current: boolean
  notes: string
  metadata: Record<string, any>
}

interface RelationshipFormProps {
  formData: RelationshipFormData
  personOptions: Array<{ value: string; label: string }>
  relationshipTypeOptions: Array<{ value: string; label: string }>
  isSubmitting: boolean
  onFormDataChange: (updates: Partial<RelationshipFormData>) => void
  onSubmit: () => void
  onCancel: () => void
}

const RelationshipForm: React.FC<RelationshipFormProps> = ({
  formData,
  personOptions,
  relationshipTypeOptions,
  isSubmitting,
  onFormDataChange,
  onSubmit,
  onCancel
}) => {
  const handleFieldChange = (field: keyof RelationshipFormData, value: any) => {
    onFormDataChange({ [field]: value })
  }

  return (
    <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg space-y-2 border-2 border-blue-400">
      <CustomCombobox
        label="Related Person"
        value={formData.related_person_id}
        options={personOptions}
        onChange={(value) => handleFieldChange('related_person_id', value as string)}
        placeholder="Select person..."
        size="sm"
        required
      />

      <CustomCombobox
        label="Relationship Type"
        value={formData.relationship_type}
        options={relationshipTypeOptions}
        onChange={(value) => handleFieldChange('relationship_type', value as string)}
        placeholder="Select type..."
        size="sm"
      />

      <div className="grid grid-cols-2 gap-2">
        <CustomInput
          label="Start Date"
          type="date"
          value={formData.start_date}
          onChange={(value) => handleFieldChange('start_date', value)}
          variant="filled"
          size="sm"
        />

        <CustomInput
          label="End Date"
          type="date"
          value={formData.end_date}
          onChange={(value) => handleFieldChange('end_date', value)}
          variant="filled"
          size="sm"
          disabled={formData.is_current}
        />
      </div>

      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          id="is_current_new"
          checked={formData.is_current}
          onChange={(e) => {
            handleFieldChange('is_current', e.target.checked)
            if (e.target.checked) {
              handleFieldChange('end_date', '')
            }
          }}
          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
        />
        <label htmlFor="is_current_new" className="text-xs text-gray-700 dark:text-gray-300">
          Current Relationship
        </label>
      </div>

      <CustomInput
        label="Notes"
        value={formData.notes}
        onChange={(value) => handleFieldChange('notes', value)}
        placeholder="Add notes about this relationship..."
        variant="filled"
        size="sm"
      />

      <div className="flex justify-end gap-2 pt-2 border-t border-gray-200 dark:border-gray-700">
        <CustomButton variant="secondary" size="sm" onClick={onCancel} disabled={isSubmitting}>
          Cancel
        </CustomButton>
        <CustomButton
          variant="primary"
          size="sm"
          onClick={onSubmit}
          disabled={!formData.related_person_id || isSubmitting}
          loading={isSubmitting}
        >
          Create
        </CustomButton>
      </div>
    </div>
  )
}

export default RelationshipForm
