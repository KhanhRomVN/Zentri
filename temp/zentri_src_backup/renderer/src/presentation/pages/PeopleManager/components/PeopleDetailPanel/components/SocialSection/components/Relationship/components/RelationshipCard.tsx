import React from 'react'
import CustomInput from '../../../../../../../../../../components/common/CustomInput'
import CustomCombobox from '../../../../../../../../../../components/common/CustomCombobox'
import CustomButton from '../../../../../../../../../../components/common/CustomButton'
import { Relationship } from '../../../../../../../types'

interface RelationshipCardProps {
  relationship: Relationship
  editedRelationship: Relationship
  personOptions: Array<{ value: string; label: string }>
  relationshipTypeOptions: Array<{ value: string; label: string }>
  hasChanges: boolean
  savingField: string | null
  saveStatus: { [key: string]: 'success' | 'error' | null }
  onUpdateField: (field: keyof Relationship, value: any) => void
  onSave: () => void
  onDelete: () => void
  renderStatusIcon: (field: string, hasChanged: boolean, onSave: () => void) => React.ReactNode
}

const RelationshipCard: React.FC<RelationshipCardProps> = ({
  relationship,
  editedRelationship,
  personOptions,
  relationshipTypeOptions,
  hasChanges,
  savingField,
  onUpdateField,
  onSave,
  onDelete,
  renderStatusIcon
}) => {
  return (
    <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg space-y-2">
      <CustomCombobox
        label="Related Person"
        value={editedRelationship.related_person_id}
        options={personOptions}
        onChange={(value) => onUpdateField('related_person_id', value as string)}
        placeholder="Select person..."
        size="sm"
      />

      <CustomCombobox
        label="Relationship Type"
        value={editedRelationship.relationship_type}
        options={relationshipTypeOptions}
        onChange={(value) => onUpdateField('relationship_type', value as string)}
        placeholder="Select type..."
        size="sm"
      />

      <div className="grid grid-cols-2 gap-2">
        <CustomInput
          label="Start Date"
          type="date"
          value={editedRelationship.start_date || ''}
          onChange={(value) => onUpdateField('start_date', value)}
          variant="filled"
          size="sm"
        />

        <CustomInput
          label="End Date"
          type="date"
          value={editedRelationship.end_date || ''}
          onChange={(value) => onUpdateField('end_date', value)}
          variant="filled"
          size="sm"
          disabled={editedRelationship.is_current}
        />
      </div>

      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          id={`is_current_${relationship.id}`}
          checked={editedRelationship.is_current || false}
          onChange={(e) => {
            onUpdateField('is_current', e.target.checked)
            if (e.target.checked) {
              onUpdateField('end_date', '')
            }
          }}
          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
        />
        <label
          htmlFor={`is_current_${relationship.id}`}
          className="text-xs text-gray-700 dark:text-gray-300"
        >
          Current Relationship
        </label>
        {hasChanges && renderStatusIcon(`relationship_${relationship.id}`, hasChanges, onSave)}
      </div>

      <CustomInput
        label="Notes"
        value={editedRelationship.notes || ''}
        onChange={(value) => onUpdateField('notes', value)}
        placeholder="Add notes about this relationship..."
        variant="filled"
        size="sm"
      />

      <div className="flex justify-end gap-2 pt-2 border-t border-gray-200 dark:border-gray-700">
        <CustomButton variant="error" size="sm" onClick={onDelete} disabled={savingField !== null}>
          Delete
        </CustomButton>
        {hasChanges && (
          <CustomButton
            variant="primary"
            size="sm"
            onClick={onSave}
            disabled={savingField !== null}
          >
            {renderStatusIcon(`relationship_${relationship.id}`, hasChanges, onSave) || 'Save'}
          </CustomButton>
        )}
      </div>
    </div>
  )
}

export default RelationshipCard
