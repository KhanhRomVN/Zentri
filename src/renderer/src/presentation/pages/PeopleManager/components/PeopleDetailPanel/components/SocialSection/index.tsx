// src/renderer/src/presentation/pages/PeopleManager/components/PeopleDetailPanel/components/SocialSection.tsx
import React, { useState } from 'react'
import { Button } from '../../../../../../../components/ui/button'
import CustomInput from '../../../../../../../components/common/CustomInput'
import CustomCombobox from '../../../../../../../components/common/CustomCombobox'
import CustomButton from '../../../../../../../components/common/CustomButton'
import Metadata from '../../../../../../../components/common/Metadata'
import { Users, Globe, Plus, Check, Copy, Heart } from 'lucide-react'
import { cn } from '../../../../../../../shared/lib/utils'
import { Person, ServiceAccount, Relationship, PersonInfo } from '../../../../types'

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

const SERVICE_TYPE_OPTIONS = [
  { value: 'social_media', label: 'Social Media' },
  { value: 'communication', label: 'Communication' },
  { value: 'other', label: 'Other' }
]

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

  // Helper to get or initialize editing data for a service account
  const getEditingServiceAccount = (sa: ServiceAccount): ServiceAccount => {
    if (!editingServiceAccounts[sa.id]) {
      return sa
    }
    return editingServiceAccounts[sa.id]
  }

  // Helper to get or initialize editing data for a relationship
  const getEditingRelationship = (rel: Relationship): Relationship => {
    if (!editingRelationships[rel.id]) {
      return rel
    }
    return editingRelationships[rel.id]
  }

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
        ...getEditingServiceAccount(serviceAccount),
        [field]: value
      }
    }))
  }

  const handleSaveServiceAccount = async (serviceAccount: ServiceAccount) => {
    if (!onUpdateServiceAccount) return

    const editedData = getEditingServiceAccount(serviceAccount)
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
        ...getEditingRelationship(relationship),
        [field]: value
      }
    }))
  }

  const handleSaveRelationship = async (relationship: Relationship) => {
    if (!onUpdateRelationship) return

    const editedData = getEditingRelationship(relationship)
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
            <Users className="h-4 w-4 text-blue-600 dark:text-blue-400" />
            Social & Relationships
          </h3>
          <p className="text-gray-600 dark:text-gray-400 text-xs mt-0.5">
            Social media accounts and personal relationships
          </p>
        </div>
      </div>

      {/* Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Service Accounts Section */}
        <div className="bg-card-background rounded-lg border border-border-default hover:border-border-hover shadow-sm hover:shadow transition-all duration-200">
          <div className="p-3">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 bg-purple-50 dark:bg-purple-900/20 rounded flex items-center justify-center">
                  <Globe className="h-3 w-3 text-purple-600 dark:text-purple-400" />
                </div>
                <h5 className="text-sm font-medium text-text-primary">Service Accounts</h5>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleShowServiceAccountForm}
                className="p-1 h-6 w-6"
                disabled={showServiceAccountForm || savingField !== null}
              >
                <Plus className="h-3 w-3" />
              </Button>
            </div>

            <div className="space-y-3">
              {/* Create Form */}
              {showServiceAccountForm && (
                <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg space-y-2 border-2 border-blue-400">
                  <CustomInput
                    label="Service Name"
                    value={serviceAccountFormData.service_name}
                    onChange={(value) =>
                      setServiceAccountFormData((prev) => ({ ...prev, service_name: value }))
                    }
                    placeholder="e.g., Facebook, Instagram..."
                    variant="filled"
                    size="sm"
                    required
                  />

                  <CustomCombobox
                    label="Service Type"
                    value={serviceAccountFormData.service_type}
                    options={SERVICE_TYPE_OPTIONS}
                    onChange={(value) =>
                      setServiceAccountFormData((prev) => ({
                        ...prev,
                        service_type: value as any
                      }))
                    }
                    placeholder="Select type..."
                    size="sm"
                  />

                  <div className="flex items-center gap-2">
                    <div className="flex-1">
                      <CustomInput
                        label="Profile URL"
                        value={serviceAccountFormData.service_url}
                        onChange={(value) =>
                          setServiceAccountFormData((prev) => ({ ...prev, service_url: value }))
                        }
                        placeholder="https://..."
                        variant="filled"
                        size="sm"
                      />
                    </div>
                    {serviceAccountFormData.service_url && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => copyToClipboard(serviceAccountFormData.service_url)}
                        className="p-1 h-6 w-6 mt-5"
                        title="Copy URL"
                      >
                        <Copy className="h-3 w-3" />
                      </Button>
                    )}
                  </div>

                  <div className="pt-2">
                    <Metadata
                      metadata={serviceAccountFormData.metadata}
                      onMetadataChange={(newMetadata) =>
                        setServiceAccountFormData((prev) => ({ ...prev, metadata: newMetadata }))
                      }
                      title="Additional Metadata"
                      compact={true}
                      size="sm"
                      allowCreate={true}
                      allowEdit={true}
                      allowDelete={true}
                      collapsible={true}
                      defaultExpanded={false}
                    />
                  </div>

                  <div className="flex justify-end gap-2 pt-2 border-t border-gray-200 dark:border-gray-700">
                    <CustomButton
                      variant="secondary"
                      size="sm"
                      onClick={handleCancelServiceAccountForm}
                      disabled={isSubmitting}
                    >
                      Cancel
                    </CustomButton>
                    <CustomButton
                      variant="primary"
                      size="sm"
                      onClick={handleCreateServiceAccount}
                      disabled={!serviceAccountFormData.service_name.trim() || isSubmitting}
                      loading={isSubmitting}
                    >
                      Create
                    </CustomButton>
                  </div>
                </div>
              )}

              {/* Existing Service Accounts */}
              {serviceAccounts.map((serviceAccount) => {
                const editedSA = getEditingServiceAccount(serviceAccount)
                const profileUrl = editedSA.metadata?.profile_url || editedSA.service_url || ''
                const hasChanges = JSON.stringify(serviceAccount) !== JSON.stringify(editedSA)

                return (
                  <div
                    key={serviceAccount.id}
                    className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg space-y-2"
                  >
                    <CustomInput
                      label="Service Name"
                      value={editedSA.service_name}
                      onChange={(value) =>
                        handleUpdateServiceAccountField(serviceAccount, 'service_name', value)
                      }
                      placeholder="e.g., Facebook, Instagram..."
                      variant="filled"
                      size="sm"
                    />

                    <CustomCombobox
                      label="Service Type"
                      value={editedSA.service_type}
                      options={SERVICE_TYPE_OPTIONS}
                      onChange={(value) =>
                        handleUpdateServiceAccountField(serviceAccount, 'service_type', value)
                      }
                      placeholder="Select type..."
                      size="sm"
                    />

                    <div className="flex items-center gap-2">
                      <div className="flex-1">
                        <CustomInput
                          label="Profile URL"
                          value={profileUrl}
                          onChange={(value) => {
                            const newMetadata = { ...editedSA.metadata, profile_url: value }
                            handleUpdateServiceAccountField(serviceAccount, 'metadata', newMetadata)
                            handleUpdateServiceAccountField(serviceAccount, 'service_url', value)
                          }}
                          placeholder="https://..."
                          variant="filled"
                          size="sm"
                        />
                      </div>
                      {profileUrl && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => copyToClipboard(profileUrl)}
                          className="p-1 h-6 w-6 mt-5"
                          title="Copy URL"
                        >
                          <Copy className="h-3 w-3" />
                        </Button>
                      )}
                    </div>

                    <div className="pt-2">
                      <Metadata
                        metadata={editedSA.metadata || {}}
                        onMetadataChange={(newMetadata) =>
                          handleUpdateServiceAccountField(serviceAccount, 'metadata', newMetadata)
                        }
                        title="Additional Metadata"
                        compact={true}
                        size="sm"
                        allowCreate={true}
                        allowEdit={true}
                        allowDelete={true}
                        collapsible={true}
                        defaultExpanded={false}
                      />
                    </div>

                    <div className="flex justify-end gap-2 pt-2 border-t border-gray-200 dark:border-gray-700">
                      <CustomButton
                        variant="error"
                        size="sm"
                        onClick={() => handleDeleteServiceAccount(serviceAccount.id)}
                        disabled={savingField !== null}
                      >
                        Delete
                      </CustomButton>
                      {hasChanges && (
                        <CustomButton
                          variant="primary"
                          size="sm"
                          onClick={() => handleSaveServiceAccount(serviceAccount)}
                          disabled={savingField !== null}
                        >
                          {renderStatusIcon(
                            `service_account_${serviceAccount.id}`,
                            hasChanges,
                            () => {}
                          ) || 'Save'}
                        </CustomButton>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>

        {/* Relationships Section */}
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
                onClick={handleShowRelationshipForm}
                className="p-1 h-6 w-6"
                disabled={showRelationshipForm || savingField !== null || allPeople.length <= 1}
              >
                <Plus className="h-3 w-3" />
              </Button>
            </div>

            {allPeople.length <= 1 ? (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                <Users className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No other people to create relationships with</p>
              </div>
            ) : (
              <div className="space-y-3">
                {/* Create Form */}
                {showRelationshipForm && (
                  <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg space-y-2 border-2 border-blue-400">
                    <CustomCombobox
                      label="Related Person"
                      value={relationshipFormData.related_person_id}
                      options={getPersonOptions()}
                      onChange={(value) =>
                        setRelationshipFormData((prev) => ({
                          ...prev,
                          related_person_id: value as string
                        }))
                      }
                      placeholder="Select person..."
                      size="sm"
                      required
                    />

                    <CustomCombobox
                      label="Relationship Type"
                      value={relationshipFormData.relationship_type}
                      options={RELATIONSHIP_TYPE_OPTIONS}
                      onChange={(value) =>
                        setRelationshipFormData((prev) => ({
                          ...prev,
                          relationship_type: value as string
                        }))
                      }
                      placeholder="Select type..."
                      size="sm"
                    />

                    <div className="grid grid-cols-2 gap-2">
                      <CustomInput
                        label="Start Date"
                        type="date"
                        value={relationshipFormData.start_date}
                        onChange={(value) =>
                          setRelationshipFormData((prev) => ({ ...prev, start_date: value }))
                        }
                        variant="filled"
                        size="sm"
                      />

                      <CustomInput
                        label="End Date"
                        type="date"
                        value={relationshipFormData.end_date}
                        onChange={(value) =>
                          setRelationshipFormData((prev) => ({ ...prev, end_date: value }))
                        }
                        variant="filled"
                        size="sm"
                        disabled={relationshipFormData.is_current}
                      />
                    </div>

                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id="is_current_new"
                        checked={relationshipFormData.is_current}
                        onChange={(e) =>
                          setRelationshipFormData((prev) => ({
                            ...prev,
                            is_current: e.target.checked,
                            end_date: e.target.checked ? '' : prev.end_date
                          }))
                        }
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <label
                        htmlFor="is_current_new"
                        className="text-xs text-gray-700 dark:text-gray-300"
                      >
                        Current Relationship
                      </label>
                    </div>

                    <CustomInput
                      label="Notes"
                      value={relationshipFormData.notes}
                      onChange={(value) =>
                        setRelationshipFormData((prev) => ({ ...prev, notes: value }))
                      }
                      placeholder="Add notes about this relationship..."
                      variant="filled"
                      size="sm"
                    />

                    <div className="flex justify-end gap-2 pt-2 border-t border-gray-200 dark:border-gray-700">
                      <CustomButton
                        variant="secondary"
                        size="sm"
                        onClick={handleCancelRelationshipForm}
                        disabled={isSubmitting}
                      >
                        Cancel
                      </CustomButton>
                      <CustomButton
                        variant="primary"
                        size="sm"
                        onClick={handleCreateRelationship}
                        disabled={!relationshipFormData.related_person_id || isSubmitting}
                        loading={isSubmitting}
                      >
                        Create
                      </CustomButton>
                    </div>
                  </div>
                )}

                {/* Existing Relationships */}
                {relationships.map((relationship) => {
                  const editedRel = getEditingRelationship(relationship)
                  const hasChanges = JSON.stringify(relationship) !== JSON.stringify(editedRel)

                  return (
                    <div
                      key={relationship.id}
                      className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg space-y-2"
                    >
                      <CustomCombobox
                        label="Related Person"
                        value={editedRel.related_person_id}
                        options={getPersonOptions()}
                        onChange={(value) =>
                          handleUpdateRelationshipField(
                            relationship,
                            'related_person_id',
                            value as string
                          )
                        }
                        placeholder="Select person..."
                        size="sm"
                      />

                      <CustomCombobox
                        label="Relationship Type"
                        value={editedRel.relationship_type}
                        options={RELATIONSHIP_TYPE_OPTIONS}
                        onChange={(value) =>
                          handleUpdateRelationshipField(
                            relationship,
                            'relationship_type',
                            value as string
                          )
                        }
                        placeholder="Select type..."
                        size="sm"
                      />

                      <div className="grid grid-cols-2 gap-2">
                        <CustomInput
                          label="Start Date"
                          type="date"
                          value={editedRel.start_date || ''}
                          onChange={(value) =>
                            handleUpdateRelationshipField(relationship, 'start_date', value)
                          }
                          variant="filled"
                          size="sm"
                        />

                        <CustomInput
                          label="End Date"
                          type="date"
                          value={editedRel.end_date || ''}
                          onChange={(value) =>
                            handleUpdateRelationshipField(relationship, 'end_date', value)
                          }
                          variant="filled"
                          size="sm"
                          disabled={editedRel.is_current}
                        />
                      </div>

                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          id={`is_current_${relationship.id}`}
                          checked={editedRel.is_current || false}
                          onChange={(e) => {
                            handleUpdateRelationshipField(
                              relationship,
                              'is_current',
                              e.target.checked
                            )
                            if (e.target.checked) {
                              handleUpdateRelationshipField(relationship, 'end_date', '')
                            }
                          }}
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                        <label
                          htmlFor={`is_current_${relationship.id}`}
                          className="text-xs text-gray-700 dark:text-gray-300"
                        >
                          Current Relationship
                        </label>
                        {hasChanges &&
                          renderStatusIcon(`relationship_${relationship.id}`, hasChanges, () =>
                            handleSaveRelationship(relationship)
                          )}
                      </div>

                      <CustomInput
                        label="Notes"
                        value={editedRel.notes || ''}
                        onChange={(value) =>
                          handleUpdateRelationshipField(relationship, 'notes', value)
                        }
                        placeholder="Add notes about this relationship..."
                        variant="filled"
                        size="sm"
                      />

                      <div className="flex justify-end gap-2 pt-2 border-t border-gray-200 dark:border-gray-700">
                        <CustomButton
                          variant="error"
                          size="sm"
                          onClick={() => handleDeleteRelationship(relationship.id)}
                          disabled={savingField !== null}
                        >
                          Delete
                        </CustomButton>
                        {hasChanges && (
                          <CustomButton
                            variant="primary"
                            size="sm"
                            onClick={() => handleSaveRelationship(relationship)}
                            disabled={savingField !== null}
                          >
                            {renderStatusIcon(
                              `relationship_${relationship.id}`,
                              hasChanges,
                              () => {}
                            ) || 'Save'}
                          </CustomButton>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default SocialSection
