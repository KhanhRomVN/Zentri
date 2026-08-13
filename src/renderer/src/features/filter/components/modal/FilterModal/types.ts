/**
 * ------------------------------------------------------------------
 * FilterModal Types
 * ------------------------------------------------------------------
 * Type definitions for the FilterModal component. Includes
 * operator types, filter card structure, saved view interface,
 * and field type mappings for the email table.
 *
 * Main types:
 * - FilterOperator         : Union of all operator types
 * - FilterCard             : Single filter condition
 * - SavedView              : Persisted filter view
 * - AVAILABLE_FIELDS       : Field definitions with labels
 * - OPERATOR_LABELS        : Display labels for all operators
 * ------------------------------------------------------------------
 */

// ─── Types ──────────────────────────────────────────────────────────────
// Field types for dynamic filter operators
export type FieldType = 'string' | 'number' | 'array' | 'object';

// String operators
export type StringOperator =
  | 'equals'
  | 'notEquals'
  | 'contains'
  | 'notContains'
  | 'startsWith'
  | 'endsWith'
  | 'in'
  | 'notIn'
  | 'isNull'
  | 'isNotNull'
  | 'regex';

// Number operators
export type NumberOperator =
  | 'equals'
  | 'notEquals'
  | 'greaterThan'
  | 'greaterThanOrEqual'
  | 'lessThan'
  | 'lessThanOrEqual'
  | 'between'
  | 'in'
  | 'notIn'
  | 'isNull'
  | 'isNotNull';

// Array operators
export type ArrayOperator =
  | 'contains'
  | 'notContains'
  | 'containsAll'
  | 'containsAny'
  | 'isEmpty'
  | 'isNotEmpty'
  | 'sizeEquals'
  | 'sizeGreaterThan'
  | 'sizeLessThan'
  | 'isNull'
  | 'isNotNull';

// Object operators
export type ObjectOperator =
  | 'hasKey'
  | 'notHasKey'
  | 'keyEquals'
  | 'keyNotEquals'
  | 'isEmpty'
  | 'isNotEmpty'
  | 'isNull'
  | 'isNotNull';

// Combined operator type
export type FilterOperator = StringOperator | NumberOperator | ArrayOperator | ObjectOperator;

// Filter card structure
export interface FilterCard {
  id: string;
  field: string;
  operator: FilterOperator;
  value: string;
  logic: 'AND' | 'OR';
}

// Saved view structure
export interface SavedView {
  id: string;
  name: string;
  filters: FilterCard[];
  createdAt: string;
  updatedAt: string;
}

// Operator options by type
export const STRING_OPERATORS: StringOperator[] = [
  'equals',
  'notEquals',
  'contains',
  'notContains',
  'startsWith',
  'endsWith',
  'in',
  'notIn',
  'isNull',
  'isNotNull',
  'regex',
];

export const NUMBER_OPERATORS: NumberOperator[] = [
  'equals',
  'notEquals',
  'greaterThan',
  'greaterThanOrEqual',
  'lessThan',
  'lessThanOrEqual',
  'between',
  'in',
  'notIn',
  'isNull',
  'isNotNull',
];

export const ARRAY_OPERATORS: ArrayOperator[] = [
  'contains',
  'notContains',
  'containsAll',
  'containsAny',
  'isEmpty',
  'isNotEmpty',
  'sizeEquals',
  'sizeGreaterThan',
  'sizeLessThan',
  'isNull',
  'isNotNull',
];

export const OBJECT_OPERATORS: ObjectOperator[] = [
  'hasKey',
  'notHasKey',
  'keyEquals',
  'keyNotEquals',
  'isEmpty',
  'isNotEmpty',
  'isNull',
  'isNotNull',
];

