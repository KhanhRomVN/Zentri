import React, { useState, useEffect } from 'react'
import CustomDrawer from '../../../../../../components/common/CustomDrawer'
import CustomButton from '../../../../../../components/common/CustomButton'
import {
  ChevronRight,
  ChevronDown,
  Database,
  Mail,
  Shield,
  Package,
  Key,
  CheckSquare,
  Square,
  RefreshCw
} from 'lucide-react'

interface SchemaField {
  name: string
  table: string
  description?: string
}

interface SchemaNode {
  id: string
  label: string
  table: string
  icon: React.ElementType
  fields: SchemaField[]
  children?: SchemaNode[]
}

const DATABASE_SCHEMA: SchemaNode[] = [
  {
    id: 'emails',
    label: 'Email',
    table: 'emails',
    icon: Mail,
    fields: [
      { name: 'id', table: 'emails', description: 'Primary key' },
      { name: 'email_address', table: 'emails', description: 'Email address' },
      { name: 'email_provider', table: 'emails', description: 'gmail|yahoo|outlook|icloud' },
      { name: 'name', table: 'emails', description: 'Full name' },
      { name: 'age', table: 'emails', description: 'Age' },
      { name: 'address', table: 'emails', description: 'Physical address' },
      { name: 'password', table: 'emails', description: 'Password' },
      { name: 'last_password_change', table: 'emails', description: 'Last password change date' },
      { name: 'recovery_email', table: 'emails', description: 'Recovery email' },
      { name: 'phone_numbers', table: 'emails', description: 'Phone numbers' },
      { name: 'tags', table: 'emails', description: 'Tags (JSON array)' },
      { name: 'note', table: 'emails', description: 'Notes' },
      { name: 'metadata', table: 'emails', description: 'Additional metadata (JSON)' }
    ],
    children: [
      {
        id: 'email_2fa',
        label: 'Security (2FA)',
        table: 'email_2fa',
        icon: Shield,
        fields: [
          { name: 'id', table: 'email_2fa', description: 'Primary key' },
          { name: 'email_id', table: 'email_2fa', description: 'Foreign key to emails' },
          { name: 'method_type', table: 'email_2fa', description: '2FA method type' },
          { name: 'app', table: 'email_2fa', description: 'App name for 2FA' },
          { name: 'value', table: 'email_2fa', description: '2FA value/secret' },
          { name: 'last_update', table: 'email_2fa', description: 'Last update date' },
          { name: 'expire_at', table: 'email_2fa', description: 'Expiration date' }
        ]
      },
      {
        id: 'service_accounts',
        label: 'Service Account',
        table: 'service_accounts',
        icon: Package,
        fields: [
          { name: 'id', table: 'service_accounts', description: 'Primary key' },
          { name: 'email_id', table: 'service_accounts', description: 'Foreign key to emails' },
          { name: 'service_name', table: 'service_accounts', description: 'Service name' },
          { name: 'service_type', table: 'service_accounts', description: 'Service category' },
          { name: 'service_url', table: 'service_accounts', description: 'Service URL' },
          { name: 'status', table: 'service_accounts', description: 'active|inactive|suspended' },
          { name: 'name', table: 'service_accounts', description: 'Account name' },
          { name: 'username', table: 'service_accounts', description: 'Username' },
          { name: 'password', table: 'service_accounts', description: 'Password' },
          { name: 'note', table: 'service_accounts', description: 'Notes' }
        ],
        children: [
          {
            id: 'service_account_2fa',
            label: 'Security (2FA)',
            table: 'service_account_2fa',
            icon: Shield,
            fields: [
              { name: 'id', table: 'service_account_2fa', description: 'Primary key' },
              {
                name: 'service_account_id',
                table: 'service_account_2fa',
                description: 'Foreign key to service_accounts'
              },
              { name: 'method_type', table: 'service_account_2fa', description: '2FA method type' },
              { name: 'app', table: 'service_account_2fa', description: 'App name for 2FA' },
              { name: 'value', table: 'service_account_2fa', description: '2FA value/secret' },
              {
                name: 'last_update',
                table: 'service_account_2fa',
                description: 'Last update date'
              },
              { name: 'expire_at', table: 'service_account_2fa', description: 'Expiration date' }
            ]
          },
          {
            id: 'service_account_secrets',
            label: 'Secret',
            table: 'service_account_secrets',
            icon: Key,
            fields: [
              { name: 'id', table: 'service_account_secrets', description: 'Primary key' },
              {
                name: 'service_account_id',
                table: 'service_account_secrets',
                description: 'Foreign key to service_accounts'
              },
              { name: 'secret_name', table: 'service_account_secrets', description: 'Secret name' },
              {
                name: 'secret',
                table: 'service_account_secrets',
                description: 'Secret data (JSON)'
              },
              {
                name: 'expire_at',
                table: 'service_account_secrets',
                description: 'Expiration date'
              }
            ]
          }
        ]
      }
    ]
  }
]

