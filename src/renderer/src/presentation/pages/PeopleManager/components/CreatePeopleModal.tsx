// src/renderer/src/presentation/pages/PeopleManager/components/CreatePeopleModal.tsx
import React, { useState } from 'react'
import CustomModal from '../../../../components/common/CustomModal'
import CustomInput from '../../../../components/common/CustomInput'
import CustomCombobox from '../../../../components/common/CustomCombobox'
import { Badge } from '../../../../components/ui/badge'
import { User, Mail, Phone, Calendar, Users } from 'lucide-react'
import { Person } from '../types'
import { GENDER_OPTIONS, PRIVACY_LEVELS } from '../constants'
import NationalityCombobox from './NationalityCombobox'

interface CreatePeopleModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (personData: Omit<Person, 'id'>) => void
  loading?: boolean
}

const CreatePeopleModal: React.FC<CreatePeopleModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  loading = false
}) => {
  // Form state - chỉ giữ lại các field cơ bản
  const [fullName, setFullName] = useState('')
  const [preferredName, setPreferredName] = useState('')
  const [gender, setGender] = useState('')
  const [dateOfBirth, setDateOfBirth] = useState('')
  const [nationality, setNationality] = useState('')
  const [primaryEmail, setPrimaryEmail] = useState('')
  const [primaryPhone, setPrimaryPhone] = useState('')

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
  const handleSubmit = () => {
    if (!validateForm()) {
      return
    }

    const now = new Date().toISOString()

    const personData: Omit<Person, 'id'> = {
      full_name: fullName.trim(),
      preferred_name: preferredName.trim() || undefined,
      gender: (gender as any) || undefined,
      date_of_birth: dateOfBirth || undefined,
      nationality: nationality.trim() || undefined,
      primary_email: primaryEmail.trim() || undefined,
      primary_phone: primaryPhone.trim() || undefined,
      privacy_level: PRIVACY_LEVELS.PRIVATE, // Mặc định private
      created_at: now,
      updated_at: now
    }

    onSubmit(personData)
  }

  // Handle form reset when modal closes
  const handleClose = () => {
    if (!loading) {
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
      actionDisabled={loading}
      actionLoading={loading}
      size="lg"
      headerActions={
        <Badge variant="secondary" className="bg-blue-50 text-blue-700 border-blue-200">
          <Users className="h-3 w-3 mr-1" />
          New Person
        </Badge>
      }
    >
      <div className="p-6 space-y-6">
        {/* Basic Information */}
        <div className="space-y-4">
          <h3 className="text-base font-semibold text-gray-900 dark:text-white flex items-center gap-2">
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

            {/* Date of Birth - Changed from type="date" to type="datetime-local" and showTime={false} */}
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
          <h3 className="text-base font-semibold text-gray-900 dark:text-white flex items-center gap-2">
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
            <CustomInput
              label="Primary Phone"
              value={primaryPhone}
              onChange={setPrimaryPhone}
              placeholder="+84 xxx xxx xxx"
              variant="filled"
              size="sm"
              leftIcon={<Phone className="h-3.5 w-3.5" />}
              error={errors.primaryPhone}
            />
          </div>
        </div>
      </div>
    </CustomModal>
  )
}

export default CreatePeopleModal
