import { FC, useState, useRef, useEffect } from 'react';
import { SmartView, TableColumn } from '../../types/search';
import {
  X,
  Search,
  Smile,
  Mail,
  Users,
  Database,
  Star,
  Heart,
  Zap,
  Shield,
  Globe,
  Key,
  Lock,
  Bell,
  Calendar,
  Clock,
  Tag,
  Award,
  Bookmark,
  Camera,
  Cloud,
  Code,
  Eye,
  Flag,
  Gift,
  Hash,
  Home,
  Image,
  Link,
  Map,
  Moon,
  Music,
  Package,
  Phone,
  Power,
  Settings,
  Sun,
  Table,
  Target,
  Truck,
  User,
  Video,
  Wifi,
  Wind,
  Layers,
  Command,
  Crown,
  Feather,
  TrendingUp,
  Umbrella,
} from 'lucide-react';
import ColumnBuilder from './ColumnBuilder';
import { Button } from '@renderer/components/ui/Button';
import { Drawer, DrawerBody, DrawerFooter, DrawerHeader } from '@renderer/components/ui/Drawer';
import { cn } from '@renderer/shared/lib/utils';

// Icon map: name → component
const ICON_MAP: Record<string, React.ComponentType<any>> = {
  Mail,
  Users,
  Database,
  Star,
  Heart,
  Zap,
  Shield,
  Globe,
  Key,
  Lock,
  Bell,
  Calendar,
  Clock,
  Tag,
  Award,
  Bookmark,
  Camera,
  Cloud,
  Code,
  Eye,
  Flag,
  Gift,
  Hash,
  Home,
  Image,
  Link,
  Map,
  Moon,
  Music,
  Package,
  Phone,
  Power,
  Settings,
  Sun,
  Table,
  Target,
  Truck,
  User,
  Video,
  Wifi,
  Wind,
  Layers,
  Command,
  Crown,
  Feather,
  TrendingUp,
  Umbrella,
};

interface ViewEditorDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (view: SmartView) => void;
  editView?: SmartView | null;
}

