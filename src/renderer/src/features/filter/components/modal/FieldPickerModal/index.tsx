/**
 * ------------------------------------------------------------------
 * FieldPickerModal
 * ------------------------------------------------------------------
 * Modal for browsing and selecting fields from multiple database tables.
 * Features table sidebar with search, data grid preview, and field selection.
 *
 * Main features:
 * - Table list sidebar with search and field counts
 * - Data grid showing sample data for selected table
 * - Field search within active table
 * - Click column header to select field
 * - Shows field types (array, number-array, etc.)
 * ------------------------------------------------------------------
 */

import React, { useState, useEffect } from 'react';
import { Search, Check } from 'lucide-react';
import { Modal, ModalHeader, ModalBody, ModalFooter } from '../../../../../components/ui/Modal';
import { Button } from '../../../../../components/ui/Button';
import { cn } from '../../../../../shared/lib/utils';
import { AVAILABLE_FIELDS } from '../FilterModal/types';

interface FieldPickerModalProps {
  open: boolean;
  onClose: () => void;
  onSelect: (fieldKey: string) => void;
  selectedField?: string | null;
}

interface TableGroup {
  tableName: string;
  fields: Array<{
    name: string;
    label: string;
    type: string;
  }>;
}

const PREVIEW_ROW_COUNT = 3;

// Generate table color based on name
function getTableColor(tableName: string): string {
  let hash = 0;
  for (let i = 0; i < tableName.length; i++) {
    hash = (hash * 31 + tableName.charCodeAt(i)) % 360;
  }
  return `hsl(${Math.abs(hash)}, 62%, 63%)`;
}

