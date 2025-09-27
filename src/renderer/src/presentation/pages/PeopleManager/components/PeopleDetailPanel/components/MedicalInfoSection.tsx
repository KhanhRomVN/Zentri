// src/renderer/src/presentation/pages/PeopleManager/components/PeopleDetailPanel/components/MedicalInfoSection.tsx
import React, { useState } from 'react'
import { Button } from '../../../../../../components/ui/button'
import CustomInput from '../../../../../../components/common/CustomInput'
import CustomCombobox from '../../../../../../components/common/CustomCombobox'
import CustomTag from '../../../../../../components/common/CustomTag'
import { cn } from '../../../../../../shared/lib/utils'
import { Person } from '../../../types'
import {
  Heart,
  AlertTriangle,
  Pill,
  Stethoscope,
  Droplets,
  Check,
  Plus,
  Minus,
  Calendar
} from 'lucide-react'

interface MedicalInfoSectionProps {
  person: Person
  className?: string
  onUpdatePerson?: (id: string, updates: Partial<Person>) => Promise<boolean>
}

const BLOOD_TYPE_OPTIONS = [
  { value: 'A+', label: 'A+' },
  { value: 'A-', label: 'A-' },
  { value: 'B+', label: 'B+' },
  { value: 'B-', label: 'B-' },
  { value: 'AB+', label: 'AB+' },
  { value: 'AB-', label: 'AB-' },
  { value: 'O+', label: 'O+' },
  { value: 'O-', label: 'O-' }
]

