// Field type definitions
export type MetadataFieldType =
  | 'string'
  | 'number'
  | 'boolean'
  | 'date'
  | 'array'
  | 'url'
  | 'code'
  | 'null'

export interface MetadataFieldInfo {
  value: any
  type: MetadataFieldType
}

export interface MetadataProps {
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

export interface EditingField {
  key: string
  value: string
  type: MetadataFieldType
  isNew: boolean
  codeLanguage?: string
  arrayItems?: string[]
}

export interface EditingExistingField {
  originalKey: string
  newKey: string
  newValue: string
  newType: MetadataFieldType
  codeLanguage?: string
  arrayItems?: string[]
}

// Field type options for combobox
export const FIELD_TYPE_OPTIONS = [
  { value: 'string', label: 'String (Text)' },
  { value: 'number', label: 'Number' },
  { value: 'boolean', label: 'Boolean (True/False)' },
  { value: 'date', label: 'Date & Time' },
  { value: 'array', label: 'Array (List)' },
  { value: 'url', label: 'URL (Web Link)' },
  { value: 'code', label: 'Code (Programming)' },
  { value: 'null', label: 'Null Value' }
]

// Programming languages for code fields
export const CODE_LANGUAGES = [
  'javascript',
  'typescript',
  'python',
  'java',
  'csharp',
  'cpp',
  'c',
  'php',
  'ruby',
  'go',
  'rust',
  'swift',
  'kotlin',
  'dart',
  'html',
  'css',
  'scss',
  'json',
  'xml',
  'yaml',
  'markdown',
  'sql',
  'bash',
  'powershell',
  'plaintext'
]

// Size styles configuration
export const SIZE_CLASSES = {
  sm: {
    header: 'w-5 h-5',
    icon: 'h-3 w-3',
    title: 'text-sm',
    spacing: 'space-y-2',
    gap: 'gap-2',
    button: 'h-8' // Add button height for array input
  },
  md: {
    header: 'w-8 h-8',
    icon: 'h-4 w-4',
    title: 'text-base',
    spacing: 'space-y-4',
    gap: 'gap-3',
    button: 'h-10' // Add button height for array input
  },
  lg: {
    header: 'w-10 h-10',
    icon: 'h-5 w-5',
    title: 'text-lg',
    spacing: 'space-y-6',
    gap: 'gap-4',
    button: 'h-12' // Add button height for array input
  }
}
