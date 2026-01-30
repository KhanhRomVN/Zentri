import { Email } from '../mock/emails';
import { cn } from '../../../shared/lib/utils';
import { Star, Tag } from 'lucide-react';

interface EmailCardProps {
  email: Email;
  selected: boolean;
  onClick: () => void;
}

const EmailCard = ({ email, selected, onClick }: EmailCardProps) => {
  const getProviderBadge = (provider: Email['provider']) => {
    switch (provider) {
      case 'gmail':
        return 'bg-red-500/10 text-red-600 border-red-200 dark:text-red-400 dark:border-red-900/50';
      case 'hotmail':
        return 'bg-blue-500/10 text-blue-600 border-blue-200 dark:text-blue-400 dark:border-blue-900/50';
      case 'protonmail':
        return 'bg-purple-500/10 text-purple-600 border-purple-200 dark:text-purple-400 dark:border-purple-900/50';
      default:
        return 'bg-gray-500/10 text-gray-500 border-gray-200';
    }
  };

  return (
    <div
      onClick={onClick}
      className={cn(
        'flex flex-col gap-3 p-4 rounded-md cursor-pointer transition-all border group relative',
        selected
          ? 'bg-primary/5 border-primary shadow-sm'
          : 'bg-card border-border hover:border-primary/50 hover:shadow-md',
        !email.read && 'bg-accent/30',
      )}
    >
      {/* Header Row: Provider Badge + Date */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div
            className={cn(
              'px-2 py-0.5 text-[10px] uppercase font-bold rounded-full border tracking-wider',
              getProviderBadge(email.provider),
            )}
          >
            {email.provider}
          </div>
          {!email.read && <div className="h-2 w-2 rounded-full bg-primary animate-pulse" />}
          {email.important && <Star className="w-3 h-3 text-yellow-500 fill-yellow-500" />}
        </div>
        <span
          className={cn(
            'text-xs font-medium',
            !email.read ? 'text-primary' : 'text-muted-foreground',
          )}
        >
          {email.date}
        </span>
      </div>

      {/* Sender Info */}
      <div className="flex items-center gap-3">
        <div
          className={cn(
            'h-9 w-9 rounded-full flex items-center justify-center text-sm font-bold shadow-sm ring-2 ring-background',
            'bg-gradient-to-br from-primary/80 to-primary/40 text-primary-foreground',
          )}
        >
          {email.sender.substring(0, 2).toUpperCase()}
        </div>
        <div className="flex-1 overflow-hidden">
          <h4
            className={cn(
              'text-sm truncate leading-none mb-1',
              !email.read ? 'font-bold text-foreground' : 'font-medium text-foreground/80',
            )}
          >
            {email.sender}
          </h4>
          <p className="text-xs text-muted-foreground truncate font-mono opacity-80">
            {email.email}
          </p>
        </div>
      </div>

      {/* Subject & Preview */}
      <div className="space-y-1">
        <h5
          className={cn(
            'text-sm truncate',
            !email.read ? 'font-semibold text-foreground' : 'font-medium text-muted-foreground',
          )}
        >
          {email.subject}
        </h5>
        <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
          {email.preview}
        </p>
      </div>

      {/* Tags Footer */}
      {email.tags && email.tags.length > 0 && (
        <div className="flex flex-wrap gap-1.5 pt-1">
          {email.tags.map((tag) => (
            <span
              key={tag}
              className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-secondary text-secondary-foreground"
            >
              <Tag className="w-2.5 h-2.5 mr-1 opacity-50" />
              {tag}
            </span>
          ))}
        </div>
      )}
    </div>
  );
};

export default EmailCard;
