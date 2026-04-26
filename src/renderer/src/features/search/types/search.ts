export type ColumnType = 'text' | 'number' | 'date' | 'status' | 'link' | 'email' | 'tags';

export interface TableColumn {
  id: string;
  label: string;
  type: ColumnType;
  width?: number;
  isVisible: boolean;
  isSortable: boolean;
  isFilterable: boolean;
  presetValues?: string[]; // For status or tags
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
  filters?: any[]; // To be defined further if needed
  createdAt: string;
  updatedAt: string;
}
