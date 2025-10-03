// PersonalSection/index.tsx - REFACTORED
import React, { useState, useEffect } from 'react'
import { Button } from '../../../../../../../components/ui/button'
import { User, Check } from 'lucide-react'
import { cn } from '../../../../../../../shared/lib/utils'
import {
  Person,
  PersonInfo,
  Identification,
  Address,
  Contact,
  ServiceAccount
} from '../../../../types'
import PersonInfoSection from './components/PersonInfoSection'
import IdentificationSection from './components/IdentificationSection'
import ContactSection from './components/ContactSection'
import AddressSection from './components/AddressSection'

interface PersonalSectionProps {
  person: Person
  personInfo: PersonInfo | null
  identifications: Identification[]
  addresses: Address[]
  contacts: Contact[]
  serviceAccounts: ServiceAccount[]
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

const PersonalSection: React.FC<PersonalSectionProps> = ({
  person,
  personInfo,
  identifications,
  addresses,
  contacts,
  serviceAccounts = [],
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

  // Editing states
  const [editingIdentifications, setEditingIdentifications] = useState<
    Record<string, Identification>
  >({})
  const [editingAddresses, setEditingAddresses] = useState<Record<string, Address>>({})
  const [editingContacts, setEditingContacts] = useState<Record<string, Contact>>({})

  const [savingField, setSavingField] = useState<string | null>(null)
  const [saveStatus, setSaveStatus] = useState<{ [key: string]: 'success' | 'error' | null }>({})

  // Sync PersonInfo
  useEffect(() => {
    setFullName(personInfo?.full_name || '')
    setPreferredName(personInfo?.preferred_name || '')
    setGender(personInfo?.gender || '')
    setMetadata(personInfo?.metadata || {})
  }, [personInfo])

  // Sync Identifications
  useEffect(() => {
    const initialIdentifications: Record<string, Identification> = {}
    identifications.forEach((id) => {
      initialIdentifications[id.id] = { ...id }
    })
    setEditingIdentifications(initialIdentifications)
  }, [identifications])

  // Sync Addresses
  useEffect(() => {
    const initialAddresses: Record<string, Address> = {}
    addresses.forEach((addr) => {
      initialAddresses[addr.id] = { ...addr }
    })
    setEditingAddresses(initialAddresses)
  }, [addresses])

  // Sync Contacts
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

  // ==================== PERSON INFO HANDLERS ====================
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

  // ==================== IDENTIFICATION HANDLERS ====================
  const handleCreateIdentification = async () => {
    if (!onCreateIdentification) return

    const newId = await onCreateIdentification({
      person_id: person.id,
      type: 'passport',
      number: '',
      metadata: {}
    })

    if (newId) {
      setEditingIdentifications((prev: any) => ({
        ...prev,
        [newId.id]: newId
      }))
    }
  }

  const handleUpdateIdentificationField = (id: string, updates: Partial<Identification>) => {
    setEditingIdentifications((prev: { [x: string]: any }) => ({
      ...prev,
      [id]: { ...prev[id], ...updates }
    }))
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

  // ==================== ADDRESS HANDLERS ====================
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

  const handleUpdateAddressField = (id: string, updates: Partial<Address>) => {
    setEditingAddresses((prev) => ({
      ...prev,
      [id]: { ...prev[id], ...updates }
    }))
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

  // ==================== CONTACT HANDLERS ====================
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

  const handleUpdateContactField = (id: string, updates: Partial<Contact>) => {
    setEditingContacts((prev) => ({
      ...prev,
      [id]: { ...prev[id], ...updates }
    }))
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

  // ==================== HELPER FUNCTIONS ====================
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
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 items-start">
        {/* Left Column */}
        <div className="space-y-4">
          <PersonInfoSection
            fullName={fullName}
            preferredName={preferredName}
            gender={gender}
            metadata={metadata}
            personInfo={personInfo}
            savingField={savingField}
            onFullNameChange={setFullName}
            onPreferredNameChange={setPreferredName}
            onGenderChange={setGender}
            onMetadataChange={setMetadata}
            onSave={handleSavePersonInfo}
            renderStatusIcon={renderStatusIcon}
          />

          <IdentificationSection
            identifications={identifications}
            editingIdentifications={editingIdentifications}
            savingField={savingField}
            onUpdateIdentification={handleUpdateIdentificationField}
            onCreate={handleCreateIdentification}
            onSave={handleSaveIdentification}
            onDelete={handleDeleteIdentification}
            renderStatusIcon={renderStatusIcon}
          />
        </div>

        {/* Right Column */}
        <div className="space-y-4">
          <ContactSection
            contacts={contacts}
            editingContacts={editingContacts}
            serviceAccounts={serviceAccounts}
            savingField={savingField}
            onUpdateContact={handleUpdateContactField}
            onCreate={handleCreateContact}
            onSave={handleSaveContact}
            onDelete={handleDeleteContact}
            onCopyToClipboard={copyToClipboard}
            renderStatusIcon={renderStatusIcon}
          />

          <AddressSection
            addresses={addresses}
            editingAddresses={editingAddresses}
            savingField={savingField}
            onUpdateAddress={handleUpdateAddressField}
            onCreate={handleCreateAddress}
            onSave={handleSaveAddress}
            onDelete={handleDeleteAddress}
            renderStatusIcon={renderStatusIcon}
          />
        </div>
      </div>
    </div>
  )
}

export default PersonalSection
