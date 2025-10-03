// src/renderer/src/presentation/pages/PeopleManager/components/PeopleDetailPanel/components/SocialSection/index.tsx
import React, { useState } from 'react'
import { cn } from '../../../../../../../shared/lib/utils'
import { Users } from 'lucide-react'
import { Person, ServiceAccount, Relationship, PersonInfo } from '../../../../types'
import ServiceAccountSection from './components/ServiceAccount'
import RelationshipSection from './components/Relationship'

interface SocialSectionProps {
  person: Person
  serviceAccounts: ServiceAccount[]
  relationships: Relationship[]
  allPeople: Person[]
  allPersonInfos: PersonInfo[]
  className?: string
  onCreateServiceAccount?: (data: Omit<ServiceAccount, 'id'>) => Promise<ServiceAccount | null>
  onUpdateServiceAccount?: (id: string, updates: Partial<ServiceAccount>) => Promise<boolean>
  onDeleteServiceAccount?: (id: string) => Promise<boolean>
  onCreateRelationship?: (data: Omit<Relationship, 'id'>) => Promise<Relationship | null>
  onUpdateRelationship?: (id: string, updates: Partial<Relationship>) => Promise<boolean>
  onDeleteRelationship?: (id: string) => Promise<boolean>
}

const SocialSection: React.FC<SocialSectionProps> = ({
  person,
  serviceAccounts,
  relationships,
  allPeople,
  allPersonInfos,
  className,
  onCreateServiceAccount,
  onUpdateServiceAccount,
  onDeleteServiceAccount,
  onCreateRelationship,
  onUpdateRelationship,
  onDeleteRelationship
}) => {
  // Service Account form state
  const [showServiceAccountForm, setShowServiceAccountForm] = useState(false)
  const [serviceAccountFormData, setServiceAccountFormData] = useState({
    service_name: '',
    service_type: 'social_media' as 'social_media' | 'communication' | 'other',
    service_url: '',
    metadata: {} as Record<string, any>
  })

  // Relationship form state
  const [showRelationshipForm, setShowRelationshipForm] = useState(false)
  const [relationshipFormData, setRelationshipFormData] = useState({
    related_person_id: '',
    relationship_type: 'friend',
    start_date: '',
    end_date: '',
    is_current: true,
    notes: '',
    metadata: {} as Record<string, any>
  })

  // Editing states for existing items
  const [editingServiceAccounts, setEditingServiceAccounts] = useState<
    Record<string, ServiceAccount>
  >({})
  const [editingRelationships, setEditingRelationships] = useState<Record<string, Relationship>>({})

  const [savingField, setSavingField] = useState<string | null>(null)
  const [saveStatus, setSaveStatus] = useState<{ [key: string]: 'success' | 'error' | null }>({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text)
    } catch (err) {
      console.error('Failed to copy:', err)
    }
  }

  // ==================== SERVICE ACCOUNT HANDLERS ====================
  const handleShowServiceAccountForm = () => {
    setShowServiceAccountForm(true)
    setServiceAccountFormData({
      service_name: '',
      service_type: 'social_media',
      service_url: '',
      metadata: {}
    })
  }

  const handleCancelServiceAccountForm = () => {
    setShowServiceAccountForm(false)
    setServiceAccountFormData({
      service_name: '',
      service_type: 'social_media',
      service_url: '',
      metadata: {}
    })
  }

  const handleCreateServiceAccount = async () => {
    if (!onCreateServiceAccount) return
    if (!serviceAccountFormData.service_name.trim()) return

    try {
      setIsSubmitting(true)

      const newSA = await onCreateServiceAccount({
        person_id: person.id,
        service_name: serviceAccountFormData.service_name.trim(),
        service_type: serviceAccountFormData.service_type,
        service_url: serviceAccountFormData.service_url.trim() || undefined,
        metadata: serviceAccountFormData.metadata
      })

      if (newSA) {
        setShowServiceAccountForm(false)
        setServiceAccountFormData({
          service_name: '',
          service_type: 'social_media',
          service_url: '',
          metadata: {}
        })
      }
    } catch (error) {
      console.error('Error creating service account:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleUpdateServiceAccountField = (
    serviceAccount: ServiceAccount,
    field: keyof ServiceAccount,
    value: any
  ) => {
    setEditingServiceAccounts((prev) => ({
      ...prev,
      [serviceAccount.id]: {
        ...serviceAccount,
        ...(prev[serviceAccount.id] || {}),
        [field]: value
      }
    }))
  }

  const handleSaveServiceAccount = async (serviceAccount: ServiceAccount) => {
    if (!onUpdateServiceAccount) return

    const editedData = editingServiceAccounts[serviceAccount.id]
    if (!editedData) return

    const hasChanges = JSON.stringify(serviceAccount) !== JSON.stringify(editedData)
    if (!hasChanges) return

    try {
      setSavingField(`service_account_${serviceAccount.id}`)

      const success = await onUpdateServiceAccount(serviceAccount.id, editedData)

      if (success) {
        setSaveStatus((prev) => ({ ...prev, [`service_account_${serviceAccount.id}`]: 'success' }))
        setTimeout(() => {
          setSaveStatus((prev) => ({ ...prev, [`service_account_${serviceAccount.id}`]: null }))
          // Clear editing state after successful save
          setEditingServiceAccounts((prev) => {
            const newState = { ...prev }
            delete newState[serviceAccount.id]
            return newState
          })
        }, 2000)
      } else {
        setSaveStatus((prev) => ({ ...prev, [`service_account_${serviceAccount.id}`]: 'error' }))
      }
    } catch (error) {
      console.error('Error saving service account:', error)
      setSaveStatus((prev) => ({ ...prev, [`service_account_${serviceAccount.id}`]: 'error' }))
    } finally {
      setSavingField(null)
    }
  }

  const handleDeleteServiceAccount = async (id: string) => {
    if (!onDeleteServiceAccount) return

    try {
      await onDeleteServiceAccount(id)
      // Clear from editing state if exists
      setEditingServiceAccounts((prev) => {
        const newState = { ...prev }
        delete newState[id]
        return newState
      })
    } catch (error) {
      console.error('Error deleting service account:', error)
    }
  }

  // ==================== RELATIONSHIP HANDLERS ====================
  const handleShowRelationshipForm = () => {
    if (allPeople.length <= 1) return

    const otherPerson = allPeople.find((p) => p.id !== person.id)
    if (!otherPerson) return

    setShowRelationshipForm(true)
    setRelationshipFormData({
      related_person_id: otherPerson.id,
      relationship_type: 'friend',
      start_date: '',
      end_date: '',
      is_current: true,
      notes: '',
      metadata: {}
    })
  }

  const handleCancelRelationshipForm = () => {
    setShowRelationshipForm(false)
    setRelationshipFormData({
      related_person_id: '',
      relationship_type: 'friend',
      start_date: '',
      end_date: '',
      is_current: true,
      notes: '',
      metadata: {}
    })
  }

  const handleCreateRelationship = async () => {
    if (!onCreateRelationship) return
    if (!relationshipFormData.related_person_id) return

    try {
      setIsSubmitting(true)

      const newRel = await onCreateRelationship({
        person_id: person.id,
        related_person_id: relationshipFormData.related_person_id,
        relationship_type: relationshipFormData.relationship_type,
        start_date: relationshipFormData.start_date || undefined,
        end_date: relationshipFormData.end_date || undefined,
        is_current: relationshipFormData.is_current,
        notes: relationshipFormData.notes || undefined,
        metadata: relationshipFormData.metadata
      })

      if (newRel) {
        setShowRelationshipForm(false)
        setRelationshipFormData({
          related_person_id: '',
          relationship_type: 'friend',
          start_date: '',
          end_date: '',
          is_current: true,
          notes: '',
          metadata: {}
        })
      }
    } catch (error) {
      console.error('Error creating relationship:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleUpdateRelationshipField = (
    relationship: Relationship,
    field: keyof Relationship,
    value: any
  ) => {
    setEditingRelationships((prev) => ({
      ...prev,
      [relationship.id]: {
        ...relationship,
        ...(prev[relationship.id] || {}),
        [field]: value
      }
    }))
  }

  const handleSaveRelationship = async (relationship: Relationship) => {
    if (!onUpdateRelationship) return

    const editedData = editingRelationships[relationship.id]
    if (!editedData) return

    const hasChanges = JSON.stringify(relationship) !== JSON.stringify(editedData)
    if (!hasChanges) return

    try {
      setSavingField(`relationship_${relationship.id}`)

      const success = await onUpdateRelationship(relationship.id, editedData)

      if (success) {
        setSaveStatus((prev) => ({ ...prev, [`relationship_${relationship.id}`]: 'success' }))
        setTimeout(() => {
          setSaveStatus((prev) => ({ ...prev, [`relationship_${relationship.id}`]: null }))
          // Clear editing state after successful save
          setEditingRelationships((prev) => {
            const newState = { ...prev }
            delete newState[relationship.id]
            return newState
          })
        }, 2000)
      } else {
        setSaveStatus((prev) => ({ ...prev, [`relationship_${relationship.id}`]: 'error' }))
      }
    } catch (error) {
      console.error('Error saving relationship:', error)
      setSaveStatus((prev) => ({ ...prev, [`relationship_${relationship.id}`]: 'error' }))
    } finally {
      setSavingField(null)
    }
  }

  const handleDeleteRelationship = async (id: string) => {
    if (!onDeleteRelationship) return

    try {
      await onDeleteRelationship(id)
      // Clear from editing state if exists
      setEditingRelationships((prev) => {
        const newState = { ...prev }
        delete newState[id]
        return newState
      })
    } catch (error) {
      console.error('Error deleting relationship:', error)
    }
  }

  // ==================== HELPER FUNCTIONS ====================
  const renderStatusIcon = (field: string, hasChanged: boolean, onSave: () => void) => {
    if (savingField === field) {
      return <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-blue-600"></div>
    }

    if (saveStatus[field] === 'success') {
      return <div className="h-3 w-3 text-green-600">✓</div>
    }

    if (saveStatus[field] === 'error') {
      return <div className="text-red-600 text-xs">!</div>
    }

    if (hasChanged) {
      return (
        <button
          onClick={onSave}
          className="p-0.5 h-4 w-4 text-green-600 hover:text-green-700 hover:bg-green-50 rounded"
          disabled={savingField !== null}
        >
          <div className="h-2 w-2">✓</div>
        </button>
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
            <Users className="h-4 w-4 text-blue-600 dark:text-blue-400" />
            Social & Relationships
          </h3>
          <p className="text-gray-600 dark:text-gray-400 text-xs mt-0.5">
            Social media accounts and personal relationships
          </p>
        </div>
      </div>

      {/* Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 items-start">
        {/* Service Accounts Section */}
        <ServiceAccountSection
          serviceAccounts={serviceAccounts}
          showServiceAccountForm={showServiceAccountForm}
          serviceAccountFormData={serviceAccountFormData}
          editingServiceAccounts={editingServiceAccounts}
          savingField={savingField}
          saveStatus={saveStatus}
          isSubmitting={isSubmitting}
          onShowForm={handleShowServiceAccountForm}
          onCancelForm={handleCancelServiceAccountForm}
          onFormDataChange={setServiceAccountFormData}
          onCreate={handleCreateServiceAccount}
          onUpdateField={handleUpdateServiceAccountField}
          onSave={handleSaveServiceAccount}
          onDelete={handleDeleteServiceAccount}
          onCopyUrl={copyToClipboard}
          renderStatusIcon={renderStatusIcon}
        />

        {/* Relationships Section */}
        <RelationshipSection
          relationships={relationships}
          person={person}
          allPeople={allPeople}
          allPersonInfos={allPersonInfos}
          showRelationshipForm={showRelationshipForm}
          relationshipFormData={relationshipFormData}
          editingRelationships={editingRelationships}
          savingField={savingField}
          saveStatus={saveStatus}
          isSubmitting={isSubmitting}
          onShowForm={handleShowRelationshipForm}
          onCancelForm={handleCancelRelationshipForm}
          onFormDataChange={setRelationshipFormData}
          onCreate={handleCreateRelationship}
          onUpdateField={handleUpdateRelationshipField}
          onSave={handleSaveRelationship}
          onDelete={handleDeleteRelationship}
          renderStatusIcon={renderStatusIcon}
        />
      </div>
    </div>
  )
}

export default SocialSection
