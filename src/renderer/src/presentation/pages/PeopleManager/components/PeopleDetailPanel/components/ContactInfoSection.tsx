// src/renderer/src/presentation/pages/PeopleManager/components/PeopleDetailPanel/components/ContactInfoSection.tsx
import React, { useState } from 'react'
import { Button } from '../../../../../../components/ui/button'
import CustomInput from '../../../../../../components/common/CustomInput'
import CustomTag from '../../../../../../components/common/CustomTag'
import { cn } from '../../../../../../shared/lib/utils'
import { Person } from '../../../types'
import { Mail, Phone, MapPin, Globe, Users, Copy, Check, Plus, Minus, Building } from 'lucide-react'

interface ContactInfoSectionProps {
  person: Person
  className?: string
  onUpdatePerson?: (id: string, updates: Partial<Person>) => Promise<boolean>
}

const ContactInfoSection: React.FC<ContactInfoSectionProps> = ({
  person,
  className,
  onUpdatePerson
}) => {
  // Contact information state
  const [primaryEmail, setPrimaryEmail] = useState(person.primary_email || '')
  const [secondaryEmails, setSecondaryEmails] = useState<string[]>(person.secondary_emails || [])
  const [primaryPhone, setPrimaryPhone] = useState(person.primary_phone || '')
  const [secondaryPhones, setSecondaryPhones] = useState<string[]>(person.secondary_phones || [])
  const [website, setWebsite] = useState(person.website || '')
  const [onlineUsernames, setOnlineUsernames] = useState<string[]>(person.online_usernames || [])

  // Emergency contact state
  const [emergencyContact, setEmergencyContact] = useState(
    person.emergency_contact || {
      name: '',
      relationship: '',
      phone: '',
      email: ''
    }
  )

  // Social media state
  const [socialMediaProfiles, setSocialMediaProfiles] = useState(person.social_media_profiles || [])

  // Address state
  const [currentAddress, setCurrentAddress] = useState(
    person.current_address && person.current_address.length > 0
      ? person.current_address[0]
      : {
          street: '',
          city: '',
          state_province: '',
          postal_code: '',
          country: '',
          type: 'home' as const
        }
  )

  // Loading and status states
  const [savingField, setSavingField] = useState<string | null>(null)
  const [saveStatus, setSaveStatus] = useState<{ [key: string]: 'success' | 'error' | null }>({})

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text)
    } catch (err) {
      console.error('Failed to copy:', err)
    }
  }

  const handleSaveField = async (field: string, value: any) => {
    if (!person.id || !onUpdatePerson) return

    try {
      setSavingField(field)
      const updates: Partial<Person> = {}

      switch (field) {
        case 'primary_email':
          updates.primary_email = value as string
          break
        case 'secondary_emails':
          updates.secondary_emails = value as string[]
          break
        case 'primary_phone':
          updates.primary_phone = value as string
          break
        case 'secondary_phones':
          updates.secondary_phones = value as string[]
          break
        case 'website':
          updates.website = value as string
          break
        case 'online_usernames':
          updates.online_usernames = value as string[]
          break
        case 'emergency_contact':
          updates.emergency_contact = value
          break
        case 'social_media_profiles':
          updates.social_media_profiles = value
          break
        case 'current_address':
          updates.current_address = [value]
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
          onClick={() => handleSaveField(field, eval(field))}
          className="p-0.5 h-4 w-4 text-green-600 hover:text-green-700 hover:bg-green-50"
          disabled={savingField !== null}
        >
          <Check className="h-2 w-2" />
        </Button>
      )
    }

    return undefined
  }

  const addSecondaryEmail = () => {
    const newEmails = [...secondaryEmails, '']
    setSecondaryEmails(newEmails)
  }

  const updateSecondaryEmail = (index: number, value: string) => {
    const newEmails = [...secondaryEmails]
    newEmails[index] = value
    setSecondaryEmails(newEmails)
  }

  const removeSecondaryEmail = (index: number) => {
    const newEmails = secondaryEmails.filter((_, i) => i !== index)
    setSecondaryEmails(newEmails)
    handleSaveField('secondary_emails', newEmails)
  }

  const addSecondaryPhone = () => {
    const newPhones = [...secondaryPhones, '']
    setSecondaryPhones(newPhones)
  }

  const updateSecondaryPhone = (index: number, value: string) => {
    const newPhones = [...secondaryPhones]
    newPhones[index] = value
    setSecondaryPhones(newPhones)
  }

  const removeSecondaryPhone = (index: number) => {
    const newPhones = secondaryPhones.filter((_, i) => i !== index)
    setSecondaryPhones(newPhones)
    handleSaveField('secondary_phones', newPhones)
  }

  const addSocialMediaProfile = () => {
    const newProfiles = [...socialMediaProfiles, { platform: '', username: '', url: '' }]
    setSocialMediaProfiles(newProfiles)
  }

  const updateSocialMediaProfile = (index: number, field: string, value: string) => {
    const newProfiles = [...socialMediaProfiles]
    newProfiles[index] = { ...newProfiles[index], [field]: value }
    setSocialMediaProfiles(newProfiles)
  }

  const removeSocialMediaProfile = (index: number) => {
    const newProfiles = socialMediaProfiles.filter((_, i) => i !== index)
    setSocialMediaProfiles(newProfiles)
    handleSaveField('social_media_profiles', newProfiles)
  }

  return (
    <div className={cn('space-y-4 p-4', className)}>
      {/* Header */}
      <div className="pl-1">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
          <Mail className="h-4 w-4 text-blue-600 dark:text-blue-400" />
          Contact Information
        </h3>
        <p className="text-gray-600 dark:text-gray-400 text-xs mt-0.5">
          Contact details and online presence for {person.full_name}
        </p>
      </div>

      {/* Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Email Section */}
        <div className="bg-card-background rounded-lg border border-border-default hover:border-border-hover shadow-sm hover:shadow transition-all duration-200">
          <div className="p-3">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-5 h-5 bg-blue-50 dark:bg-blue-900/20 rounded flex items-center justify-center">
                <Mail className="h-3 w-3 text-blue-600 dark:text-blue-400" />
              </div>
              <h5 className="text-sm font-medium text-gray-900 dark:text-white">Email Addresses</h5>
            </div>

            <div className="space-y-3">
              <CustomInput
                label="Primary Email"
                type="email"
                value={primaryEmail}
                onChange={setPrimaryEmail}
                placeholder="primary@email.com"
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
                      >
                        <Copy className="h-2 w-2" />
                      </Button>
                    )}
                    {renderStatusIcon(
                      'primaryEmail',
                      primaryEmail !== (person.primary_email || '')
                    )}
                  </div>
                }
              />

              {secondaryEmails.map((email, index) => (
                <div key={index} className="flex items-center gap-2">
                  <CustomInput
                    label={`Secondary Email ${index + 1}`}
                    type="email"
                    value={email}
                    onChange={(value) => updateSecondaryEmail(index, value)}
                    placeholder={`secondary${index + 1}@email.com`}
                    variant="filled"
                    size="sm"
                    className="flex-1"
                  />
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeSecondaryEmail(index)}
                    className="p-1 h-6 w-6 text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    <Minus className="h-3 w-3" />
                  </Button>
                </div>
              ))}

              <Button
                variant="outline"
                size="sm"
                onClick={addSecondaryEmail}
                className="w-full text-xs"
                disabled={savingField !== null}
              >
                <Plus className="h-3 w-3 mr-1" />
                Add Secondary Email
              </Button>
            </div>
          </div>
        </div>

        {/* Phone Section */}
        <div className="bg-card-background rounded-lg border border-border-default hover:border-border-hover shadow-sm hover:shadow transition-all duration-200">
          <div className="p-3">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-5 h-5 bg-green-50 dark:bg-green-900/20 rounded flex items-center justify-center">
                <Phone className="h-3 w-3 text-green-600 dark:text-green-400" />
              </div>
              <h5 className="text-sm font-medium text-gray-900 dark:text-white">Phone Numbers</h5>
            </div>

            <div className="space-y-3">
              <CustomInput
                label="Primary Phone"
                type="tel"
                value={primaryPhone}
                onChange={setPrimaryPhone}
                placeholder="+1 (555) 123-4567"
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
                      >
                        <Copy className="h-2 w-2" />
                      </Button>
                    )}
                    {renderStatusIcon(
                      'primaryPhone',
                      primaryPhone !== (person.primary_phone || '')
                    )}
                  </div>
                }
              />

              {secondaryPhones.map((phone, index) => (
                <div key={index} className="flex items-center gap-2">
                  <CustomInput
                    label={`Secondary Phone ${index + 1}`}
                    type="tel"
                    value={phone}
                    onChange={(value) => updateSecondaryPhone(index, value)}
                    placeholder={`+1 (555) 000-000${index + 1}`}
                    variant="filled"
                    size="sm"
                    className="flex-1"
                  />
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeSecondaryPhone(index)}
                    className="p-1 h-6 w-6 text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    <Minus className="h-3 w-3" />
                  </Button>
                </div>
              ))}

              <Button
                variant="outline"
                size="sm"
                onClick={addSecondaryPhone}
                className="w-full text-xs"
                disabled={savingField !== null}
              >
                <Plus className="h-3 w-3 mr-1" />
                Add Secondary Phone
              </Button>
            </div>
          </div>
        </div>

        {/* Address Section */}
        <div className="bg-card-background rounded-lg border border-border-default hover:border-border-hover shadow-sm hover:shadow transition-all duration-200">
          <div className="p-3">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-5 h-5 bg-orange-50 dark:bg-orange-900/20 rounded flex items-center justify-center">
                <MapPin className="h-3 w-3 text-orange-600 dark:text-orange-400" />
              </div>
              <h5 className="text-sm font-medium text-gray-900 dark:text-white">Current Address</h5>
            </div>

            <div className="space-y-3">
              <CustomInput
                label="Street"
                value={currentAddress.street}
                onChange={(value) => setCurrentAddress((prev) => ({ ...prev, street: value }))}
                placeholder="123 Main Street"
                variant="filled"
                size="sm"
              />

              <div className="grid grid-cols-2 gap-2">
                <CustomInput
                  label="City"
                  value={currentAddress.city}
                  onChange={(value) => setCurrentAddress((prev) => ({ ...prev, city: value }))}
                  placeholder="City"
                  variant="filled"
                  size="sm"
                />

                <CustomInput
                  label="State/Province"
                  value={currentAddress.state_province || ''}
                  onChange={(value) =>
                    setCurrentAddress((prev) => ({ ...prev, state_province: value }))
                  }
                  placeholder="State"
                  variant="filled"
                  size="sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <CustomInput
                  label="Postal Code"
                  value={currentAddress.postal_code || ''}
                  onChange={(value) =>
                    setCurrentAddress((prev) => ({ ...prev, postal_code: value }))
                  }
                  placeholder="12345"
                  variant="filled"
                  size="sm"
                />

                <CustomInput
                  label="Country"
                  value={currentAddress.country}
                  onChange={(value) => setCurrentAddress((prev) => ({ ...prev, country: value }))}
                  placeholder="Country"
                  variant="filled"
                  size="sm"
                />
              </div>

              {renderStatusIcon(
                'currentAddress',
                JSON.stringify(currentAddress) !==
                  JSON.stringify(
                    person.current_address && person.current_address.length > 0
                      ? person.current_address[0]
                      : {
                          street: '',
                          city: '',
                          state_province: '',
                          postal_code: '',
                          country: '',
                          type: 'home'
                        }
                  )
              )}
            </div>
          </div>
        </div>

        {/* Website & Online Presence */}
        <div className="bg-card-background rounded-lg border border-border-default hover:border-border-hover shadow-sm hover:shadow transition-all duration-200">
          <div className="p-3">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-5 h-5 bg-purple-50 dark:bg-purple-900/20 rounded flex items-center justify-center">
                <Globe className="h-3 w-3 text-purple-600 dark:text-purple-400" />
              </div>
              <h5 className="text-sm font-medium text-gray-900 dark:text-white">Online Presence</h5>
            </div>

            <div className="space-y-3">
              <CustomInput
                label="Website"
                type="url"
                value={website}
                onChange={setWebsite}
                placeholder="https://example.com"
                variant="filled"
                size="sm"
                leftIcon={<Globe className="h-3 w-3" />}
                rightIcon={renderStatusIcon('website', website !== (person.website || ''))}
              />

              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Online Usernames
                </label>
                <CustomTag
                  tags={onlineUsernames}
                  onTagsChange={setOnlineUsernames}
                  placeholder="Add username..."
                  allowDuplicates={false}
                />
                {renderStatusIcon(
                  'onlineUsernames',
                  JSON.stringify(onlineUsernames) !== JSON.stringify(person.online_usernames || [])
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Social Media Profiles */}
        <div className="lg:col-span-2 bg-card-background rounded-lg border border-border-default hover:border-border-hover shadow-sm hover:shadow transition-all duration-200">
          <div className="p-3">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 bg-pink-50 dark:bg-pink-900/20 rounded flex items-center justify-center">
                  <Users className="h-3 w-3 text-pink-600 dark:text-pink-400" />
                </div>
                <h5 className="text-sm font-medium text-gray-900 dark:text-white">
                  Social Media Profiles
                </h5>
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={addSocialMediaProfile}
                className="text-xs"
                disabled={savingField !== null}
              >
                <Plus className="h-3 w-3 mr-1" />
                Add Profile
              </Button>
            </div>

            <div className="space-y-3">
              {socialMediaProfiles.map((profile, index) => (
                <div
                  key={index}
                  className="grid grid-cols-1 md:grid-cols-3 gap-2 p-2 bg-gray-50 dark:bg-gray-800 rounded"
                >
                  <CustomInput
                    label="Platform"
                    value={profile.platform}
                    onChange={(value) => updateSocialMediaProfile(index, 'platform', value)}
                    placeholder="Facebook, Twitter, etc."
                    variant="filled"
                    size="sm"
                  />

                  <CustomInput
                    label="Username"
                    value={profile.username}
                    onChange={(value) => updateSocialMediaProfile(index, 'username', value)}
                    placeholder="@username"
                    variant="filled"
                    size="sm"
                  />

                  <div className="flex items-end gap-2">
                    <CustomInput
                      label="URL"
                      value={profile.url || ''}
                      onChange={(value) => updateSocialMediaProfile(index, 'url', value)}
                      placeholder="https://..."
                      variant="filled"
                      size="sm"
                      className="flex-1"
                    />

                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeSocialMediaProfile(index)}
                      className="p-1 h-6 w-6 text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      <Minus className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              ))}

              {socialMediaProfiles.length === 0 && (
                <div className="text-center py-4 text-gray-500 dark:text-gray-400">
                  <Users className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No social media profiles added yet</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Emergency Contact */}
        <div className="lg:col-span-2 bg-card-background rounded-lg border border-border-default hover:border-border-hover shadow-sm hover:shadow transition-all duration-200">
          <div className="p-3">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-5 h-5 bg-red-50 dark:bg-red-900/20 rounded flex items-center justify-center">
                <Building className="h-3 w-3 text-red-600 dark:text-red-400" />
              </div>
              <h5 className="text-sm font-medium text-gray-900 dark:text-white">
                Emergency Contact
              </h5>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <CustomInput
                label="Emergency Contact Name"
                value={emergencyContact.name}
                onChange={(value) => setEmergencyContact((prev) => ({ ...prev, name: value }))}
                placeholder="Full name"
                variant="filled"
                size="sm"
              />

              <CustomInput
                label="Relationship"
                value={emergencyContact.relationship}
                onChange={(value) =>
                  setEmergencyContact((prev) => ({ ...prev, relationship: value }))
                }
                placeholder="Spouse, Parent, etc."
                variant="filled"
                size="sm"
              />

              <CustomInput
                label="Emergency Phone"
                value={emergencyContact.phone}
                onChange={(value) => setEmergencyContact((prev) => ({ ...prev, phone: value }))}
                placeholder="Emergency phone number"
                variant="filled"
                size="sm"
              />

              <CustomInput
                label="Emergency Email"
                value={emergencyContact.email || ''}
                onChange={(value) => setEmergencyContact((prev) => ({ ...prev, email: value }))}
                placeholder="Emergency email"
                variant="filled"
                size="sm"
              />
            </div>

            {renderStatusIcon(
              'emergencyContact',
              JSON.stringify(emergencyContact) !== JSON.stringify(person.emergency_contact || {})
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default ContactInfoSection