// Operator labels for display
export const OPERATOR_LABELS: Record<FilterOperator, string> = {
  // String
  equals: 'Equals',
  notEquals: 'Not Equals',
  contains: 'Contains',
  notContains: 'Not Contains',
  startsWith: 'Starts With',
  endsWith: 'Ends With',
  in: 'In',
  notIn: 'Not In',
  isNull: 'Is Null',
  isNotNull: 'Is Not Null',
  regex: 'Matches Regex',

  // Number
  greaterThan: 'Greater Than',
  greaterThanOrEqual: 'Greater Than or Equal',
  lessThan: 'Less Than',
  lessThanOrEqual: 'Less Than or Equal',
  between: 'Between',

  // Array
  containsAll: 'Contains All',
  containsAny: 'Contains Any',
  isEmpty: 'Is Empty',
  isNotEmpty: 'Is Not Empty',
  sizeEquals: 'Size Equals',
  sizeGreaterThan: 'Size Greater Than',
  sizeLessThan: 'Size Less Than',

  // Object
  hasKey: 'Has Key',
  notHasKey: 'Not Has Key',
  keyEquals: 'Key Equals',
  keyNotEquals: 'Key Not Equals',
};

// Field type definitions for all tables
export const FIELD_TYPES: Record<string, FieldType> = {
  // emails table
  'emails.email': 'string',
  'emails.password': 'string',
  'emails.recovery_email': 'string',
  'emails.phone_number': 'string',
  'emails.status': 'string',
  'emails.totp_secret_key': 'string',
  'emails.backup_codes': 'array',
  'emails.profile_folder_id': 'string',
  'emails.scheduled_deletion_at': 'string',
  'emails.last_used_at': 'string',
  'emails.created_at': 'string',
  'emails.updated_at': 'string',

  // proxies table
  'proxies.protocol': 'string',
  'proxies.host': 'string',
  'proxies.port': 'number',
  'proxies.username': 'string',
  'proxies.password': 'string',
  'proxies.ip_version': 'number',
  'proxies.proxy_type': 'string',
  'proxies.source_type': 'string',
  'proxies.rotation_type': 'string',
  'proxies.pricing_type': 'string',
  'proxies.country': 'string',
  'proxies.city': 'string',
  'proxies.isp': 'string',
  'proxies.expired_at': 'string',
  'proxies.last_checked_at': 'string',
  'proxies.purchase_url': 'string',
  'proxies.status': 'string',
  'proxies.created_at': 'string',
  'proxies.updated_at': 'string',

  // proxy_history table
  'proxy_history.target_site': 'string',
  'proxy_history.used_at': 'string',

  // services table
  'services.name': 'string',
  'services.description': 'string',
  'services.url': 'string',
  'services.category': 'string',
  'services.tags': 'array',
  'services.metadata': 'object',
  'services.auth_method': 'array',

  // fingerprints table
  'fingerprints.name': 'string',
  'fingerprints.description': 'string',
  'fingerprints.config_json': 'object',
};

