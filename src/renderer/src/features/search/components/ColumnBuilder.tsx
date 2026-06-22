import React, { FC, useState, useRef, useEffect } from 'react';
import { TableColumn, ColumnType, DataField } from '../types/search';
import {
  Plus, X, GripVertical, Search, Hash, Database, ChevronDown,
  Mail, Key, Phone, Calendar, Globe, Shield, Link, Clock, MapPin, Tag,
} from 'lucide-react';
import { cn } from '../../../shared/lib/utils';
import { useAccentColors } from '../../../hooks/useAccentColors';

// Available data fields from the database schema
export const DATA_FIELDS: DataField[] = [
  { key: 'email', label: 'Email', type: 'text', table: 'emails', description: 'Email address' },
  { key: 'password', label: 'Password', type: 'text', table: 'emails', description: 'Account password' },
  { key: 'recoveryEmail', label: 'Recovery Email', type: 'text', table: 'emails', description: 'Backup recovery email' },
  { key: 'phoneNumber', label: 'Phone Number', type: 'text', table: 'emails', description: 'Linked phone number' },
  { key: 'status', label: 'Status', type: 'status', table: 'emails', description: 'Account status' },
  { key: 'createdAt', label: 'Created At', type: 'date', table: 'emails', description: 'Account creation date' },
  { key: 'lastUsedAt', label: 'Last Used', type: 'date', table: 'emails', description: 'Last usage timestamp' },
  { key: 'totpSecretKey', label: 'TOTP Key', type: 'text', table: 'emails', description: '2FA secret key status' },
  { key: 'services.name', label: 'Service Name', type: 'text', table: 'services', description: 'Linked service name' },
  { key: 'services.url', label: 'Service URL', type: 'text', table: 'services', description: 'Service website URL' },
  { key: 'services.username', label: 'Service Username', type: 'text', table: 'services', description: 'Login username' },
  { key: 'services.status', label: 'Service Status', type: 'status', table: 'services', description: 'Link status' },
  { key: 'proxy.host', label: 'Proxy Host', type: 'text', table: 'proxies', description: 'Proxy server address' },
  { key: 'proxy.port', label: 'Proxy Port', type: 'number', table: 'proxies', description: 'Proxy port number' },
  { key: 'proxy.protocol', label: 'Proxy Protocol', type: 'text', table: 'proxies', description: 'HTTP/HTTPS/SOCKS5' },
  { key: 'proxy.country', label: 'Proxy Country', type: 'text', table: 'proxies', description: 'Geo location' },
  { key: 'proxy.city', label: 'Proxy City', type: 'text', table: 'proxies', description: 'City level location' },
];

const FIELD_ICONS: Record<string, any> = {
  email: Mail, password: Key, recoveryEmail: Mail, phoneNumber: Phone,
  status: Shield, createdAt: Calendar, lastUsedAt: Clock, totpSecretKey: Key,
  'services.name': Tag, 'services.url': Link, 'services.username': Mail, 'services.status': Shield,
  'proxy.host': Globe, 'proxy.port': Hash, 'proxy.protocol': Globe, 'proxy.country': MapPin, 'proxy.city': MapPin,
};

const TABLE_COLORS: Record<string, string> = {
  emails: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  services: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  proxies: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
};

export const TYPE_LABELS: Record<ColumnType, string> = {
  text: 'STRING', number: 'NUMBER', date: 'DATE', status: 'STATUS', link: 'STRING', email: 'STRING', tags: 'STRING',
};

// ─── Custom Dropdown (context-menu style) ─────────────────────────────────
interface CustomSelectProps {
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
  placeholder?: string;
}

