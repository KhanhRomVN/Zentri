import { FC, useState } from 'react';
import { Drawer } from '../../../shared/components/ui/drawer';
import { SmartView, TableColumn, ColumnType } from '../types/search';
import {
  Plus,
  X,
  GripVertical,
  Check,
  Type,
  Hash,
  Calendar,
  Shield,
  Link,
  Mail,
  Tags,
} from 'lucide-react';
import Input from '../../../shared/components/ui/input/Input';
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

  return (
    <Drawer
      isOpen={isOpen}
      onClose={onClose}
      direction="right"
      width={500}
      title="Create Smart View"
      subtitle="Define your custom data pipeline architecture"
      footerActions={
        <div className="flex gap-3 w-full p-4 border-t border-border bg-card/50">
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
      }
    >
      <div className="p-6 space-y-8 h-full overflow-y-auto custom-scrollbar">
        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/50">
              View Identity
            </label>
            <Input
              placeholder="e.g. Claude.ai Power Users"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/50">
                Target Domain
              </label>
              <Input
                placeholder="claude.ai"
                value={form.domain}
                onChange={(e) => setForm({ ...form, domain: e.target.value })}
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
            {columns.map((col, index) => (
              <div
                key={col.id}
                className="group bg-muted/20 border border-border/50 rounded-xl p-3 flex flex-col gap-3 transition-all hover:bg-muted/30"
              >
                <div className="flex items-center gap-3">
                  <GripVertical className="w-4 h-4 text-muted-foreground/30 cursor-grab active:cursor-grabbing" />
                  <Input
                    placeholder="Column Label"
                    value={col.label}
                    onChange={(e) => updateColumn(col.id, { label: e.target.value })}
                    className="flex-1 border-none bg-transparent h-8 p-0 focus:ring-0 font-bold"
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
    </Drawer>
  );
};

export default SmartViewBuilder;
