// src/renderer/src/presentation/pages/PeopleManager/components/PeopleDetailPanel/components/BasicInfoSection.tsx
import React, { useState } from 'react'
import { Button } from '../../../../../../components/ui/button'
import CustomInput from '../../../../../../components/common/CustomInput'
import CustomCombobox from '../../../../../../components/common/CustomCombobox'
import CustomTag from '../../../../../../components/common/CustomTag'
import Metadata from '../../../../../../components/common/Metadata'
import {
  User,
  Mail,
  Phone,
  MapPin,
  Tag,
  FileText,
  Check,
  Copy,
  Calendar,
  Globe,
  Users,
  Briefcase,
  Heart,
  Palette
} from 'lucide-react'
import { cn } from '../../../../../../shared/lib/utils'
import { Person } from '../../../types'

interface BasicInfoSectionProps {
  person: Person
  className?: string
  onUpdatePerson?: (id: string, updates: Partial<Person>) => Promise<boolean>
}

const GENDER_OPTIONS = [
  { value: 'male', label: 'Male' },
  { value: 'female', label: 'Female' },
  { value: 'other', label: 'Other' }
]

const MARITAL_STATUS_OPTIONS = [
  { value: 'single', label: 'Single' },
  { value: 'married', label: 'Married' },
  { value: 'divorced', label: 'Divorced' },
  { value: 'widowed', label: 'Widowed' }
]

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

const PRIVACY_LEVEL_OPTIONS = [
  { value: 'public', label: 'Public' },
  { value: 'private', label: 'Private' },
  { value: 'confidential', label: 'Confidential' }
]

