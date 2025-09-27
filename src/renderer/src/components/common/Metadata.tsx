// src/renderer/src/components/common/Metadata.tsx
import React, { useState } from 'react'
import CustomInput from './CustomInput'
import CustomCombobox from './CustomCombobox'
import CustomButton from './CustomButton'
import { Database, Copy, Trash2, ChevronDown, ChevronUp, Plus, Edit2 } from 'lucide-react'
import { cn } from '../../shared/lib/utils'

// Field type definitions
export type MetadataFieldType =
  | 'string'
  | 'number'
  | 'boolean'
  | 'date'
  | 'array'
  | 'binary'
  | 'null'

export interface MetadataFieldInfo {
  value: any
  type: MetadataFieldType
}

// Field type options for combobox
const FIELD_TYPE_OPTIONS = [
  { value: 'string', label: 'String (Text)' },
  { value: 'number', label: 'Number' },
  { value: 'boolean', label: 'Boolean (True/False)' },
  { value: 'date', label: 'Date (ISO String)' },
  { value: 'array', label: 'Array (Mixed Types)' },
  { value: 'binary', label: 'Binary/Buffer Data' },
  { value: 'null', label: 'Null Value' }
]

interface MetadataProps {
  metadata: Record<string, any>
  onMetadataChange?: (metadata: Record<string, any>) => void
  onDelete?: (key: string) => void
  title?: string
  className?: string
  compact?: boolean
  collapsible?: boolean
  defaultExpanded?: boolean
  readOnly?: boolean
  hideEmpty?: boolean
  maxVisibleFields?: number
  allowCreate?: boolean
  allowEdit?: boolean
  allowDelete?: boolean
  size?: 'sm' | 'md' | 'lg'
  protectedFields?: string[]
  shouldRenderField?: (key: string, value: any) => boolean
  editable?: boolean
  showDeleteButtons?: boolean
}

interface EditingField {
  key: string
  value: string
  type: MetadataFieldType
  isNew: boolean
}

interface EditingExistingField {
  originalKey: string
  newKey: string
  newValue: string
  newType: MetadataFieldType
}

