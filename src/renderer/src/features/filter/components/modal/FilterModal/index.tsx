import React, { useState, useEffect } from 'react';
import { Plus } from 'lucide-react';
import { Button } from '../../../../../components/ui/Button';
import { Input } from '../../../../../components/ui/Input';
import { Modal, ModalHeader, ModalBody, ModalFooter } from '../../../../../components/ui/Modal';
import { v4 as uuidv4 } from 'uuid';
import {
  FieldType,
  FilterCard as FilterCardType,
  Column as ColumnType,
  OPERATOR_LABELS,
} from './types';
import { FilterCard } from './FilterCard';
import { ColumnCard } from './ColumnCard';

interface FilterModalProps {
  open: boolean;
  onClose: () => void;
  onSave: (name: string, filters: FilterCardType[]) => void;
  availableFields: Array<{ name: string; type: FieldType; label: string; tableName?: string }>;
  initialFilters?: FilterCardType[];
  initialName?: string;
}

export const FilterModal: React.FC<FilterModalProps> = ({
  open,
  onClose,
  onSave,
  availableFields,
  initialFilters = [],
  initialName = '',
}) => {
  const [viewName, setViewName] = useState(initialName);
  const [filters, setFilters] = useState<FilterCardType[]>(
    initialFilters.length > 0 ? initialFilters : [],
  );
  const [columns, setColumns] = useState<ColumnType[]>([]);
  const [previewRows, setPreviewRows] = useState<Record<string, unknown>[]>([]);

  const handleAddFilter = () => {
    setFilters([
      ...filters,
      {
        id: uuidv4(),
        field: '',
        operator: 'equals',
        value: '',
        logic: 'AND',
      },
    ]);
  };

  const handleUpdateFilter = (id: string, updated: FilterCardType) => {
    setFilters(filters.map((f) => (f.id === id ? updated : f)));
  };

  const handleRemoveFilter = (id: string) => {
    setFilters(filters.filter((f) => f.id !== id));
  };

  const handleDuplicateFilter = (id: string) => {
    const idx = filters.findIndex((f) => f.id === id);
    const original = filters[idx];
    const clone = { ...original, id: uuidv4() };
    const newFilters = [...filters];
    newFilters.splice(idx + 1, 0, clone);
    setFilters(newFilters);
  };

  const handleToggleLogic = (id: string) => {
    setFilters(
      filters.map((f) => (f.id === id ? { ...f, logic: f.logic === 'AND' ? 'OR' : 'AND' } : f)),
    );
  };

  const handleAddColumn = () => {
    setColumns([...columns, { id: uuidv4(), name: '', field: '' }]);
  };

  const handleUpdateColumn = (id: string, updated: ColumnType) => {
    setColumns(columns.map((c) => (c.id === id ? updated : c)));
  };

  const handleRemoveColumn = (id: string) => {
    setColumns(columns.filter((c) => c.id !== id));
  };

  const isValidFilter = (f: FilterCardType): boolean => {
    if (!f.field) return false;
    if (['isNull', 'isNotNull', 'isEmpty', 'isNotEmpty'].includes(f.operator)) return true;
    return f.value.trim() !== '';
  };

  const hasInvalidFilter = filters.some((f) => !isValidFilter(f));

  useEffect(() => {
    if (columns.length === 0) {
      setPreviewRows([]);
      return;
    }

    let cancelled = false;
    (async () => {
      try {
        // Gom columns theo table
        const validColumns = columns.filter((c) => c.field);
        if (validColumns.length === 0) {
          if (!cancelled) setPreviewRows([]);
          return;
        }

        const baseTable = validColumns[0].field.split('.')[0];
        const tablesNeeded = new Set(validColumns.map((c) => c.field.split('.')[0]));

        // Build SELECT với alias để key khớp với col.field
        const selectParts = validColumns.map((c) => `${c.field} AS "${c.field}"`);

        // Build JOIN clauses cho các table khác
        const joinClauses: string[] = [];
        const joinPathMap: Record<string, string> = {
          services: `LEFT JOIN service_emails se ON se.email_id = emails.id LEFT JOIN services ON services.id = se.service_id`,
          proxies: `LEFT JOIN proxy_history ph ON ph.email_id = emails.id LEFT JOIN proxies ON proxies.id = ph.proxy_id`,
          sessions: `LEFT JOIN sessions ON sessions.email_id = emails.id`,
          proxy_health_history: `LEFT JOIN proxy_history ph2 ON ph2.email_id = emails.id LEFT JOIN proxies p2 ON p2.id = ph2.proxy_id LEFT JOIN proxy_health_history ON proxy_health_history.proxy_id = p2.id`,
        };

        if (tablesNeeded.has('services') && baseTable !== 'services') {
          joinClauses.push(joinPathMap.services);
        }
        if (tablesNeeded.has('proxies') && baseTable !== 'proxies') {
          joinClauses.push(joinPathMap.proxies);
        }
        if (tablesNeeded.has('sessions') && baseTable !== 'sessions') {
          joinClauses.push(joinPathMap.sessions);
        }
        if (tablesNeeded.has('proxy_health_history') && baseTable !== 'proxy_health_history') {
          joinClauses.push(joinPathMap.proxy_health_history);
        }

        const query = `SELECT ${selectParts.join(', ')} FROM ${baseTable} ${joinClauses.join(' ')} LIMIT 5`;

        const result = await window.electron.ipcRenderer.invoke('sqlite:all', query);
        if (!cancelled) setPreviewRows(result || []);
      } catch {
        if (!cancelled) setPreviewRows([]);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [columns]);

  const handleSave = () => {
    if (!viewName.trim()) {
      alert('Please enter a view name');
      return;
    }

    const validFilters = filters.filter((f) => {
      if (!f.field) return false;
      if (['isNull', 'isNotNull', 'isEmpty', 'isNotEmpty'].includes(f.operator)) return true;
      return f.value.trim() !== '';
    });

    onSave(viewName, validFilters);
    onClose();
  };

  return (
    <Modal
      isOpen={open}
      onClose={onClose}
      closeOnBackdropClick={true}
      className="max-w-2xl"
      hideCloseButton={true}
    >
      <ModalHeader
        title="Advanced Filter Builder"
        description="Chain conditions to define exactly which records match"
        onClose={onClose}
      />

      <ModalBody className="space-y-5">
        {/* View Name */}
        <div>
          <label className="text-[10.5px] font-semibold text-muted-foreground uppercase tracking-widest block mb-2">
            View name
          </label>
          <Input
            value={viewName}
            onChange={(e) => setViewName(e.target.value)}
            placeholder="e.g. Active Gmail Accounts"
            className="h-10 text-[13.5px] bg-input-background"
          />
        </div>

        {/* Section header */}
        <div className="flex items-center justify-between">
          <label className="text-[10.5px] font-semibold text-muted-foreground uppercase tracking-widest flex items-center gap-1.5">
            Conditions
            <span className="inline-flex items-center px-1.5 py-px rounded-full bg-purple-400/10 text-purple-400 text-[10.5px] font-bold font-mono">
              {filters.length}
            </span>
          </label>
          <button
            onClick={handleAddFilter}
            className="inline-flex items-center gap-1.5 bg-card border border-border text-text-secondary text-xs font-medium px-3 py-1.5 rounded-md hover:border-primary hover:text-primary hover:bg-primary/10 transition-colors"
          >
            <Plus className="w-3 h-3" />
            Add condition
          </button>
        </div>

        {/* Conditions rail */}
        <div className="flex flex-col">
          {filters.map((filter, index) => (
            <FilterCard
              key={filter.id}
              filter={filter}
              index={index}
              total={filters.length}
              availableFields={availableFields}
              onUpdate={(updated) => handleUpdateFilter(filter.id, updated)}
              onRemove={() => handleRemoveFilter(filter.id)}
              onDuplicate={() => handleDuplicateFilter(filter.id)}
              onToggleLogic={() => handleToggleLogic(filter.id)}
              isInvalid={!isValidFilter(filter)}
            />
          ))}
        </div>

        {/* Columns section */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-[10.5px] font-semibold text-muted-foreground uppercase tracking-widest flex items-center gap-1.5">
              Columns
              <span className="inline-flex items-center px-1.5 py-px rounded-full bg-purple-400/10 text-purple-400 text-[10.5px] font-bold font-mono">
                {columns.length}
              </span>
            </label>
            <button
              onClick={handleAddColumn}
              className="inline-flex items-center gap-1.5 bg-card border border-border text-text-secondary text-xs font-medium px-3 py-1.5 rounded-md hover:border-primary hover:text-primary hover:bg-primary/10 transition-colors"
            >
              <Plus className="w-3 h-3" />
              Add column
            </button>
          </div>
          <div className="flex flex-col gap-2">
            {columns.length === 0 ? (
              <div className="text-center py-6 text-xs text-muted-foreground italic bg-card border border-dashed border-border rounded-xl">
                No columns selected — all fields will be shown
              </div>
            ) : (
              columns.map((column) => (
                <ColumnCard
                  key={column.id}
                  column={column}
                  availableFields={availableFields}
                  onUpdate={(updated) => handleUpdateColumn(column.id, updated)}
                  onRemove={() => handleRemoveColumn(column.id)}
                  isInvalid={!column.field}
                />
              ))
            )}
          </div>
        </div>

        {/* Preview */}
        <div>
          <label className="text-[10.5px] font-semibold text-muted-foreground uppercase tracking-widest block mb-2">
            Live query
          </label>
          <div className="bg-[#080a0f] border border-border rounded-xl p-3.5 font-mono text-[12.5px] leading-[1.85] overflow-x-auto">
            {filters.length > 0 ? (
              <>
                <div className="whitespace-pre">
                  <span className="text-primary font-semibold">SELECT</span>
                  <span className="text-text-primary">
                    {' '}
                    {columns.length > 0
                      ? columns.filter((c) => c.field).map((c) => c.field).join(', ')
                      : '<empty>'}
                  </span>
                </div>
                {filters.map((filter, index) => {
                  const field = availableFields.find((f) => f.name === filter.field);
                  const isEmptyOp = ['isNull', 'isNotNull', 'isEmpty', 'isNotEmpty'].includes(
                    filter.operator,
                  );
                  return (
                    <div key={filter.id} className="whitespace-pre">
                      {index === 0 ? (
                        <span className="text-primary font-semibold">WHERE</span>
                      ) : (
                        <span> </span>
                      )}
                      {index > 0 && (
                        <span className="text-purple-400 font-semibold">{filter.logic}</span>
                      )}
                      {index > 0 && <span> </span>}
                      {index === 0 && <span> </span>}
                      <span className="text-text-primary">{filter.field || '<field>'}</span>
                      <span className="text-text-secondary">
                        {' '}
                        {OPERATOR_LABELS[filter.operator].toLowerCase()}
                      </span>
                      {!isEmptyOp && (
                        <span className="text-amber-400"> "{filter.value || '<empty>'}"</span>
                      )}
                    </div>
                  );
                })}
              </>
            ) : (
              <>
                <div className="whitespace-pre">
                  <span className="text-primary font-semibold">SELECT</span>
                  <span className="text-text-primary">
                    {' '}
                    {columns.length > 0
                      ? columns.filter((c) => c.field).map((c) => c.field).join(', ')
                      : '<empty>'}
                  </span>
                </div>
                <div className="whitespace-pre">
                  <span className="text-primary font-semibold">WHERE</span>
                  <span className="text-text-primary"> {'<empty>'}</span>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Live Preview Table */}
        <div>
          <label className="text-[10.5px] font-semibold text-muted-foreground uppercase tracking-widest block mb-2">
            Live Preview Table
          </label>
          <div className="bg-card border border-border rounded-xl overflow-x-auto">
            <table className="w-full border-collapse text-[12px]">
              <thead>
                <tr className="bg-input-background">
                  <th className="text-left px-3 py-2 border-b border-border font-semibold text-text-secondary whitespace-nowrap w-12">
                    STT
                  </th>
                  {columns.map((col) => {
                    const fieldData = availableFields.find((f) => f.name === col.field);
                    const fieldName = col.field.split('.')[1] || col.field;
                    return (
                      <th
                        key={col.id}
                        className="text-left px-3 py-2 border-b border-border font-semibold text-text-secondary whitespace-nowrap"
                      >
                        {col.name || `${fieldName} (${fieldData?.tableName || ''})`}
                      </th>
                    );
                  })}
                </tr>
              </thead>
              <tbody>
                {previewRows.length > 0 ? (
                  previewRows.slice(0, 5).map((row, rowIndex) => (
                    <tr key={rowIndex} className="hover:bg-input-background/50">
                      <td className="px-3 py-2 border-b border-border text-text-secondary font-mono whitespace-nowrap w-12">
                        {rowIndex + 1}
                      </td>
                      {columns.map((col) => {
                        const value = row[col.field] ?? '';
                        return (
                          <td
                            key={col.id}
                            className="px-3 py-2 border-b border-border text-text-primary font-mono whitespace-nowrap"
                          >
                            {String(value)}
                          </td>
                        );
                      })}
                    </tr>
                  ))
                ) : (
                  Array.from({ length: 5 }).map((_, rowIndex) => (
                    <tr key={rowIndex} className="hover:bg-input-background/50">
                      <td className="px-3 py-2 border-b border-border text-text-secondary font-mono whitespace-nowrap w-12">
                        {rowIndex + 1}
                      </td>
                      {columns.length > 0 && (
                        <td
                          colSpan={columns.length}
                          className="px-3 py-2 border-b border-border text-muted-foreground italic text-center"
                        >
                          No data available
                        </td>
                      )}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </ModalBody>

      <ModalFooter>
        <Button variant="outline" onClick={onClose}>
          Cancel
        </Button>
        <Button variant="solid" onClick={handleSave} disabled={hasInvalidFilter || !viewName.trim()}>
          Save view
        </Button>
      </ModalFooter>
    </Modal>
  );
};

export default FilterModal;
