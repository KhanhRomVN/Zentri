import React, { useState, useEffect } from 'react';
import { Trash2, Copy, GripVertical, ChevronRight, ChevronDown } from 'lucide-react';
import { Input } from '../../../../../components/ui/Input';
import {
  Dropdown,
  DropdownTrigger,
  DropdownContent,
  DropdownItem,
} from '../../../../../components/ui/Dropdown';
import FieldPickerModal from '../FieldPickerModal';
import { cn } from '../../../../../shared/lib/utils';
import {
  FieldType,
  FilterCard as FilterCardType,
  FilterOperator,
  STRING_OPERATORS,
  NUMBER_OPERATORS,
  ARRAY_OPERATORS,
  OBJECT_OPERATORS,
  OPERATOR_LABELS,
  OPERATOR_BADGES,
} from './types';

interface FilterCardProps {
  filter: FilterCardType;
  index: number;
  total: number;
  availableFields: Array<{ name: string; type: FieldType; label: string; tableName?: string }>;
  onUpdate: (filter: FilterCardType) => void;
  onRemove: () => void;
  onDuplicate: () => void;
  onToggleLogic: () => void;
  isInvalid?: boolean;
}

export const FilterCard: React.FC<FilterCardProps> = ({
  filter,
  index,
  total,
  availableFields,
  onUpdate,
  onRemove,
  onDuplicate,
  onToggleLogic,
  isInvalid = false,
}) => {
  const [isFieldPickerOpen, setIsFieldPickerOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(true);
  const [fieldValues, setFieldValues] = useState<string[]>([]);
  const ToggleIcon = isExpanded ? ChevronDown : ChevronRight;
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

  // Fetch distinct values when field changes
  useEffect(() => {
    if (!filter.field || !needsValueInput) {
      setFieldValues([]);
      return;
    }

    let cancelled = false;
    (async () => {
      try {
        const parts = filter.field.split('.');
        const table = parts[0];
        const column = parts.slice(1).join('.');
        const query = `SELECT DISTINCT ${column} FROM ${table} ORDER BY ${column}`;
        const result = await window.electron.ipcRenderer.invoke('sqlite:all', query);
        if (!cancelled) {
          setFieldValues(result.map((row: Record<string, unknown>) => String(row[column] ?? '')));
        }
      } catch {
        if (!cancelled) setFieldValues([]);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [filter.field, needsValueInput]);

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
        <div
          className={cn(
            'w-[26px] flex-shrink-0 flex flex-col items-center',
            !isExpanded && 'justify-center',
          )}
        >
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
            'flex-1 min-w-0 bg-card border rounded-xl transition-colors',
            isExpanded ? 'p-4' : 'py-3 px-4',
            isInvalid
              ? 'border-dashed border-warn/60 hover:border-warn focus-within:border-warn focus-within:shadow-[0_0_0_3px] focus-within:shadow-warn/10'
              : 'border-border hover:border-border-hover focus-within:border-primary focus-within:shadow-[0_0_0_3px] focus-within:shadow-primary/10',
          )}
        >
          {/* Card header */}
          <div
            className={cn(
              'flex items-center justify-between',
              isExpanded && 'mb-3.5 pb-2.5 border-b border-border',
            )}
          >
            <div className="flex items-center gap-1.5 text-muted-foreground">
              {isExpanded ? (
                <>
                  <span className="flex items-center justify-center w-5 h-5 cursor-grab active:cursor-grabbing text-muted-foreground">
                    <GripVertical className="w-3.5 h-3.5"></GripVertical>
                  </span>
                  <span className="text-[11.5px] font-semibold text-text-secondary tracking-wide">
                    Filter condition
                  </span>
                </>
              ) : (
                <div className="flex items-center gap-2 py-1 text-[13px] text-text-secondary">
                  <span className="font-medium text-primary">
                    {selectedField
                      ? selectedField.name.split('.')[1] || selectedField.name
                      : 'Select field'}
                  </span>
                  <span className="px-1.5 py-0.5 rounded bg-input-background border border-border font-mono text-[11px]">
                    {OPERATOR_BADGES[filter.operator] || OPERATOR_LABELS[filter.operator]}
                  </span>
                  {needsValueInput && filter.value && (
                    <span className="font-mono text-[12px] text-primary">{filter.value}</span>
                  )}
                </div>
              )}
            </div>
            <div className="flex items-center gap-0.5">
              <button
                onClick={() => setIsExpanded((prev) => !prev)}
                className="w-[27px] h-[27px] rounded-md border border-transparent bg-transparent text-muted-foreground hover:bg-input-background hover:border-border hover:text-text-primary transition-colors flex items-center justify-center"
                title={isExpanded ? 'Thu gọn' : 'Mở rộng'}
              >
                <ToggleIcon className="w-3.5 h-3.5" />
              </button>
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
                className="w-[27px] h-[27px] rounded-md border border-transparent bg-transparent text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors flex items-center justify-center"
                title="Xóa điều kiện"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Filter inputs grid */}
          {isExpanded && (
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
                        {selectedField.name.split('.')[1] || selectedField.name}{' '}
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
                  <DropdownContent className="max-h-[260px] overflow-y-auto">
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
                  <Dropdown className="w-full block" searchable>
                    <DropdownTrigger asChild>
                      <Input
                        type={fieldType === 'number' ? 'number' : 'text'}
                        value={filter.value}
                        onChange={(e) => onUpdate({ ...filter, value: e.target.value })}
                        placeholder={`Enter ${fieldType} value...`}
                        className="h-9 text-[13px] bg-input-background"
                      />
                    </DropdownTrigger>
                    <DropdownContent className="w-full max-h-[260px] overflow-y-auto">
                      {fieldValues.length === 0 ? (
                        <div className="px-3 py-2 text-xs text-muted-foreground italic">
                          No values available
                        </div>
                      ) : (
                        fieldValues.map((value) => (
                          <DropdownItem
                            key={value}
                            onClick={() => {
                              onUpdate({ ...filter, value });
                            }}
                          >
                            <span className="font-mono text-[12.5px] truncate">{value}</span>
                          </DropdownItem>
                        ))
                      )}
                    </DropdownContent>
                  </Dropdown>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </>
  );
};
