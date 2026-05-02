import React, { FC, useState, useEffect, useMemo, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import ProfileLaunchModal from '../modals/ProfileLaunchModal';
import {
  Database,
  Clock,
  Search,
  ChevronRight,
  RefreshCw,
  Trash2,
  ExternalLink,
  ChevronLeft,
} from 'lucide-react';

interface SessionsTabProps {
  email: string;
  accountId: string;
}

interface RAW_SessionData {
  domain: string;
  count: number;
  expiryDate: string;
}

interface GroupedSession {
  baseDomain: string;
  totalCookies: number;
  latestExpiry: string;
  subdomains: RAW_SessionData[];
}

// Google and common service domain mapping
const DOMAIN_GROUPS: Record<string, string> = {
  'doubleclick.net': 'google.com',
  'gstatic.com': 'google.com',
  'googleusercontent.com': 'google.com',
  'googlevideo.com': 'google.com',
  'google.com.vn': 'google.com',
  'com.vn': 'google.com', // Often happens with .google.com.vn cookies
  'youtube.com': 'google.com',
  'ggpht.com': 'google.com',
};

const getBaseDomain = (domain: string): string => {
  const clean = domain.replace(/^\./, '').toLowerCase();

  // Check for explicit mappings first
  for (const [key, value] of Object.entries(DOMAIN_GROUPS)) {
    if (clean.endsWith(key)) return value;
  }

  // Handle generic multi-part TLDs (com.vn, net.vn, etc)
  const parts = clean.split('.');
  if (parts.length > 2) {
    const last2 = parts.slice(-2).join('.');
    const common2PartTLDs = ['com.vn', 'net.vn', 'org.vn', 'co.uk', 'gov.vn'];
    if (common2PartTLDs.includes(last2)) {
      return parts.slice(-3).join('.');
    }
  }

  return parts.length > 1 ? parts.slice(-2).join('.') : parts[0];
};

const SessionsTab: FC<SessionsTabProps> = ({ email, accountId }) => {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(true);
  const [sessions, setSessions] = useState<RAW_SessionData[]>([]);
  const [search, setSearch] = useState('');
  const [expandedDomains, setExpandedDomains] = useState<Set<string>>(new Set());
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  const containerRef = useRef<HTMLDivElement>(null);
  const [menu, setMenu] = useState<{ x: number; y: number; item: any } | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const [isLaunchModalOpen, setIsLaunchModalOpen] = useState(false);
  const [pendingLaunch, setPendingLaunch] = useState<{
    accountId: string;
    email: string;
    provider?: string;
    url?: string;
  } | null>(null);

  const fetchSessions = async () => {
    setLoading(true);
    try {
      const browserPath = localStorage.getItem('zentri_browser_path') || undefined;
      // @ts-ignore
      const result = await window.electron.ipcRenderer.invoke('email:get-sessions', {
        email,
        browserPath,
      });
      if (result.success) {
        setSessions(result.sessions);
      }
    } catch (err) {
      console.error('Failed to load sessions');
    } finally {
      setLoading(false);
    }
  };

  const handleExecuteLaunch = async () => {
    if (!pendingLaunch) return;
    const { accountId, email, provider, url } = pendingLaunch;
    setIsLaunchModalOpen(false);

    try {
      const browserPath = localStorage.getItem('zentri_browser_path') || undefined;
      // @ts-ignore
      await window.electron.ipcRenderer.invoke('email:open-login', {
        accountId,
        email,
        provider: provider || 'custom',
        url,
        browserPath,
      });
    } catch (error) {
      console.error('Failed to launch browser:', error);
    }
    setPendingLaunch(null);
  };

  useEffect(() => {
    fetchSessions();

    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenu(null);
      }
    };
    window.addEventListener('click', handleClickOutside);
    return () => window.removeEventListener('click', handleClickOutside);
  }, [email]);

  const groupedSessions = useMemo(() => {
    const groups: Record<string, GroupedSession> = {};

    sessions.forEach((s) => {
      const baseDomain = getBaseDomain(s.domain);

      if (!groups[baseDomain]) {
        groups[baseDomain] = {
          baseDomain,
          totalCookies: 0,
          latestExpiry: s.expiryDate,
          subdomains: [],
        };
      }

      groups[baseDomain].totalCookies += s.count;
      if (new Date(s.expiryDate) > new Date(groups[baseDomain].latestExpiry)) {
        groups[baseDomain].latestExpiry = s.expiryDate;
      }
      groups[baseDomain].subdomains.push(s);
    });

    return Object.values(groups).sort((a, b) => b.totalCookies - a.totalCookies);
  }, [sessions]);

  const filteredGroups = groupedSessions.filter(
    (g) =>
      g.baseDomain.toLowerCase().includes(search.toLowerCase()) ||
      g.subdomains.some((s) => s.domain.toLowerCase().includes(search.toLowerCase())),
  );

  // Pagination
  const totalPages = Math.ceil(filteredGroups.length / pageSize);
  const paginatedGroups = filteredGroups.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize,
  );

  const toggleExpand = (domain: string, hasSub: boolean) => {
    if (!hasSub) return;
    const next = new Set(expandedDomains);
    if (next.has(domain)) next.delete(domain);
    else next.add(domain);
    setExpandedDomains(next);
  };

  const handleContextMenu = (e: React.MouseEvent, item: any) => {
    e.preventDefault();
    if (!containerRef.current) return;

    const containerRect = containerRef.current.getBoundingClientRect();

    // Position relative to container
    let x = e.clientX - containerRect.left;
    let y = e.clientY - containerRect.top;

    // Boundary check (keep menu from overflowing right/bottom)
    const menuWidth = 280;
    const menuHeight = 200;
    if (x + menuWidth > containerRect.width) x -= menuWidth;
    if (y + menuHeight > containerRect.height) y -= menuHeight;

    setMenu({ x, y, item });
  };

  const handleAction = async (action: string) => {
    if (!menu) return;
    const item = menu.item;
    const targetDomain = item.domain || item.baseDomain;

    setMenu(null);

    if (action === 'launch') {
      setPendingLaunch({
        accountId,
        email,
        provider: 'custom',
        url: `https://${targetDomain}`,
      });
      setIsLaunchModalOpen(true);
    } else if (action === 'refresh') {
      fetchSessions();
    } else if (action === 'delete') {
      // Placeholder for actual delete IPC
      alert(`Delete feature for ${targetDomain} coming soon.`);
    }
  };

  if (loading) {
    return (
      <div className="p-8 flex flex-col items-center justify-center h-full">
        <Database className="w-8 h-8 text-zinc-700 animate-pulse mb-4" />
        <p className="text-zinc-500 text-sm">{t('email.manager.tabs.sessions.loading')}</p>
      </div>
    );
  }

  return (
    <div ref={containerRef} className="flex flex-col h-full bg-zinc-950 relative overflow-hidden">
      {/* Search Header */}
      <div className="p-4 border-b border-zinc-900 bg-zinc-900/20 flex items-center">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-600" />
          <input
            type="text"
            placeholder={t('email.manager.tabs.sessions.searchPlaceholder')}
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full bg-zinc-900/50 border border-zinc-800 rounded-lg py-2.5 pl-10 pr-4 text-xs text-zinc-300 focus:outline-none focus:border-zinc-700 transition-colors"
          />
        </div>
      </div>

      {/* Table Content */}
      <div className="flex-1 overflow-auto custom-scrollbar">
        <table className="w-full border-collapse">
          <thead className="sticky top-0 z-10">
            <tr className="bg-zinc-900/80 backdrop-blur-md border-b border-zinc-800 shadow-sm">
              <th className="p-4 text-[10px] font-bold text-zinc-400 uppercase w-12 text-center">
                {t('email.manager.tabs.sessions.headers.stt')}
              </th>
              <th className="p-4 text-[10px] font-bold text-zinc-400 uppercase w-28 whitespace-nowrap text-center">
                {t('email.manager.tabs.sessions.headers.status')}
              </th>
              <th className="p-4 text-[10px] font-bold text-zinc-400 uppercase text-left">
                {t('email.manager.tabs.sessions.headers.website')}
              </th>
              <th className="p-4 text-[10px] font-bold text-zinc-400 uppercase text-center">
                {t('email.manager.tabs.sessions.headers.cookies')}
              </th>
              <th className="p-4 text-[10px] font-bold text-zinc-400 uppercase text-center">
                {t('email.manager.tabs.sessions.headers.expiry')}
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-900/50">
            {paginatedGroups.length === 0 ? (
              <tr>
                <td colSpan={5} className="p-12 text-center text-zinc-600 italic text-sm">
                  {t('email.manager.tabs.sessions.empty')}
                </td>
              </tr>
            ) : (
              paginatedGroups.map((group, idx) => (
                <React.Fragment key={group.baseDomain}>
                  <tr
                    className={`hover:bg-zinc-900/40 transition-colors group cursor-pointer ${expandedDomains.has(group.baseDomain) ? 'bg-zinc-900/10' : ''}`}
                    onClick={() => toggleExpand(group.baseDomain, group.subdomains.length > 1)}
                    onContextMenu={(e) => handleContextMenu(e, group)}
                  >
                    <td className="p-4 text-[10px] text-zinc-600 font-mono text-center">
                      {((currentPage - 1) * pageSize + idx + 1).toString().padStart(2, '0')}
                    </td>
                    <td className="p-4 text-center">
                      <HealthCircle subdomains={group.subdomains} />
                    </td>
                    <td className="p-4">
                      <div className="flex items-center space-x-3">
                        <div className="w-6 h-6 rounded bg-zinc-900 flex items-center justify-center overflow-hidden border border-zinc-800">
                          <GlobeIcon domain={group.baseDomain} />
                        </div>
                        <div className="flex flex-col">
                          <span className="text-sm font-medium text-zinc-200">
                            {group.baseDomain}
                          </span>
                          {group.subdomains.length > 1 && (
                            <span className="text-[10px] text-blue-400/80 font-bold">
                              {t('email.manager.tabs.sessions.subdomains', {
                                count: group.subdomains.length - 1,
                              })}
                            </span>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="p-4 text-center">
                      <span className="text-xs font-mono text-zinc-400">{group.totalCookies}</span>
                    </td>
                    <td className="p-4 text-xs text-zinc-500 text-center">
                      <div className="flex items-center justify-center space-x-2">
                        <Clock className="w-3 h-3" />
                        <span>{new Date(group.latestExpiry).toLocaleDateString()}</span>
                      </div>
                    </td>
                  </tr>

                  {expandedDomains.has(group.baseDomain) &&
                    group.subdomains.map((sub, sIdx) => (
                      <tr
                        key={`${group.baseDomain}-sub-${sIdx}`}
                        className="bg-zinc-900/10 border-l-2 border-blue-500/20 group/sub cursor-context-menu hover:bg-zinc-900/60 transition-colors"
                        onContextMenu={(e) => handleContextMenu(e, sub)}
                      >
                        <td className="p-2 text-right opacity-30 pr-4">
                          <span className="text-[10px] font-mono">L{sIdx + 1}</span>
                        </td>
                        <td className="p-2 text-center">
                          <StatusBadge expiry={sub.expiryDate} />
                        </td>
                        <td className="p-2 pl-4">
                          <div className="flex items-center space-x-2">
                            <GlobeIcon domain={sub.domain} size={14} />
                            <span className="text-[11px] text-zinc-500 font-mono truncate">
                              {sub.domain}
                            </span>
                          </div>
                        </td>
                        <td className="p-2 text-center text-[10px] text-zinc-600">{sub.count}</td>
                        <td className="p-2 text-[10px] text-zinc-600 text-center">
                          {new Date(sub.expiryDate).toLocaleDateString()}
                        </td>
                      </tr>
                    ))}
                </React.Fragment>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      <div className="p-3 bg-zinc-900/40 border-t border-zinc-900 flex items-center justify-end">
        <div className="flex items-center space-x-2 mr-4">
          <button
            disabled={currentPage === 1}
            onClick={() => setCurrentPage((prev) => prev - 1)}
            className="p-1 hover:bg-zinc-800 disabled:opacity-30 rounded transition-colors"
          >
            <ChevronLeft className="w-4 h-4 text-zinc-400" />
          </button>
          <span className="text-[11px] font-bold text-zinc-300 w-8 text-center">{currentPage}</span>
          <button
            disabled={currentPage === totalPages || totalPages === 0}
            onClick={() => setCurrentPage((prev) => prev + 1)}
            className="p-1 hover:bg-zinc-800 disabled:opacity-30 rounded transition-colors"
          >
            <ChevronRight className="w-4 h-4 text-zinc-400" />
          </button>
        </div>
      </div>

      {/* Context Menu Dropdown */}
      {menu && (
        <div
          ref={menuRef}
          className="absolute z-[100] w-72 bg-zinc-900 border border-zinc-700 rounded-lg shadow-2xl overflow-hidden py-1.5 ring-1 ring-white/5"
          style={{ top: menu?.y, left: menu?.x }}
        >
          <div className="px-4 py-2 bg-zinc-800/30 border-b border-zinc-800/50 mb-1">
            <p className="text-[10px] font-bold text-zinc-500 uppercase truncate">
              {menu?.item.domain || menu?.item.baseDomain}
            </p>
          </div>
          <MenuAction
            icon={<RefreshCw className="w-3.5 h-3.5" />}
            label={t('email.manager.tabs.sessions.context.refresh')}
            onClick={() => handleAction('refresh')}
          />
          <MenuAction
            icon={<Trash2 className="w-3.5 h-3.5" />}
            label={t('email.manager.tabs.sessions.context.delete')}
            onClick={() => handleAction('delete')}
            danger
          />
          <div className="h-px bg-zinc-800/50 my-1.5" />
          <MenuAction
            icon={<ExternalLink className="w-3.5 h-3.5" />}
            label={t('email.manager.tabs.sessions.context.launch')}
            onClick={() => handleAction('launch')}
          />
        </div>
      )}
      <ProfileLaunchModal
        isOpen={isLaunchModalOpen}
        onClose={() => setIsLaunchModalOpen(false)}
        email={email}
        onLaunch={handleExecuteLaunch} accountId={''}      />
    </div>
  );
};

const MenuAction = ({
  icon,
  label,
  onClick,
  danger,
}: {
  icon: any;
  label: string;
  onClick: () => void;
  danger?: boolean;
}) => (
  <button
    onClick={(e) => {
      e.stopPropagation();
      onClick();
    }}
    className={`w-full text-left px-4 py-2.5 flex items-center space-x-3 hover:bg-zinc-800 transition-colors ${
      danger ? 'text-red-400' : 'text-zinc-300'
    }`}
  >
    {icon}
    <span className="text-xs font-semibold">{label}</span>
  </button>
);

const StatusBadge = ({ expiry }: { expiry: string }) => {
  const { t } = useTranslation();
  const isExpired = new Date(expiry).getTime() < new Date().getTime();
  return (
    <span
      className={`px-2.5 py-0.5 rounded-[4px] text-[10px] font-bold border tracking-tight ${
        isExpired
          ? 'bg-red-500/10 text-red-500 border-red-500/20'
          : 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'
      }`}
    >
      {isExpired
        ? t('email.manager.tabs.sessions.status.expired')
        : t('email.manager.tabs.sessions.status.active')}
    </span>
  );
};

const HealthCircle = ({ subdomains }: { subdomains: RAW_SessionData[] }) => {
  const size = 32;
  const strokeWidth = 5;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;

  const total = subdomains.length;
  // If no items, show empty circle (shouldn't happen here)
  if (total === 0) return null;

  // INCREASED GAP for clear definition and using butt caps
  const gapSize = total > 1 ? 10 : 0; // degrees
  const gapInPixels = (gapSize / 360) * circumference;
  const segmentLength = (circumference - total * gapInPixels) / total;

  return (
    <div className="flex items-center justify-center">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90">
        {subdomains.map((sub, i) => {
          const isExpired = new Date(sub.expiryDate).getTime() < new Date().getTime();
          const offset = i * (segmentLength + gapInPixels);

          return (
            <circle
              key={i}
              cx={size / 2}
              cy={size / 2}
              r={radius}
              fill="transparent"
              stroke={isExpired ? '#ef4444' : '#10b981'}
              strokeWidth={strokeWidth}
              strokeDasharray={`${segmentLength} ${circumference - segmentLength}`}
              strokeDashoffset={-offset}
              strokeLinecap="butt"
              className="transition-all duration-300 hover:stroke-[7px] cursor-help"
            >
              <title>{sub.domain}</title>
            </circle>
          );
        })}
      </svg>
    </div>
  );
};

const GlobeIcon = ({ domain, size = 16 }: { domain: string; size?: number }) => {
  const cleanDomain = domain.replace(/^\./, '');
  const iconUrl = `https://www.google.com/s2/favicons?domain=${cleanDomain}&sz=32`;
  return (
    <img
      src={iconUrl}
      alt=""
      className="rounded-sm opacity-80"
      style={{ width: size, height: size }}
      onError={(e) => (e.currentTarget.style.display = 'none')}
    />
  );
};

export default SessionsTab;
