import { FC, ReactNode } from 'react';
import { Home, BarChart3, Shield, Palette, Bell } from 'lucide-react';
import { cn } from '../../../shared/lib/utils';
import {
  Dropdown,
  DropdownTrigger,
  DropdownContent,
  DropdownItem,
} from '../../../components/ui/Dropdown';
import { useTheme } from '../../../theme/ThemeProvider';
import { PRESET_THEMES } from '../../../theme/theme-loader';

export type EmailView = 'home' | 'analytic' | 'security';

interface HeaderBarProps {
  activeView?: EmailView;
  onViewChange?: (view: EmailView) => void;
  children?: ReactNode;
}

const TABS: { id: EmailView; label: string; icon: typeof Home }[] = [
  { id: 'home', label: 'Home', icon: Home },
  { id: 'analytic', label: 'Analytic', icon: BarChart3 },
  { id: 'security', label: 'Security', icon: Shield },
];

const HeaderBar: FC<HeaderBarProps> = ({ activeView = 'home', onViewChange, children }) => {
  const { applyPresetTheme, currentPreset } = useTheme();

  return (
    <header className="shrink-0 border-b border-border flex items-center justify-between px-2 py-1.5 bg-background/80 backdrop-blur-xl sticky top-0 z-30 transition-all duration-500">
      <div className="flex items-center gap-3">
        <span className="text-text-primary text-sm font-semibold">Email</span>
        <div className="w-px h-5 bg-border" />
        {/* Tabbar */}
        <div className="flex items-center gap-1 bg-card-background border border-border rounded-lg px-1 py-1">
          {TABS.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeView === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => onViewChange?.(tab.id)}
                className={cn(
                  'flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium transition-colors',
                  isActive
                    ? 'bg-primary/10 text-primary'
                    : 'text-text-secondary hover:text-text-primary',
                )}
              >
                <Icon className={cn('w-3.5 h-3.5', isActive && 'text-primary')} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="flex items-center gap-2">
        {children}
        {/* Theme Dropdown */}
        <Dropdown searchable align="end" sideOffset={6} closeOnSelect={false}>
          <DropdownTrigger asChild>
            <button
              type="button"
              className="size-8 rounded-md border border-border bg-card-background text-text-secondary hover:text-text-primary flex items-center justify-center transition-colors"
            >
              <Palette className="w-4 h-4" />
            </button>
          </DropdownTrigger>
          <DropdownContent className="min-w-[240px]">
            {PRESET_THEMES.map((theme) => {
              const rgb = theme.tailwind.primary.match(/\d+/g)?.slice(0, 3).join(',') || '0,0,0';
              const isActive = currentPreset?.id === theme.id || currentPreset?.name === theme.name;
              return (
                <DropdownItem
                  key={theme.id || theme.name}
                  onClick={() => applyPresetTheme(theme)}
                  noPadding
                  className="px-2 py-1.5"
                >
                  <div
                    className={cn(
                      'w-full flex items-center gap-2.5 rounded-md px-2 py-1.5',
                      isActive && 'bg-primary/10',
                    )}
                  >
                    <span
                      className="w-6 h-6 rounded shrink-0"
                      style={{ background: `rgb(${rgb})` }}
                    />
                    <span className="flex-1 min-w-0">
                      <span className="block text-xs text-text-primary truncate">{theme.name}</span>
                      <span className="block text-[10px] text-text-secondary truncate">
                        {theme.id || theme.name.toLowerCase().replace(/\s/g, '_')}
                      </span>
                    </span>
                    {isActive && <span className="text-primary text-xs">✓</span>}
                  </div>
                </DropdownItem>
              );
            })}
          </DropdownContent>
        </Dropdown>

        {/* Notifications Dropdown */}
        <Dropdown align="end" sideOffset={6}>
          <DropdownTrigger asChild>
            <button
              type="button"
              className="size-8 rounded-md border border-border bg-card-background text-text-secondary hover:text-text-primary flex items-center justify-center transition-colors"
            >
              <Bell className="w-4 h-4" />
            </button>
          </DropdownTrigger>
          <DropdownContent className="min-w-[280px]">
            <DropdownItem noPadding className="px-2 py-1.5">
              <div className="flex items-start gap-2.5 px-2 py-1.5">
                <span className="w-6 h-6 rounded bg-error/10 text-error flex items-center justify-center shrink-0">
                  <Shield className="w-3.5 h-3.5" />
                </span>
                <span className="flex-1 min-w-0">
                  <span className="block text-xs text-text-primary font-medium">
                    Email xuất hiện trong rò rỉ dữ liệu
                  </span>
                  <span className="block text-[11px] text-text-secondary mt-0.5">
                    Nguồn: Collection #1. Nên đổi mật khẩu ngay.
                  </span>
                  <span className="block text-[10px] text-text-tertiary mt-0.5 font-mono">
                    5 phút trước
                  </span>
                </span>
              </div>
            </DropdownItem>
            <DropdownItem noPadding className="px-2 py-1.5">
              <div className="flex items-start gap-2.5 px-2 py-1.5">
                <span className="w-6 h-6 rounded bg-warn/10 text-warn flex items-center justify-center shrink-0">
                  <Shield className="w-3.5 h-3.5" />
                </span>
                <span className="flex-1 min-w-0">
                  <span className="block text-xs text-text-primary font-medium">
                    Chưa bật TOTP 2FA
                  </span>
                  <span className="block text-[11px] text-text-secondary mt-0.5">
                    Rủi ro cao khi bị tấn công credential-stuffing.
                  </span>
                  <span className="block text-[10px] text-text-tertiary mt-0.5 font-mono">
                    1 giờ trước
                  </span>
                </span>
              </div>
            </DropdownItem>
          </DropdownContent>
        </Dropdown>

        {/* Avatar soft-style */}
        <div className="w-8 h-8 rounded-md bg-primary/10 text-primary flex items-center justify-center text-xs font-semibold">
          TB
        </div>
      </div>
    </header>
  );
};

export default HeaderBar;
