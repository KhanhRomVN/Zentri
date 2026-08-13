import React, { useState } from 'react';
import { Plus, Trash2, Copy, GripVertical } from 'lucide-react';
import { Button } from '../../../../../components/ui/Button';
import { Input } from '../../../../../components/ui/Input';
import {
  Dropdown,
  DropdownTrigger,
  DropdownContent,
  DropdownItem,
} from '../../../../../components/ui/Dropdown';
import { Modal, ModalHeader, ModalBody, ModalFooter } from '../../../../../components/ui/Modal';
import FieldPickerModal from '../FieldPickerModal';
import { cn } from '../../../../../shared/lib/utils';
import { v4 as uuidv4 } from 'uuid';
import {
  FieldType,
  FilterCard as FilterCardType,
  FilterOperator,
  STRING_OPERATORS,
  NUMBER_OPERATORS,
  ARRAY_OPERATORS,
  OBJECT_OPERATORS,
  OPERATOR_LABELS,
} from './types';

interface FilterModalProps {
  open: boolean;
  onClose: () => void;
  onSave: (name: string, filters: FilterCardType[]) => void;
  availableFields: Array<{ name: string; type: FieldType; label: string; tableName?: string }>;
  initialFilters?: FilterCardType[];
  initialName?: string;
}

interface FilterCardProps {
  filter: FilterCardType;
  index: number;
  total: number;
  availableFields: Array<{ name: string; type: FieldType; label: string; tableName?: string }>;
  onUpdate: (filter: FilterCardType) => void;
  onRemove: () => void;
  onDuplicate: () => void;
  onToggleLogic: () => void;
}

