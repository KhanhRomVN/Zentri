import { Globe, LayoutGrid, CheckCircle2 } from 'lucide-react';
import { Website } from '../types';
import { cn } from '../../../shared/lib/utils';

interface RegSidebarProps {
  websites: Website[];
  selectedWebsiteId: string | null;
  onSelectWebsite: (id: string) => void;
}

const RegSidebar = ({ websites, selectedWebsiteId, onSelectWebsite }: RegSidebarProps) => {
  const filteredWebsites = websites;

  return (
    <div className="w-[300px] flex flex-col border-r border-border h-full bg-muted/5 backdrop-blur-xl shrink-0">
      {/* Header */}
      <div className="h-16 shrink-0 flex items-center px-4 border-b border-border bg-card/20">
        <h2 className="text-xl font-bold tracking-tight text-foreground">Reg</h2>
      </div>

      {/* Website List */}
      <div className="flex-1 overflow-y-auto py-2 space-y-0.5 custom-scrollbar">
        {filteredWebsites.map((website) => {
          const isSelected = selectedWebsiteId === website.id;
          const domain = new URL(website.url).hostname;
          const faviconUrl = `https://www.google.com/s2/favicons?domain=https://${domain}&sz=64`;

          return (
            <div
              key={website.id}
              onClick={() => onSelectWebsite(website.id)}
              className={cn(
                'group relative flex flex-col gap-2 py-3 px-4 cursor-pointer transition-all duration-300 rounded-none',
                isSelected ? 'text-foreground' : 'text-muted-foreground hover:text-foreground',
              )}
              style={{
                background: isSelected
                  ? `linear-gradient(to right, ${website.color}15, transparent)`
                  : undefined,
              }}
            >
              {/* Active Border Indicator (matching main Sidebar) */}
              {isSelected && (
                <div
                  className="absolute right-0 top-1/2 -translate-y-1/2 w-1 h-6 rounded-l-lg"
                  style={{ backgroundColor: website.color }}
                />
              )}

              <div className="flex items-center gap-3 relative z-10">
                <div
                  className={cn(
                    'h-10 w-10 rounded-lg flex items-center justify-center overflow-hidden shrink-0 border border-border bg-background transition-transform group-hover:scale-105',
                    isSelected && 'border-primary/30 shadow-sm',
                  )}
                >
                  <img
                    src={faviconUrl}
                    alt={website.name}
                    className="w-6 h-6 object-contain"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = '';
                      (e.target as HTMLImageElement).className = 'hidden';
                    }}
                  />
                  <Globe className="w-5 h-5 text-muted-foreground hidden peer-invalid:block" />
                </div>
                <div className="flex-1 min-w-0">
                  <h4
                    className={cn(
                      'text-sm font-bold truncate transition-colors',
                      isSelected
                        ? 'text-foreground'
                        : 'text-muted-foreground group-hover:text-foreground',
                    )}
                    style={{ color: isSelected ? website.color : undefined }}
                  >
                    {website.name}
                  </h4>
                  <div className="flex items-center gap-2 mt-1">
                    <div className="flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-muted/50 border border-border text-[9px] font-bold text-muted-foreground uppercase">
                      <LayoutGrid className="w-2.5 h-2.5" />
                      {website.totalSessions} Sessions
                    </div>
                    <div className="flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-emerald-500/10 border border-emerald-500/20 text-[9px] font-bold text-emerald-500 uppercase">
                      <CheckCircle2 className="w-2.5 h-2.5" />
                      {website.successRate}%
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default RegSidebar;
