import { FC, ReactNode } from 'react';
import { ChevronRight, Bell } from 'lucide-react';

interface HeaderBarProps {
  title?: string;
  subtitle?: string;
  onReset?: () => void;
  children?: ReactNode;
}

/**
 * Header bar dùng chung cho các feature. Style đồng bộ với email/HeaderBar:
 * padding dọc nhỏ (py-1.5), chỉ có border-b, hiển thị tên feature dạng label
 * ở đầu trái, phân cách bằng divider dọc.
 */
const HeaderBar: FC<HeaderBarProps> = ({ title, subtitle, children }) => {
  return (
    <header className="h-12 shrink-0 border-b border-border flex items-center justify-between px-2 py-1.5 bg-background/80 backdrop-blur-xl sticky top-0 z-30 transition-all duration-500">
      <div className="flex items-center gap-3">
        <span className="text-text-primary text-sm font-semibold">{title}</span>
        <div className="w-px h-5 bg-border" />
        {subtitle && (
          <div className="flex items-center gap-1.5">
            <ChevronRight className="w-3.5 h-3.5 text-text-secondary" />
            <span className="text-text-primary text-sm font-semibold">{subtitle}</span>
          </div>
        )}
      </div>

      <div className="flex items-center gap-2">
        {children}
        <button
          type="button"
          className="size-8 rounded-md border border-border bg-card-background text-text-secondary hover:text-text-primary flex items-center justify-center transition-colors"
        >
          <Bell className="w-4 h-4" />
        </button>
        <div className="w-8 h-8 rounded-md bg-primary/10 text-primary flex items-center justify-center text-xs font-semibold">
          TB
        </div>
      </div>
    </header>
  );
};

export default HeaderBar;