export const FieldPickerModal: React.FC<FieldPickerModalProps> = ({
  open,
  onClose,
  onSelect,
  selectedField = null,
}) => {
  const [activeTable, setActiveTable] = useState<string>('');
  const [tableQuery, setTableQuery] = useState('');
  const [fieldQuery, setFieldQuery] = useState('');
  const [hoveredColumn, setHoveredColumn] = useState<string | null>(null);
  const [tableData, setTableData] = useState<Record<string, unknown>[]>([]);

  // Group fields by table (using actual table name from field.name prefix)
  const tableGroups: TableGroup[] = AVAILABLE_FIELDS.reduce((acc, field) => {
    const tableName = field.name.split('.')[0] || field.tableName || 'Other';
    let group = acc.find((g) => g.tableName === tableName);
    if (!group) {
      group = { tableName, fields: [] };
      acc.push(group);
    }
    group.fields.push({
      name: field.name,
      label: field.label,
      type: field.type,
    });
    return acc;
  }, [] as TableGroup[]);

  // Set initial active table
  useEffect(() => {
    if (open && !activeTable && tableGroups.length > 0) {
      if (selectedField) {
        const tableName = selectedField.split('.')[0];
        const tableExists = tableGroups.find(
          (g) => g.tableName.toLowerCase() === tableName.toLowerCase(),
        );
        setActiveTable(tableExists ? tableExists.tableName : tableGroups[0].tableName);
      } else {
        setActiveTable(tableGroups[0].tableName);
      }
    }
  }, [open, selectedField, tableGroups, activeTable]);

  // Filter tables by search query
  const filteredTables = tableGroups.filter((g) =>
    g.tableName.toLowerCase().includes(tableQuery.toLowerCase()),
  );

  // Get active table data
  const activeTableData = tableGroups.find((g) => g.tableName === activeTable);

  // Fetch real data when active table changes
  useEffect(() => {
    if (!activeTable) {
      setTableData([]);
      return;
    }

    let cancelled = false;
    (async () => {
      try {
        const tableName = activeTable.toLowerCase();
        const result = await window.electron.ipcRenderer.invoke(
          'sqlite:all',
          `SELECT * FROM ${tableName} LIMIT ${PREVIEW_ROW_COUNT}`,
        );
        if (!cancelled) setTableData(result || []);
      } catch {
        if (!cancelled) setTableData([]);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [activeTable]);

  // Filter fields by search query
  const filteredFields = activeTableData
    ? activeTableData.fields.filter((f) => f.label.toLowerCase().includes(fieldQuery.toLowerCase()))
    : [];

  const handleTableClick = (tableName: string) => {
    setActiveTable(tableName);
    setFieldQuery('');
  };

  const handleFieldSelect = (fieldKey: string) => {
    onSelect(fieldKey);
    onClose();
  };

  const totalFieldsCount = tableGroups.reduce((sum, g) => sum + g.fields.length, 0);

  return (
    <Modal
      isOpen={open}
      onClose={onClose}
      closeOnBackdropClick={true}
      className="max-w-4xl h-[640px]"
      hideCloseButton={true}
    >
      <ModalHeader
        title="Choose field"
        description="View sample data from each table and select a field"
        onClose={onClose}
      />

      <ModalBody className="flex gap-0 p-0 overflow-hidden">
        {/* Sidebar */}
        <div className="w-[230px] flex-shrink-0 border-r border-divider flex flex-col bg-card-background/50">
          {/* Table search */}
          <div className="flex items-center gap-2 px-3 py-2.5 border-b border-divider">
            <Search className="w-3.5 h-3.5 text-muted-foreground" />
            <input
              type="text"
              value={tableQuery}
              onChange={(e) => setTableQuery(e.target.value)}
              placeholder="Search tables..."
              className="flex-1 bg-transparent border-none outline-none text-xs text-text-primary placeholder:text-muted-foreground"
            />
          </div>

          {/* Table list */}
          <div className="flex-1 overflow-y-auto p-2">
            {filteredTables.length === 0 ? (
              <div className="text-center py-8 text-xs text-muted-foreground">
                No tables match "{tableQuery}"
              </div>
            ) : (
              filteredTables.map((group) => (
                <div
                  key={group.tableName}
                  onClick={() => handleTableClick(group.tableName)}
                  className={cn(
                    'flex items-center gap-2 px-2.5 py-2 rounded-lg cursor-pointer transition-colors mb-1',
                    activeTable === group.tableName ? 'bg-primary/10' : 'hover:bg-input-background',
                  )}
                >
                  <span
                    className="w-2 h-2 rounded-full flex-shrink-0"
                    style={{ background: getTableColor(group.tableName) }}
                  />
                  <span
                    className={cn(
                      'flex-1 text-xs font-medium truncate',
                      activeTable === group.tableName ? 'text-text-primary' : 'text-text-secondary',
                    )}
                  >
                    {group.tableName}
                  </span>
                  <span
                    className={cn(
                      'text-[10px] font-mono font-semibold px-1.5 py-0.5 rounded-md',
                      activeTable === group.tableName
                        ? 'bg-primary/20 text-primary'
                        : 'bg-input-background text-secondary',
                    )}
                  >
                    {group.fields.length}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Main content */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Field search */}
          <div className="flex items-center gap-2 px-3 py-2.5 border-b border-divider">
            <Search className="w-3.5 h-3.5 text-muted-foreground" />
            <input
              type="text"
              value={fieldQuery}
              onChange={(e) => setFieldQuery(e.target.value)}
              placeholder="Search fields in this table..."
              className="flex-1 bg-transparent border-none outline-none text-xs text-text-primary placeholder:text-muted-foreground"
            />
          </div>

          {/* Data grid */}
          <div className="flex-1 overflow-auto">
            {!activeTableData ? (
              <div className="text-center py-12 text-xs text-muted-foreground">
                Select a table from the left sidebar
              </div>
            ) : filteredFields.length === 0 ? (
              <div className="text-center py-12 text-xs text-muted-foreground">
                No fields match "{fieldQuery}" in {activeTable}
              </div>
            ) : (
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-card-background">
                    {filteredFields.map((field, colIndex) => {
                      const isSelected = selectedField === field.name;
                      const isHovered = hoveredColumn === field.name;
                      // Extract actual field name from "table.field" format
                      const fieldName = field.name.split('.')[1] || field.name;
                      return (
                        <th
                          key={field.name}
                          onClick={() => handleFieldSelect(field.name)}
                          onMouseEnter={() => setHoveredColumn(field.name)}
                          onMouseLeave={() => setHoveredColumn(null)}
                          className={cn(
                            'text-left px-3 py-2.5 border-b border-r border-border cursor-pointer transition-colors select-none whitespace-nowrap',
                            isSelected && 'bg-primary/10',
                            isHovered && !isSelected && 'bg-primary/10',
                          )}
                        >
                          <div className="flex items-center gap-1.5">
                            {isSelected && <Check className="w-3 h-3 text-primary" />}
                            <span
                              className={cn(
                                'text-[10.5px] font-bold tracking-wider',
                                isSelected ? 'text-primary' : 'text-text-secondary',
                              )}
                            >
                              {fieldName}
                            </span>
                          </div>
                        </th>
                      );
                    })}
                  </tr>
                </thead>
                <tbody>
                  {tableData.map((row, rowIndex) => (
                    <tr key={rowIndex}>
                      {filteredFields.map((field, colIndex) => {
                        const isSelected = selectedField === field.name;
                        const isHovered = hoveredColumn === field.name;
                        const columnName = field.name.split('.')[1] || field.name;
                        const rowData = row as Record<string, unknown>;
                        const value = rowData?.[columnName];
                        return (
                          <td
                            key={field.name}
                            onClick={() => handleFieldSelect(field.name)}
                            onMouseEnter={() => setHoveredColumn(field.name)}
                            onMouseLeave={() => setHoveredColumn(null)}
                            className={cn(
                              'px-3 py-2 text-[11.5px] font-mono text-text-primary border-b border-r border-border whitespace-nowrap cursor-pointer transition-colors',
                              isSelected && 'bg-primary/5',
                              isHovered && !isSelected && 'bg-primary/10',
                            )}
                          >
                            {String(value ?? '')}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </ModalBody>

      <ModalFooter className="justify-end">
        <Button variant="outline" onClick={onClose}>
          Close
        </Button>
      </ModalFooter>
    </Modal>
  );
};

export default FieldPickerModal;
