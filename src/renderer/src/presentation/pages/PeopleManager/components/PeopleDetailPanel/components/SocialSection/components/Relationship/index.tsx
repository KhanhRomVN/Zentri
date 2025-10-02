import React from 'react'
import { Button } from '../../../../../../../../../components/ui/button'
import { Plus, Heart } from 'lucide-react'
import { Relationship, Person, PersonInfo } from '../../../../../../types'
import RelationshipForm from './components/RelationshipForm'
import RelationshipCard from './components/RelationshipCard'

interface RelationshipSectionProps {
  relationships: Relationship[]
  person: Person
  allPeople: Person[]
  allPersonInfos: PersonInfo[]
  showRelationshipForm: boolean
  relationshipFormData: {
    related_person_id: string
    relationship_type: string
    start_date: string
    end_date: string
    is_current: boolean
    notes: string
    metadata: Record<string, any>
  }
  editingRelationships: Record<string, Relationship>
  savingField: string | null
  saveStatus: { [key: string]: 'success' | 'error' | null }
  isSubmitting: boolean
  onShowForm: () => void
  onCancelForm: () => void
  onFormDataChange: (updates: any) => void
  onCreate: () => void
  onUpdateField: (relationship: Relationship, field: keyof Relationship, value: any) => void
  onSave: (relationship: Relationship) => void
  onDelete: (id: string) => void
  renderStatusIcon: (field: string, hasChanged: boolean, onSave: () => void) => React.ReactNode
}

const RELATIONSHIP_TYPE_OPTIONS = [
  { value: 'parent', label: 'Parent' },
  { value: 'child', label: 'Child' },
  { value: 'sibling', label: 'Sibling' },
  { value: 'spouse', label: 'Spouse' },
  { value: 'partner', label: 'Partner' },
  { value: 'friend', label: 'Friend' },
  { value: 'colleague', label: 'Colleague' },
  { value: 'mentor', label: 'Mentor' },
  { value: 'mentee', label: 'Mentee' },
  { value: 'other', label: 'Other' }
]

const RelationshipSection: React.FC<RelationshipSectionProps> = ({
  relationships,
  person,
  allPeople,
  allPersonInfos,
  showRelationshipForm,
  relationshipFormData,
  editingRelationships,
  savingField,
  saveStatus,
  isSubmitting,
  onShowForm,
  onCancelForm,
  onFormDataChange,
  onCreate,
  onUpdateField,
  onSave,
  onDelete,
  renderStatusIcon
}) => {
  const getPersonDisplayName = (personId: string): string => {
    const personInfo = allPersonInfos.find((info) => info.person_id === personId)
    return personInfo?.preferred_name || personInfo?.full_name || 'Unknown Person'
  }

  const getPersonOptions = () => {
    return allPeople
      .filter((p) => p.id !== person.id)
      .map((p) => ({
        value: p.id,
        label: getPersonDisplayName(p.id)
      }))
  }

  const getEditingRelationship = (rel: Relationship): Relationship => {
    if (!editingRelationships[rel.id]) {
      return rel
    }
    return editingRelationships[rel.id]
  }

  const personOptions = getPersonOptions()

  return (
    <div className="bg-card-background rounded-lg border border-border-default hover:border-border-hover shadow-sm hover:shadow transition-all duration-200">
      <div className="p-3">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 bg-pink-50 dark:bg-pink-900/20 rounded flex items-center justify-center">
              <Heart className="h-3 w-3 text-pink-600 dark:text-pink-400" />
            </div>
            <h5 className="text-sm font-medium text-text-primary">Relationships</h5>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onShowForm}
            className="p-1 h-6 w-6"
            disabled={showRelationshipForm || savingField !== null || allPeople.length <= 1}
          >
            <Plus className="h-3 w-3" />
          </Button>
        </div>

        {allPeople.length <= 1 ? (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            <Heart className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No other people to create relationships with</p>
          </div>
        ) : (
          <div className="space-y-3">
            {/* Create Form */}
            {showRelationshipForm && (
              <RelationshipForm
                formData={relationshipFormData}
                personOptions={personOptions}
                relationshipTypeOptions={RELATIONSHIP_TYPE_OPTIONS}
                isSubmitting={isSubmitting}
                onFormDataChange={onFormDataChange}
                onSubmit={onCreate}
                onCancel={onCancelForm}
              />
            )}

            {/* Existing Relationships */}
            {relationships.map((relationship) => {
              const editedRel = getEditingRelationship(relationship)
              const hasChanges = JSON.stringify(relationship) !== JSON.stringify(editedRel)

              return (
                <RelationshipCard
                  key={relationship.id}
                  relationship={relationship}
                  editedRelationship={editedRel}
                  personOptions={personOptions}
                  relationshipTypeOptions={RELATIONSHIP_TYPE_OPTIONS}
                  hasChanges={hasChanges}
                  savingField={savingField}
                  saveStatus={saveStatus}
                  onUpdateField={(field, value) => onUpdateField(relationship, field, value)}
                  onSave={() => onSave(relationship)}
                  onDelete={() => onDelete(relationship.id)}
                  renderStatusIcon={renderStatusIcon}
                />
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

export default RelationshipSection