const BasicInfoSection: React.FC<BasicInfoSectionProps> = ({
  person,
  className,
  onUpdatePerson
}) => {
  // Editable fields - khởi tạo từ person prop
  const [fullName, setFullName] = useState(person.full_name || '')
  const [preferredName, setPreferredName] = useState(person.preferred_name || '')
  const [gender, setGender] = useState(person.gender || '')
  const [dateOfBirth, setDateOfBirth] = useState(person.date_of_birth || '')
  const [placeOfBirth, setPlaceOfBirth] = useState(person.place_of_birth || '')
  const [nationality, setNationality] = useState(person.nationality || '')
  const [ethnicOrigin, setEthnicOrigin] = useState(person.ethnic_origin || '')
  const [primaryEmail, setPrimaryEmail] = useState(person.primary_email || '')
  const [primaryPhone, setPrimaryPhone] = useState(person.primary_phone || '')
  const [occupation, setOccupation] = useState(person.occupation || '')
  const [employer, setEmployer] = useState(person.employer || '')
  const [jobTitle, setJobTitle] = useState(person.job_title || '')
  const [height, setHeight] = useState(person.height?.toString() || '')
  const [weight, setWeight] = useState(person.weight?.toString() || '')
  const [eyeColor, setEyeColor] = useState(person.eye_color || '')
  const [hairColor, setHairColor] = useState(person.hair_color || '')
  const [bloodType, setBloodType] = useState(person.blood_type || '')
  const [maritalStatus, setMaritalStatus] = useState(person.marital_status || '')
  const [website, setWebsite] = useState(person.website || '')
  const [taxId, setTaxId] = useState(person.tax_identification_number || '')
  const [primaryCarePhysician, setPrimaryCarePhysician] = useState(
    person.primary_care_physician || ''
  )
  const [editedTags, setEditedTags] = useState<string[]>(person.tags || [])
  const [notes, setNotes] = useState(person.notes || '')
  const [privacyLevel, setPrivacyLevel] = useState(person.privacy_level || 'private')

  // Metadata với các trường hệ thống không thể xóa
  const [metadata, setMetadata] = useState<Record<string, any>>(() => {
    const baseMetadata = person.metadata ? { ...person.metadata } : {}
    return {
      created_at: baseMetadata.created_at || person.created_at || new Date().toISOString(),
      updated_at: baseMetadata.updated_at || person.updated_at || new Date().toISOString(),
      ...baseMetadata
    }
  })

  // State để theo dõi trạng thái loading và feedback
  const [savingField, setSavingField] = useState<string | null>(null)
  const [saveStatus, setSaveStatus] = useState<{ [key: string]: 'success' | 'error' | null }>({})

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text)
    } catch (err) {
      console.error('Failed to copy:', err)
    }
  }

  // Hàm xử lý lưu field
  const handleSaveField = async (
    field: string,
    value: string | string[] | number | Record<string, any>
  ) => {
    if (!person.id || !onUpdatePerson) {
      console.error('Missing person ID or update function')
      return
    }

    try {
      setSavingField(field)

      const updates: Partial<Person> = {}

      // Xử lý mapping field name sang database field
      switch (field) {
        case 'full_name':
          updates.full_name = value as string
          break
        case 'preferred_name':
          updates.preferred_name = value as string
          break
        case 'gender':
          updates.gender = value as string
          break
        case 'date_of_birth':
          updates.date_of_birth = value as string
          break
        case 'place_of_birth':
          updates.place_of_birth = value as string
          break
        case 'nationality':
          updates.nationality = value as string
          break
        case 'ethnic_origin':
          updates.ethnic_origin = value as string
          break
        case 'primary_email':
          updates.primary_email = value as string
          break
        case 'primary_phone':
          updates.primary_phone = value as string
          break
        case 'occupation':
          updates.occupation = value as string
          break
        case 'employer':
          updates.employer = value as string
          break
        case 'job_title':
          updates.job_title = value as string
          break
        case 'height':
          updates.height = value ? parseInt(value as string) : undefined
          break
        case 'weight':
          updates.weight = value ? parseInt(value as string) : undefined
          break
        case 'eye_color':
          updates.eye_color = value as string
          break
        case 'hair_color':
          updates.hair_color = value as string
          break
        case 'blood_type':
          updates.blood_type = value as string
          break
        case 'marital_status':
          updates.marital_status = value as string
          break
        case 'website':
          updates.website = value as string
          break
        case 'tax_identification_number':
          updates.tax_identification_number = value as string
          break
        case 'primary_care_physician':
          updates.primary_care_physician = value as string
          break
        case 'tags':
          updates.tags = value as string[]
          break
        case 'notes':
          updates.notes = value as string
          break
        case 'privacy_level':
          updates.privacy_level = value as string
          break
        case 'metadata':
          updates.metadata = value as Record<string, any>
          break
        default:
          console.warn(`Unhandled field: ${field}`)
          return
      }

      const success = await onUpdatePerson(person.id, updates)

      if (success) {
        setSaveStatus((prev) => ({ ...prev, [field]: 'success' }))
        setTimeout(() => {
          setSaveStatus((prev) => ({ ...prev, [field]: null }))
        }, 2000)
      } else {
        setSaveStatus((prev) => ({ ...prev, [field]: 'error' }))
      }
    } catch (error) {
      console.error(`Error saving ${field}:`, error)
      setSaveStatus((prev) => ({ ...prev, [field]: 'error' }))
    } finally {
      setSavingField(null)
    }
  }

  // Check if values have changed (giữ nguyên logic)
  const hasFullNameChanged = fullName !== (person.full_name || '')
  const hasPreferredNameChanged = preferredName !== (person.preferred_name || '')
  const hasGenderChanged = gender !== (person.gender || '')
  const hasDateOfBirthChanged = dateOfBirth !== (person.date_of_birth || '')
  const hasPlaceOfBirthChanged = placeOfBirth !== (person.place_of_birth || '')
  const hasNationalityChanged = nationality !== (person.nationality || '')
  const hasEthnicOriginChanged = ethnicOrigin !== (person.ethnic_origin || '')
  const hasPrimaryEmailChanged = primaryEmail !== (person.primary_email || '')
  const hasPrimaryPhoneChanged = primaryPhone !== (person.primary_phone || '')
  const hasOccupationChanged = occupation !== (person.occupation || '')
  const hasEmployerChanged = employer !== (person.employer || '')
  const hasJobTitleChanged = jobTitle !== (person.job_title || '')
  const hasHeightChanged = height !== (person.height?.toString() || '')
  const hasWeightChanged = weight !== (person.weight?.toString() || '')
  const hasEyeColorChanged = eyeColor !== (person.eye_color || '')
  const hasHairColorChanged = hairColor !== (person.hair_color || '')
  const hasBloodTypeChanged = bloodType !== (person.blood_type || '')
  const hasMaritalStatusChanged = maritalStatus !== (person.marital_status || '')
  const hasWebsiteChanged = website !== (person.website || '')
  const hasTaxIdChanged = taxId !== (person.tax_identification_number || '')
  const hasPrimaryCarePhysicianChanged =
    primaryCarePhysician !== (person.primary_care_physician || '')
  const hasNotesChanged = notes !== (person.notes || '')
  const hasPrivacyLevelChanged = privacyLevel !== (person.privacy_level || 'private')

  const handleTagsChange = (newTags: string[]) => {
    setEditedTags(newTags)
  }

  const handleMetadataChange = (newMetadata: Record<string, any>) => {
    const cleanedMetadata = Object.fromEntries(
      Object.entries(newMetadata).filter(
        ([_, value]) => value !== null && value !== undefined && value !== ''
      )
    )

    const finalMetadata = {
      created_at: metadata.created_at || person.created_at || new Date().toISOString(),
      updated_at: metadata.updated_at || person.updated_at || new Date().toISOString(),
      ...cleanedMetadata
    }

    setMetadata(finalMetadata)

    if (JSON.stringify(finalMetadata) !== JSON.stringify(person.metadata || {})) {
      handleSaveField('metadata', finalMetadata)
    }
  }

  // Hàm render icon trạng thái cho input
  const renderStatusIcon = (field: string, hasChanged: boolean) => {
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
          onClick={() => {
            const fieldMap: Record<string, any> = {
              full_name: fullName,
              preferred_name: preferredName,
              gender: gender,
              date_of_birth: dateOfBirth,
              place_of_birth: placeOfBirth,
              nationality: nationality,
              ethnic_origin: ethnicOrigin,
              primary_email: primaryEmail,
              primary_phone: primaryPhone,
              occupation: occupation,
              employer: employer,
              job_title: jobTitle,
              height: height ? parseInt(height) : undefined,
              weight: weight ? parseInt(weight) : undefined,
              eye_color: eyeColor,
              hair_color: hairColor,
              blood_type: bloodType,
              marital_status: maritalStatus,
              website: website,
              tax_identification_number: taxId,
              primary_care_physician: primaryCarePhysician,
              tags: editedTags,
              notes: notes,
              privacy_level: privacyLevel
            }
            handleSaveField(field, fieldMap[field])
          }}
          className="p-0.5 h-4 w-4 text-green-600 hover:text-green-700 hover:bg-green-50"
          disabled={savingField !== null}
        >
          <Check className="h-2 w-2" />
        </Button>
      )
    }

    return undefined
  }

  return (
    <div className={cn('space-y-4 p-4', className)}>
      {/* Header - Compact hơn */}
      <div className="flex items-center justify-between">
        <div className="pl-1">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
            <User className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
            Basic Information
          </h3>
          <p className="text-gray-600 dark:text-gray-400 text-xs mt-0.5">
            Personal details for {person.full_name}
          </p>
        </div>
      </div>

      {/* Grid Layout - Sử dụng grid responsive */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Personal Identity Section */}
        <div className="bg-card-background rounded-lg border border-border-default hover:border-border-hover shadow-sm hover:shadow transition-all duration-200">
          <div className="p-3">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-5 h-5 bg-blue-50 dark:bg-blue-900/20 rounded flex items-center justify-center">
                <User className="h-3 w-3 text-blue-600 dark:text-blue-400" />
              </div>
              <h5 className="text-sm font-medium text-gray-900 dark:text-white">Identity</h5>
            </div>

            <div className="space-y-3">
              <CustomInput
                label="Full Name"
                value={fullName}
                onChange={setFullName}
                placeholder="Enter full name..."
                variant="filled"
                size="sm"
                leftIcon={<User className="h-3 w-3" />}
                rightIcon={renderStatusIcon('full_name', hasFullNameChanged)}
                disabled={savingField !== null && savingField !== 'full_name'}
                required
              />

              <CustomInput
                label="Preferred Name"
                value={preferredName}
                onChange={setPreferredName}
                placeholder="Enter preferred name..."
                variant="filled"
                size="sm"
                rightIcon={renderStatusIcon('preferred_name', hasPreferredNameChanged)}
                disabled={savingField !== null && savingField !== 'preferred_name'}
              />

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Gender
                  </label>
                  <div className="flex items-center gap-1">
                    <div className="flex-1">
                      <CustomCombobox
                        label=""
                        value={gender}
                        options={GENDER_OPTIONS}
                        onChange={(value) => setGender(value as string)}
                        placeholder="Select gender..."
                        size="sm"
                      />
                    </div>
                    {renderStatusIcon('gender', hasGenderChanged)}
                  </div>
                </div>

                <CustomInput
                  label="Date of Birth"
                  type="datetime-local"
                  value={dateOfBirth}
                  onChange={setDateOfBirth}
                  placeholder="Select date..."
                  variant="filled"
                  size="sm"
                  leftIcon={<Calendar className="h-3 w-3" />}
                  rightIcon={renderStatusIcon('date_of_birth', hasDateOfBirthChanged)}
                  disabled={savingField !== null && savingField !== 'date_of_birth'}
                  showTime={false}
                />
              </div>

              <CustomInput
                label="Place of Birth"
                value={placeOfBirth}
                onChange={setPlaceOfBirth}
                placeholder="Enter place of birth..."
                variant="filled"
                size="sm"
                leftIcon={<MapPin className="h-3 w-3" />}
                rightIcon={renderStatusIcon('place_of_birth', hasPlaceOfBirthChanged)}
                disabled={savingField !== null && savingField !== 'place_of_birth'}
              />

              <div className="grid grid-cols-2 gap-2">
                <CustomInput
                  label="Nationality"
                  value={nationality}
                  onChange={setNationality}
                  placeholder="Enter nationality..."
                  variant="filled"
                  size="sm"
                  leftIcon={<Globe className="h-3 w-3" />}
                  rightIcon={renderStatusIcon('nationality', hasNationalityChanged)}
                  disabled={savingField !== null && savingField !== 'nationality'}
                />

                <CustomInput
                  label="Ethnic Origin"
                  value={ethnicOrigin}
                  onChange={setEthnicOrigin}
                  placeholder="Enter ethnic origin..."
                  variant="filled"
                  size="sm"
                  leftIcon={<Users className="h-3 w-3" />}
                  rightIcon={renderStatusIcon('ethnic_origin', hasEthnicOriginChanged)}
                  disabled={savingField !== null && savingField !== 'ethnic_origin'}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Contact Information Section */}
        <div className="bg-card-background rounded-lg border border-border-default hover:border-border-hover shadow-sm hover:shadow transition-all duration-200">
          <div className="p-3">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-5 h-5 bg-green-50 dark:bg-green-900/20 rounded flex items-center justify-center">
                <Mail className="h-3 w-3 text-green-600 dark:text-green-400" />
              </div>
              <h5 className="text-sm font-medium text-gray-900 dark:text-white">Contact</h5>
            </div>

            <div className="space-y-3">
              <CustomInput
                label="Primary Email"
                type="email"
                value={primaryEmail}
                onChange={setPrimaryEmail}
                placeholder="Enter email address..."
                variant="filled"
                size="sm"
                leftIcon={<Mail className="h-3 w-3" />}
                rightIcon={
                  <div className="flex items-center gap-0.5">
                    {primaryEmail && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => copyToClipboard(primaryEmail)}
                        className="p-0.5 h-4 w-4 hover:bg-gray-50 dark:hover:bg-gray-700"
                        disabled={savingField !== null}
                      >
                        <Copy className="h-2 w-2" />
                      </Button>
                    )}
                    {renderStatusIcon('primary_email', hasPrimaryEmailChanged)}
                  </div>
                }
                disabled={savingField !== null && savingField !== 'primary_email'}
              />

              <CustomInput
                label="Primary Phone"
                type="tel"
                value={primaryPhone}
                onChange={setPrimaryPhone}
                placeholder="Enter phone number..."
                variant="filled"
                size="sm"
                leftIcon={<Phone className="h-3 w-3" />}
                rightIcon={
                  <div className="flex items-center gap-0.5">
                    {primaryPhone && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => copyToClipboard(primaryPhone)}
                        className="p-0.5 h-4 w-4 hover:bg-gray-50 dark:hover:bg-gray-700"
                        disabled={savingField !== null}
                      >
                        <Copy className="h-2 w-2" />
                      </Button>
                    )}
                    {renderStatusIcon('primary_phone', hasPrimaryPhoneChanged)}
                  </div>
                }
                disabled={savingField !== null && savingField !== 'primary_phone'}
              />

              <CustomInput
                label="Website"
                type="url"
                value={website}
                onChange={setWebsite}
                placeholder="Enter website URL..."
                variant="filled"
                size="sm"
                leftIcon={<Globe className="h-3 w-3" />}
                rightIcon={
                  <div className="flex items-center gap-0.5">
                    {website && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => copyToClipboard(website)}
                        className="p-0.5 h-4 w-4 hover:bg-gray-50 dark:hover:bg-gray-700"
                        disabled={savingField !== null}
                      >
                        <Copy className="h-2 w-2" />
                      </Button>
                    )}
                    {renderStatusIcon('website', hasWebsiteChanged)}
                  </div>
                }
                disabled={savingField !== null && savingField !== 'website'}
              />
            </div>
          </div>
        </div>

        {/* Professional Information Section */}
        <div className="bg-card-background rounded-lg border border-border-default hover:border-border-hover shadow-sm hover:shadow transition-all duration-200">
          <div className="p-3">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-5 h-5 bg-purple-50 dark:bg-purple-900/20 rounded flex items-center justify-center">
                <Briefcase className="h-3 w-3 text-purple-600 dark:text-purple-400" />
              </div>
              <h5 className="text-sm font-medium text-gray-900 dark:text-white">Professional</h5>
            </div>

            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-2">
                <CustomInput
                  label="Occupation"
                  value={occupation}
                  onChange={setOccupation}
                  placeholder="Enter occupation..."
                  variant="filled"
                  size="sm"
                  leftIcon={<Briefcase className="h-3 w-3" />}
                  rightIcon={renderStatusIcon('occupation', hasOccupationChanged)}
                  disabled={savingField !== null && savingField !== 'occupation'}
                />

                <CustomInput
                  label="Employer"
                  value={employer}
                  onChange={setEmployer}
                  placeholder="Enter employer..."
                  variant="filled"
                  size="sm"
                  rightIcon={renderStatusIcon('employer', hasEmployerChanged)}
                  disabled={savingField !== null && savingField !== 'employer'}
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <CustomInput
                  label="Job Title"
                  value={jobTitle}
                  onChange={setJobTitle}
                  placeholder="Enter job title..."
                  variant="filled"
                  size="sm"
                  rightIcon={renderStatusIcon('job_title', hasJobTitleChanged)}
                  disabled={savingField !== null && savingField !== 'job_title'}
                />

                <CustomInput
                  label="Tax ID"
                  value={taxId}
                  onChange={setTaxId}
                  placeholder="Enter tax ID..."
                  variant="filled"
                  size="sm"
                  rightIcon={renderStatusIcon('tax_identification_number', hasTaxIdChanged)}
                  disabled={savingField !== null && savingField !== 'tax_identification_number'}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Physical Characteristics Section */}
        <div className="bg-card-background rounded-lg border border-border-default hover:border-border-hover shadow-sm hover:shadow transition-all duration-200">
          <div className="p-3">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-5 h-5 bg-orange-50 dark:bg-orange-900/20 rounded flex items-center justify-center">
                <Palette className="h-3 w-3 text-orange-600 dark:text-orange-400" />
              </div>
              <h5 className="text-sm font-medium text-gray-900 dark:text-white">Physical</h5>
            </div>

            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-2">
                <CustomInput
                  label="Height (cm)"
                  type="number"
                  value={height}
                  onChange={setHeight}
                  placeholder="Height..."
                  variant="filled"
                  size="sm"
                  rightIcon={renderStatusIcon('height', hasHeightChanged)}
                  disabled={savingField !== null && savingField !== 'height'}
                />

                <CustomInput
                  label="Weight (kg)"
                  type="number"
                  value={weight}
                  onChange={setWeight}
                  placeholder="Weight..."
                  variant="filled"
                  size="sm"
                  rightIcon={renderStatusIcon('weight', hasWeightChanged)}
                  disabled={savingField !== null && savingField !== 'weight'}
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <CustomInput
                  label="Eye Color"
                  value={eyeColor}
                  onChange={setEyeColor}
                  placeholder="Eye color..."
                  variant="filled"
                  size="sm"
                  rightIcon={renderStatusIcon('eye_color', hasEyeColorChanged)}
                  disabled={savingField !== null && savingField !== 'eye_color'}
                />

                <CustomInput
                  label="Hair Color"
                  value={hairColor}
                  onChange={setHairColor}
                  placeholder="Hair color..."
                  variant="filled"
                  size="sm"
                  rightIcon={renderStatusIcon('hair_color', hasHairColorChanged)}
                  disabled={savingField !== null && savingField !== 'hair_color'}
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Blood Type
                </label>
                <div className="flex items-center gap-1">
                  <div className="flex-1">
                    <CustomCombobox
                      label=""
                      value={bloodType}
                      options={BLOOD_TYPE_OPTIONS}
                      onChange={(value) => setBloodType(value as string)}
                      placeholder="Select blood type..."
                      size="sm"
                    />
                  </div>
                  {renderStatusIcon('blood_type', hasBloodTypeChanged)}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Personal Status Section */}
        <div className="bg-card-background rounded-lg border border-border-default hover:border-border-hover shadow-sm hover:shadow transition-all duration-200">
          <div className="p-3">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-5 h-5 bg-pink-50 dark:bg-pink-900/20 rounded flex items-center justify-center">
                <Heart className="h-3 w-3 text-pink-600 dark:text-pink-400" />
              </div>
              <h5 className="text-sm font-medium text-gray-900 dark:text-white">Status</h5>
            </div>

            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Marital Status
                  </label>
                  <div className="flex items-center gap-1">
                    <div className="flex-1">
                      <CustomCombobox
                        label=""
                        value={maritalStatus}
                        options={MARITAL_STATUS_OPTIONS}
                        onChange={(value) => setMaritalStatus(value as string)}
                        placeholder="Select status..."
                        size="sm"
                      />
                    </div>
                    {renderStatusIcon('marital_status', hasMaritalStatusChanged)}
                  </div>
                </div>

                <CustomInput
                  label="Primary Physician"
                  value={primaryCarePhysician}
                  onChange={setPrimaryCarePhysician}
                  placeholder="Enter physician..."
                  variant="filled"
                  size="sm"
                  leftIcon={<Heart className="h-3 w-3" />}
                  rightIcon={renderStatusIcon(
                    'primary_care_physician',
                    hasPrimaryCarePhysicianChanged
                  )}
                  disabled={savingField !== null && savingField !== 'primary_care_physician'}
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Privacy Level
                </label>
                <div className="flex items-center gap-1">
                  <div className="flex-1">
                    <CustomCombobox
                      label=""
                      value={privacyLevel}
                      options={PRIVACY_LEVEL_OPTIONS}
                      onChange={(value) => setPrivacyLevel(value as string)}
                      placeholder="Select privacy level..."
                      size="sm"
                    />
                  </div>
                  {renderStatusIcon('privacy_level', hasPrivacyLevelChanged)}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Tags Section */}
        <div className="bg-card-background rounded-lg border border-border-default hover:border-border-hover shadow-sm hover:shadow transition-all duration-200">
          <div className="p-3">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-5 h-5 bg-purple-50 dark:bg-purple-900/20 rounded flex items-center justify-center">
                <Tag className="h-3 w-3 text-purple-600 dark:text-purple-400" />
              </div>
              <h5 className="text-sm font-medium text-gray-900 dark:text-white">Tags</h5>
            </div>

            <CustomTag
              tags={editedTags}
              onTagsChange={(newTags) => {
                handleTagsChange(newTags)
                handleSaveField('tags', newTags)
              }}
              placeholder="Enter tag name..."
              allowDuplicates={false}
              className="mb-1"
              disabled={savingField !== null}
            />
          </div>
        </div>

        {/* Notes Section */}
        <div className="bg-card-background rounded-lg border border-border-default hover:border-border-hover shadow-sm hover:shadow transition-all duration-200">
          <div className="p-3">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-5 h-5 bg-yellow-50 dark:bg-yellow-900/20 rounded flex items-center justify-center">
                <FileText className="h-3 w-3 text-yellow-600 dark:text-yellow-400" />
              </div>
              <h5 className="text-sm font-medium text-gray-900 dark:text-white">Notes</h5>
            </div>

            <CustomInput
              label=""
              value={notes}
              onChange={setNotes}
              placeholder="Add notes about this person..."
              variant="filled"
              size="sm"
              leftIcon={<FileText className="h-3 w-3" />}
              rightIcon={renderStatusIcon('notes', hasNotesChanged)}
              disabled={savingField !== null && savingField !== 'notes'}
              multiline
              rows={3}
              showCharCount={true}
              maxLength={500}
            />
          </div>
        </div>
      </div>

      {/* Metadata Section - Full Width */}
      <div className="bg-card-background rounded-lg border border-border-default hover:border-border-hover shadow-sm hover:shadow transition-all duration-200">
        <div className="p-3">
          <Metadata
            metadata={metadata}
            onMetadataChange={handleMetadataChange}
            onDelete={(key) => {
              if (key === 'created_at' || key === 'updated_at') return
              const newMetadata = { ...metadata }
              delete newMetadata[key]
              setMetadata(newMetadata)
              handleSaveField('metadata', newMetadata)
            }}
            title="Metadata"
            compact={true}
            collapsible={true}
            defaultExpanded={false}
            editable={true}
            showDeleteButtons={true}
            hideEmpty={true}
            maxVisibleFields={8}
            protectedFields={['created_at', 'updated_at']}
            shouldRenderField={(_, value) => value !== null && value !== undefined && value !== ''}
          />
        </div>
      </div>
    </div>
  )
}

export default BasicInfoSection
