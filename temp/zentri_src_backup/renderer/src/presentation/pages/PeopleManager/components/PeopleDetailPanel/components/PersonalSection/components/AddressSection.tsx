// AddressSection.tsx
import React from 'react'
import { Button } from '../../../../../../../../components/ui/button'
import CustomInput from '../../../../../../../../components/common/CustomInput'
import { Plus, Trash2, MapPin, Globe } from 'lucide-react'
import { Address } from '../../../../../types'

interface AddressSectionProps {
  addresses: Address[]
  editingAddresses: Record<string, Address>
  savingField: string | null
  onUpdateAddress: (id: string, updates: Partial<Address>) => void
  onCreate: () => void
  onSave: (id: string) => void
  onDelete: (id: string) => void
  renderStatusIcon: (
    field: string,
    hasChanged: boolean,
    onSave: () => void
  ) => React.ReactNode | undefined
}

const AddressSection: React.FC<AddressSectionProps> = ({
  addresses,
  editingAddresses,
  savingField,
  onUpdateAddress,
  onCreate,
  onSave,
  onDelete,
  renderStatusIcon
}) => {
  const EmptyState = () => (
    <div className="text-center py-8 text-gray-500 dark:text-gray-400">
      <MapPin className="h-8 w-8 mx-auto mb-2 opacity-50" />
      <p className="text-sm">No addresses</p>
      <Button
        variant="ghost"
        size="sm"
        onClick={onCreate}
        className="mt-2 text-xs"
        disabled={savingField !== null}
      >
        <Plus className="h-3 w-3 mr-1" />
        Add Address
      </Button>
    </div>
  )

  return (
    <div className="bg-card-background rounded-lg border border-border-default hover:border-border-hover shadow-sm hover:shadow transition-all duration-200">
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
            onClick={onCreate}
            className="p-1 h-6 w-6"
            disabled={savingField !== null}
          >
            <Plus className="h-3 w-3" />
          </Button>
        </div>

        {addresses.length === 0 ? (
          <EmptyState />
        ) : (
          <div className="space-y-3">
            {Object.values(editingAddresses).map((address) => (
              <div
                key={address.id}
                className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg space-y-2"
              >
                <div className="flex items-center gap-2">
                  <CustomInput
                    label="Type"
                    value={address.address_type || ''}
                    onChange={(value) => onUpdateAddress(address.id, { address_type: value })}
                    placeholder="e.g., Home, Work..."
                    variant="filled"
                    size="sm"
                  />
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onDelete(address.id)}
                    className="p-1 h-6 w-6 text-red-600 hover:bg-red-50 mt-4"
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>

                <CustomInput
                  label="Street Address"
                  value={address.street_address || ''}
                  onChange={(value) => onUpdateAddress(address.id, { street_address: value })}
                  placeholder="Street address..."
                  variant="filled"
                  size="sm"
                  leftIcon={<MapPin className="h-3 w-3" />}
                />

                <div className="grid grid-cols-2 gap-2">
                  <CustomInput
                    label="City"
                    value={address.city || ''}
                    onChange={(value) => onUpdateAddress(address.id, { city: value })}
                    placeholder="City..."
                    variant="filled"
                    size="sm"
                  />

                  <CustomInput
                    label="Country"
                    value={address.country || ''}
                    onChange={(value) => onUpdateAddress(address.id, { country: value })}
                    placeholder="Country..."
                    variant="filled"
                    size="sm"
                    leftIcon={<Globe className="h-3 w-3" />}
                    rightIcon={renderStatusIcon(
                      `address_${address.id}`,
                      JSON.stringify(address) !==
                        JSON.stringify(addresses.find((a) => a.id === address.id)),
                      () => onSave(address.id)
                    )}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default AddressSection
