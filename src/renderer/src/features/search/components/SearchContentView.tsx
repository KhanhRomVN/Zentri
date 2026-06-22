import { FC, useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
  Table,
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

interface SearchContentViewProps {
  selectedView: SmartView | null;
  onOpenAddView: () => void;
}

let accentColorsCache: string[] = ['rgb(54, 134, 255)'];
let unifiedAccentCache = 'rgb(54, 134, 255)';

const setAccentColorsForSearch = (colors: string[], unified: string) => {
  accentColorsCache = colors.length > 0 ? colors : [unified];
  unifiedAccentCache = unified;
};

const getViewColor = (viewId: string) => {
  let hash = 0;
  for (let i = 0; i < viewId.length; i++) {
    hash = viewId.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % accentColorsCache.length;
  const color = accentColorsCache[index] || accentColorsCache[0] || unifiedAccentCache;
  const rgbMatch = color.match(/\d+/g);
  if (rgbMatch && rgbMatch.length >= 3) {
    const r = rgbMatch[0],
      g = rgbMatch[1],
      b = rgbMatch[2];
    return {
      base: color,
      bg: `rgba(${r}, ${g}, ${b}, 0.08)`,
      border: `rgba(${r}, ${g}, ${b}, 0.2)`,
    };
  }
  return { base: color, bg: 'var(--sidebar-item-hover)', border: 'var(--divider)' };
};

// ─── Helpers to resolve field values from a row ────────────────────────────
const getFieldValue = (row: any, field: string): string => {
  if (!field || field === '_stt') return '';

  // Direct email fields
  const emailFields = [
    'email',
    'password',
    'recoveryEmail',
    'phoneNumber',
    'status',
    'createdAt',
    'lastUsedAt',
    'totpSecretKey',
  ];
  if (emailFields.includes(field)) {
    const val = row[field];
    if (val === null || val === undefined) return '—';
    if (field === 'createdAt' || field === 'lastUsedAt') {
      try {
        return new Date(val).toLocaleDateString();
      } catch {
        return String(val);
      }
    }
    return String(val);
  }

  // Service fields (from linked services)
  if (field.startsWith('services.')) {
    const serviceField = field.replace('services.', '');
    const services = row._services || [];
    if (services.length === 0) return '—';
    const firstService = services[0];
    const val = firstService[serviceField];
    if (val === null || val === undefined) return '—';
    return String(val);
  }

  // Proxy fields
  if (field.startsWith('proxy.')) {
    const proxyField = field.replace('proxy.', '');
    const proxy = row._proxy;
    if (!proxy) return '—';
    const val = proxy[proxyField];
    if (val === null || val === undefined) return '—';
    return String(val);
  }

  return '—';
};

const SearchContentView: FC<SearchContentViewProps> = ({ selectedView }) => {
  const { accentColors, UNIFIED_ACCENT } = useAccentColors();
  const [tableSearch, setTableSearch] = useState('');
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [avatars, setAvatars] = useState<Record<string, string>>({});

  if (typeof accentColors !== 'undefined' && accentColors.length > 0) {
    setAccentColorsForSearch(accentColors, UNIFIED_ACCENT);
  }

  const viewColor = selectedView ? getViewColor(selectedView.id) : null;

  // ─── Fetch data when selectedView changes ──────────────────────────────
  const loadData = useCallback(async () => {
    if (!selectedView) return;
    setLoading(true);
    try {
      let emailRows: any[] = [];
      let serviceLinks: any[] = [];

      if (selectedView.source === 'service' && selectedView.serviceId) {
        // Fetch emails linked to this specific service
        // @ts-ignore
        const [rows, links] = await Promise.all([
          window.electron.ipcRenderer.invoke(
            'sqlite:all',
            `SELECT e.* FROM emails e
             JOIN service_emails se ON se.email_id = e.id
             WHERE se.service_id = ?
             ORDER BY e.created_at DESC`,
            [selectedView.serviceId],
          ),
          window.electron.ipcRenderer.invoke(
            'sqlite:all',
            `SELECT se.*, s.name as serviceName, s.url as serviceUrl
             FROM service_emails se 
             JOIN services s ON se.service_id = s.id
             WHERE se.service_id = ?`,
            [selectedView.serviceId],
          ),
        ]);
        emailRows = rows || [];
        serviceLinks = links || [];
      } else {
        // Fetch all emails (for manual views)
        // @ts-ignore
        [emailRows, serviceLinks] = await Promise.all([
          window.electron.ipcRenderer.invoke(
            'sqlite:all',
            'SELECT * FROM emails ORDER BY created_at DESC',
          ),
          window.electron.ipcRenderer.invoke(
            'sqlite:all',
            `SELECT se.*, s.name as serviceName, s.url as serviceUrl
             FROM service_emails se 
             JOIN services s ON se.service_id = s.id`,
          ),
        ]);
      }

      // Map service links to each email row
      const rowsWithServices = (emailRows || []).map((row: any) => {
        const linkedServices = (serviceLinks || [])
          .filter((link: any) => link.email_id === row.id)
          .map((link: any) => ({
            name: link.serviceName,
            url: link.serviceUrl,
            username: link.username,
            password: link.password,
            notes: link.notes,
          }));
        return {
          ...row,
          _services: linkedServices,
          _proxy: row.proxyHost
            ? {
                host: row.proxyHost,
                port: row.proxyPort,
                protocol: row.proxyProtocol,
                country: row.proxyCountry,
                city: row.proxyCity,
              }
            : null,
        };
      });

      setRows(rowsWithServices);
    } catch (err) {
      console.error('Failed to load search data:', err);
      setRows([]);
    }
    setLoading(false);
  }, [selectedView]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Fetch avatars for email rows
  useEffect(() => {
    const fetchAvatars = async () => {
      const newAvatars: Record<string, string> = { ...avatars };
      let changed = false;
      for (const row of rows) {
        if (row.email && !newAvatars[row.email]) {
          try {
            // @ts-ignore
            const avatarUrl = await window.electron.ipcRenderer.invoke('email:get-avatar', {
              email: row.email,
            });
            if (avatarUrl) {
              newAvatars[row.email] = avatarUrl;
              changed = true;
            } else {
              const seed = row.email.split('@')[0];
              newAvatars[row.email] = `https://api.dicebear.com/7.x/avataaars/svg?seed=${seed}`;
              changed = true;
            }
          } catch {
            const seed = row.email.split('@')[0];
            newAvatars[row.email] = `https://api.dicebear.com/7.x/avataaars/svg?seed=${seed}`;
            changed = true;
          }
        }
      }
      if (changed) setAvatars(newAvatars);
    };
    if (rows.length > 0) fetchAvatars();
  }, [rows]);

  if (!selectedView) {
    return (
      <div className="flex-1 flex items-center justify-center opacity-20">
        <span className="text-[10px] font-black uppercase tracking-[0.4em] animate-pulse">
          Select a view to begin
        </span>
      </div>
    );
  }

  const visibleColumns = selectedView.columns.filter((c) => c.isVisible);

  // Filter rows by search query
  const filteredRows = tableSearch
    ? rows.filter((row) => {
        return visibleColumns.some((col) => {
          const val = getFieldValue(row, col.field || '');
          return val.toLowerCase().includes(tableSearch.toLowerCase());
        });
      })
    : rows;

  return (
    <motion.div
      key={selectedView.id}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="flex-1 flex flex-col h-full overflow-hidden"
    >
      {/* View Header */}
      <div className="h-[48px] shrink-0 border-b border-border/50 flex items-center justify-between px-4">
        <div className="flex items-center gap-2 min-w-0">
          <div
            className="w-7 h-7 rounded flex items-center justify-center shrink-0 border"
            style={{
              backgroundColor: viewColor?.bg || 'transparent',
              borderColor: viewColor?.base || 'transparent',
            }}
          >
            {(() => {
              const ViewIcon = selectedView.icon ? ICON_MAP[selectedView.icon] : null;
              if (ViewIcon) {
                return (
                  <ViewIcon className="w-[18px] h-[18px]" style={{ color: viewColor?.base }} />
                );
              }
              if (selectedView.domain) {
                return (
                  <img
                    src={`https://www.google.com/s2/favicons?domain=${selectedView.domain}&sz=32`}
                    alt=""
                    className="w-4 h-4"
                  />
                );
              }
              return <Table className="w-[18px] h-[18px]" style={{ color: viewColor?.base }} />;
            })()}
          </div>
          <span className="text-sm font-bold truncate text-text-primary">{selectedView.name}</span>
          <span className="text-[10px] text-muted-foreground/50 ml-1">
            {filteredRows.length} records
          </span>
        </div>
        <div className="relative w-64 shrink-0">
          <input
            type="text"
            placeholder="Search terms..."
            value={tableSearch}
            onChange={(e) => setTableSearch(e.target.value)}
            className="w-full h-9 pl-3 pr-3 rounded-md bg-input-background border border-border text-sm text-foreground placeholder:text-text-secondary outline-none"
          />
        </div>
      </div>

      {/* Table */}
      <div className="flex-1 overflow-auto custom-scrollbar">
        {loading ? (
          <div className="flex items-center justify-center h-full opacity-30">
            <span className="text-[10px] font-black uppercase tracking-[0.4em] animate-pulse">
              Loading...
            </span>
          </div>
        ) : (
          <table className="border-collapse w-full">
            <thead className="sticky top-0 z-20">
              <tr className="bg-table-header-background border-b border-border/50">
                {visibleColumns.map((col) => {
                  const isSTT = col.id === 'col_stt';
                  return (
                    <th
                      key={col.id}
                      style={isSTT ? { width: '1%' } : undefined}
                      className={`py-2 text-[10px] uppercase tracking-[0.2em] font-bold text-muted-foreground whitespace-nowrap ${isSTT ? 'text-center px-2' : 'text-left px-4'}`}
                    >
                      {col.label}
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody>
              {filteredRows.map((row, rowIdx) => (
                <tr
                  key={row.id || rowIdx}
                  className="border-b border-border/20 h-[40px] hover:bg-table-row-hover transition-colors"
                >
                  {visibleColumns.map((col) => {
                    const isSTT = col.id === 'col_stt';
                    const isEmailCol = col.field === 'email' || col.type === 'email';
                    const fieldValue = isSTT ? '' : getFieldValue(row, col.field || '');
                    return (
                      <td
                        key={col.id}
                        className={`py-1 text-sm text-foreground/80 truncate ${isSTT ? 'text-center px-2' : 'px-4'}`}
                      >
                        {isSTT ? (
                          <span className="font-mono text-xs text-muted-foreground">
                            {rowIdx + 1}
                          </span>
                        ) : isEmailCol && row.email ? (
                          <span className="flex items-center gap-2 truncate">
                            {avatars[row.email] ? (
                              <img
                                src={avatars[row.email]}
                                alt=""
                                className="w-5 h-5 rounded-full shrink-0 object-cover"
                              />
                            ) : (
                              <div className="w-5 h-5 rounded-full bg-muted shrink-0" />
                            )}
                            <span className="truncate">{fieldValue}</span>
                          </span>
                        ) : (
                          <span>{fieldValue}</span>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
              {filteredRows.length === 0 && !loading && (
                <tr>
                  <td
                    colSpan={visibleColumns.length}
                    className="text-center py-12 text-muted-foreground/40 text-sm"
                  >
                    No data found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}

        {visibleColumns.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full opacity-30">
            <Table className="w-12 h-12 mb-4" />
            <span className="text-[10px] font-black uppercase tracking-[0.2em]">
              No columns defined
            </span>
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default SearchContentView;
