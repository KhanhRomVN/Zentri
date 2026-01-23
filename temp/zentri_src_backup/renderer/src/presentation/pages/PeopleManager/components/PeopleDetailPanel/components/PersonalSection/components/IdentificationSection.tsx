// IdentificationSection.tsx
import React from 'react'
import { Button } from '../../../../../../../../components/ui/button'
import CustomInput from '../../../../../../../../components/common/CustomInput'
import CustomCombobox from '../../../../../../../../components/common/CustomCombobox'
import { Plus, Trash2, Globe, CreditCard } from 'lucide-react'
import { Identification } from '../../../../../types'

interface IdentificationSectionProps {
  identifications: Identification[]
  editingIdentifications: Record<string, Identification>
  savingField: string | null
  onUpdateIdentification: (id: string, updates: Partial<Identification>) => void
  onCreate: () => void
  onSave: (id: string) => void
  onDelete: (id: string) => void
  renderStatusIcon: (
    field: string,
    hasChanged: boolean,
    onSave: () => void
  ) => React.ReactNode | undefined
}

const IDENTIFICATION_TYPE_OPTIONS = [
  { value: 'passport', label: 'Passport' },
  { value: 'national_id', label: 'National ID' },
  { value: 'driver_license', label: 'Driver License' },
  { value: 'birth_certificate', label: 'Birth Certificate' }
]

const IdentificationSection: React.FC<IdentificationSectionProps> = ({
  identifications,
  editingIdentifications,
  savingField,
  onUpdateIdentification,
  onCreate,
  onSave,
  onDelete,
  renderStatusIcon
}) => {
  const EmptyState = () => (
    <div className="text-center py-8 text-gray-500 dark:text-gray-400">
      <CreditCard className="h-8 w-8 mx-auto mb-2 opacity-50" />
      <p className="text-sm">No identification documents</p>
      <Button
        variant="ghost"
        size="sm"
        onClick={onCreate}
        className="mt-2 text-xs"
        disabled={savingField !== null}
      >
        <Plus className="h-3 w-3 mr-1" />
        Add Identification
      </Button>
    </div>
  )

  return (
    <div className="bg-card-background rounded-lg border border-border-default hover:border-border-hover shadow-sm hover:shadow transition-all duration-200">
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
            onClick={onCreate}
            className="p-1 h-6 w-6"
            disabled={savingField !== null}
          >
            <Plus className="h-3 w-3" />
          </Button>
        </div>

        {identifications.length === 0 ? (
          <EmptyState />
        ) : (
          <div className="space-y-3">
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
                      onChange={(value) =>
                        onUpdateIdentification(identification.id, { type: value as any })
                      }
                      placeholder="Select type..."
                      size="sm"
                    />
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onDelete(identification.id)}
                    className="p-1 h-6 w-6 text-red-600 hover:bg-red-50"
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>

                <CustomInput
                  label="Number"
                  value={identification.number}
                  onChange={(value) => onUpdateIdentification(identification.id, { number: value })}
                  placeholder="ID number..."
                  variant="filled"
                  size="sm"
                />

                <div className="grid grid-cols-2 gap-2">
                  <CustomInput
                    label="Issue Date"
                    type="date"
                    value={identification.issue_date || ''}
                    onChange={(value) =>
                      onUpdateIdentification(identification.id, { issue_date: value })
                    }
                    variant="filled"
                    size="sm"
                  />

                  <CustomInput
                    label="Expiry Date"
                    type="date"
                    value={identification.expiry_date || ''}
                    onChange={(value) =>
                      onUpdateIdentification(identification.id, { expiry_date: value })
                    }
                    variant="filled"
                    size="sm"
                  />
                </div>

                <CustomInput
                  label="Issuing Country"
                  value={identification.issuing_country || ''}
                  onChange={(value) =>
                    onUpdateIdentification(identification.id, { issuing_country: value })
                  }
                  placeholder="Country..."
                  variant="filled"
                  size="sm"
                  leftIcon={<Globe className="h-3 w-3" />}
                  rightIcon={renderStatusIcon(
                    `identification_${identification.id}`,
                    JSON.stringify(identification) !==
                      JSON.stringify(identifications.find((i) => i.id === identification.id)),
                    () => onSave(identification.id)
                  )}
                />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default IdentificationSection
