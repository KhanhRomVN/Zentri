// src/renderer/src/presentation/pages/PeopleManager/components/PeopleDetailPanel/components/SocialSection/components/ServiceAccount/index.tsx
import React from 'react'
import { Button } from '../../../../../../../../../components/ui/button'
import { Plus, Globe } from 'lucide-react'
import { ServiceAccount } from '../../../../../../types'
import ServiceAccountForm from './components/ServiceAccountForm'
import ServiceAccountCard from './components/ServiceAccountCard'

interface ServiceAccountSectionProps {
  serviceAccounts: ServiceAccount[]
  showServiceAccountForm: boolean
  serviceAccountFormData: {
    service_name: string
    service_type: 'social_media' | 'communication' | 'other'
    service_url: string
    metadata: Record<string, any>
  }
  editingServiceAccounts: Record<string, ServiceAccount>
  savingField: string | null
  saveStatus: { [key: string]: 'success' | 'error' | null }
  isSubmitting: boolean
  onShowForm: () => void
  onCancelForm: () => void
  onFormDataChange: (updates: any) => void
  onCreate: () => void
  onUpdateField: (serviceAccount: ServiceAccount, field: keyof ServiceAccount, value: any) => void
  onSave: (serviceAccount: ServiceAccount) => void
  onDelete: (id: string) => void
  onCopyUrl: (url: string) => void
  renderStatusIcon: (field: string, hasChanged: boolean, onSave: () => void) => React.ReactNode
}

const SERVICE_TYPE_OPTIONS = [
  { value: 'social_media', label: 'Social Media' },
  { value: 'communication', label: 'Communication' },
  { value: 'other', label: 'Other' }
]

const ServiceAccountSection: React.FC<ServiceAccountSectionProps> = ({
  serviceAccounts,
  showServiceAccountForm,
  serviceAccountFormData,
  editingServiceAccounts,
  savingField,
  saveStatus,
  isSubmitting,
  onShowForm,
  onCancelForm,
  onFormDataChange,
  onCreate,
  onUpdateField,
  onSave,
  onDelete,
  onCopyUrl,
  renderStatusIcon
}) => {
  const getEditingServiceAccount = (sa: ServiceAccount): ServiceAccount => {
    if (!editingServiceAccounts[sa.id]) {
      return sa
    }
    return editingServiceAccounts[sa.id]
  }

  return (
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
            onClick={onShowForm}
            className="p-1 h-6 w-6"
            disabled={showServiceAccountForm || savingField !== null}
          >
            <Plus className="h-3 w-3" />
          </Button>
        </div>

        <div className="space-y-3">
          {/* Create Form */}
          {showServiceAccountForm && (
            <ServiceAccountForm
              formData={serviceAccountFormData}
              serviceTypeOptions={SERVICE_TYPE_OPTIONS}
              isSubmitting={isSubmitting}
              onFormDataChange={onFormDataChange}
              onSubmit={onCreate}
              onCancel={onCancelForm}
              onCopyUrl={onCopyUrl}
            />
          )}

          {/* Existing Service Accounts */}
          {serviceAccounts.map((serviceAccount) => {
            const editedSA = getEditingServiceAccount(serviceAccount)
            const hasChanges = JSON.stringify(serviceAccount) !== JSON.stringify(editedSA)

            return (
              <ServiceAccountCard
                key={serviceAccount.id}
                serviceAccount={serviceAccount}
                editedServiceAccount={editedSA}
                serviceTypeOptions={SERVICE_TYPE_OPTIONS}
                hasChanges={hasChanges}
                savingField={savingField}
                saveStatus={saveStatus}
                onUpdateField={(field, value) => onUpdateField(serviceAccount, field, value)}
                onSave={() => onSave(serviceAccount)}
                onDelete={() => onDelete(serviceAccount.id)}
                onCopyUrl={onCopyUrl}
                renderStatusIcon={renderStatusIcon}
              />
            )
          })}
        </div>
      </div>
    </div>
  )
}

export default ServiceAccountSection