const CustomSelect: FC<CustomSelectProps> = ({ value, onChange, options, placeholder = 'Select...' }) => {
  const [isOpen, setIsOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const selectedOption = options.find((o) => o.value === value);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="h-8 pl-3 pr-8 rounded-md bg-dropdown-background border border-border text-sm text-foreground outline-none hover:bg-dropdown-item-hover transition-colors flex items-center gap-2 whitespace-nowrap"
      >
        <span className={!selectedOption ? 'text-muted-foreground' : ''}>
          {selectedOption?.label || placeholder}
        </span>
        <ChevronDown className={cn(
          'w-3.5 h-3.5 text-muted-foreground/50 absolute right-2 top-1/2 -translate-y-1/2 transition-transform duration-200',
          isOpen && 'rotate-180',
        )} />
      </button>
      {isOpen && (
        <div className="absolute top-full mt-1 left-0 z-50 bg-dropdown-background border border-border/50 rounded-2xl py-1 min-w-[160px] w-max animate-in fade-in zoom-in-95 duration-100 hover:border-primary transition-colors">
          {options.map((opt) => (
            <button
              key={opt.value}
              onClick={() => { onChange(opt.value); setIsOpen(false); }}
              className={cn(
                'w-full text-left px-3 py-2 text-sm transition-colors whitespace-nowrap',
                opt.value === value
                  ? 'text-foreground bg-primary/10'
                  : 'text-muted-foreground hover:text-foreground hover:bg-dropdown-item-hover',
              )}
            >
              {opt.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

interface ColumnBuilderProps {
  columns: TableColumn[];
  onColumnsChange: (columns: TableColumn[]) => void;
}

// ─── Badge Color Helper ────────────────────────────────────────────────────
let badgeAccentCache: string[] = ['rgb(54, 134, 255)'];

const setBadgeAccentCache = (colors: string[], unified: string) => {
  badgeAccentCache = colors.length > 0 ? colors : [unified];
};

const getBadgeColor = (value: string) => {
  let hash = 0;
  for (let i = 0; i < value.length; i++) {
    hash = value.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % badgeAccentCache.length;
  const color = badgeAccentCache[index] || badgeAccentCache[0] || 'rgb(54, 134, 255)';
  const rgbMatch = color.match(/\d+/g);
  if (rgbMatch && rgbMatch.length >= 3) {
    const r = rgbMatch[0], g = rgbMatch[1], b = rgbMatch[2];
    return {
      base: color,
      bg: `rgba(${r}, ${g}, ${b}, 0.15)`,
      border: `rgba(${r}, ${g}, ${b}, 0.3)`,
    };
  }
  return { base: color, bg: 'rgba(54,134,255,0.15)', border: 'rgba(54,134,255,0.3)' };
};

const ColumnBuilder: FC<ColumnBuilderProps> = ({ columns, onColumnsChange }) => {
  const [fieldSearch, setFieldSearch] = useState('');
  const [showFieldPicker, setShowFieldPicker] = useState(false);
  const [expandedColId, setExpandedColId] = useState<string | null>(null);
  const { accentColors, UNIFIED_ACCENT } = useAccentColors();

  if (typeof accentColors !== 'undefined' && accentColors.length > 0) {
    setBadgeAccentCache(accentColors, UNIFIED_ACCENT);
  }

  const filteredFields = DATA_FIELDS.filter(
    (f) =>
      f.label.toLowerCase().includes(fieldSearch.toLowerCase()) ||
      f.key.toLowerCase().includes(fieldSearch.toLowerCase()) ||
      f.table.toLowerCase().includes(fieldSearch.toLowerCase()),
  );

  const addColumnFromField = (field: DataField) => {
    const newCol: TableColumn = {
      id: `col_${Date.now()}`,
      label: field.label,
      type: field.type,
      field: field.key,
      isVisible: true,
      isSortable: true,
      isFilterable: true,
      template:
        field.type === 'text' || field.type === 'email' || field.type === 'link' || field.type === 'tags'
          ? { operator: '', value: '', sortOrder: 'none' }
          : field.type === 'number' || field.type === 'date'
            ? { operator: undefined, value: '', sortOrder: 'none' }
            : undefined,
    };
    onColumnsChange([...columns, newCol]);
    setExpandedColId(newCol.id);
    setShowFieldPicker(false);
    setFieldSearch('');
  };

  const removeColumn = (id: string) => {
    if (id === 'col_stt') return;
    onColumnsChange(columns.filter((c) => c.id !== id));
    if (expandedColId === id) setExpandedColId(null);
  };

  const toggleColumn = (id: string) => {
    setExpandedColId(expandedColId === id ? null : id);
  };

  const updateColumn = (id: string, updates: Partial<TableColumn>) => {
    onColumnsChange(columns.map((c) => (c.id === id ? { ...c, ...updates } : c)));
  };

  const updateColumnTemplate = (id: string, templateUpdates: Partial<NonNullable<TableColumn['template']>>) => {
    onColumnsChange(
      columns.map((c) =>
        c.id === id ? { ...c, template: { ...c.template, ...templateUpdates } } : c,
      ),
    );
  };

  const inputClass = 'h-10 px-3 rounded-md bg-input-background border border-border text-sm text-foreground placeholder:text-muted-foreground/40 outline-none transition-colors focus:border-primary/50';

  // Filter operator options
  const getFilterOptions = (type: ColumnType) => {
    const base = [
      { value: '', label: 'Không lọc' },
      { value: 'contains', label: 'Chứa' },
      { value: 'equals', label: 'Bằng' },
      { value: 'startsWith', label: 'Bắt đầu với' },
      { value: 'endsWith', label: 'Kết thúc với' },
    ];
    if (type === 'number' || type === 'date') {
      base.push(
        { value: 'greaterThan', label: 'Lớn hơn' },
        { value: 'lessThan', label: 'Nhỏ hơn' },
      );
    }
    return base;
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <label className="text-sm font-semibold text-foreground/80">
          Table Columns <span className="text-red-500">*</span>
        </label>
        <button
          onClick={() => setShowFieldPicker(true)}
          className="w-7 h-7 flex items-center justify-center bg-card-background text-text-secondary rounded-md hover:text-primary hover:bg-primary/50 transition-all active:scale-90 border border-border"
          title="Add Column"
        >
          <Plus className="w-4 h-4" />
        </button>
      </div>

      {/* Field Picker Card */}
      {showFieldPicker && (
        <div className="bg-muted/10 border border-border/50 rounded-md p-4 space-y-3 animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="flex items-center justify-between">
            <span className="text-sm font-bold text-foreground">Select Data Field</span>
            <button
              onClick={() => { setShowFieldPicker(false); setFieldSearch(''); }}
              className="p-1 text-muted-foreground hover:text-foreground rounded transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/50" />
            <input
              type="text"
              placeholder="Search fields..."
              value={fieldSearch}
              onChange={(e) => setFieldSearch(e.target.value)}
              className={cn(inputClass, 'w-full pl-10')}
            />
          </div>
          <div className="max-h-[240px] overflow-y-auto custom-scrollbar space-y-1">
            {filteredFields.map((field) => {
              const Icon = FIELD_ICONS[field.key] || Database;
              const tableColor = TABLE_COLORS[field.table] || TABLE_COLORS.emails;
              const isAlreadyAdded = columns.some((c) => c.field === field.key);
              return (
                <button
                  key={field.key}
                  onClick={() => !isAlreadyAdded && addColumnFromField(field)}
                  disabled={isAlreadyAdded}
                  className={cn(
                    'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-colors group',
                    isAlreadyAdded
                      ? 'opacity-40 cursor-not-allowed grayscale'
                      : 'hover:bg-card-hover',
                  )}
                >
                  <div className={cn('w-8 h-8 rounded-lg flex items-center justify-center shrink-0 border', tableColor)}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-foreground truncate">{field.label}</span>
                      <span className={cn('text-[10px] uppercase tracking-wider font-black px-1.5 py-0.5 rounded border', tableColor)}>
                        {field.table}
                      </span>
                    </div>
                    <span className="text-xs text-muted-foreground/50 mt-0.5 block">
                      {isAlreadyAdded ? 'Already added' : field.description}
                    </span>
                  </div>
                  {isAlreadyAdded ? (
                    <span className="text-[10px] text-muted-foreground/40 font-bold shrink-0">Added</span>
                  ) : (
                    <Plus className="w-4 h-4 text-muted-foreground/20 group-hover:text-primary transition-colors shrink-0" />
                  )}
                </button>
              );
            })}
            {filteredFields.length === 0 && (
              <div className="text-center py-4 text-sm text-muted-foreground/40">No fields found</div>
            )}
          </div>
        </div>
      )}

      {/* Column Cards */}
      <div className="space-y-2">
        {columns.map((col) => {
          const isSTT = col.id === 'col_stt';
          const isExpanded = expandedColId === col.id;
          const hasTemplate = !isSTT && col.template;
          const fieldIcon = col.field ? FIELD_ICONS[col.field] || Hash : Hash;

          return (
            <div
              key={col.id}
              className="group bg-muted/20 border border-border/50 rounded-md transition-all hover:bg-muted/30"
            >
              <button
                onClick={() => !isSTT && toggleColumn(col.id)}
                className={cn('w-full flex items-center gap-3 p-3 text-left', !isSTT && 'cursor-pointer')}
              >
                <GripVertical className="w-4 h-4 text-muted-foreground/30 shrink-0" />
                <div className="w-7 h-7 rounded-md bg-primary/10 flex items-center justify-center shrink-0">
                  {React.createElement(fieldIcon, { className: 'w-3.5 h-3.5 text-primary/70' })}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm text-foreground truncate">{col.label}</span>
                    <span className="text-[9px] uppercase tracking-wider font-black px-1.5 py-0.5 rounded bg-primary/10 text-primary/60">
                      {TYPE_LABELS[col.type]}
                    </span>
                    {isSTT && <span className="text-[9px] text-muted-foreground/40 font-mono">auto-increment</span>}
                  </div>
                </div>
                {!isSTT && (
                  <button
                    onClick={(e) => { e.stopPropagation(); removeColumn(col.id); }}
                    className="p-1 text-muted-foreground/20 hover:text-error transition-colors opacity-0 group-hover:opacity-100"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </button>

              {/* Template config - expanded */}
              {!isSTT && isExpanded && hasTemplate && (
                <>
                  <div className="border-t border-divider" />
                  <div className="px-3 pb-3 pt-2 space-y-2">
                    {/* Filter row — only for string-like types */}
                    {(col.type === 'text' || col.type === 'email' || col.type === 'link' || col.type === 'tags' || col.type === 'status') && (
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <span className="text-[11px] uppercase tracking-wider text-muted-foreground/50 font-black w-10 shrink-0">
                            Filter
                          </span>
                          <CustomSelect
                            value={col.template?.operator || ''}
                            onChange={(val) => updateColumnTemplate(col.id, { operator: (val as any) || undefined })}
                            options={getFilterOptions(col.type)}
                            placeholder="Không lọc"
                          />
                          {col.template?.operator && (
                            <input
                              type="text"
                              placeholder="Nhập giá trị..."
                              value={col.template?.value || ''}
                              onChange={(e) => updateColumnTemplate(col.id, { value: e.target.value })}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter' && col.template?.value?.trim()) {
                                  const currentValues = col.template?.values || [];
                                  if (!currentValues.includes(col.template.value!.trim())) {
                                    updateColumnTemplate(col.id, {
                                      values: [...currentValues, col.template.value!.trim()],
                                      value: '',
                                    });
                                  }
                                }
                              }}
                              className={cn(inputClass, 'h-8 flex-1')}
                            />
                          )}
                        </div>
                        {/* Badge values — aligned under input, hide when "Không lọc" */}
                        {col.template?.operator && col.template?.values && col.template.values.length > 0 && (
                          <div className="flex gap-2">
                            <span className="w-10 shrink-0" />
                            <div className="flex flex-wrap gap-1.5 flex-1 min-w-0">
                              {col.template.values.map((val, idx) => {
                                const badgeColor = getBadgeColor(val);
                                return (
                                <span
                                  key={idx}
                                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium border max-w-full truncate"
                                  style={{
                                    backgroundColor: badgeColor.bg,
                                    color: badgeColor.base,
                                    borderColor: badgeColor.border,
                                  }}
                                >
                                  <span className="truncate">{val}</span>
                                  <button
                                    onClick={() => {
                                      const newValues = (col.template?.values || []).filter((_, i) => i !== idx);
                                      updateColumnTemplate(col.id, { values: newValues });
                                    }}
                                    className="ml-0.5 hover:text-error transition-colors shrink-0"
                                  >
                                    <X className="w-3 h-3" />
                                  </button>
                                </span>
                                );
                              })}
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Sort row — only for numeric types */}
                    {(col.type === 'number' || col.type === 'date') && (
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] uppercase tracking-wider text-muted-foreground/50 font-black w-10 shrink-0">
                        Sort
                      </span>
                      <div className="flex gap-1.5">
                        <button
                          onClick={() => updateColumnTemplate(col.id, { sortOrder: col.template?.sortOrder === 'asc' ? 'none' : 'asc' })}
                          className={cn(
                            'px-3 h-8 rounded-md text-xs font-bold border transition-all',
                            col.template?.sortOrder === 'asc'
                              ? 'bg-emerald-500/20 border-emerald-500/30 text-emerald-400'
                              : 'bg-dropdown-background border-border text-muted-foreground hover:bg-dropdown-item-hover',
                          )}
                        >
                          ↑ Asc
                        </button>
                        <button
                          onClick={() => updateColumnTemplate(col.id, { sortOrder: col.template?.sortOrder === 'desc' ? 'none' : 'desc' })}
                          className={cn(
                            'px-3 h-8 rounded-md text-xs font-bold border transition-all',
                            col.template?.sortOrder === 'desc'
                              ? 'bg-blue-500/20 border-blue-500/30 text-blue-400'
                              : 'bg-dropdown-background border-border text-muted-foreground hover:bg-dropdown-item-hover',
                          )}
                        >
                          ↓ Desc
                        </button>
                      </div>
                    </div>
                    )}
                  </div>
                </>
              )}

              {/* Status type: preset values */}
              {!isSTT && isExpanded && col.type === 'status' && (
                <>
                  <div className="border-t border-divider" />
                  <div className="px-3 pb-3 pt-2 flex items-center gap-2">
                    <span className="text-[11px] uppercase tracking-wider text-muted-foreground/50 font-black w-10 shrink-0">
                      Values
                    </span>
                    <div className="flex gap-1.5">
                      {['active', 'inactive', 'pending'].map((val) => (
                        <button
                          key={val}
                          onClick={() => {
                            const current = col.presetValues || [];
                            const next = current.includes(val) ? current.filter((v) => v !== val) : [...current, val];
                            updateColumn(col.id, { presetValues: next });
                          }}
                          className={cn(
                            'px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider border transition-colors',
                            (col.presetValues || []).includes(val)
                              ? 'bg-primary/20 border-primary/30 text-primary'
                              : 'bg-transparent border-border text-muted-foreground hover:border-primary/30',
                          )}
                        >
                          {val}
                        </button>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ColumnBuilder;