// src/renderer/src/presentation/pages/PeopleManager/components/PeopleDetailPanel/components/FamilyInfoSection.tsx
import React, { useState } from 'react'
import { Button } from '../../../../../../components/ui/button'
import CustomInput from '../../../../../../components/common/CustomInput'
import CustomCombobox from '../../../../../../components/common/CustomCombobox'
import { cn } from '../../../../../../shared/lib/utils'
import { Person } from '../../../types'
import {
  Users,
  Heart,
  UserPlus,
  UserMinus,
  Calendar,
  Phone,
  Mail,
  Check,
  Plus,
  Minus
} from 'lucide-react'

interface FamilyInfoSectionProps {
  person: Person
  className?: string
  onUpdatePerson?: (id: string, updates: Partial<Person>) => Promise<boolean>
}

const MARITAL_STATUS_OPTIONS = [
  { value: 'single', label: 'Single' },
  { value: 'married', label: 'Married' },
  { value: 'divorced', label: 'Divorced' },
  { value: 'widowed', label: 'Widowed' }
]

const RELATIONSHIP_OPTIONS = [
  { value: 'father', label: 'Father' },
  { value: 'mother', label: 'Mother' },
  { value: 'brother', label: 'Brother' },
  { value: 'sister', label: 'Sister' },
  { value: 'son', label: 'Son' },
  { value: 'daughter', label: 'Daughter' },
  { value: 'spouse', label: 'Spouse' },
  { value: 'partner', label: 'Partner' }
]

