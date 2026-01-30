import { Search } from 'lucide-react';
import { cn } from '../../../../../../shared/lib/utils';
import { Mail } from '../../../mock/mails';

interface MailSidebarProps {
  mails: Mail[];
  selectedMail: Mail | null;
  onSelectMail: (mail: Mail) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
}

export const MailSidebar = ({
  mails,
  selectedMail,
  onSelectMail,
  searchQuery,
  onSearchChange,
}: MailSidebarProps) => {
  return (
    <div className="w-[300px] border-r border-border flex flex-col bg-muted/5">
      <div className="p-3 border-b border-border">
        <div className="relative group">
          <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground group-focus-within:text-primary transition-colors" />
          <input
            type="text"
            placeholder="Search mail..."
            className="w-full h-9 pl-9 pr-4 rounded-lg bg-background border border-input hover:border-accent-foreground/20 focus:border-primary/20 text-sm shadow-sm transition-all placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-0"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
          />
        </div>
      </div>
      <div className="flex-1 overflow-y-auto px-2 py-2 space-y-1 custom-scrollbar">
        {mails.map((mail) => {
          const isSelected = selectedMail?.id === mail.id;
          return (
            <div
              key={mail.id}
              onClick={() => onSelectMail(mail)}
              className={cn(
                'group relative p-3 rounded-lg cursor-pointer transition-all border border-transparent',
                isSelected ? 'bg-background shadow-sm border-border' : 'hover:bg-muted/50',
              )}
            >
              {isSelected && (
                <div className="absolute left-0 top-3 bottom-3 w-1 bg-primary rounded-r-full" />
              )}

              <div className="flex justify-between items-start mb-1 gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  {!mail.read && <div className="w-1.5 h-1.5 rounded-full bg-blue-500 shrink-0" />}
                  <span
                    className={cn(
                      'text-sm truncate',
                      !mail.read ? 'font-bold text-foreground' : 'font-semibold text-foreground/80',
                    )}
                  >
                    {mail.from}
                  </span>
                </div>
                <span className="text-[10px] text-muted-foreground whitespace-nowrap">
                  {mail.date}
                </span>
              </div>

              <div
                className={cn(
                  'text-xs mb-1 truncate',
                  !mail.read ? 'font-semibold text-foreground' : 'text-foreground/70',
                )}
              >
                {mail.subject}
              </div>
              <p className="text-[11px] text-muted-foreground line-clamp-2 leading-relaxed opacity-90">
                {mail.snippet}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
};
