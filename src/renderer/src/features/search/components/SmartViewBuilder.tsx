import { FC, useState } from 'react';
import { SmartView, TableColumn, ColumnType } from '../types/search';
import {
  Plus,
  X,
  GripVertical,
  Type,
  Hash,
  Calendar,
  Shield,
  Link,
  Mail,
  Tags,
} from 'lucide-react';
import { cn } from '../../../shared/lib/utils';

interface SmartViewBuilderProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (view: SmartView) => void;
}

const COLUMN_TYPES: { type: ColumnType; icon: any; label: string }[] = [
  { type: 'text', icon: Type, label: 'Text' },
  { type: 'number', icon: Hash, label: 'Number' },
  { type: 'date', icon: Calendar, label: 'Date' },
  { type: 'status', icon: Shield, label: 'Status' },
  { type: 'link', icon: Link, label: 'Link' },
  { type: 'email', icon: Mail, label: 'Email' },
  { type: 'tags', icon: Tags, label: 'Tags' },
];

const SmartViewBuilder: FC<SmartViewBuilderProps> = ({ isOpen, onClose, onSave }) => {
  const [form, setForm] = useState({
    name: '',
    domain: '',
    color: '#3B82F6',
    description: '',
  });

  const [columns, setColumns] = useState<TableColumn[]>([
    {
      id: 'col_1',
      label: 'Email',
      type: 'email',
      isVisible: true,
      isSortable: true,
      isFilterable: true,
    },
  ]);

  const addColumn = () => {
    const newCol: TableColumn = {
      id: `col_${Date.now()}`,
      label: 'New Column',
      type: 'text',
      isVisible: true,
      isSortable: true,
      isFilterable: true,
    };
    setColumns([...columns, newCol]);
  };

  const removeColumn = (id: string) => {
    setColumns(columns.filter((c) => c.id !== id));
  };

  const updateColumn = (id: string, updates: Partial<TableColumn>) => {
    setColumns(columns.map((c) => (c.id === id ? { ...c, ...updates } : c)));
  };

  const handleSave = () => {
    if (!form.name) return;

    const newView: SmartView = {
      id: form.name.toLowerCase().replace(/\s+/g, '-'),
      ...form,
      columns,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    onSave(newView);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[90] flex justify-end">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-[500px] h-full bg-card border-l border-border shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">
        {/* Drawer Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border/50 shrink-0">
          <div>
            <h3 className="text-sm font-bold text-foreground">Create Smart View</h3>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              Define your custom data pipeline architecture
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted rounded-md transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Drawer Body */}
        <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-8">
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/50">
                View Identity
              </label>
              <input
                type="text"
                placeholder="e.g. Claude.ai Power Users"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="w-full h-10 px-3 rounded-xl bg-input-background border border-border text-sm text-foreground placeholder:text-muted-foreground/40 outline-none transition-colors focus:border-primary/50"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/50">
                  Target Domain
                </label>
                <input
                  type="text"
                  placeholder="claude.ai"
                  value={form.domain}
                  onChange={(e) => setForm({ ...form, domain: e.target.value })}
                  className="w-full h-10 px-3 rounded-xl bg-input-background border border-border text-sm text-foreground placeholder:text-muted-foreground/40 outline-none transition-colors focus:border-primary/50"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/50">
                  Accent Color
                </label>
                <div className="flex items-center gap-2 h-10 px-3 bg-muted/20 border border-border/50 rounded-lg">
                  <input
                    type="color"
                    value={form.color}
                    onChange={(e) => setForm({ ...form, color: e.target.value })}
                    className="w-6 h-6 rounded bg-transparent cursor-pointer"
                  />
                  <span className="text-xs font-mono uppercase">{form.color}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/50">
                Table Architecture (Columns)
              </label>
              <button
                onClick={addColumn}
                className="p-1.5 rounded-lg bg-primary/10 text-primary hover:bg-primary/20 transition-all active:scale-95"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3">
              {columns.map((col) => (
                <div
                  key={col.id}
                  className="group bg-muted/20 border border-border/50 rounded-xl p-3 flex flex-col gap-3 transition-all hover:bg-muted/30"
                >
                  <div className="flex items-center gap-3">
                    <GripVertical className="w-4 h-4 text-muted-foreground/30 cursor-grab active:cursor-grabbing" />
                    <input
                      type="text"
                      placeholder="Column Label"
                      value={col.label}
                      onChange={(e) => updateColumn(col.id, { label: e.target.value })}
                      className="flex-1 border-none bg-transparent h-8 p-0 outline-none font-bold text-sm text-foreground placeholder:text-muted-foreground/40"
                    />
                    <button
                      onClick={() => removeColumn(col.id)}
                      className="p-1.5 text-muted-foreground/30 hover:text-destructive transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {COLUMN_TYPES.map(({ type, icon: Icon, label }) => (
                      <button
                        key={type}
                        onClick={() => updateColumn(col.id, { type })}
                        className={cn(
                          'flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider transition-all border',
                          col.type === type
                            ? 'bg-primary/20 border-primary/30 text-primary'
                            : 'bg-black/20 border-border/20 text-muted-foreground hover:bg-black/40',
                        )}
                      >
                        <Icon className="w-3 h-3" />
                        {label}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Drawer Footer */}
        <div className="flex gap-3 w-full p-4 border-t border-border bg-card/50 shrink-0">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 rounded-lg bg-secondary text-secondary-foreground hover:bg-secondary/80 transition-colors font-semibold border border-border text-xs"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={!form.name}
            className="flex-1 py-2.5 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-all font-semibold text-xs shadow-lg shadow-primary/10 disabled:opacity-50"
          >
            Deploy Smart View
          </button>
        </div>
      </div>
    </div>
  );
};

export default SmartViewBuilder;