const FamilyInfoSection: React.FC<FamilyInfoSectionProps> = ({
  person,
  className,
  onUpdatePerson
}) => {
  // Family information state
  const [maritalStatus, setMaritalStatus] = useState(person.marital_status || '')
  const [spouse, setSpouse] = useState(
    person.spouse || { name: '', date_of_birth: '', marriage_date: '' }
  )
  const [children, setChildren] = useState(person.children || [])
  const [parents, setParents] = useState(person.parents || [])
  const [siblings, setSiblings] = useState(person.siblings || [])

  // Loading and status states
  const [savingField, setSavingField] = useState<string | null>(null)
  const [saveStatus, setSaveStatus] = useState<{ [key: string]: 'success' | 'error' | null }>({})

  const handleSaveField = async (field: string, value: any) => {
    if (!person.id || !onUpdatePerson) return

    try {
      setSavingField(field)
      const updates: Partial<Person> = {}

      switch (field) {
        case 'marital_status':
          updates.marital_status = value as string
          break
        case 'spouse':
          updates.spouse = value
          break
        case 'children':
          updates.children = value as any[]
          break
        case 'parents':
          updates.parents = value as any[]
          break
        case 'siblings':
          updates.siblings = value as any[]
          break
        default:
          return
      }

      const success = await onUpdatePerson(person.id, updates)
      setSaveStatus((prev) => ({ ...prev, [field]: success ? 'success' : 'error' }))

      setTimeout(() => {
        setSaveStatus((prev) => ({ ...prev, [field]: null }))
      }, 2000)
    } catch (error) {
      console.error(`Error saving ${field}:`, error)
      setSaveStatus((prev) => ({ ...prev, [field]: 'error' }))
    } finally {
      setSavingField(null)
    }
  }

  const renderStatusIcon = (
    field: string,
    hasChanged: boolean,
    currentValue: any,
    originalValue: any
  ) => {
    if (savingField === field) {
      return <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-blue-600"></div>
    }

    if (saveStatus[field] === 'success') {
      return <Check className="h-3 w-3 text-green-600" />
    }

    if (saveStatus[field] === 'error') {
      return <div className="text-red-600 text-xs">!</div>
    }

    if (hasChanged) {
      return (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => handleSaveField(field, currentValue)}
          className="p-0.5 h-4 w-4 text-green-600 hover:text-green-700 hover:bg-green-50"
          disabled={savingField !== null}
        >
          <Check className="h-2 w-2" />
        </Button>
      )
    }

    return undefined
  }

  // Spouse management
  const updateSpouseField = (field: string, value: string) => {
    const updatedSpouse = { ...spouse, [field]: value }
    setSpouse(updatedSpouse)
  }

  // Children management
  const addChild = () => {
    const newChildren = [...children, { name: '', date_of_birth: '', relationship: 'son' }]
    setChildren(newChildren)
  }

  const updateChild = (index: number, field: string, value: string) => {
    const newChildren = [...children]
    newChildren[index] = { ...newChildren[index], [field]: value }
    setChildren(newChildren)
  }

  const removeChild = (index: number) => {
    const newChildren = children.filter((_, i) => i !== index)
    setChildren(newChildren)
    handleSaveField('children', newChildren)
  }

  // Parents management
  const addParent = () => {
    const newParents = [...parents, { name: '', relationship: 'father', date_of_birth: '' }]
    setParents(newParents)
  }

  const updateParent = (index: number, field: string, value: string) => {
    const newParents = [...parents]
    newParents[index] = { ...newParents[index], [field]: value }
    setParents(newParents)
  }

  const removeParent = (index: number) => {
    const newParents = parents.filter((_, i) => i !== index)
    setParents(newParents)
    handleSaveField('parents', newParents)
  }

  // Siblings management
  const addSibling = () => {
    const newSiblings = [...siblings, { name: '', relationship: 'brother', date_of_birth: '' }]
    setSiblings(newSiblings)
  }

  const updateSibling = (index: number, field: string, value: string) => {
    const newSiblings = [...siblings]
    newSiblings[index] = { ...newSiblings[index], [field]: value }
    setSiblings(newSiblings)
  }

  const removeSibling = (index: number) => {
    const newSiblings = siblings.filter((_, i) => i !== index)
    setSiblings(newSiblings)
    handleSaveField('siblings', newSiblings)
  }

  return (
    <div className={cn('space-y-4 p-4', className)}>
      {/* Header */}
      <div className="pl-1">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
          <Users className="h-4 w-4 text-pink-600 dark:text-pink-400" />
          Family Information
        </h3>
        <p className="text-gray-600 dark:text-gray-400 text-xs mt-0.5">
          Family relationships and information for {person.full_name}
        </p>
      </div>

      {/* Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Marital Status */}
        <div className="bg-card-background rounded-lg border border-border-default hover:border-border-hover shadow-sm hover:shadow transition-all duration-200">
          <div className="p-3">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-5 h-5 bg-pink-50 dark:bg-pink-900/20 rounded flex items-center justify-center">
                <Heart className="h-3 w-3 text-pink-600 dark:text-pink-400" />
              </div>
              <h5 className="text-sm font-medium text-gray-900 dark:text-white">Marital Status</h5>
            </div>

            <CustomCombobox
              label=""
              value={maritalStatus}
              options={MARITAL_STATUS_OPTIONS}
              onChange={(value) => setMaritalStatus(value as string)}
              placeholder="Select marital status..."
              size="sm"
            />
            {renderStatusIcon(
              'marital_status',
              maritalStatus !== (person.marital_status || ''),
              maritalStatus,
              person.marital_status
            )}
          </div>
        </div>

        {/* Spouse Information */}
        {maritalStatus === 'married' && (
          <div className="bg-card-background rounded-lg border border-border-default hover:border-border-hover shadow-sm hover:shadow transition-all duration-200">
            <div className="p-3">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-5 h-5 bg-red-50 dark:bg-red-900/20 rounded flex items-center justify-center">
                  <UserPlus className="h-3 w-3 text-red-600 dark:text-red-400" />
                </div>
                <h5 className="text-sm font-medium text-gray-900 dark:text-white">Spouse</h5>
              </div>

              <div className="space-y-3">
                <CustomInput
                  label="Spouse Name"
                  value={spouse.name}
                  onChange={(value) => updateSpouseField('name', value)}
                  placeholder="Spouse's full name"
                  variant="filled"
                  size="sm"
                />

                <CustomInput
                  label="Date of Birth"
                  type="datetime-local"
                  showTime={false}
                  value={spouse.date_of_birth}
                  onChange={(value) => updateSpouseField('date_of_birth', value)}
                  placeholder="Spouse's date of birth"
                  variant="filled"
                  size="sm"
                  leftIcon={<Calendar className="h-3 w-3" />}
                />

                <CustomInput
                  label="Marriage Date"
                  type="datetime-local"
                  showTime={false}
                  value={spouse.marriage_date}
                  onChange={(value) => updateSpouseField('marriage_date', value)}
                  placeholder="Date of marriage"
                  variant="filled"
                  size="sm"
                  leftIcon={<Calendar className="h-3 w-3" />}
                />

                {renderStatusIcon(
                  'spouse',
                  JSON.stringify(spouse) !== JSON.stringify(person.spouse || {}),
                  spouse,
                  person.spouse
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Children */}
      <div className="bg-card-background rounded-lg border border-border-default hover:border-border-hover shadow-sm hover:shadow transition-all duration-200">
        <div className="p-3">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 bg-blue-50 dark:bg-blue-900/20 rounded flex items-center justify-center">
                <Users className="h-3 w-3 text-blue-600 dark:text-blue-400" />
              </div>
              <h5 className="text-sm font-medium text-gray-900 dark:text-white">Children</h5>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={addChild}
              className="text-xs"
              disabled={savingField !== null}
            >
              <Plus className="h-3 w-3 mr-1" />
              Add Child
            </Button>
          </div>

          <div className="space-y-4">
            {children.map((child, index) => (
              <div key={index} className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <CustomInput
                    label="Child's Name"
                    value={child.name}
                    onChange={(value) => updateChild(index, 'name', value)}
                    placeholder="Child's full name"
                    variant="filled"
                    size="sm"
                  />

                  <CustomCombobox
                    label="Relationship"
                    value={child.relationship}
                    options={RELATIONSHIP_OPTIONS.filter(
                      (opt) => opt.value === 'son' || opt.value === 'daughter'
                    )}
                    onChange={(value) => updateChild(index, 'relationship', value as string)}
                    size="sm"
                  />

                  <CustomInput
                    label="Date of Birth"
                    type="datetime-local"
                    showTime={false}
                    value={child.date_of_birth}
                    onChange={(value) => updateChild(index, 'date_of_birth', value)}
                    variant="filled"
                    size="sm"
                  />
                </div>

                <div className="flex justify-end mt-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeChild(index)}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    <Minus className="h-3 w-3 mr-1" />
                    Remove
                  </Button>
                </div>
              </div>
            ))}

            {children.length === 0 && (
              <div className="text-center py-4 text-gray-500 dark:text-gray-400">
                <Users className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No children added yet</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Parents */}
      <div className="bg-card-background rounded-lg border border-border-default hover:border-border-hover shadow-sm hover:shadow transition-all duration-200">
        <div className="p-3">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 bg-green-50 dark:bg-green-900/20 rounded flex items-center justify-center">
                <Users className="h-3 w-3 text-green-600 dark:text-green-400" />
              </div>
              <h5 className="text-sm font-medium text-gray-900 dark:text-white">Parents</h5>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={addParent}
              className="text-xs"
              disabled={savingField !== null}
            >
              <Plus className="h-3 w-3 mr-1" />
              Add Parent
            </Button>
          </div>

          <div className="space-y-4">
            {parents.map((parent, index) => (
              <div key={index} className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <CustomInput
                    label="Parent's Name"
                    value={parent.name}
                    onChange={(value) => updateParent(index, 'name', value)}
                    placeholder="Parent's full name"
                    variant="filled"
                    size="sm"
                  />

                  <CustomCombobox
                    label="Relationship"
                    value={parent.relationship}
                    options={RELATIONSHIP_OPTIONS.filter(
                      (opt) => opt.value === 'father' || opt.value === 'mother'
                    )}
                    onChange={(value) => updateParent(index, 'relationship', value as string)}
                    size="sm"
                  />

                  <CustomInput
                    label="Date of Birth"
                    type="datetime-local"
                    showTime={false}
                    value={parent.date_of_birth}
                    onChange={(value) => updateParent(index, 'date_of_birth', value)}
                    variant="filled"
                    size="sm"
                  />
                </div>

                <div className="flex justify-end mt-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeParent(index)}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    <Minus className="h-3 w-3 mr-1" />
                    Remove
                  </Button>
                </div>
              </div>
            ))}

            {parents.length === 0 && (
              <div className="text-center py-4 text-gray-500 dark:text-gray-400">
                <Users className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No parents added yet</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Siblings */}
      <div className="bg-card-background rounded-lg border border-border-default hover:border-border-hover shadow-sm hover:shadow transition-all duration-200">
        <div className="p-3">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 bg-orange-50 dark:bg-orange-900/20 rounded flex items-center justify-center">
                <Users className="h-3 w-3 text-orange-600 dark:text-orange-400" />
              </div>
              <h5 className="text-sm font-medium text-gray-900 dark:text-white">Siblings</h5>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={addSibling}
              className="text-xs"
              disabled={savingField !== null}
            >
              <Plus className="h-3 w-3 mr-1" />
              Add Sibling
            </Button>
          </div>

          <div className="space-y-4">
            {siblings.map((sibling, index) => (
              <div key={index} className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <CustomInput
                    label="Sibling's Name"
                    value={sibling.name}
                    onChange={(value) => updateSibling(index, 'name', value)}
                    placeholder="Sibling's full name"
                    variant="filled"
                    size="sm"
                  />

                  <CustomCombobox
                    label="Relationship"
                    value={sibling.relationship}
                    options={RELATIONSHIP_OPTIONS.filter(
                      (opt) => opt.value === 'brother' || opt.value === 'sister'
                    )}
                    onChange={(value) => updateSibling(index, 'relationship', value as string)}
                    size="sm"
                  />

                  <CustomInput
                    label="Date of Birth"
                    type="datetime-local"
                    showTime={false}
                    value={sibling.date_of_birth}
                    onChange={(value) => updateSibling(index, 'date_of_birth', value)}
                    variant="filled"
                    size="sm"
                  />
                </div>

                <div className="flex justify-end mt-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeSibling(index)}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    <Minus className="h-3 w-3 mr-1" />
                    Remove
                  </Button>
                </div>
              </div>
            ))}

            {siblings.length === 0 && (
              <div className="text-center py-4 text-gray-500 dark:text-gray-400">
                <Users className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No siblings added yet</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default FamilyInfoSection