// Available fields grouped by table with labels
export const AVAILABLE_FIELDS = [
  // emails table
  { name: 'emails.email', type: 'string' as FieldType, label: 'Email', tableName: 'Emails' },
  { name: 'emails.password', type: 'string' as FieldType, label: 'Password', tableName: 'Emails' },
  {
    name: 'emails.recovery_email',
    type: 'string' as FieldType,
    label: 'Recovery Email',
    tableName: 'Emails',
  },
  {
    name: 'emails.phone_number',
    type: 'string' as FieldType,
    label: 'Phone Number',
    tableName: 'Emails',
  },
  { name: 'emails.status', type: 'string' as FieldType, label: 'Status', tableName: 'Emails' },
  {
    name: 'emails.totp_secret_key',
    type: 'string' as FieldType,
    label: 'TOTP Secret Key',
    tableName: 'Emails',
  },
  {
    name: 'emails.backup_codes',
    type: 'array' as FieldType,
    label: 'Backup Codes',
    tableName: 'Emails',
  },
  {
    name: 'emails.profile_folder_id',
    type: 'string' as FieldType,
    label: 'Profile Folder ID',
    tableName: 'Emails',
  },
  {
    name: 'emails.scheduled_deletion_at',
    type: 'string' as FieldType,
    label: 'Scheduled Deletion',
    tableName: 'Emails',
  },
  {
    name: 'emails.last_used_at',
    type: 'string' as FieldType,
    label: 'Last Used At',
    tableName: 'Emails',
  },
  {
    name: 'emails.created_at',
    type: 'string' as FieldType,
    label: 'Created At',
    tableName: 'Emails',
  },
  {
    name: 'emails.updated_at',
    type: 'string' as FieldType,
    label: 'Updated At',
    tableName: 'Emails',
  },

  // proxies table
  {
    name: 'proxies.protocol',
    type: 'string' as FieldType,
    label: 'Protocol',
    tableName: 'Proxies',
  },
  { name: 'proxies.host', type: 'string' as FieldType, label: 'Host', tableName: 'Proxies' },
  { name: 'proxies.port', type: 'number' as FieldType, label: 'Port', tableName: 'Proxies' },
  {
    name: 'proxies.username',
    type: 'string' as FieldType,
    label: 'Username',
    tableName: 'Proxies',
  },
  {
    name: 'proxies.password',
    type: 'string' as FieldType,
    label: 'Password',
    tableName: 'Proxies',
  },
  {
    name: 'proxies.ip_version',
    type: 'number' as FieldType,
    label: 'IP Version',
    tableName: 'Proxies',
  },
  {
    name: 'proxies.proxy_type',
    type: 'string' as FieldType,
    label: 'Proxy Type',
    tableName: 'Proxies',
  },
  {
    name: 'proxies.source_type',
    type: 'string' as FieldType,
    label: 'Source Type',
    tableName: 'Proxies',
  },
  {
    name: 'proxies.rotation_type',
    type: 'string' as FieldType,
    label: 'Rotation Type',
    tableName: 'Proxies',
  },
  {
    name: 'proxies.pricing_type',
    type: 'string' as FieldType,
    label: 'Pricing Type',
    tableName: 'Proxies',
  },
  { name: 'proxies.country', type: 'string' as FieldType, label: 'Country', tableName: 'Proxies' },
  { name: 'proxies.city', type: 'string' as FieldType, label: 'City', tableName: 'Proxies' },
  { name: 'proxies.isp', type: 'string' as FieldType, label: 'ISP', tableName: 'Proxies' },
  {
    name: 'proxies.expired_at',
    type: 'string' as FieldType,
    label: 'Expired At',
    tableName: 'Proxies',
  },
  {
    name: 'proxies.last_checked_at',
    type: 'string' as FieldType,
    label: 'Last Checked At',
    tableName: 'Proxies',
  },
  {
    name: 'proxies.purchase_url',
    type: 'string' as FieldType,
    label: 'Purchase URL',
    tableName: 'Proxies',
  },
  { name: 'proxies.status', type: 'string' as FieldType, label: 'Status', tableName: 'Proxies' },
  {
    name: 'proxies.created_at',
    type: 'string' as FieldType,
    label: 'Created At',
    tableName: 'Proxies',
  },
  {
    name: 'proxies.updated_at',
    type: 'string' as FieldType,
    label: 'Updated At',
    tableName: 'Proxies',
  },

  // proxy_history table
  {
    name: 'proxy_history.target_site',
    type: 'string' as FieldType,
    label: 'Target Site',
    tableName: 'Proxy History',
  },
  {
    name: 'proxy_history.used_at',
    type: 'string' as FieldType,
    label: 'Used At',
    tableName: 'Proxy History',
  },

  // services table
  { name: 'services.name', type: 'string' as FieldType, label: 'Name', tableName: 'Services' },
  {
    name: 'services.description',
    type: 'string' as FieldType,
    label: 'Description',
    tableName: 'Services',
  },
  { name: 'services.url', type: 'string' as FieldType, label: 'URL', tableName: 'Services' },
  {
    name: 'services.category',
    type: 'string' as FieldType,
    label: 'Category',
    tableName: 'Services',
  },
  { name: 'services.tags', type: 'array' as FieldType, label: 'Tags', tableName: 'Services' },
  {
    name: 'services.metadata',
    type: 'object' as FieldType,
    label: 'Metadata',
    tableName: 'Services',
  },
  {
    name: 'services.auth_method',
    type: 'array' as FieldType,
    label: 'Auth Method',
    tableName: 'Services',
  },

  // fingerprints table
  {
    name: 'fingerprints.name',
    type: 'string' as FieldType,
    label: 'Name',
    tableName: 'Fingerprints',
  },
  {
    name: 'fingerprints.description',
    type: 'string' as FieldType,
    label: 'Description',
    tableName: 'Fingerprints',
  },
  {
    name: 'fingerprints.config_json',
    type: 'object' as FieldType,
    label: 'Config JSON',
    tableName: 'Fingerprints',
  },
];