const Metadata: React.FC<MetadataProps> = ({
  metadata = {},
  onMetadataChange,
  onDelete,
  title = 'Metadata',
  className,
  compact = false,
  collapsible = true,
  defaultExpanded = false,
  readOnly = false,
  hideEmpty = false,
  maxVisibleFields,
  allowCreate = true,
  allowDelete = true,
  allowEdit = true,
  size = 'md',
  protectedFields = [],
  shouldRenderField,
  showDeleteButtons = true
}) => {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded)
  const [showAll, setShowAll] = useState(false)
  const [editingField, setEditingField] = useState<EditingField | null>(null)
  const [editingExistingField, setEditingExistingField] = useState<EditingExistingField | null>(
    null
  )

  const canModify = !readOnly && onMetadataChange

  // Utility functions for field types
  const detectFieldType = (value: any): MetadataFieldType => {
    if (value === null) return 'null'
    if (typeof value === 'boolean') return 'boolean'
    if (typeof value === 'number') return 'number'
    if (Array.isArray(value)) return 'array'
    if (typeof value === 'string') {
      // Check if it's an ISO date
      if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(value)) return 'date'
      // Check if it's binary data (base64 or buffer indication)
      if (value.startsWith('data:') || value.includes('base64') || value.includes('buffer'))
        return 'binary'
    }
    return 'string'
  }

  const formatValueForType = (value: any, type: MetadataFieldType): string => {
    switch (type) {
      case 'array':
        return Array.isArray(value) ? JSON.stringify(value) : '[]'
      case 'boolean':
        return String(value)
      case 'number':
        return String(value)
      case 'date':
        return typeof value === 'string' ? value : new Date().toISOString()
      case 'binary':
        return String(value)
      case 'null':
        return ''
      default:
        return String(value || '')
    }
  }

  const parseValueByType = (value: string, type: MetadataFieldType): any => {
    switch (type) {
      case 'string':
        return value
      case 'number':
        const num = parseFloat(value)
        return isNaN(num) ? 0 : num
      case 'boolean':
        return value.toLowerCase() === 'true'
      case 'date':
        // Validate ISO date format
        const dateRegex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/
        if (!dateRegex.test(value)) {
          throw new Error('Date must be in ISO format (YYYY-MM-DDTHH:mm:ss)')
        }
        return value
      case 'array':
        try {
          const parsed = JSON.parse(value)
          if (!Array.isArray(parsed)) {
            throw new Error('Value must be a valid JSON array')
          }
          return parsed
        } catch {
          throw new Error('Invalid JSON array format')
        }
      case 'binary':
        return value // Store as string, could be base64 or file path
      case 'null':
        return null
      default:
        return value
    }
  }

  const getPlaceholderForType = (type: MetadataFieldType): string => {
    switch (type) {
      case 'string':
        return 'Enter text value...'
      case 'number':
        return 'Enter number (e.g., 123 or 45.67)...'
      case 'boolean':
        return 'Enter true or false...'
      case 'date':
        return 'Enter ISO date (2024-01-01T10:30:00Z)...'
      case 'array':
        return 'Enter JSON array ["item1", "item2", 123]...'
      case 'binary':
        return 'Enter base64 data or file path...'
      case 'null':
        return 'This field will be null'
      default:
        return 'Enter value...'
    }
  }

  const getFieldTypeDisplay = (value: any): string => {
    const type = detectFieldType(value)
    const typeLabels = {
      string: 'Text',
      number: 'Number',
      boolean: 'Bool',
      date: 'Date',
      array: 'Array',
      binary: 'Binary',
      null: 'Null'
    }
    return typeLabels[type] || 'Text'
  }

  const entries = Object.entries(metadata).filter(([key, value]) => {
    if (hideEmpty) {
      if (value === null || value === undefined || value === '') {
        return false
      }
    }

    // Sử dụng shouldRenderField nếu được cung cấp
    if (shouldRenderField) {
      return shouldRenderField(key, value)
    }

    return true
  })

  if (entries.length === 0 && hideEmpty && !allowCreate) {
    return null
  }

  const visibleEntries = maxVisibleFields && !showAll ? entries.slice(0, maxVisibleFields) : entries
  const hasMoreFields = maxVisibleFields && entries.length > maxVisibleFields

  // Copy to clipboard
  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text)
    } catch (err) {
      console.error('Failed to copy:', err)
    }
  }

  // Start creating new field
  const startCreateField = () => {
    // Tự động expand nếu đang collapse
    if (!isExpanded) {
      setIsExpanded(true)
    }

    setEditingField({
      key: '',
      value: '',
      type: 'string',
      isNew: true
    })
  }

  // Start editing existing field
  const startEditField = (originalKey: string, originalValue: any) => {
    if (protectedFields.includes(originalKey)) {
      return // Không cho phép edit protected fields
    }

    // Detect current type
    const currentType = detectFieldType(originalValue)

    setEditingExistingField({
      originalKey,
      newKey: originalKey,
      newValue: formatValueForType(originalValue, currentType),
      newType: currentType
    })
  }

  // Cancel editing
  const cancelEdit = () => {
    setEditingField(null)
    setEditingExistingField(null)
  }

  // Save new field
  const saveNewField = () => {
    if (!editingField || !canModify) return

    const trimmedKey = editingField.key.trim()
    const trimmedValue = editingField.value.trim()

    // Validation
    if (!trimmedKey) {
      alert('Field name is required')
      return
    }

    if (editingField.type !== 'null' && !trimmedValue) {
      alert('Field value is required (except for null type)')
      return
    }

    if (metadata.hasOwnProperty(trimmedKey)) {
      alert('Field name already exists')
      return
    }

    try {
      const parsedValue = parseValueByType(trimmedValue, editingField.type)
      const newMetadata = { ...metadata }
      newMetadata[trimmedKey] = parsedValue

      onMetadataChange(newMetadata)
      setEditingField(null)
    } catch (error) {
      alert(`Invalid value for ${editingField.type}: ${error.message}`)
    }
  }

  // Save edited field
  const saveEditedField = () => {
    if (!editingExistingField || !canModify) return

    const trimmedKey = editingExistingField.newKey.trim()
    const trimmedValue = editingExistingField.newValue.trim()

    // Validation
    if (!trimmedKey) {
      alert('Field name is required')
      return
    }

    if (editingExistingField.newType !== 'null' && !trimmedValue) {
      alert('Field value is required (except for null type)')
      return
    }

    // Check if key already exists (except original key)
    if (trimmedKey !== editingExistingField.originalKey && metadata.hasOwnProperty(trimmedKey)) {
      alert('Field name already exists')
      return
    }

    try {
      const parsedValue = parseValueByType(trimmedValue, editingExistingField.newType)
      const newMetadata = { ...metadata }

      // If key changed, delete old key
      if (trimmedKey !== editingExistingField.originalKey) {
        delete newMetadata[editingExistingField.originalKey]
      }

      // Set new key and value
      newMetadata[trimmedKey] = parsedValue

      onMetadataChange(newMetadata)
      setEditingExistingField(null)
    } catch (error) {
      alert(`Invalid value for ${editingExistingField.newType}: ${error.message}`)
    }
  }

  // Delete field
  const deleteField = (key: string) => {
    if (!canModify) return

    // Kiểm tra nếu field được bảo vệ
    if (protectedFields.includes(key)) {
      console.warn(`Cannot delete protected field: ${key}`)
      return
    }

    // Gọi onDelete callback nếu có
    if (onDelete) {
      onDelete(key)
      return
    }

    // Fallback - xóa trực tiếp từ metadata
    const newMetadata = { ...metadata }
    delete newMetadata[key]
    onMetadataChange?.(newMetadata)
  }

  // Size styles
  const sizeClasses = {
    sm: {
      header: 'w-5 h-5',
      icon: 'h-3 w-3',
      title: 'text-sm',
      spacing: 'space-y-2',
      gap: 'gap-2'
    },
    md: {
      header: 'w-8 h-8',
      icon: 'h-4 w-4',
      title: 'text-base',
      spacing: 'space-y-4',
      gap: 'gap-3'
    },
    lg: {
      header: 'w-10 h-10',
      icon: 'h-5 w-5',
      title: 'text-lg',
      spacing: 'space-y-6',
      gap: 'gap-4'
    }
  }

  const currentSize = sizeClasses[size]

  // Render field display or edit mode
  const renderField = (key: string, value: any) => {
    const displayValue = String(value)
    const isProtected = protectedFields.includes(key)
    const isBeingEdited = editingExistingField?.originalKey === key
    const fieldType = getFieldTypeDisplay(value)

    if (isBeingEdited && editingExistingField) {
      return (
        <div
          key={key}
          className="bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800 p-4 space-y-3"
        >
          <div className="flex items-center gap-2 mb-1">
            <Edit2 className="h-4 w-4 text-blue-600 dark:text-blue-400" />
            <h5 className="font-medium text-blue-900 dark:text-blue-100">Edit Field</h5>
          </div>

          <div className="space-y-3">
            {/* Field Name */}
            <CustomInput
              label="Field Name"
              value={editingExistingField.newKey}
              onChange={(value) =>
                setEditingExistingField((prev) => (prev ? { ...prev, newKey: value } : null))
              }
              placeholder="Enter field name..."
              variant="filled"
              size="sm"
              required
            />

            {/* Field Type */}
            <CustomCombobox
              label="Field Type"
              value={editingExistingField.newType}
              options={FIELD_TYPE_OPTIONS}
              onChange={(value) => {
                const newType = value as MetadataFieldType
                setEditingExistingField((prev) => {
                  if (!prev) return null
                  return {
                    ...prev,
                    newType,
                    newValue: newType === 'null' ? '' : prev.newValue
                  }
                })
              }}
              placeholder="Select field type..."
              size="sm"
              required
            />

            {/* Field Value */}
            <CustomInput
              label="Field Value"
              value={editingExistingField.newValue}
              onChange={(value) =>
                setEditingExistingField((prev) => (prev ? { ...prev, newValue: value } : null))
              }
              placeholder={getPlaceholderForType(editingExistingField.newType)}
              variant="filled"
              size="sm"
              required={editingExistingField.newType !== 'null'}
              disabled={editingExistingField.newType === 'null'}
            />

            {/* Action Buttons */}
            <div className="flex items-center gap-2 pt-1">
              <CustomButton variant="primary" size="sm" onClick={saveEditedField}>
                Save Changes
              </CustomButton>
              <CustomButton variant="secondary" size="sm" onClick={cancelEdit}>
                Cancel
              </CustomButton>
            </div>
          </div>
        </div>
      )
    }

    return (
      <div key={key} className="">
        <CustomInput
          label={
            <div className="flex items-center justify-between">
              <span>{key}</span>
              <span className="text-xs px-2 py-0.5 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 rounded">
                {fieldType}
              </span>
            </div>
          }
          value={displayValue}
          readOnly
          variant="filled"
          size="sm"
          rightIcon={
            <div className="flex items-center gap-1">
              {/* Edit Button - Chỉ hiện với non-protected fields và khi allowEdit = true */}
              {canModify && allowEdit && !isProtected && (
                <button
                  onClick={() => startEditField(key, value)}
                  className="p-1 h-5 w-5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded transition-colors"
                  title="Edit field"
                >
                  <Edit2 className="h-3 w-3" />
                </button>
              )}

              {/* Copy Button - Ẩn với protected fields đặc biệt như created_at */}
              {!isProtected && (
                <button
                  onClick={() => copyToClipboard(displayValue)}
                  className="p-1 h-5 w-5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded transition-colors"
                  title="Copy value"
                >
                  <Copy className="h-3 w-3" />
                </button>
              )}

              {/* Delete Button - Ẩn với protected fields */}
              {canModify && allowDelete && showDeleteButtons && !isProtected && (
                <button
                  onClick={() => deleteField(key)}
                  className="p-1 h-5 w-5 text-gray-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
                  title="Delete field"
                >
                  <Trash2 className="h-3 w-3" />
                </button>
              )}
            </div>
          }
        />
      </div>
    )
  }

  // Render editing form for new field
  const renderNewFieldForm = () => {
    if (!editingField) return null

    return (
      <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800 p-4 space-y-3">
        <div className="flex items-center gap-2 mb-1">
          <Plus className="h-4 w-4 text-blue-600 dark:text-blue-400" />
          <h5 className="font-medium text-blue-900 dark:text-blue-100">Add New Field</h5>
        </div>

        <div className="space-y-3">
          {/* Field Name */}
          <CustomInput
            label="Field Name"
            value={editingField.key}
            onChange={(value) => setEditingField((prev) => (prev ? { ...prev, key: value } : null))}
            placeholder="Enter field name..."
            variant="filled"
            size="sm"
            required
          />

          {/* Field Type */}
          <CustomCombobox
            label="Field Type"
            value={editingField.type}
            options={FIELD_TYPE_OPTIONS}
            onChange={(value) => {
              const newType = value as MetadataFieldType
              setEditingField((prev) => {
                if (!prev) return null
                return {
                  ...prev,
                  type: newType,
                  value: newType === 'null' ? '' : prev.value
                }
              })
            }}
            placeholder="Select field type..."
            size="sm"
            required
          />

          {/* Field Value */}
          <CustomInput
            label="Field Value"
            value={editingField.value}
            onChange={(value) => setEditingField((prev) => (prev ? { ...prev, value } : null))}
            placeholder={getPlaceholderForType(editingField.type)}
            variant="filled"
            size="sm"
            required={editingField.type !== 'null'}
            disabled={editingField.type === 'null'}
          />

          {/* Action Buttons */}
          <div className="flex items-center gap-2 pt-1">
            <CustomButton variant="primary" size="sm" onClick={saveNewField}>
              Add Field
            </CustomButton>
            <CustomButton variant="secondary" size="sm" onClick={cancelEdit}>
              Cancel
            </CustomButton>
          </div>
        </div>
      </div>
    )
  }

  const headerContent = (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2">
        <div
          className={cn(
            'bg-indigo-50 dark:bg-indigo-900/20 rounded-lg flex items-center justify-center',
            currentSize.header
          )}
        >
          <Database className={cn('text-indigo-600 dark:text-indigo-400', currentSize.icon)} />
        </div>
        <h4 className={cn('font-semibold text-text-primary', currentSize.title)}>{title}</h4>
        {entries.length > 0 && (
          <span className={cn('text-gray-500 dark:text-gray-400', compact ? 'text-xs' : 'text-sm')}>
            ({entries.length} field{entries.length !== 1 ? 's' : ''})
          </span>
        )}
      </div>

      <div className="flex items-center gap-2">
        {/* Add Field Button */}
        {canModify && allowCreate && !editingField && !editingExistingField && (
          <button
            onClick={startCreateField}
            className="p-1 h-6 w-6 text-blue-600 hover:text-blue-700 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded transition-colors"
            title="Add new field"
          >
            <Plus className="h-3 w-3" />
          </button>
        )}

        {/* Collapse Toggle */}
        {collapsible && (
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1 h-6 w-6 text-gray-500 hover:text-gray-700 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
          >
            {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </button>
        )}
      </div>
    </div>
  )

  const contentSection = (
    <>
      {/* New Field Form */}
      {editingField && renderNewFieldForm()}

      <div className="space-y-3">
        {visibleEntries.map(([key, value]) => renderField(key, value))}

        {/* Show More/Less Button */}
        {hasMoreFields && !editingField && !editingExistingField && (
          <div className="text-center pt-2">
            <button
              onClick={() => setShowAll(!showAll)}
              className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 dark:hover:bg-blue-900/20 px-3 py-1 rounded text-sm transition-colors"
            >
              {showAll ? (
                <>
                  <ChevronUp className="h-4 w-4 mr-1 inline" />
                  Show Less
                </>
              ) : (
                <>
                  <ChevronDown className="h-4 w-4 mr-1 inline" />
                  Show {entries.length - maxVisibleFields!} More Fields
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </>
  )

  if (collapsible) {
    return (
      <div className={cn(currentSize.spacing, className)}>
        {headerContent}
        {isExpanded && contentSection}
      </div>
    )
  }

  return (
    <div className={cn(currentSize.spacing, className)}>
      {headerContent}
      {contentSection}
    </div>
  )
}

export default Metadata
