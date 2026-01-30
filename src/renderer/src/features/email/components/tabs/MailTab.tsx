import { useState } from 'react';
import { Search, Archive, Trash2, Reply, MoreVertical, Star, Mail as MailIcon } from 'lucide-react';
import { cn } from '../../../../shared/lib/utils';
import { mockMails, Mail } from '../../mock/mails';

const MailTab = () => {
  const [selectedMail, setSelectedMail] = useState<Mail | null>(mockMails[0]);
  const [searchQuery, setSearchQuery] = useState('');

  const filteredMails = mockMails.filter(
    (mail) =>
      mail.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
      mail.from.toLowerCase().includes(searchQuery.toLowerCase()) ||
      mail.snippet.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  return (
    <div className="flex h-full w-full">
      {/* Mail Sidebar */}
      <div className="w-[300px] border-r border-border flex flex-col bg-muted/5">
        <div className="p-3 border-b border-border">
          <div className="relative group">
            <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground group-focus-within:text-primary transition-colors" />
            <input
              type="text"
              placeholder="Search mail..."
              className="w-full h-9 pl-9 pr-4 rounded-lg bg-background border border-input hover:border-accent-foreground/20 focus:border-primary/20 text-sm shadow-sm transition-all placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-0"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
        <div className="flex-1 overflow-y-auto px-2 py-2 space-y-1 custom-scrollbar">
          {filteredMails.map((mail) => {
            const isSelected = selectedMail?.id === mail.id;
            return (
              <div
                key={mail.id}
                onClick={() => setSelectedMail(mail)}
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
                    {!mail.read && (
                      <div className="w-1.5 h-1.5 rounded-full bg-blue-500 shrink-0" />
                    )}
                    <span
                      className={cn(
                        'text-sm truncate',
                        !mail.read
                          ? 'font-bold text-foreground'
                          : 'font-semibold text-foreground/80',
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

      {/* Mail Content */}
      <div className="flex-1 flex flex-col h-full bg-background/50 backdrop-blur-3xl">
        {selectedMail ? (
          <div className="flex flex-col h-full animate-in fade-in duration-300">
            {/* Toolbar */}
            <div className="h-12 border-b border-border flex items-center justify-between px-6 shrink-0 bg-background/30">
              <div className="flex items-center gap-1">
                <button
                  className="p-2 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                  title="Archive"
                >
                  <Archive className="w-4 h-4" />
                </button>
                <button
                  className="p-2 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                  title="Delete"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
                <div className="h-4 w-[1px] bg-border mx-1" />
                <button
                  className="p-2 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                  title="Mark as Unread"
                >
                  <MailIcon className="w-4 h-4" />
                </button>
              </div>
              <div className="flex items-center gap-1">
                <button className="p-2 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition-colors">
                  <MoreVertical className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="p-8 border-b border-border/40">
              <div className="flex items-start justify-between mb-6">
                <h2 className="text-2xl font-bold tracking-tight leading-tight max-w-3xl">
                  {selectedMail.subject}
                </h2>
                <div className="flex items-center gap-2">
                  <span className="text-xs bg-muted px-2 py-1 rounded text-muted-foreground">
                    Inbox
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold shadow-sm">
                    {selectedMail.from.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex flex-col">
                    <span className="font-semibold text-sm text-foreground">
                      {selectedMail.from}
                    </span>
                    <span className="text-xs text-muted-foreground">to me</span>
                  </div>
                </div>
                <div className="flex items-center gap-3 text-muted-foreground">
                  <span className="text-xs">{selectedMail.date}</span>
                  <button className="p-1 hover:text-foreground transition-colors">
                    <Star className="w-4 h-4" />
                  </button>
                  <button className="p-1 hover:text-foreground transition-colors">
                    <Reply className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>

            <div className="p-8 flex-1 overflow-y-auto prose prose-sm dark:prose-invert max-w-none">
              <p className="leading-7 font-light text-base">{selectedMail.body}</p>

              <div className="mt-8 pt-8 border-t border-border/50">
                <button className="px-5 py-2.5 rounded-lg border border-border bg-card/50 hover:bg-card hover:border-primary/50 text-sm font-medium transition-all flex items-center gap-2">
                  <Reply className="w-4 h-4" />
                  Reply
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground gap-4">
            <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center">
              <MailIcon className="w-8 h-8 opacity-20" />
            </div>
            <p>Select an email to read</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default MailTab;
