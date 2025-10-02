// src/renderer/src/presentation/pages/PeopleManager/components/CreatePeopleModal.tsx
import React, { useState } from 'react'
import CustomModal from '../../../../components/common/CustomModal'
import CustomInput from '../../../../components/common/CustomInput'
import CustomCombobox from '../../../../components/common/CustomCombobox'
import { Badge } from '../../../../components/ui/badge'
import { User, Mail, Phone, Calendar, Users } from 'lucide-react'
import { Person, PersonInfo, Contact } from '../types'
import { GENDER_OPTIONS } from '../constants'
import NationalityCombobox from './NationalityCombobox'
import { getPhoneCodeByNationality } from '../constants'
import CustomBadge from '../../../../components/common/CustomBadge'

interface CreatePeopleModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: () => Promise<Person | null>
  onCreatePersonInfo?: (data: Omit<PersonInfo, 'id'>) => Promise<PersonInfo | null>
  onCreateContact?: (data: Omit<Contact, 'id'>) => Promise<Contact | null>
  loading?: boolean
}

const CreatePeopleModal: React.FC<CreatePeopleModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  onCreatePersonInfo,
  onCreateContact,
  loading = false
}) => {
  // Form state
  const [fullName, setFullName] = useState('')
  const [preferredName, setPreferredName] = useState('')
  const [gender, setGender] = useState('')
  const [dateOfBirth, setDateOfBirth] = useState('')
  const [nationality, setNationality] = useState('')
  const [primaryEmail, setPrimaryEmail] = useState('')
  const [primaryPhone, setPrimaryPhone] = useState('')

  // Internal loading state
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Form validation state
  const [errors, setErrors] = useState<Record<string, string>>({})

  // Options for dropdowns
  const genderOptions = [
    { value: GENDER_OPTIONS.MALE, label: 'Male' },
    { value: GENDER_OPTIONS.FEMALE, label: 'Female' },
    { value: GENDER_OPTIONS.OTHER, label: 'Other' }
  ]

  // Form validation
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {}

    // Required fields
    if (!fullName.trim()) {
      newErrors.fullName = 'Full name is required'
    }

    // Email validation
    if (primaryEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(primaryEmail)) {
      newErrors.primaryEmail = 'Please enter a valid email address'
    }

    // Date of birth validation
    if (dateOfBirth) {
      const birthDate = new Date(dateOfBirth)
      const today = new Date()
      if (birthDate > today) {
        newErrors.dateOfBirth = 'Date of birth cannot be in the future'
      }
    }

    // Phone number basic validation
    if (primaryPhone && !/^[\+]?[\d\s\-\(\)]+$/.test(primaryPhone)) {
      newErrors.primaryPhone = 'Please enter a valid phone number'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  // Handle form submission
  const handleSubmit = async () => {
    if (!validateForm()) {
      return
    }

    try {
      setIsSubmitting(true)

      // Step 1: Create Person first
      const newPerson = await onSubmit()

      if (!newPerson) {
        console.error('[CreatePeopleModal] Failed to create person')
        setErrors({ submit: 'Failed to create person. Please check the console for details.' })
        return
      }

      console.log('[CreatePeopleModal] Person created:', newPerson)

      if (!newPerson) {
        setErrors({ submit: 'Failed to create person' })
        return
      }

      // Step 2: Create PersonInfo with the person_id
      if (onCreatePersonInfo) {
        const personInfoData: Omit<PersonInfo, 'id'> = {
          person_id: newPerson.id,
          full_name: fullName.trim(),
          preferred_name: preferredName.trim() || undefined,
          gender: (gender as any) || undefined,
          metadata: {}
        }

        const createdPersonInfo = await onCreatePersonInfo(personInfoData)
        if (!createdPersonInfo) {
          console.error('Failed to create person info')
        }
      }

      // Step 3: Create email contact if provided
      // Step 3: Create email contact if provided
      if (primaryEmail.trim() && onCreateContact) {
        const emailContact: Omit<Contact, 'id'> = {
          person_id: newPerson.id,
          contact_type: 'email',
          email_address: primaryEmail.trim(),
          is_primary: true,
          metadata: {}
        }

        const createdEmail = await onCreateContact(emailContact)
        if (!createdEmail) {
          console.error('Failed to create email contact')
        }
      }

      // Step 4: Create phone contact if provided
      if (primaryPhone.trim() && onCreateContact) {
        const phoneContact: Omit<Contact, 'id'> = {
          person_id: newPerson.id,
          contact_type: 'sms',
          phone_number: primaryPhone.trim(),
          is_primary: true,
          metadata: {}
        }

        const createdPhone = await onCreateContact(phoneContact)
        if (!createdPhone) {
          console.error('Failed to create phone contact')
        }
      }

      // Success - reset and close
      resetForm()
      onClose()
    } catch (error) {
      console.error('Error creating person:', error)
      setErrors({ submit: 'An error occurred while creating the person' })
    } finally {
      setIsSubmitting(false)
    }
  }

  // Handle form reset when modal closes
  const handleClose = () => {
    if (!loading && !isSubmitting) {
      resetForm()
      onClose()
    }
  }

  // Reset form
  const resetForm = () => {
    setFullName('')
    setPreferredName('')
    setGender('')
    setDateOfBirth('')
    setNationality('')
    setPrimaryEmail('')
    setPrimaryPhone('')
    setErrors({})
  }

  return (
    <CustomModal
      isOpen={isOpen}
      onClose={handleClose}
      title="Create New Person"
      actionText="Create Person"
      onAction={handleSubmit}
      actionDisabled={loading || isSubmitting}
      actionLoading={loading || isSubmitting}
      size="lg"
      headerActions={
        <Badge variant="secondary" className="bg-blue-50 text-blue-700 border-blue-200">
          <Users className="h-3 w-3 mr-1" />
          New Person
        </Badge>
      }
    >
      <div className="p-6 space-y-6">
        {/* Submit Error */}
        {errors.submit && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3">
            <p className="text-sm text-red-700 dark:text-red-400">{errors.submit}</p>
          </div>
        )}

        {/* Basic Information */}
        <div className="space-y-4">
          <h3 className="text-base font-semibold text-text-primary flex items-center gap-2">
            <User className="h-4 w-4 text-blue-600" />
            Basic Information
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Full Name */}
            <CustomInput
              label="Full Name"
              value={fullName}
              onChange={setFullName}
              placeholder="Enter full name..."
              variant="filled"
              size="sm"
              leftIcon={<User className="h-3.5 w-3.5" />}
              error={errors.fullName}
              required
            />

            {/* Preferred Name */}
            <CustomInput
              label="Preferred Name"
              value={preferredName}
              onChange={setPreferredName}
              placeholder="Nickname or preferred name..."
              variant="filled"
              size="sm"
            />

            {/* Gender */}
            <CustomCombobox
              label="Gender"
              value={gender}
              options={genderOptions}
              onChange={(value) => setGender(value as string)}
              placeholder="Select gender..."
              searchable={false}
              creatable={false}
              size="sm"
            />

            {/* Date of Birth */}
            <CustomInput
              label="Date of Birth"
              type="datetime-local"
              showTime={false}
              value={dateOfBirth}
              onChange={setDateOfBirth}
              variant="filled"
              size="sm"
              leftIcon={<Calendar className="h-3.5 w-3.5" />}
              error={errors.dateOfBirth}
            />

            {/* Nationality */}
            <div className="md:col-span-2">
              <NationalityCombobox
                value={nationality}
                onChange={setNationality}
                placeholder="Select your nationality..."
                size="sm"
              />
            </div>
          </div>
        </div>

        {/* Contact Information */}
        <div className="space-y-4">
          <h3 className="text-base font-semibold text-text-primary flex items-center gap-2">
            <Mail className="h-4 w-4 text-green-600" />
            Contact Information
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Primary Email */}
            <CustomInput
              label="Primary Email"
              value={primaryEmail}
              onChange={setPrimaryEmail}
              placeholder="example@email.com"
              variant="filled"
              size="sm"
              leftIcon={<Mail className="h-3.5 w-3.5" />}
              error={errors.primaryEmail}
              type="email"
            />

            {/* Primary Phone */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Primary Phone
              </label>
              <div className="flex gap-2 items-start">
                {/* Phone Code Badge */}
                {nationality && (
                  <div className="flex-shrink-0">
                    <CustomBadge variant="input-filled" size="sm" className="font-semibold">
                      {getPhoneCodeByNationality(nationality)}
                    </CustomBadge>
                  </div>
                )}

                {/* Phone Input */}
                <div className="flex-1">
                  <CustomInput
                    value={primaryPhone}
                    onChange={setPrimaryPhone}
                    placeholder={nationality ? 'xxx xxx xxx' : 'Please select nationality first'}
                    variant="filled"
                    size="sm"
                    leftIcon={<Phone className="h-3.5 w-3.5" />}
                    error={errors.primaryPhone}
                    disabled={!nationality}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </CustomModal>
  )
}

export default CreatePeopleModal
