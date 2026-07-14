import { FC, useState } from 'react';
import { cn } from '../../../shared/lib/utils';
import {
  Search,
  Plus,
  Table,
  Pencil,
  Trash2,
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
import { SmartView } from '../types/search';
import { useAccentColors } from '../../../hooks/useAccentColors';
import {
  Dropdown,
  DropdownTrigger,
  DropdownContent,
  DropdownItem,
} from '../../../components/ui/Dropdown';

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

interface LeftPanelProps {
  selectedViewId: string | null;
  onSelectView: (id: string) => void;
  views: SmartView[];
  onOpenAddView: () => void;
  onEditView?: (view: SmartView) => void;
  onDeleteView?: (id: string) => void;
  onFavoriteView?: (id: string) => void;
}

// ─── Color Helper ──────────────────────────────────────────────────────────
const setAccentColorsForLeftPanel = (colors: string[], unified: string) => {
  // Cache for potential future use
  return colors.length > 0 ? colors : [unified];
};

const LeftPanel: FC<LeftPanelProps> = ({
  selectedViewId,
  onSelectView,
  views,
  onOpenAddView,
  onEditView,
  onDeleteView,
  onFavoriteView,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [openDropdownId, setOpenDropdownId] = useState<string | null>(null);
  const { accentColors, UNIFIED_ACCENT } = useAccentColors();

  // Update the global color cache for getItemColor
  if (typeof accentColors !== 'undefined' && accentColors.length > 0) {
    setAccentColorsForLeftPanel(accentColors, UNIFIED_ACCENT);
  }

  // Views are already sorted by SearchManager (manual > service, favorites, recent, account count, alphabetical)
  // Only filter by search query here, do NOT re-sort
  const filteredViews = views.filter((v) =>
    v.name.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  return (
    <div className="w-[360px] shrink-0 border-r border-border bg-card/50 backdrop-blur-xl flex flex-col relative z-20 transition-all duration-500">
      {/* Searchbar + Add Button */}
      <div className="h-10 flex items-center gap-2 px-3 border-b border-border/50">
        <div className="flex-1 relative flex items-center h-[30px] bg-input-background border border-border rounded-md transition-all duration-300">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search views..."
            className="w-full h-full pl-3 pr-3 bg-transparent text-sm text-foreground placeholder:text-text-secondary outline-none rounded-md"
          />
        </div>
        <button
          onClick={onOpenAddView}
          className="w-[30px] h-[30px] shrink-0 flex items-center justify-center bg-card-background text-text-secondary rounded-md hover:text-primary hover:bg-primary/50 transition-all active:scale-90 border border-border group"
          title="Add Smart View"
        >
          <Plus className="w-4 h-4 transition-transform group-hover:rotate-90 duration-500" />
        </button>
      </div>

      {/* Views List */}
      <div className="flex-1 overflow-y-auto custom-scrollbar py-2">
        <div className="flex flex-col gap-1 px-2">
          {filteredViews.length === 0 && searchQuery && (
            <div className="flex flex-col items-center justify-center p-12 mt-10 opacity-20">
              <Search className="w-10 h-10 mb-4" />
              <span className="text-[10px] font-black uppercase  text-center">Unseen View</span>
            </div>
          )}

          {filteredViews.map((view) => {
            const ViewIcon = view.icon ? ICON_MAP[view.icon] : null;
            const isOpen = openDropdownId === view.id;
            return (
              <Dropdown
                key={view.id}
                open={isOpen}
                onOpenChange={(open) => {
                  if (!open) {
                    setOpenDropdownId(null);
                  }
                }}
                className="w-full"
              >
                <DropdownTrigger asChild>
                  <button
                    onClick={() => onSelectView(view.id)}
                    onContextMenu={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setOpenDropdownId(view.id);
                    }}
                    className={cn(
                      'group relative flex items-center gap-3 px-3 py-1 rounded-lg transition-all duration-200 outline-none text-left w-full',
                      selectedViewId === view.id
                        ? 'text-foreground bg-card-background'
                        : 'text-muted-foreground hover:text-foreground hover:bg-card-hover',
                    )}
                  >
                    <div className="w-[26px] h-[26px] shrink-0 flex items-center justify-center transition-transform duration-200 group-hover:scale-110">
                      {ViewIcon ? (
                        <ViewIcon className="w-4 h-4 text-foreground/70" />
                      ) : view.domain ? (
                        <img
                          src={`https://www.google.com/s2/favicons?domain=${view.domain}&sz=64`}
                          alt={view.name}
                          className="w-4 h-4 object-contain"
                        />
                      ) : (
                        <Table className="w-5 h-5 text-foreground/70" />
                      )}
                    </div>

                    <div className="flex flex-col items-start min-w-0 flex-1">
                      <div className="flex items-center gap-1.5 w-full">
                        <span className="text-[13px] font-bold tracking-tight truncate text-text-primary">
                          {view.name}
                        </span>
                        {view.favorite && (
                          <Star className="w-3 h-3 text-amber-400 fill-amber-400 shrink-0" />
                        )}
                        {view.source === 'service' && view.accountCount !== undefined && (
                          <span className="text-[10px] font-mono text-muted-foreground/50 ml-auto shrink-0">
                            {view.accountCount}
                          </span>
                        )}
                      </div>
                      {view.description && (
                        <span className="text-[10px] text-muted-foreground/40 truncate w-full mt-0.5">
                          {view.description}
                        </span>
                      )}
                    </div>
                  </button>
                </DropdownTrigger>
                <DropdownContent>
                  <DropdownItem
                    onClick={() => {
                      onFavoriteView?.(view.id);
                      setOpenDropdownId(null);
                    }}
                  >
                    <Star
                      className={`w-3.5 h-3.5 text-amber-400 ${view.favorite ? 'fill-amber-400' : ''}`}
                    />
                    {view.favorite ? 'Unfavorite' : 'Favorite'}
                  </DropdownItem>
                  {view.source !== 'service' && (
                    <>
                      <div className="h-px bg-divider my-1" />
                      <DropdownItem
                        onClick={() => {
                          onEditView?.(view);
                          setOpenDropdownId(null);
                        }}
                      >
                        <Pencil className="w-3.5 h-3.5 text-blue-500/50" />
                        Edit
                      </DropdownItem>
                      <div className="h-px bg-divider my-1" />
                      <DropdownItem
                        className="text-error focus:text-error focus:bg-error/10"
                        onClick={() => {
                          onDeleteView?.(view.id);
                          setOpenDropdownId(null);
                        }}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        Delete
                      </DropdownItem>
                    </>
                  )}
                </DropdownContent>
              </Dropdown>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default LeftPanel;
