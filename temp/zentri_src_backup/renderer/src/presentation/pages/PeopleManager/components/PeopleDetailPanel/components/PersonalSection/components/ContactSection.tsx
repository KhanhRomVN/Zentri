// ContactSection.tsx
import React from 'react'
import { Button } from '../../../../../../../../components/ui/button'
import CustomInput from '../../../../../../../../components/common/CustomInput'
import CustomCombobox from '../../../../../../../../components/common/CustomCombobox'
import { Plus, Trash2, Copy, Mail, Globe, Link as LinkIcon } from 'lucide-react'
import { Contact, ServiceAccount } from '../../../../../types'

interface ContactSectionProps {
  contacts: Contact[]
  editingContacts: Record<string, Contact>
  serviceAccounts: ServiceAccount[]
  savingField: string | null
  onUpdateContact: (id: string, updates: Partial<Contact>) => void
  onCreate: () => void
  onSave: (id: string) => void
  onDelete: (id: string) => void
  onCopyToClipboard: (text: string) => void
  renderStatusIcon: (
    field: string,
    hasChanged: boolean,
    onSave: () => void
  ) => React.ReactNode | undefined
}

const CONTACT_TYPE_OPTIONS = [
  { value: 'sms', label: 'Phone' },
  { value: 'email', label: 'Email' },
  { value: 'communication', label: 'Communication' },
  { value: 'social_media', label: 'Social Media' },
  { value: 'other', label: 'Other' }
]

const ContactSection: React.FC<ContactSectionProps> = ({
  contacts,
  editingContacts,
  serviceAccounts,
  savingField,
  onUpdateContact,
  onCreate,
  onSave,
  onDelete,
  onCopyToClipboard,
  renderStatusIcon
}) => {
  const getAvailableServiceAccounts = (currentServiceAccountId?: string) => {
    const linkedServiceAccountIds = contacts
      .filter((c) => c.contact_type === 'social_media' && c.service_account_id)
      .map((c) => c.service_account_id)
      .filter((id) => id !== currentServiceAccountId)

    return serviceAccounts
      .filter((sa) => !linkedServiceAccountIds.includes(sa.id))
      .map((sa) => ({
        value: sa.id,
        label: sa.service_name
      }))
  }

  const getServiceAccountName = (serviceAccountId?: string) => {
    if (!serviceAccountId) return ''
    const sa = serviceAccounts.find((s) => s.id === serviceAccountId)
    return sa?.service_name || ''
  }

  const getContactValue = (contact: Contact) => {
    if (contact.contact_type === 'email') return contact.email_address || ''
    if (contact.contact_type === 'sms') return contact.phone_number || ''
    if (contact.contact_type === 'social_media')
      return getServiceAccountName(contact.service_account_id)
    return ''
  }

  const EmptyState = () => (
    <div className="text-center py-8 text-gray-500 dark:text-gray-400">
      <Mail className="h-8 w-8 mx-auto mb-2 opacity-50" />
      <p className="text-sm">No contact information</p>
      <Button
        variant="ghost"
        size="sm"
        onClick={onCreate}
        className="mt-2 text-xs"
        disabled={savingField !== null}
      >
        <Plus className="h-3 w-3 mr-1" />
        Add Contact
      </Button>
    </div>
  )

  return (
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
            onClick={onCreate}
            className="p-1 h-6 w-6"
            disabled={savingField !== null}
          >
            <Plus className="h-3 w-3" />
          </Button>
        </div>

        {contacts.length === 0 ? (
          <EmptyState />
        ) : (
          <div className="space-y-2">
            {Object.values(editingContacts).map((contact) => {
              const contactValue = getContactValue(contact)
              const isSocialMedia = contact.contact_type === 'social_media'
              const availableServiceAccounts = getAvailableServiceAccounts(
                contact.service_account_id
              )

              return (
                <div
                  key={contact.id}
                  className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700"
                >
                  {/* Header Row */}
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-20">
                      <CustomCombobox
                        label=""
                        value={contact.contact_type}
                        options={CONTACT_TYPE_OPTIONS}
                        onChange={(value) =>
                          onUpdateContact(contact.id, {
                            contact_type: value as any,
                            service_account_id:
                              value === 'social_media' ? contact.service_account_id : undefined
                          })
                        }
                        placeholder="Type..."
                        size="sm"
                      />
                    </div>

                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onDelete(contact.id)}
                      className="p-1 h-6 w-6 text-red-600 hover:bg-red-50 ml-auto"
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>

                  {/* Contact Value Row */}
                  {isSocialMedia ? (
                    <div className="space-y-2">
                      <CustomCombobox
                        label="Service Account"
                        value={contact.service_account_id || ''}
                        options={availableServiceAccounts}
                        onChange={(value) =>
                          onUpdateContact(contact.id, { service_account_id: value as string })
                        }
                        placeholder="Select service account..."
                        size="sm"
                        leftIcon={<LinkIcon className="h-3 w-3" />}
                      />
                      {availableServiceAccounts.length === 0 && (
                        <p className="text-xs text-amber-600 dark:text-amber-400">
                          No available service accounts. Create one in Social section first.
                        </p>
                      )}
                    </div>
                  ) : (
                    <CustomInput
                      label=""
                      value={contactValue}
                      onChange={(value) => {
                        const updates: Partial<Contact> = {}
                        if (contact.contact_type === 'email') {
                          updates.email_address = value
                        } else if (contact.contact_type === 'sms') {
                          updates.phone_number = value
                        }
                        onUpdateContact(contact.id, updates)
                      }}
                      placeholder={`Enter ${contact.contact_type}...`}
                      variant="filled"
                      size="sm"
                      leftIcon={
                        contact.contact_type === 'email' ? (
                          <Mail className="h-3 w-3" />
                        ) : contact.contact_type === 'sms' ? (
                          <Globe className="h-3 w-3" />
                        ) : undefined
                      }
                    />
                  )}

                  {/* Actions Row */}
                  <div className="flex items-center justify-between mt-2 pt-2 border-t border-gray-200 dark:border-gray-700">
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id={`primary_${contact.id}`}
                        checked={contact.is_primary || false}
                        onChange={(e) =>
                          onUpdateContact(contact.id, { is_primary: e.target.checked })
                        }
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <label
                        htmlFor={`primary_${contact.id}`}
                        className="text-xs text-gray-600 dark:text-gray-400"
                      >
                        Primary
                      </label>
                    </div>

                    <div className="flex items-center gap-1">
                      {contactValue && !isSocialMedia && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onCopyToClipboard(contactValue)}
                          className="p-1 h-6 w-6"
                          title="Copy"
                        >
                          <Copy className="h-3 w-3" />
                        </Button>
                      )}
                      {renderStatusIcon(
                        `contact_${contact.id}`,
                        JSON.stringify(contact) !==
                          JSON.stringify(contacts.find((c) => c.id === contact.id)),
                        () => onSave(contact.id)
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

export default ContactSection
