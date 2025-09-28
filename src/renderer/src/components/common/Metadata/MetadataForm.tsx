import React, { useState } from 'react'
import CustomInput from '../CustomInput'
import CustomButton from '../CustomButton'
import CustomCodeEditor from '../CustomCodeEditor'
import { cn } from '../../../shared/lib/utils'
import { Check, X, Plus, Calendar, ExternalLink } from 'lucide-react'
import { MetadataFieldType } from './types'

// Boolean Toggle Component
export const BooleanToggle: React.FC<{
  value: boolean
  onChange: (value: boolean) => void
  disabled?: boolean
}> = ({ value, onChange, disabled }) => (
  <div className="flex items-center gap-2">
    <button
      type="button"
      onClick={() => onChange(true)}
      disabled={disabled}
      className={cn(
        'px-3 py-1.5 rounded-md text-sm font-medium transition-colors',
        value
          ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
          : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400 hover:bg-green-50 dark:hover:bg-green-900/10',
        disabled && 'opacity-50 cursor-not-allowed'
      )}
    >
      <Check className="h-3 w-3 mr-1 inline" />
      True
    </button>
    <button
      type="button"
      onClick={() => onChange(false)}
      disabled={disabled}
      className={cn(
        'px-3 py-1.5 rounded-md text-sm font-medium transition-colors',
        !value
          ? 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'
          : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400 hover:bg-red-50 dark:hover:bg-red-900/10',
        disabled && 'opacity-50 cursor-not-allowed'
      )}
    >
      <X className="h-3 w-3 mr-1 inline" />
      False
    </button>
  </div>
)

// Array Input Component
// Array Input Component
export const ArrayInput: React.FC<{
  items: string[]
  onChange: (items: string[]) => void
  disabled?: boolean
}> = ({ items, onChange, disabled }) => {
  const [newItem, setNewItem] = useState('')

  const addItem = () => {
    if (newItem.trim() && !items.includes(newItem.trim())) {
      onChange([...items, newItem.trim()])
      setNewItem('')
    }
  }

  const removeItem = (index: number) => {
    onChange(items.filter((_, i) => i !== index))
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      addItem()
    }
  }

  return (
    <div className="space-y-3">
      {/* Add new item - Full width input with square button */}
      {!disabled && (
        <div className="flex gap-2">
          <div className="flex-1">
            <CustomInput
              value={newItem}
              onChange={setNewItem}
              placeholder="Add array item..."
              size="sm"
              onKeyDown={handleKeyDown}
            />
          </div>
          <CustomButton
            variant="secondary"
            size="sm"
            onClick={addItem}
            disabled={!newItem.trim() || items.includes(newItem.trim())}
            className="aspect-square h-10 w-10 p-0 flex-shrink-0"
          >
            <Plus className="h-4 w-4" />
          </CustomButton>
        </div>
      )}

      {/* Existing items - Display below input */}
      {items.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {items.map((item, index) => (
            <span
              key={index}
              className="inline-flex items-center gap-1 px-3 py-1.5 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 rounded-md text-sm border border-blue-200 dark:border-blue-800"
            >
              <span className="font-medium">{item}</span>
              {!disabled && (
                <button
                  type="button"
                  onClick={() => removeItem(index)}
                  className="ml-1 hover:bg-blue-200 dark:hover:bg-blue-800 rounded-sm p-0.5 transition-colors"
                  title="Remove item"
                >
                  <X className="h-3 w-3" />
                </button>
              )}
            </span>
          ))}
        </div>
      )}

      {/* Empty state */}
      {items.length === 0 && !disabled && (
        <p className="text-sm text-gray-500 dark:text-gray-400 italic text-center py-2">
          No items added yet. Enter text above and press Enter or click + to add.
        </p>
      )}
    </div>
  )
}

// URL Input Component
export const URLInput: React.FC<{
  value: string
  onChange: (value: string) => void
  disabled?: boolean
}> = ({ value, onChange, disabled }) => {
  const [isValidating, setIsValidating] = useState(false)
  const [isValid, setIsValid] = useState<boolean | null>(null)

  const validateURL = async (url: string) => {
    if (!url.trim()) {
      setIsValid(null)
      return
    }

    try {
      new URL(url) // Basic URL validation
      setIsValidating(true)

      // Simple check - in real app, you might want to do actual HTTP request
      const isHttpUrl = url.startsWith('http://') || url.startsWith('https://')
      setIsValid(isHttpUrl)

      setTimeout(() => setIsValidating(false), 500) // Simulate network check
    } catch {
      setIsValid(false)
      setIsValidating(false)
    }
  }

  React.useEffect(() => {
    const timeoutId = setTimeout(() => {
      validateURL(value)
    }, 500)

    return () => clearTimeout(timeoutId)
  }, [value])

  return (
    <div className="space-y-2">
      <CustomInput
        value={value}
        onChange={onChange}
        placeholder="https://example.com"
        disabled={disabled}
        size="sm"
        rightIcon={
          <div className="flex items-center gap-1">
            {isValidating && (
              <div className="animate-spin h-3 w-3 border border-blue-500 border-t-transparent rounded-full" />
            )}
            {!isValidating && isValid === true && <Check className="h-3 w-3 text-green-500" />}
            {!isValidating && isValid === false && <X className="h-3 w-3 text-red-500" />}
            {value && isValid === true && (
              <a
                href={value}
                target="_blank"
                rel="noopener noreferrer"
                className="p-0.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
              >
                <ExternalLink className="h-3 w-3 text-blue-500" />
              </a>
            )}
          </div>
        }
      />
      {!isValidating && isValid === false && (
        <p className="text-xs text-red-500">Invalid URL format</p>
      )}
    </div>
  )
}

