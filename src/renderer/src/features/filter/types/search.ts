export type ColumnType = 'text' | 'number' | 'date' | 'status' | 'link' | 'email' | 'tags';

export interface TableColumn {
  id: string;
  label: string;
  type: ColumnType;
  field?: string;        // Source field in database (e.g., "email", "services.name")
  width?: number;
  isVisible: boolean;
  isSortable: boolean;
  isFilterable: boolean;
  presetValues?: string[];
  template?: ColumnTemplate; // Template config for field
}

export interface ColumnTemplate {
  operator?: '' | 'equals' | 'contains' | 'startsWith' | 'endsWith' | 'greaterThan' | 'lessThan';
  value?: string;
  values?: string[];
  sortOrder?: 'asc' | 'desc' | 'none';
}

export interface SmartView {
  id: string;
  name: string;
  domain?: string;
  icon?: string;
  color: string;
  description?: string;
  columns: TableColumn[];
  defaultSort?: {
    columnId: string;
    direction: 'asc' | 'desc';
  };
  filters?: any[];
  createdAt: string;
  updatedAt: string;
  source?: 'manual' | 'service';
  serviceId?: string;
  favorite?: boolean;
  lastUsedAt?: string;
  accountCount?: number;
}

/** Available database fields for column selection */
export interface DataField {
  key: string;        // e.g. "email", "services.name"
  label: string;       // e.g. "Email", "Service Name"
  type: ColumnType;
  table: string;       // Source table: "emails", "services", "proxies"
  description?: string;
}