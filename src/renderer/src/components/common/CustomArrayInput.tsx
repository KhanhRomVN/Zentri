import React, { useState } from 'react'
import CustomInput from './CustomInput'
import CustomButton from './CustomButton'
import { Plus, X, AlertCircle } from 'lucide-react'
import { cn } from '../../shared/lib/utils'

export interface CustomArrayInputProps {
  items: string[]
  onChange: (items: string[]) => void
  disabled?: boolean
  placeholder?: string
  allowDuplicates?: boolean
  maxItems?: number
  minItems?: number
  className?: string
  error?: string
  hint?: string
  viewMode?: boolean // New prop for view-only mode with hover edit
}

const CustomArrayInput: React.FC<CustomArrayInputProps> = ({
  items = [],
  onChange,
  disabled = false,
  placeholder = 'Add array item...',
  allowDuplicates = false,
  maxItems = 50,
  minItems = 0,
  className,
  error,
  hint,
  viewMode = false // Default to false (normal mode)
}) => {
  const [newItem, setNewItem] = useState('')
  const [validationError, setValidationError] = useState('')

  // Validate new item
  const validateNewItem = (item: string): string | null => {
    const trimmedItem = item.trim()

    if (!trimmedItem) {
      return 'Item cannot be empty'
    }

    if (!allowDuplicates && items.includes(trimmedItem)) {
      return '⚠️ This backup code already exists and cannot be added again'
    }

    if (items.length >= maxItems) {
      return `Maximum ${maxItems} items allowed`
    }

    return null
  }

  // Add new item
  const addItem = () => {
    const validationError = validateNewItem(newItem)

    if (validationError) {
      setValidationError(validationError)
      return // STOP HERE - không cho phép thêm khi có lỗi
    }

    const trimmedItem = newItem.trim()
    // Double check duplicate (không cần thiết nữa vì đã check trong validateNewItem)

    onChange([...items, trimmedItem])
    setNewItem('')
    setValidationError('')
  }

  // Remove item
  const removeItem = (index: number) => {
    if (items.length <= minItems) {
      setValidationError(`Minimum ${minItems} items required`)
      return
    }

    onChange(items.filter((_, i) => i !== index))
    setValidationError('')
  }

  // Handle key press
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      e.stopPropagation() // Ngăn form submit

      const validationError = validateNewItem(newItem)
      if (validationError) {
        setValidationError(validationError)
        return // STOP - không gọi addItem
      }

      addItem()
    }
  }

  const showError = error || validationError
  const isButtonDisabled = disabled || items.length >= maxItems || !newItem.trim()
  const isInputDisabled = disabled || items.length >= maxItems

  return (
    <div className={cn('space-y-3', className)}>
      {/* Add new item - Only show in normal mode (not viewMode) */}
      {!disabled && !viewMode && (
        <div className="space-y-2">
          <div className="flex gap-2">
            <div className="flex-1">
              <CustomInput
                value={newItem}
                onChange={(value) => {
                  setNewItem(value)
                  // Clear error khi user bắt đầu sửa
                  if (validationError) {
                    setValidationError('')
                  }
                }}
                placeholder={
                  items.length >= maxItems ? `Maximum ${maxItems} items reached` : placeholder
                }
                size="sm"
                onKeyDown={handleKeyDown}
                disabled={isInputDisabled}
                error={validationError} // Pass error để highlight input
                className={validationError ? 'border-red-300 focus:border-red-500' : ''}
              />
            </div>
            <CustomButton
              variant="secondary"
              size="sm"
              onClick={addItem}
              disabled={isButtonDisabled}
              className="aspect-square h-10 w-10 p-0 flex-shrink-0"
            >
              <Plus className="h-4 w-4" />
            </CustomButton>
          </div>
        </div>
      )}

      {/* Existing items - Display as tags */}
      <div className="flex flex-wrap gap-2">
        {items.map((item, index) => (
          <span
            key={index}
            className={cn(
              'inline-flex items-center rounded-md text-sm border transition-all duration-200',
              'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800',
              // Padding và gap khác nhau giữa viewMode và normal mode
              viewMode && !disabled && items.length > minItems
                ? 'px-3 py-1.5 group hover:bg-blue-100 dark:hover:bg-blue-800/30 hover:gap-1 hover:pr-2'
                : 'gap-1 px-3 py-1.5'
            )}
          >
            <span className="font-medium">{item}</span>
            {!disabled && items.length > minItems && (
              <button
                type="button"
                onClick={() => removeItem(index)}
                className={cn(
                  'rounded-sm p-0.5 transition-all duration-200',
                  viewMode
                    ? 'w-0 opacity-0 overflow-hidden group-hover:w-5 group-hover:opacity-100 group-hover:ml-1 hover:bg-blue-200 dark:hover:bg-blue-700'
                    : 'ml-1 hover:bg-blue-200 dark:hover:bg-blue-800'
                )}
                title="Remove item"
              >
                <X className="h-3 w-3" />
              </button>
            )}
          </span>
        ))}
      </div>

      {/* Empty state - Only show in normal mode */}
      {items.length === 0 && !disabled && !viewMode && (
        <p className="text-sm text-gray-500 dark:text-gray-400 italic text-center py-2">
          No items added yet. Enter text above and press Enter or click + to add.
        </p>
      )}

      {/* View mode empty state */}
      {items.length === 0 && viewMode && (
        <p className="text-sm text-gray-500 dark:text-gray-400 italic text-center py-2">
          No array items
        </p>
      )}
    </div>
  )
}

export default CustomArrayInput