// DateTime Picker Component
export const DateTimePicker: React.FC<{
  value: string
  onChange: (value: string) => void
  disabled?: boolean
}> = ({ value, onChange, disabled }) => {
  const formatDateForInput = (isoString: string) => {
    if (!isoString) return ''
    try {
      const date = new Date(isoString)
      const year = date.getFullYear()
      const month = String(date.getMonth() + 1).padStart(2, '0')
      const day = String(date.getDate()).padStart(2, '0')
      const hours = String(date.getHours()).padStart(2, '0')
      const minutes = String(date.getMinutes()).padStart(2, '0')
      return `${year}-${month}-${day}T${hours}:${minutes}`
    } catch {
      return ''
    }
  }

  const handleDateChange = (inputValue: string) => {
    if (!inputValue) {
      onChange('')
      return
    }

    try {
      const date = new Date(inputValue)
      onChange(date.toISOString())
    } catch {
      onChange(inputValue) // Keep invalid value for user to fix
    }
  }

  const setToNow = () => {
    onChange(new Date().toISOString())
  }

  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        <input
          type="datetime-local"
          value={formatDateForInput(value)}
          onChange={(e) => handleDateChange(e.target.value)}
          disabled={disabled}
          className={cn(
            'flex-1 px-3 py-2 text-sm rounded-lg border',
            'bg-white dark:bg-gray-800',
            'border-gray-200 dark:border-gray-700',
            'focus:border-blue-500 dark:focus:border-blue-400',
            'focus:ring-1 focus:ring-blue-500 dark:focus:ring-blue-400',
            'transition-colors',
            disabled && 'opacity-50 cursor-not-allowed'
          )}
        />
        {!disabled && (
          <CustomButton
            variant="secondary"
            size="sm"
            onClick={setToNow}
            title="Set to current time"
          >
            <Calendar className="h-3 w-3" />
          </CustomButton>
        )}
      </div>
      {value && <p className="text-xs text-gray-500">ISO: {value}</p>}
    </div>
  )
}

// Field Input Renderer
// Field Input Renderer
export const renderFieldInput = (
  type: MetadataFieldType,
  value: string,
  onChange: (value: string) => void,
  extraProps: any,
  setExtraProps: (props: any) => void,
  disabled: boolean = false
) => {
  switch (type) {
    case 'boolean':
      return (
        <BooleanToggle
          value={value.toLowerCase() === 'true'}
          onChange={(boolValue) => onChange(String(boolValue))}
          disabled={disabled}
        />
      )

    case 'date':
      // Return CustomInput with datetime-local type for direct DateAndTimePicker integration
      return (
        <CustomInput
          type="datetime-local"
          value={value}
          onChange={onChange}
          disabled={disabled}
          size="sm"
          placeholder="Select date and time"
          showTime={true}
        />
      )

    case 'array':
      return (
        <ArrayInput
          items={extraProps.arrayItems || []}
          onChange={(items) => {
            setExtraProps({ ...extraProps, arrayItems: items })
            onChange(JSON.stringify(items))
          }}
          disabled={disabled}
        />
      )

    case 'url':
      return <URLInput value={value} onChange={onChange} disabled={disabled} />

    case 'code':
      return (
        <CustomCodeEditor
          value={value}
          language={extraProps.codeLanguage || 'javascript'}
          onChange={onChange}
          onLanguageChange={(lang) => setExtraProps({ ...extraProps, codeLanguage: lang })}
          disabled={disabled}
        />
      )

    case 'null':
      return (
        <div className="text-sm text-gray-500 italic p-3 bg-gray-50 dark:bg-gray-800 rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-600 text-center">
          This field will be set to null value
        </div>
      )

    default:
      return (
        <CustomInput
          value={value}
          onChange={onChange}
          placeholder={type === 'number' ? 'Enter number...' : 'Enter text...'}
          type={type === 'number' ? 'number' : 'text'}
          disabled={disabled}
          size="sm"
        />
      )
  }
}