interface DatabaseSchemaDrawerProps {
  isOpen: boolean
  onClose: () => void
  selectedFields: string[] // Format: "table.field"
  onFieldsChange: (fields: string[]) => void
}

interface TreeNodeProps {
  node: SchemaNode
  level: number
  selectedFields: string[]
  onToggleField: (fieldKey: string) => void
  onToggleAll: (node: SchemaNode, selected: boolean) => void
}

const TreeNode: React.FC<TreeNodeProps> = ({
  node,
  level,
  selectedFields,
  onToggleField,
  onToggleAll
}) => {
  const [isExpanded, setIsExpanded] = useState(level === 0)

  const hasChildren = node.children && node.children.length > 0
  const Icon = node.icon

  // Check if all fields in this node are selected
  const allFieldKeys = node.fields.map((f) => `${f.table}.${f.name}`)
  const allSelected = allFieldKeys.every((key) => selectedFields.includes(key))
  const someSelected = allFieldKeys.some((key) => selectedFields.includes(key))

  const handleToggleAll = () => {
    onToggleAll(node, !allSelected)
  }

  return (
    <div className="select-none">
      {/* Node Header */}
      <div
        className="flex items-center gap-2 py-2 px-2 rounded hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
        style={{ paddingLeft: `${level * 16 + 8}px` }}
      >
        {/* Expand Icon */}
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex-shrink-0 w-4 hover:bg-gray-200 dark:hover:bg-gray-600 rounded"
        >
          {isExpanded ? (
            <ChevronDown className="h-4 w-4 text-gray-500 dark:text-gray-400" />
          ) : (
            <ChevronRight className="h-4 w-4 text-gray-500 dark:text-gray-400" />
          )}
        </button>

        {/* Select All Checkbox */}
        <button
          onClick={handleToggleAll}
          className="flex-shrink-0 hover:bg-gray-200 dark:hover:bg-gray-600 rounded p-0.5"
          title={allSelected ? 'Deselect all fields' : 'Select all fields'}
        >
          {allSelected ? (
            <CheckSquare className="h-4 w-4 text-blue-600 dark:text-blue-400" />
          ) : someSelected ? (
            <div className="h-4 w-4 border-2 border-blue-600 dark:border-blue-400 rounded flex items-center justify-center">
              <div className="h-2 w-2 bg-blue-600 dark:bg-blue-400 rounded-sm" />
            </div>
          ) : (
            <Square className="h-4 w-4 text-gray-400 dark:text-gray-500" />
          )}
        </button>

        {/* Node Icon */}
        <Icon className="h-4 w-4 text-blue-600 dark:text-blue-400 flex-shrink-0" />

        {/* Node Label */}
        <span className="text-sm font-semibold text-text-primary">{node.label}</span>
        <span className="text-xs text-gray-500 dark:text-gray-400">({node.fields.length})</span>
      </div>

      {/* Fields */}
      {isExpanded && (
        <div className="space-y-0.5" style={{ paddingLeft: `${level * 16 + 32}px` }}>
          {node.fields.map((field) => {
            const fieldKey = `${field.table}.${field.name}`
            const isSelected = selectedFields.includes(fieldKey)

            return (
              <button
                key={fieldKey}
                onClick={() => onToggleField(fieldKey)}
                className="w-full flex items-center gap-2 py-1.5 px-2 rounded hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors text-left"
              >
                {/* Checkbox */}
                {isSelected ? (
                  <CheckSquare className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400 flex-shrink-0" />
                ) : (
                  <Square className="h-3.5 w-3.5 text-gray-400 dark:text-gray-500 flex-shrink-0" />
                )}

                {/* Field Name */}
                <span
                  className={`text-xs font-mono flex-1 ${
                    isSelected
                      ? 'text-blue-700 dark:text-blue-300 font-medium'
                      : 'text-gray-600 dark:text-gray-400'
                  }`}
                >
                  {field.name}
                </span>

                {/* Description */}
                {field.description && (
                  <span className="text-xs text-gray-500 dark:text-gray-400 truncate max-w-[200px]">
                    {field.description}
                  </span>
                )}
              </button>
            )
          })}
        </div>
      )}

      {/* Children Nodes */}
      {isExpanded && hasChildren && (
        <div className="mt-1">
          {node.children!.map((child) => (
            <TreeNode
              key={child.id}
              node={child}
              level={level + 1}
              selectedFields={selectedFields}
              onToggleField={onToggleField}
              onToggleAll={onToggleAll}
            />
          ))}
        </div>
      )}
    </div>
  )
}

