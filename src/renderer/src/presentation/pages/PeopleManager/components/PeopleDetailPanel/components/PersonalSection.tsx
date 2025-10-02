// src/renderer/src/presentation/pages/PeopleManager/components/PeopleDetailPanel/components/PersonalSection.tsx
import React, { useState, useEffect } from 'react'
import { Button } from '../../../../../../components/ui/button'
import CustomInput from '../../../../../../components/common/CustomInput'
import CustomCombobox from '../../../../../../components/common/CustomCombobox'
import Metadata from '../../../../../../components/common/Metadata'
import { User, Mail, MapPin, CreditCard, Check, Copy, Globe, Plus, Trash2 } from 'lucide-react'
import { cn } from '../../../../../../shared/lib/utils'
import { Person, PersonInfo, Identification, Address, Contact } from '../../../types'

interface PersonalSectionProps {
  person: Person
  personInfo: PersonInfo | null
  identifications: Identification[]
  addresses: Address[]
  contacts: Contact[]
  className?: string
  onUpdatePersonInfo?: (id: string, updates: Partial<PersonInfo>) => Promise<boolean>
  onCreatePersonInfo?: (data: Omit<PersonInfo, 'id'>) => Promise<PersonInfo | null>
  onCreateIdentification?: (data: Omit<Identification, 'id'>) => Promise<Identification | null>
  onUpdateIdentification?: (id: string, updates: Partial<Identification>) => Promise<boolean>
  onDeleteIdentification?: (id: string) => Promise<boolean>
  onCreateAddress?: (data: Omit<Address, 'id'>) => Promise<Address | null>
  onUpdateAddress?: (id: string, updates: Partial<Address>) => Promise<boolean>
  onDeleteAddress?: (id: string) => Promise<boolean>
  onCreateContact?: (data: Omit<Contact, 'id'>) => Promise<Contact | null>
  onUpdateContact?: (id: string, updates: Partial<Contact>) => Promise<boolean>
  onDeleteContact?: (id: string) => Promise<boolean>
}

const GENDER_OPTIONS_LIST = [
  { value: 'male', label: 'Male' },
  { value: 'female', label: 'Female' },
  { value: 'other', label: 'Other' }
]

const IDENTIFICATION_TYPE_OPTIONS = [
  { value: 'passport', label: 'Passport' },
  { value: 'national_id', label: 'National ID' },
  { value: 'driver_license', label: 'Driver License' },
  { value: 'birth_certificate', label: 'Birth Certificate' }
]

const CONTACT_TYPE_OPTIONS = [
  { value: 'sms', label: 'Phone' },
  { value: 'email', label: 'Email' },
  { value: 'communication', label: 'Communication' },
  { value: 'social_media', label: 'Social Media' },
  { value: 'other', label: 'Other' }
]