const FilterCard: React.FC<FilterCardProps> = ({
  filter,
  index,
  total,
  availableFields,
  onUpdate,
  onRemove,
  onDuplicate,
  onToggleLogic,
}) => {
  const [isFieldPickerOpen, setIsFieldPickerOpen] = useState(false);
  const selectedField = availableFields.find((f) => f.name === filter.field);
  const fieldType = selectedField?.type || 'string';
  const isFirst = index === 0;
  const isLast = index === total - 1;

  const getOperatorsForType = (type: FieldType): FilterOperator[] => {
    switch (type) {
      case 'string':
        return STRING_OPERATORS;
      case 'number':
        return NUMBER_OPERATORS;
      case 'array':
        return ARRAY_OPERATORS;
      case 'object':
        return OBJECT_OPERATORS;
      default:
        return STRING_OPERATORS;
    }
  };

  const operators = getOperatorsForType(fieldType);

  const handleFieldChange = (newField: string) => {
    const newFieldData = availableFields.find((f) => f.name === newField);
    const newType = newFieldData?.type || 'string';
    const newOperators = getOperatorsForType(newType);
    const newOperator = newOperators.includes(filter.operator as any)
      ? filter.operator
      : newOperators[0];

    onUpdate({
      ...filter,
      field: newField,
      operator: newOperator,
      value: '',
    });
  };

  const needsValueInput = !['isNull', 'isNotNull', 'isEmpty', 'isNotEmpty'].includes(
    filter.operator,
  );

  return (
    <>
      {/* Connector row with logic toggle (only between conditions) */}
      {!isFirst && (
        <div className="flex items-stretch h-9">
          <div className="w-[26px] flex-shrink-0 flex items-center justify-center relative">
            <div
              className={cn(
                'absolute top-0 bottom-0 left-1/2 w-0.5 -translate-x-1/2 rounded-full',
                filter.logic === 'AND' ? 'bg-primary/40' : 'bg-purple-400/40',
              )}
            />
            <span
              onClick={onToggleLogic}
              className={cn(
                'relative z-10 font-mono text-[10.5px] font-bold tracking-wider px-2 py-0.5 rounded cursor-pointer select-none transition-colors bg-background',
                filter.logic === 'AND'
                  ? 'text-primary hover:bg-muted'
                  : 'text-purple-400 hover:bg-muted',
              )}
              title="Click để đổi AND / OR"
            >
              {filter.logic}
            </span>
          </div>
          <div className="flex-1 min-w-0" />
        </div>
      )}

      {/* Condition node row */}
      <div className="flex gap-3">
        {/* Rail track */}
        <div className="w-[26px] flex-shrink-0 flex flex-col items-center">
          <div
            className={cn(
              'w-[25px] h-[25px] flex-shrink-0 rounded-md flex items-center justify-center font-mono text-[10px] font-bold transition-shadow',
              isFirst && 'bg-primary/10 border border-primary text-primary',
              !isFirst && filter.logic === 'AND' && 'border border-primary text-primary',
              !isFirst && filter.logic === 'OR' && 'border border-purple-400 text-purple-400',
              !isFirst && !isFirst && 'bg-card',
            )}
          >
            {index + 1}
          </div>
          {!isLast && <div className="w-0.5 flex-1 min-h-3 bg-border rounded-full mt-0.5" />}
        </div>

        {/* Condition card */}
        <div
          className={cn(
            'flex-1 min-w-0 bg-card border border-border rounded-xl p-4 transition-colors',
            'hover:border-border-hover focus-within:border-primary focus-within:shadow-[0_0_0_3px] focus-within:shadow-primary/10',
          )}
        >
          {/* Card header */}
          <div className="flex items-center justify-between mb-3.5 pb-2.5 border-b border-border">
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <span className="flex items-center justify-center w-5 h-5 cursor-grab active:cursor-grabbing text-muted-foreground">
                <GripVertical className="w-3.5 h-3.5" />
              </span>
              <span className="text-[11.5px] font-semibold text-text-secondary tracking-wide">
                Filter condition
              </span>
            </div>
            <div className="flex items-center gap-0.5">
              <button
                onClick={onDuplicate}
                className="w-[27px] h-[27px] rounded-md border border-transparent bg-transparent text-muted-foreground hover:bg-input-background hover:border-border hover:text-text-primary transition-colors flex items-center justify-center"
                title="Nhân bản điều kiện"
              >
                <Copy className="w-3.5 h-3.5" />
              </button>
              <div className="w-px h-4 bg-border mx-1" />
              <button
                onClick={onRemove}
                disabled={total === 1}
                className="w-[27px] h-[27px] rounded-md border border-transparent bg-transparent text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors flex items-center justify-center disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-transparent disabled:hover:text-muted-foreground"
                title="Xóa điều kiện"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Filter inputs grid */}
          <div className="grid grid-cols-2 gap-2.5">
            {/* Field */}
            <div className="min-w-0">
              <label className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium block mb-1.5">
                Field
              </label>
              <button
                onClick={() => setIsFieldPickerOpen(true)}
                className="w-full h-9 flex items-center justify-between px-2.5 bg-input-background border border-border rounded-md text-[13px] font-medium text-text-primary hover:border-border-hover focus:border-primary focus:shadow-[0_0_0_3px] focus:shadow-primary/10 outline-none transition-colors"
              >
                <span className="truncate">
                  {selectedField ? (
                    <>
                      {selectedField.label}{' '}
                      <span className="text-text-secondary">({selectedField.tableName})</span>
                    </>
                  ) : (
                    'Select field'
                  )}
                </span>
                <svg
                  className="w-2.5 h-2.5 shrink-0 ml-2 text-muted-foreground"
                  viewBox="0 0 10 6"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M1 1L5 5L9 1" />
                </svg>
              </button>

              {/* Field Picker Modal */}
              <FieldPickerModal
                open={isFieldPickerOpen}
                onClose={() => setIsFieldPickerOpen(false)}
                onSelect={(fieldKey) => {
                  handleFieldChange(fieldKey);
                  setIsFieldPickerOpen(false);
                }}
                selectedField={filter.field}
              />
            </div>

            {/* Operator */}
            <div className="min-w-0">
              <label className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium block mb-1.5">
                Operator
              </label>
              <Dropdown className="w-full block">
                <DropdownTrigger asChild>
                  <button className="w-full h-9 flex items-center justify-between px-2.5 bg-input-background border border-border rounded-md text-[13px] font-medium text-text-primary hover:border-border-hover focus:border-primary focus:shadow-[0_0_0_3px] focus:shadow-primary/10 outline-none transition-colors">
                    <span className="truncate">
                      {OPERATOR_LABELS[filter.operator] || 'Select operator'}
                    </span>
                    <svg
                      className="w-2.5 h-2.5 shrink-0 ml-2 text-muted-foreground"
                      viewBox="0 0 10 6"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M1 1L5 5L9 1" />
                    </svg>
                  </button>
                </DropdownTrigger>
                <DropdownContent className="w-[260px] max-h-[260px] overflow-y-auto">
                  {operators.map((op) => (
                    <DropdownItem
                      key={op}
                      onClick={() => onUpdate({ ...filter, operator: op, value: '' })}
                    >
                      <span className="font-medium">{OPERATOR_LABELS[op]}</span>
                    </DropdownItem>
                  ))}
                </DropdownContent>
              </Dropdown>
            </div>

            {/* Value (full width) */}
            {needsValueInput && (
              <div className="col-span-2 mt-2">
                <label className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium block mb-1.5">
                  Value
                </label>
                <Input
                  type={fieldType === 'number' ? 'number' : 'text'}
                  value={filter.value}
                  onChange={(e) => onUpdate({ ...filter, value: e.target.value })}
                  placeholder={`Enter ${fieldType} value...`}
                  className="h-9 text-[13px] bg-input-background"
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

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
    initialFilters.length > 0
      ? initialFilters
      : [
          {
            id: uuidv4(),
            field: '',
            operator: 'equals',
            value: '',
            logic: 'AND',
          },
        ],
  );

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
    if (filters.length > 1) {
      setFilters(filters.filter((f) => f.id !== id));
    }
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

    if (validFilters.length === 0) {
      alert('Please add at least one valid filter');
      return;
    }

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
            />
          ))}
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
                  <span className="text-text-primary"> *</span>
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
              <span className="text-muted-foreground italic">No conditions added</span>
            )}
          </div>
        </div>
      </ModalBody>

      <ModalFooter>
        <Button variant="outline" onClick={onClose}>
          Cancel
        </Button>
        <Button variant="solid" onClick={handleSave}>
          Save view
        </Button>
      </ModalFooter>
    </Modal>
  );
};

export default FilterModal;