const DatabaseSchemaDrawer: React.FC<DatabaseSchemaDrawerProps> = ({
  isOpen,
  onClose,
  selectedFields,
  onFieldsChange
}) => {
  const [localSelectedFields, setLocalSelectedFields] = useState<string[]>(selectedFields)

  useEffect(() => {
    setLocalSelectedFields(selectedFields)
  }, [selectedFields])

  const handleToggleField = (fieldKey: string) => {
    setLocalSelectedFields((prev) => {
      if (prev.includes(fieldKey)) {
        return prev.filter((key) => key !== fieldKey)
      } else {
        return [...prev, fieldKey]
      }
    })
  }

  const handleToggleAll = (node: SchemaNode, selected: boolean) => {
    const collectFields = (n: SchemaNode): string[] => {
      const fields = n.fields.map((f) => `${f.table}.${f.name}`)
      const childFields = n.children ? n.children.flatMap(collectFields) : []
      return [...fields, ...childFields]
    }

    const nodeFields = collectFields(node)

    setLocalSelectedFields((prev) => {
      if (selected) {
        // Add all fields that aren't already selected
        const newFields = nodeFields.filter((f) => !prev.includes(f))
        return [...prev, ...newFields]
      } else {
        // Remove all fields from this node
        return prev.filter((f) => !nodeFields.includes(f))
      }
    })
  }

  const handleSelectAll = () => {
    const allFields: string[] = []
    const collectAllFields = (node: SchemaNode) => {
      node.fields.forEach((f) => allFields.push(`${f.table}.${f.name}`))
      node.children?.forEach(collectAllFields)
    }
    DATABASE_SCHEMA.forEach(collectAllFields)
    setLocalSelectedFields(allFields)
  }

  const handleDeselectAll = () => {
    setLocalSelectedFields([])
  }

  const handleApply = () => {
    onFieldsChange(localSelectedFields)
    onClose()
  }

  const handleReset = () => {
    setLocalSelectedFields(selectedFields)
  }

  return (
    <CustomDrawer
      isOpen={isOpen}
      onClose={onClose}
      title="Database Schema"
      position="left"
      size="md"
    >
      <div className="h-full flex flex-col bg-gray-50/50 dark:bg-gray-900/50">
        {/* Header Actions */}
        <div className="flex-none p-4 border-b border-border-default space-y-3">
          <div className="flex items-center gap-2">
            <Database className="h-5 w-5 text-purple-600 dark:text-purple-400" />
            <div className="flex-1">
              <p className="text-sm font-medium text-text-primary">Chọn Fields để Query</p>
              <p className="text-xs text-text-secondary">
                {localSelectedFields.length} fields được chọn
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <CustomButton
              variant="secondary"
              size="sm"
              onClick={handleSelectAll}
              className="flex-1"
            >
              Chọn Tất Cả
            </CustomButton>
            <CustomButton
              variant="secondary"
              size="sm"
              onClick={handleDeselectAll}
              className="flex-1"
            >
              Bỏ Chọn Tất Cả
            </CustomButton>
          </div>
        </div>

        {/* Tree View */}
        <div className="flex-1 overflow-y-auto p-4">
          <div className="space-y-2">
            {DATABASE_SCHEMA.map((node) => (
              <TreeNode
                key={node.id}
                node={node}
                level={0}
                selectedFields={localSelectedFields}
                onToggleField={handleToggleField}
                onToggleAll={handleToggleAll}
              />
            ))}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex-none p-4 border-t border-border-default space-y-2">
          <CustomButton variant="primary" size="md" onClick={handleApply} className="w-full">
            Áp Dụng ({localSelectedFields.length} fields)
          </CustomButton>
          <CustomButton
            variant="secondary"
            size="md"
            onClick={handleReset}
            icon={RefreshCw}
            className="w-full"
          >
            Reset
          </CustomButton>
        </div>
      </div>
    </CustomDrawer>
  )
}

export default DatabaseSchemaDrawer