const ViewEditorDrawer: FC<ViewEditorDrawerProps> = ({ isOpen, onClose, onSave, editView }) => {
  const [form, setForm] = useState({ name: '', description: '', icon: '' });
  const [iconSearch, setIconSearch] = useState('');
  const [showIconPicker, setShowIconPicker] = useState(false);
  const iconRef = useRef<HTMLDivElement>(null);
  const [columns, setColumns] = useState<TableColumn[]>([
    {
      id: 'col_stt',
      label: 'STT',
      type: 'number',
      field: '_stt',
      isVisible: true,
      isSortable: false,
      isFilterable: false,
    },
  ]);

  // Pre-populate form when editing
  useEffect(() => {
    if (editView) {
      setForm({
        name: editView.name || '',
        description: editView.description || '',
        icon: editView.icon || '',
      });
      setColumns(
        editView.columns || [
          {
            id: 'col_stt',
            label: 'STT',
            type: 'number',
            field: '_stt',
            isVisible: true,
            isSortable: false,
            isFilterable: false,
          },
        ],
      );
    } else {
      setForm({ name: '', description: '', icon: '' });
      setColumns([
        {
          id: 'col_stt',
          label: 'STT',
          type: 'number',
          field: '_stt',
          isVisible: true,
          isSortable: false,
          isFilterable: false,
        },
      ]);
    }
  }, [editView, isOpen]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (iconRef.current && !iconRef.current.contains(e.target as Node)) {
        setShowIconPicker(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filteredIconNames = Object.keys(ICON_MAP).filter((name) =>
    name.toLowerCase().includes(iconSearch.toLowerCase()),
  );

  const SelectedIcon = form.icon ? ICON_MAP[form.icon] : null;

  const handleSave = () => {
    if (!form.name) return;

    const newView: SmartView = {
      id: editView ? editView.id : form.name.toLowerCase().replace(/\s+/g, '-'),
      name: form.name,
      color: editView?.color || '#3B82F6',
      icon: form.icon || undefined,
      description: form.description,
      columns,
      createdAt: editView?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    onSave(newView);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <Drawer isOpen={isOpen} onClose={onClose} position="right" width="624px">
      <DrawerHeader
        title={editView ? 'Edit Smart View' : 'Create Smart View'}
        description={
          editView
            ? 'Modify your custom data pipeline architecture'
            : 'Define your custom data pipeline architecture'
        }
        onClose={onClose}
      />

      <DrawerBody className="space-y-6">
        {/* Name + Icon Picker */}
        <div className="space-y-2">
          <label className="text-sm font-semibold text-foreground/80">
            Name <span className="text-red-500">*</span>
          </label>
          <div className="flex items-center gap-2">
            <div className="relative" ref={iconRef}>
              <button
                onClick={() => setShowIconPicker(!showIconPicker)}
                className="w-10 h-10 shrink-0 flex items-center justify-center rounded-md bg-card-background border border-border text-text-secondary hover:text-primary transition-colors"
                title="Choose icon"
              >
                {SelectedIcon ? (
                  <SelectedIcon className="w-5 h-5" />
                ) : (
                  <Smile className="w-4 h-4" />
                )}
              </button>
              {showIconPicker && (
                <div className="absolute top-full mt-1 left-0 z-50 bg-dropdown-background border border-border/50 rounded-2xl shadow-2xl p-3 w-[320px] animate-in fade-in zoom-in-95 duration-100 hover:border-primary transition-colors">
                  <div className="relative mb-2">
                    <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground/50" />
                    <input
                      type="text"
                      placeholder="Search icons..."
                      value={iconSearch}
                      onChange={(e) => setIconSearch(e.target.value)}
                      className="w-full h-7 pl-8 pr-2 rounded-md bg-input-background border border-border text-xs text-foreground placeholder:text-text-secondary outline-none"
                    />
                  </div>
                  <div className="grid grid-cols-8 gap-1 max-h-[200px] overflow-y-auto custom-scrollbar">
                    <button
                      onClick={() => {
                        setForm({ ...form, icon: '' });
                        setShowIconPicker(false);
                      }}
                      className={cn(
                        'w-8 h-8 flex items-center justify-center rounded-md transition-colors',
                        !form.icon
                          ? 'bg-primary/20 text-primary'
                          : 'text-muted-foreground hover:bg-dropdown-item-hover',
                      )}
                      title="None"
                    >
                      <X className="w-3 h-3" />
                    </button>
                    {filteredIconNames.map((iconName) => {
                      const IconComponent = ICON_MAP[iconName];
                      return (
                        <button
                          key={iconName}
                          onClick={() => {
                            setForm({ ...form, icon: iconName });
                            setShowIconPicker(false);
                          }}
                          className={cn(
                            'w-8 h-8 flex items-center justify-center rounded-md transition-colors',
                            form.icon === iconName
                              ? 'bg-primary/20 text-primary'
                              : 'text-foreground hover:bg-dropdown-item-hover',
                          )}
                          title={iconName}
                        >
                          <IconComponent className="w-4 h-4" />
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
            <input
              type="text"
              placeholder="e.g. Claude.ai Power Users"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="flex-1 h-10 px-3 rounded-md bg-input-background border border-border text-sm text-foreground placeholder:text-muted-foreground/40 outline-none transition-colors focus:border-primary/50"
            />
          </div>
        </div>

        {/* Description */}
        <div className="space-y-2">
          <label className="text-sm font-semibold text-foreground/80">Description</label>
          <input
            type="text"
            placeholder="Optional description..."
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            className="w-full h-10 px-3 rounded-md bg-input-background border border-border text-sm text-foreground placeholder:text-muted-foreground/40 outline-none transition-colors focus:border-primary/50"
          />
        </div>

        {/* Table Columns */}
        <ColumnBuilder columns={columns} onColumnsChange={setColumns} />
      </DrawerBody>

      <DrawerFooter className="justify-end">
        <Button variant="outline" size="sm" onClick={onClose}>
          Cancel
        </Button>
        <Button variant="soft" size="sm" disabled={!form.name} onClick={handleSave}>
          Deploy Smart View
        </Button>
      </DrawerFooter>
    </Drawer>
  );
};

export default ViewEditorDrawer;