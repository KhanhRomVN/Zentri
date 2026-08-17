import React, { useState } from 'react';
import { Trash2, GripVertical, ChevronRight, ChevronDown } from 'lucide-react';
import { Input } from '../../../../../components/ui/Input';
import { cn } from '../../../../../shared/lib/utils';
import { FieldType, Column as ColumnType } from './types';
import FieldPickerModal from '../FieldPickerModal';

interface ColumnCardProps {
  column: ColumnType;
  availableFields: Array<{ name: string; type: FieldType; label: string; tableName?: string }>;
  onUpdate: (column: ColumnType) => void;
  onRemove: () => void;
  isInvalid?: boolean;
}

export const ColumnCard: React.FC<ColumnCardProps> = ({
  column,
  availableFields,
  onUpdate,
  onRemove,
  isInvalid = false,
}) => {
  const [isFieldPickerOpen, setIsFieldPickerOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(true);
  const ToggleIcon = isExpanded ? ChevronDown : ChevronRight;
  const selectedField = availableFields.find((f) => f.name === column.field);
  const fieldName = selectedField
    ? selectedField.name.split('.')[1] || selectedField.name
    : '';
  const defaultColumnName = selectedField
    ? `${fieldName} (${selectedField.tableName})`
    : '';

  return (
    <div
      className={cn(
        'bg-card border rounded-lg transition-colors',
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
                <GripVertical className="w-3.5 h-3.5" />
              </span>
              <span className="text-[11.5px] font-semibold text-text-secondary tracking-wide">
                Column
              </span>
            </>
          ) : (
            <div className="flex items-center gap-2 py-1 text-[13px] text-text-secondary">
              <span className="font-medium text-primary">
                {column.name || defaultColumnName || 'Select field'}
              </span>
              {fieldName && !column.name && (
                <span className="font-mono text-[12px] text-text-secondary/60">{fieldName}</span>
              )}
              {fieldName && column.name && (
                <span className="font-mono text-[12px] text-primary">{fieldName}</span>
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
            onClick={onRemove}
            className="w-[27px] h-[27px] rounded-md border border-transparent bg-transparent text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors flex items-center justify-center"
            title="Xóa cột"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Column inputs grid */}
      {isExpanded && (
        <div className="grid grid-cols-2 gap-2.5">
          {/* Column name */}
          <div className="min-w-0">
            <label className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium block mb-1.5">
              Column name
            </label>
            <Input
              value={column.name}
              onChange={(e) => onUpdate({ ...column, name: e.target.value })}
              placeholder={defaultColumnName || 'Column name'}
              className="h-9 text-[13px] bg-input-background"
            />
          </div>

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
                    {fieldName}{' '}
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
          </div>
        </div>
      )}

      {/* Field Picker Modal */}
      <FieldPickerModal
        open={isFieldPickerOpen}
        onClose={() => setIsFieldPickerOpen(false)}
        onSelect={(fieldKey) => {
          const fieldData = availableFields.find((f) => f.name === fieldKey);
          const selectedFieldName = fieldData
            ? fieldData.name.split('.')[1] || fieldData.name
            : '';
          onUpdate({
            ...column,
            field: fieldKey,
            name: column.name || `${selectedFieldName} (${fieldData?.tableName || ''})`,
          });
          setIsFieldPickerOpen(false);
        }}
        selectedField={column.field}
      />
    </div>
  );
};

export default ColumnCard;