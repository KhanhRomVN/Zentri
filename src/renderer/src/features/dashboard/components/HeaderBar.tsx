import { FC, ReactNode } from 'react';
import { LayoutDashboard, ChevronRight, Bell } from 'lucide-react';

interface HeaderBarProps {
  title?: string;
  subtitle?: string;
  onReset?: () => void;
  children?: ReactNode;
}

const HeaderBar: FC<HeaderBarProps> = ({ title, subtitle, onReset, children }) => {
  return (
    <header className="h-[40px] shrink-0 border-b border-t border-r border-border flex items-center justify-between px-4 bg-background/80 backdrop-blur-xl sticky top-0 z-30 transition-all duration-500">
      <div className="flex items-center gap-2">
        <button
          onClick={onReset}
          className="text-text-primary hover:text-foreground transition-colors"
        >
          <LayoutDashboard className="w-5 h-5" />
        </button>
        <ChevronRight className="w-4 h-4 text-text-primary" />
        <span className="text-text-primary text-sm font-semibold">{title}</span>
        {subtitle && (
          <>
            <ChevronRight className="w-4 h-4 text-text-secondary" />
            <span className="text-text-primary text-sm font-semibold">{subtitle}</span>
          </>
        )}
      </div>

      <div className="flex items-center gap-2">
        {children}
        <button
          type="button"
          className="w-7 h-7 rounded-md flex items-center justify-center text-text-secondary hover:text-text-primary transition-colors"
        >
          <Bell className="w-4 h-4" />
        </button>
        <div className="w-6 h-6 rounded-md bg-primary/30 flex items-center justify-center text-white text-xs font-semibold">
          TB
        </div>
      </div>
    </header>
  );
};

export default HeaderBar;