/**
 * ------------------------------------------------------------------
 * FilterBar
 * ------------------------------------------------------------------
 * Inline filter builder bar for the Email table. Allows users to
 * construct WHERE-like filter conditions with column, operator,
 * and value. Supports adding, editing, and removing filter rows.
 *
 * Main features:
 * - Add filter conditions with column/operator/value dropdowns
 * - Edit existing filter rows inline with Apply button
 * - Remove individual filters or clear all
 * - Searchable column dropdowns
 * - Operator tooltips with descriptions
 * ------------------------------------------------------------------
 */

// ─── Imports ────────────────────────────────────────────────────────────
// ── React ──
import React, { useState, useEffect, useMemo } from 'react';

// ── UI ──
import { X, ChevronDown } from 'lucide-react';

// ── UI Components ──
import { Button } from '../../../components/ui/Button';
import {
  Dropdown,
  DropdownTrigger,
  DropdownContent,
  DropdownItem,
} from '../../../components/ui/Dropdown';
import { Tooltip } from '../../../components/ui/Tooltip';
import { Input } from '../../../components/ui/Input';

// ── Types ──
import {
  OPERATORS,
  OPERATOR_DESCRIPTIONS,
  FilterCondition,
  Operator,
} from '../../../constants/operators';

// ─── Interfaces ─────────────────────────────────────────────────────────
interface FilterBarProps {
  filters: FilterCondition[];
  availableColumns: string[];
  onAddFilter: (column: string, operator: Operator, value: string) => void;
  onRemoveFilter: (id: string) => void;
  onClearFilters: () => void;
  onUpdateFilter?: (id: string, column: string, operator: Operator, value: string) => void;
}

interface FilterRowProps {
  filter: FilterCondition;
  availableColumns: string[];
  onRemove: (id: string) => void;
  onUpdate: (id: string, column: string, operator: Operator, value: string) => void;
}

// ─── Sub-Component: FilterRow ───────────────────────────────────────────
const FilterRow: React.FC<FilterRowProps> = ({ filter, availableColumns, onRemove, onUpdate }) => {
  // ── State ──
  const [editColumn, setEditColumn] = useState(
    filter.column || (availableColumns.length > 0 ? availableColumns[0] : ''),
  );
  const [editOperator, setEditOperator] = useState<Operator>(filter.operator || 'equals');
  const [editValue, setEditValue] = useState(filter.value || '');
  const [hasChanges, setHasChanges] = useState(false);
  const [searchColumn, setSearchColumn] = useState('');

  // ── Effects ──
  useEffect(() => {
    setEditColumn(filter.column || (availableColumns.length > 0 ? availableColumns[0] : ''));
    setEditOperator(filter.operator || 'equals');
    setEditValue(filter.value || '');
    setHasChanges(false);
  }, [filter, availableColumns]);

  // ── Handlers ──
  const handleUpdate = () => {
    if (hasChanges) {
      onUpdate(filter.id, editColumn || '', editOperator, editValue || '');
      setHasChanges(false);
    }
  };

  // ── Render ──
  return (
    <div className="flex items-center gap-2">
      <Button
        variant="outline"
        size="sm"
        onClick={() => onRemove(filter.id)}
        className="h-[30px] w-[30px] p-0 shrink-0"
      >
        <X className="w-3.5 h-3.5" />
      </Button>
      <span className="text-sm text-text-secondary font-medium w-10 shrink-0">and</span>
      <div className="flex items-center gap-2 flex-1">
        <Dropdown>
          <DropdownTrigger asChild>
            <Button variant="outline" size="sm" className="h-[30px] justify-between min-w-[120px] text-sm">
              <span>{editColumn || 'Select column'}</span>
              <ChevronDown className="w-3.5 h-3.5" />
            </Button>
          </DropdownTrigger>
          <DropdownContent className="min-w-[150px] max-h-[200px] overflow-y-auto">
            <div className="px-2 py-1.5 border-b border-border">
              <Input
                placeholder="Search columns..."
                className="h-5 text-xs"
                value={searchColumn}
                onChange={(e) => setSearchColumn(e.target.value)}
                onClick={(e) => e.stopPropagation()}
              />
            </div>
            {availableColumns
              .filter((col) => col.toLowerCase().includes(searchColumn.toLowerCase()))
              .map((col) => (
                <DropdownItem
                  key={col}
                  onClick={() => {
                    setEditColumn(col);
                    setSearchColumn('');
                    setHasChanges(true);
                  }}
                  className="text-sm"
                >
                  {col}
                </DropdownItem>
              ))}
          </DropdownContent>
        </Dropdown>

        <Dropdown>
          <DropdownTrigger asChild>
            <Button variant="outline" size="sm" className="h-[30px] justify-between min-w-[100px] text-sm">
              <span>{OPERATORS.find((o) => o.value === editOperator)?.label || 'Operator'}</span>
              <ChevronDown className="w-3.5 h-3.5" />
            </Button>
          </DropdownTrigger>
          <DropdownContent className="min-w-[120px]">
            {OPERATORS.map((op) => (
              <Tooltip
                key={op.value}
                content={OPERATOR_DESCRIPTIONS[op.value] || op.label}
                side="right"
                align="center"
              >
                <DropdownItem
                  onClick={() => {
                    setEditOperator(op.value);
                    setHasChanges(true);
                  }}
                  className="text-sm"
                >
                  {op.label}
                </DropdownItem>
              </Tooltip>
            ))}
          </DropdownContent>
        </Dropdown>

        <Input
          value={editValue}
          onChange={(e) => {
            setEditValue(e.target.value);
            setHasChanges(true);
          }}
          placeholder="Value..."
          className="h-[30px] text-sm min-w-[120px] flex-1"
          onKeyDown={(e) => e.key === 'Enter' && handleUpdate()}
        />

        {hasChanges && (
          <Button variant="solid" size="sm" onClick={handleUpdate} className="h-[30px] text-sm">
            Apply
          </Button>
        )}
      </div>
    </div>
  );
};

