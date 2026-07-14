/**
 * Proxy feature table types
 */

export interface ProxyTableState {
  sorting: any[];
  columnVisibility: Record<string, boolean>;
  columnSizing: Record<string, number>;
  columnOrder: string[];
}

export interface ProxyColumn {
  id: string;
  label: string;
  field?: string;
  isVisible: boolean;
  isSortable: boolean;
  isFilterable: boolean;
  size?: number;
  minSize?: number;
}