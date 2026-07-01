import React, { useState, useEffect } from 'react';
import { Button } from '../../../components/ui/Button';
import {
  Dropdown,
  DropdownTrigger,
  DropdownContent,
  DropdownItem,
} from '../../../components/ui/Dropdown';
import { Tooltip } from '../../../components/ui/Tooltip';
import { Input } from '../../../components/ui/Input';
import { X, ChevronDown } from 'lucide-react';
import { OPERATORS, OPERATOR_DESCRIPTIONS, FilterCondition, Operator } from '../../../constants/operators';

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

const FilterRow: React.FC<FilterRowProps> = ({ filter, availableColumns, onRemove, onUpdate }) => {
  const [editColumn, setEditColumn] = useState(filter.column || (availableColumns.length > 0 ? availableColumns[0] : ''));
  const [editOperator, setEditOperator] = useState<Operator>(filter.operator || 'equals');
  const [editValue, setEditValue] = useState(filter.value || '');
  const [hasChanges, setHasChanges] = useState(false);
  const [searchColumn, setSearchColumn] = useState('');

  useEffect(() => {
    // Sync with props when filter changes externally
    setEditColumn(filter.column || (availableColumns.length > 0 ? availableColumns[0] : ''));
    setEditOperator(filter.operator || 'equals');
    setEditValue(filter.value || '');
    setHasChanges(false);
  }, [filter, availableColumns]);

  const handleUpdate = () => {
    if (hasChanges) {
      onUpdate(filter.id, editColumn || '', editOperator, editValue || '');
      setHasChanges(false);
    }
  };

  return (
    <div className="flex items-center gap-2">
      <Button
        variant="outline"
        size="sm"
        onClick={() => onRemove(filter.id)}
        className="h-7 w-7 p-0 shrink-0"
      >
        <X className="w-3.5 h-3.5" />
      </Button>
      <span className="text-xs text-text-secondary font-medium w-10 shrink-0">and</span>
      <div className="flex items-center gap-2 flex-1">
        <Dropdown>
          <DropdownTrigger asChild>
            <Button variant="outline" size="sm" className="h-7 justify-between min-w-[120px]">
              <span>{editColumn || 'Select column'}</span>
              <ChevronDown className="w-3.5 h-3.5" />
            </Button>
          </DropdownTrigger>
          <DropdownContent className="min-w-[150px] max-h-[200px] overflow-y-auto">
            <div className="px-2 py-1.5 border-b border-border">
              <Input
                placeholder="Search columns..."
                className="h-6 text-xs"
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
                  className="text-xs"
                >
                  {col}
                </DropdownItem>
              ))}
          </DropdownContent>
        </Dropdown>

        <Dropdown>
          <DropdownTrigger asChild>
            <Button variant="outline" size="sm" className="h-7 justify-between min-w-[100px]">
              <span>{OPERATORS.find((o) => o.value === editOperator)?.label || 'Operator'}</span>
              <ChevronDown className="w-3.5 h-3.5" />
            </Button>
          </DropdownTrigger>
          <DropdownContent className="min-w-[120px]">
            {OPERATORS.map((op) => (
              <Tooltip key={op.value} content={OPERATOR_DESCRIPTIONS[op.value] || op.label} side="right" align="center">
                <DropdownItem
                  onClick={() => {
                    setEditOperator(op.value);
                    setHasChanges(true);
                  }}
                  className="text-xs"
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
          className="h-7 text-xs min-w-[120px] flex-1"
          onKeyDown={(e) => e.key === 'Enter' && handleUpdate()}
        />

        {hasChanges && (
          <Button variant="solid" size="sm" onClick={handleUpdate} className="h-7 text-xs">
            Apply
          </Button>
        )}
      </div>
    </div>
  );
};

export const FilterBar: React.FC<FilterBarProps> = ({
  filters,
  availableColumns,
  onAddFilter,
  onRemoveFilter,
  onClearFilters,
  onUpdateFilter,
}) => {
  const defaultColumn = availableColumns.length > 0 ? availableColumns[0] : '';
  const [newFilterColumn, setNewFilterColumn] = useState<string>(defaultColumn);
  const [newFilterOperator, setNewFilterOperator] = useState<Operator>('equals');
  const [newFilterValue, setNewFilterValue] = useState('');
  const [hasChanges, setHasChanges] = useState(false);
  const [searchColumn, setSearchColumn] = useState('');

  useEffect(() => {
    if (availableColumns.length > 0 && !newFilterColumn) {
      setNewFilterColumn(availableColumns[0]);
    }
  }, [availableColumns, newFilterColumn]);

  const handleApplyFilter = () => {
    if (newFilterColumn) {
      onAddFilter(newFilterColumn, newFilterOperator, newFilterValue);
      setNewFilterValue('');
      setNewFilterOperator('equals');
      setHasChanges(false);
    }
  };

  return (
    <div className="px-4 py-2 border-b border-border bg-card-background/50 shrink-0">
      {/* Row 1: where + dropdowns + input + buttons */}
      <div className="flex items-center gap-2 flex-wrap">
        {filters.length >= 1 && (
          <Button
            variant="outline"
            size="sm"
            onClick={onClearFilters}
            className="h-7 w-7 p-0 shrink-0"
            aria-label="Clear all filters"
          >
            <X className="w-3.5 h-3.5" />
          </Button>
        )}
        <span className="text-xs text-text-secondary font-medium w-10 shrink-0">where</span>
        <div className="flex items-center gap-2 flex-1">
          <Dropdown>
            <DropdownTrigger asChild>
              <Button variant="outline" size="sm" className="h-7 justify-between min-w-[120px]">
                <span>{newFilterColumn || 'Select column'}</span>
                <ChevronDown className="w-3.5 h-3.5" />
              </Button>
            </DropdownTrigger>
            <DropdownContent className="min-w-[150px] max-h-[200px] overflow-y-auto">
              <div className="px-2 py-1.5 border-b border-border">
                <Input
                  placeholder="Search columns..."
                  className="h-6 text-xs"
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
                      setNewFilterColumn(col);
                      setSearchColumn('');
                    }}
                    className="text-xs"
                  >
                    {col}
                  </DropdownItem>
                ))}
            </DropdownContent>
          </Dropdown>

          <Dropdown>
            <DropdownTrigger asChild>
              <Button variant="outline" size="sm" className="h-7 justify-between min-w-[100px]">
                <span>
                  {OPERATORS.find((o) => o.value === newFilterOperator)?.label || 'Operator'}
                </span>
                <ChevronDown className="w-3.5 h-3.5" />
              </Button>
            </DropdownTrigger>
            <DropdownContent className="min-w-[120px]">
              {OPERATORS.map((op) => (
                <Tooltip key={op.value} content={OPERATOR_DESCRIPTIONS[op.value] || op.label} side="right" align="center">
                  <DropdownItem
                    onClick={() => setNewFilterOperator(op.value)}
                    className="text-xs"
                  >
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
            className="h-7 text-xs min-w-[120px] flex-1"
            onKeyDown={(e) => e.key === 'Enter' && handleApplyFilter()}
          />

          {hasChanges && (
            <Button variant="solid" size="sm" onClick={handleApplyFilter} className="h-7 text-xs">
              Apply
            </Button>
          )}

          <Button variant="outline" size="sm" onClick={handleApplyFilter} className="h-7 text-xs">
            Add filter
          </Button>
        </div>
      </div>

      {/* Active filters */}
      {filters.length > 0 && (
        <div className="mt-2 space-y-1.5">
          {filters.map((f) => (
            <FilterRow
              key={f.id}
              filter={f}
              availableColumns={availableColumns}
              onRemove={onRemoveFilter}
              onUpdate={onUpdateFilter || ((id, column, operator, value) => {
                onRemoveFilter(id);
                onAddFilter(column, operator, value);
              })}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default FilterBar;