// ─── Component: FilterBar ───────────────────────────────────────────────
export const FilterBar: React.FC<FilterBarProps> = ({
  filters,
  availableColumns,
  onAddFilter,
  onRemoveFilter,
  onClearFilters,
  onUpdateFilter,
}) => {
  // ── Derived ──
  const filteredColumns = useMemo(() => {
    const sttVariants = ['STT', 'stt', 'col_stt', '_stt'];
    return availableColumns.filter(col => !sttVariants.includes(col));
  }, [availableColumns]);

  const defaultColumn = filteredColumns.length > 0 ? filteredColumns[0] : '';

  // ── State ──
  const [newFilterColumn, setNewFilterColumn] = useState<string>(defaultColumn);
  const [newFilterOperator, setNewFilterOperator] = useState<Operator>('equals');
  const [newFilterValue, setNewFilterValue] = useState('');
  const [hasChanges, setHasChanges] = useState(false);
  const [searchColumn, setSearchColumn] = useState('');

  // ── Effects ──
  useEffect(() => {
    if (filteredColumns.length > 0 && !newFilterColumn) {
      setNewFilterColumn(filteredColumns[0]);
    }
  }, [filteredColumns, newFilterColumn]);

  // ── Handlers ──
  const handleApplyFilter = () => {
    if (newFilterColumn) {
      onAddFilter(newFilterColumn, newFilterOperator, newFilterValue);
      setNewFilterValue('');
      setNewFilterOperator('equals');
      setHasChanges(false);
    }
  };

  // ── Render ──
  return (
    <div className="px-4 py-1 border-b border-border bg-card-background/50 shrink-0">
      <div className="flex items-center gap-2 flex-wrap">
        {filters.length >= 1 && (
          <Button
            variant="outline"
            size="sm"
            onClick={onClearFilters}
            className="h-[30px] w-[30px] p-0 shrink-0"
            aria-label="Clear all filters"
          >
            <X className="w-3.5 h-3.5" />
          </Button>
        )}
        <span className="text-sm text-text-secondary font-medium w-10 shrink-0">where</span>
        <div className="flex items-center gap-2 flex-1">
          <Dropdown>
            <DropdownTrigger asChild>
              <Button variant="outline" size="sm" className="h-[30px] justify-between min-w-[120px] text-sm">
                <span>{newFilterColumn || 'Select column'}</span>
                <ChevronDown className="w-3.5 h-3.5" />
              </Button>
            </DropdownTrigger>
            <DropdownContent className="min-w-[150px] max-h-[200px] overflow-y-auto">
              <div className="px-2 py-1.5 border-b border-border">
                <Input
                  placeholder="Search columns..."
                  className="h-5 text-xs"
                  value={searchColumn}
                  onChange={(e) => setSearchColumn(e.target.value)}
                  onClick={(e) => e.stopPropagation()}
                />
              </div>
              {filteredColumns
                .filter((col) => col.toLowerCase().includes(searchColumn.toLowerCase()))
                .map((col) => (
                  <DropdownItem
                    key={col}
                    onClick={() => {
                      setNewFilterColumn(col);
                      setSearchColumn('');
                    }}
                    className="text-sm"
                  >
                    {col}
                  </DropdownItem>
                ))}
            </DropdownContent>
          </Dropdown>

          <Dropdown>
            <DropdownTrigger asChild>
              <Button variant="outline" size="sm" className="h-[30px] justify-between min-w-[100px] text-sm">
                <span>
                  {OPERATORS.find((o) => o.value === newFilterOperator)?.label || 'Operator'}
                </span>
                <ChevronDown className="w-3.5 h-3.5" />
              </Button>
            </DropdownTrigger>
            <DropdownContent className="min-w-[120px]">
              {OPERATORS.map((op) => (
                <Tooltip
                  key={op.value}
                  content={OPERATOR_DESCRIPTIONS[op.value] || op.label}
                  side="right"
                  align="center"
                >
                  <DropdownItem onClick={() => setNewFilterOperator(op.value)} className="text-sm">
                    {op.label}
                  </DropdownItem>
                </Tooltip>
              ))}
            </DropdownContent>
          </Dropdown>

          <Input
            value={newFilterValue}
            onChange={(e) => {
              setNewFilterValue(e.target.value);
              setHasChanges(true);
            }}
            placeholder="Value..."
            className="h-[30px] text-sm min-w-[120px] flex-1"
            onKeyDown={(e) => e.key === 'Enter' && handleApplyFilter()}
          />

          {hasChanges && (
            <Button variant="solid" size="sm" onClick={handleApplyFilter} className="h-[30px] text-sm">
              Apply
            </Button>
          )}

          <Button variant="outline" size="sm" onClick={handleApplyFilter} className="h-[30px] text-sm">
            Add filter
          </Button>
        </div>
      </div>

      {filters.length > 0 && (
        <div className="mt-2 space-y-1.5">
          {filters.map((f) => (
            <FilterRow
              key={f.id}
              filter={f}
              availableColumns={filteredColumns}
              onRemove={onRemoveFilter}
              onUpdate={
                onUpdateFilter ||
                ((id, column, operator, value) => {
                  onRemoveFilter(id);
                  onAddFilter(column, operator, value);
                })
              }
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default FilterBar;