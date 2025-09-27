// src/renderer/src/components/common/Metadata.tsx
import React, { useState } from 'react'
import CustomInput from './CustomInput'
import CustomButton from './CustomButton'
import { Database, Copy, Trash2, ChevronDown, ChevronUp, Plus, Edit2 } from 'lucide-react'
import { cn } from '../../shared/lib/utils'

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
  isNew: boolean
}

interface EditingExistingField {
  originalKey: string
  newKey: string
  newValue: string
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
      isNew: true
    })
  }

  // Start editing existing field
  const startEditField = (originalKey: string, originalValue: any) => {
    if (protectedFields.includes(originalKey)) {
      return // Không cho phép edit protected fields
    }

    setEditingExistingField({
      originalKey,
      newKey: originalKey,
      newValue: String(originalValue)
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

    if (!trimmedValue) {
      alert('Field value is required')
      return
    }

    if (metadata.hasOwnProperty(trimmedKey)) {
      alert('Field name already exists')
      return
    }

    const newMetadata = { ...metadata }
    newMetadata[trimmedKey] = trimmedValue

    onMetadataChange(newMetadata)
    setEditingField(null)
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

    if (!trimmedValue) {
      alert('Field value is required')
      return
    }

    // Check if key already exists (except original key)
    if (trimmedKey !== editingExistingField.originalKey && metadata.hasOwnProperty(trimmedKey)) {
      alert('Field name already exists')
      return
    }

    const newMetadata = { ...metadata }

    // If key changed, delete old key
    if (trimmedKey !== editingExistingField.originalKey) {
      delete newMetadata[editingExistingField.originalKey]
    }

    // Set new key and value
    newMetadata[trimmedKey] = trimmedValue

    onMetadataChange(newMetadata)
    setEditingExistingField(null)
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

            {/* Field Value */}
            <CustomInput
              label="Field Value"
              value={editingExistingField.newValue}
              onChange={(value) =>
                setEditingExistingField((prev) => (prev ? { ...prev, newValue: value } : null))
              }
              placeholder="Enter field value..."
              variant="filled"
              size="sm"
              required
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
          label={key}
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

          {/* Field Value */}
          <CustomInput
            label="Field Value"
            value={editingField.value}
            onChange={(value) => setEditingField((prev) => (prev ? { ...prev, value } : null))}
            placeholder="Enter field value..."
            variant="filled"
            size="sm"
            required
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