const MedicalInfoSection: React.FC<MedicalInfoSectionProps> = ({
  person,
  className,
  onUpdatePerson
}) => {
  // Medical information state
  const [bloodType, setBloodType] = useState(person.blood_type || '')
  const [primaryCarePhysician, setPrimaryCarePhysician] = useState(
    person.primary_care_physician || ''
  )
  const [medicalConditions, setMedicalConditions] = useState<string[]>(
    person.medical_conditions || []
  )
  const [allergies, setAllergies] = useState<string[]>(person.allergies || [])
  const [medications, setMedications] = useState(person.medications || [])

  // Loading and status states
  const [savingField, setSavingField] = useState<string | null>(null)
  const [saveStatus, setSaveStatus] = useState<{ [key: string]: 'success' | 'error' | null }>({})

  const handleSaveField = async (field: string, value: any) => {
    if (!person.id || !onUpdatePerson) return

    try {
      setSavingField(field)
      const updates: Partial<Person> = {}

      switch (field) {
        case 'blood_type':
          updates.blood_type = value as string
          break
        case 'primary_care_physician':
          updates.primary_care_physician = value as string
          break
        case 'medical_conditions':
          updates.medical_conditions = value as string[]
          break
        case 'allergies':
          updates.allergies = value as string[]
          break
        case 'medications':
          updates.medications = value as any[]
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

  // Medications management
  const addMedication = () => {
    const newMedications = [
      ...medications,
      {
        name: '',
        dosage: '',
        frequency: '',
        prescribing_doctor: ''
      }
    ]
    setMedications(newMedications)
  }

  const updateMedication = (index: number, field: string, value: string) => {
    const newMedications = [...medications]
    newMedications[index] = { ...newMedications[index], [field]: value }
    setMedications(newMedications)
  }

  const removeMedication = (index: number) => {
    const newMedications = medications.filter((_, i) => i !== index)
    setMedications(newMedications)
    handleSaveField('medications', newMedications)
  }

  return (
    <div className={cn('space-y-4 p-4', className)}>
      {/* Header */}
      <div className="pl-1">
        <h3 className="text-lg font-semibold text-text-primary flex items-center gap-2">
          <Heart className="h-4 w-4 text-red-600 dark:text-red-400" />
          Medical Information
        </h3>
        <p className="text-gray-600 dark:text-gray-400 text-xs mt-0.5">
          Health and medical details for {person.full_name}
        </p>
      </div>

      {/* Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Basic Medical Info */}
        <div className="bg-card-background rounded-lg border border-border-default hover:border-border-hover shadow-sm hover:shadow transition-all duration-200">
          <div className="p-3">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-5 h-5 bg-red-50 dark:bg-red-900/20 rounded flex items-center justify-center">
                <Droplets className="h-3 w-3 text-red-600 dark:text-red-400" />
              </div>
              <h5 className="text-sm font-medium text-text-primary">Basic Information</h5>
            </div>

            <div className="space-y-3">
              <CustomCombobox
                label="Blood Type"
                value={bloodType}
                options={BLOOD_TYPE_OPTIONS}
                onChange={(value) => setBloodType(value as string)}
                placeholder="Select blood type..."
                size="sm"
              />
              {renderStatusIcon(
                'blood_type',
                bloodType !== (person.blood_type || ''),
                bloodType,
                person.blood_type
              )}

              <CustomInput
                label="Primary Care Physician"
                value={primaryCarePhysician}
                onChange={setPrimaryCarePhysician}
                placeholder="Doctor's name"
                variant="filled"
                size="sm"
                leftIcon={<Stethoscope className="h-3 w-3" />}
                rightIcon={renderStatusIcon(
                  'primary_care_physician',
                  primaryCarePhysician !== (person.primary_care_physician || ''),
                  primaryCarePhysician,
                  person.primary_care_physician
                )}
              />
            </div>
          </div>
        </div>

        {/* Medical Conditions */}
        <div className="bg-card-background rounded-lg border border-border-default hover:border-border-hover shadow-sm hover:shadow transition-all duration-200">
          <div className="p-3">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-5 h-5 bg-orange-50 dark:bg-orange-900/20 rounded flex items-center justify-center">
                <AlertTriangle className="h-3 w-3 text-orange-600 dark:text-orange-400" />
              </div>
              <h5 className="text-sm font-medium text-text-primary">Medical Conditions</h5>
            </div>

            <CustomTag
              tags={medicalConditions}
              onTagsChange={setMedicalConditions}
              placeholder="Add medical condition..."
              allowDuplicates={false}
            />
            {renderStatusIcon(
              'medical_conditions',
              JSON.stringify(medicalConditions) !== JSON.stringify(person.medical_conditions || []),
              medicalConditions,
              person.medical_conditions
            )}
          </div>
        </div>

        {/* Allergies */}
        <div className="bg-card-background rounded-lg border border-border-default hover:border-border-hover shadow-sm hover:shadow transition-all duration-200">
          <div className="p-3">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-5 h-5 bg-yellow-50 dark:bg-yellow-900/20 rounded flex items-center justify-center">
                <AlertTriangle className="h-3 w-3 text-yellow-600 dark:text-yellow-400" />
              </div>
              <h5 className="text-sm font-medium text-text-primary">Allergies</h5>
            </div>

            <CustomTag
              tags={allergies}
              onTagsChange={setAllergies}
              placeholder="Add allergy..."
              allowDuplicates={false}
            />
            {renderStatusIcon(
              'allergies',
              JSON.stringify(allergies) !== JSON.stringify(person.allergies || []),
              allergies,
              person.allergies
            )}
          </div>
        </div>

        {/* Medications */}
        <div className="lg:col-span-2 bg-card-background rounded-lg border border-border-default hover:border-border-hover shadow-sm hover:shadow transition-all duration-200">
          <div className="p-3">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 bg-blue-50 dark:bg-blue-900/20 rounded flex items-center justify-center">
                  <Pill className="h-3 w-3 text-blue-600 dark:text-blue-400" />
                </div>
                <h5 className="text-sm font-medium text-text-primary">Medications</h5>
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={addMedication}
                className="text-xs"
                disabled={savingField !== null}
              >
                <Plus className="h-3 w-3 mr-1" />
                Add Medication
              </Button>
            </div>

            <div className="space-y-4">
              {medications.map((med, index) => (
                <div key={index} className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
                    <CustomInput
                      label="Medication Name"
                      value={med.name || ''}
                      onChange={(value) => updateMedication(index, 'name', value)}
                      placeholder="Medication name"
                      variant="filled"
                      size="sm"
                    />

                    <CustomInput
                      label="Dosage"
                      value={med.dosage || ''}
                      onChange={(value) => updateMedication(index, 'dosage', value)}
                      placeholder="Dosage amount"
                      variant="filled"
                      size="sm"
                    />

                    <CustomInput
                      label="Frequency"
                      value={med.frequency || ''}
                      onChange={(value) => updateMedication(index, 'frequency', value)}
                      placeholder="How often to take"
                      variant="filled"
                      size="sm"
                    />

                    <CustomInput
                      label="Prescribing Doctor"
                      value={med.prescribing_doctor || ''}
                      onChange={(value) => updateMedication(index, 'prescribing_doctor', value)}
                      placeholder="Doctor's name"
                      variant="filled"
                      size="sm"
                    />
                  </div>

                  <div className="flex justify-end">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeMedication(index)}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      <Minus className="h-3 w-3 mr-1" />
                      Remove
                    </Button>
                  </div>
                </div>
              ))}

              {medications.length === 0 && (
                <div className="text-center py-4 text-gray-500 dark:text-gray-400">
                  <Pill className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No medications added yet</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Emergency Medical Notice */}
      <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-lg p-4">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center">
            <AlertTriangle className="h-4 w-4 text-red-600 dark:text-red-400" />
          </div>
          <div>
            <h4 className="text-sm font-medium text-red-800 dark:text-red-300 mb-1">
              Emergency Medical Information
            </h4>
            <p className="text-xs text-red-700 dark:text-red-400">
              This information could be critical in emergency situations. Ensure it's kept up to
              date and accurate.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default MedicalInfoSection
