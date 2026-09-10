import { FC, ReactNode } from 'react';
import {
  ShieldCheck,
  KeyRound,
  Link2,
  Users,
  AlertTriangle,
  Server,
  Globe,
  SlidersHorizontal,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  Loader2,
} from 'lucide-react';

interface FooterBarProps {
  children?: ReactNode;
  total?: number;
  filtered?: number;
  visible?: number;
  currentPage?: number;
  totalPages?: number;
  runningBrowsers?: number;
  twoFaCount?: number;
  noTwoFaCount?: number;
  recoveryCount?: number;
  serviceCount?: number;
  proxyCount?: number;
  activeFilterCount?: number;
  loading?: boolean;
  onRefresh?: () => void;
}

const FooterBar: FC<FooterBarProps> = ({
  total = 0,
  twoFaCount = 0,
  noTwoFaCount = 0,
  recoveryCount = 0,
  serviceCount = 0,
  proxyCount = 0,
  runningBrowsers = 0,
  activeFilterCount = 0,
  currentPage = 1,
  totalPages = 1,
  loading = false,
  onRefresh,
}) => {
  return (
    <footer className="shrink-0 border-t border-border flex items-center justify-between px-4 py-1 bg-background/80 backdrop-blur-xl sticky bottom-0 z-30 transition-all duration-500 overflow-x-auto">
      {/* Left: statistics */}
      <div className="flex items-center gap-3 min-w-0">
        <span className="flex items-center gap-1.5 text-xs text-text-tertiary shrink-0">
          <Users className="w-3.5 h-3.5 text-text-tertiary" />
          <span className="text-text-secondary font-medium">{total}</span> total
        </span>

        <span className="flex items-center gap-1.5 text-xs text-text-tertiary shrink-0">
          <ShieldCheck className="w-3.5 h-3.5 text-primary" />
          <span className="text-text-secondary font-medium">{twoFaCount}</span> 2FA
        </span>

        {noTwoFaCount > 0 && (
          <span className="flex items-center gap-1.5 text-xs text-text-tertiary shrink-0">
            <AlertTriangle className="w-3.5 h-3.5 text-warn" />
            <span className="text-text-secondary font-medium">{noTwoFaCount}</span> no 2FA
          </span>
        )}

        <span className="flex items-center gap-1.5 text-xs text-text-tertiary shrink-0">
          <KeyRound className="w-3.5 h-3.5 text-warn" />
          <span className="text-text-secondary font-medium">{recoveryCount}</span> recovery
        </span>

        <span className="flex items-center gap-1.5 text-xs text-text-tertiary shrink-0">
          <Link2 className="w-3.5 h-3.5 text-info" />
          <span className="text-text-secondary font-medium">{serviceCount}</span> services
        </span>

        <span className="flex items-center gap-1.5 text-xs text-text-tertiary shrink-0">
          <Server className="w-3.5 h-3.5 text-text-tertiary" />
          <span className="text-text-secondary font-medium">{proxyCount}</span> proxies
        </span>

        {runningBrowsers > 0 && (
          <span className="flex items-center gap-1.5 text-xs text-text-tertiary shrink-0">
            <Globe className="w-3.5 h-3.5 text-success" />
            <span className="text-text-secondary font-medium">{runningBrowsers}</span> running
          </span>
        )}
      </div>

      {/* Right: filters, pagination, refresh */}
      <div className="flex items-center gap-3 shrink-0">
        {activeFilterCount > 0 && (
          <span className="flex items-center gap-1.5 text-xs text-text-tertiary shrink-0">
            <SlidersHorizontal className="w-3.5 h-3.5 text-primary" />
            <span className="text-text-secondary font-medium">{activeFilterCount}</span> filters
          </span>
        )}

        <span className="flex items-center gap-1 text-xs text-text-tertiary shrink-0">
          <ChevronLeft className="w-3.5 h-3.5" />
          <span className="text-text-secondary font-medium">
            {currentPage}/{totalPages}
          </span>
          <ChevronRight className="w-3.5 h-3.5" />
        </span>

        {onRefresh && (
          <button
            type="button"
            onClick={onRefresh}
            disabled={loading}
            className="size-7 rounded-md border border-border bg-card-background text-text-secondary hover:text-text-primary flex items-center justify-center transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            aria-label="Refresh data"
          >
            {loading ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <RefreshCw className="w-3.5 h-3.5" />
            )}
          </button>
        )}
      </div>
    </footer>
  );
};

export default FooterBar;