const PersonalSection: React.FC<PersonalSectionProps> = ({
  person,
  personInfo,
  identifications,
  addresses,
  contacts,
  className,
  onUpdatePersonInfo,
  onCreatePersonInfo,
  onCreateIdentification,
  onUpdateIdentification,
  onDeleteIdentification,
  onCreateAddress,
  onUpdateAddress,
  onDeleteAddress,
  onCreateContact,
  onUpdateContact,
  onDeleteContact
}) => {
  // PersonInfo state
  const [fullName, setFullName] = useState(personInfo?.full_name || '')
  const [preferredName, setPreferredName] = useState(personInfo?.preferred_name || '')
  const [gender, setGender] = useState(personInfo?.gender || '')
  const [metadata, setMetadata] = useState<Record<string, any>>(personInfo?.metadata || {})

  // Identifications state
  const [editingIdentifications, setEditingIdentifications] = useState<
    Record<string, Identification>
  >({})

  // Addresses state
  const [editingAddresses, setEditingAddresses] = useState<Record<string, Address>>({})

  // Contacts state
  const [editingContacts, setEditingContacts] = useState<Record<string, Contact>>({})

  const [savingField, setSavingField] = useState<string | null>(null)
  const [saveStatus, setSaveStatus] = useState<{ [key: string]: 'success' | 'error' | null }>({})

  useEffect(() => {
    setFullName(personInfo?.full_name || '')
    setPreferredName(personInfo?.preferred_name || '')
    setGender(personInfo?.gender || '')
    setMetadata(personInfo?.metadata || {})
  }, [personInfo])

  useEffect(() => {
    const initialIdentifications: Record<string, Identification> = {}
    identifications.forEach((id) => {
      initialIdentifications[id.id] = { ...id }
    })
    setEditingIdentifications(initialIdentifications)
  }, [identifications])

  useEffect(() => {
    const initialAddresses: Record<string, Address> = {}
    addresses.forEach((addr) => {
      initialAddresses[addr.id] = { ...addr }
    })
    setEditingAddresses(initialAddresses)
  }, [addresses])

  useEffect(() => {
    const initialContacts: Record<string, Contact> = {}
    contacts.forEach((contact) => {
      initialContacts[contact.id] = { ...contact }
    })
    setEditingContacts(initialContacts)
  }, [contacts])

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text)
    } catch (err) {
      console.error('Failed to copy:', err)
    }
  }

  const handleSavePersonInfo = async (field: string, value: string | Record<string, any>) => {
    try {
      setSavingField(field)

      const updates: Partial<PersonInfo> = {}
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
        case 'metadata':
          updates.metadata = value as Record<string, any>
          break
      }

      let success = false
      if (personInfo?.id && onUpdatePersonInfo) {
        success = await onUpdatePersonInfo(personInfo.id, updates)
      } else if (onCreatePersonInfo) {
        const newPersonInfo = await onCreatePersonInfo({
          person_id: person.id,
          ...updates
        })
        success = newPersonInfo !== null
      }

      if (success) {
        setSaveStatus((prev) => ({ ...prev, [field]: 'success' }))
        setTimeout(() => setSaveStatus((prev) => ({ ...prev, [field]: null })), 2000)
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

  const handleCreateIdentification = async () => {
    if (!onCreateIdentification) return

    const newId = await onCreateIdentification({
      person_id: person.id,
      type: 'passport',
      number: '',
      metadata: {}
    })

    if (newId) {
      setEditingIdentifications((prev) => ({
        ...prev,
        [newId.id]: newId
      }))
    }
  }

  const handleSaveIdentification = async (id: string) => {
    if (!onUpdateIdentification) return

    const identification = editingIdentifications[id]
    if (!identification) return

    const success = await onUpdateIdentification(id, identification)
    if (success) {
      setSaveStatus((prev) => ({ ...prev, [`identification_${id}`]: 'success' }))
      setTimeout(() => setSaveStatus((prev) => ({ ...prev, [`identification_${id}`]: null })), 2000)
    }
  }

  const handleDeleteIdentification = async (id: string) => {
    if (!onDeleteIdentification) return

    const success = await onDeleteIdentification(id)
    if (success) {
      const newEditing = { ...editingIdentifications }
      delete newEditing[id]
      setEditingIdentifications(newEditing)
    }
  }

  const handleCreateAddress = async () => {
    if (!onCreateAddress) return

    const newAddr = await onCreateAddress({
      person_id: person.id,
      metadata: {}
    })

    if (newAddr) {
      setEditingAddresses((prev) => ({
        ...prev,
        [newAddr.id]: newAddr
      }))
    }
  }

  const handleSaveAddress = async (id: string) => {
    if (!onUpdateAddress) return

    const address = editingAddresses[id]
    if (!address) return

    const success = await onUpdateAddress(id, address)
    if (success) {
      setSaveStatus((prev) => ({ ...prev, [`address_${id}`]: 'success' }))
      setTimeout(() => setSaveStatus((prev) => ({ ...prev, [`address_${id}`]: null })), 2000)
    }
  }

  const handleDeleteAddress = async (id: string) => {
    if (!onDeleteAddress) return

    const success = await onDeleteAddress(id)
    if (success) {
      const newEditing = { ...editingAddresses }
      delete newEditing[id]
      setEditingAddresses(newEditing)
    }
  }

  const handleCreateContact = async () => {
    if (!onCreateContact) return

    const newContact = await onCreateContact({
      person_id: person.id,
      contact_type: 'email',
      email_address: '',
      is_primary: false,
      metadata: {}
    })

    if (newContact) {
      setEditingContacts((prev) => ({
        ...prev,
        [newContact.id]: newContact
      }))
    }
  }

  const handleSaveContact = async (id: string) => {
    if (!onUpdateContact) return

    const contact = editingContacts[id]
    if (!contact) return

    const success = await onUpdateContact(id, contact)
    if (success) {
      setSaveStatus((prev) => ({ ...prev, [`contact_${id}`]: 'success' }))
      setTimeout(() => setSaveStatus((prev) => ({ ...prev, [`contact_${id}`]: null })), 2000)
    }
  }

  const handleDeleteContact = async (id: string) => {
    if (!onDeleteContact) return

    const success = await onDeleteContact(id)
    if (success) {
      const newEditing = { ...editingContacts }
      delete newEditing[id]
      setEditingContacts(newEditing)
    }
  }

  const renderStatusIcon = (field: string, hasChanged: boolean, onSave: () => void) => {
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
          onClick={onSave}
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
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="pl-1">
          <h3 className="text-lg font-semibold text-text-primary flex items-center gap-2">
            <User className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
            Personal Information
          </h3>
          <p className="text-gray-600 dark:text-gray-400 text-xs mt-0.5">
            Personal identity, contact details, and documents
          </p>
        </div>
      </div>

      {/* Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Person Info Section */}
        <div className="bg-card-background rounded-lg border border-border-default hover:border-border-hover shadow-sm hover:shadow transition-all duration-200">
          <div className="p-3">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-5 h-5 bg-blue-50 dark:bg-blue-900/20 rounded flex items-center justify-center">
                <User className="h-3 w-3 text-blue-600 dark:text-blue-400" />
              </div>
              <h5 className="text-sm font-medium text-text-primary">Basic Identity</h5>
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
                rightIcon={renderStatusIcon(
                  'full_name',
                  fullName !== (personInfo?.full_name || ''),
                  () => handleSavePersonInfo('full_name', fullName)
                )}
                disabled={savingField !== null}
                required
              />

              <CustomInput
                label="Preferred Name"
                value={preferredName}
                onChange={setPreferredName}
                placeholder="Enter preferred name..."
                variant="filled"
                size="sm"
                rightIcon={renderStatusIcon(
                  'preferred_name',
                  preferredName !== (personInfo?.preferred_name || ''),
                  () => handleSavePersonInfo('preferred_name', preferredName)
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
                        setGender(value as string)
                        handleSavePersonInfo('gender', value as string)
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
                  setMetadata(newMetadata)
                  handleSavePersonInfo('metadata', newMetadata)
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

        {/* Contacts Section */}
        <div className="bg-card-background rounded-lg border border-border-default hover:border-border-hover shadow-sm hover:shadow transition-all duration-200">
          <div className="p-3">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 bg-green-50 dark:bg-green-900/20 rounded flex items-center justify-center">
                  <Mail className="h-3 w-3 text-green-600 dark:text-green-400" />
                </div>
                <h5 className="text-sm font-medium text-text-primary">Contacts</h5>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleCreateContact}
                className="p-1 h-6 w-6"
                disabled={savingField !== null}
              >
                <Plus className="h-3 w-3" />
              </Button>
            </div>

            <div className="space-y-2">
              {Object.values(editingContacts).map((contact) => {
                // Get current contact value based on type
                const getContactValue = () => {
                  if (contact.contact_type === 'email') return contact.email_address || ''
                  if (contact.contact_type === 'sms') return contact.phone_number || ''
                  return ''
                }

                const contactValue = getContactValue()
                const contactTypeLabel =
                  CONTACT_TYPE_OPTIONS.find((opt) => opt.value === contact.contact_type)?.label ||
                  'Contact'

                return (
                  <div key={contact.id} className="p-2 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <div className="flex items-start gap-2">
                      <div className="w-32">
                        <CustomCombobox
                          label=""
                          value={contact.contact_type}
                          options={CONTACT_TYPE_OPTIONS}
                          onChange={(value) => {
                            setEditingContacts((prev) => ({
                              ...prev,
                              [contact.id]: { ...contact, contact_type: value as any }
                            }))
                          }}
                          placeholder="Type..."
                          size="sm"
                        />
                      </div>

                      <div className="flex-1">
                        <CustomInput
                          label=""
                          value={contactValue}
                          onChange={(value) => {
                            setEditingContacts((prev) => {
                              const updated = { ...contact }
                              if (contact.contact_type === 'email') {
                                updated.email_address = value
                              } else if (contact.contact_type === 'sms') {
                                updated.phone_number = value
                              }
                              return {
                                ...prev,
                                [contact.id]: updated
                              }
                            })
                          }}
                          placeholder={`Enter ${contactTypeLabel.toLowerCase()}...`}
                          variant="filled"
                          size="sm"
                          leftIcon={
                            contact.contact_type === 'email' ? (
                              <Mail className="h-3 w-3" />
                            ) : contact.contact_type === 'sms' ? (
                              <Globe className="h-3 w-3" />
                            ) : undefined
                          }
                          rightIcon={
                            <div className="flex items-center gap-0.5">
                              {contactValue && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => copyToClipboard(contactValue)}
                                  className="p-0.5 h-4 w-4"
                                >
                                  <Copy className="h-2 w-2" />
                                </Button>
                              )}
                              {renderStatusIcon(
                                `contact_${contact.id}`,
                                JSON.stringify(contact) !==
                                  JSON.stringify(contacts.find((c) => c.id === contact.id)),
                                () => handleSaveContact(contact.id)
                              )}
                            </div>
                          }
                        />
                      </div>

                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteContact(contact.id)}
                        className="p-1 h-6 w-6 text-red-600 hover:bg-red-50"
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>

        {/* Identifications Section */}
        <div className="bg-card-background rounded-lg border border-border-default hover:border-border-hover shadow-sm hover:shadow transition-all duration-200 lg:col-span-2">
          <div className="p-3">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 bg-purple-50 dark:bg-purple-900/20 rounded flex items-center justify-center">
                  <CreditCard className="h-3 w-3 text-purple-600 dark:text-purple-400" />
                </div>
                <h5 className="text-sm font-medium text-text-primary">Identifications</h5>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleCreateIdentification}
                className="p-1 h-6 w-6"
                disabled={savingField !== null}
              >
                <Plus className="h-3 w-3" />
              </Button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
              {Object.values(editingIdentifications).map((identification) => (
                <div
                  key={identification.id}
                  className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg space-y-2"
                >
                  <div className="flex items-center gap-2">
                    <div className="flex-1">
                      <CustomCombobox
                        label="Type"
                        value={identification.type}
                        options={IDENTIFICATION_TYPE_OPTIONS}
                        onChange={(value) => {
                          setEditingIdentifications((prev) => ({
                            ...prev,
                            [identification.id]: { ...identification, type: value as any }
                          }))
                        }}
                        placeholder="Select type..."
                        size="sm"
                      />
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteIdentification(identification.id)}
                      className="p-1 h-6 w-6 text-red-600 hover:bg-red-50"
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>

                  <CustomInput
                    label="Number"
                    value={identification.number}
                    onChange={(value) => {
                      setEditingIdentifications((prev) => ({
                        ...prev,
                        [identification.id]: { ...identification, number: value }
                      }))
                    }}
                    placeholder="ID number..."
                    variant="filled"
                    size="sm"
                  />

                  <div className="grid grid-cols-2 gap-2">
                    <CustomInput
                      label="Issue Date"
                      type="date"
                      value={identification.issue_date || ''}
                      onChange={(value) => {
                        setEditingIdentifications((prev) => ({
                          ...prev,
                          [identification.id]: { ...identification, issue_date: value }
                        }))
                      }}
                      variant="filled"
                      size="sm"
                    />

                    <CustomInput
                      label="Expiry Date"
                      type="date"
                      value={identification.expiry_date || ''}
                      onChange={(value) => {
                        setEditingIdentifications((prev) => ({
                          ...prev,
                          [identification.id]: { ...identification, expiry_date: value }
                        }))
                      }}
                      variant="filled"
                      size="sm"
                    />
                  </div>

                  <CustomInput
                    label="Issuing Country"
                    value={identification.issuing_country || ''}
                    onChange={(value) => {
                      setEditingIdentifications((prev) => ({
                        ...prev,
                        [identification.id]: { ...identification, issuing_country: value }
                      }))
                    }}
                    placeholder="Country..."
                    variant="filled"
                    size="sm"
                    leftIcon={<Globe className="h-3 w-3" />}
                    rightIcon={renderStatusIcon(
                      `identification_${identification.id}`,
                      JSON.stringify(identification) !==
                        JSON.stringify(identifications.find((i) => i.id === identification.id)),
                      () => handleSaveIdentification(identification.id)
                    )}
                  />
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Addresses Section */}
        <div className="bg-card-background rounded-lg border border-border-default hover:border-border-hover shadow-sm hover:shadow transition-all duration-200 lg:col-span-2">
          <div className="p-3">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 bg-orange-50 dark:bg-orange-900/20 rounded flex items-center justify-center">
                  <MapPin className="h-3 w-3 text-orange-600 dark:text-orange-400" />
                </div>
                <h5 className="text-sm font-medium text-text-primary">Addresses</h5>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleCreateAddress}
                className="p-1 h-6 w-6"
                disabled={savingField !== null}
              >
                <Plus className="h-3 w-3" />
              </Button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
              {Object.values(editingAddresses).map((address) => (
                <div
                  key={address.id}
                  className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg space-y-2"
                >
                  <div className="flex items-center gap-2">
                    <CustomInput
                      label="Type"
                      value={address.address_type || ''}
                      onChange={(value) => {
                        setEditingAddresses((prev) => ({
                          ...prev,
                          [address.id]: { ...address, address_type: value }
                        }))
                      }}
                      placeholder="e.g., Home, Work..."
                      variant="filled"
                      size="sm"
                    />
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteAddress(address.id)}
                      className="p-1 h-6 w-6 text-red-600 hover:bg-red-50 mt-4"
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>

                  <CustomInput
                    label="Street Address"
                    value={address.street_address || ''}
                    onChange={(value) => {
                      setEditingAddresses((prev) => ({
                        ...prev,
                        [address.id]: { ...address, street_address: value }
                      }))
                    }}
                    placeholder="Street address..."
                    variant="filled"
                    size="sm"
                    leftIcon={<MapPin className="h-3 w-3" />}
                  />

                  <div className="grid grid-cols-2 gap-2">
                    <CustomInput
                      label="City"
                      value={address.city || ''}
                      onChange={(value) => {
                        setEditingAddresses((prev) => ({
                          ...prev,
                          [address.id]: { ...address, city: value }
                        }))
                      }}
                      placeholder="City..."
                      variant="filled"
                      size="sm"
                    />

                    <CustomInput
                      label="Country"
                      value={address.country || ''}
                      onChange={(value) => {
                        setEditingAddresses((prev) => ({
                          ...prev,
                          [address.id]: { ...address, country: value }
                        }))
                      }}
                      placeholder="Country..."
                      variant="filled"
                      size="sm"
                      leftIcon={<Globe className="h-3 w-3" />}
                      rightIcon={renderStatusIcon(
                        `address_${address.id}`,
                        JSON.stringify(address) !==
                          JSON.stringify(addresses.find((a) => a.id === address.id)),
                        () => handleSaveAddress(address.id)
                      )}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default PersonalSection
